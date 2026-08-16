/* ==========================================================================
BUBBLE SHEET — NAVBAR (DASHBOARD)
Depends on IDs/classes from navbar-dashboard.html + CSS/navbar.css
========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
initTheme();
addEventListeners();
setupMobileMenu();
setupScrollEffects();
initWalletBalance();

// student_dashbord.js is expected to load before this file and expose
// loadDashboardData(); call it defensively so this navbar script never
// breaks the page if that function isn't present yet.
if (typeof loadDashboardData === 'function') {
    loadDashboardData();
}
});

/* =====================
THEME
===================== */
function initTheme() {
var savedTheme = localStorage.getItem('theme');
var themeToggle = document.getElementById('input');
var isDark = savedTheme === 'dark';

document.body.classList.toggle('dark', isDark);

if (themeToggle) {
    themeToggle.checked = isDark;
}
}

function addEventListeners() {
var themeToggle = document.getElementById('input');

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

/* =====================
ACTIVE LINK (for pages that render a real .nav-link list)
===================== */
function setActiveLink() {
var navLinks = document.querySelectorAll('.nav-link');
var currentPage = window.location.pathname.split('/').pop();

navLinks.forEach(function (link) {
    link.classList.remove('active');
    var linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
        link.classList.add('active');
    }
});
}

/* =====================
MOBILE / ACCOUNT MENU
(student-profile button reuses this same off-canvas panel, unchanged
from the original behaviour)
===================== */
function toggleMenu() {
var hamburger = document.querySelector('.hamburger');
var mobileMenu = document.getElementById('mobileMenu');
var menuOverlay = document.getElementById('menuOverlay');
if (!hamburger || !mobileMenu || !menuOverlay) return;

closeNotifications();

var isOpen = mobileMenu.classList.toggle('show');
hamburger.classList.toggle('active', isOpen);
menuOverlay.classList.toggle('show', isOpen);
hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMenu() {
var hamburger = document.querySelector('.hamburger');
var mobileMenu = document.getElementById('mobileMenu');
var menuOverlay = document.getElementById('menuOverlay');
if (!hamburger || !mobileMenu || !menuOverlay) return;

hamburger.classList.remove('active');
mobileMenu.classList.remove('show');
menuOverlay.classList.remove('show');
hamburger.setAttribute('aria-expanded', 'false');
mobileMenu.setAttribute('aria-hidden', 'true');
document.body.style.overflow = '';
}

function setupMobileMenu() {
var overlay = document.getElementById('menuOverlay');
if (overlay) {
    overlay.addEventListener('click', closeMenu);
}

var mobileLinks = document.querySelectorAll('.mobile-menu a');
mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeMenu();
        closeNotifications();
    }
});

window.addEventListener('resize', function () {
    if (window.innerWidth > 992) closeMenu();
});
}

/* =====================
NOTIFICATIONS DROPDOWN
===================== */
function toggleNotifications(event) {
event.stopPropagation();
var dropdown = document.getElementById('notificationDropdown');
if (dropdown) dropdown.classList.toggle('show');
}

function closeNotifications() {
var dropdown = document.getElementById('notificationDropdown');
if (dropdown) dropdown.classList.remove('show');
}

document.addEventListener('click', function () {
closeNotifications();
});

/* =====================
WALLET
===================== */
function initWalletBalance() {
// Keeping the original hardcoded fallback so nothing breaks if the
// backend binding (Razor / API call) hasn't set these yet.
var balanceEls = [
    document.getElementById('studentBalance'),
    document.getElementById('studentBalanceMobile')
];

balanceEls.forEach(function (el) {
    if (el && !el.textContent.trim()) {
        el.textContent = 250;
    }
});
}

/* =====================
SCROLL EFFECTS — glass activation + progress bar
===================== */
function setupScrollEffects() {
var nav = document.getElementById('siteNav');
var progress = document.getElementById('navProgress');
if (!nav) return;

var ticking = false;

function update() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    nav.classList.toggle('is-scrolled', scrollTop > 20);
    if (progress) progress.style.width = percent + '%';
    ticking = false;
}

window.addEventListener('scroll', function () {
    if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
    }
}, { passive: true });

update();
}