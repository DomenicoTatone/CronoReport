// savedTimersData.js

// Variabile per memorizzare i timer attualmente visualizzati
let displayedTimers = [];

// Variabile per memorizzare l'ultima operazione
let lastOperation = null;

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

            // Organizzazione dei timer per cliente, anno e mese
            const timersByClient = {};

            snapshot.forEach(doc => {
                const logData = doc.data();
                const clientName = logData.clientName || 'Cliente Sconosciuto';

                // Ottieni la data di inizio del timer
                const startTime = logData.startTime.toDate();

                // Ottieni l'anno e il mese
                const year = startTime.getFullYear();
                const month = String(startTime.getMonth() + 1).padStart(2, '0'); // Mese con zero iniziale

                if (!timersByClient[clientName]) {
                    timersByClient[clientName] = {};
                }

                if (!timersByClient[clientName][year]) {
                    timersByClient[clientName][year] = {};
                }

                if (!timersByClient[clientName][year][month]) {
                    timersByClient[clientName][year][month] = [];
                }

                timersByClient[clientName][year][month].push({
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

                // Pulsanti per Espandere/Comprimi Tutto per il Cliente
                const expandAllBtn = document.createElement('button');
                expandAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                expandAllBtn.textContent = 'Espandi Tutto';
                expandAllBtn.addEventListener('click', () => {
                    const clientCollapseElement = $(`#collapse-${clientId}`);
                    if (clientCollapseElement.hasClass('show')) {
                        $(`#collapse-${clientId} .collapse`).collapse('show');
                    } else {
                        clientCollapseElement.collapse('show');
                        const expandChildSections = function () {
                            $(`#collapse-${clientId} .collapse`).collapse('show');
                            clientCollapseElement.off('shown.bs.collapse', expandChildSections);
                        };
                        clientCollapseElement.on('shown.bs.collapse', expandChildSections);
                    }
                });

                const collapseAllBtn = document.createElement('button');
                collapseAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                collapseAllBtn.textContent = 'Comprimi Tutto';
                collapseAllBtn.addEventListener('click', () => {
                    $(`#collapse-${clientId} .collapse`).collapse('hide');
                    $(`#collapse-${clientId}`).collapse('hide');
                });

                const clientHeaderActions = document.createElement('div');
                clientHeaderActions.appendChild(expandAllBtn);
                clientHeaderActions.appendChild(collapseAllBtn);

                const clientHeaderContainer = document.createElement('div');
                clientHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                clientHeaderContainer.appendChild(clientButton);
                clientHeaderContainer.appendChild(clientHeaderActions);

                clientHeader.appendChild(clientHeaderContainer);

                // Div per il collapse del Cliente
                const clientCollapse = document.createElement('div');
                clientCollapse.id = `collapse-${clientId}`;
                clientCollapse.classList.add('collapse');
                clientCollapse.setAttribute('aria-labelledby', `heading-${clientId}`);
                // Rimosso data-parent

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

                    // Pulsanti per Espandere/Comprimi Tutto per l'Anno
                    const expandYearBtn = document.createElement('button');
                    expandYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                    expandYearBtn.textContent = 'Espandi Tutto';
                    expandYearBtn.addEventListener('click', () => {
                        const yearCollapseElement = $(`#collapse-${yearId}`);
                        if (yearCollapseElement.hasClass('show')) {
                            $(`#collapse-${yearId} .collapse`).collapse('show');
                        } else {
                            yearCollapseElement.collapse('show');
                            const expandChildSections = function () {
                                $(`#collapse-${yearId} .collapse`).collapse('show');
                                yearCollapseElement.off('shown.bs.collapse', expandChildSections);
                            };
                            yearCollapseElement.on('shown.bs.collapse', expandChildSections);
                        }
                    });

                    const collapseYearBtn = document.createElement('button');
                    collapseYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                    collapseYearBtn.textContent = 'Comprimi Tutto';
                    collapseYearBtn.addEventListener('click', () => {
                        $(`#collapse-${yearId} .collapse`).collapse('hide');
                        $(`#collapse-${yearId}`).collapse('hide');
                    });

                    const yearHeaderActions = document.createElement('div');
                    yearHeaderActions.appendChild(expandYearBtn);
                    yearHeaderActions.appendChild(collapseYearBtn);

                    const yearHeaderContainer = document.createElement('div');
                    yearHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                    yearHeaderContainer.appendChild(yearButton);
                    yearHeaderContainer.appendChild(yearHeaderActions);

                    yearHeader.appendChild(yearHeaderContainer);

                    // Div per il collapse dell'Anno
                    const yearCollapse = document.createElement('div');
                    yearCollapse.id = `collapse-${yearId}`;
                    yearCollapse.classList.add('collapse');
                    yearCollapse.setAttribute('aria-labelledby', `heading-${yearId}`);
                    // Rimosso data-parent

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

                        monthHeader.appendChild(monthButton);

                        // Div per il collapse del Mese
                        const monthCollapse = document.createElement('div');
                        monthCollapse.id = `collapse-${monthId}`;
                        monthCollapse.classList.add('collapse');
                        monthCollapse.setAttribute('aria-labelledby', `heading-${monthId}`);
                        // Rimosso data-parent

                        const monthBody = document.createElement('div');
                        monthBody.classList.add('card-body');

                        // Creazione della tabella per i timer di questo mese
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

                        const timers = months[month];

                        timers.sort((a, b) => b.data.startTime.seconds - a.data.startTime.seconds);

                        timers.forEach(timerObj => {
                            const logData = timerObj.data;
                            const timerRow = createTimerRow(timerObj.id, logData);
                            tbody.appendChild(timerRow);
                        });

                        table.appendChild(tbody);

                        // Aggiungi la tabella al body del mese
                        monthBody.appendChild(table);
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
        })

        .catch(error => {
            console.error('Errore nel caricamento dei timer salvati:', error);
        });
}

// Funzione per caricare i clienti nel menu a tendina
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

// Funzione per caricare i timer nel cestino
function loadRecycleBin() {
    const recycleBinList = document.getElementById('recycle-bin-list');
    recycleBinList.innerHTML = ''; // Svuota la lista

    db.collection('timeLogs')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', true)
        .orderBy('deletedAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                const noTimersMessage = document.createElement('p');
                noTimersMessage.textContent = 'Il cestino è vuoto.';
                recycleBinList.appendChild(noTimersMessage);
                return;
            }

            // Organizzazione dei timer per cliente e mese
            const timersByClient = {};

            snapshot.forEach(doc => {
                const logData = doc.data();
                const clientName = logData.clientName || 'Cliente Sconosciuto';

                // Formatta la data in "YYYY-MM"
                const deletedAt = logData.deletedAt.toDate();
                const monthKey = deletedAt.getFullYear() + '-' + String(deletedAt.getMonth() + 1).padStart(2, '0');

                if (!timersByClient[clientName]) {
                    timersByClient[clientName] = {};
                }

                if (!timersByClient[clientName][monthKey]) {
                    timersByClient[clientName][monthKey] = [];
                }

                timersByClient[clientName][monthKey].push({
                    id: doc.id,
                    data: logData
                });
            });

            // Generazione dell'HTML per visualizzare i timer raggruppati
            for (const clientName in timersByClient) {
                // Sezione Cliente
                const clientSection = document.createElement('div');
                clientSection.classList.add('client-section', 'mb-4');

                const clientHeader = document.createElement('h3');
                clientHeader.textContent = clientName;
                clientHeader.classList.add('client-header', 'mb-3');

                clientSection.appendChild(clientHeader);

                const months = timersByClient[clientName];

                // Ordina i mesi in ordine decrescente
                const sortedMonths = Object.keys(months).sort((a, b) => b.localeCompare(a));

                sortedMonths.forEach(monthKey => {
                    const monthSection = document.createElement('div');
                    monthSection.classList.add('month-section', 'mb-3');

                    // Formatta il mese in modo leggibile
                    const [year, month] = monthKey.split('-');
                    const monthName = getMonthName(parseInt(month));

                    const monthHeader = document.createElement('h5');
                    monthHeader.textContent = `${monthName} ${year}`;
                    monthHeader.classList.add('month-header', 'mb-2');

                    monthSection.appendChild(monthHeader);

                    // Creazione della tabella per i timer di questo mese
                    const table = document.createElement('table');
                    table.classList.add('table', 'table-striped', 'table-bordered', 'table-hover', 'mb-0');

                    // Creazione dell'header della tabella
                    const thead = document.createElement('thead');
                    thead.classList.add('thead-light');
                    const headerRow = document.createElement('tr');

                    const headers = [
                        'Seleziona',
                        'Cliente - Sito',
                        'Tipo di Lavoro',
                        'Durata',
                        'Orari',
                        'Link',
                        'Stato',
                        'Azione'
                    ];

                    headers.forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        th.scope = 'col';
                        th.classList.add('align-middle', 'text-center');
                        headerRow.appendChild(th);
                    });

                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Corpo della tabella
                    const tbody = document.createElement('tbody');

                    const timers = months[monthKey];

                    timers.sort((a, b) => b.data.deletedAt.seconds - a.data.deletedAt.seconds);

                    timers.forEach(timerObj => {
                        const logData = timerObj.data;
                        const timerRow = createRecycleBinRow(timerObj.id, logData);
                        tbody.appendChild(timerRow);
                    });

                    table.appendChild(tbody);
                    monthSection.appendChild(table);

                    clientSection.appendChild(monthSection);
                });

                recycleBinList.appendChild(clientSection);
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento del cestino:', error);
        });
}

// Funzione per "eliminare" un timer salvato (spostandolo nel cestino)
function deleteTimer(timerId, barElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Vuoi eliminare questo timer? Sarà spostato nel cestino.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const timerRef = db.collection('timeLogs').doc(timerId);
            timerRef.update({
                isDeleted: true,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
                .then(() => {
                    barElement.remove();
                    lastOperation = {
                        action: 'delete',
                        timerId: timerId
                    };
                    Swal.fire({
                        icon: 'success',
                        title: 'Timer Eliminato',
                        text: 'Il timer è stato spostato nel cestino.',
                        confirmButtonText: 'OK'
                    });
                })
                .catch(error => {
                    console.error('Errore durante l\'eliminazione del timer:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione del timer.',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}

// Funzione per ripristinare un timer dal cestino
function restoreTimer(timerId, rowElement) {
    db.collection('timeLogs').doc(timerId).update({
        isDeleted: false,
        deletedAt: firebase.firestore.FieldValue.delete()
    }).then(() => {
        rowElement.remove();
        Swal.fire({
            icon: 'success',
            title: 'Timer Ripristinato',
            text: 'Il timer è stato ripristinato con successo.',
            confirmButtonText: 'OK'
        });
    }).catch(error => {
        console.error('Errore durante il ripristino del timer:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il ripristino del timer.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per eliminare definitivamente un timer
function permanentlyDeleteTimer(timerId, rowElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Questo timer sarà eliminato definitivamente e non potrà essere recuperato.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina definitivamente!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection('timeLogs').doc(timerId).delete()
                .then(() => {
                    rowElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Timer Eliminato',
                        text: 'Il timer è stato eliminato definitivamente.',
                        confirmButtonText: 'OK'
                    });
                })
                .catch(error => {
                    console.error('Errore durante l\'eliminazione del timer:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione del timer.',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}

// Funzione per rimuovere il contrassegno "reportato" dai timer
function unmarkTimers(timerIds) {
    const batch = db.batch();
    timerIds.forEach(timerId => {
        const timerRef = db.collection('timeLogs').doc(timerId);
        batch.update(timerRef, { isReported: false });
    });
    batch.commit().then(() => {
        lastOperation = {
            action: 'unmark',
            timerIds: timerIds
        };
        Swal.fire({
            icon: 'success',
            title: 'Contrassegno Rimosso',
            text: 'Il contrassegno è stato rimosso con successo dai timer selezionati.',
            confirmButtonText: 'OK'
        });
        // Ricarica i timer salvati con gli stessi filtri
        const filters = getCurrentFilters();
        loadSavedTimers(filters);
    }).catch(error => {
        console.error('Errore nella rimozione del contrassegno:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante la rimozione del contrassegno.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per annullare l'eliminazione di un timer
function undoDeleteTimer(timerId) {
    db.collection('timeLogs').doc(timerId).update({
        isDeleted: false,
        deletedAt: firebase.firestore.FieldValue.delete()
    }).then(() => {
        lastOperation = null; // Resetta l'ultima operazione
        Swal.fire({
            icon: 'success',
            title: 'Operazione Annullata',
            text: 'Il timer è stato ripristinato.',
            confirmButtonText: 'OK'
        });
        // Ricarica la lista dei timer
        const filters = getCurrentFilters();
        loadSavedTimers(filters);
    }).catch(error => {
        console.error('Errore durante l\'annullamento dell\'eliminazione del timer:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante l\'annullamento dell\'operazione.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per annullare la rimozione del contrassegno
function undoUnmarkTimers(timerIds) {
    const batch = db.batch();
    timerIds.forEach(timerId => {
        const timerRef = db.collection('timeLogs').doc(timerId);
        batch.update(timerRef, { isReported: true });
    });
    batch.commit().then(() => {
        lastOperation = null; // Resetta l'ultima operazione
        Swal.fire({
            icon: 'success',
            title: 'Operazione Annullata',
            text: 'Il contrassegno è stato ripristinato per i timer selezionati.',
            confirmButtonText: 'OK'
        });
        // Ricarica i timer salvati con gli stessi filtri
        const filters = getCurrentFilters();
        loadSavedTimers(filters);
    }).catch(error => {
        console.error('Errore durante l\'annullamento della rimozione del contrassegno:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante l\'annullamento dell\'operazione.',
            confirmButtonText: 'OK'
        });
    });
}
