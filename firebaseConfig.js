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
const CLIENT_ID = '1032884571304-3n339pg4e5tjpkmqjijmlm7j1fjr0rg8.apps.googleusercontent.com';

// Array degli URL dei documenti di scoperta per le API utilizzate
const DISCOVERY_DOCS = [
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  'https://docs.googleapis.com/$discovery/rest?version=v1',
  'https://sheets.googleapis.com/$discovery/rest?version=v4'
];

// Ambiti di autorizzazione richiesti
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let GoogleAuth;

function updateSigninStatus(isSignedIn) {
  const exportGoogleDocBtn = document.getElementById('export-google-doc-btn');
  const exportGoogleSheetBtn = document.getElementById('export-google-sheet-btn');
  const googleSignInBtn = document.getElementById('google-signin-btn');
  const googleSignOutBtn = document.getElementById('google-signout-btn');

  if (isSignedIn) {
    // L'utente è autenticato
    // Abilita i pulsanti di esportazione
    if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = false;
    if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = false;

    // Mostra il pulsante di disconnessione
    if (googleSignInBtn) googleSignInBtn.style.display = 'none';
    if (googleSignOutBtn) googleSignOutBtn.style.display = 'inline-block';
  } else {
    // L'utente non è autenticato
    // Disabilita i pulsanti di esportazione
    if (exportGoogleDocBtn) exportGoogleDocBtn.disabled = true;
    if (exportGoogleSheetBtn) exportGoogleSheetBtn.disabled = true;

    // Mostra il pulsante di accesso
    if (googleSignInBtn) googleSignInBtn.style.display = 'inline-block';
    if (googleSignOutBtn) googleSignOutBtn.style.display = 'none';
  }
}

function handleSignInClick(event) {
  GoogleAuth.signIn();
}

function handleSignOutClick(event) {
  GoogleAuth.signOut();
}

// Inizializza il client quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
  handleClientLoad();
});