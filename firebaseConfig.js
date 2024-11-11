// firebaseConfig.js

const firebaseConfig = {
    apiKey: "AIzaSyCHpbKDsyc6R5Yx3jcsgzjtPeswwC1Si8E",
    authDomain: "lavorieseguiti-384d4.firebaseapp.com",
    projectId: "lavorieseguiti-384d4",
    storageBucket: "lavorieseguiti-384d4.appspot.com",
    messagingSenderId: "1032884571304",
    appId: "1:1032884571304:web:26de738990ca782767869d"
};

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

// Inserisci il tuo Client ID
const CLIENT_ID = '1032884571304-7t9shq2pb29o92qhthovhsj65l99l9t4.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA1yoFNujcHvWFib5_J1dFiMSDzBMv-b4s';

// Array degli URL dei documenti di scoperta per le API utilizzate
const DISCOVERY_DOCS = [
  'https://docs.googleapis.com/$discovery/rest?version=v1',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];

const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Funzione chiamata quando la libreria GAPI è caricata
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

// Funzione per inizializzare il client GAPI
async function initializeGapiClient() {
  await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
  });
  gapiInited = true;
  maybeEnableButtons();
}

// Funzione chiamata quando la libreria GIS è caricata
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // Sarà assegnato in fase di esecuzione
  });
  gisInited = true;
  maybeEnableButtons();
}

// Funzione per abilitare i pulsanti dopo l'inizializzazione
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
      const exportGoogleDocBtn = document.getElementById('export-google-doc-btn');
      const exportGoogleSheetBtn = document.getElementById('export-google-sheet-btn');
      if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = false;
      if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = false;
  }
}

// Funzione per gestire l'autenticazione e l'autorizzazione
function handleAuthClick(callback) {
  tokenClient.callback = callback;
  if (!gapi.client.getToken()) {
      // Se non è autenticato, avvia il flusso OAuth 2.0 con prompt di consenso
      tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
      // Se è già autenticato, richiedi un nuovo token senza prompt
      tokenClient.requestAccessToken({ prompt: '' });
  }
}

// Funzione per gestire la disconnessione
function handleSignOutClick() {
  const token = gapi.client.getToken();
  if (token) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
  }
}

// Inizializza il client quando la pagina è caricata
window.addEventListener('load', () => {
  // Carica la libreria GAPI
  gapiLoaded();
  // Carica la libreria GIS
  gisLoaded();
});