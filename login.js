// login.js

// Ottieni l'elemento del pulsante di login
const googleLoginBtn = document.getElementById('google-login-btn');

// Aggiungi l'event listener per il click
googleLoginBtn.addEventListener('click', () => {
    // Disabilita il pulsante per evitare clic multipli
    googleLoginBtn.disabled = true;

    // Inizializza il provider di Google
    const provider = new firebase.auth.GoogleAuthProvider();

    // Avvia l'autenticazione con popup
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // Login riuscito
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Errore durante l\'autenticazione:', error);
            // Mostra un messaggio di errore elegante
            Swal.fire({
                icon: 'error',
                title: 'Errore di Autenticazione',
                text: 'Si è verificato un errore durante l\'accesso. Riprova più tardi.',
                confirmButtonText: 'OK'
            });
            // Riabilita il pulsante in caso di errore
            googleLoginBtn.disabled = false;
        });
});
