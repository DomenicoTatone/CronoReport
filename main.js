// main.js

// Inizializza Firebase Auth e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Variabile globale per l'utente corrente
let currentUser = null;

// Listener per lo stato di autenticazione
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        // Carica la sezione predefinita
        loadSection('data-management');
    } else {
        currentUser = null;
        // Reindirizza a login.html se non autenticato
        window.location.href = 'login.html';
    }
});

// --- Sezione Gestione Dati ---

// Template per la sezione Gestione Dati
const dataManagementTemplate = `
<div id="data-management" class="container mt-5">
    <h2 class="mb-5 text-center text-uppercase font-weight-bold">Gestione Dati</h2>

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
                <div class="card-header bg-info text-white">
                    <h5 class="mb-0"><i class="fas fa-map-marker-alt mr-2"></i>Gestione Siti</h5>
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
                    <ul id="site-list" class="list-group">
                        <!-- Siti saranno popolati dinamicamente -->
                    </ul>
                </div>
            </div>
        </div>

        <!-- Gestione Tipi di Lavoro -->
        <div class="col-md-6">
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-warning text-white">
                    <h5 class="mb-0"><i class="fas fa-tools mr-2"></i>Gestione Tipi di Lavoro</h5>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label for="select-client-for-worktype" class="font-weight-bold">Seleziona Cliente:</label>
                        <select id="select-client-for-worktype" class="form-control">
                            <option value="">--Seleziona Cliente--</option>
                            <!-- Le opzioni saranno popolate dinamicamente -->
                        </select>
                    </div>
                    <div class="input-group mb-3">
                        <input type="text" id="new-worktype-name" class="form-control" placeholder="Tipo di Lavoro">
                        <div class="input-group-append">
                            <button id="add-worktype-btn" class="btn btn-success"><i class="fas fa-plus"></i> Aggiungi Tipo di Lavoro</button>
                        </div>
                    </div>
                    <ul id="worktype-list" class="list-group">
                        <!-- Tipi di Lavoro saranno popolati dinamicamente -->
                    </ul>
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
        case 'recycle-bin': // Aggiungi questa condizione
            contentSection.innerHTML = recycleBinTemplate;
            initializeRecycleBinEvents();
            break;
        case 'report':
            contentSection.innerHTML = reportTemplate;
            initializeReportEvents();
            break;
        // aggiungi altri case se necessario
        default:
            contentSection.innerHTML = '<p>Sezione non trovata.</p>';
    }
}

/**
 * Funzione per inizializzare gli eventi della Gestione Dati
 */
function initializeDataManagementEvents() {
    // Elementi DOM
    const addClientBtn = document.getElementById('add-client-btn');
    const newClientName = document.getElementById('new-client-name');

    const addSiteBtn = document.getElementById('add-site-btn');
    const newSiteName = document.getElementById('new-site-name');
    const selectClientForSite = document.getElementById('select-client-for-site');

    const addWorktypeBtn = document.getElementById('add-worktype-btn');
    const newWorktypeName = document.getElementById('new-worktype-name');
    const selectClientForWorktype = document.getElementById('select-client-for-worktype');

    // **Aggiungi questo codice**
    const toggleClientListBtn = document.getElementById('toggle-client-list-btn');

    // Aggiungi l'event listener per il pulsante di toggle
    toggleClientListBtn.addEventListener('click', function () {
        const clientList = document.getElementById('client-list');
        if (clientList.style.display === 'none' || clientList.style.display === '') {
            clientList.style.display = 'block';
        } else {
            clientList.style.display = 'none';
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

        if (!clientId) {
            showAlert('warning', 'Attenzione', 'Seleziona un Cliente prima di aggiungere un Tipo di Lavoro.');
            return;
        }

        if (worktypeName) {
            addWorktype(clientId, worktypeName);
        } else {
            showAlert('warning', 'Attenzione', 'Inserisci un nome valido per il tipo di lavoro.');
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
 */
async function addWorktype(clientId, name) {
    try {
        await db.collection('worktypes').add({
            name: name,
            uid: currentUser.uid,
            clientId: clientId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showAlert('success', 'Tipo di Lavoro aggiunto!', `Il tipo di lavoro "${name}" è stato aggiunto con successo.`);
        document.getElementById('new-worktype-name').value = '';
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
    if (selectElement) {
        // Popola il menu a tendina basato su clientId
        selectElement.innerHTML = '<option value="">--Seleziona Sito--</option>';
        let query = db.collection('sites').where('uid', '==', currentUser.uid);
        if (clientId) {
            query = query.where('clientId', '==', clientId);
        }
        query.orderBy('createdAt', 'desc')
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
        const siteList = document.getElementById('site-list');
        siteList.innerHTML = '';
        db.collection('sites')
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

                    const clientId = doc.data().clientId;
                    let clientName = 'Senza Cliente';
                    if (clientId) {
                        // Recupera il nome del Cliente associato
                        db.collection('clients').doc(clientId).get()
                            .then(clientDoc => {
                                if (clientDoc.exists) {
                                    clientName = clientDoc.data().name;
                                    nameSpan.textContent += ` (${clientName})`;
                                }
                            })
                            .catch(error => {
                                console.error('Errore nel recuperare il nome del Cliente:', error);
                            });
                    }

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');

                    deleteBtn.addEventListener('click', () => {
                        Swal.fire({
                            title: 'Sei sicuro?',
                            text: `Vuoi eliminare il sito "${doc.data().name}"?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Sì, elimina!',
                            cancelButtonText: 'Annulla'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                db.collection('sites').doc(doc.id).delete()
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
                    siteList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei siti:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei siti.');
            });
    }
}

/**
 * Funzione per caricare i Tipi di Lavoro nelle liste o nei menu a tendina
 * @param {HTMLElement|null} selectElement - Elemento select da popolare
 * @param {string|null} clientId - ID del cliente per filtrare i tipi di lavoro
 */
function loadWorktypes(selectElement = null, clientId = null) {
    if (selectElement) {
        // Popola il menu a tendina basato su clientId
        selectElement.innerHTML = '<option value="">--Seleziona Tipo di Lavoro--</option>';
        let query = db.collection('worktypes').where('uid', '==', currentUser.uid);
        if (clientId) {
            query = query.where('clientId', '==', clientId);
        }
        query.orderBy('createdAt', 'desc')
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
        const worktypeList = document.getElementById('worktype-list');
        worktypeList.innerHTML = '';
        db.collection('worktypes')
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

                    const clientId = doc.data().clientId;
                    let clientName = 'Senza Cliente';
                    if (clientId) {
                        // Recupera il nome del Cliente associato
                        db.collection('clients').doc(clientId).get()
                            .then(clientDoc => {
                                if (clientDoc.exists) {
                                    clientName = clientDoc.data().name;
                                    nameSpan.textContent += ` (${clientName})`;
                                }
                            })
                            .catch(error => {
                                console.error('Errore nel recuperare il nome del Cliente:', error);
                            });
                    }

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    deleteBtn.classList.add('btn', 'btn-sm', 'p-1');

                    deleteBtn.addEventListener('click', () => {
                        Swal.fire({
                            title: 'Sei sicuro?',
                            text: `Vuoi eliminare il tipo di lavoro "${doc.data().name}"?`,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Sì, elimina!',
                            cancelButtonText: 'Annulla'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                db.collection('worktypes').doc(doc.id).delete()
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
                    worktypeList.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei tipi di lavoro:', error);
                showAlert('error', 'Errore', 'Si è verificato un errore durante il caricamento dei tipi di lavoro.');
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

/**
 * Funzione per caricare le sezioni in base al menu
 * Mantiene l'implementazione originale per garantire la compatibilità
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
        case 'recycle-bin': // Aggiungi questa condizione
            contentSection.innerHTML = savedTimersTemplate; // Usa lo stesso template
            document.getElementById('saved-timers-section').style.display = 'none';
            document.getElementById('recycle-bin-section').style.display = 'block';
            loadRecycleBin(); // Carica i dati del cestino
            break;
        case 'report':
            contentSection.innerHTML = reportTemplate;
            initializeReportEvents();
            break;
        // aggiungi altri case se necessario
        default:
            contentSection.innerHTML = '<p>Sezione non trovata.</p>';
    }
}