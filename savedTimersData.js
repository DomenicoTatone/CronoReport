// savedTimersData.js

// Funzione per caricare i timer salvati in base ai filtri
function loadSavedTimers(filters = {}) {
    const savedTimersList = document.getElementById('savedTimersAccordion');
    savedTimersList.innerHTML = '';

    const amountsSection = document.getElementById('unreported-amounts-section');
    if (amountsSection) {
        amountsSection.remove();
    }

    let query = db.collection('timeLogs')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', false);

    if (filters.startDate) {
        query = query.where('startTime', '>=', firebase.firestore.Timestamp.fromDate(new Date(filters.startDate)));
    }
    if (filters.endDate) {
        const endDateObj = new Date(filters.endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query = query.where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endDateObj));
    }
    if (filters.client) {
        query = query.where('clientId', '==', filters.client);
    }

    query.orderBy('startTime', 'desc').get()
        .then(snapshot => {
            displayedTimers = [];
            const unreportedAmounts = {};

            if (snapshot.empty) {
                const noTimersMessage = document.createElement('p');
                noTimersMessage.textContent = 'Non ci sono timer salvati.';
                savedTimersList.appendChild(noTimersMessage);
                return;
            }

            const worktypeRates = {};

            db.collection('worktypes')
                .where('uid', '==', currentUser.uid)
                .get()
                .then(worktypeSnapshot => {
                    worktypeSnapshot.forEach(worktypeDoc => {
                        const worktypeData = worktypeDoc.data();
                        worktypeRates[worktypeDoc.id] = worktypeData.hourlyRate || 0;
                    });

                    snapshot.forEach(doc => {
                        const logData = doc.data();
                        const clientName = logData.clientName || 'Cliente Sconosciuto';
                        const worktypeId = logData.worktypeId;

                        displayedTimers.push({
                            id: doc.id,
                            data: logData
                        });

                        if (!logData.isReported) {
                            const durationInHours = logData.duration / 3600;
                            const hourlyRate = worktypeRates[worktypeId] || 0;
                            const amount = durationInHours * hourlyRate;

                            if (!unreportedAmounts[clientName]) {
                                unreportedAmounts[clientName] = 0;
                            }
                            unreportedAmounts[clientName] += amount;
                        }
                    });

                    displayTimers(displayedTimers);
                    displayUnreportedAmounts(unreportedAmounts);
                })
                .catch(error => {
                    console.error('Errore nel caricamento delle tariffe dei tipi di lavoro:', error);
                });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei timer salvati:', error);
        });
}

function generateSafeId(prefix, name) {
    return prefix + '-' + name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function displayUnreportedAmounts(unreportedAmounts) {
    const amountsSection = document.getElementById('unreported-amounts-section');
    if (!amountsSection) {
        // Sezione non esiste, creala
        const savedTimersSection = document.getElementById('saved-timers-section');
        const newSection = document.createElement('div');
        newSection.id = 'unreported-amounts-section';
        newSection.classList.add('card', 'mb-4', 'shadow-sm');

        const header = document.createElement('div');
        header.classList.add('card-header', 'bg-info', 'text-white');
        header.innerHTML = '<h5 class="mb-0"><i class="fas fa-money-bill-wave mr-2"></i>Importi Non Riscossi per Cliente</h5>';

        const body = document.createElement('div');
        body.classList.add('card-body');
        body.id = 'unreported-amounts-body';

        newSection.appendChild(header);
        newSection.appendChild(body);

        // Inserisci la nuova sezione dopo il titolo
        savedTimersSection.insertBefore(newSection, savedTimersSection.childNodes[2]);
    }

    const body = document.getElementById('unreported-amounts-body');
    body.innerHTML = ''; // Svuota il contenuto precedente

    if (Object.keys(unreportedAmounts).length === 0) {
        body.innerHTML = '<p>Non ci sono importi non riscossi.</p>';
        return;
    }

    // Crea una tabella per visualizzare gli importi
    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-striped');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['Cliente', 'Importo Non Riscosso', 'Promemoria', 'Azioni'];
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    for (const clientName in unreportedAmounts) {
        const amount = unreportedAmounts[clientName];
        const row = document.createElement('tr');

        const clientCell = document.createElement('td');
        clientCell.textContent = clientName;

        const amountCell = document.createElement('td');
        amountCell.textContent = amount.toFixed(2) + ' €';

        // Cell per il promemoria
        const reminderCell = document.createElement('td');
        reminderCell.id = generateSafeId('reminder-cell', clientName);

        // Carica le impostazioni di promemoria per il cliente
        loadReminderSettings(clientName, reminderCell, amount);

        // Cell per le azioni
        const actionCell = document.createElement('td');

        const setReminderBtn = document.createElement('button');
        setReminderBtn.classList.add('btn', 'btn-sm', 'btn-primary');
        setReminderBtn.textContent = 'Imposta Promemoria';
        setReminderBtn.addEventListener('click', () => {
            showSetReminderModal(clientName, amount);
        });

        actionCell.appendChild(setReminderBtn);

        row.appendChild(clientCell);
        row.appendChild(amountCell);
        row.appendChild(reminderCell);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    }

    table.appendChild(tbody);
    body.appendChild(table);
}

function saveReminderSettings(clientName, reminderAmount, reminderDate) {
    // Controlla se esiste già un promemoria per questo cliente
    db.collection('reminders')
        .where('uid', '==', currentUser.uid)
        .where('clientName', '==', clientName)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                // Aggiorna il documento esistente
                const docId = snapshot.docs[0].id;
                db.collection('reminders').doc(docId).update({
                    reminderAmount: reminderAmount,
                    reminderDate: reminderDate,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    $('#setReminderModal').modal('hide');
                    showAlert('success', 'Promemoria Salvato', 'Le impostazioni di promemoria sono state aggiornate.');
                    // Ricarica la sezione degli importi non riscossi
                    loadSavedTimers(getCurrentFilters());
                }).catch(error => {
                    console.error('Errore nell\'aggiornamento del promemoria:', error);
                    showAlert('error', 'Errore', 'Si è verificato un errore durante il salvataggio del promemoria.');
                });
            } else {
                // Crea un nuovo documento
                db.collection('reminders').add({
                    uid: currentUser.uid,
                    clientName: clientName,
                    reminderAmount: reminderAmount,
                    reminderDate: reminderDate,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    $('#setReminderModal').modal('hide');
                    showAlert('success', 'Promemoria Salvato', 'Le impostazioni di promemoria sono state salvate.');
                    // Ricarica la sezione degli importi non riscossi
                    loadSavedTimers(getCurrentFilters());
                }).catch(error => {
                    console.error('Errore nel salvataggio del promemoria:', error);
                    showAlert('error', 'Errore', 'Si è verificato un errore durante il salvataggio del promemoria.');
                });
            }
        })
        .catch(error => {
            console.error('Errore nel controllare il promemoria esistente:', error);
        });
}

function loadReminderSettings(clientName, reminderCell, currentAmount) {
    db.collection('reminders')
        .where('uid', '==', currentUser.uid)
        .where('clientName', '==', clientName)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const reminderData = snapshot.docs[0].data();
                let reminderText = '';

                if (reminderData.reminderAmount) {
                    reminderText += `Importo: ${reminderData.reminderAmount.toFixed(2)} €`;
                }
                if (reminderData.reminderDate) {
                    if (reminderText) reminderText += ' | ';
                    reminderText += `Data: ${formatDate(reminderData.reminderDate)}`;
                }

                reminderCell.textContent = reminderText;

                // Controlla se il promemoria deve essere attivato
                checkReminder(clientName, currentAmount, reminderData);
            } else {
                reminderCell.textContent = 'Nessun promemoria impostato';
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento delle impostazioni di promemoria:', error);
        });
}

function checkReminder(clientName, currentAmount, reminderData) {
    let shouldRemind = false;

    // Controlla l'importo
    if (reminderData.reminderAmount && currentAmount >= reminderData.reminderAmount) {
        shouldRemind = true;
    }

    // Controlla la data
    if (reminderData.reminderDate) {
        const today = new Date();
        const reminderDate = new Date(reminderData.reminderDate);
        if (today >= reminderDate) {
            shouldRemind = true;
        }
    }

    if (shouldRemind) {
        const reminderCellId = generateSafeId('reminder-cell', clientName);
        const reminderCell = document.getElementById(reminderCellId);
        if (!reminderCell) {
            console.error(`Elemento con id "${reminderCellId}" non trovato.`);
            return;
        }
        const reminderRow = reminderCell.parentElement;
        if (reminderRow) {
            reminderRow.classList.add('table-warning');
        } else {
            console.error('Impossibile trovare il parentElement di reminderCell.');
        }

        // Mostra una notifica all'utente
        Swal.fire({
            icon: 'info',
            title: 'Promemoria',
            text: `Il cliente "${clientName}" ha raggiunto le condizioni del promemoria.`,
            confirmButtonText: 'OK'
        });
    }
}

function showSetReminderModal(clientName, currentAmount) {
    // Imposta il nome del cliente nella modale
    document.getElementById('modal-client-name').textContent = clientName;

    // Reset dei campi
    document.getElementById('reminder-amount').value = '';
    document.getElementById('reminder-date').value = '';

    // Carica le impostazioni esistenti, se presenti
    db.collection('reminders')
        .where('uid', '==', currentUser.uid)
        .where('clientName', '==', clientName)
        .get()
        .then(snapshot => {
            if (!snapshot.empty) {
                const reminderData = snapshot.docs[0].data();
                if (reminderData.reminderAmount) {
                    document.getElementById('reminder-amount').value = reminderData.reminderAmount;
                }
                if (reminderData.reminderDate) {
                    document.getElementById('reminder-date').value = reminderData.reminderDate;
                }
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento delle impostazioni di promemoria:', error);
        });

    // Mostra la modale
    $('#setReminderModal').modal('show');

    // Aggiungi event listener per il pulsante Salva
    const saveReminderBtn = document.getElementById('save-reminder-btn');
    saveReminderBtn.onclick = () => {
        const reminderAmount = parseFloat(document.getElementById('reminder-amount').value);
        const reminderDate = document.getElementById('reminder-date').value;

        if (isNaN(reminderAmount) && !reminderDate) {
            showAlert('warning', 'Attenzione', 'Inserisci almeno un valore per il promemoria.');
            return;
        }

        saveReminderSettings(clientName, reminderAmount || null, reminderDate || null);
    };
}

// Funzione per visualizzare i timer
function displayTimers(timers) {
    const savedTimersList = document.getElementById('savedTimersAccordion');
    savedTimersList.innerHTML = ''; // Svuota la lista

    if (timers.length === 0) {
        const noTimersMessage = document.createElement('p');
        noTimersMessage.textContent = 'Non ci sono timer salvati.';
        savedTimersList.appendChild(noTimersMessage);
        return;
    }

    // Organizzazione dei timer per cliente, anno, mese e giorno
    const timersByClient = {};

    timers.forEach(timerObj => {
        const logData = timerObj.data;
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

        timersByClient[clientName][year][month][day].push(timerObj);
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

            // Pulsanti per Espandere/Comprimi Tutto per l'Anno
            const expandYearBtn = document.createElement('button');
            expandYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary', 'ml-2');
            expandYearBtn.innerHTML = '<i class="fas fa-plus-square"></i> Espandi Tutto';
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
            collapseYearBtn.innerHTML = '<i class="fas fa-minus-square"></i> Comprimi Tutto';
            collapseYearBtn.addEventListener('click', () => {
                $(`#collapse-${yearId} .collapse`).collapse('hide');
                $(`#collapse-${yearId}`).collapse('hide');
            });

            // Pulsante per Eliminare l'Anno
            const deleteYearBtn = document.createElement('button');
            deleteYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'ml-2');
            deleteYearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Anno';
            deleteYearBtn.addEventListener('click', () => {
                deleteYearTimers(clientName, year, yearSection);
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
                    const dayName = `${day}`;

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
                        '',
                        'Sito',
                        'Tipo di Lavoro',
                        'Durata',
                        'Orari',
                        'Link',
                        'Reportato',
                        'Azione'
                    ];

                    headers.forEach((headerText, index) => {
                        const th = document.createElement('th');
                        th.scope = 'col';
                        if (index === 0) {
                            th.innerHTML = '<i class="fas fa-check-double select-all-day-icon" style="cursor:pointer;"></i>';
                        } else {
                            th.textContent = headerText;
                        }
                        headerRow.appendChild(th);
                    });
                    
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    // Corpo della tabella
                    const tbody = document.createElement('tbody');
                    
                    const dayTimers = days[day];
                    
                    // Ordina i timer per orario di inizio decrescente
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
                    
                    // Event listener sull'icona per selezionare tutti i checkbox di quel giorno
                    const selectAllIcon = table.querySelector('.select-all-day-icon');
                    if (selectAllIcon) {
                        selectAllIcon.addEventListener('click', () => {
                            const checkboxes = table.querySelectorAll('.timer-checkbox');
                            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    
                            if (allChecked) {
                                checkboxes.forEach(cb => cb.checked = false);
                            } else {
                                checkboxes.forEach(cb => cb.checked = true);
                            }
                        });
                    }

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

function deleteYearTimers(clientName, year, yearSection) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: `Vuoi eliminare tutti i timer dell'anno ${year} per il cliente ${clientName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            // Recupera tutti i timer dell'anno specificato per il cliente
            db.collection('timeLogs')
                .where('uid', '==', currentUser.uid)
                .where('isDeleted', '==', false)
                .where('clientName', '==', clientName)
                .get()
                .then(snapshot => {
                    const batch = db.batch();
                    const timerIds = [];

                    snapshot.forEach(doc => {
                        const logData = doc.data();
                        const startTime = logData.startTime.toDate();
                        const timerYear = startTime.getFullYear();

                        if (timerYear === parseInt(year)) {
                            const timerRef = db.collection('timeLogs').doc(doc.id);
                            batch.update(timerRef, {
                                isDeleted: true,
                                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            timerIds.push(doc.id);
                        }
                    });

                    batch.commit().then(() => {
                        // Rimuovi la sezione dell'anno dall'interfaccia
                        yearSection.parentNode.removeChild(yearSection);

                        // Salva l'operazione per l'undo
                        lastOperation = {
                            action: 'deleteYear',
                            clientName: clientName,
                            year: year,
                            timerIds: timerIds,
                            yearSection: yearSection
                        };

                        Swal.fire({
                            icon: 'success',
                            title: 'Anno Eliminato',
                            text: `Tutti i timer dell'anno ${year} per il cliente ${clientName} sono stati eliminati.`,
                            confirmButtonText: 'OK'
                        });
                    }).catch(error => {
                        console.error('Errore durante l\'eliminazione dei timer dell\'anno:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Errore',
                            text: 'Si è verificato un errore durante l\'eliminazione dei timer.',
                            confirmButtonText: 'OK'
                        });
                    });
                }).catch(error => {
                    console.error('Errore durante il recupero dei timer dell\'anno:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Errore',
                        text: 'Si è verificato un errore durante il recupero dei timer.',
                        confirmButtonText: 'OK'
                    });
                });
        }
    });
}

// Funzione per caricare i clienti nel filtro
function loadClientsForFilter() {
    const filterClientSelect = document.getElementById('filter-client');
    return db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const clientData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = clientData.name;
                filterClientSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti per il filtro:', error);
        });
}

// Funzione per ottenere i filtri correnti
function getCurrentFilters() {
    const filterDateStart = document.getElementById('filter-date-start').value;
    const filterDateEnd = document.getElementById('filter-date-end').value;
    const filterClient = document.getElementById('filter-client').value;

    return {
        dateStart: filterDateStart,
        dateEnd: filterDateEnd,
        client: filterClient
    };
}