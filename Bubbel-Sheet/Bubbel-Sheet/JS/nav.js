document.addEventListener('DOMContentLoaded', function () {

    initTheme();
    addEventListeners();
    loadDashboardData();

    setupMobileMenu();
    setupLogoAnimation();
    setupScrollProgress();
});


// =====================
// THEME
// =====================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('input');

    const isDark = savedTheme === 'dark';

    document.body.classList.toggle('dark', isDark);

    if (themeToggle) {
        themeToggle.checked = isDark;
    }
}


// =====================
// EVENTS
// =====================
function addEventListeners() {

    const themeToggle = document.getElementById('input');

    if (themeToggle) {
        themeToggle.addEventListener('change', function () {
            if (this.checked) {
                document.body.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    setActiveLink();
}


// =====================
// ACTIVE LINK
// =====================
function setActiveLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const currentPage = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        link.classList.remove('active');

        const linkPage = link.getAttribute('href');

        if (linkPage === currentPage) {
            link.classList.add('active');
        }
    });
}


// =====================
// MOBILE MENU
// =====================
function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    if (!hamburger || !mobileMenu || !menuOverlay) return;
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('show');
    menuOverlay.classList.toggle('show');
    document.body.style.overflow =
        mobileMenu.classList.contains('show')
        ? 'hidden'
        : '';
}
function closeMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    if (!hamburger || !mobileMenu || !menuOverlay) return;
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('show');
    menuOverlay.classList.remove('show');
    document.body.style.overflow = '';
}
// =====================
// MOBILE MENU SAFE SETUP
// =====================
function setupMobileMenu() {

    const overlay = document.getElementById('menuOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (mobileLinks.length > 0) {
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }

    const hamburger = document.querySelector('.hamburger');

    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
}


// =====================
// LOGO ANIMATION
// =====================
function setupLogoAnimation() {
    const logoText = document.querySelector('.logo-text');
    const logoImg = document.querySelector('.brand-logo img');

    if (logoText && logoImg) {
        logoText.addEventListener('animationend', () => {
            logoImg.style.opacity = 1;
        });
    }
}
// =====================
// SCROLL PROGRESS + SHRINK
// (drives .is-scrolled + .nav-progress, defined in nav.css but
// left unwired before — works on any page that uses .glass-navbar)
// =====================
function setupScrollProgress() {

    const navbar = document.querySelector('.glass-navbar');
    if (!navbar) return;

    const progressBar = document.querySelector('.nav-progress');

    function updateNavOnScroll() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        navbar.classList.toggle('is-scrolled', scrollTop > 40);

        if (progressBar) {
            const scrollable =
                document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollable > 0
                ? (scrollTop / scrollable) * 100
                : 0;
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
    }

    window.addEventListener('scroll', updateNavOnScroll, { passive: true });
    updateNavOnScroll();
}


function toggleNotifications(event){

    event.stopPropagation();

    document
        .getElementById('notificationDropdown')
        .classList.toggle('show');
}



document.addEventListener('click', () => {

    const dropdown =
        document.getElementById('notificationDropdown');

    if(dropdown){
        dropdown.classList.remove('show');
    }

});