// reportHistory.js

// Template per la sezione Storico Report
const reportHistoryTemplate = `
<div id="report-history-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-history mr-2"></i>Storico Report
    </h2>
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-file-alt mr-2"></i>Lista Report</h5>
            <button id="refresh-report-history-btn" class="btn btn-outline-light btn-sm">
                <i class="fas fa-sync-alt"></i> Aggiorna
            </button>
        </div>
        <div class="accordion" id="reportHistoryAccordion">
            <!-- Report saranno popolati dinamicamente -->
        </div>
    </div>
</div>
`;

/**
 * Funzione per inizializzare gli eventi della sezione Storico Report
 */
function initializeReportHistoryEvents() {
    const reportHistoryAccordion = document.getElementById('reportHistoryAccordion');
    const refreshReportHistoryBtn = document.getElementById('refresh-report-history-btn');

    /**
     * Funzione per caricare lo storico dei report
     */
    function loadReportHistory() {
        reportHistoryAccordion.innerHTML = ''; // Svuota la lista
        db.collection('reports')
            .where('uid', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.classList.add('card-body');
                    emptyMessage.textContent = 'Nessun report disponibile.';
                    reportHistoryAccordion.appendChild(emptyMessage);
                } else {
                    snapshot.forEach((doc) => { // Rimosso 'index'
                        const reportData = doc.data();
                        const reportId = doc.id; // Ottieni l'ID del report

                        // Crea gli elementi per l'accordion item
                        const card = document.createElement('div');
                        card.classList.add('card');

                        const cardHeader = document.createElement('div');
                        cardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                        cardHeader.id = `heading-${reportId}`;

                        const headerButton = document.createElement('button');
                        headerButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                        // Verifica la versione di Bootstrap e usa gli attributi corretti
                        headerButton.setAttribute('data-toggle', 'collapse'); // Usa 'data-bs-toggle' per Bootstrap 5
                        headerButton.setAttribute('data-target', `#collapse-${reportId}`); // Usa 'data-bs-target' per Bootstrap 5
                        headerButton.setAttribute('aria-expanded', 'false');
                        headerButton.setAttribute('aria-controls', `collapse-${reportId}`);
                        headerButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${reportData.reportName || 'Report'}`;

                        const deleteButton = document.createElement('button');
                        deleteButton.classList.add('btn', 'btn-sm', 'p-1');
                        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';

                        // Evento per eliminare il report
                        deleteButton.addEventListener('click', (e) => {
                            e.stopPropagation(); // Previene l'apertura/chiusura dell'accordion
                            Swal.fire({
                                title: 'Sei sicuro?',
                                text: 'Vuoi eliminare questo report?',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#6c757d',
                                confirmButtonText: 'Sì, elimina!',
                                cancelButtonText: 'Annulla'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    db.collection('reports').doc(reportId).delete()
                                        .then(() => {
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Eliminato!',
                                                text: 'Il report è stato eliminato.',
                                                confirmButtonText: 'OK'
                                            });
                                            loadReportHistory(); // Ricarica la lista dopo l'eliminazione
                                        })
                                        .catch(error => {
                                            console.error('Errore durante l\'eliminazione del report:', error);
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Errore',
                                                text: 'Si è verificato un errore durante l\'eliminazione del report.',
                                                confirmButtonText: 'OK'
                                            });
                                        });
                                }
                            });
                        });

                        const headerActions = document.createElement('div');
                        headerActions.appendChild(deleteButton);

                        cardHeader.appendChild(headerButton);
                        cardHeader.appendChild(headerActions);

                        const collapseDiv = document.createElement('div');
                        collapseDiv.id = `collapse-${reportId}`;
                        collapseDiv.classList.add('collapse');
                        collapseDiv.setAttribute('aria-labelledby', `heading-${reportId}`);
                        collapseDiv.setAttribute('data-parent', '#reportHistoryAccordion');

                        const cardBody = document.createElement('div');
                        cardBody.classList.add('card-body');

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

                        cardBody.appendChild(reportDetails);
                        cardBody.appendChild(downloadBtn);

                        collapseDiv.appendChild(cardBody);

                        card.appendChild(cardHeader);
                        card.appendChild(collapseDiv);

                        reportHistoryAccordion.appendChild(card);

                        // Aggiungi evento per cambiare l'icona al clic
                        $(collapseDiv).on('show.bs.collapse', function () {
                            headerButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${reportData.reportName || 'Report'}`;
                        });
                        $(collapseDiv).on('hide.bs.collapse', function () {
                            headerButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${reportData.reportName || 'Report'}`;
                        });
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
