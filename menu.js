// menu.js

// Function to initialize menu events
function initializeMenu() {
    // Function to handle the animation of the menu
    function test() {
        var tabsNewAnim = $('#navbarSupportedContent');
        var activeItemNewAnim = tabsNewAnim.find('.active');
        var activeHeight = activeItemNewAnim.innerHeight();
        var activeWidth = activeItemNewAnim.innerWidth();
        var itemOffset = activeItemNewAnim.offset();
        var containerOffset = tabsNewAnim.offset();

        $(".hori-selector").css({
            "top": itemOffset.top - containerOffset.top + "px",
            "left": itemOffset.left - containerOffset.left + "px",
            "height": activeHeight + "px",
            "width": activeWidth + "px"
        });
    }

    $(document).ready(function () {
        setTimeout(function () { test(); }, 100); // Slight delay to ensure elements are rendered
    });

    $(window).on('resize', function () {
        setTimeout(function () { test(); }, 500);
    });

    $(".navbar-toggler").click(function () {
        $(".navbar-collapse").slideToggle(300);
        setTimeout(function () { test(); }, 300); // Delay to match the slideToggle animation
    });

    // Handle menu item clicks
    $('#navbarSupportedContent ul li a').click(function (e) {
        e.preventDefault();
        var section = $(this).data('section');
        if (section) {
            loadSection(section);
            updateActiveMenuItem(section); // Update the active menu item
        }
        test(); // Update the selector position after click
    });

    // Logout button functionality
    $('#logout-btn').click(function () {
        auth.signOut().then(() => {
            // Redirect to login.html after logout
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Errore durante il logout:', error);
        });
    });
}

// Initialize the menu after loading
function loadMenu() {
    fetch('menu.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('menu-container').innerHTML = data;
            initializeMenu(); // Initialize the menu after loading
        })
        .catch(error => console.error('Errore nel caricamento del menu:', error));
}

// Function to update the active menu item
function updateActiveMenuItem(section) {
    $('#navbarSupportedContent ul li').removeClass("active");
    $('#navbarSupportedContent ul li a[data-section="' + section + '"]').parent().addClass('active');
    setTimeout(function () {
        var tabsNewAnim = $('#navbarSupportedContent');
        var activeItemNewAnim = tabsNewAnim.find('.active');
        var activeHeight = activeItemNewAnim.innerHeight();
        var activeWidth = activeItemNewAnim.innerWidth();
        var itemOffset = activeItemNewAnim.offset();
        var containerOffset = tabsNewAnim.offset();

        $(".hori-selector").css({
            "top": itemOffset.top - containerOffset.top + "px",
            "left": itemOffset.left - containerOffset.left + "px",
            "height": activeHeight + "px",
            "width": activeWidth + "px"
        });
    }, 100); // Slight delay to ensure class changes are applied
}

// Load the menu on page load
loadMenu();
