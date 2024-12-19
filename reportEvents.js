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
                // Ora puoi procedere
                setupReportSection();
            } else {
                // L'utente non è autenticato, reindirizza alla pagina di login
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
            // Ritorna worktypeRates per uso successivo
            return worktypeRates;
        })
        .catch(error => {
            console.error('Errore nel caricamento delle tariffe dei tipi di lavoro:', error);
            // Gestisci l'errore se necessario
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
    // Selettori per i filtri
    const filterClientSelect = document.getElementById('filter-client');
    const filterSiteSelect = document.getElementById('filter-site');
    const filterWorktypeSelect = document.getElementById('filter-worktype');

    // Carica i clienti
    loadClients(filterClientSelect);

    // Event listener per il cambio del cliente
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
    // Inizializza gli elementi DOM per i pulsanti di esportazione Google
    exportGoogleDocBtn = document.getElementById('export-google-doc-btn');
    exportGoogleSheetBtn = document.getElementById('export-google-sheet-btn');

    // Disabilita i pulsanti di esportazione inizialmente
    if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
    if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;

    // Imposta l'intervallo di date automaticamente in base ai timer non reportati
    setAutoDateRange();

    // Inizializza gli elementi DOM per le configurazioni salvate
    savedConfigSelect = document.getElementById('saved-config-select');
    deleteConfigBtn = document.getElementById('delete-config-btn');
    configNameInput = document.getElementById('config-name');

    // Inizializza companyLogoInput
    companyLogoInput = document.getElementById('company-logo');

    // Gestione del caricamento del logo
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

    // Carica le configurazioni salvate
    loadSavedConfigs();

    // Event listener per la selezione di una configurazione salvata
    savedConfigSelect.addEventListener('change', () => {
        const selectedConfigId = savedConfigSelect.value;
        if (selectedConfigId) {
            applySavedConfig(selectedConfigId);
            deleteConfigBtn.style.display = 'inline-block';
        } else {
            // Svuota i campi se nessuna configurazione è selezionata
            reportForm.reset();
            companyLogoBase64 = '';
            deleteConfigBtn.style.display = 'none';
            clearLogoPreview();
        }
    });

    // Event listener per eliminare una configurazione salvata
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

    // Funzione per contrassegnare i timer come "reportati"
    function markTimersAsReported(timerIds) {
        timerIds.forEach(timerId => {
            db.collection('timeLogs').doc(timerId).update({
                isReported: true
            }).catch(error => {
                console.error('Errore nel contrassegnare il timer come reportato:', error);
            });
        });
    }

    // Funzione per impostare automaticamente l'intervallo di date in base ai timer non reportati
    function setAutoDateRange() {
        db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isReported', '==', false) // Filtra solo i timer non reportati
            .orderBy('startTime', 'asc') // Ordina per data di inizio
            .get()
            .then(snapshot => {
                if (!snapshot.empty) {
                    // Ottieni la prima e l'ultima data
                    const firstTimer = snapshot.docs[0].data();
                    const lastTimer = snapshot.docs[snapshot.docs.length - 1].data();

                    // Imposta le date nei campi del form
                    startDateInput.value = new Date(firstTimer.startTime.seconds * 1000).toISOString().split('T')[0];
                    endDateInput.value = new Date(lastTimer.startTime.seconds * 1000).toISOString().split('T')[0];
                }
            })
            .catch(error => {
                console.error('Errore nel recupero dei timer non reportati:', error);
            });
    }

    // Gestione del submit del form per generare il report
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Prima di procedere, carica le tariffe orarie
        loadWorktypeRates().then(() => {
            // Ora worktypeRates è popolato e possiamo utilizzarlo
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

    // Funzione per generare il report
    function generateReport() {
        // Ottieni i valori di input
        const reportHeader = document.getElementById('report-header').value.trim();
        const startDateInputVal = startDateInput.value;
        const endDateInputVal = endDateInput.value;
        const configName = configNameInput.value.trim();

        // Ottieni il valore del checkbox per includere la Tariffa Oraria
        const includeHourlyRate = document.getElementById('include-hourly-rate').checked;
        // Ottieni il valore del checkbox per includere solo i timer non reportati
        const onlyUnreported = document.getElementById('only-unreported').checked;

        // Validazione avanzata
        let errorMessage = '';

        // Validazione dei campi
        if (!reportHeader) {
            errorMessage += '• Inserisci l\'intestazione del report.\n';
        }
        if (!startDateInputVal) {
            errorMessage += '• Seleziona una data di inizio.\n';
        }
        if (!endDateInputVal) {
            errorMessage += '• Seleziona una data di fine.\n';
        }
        if (startDateInputVal && endDateInputVal && new Date(startDateInputVal) > new Date(endDateInputVal)) {
            errorMessage += '• La data di inizio non può essere successiva alla data di fine.\n';
        }

        if (errorMessage) {
            Swal.fire({
                icon: 'warning',
                title: 'Attenzione',
                html: errorMessage.replace(/\n/g, '<br>'),
                confirmButtonText: 'OK'
            });
            return;
        }

        const startDate = new Date(startDateInputVal);
        const endDate = new Date(endDateInputVal);
        endDate.setHours(23, 59, 59, 999); // Include tutta la giornata per la data di fine

        // Ottieni i valori dei filtri
        const filterClient = document.getElementById('filter-client').value;
        const filterSite = document.getElementById('filter-site').value;
        const filterWorktype = document.getElementById('filter-worktype').value;

        if (!filterClient) {
            errorMessage += '• Seleziona un cliente per il filtro.\n';
        }

        // Salva la configurazione se è stato inserito un nome
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

        // Pulisci il contenuto precedente del report
        reportTableBody.innerHTML = '';
        totalAmountDisplay.textContent = '0.00';

        // Genera il nome del report
        const reportFileName = `${reportHeader} - ${startDateInputVal} a ${endDateInputVal}`;

        // Funzione per sanitizzare il nome del file
        function sanitizeFileName(fileName) {
            return fileName.replace(/[\/\\?%*:|"<>]/g, '-');
        }
        const sanitizedReportFileName = sanitizeFileName(reportFileName);

        // Mostra l'intestazione del report con il logo
        reportHeaderDisplay.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center;">
                ${companyLogoBase64 ? `<img src="${companyLogoBase64}" alt="Logo Aziendale" style="height: 50px; margin-right: 20px;"/>` : ''}
                <h3 style="margin: 0;">${reportHeader}</h3>
            </div>
        `;

        // Costruisci la query Firestore con i filtri
        let query = db.collection('timeLogs')
            .where('uid', '==', currentUser.uid)
            .where('isDeleted', '==', false)
            .where('startTime', '>=', firebase.firestore.Timestamp.fromDate(startDate))
            .where('startTime', '<=', firebase.firestore.Timestamp.fromDate(endDate));

        if (filterClient) {
            query = query.where('clientId', '==', filterClient);
        }
        if (filterSite) {
            query = query.where('siteId', '==', filterSite);
        }
        if (filterWorktype) {
            query = query.where('worktypeId', '==', filterWorktype);
        }
        if (onlyUnreported) {
            query = query.where('isReported', '==', false);
        }

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
                    reportContent.style.display = 'none';
                    return;
                }

                // Genera le intestazioni della tabella in base all'opzione includeHourlyRate
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
                let timerIds = []; // Array per memorizzare gli ID dei timer inclusi nel report

                snapshot.forEach(doc => {
                    const logData = doc.data();
                    timerIds.push(doc.id); // Aggiungi l'ID del timer per contrassegnarlo come reportato

                    const durationInHours = logData.duration / 3600;
                    const worktypeId = logData.worktypeId;
                    const hourlyRate = worktypeRates[worktypeId] || 0;
                    const amount = durationInHours * hourlyRate;
                    totalAmount += amount;

                    const linkText = logData.link ? extractDomainName(logData.link) : '-';

                    const dataRow = {
                        date: new Date(logData.startTime.seconds * 1000).toLocaleDateString(),
                        workType: logData.worktypeName,
                        hourlyRate: hourlyRate.toFixed(2), // Aggiungi la tariffa oraria ai dati del report
                        link: logData.link || '',
                        linkText: linkText,
                        timeWorked: formatDuration(logData.duration),
                        amount: amount.toFixed(2)
                    };

                    reportData.push(dataRow);

                    // Crea una riga della tabella
                    const tr = document.createElement('tr');

                    const tdDate = document.createElement('td');
                    tdDate.textContent = dataRow.date;

                    const tdWorkType = document.createElement('td');
                    tdWorkType.textContent = dataRow.workType;

                    const tdHourlyRate = document.createElement('td');
                    tdHourlyRate.textContent = `€ ${dataRow.hourlyRate}`; // Colonna della Tariffa Oraria

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

                    // Aggiungi le celle alla riga nell'ordine corretto
                    tr.appendChild(tdDate);
                    tr.appendChild(tdWorkType);
                    if (includeHourlyRate) {
                        tr.appendChild(tdHourlyRate);
                    }
                    tr.appendChild(tdLink);
                    tr.appendChild(tdTimeWorked);
                    tr.appendChild(tdAmount);

                    reportTableBody.appendChild(tr);
                });

                totalAmountDisplay.textContent = totalAmount.toFixed(2);
                reportContent.style.display = 'block';

                // Contrassegna i timer inclusi nel report come "reportati"
                markTimersAsReported(timerIds);

                // Aggiungi event listeners per i pulsanti di download
                downloadPdfBtn.onclick = () => generatePDF(reportHeader, reportData, totalAmount, companyLogoBase64, sanitizedReportFileName, includeHourlyRate);

                // Event listener per i pulsanti di esportazione Google
                if (exportGoogleDocBtn) {
                    exportGoogleDocBtn.onclick = () => {
                        const reportContentString = generateReportContentString(reportHeader, reportData, totalAmount, includeHourlyRate);
                        createGoogleDoc(reportContentString, sanitizedReportFileName);
                    };
                }

                if (exportGoogleSheetBtn) {
                    exportGoogleSheetBtn.onclick = () => {
                        const reportValuesArray = generateReportValuesArray(reportHeader, reportData, totalAmount, includeHourlyRate);
                        createGoogleSheet(reportValuesArray, sanitizedReportFileName);
                    };
                }

                // Salva i dettagli del report nel database
                let filterClientName = '';
                let filterSiteName = '';
                let filterWorktypeName = '';

                const clientSelect = document.getElementById('filter-client');
                const siteSelect = document.getElementById('filter-site');
                const worktypeSelect = document.getElementById('filter-worktype');

                if (clientSelect.value) {
                    filterClientName = clientSelect.options[clientSelect.selectedIndex].text;
                }
                if (siteSelect.value) {
                    filterSiteName = siteSelect.options[siteSelect.selectedIndex].text;
                }
                if (worktypeSelect.value) {
                    filterWorktypeName = worktypeSelect.options[worktypeSelect.selectedIndex].text;
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
                    reportDataArray: reportData, // Aggiunto reportDataArray
                    includeHourlyRate: includeHourlyRate // Salva l'opzione
                };

                db.collection('reports').add(reportDetails)
                    .then(() => {
                        console.log('Report salvato nello storico.');
                    })
                    .catch(error => {
                        console.error('Errore nel salvataggio del report nello storico:', error);
                    });

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

    // Recupera il token di accesso e inizializza il client delle API di Google
    const accessToken = localStorage.getItem('googleAccessToken');

    if (accessToken) {
        initializeGoogleApiClient(accessToken).then(() => {
            // Abilita i pulsanti di esportazione
            if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = false;
            if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = false;
        }).catch(error => {
            console.error('Errore durante l\'inizializzazione del client Google API:', error);
            // Disabilita i pulsanti di esportazione in caso di errore
            if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
            if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;
        });
    } else {
        // Disabilita i pulsanti di esportazione se non c'è il token di accesso
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
        // L'utente non è autenticato, reindirizza alla pagina di login
        window.location.href = 'login.html';
    }
});
