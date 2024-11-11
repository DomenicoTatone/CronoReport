// firebaseConfig.js

const firebaseConfig = {
    apiKey: "AIzaSyCHpbKDsyc6R5Yx3jcsgzjtPeswwC1Si8E",
    authDomain: "lavorieseguiti-384d4.firebaseapp.com",
    projectId: "lavorieseguiti-384d4",
    storageBucket: "lavorieseguiti-384d4.appspot.com",
    messagingSenderId: "1032884571304",
    appId: "1:1032884571304:web:26de738990ca782767869d"
};

// Inserisci il tuo Client ID
const CLIENT_ID = '1032884571304-7t9shq2pb29o92qhthovhsj65l99l9t4.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA1yoFNujcHvWFib5_J1dFiMSDzBMv-b4s';

const DISCOVERY_DOCS = [
  'https://docs.googleapis.com/$discovery/rest?version=v1',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];

const SCOPES = 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets';

// Inizializza Firebase
firebase.initializeApp(firebaseConfig);

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

  // Dispatch an event to notify that the Google API client is initialized
  document.dispatchEvent(new Event('google-api-initialized'));
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

// Funzione per gestire l'autenticazione e l'autorizzazione
function handleAuthClick(callback) {
  tokenClient.callback = async (response) => {
      if (response.error) {
          console.error('Errore durante l\'autenticazione:', response);
          return;
      }
      callback();
  };

  if (!gapi.client.getToken()) {
      // Se non è autenticato, avvia il flusso OAuth 2.0 con prompt di consenso
      tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
      // Se è già autenticato, chiama direttamente la callback
      callback();
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

function initializeGoogleApiClient(accessToken) {
  return new Promise((resolve, reject) => {
      gapi.load('client', () => {
          gapi.client.init({
              discoveryDocs: [
                  'https://docs.googleapis.com/$discovery/rest?version=v1',
                  'https://sheets.googleapis.com/$discovery/rest?version=v4'
              ]
          }).then(() => {
              // Imposta il token di accesso per le richieste
              gapi.client.setToken({
                  access_token: accessToken
              });
              resolve();
          }, (error) => {
              reject(error);
          });
      });
  });
}

function handleClientLoad() {
  const accessToken = localStorage.getItem('googleAccessToken');
  if (accessToken) {
      initializeGoogleApiClient(accessToken).then(() => {
          maybeEnableButtons();
      }).catch(error => {
          console.error('Errore durante l\'inizializzazione del client Google API:', error);
      });
  }
}

// Modifica maybeEnableButtons per essere accessibile globalmente e verificare se i pulsanti esistono
function maybeEnableButtons() {
  if (gapiInited && gisInited) {
      const exportGoogleDocBtns = document.querySelectorAll('.export-google-doc-btn');
      const exportGoogleSheetBtns = document.querySelectorAll('.export-google-sheet-btn');
      exportGoogleDocBtns.forEach(btn => btn.disabled = false);
      exportGoogleSheetBtns.forEach(btn => btn.disabled = false);
  }
}