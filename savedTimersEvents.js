// savedTimersEvents.js

// Funzione per inizializzare la sezione Timer Salvati
function initializeSavedTimersEvents() {
    const savedTimersList = document.getElementById('savedTimersAccordion');
    const filterTimersBtn = document.getElementById('filter-timers-btn');
    const unmarkActionSelect = document.getElementById('unmark-action-select');
    const applyActionBtn = document.getElementById('apply-action-btn');
    const undoActionBtn = document.getElementById('undo-action-btn');

    if (!savedTimersList) {
        console.error("Elemento 'savedTimersAccordion' non trovato nel DOM.");
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

// Funzione per eliminare tutti i timer di un cliente
function deleteClientTimers(clientName, clientElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare tutti i timer per il cliente "${clientName}"? Saranno spostati nel cestino.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('isDeleted', '==', false);

            deleteTimersInBatches(query,
                () => {
                    clientElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Cliente Eliminato',
                        text: `Tutti i timer per "${clientName}" sono stati spostati nel cestino.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione dei timer del cliente:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare tutti i timer di un anno specifico
function deleteYearTimers(clientName, year, yearElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare tutti i timer per l'anno "${year}" del cliente "${clientName}"? Saranno spostati nel cestino.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const startOfYear = new Date(`${year}-01-01T00:00:00`);
            const endOfYear = new Date(`${year}-12-31T23:59:59`);

            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(startOfYear))
                .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endOfYear))
                .where('isDeleted', '==', false);

            deleteTimersInBatches(query,
                () => {
                    yearElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Anno Eliminato',
                        text: `Tutti i timer per l'anno "${year}" sono stati spostati nel cestino.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione dei timer dell\'anno:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare tutti i timer di un mese specifico
function deleteMonthTimers(clientName, year, month, monthElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare tutti i timer per "${getMonthName(parseInt(month))} ${year}" del cliente "${clientName}"? Saranno spostati nel cestino.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const startOfMonth = new Date(`${year}-${month}-01T00:00:00`);
            const endOfMonth = new Date(year, parseInt(month), 0, 23, 59, 59); // Giorno 0 del mese successivo è l'ultimo giorno del mese corrente

            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
                .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth))
                .where('isDeleted', '==', false);

            deleteTimersInBatches(query,
                () => {
                    monthElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Mese Eliminato',
                        text: `Tutti i timer per "${getMonthName(parseInt(month))} ${year}" sono stati spostati nel cestino.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione dei timer del mese:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare i timer in batch (massimo 500 operazioni per batch)
function deleteTimersInBatches(query, onComplete, onError) {
    query.limit(500).get()
        .then(snapshot => {
            if (snapshot.empty) {
                // Nessun documento da eliminare
                onComplete();
                return;
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, {
                    isDeleted: true,
                    deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            batch.commit().then(() => {
                // Richiama la funzione ricorsivamente finché ci sono documenti
                deleteTimersInBatches(query, onComplete, onError);
            });
        })
        .catch(error => {
            onError(error);
        });
}

// Funzione per eliminare definitivamente tutti i timer di un cliente dal cestino
function permanentlyDeleteClientTimers(clientName, clientElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare definitivamente tutti i timer per il cliente "${clientName}"? Questa operazione non può essere annullata.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina definitivamente!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('isDeleted', '==', true);

            deleteTimersPermanentlyInBatches(query,
                () => {
                    clientElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Cliente Eliminato',
                        text: `Tutti i timer per "${clientName}" sono stati eliminati definitivamente.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione definitiva dei timer del cliente:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione definitiva dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare definitivamente tutti i timer di un anno specifico dal cestino
function permanentlyDeleteYearTimers(clientName, year, yearElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare definitivamente tutti i timer per l'anno "${year}" del cliente "${clientName}"? Questa operazione non può essere annullata.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina definitivamente!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const startOfYear = new Date(`${year}-01-01T00:00:00`);
            const endOfYear = new Date(`${year}-12-31T23:59:59`);

            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('deletedAt', '>=', firebase.firestore.Timestamp.fromDate(startOfYear))
                .where('deletedAt', '<=', firebase.firestore.Timestamp.fromDate(endOfYear))
                .where('isDeleted', '==', true);

            deleteTimersPermanentlyInBatches(query,
                () => {
                    yearElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Anno Eliminato',
                        text: `Tutti i timer per l'anno "${year}" sono stati eliminati definitivamente.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione definitiva dei timer dell\'anno:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione definitiva dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare definitivamente tutti i timer di un mese specifico dal cestino
function permanentlyDeleteMonthTimers(clientName, year, month, monthElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare definitivamente tutti i timer per "${getMonthName(parseInt(month))} ${year}" del cliente "${clientName}"? Questa operazione non può essere annullata.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina definitivamente!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            const startOfMonth = new Date(`${year}-${month}-01T00:00:00`);
            const endOfMonth = new Date(year, parseInt(month), 0, 23, 59, 59); // Giorno 0 del mese successivo è l'ultimo giorno del mese corrente

            const query = db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('clientName', '==', clientName)
                .where('deletedAt', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
                .where('deletedAt', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth))
                .where('isDeleted', '==', true);

            deleteTimersPermanentlyInBatches(query,
                () => {
                    monthElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Mese Eliminato',
                        text: `Tutti i timer per "${getMonthName(parseInt(month))} ${year}" sono stati eliminati definitivamente.`,
                        confirmButtonText: 'OK'
                    });
                },
                (error) => {
                    console.error('Errore durante l\'eliminazione definitiva dei timer del mese:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante l\'eliminazione definitiva dei timer.',
                        confirmButtonText: 'OK'
                    });
                }
            );
        }
    });
}

// Funzione per eliminare definitivamente i timer in batch (massimo 500 operazioni per batch)
function deleteTimersPermanentlyInBatches(query, onComplete, onError) {
    query.limit(500).get()
        .then(snapshot => {
            if (snapshot.empty) {
                // Nessun documento da eliminare
                onComplete();
                return;
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            batch.commit().then(() => {
                // Richiama la funzione ricorsivamente finché ci sono documenti
                deleteTimersPermanentlyInBatches(query, onComplete, onError);
            });
        })
        .catch(error => {
            onError(error);
        });
}
