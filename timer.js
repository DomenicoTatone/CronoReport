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
const timerTemplate = `
<div id="timer-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-clock mr-2"></i>Timer di Lavoro
    </h2>

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
                        </select>
                    </div>
                    <!-- Seleziona Sito -->
                    <div class="form-group">
                        <label for="site-select" class="font-weight-bold">Sito:</label>
                        <select id="site-select" class="form-control">
                            <option value="">--Seleziona Sito--</option>
                        </select>
                    </div>
                    <!-- Seleziona Tipo di Lavoro -->
                    <div class="form-group">
                        <label for="worktype-select" class="font-weight-bold">Tipo di Lavoro:</label>
                        <select id="worktype-select" class="form-control">
                            <option value="">--Seleziona Tipo di Lavoro--</option>
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
                    <div class="form-group">
                        <label for="manual-start-time" class="font-weight-bold">Ora di Inizio (opzionale):</label>
                        <input type="text" id="manual-start-time" class="form-control" placeholder="DD/MM/YYYY HH:mm:ss" />
                    </div>
                    <!-- Ora di Fine -->
                    <div class="form-group">
                        <label for="manual-end-time" class="font-weight-bold">Ora di Fine (opzionale):</label>
                        <input type="text" id="manual-end-time" class="form-control" placeholder="DD/MM/YYYY HH:mm:ss" />
                    </div>
                    <!-- Pulsante Avvia Timer -->
                    <button id="start-timer-btn" class="btn btn-success btn-block mt-4"><i class="fas fa-play mr-2"></i>Avvia Timer</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Sezione Timer Attivi -->
    <div id="active-timers" class="mt-5">
    <h2 class="mb-4 text-center text-uppercase font-weight-bold">
        <i class="fas fa-play-circle mr-2"></i>Timer Attivi
    </h2>
        <div id="timer-cards" class="row">
            <!-- Le card dei timer attivi saranno aggiunte dinamicamente -->
        </div>
    </div>
</div>

<!-- Modale per modificare il timer -->
<div class="modal fade" id="edit-timer-modal" tabindex="-1" role="dialog" aria-labelledby="editTimerModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title" id="editTimerModalLabel">Modifica Timer</h5>
        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Chiudi">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form id="edit-timer-form">
          <input type="hidden" id="edit-timer-id">
          <div class="form-group">
            <label for="edit-client-select" class="font-weight-bold">Cliente:</label>
            <select id="edit-client-select" class="form-control"></select>
          </div>
          <div class="form-group">
            <label for="edit-site-select" class="font-weight-bold">Sito:</label>
            <select id="edit-site-select" class="form-control"></select>
          </div>
          <div class="form-group">
            <label for="edit-worktype-select" class="font-weight-bold">Tipo di Lavoro:</label>
            <select id="edit-worktype-select" class="form-control"></select>
          </div>
          <div class="form-group">
            <label for="edit-link-input" class="font-weight-bold">Link (opzionale):</label>
            <input type="url" id="edit-link-input" class="form-control" placeholder="https://esempio.com">
          </div>
          <div class="form-group">
            <label for="edit-accumulated-time" class="font-weight-bold">Tempo accumulato (hh:mm:ss):</label>
            <input type="text" id="edit-accumulated-time" class="form-control" placeholder="Es: 01:23:45">
            <small class="form-text text-muted">Inserisci il tempo nel formato hh:mm:ss</small>
          </div>
          <div class="form-group">
            <label for="edit-start-time" class="font-weight-bold">Data/Ora Inizio:</label>
            <input type="text" id="edit-start-time" class="form-control" placeholder="DD/MM/YYYY HH:mm:ss">
          </div>
          <div class="form-group">
            <label for="edit-end-time" class="font-weight-bold">Data/Ora Fine (opzionale):</label>
            <input type="text" id="edit-end-time" class="form-control" placeholder="DD/MM/YYYY HH:mm:ss">
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" id="delete-timer-btn">Elimina Timer</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Annulla</button>
        <button type="button" class="btn btn-primary" id="save-timer-changes-btn">Salva Modifiche</button>
      </div>
    </div>
  </div>
</div>
`;

// Funzione per inizializzare gli eventi della sezione Timer
async function initializeTimerEvents() {
    if (!currentUser) {
        console.error("Utente non autenticato: currentUser è null in initializeTimerEvents.");
        return; 
    }
    
    const timerDiv = document.createElement('div');
    timerDiv.id = 'timer-template';
    timerDiv.style.display = 'none';
    timerDiv.innerHTML = timerTemplate;
    document.body.appendChild(timerDiv);
    
    // Inizializza qui flatpickr per i campi della modale, UNA VOLTA SOLA
    flatpickr('#edit-start-time', {
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i:S",
        locale: "it"
    });
    
    flatpickr('#edit-end-time', {
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i:S",
        locale: "it"
    });

    clientSelect = document.getElementById('client-select');
    siteSelect = document.getElementById('site-select');
    worktypeSelect = document.getElementById('worktype-select');
    linkInput = document.getElementById('link-input');
    manualStartTimeInput = document.getElementById('manual-start-time');
    manualEndTimeInput = document.getElementById('manual-end-time');
    startTimerBtn = document.getElementById('start-timer-btn');
    timerCardsContainer = document.getElementById('timer-cards');

    const manualStartTimePicker = flatpickr(manualStartTimeInput, {
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i:S",
        locale: "it"
    });

    const manualEndTimePicker = flatpickr(manualEndTimeInput, {
        enableTime: true,
        enableSeconds: true,
        time_24hr: true,
        dateFormat: "d/m/Y H:i:S",
        locale: "it"
    });

    loadTimerClientDropdown(clientSelect);

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

    startTimerBtn.addEventListener('click', () => {
        const clientId = clientSelect.value;
        const siteId = siteSelect.value;
        const worktypeId = worktypeSelect.value;
        const link = linkInput.value.trim();

        const manualStartTimeValue = manualStartTimeInput.value;
        const manualEndTimeValue = manualEndTimeInput.value;

        if (clientId && siteId && worktypeId) {
            if (manualEndTimeValue && !manualStartTimeValue) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Attenzione',
                    text: 'Per inserire l\'ora di fine, devi prima specificare l\'ora di inizio.',
                    confirmButtonText: 'OK'
                });
                return;
            }

            createNewTimer(clientId, siteId, worktypeId, link, manualStartTimeValue, manualEndTimeValue);
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

    // Carica i timer attivi
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
                    endTime: timerData.endTime ? timerData.endTime.toDate() : null,
                    isPaused: timerData.isPaused || false,
                    intervalId: null,
                    timerDisplay: null,
                    hourlyRate: timerData.hourlyRate || 0
                };

                activeTimers.push(timer);
                const timerCard = createTimerCard(timer);
                timerCardsContainer.appendChild(timerCard);

                if (!timer.isPaused) {
                    startTimer(timer);
                } else {
                    const totalElapsedTime = timer.accumulatedElapsedTime;
                    timer.timerDisplay.textContent = formatDuration(totalElapsedTime);
                }
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei timer attivi:', error);
        });

    initializeEditModalEvents();
}

// Funzione per caricare i Clienti nel Dropdown del Timer
function loadTimerClientDropdown(selectElement) {
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

// Funzione per caricare i Siti nel Dropdown del Timer
function loadSites(selectElement, clientId) {
    selectElement.innerHTML = '<option value="">--Seleziona Sito--</option>';
    db.collection('sites')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', clientId)
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
            console.error('Errore nel caricamento dei siti nel Timer:', error);
        });
}

// Funzione per caricare i Tipi di Lavoro nel Dropdown del Timer
function loadWorktypes(selectElement, clientId) {
    selectElement.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
    db.collection('worktypes')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', clientId)
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
            console.error('Errore nel caricamento dei tipi di lavoro nel Timer:', error);
        });
}

// Funzione per analizzare la data e l'ora in formato locale con secondi
function parseLocalDateTime(s) {
    const [datePart, timePart] = s.split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    if (
        isNaN(day) || isNaN(month) || isNaN(year) ||
        isNaN(hour) || isNaN(minute) || isNaN(second)
    ) {
        return null;
    }
    return new Date(year, month - 1, day, hour, minute, second);
}

// Funzione per recuperare hourlyRate dal report configuration
async function getHourlyRate() {
    try {
        const snapshot = await db.collection('reportConfigs')
            .where('uid', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const config = snapshot.docs[0].data();
            return typeof config.hourlyRate === 'number' ? config.hourlyRate : 0;
        }
        return 0;
    } catch (error) {
        console.error('Errore nel recuperare hourlyRate:', error);
        return 0;
    }
}

// Funzione per creare un nuovo timer
async function createNewTimer(clientId, siteId, worktypeId, link, manualStartTimeValue, manualEndTimeValue) {
    const clientName = clientSelect.options[clientSelect.selectedIndex].text;
    const siteName = siteSelect.options[siteSelect.selectedIndex].text;
    const worktypeName = worktypeSelect.options[worktypeSelect.selectedIndex].text;

    let hourlyRate = 0;
    try {
        const worktypeDoc = await db.collection('worktypes').doc(worktypeId).get();
        if (worktypeDoc.exists) {
            hourlyRate = worktypeDoc.data().hourlyRate || 0;
        }
    } catch (error) {
        console.error('Errore nel recuperare la tariffa oraria del tipo di lavoro:', error);
    }
    
    const manualStartTime = manualStartTimeValue ? parseLocalDateTime(manualStartTimeValue) : null;
    const manualEndTime = manualEndTimeValue ? parseLocalDateTime(manualEndTimeValue) : null;

    if (manualStartTimeValue && !manualStartTime) {
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'L\'ora di inizio inserita non è valida.',
            confirmButtonText: 'OK'
        });
        return;
    }
    if (manualEndTimeValue && !manualEndTime) {
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'L\'ora di fine inserita non è valida.',
            confirmButtonText: 'OK'
        });
        return;
    }

    if (manualStartTime && manualEndTime) {
        const durationInSeconds = (manualEndTime - manualStartTime) / 1000;
        if (durationInSeconds <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'L\'ora di fine deve essere successiva all\'ora di inizio.',
                confirmButtonText: 'OK'
            });
            return;
        }

        let hourlyRate = await getHourlyRate();

        db.collection('timeLogs').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link || '',
            startTime: firebase.firestore.Timestamp.fromDate(manualStartTime),
            endTime: firebase.firestore.Timestamp.fromDate(manualEndTime),
            duration: durationInSeconds,
            isReported: false,
            isDeleted: false,
            hourlyRate: hourlyRate
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

        const accumulatedElapsedTime = 0;
        let hourlyRate = await getHourlyRate();

        const timer = {
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: accumulatedElapsedTime,
            lastStartTime: manualStartTime,
            isPaused: false,
            intervalId: null,
            timerDisplay: null,
            hourlyRate: hourlyRate
        };

        db.collection('timers').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link || '',
            accumulatedElapsedTime: timer.accumulatedElapsedTime,
            lastStartTime: firebase.firestore.Timestamp.fromDate(manualStartTime),
            isPaused: timer.isPaused,
            isActive: true,
            hourlyRate: hourlyRate
        }).then(docRef => {
            timer.id = docRef.id;
            activeTimers.push(timer);
            const timerCard = createTimerCard(timer);
            timerCardsContainer.appendChild(timerCard);
            startTimer(timer);
        }).catch(error => {
            console.error('Errore nel salvataggio del timer:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante il salvataggio del timer.',
                confirmButtonText: 'OK'
            });
        });

    } else {
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
            timerDisplay: null,
            hourlyRate: await getHourlyRate()
        };

        let hourlyRate = timer.hourlyRate;
        if (typeof hourlyRate !== 'number') {
            hourlyRate = 0;
            timer.hourlyRate = 0;
        }

        db.collection('timers').add({
            uid: currentUser.uid,
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link || '',
            accumulatedElapsedTime: timer.accumulatedElapsedTime,
            lastStartTime: firebase.firestore.FieldValue.serverTimestamp(),
            isPaused: timer.isPaused,
            isActive: true,
            hourlyRate: hourlyRate
        }).then(docRef => {
            timer.id = docRef.id;
            activeTimers.push(timer);
            const timerCard = createTimerCard(timer);
            timerCardsContainer.appendChild(timerCard);
            startTimer(timer);
        }).catch(error => {
            console.error('Errore nel salvataggio del timer:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante il salvataggio del timer.',
                confirmButtonText: 'OK'
            });
        });
    }
}

function initializeEditModalEvents() {
    const saveChangesBtn = document.getElementById('save-timer-changes-btn');
    const deleteTimerBtn = document.getElementById('delete-timer-btn');

    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            saveTimerChanges();
        });
    }

    if (deleteTimerBtn) {
        deleteTimerBtn.addEventListener('click', () => {
            deleteTimerFromModal();
        });
    }
}

// Funzione per aprire la modale di modifica timer
function openEditTimerModal(timer) {
    document.getElementById('edit-timer-id').value = timer.id;

    const clientSelect = document.getElementById('edit-client-select');
    const siteSelect = document.getElementById('edit-site-select');
    const worktypeSelect = document.getElementById('edit-worktype-select');

    // Carichiamo i dropdown con i valori attuali
    loadAllClientsForEditSelect(clientSelect, timer.clientId)
        .then(() => loadAllSitesForEditSelect(siteSelect, timer.clientId, timer.siteId))
        .then(() => loadAllWorktypesForEditSelect(worktypeSelect, timer.clientId, timer.worktypeId))
        .catch(error => console.error('Errore nel caricamento dati per la modale di modifica:', error));

    // Ogni volta che cambia il cliente, ricarichiamo siti e worktypes
    clientSelect.addEventListener('change', () => {
        const newClientId = clientSelect.value;
        if (newClientId) {
            loadAllSitesForEditSelect(siteSelect, newClientId, '')
                .then(() => loadAllWorktypesForEditSelect(worktypeSelect, newClientId, ''))
                .catch(error => console.error("Errore durante l'aggiornamento di siti e tipi di lavoro:", error));
        } else {
            siteSelect.innerHTML = '<option value="">--Seleziona Sito--</option>';
            worktypeSelect.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
        }
    });

    document.getElementById('edit-link-input').value = timer.link || '';
    document.getElementById('edit-accumulated-time').value = secondsToHHMMSS(timer.accumulatedElapsedTime || 0);

    const startStr = timer.lastStartTime ? formatLocalDateTime(timer.lastStartTime) : '';
    document.getElementById('edit-start-time').value = startStr;

    if (timer.endTime) {
        document.getElementById('edit-end-time').value = formatLocalDateTime(timer.endTime);
    } else {
        document.getElementById('edit-end-time').value = '';
    }

    $('#edit-timer-modal').modal('show');
}

// Funzione per convertire secondi in hh:mm:ss
function secondsToHHMMSS(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
}

// Funzione per convertire hh:mm:ss in secondi
function hhmmssToSeconds(hhmmss) {
    const parts = hhmmss.split(':');
    if (parts.length !== 3) return NaN;
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseInt(parts[2]);
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return NaN;
    return hours * 3600 + minutes * 60 + seconds;
}

// Funzione per formattare una durata in secondi nel formato hh:mm:ss
function formatDuration(seconds) {
    return secondsToHHMMSS(seconds);
}

function formatLocalDateTime(date) {
    const dd = String(date.getDate()).padStart(2,'0');
    const mm = String(date.getMonth()+1).padStart(2,'0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2,'0');
    const min = String(date.getMinutes()).padStart(2,'0');
    const ss = String(date.getSeconds()).padStart(2,'0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
}

// Carica tutti i clienti per la modale di modifica
function loadAllClientsForEditSelect(selectElement, selectedClientId) {
    return db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            selectElement.innerHTML = '';
            snapshot.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().name;
                selectElement.appendChild(opt);
            });
            if (selectedClientId) {
                selectElement.value = selectedClientId;
            }
        });
}

// Carica tutti i siti per il cliente selezionato
function loadAllSitesForEditSelect(selectElement, clientId, selectedSiteId) {
    selectElement.innerHTML = '<option value="">--Seleziona Sito--</option>';
    return db.collection('sites')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', clientId)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().name;
                selectElement.appendChild(opt);
            });
            if (selectedSiteId) {
                selectElement.value = selectedSiteId;
            }
        });
}

// Carica tutti i tipi di lavoro per il cliente selezionato
function loadAllWorktypesForEditSelect(selectElement, clientId, selectedWorktypeId) {
    selectElement.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
    return db.collection('worktypes')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', clientId)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = doc.data().name;
                selectElement.appendChild(opt);
            });
            if (selectedWorktypeId) {
                selectElement.value = selectedWorktypeId;
            }
        });
}

// Salvataggio modifiche timer
document.addEventListener('DOMContentLoaded', () => {
    const saveChangesBtn = document.getElementById('save-timer-changes-btn');
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            saveTimerChanges();
        });
    }
});

function deleteTimerFromModal() {
    const timerId = document.getElementById('edit-timer-id').value;
    if (!timerId) return;

    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Vuoi eliminare questo timer?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection('timers').doc(timerId).delete()
                .then(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminato!',
                        text: 'Il timer è stato eliminato con successo.',
                        confirmButtonText: 'OK'
                    });
                    $('#edit-timer-modal').modal('hide');

                    const index = activeTimers.findIndex(t => t.id === timerId);
                    if (index > -1) {
                        activeTimers.splice(index, 1);
                    }
                    const oldCard = document.querySelector(`.timer-card[data-timer-id="${timerId}"]`);
                    if (oldCard) {
                        oldCard.parentElement.remove();
                    }
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

function saveTimerChanges() {
    const timerId = document.getElementById('edit-timer-id').value;
    const clientId = document.getElementById('edit-client-select').value;
    const siteId = document.getElementById('edit-site-select').value;
    const worktypeId = document.getElementById('edit-worktype-select').value;
    const link = document.getElementById('edit-link-input').value.trim();
    const accumulatedTimeStr = document.getElementById('edit-accumulated-time').value.trim();
    const startTimeStr = document.getElementById('edit-start-time').value.trim();
    const endTimeStr = document.getElementById('edit-end-time').value.trim();

    const accumulatedSeconds = hhmmssToSeconds(accumulatedTimeStr);
    if (isNaN(accumulatedSeconds)) {
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Il tempo accumulato inserito non è valido. Usa il formato hh:mm:ss.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const newStartTime = startTimeStr ? parseLocalDateTime(startTimeStr) : null;
    if (startTimeStr && !newStartTime) {
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'La data/ora di inizio non è valida.',
            confirmButtonText: 'OK'
        });
        return;
    }

    let newEndTime = null;
    if (endTimeStr) {
        newEndTime = parseLocalDateTime(endTimeStr);
        if (!newEndTime) {
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'La data/ora di fine non è valida.',
                confirmButtonText: 'OK'
            });
            return;
        }
    }

    Promise.all([
        db.collection('clients').doc(clientId).get(),
        db.collection('sites').doc(siteId).get(),
        db.collection('worktypes').doc(worktypeId).get()
    ]).then(results => {
        const clientDoc = results[0];
        const siteDoc = results[1];
        const worktypeDoc = results[2];

        const clientName = clientDoc.exists ? clientDoc.data().name : 'Sconosciuto';
        const siteName = siteDoc.exists ? siteDoc.data().name : 'Sconosciuto';
        let worktypeName = 'Sconosciuto';
        let hourlyRate = 0;
        if (worktypeDoc.exists) {
            worktypeName = worktypeDoc.data().name || 'Sconosciuto';
            hourlyRate = worktypeDoc.data().hourlyRate || 0;
        }

        const updateData = {
            clientId: clientId,
            siteId: siteId,
            worktypeId: worktypeId,
            clientName: clientName,
            siteName: siteName,
            worktypeName: worktypeName,
            link: link,
            accumulatedElapsedTime: accumulatedSeconds, // Sovrascrive il valore precedente
            hourlyRate: hourlyRate
        };

        if (newStartTime) {
            updateData.lastStartTime = firebase.firestore.Timestamp.fromDate(newStartTime);
        }

        if (newEndTime) {
            // Abbiamo endTime e startTime, dunque il timer va chiuso
            if (newStartTime) {
                const totalElapsedTime = (newEndTime - newStartTime) / 1000;
                const timeLogData = {
                    uid: currentUser.uid,
                    clientId: clientId,
                    siteId: siteId,
                    worktypeId: worktypeId,
                    clientName: clientName,
                    siteName: siteName,
                    worktypeName: worktypeName,
                    link: link || '',
                    startTime: firebase.firestore.Timestamp.fromDate(newStartTime),
                    endTime: firebase.firestore.Timestamp.fromDate(newEndTime),
                    duration: totalElapsedTime,
                    isReported: false,
                    isDeleted: false,
                    hourlyRate: hourlyRate
                };

                return db.collection('timeLogs').add(timeLogData)
                    .then(() => {
                        updateData.isActive = false;
                        updateData.endTime = firebase.firestore.Timestamp.fromDate(newEndTime);
                        return db.collection('timers').doc(timerId).update(updateData);
                    })
                    .then(() => {
                        Swal.fire({
                            icon: 'success',
                            title: 'Modifiche Salvate',
                            text: 'Il timer è stato aggiornato con successo e segnato come concluso.',
                            confirmButtonText: 'OK'
                        });
                        $('#edit-timer-modal').modal('hide');

                        const timer = activeTimers.find(t => t.id === timerId);
                        if (timer) {
                            const index = activeTimers.indexOf(timer);
                            if (index > -1) {
                                activeTimers.splice(index, 1);
                            }
                            const oldCard = document.querySelector(`.timer-card[data-timer-id="${timer.id}"]`);
                            if (oldCard) {
                                oldCard.parentElement.remove();
                            }
                        }
                    });
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Attenzione',
                    text: 'Per impostare una data/ora di fine devi prima specificare una data/ora di inizio.',
                    confirmButtonText: 'OK'
                });
                return Promise.reject('No start time set');
            }
        } else {
            // Nessuna endTime, solo aggiornamento dei dati del timer
            updateData.endTime = firebase.firestore.FieldValue.delete();

            return db.collection('timers').doc(timerId).update(updateData).then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Modifiche Salvate',
                    text: 'Il timer è stato aggiornato con successo.',
                    confirmButtonText: 'OK'
                });
                $('#edit-timer-modal').modal('hide');

                const timer = activeTimers.find(t => t.id === timerId);
                if (timer) {
                    timer.clientId = clientId;
                    timer.siteId = siteId;
                    timer.worktypeId = worktypeId;
                    timer.clientName = clientName;
                    timer.siteName = siteName;
                    timer.worktypeName = worktypeName;
                    timer.link = link;
                    timer.accumulatedElapsedTime = accumulatedSeconds;
                    timer.hourlyRate = parseFloat(hourlyRate);

                    // Se il timer non è in pausa, aggiorna lastStartTime nel database per evitare somme errate dopo il reload
                    if (!timer.isPaused) {
                        // Imposta lastStartTime al tempo attuale nel DB
                        return db.collection('timers').doc(timerId).update({
                            lastStartTime: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            // Aggiorna anche la logica locale
                            timer.lastStartTime = new Date();

                            const oldCard = document.querySelector(`.timer-card[data-timer-id="${timer.id}"]`);
                            if (oldCard) {
                                oldCard.parentElement.remove();
                            }

                            const newCard = createTimerCard(timer);
                            document.getElementById('timer-cards').appendChild(newCard);

                            // Riavvia il conteggio dal nuovo accumulato
                            clearInterval(timer.intervalId);
                            startTimer(timer);
                        });
                    } else {
                        const oldCard = document.querySelector(`.timer-card[data-timer-id="${timer.id}"]`);
                        if (oldCard) {
                            oldCard.parentElement.remove();
                        }

                        const newCard = createTimerCard(timer);
                        document.getElementById('timer-cards').appendChild(newCard);
                    }
                }
            });
        }
    }).catch(error => {
        console.error('Errore nel salvataggio delle modifiche del timer:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il salvataggio delle modifiche.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per creare la scheda del timer
function createTimerCard(timer) {
    // Crea l'elemento colonna
    const col = document.createElement('div');
    col.classList.add('col-md-6', 'col-lg-4', 'mb-4');

    // Crea la card
    const card = document.createElement('div');
    card.classList.add('card', 'h-100', 'shadow-sm', 'timer-card');
    card.setAttribute('data-timer-id', timer.id);

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
    timerDisplay.textContent = formatDuration(timer.accumulatedElapsedTime);

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

    const editBtn = document.createElement('button');
    editBtn.classList.add('btn', 'btn-info');
    editBtn.textContent = 'Modifica';

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

    editBtn.addEventListener('click', () => {
        openEditTimerModal(timer);
    });

    buttonGroup.appendChild(pauseBtn);
    buttonGroup.appendChild(resumeBtn);
    buttonGroup.appendChild(stopBtn);
    buttonGroup.appendChild(editBtn);

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
    const timeLogData = {
        uid: currentUser.uid,
        clientId: timer.clientId,
        siteId: timer.siteId,
        worktypeId: timer.worktypeId,
        clientName: timer.clientName,
        siteName: timer.siteName,
        worktypeName: timer.worktypeName,
        link: timer.link || '',
        startTime: firebase.firestore.Timestamp.fromDate(startTime),
        endTime: firebase.firestore.Timestamp.fromDate(now),
        duration: totalElapsedTime,
        isReported: false,
        isDeleted: false,
        hourlyRate: typeof timer.hourlyRate === 'number' ? timer.hourlyRate : 0 // Assicurati che hourlyRate sia definito
    };

    // Controlla se `hourlyRate` è definito
    if (typeof timeLogData.hourlyRate !== 'number') {
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'La tariffa oraria non è valida.',
            confirmButtonText: 'OK'
        });
        return;
    }

    db.collection('timeLogs').add(timeLogData)
        .then(() => {
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