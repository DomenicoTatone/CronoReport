// savedTimersUI.js

// Template per la sezione Timer Salvati
const savedTimersTemplate = `
<div id="saved-timers-section" class="container mt-5">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Timer Salvati</h2>

    <!-- Sezione Filtri -->
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="fas fa-filter mr-2"></i>Filtri</h5>
        </div>
        <div class="card-body">
            <form id="filter-form" class="row">
                <div class="col-md-3">
                    <label for="filter-date-start" class="font-weight-bold">Data Inizio:</label>
                    <input type="date" id="filter-date-start" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="filter-date-end" class="font-weight-bold">Data Fine:</label>
                    <input type="date" id="filter-date-end" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="filter-client" class="font-weight-bold">Cliente:</label>
                    <select id="filter-client" class="form-control">
                        <option value="">Tutti i Clienti</option>
                    </select>
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button id="filter-timers-btn" type="button" class="btn btn-primary btn-block mt-2"><i class="fas fa-search mr-2"></i>Filtra Timer</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Sezione Azioni -->
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-secondary text-white">
            <h5 class="mb-0"><i class="fas fa-tools mr-2"></i>Azioni</h5>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-6">
                    <label for="unmark-action-select" class="font-weight-bold">Seleziona Azione:</label>
                    <select id="unmark-action-select" class="form-control">
                        <option value="">-- Seleziona Azione --</option>
                        <option value="unmark-all">Rimuovi Contrassegno a Tutti i Timer</option>
                        <option value="unmark-selected">Rimuovi Contrassegno ai Timer Selezionati</option>
                        <option value="unmark-filtered">Rimuovi Contrassegno ai Timer Filtrati</option>
                    </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                    <button id="apply-action-btn" class="btn btn-success btn-block mt-2"><i class="fas fa-check mr-2"></i>Applica</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Pulsante Annulla Ultima Operazione -->
    <div class="text-right mb-4">
        <button id="undo-action-btn" class="btn btn-outline-secondary"><i class="fas fa-undo mr-2"></i>Annulla Ultima Operazione</button>
    </div>

    <!-- Lista Timer Salvati -->
    <div id="savedTimersAccordion" class="accordion">
        <!-- Timer salvati saranno inseriti qui -->
    </div>
</div>

<!-- Sezione Cestino -->
<div id="recycle-bin-section" class="container mt-5" style="display: none;">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Cestino</h2>
    <!-- Lista Timer nel Cestino -->
    <div id="recycle-bin-list" class="table-responsive">
        <!-- Timer nel cestino saranno inseriti qui -->
    </div>
</div>
`;

// Inserisci il template nel DOM
const savedTimersDiv = document.createElement('div');
savedTimersDiv.id = 'saved-timers-template';
savedTimersDiv.style.display = 'none'; // Nascondi il template
savedTimersDiv.innerHTML = savedTimersTemplate;
document.body.appendChild(savedTimersDiv);

// Funzione per creare l'elemento HTML di un timer salvato come riga di tabella
function createTimerRow(timerId, logData) {
    // Crea l'elemento riga (tr)
    const row = document.createElement('tr');

    // Colonna per la checkbox
    const checkboxCell = document.createElement('td');
    checkboxCell.classList.add('text-center', 'align-middle'); // Allinea al centro verticalmente e orizzontalmente

    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.classList.add('form-check', 'd-flex', 'justify-content-center', 'align-items-center', 'mb-0');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('form-check-input', 'timer-checkbox');
    checkbox.value = timerId;
    checkbox.id = 'checkbox-' + timerId;

    const checkboxLabel = document.createElement('label');
    checkboxLabel.classList.add('form-check-label', 'sr-only'); // Nasconde il label visivamente ma lo rende accessibile
    checkboxLabel.setAttribute('for', 'checkbox-' + timerId);
    checkboxLabel.textContent = 'Seleziona Timer';

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(checkboxLabel);
    checkboxCell.appendChild(checkboxWrapper);
    row.appendChild(checkboxCell);

    // Colonna per Cliente e Sito
    const clientCell = document.createElement('td');
    clientCell.textContent = `${logData.clientName} - ${logData.siteName}`;
    row.appendChild(clientCell);

    // Colonna per Tipo di Lavoro
    const worktypeCell = document.createElement('td');
    worktypeCell.textContent = logData.worktypeName || 'N/A';
    row.appendChild(worktypeCell);

    // Colonna per Durata
    const durationCell = document.createElement('td');
    durationCell.textContent = formatDuration(logData.duration);
    row.appendChild(durationCell);

    // Colonna per Orario di Inizio e Fine
    const timeCell = document.createElement('td');
    timeCell.innerHTML = `<strong>Inizio:</strong> ${new Date(logData.startTime.seconds * 1000).toLocaleString()}<br><strong>Fine:</strong> ${new Date(logData.endTime.seconds * 1000).toLocaleString()}`;
    row.appendChild(timeCell);

    // Colonna per il Link
    const linkCell = document.createElement('td');
    if (logData.link) {
        const linkAnchor = document.createElement('a');
        linkAnchor.href = logData.link;
        linkAnchor.target = '_blank';
        linkAnchor.textContent = 'Apri Link';
        linkCell.appendChild(linkAnchor);
    } else {
        linkCell.textContent = 'N/A';
    }
    row.appendChild(linkCell);

    // Colonna per l'Icona di Contrassegno
    const statusCell = document.createElement('td');
    if (logData.isReported) {
        const checkmarkIcon = document.createElement('i');
        checkmarkIcon.classList.add('fas', 'fa-check-circle', 'text-success');
        statusCell.appendChild(checkmarkIcon);
    }
    row.appendChild(statusCell);

    // Colonna per l'Azione Elimina
    const actionCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener('click', () => {
        deleteTimer(timerId, row);
    });
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    return row;
}


// Funzione per creare l'elemento HTML di un timer nel cestino come riga di tabella
function createRecycleBinRow(timerId, logData) {
    // Crea l'elemento riga (tr)
    const row = document.createElement('tr');

    // Colonna per Cliente e Sito
    const clientCell = document.createElement('td');
    clientCell.textContent = `${logData.clientName} - ${logData.siteName}`;
    row.appendChild(clientCell);

    // Colonna per Tipo di Lavoro
    const worktypeCell = document.createElement('td');
    worktypeCell.textContent = logData.worktypeName || 'N/A';
    row.appendChild(worktypeCell);

    // Colonna per Durata
    const durationCell = document.createElement('td');
    durationCell.textContent = formatDuration(logData.duration);
    row.appendChild(durationCell);

    // Colonna per Orario di Inizio e Fine
    const timeCell = document.createElement('td');
    timeCell.innerHTML = `<strong>Inizio:</strong> ${new Date(logData.startTime.seconds * 1000).toLocaleString()}<br><strong>Fine:</strong> ${new Date(logData.endTime.seconds * 1000).toLocaleString()}`;
    row.appendChild(timeCell);

    // Colonna per il Link
    const linkCell = document.createElement('td');
    if (logData.link) {
        const linkAnchor = document.createElement('a');
        linkAnchor.href = logData.link;
        linkAnchor.target = '_blank';
        linkAnchor.textContent = 'Apri Link';
        linkCell.appendChild(linkAnchor);
    } else {
        linkCell.textContent = 'N/A';
    }
    row.appendChild(linkCell);

    // Colonna per le Azioni (Ripristina ed Elimina Definitivamente)
    const actionCell = document.createElement('td');

    const restoreBtn = document.createElement('button');
    restoreBtn.classList.add('btn', 'btn-success', 'btn-sm', 'mr-2');
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i>';
    restoreBtn.addEventListener('click', () => {
        restoreTimer(timerId, row);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
    deleteBtn.addEventListener('click', () => {
        permanentlyDeleteTimer(timerId, row);
    });

    actionCell.appendChild(restoreBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    return row;
}

// Funzione per ottenere il nome del mese
function getMonthName(monthNumber) {
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[monthNumber - 1];
}

// Funzione per formattare la durata in ore, minuti e secondi
function formatDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const hrsDisplay = hrs > 0 ? (hrs < 10 ? '0' + hrs : hrs) + 'h ' : '00h ';
    const minsDisplay = mins > 0 ? (mins < 10 ? '0' + mins : mins) + 'm ' : '00m ';
    const secsDisplay = secs > 0 ? (secs < 10 ? '0' + secs : secs) + 's' : '00s';

    return hrsDisplay + minsDisplay + secsDisplay;
}