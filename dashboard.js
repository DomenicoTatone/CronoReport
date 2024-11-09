// dashboard.js

let dashboardUnsubscribe = null;

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
                <div class="col-md-3">
                    <label for="dashboard-filter-date-start" class="font-weight-bold">Data Inizio:</label>
                    <input type="date" id="dashboard-filter-date-start" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="dashboard-filter-date-end" class="font-weight-bold">Data Fine:</label>
                    <input type="date" id="dashboard-filter-date-end" class="form-control">
                </div>
                <div class="col-md-3">
                    <label for="dashboard-filter-client" class="font-weight-bold">Cliente:</label>
                    <select id="dashboard-filter-client" class="form-control">
                        <option value="">Tutti i Clienti</option>
                    </select>
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
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0"><i class="fas fa-euro-sign mr-2"></i>Guadagni Totali</h5>
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
    // Insert the dashboard template into the content section
    const contentSection = document.getElementById('content-section');
    contentSection.innerHTML = dashboardTemplate;

    // Load clients for the dashboard filter
    loadClientsForDashboardFilter();

    // Add event listener to the filter button
    const filterBtn = document.getElementById('dashboard-filter-btn');
    filterBtn.addEventListener('click', () => {
        const filters = getDashboardFilters();
        loadDashboardData(filters);
    });

    // Load the initial dashboard data
    loadDashboardData();
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

    if (filters.startDate) {
        query = query.where('startTime', '>=', firebase.firestore.Timestamp.fromDate(filters.startDate));
    }

    if (filters.endDate) {
        query = query.where('endTime', '<=', firebase.firestore.Timestamp.fromDate(filters.endDate));
    }

    // Unsubscribe from the previous listener if it exists
    if (dashboardUnsubscribe) {
        dashboardUnsubscribe();
        dashboardUnsubscribe = null;
    }

    // Set up the new listener and store the unsubscribe function
    dashboardUnsubscribe = query.onSnapshot(snapshot => {
        const timeLogs = snapshot.docs.map(doc => doc.data());

        // Prepare the charts
        prepareWorkedTimeChart(timeLogs);
        prepareEarningsChart(timeLogs);
        prepareWorktypeDistributionChart(timeLogs);
        prepareClientWorkedTimeChart(timeLogs);
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
function prepareWorkedTimeChart(timeLogs) {
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
function prepareEarningsChart(timeLogs) {
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
}

/**
 * Funzione per preparare il grafico della distribuzione dei tipi di lavoro
 */
function prepareWorktypeDistributionChart(timeLogs) {
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
                label: 'Distribuzione Tipi di Lavoro',
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
function prepareClientWorkedTimeChart(timeLogs) {
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
