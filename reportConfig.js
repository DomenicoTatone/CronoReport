// reportConfig.js

// Variabili globali necessarie per configurazioni e logo
let savedConfigs = {}; // Oggetto per memorizzare le configurazioni salvate
let companyLogoBase64 = ''; // Variabile per memorizzare il logo in base64

// Template per la sezione Report con layout migliorato
const reportTemplate = `
<div id="report-section" class="container mt-5">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Genera Report</h2>
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
                        <div class="form-group">
                            <label for="hourly-rate" class="font-weight-bold">Tariffa Oraria (€):</label>
                            <input type="number" id="hourly-rate" class="form-control" placeholder="Inserisci la tariffa oraria" min="0" step="0.01">
                        </div>
                        <!-- Nome per salvare la configurazione -->
                        <div class="form-group">
                            <label for="config-name" class="font-weight-bold">Nome Configurazione (per salvare):</label>
                            <input type="text" id="config-name" class="form-control" placeholder="Inserisci un nome per questa configurazione">
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
                            <select id="filter-client" class="form-control">
                                <option value="">Tutti i Clienti</option>
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
                <tr>
                    <th>Data</th>
                    <th>Tipo di Lavoro</th>
                    <th>Link</th>
                    <th>Tempo Lavorato</th>
                    <th>Importo (€)</th>
                </tr>
            </thead>
            <tbody id="report-table-body">
                <!-- I dati del report verranno inseriti qui -->
            </tbody>
        </table>
        <h4 class="text-right">Totale: € <span id="total-amount">0.00</span></h4>
        <div class="text-center">
            <button id="download-pdf-btn" class="btn btn-success mt-3 mr-2"><i class="fas fa-file-pdf mr-2"></i>Scarica PDF</button>
            <button id="download-csv-btn" class="btn btn-secondary mt-3"><i class="fas fa-file-csv mr-2"></i>Esporta CSV</button>
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
        domain = domain.split('.')[0]; // Rimuove il TLD
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

// Funzioni per caricare i filtri (da implementare in base alla tua struttura dati)
function loadClients(selectElement) {
    db.collection('clients')
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
        });
}

function loadSites(selectElement) {
    db.collection('sites')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const site = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = site.name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei siti:', error);
        });
}

function loadWorktypes(selectElement) {
    db.collection('worktypes')
        .where('uid', '==', currentUser.uid)
        .orderBy('name')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const worktype = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = worktype.name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei tipi di lavoro:', error);
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
        hourlyRate: config.hourlyRate,
        companyLogoBase64: config.companyLogoBase64,
        filterClient: config.filterClient,
        filterSite: config.filterSite,
        filterWorktype: config.filterWorktype,
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
function applySavedConfig(configId) {
    const config = savedConfigs[configId];
    if (config) {
        document.getElementById('report-header').value = config.reportHeader;
        document.getElementById('hourly-rate').value = config.hourlyRate;
        document.getElementById('filter-client').value = config.filterClient || '';
        document.getElementById('filter-site').value = config.filterSite || '';
        document.getElementById('filter-worktype').value = config.filterWorktype || '';
        companyLogoBase64 = config.companyLogoBase64 || '';

        // Mostra l'anteprima del logo
        if (companyLogoBase64) {
            displayLogoPreview(companyLogoBase64);
        } else {
            clearLogoPreview();
        }
    }
}

// Funzione per generare il PDF usando jsPDF
function generatePDF(reportHeader, reportData, totalAmount, companyLogoBase64) {
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
        const tableColumn = ["Data", "Tipo di Lavoro", "Link", "Tempo Lavorato", "Importo (€)"];
        const tableRows = [];

        reportData.forEach(item => {
            // Lascia vuoto il testo del link nella cella per evitare sovrapposizioni
            const rowData = [
                item.date,
                item.workType,
                '', // Lascia vuoto il testo del link nella cella
                item.timeWorked,
                item.amount
            ];
            tableRows.push(rowData);
        });

        // Aggiungi la tabella usando autoTable
        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            styles: { cellWidth: 'wrap', fontSize: 10 },
            columnStyles: {
                2: { cellWidth: 40 } // Colonna del link
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 2) { // Solo nel corpo della tabella
                    data.cell.text = ''; // Rimuovi il testo dalla cella
                }
            },
            didDrawCell: function (data) {
                if (data.section === 'body' && data.column.index === 2) { // Solo nel corpo della tabella
                    const link = reportData[data.row.index].link;
                    if (link) {
                        // Imposta il colore del testo a blu
                        doc.setTextColor(0, 0, 255);
                        const linkText = extractDomainName(link);

                        // Calcola la posizione X e Y per centrare il testo verticalmente
                        const xPos = data.cell.x + data.cell.padding('left');

                        // Calcola l'altezza del testo
                        const textHeight = doc.getTextDimensions(linkText).h;
                        const cellHeight = data.cell.height - data.cell.padding('top') - data.cell.padding('bottom');
                        const yPos = data.cell.y + data.cell.padding('top') + (cellHeight + textHeight) / 2 - 1;

                        // Scrivi il testo del link e aggiungi il link
                        doc.textWithLink(linkText, xPos, yPos, { url: link });

                        // Ripristina il colore del testo a nero per le altre celle
                        doc.setTextColor(0, 0, 0);
                    }
                }
            },
            headStyles: {
                fillColor: [102, 126, 234] // Colore di sfondo della testata
            },
            alternateRowStyles: {
                fillColor: [240, 246, 248] // Colore di sfondo alternato
            }
        });

        // Aggiungi l'importo totale
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Totale: € ${totalAmount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);

        // Salva il PDF
        doc.save('report.pdf');
    }

    // Inizia la generazione del PDF
    addLogoAndGeneratePDF();
}


// Funzione per generare CSV
function generateCSV(reportHeader, reportData) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${reportHeader}\n\n`;
    csvContent += "Data,Tipo di Lavoro,Link,Tempo Lavorato,Importo (€)\n";

    reportData.forEach(item => {
        const row = [item.date, item.workType, item.link, item.timeWorked, item.amount].join(",");
        csvContent += row + "\n";
    });

    // Crea il link per il download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
}