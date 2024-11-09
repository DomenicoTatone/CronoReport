// recycleBinTimers.js

function loadRecycleBin() {
    const recycleBinTimersDiv = document.getElementById('recycle-bin-timers');
    recycleBinTimersDiv.innerHTML = ''; // Svuota la lista

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

            // Organizzazione dei timer per cliente, anno e mese
            const timersByClient = {};

            snapshot.forEach(doc => {
                const logData = doc.data();
                const clientName = logData.clientName || 'Cliente Sconosciuto';

                // Ottieni la data di eliminazione o di inizio se deletedAt non è disponibile
                const deletedAt = logData.deletedAt ? logData.deletedAt.toDate() : logData.startTime.toDate();

                // Ottieni l'anno e il mese
                const year = deletedAt.getFullYear();
                const month = String(deletedAt.getMonth() + 1).padStart(2, '0'); // Mese con zero iniziale

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
            });

            // Generazione dell'HTML per visualizzare i timer raggruppati
            let clientIndex = 0;
            for (const clientName in timersByClient) {
                clientIndex++;
                const clientId = `recycle-client-${clientIndex}`;
                const clientSection = document.createElement('div');
                clientSection.classList.add('card');

                // Card Header per il Cliente
                const clientHeader = document.createElement('div');
                clientHeader.classList.add('card-header');
                clientHeader.id = `recycle-heading-${clientId}`;

                // Pulsante per espandere/comprimere il Cliente
                const clientButton = document.createElement('button');
                clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                clientButton.setAttribute('data-toggle', 'collapse');
                clientButton.setAttribute('data-target', `#recycle-collapse-${clientId}`);
                clientButton.setAttribute('aria-expanded', 'false');
                clientButton.setAttribute('aria-controls', `recycle-collapse-${clientId}`);
                clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;

                // Pulsanti per Espandere/Comprimi Tutto per il Cliente
                const expandAllBtn = document.createElement('button');
                expandAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                expandAllBtn.innerHTML = '<i class="fas fa-plus-square"></i> Espandi Tutto';
                expandAllBtn.addEventListener('click', () => {
                    const clientCollapseElement = $(`#recycle-collapse-${clientId}`);
                    if (clientCollapseElement.hasClass('show')) {
                        $(`#recycle-collapse-${clientId} .collapse`).collapse('show');
                    } else {
                        clientCollapseElement.collapse('show');
                        const expandChildSections = function () {
                            $(`#recycle-collapse-${clientId} .collapse`).collapse('show');
                            clientCollapseElement.off('shown.bs.collapse', expandChildSections);
                        };
                        clientCollapseElement.on('shown.bs.collapse', expandChildSections);
                    }
                });

                const collapseAllBtn = document.createElement('button');
                collapseAllBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                collapseAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> Comprimi Tutto';
                collapseAllBtn.addEventListener('click', () => {
                    $(`#recycle-collapse-${clientId} .collapse`).collapse('hide');
                    $(`#recycle-collapse-${clientId}`).collapse('hide');
                });

                // Pulsante per Eliminare il Cliente (definitivamente)
                const deleteClientBtn = document.createElement('button');
                deleteClientBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'ml-2');
                deleteClientBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Cliente';
                deleteClientBtn.addEventListener('click', () => {
                    permanentlyDeleteClientTimers(clientName, clientSection);
                });

                const clientHeaderActions = document.createElement('div');
                clientHeaderActions.appendChild(expandAllBtn);
                clientHeaderActions.appendChild(collapseAllBtn);
                clientHeaderActions.appendChild(deleteClientBtn);

                const clientHeaderContainer = document.createElement('div');
                clientHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                clientHeaderContainer.appendChild(clientButton);
                clientHeaderContainer.appendChild(clientHeaderActions);

                clientHeader.appendChild(clientHeaderContainer);

                // Div per il collapse del Cliente
                const clientCollapse = document.createElement('div');
                clientCollapse.id = `recycle-collapse-${clientId}`;
                clientCollapse.classList.add('collapse');
                clientCollapse.setAttribute('aria-labelledby', `recycle-heading-${clientId}`);

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
                    yearHeader.id = `recycle-heading-${yearId}`;

                    const yearButton = document.createElement('button');
                    yearButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                    yearButton.setAttribute('data-toggle', 'collapse');
                    yearButton.setAttribute('data-target', `#recycle-collapse-${yearId}`);
                    yearButton.setAttribute('aria-expanded', 'false');
                    yearButton.setAttribute('aria-controls', `recycle-collapse-${yearId}`);
                    yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;

                    // Pulsanti per Espandere/Comprimi Tutto per l'Anno
                    const expandYearBtn = document.createElement('button');
                    expandYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                    expandYearBtn.innerHTML = '<i class="fas fa-plus-square"></i> Espandi Tutto';
                    expandYearBtn.addEventListener('click', () => {
                        const yearCollapseElement = $(`#recycle-collapse-${yearId}`);
                        if (yearCollapseElement.hasClass('show')) {
                            $(`#recycle-collapse-${yearId} .collapse`).collapse('show');
                        } else {
                            yearCollapseElement.collapse('show');
                            const expandChildSections = function () {
                                $(`#recycle-collapse-${yearId} .collapse`).collapse('show');
                                yearCollapseElement.off('shown.bs.collapse', expandChildSections);
                            };
                            yearCollapseElement.on('shown.bs.collapse', expandChildSections);
                        }
                    });

                    const collapseYearBtn = document.createElement('button');
                    collapseYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
                    collapseYearBtn.innerHTML = '<i class="fas fa-minus-square"></i> Comprimi Tutto';
                    collapseYearBtn.addEventListener('click', () => {
                        $(`#recycle-collapse-${yearId} .collapse`).collapse('hide');
                        $(`#recycle-collapse-${yearId}`).collapse('hide');
                    });

                    // Pulsante per Eliminare l'Anno (definitivamente)
                    const deleteYearBtn = document.createElement('button');
                    deleteYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'ml-2');
                    deleteYearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Anno';
                    deleteYearBtn.addEventListener('click', () => {
                        permanentlyDeleteYearTimers(clientName, year, yearSection);
                    });

                    const yearHeaderActions = document.createElement('div');
                    yearHeaderActions.appendChild(expandYearBtn);
                    yearHeaderActions.appendChild(collapseYearBtn);
                    yearHeaderActions.appendChild(deleteYearBtn);

                    const yearHeaderContainer = document.createElement('div');
                    yearHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                    yearHeaderContainer.appendChild(yearButton);
                    yearHeaderContainer.appendChild(yearHeaderActions);

                    yearHeader.appendChild(yearHeaderContainer);

                    // Div per il collapse dell'Anno
                    const yearCollapse = document.createElement('div');
                    yearCollapse.id = `recycle-collapse-${yearId}`;
                    yearCollapse.classList.add('collapse');
                    yearCollapse.setAttribute('aria-labelledby', `recycle-heading-${yearId}`);

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
                        monthHeader.id = `recycle-heading-${monthId}`;

                        const monthButton = document.createElement('button');
                        monthButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                        monthButton.setAttribute('data-toggle', 'collapse');
                        monthButton.setAttribute('data-target', `#recycle-collapse-${monthId}`);
                        monthButton.setAttribute('aria-expanded', 'false');
                        monthButton.setAttribute('aria-controls', `recycle-collapse-${monthId}`);

                        // Formatta il nome del mese
                        const monthName = getMonthName(parseInt(month));

                        monthButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${monthName}`;

                        // Pulsante per Eliminare il Mese (definitivamente)
                        const deleteMonthBtn = document.createElement('button');
                        deleteMonthBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'ml-2');
                        deleteMonthBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Mese';
                        deleteMonthBtn.addEventListener('click', () => {
                            permanentlyDeleteMonthTimers(clientName, year, month, monthSection);
                        });

                        const monthHeaderActions = document.createElement('div');
                        monthHeaderActions.appendChild(deleteMonthBtn);

                        const monthHeaderContainer = document.createElement('div');
                        monthHeaderContainer.classList.add('d-flex', 'justify-content-between', 'align-items-center');
                        monthHeaderContainer.appendChild(monthButton);
                        monthHeaderContainer.appendChild(monthHeaderActions);

                        monthHeader.appendChild(monthHeaderContainer);

                        // Div per il collapse del Mese
                        const monthCollapse = document.createElement('div');
                        monthCollapse.id = `recycle-collapse-${monthId}`;
                        monthCollapse.classList.add('collapse');
                        monthCollapse.setAttribute('aria-labelledby', `recycle-heading-${monthId}`);

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
                            const timerRow = createTimerRow(timerObj.id, logData, true); // Passiamo true per indicare che siamo nel cestino
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
                        $(`#recycle-collapse-${monthId}`).on('show.bs.collapse', function () {
                            monthButton.classList.remove('collapsed');
                            monthButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${monthName}`;
                        });
                        $(`#recycle-collapse-${monthId}`).on('hide.bs.collapse', function () {
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
                    $(`#recycle-collapse-${yearId}`).on('show.bs.collapse', function () {
                        yearButton.classList.remove('collapsed');
                        yearButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${year}`;
                    });
                    $(`#recycle-collapse-${yearId}`).on('hide.bs.collapse', function () {
                        yearButton.classList.add('collapsed');
                        yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;
                    });
                });

                clientCollapse.appendChild(clientBody);

                clientSection.appendChild(clientHeader);
                clientSection.appendChild(clientCollapse);

                // Aggiungi il cliente alla lista principale
                recycleBinTimersDiv.appendChild(clientSection);

                // Inizializza la sezione collassabile del cliente
                $(clientCollapse).collapse({
                    toggle: false
                });

                // Eventi per cambiare l'icona al clic sul cliente
                $(`#recycle-collapse-${clientId}`).on('show.bs.collapse', function () {
                    clientButton.classList.remove('collapsed');
                    clientButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${clientName}`;
                });
                $(`#recycle-collapse-${clientId}`).on('hide.bs.collapse', function () {
                    clientButton.classList.add('collapsed');
                    clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;
                });
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento del cestino:', error);
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
