// reportEvents.js

// Variabili globali necessarie
let savedConfigSelect;
let deleteConfigBtn;
let configNameInput;
let companyLogoInput;
let exportGoogleDocBtn;
let exportGoogleSheetBtn;

// Funzione per inizializzare gli eventi della sezione Report
function initializeReportEvents() {
    // Controlla se currentUser è disponibile
    if (!currentUser) {
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                currentUser = user;
                setupReportSection();
            } else {
                window.location.href = 'login.html';
            }
        });
    } else {
        setupReportSection();
    }
}

// Funzione per caricare le tariffe orarie dei tipi di lavoro
function loadWorktypeRates() {
    return db.collection('worktypes')
        .where('uid', '==', currentUser.uid)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const worktypeData = doc.data();
                worktypeRates[doc.id] = worktypeData.hourlyRate || 0;
            });
            return worktypeRates;
        })
        .catch(error => {
            console.error('Errore nel caricamento delle tariffe dei tipi di lavoro:', error);
        });
}

// Funzione per impostare la sezione Report
function setupReportSection() {
    const reportForm = document.getElementById('report-form');
    const reportContent = document.getElementById('report-content');
    const reportHeaderDisplay = document.getElementById('report-header-display');
    const reportTableBody = document.getElementById('report-table-body');
    const totalAmountDisplay = document.getElementById('total-amount');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    const filterClientSelect = document.getElementById('filter-client');
    const filterSiteSelect = document.getElementById('filter-site');
    const filterWorktypeSelect = document.getElementById('filter-worktype');

    // Carica i clienti
    loadClients(filterClientSelect);

    filterClientSelect.addEventListener('change', () => {
        const selectedClientId = filterClientSelect.value;
        if (selectedClientId) {
            loadSites(filterSiteSelect, selectedClientId);
            loadWorktypes(filterWorktypeSelect, selectedClientId);
        } else {
            filterSiteSelect.innerHTML = '<option value="">Tutti i Siti</option>';
            filterWorktypeSelect.innerHTML = '<option value="">Tutti i Tipi di Lavoro</option>';
        }
    });

    exportGoogleDocBtn = document.getElementById('export-google-doc-btn');
    exportGoogleSheetBtn = document.getElementById('export-google-sheet-btn');

    if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
    if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;

    setAutoDateRange();

    savedConfigSelect = document.getElementById('saved-config-select');
    deleteConfigBtn = document.getElementById('delete-config-btn');
    configNameInput = document.getElementById('config-name');
    companyLogoInput = document.getElementById('company-logo');

    companyLogoInput.addEventListener('change', () => {
        const file = companyLogoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                companyLogoBase64 = e.target.result;
                displayLogoPreview(companyLogoBase64);
            };
            reader.readAsDataURL(file);
        }
    });

    loadSavedConfigs();

    savedConfigSelect.addEventListener('change', () => {
        const selectedConfigId = savedConfigSelect.value;
        if (selectedConfigId) {
            applySavedConfig(selectedConfigId);
            deleteConfigBtn.style.display = 'inline-block';
        } else {
            reportForm.reset();
            companyLogoBase64 = '';
            deleteConfigBtn.style.display = 'none';
            clearLogoPreview();
        }
    });

    deleteConfigBtn.addEventListener('click', () => {
        const selectedConfigId = savedConfigSelect.value;
        if (selectedConfigId) {
            Swal.fire({
                title: 'Sei sicuro?',
                text: 'Vuoi eliminare questa configurazione?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sì, elimina!',
                cancelButtonText: 'Annulla'
            }).then((result) => {
                if (result.isConfirmed) {
                    db.collection('reportConfigs').doc(selectedConfigId).delete()
                        .then(() => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Configurazione Eliminata',
                                text: 'La configurazione è stata eliminata con successo.',
                                confirmButtonText: 'OK'
                            });
                            loadSavedConfigs();
                            reportForm.reset();
                            companyLogoBase64 = '';
                            deleteConfigBtn.style.display = 'none';
                            clearLogoPreview();
                        })
                        .catch(error => {
                            console.error('Errore durante l\'eliminazione della configurazione:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Errore',
                                text: 'Si è verificato un errore durante l\'eliminazione della configurazione.',
                                confirmButtonText: 'OK'
                            });
                        });
                }
            });
        }
    });

    function markTimersAsReported(timerIds) {
        timerIds.forEach(timerId => {
            db.collection('timeLogs').doc(timerId).update({
                isReported: true
            }).catch(error => {
                console.error('Errore nel contrassegnare il timer come reportato:', error);
            });
        });
    }

    function setAutoDateRange() {
        db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isReported', '==', false)
            .orderBy('startTime', 'asc')
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    const firstTimer = snapshot.docs[0].data();
                    const lastTimer = snapshot.docs[snapshot.docs.length - 1].data();
                    startDateInput.value = new Date(firstTimer.startTime.seconds * 1000).toISOString().split('T')[0];
                    endDateInput.value = new Date(lastTimer.startTime.seconds * 1000).toISOString().split('T')[0];
                }
            })
            .catch(error => {
                console.error('Errore nel recupero dei timer non reportati:', error);
            });
    }

    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadWorktypeRates().then(() => {
            generateReport();
        }).catch(error => {
            console.error('Errore nel caricamento delle tariffe orarie:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante il caricamento delle tariffe orarie.',
                confirmButtonText: 'OK'
            });
        });
    });

    function generateReport() {
        const reportHeader = document.getElementById('report-header').value.trim();
        const startDateInputVal = startDateInput.value;
        const endDateInputVal = endDateInput.value;
        const configName = configNameInput.value.trim();
    
        const includeHourlyRate = document.getElementById('include-hourly-rate').checked;
        const onlyUnreported = document.getElementById('only-unreported').checked;
    
        let errorMessage = '';
    
        if (!reportHeader) errorMessage += '• Inserisci l\'intestazione del report.\n';
        if (!startDateInputVal) errorMessage += '• Seleziona una data di inizio.\n';
        if (!endDateInputVal) errorMessage += '• Seleziona una data di fine.\n';
        if (startDateInputVal && endDateInputVal && new Date(startDateInputVal) > new Date(endDateInputVal)) {
            errorMessage += '• La data di inizio non può essere successiva alla data di fine.\n';
        }
    
        const filterClient = document.getElementById('filter-client').value;
        const filterSite = document.getElementById('filter-site').value;
        const filterWorktype = document.getElementById('filter-worktype').value;
    
        if (!filterClient) errorMessage += '• Seleziona un cliente per il filtro.\n';
    
        if (errorMessage) {
            Swal.fire({
                icon: 'warning',
                title: 'Attenzione',
                html: errorMessage.replace(/\n/g, '<br>'),
                confirmButtonText: 'OK'
            });
            return;
        }
    
        if (configName) {
            saveReportConfig({
                name: configName,
                reportHeader,
                companyLogoBase64,
                filterClient,
                filterSite,
                filterWorktype
            });
        }
    
        reportTableBody.innerHTML = '';
        totalAmountDisplay.textContent = '0.00';
    
        const reportFileName = `${reportHeader} - ${startDateInputVal} a ${endDateInputVal}`;
        function sanitizeFileName(fileName) {
            return fileName.replace(/[\/\\?%*:|"<>]/g, '-');
        }
        const sanitizedReportFileName = sanitizeFileName(reportFileName);
    
        reportHeaderDisplay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                ${companyLogoBase64 ? `<img src="${companyLogoBase64}" alt="Logo Aziendale" style="height: 50px; margin-right: 20px;"/>` : ''}
                <h3 style="margin: 0;">${reportHeader}</h3>
            </div>
        `;
    
        const startDate = new Date(startDateInputVal);
        const endDate = new Date(endDateInputVal);
        endDate.setHours(23, 59, 59, 999);
    
        let query = db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isDeleted', '==', false)
            .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endDate));
    
        if (filterClient) query = query.where('clientId', '==', filterClient);
        if (filterSite) query = query.where('siteId', '==', filterSite);
        if (filterWorktype) query = query.where('worktypeId', '==', filterWorktype);
        if (onlyUnreported) query = query.where('isReported', '==', false);
    
        query.orderBy('startTime', 'asc')
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Nessun Dato',
                        text: 'Non ci sono dati disponibili per l\'intervallo di date e i filtri selezionati.',
                        confirmButtonText: 'OK'
                    });
                    return;
                }
    
                const reportTableHeader = document.querySelector('#report-content thead');
                let tableHeaders = `
                    <tr>
                        <th>Data</th>
                        <th>Tipo di Lavoro</th>
                        ${includeHourlyRate ? '<th>Tariffa Oraria (€)</th>' : ''}
                        <th>Link</th>
                        <th>Tempo Lavorato</th>
                        <th>Importo (€)</th>
                    </tr>
                `;
                reportTableHeader.innerHTML = tableHeaders;
    
                let totalAmount = 0;
                let reportData = [];
                let timerIds = [];
    
                snapshot.forEach(doc => {
                    const logData = doc.data();
                    timerIds.push(doc.id);
    
                    const durationInHours = logData.duration / 3600;
                    const worktypeId = logData.worktypeId;
                    const hourlyRate = worktypeRates[worktypeId] || 0;
                    const amount = durationInHours * hourlyRate;
                    totalAmount += amount;
    
                    const linkText = logData.link ? extractDomainName(logData.link) : '-';
    
                    const dataRow = {
                        date: new Date(logData.startTime.seconds * 1000).toLocaleDateString(),
                        workType: logData.worktypeName,
                        hourlyRate: hourlyRate.toFixed(2),
                        link: logData.link || '',
                        linkText: linkText,
                        timeWorked: formatDuration(logData.duration),
                        amount: amount.toFixed(2)
                    };
    
                    reportData.push(dataRow);
    
                    const tr = document.createElement('tr');
    
                    const tdDate = document.createElement('td');
                    tdDate.textContent = dataRow.date;
    
                    const tdWorkType = document.createElement('td');
                    tdWorkType.textContent = dataRow.workType;
    
                    const tdHourlyRate = document.createElement('td');
                    tdHourlyRate.textContent = `€ ${dataRow.hourlyRate}`;
    
                    const tdLink = document.createElement('td');
                    if (dataRow.link) {
                        const linkElement = document.createElement('a');
                        linkElement.href = dataRow.link;
                        linkElement.target = '_blank';
                        linkElement.textContent = dataRow.linkText;
                        tdLink.appendChild(linkElement);
                    } else {
                        tdLink.textContent = '-';
                    }
    
                    const tdTimeWorked = document.createElement('td');
                    tdTimeWorked.textContent = dataRow.timeWorked;
    
                    const tdAmount = document.createElement('td');
                    tdAmount.textContent = `€ ${dataRow.amount}`;
    
                    tr.appendChild(tdDate);
                    tr.appendChild(tdWorkType);
                    if (includeHourlyRate) tr.appendChild(tdHourlyRate);
                    tr.appendChild(tdLink);
                    tr.appendChild(tdTimeWorked);
                    tr.appendChild(tdAmount);
    
                    reportTableBody.appendChild(tr);
                });
    
                totalAmountDisplay.textContent = totalAmount.toFixed(2);
    
                markTimersAsReported(timerIds);
    
                // Pulsante per scaricare il PDF (invariato)
                document.getElementById('download-pdf-btn').onclick = () => generatePDF(reportHeader, reportData, totalAmount, companyLogoBase64, sanitizedReportFileName, includeHourlyRate);
    
                // **AGGIORNAMENTO QUI**:
                // Quando si clicca su "Esporta in Google Docs"
                if (exportGoogleDocBtn) {
                    exportGoogleDocBtn.onclick = () => {
                        const reportContentString = generateReportContentString(reportHeader, reportData, totalAmount, includeHourlyRate);
                        // Prima di esportare, chiamiamo handleAuthClick per gestire il token
                        handleAuthClick(() => {
                            createGoogleDoc(reportContentString, sanitizedReportFileName);
                        });
                    };
                }
    
                // Quando si clicca su "Esporta in Google Sheets"
                if (exportGoogleSheetBtn) {
                    exportGoogleSheetBtn.onclick = () => {
                        const reportValuesArray = generateReportValuesArray(reportHeader, reportData, totalAmount, includeHourlyRate);
                        // Prima di esportare, chiamiamo handleAuthClick per gestire il token
                        handleAuthClick(() => {
                            createGoogleSheet(reportValuesArray, sanitizedReportFileName);
                        });
                    };
                }
    
                let filterClientName = '';
                let filterSiteName = '';
                let filterWorktypeName = '';
    
                if (filterClientSelect.value) {
                    filterClientName = filterClientSelect.options[filterClientSelect.selectedIndex].text;
                }
                if (filterSiteSelect.value) {
                    filterSiteName = filterSiteSelect.options[filterSiteSelect.selectedIndex].text;
                }
                if (filterWorktypeSelect.value) {
                    filterWorktypeName = filterWorktypeSelect.options[filterWorktypeSelect.selectedIndex].text;
                }
    
                const reportDetails = {
                    uid: currentUser.uid,
                    reportHeader: reportHeader,
                    startDate: startDateInputVal,
                    endDate: endDateInputVal,
                    filterClient: filterClient || null,
                    filterSite: filterSite || null,
                    filterWorktype: filterWorktype || null,
                    filterClientName: filterClientName,
                    filterSiteName: filterSiteName,
                    filterWorktypeName: filterWorktypeName,
                    totalAmount: totalAmount,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    companyLogoBase64: companyLogoBase64,
                    reportName: sanitizedReportFileName,
                    reportDataArray: reportData,
                    includeHourlyRate: includeHourlyRate
                };
    
                db.collection('reports').add(reportDetails)
                    .then(() => {
                        console.log('Report salvato nello storico.');
                    })
                    .catch(error => {
                        console.error('Errore nel salvataggio del report nello storico:', error);
                    });
    
                $('#reportModal').modal('show');
                reportContent.style.display = 'block';
    
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
    
    const accessToken = localStorage.getItem('googleAccessToken');
    if (accessToken) {
        initializeGoogleApiClient(accessToken).then(() => {
            if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = false;
            if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = false;
        }).catch(error => {
            console.error('Errore durante l\'inizializzazione del client Google API:', error);
            if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
            if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;
        });
    } else {
        if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
        if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;
    }
}

// Avvia l'inizializzazione dopo che l'utente è autenticato
firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        currentUser = user;
        initializeReportEvents();
    } else {
        window.location.href = 'login.html';
    }
});
