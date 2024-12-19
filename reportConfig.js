// reportConfig.js

// Variabili globali necessarie per configurazioni e logo
let savedConfigs = {}; // Oggetto per memorizzare le configurazioni salvate
let companyLogoBase64 = ''; // Variabile per memorizzare il logo in base64

// Template per la sezione Report con layout migliorato
const reportTemplate = `
<div id="report-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-file-alt mr-2"></i>Genera Report
    </h2>
    <form id="report-form">
        <div class="card mb-4 shadow-sm">
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0"><i class="fas fa-file-alt mr-2"></i>Configurazione Report</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <!-- Colonna Sinistra -->
                    <div class="col-md-6">
                        <!-- Selezione della configurazione salvata -->
                        <div class="form-group">
                            <label for="saved-config-select" class="font-weight-bold">Configurazione Salvata:</label>
                            <div class="input-group">
                                <select id="saved-config-select" class="form-control">
                                    <option value="">-- Seleziona una configurazione --</option>
                                </select>
                                <div class="input-group-append">
                                    <button type="button" id="delete-config-btn" class="btn btn-danger" style="display: none;">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <!-- Campo per caricare il logo aziendale -->
                        <div class="form-group">
                            <label for="company-logo" class="font-weight-bold">Logo Aziendale:</label>
                            <input type="file" id="company-logo" class="form-control-file" accept="image/*">
                            <div id="logo-preview-container" class="mt-2"></div>
                        </div>
                        <div class="form-group">
                            <label for="report-header" class="font-weight-bold">Intestazione del Report:</label>
                            <input type="text" id="report-header" class="form-control" placeholder="Inserisci l'intestazione del report">
                        </div>
                        <!-- Nome per salvare la configurazione -->
                        <div class="form-group">
                            <label for="config-name" class="font-weight-bold">Nome Configurazione (per salvare):</label>
                            <input type="text" id="config-name" class="form-control" placeholder="Inserisci un nome per questa configurazione">
                        </div>
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" id="only-unreported" class="form-check-input" checked>
                                <label for="only-unreported" class="form-check-label">Includi solo timer non reportati</label>
                            </div>
                        </div>
                    </div>
                    <!-- Colonna Destra -->
                    <div class="col-md-6">
                        <!-- Selezione Intervallo di Date -->
                        <div class="form-group">
                            <label for="report-date-range" class="font-weight-bold">Seleziona Intervallo di Date:</label>
                            <div class="input-group">
                                <input type="date" id="start-date" class="form-control">
                                <div class="input-group-prepend input-group-append">
                                    <span class="input-group-text">a</span>
                                </div>
                                <input type="date" id="end-date" class="form-control">
                            </div>
                        </div>
                        <!-- Filtri per cliente, sito e tipo di lavoro -->
                        <div class="form-group">
                            <label for="filter-client" class="font-weight-bold">Filtra per Cliente:</label>
                            <select id="filter-client" class="form-control" required>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="filter-site" class="font-weight-bold">Filtra per Sito:</label>
                            <select id="filter-site" class="form-control">
                                <option value="">Tutti i Siti</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="filter-worktype" class="font-weight-bold">Filtra per Tipo di Lavoro:</label>
                            <select id="filter-worktype" class="form-control">
                                <option value="">Tutti i Tipi di Lavoro</option>
                            </select>
                        </div>
                        <!-- Opzione per includere la Tariffa Oraria -->
                        <div class="form-group">
                            <div class="form-check">
                                <input type="checkbox" id="include-hourly-rate" class="form-check-input">
                                <label for="include-hourly-rate" class="form-check-label">Includi Tariffa Oraria nel Report</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Pulsante per generare il report -->
        <div class="text-right mb-4">
            <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-file-alt mr-2"></i>Genera Report</button>
        </div>
    </form>
    <div id="report-content" class="mt-5" style="display: none;">
        <div id="report-header-display" class="text-center mb-4">
            <!-- Il logo e l'intestazione del report verranno inseriti qui -->
        </div>
        <table class="table table-striped table-bordered">
            <thead class="thead-dark">
                <!-- Le intestazioni della tabella verranno generate dinamicamente -->
            </thead>
            <tbody id="report-table-body">
                <!-- I dati del report verranno inseriti qui -->
            </tbody>
        </table>
        <h4 class="text-right">Totale: € <span id="total-amount">0.00</span></h4>
        <div class="text-center">
            <button id="download-pdf-btn" class="btn btn-success mt-3 mr-2">
                <i class="fas fa-file-pdf mr-2"></i>Scarica PDF
            </button>
            <button id="export-google-doc-btn" class="btn btn-primary mt-3 mr-2">
                <i class="fab fa-google-drive mr-2"></i>Esporta in Google Docs
            </button>
            <button id="export-google-sheet-btn" class="btn btn-primary mt-3">
                <i class="fab fa-google-drive mr-2"></i>Esporta in Google Sheets
            </button>
        </div>
    </div>
</div>
`;

// Inserisci il template nel DOM
const reportDiv = document.createElement('div');
reportDiv.id = 'report-template';
reportDiv.style.display = 'none';
reportDiv.innerHTML = reportTemplate;
document.body.appendChild(reportDiv);

// Funzione per estrarre il nome del dominio dall'URL (Definita Globalmente)
function extractDomainName(url) {
    try {
        const hostname = new URL(url).hostname;
        let domain = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
        return domain;
    } catch (e) {
        return 'Link';
    }
}

// Funzione per visualizzare l'anteprima del logo (Definita Globalmente)
function displayLogoPreview(base64Data) {
    const previewContainer = document.getElementById('logo-preview-container');
    previewContainer.innerHTML = ''; // Pulisce il contenuto precedente

    const imgPreview = document.createElement('img');
    imgPreview.id = 'logo-preview';
    imgPreview.src = base64Data;
    imgPreview.style.maxWidth = '150px';
    imgPreview.style.marginTop = '10px';
    previewContainer.appendChild(imgPreview);
}

// Funzione per rimuovere l'anteprima del logo (Definita Globalmente)
function clearLogoPreview() {
    const previewContainer = document.getElementById('logo-preview-container');
    previewContainer.innerHTML = '';
}

// Funzioni per caricare i filtri
function loadClients(selectElement) {
    selectElement.innerHTML = '<option value="">--Seleziona Cliente--</option>';
    return db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const client = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = client.name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti:', error);
            // Handle the error but still return a Promise
            return Promise.reject(error);
        });
}

function loadSites(selectElement, selectedClientId) {
    selectElement.innerHTML = '<option value="">--Seleziona Sito--</option>';
    let query = db.collection('sites')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', selectedClientId)
        .orderBy('name');

    return query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                // Nessun sito disponibile, disabilita il select
                selectElement.disabled = true;
            } else {
                selectElement.disabled = false;
                snapshot.forEach(doc => {
                    const site = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = site.name;
                    selectElement.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento dei siti:', error);
            throw error; // Propaga l'errore per gestirlo successivamente
        });
}

function loadWorktypes(selectElement, selectedClientId) {
    selectElement.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
    let query = db.collection('worktypes')
        .where('uid', '==', currentUser.uid)
        .where('clientId', '==', selectedClientId)
        .orderBy('name');

    return query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                // Nessun tipo di lavoro disponibile, disabilita il select
                selectElement.disabled = true;
            } else {
                selectElement.disabled = false;
                snapshot.forEach(doc => {
                    const worktype = doc.data();
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = worktype.name;
                    selectElement.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento dei tipi di lavoro:', error);
            throw error; // Propaga l'errore per gestirlo successivamente
        });
}

// Funzione per caricare le configurazioni salvate da Firebase
function loadSavedConfigs() {
    savedConfigSelect.innerHTML = '<option value="">-- Seleziona una configurazione --</option>';
    deleteConfigBtn.style.display = 'none';
    db.collection('reportConfigs')
        .where('uid', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .get()
        .then(snapshot => {
            savedConfigs = {}; // Reset savedConfigs
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const config = doc.data();
                    savedConfigs[doc.id] = config;
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = config.name;
                    savedConfigSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento delle configurazioni salvate:', error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante il caricamento delle configurazioni salvate.',
                confirmButtonText: 'OK'
            });
        });
}

// Funzione per salvare una configurazione del report su Firebase
function saveReportConfig(config) {
    db.collection('reportConfigs').add({
        uid: currentUser.uid,
        name: config.name,
        reportHeader: config.reportHeader,
        companyLogoBase64: config.companyLogoBase64,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Configurazione Salvata',
            text: 'La configurazione è stata salvata con successo.',
            confirmButtonText: 'OK'
        });
        loadSavedConfigs();
        configNameInput.value = '';
    }).catch(error => {
        console.error('Errore nel salvataggio della configurazione:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il salvataggio della configurazione.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per applicare una configurazione salvata
async function applySavedConfig(configId) {
    const config = savedConfigs[configId];
    if (config) {

        document.getElementById('report-header').value = config.reportHeader;

        // Handle the logo
        companyLogoBase64 = config.companyLogoBase64 || '';
        if (companyLogoBase64) {
            displayLogoPreview(companyLogoBase64);
        } else {
            clearLogoPreview();
        }
    }
}

// Funzione per generare il PDF usando jsPDF
function generatePDF(reportHeader, reportData, totalAmount, companyLogoBase64, reportFileName, includeHourlyRate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    function addLogoAndGeneratePDF() {
        let startY = 30; // Posizione Y di partenza

        if (companyLogoBase64) {
            const img = new Image();
            img.src = companyLogoBase64;
            img.onload = function () {
                const imgHeight = 15; // Altezza del logo per renderlo piccolo
                const imgWidth = (img.width * imgHeight) / img.height;

                // Posiziona il logo e l'intestazione sulla stessa linea
                doc.addImage(companyLogoBase64, 'PNG', 14, 10, imgWidth, imgHeight);

                // Aggiungi l'intestazione accanto al logo
                doc.setFontSize(16);
                doc.text(reportHeader, 14 + imgWidth + 10, 20);

                // Imposta la posizione Y per la tabella
                startY = 30;

                // Genera il contenuto del PDF
                generatePDFContent(startY);
            };
        } else {
            // Nessun logo, procedi direttamente
            doc.setFontSize(16);
            doc.text(reportHeader, 14, 20);

            // Genera il contenuto del PDF
            generatePDFContent(startY);
        }
    }

    function generatePDFContent(startY) {
        // Prepara i dati della tabella
        const tableColumn = ["Data", "Tipo di Lavoro"];
        if (includeHourlyRate) {
            tableColumn.push("Tariffa Oraria (€)");
        }
        tableColumn.push("Link", "Tempo Lavorato", "Importo (€)");
    
        const linkColumnIndex = includeHourlyRate ? 3 : 2; // Determina l'indice della colonna Link
    
        const tableRows = [];
        reportData.forEach(item => {
            const rowData = [
                item.date,
                item.workType
            ];
            if (includeHourlyRate) {
                rowData.push(item.hourlyRate);
            }
            // Metti un placeholder per il link, verrà gestito dopo
            rowData.push('', item.timeWorked, item.amount);
            tableRows.push(rowData);
        });
    
        // Aggiungi la tabella usando autoTable
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { fontSize: 10 },
            // Imposta uno stile personalizzato per la colonna Link
            columnStyles: {
                [linkColumnIndex]: { cellWidth: 50 } // ad es. 50 unità di larghezza
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === linkColumnIndex) {
                    data.cell.text = ''; // Rimuovi il testo dalla cella per il link
                }
            },
            didDrawCell: function (data) {
                if (data.section === 'body' && data.column.index === linkColumnIndex) {
                    const link = reportData[data.row.index].link;
                    if (link) {
                        // Imposta il colore del testo a blu
                        doc.setTextColor(0, 0, 255);
                        const linkText = extractDomainName(link);
    
                        // Calcola posizione X e Y per centrare verticalmente il testo
                        const xPos = data.cell.x + data.cell.padding('left');
                        const textHeight = doc.getTextDimensions(linkText).h;
                        const cellHeight = data.cell.height - data.cell.padding('top') - data.cell.padding('bottom');
                        const yPos = data.cell.y + data.cell.padding('top') + (cellHeight + textHeight) / 2 - 1;
    
                        doc.textWithLink(linkText, xPos, yPos, { url: link });
    
                        // Ripristina il colore del testo a nero per le celle successive
                        doc.setTextColor(0, 0, 0);
                    }
                }
            },
            headStyles: {
                fillColor: [102, 126, 234] // colore di sfondo per l'intestazione
            },
            alternateRowStyles: {
                fillColor: [240, 246, 248] // colore sfondo righe alternate
            }
        });
    
        // Aggiungi l'importo totale
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Totale: € ${totalAmount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
    
        // Salva il PDF
        doc.save(`${reportFileName}.pdf`);
    }
    
    // Inizia la generazione del PDF
    addLogoAndGeneratePDF();
}

function createGoogleDoc(reportContent, reportFileName) {
    const doc = {
        title: reportFileName
    };

    gapi.client.request({
        path: 'https://docs.googleapis.com/v1/documents',
        method: 'POST',
        body: doc
    }).then((response) => {
        const documentId = response.result.documentId;

        // Inserisci il contenuto nel documento
        insertContentIntoDoc(documentId, reportContent);
    }, (error) => {
        console.error('Errore durante la creazione del documento:', error);
    });
}

function insertContentIntoDoc(documentId, reportContent) {
    const requests = [];

    // Aggiungi il testo al documento
    requests.push({
        insertText: {
            location: {
                index: 1 // Inserisci dopo l'inizio del documento
            },
            text: reportContent
        }
    });

    gapi.client.request({
        'path': `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
        'method': 'POST',
        'body': {
            requests: requests
        }
    }).then((response) => {
        console.log('Contenuto inserito nel documento:', response);
        // Apri il documento in una nuova scheda
        window.open(`https://docs.google.com/document/d/${documentId}/edit`, '_blank');
    }, (error) => {
        console.error('Errore durante l\'inserimento del contenuto:', error);
    });
}

function generateReportContentString(reportHeader, reportData, totalAmount, includeHourlyRate) {
    let content = `${reportHeader}\n\n`;

    reportData.forEach(item => {
        content += `Data: ${item.date}\n`;
        content += `Tipo di Lavoro: ${item.workType}\n`;
        if (includeHourlyRate) {
            content += `Tariffa Oraria (€): ${item.hourlyRate}\n`;
        }
        content += `Link: ${item.link}\n`;
        content += `Tempo Lavorato: ${item.timeWorked}\n`;
        content += `Importo (€): ${item.amount}\n`;
        content += '\n';
    });

    content += `Totale: € ${totalAmount.toFixed(2)}\n`;

    return content;
}

function createGoogleSheet(reportValues, reportFileName) {
    const spreadsheet = {
        properties: {
            title: reportFileName
        },
        sheets: [
            {
                properties: {
                    title: 'Report'
                }
            }
        ]
    };

    gapi.client.request({
        path: 'https://sheets.googleapis.com/v4/spreadsheets',
        method: 'POST',
        body: spreadsheet
    }).then((response) => {
        const spreadsheetId = response.result.spreadsheetId;
        const sheetName = 'Report';

        // Inserisci i dati nel foglio
        insertDataIntoSheet(spreadsheetId, sheetName, reportValues);
    }, (error) => {
        console.error('Errore durante la creazione del foglio di calcolo:', error);
    });
}

function insertDataIntoSheet(spreadsheetId, sheetName, reportValues) {
    const range = `${encodeURIComponent(sheetName)}!A1`;

    gapi.client.request({
        path: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append`,
        method: 'POST',
        params: {
            valueInputOption: 'RAW'
        },
        body: {
            values: reportValues
        }
    }).then((response) => {
        console.log('Dati inseriti nel foglio di calcolo:', response);
        // Apri il foglio di calcolo in una nuova scheda
        window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank');
    }, (error) => {
        console.error('Errore durante l\'inserimento dei dati:', error);
    });
}

function generateReportValuesArray(reportHeader, reportData, totalAmount, includeHourlyRate) {
    const values = [];

    // Aggiungi l'intestazione del report
    values.push([reportHeader]);
    values.push([]); // Riga vuota

    // Aggiungi le intestazioni delle colonne
    const headers = ['Data', 'Tipo di Lavoro'];
    if (includeHourlyRate) {
        headers.push('Tariffa Oraria (€)');
    }
    headers.push('Link', 'Tempo Lavorato', 'Importo (€)');
    values.push(headers);

    // Aggiungi le righe dei dati
    reportData.forEach(item => {
        const row = [item.date, item.workType];
        if (includeHourlyRate) {
            row.push(item.hourlyRate);
        }
        row.push(item.link, item.timeWorked, item.amount);
        values.push(row);
    });

    // Aggiungi una riga vuota e il totale
    values.push([]);
    const totalRow = ['', ''];
    if (includeHourlyRate) {
        totalRow.push('');
    }
    totalRow.push('', 'Totale', totalAmount.toFixed(2));
    values.push(totalRow);

    return values;
}
