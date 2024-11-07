// reportHistory.js

// Template per la sezione Storico Report
const reportHistoryTemplate = `
<div id="report-history-section" class="container mt-5">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Storico Report</h2>
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-file-alt mr-2"></i>Lista Report</h5>
            <button id="refresh-report-history-btn" class="btn btn-outline-light btn-sm">
                <i class="fas fa-sync-alt"></i> Aggiorna
            </button>
        </div>
        <ul id="report-history-list" class="list-group list-group-flush">
            <!-- Report saranno popolati dinamicamente -->
        </ul>
    </div>
</div>
`;

/**
 * Funzione per inizializzare gli eventi della sezione Storico Report
 */
function initializeReportHistoryEvents() {
    const reportHistoryList = document.getElementById('report-history-list');
    const refreshReportHistoryBtn = document.getElementById('refresh-report-history-btn');

    /**
     * Funzione per caricare lo storico dei report
     */
    function loadReportHistory() {
        reportHistoryList.innerHTML = ''; // Svuota la lista
        db.collection('reports')
            .where('uid', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    const li = document.createElement('li');
                    li.classList.add('list-group-item');
                    li.textContent = 'Nessun report disponibile.';
                    reportHistoryList.appendChild(li);
                } else {
                    snapshot.forEach(doc => {
                        const reportData = doc.data();
                        const li = document.createElement('li');
                        li.classList.add('list-group-item');

                        const headerDiv = document.createElement('div');
                        headerDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center');

                        const reportTitle = document.createElement('span');
                        reportTitle.textContent = reportData.reportName || 'Report';

                        const toggleButton = document.createElement('button');
                        toggleButton.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
                        toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';

                        headerDiv.appendChild(reportTitle);
                        headerDiv.appendChild(toggleButton);

                        const detailsDiv = document.createElement('div');
                        detailsDiv.style.display = 'none';
                        detailsDiv.classList.add('mt-2');

                        // Aggiungi i dettagli del report
                        const reportDetails = document.createElement('p');
                        reportDetails.innerHTML = `
                            <strong>Intestazione:</strong> ${reportData.reportHeader}<br>
                            <strong>Tariffa Oraria:</strong> €${reportData.hourlyRate}<br>
                            <strong>Data Inizio:</strong> ${reportData.startDate}<br>
                            <strong>Data Fine:</strong> ${reportData.endDate}<br>
                            <strong>Cliente:</strong> ${reportData.filterClientName || 'Tutti'}<br>
                            <strong>Sito:</strong> ${reportData.filterSiteName || 'Tutti'}<br>
                            <strong>Tipo di Lavoro:</strong> ${reportData.filterWorktypeName || 'Tutti'}<br>
                            <strong>Totale:</strong> €${parseFloat(reportData.totalAmount).toFixed(2)}
                        `;

                        const downloadBtn = document.createElement('button');
                        downloadBtn.classList.add('btn', 'btn-success', 'mt-2');
                        downloadBtn.innerHTML = '<i class="fas fa-file-pdf mr-2"></i>Scarica PDF';

                        // Evento per rigenerare e scaricare il report
                        downloadBtn.addEventListener('click', () => {
                            regenerateAndDownloadReport(reportData);
                        });

                        detailsDiv.appendChild(reportDetails);
                        detailsDiv.appendChild(downloadBtn);

                        li.appendChild(headerDiv);
                        li.appendChild(detailsDiv);

                        // Evento per mostrare/nascondere i dettagli
                        toggleButton.addEventListener('click', () => {
                            if (detailsDiv.style.display === 'none') {
                                detailsDiv.style.display = 'block';
                                toggleButton.innerHTML = '<i class="fas fa-chevron-up"></i>';
                            } else {
                                detailsDiv.style.display = 'none';
                                toggleButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
                            }
                        });

                        reportHistoryList.appendChild(li);
                    });
                }
            })
            .catch(error => {
                console.error('Errore nel caricamento dello storico report:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: 'Si è verificato un errore durante il caricamento dello storico report.',
                    confirmButtonText: 'OK'
                });
            });
    }

    /**
     * Funzione per rigenerare e scaricare il report
     * @param {Object} reportData - Dati del report salvato
     */
    function regenerateAndDownloadReport(reportData) {
        // Simile alla funzione utilizzata per generare il report in reportEvents.js
        // Ricrea il report basandosi sui filtri e intervallo di date salvati

        let query = db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(new Date(reportData.startDate)))
            .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(new Date(reportData.endDate)));

        if (reportData.filterClient) {
            query = query.where('clientId', '==', reportData.filterClient);
        }
        if (reportData.filterSite) {
            query = query.where('siteId', '==', reportData.filterSite);
        }
        if (reportData.filterWorktype) {
            query = query.where('worktypeId', '==', reportData.filterWorktype);
        }

        query.orderBy('startTime', 'asc')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Nessun Dato',
                        text: 'Non ci sono dati disponibili per ricreare questo report.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                let totalAmount = 0;
                let reportDataArray = [];

                snapshot.forEach(doc => {
                    const logData = doc.data();

                    const durationInHours = logData.duration / 3600;
                    const amount = durationInHours * reportData.hourlyRate;
                    totalAmount += amount;

                    const linkText = logData.link ? extractDomainName(logData.link) : '-';

                    const dataRow = {
                        date: new Date(logData.startTime.seconds * 1000).toLocaleDateString(),
                        workType: logData.worktypeName,
                        link: logData.link || '',
                        linkText: linkText,
                        timeWorked: formatDuration(logData.duration),
                        amount: amount.toFixed(2)
                    };

                    reportDataArray.push(dataRow);
                });

                // Genera il PDF utilizzando la funzione esistente
                generatePDF(reportData.reportHeader, reportDataArray, totalAmount, reportData.companyLogoBase64);

            })
            .catch(error => {
                console.error('Errore nel caricamento dei dati per il report:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: 'Si è verificato un errore durante il caricamento dei dati del report.',
                    confirmButtonText: 'OK'
                });
            });
    }

    // Carica lo storico report all'avvio
    loadReportHistory();

    // Evento per il pulsante di aggiornamento
    refreshReportHistoryBtn.addEventListener('click', () => {
        loadReportHistory();
    });
}
