// savedTimersEvents.js

// Funzione per inizializzare la sezione Timer Salvati
function initializeSavedTimersEvents() {
    const savedTimersList = document.getElementById('saved-timers-list');
    const filterTimersBtn = document.getElementById('filter-timers-btn');
    const unmarkActionSelect = document.getElementById('unmark-action-select');
    const applyActionBtn = document.getElementById('apply-action-btn');
    const undoActionBtn = document.getElementById('undo-action-btn');

    if (!savedTimersList) {
        console.error("Elemento 'saved-timers-list' non trovato nel DOM.");
        return;
    }

    // Carica i clienti nel filtro
    loadClientsForFilter();

    // Event listeners per i pulsanti di azione
    if (filterTimersBtn) {
        filterTimersBtn.addEventListener('click', filterTimers);
    }

    if (applyActionBtn) {
        applyActionBtn.addEventListener('click', () => {
            const selectedAction = unmarkActionSelect.value;
            switch (selectedAction) {
                case 'unmark-all':
                    unmarkAllTimers();
                    break;
                case 'unmark-selected':
                    unmarkSelectedTimers();
                    break;
                case 'unmark-filtered':
                    unmarkFilteredTimers();
                    break;
                default:
                    Swal.fire({
                        icon: 'warning',
                        title: 'Attenzione',
                        text: 'Seleziona un\'azione da eseguire.',
                        confirmButtonText: 'OK'
                    });
                    break;
            }
        });
    }

    if (undoActionBtn) {
        undoActionBtn.addEventListener('click', () => {
            if (!lastOperation) {
                Swal.fire({
                    icon: 'info',
                    title: 'Nessuna Operazione da Annullare',
                    text: 'Non ci sono operazioni recenti da annullare.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            switch (lastOperation.action) {
                case 'delete':
                    undoDeleteTimer(lastOperation.timerId);
                    break;
                case 'unmark':
                    undoUnmarkTimers(lastOperation.timerIds);
                    break;
                default:
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Operazione non riconosciuta.',
                        confirmButtonText: 'OK'
                    });
                    break;
            }
        });
    }

    // Carica tutti i timer salvati inizialmente
    loadSavedTimers();
}

// Funzione per filtrare i timer salvati
function filterTimers() {
    const filters = getCurrentFilters();
    loadSavedTimers(filters);
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

// Funzione per rimuovere il contrassegno a tutti i timer
function unmarkAllTimers() {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Vuoi rimuovere il contrassegno da tutti i timer?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, rimuovi!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('isDeleted', '==', false)
                .get()
                .then(snapshot => {
                    const timerIds = snapshot.docs.map(doc => doc.id);
                    unmarkTimers(timerIds);
                });
        }
    });
}

// Funzione per rimuovere il contrassegno ai timer selezionati
function unmarkSelectedTimers() {
    const selectedTimers = Array.from(document.querySelectorAll('.timer-checkbox:checked')).map(checkbox => checkbox.value);
    if (selectedTimers.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Attenzione',
            text: 'Seleziona almeno un timer per rimuovere il contrassegno.',
            confirmButtonText: 'OK'
        });
        return;
    }
    unmarkTimers(selectedTimers);
}

// Funzione per rimuovere il contrassegno ai timer filtrati
function unmarkFilteredTimers() {
    const timerIds = displayedTimers.map(timer => timer.id);
    if (timerIds.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Attenzione',
            text: 'Non ci sono timer filtrati da cui rimuovere il contrassegno.',
            confirmButtonText: 'OK'
        });
        return;
    }
    unmarkTimers(timerIds);
}

// Avvia l'inizializzazione dopo che l'utente è autenticato
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        initializeSavedTimersEvents();

        // Aggiungi l'event listener per il link al cestino
        const recycleBinLink = document.getElementById('recycle-bin-link');
        if (recycleBinLink) {
            recycleBinLink.addEventListener('click', (e) => {
                e.preventDefault(); // Previene il comportamento predefinito del link
                // Nascondi altre sezioni e mostra il cestino
                document.getElementById('saved-timers-section').style.display = 'none';
                document.getElementById('recycle-bin-section').style.display = 'block';
                loadRecycleBin();
            });
        }
    } else {
        // L'utente non è autenticato, reindirizza alla pagina di login
        window.location.href = 'login.html';
    }
});
