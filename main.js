// main.js

// Inizializza Firebase Auth e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Variabile globale per l'utente corrente
let currentUser = null;

// Listener per lo stato di autenticazione
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log("Utente autenticato:", currentUser.uid);
        // Carica la sezione predefinita
        loadSection('data-management');
        // Inizializza i timer solo dopo che l'utente è confermato autenticato
        await initializeTimerEvents();
    } else {
        currentUser = null;
        // Reindirizza a login.html se non autenticato
        window.location.href = 'login.html';
    }
});

// --- Sezione Gestione Dati ---

// Template per la sezione Gestione Dati
const dataManagementTemplate = `
<div id="data-management" class="container mt-5 custom-container">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">
        <i class="fas fa-database mr-2"></i>Gestione Dati
    </h2>

    <div class="row">
        <!-- Aggiungi Cliente -->
        <div class="col-lg-12">
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-user-plus mr-2"></i>Aggiungi Nuovo Cliente</h5>
                    <button id="toggle-client-list-btn" class="btn btn-outline-light btn-sm">
                        <i class="fas fa-list"></i> Mostra/Nascondi Elenco Clienti
                    </button>
                </div>
                <div class="card-body">
                    <div class="input-group">
                        <input type="text" id="new-client-name" class="form-control" placeholder="Nome Cliente">
                        <div class="input-group-append">
                            <button id="add-client-btn" class="btn btn-success"><i class="fas fa-plus"></i> Aggiungi Cliente</button>
                        </div>
                    </div>
                </div>
                <!-- Lista Clienti -->
                <ul id="client-list" class="list-group list-group-flush" style="display: none;">
                    <!-- Clienti saranno popolati dinamicamente -->
                </ul>
            </div>
        </div>
    </div>

    <div class="row">
        <!-- Gestione Siti -->
<div class="col-md-6">
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-info text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-map-marker-alt mr-2"></i>Gestione Siti</h5>
            <button id="toggle-site-list-btn" class="btn btn-outline-light btn-sm">
                <i class="fas fa-list"></i> Mostra/Nascondi Elenco Siti
            </button>
        </div>
        <div class="card-body">
                    <div class="form-group">
                        <label for="select-client-for-site" class="font-weight-bold">Seleziona Cliente:</label>
                        <select id="select-client-for-site" class="form-control">
                            <option value="">--Seleziona Cliente--</option>
                            <!-- Le opzioni saranno popolate dinamicamente -->
                        </select>
                    </div>
                    <div class="input-group mb-3">
                        <input type="text" id="new-site-name" class="form-control" placeholder="Nome del Sito">
                        <div class="input-group-append">
                            <button id="add-site-btn" class="btn btn-success"><i class="fas fa-plus"></i> Aggiungi Sito</button>
                        </div>
                    </div>
                    <!-- Lista Siti -->
                    <div id="site-list" style="display: none;">
                        <!-- Siti saranno popolati dinamicamente come sottocategorie dei clienti -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Gestione Tipi di Lavoro -->
<div class="col-md-6">
    <div class="card mb-4 shadow-sm">
        <div class="card-header bg-warning text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-tools mr-2"></i>Gestione Tipi di Lavoro</h5>
            <button id="toggle-worktype-list-btn" class="btn btn-outline-light btn-sm">
                <i class="fas fa-list"></i> Mostra/Nascondi Elenco Tipi di Lavoro
            </button>
        </div>
        <div class="card-body">
                    <div class="form-group">
                        <label for="select-client-for-worktype" class="font-weight-bold">Seleziona Cliente:</label>
                        <select id="select-client-for-worktype" class="form-control">
                            <option value="">--Seleziona Cliente--</option>
                            <!-- Le opzioni saranno popolate dinamicamente -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new-worktype-name" class="font-weight-bold">Tipo di Lavoro:</label>
                        <input type="text" id="new-worktype-name" class="form-control" placeholder="Tipo di Lavoro">
                    </div>
                    <div class="form-group">
                        <label for="new-worktype-hourly-rate" class="font-weight-bold">Tariffa Oraria (€):</label>
                        <input type="number" id="new-worktype-hourly-rate" class="form-control" placeholder="Es: 50">
                    </div>
                    <button id="add-worktype-btn" class="btn btn-success btn-block"><i class="fas fa-plus"></i> Aggiungi Tipo di Lavoro</button>
                    <!-- Lista Tipi di Lavoro -->
                    <div id="worktype-list" class="mt-3" style="display: none;">
                        <!-- Tipi di Lavoro saranno popolati dinamicamente come sottocategorie dei clienti -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

/**
 * Funzione per caricare le sezioni in base al menu
 * @param {string} section - Nome della sezione da caricare
 */
function loadSection(section) {
    const contentSection = document.getElementById('content-section');
    contentSection.innerHTML = ''; // Svuota la sezione di contenuto

    switch (section) {
        case 'data-management':
            contentSection.innerHTML = dataManagementTemplate;
            initializeDataManagementEvents();
            break;
        case 'timer':
            contentSection.innerHTML = timerTemplate;
            initializeTimerEvents();
            break;
        case 'saved-timers':
            contentSection.innerHTML = savedTimersTemplate;
            initializeSavedTimersEvents();
            break;
        case 'recycle-bin':
            contentSection.innerHTML = savedTimersTemplate; // Use the updated template
            // Mostra la sezione del cestino e nasconde le altre
            document.getElementById('saved-timers-section').style.display = 'none';
            document.getElementById('recycle-bin-section').style.display = 'block';
            initializeRecycleBinTimersEvents(); // Inizializza gli eventi per i timer nel cestino
            initializeRecycleBinReportsEvents(); // Inizializza gli eventi per i report nel cestino
            break;
        case 'report':
            contentSection.innerHTML = reportTemplate;
            initializeReportEvents();
            break;
        case 'report-history':
            contentSection.innerHTML = reportHistoryTemplate;
            initializeReportHistoryEvents();
            break;
        case 'dashboard':
            // Carica il template della dashboard
            initializeDashboardEvents();
            break;
        // aggiungi altri case se necessario
        default:
            contentSection.innerHTML = '<p>Sezione non trovata.</p>';
    }

    // **Inizializza i tooltip di Bootstrap qui**
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });
}

/**
 * Funzione per inizializzare gli eventi della Gestione Dati
 */
function initializeDataManagementEvents() {
    // Elementi DOM esistenti
    const addClientBtn = document.getElementById('add-client-btn');
    const newClientName = document.getElementById('new-client-name');

    const addSiteBtn = document.getElementById('add-site-btn');
    const newSiteName = document.getElementById('new-site-name');
    const selectClientForSite = document.getElementById('select-client-for-site');

    const addWorktypeBtn = document.getElementById('add-worktype-btn');
    const newWorktypeName = document.getElementById('new-worktype-name');
    const selectClientForWorktype = document.getElementById('select-client-for-worktype');

    // Pulsanti di toggle
    const toggleClientListBtn = document.getElementById('toggle-client-list-btn');
    const toggleSiteListBtn = document.getElementById('toggle-site-list-btn');
    const toggleWorktypeListBtn = document.getElementById('toggle-worktype-list-btn');

    // Event listener per il pulsante di toggle dei Clienti
    toggleClientListBtn.addEventListener('click', function () {
        const clientList = document.getElementById('client-list');
        if (clientList.style.display === 'none' || clientList.style.display === '') {
            clientList.style.display = 'block';
        } else {
            clientList.style.display = 'none';
        }
    });

    // **Event listener per il pulsante di toggle dei Siti**
    toggleSiteListBtn.addEventListener('click', function () {
        const siteListDiv = document.getElementById('site-list');
        if (siteListDiv.style.display === 'none' || siteListDiv.style.display === '') {
            siteListDiv.style.display = 'block';
        } else {
            siteListDiv.style.display = 'none';
        }
    });

    // **Event listener per il pulsante di toggle dei Tipi di Lavoro**
    toggleWorktypeListBtn.addEventListener('click', function () {
        const worktypeListDiv = document.getElementById('worktype-list');
        if (worktypeListDiv.style.display === 'none' || worktypeListDiv.style.display === '') {
            worktypeListDiv.style.display = 'block';
        } else {
            worktypeListDiv.style.display = 'none';
        }
    });

    // Carica le liste esistenti
    loadClients(); // Per la lista dei Clienti
    loadClientsForSelect(selectClientForSite); // Per il select dei Clienti nei Siti
    loadClientsForSelect(selectClientForWorktype); // Per il select dei Clienti nei Tipi di Lavoro
    loadSites(); // Per la lista dei Siti
    loadWorktypes(); // Per la lista dei Tipi di Lavoro

    // Aggiungi Cliente
    addClientBtn.addEventListener('click', () => {
        const clientName = newClientName.value.trim();
        if (clientName) {
            addClient(clientName);
        } else {
            showAlert('warning', 'Attenzione', 'Inserisci un nome valido per il cliente.');
        }
    });

    // Aggiungi Sito
    addSiteBtn.addEventListener('click', () => {
        const siteName = newSiteName.value.trim();
        const clientId = selectClientForSite.value;

        if (!clientId) {
            showAlert('warning', 'Attenzione', 'Seleziona un Cliente prima di aggiungere un Sito.');
            return;
        }

        if (siteName) {
            addSite(clientId, siteName);
        } else {
            showAlert('warning', 'Attenzione', 'Inserisci un nome valido per il sito.');
        }
    });

    // Aggiungi Tipo di Lavoro
    addWorktypeBtn.addEventListener('click', () => {
        const worktypeName = newWorktypeName.value.trim();
        const clientId = selectClientForWorktype.value;
        const hourlyRate = parseFloat(document.getElementById('new-worktype-hourly-rate').value);

        if (!clientId) {
            showAlert('warning', 'Attenzione', 'Seleziona un Cliente prima di aggiungere un Tipo di Lavoro.');
            return;
        }

        if (worktypeName && !isNaN(hourlyRate)) {
            addWorktype(clientId, worktypeName, hourlyRate);
        } else {
            showAlert('warning', 'Attenzione', 'Inserisci un nome valido e una tariffa oraria valida per il tipo di lavoro.');
        }
    });
}

/**
 * Funzione per mostrare notifiche con SweetAlert2
 * @param {string} icon - Tipo di icona ('success', 'error', 'warning', etc.)
 * @param {string} title - Titolo della notifica
 * @param {string} text - Testo della notifica
 */
function showAlert(icon, title, text) {
    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: '#3085d6'
    });
}

/**
 * Funzione per aggiungere un nuovo cliente
 * @param {string} name - Nome del cliente
 */
async function addClient(name) {
    try {
        await db.collection('clients').add({
            name: name,
            uid: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAlert('success', 'Cliente aggiunto!', `Il cliente "${name}" è stato aggiunto con successo.`);
        document.getElementById('new-client-name').value = '';
        loadClients();
        loadClientsForSelect(document.getElementById('select-client-for-site'));
        loadClientsForSelect(document.getElementById('select-client-for-worktype'));
    } catch (error) {
        console.error('Errore nell\'aggiunta del cliente:', error);
        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'aggiunta del cliente.');
    }
}

/**
 * Funzione per aggiungere un nuovo sito
 * @param {string} clientId - ID del cliente associato
 * @param {string} name - Nome del sito
 */
async function addSite(clientId, name) {
    try {
        await db.collection('sites').add({
            name: name,
            uid: currentUser.uid,
            clientId: clientId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAlert('success', 'Sito aggiunto!', `Il sito "${name}" è stato aggiunto con successo.`);
        document.getElementById('new-site-name').value = '';
        loadSites();
    } catch (error) {
        console.error('Errore nell\'aggiunta del sito:', error);
        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'aggiunta del sito.');
    }
}

/**
 * Funzione per aggiungere un nuovo tipo di lavoro
 * @param {string} clientId - ID del cliente associato
 * @param {string} name - Nome del tipo di lavoro
 * @param {number} hourlyRate - Tariffa oraria per il tipo di lavoro
 */
async function addWorktype(clientId, name, hourlyRate) {
    try {
        await db.collection('worktypes').add({
            name: name,
            uid: currentUser.uid,
            clientId: clientId,
            hourlyRate: hourlyRate,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAlert('success', 'Tipo di Lavoro aggiunto!', `Il tipo di lavoro "${name}" è stato aggiunto con successo.`);
        document.getElementById('new-worktype-name').value = '';
        document.getElementById('new-worktype-hourly-rate').value = ''; // Resetta il campo hourlyRate
        loadWorktypes();
    } catch (error) {
        console.error('Errore nell\'aggiunta del tipo di lavoro:', error);
        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'aggiunta del tipo di lavoro.');
    }
}

/**
 * Funzione per caricare i Clienti nelle liste o nei menu a tendina
 * @param {HTMLElement} selectElement - Elemento select da popolare
 */
function loadClientsForSelect(selectElement) {
    selectElement.innerHTML = '<option value="">--Seleziona Cliente--</option>';
    db.collection('clients')
        .where('uid', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.data().name;
                selectElement.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Errore nel caricamento dei clienti per selezione:', error);
            showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei clienti.');
        });
}

/**
 * Funzione per caricare i Clienti nella lista principale
 * @param {HTMLElement|null} selectElement - Elemento select opzionale
 */
function loadClients(selectElement = null) {
    if (selectElement) {
        // Popola il menu a tendina
        selectElement.innerHTML = '<option value="">--Seleziona Cliente--</option>';
        db.collection('clients')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().name;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei clienti:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei clienti.');
            });
    } else {
        // Popola la lista nella Gestione Dati
        const clientList = document.getElementById('client-list');
        clientList.innerHTML = '';
        db.collection('clients')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const li = document.createElement('li');
                    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = doc.data().name;
                    nameSpan.classList.add('flex-grow-1');

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');

                    deleteBtn.addEventListener('click', () => {
                        Swal.fire({
                            title: 'Sei sicuro?',
                            text: `Vuoi eliminare il cliente "${doc.data().name}"?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Sì, elimina!',
                            cancelButtonText: 'Annulla'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                db.collection('clients').doc(doc.id).delete()
                                    .then(() => {
                                        Swal.fire(
                                            'Eliminato!',
                                            'Il cliente è stato eliminato.',
                                            'success'
                                        );
                                        loadClients();
                                        loadClientsForSelect(document.getElementById('select-client-for-site'));
                                        loadClientsForSelect(document.getElementById('select-client-for-worktype'));
                                    })
                                    .catch(error => {
                                        console.error('Errore nell\'eliminazione del cliente:', error);
                                        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'eliminazione del cliente.');
                                    });
                            }
                        });
                    });

                    li.appendChild(nameSpan);
                    li.appendChild(deleteBtn);
                    clientList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei clienti:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei clienti.');
            });
    }
}

/**
 * Funzione per caricare i Siti nelle liste o nei menu a tendina
 * @param {HTMLElement|null} selectElement - Elemento select da popolare
 * @param {string|null} clientId - ID del cliente per filtrare i siti
 */
function loadSites(selectElement = null, clientId = null) {
    if (selectElement && clientId) {
        // Popola il menu a tendina basato su clientId
        selectElement.innerHTML = '<option value="">--Seleziona Sito--</option>';
        db.collection('sites')
            .where('uid', '==', currentUser.uid)
            .where('clientId', '==', clientId)
            .orderBy('name')
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().name;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei siti:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei siti.');
            });
    } else {
        // Popola la lista nella Gestione Dati
        const siteListDiv = document.getElementById('site-list');
        siteListDiv.innerHTML = '';
        db.collection('clients')
            .where('uid', '==', currentUser.uid)
            .orderBy('name')
            .get()
            .then(clientSnapshot => {
                clientSnapshot.forEach(clientDoc => {
                    const clientData = clientDoc.data();
                    const clientId = clientDoc.id;
        
                    // Crea un div per la sezione del cliente
                    const clientSectionDiv = document.createElement('div');
                    clientSectionDiv.classList.add('mb-3');
        
                    // Crea l'header per il Cliente con un pulsante di toggle
                    const clientHeaderDiv = document.createElement('div');
                    clientHeaderDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        
                    const clientHeader = document.createElement('h5');
                    clientHeader.textContent = clientData.name;
                    clientHeader.classList.add('mt-3');
        
                    const toggleSitesBtn = document.createElement('button');
                    toggleSitesBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
                    toggleSitesBtn.innerHTML = '<i class="fas fa-eye"></i> Mostra/Nascondi Siti';
        
                    clientHeaderDiv.appendChild(clientHeader);
                    clientHeaderDiv.appendChild(toggleSitesBtn);
        
                    // Crea la lista dei Siti per questo Cliente
                    const siteUl = document.createElement('ul');
                    siteUl.classList.add('list-group');
                    siteUl.style.display = 'none'; // Nasconde i siti inizialmente
        
                    db.collection('sites')
                        .where('uid', '==', currentUser.uid)
                        .where('clientId', '==', clientId)
                        .orderBy('name')
                        .get()
                        .then(siteSnapshot => {
                            if (siteSnapshot.empty) {
                                const noSitesLi = document.createElement('li');
                                noSitesLi.textContent = 'Nessun sito associato.';
                                noSitesLi.classList.add('list-group-item');
                                siteUl.appendChild(noSitesLi);
                            } else {
                                siteSnapshot.forEach(siteDoc => {
                                    const siteData = siteDoc.data();
                                    const li = document.createElement('li');
                                    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        
                                    const nameSpan = document.createElement('span');
                                    nameSpan.textContent = siteData.name;
                                    nameSpan.classList.add('flex-grow-1');
        
                                    const deleteBtn = document.createElement('button');
                                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                                    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');
        
                                    deleteBtn.addEventListener('click', () => {
                                        Swal.fire({
                                            title: 'Sei sicuro?',
                                            text: `Vuoi eliminare il sito "${siteData.name}"?`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#d33',
                                            cancelButtonColor: '#3085d6',
                                            confirmButtonText: 'Sì, elimina!',
                                            cancelButtonText: 'Annulla'
                                        }).then((result) => {
                                            if (result.isConfirmed) {
                                                db.collection('sites').doc(siteDoc.id).delete()
                                                    .then(() => {
                                                        Swal.fire(
                                                            'Eliminato!',
                                                            'Il sito è stato eliminato.',
                                                            'success'
                                                        );
                                                        loadSites();
                                                    })
                                                    .catch(error => {
                                                        console.error('Errore nell\'eliminazione del sito:', error);
                                                        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'eliminazione del sito.');
                                                    });
                                            }
                                        });
                                    });
        
                                    li.appendChild(nameSpan);
                                    li.appendChild(deleteBtn);
                                    siteUl.appendChild(li);
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Errore nel caricamento dei siti:', error);
                            showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei siti.');
                        });
        
                    // Aggiungi l'event listener per il pulsante di toggle
                    toggleSitesBtn.addEventListener('click', () => {
                        if (siteUl.style.display === 'none' || siteUl.style.display === '') {
                            siteUl.style.display = 'block';
                        } else {
                            siteUl.style.display = 'none';
                        }
                    });
        
                    // Aggiungi l'header del cliente e la lista dei siti al div della sezione
                    clientSectionDiv.appendChild(clientHeaderDiv);
                    clientSectionDiv.appendChild(siteUl);
        
                    // Aggiungi il div della sezione cliente al div principale
                    siteListDiv.appendChild(clientSectionDiv);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei clienti per i siti:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei clienti.');
            });
    }
}

/**
 * Funzione per caricare i Tipi di Lavoro nelle liste o nei menu a tendina
 * @param {HTMLElement|null} selectElement - Elemento select da popolare
 * @param {string|null} clientId - ID del cliente per filtrare i tipi di lavoro
 */
function loadWorktypes(selectElement = null, clientId = null) {
    if (selectElement && clientId) {
        // Popola il menu a tendina basato su clientId
        selectElement.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
        db.collection('worktypes')
            .where('uid', '==', currentUser.uid)
            .where('clientId', '==', clientId)
            .orderBy('name')
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().name;
                    selectElement.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei tipi di lavoro:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei tipi di lavoro.');
            });
    } else {
        // Popola la lista nella Gestione Dati
        const worktypeListDiv = document.getElementById('worktype-list');
        worktypeListDiv.innerHTML = '';
        db.collection('clients')
            .where('uid', '==', currentUser.uid)
            .orderBy('name')
            .get()
            .then(clientSnapshot => {
                clientSnapshot.forEach(clientDoc => {
                    const clientData = clientDoc.data();
                    const clientId = clientDoc.id;
        
                    // Crea un div per la sezione del cliente
                    const clientSectionDiv = document.createElement('div');
                    clientSectionDiv.classList.add('mb-3');
        
                    // Crea l'header per il Cliente con un pulsante di toggle
                    const clientHeaderDiv = document.createElement('div');
                    clientHeaderDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center');
        
                    const clientHeader = document.createElement('h5');
                    clientHeader.textContent = clientData.name;
                    clientHeader.classList.add('mt-3');
        
                    const toggleWorktypesBtn = document.createElement('button');
                    toggleWorktypesBtn.classList.add('btn', 'btn-sm', 'btn-outline-secondary');
                    toggleWorktypesBtn.innerHTML = '<i class="fas fa-eye"></i> Mostra/Nascondi Tipi di Lavoro';
        
                    clientHeaderDiv.appendChild(clientHeader);
                    clientHeaderDiv.appendChild(toggleWorktypesBtn);
        
                    // Crea la lista dei Tipi di Lavoro per questo Cliente
                    const worktypeUl = document.createElement('ul');
                    worktypeUl.classList.add('list-group');
                    worktypeUl.style.display = 'none'; // Nasconde i tipi di lavoro inizialmente
        
                    db.collection('worktypes')
                        .where('uid', '==', currentUser.uid)
                        .where('clientId', '==', clientId)
                        .orderBy('name')
                        .get()
                        .then(worktypeSnapshot => {
                            if (worktypeSnapshot.empty) {
                                const noWorktypesLi = document.createElement('li');
                                noWorktypesLi.textContent = 'Nessun tipo di lavoro associato.';
                                noWorktypesLi.classList.add('list-group-item');
                                worktypeUl.appendChild(noWorktypesLi);
                            } else {
                                worktypeSnapshot.forEach(worktypeDoc => {
                                    const worktypeData = worktypeDoc.data();
                                    const li = document.createElement('li');
                                    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        
                                    const nameSpan = document.createElement('span');
                                    nameSpan.textContent = `${worktypeData.name} (Tariffa Oraria: ${worktypeData.hourlyRate || 0} €)`;
                                    nameSpan.classList.add('flex-grow-1');
        
                                    const deleteBtn = document.createElement('button');
                                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                                    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');
        
                                    deleteBtn.addEventListener('click', () => {
                                        Swal.fire({
                                            title: 'Sei sicuro?',
                                            text: `Vuoi eliminare il tipo di lavoro "${worktypeData.name}"?`,
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonColor: '#d33',
                                            cancelButtonColor: '#3085d6',
                                            confirmButtonText: 'Sì, elimina!',
                                            cancelButtonText: 'Annulla'
                                        }).then((result) => {
                                            if (result.isConfirmed) {
                                                db.collection('worktypes').doc(worktypeDoc.id).delete()
                                                    .then(() => {
                                                        Swal.fire(
                                                            'Eliminato!',
                                                            'Il tipo di lavoro è stato eliminato.',
                                                            'success'
                                                        );
                                                        loadWorktypes();
                                                    })
                                                    .catch(error => {
                                                        console.error('Errore nell\'eliminazione del tipo di lavoro:', error);
                                                        showAlert('error', 'Errore', 'Si è verificato un errore durante l\'eliminazione del tipo di lavoro.');
                                                    });
                                            }
                                        });
                                    });
        
                                    li.appendChild(nameSpan);
                                    li.appendChild(deleteBtn);
                                    worktypeUl.appendChild(li);
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Errore nel caricamento dei tipi di lavoro:', error);
                            showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei tipi di lavoro.');
                        });
        
                    // Aggiungi l'event listener per il pulsante di toggle
                    toggleWorktypesBtn.addEventListener('click', () => {
                        if (worktypeUl.style.display === 'none' || worktypeUl.style.display === '') {
                            worktypeUl.style.display = 'block';
                        } else {
                            worktypeUl.style.display = 'none';
                        }
                    });
        
                    // Aggiungi l'header del cliente e la lista dei tipi di lavoro al div della sezione
                    clientSectionDiv.appendChild(clientHeaderDiv);
                    clientSectionDiv.appendChild(worktypeUl);
        
                    // Aggiungi il div della sezione cliente al div principale
                    worktypeListDiv.appendChild(clientSectionDiv);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei clienti per i tipi di lavoro:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei clienti.');
            });
    }
}

/**
 * Inserimento dei template nel DOM
 */
const dataManagementDiv = document.createElement('div');
dataManagementDiv.id = 'data-management-template';
dataManagementDiv.style.display = 'none';
dataManagementDiv.innerHTML = dataManagementTemplate;
document.body.appendChild(dataManagementDiv);