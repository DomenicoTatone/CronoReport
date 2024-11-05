// timer.js

// Variabili globali per i selettori e i timer
let clientSelect;
let siteSelect;
let worktypeSelect;
let linkInput;
let manualStartTimeInput;
let manualEndTimeInput;
let startTimerBtn;
let timerCardsContainer;

// Gestione dei timer attivi
let activeTimers = [];

// Template per la sezione Timer
// Template per la sezione Timer di Lavoro
const timerTemplate = `
<div id="timer-section" class="container mt-5">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Timer di Lavoro</h2>

    <div class="row">
        <!-- Selezione Cliente e Dettagli -->
        <div class="col-md-6">
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-user mr-2"></i>Seleziona Dettagli</h5>
                </div>
                <div class="card-body">
                    <!-- Seleziona Cliente -->
                    <div class="form-group">
                        <label for="client-select" class="font-weight-bold">Cliente:</label>
                        <select id="client-select" class="form-control">
                            <option value="">--Seleziona Cliente--</option>
                            <!-- Opzioni popolate dinamicamente -->
                        </select>
                    </div>
                    <!-- Seleziona Sito -->
                    <div class="form-group">
                        <label for="site-select" class="font-weight-bold">Sito:</label>
                        <select id="site-select" class="form-control">
                            <option value="">--Seleziona Sito--</option>
                            <!-- Opzioni popolate dinamicamente -->
                        </select>
                    </div>
                    <!-- Seleziona Tipo di Lavoro -->
                    <div class="form-group">
                        <label for="worktype-select" class="font-weight-bold">Tipo di Lavoro:</label>
                        <select id="worktype-select" class="form-control">
                            <option value="">--Seleziona Tipo di Lavoro--</option>
                            <!-- Opzioni popolate dinamicamente -->
                        </select>
                    </div>
                    <!-- Inserisci Link -->
                    <div class="form-group">
                        <label for="link-input" class="font-weight-bold">Link (opzionale):</label>
                        <input type="url" id="link-input" class="form-control" placeholder="https://esempio.com">
                    </div>
                </div>
            </div>
        </div>

        <!-- Impostazioni Timer -->
        <div class="col-md-6">
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fas fa-clock mr-2"></i>Impostazioni Timer</h5>
                </div>
                <div class="card-body">
                    <!-- Ora di Inizio -->
                    <div class="datetime-picker-container">
                        <div class="form-group">
                            <label for="manual-start-time" class="font-weight-bold">Ora di Inizio (opzionale):</label>
                            <div class="input-group date" id="manual-start-time-picker" data-target-input="nearest">
                                <input type="text" id="manual-start-time" class="form-control datetimepicker-input" data-target="#manual-start-time-picker"/>
                                <div class="input-group-append" data-target="#manual-start-time-picker" data-toggle="datetimepicker">
                                    <div class="input-group-text"><i class="far fa-calendar-alt"></i></div>
                                </div>
                            </div>
                        </div>
                        <!-- Ora di Fine -->
                        <div class="form-group">
                            <label for="manual-end-time" class="font-weight-bold">Ora di Fine (opzionale):</label>
                            <div class="input-group date" id="manual-end-time-picker" data-target-input="nearest">
                                <input type="text" id="manual-end-time" class="form-control datetimepicker-input" data-target="#manual-end-time-picker"/>
                                <div class="input-group-append" data-target="#manual-end-time-picker" data-toggle="datetimepicker">
                                    <div class="input-group-text"><i class="far fa-calendar-alt"></i></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Pulsante Avvia Timer -->
                    <button id="start-timer-btn" class="btn btn-success btn-block mt-4"><i class="fas fa-play mr-2"></i>Avvia Timer</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Sezione Timer Attivi -->
    <div id="active-timers" class="mt-5">
        <h2 class="mb-4 text-center text-uppercase font-weight-bold">Timer Attivi</h2>
        <div id="timer-cards" class="row">
            <!-- Le card dei timer attivi saranno aggiunte dinamicamente -->
        </div>
    </div>
</div>
`;


// Funzione per inizializzare gli eventi della sezione Timer
function initializeTimerEvents() {
    // Elementi DOM - assegnazione delle variabili
    clientSelect = document.getElementById('client-select');
    siteSelect = document.getElementById('site-select');
    worktypeSelect = document.getElementById('worktype-select');
    linkInput = document.getElementById('link-input');
    manualStartTimeInput = document.getElementById('manual-start-time');
    manualEndTimeInput = document.getElementById('manual-end-time');
    startTimerBtn = document.getElementById('start-timer-btn');
    timerCardsContainer = document.getElementById('timer-cards');

    $(function () {
        $('#manual-start-time-picker').datetimepicker({
            icons: {
                time: 'far fa-clock',
                date: 'far fa-calendar-alt',
                up: 'fas fa-chevron-up',
                down: 'fas fa-chevron-down',
                previous: 'fas fa-chevron-left',
                next: 'fas fa-chevron-right',
                today: 'far fa-calendar-check',
                clear: 'far fa-trash-alt',
                close: 'fas fa-times'
            },
            locale: 'it',
            format: 'DD/MM/YYYY HH:mm',
        });
        $('#manual-end-time-picker').datetimepicker({
            useCurrent: false,
            icons: {
                time: 'far fa-clock',
                date: 'far fa-calendar-alt',
                up: 'fas fa-chevron-up',
                down: 'fas fa-chevron-down',
                previous: 'fas fa-chevron-left',
                next: 'fas fa-chevron-right',
                today: 'far fa-calendar-check',
                clear: 'far fa-trash-alt',
                close: 'fas fa-times'
            },
            locale: 'it',
            format: 'DD/MM/YYYY HH:mm',
        });
        // Collegamento tra i due picker per evitare incongruenze nelle date
        $("#manual-start-time-picker").on("change.datetimepicker", function (e) {
            $('#manual-end-time-picker').datetimepicker('minDate', e.date);
        });
        $("#manual-end-time-picker").on("change.datetimepicker", function (e) {
            $('#manual-start-time-picker').datetimepicker('maxDate', e.date);
        });
    });

    // Carica i Clienti
    loadClients(clientSelect);

    // Aggiungi listener per quando il Cliente cambia, per aggiornare Siti e Tipi di Lavoro
    clientSelect.addEventListener('change', () => {
        const selectedClientId = clientSelect.value;
        if (selectedClientId) {
            loadSites(siteSelect, selectedClientId);
            loadWorktypes(worktypeSelect, selectedClientId);
        } else {
            siteSelect.innerHTML = '<option value="">--Seleziona Sito--</option>';
            worktypeSelect.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
        }
    });

    // Inizialmente, Siti e Tipi di Lavoro sono vuoti fino a quando non viene selezionato un Cliente
    siteSelect.innerHTML = '<option value="">--Seleziona Sito--</option>';
    worktypeSelect.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';

    // Aggiungi l'event listener per il pulsante "Avvia Timer"
    startTimerBtn.addEventListener('click', () => {
        const clientId = clientSelect.value;
        const siteId = siteSelect.value;
        const worktypeId = worktypeSelect.value;
        const link = linkInput.value.trim(); // Recupera il link

        // Recupera le date inserite
        const manualStartTimeValue = manualStartTimeInput.value;
        const manualEndTimeValue = manualEndTimeInput.value;

        if (clientId && siteId && worktypeId) {
            // Verifica se l'utente ha inserito l'ora di fine senza l'ora di inizio
            if (manualEndTimeValue && !manualStartTimeValue) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Attenzione',
                    text: 'Per inserire l\'ora di fine, devi prima specificare l\'ora di inizio.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Crea un nuovo timer
            createNewTimer(clientId, siteId, worktypeId, link, manualStartTimeValue, manualEndTimeValue);

            // Pulisci i campi dopo aver avviato il timer
            linkInput.value = '';
            manualStartTimeInput.value = '';
            manualEndTimeInput.value = '';
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Attenzione',
                text: 'Seleziona cliente, sito e tipo di lavoro.',
                confirmButtonText: 'OK'
            });
        }
    });

    // Carica i timer attivi da Firestore
    db.collection('timers')
        .where('uid', '==', currentUser.uid)
        .where('isActive', '==', true)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const timerData = doc.data();
                const timer = {
                    id: doc.id,
                    clientId: timerData.clientId,
                    siteId: timerData.siteId,
                    worktypeId: timerData.worktypeId,
                    clientName: timerData.clientName,
                    siteName: timerData.siteName,
                    worktypeName: timerData.worktypeName,
                    link: timerData.link || '',
                    accumulatedElapsedTime: timerData.accumulatedElapsedTime || 0,
                    lastStartTime: timerData.lastStartTime ? timerData.lastStartTime.toDate() : new Date(),
                    isPaused: timerData.isPaused || false,
                    intervalId: null,
                    timerDisplay: null
                };

                // Aggiungi il timer all'array dei timer attivi
                activeTimers.push(timer);

                // Crea la scheda per il timer
                const timerCard = createTimerCard(timer);

                // Aggiungi la scheda al container
                timerCardsContainer.appendChild(timerCard);

                // Se il timer non è in pausa, inizia l'aggiornamento
                if (!timer.isPaused) {
                    startTimer(timer);
                } else {
                    // Se il timer è in pausa, mostra il tempo accumulato
                    const totalElapsedTime = timer.accumulatedElapsedTime;
                    timer.timerDisplay.textContent = formatDuration(totalElapsedTime);
                }
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei timer attivi:', error);
        });
}

// Funzione per caricare i Clienti nel Dropdown del Timer
function loadClients(selectElement) {
    selectElement.innerHTML = '<option value="">--Seleziona Cliente--</option>';
    db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.data().name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti nel Timer:', error);
        });
}

// Funzione per analizzare la data e l'ora in formato locale con secondi
function parseLocalDateTime(s) {
    // Si aspetta una stringa nel formato 'DD/MM/YYYY HH:mm:ss'
    const [datePart, timePart] = s.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
}

// Funzione per creare un nuovo timer
function createNewTimer(clientId, siteId, worktypeId, link, manualStartTimeValue, manualEndTimeValue) {
    // Recupera i nomi dei campi selezionati
    const clientName = clientSelect.options[clientSelect.selectedIndex].text;
    const siteName = siteSelect.options[siteSelect.selectedIndex].text;
    const worktypeName = worktypeSelect.options[worktypeSelect.selectedIndex].text;

    // Parse delle date inserite utilizzando la nuova funzione
    const manualStartTime = manualStartTimeValue ? parseLocalDateTime(manualStartTimeValue) : null;
    const manualEndTime = manualEndTimeValue ? parseLocalDateTime(manualEndTimeValue) : null;

    // Aggiunta di console.log per debug
    console.log('manualStartTimeValue:', manualStartTimeValue);
    console.log('manualStartTime:', manualStartTime);
    console.log('manualEndTimeValue:', manualEndTimeValue);
    console.log('manualEndTime:', manualEndTime);

    if (manualStartTime && manualEndTime) {
        // **Caso 1:** L'utente ha specificato sia l'ora di inizio che di fine
        const durationInSeconds = (manualEndTime - manualStartTime) / 1000;
        console.log('Durata calcolata in secondi:', durationInSeconds);

        if (durationInSeconds <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'L\'ora di fine deve essere successiva all\'ora di inizio.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Salva direttamente il log nel database
        db.collection('timeLogs').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            startTime: firebase.firestore.Timestamp.fromDate(manualStartTime),
            endTime: firebase.firestore.Timestamp.fromDate(manualEndTime),
            duration: durationInSeconds,
            isReported: false, // Aggiungi questo campo se necessario
            isDeleted: false // **Aggiungi questo campo**
        }).then(() => {
            Swal.fire({
                icon: 'success',
                title: 'Timer Salvato',
                text: 'Il timer è stato registrato con successo.',
                confirmButtonText: 'OK'
            });
        }).catch(error => {
            console.error('Errore nel salvataggio del timer:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante il salvataggio del timer.',
                confirmButtonText: 'OK'
            });
        });

    } else if (manualStartTime && !manualEndTime) {
        // **Caso 2:** L'utente ha specificato solo l'ora di inizio
        const now = new Date();
        if (manualStartTime > now) {
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'L\'ora di inizio non può essere futura.',
                confirmButtonText: 'OK'
            });
            return;
        }

        // **Non calcolare accumulatedElapsedTime qui**
        // Invece, imposta accumulatedElapsedTime a zero
        const accumulatedElapsedTime = 0;

        // Crea un oggetto timer
        const timer = {
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: accumulatedElapsedTime,
            lastStartTime: manualStartTime, // Imposta lastStartTime a manualStartTime
            isPaused: false,
            intervalId: null,
            timerDisplay: null
        };

        // Salva il timer su Firestore
        db.collection('timers').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: timer.accumulatedElapsedTime,
            lastStartTime: firebase.firestore.Timestamp.fromDate(manualStartTime),
            isPaused: timer.isPaused,
            isActive: true
        }).then(docRef => {
            timer.id = docRef.id;
            activeTimers.push(timer);
            const timerCard = createTimerCard(timer);
            timerCardsContainer.appendChild(timerCard);
            startTimer(timer);
        }).catch(error => {
            console.error('Errore nel salvataggio del timer:', error);
        });

    } else {
        // **Caso 3:** Nessun orario manuale specificato, avvia un timer normale
        // Crea un oggetto timer
        const timer = {
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: 0,
            lastStartTime: new Date(),
            isPaused: false,
            intervalId: null,
            timerDisplay: null
        };

        // Salva il timer su Firestore
        db.collection('timers').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: timer.accumulatedElapsedTime,
            lastStartTime: firebase.firestore.FieldValue.serverTimestamp(),
            isPaused: timer.isPaused,
            isActive: true
        }).then(docRef => {
            timer.id = docRef.id;
            activeTimers.push(timer);
            const timerCard = createTimerCard(timer);
            timerCardsContainer.appendChild(timerCard);
            startTimer(timer);
        }).catch(error => {
            console.error('Errore nel salvataggio del timer:', error);
        });
    }
}

// Funzione per creare la scheda del timer
function createTimerCard(timer) {
    // Crea l'elemento colonna
    const col = document.createElement('div');
    col.classList.add('col-md-6', 'col-lg-4', 'mb-4');

    // Crea la card
    const card = document.createElement('div');
    card.classList.add('card', 'h-100', 'shadow-sm', 'timer-card');

    // Crea il corpo della card
    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body', 'd-flex', 'flex-column');

    // Header con nome cliente e sito
    const cardHeader = document.createElement('div');
    cardHeader.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-3');

    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title', 'mb-0');
    cardTitle.textContent = timer.clientName;

    const cardSubtitle = document.createElement('small');
    cardSubtitle.classList.add('text-muted');
    cardSubtitle.textContent = timer.siteName;

    cardHeader.appendChild(cardTitle);
    cardHeader.appendChild(cardSubtitle);

    // Badge per il tipo di lavoro
    const worktypeBadge = document.createElement('span');
    worktypeBadge.classList.add('badge', 'badge-primary', 'mb-2');
    worktypeBadge.textContent = timer.worktypeName;

    // Display del timer
    const timerDisplay = document.createElement('h4');
    timerDisplay.classList.add('timer-display', 'mb-3');
    timerDisplay.textContent = '00h 00m 00s';

    // Sezione link (se presente)
    const linkElement = document.createElement('p');
    linkElement.classList.add('card-text');
    if (timer.link) {
        const linkAnchor = document.createElement('a');
        linkAnchor.href = timer.link;
        linkAnchor.target = '_blank';
        linkAnchor.textContent = 'Apri Link';
        linkAnchor.classList.add('btn', 'btn-link', 'p-0');
        linkElement.appendChild(linkAnchor);
    }

    // Gruppo di pulsanti
    const buttonGroup = document.createElement('div');
    buttonGroup.classList.add('btn-group', 'mt-auto');

    const pauseBtn = document.createElement('button');
    pauseBtn.classList.add('btn', 'btn-warning');
    pauseBtn.textContent = 'Pausa';

    const resumeBtn = document.createElement('button');
    resumeBtn.classList.add('btn', 'btn-success');
    resumeBtn.textContent = 'Riprendi';
    resumeBtn.style.display = timer.isPaused ? 'inline-block' : 'none';

    const stopBtn = document.createElement('button');
    stopBtn.classList.add('btn', 'btn-danger');
    stopBtn.textContent = 'Stop';

    // Event listeners per i pulsanti
    pauseBtn.addEventListener('click', () => {
        pauseTimer(timer);
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'inline-block';
    });

    resumeBtn.addEventListener('click', () => {
        resumeTimer(timer);
        pauseBtn.style.display = 'inline-block';
        resumeBtn.style.display = 'none';
    });

    stopBtn.addEventListener('click', () => {
        stopTimer(timer, col);
    });

    buttonGroup.appendChild(pauseBtn);
    buttonGroup.appendChild(resumeBtn);
    buttonGroup.appendChild(stopBtn);

    // Assembla la card
    cardBody.appendChild(cardHeader);
    cardBody.appendChild(worktypeBadge);
    cardBody.appendChild(timerDisplay);
    if (timer.link) {
        cardBody.appendChild(linkElement);
    }
    cardBody.appendChild(buttonGroup);

    card.appendChild(cardBody);
    col.appendChild(card);

    // Aggiungi riferimento alla visualizzazione del timer nell'oggetto timer
    timer.timerDisplay = timerDisplay;

    return col;
}

// Funzione per avviare il timer
function startTimer(timer) {
    timer.intervalId = setInterval(() => {
        if (!timer.isPaused) {
            const now = new Date();
            const totalElapsedTime = (now - timer.lastStartTime) / 1000 + timer.accumulatedElapsedTime;
            timer.timerDisplay.textContent = formatDuration(totalElapsedTime);
        }
    }, 1000);
}

// Funzione per mettere in pausa il timer
function pauseTimer(timer) {
    clearInterval(timer.intervalId);
    timer.isPaused = true;
    const now = new Date();
    const elapsedSinceLastStart = (now - timer.lastStartTime) / 1000;
    timer.accumulatedElapsedTime += elapsedSinceLastStart;

    // Aggiorna il timer su Firestore
    db.collection('timers').doc(timer.id).update({
        isPaused: true,
        accumulatedElapsedTime: timer.accumulatedElapsedTime,
        lastStartTime: firebase.firestore.Timestamp.fromDate(timer.lastStartTime)
    }).catch(error => {
        console.error('Errore nell\'aggiornamento del timer (pausa):', error);
    });
}

// Funzione per riprendere il timer
function resumeTimer(timer) {
    timer.isPaused = false;
    timer.lastStartTime = new Date();
    startTimer(timer);

    // Aggiorna il timer su Firestore
    db.collection('timers').doc(timer.id).update({
        isPaused: false,
        lastStartTime: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(error => {
        console.error('Errore nell\'aggiornamento del timer (riprendi):', error);
    });
}

// Funzione per fermare il timer
function stopTimer(timer, card) {
    clearInterval(timer.intervalId);

    const now = new Date();
    let totalElapsedTime = timer.accumulatedElapsedTime;

    if (!timer.isPaused) {
        const elapsedSinceLastStart = (now - timer.lastStartTime) / 1000;
        totalElapsedTime += elapsedSinceLastStart;
    }

    // Se il timer ha un'ora di inizio manuale, usala; altrimenti usa lastStartTime
    const startTime = timer.lastStartTime;

    // Aggiungi console.log per verificare le date e la durata
    console.log('startTime:', startTime);
    console.log('endTime:', now);
    console.log('Total Elapsed Time (secondi):', totalElapsedTime);

    // Salva il log del tempo nel database, includendo i nomi e il link
    db.collection('timeLogs').add({
        uid: currentUser.uid,
        clientId: timer.clientId,
        siteId: timer.siteId,
        worktypeId: timer.worktypeId,
        clientName: timer.clientName,
        siteName: timer.siteName,
        worktypeName: timer.worktypeName,
        link: timer.link,
        startTime: firebase.firestore.Timestamp.fromDate(startTime),
        endTime: firebase.firestore.Timestamp.fromDate(now),
        duration: totalElapsedTime,
        isReported: false, // Aggiungi questo campo se necessario
        isDeleted: false // **Aggiungi questo campo**
    }).then(() => {
        // Aggiorna il timer su Firestore per indicare che non è più attivo
        db.collection('timers').doc(timer.id).update({
            isActive: false,
            endTime: firebase.firestore.FieldValue.serverTimestamp(),
            totalElapsedTime: totalElapsedTime
        }).then(() => {
            // Rimuovi il timer dall'array dei timer attivi
            const index = activeTimers.indexOf(timer);
            if (index > -1) {
                activeTimers.splice(index, 1);
            }

            // Rimuovi la scheda dal DOM
            card.remove();

            Swal.fire({
                icon: 'success',
                title: 'Timer Salvato',
                text: 'Il tempo è stato registrato con successo.',
                confirmButtonText: 'OK'
            });
        }).catch(error => {
            console.error('Errore nell\'aggiornamento del timer:', error);
        });
    }).catch(error => {
        console.error('Errore nell\'aggiunta del log del tempo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il salvataggio del tempo.',
            confirmButtonText: 'OK'
        });
    });
}

// Inserimento del template nel DOM
const timerDiv = document.createElement('div');
timerDiv.id = 'timer-template';
timerDiv.style.display = 'none';
timerDiv.innerHTML = timerTemplate;
document.body.appendChild(timerDiv);
