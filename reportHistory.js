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
                    const reportsByClientYear = {};
    
                    snapshot.forEach((doc) => {
                        const reportData = doc.data();
                        const reportId = doc.id;
    
                        // **Aggiungi questo controllo per filtrare i report eliminati**
                        if (reportData.isDeleted && reportData.isDeleted === true) {
                            // Salta questo report perché è stato eliminato
                            return;
                        }
    
                        const clientName = reportData.filterClientName || 'Cliente Sconosciuto';
                        const reportYear = new Date(reportData.startDate).getFullYear();
    
                        if (!reportsByClientYear[clientName]) {
                            reportsByClientYear[clientName] = {};
                        }
                        if (!reportsByClientYear[clientName][reportYear]) {
                            reportsByClientYear[clientName][reportYear] = [];
                        }
    
                        reportsByClientYear[clientName][reportYear].push({
                            id: reportId,
                            data: reportData
                        });
                    });

                    // Crea l'accordion per cliente e anno
                    let clientIndex = 0;
                    for (let clientName in reportsByClientYear) {
                        clientIndex++;
                        const clientId = `client-${clientIndex}`;
                        const clientCard = document.createElement('div');
                        clientCard.classList.add('card');

                        const clientHeader = document.createElement('div');
                        clientHeader.classList.add('card-header');
                        clientHeader.id = `heading-${clientId}`;

                        const clientButton = document.createElement('button');
                        clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                        clientButton.setAttribute('data-toggle', 'collapse');
                        clientButton.setAttribute('data-target', `#collapse-${clientId}`);
                        clientButton.setAttribute('aria-expanded', 'false');
                        clientButton.setAttribute('aria-controls', `collapse-${clientId}`);
                        clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;

                        clientHeader.appendChild(clientButton);
                        clientCard.appendChild(clientHeader);

                        const clientCollapse = document.createElement('div');
                        clientCollapse.id = `collapse-${clientId}`;
                        clientCollapse.classList.add('collapse');
                        clientCollapse.setAttribute('aria-labelledby', `heading-${clientId}`);
                        clientCollapse.setAttribute('data-parent', '#reportHistoryAccordion');

                        const clientBody = document.createElement('div');
                        clientBody.classList.add('card-body');

                        const yearAccordion = document.createElement('div');
                        yearAccordion.classList.add('accordion');
                        yearAccordion.id = `yearAccordion-${clientId}`;

                        let yearIndex = 0;
                        for (let year in reportsByClientYear[clientName]) {
                            yearIndex++;
                            const yearId = `${clientId}-year-${yearIndex}`;
                            const yearCard = document.createElement('div');
                            yearCard.classList.add('card');

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

                            yearHeader.appendChild(yearButton);
                            yearCard.appendChild(yearHeader);

                            const yearCollapse = document.createElement('div');
                            yearCollapse.id = `collapse-${yearId}`;
                            yearCollapse.classList.add('collapse');
                            yearCollapse.setAttribute('aria-labelledby', `heading-${yearId}`);
                            yearCollapse.setAttribute('data-parent', `#yearAccordion-${clientId}`);

                            const yearBody = document.createElement('div');
                            yearBody.classList.add('card-body');

                            // Aggiungi i report per questo anno
                            reportsByClientYear[clientName][year].forEach(report => {
                                const reportData = report.data;
                                const reportId = report.id;

                                // Crea gli elementi per il report
                                const reportCard = document.createElement('div');
                                reportCard.classList.add('card', 'mb-2');

                                const reportCardHeader = document.createElement('div');
                                reportCardHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                                reportCardHeader.id = `heading-${reportId}`;

                                const reportHeaderButton = document.createElement('button');
                                reportHeaderButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                                reportHeaderButton.setAttribute('data-toggle', 'collapse');
                                reportHeaderButton.setAttribute('data-target', `#collapse-${reportId}`);
                                reportHeaderButton.setAttribute('aria-expanded', 'false');
                                reportHeaderButton.setAttribute('aria-controls', `collapse-${reportId}`);
                                reportHeaderButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${reportData.reportName || 'Report'}`;

                                const deleteButton = document.createElement('button');
                                deleteButton.classList.add('btn', 'btn-sm', 'p-1');
                                deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                                
                                // Evento per eliminare il report
                                deleteButton.addEventListener('click', (e) => {
                                    e.stopPropagation();
                                    Swal.fire({
                                        title: 'Sei sicuro?',
                                        text: 'Vuoi eliminare questo report? Sarà spostato nel cestino.',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        cancelButtonColor: '#6c757d',
                                        confirmButtonText: 'Sì, elimina!',
                                        cancelButtonText: 'Annulla'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            db.collection('reports').doc(reportId).update({
                                                isDeleted: true,
                                                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                                            })
                                                .then(() => {
                                                    Swal.fire({
                                                        icon: 'success',
                                                        title: 'Eliminato!',
                                                        text: 'Il report è stato spostato nel cestino.',
                                                        confirmButtonText: 'OK'
                                                    });
                                                    loadReportHistory();
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
                                
                                const reportHeaderActions = document.createElement('div');
                                reportHeaderActions.appendChild(deleteButton);

                                reportCardHeader.appendChild(reportHeaderButton);
                                reportCardHeader.appendChild(reportHeaderActions);

                                const reportCollapse = document.createElement('div');
                                reportCollapse.id = `collapse-${reportId}`;
                                reportCollapse.classList.add('collapse');
                                reportCollapse.setAttribute('aria-labelledby', `heading-${reportId}`);
                                reportCollapse.setAttribute('data-parent', `#collapse-${yearId}`);

                                const reportCardBody = document.createElement('div');
                                reportCardBody.classList.add('card-body');

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

                                reportCardBody.appendChild(reportDetails);
                                reportCardBody.appendChild(downloadBtn);

                                reportCollapse.appendChild(reportCardBody);

                                reportCard.appendChild(reportCardHeader);
                                reportCard.appendChild(reportCollapse);

                                yearBody.appendChild(reportCard);
                            });

                            yearCollapse.appendChild(yearBody);
                            yearCard.appendChild(yearCollapse);

                            yearAccordion.appendChild(yearCard);

                            // Aggiungi eventi per cambiare l'icona
                            $(yearCollapse).on('show.bs.collapse', function () {
                                yearButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${year}`;
                            });
                            $(yearCollapse).on('hide.bs.collapse', function () {
                                yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;
                            });
                        }

                        clientBody.appendChild(yearAccordion);
                        clientCollapse.appendChild(clientBody);
                        clientCard.appendChild(clientCollapse);

                        reportHistoryAccordion.appendChild(clientCard);

                        // Aggiungi eventi per cambiare l'icona
                        $(clientCollapse).on('show.bs.collapse', function () {
                            clientButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${clientName}`;
                        });
                        $(clientCollapse).on('hide.bs.collapse', function () {
                            clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;
                        });
                    }
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
        // Utilizza i dati salvati nel report per rigenerare il report
        if (reportData.reportDataArray && reportData.reportDataArray.length > 0) {
            const totalAmount = reportData.totalAmount || 0;

            // Genera il PDF utilizzando i dati salvati
            generatePDF(reportData.reportHeader, reportData.reportDataArray, totalAmount, reportData.companyLogoBase64);
        } else {
            Swal.fire({
                icon: 'info',
                title: 'Nessun Dato',
                text: 'Non ci sono dati disponibili per questo report.',
                confirmButtonText: 'OK'
            });
        }
    }

    // Carica lo storico report all'avvio
    loadReportHistory();

    // Evento per il pulsante di aggiornamento
    refreshReportHistoryBtn.addEventListener('click', () => {
        loadReportHistory();
    });
}
