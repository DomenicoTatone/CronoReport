// savedTimersData.js

// Funzione per caricare i timer salvati in base ai filtri
function loadSavedTimers(filters = {}) {
    const savedTimersList = document.getElementById('savedTimersAccordion');
    savedTimersList.innerHTML = ''; // Svuota la lista

    // Definizione della query per ottenere i timer dal database
    let query = db.collection('timeLogs')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', false);

    // Applica i filtri se presenti
    if (filters.startDate) {
        query = query.where('startTime', '>=', firebase.firestore.Timestamp.fromDate(new Date(filters.startDate)));
    }
    if (filters.endDate) {
        const endDateObj = new Date(filters.endDate);
        endDateObj.setHours(23, 59, 59, 999); // Include tutta la giornata
        query = query.where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endDateObj));
    }
    if (filters.clientId) {
        query = query.where('clientId', '==', filters.clientId);
    }

    query.orderBy('startTime', 'desc').get()
        .then(snapshot => {
            displayedTimers = []; // Reset della lista dei timer visualizzati

            if (snapshot.empty) {
                const noTimersMessage = document.createElement('p');
                noTimersMessage.textContent = 'Non ci sono timer salvati.';
                savedTimersList.appendChild(noTimersMessage);
                return;
            }

            // Organizzazione dei timer per cliente, anno, mese e giorno
            const timersByClient = {};

            snapshot.forEach(doc => {
                const logData = doc.data();
                const clientName = logData.clientName || 'Cliente Sconosciuto';

                // Ottieni la data di inizio del timer
                const startTime = logData.startTime.toDate();

                // Ottieni l'anno, il mese e il giorno
                const year = startTime.getFullYear();
                const month = String(startTime.getMonth() + 1).padStart(2, '0'); // Mese con zero iniziale
                const day = String(startTime.getDate()).padStart(2, '0');

                if (!timersByClient[clientName]) {
                    timersByClient[clientName] = {};
                }

                if (!timersByClient[clientName][year]) {
                    timersByClient[clientName][year] = {};
                }

                if (!timersByClient[clientName][year][month]) {
                    timersByClient[clientName][year][month] = {};
                }

                if (!timersByClient[clientName][year][month][day]) {
                    timersByClient[clientName][year][month][day] = [];
                }

                timersByClient[clientName][year][month][day].push({
                    id: doc.id,
                    data: logData
                });

                // Aggiungi il timer all'array dei timer visualizzati
                displayedTimers.push({
                    id: doc.id,
                    data: logData
                });
            });

            // Generazione dell'HTML per visualizzare i timer raggruppati
            displayTimers(displayedTimers, timersByClient);
        })
        .catch(error => {
            console.error('Errore nel caricamento dei timer salvati:', error);
        });
}

// Funzione per visualizzare i timer
function displayTimers(timers, timersByClient) {
    const savedTimersList = document.getElementById('savedTimersAccordion');
    savedTimersList.innerHTML = ''; // Svuota la lista

    if (timers.length === 0) {
        const noTimersMessage = document.createElement('p');
        noTimersMessage.textContent = 'Non ci sono timer salvati.';
        savedTimersList.appendChild(noTimersMessage);
        return;
    }

    // Generazione dell'HTML per visualizzare i timer raggruppati
    let clientIndex = 0;
    for (const clientName in timersByClient) {
        clientIndex++;
        const clientId = `client-${clientIndex}`;
        const clientSection = document.createElement('div');
        clientSection.classList.add('card');

        // Card Header per il Cliente
        const clientHeader = document.createElement('div');
        clientHeader.classList.add('card-header');
        clientHeader.id = `heading-${clientId}`;

        // Pulsante per espandere/comprimere il Cliente
        const clientButton = document.createElement('button');
        clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
        clientButton.setAttribute('data-toggle', 'collapse');
        clientButton.setAttribute('data-target', `#collapse-${clientId}`);
        clientButton.setAttribute('aria-expanded', 'false');
        clientButton.setAttribute('aria-controls', `collapse-${clientId}`);
        clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;

        // Contenitore per il pulsante del cliente
        const clientHeaderContainer = document.createElement('div');
        clientHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        clientHeaderContainer.appendChild(clientButton);

        clientHeader.appendChild(clientHeaderContainer);

        // Div per il collapse del Cliente
        const clientCollapse = document.createElement('div');
        clientCollapse.id = `collapse-${clientId}`;
        clientCollapse.classList.add('collapse');
        clientCollapse.setAttribute('aria-labelledby', `heading-${clientId}`);

        const clientBody = document.createElement('div');
        clientBody.classList.add('card-body');

        const years = timersByClient[clientName];

        // Ordina gli anni in ordine decrescente
        const sortedYears = Object.keys(years).sort((a, b) => b - a);

        let yearIndex = 0;
        sortedYears.forEach(year => {
            yearIndex++;
            const yearId = `${clientId}-year-${yearIndex}`;

            // Sezione per l'Anno
            const yearSection = document.createElement('div');
            yearSection.classList.add('card');

            // Header per l'Anno
            const yearHeader = document.createElement('div');
            yearHeader.classList.add('card-header');
            yearHeader.id = `heading-${yearId}`;

            const yearButton = document.createElement('button');
            yearButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
            yearButton.setAttribute('data-toggle', 'collapse');
            yearButton.setAttribute('data-target', `#collapse-${yearId}`);
            yearButton.setAttribute('aria-expanded', 'false');
            yearButton.setAttribute('aria-controls', `collapse-${yearId}`);
            yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;

            // Contenitore per il pulsante dell'anno
            const yearHeaderContainer = document.createElement('div');
            yearHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
            yearHeaderContainer.appendChild(yearButton);

            yearHeader.appendChild(yearHeaderContainer);

            // Div per il collapse dell'Anno
            const yearCollapse = document.createElement('div');
            yearCollapse.id = `collapse-${yearId}`;
            yearCollapse.classList.add('collapse');
            yearCollapse.setAttribute('aria-labelledby', `heading-${yearId}`);

            const yearBody = document.createElement('div');
            yearBody.classList.add('card-body');

            const months = years[year];

            // Ordina i mesi in ordine decrescente
            const sortedMonths = Object.keys(months).sort((a, b) => b - a);

            let monthIndex = 0;
            sortedMonths.forEach(month => {
                monthIndex++;
                const monthId = `${yearId}-month-${monthIndex}`;

                // Sezione per il Mese
                const monthSection = document.createElement('div');
                monthSection.classList.add('card');

                // Header per il Mese
                const monthHeader = document.createElement('div');
                monthHeader.classList.add('card-header');
                monthHeader.id = `heading-${monthId}`;

                const monthButton = document.createElement('button');
                monthButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                monthButton.setAttribute('data-toggle', 'collapse');
                monthButton.setAttribute('data-target', `#collapse-${monthId}`);
                monthButton.setAttribute('aria-expanded', 'false');
                monthButton.setAttribute('aria-controls', `collapse-${monthId}`);

                // Formatta il nome del mese
                const monthName = getMonthName(parseInt(month));

                monthButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${monthName}`;

                // Pulsanti per Espandere/Comprimi Tutto per il Mese
                const expandMonthBtn = document.createElement('button');
                expandMonthBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                expandMonthBtn.innerHTML = '<i class="fas fa-plus-square"></i> Espandi Tutto';
                expandMonthBtn.addEventListener('click', () => {
                    const monthCollapseElement = $(`#collapse-${monthId}`);
                    if (monthCollapseElement.hasClass('show')) {
                        $(`#collapse-${monthId} .collapse`).collapse('show');
                    } else {
                        monthCollapseElement.collapse('show');
                        const expandChildSections = function () {
                            $(`#collapse-${monthId} .collapse`).collapse('show');
                            monthCollapseElement.off('shown.bs.collapse', expandChildSections);
                        };
                        monthCollapseElement.on('shown.bs.collapse', expandChildSections);
                    }
                });

                const collapseMonthBtn = document.createElement('button');
                collapseMonthBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                collapseMonthBtn.innerHTML = '<i class="fas fa-minus-square"></i> Comprimi Tutto';
                collapseMonthBtn.addEventListener('click', () => {
                    $(`#collapse-${monthId} .collapse`).collapse('hide');
                    $(`#collapse-${monthId}`).collapse('hide');
                });

                // Pulsante per Eliminare il Mese
                const deleteMonthBtn = document.createElement('button');
                deleteMonthBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'ml-2');
                deleteMonthBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Mese';
                deleteMonthBtn.addEventListener('click', () => {
                    deleteMonthTimers(clientName, year, month, monthSection);
                });

                const monthHeaderActions = document.createElement('div');
                monthHeaderActions.appendChild(expandMonthBtn);
                monthHeaderActions.appendChild(collapseMonthBtn);
                monthHeaderActions.appendChild(deleteMonthBtn);

                const monthHeaderContainer = document.createElement('div');
                monthHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                monthHeaderContainer.appendChild(monthButton);
                monthHeaderContainer.appendChild(monthHeaderActions);

                monthHeader.appendChild(monthHeaderContainer);

                // Div per il collapse del Mese
                const monthCollapse = document.createElement('div');
                monthCollapse.id = `collapse-${monthId}`;
                monthCollapse.classList.add('collapse');
                monthCollapse.setAttribute('aria-labelledby', `heading-${monthId}`);

                const monthBody = document.createElement('div');
                monthBody.classList.add('card-body');

                const days = months[month];

                // Ordina i giorni in ordine decrescente
                const sortedDays = Object.keys(days).sort((a, b) => b - a);

                sortedDays.forEach(day => {
                    const dayId = `${monthId}-day-${day}`;
                    const daySection = document.createElement('div');
                    daySection.classList.add('card');

                    // Header per il Giorno
                    const dayHeader = document.createElement('div');
                    dayHeader.classList.add('card-header');
                    dayHeader.id = `heading-${dayId}`;

                    const dayButton = document.createElement('button');
                    dayButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                    dayButton.setAttribute('data-toggle', 'collapse');
                    dayButton.setAttribute('data-target', `#collapse-${dayId}`);
                    dayButton.setAttribute('aria-expanded', 'false');
                    dayButton.setAttribute('aria-controls', `collapse-${dayId}`);

                    // Formatta il nome del giorno
                    const dayName = `Giorno ${day}`;

                    dayButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${dayName}`;

                    // Contenitore per il pulsante del giorno
                    const dayHeaderContainer = document.createElement('div');
                    dayHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                    dayHeaderContainer.appendChild(dayButton);

                    dayHeader.appendChild(dayHeaderContainer);

                    // Div per il collapse del Giorno
                    const dayCollapse = document.createElement('div');
                    dayCollapse.id = `collapse-${dayId}`;
                    dayCollapse.classList.add('collapse');
                    dayCollapse.setAttribute('aria-labelledby', `heading-${dayId}`);

                    const dayBody = document.createElement('div');
                    dayBody.classList.add('card-body');

                    // Creazione della tabella per i timer di questo giorno
                    const table = document.createElement('table');
                    table.classList.add('table', 'table-striped', 'table-bordered');

                    // Creazione dell'header della tabella
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');

                    const headers = [
                        'Seleziona',
                        'Cliente - Sito',
                        'Tipo di Lavoro',
                        'Durata',
                        'Orari',
                        'Link',
                        'Reportato',
                        'Azione'
                    ];

                    headers.forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        th.scope = 'col';
                        headerRow.appendChild(th);
                    });

                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Corpo della tabella
                    const tbody = document.createElement('tbody');

                    const dayTimers = days[day];

                    dayTimers.sort((a, b) => b.data.startTime.seconds - a.data.startTime.seconds);

                    dayTimers.forEach(timerObj => {
                        const logData = timerObj.data;
                        const timerRow = createTimerRow(timerObj.id, logData);
                        tbody.appendChild(timerRow);
                    });

                    table.appendChild(tbody);

                    // Aggiungi la tabella al body del giorno
                    dayBody.appendChild(table);
                    dayCollapse.appendChild(dayBody);

                    daySection.appendChild(dayHeader);
                    daySection.appendChild(dayCollapse);

                    // Aggiungi il giorno al corpo del mese
                    monthBody.appendChild(daySection);

                    // Inizializza la sezione collassabile del giorno
                    $(dayCollapse).collapse({
                        toggle: false
                    });

                    // Eventi per cambiare l'icona al clic sul giorno
                    $(`#collapse-${dayId}`).on('show.bs.collapse', function () {
                        dayButton.classList.remove('collapsed');
                        dayButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${dayName}`;
                    });
                    $(`#collapse-${dayId}`).on('hide.bs.collapse', function () {
                        dayButton.classList.add('collapsed');
                        dayButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${dayName}`;
                    });
                });

                monthCollapse.appendChild(monthBody);

                monthSection.appendChild(monthHeader);
                monthSection.appendChild(monthCollapse);

                // Aggiungi il mese al corpo dell'anno
                yearBody.appendChild(monthSection);

                // Inizializza la sezione collassabile del mese
                $(monthCollapse).collapse({
                    toggle: false
                });

                // Eventi per cambiare l'icona al clic sul mese
                $(`#collapse-${monthId}`).on('show.bs.collapse', function () {
                    monthButton.classList.remove('collapsed');
                    monthButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${monthName}`;
                });
                $(`#collapse-${monthId}`).on('hide.bs.collapse', function () {
                    monthButton.classList.add('collapsed');
                    monthButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${monthName}`;
                });
            });

            yearCollapse.appendChild(yearBody);

            yearSection.appendChild(yearHeader);
            yearSection.appendChild(yearCollapse);

            // Aggiungi l'anno al corpo del cliente
            clientBody.appendChild(yearSection);

            // Inizializza la sezione collassabile dell'anno
            $(yearCollapse).collapse({
                toggle: false
            });

            // Eventi per cambiare l'icona al clic sull'anno
            $(`#collapse-${yearId}`).on('show.bs.collapse', function () {
                yearButton.classList.remove('collapsed');
                yearButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${year}`;
            });
            $(`#collapse-${yearId}`).on('hide.bs.collapse', function () {
                yearButton.classList.add('collapsed');
                yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;
            });
        });

        clientCollapse.appendChild(clientBody);

        clientSection.appendChild(clientHeader);
        clientSection.appendChild(clientCollapse);

        // Aggiungi il cliente alla lista principale
        savedTimersList.appendChild(clientSection);

        // Inizializza la sezione collassabile del cliente
        $(clientCollapse).collapse({
            toggle: false
        });

        // Eventi per cambiare l'icona al clic sul cliente
        $(`#collapse-${clientId}`).on('show.bs.collapse', function () {
            clientButton.classList.remove('collapsed');
            clientButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${clientName}`;
        });
        $(`#collapse-${clientId}`).on('hide.bs.collapse', function () {
            clientButton.classList.add('collapsed');
            clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;
        });
    }
}

// Funzione per caricare i clienti nel menu a tendina dei filtri
function loadClientsForFilter() {
    const clientSelect = document.getElementById('filter-client');
    clientSelect.innerHTML = '<option value="">Tutti i Clienti</option>';

    db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const client = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti per il filtro:', error);
        });
}

// Funzione per ottenere i filtri correnti
function getCurrentFilters() {
    const startDate = document.getElementById('filter-date-start').value;
    const endDate = document.getElementById('filter-date-end').value;
    const clientId = document.getElementById('filter-client').value;

    const filters = {};

    if (startDate) {
        filters.startDate = startDate;
    }
    if (endDate) {
        filters.endDate = endDate;
    }
    if (clientId) {
        filters.clientId = clientId;
    }

    return filters;
}