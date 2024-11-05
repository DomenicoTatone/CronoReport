// menu.js

// Funzione per caricare il menu dal file menu.html
function loadMenu() {
    fetch('menu.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
            initializeMenu(); // Inizializza il menu dopo averlo caricato
        })
        .catch(error => console.error('Errore nel caricamento del menu:', error));
}

// Funzione per inizializzare gli eventi del menu
function initializeMenu() {
    // Funzione per gestire l'animazione del menu
    function test() {
        var tabsNewAnim = $('#navbarSupportedContent');
        var selectorNewAnim = $('#navbarSupportedContent').find('li').length;
        var activeItemNewAnim = tabsNewAnim.find('.active');
        var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
        var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
        var itemPosNewAnimTop = activeItemNewAnim.position();
        var itemPosNewAnimLeft = activeItemNewAnim.position();

        $(".hori-selector").css({
            "top": itemPosNewAnimTop.top + "px",
            "left": itemPosNewAnimLeft.left + "px",
            "height": activeWidthNewAnimHeight + "px",
            "width": activeWidthNewAnimWidth + "px"
        });
    }

    $(document).ready(function () {
        setTimeout(function () { test(); });
    });

    $(window).on('resize', function () {
        setTimeout(function () { test(); }, 500);
    });

    $(".navbar-toggler").click(function () {
        $(".navbar-collapse").slideToggle(300);
        setTimeout(function () { test(); });
    });

    // Gestione click sul menu
    $('#navbarSupportedContent ul li a').click(function (e) {
        e.preventDefault();
        var section = $(this).data('section');
        if (section) {
            loadSection(section);
            updateActiveMenuItem(section); // Aggiorna l'elemento attivo nel menu
        }
        test(); // Aggiorna l'animazione dopo il click
    });

    // Pulsante logout
    $('#logout-btn').click(function () {
        auth.signOut().then(() => {
            // Reindirizza a login.html dopo il logout
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Errore durante il logout:', error);
        });
    }); // Assicurati che questa parentesi chiuda la funzione di click

} // Questa parentesi chiude la funzione initializeMenu

// Funzione per aggiornare la voce attiva del menu
function updateActiveMenuItem(section) {
    $('#navbarSupportedContent ul li').removeClass("active");
    $('#navbarSupportedContent ul li a[data-section="' + section + '"]').parent().addClass('active');
    // Aggiorna l'animazione del selettore orizzontale
    setTimeout(function () {
        var activeItemNewAnim = $('#navbarSupportedContent').find('.active');
        var activeWidthNewAnimHeight = activeItemNewAnim.innerHeight();
        var activeWidthNewAnimWidth = activeItemNewAnim.innerWidth();
        var itemPosNewAnimTop = activeItemNewAnim.position();
        var itemPosNewAnimLeft = activeItemNewAnim.position();
        $(".hori-selector").css({
            "top": itemPosNewAnimTop.top + "px",
            "left": itemPosNewAnimLeft.left + "px",
            "height": activeWidthNewAnimHeight + "px",
            "width": activeWidthNewAnimWidth + "px"
        });
    });
}

// Carica il menu all'avvio
loadMenu();
