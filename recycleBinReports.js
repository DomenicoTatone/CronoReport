function loadRecycleBinReports() {
    const recycleBinReportsList = document.getElementById('recycle-bin-reports-list');
    recycleBinReportsList.innerHTML = ''; // Svuota la lista

    db.collection('reports')
        .where('uid', '==', currentUser.uid)
        .where('isDeleted', '==', true)
        .orderBy('deletedAt', 'desc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                const noReportsMessage = document.createElement('p');
                noReportsMessage.textContent = 'Non ci sono report eliminati nel cestino.';
                recycleBinReportsList.appendChild(noReportsMessage);
                return;
            }

            // Organizza i report per cliente e anno
            const reportsByClient = {};

            snapshot.forEach(doc => {
                const reportData = doc.data();
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
                    id: doc.id,
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
                clientHeader.classList.add('card-header');
                clientHeader.id = `recycle-report-heading-${clientId}`;

                const clientButton = document.createElement('button');
                clientButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                clientButton.setAttribute('data-toggle', 'collapse');
                clientButton.setAttribute('data-target', `#recycle-report-collapse-${clientId}`);
                clientButton.setAttribute('aria-expanded', 'false');
                clientButton.setAttribute('aria-controls', `recycle-report-collapse-${clientId}`);
                clientButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${clientName}`;

                clientHeader.appendChild(clientButton);

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
                    yearHeader.classList.add('card-header');
                    yearHeader.id = `recycle-report-heading-${yearId}`;

                    const yearButton = document.createElement('button');
                    yearButton.classList.add('btn', 'btn-link', 'text-left', 'collapsed');
                    yearButton.setAttribute('data-toggle', 'collapse');
                    yearButton.setAttribute('data-target', `#recycle-report-collapse-${yearId}`);
                    yearButton.setAttribute('aria-expanded', 'false');
                    yearButton.setAttribute('aria-controls', `recycle-report-collapse-${yearId}`);
                    yearButton.innerHTML = `<i class="fas fa-chevron-down mr-2"></i>${year}`;

                    yearHeader.appendChild(yearButton);

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

                recycleBinReportsList.appendChild(clientSection);
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
