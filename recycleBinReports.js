// recycleBinReports.js

const recycleBinTemplate = `
<div id="recycle-bin-section" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-trash-alt mr-2"></i>Cestino
    </h2>

    <!-- Navigazione tra Timer e Report Eliminati -->
    <ul class="nav nav-tabs" id="recycleBinTabs" role="tablist">
        <li class="nav-item">
            <a class="nav-link active" id="timers-tab" data-toggle="tab" href="#timers" role="tab" aria-controls="timers" aria-selected="true">
                <i class="fas fa-stopwatch mr-2"></i>Timer Eliminati
            </a>
        </li>
        <li class="nav-item">
            <a class="nav-link" id="reports-tab" data-toggle="tab" href="#reports" role="tab" aria-controls="reports" aria-selected="false">
                <i class="fas fa-file-alt mr-2"></i>Report Eliminati
            </a>
        </li>
    </ul>

    <div class="tab-content" id="recycleBinTabsContent">
        <!-- Tab Timer Eliminati -->
        <div class="tab-pane fade show active" id="timers" role="tabpanel" aria-labelledby="timers-tab">
            <div id="recycle-bin-timers" class="mt-4">
                <!-- I timer eliminati saranno caricati qui -->
            </div>
        </div>

        <!-- Tab Report Eliminati -->
        <div class="tab-pane fade" id="reports" role="tabpanel" aria-labelledby="reports-tab">
            <div id="recycle-bin-reports" class="mt-4">
                <!-- I report eliminati saranno caricati qui -->
            </div>
        </div>
    </div>
</div>
`;

// Funzione per inizializzare gli eventi della sezione Cestino Report
function initializeRecycleBinReportsEvents() {
    const recycleBinReportsDiv = document.getElementById('recycle-bin-reports');

    // Aggiungi campo di ricerca e pulsanti Espandi/Comprimi Tutto
    const recycleBinReportsControls = document.createElement('div');
    recycleBinReportsControls.classList.add('d-flex', 'justify-content-between', 'mb-3');

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-recycle-reports-input';
    searchInput.classList.add('form-control');
    searchInput.placeholder = 'Cerca nei report eliminati...';
    searchInput.style.maxWidth = '300px';

    const buttonsDiv = document.createElement('div');

    const expandAllBtn = document.createElement('button');
    expandAllBtn.classList.add('btn', 'btn-outline-secondary', 'mr-2');
    expandAllBtn.innerHTML = '<i class="fas fa-plus-square"></i> Espandi Tutto';
    expandAllBtn.addEventListener('click', () => {
        $('#recycle-bin-reports .collapse').collapse('show');
    });

    const collapseAllBtn = document.createElement('button');
    collapseAllBtn.classList.add('btn', 'btn-outline-secondary');
    collapseAllBtn.innerHTML = '<i class="fas fa-minus-square"></i> Comprimi Tutto';
    collapseAllBtn.addEventListener('click', () => {
        $('#recycle-bin-reports .collapse').collapse('hide');
    });

    buttonsDiv.appendChild(expandAllBtn);
    buttonsDiv.appendChild(collapseAllBtn);

    recycleBinReportsControls.appendChild(searchInput);
    recycleBinReportsControls.appendChild(buttonsDiv);

    recycleBinReportsDiv.parentNode.insertBefore(recycleBinReportsControls, recycleBinReportsDiv);

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim();
        loadRecycleBinReports(searchTerm);
    });

    // Carica i report per la prima volta
    loadRecycleBinReports();
}

function loadRecycleBinReports(searchTerm = '') {
    const recycleBinReportsDiv = document.getElementById('recycle-bin-reports');
    recycleBinReportsDiv.innerHTML = ''; // Svuota la lista

    db.collection('reports')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', true)
        .orderBy('deletedAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                const noReportsMessage = document.createElement('p');
                noReportsMessage.classList.add('alert', 'alert-info');
                noReportsMessage.textContent = 'Non ci sono report eliminati nel cestino.';
                recycleBinReportsDiv.appendChild(noReportsMessage);
                return;
            }

            // Raccogli i report in un array
            let reportsArray = [];
            snapshot.forEach(doc => {
                const reportData = doc.data();
                reportsArray.push({
                    id: doc.id,
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

            // Organizza i report per cliente e anno
            const reportsByClient = {};

            reportsArray.forEach(reportObj => {
                const reportData = reportObj.data;
                const clientName = reportData.filterClientName || 'Cliente Sconosciuto';

                const deletedAt = reportData.deletedAt ? reportData.deletedAt.toDate() : reportData.timestamp.toDate();
                const year = deletedAt.getFullYear();

                if (!reportsByClient[clientName]) {
                    reportsByClient[clientName] = {};
                }

                if (!reportsByClient[clientName][year]) {
                    reportsByClient[clientName][year] = [];
                }

                reportsByClient[clientName][year].push({
                    id: reportObj.id,
                    data: reportData
                });
            });

            // Generazione dell'HTML per visualizzare i report raggruppati
            let clientIndex = 0;
            for (const clientName in reportsByClient) {
                clientIndex++;
                const clientId = `recycle-report-client-${clientIndex}`;
                const clientSection = document.createElement('div');
                clientSection.classList.add('card');

                // Header del Cliente
                const clientHeader = document.createElement('div');
                clientHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                clientHeader.id = `recycle-report-heading-${clientId}`;

                const clientButton = document.createElement('button');
                clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                clientButton.setAttribute('data-toggle', 'collapse');
                clientButton.setAttribute('data-target', `#recycle-report-collapse-${clientId}`);
                clientButton.setAttribute('aria-expanded', 'false');
                clientButton.setAttribute('aria-controls', `recycle-report-collapse-${clientId}`);
                clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;

                // Pulsante per Eliminare Cliente
                const deleteClientBtn = document.createElement('button');
                deleteClientBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
                deleteClientBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Cliente';
                deleteClientBtn.addEventListener('click', () => {
                    Swal.fire({
                        title: 'Sei sicuro?',
                        text: `Vuoi eliminare definitivamente tutti i report del cliente "${clientName}"? Questa azione non può essere annullata.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: 'Sì, elimina tutti!',
                        cancelButtonText: 'Annulla'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            permanentlyDeleteClientReports(clientName, clientSection);
                        }
                    });
                });

                const clientHeaderActions = document.createElement('div');
                clientHeaderActions.appendChild(deleteClientBtn);

                clientHeader.appendChild(clientButton);
                clientHeader.appendChild(clientHeaderActions);

                // Corpo del Cliente
                const clientCollapse = document.createElement('div');
                clientCollapse.id = `recycle-report-collapse-${clientId}`;
                clientCollapse.classList.add('collapse');
                clientCollapse.setAttribute('aria-labelledby', `recycle-report-heading-${clientId}`);

                const clientBody = document.createElement('div');
                clientBody.classList.add('card-body');

                const years = reportsByClient[clientName];

                const sortedYears = Object.keys(years).sort((a, b) => b - a);

                let yearIndex = 0;
                sortedYears.forEach(year => {
                    yearIndex++;
                    const yearId = `${clientId}-year-${yearIndex}`;

                    const yearSection = document.createElement('div');
                    yearSection.classList.add('card');

                    // Header dell'Anno
                    const yearHeader = document.createElement('div');
                    yearHeader.classList.add('card-header', 'd-flex', 'justify-content-between', 'align-items-center');
                    yearHeader.id = `recycle-report-heading-${yearId}`;

                    const yearButton = document.createElement('button');
                    yearButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                    yearButton.setAttribute('data-toggle', 'collapse');
                    yearButton.setAttribute('data-target', `#recycle-report-collapse-${yearId}`);
                    yearButton.setAttribute('aria-expanded', 'false');
                    yearButton.setAttribute('aria-controls', `recycle-report-collapse-${yearId}`);
                    yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;

                    // Pulsante per Eliminare Anno
                    const deleteYearBtn = document.createElement('button');
                    deleteYearBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
                    deleteYearBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Anno';
                    deleteYearBtn.addEventListener('click', () => {
                        Swal.fire({
                            title: 'Sei sicuro?',
                            text: `Vuoi eliminare definitivamente tutti i report dell'anno "${year}" per il cliente "${clientName}"? Questa azione non può essere annullata.`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Sì, elimina tutti!',
                            cancelButtonText: 'Annulla'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                permanentlyDeleteYearReports(clientName, year, yearSection);
                            }
                        });
                    });

                    const yearHeaderActions = document.createElement('div');
                    yearHeaderActions.appendChild(deleteYearBtn);

                    yearHeader.appendChild(yearButton);
                    yearHeader.appendChild(yearHeaderActions);

                    // Corpo dell'Anno
                    const yearCollapse = document.createElement('div');
                    yearCollapse.id = `recycle-report-collapse-${yearId}`;
                    yearCollapse.classList.add('collapse');
                    yearCollapse.setAttribute('aria-labelledby', `recycle-report-heading-${yearId}`);

                    const yearBody = document.createElement('div');
                    yearBody.classList.add('card-body');

                    const reports = years[year];

                    reports.sort((a, b) => b.data.timestamp.seconds - a.data.timestamp.seconds);

                    reports.forEach(reportObj => {
                        const reportData = reportObj.data;
                        const reportId = reportObj.id;

                        // Creazione degli elementi per il report
                        const reportRow = document.createElement('div');
                        reportRow.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

                        const reportInfo = document.createElement('div');
                        reportInfo.textContent = reportData.reportName || 'Report Sconosciuto';

                        const reportActions = document.createElement('div');

                        const restoreBtn = document.createElement('button');
                        restoreBtn.classList.add('btn', 'btn-sm', 'btn-success', 'mr-2');
                        restoreBtn.innerHTML = '<i class="fas fa-undo"></i> Ripristina';
                        restoreBtn.addEventListener('click', () => {
                            restoreReport(reportId, reportRow);
                        });

                        const deleteBtn = document.createElement('button');
                        deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger');
                        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Elimina Definitivamente';
                        deleteBtn.addEventListener('click', () => {
                            permanentlyDeleteReport(reportId, reportRow);
                        });

                        reportActions.appendChild(restoreBtn);
                        reportActions.appendChild(deleteBtn);

                        reportRow.appendChild(reportInfo);
                        reportRow.appendChild(reportActions);

                        yearBody.appendChild(reportRow);
                    });

                    yearCollapse.appendChild(yearBody);

                    yearSection.appendChild(yearHeader);
                    yearSection.appendChild(yearCollapse);

                    // Eventi per cambiare l'icona al clic sull'anno
                    $(yearCollapse).collapse({
                        toggle: false
                    });

                    $(`#recycle-report-collapse-${yearId}`).on('show.bs.collapse', function () {
                        yearButton.classList.remove('collapsed');
                        yearButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${year}`;
                    });
                    $(`#recycle-report-collapse-${yearId}`).on('hide.bs.collapse', function () {
                        yearButton.classList.add('collapsed');
                        yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;
                    });

                    clientBody.appendChild(yearSection);
                });

                clientCollapse.appendChild(clientBody);

                clientSection.appendChild(clientHeader);
                clientSection.appendChild(clientCollapse);

                // Eventi per cambiare l'icona al clic sul cliente
                $(clientCollapse).collapse({
                    toggle: false
                });

                $(`#recycle-report-collapse-${clientId}`).on('show.bs.collapse', function () {
                    clientButton.classList.remove('collapsed');
                    clientButton.innerHTML = `<i class="fas fa-chevron-up mr-2"></i>${clientName}`;
                });
                $(`#recycle-report-collapse-${clientId}`).on('hide.bs.collapse', function () {
                    clientButton.classList.add('collapsed');
                    clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;
                });

                recycleBinReportsDiv.appendChild(clientSection);
            }
        })
        .catch(error => {
            console.error('Errore nel caricamento dei report eliminati:', error);
        });
}

// Funzione per ripristinare un report dal cestino
function restoreReport(reportId, rowElement) {
    db.collection('reports').doc(reportId).update({
        isDeleted: false,
        deletedAt: firebase.firestore.FieldValue.delete()
    }).then(() => {
        rowElement.remove();
        Swal.fire({
            icon: 'success',
            title: 'Report Ripristinato',
            text: 'Il report è stato ripristinato con successo.',
            confirmButtonText: 'OK'
        });
    }).catch(error => {
        console.error('Errore durante il ripristino del report:', error);
        Swal.fire({
            icon: 'error',
            title: 'Errore',
            text: 'Si è verificato un errore durante il ripristino del report.',
            confirmButtonText: 'OK'
        });
    });
}

// Funzione per eliminare definitivamente un report
function permanentlyDeleteReport(reportId, rowElement) {
    Swal.fire({
        title: 'Sei sicuro?',
        text: 'Questo report sarà eliminato definitivamente e non potrà essere recuperato.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sì, elimina definitivamente!',
        cancelButtonText: 'Annulla'
    }).then((result) => {
        if (result.isConfirmed) {
            db.collection('reports').doc(reportId).delete()
                .then(() => {
                    rowElement.remove();
                    Swal.fire({
                        icon: 'success',
                        title: 'Report Eliminato',
                        text: 'Il report è stato eliminato definitivamente.',
                        confirmButtonText: 'OK'
                    });
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
}

// Funzione per eliminare definitivamente tutti i report di un cliente
function permanentlyDeleteClientReports(clientName, clientSection) {
    db.collection('reports')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', true)
        .where('filterClientName', '==', clientName)
        .get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            clientSection.remove();
            Swal.fire({
                icon: 'success',
                title: 'Eliminati!',
                text: `Tutti i report del cliente "${clientName}" sono stati eliminati definitivamente.`,
                confirmButtonText: 'OK'
            });
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

// Funzione per eliminare definitivamente tutti i report di un anno per un cliente
function permanentlyDeleteYearReports(clientName, year, yearSection) {
    db.collection('reports')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', true)
        .where('filterClientName', '==', clientName)
        .get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                const reportData = doc.data();
                const deletedAt = reportData.deletedAt ? reportData.deletedAt.toDate() : reportData.timestamp.toDate();
                const reportYear = deletedAt.getFullYear();
                if (reportYear === parseInt(year)) {
                    batch.delete(doc.ref);
                }
            });
            return batch.commit();
        })
        .then(() => {
            yearSection.remove();
            Swal.fire({
                icon: 'success',
                title: 'Eliminati!',
                text: `Tutti i report dell'anno "${year}" per il cliente "${clientName}" sono stati eliminati definitivamente.`,
                confirmButtonText: 'OK'
            });
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
