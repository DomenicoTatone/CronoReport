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
            <div>
                <button id="expand-all-btn" class="btn btn-outline-light btn-sm">
                    <i class="fas fa-plus-square"></i> Espandi Tutto
                </button>
                <button id="collapse-all-btn" class="btn btn-outline-light btn-sm">
                    <i class="fas fa-minus-square"></i> Comprimi Tutto
                </button>
                <button id="refresh-report-history-btn" class="btn btn-outline-light btn-sm">
                    <i class="fas fa-sync-alt"></i> Aggiorna
                </button>
            </div>
        </div>
        <div class="card-body">
            <div class="form-group">
                <input type="text" id="search-report-input" class="form-control" placeholder="Cerca nei report...">
            </div>
            <div class="accordion" id="reportHistoryAccordion">
                <!-- Report saranno popolati dinamicamente -->
            </div>
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
    const searchReportInput = document.getElementById('search-report-input');
    const expandAllBtn = document.getElementById('expand-all-btn');
    const collapseAllBtn = document.getElementById('collapse-all-btn');

    /**
     * Funzione per caricare lo storico dei report
     */
    function loadReportHistory(searchTerm = '') {
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
                    let reportsArray = [];
                    snapshot.forEach((doc) => {
                        const reportData = doc.data();
                        const reportId = doc.id;
        
                        // **Aggiungi questo controllo per filtrare i report eliminati**
                        if (reportData.isDeleted && reportData.isDeleted === true) {
                            // Salta questo report perché è stato eliminato
                            return;
                        }
        
                        reportsArray.push({
                            id: reportId,
                            data: reportData
                        });
                    });

                    // Filtra i report in base al termine di ricerca
                    if (searchTerm) {
                        const lowerSearchTerm = searchTerm.toLowerCase();
                        reportsArray = reportsArray.filter(report => {
                            const reportData = report.data;
                            return Object.values(reportData).some(value => {
                                if (typeof value === 'string') {
                                    return value.toLowerCase().includes(lowerSearchTerm);
                                } else if (typeof value === 'number') {
                                    return value.toString().includes(lowerSearchTerm);
                                } else if (value instanceof firebase.firestore.Timestamp) {
                                    const dateStr = value.toDate().toLocaleDateString();
                                    return dateStr.includes(lowerSearchTerm);
                                }
                                return false;
                            });
                        });
                    }

                    // Raggruppa i report per cliente e anno
                    const reportsByClientYear = {};

                    reportsArray.forEach(report => {
                        const reportData = report.data;
                        const reportId = report.id;
    
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
                        clientHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                        clientHeader.id = `heading-${clientId}`;
    
                        const clientButton = document.createElement('button');
                        clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                        clientButton.setAttribute('data-toggle', 'collapse');
                        clientButton.setAttribute('data-target', `#collapse-${clientId}`);
                        clientButton.setAttribute('aria-expanded', 'false');
                        clientButton.setAttribute('aria-controls', `collapse-${clientId}`);
                        clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;
    
                        // Create delete button for client
                        const deleteClientButton = document.createElement('button');
                        deleteClientButton.classList.add('btn', 'btn-sm', 'p-1');
                        deleteClientButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                        
                        // Evento per eliminare tutti i report del cliente
                        deleteClientButton.addEventListener('click', (e) => {
                            e.stopPropagation();
                            Swal.fire({
                                title: 'Sei sicuro?',
                                text: `Vuoi eliminare tutti i report del cliente "${clientName}"? Saranno spostati nel cestino.`,
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#d33',
                                cancelButtonColor: '#6c757d',
                                confirmButtonText: 'Sì, elimina tutti!',
                                cancelButtonText: 'Annulla'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    deleteReportsByClient(clientName);
                                }
                            });
                        });
    
                        const clientHeaderActions = document.createElement('div');
                        clientHeaderActions.appendChild(deleteClientButton);
    
                        clientHeader.appendChild(clientButton);
                        clientHeader.appendChild(clientHeaderActions);
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
                            yearHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                            yearHeader.id = `heading-${yearId}`;
    
                            const yearButton = document.createElement('button');
                            yearButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                            yearButton.setAttribute('data-toggle', 'collapse');
                            yearButton.setAttribute('data-target', `#collapse-${yearId}`);
                            yearButton.setAttribute('aria-expanded', 'false');
                            yearButton.setAttribute('aria-controls', `collapse-${yearId}`);
                            yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;
    
                            // Create delete button for year
                            const deleteYearButton = document.createElement('button');
                            deleteYearButton.classList.add('btn', 'btn-sm', 'p-1');
                            deleteYearButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
                            
                            // Evento per eliminare tutti i report dell'anno
                            deleteYearButton.addEventListener('click', (e) => {
                                e.stopPropagation();
                                Swal.fire({
                                    title: 'Sei sicuro?',
                                    text: `Vuoi eliminare tutti i report dell'anno "${year}" per il cliente "${clientName}"? Saranno spostati nel cestino.`,
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#d33',
                                    cancelButtonColor: '#6c757d',
                                    confirmButtonText: 'Sì, elimina tutti!',
                                    cancelButtonText: 'Annulla'
                                }).then((result) => {
                                    if (result.isConfirmed) {
                                        deleteReportsByClientYear(clientName, year);
                                    }
                                });
                            });
    
                            const yearHeaderActions = document.createElement('div');
                            yearHeaderActions.appendChild(deleteYearButton);
    
                            yearHeader.appendChild(yearButton);
                            yearHeader.appendChild(yearHeaderActions);
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
                                                    loadReportHistory(searchReportInput.value.trim());
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

                                // Eventi per cambiare l'icona del report
                                $(reportCollapse).on('show.bs.collapse', function () {
                                    reportHeaderButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${reportData.reportName || 'Report'}`;
                                });
                                $(reportCollapse).on('hide.bs.collapse', function () {
                                    reportHeaderButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${reportData.reportName || 'Report'}`;
                                });
                            });
    
                            yearCollapse.appendChild(yearBody);
                            yearCard.appendChild(yearCollapse);
    
                            yearAccordion.appendChild(yearCard);

                            // Aggiungi eventi per cambiare l'icona del year
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

                        // Aggiungi eventi per cambiare l'icona del client
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
     * Funzione per eliminare tutti i report di un cliente
     */
    function deleteReportsByClient(clientName) {
        let query = db.collection('reports')
            .where('uid', '==', currentUser.uid);
    
        if (clientName === 'Cliente Sconosciuto') {
            // Cerca report con filterClientName null o stringa vuota
            query = query.where('filterClientName', 'in', [null, '']);
        } else {
            query = query.where('filterClientName', '==', clientName);
        }
    
        query.get()
            .then(snapshot => {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.update(doc.ref, {
                        isDeleted: true,
                        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                return batch.commit();
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminati!',
                    text: `Tutti i report del cliente "${clientName}" sono stati spostati nel cestino.`,
                    confirmButtonText: 'OK'
                });
                loadReportHistory(searchReportInput.value.trim());
            })
            .catch(error => {
                console.error('Errore durante l\'eliminazione dei report del cliente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: 'Si è verificato un errore durante l\'eliminazione dei report del cliente.',
                    confirmButtonText: 'OK'
                });
            });
    }

    /**
     * Funzione per eliminare tutti i report di un anno per un cliente
     */
    function deleteReportsByClientYear(clientName, year) {
        let query = db.collection('reports')
            .where('uid', '==', currentUser.uid);
    
        if (clientName === 'Cliente Sconosciuto') {
            // Cerca report con filterClientName null o stringa vuota
            query = query.where('filterClientName', 'in', [null, '']);
        } else {
            query = query.where('filterClientName', '==', clientName);
        }
    
        query.get()
            .then(snapshot => {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    const reportData = doc.data();
                    const reportYear = new Date(reportData.startDate).getFullYear();
                    if (reportYear === parseInt(year)) {
                        batch.update(doc.ref, {
                            isDeleted: true,
                            deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
                return batch.commit();
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminati!',
                    text: `Tutti i report dell'anno "${year}" per il cliente "${clientName}" sono stati spostati nel cestino.`,
                    confirmButtonText: 'OK'
                });
                loadReportHistory(searchReportInput.value.trim());
            })
            .catch(error => {
                console.error('Errore durante l\'eliminazione dei report dell\'anno:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Errore',
                    text: 'Si è verificato un errore durante l\'eliminazione dei report dell\'anno.',
                    confirmButtonText: 'OK'
                });
            });
    }

    /**
     * Funzione per rigenerare e scaricare il report
     * @param {Object} reportData - Dati del report salvato
     */
    function regenerateAndDownloadReport(reportData) {
        if (reportData.reportDataArray && reportData.reportDataArray.length > 0) {
            const totalAmount = reportData.totalAmount || 0;
            const totalHours = reportData.totalHours || 0; // Recupera le ore totali salvate
            const includeHourlyRate = reportData.includeHourlyRate || false;
            const reportHeader = reportData.reportHeader;
            const reportName = reportData.reportName || 'report';
            const reportDataArray = reportData.reportDataArray;
            const companyLogoBase64 = reportData.companyLogoBase64 || '';
    
            // Chiama generatePDF con i parametri nell'ordine corretto
            generatePDF(
                reportHeader,        // 1. Intestazione
                reportDataArray,     // 2. Dati del report
                totalHours,          // 3. Totale Ore
                totalAmount,         // 4. Totale Importo
                companyLogoBase64,   // 5. Logo base64
                reportName,          // 6. Nome del file report
                includeHourlyRate    // 7. Include Hourly Rate
            );
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
        loadReportHistory(searchReportInput.value.trim());
    });

    // Evento per la ricerca
    searchReportInput.addEventListener('input', () => {
        const searchTerm = searchReportInput.value.trim();
        loadReportHistory(searchTerm);
    });

    // Evento per espandere tutti gli elementi
    expandAllBtn.addEventListener('click', () => {
        $('#reportHistoryAccordion .collapse').collapse('show');
    });

    // Evento per comprimere tutti gli elementi
    collapseAllBtn.addEventListener('click', () => {
        $('#reportHistoryAccordion .collapse').collapse('hide');
    });
}
