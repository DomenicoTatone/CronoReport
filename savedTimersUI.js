// savedTimersUI.js

// Template per la sezione Timer Salvati
const savedTimersTemplate = `
<div id="saved-timers-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-stopwatch mr-2"></i>Timer Salvati
    </h2>

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
                    <button id="filter-timers-btn" type="button" class="btn btn-primary btn-block mt-2">
                        <i class="fas fa-search mr-2"></i>Filtra Timer
                    </button>
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
                    <button id="apply-action-btn" class="btn btn-success btn-block mt-2">
                        <i class="fas fa-check mr-2"></i>Applica
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Pulsante Annulla Ultima Operazione -->
    <div class="text-right mb-4">
        <button id="undo-action-btn" class="btn btn-outline-secondary">
            <i class="fas fa-undo mr-2"></i>Annulla Ultima Operazione
        </button>
    </div>

    <!-- Lista Timer Salvati -->
    <div id="savedTimersAccordion" class="accordion">
        <!-- Timer salvati saranno inseriti qui -->
    </div>
</div>

<!-- Sezione Cestino -->
<div id="recycle-bin-section" class="container mt-5 custom-container" style="display: none;">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-trash-alt mr-2"></i>Cestino
    </h2>

    <!-- Navigazione tra Timer e Report Eliminati -->
    <ul class="nav nav-tabs" id="recycleBinTabs" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="timers-tab" data-toggle="tab" href="#timers" role="tab" aria-controls="timers" aria-selected="true">
                <i class="fas fa-stopwatch mr-2"></i>Timer Eliminati
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="reports-tab" data-toggle="tab" href="#reports" role="tab" aria-controls="reports" aria-selected="false">
                <i class="fas fa-file-alt mr-2"></i>Report Eliminati
            </a>
        </li>
    </ul>

    <div class="tab-content" id="recycleBinTabsContent">
        <!-- Tab Timer Eliminati -->
        <div class="tab-pane fade show active" id="timers" role="tabpanel" aria-labelledby="timers-tab">
            <div id="recycle-bin-timers" class="mt-4">
                <!-- I timer eliminati saranno caricati qui -->
            </div>
        </div>

        <!-- Tab Report Eliminati -->
        <div class="tab-pane fade" id="reports" role="tabpanel" aria-labelledby="reports-tab">
            <div id="recycle-bin-reports" class="mt-4">
                <!-- I report eliminati saranno caricati qui -->
            </div>
        </div>
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
function createTimerRow(timerId, logData, isRecycleBin = false) {
    // Crea l'elemento riga (tr)
    const row = document.createElement('tr');

    // Colonna per la checkbox (solo se non siamo nel cestino)
    const checkboxCell = document.createElement('td');
    checkboxCell.classList.add('text-center', 'align-middle');

    if (!isRecycleBin) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('form-check-input', 'timer-checkbox');
        checkbox.value = timerId;
        checkbox.id = 'checkbox-' + timerId;
        checkboxCell.appendChild(checkbox);
    } else {
        checkboxCell.textContent = ''; // Lascia vuoto o aggiungi un'icona se preferisci
    }

    row.appendChild(checkboxCell);

    // Colonna per Cliente e Sito con icona
    const clientCell = document.createElement('td');
    clientCell.innerHTML = `<i class="fas fa-building mr-2"></i>${logData.clientName} - ${logData.siteName || 'Sito Sconosciuto'}`;
    row.appendChild(clientCell);

    // Colonna per Tipo di Lavoro con icona
    const worktypeCell = document.createElement('td');
    worktypeCell.innerHTML = `<i class="fas fa-briefcase mr-2"></i>${logData.worktypeName || 'N/A'}`;
    row.appendChild(worktypeCell);

    // Colonna per Durata con icona
    const durationCell = document.createElement('td');
    durationCell.innerHTML = `<i class="fas fa-clock mr-2"></i>${formatDuration(logData.duration)}`;
    row.appendChild(durationCell);

    // Colonna per Orario di Inizio e Fine con formattazione
    const timeCell = document.createElement('td');
    timeCell.innerHTML = `
        <i class="fas fa-play mr-1 text-success"></i> ${formatDateTime(logData.startTime)}<br>
        <i class="fas fa-stop mr-1 text-danger"></i> ${formatDateTime(logData.endTime)}
    `;
    row.appendChild(timeCell);

    // Colonna per il Link con icona
    const linkCell = document.createElement('td');
    if (logData.link) {
        const linkAnchor = document.createElement('a');
        linkAnchor.href = logData.link;
        linkAnchor.target = '_blank';
        linkAnchor.innerHTML = '<i class="fas fa-external-link-alt mr-1"></i>Apri Link';
        linkCell.appendChild(linkAnchor);
    } else {
        linkCell.textContent = 'N/A';
    }
    row.appendChild(linkCell);

    // Colonna per l'Icona di Contrassegno
    const statusCell = document.createElement('td');
    statusCell.classList.add('text-center', 'align-middle');
    if (logData.isReported) {
        const checkmarkIcon = document.createElement('i');
        checkmarkIcon.classList.add('fas', 'fa-check-circle', 'text-success');
        checkmarkIcon.setAttribute('title', 'Reportato');
        checkmarkIcon.setAttribute('data-toggle', 'tooltip');
        statusCell.appendChild(checkmarkIcon);
    } else {
        const pendingIcon = document.createElement('i');
        pendingIcon.classList.add('fas', 'fa-hourglass-half', 'text-warning');
        pendingIcon.setAttribute('title', 'Non Reportato');
        pendingIcon.setAttribute('data-toggle', 'tooltip');
        statusCell.appendChild(pendingIcon);
    }
    row.appendChild(statusCell);

    // Colonna per l'Azione con icone appropriate
    const actionCell = document.createElement('td');
    actionCell.classList.add('text-center', 'align-middle');

    if (isRecycleBin) {
        // Pulsanti per il Cestino
        const restoreBtn = document.createElement('button');
        restoreBtn.classList.add('btn', 'btn-sm', 'btn-success', 'mr-2');
        restoreBtn.setAttribute('title', 'Ripristina Timer');
        restoreBtn.setAttribute('data-toggle', 'tooltip');
        restoreBtn.innerHTML = '<i class="fas fa-undo-alt"></i>';
        restoreBtn.addEventListener('click', () => {
            restoreTimer(timerId, row);
        });
        actionCell.appendChild(restoreBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
        deleteBtn.setAttribute('title', 'Elimina Definitivamente');
        deleteBtn.setAttribute('data-toggle', 'tooltip');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => {
            permanentlyDeleteTimer(timerId, row);
        });
        actionCell.appendChild(deleteBtn);
    } else {
        // Pulsante per Timer Salvati
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
        deleteBtn.setAttribute('title', 'Elimina Timer');
        deleteBtn.setAttribute('data-toggle', 'tooltip');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.addEventListener('click', () => {
            deleteTimer(timerId, row);
        });
        actionCell.appendChild(deleteBtn);
    }

    row.appendChild(actionCell);

    return row;
}

// Funzione per creare l'elemento HTML di un timer nel cestino come riga di tabella
function createRecycleBinRow(timerId, logData) {
    // Crea l'elemento riga (tr)
    const row = document.createElement('tr');

    // Colonna per Cliente e Sito con icona
    const clientCell = document.createElement('td');
    clientCell.innerHTML = `<i class="fas fa-building mr-2"></i>${logData.clientName} - ${logData.siteName}`;
    row.appendChild(clientCell);

    // Colonna per Tipo di Lavoro con icona
    const worktypeCell = document.createElement('td');
    worktypeCell.innerHTML = `<i class="fas fa-briefcase mr-2"></i>${logData.worktypeName || 'N/A'}`;
    row.appendChild(worktypeCell);

    // Colonna per Durata con icona
    const durationCell = document.createElement('td');
    durationCell.innerHTML = `<i class="fas fa-clock mr-2"></i>${formatDuration(logData.duration)}`;
    row.appendChild(durationCell);

    // Colonna per Orario di Inizio e Fine con formattazione
    const timeCell = document.createElement('td');
    timeCell.innerHTML = `
        <i class="fas fa-play mr-1 text-success"></i> ${formatDateTime(logData.startTime)}<br>
        <i class="fas fa-stop mr-1 text-danger"></i> ${formatDateTime(logData.endTime)}
    `;
    row.appendChild(timeCell);

    // Colonna per il Link con icona
    const linkCell = document.createElement('td');
    if (logData.link) {
        const linkAnchor = document.createElement('a');
        linkAnchor.href = logData.link;
        linkAnchor.target = '_blank';
        linkAnchor.innerHTML = '<i class="fas fa-external-link-alt mr-1"></i>Apri Link';
        linkCell.appendChild(linkAnchor);
    } else {
        linkCell.textContent = 'N/A';
    }
    row.appendChild(linkCell);

    // Colonna per le Azioni (Ripristina ed Elimina Definitivamente)
    const actionCell = document.createElement('td');
    actionCell.classList.add('text-center', 'align-middle');

    const restoreBtn = document.createElement('button');
    restoreBtn.classList.add('btn', 'btn-success', 'btn-sm', 'mr-2');
    restoreBtn.setAttribute('title', 'Ripristina Timer');
    restoreBtn.innerHTML = '<i class="fas fa-undo"></i>';
    restoreBtn.addEventListener('click', () => {
        restoreTimer(timerId, row);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
    deleteBtn.setAttribute('title', 'Elimina Definitivamente');
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

