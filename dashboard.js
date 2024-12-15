// dashboard.js

let dashboardUnsubscribe = null;

// Variabile per memorizzare la modalità di visualizzazione selezionata per il grafico dei guadagni
let earningsChartViewMode = 'combined'; // Valori possibili: 'combined', 'perClient'

// Numero massimo di timeLogs totali da recuperare
const MAX_TOTAL_TIMELOGS = 500;

// Template per la sezione Dashboard
const dashboardTemplate = `
<div id="dashboard-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-chart-line mr-2"></i>Dashboard Analitica
    </h2>
    <!-- Sezione Filtri -->
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0"><i class="fas fa-filter mr-2"></i>Filtri</h5>
        </div>
        <div class="card-body">
            <form id="dashboard-filter-form" class="row">
                <div class="col-md-2">
                    <label for="dashboard-filter-date-start" class="font-weight-bold">Data Inizio:</label>
                    <input type="date" id="dashboard-filter-date-start" class="form-control">
                </div>
                <div class="col-md-2">
                    <label for="dashboard-filter-date-end" class="font-weight-bold">Data Fine:</label>
                    <input type="date" id="dashboard-filter-date-end" class="form-control">
                </div>
                <div class="col-md-2">
                    <label for="dashboard-filter-client" class="font-weight-bold">Cliente:</label>
                    <select id="dashboard-filter-client" class="form-control">
                        <option value="">Tutti i Clienti</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label for="dashboard-filter-max-timelogs" class="font-weight-bold">
                        Max TimeLogs per Cliente 
                        <span id="max-timelogs-info" class="text-primary" data-toggle="tooltip" data-placement="top" title="Facoltativo ma consigliato. Imposta il numero massimo di timeLogs per cliente da visualizzare.">
                            <i class="fas fa-info-circle"></i>
                        </span>
                    </label>
                    <input type="number" id="dashboard-filter-max-timelogs" class="form-control" placeholder="Es. 50" value="30">
                </div>
                <div class="col-md-3 d-flex align-items-end">
                    <button id="dashboard-filter-btn" type="button" class="btn btn-primary btn-block mt-2">
                        <i class="fas fa-search mr-2"></i>Filtra Statistiche
                    </button>
                </div>
            </form>
        </div>
    </div>
    <!-- Grafici -->
    <div class="row">
        <div class="col-md-6">
            <!-- Carta per il tempo lavorato -->
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fas fa-clock mr-2"></i>Tempo Lavorato</h5>
                </div>
                <div class="card-body">
                    <canvas id="workedTimeChart"></canvas>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <!-- Carta per i guadagni totali -->
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-euro-sign mr-2"></i>Guadagni Totali</h5>
                    <!-- Switch per modalità di visualizzazione -->
                    <div>
                        <label for="earnings-view-mode" class="font-weight-bold mr-2">Visualizza:</label>
                        <select id="earnings-view-mode" class="form-control form-control-sm d-inline-block w-auto">
                            <option value="combined">Combinato</option>
                            <option value="perClient">Per Cliente</option>
                        </select>
                    </div>
                </div>
                <div class="card-body">
                    <canvas id="earningsChart"></canvas>
                </div>
            </div>
        </div>
    </div>
    <!-- Altre carte per KPI rilevanti -->
    <div class="row">
        <div class="col-md-6">
            <!-- Carta per distribuzione tipi di lavoro -->
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-warning text-white">
                    <h5 class="mb-0"><i class="fas fa-chart-pie mr-2"></i>Distribuzione Tipi di Lavoro</h5>
                </div>
                <div class="card-body">
                    <canvas id="worktypeDistributionChart"></canvas>
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <!-- Carta per tempo lavorato per cliente -->
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-user-clock mr-2"></i>Tempo Lavorato per Cliente</h5>
                </div>
                <div class="card-body">
                    <canvas id="clientWorkedTimeChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// Variabili per mantenere i riferimenti ai grafici
let workedTimeChartInstance = null;
let earningsChartInstance = null;
let worktypeDistributionChartInstance = null;
let clientWorkedTimeChartInstance = null;

/**
 * Funzione per inizializzare gli eventi della Dashboard
 */
function initializeDashboardEvents() {
    // Inserisci il template della dashboard nella sezione contenuto
    const contentSection = document.getElementById('content-section');
    contentSection.innerHTML = dashboardTemplate;

    // Utilizza requestAnimationFrame per assicurarti che il DOM sia aggiornato
    requestAnimationFrame(() => {
        // Inizializza i tooltip (richiede Bootstrap)
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        // Carica i clienti per il filtro
        loadClientsForDashboardFilter();

        // Aggiungi listener al pulsante di filtro
        const filterBtn = document.getElementById('dashboard-filter-btn');
        filterBtn.addEventListener('click', () => {
            const filters = getDashboardFilters();
            loadDashboardData(filters);
        });

        // Aggiungi listener per il cambio di modalità di visualizzazione dei guadagni
        const earningsViewModeSelect = document.getElementById('earnings-view-mode');
        earningsViewModeSelect.addEventListener('change', () => {
            earningsChartViewMode = earningsViewModeSelect.value;
            const filters = getDashboardFilters();
            loadDashboardData(filters);
        });

        // Carica i dati iniziali della dashboard
        setDynamicDateFiltersAndLoadData();
    });
}

/**
 * Funzione per impostare i filtri di data in base alla quantità di dati da visualizzare
 */
async function setDynamicDateFiltersAndLoadData() {
    // Ottieni gli input delle date
    const endDateInput = document.getElementById('dashboard-filter-date-end');
    const startDateInput = document.getElementById('dashboard-filter-date-start');

    try {
        // Ottieni gli ultimi timeLogs fino al massimo specificato
        const timeLogsSnapshot = await db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isDeleted', '==', false)
            .orderBy('startTime', 'desc')
            .limit(MAX_TOTAL_TIMELOGS)
            .get();

        if (!timeLogsSnapshot.empty) {
            const allTimeLogs = timeLogsSnapshot.docs.map(doc => doc.data());

            let endDate = allTimeLogs[0].endTime.toDate();
            let startDate = allTimeLogs[allTimeLogs.length - 1].startTime.toDate();

            const currentDate = new Date();

            // Assicura che la data di fine non sia nel futuro
            if (endDate > currentDate) {
                endDate = currentDate;
            }

            // Se l'intervallo è minore di un mese, estendi a un mese
            const oneMonthAgo = new Date(endDate);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            if (startDate > oneMonthAgo) {
                startDate = oneMonthAgo;
            }

            // Imposta i valori degli input
            endDateInput.value = endDate.toISOString().split('T')[0];
            startDateInput.value = startDate.toISOString().split('T')[0];

            // Carica i dati con i filtri impostati
            const filters = getDashboardFilters();
            loadDashboardData(filters);
        } else {
            // Se non ci sono timeLogs, usa gli ultimi 30 giorni
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);

            endDateInput.value = endDate.toISOString().split('T')[0];
            startDateInput.value = startDate.toISOString().split('T')[0];

            const filters = getDashboardFilters();
            loadDashboardData(filters);
        }
    } catch (error) {
        console.error('Errore nel recuperare i timeLogs:', error);
        // In caso di errore, usa gli ultimi 30 giorni
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        endDateInput.value = endDate.toISOString().split('T')[0];
        startDateInput.value = startDate.toISOString().split('T')[0];

        const filters = getDashboardFilters();
        loadDashboardData(filters);
    }
}

/**
 * Funzione per caricare i clienti nel filtro
 */
function loadClientsForDashboardFilter() {
    const clientSelect = document.getElementById('dashboard-filter-client');
    clientSelect.innerHTML = '<option value="">Tutti i Clienti</option>';

    db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const client = doc.data();
                const option = document.createElement('option');
                option.value = client.name; // Usa il nome del cliente per il filtro
                option.textContent = client.name;
                clientSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti per il filtro:', error);
        });
}

/**
 * Funzione per ottenere i filtri della dashboard
 */
function getDashboardFilters() {
    const startDate = document.getElementById('dashboard-filter-date-start').value;
    const endDate = document.getElementById('dashboard-filter-date-end').value;
    const clientName = document.getElementById('dashboard-filter-client').value;
    const maxTimeLogsPerClientInput = document.getElementById('dashboard-filter-max-timelogs');

    const filters = {};

    if (startDate) {
        filters.startDate = new Date(startDate + 'T00:00:00');
    }
    if (endDate) {
        filters.endDate = new Date(endDate + 'T23:59:59');
    }
    if (clientName) {
        filters.clientName = clientName;
    }
    if (maxTimeLogsPerClientInput.value) {
        filters.maxTimeLogsPerClient = parseInt(maxTimeLogsPerClientInput.value);
    } else {
        // Se l'utente non ha inserito un valore, utilizza il valore predefinito di 30
        filters.maxTimeLogsPerClient = 30;
    }

    return filters;
}

/**
 * Funzione per caricare i dati e generare i grafici
 */
function loadDashboardData(filters = {}) {
    let query = db.collection('timeLogs')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', false);

    if (filters.clientName) {
        query = query.where('clientName', '==', filters.clientName);
    }

    // Usa le disuguaglianze solo su 'startTime'
    if (filters.startDate && filters.endDate) {
        query = query
            .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(filters.startDate))
            .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(filters.endDate));
    } else if (filters.startDate) {
        query = query.where('startTime', '>=', firebase.firestore.Timestamp.fromDate(filters.startDate));
    } else if (filters.endDate) {
        query = query.where('startTime', '<=', firebase.firestore.Timestamp.fromDate(filters.endDate));
    }

    // Limita il numero massimo di timeLogs totali da recuperare
    query = query.orderBy('startTime', 'desc').limit(MAX_TOTAL_TIMELOGS);

    // Annulla l'ascoltatore precedente se esiste
    if (dashboardUnsubscribe) {
        dashboardUnsubscribe();
        dashboardUnsubscribe = null;
    }

    // Imposta il nuovo ascoltatore e memorizza la funzione di annullamento
    dashboardUnsubscribe = query.onSnapshot(snapshot => {
        let timeLogs = snapshot.docs.map(doc => doc.data());

        // Applica ulteriori filtri client-side per accuratezza
        if (filters.startDate || filters.endDate) {
            timeLogs = timeLogs.filter(log => {
                const logStartTime = log.startTime.toDate();
                const logEndTime = log.endTime.toDate();

                // Controlla la sovrapposizione tra il tempo del log e il filtro
                const filterStart = filters.startDate || new Date(0); // Data minima se non specificata
                const filterEnd = filters.endDate || new Date(8640000000000000); // Data massima se non specificata

                return logEndTime >= filterStart && logStartTime <= filterEnd;
            });
        }

        // Raggruppa i timeLogs per cliente
        const timeLogsByClient = {};

        timeLogs.forEach(log => {
            const clientName = log.clientName || 'Sconosciuto';
            if (!timeLogsByClient[clientName]) {
                timeLogsByClient[clientName] = [];
            }
            timeLogsByClient[clientName].push(log);
        });

        // Limita i timeLogs per cliente se specificato
        if (filters.maxTimeLogsPerClient) {
            const maxLogsPerClient = filters.maxTimeLogsPerClient;
            for (const clientName in timeLogsByClient) {
                // Ordina i timeLogs per startTime discendente
                timeLogsByClient[clientName].sort((a, b) => b.startTime.toDate() - a.startTime.toDate());
                timeLogsByClient[clientName] = timeLogsByClient[clientName].slice(0, maxLogsPerClient);
            }
        }

        // Appiattisci i timeLogs in un singolo array
        timeLogs = [].concat(...Object.values(timeLogsByClient));

        // Continua con la preparazione dei grafici
        prepareWorkedTimeChart(timeLogs, filters);
        prepareEarningsChart(timeLogs, filters);
        prepareWorktypeDistributionChart(timeLogs, filters);
        prepareClientWorkedTimeChart(timeLogs, filters);
    }, error => {
        console.error('Errore nel caricamento dei dati della dashboard:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il caricamento dei dati della dashboard.',
            confirmButtonText: 'OK'
        });
    });
}

/**
 * Funzione per preparare il grafico del tempo lavorato
 */
function prepareWorkedTimeChart(timeLogs, filters) {
    const canvasElement = document.getElementById('workedTimeChart');
    if (!canvasElement) {
        console.error('Elemento canvas "workedTimeChart" non trovato nel DOM.');
        return;
    }
    const ctx = canvasElement.getContext('2d');

    // Distruggi il grafico precedente se esiste
    if (workedTimeChartInstance) {
        workedTimeChartInstance.destroy();
    }

    const workedTimePerDay = {};

    timeLogs.forEach(log => {
        const date = new Date(log.startTime.seconds * 1000).toLocaleDateString('it-IT');
        const durationInHours = log.duration / 3600;

        if (workedTimePerDay[date]) {
            workedTimePerDay[date] += durationInHours;
        } else {
            workedTimePerDay[date] = durationInHours;
        }
    });

    // Ordina le date in ordine cronologico
    const labels = Object.keys(workedTimePerDay)
        .sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    const data = labels.map(label => workedTimePerDay[label]);

    // Crea il grafico e salva l'istanza
    workedTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ore Lavorate',
                data: data,
                backgroundColor: 'rgba(40, 167, 69, 0.6)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Data' } },
                y: { title: { display: true, text: 'Ore' }, beginAtZero: true }
            }
        }
    });
}

/**
 * Funzione per preparare il grafico dei guadagni totali
 */
function prepareEarningsChart(timeLogs, filters) {
    const canvasElement = document.getElementById('earningsChart');
    if (!canvasElement) {
        console.error('Elemento canvas "earningsChart" non trovato nel DOM.');
        return;
    }
    const ctx = canvasElement.getContext('2d');

    // Distruggi il grafico precedente se esiste
    if (earningsChartInstance) {
        earningsChartInstance.destroy();
    }

    const clientNames = new Set(timeLogs.map(log => log.clientName));

    // Prepara i dati in base alla modalità di visualizzazione selezionata
    if (filters.clientName || earningsChartViewMode === 'combined' || clientNames.size === 1) {
        // Visualizzazione combinata o singolo cliente
        const earningsPerDay = {};

        timeLogs.forEach(log => {
            const date = new Date(log.startTime.seconds * 1000).toLocaleDateString('it-IT');
            const durationInHours = log.duration / 3600;
            const hourlyRate = log.hourlyRate || 0;
            const amount = durationInHours * hourlyRate;

            if (earningsPerDay[date]) {
                earningsPerDay[date] += amount;
            } else {
                earningsPerDay[date] = amount;
            }
        });

        // Ordina le date in ordine cronologico
        const labels = Object.keys(earningsPerDay)
            .sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const data = labels.map(label => earningsPerDay[label]);

        // Crea il grafico e salva l'istanza
        earningsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Guadagni (€)',
                    data: data,
                    backgroundColor: 'rgba(23, 162, 184, 0.6)',
                    borderColor: 'rgba(23, 162, 184, 1)',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Data' } },
                    y: { title: { display: true, text: 'Euro (€)' }, beginAtZero: true }
                }
            }
        });
    } else if (earningsChartViewMode === 'perClient') {
        // Visualizzazione per cliente
        const earningsPerDayPerClient = {};

        timeLogs.forEach(log => {
            const date = new Date(log.startTime.seconds * 1000).toLocaleDateString('it-IT');
            const durationInHours = log.duration / 3600;
            const hourlyRate = log.hourlyRate || 0;
            const amount = durationInHours * hourlyRate;

            if (!earningsPerDayPerClient[log.clientName]) {
                earningsPerDayPerClient[log.clientName] = {};
            }
            if (earningsPerDayPerClient[log.clientName][date]) {
                earningsPerDayPerClient[log.clientName][date] += amount;
            } else {
                earningsPerDayPerClient[log.clientName][date] = amount;
            }
        });

        // Ottieni tutte le date
        const allDatesSet = new Set();
        Object.values(earningsPerDayPerClient).forEach(clientData => {
            Object.keys(clientData).forEach(date => allDatesSet.add(date));
        });
        const labels = Array.from(allDatesSet)
            .sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

        // Prepara i dataset
        const datasets = [];
        const colors = ['rgba(23, 162, 184, 1)', 'rgba(220, 53, 69, 1)', 'rgba(255, 193, 7, 1)', 'rgba(40, 167, 69, 1)', 'rgba(102, 16, 242, 1)'];

        let colorIndex = 0;
        for (const clientName of clientNames) {
            const clientData = earningsPerDayPerClient[clientName];
            const data = labels.map(label => clientData[label] || 0);
            const color = colors[colorIndex % colors.length];
            colorIndex++;

            datasets.push({
                label: clientName,
                data: data,
                backgroundColor: color.replace('1)', '0.6)'),
                borderColor: color,
                borderWidth: 2,
                fill: false
            });
        }

        // Crea il grafico e salva l'istanza
        earningsChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Data' } },
                    y: { title: { display: true, text: 'Euro (€)' }, beginAtZero: true }
                }
            }
        });
    }
}

/**
 * Funzione per preparare il grafico della distribuzione dei tipi di lavoro
 */
function prepareWorktypeDistributionChart(timeLogs, filters) {
    const canvasElement = document.getElementById('worktypeDistributionChart');
    if (!canvasElement) {
        console.error('Elemento canvas "worktypeDistributionChart" non trovato nel DOM.');
        return;
    }
    const ctx = canvasElement.getContext('2d');

    // Distruggi il grafico precedente se esiste
    if (worktypeDistributionChartInstance) {
        worktypeDistributionChartInstance.destroy();
    }

    const worktypeDistribution = {};

    timeLogs.forEach(log => {
        const worktypeName = log.worktypeName || 'Sconosciuto';
        const durationInHours = log.duration / 3600;

        if (worktypeDistribution[worktypeName]) {
            worktypeDistribution[worktypeName] += durationInHours;
        } else {
            worktypeDistribution[worktypeName] = durationInHours;
        }
    });

    // Prepara i dati per il grafico
    const labels = Object.keys(worktypeDistribution);
    const data = labels.map(label => worktypeDistribution[label]);

    // Crea il grafico e salva l'istanza
    worktypeDistributionChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ore Lavorate',
                data: data,
                backgroundColor: [
                    'rgba(255, 193, 7, 0.6)',
                    'rgba(220, 53, 69, 0.6)',
                    'rgba(40, 167, 69, 0.6)',
                    'rgba(23, 162, 184, 0.6)',
                    'rgba(102, 16, 242, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(220, 53, 69, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(23, 162, 184, 1)',
                    'rgba(102, 16, 242, 1)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}

/**
 * Funzione per preparare il grafico del tempo lavorato per cliente
 */
function prepareClientWorkedTimeChart(timeLogs, filters) {
    const canvasElement = document.getElementById('clientWorkedTimeChart');
    if (!canvasElement) {
        console.error('Elemento canvas "clientWorkedTimeChart" non trovato nel DOM.');
        return;
    }
    const ctx = canvasElement.getContext('2d');

    // Distruggi il grafico precedente se esiste
    if (clientWorkedTimeChartInstance) {
        clientWorkedTimeChartInstance.destroy();
    }

    const workedTimePerClient = {};

    timeLogs.forEach(log => {
        const clientName = log.clientName || 'Sconosciuto';
        const durationInHours = log.duration / 3600;

        if (workedTimePerClient[clientName]) {
            workedTimePerClient[clientName] += durationInHours;
        } else {
            workedTimePerClient[clientName] = durationInHours;
        }
    });

    // Prepara i dati per il grafico
    const labels = Object.keys(workedTimePerClient);
    const data = labels.map(label => workedTimePerClient[label]);

    // Crea il grafico e salva l'istanza
    clientWorkedTimeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ore Lavorate per Cliente',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Cliente' } },
                y: { title: { display: true, text: 'Ore' }, beginAtZero: true }
            }
        }
    });
}
