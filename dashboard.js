// dashboard.js

let earningsChartViewMode = 'combined';
const MAX_TOTAL_TIMELOGS = 500;

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
                        <span id="max-timelogs-info" class="text-primary" data-toggle="tooltip" data-placement="top" title="Facoltativo. Imposta il numero massimo di timeLogs per cliente da visualizzare.">
                            <i class="fas fa-info-circle"></i>
                        </span>
                    </label>
                    <input type="number" id="dashboard-filter-max-timelogs" class="form-control" placeholder="Es. 50" value="150">
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
                <div class="card-body" style="position:relative; min-height:400px;">
                    <div style="position: relative; height:100%; width:100%;">
                        <canvas id="worktypeDistributionChart"></canvas>
                    </div>
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

// Riferimenti ai grafici
let workedTimeChartInstance = null;
let earningsChartInstance = null;
let worktypeDistributionChartInstance = null;
let clientWorkedTimeChartInstance = null;

/** Funzione per formattare le ore decimali in hh:mm:ss */
function formatHoursToHMS(decimalHours) {
    const totalSeconds = Math.round(decimalHours * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = hours.toString().padStart(2, '0');
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
}

/** Tooltip callback per ore lavorate */
function hoursTooltipCallback(context) {
    const rawValue = context.parsed.y; // valore in ore decimali
    const formatted = formatHoursToHMS(rawValue);
    return `Ore Lavorate: ${formatted}`;
}

/** Tooltip callback per ore lavorate su grafico a torta (pie chart) */
function hoursTooltipPieCallback(context) {
    const rawValue = context.parsed; // valore in ore decimali
    const formatted = formatHoursToHMS(rawValue);
    return `${context.label}: ${formatted}`;
}

/** Tooltip callback per guadagni in euro */
function earningsTooltipCallback(context) {
    const rawValue = context.parsed.y;
    return `Guadagni: €${rawValue.toFixed(2)}`;
}

function initializeDashboardEvents() {
    const contentSection = document.getElementById('content-section');
    contentSection.innerHTML = dashboardTemplate;

    requestAnimationFrame(() => {
        // Inizializza tooltips Bootstrap
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        loadClientsForDashboardFilter();

        const filterBtn = document.getElementById('dashboard-filter-btn');
        filterBtn.addEventListener('click', () => {
            const filters = getDashboardFilters();
            loadDashboardData(filters);
        });

        const earningsViewModeSelect = document.getElementById('earnings-view-mode');
        earningsViewModeSelect.addEventListener('change', () => {
            earningsChartViewMode = earningsViewModeSelect.value;
            const filters = getDashboardFilters();
            loadDashboardData(filters);
        });

        setInitialDateRangeAndLoadData();
    });
}

/** Imposta l'intervallo di date iniziali e carica i dati */
async function setInitialDateRangeAndLoadData() {
    const endDateInput = document.getElementById('dashboard-filter-date-end');
    const startDateInput = document.getElementById('dashboard-filter-date-start');

    try {
        const snapshot = await db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isDeleted', '==', false)
            .orderBy('startTime', 'desc')
            .limit(MAX_TOTAL_TIMELOGS)
            .get();

        let startDate, endDate;
        const now = new Date();
        
        if (!snapshot.empty) {
            const allLogs = snapshot.docs.map(d => d.data());
            endDate = allLogs[0].endTime.toDate();
            if (endDate > now) endDate = now;

            const oneMonthBefore = new Date(endDate);
            oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);

            const oldestStart = allLogs[allLogs.length - 1].startTime.toDate();
            startDate = oldestStart < oneMonthBefore ? oldestStart : oneMonthBefore;
        } else {
            // Nessun log, default ultimo 30 giorni
            endDate = now;
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }

        endDateInput.value = endDate.toISOString().split('T')[0];
        startDateInput.value = startDate.toISOString().split('T')[0];

        const filters = getDashboardFilters();
        loadDashboardData(filters);
    } catch (error) {
        console.error('Errore nel recuperare i timeLogs:', error);
        // In caso di errore usa ultimi 30 giorni
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        endDateInput.value = endDate.toISOString().split('T')[0];
        startDateInput.value = startDate.toISOString().split('T')[0];

        const filters = getDashboardFilters();
        loadDashboardData(filters);
    }
}

/** Carica i clienti per il filtro */
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
                const opt = document.createElement('option');
                opt.value = client.name;
                opt.textContent = client.name;
                clientSelect.appendChild(opt);
            });
        })
        .catch(error => console.error('Errore nel caricamento clienti:', error));
}

/** Ottiene i filtri dalla UI */
function getDashboardFilters() {
    const startDateVal = document.getElementById('dashboard-filter-date-start').value;
    const endDateVal = document.getElementById('dashboard-filter-date-end').value;
    const clientName = document.getElementById('dashboard-filter-client').value;
    const maxLogsVal = document.getElementById('dashboard-filter-max-timelogs').value;

    const filters = {};
    if (startDateVal) filters.startDate = new Date(startDateVal + 'T00:00:00');
    if (endDateVal) filters.endDate = new Date(endDateVal + 'T23:59:59');
    if (clientName) filters.clientName = clientName;
    filters.maxTimeLogsPerClient = maxLogsVal ? parseInt(maxLogsVal) : 30;

    return filters;
}

/** Carica i dati da Firestore e aggiorna i grafici */
async function loadDashboardData(filters) {
    try {
        let query = db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isDeleted', '==', false);

        if (filters.clientName) {
            query = query.where('clientName', '==', filters.clientName);
        }
        // Filtro date
        if (filters.startDate) {
            query = query.where('startTime', '>=', firebase.firestore.Timestamp.fromDate(filters.startDate));
        }
        if (filters.endDate) {
            query = query.where('startTime', '<=', firebase.firestore.Timestamp.fromDate(filters.endDate));
        }

        query = query.orderBy('startTime', 'desc').limit(MAX_TOTAL_TIMELOGS);

        const snapshot = await query.get();
        let timeLogs = snapshot.docs.map(d => d.data());

        // Filtraggio client-side (per sicurezza)
        timeLogs = timeLogs.filter(log => {
            const logStart = log.startTime.toDate();
            const logEnd = log.endTime.toDate();
            const startCond = !filters.startDate || logEnd >= filters.startDate;
            const endCond = !filters.endDate || logStart <= filters.endDate;
            return startCond && endCond;
        });

        // Raggruppa per cliente e limita
        const timeLogsByClient = {};
        timeLogs.forEach(log => {
            const cname = log.clientName || 'Sconosciuto';
            if (!timeLogsByClient[cname]) timeLogsByClient[cname] = [];
            timeLogsByClient[cname].push(log);
        });
        for (const cname in timeLogsByClient) {
            timeLogsByClient[cname].sort((a, b) => b.startTime.toDate() - a.startTime.toDate());
            timeLogsByClient[cname] = timeLogsByClient[cname].slice(0, filters.maxTimeLogsPerClient);
        }
        timeLogs = Object.values(timeLogsByClient).flat();

        // Aggiorna grafici
        updateCharts(timeLogs, filters);
    } catch (error) {
        console.error('Errore nel caricamento dei dati della dashboard:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il caricamento dei dati della dashboard.',
            confirmButtonText: 'OK'
        });
    }
}

/** Aggiorna tutti i grafici */
function updateCharts(timeLogs, filters) {
    prepareWorkedTimeChart(timeLogs);
    prepareEarningsChart(timeLogs, filters);
    prepareWorktypeDistributionChart(timeLogs);
    prepareClientWorkedTimeChart(timeLogs);
}

/** Crea il grafico del tempo lavorato giornaliero */
function prepareWorkedTimeChart(timeLogs) {
    const canvas = document.getElementById('workedTimeChart');
    if (!canvas) return;
    if (workedTimeChartInstance) workedTimeChartInstance.destroy();

    const workedTimePerDay = {};
    timeLogs.forEach(log => {
        const dateStr = log.startTime.toDate().toLocaleDateString('it-IT');
        const hours = log.duration / 3600;
        workedTimePerDay[dateStr] = (workedTimePerDay[dateStr] || 0) + hours;
    });

    const labels = Object.keys(workedTimePerDay)
        .sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    const data = labels.map(l => workedTimePerDay[l]);

    workedTimeChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Ore Lavorate',
                data,
                backgroundColor: 'rgba(40, 167, 69, 0.6)',
                borderColor: 'rgba(40, 167, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Data' }},
                y: { title: { display: true, text: 'Ore' }, beginAtZero: true }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: hoursTooltipCallback
                    }
                }
            }
        }
    });
}

/** Crea il grafico dei guadagni */
function prepareEarningsChart(timeLogs, filters) {
    const canvas = document.getElementById('earningsChart');
    if (!canvas) return;
    if (earningsChartInstance) earningsChartInstance.destroy();

    const clientNames = new Set(timeLogs.map(l => l.clientName));
    const getDateStr = log => log.startTime.toDate().toLocaleDateString('it-IT');

    if (filters.clientName || earningsChartViewMode === 'combined' || clientNames.size === 1) {
        // Combinato
        const earningsPerDay = {};
        timeLogs.forEach(log => {
            const dateStr = getDateStr(log);
            const hr = log.hourlyRate || 0;
            const amount = (log.duration / 3600) * hr;
            earningsPerDay[dateStr] = (earningsPerDay[dateStr] || 0) + amount;
        });
        const labels = Object.keys(earningsPerDay)
            .sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        const data = labels.map(l => earningsPerDay[l]);

        earningsChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Guadagni (€)',
                    data,
                    backgroundColor: 'rgba(23, 162, 184, 0.6)',
                    borderColor: 'rgba(23, 162, 184, 1)',
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Data' }},
                    y: { title: { display: true, text: 'Euro (€)' }, beginAtZero: true }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: earningsTooltipCallback
                        }
                    }
                }
            }
        });
    } else {
        // Per Cliente
        const earningsPerDayPerClient = {};
        timeLogs.forEach(log => {
            const dateStr = getDateStr(log);
            const hr = log.hourlyRate || 0;
            const amount = (log.duration / 3600) * hr;
            if (!earningsPerDayPerClient[log.clientName]) earningsPerDayPerClient[log.clientName] = {};
            earningsPerDayPerClient[log.clientName][dateStr] = (earningsPerDayPerClient[log.clientName][dateStr] || 0) + amount;
        });

        const allDates = new Set();
        Object.values(earningsPerDayPerClient).forEach(clientObj => {
            Object.keys(clientObj).forEach(d => allDates.add(d));
        });
        const labels = Array.from(allDates)
            .sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

        const datasets = [];
        const colors = ['rgba(23,162,184,1)', 'rgba(220,53,69,1)', 'rgba(255,193,7,1)', 'rgba(40,167,69,1)', 'rgba(102,16,242,1)'];
        let cIndex = 0;
        clientNames.forEach(cn => {
            const color = colors[cIndex % colors.length];
            cIndex++;
            const data = labels.map(l => (earningsPerDayPerClient[cn][l] || 0));
            datasets.push({
                label: cn,
                data,
                backgroundColor: color.replace('1)', '0.6)'),
                borderColor: color,
                borderWidth: 2,
                fill: false
            });
        });

        earningsChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels, datasets },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Data' }},
                    y: { title: { display: true, text: 'Euro (€)' }, beginAtZero: true }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: earningsTooltipCallback
                        }
                    }
                }
            }
        });
    }
}

/** Crea il grafico a torta della distribuzione dei tipi di lavoro */
const colorPalette = [
    '#f94144','#f3722c','#f8961e','#f9c74f',
    '#90be6d','#43aa8b','#4d908e','#577590','#277da1',
    '#9b5de5','#f15bb5','#fee440','#00bbf9','#00f5d4',
    '#b5179e','#7209b7','#560bad','#480ca8','#3a0ca3',
    '#3f37c9','#4361ee','#4895ef','#4cc9f0','#6a4c93'
];

function prepareWorktypeDistributionChart(timeLogs) {
    const canvas = document.getElementById('worktypeDistributionChart');
    if (!canvas) return;
    if (worktypeDistributionChartInstance) worktypeDistributionChartInstance.destroy();

    const worktypeDistribution = {};
    timeLogs.forEach(log => {
        const wName = log.worktypeName || 'Sconosciuto';
        const hours = log.duration / 3600;
        worktypeDistribution[wName] = (worktypeDistribution[wName] || 0) + hours;
    });

    const labels = Object.keys(worktypeDistribution);
    const data = labels.map(l => worktypeDistribution[l]);
    const backgroundColors = labels.map((_, i) => colorPalette[i % colorPalette.length]);

    worktypeDistributionChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                label: 'Ore Lavorate',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            // maintainAspectRatio: true, // lascialo commentato se vuoi più elasticità
            plugins: {
                tooltip: {
                    callbacks: {
                        label: hoursTooltipPieCallback
                    }
                },
                legend: {
                    position: 'bottom', // leggenda sotto il grafico
                    labels: {
                        boxWidth: 20,
                        boxHeight: 20,
                        padding: 10
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20
                }
            }
        }
    });
}

/** Crea il grafico a barre del tempo lavorato per cliente */
function prepareClientWorkedTimeChart(timeLogs) {
    const canvas = document.getElementById('clientWorkedTimeChart');
    if (!canvas) return;
    if (clientWorkedTimeChartInstance) clientWorkedTimeChartInstance.destroy();

    const workedTimePerClient = {};
    timeLogs.forEach(log => {
        const cname = log.clientName || 'Sconosciuto';
        const hours = log.duration / 3600;
        workedTimePerClient[cname] = (workedTimePerClient[cname] || 0) + hours;
    });

    const labels = Object.keys(workedTimePerClient);
    const data = labels.map(l => workedTimePerClient[l]);

    clientWorkedTimeChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Ore Lavorate per Cliente',
                data,
                backgroundColor: 'rgba(0, 123, 255, 0.6)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Cliente' }},
                y: { title: { display: true, text: 'Ore' }, beginAtZero: true }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: hoursTooltipCallback
                    }
                }
            }
        }
    });
}
