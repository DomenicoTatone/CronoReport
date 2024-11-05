// savedTimersData.js

// Variabile per memorizzare i timer attualmente visualizzati
let displayedTimers = [];

// Variabile per memorizzare l'ultima operazione
let lastOperation = null;

// Funzione per caricare i timer salvati in base ai filtri
function loadSavedTimers(filters = {}) {
    const savedTimersList = document.getElementById('saved-timers-list');
    savedTimersList.innerHTML = ''; // Svuota la lista

    // **Definizione della query per ottenere i timer dal database**
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

            // **Organizzazione dei timer per cliente e mese**
            const timersByClient = {};

            snapshot.forEach(doc => {
                const logData = doc.data();
                const clientName = logData.clientName || 'Cliente Sconosciuto';

                // Formatta la data in "YYYY-MM"
                const startTime = logData.startTime.toDate();
                const monthKey = startTime.getFullYear() + '-' + String(startTime.getMonth() + 1).padStart(2, '0');

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

                // Aggiungi il timer all'array dei timer visualizzati
                displayedTimers.push({
                    id: doc.id,
                    data: logData
                });
            });

            // **Generazione dell'HTML per visualizzare i timer raggruppati**
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

                    // **Creazione della tabella per i timer di questo mese**
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

                    const timers = months[monthKey];

                    timers.sort((a, b) => b.data.startTime.seconds - a.data.startTime.seconds);

                    timers.forEach(timerObj => {
                        const logData = timerObj.data;
                        const timerRow = createTimerRow(timerObj.id, logData);
                        tbody.appendChild(timerRow);
                    });

                    table.appendChild(tbody);
                    monthSection.appendChild(table);

                    clientSection.appendChild(monthSection);
                });

                savedTimersList.appendChild(clientSection);
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
                    table.classList.add('table', 'table-striped', 'table-bordered');

                    // Creazione dell'header della tabella
                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');

                    const headers = [
                        'Cliente - Sito',
                        'Tipo di Lavoro',
                        'Durata',
                        'Orari',
                        'Link',
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
