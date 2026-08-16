/* ==========================================================================
BUBBLE SHEET — NAVBAR (DASHBOARD)
========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    addEventListeners();
    setupMobileMenu();
    setupScrollEffects();
    initNavbarStudentData();
    initWalletBalance();
    
/* =====================================================
    DASHBOARD DATA
===================================================== */
    if (typeof loadDashboardData === 'function') {
        loadDashboardData();
    }
});

/* =====================================================
THEME
===================================================== */

function initTheme() {

const savedTheme =
    localStorage.getItem('theme');

const themeToggle =
    document.getElementById('input');

const isDark =
    savedTheme === 'dark';


document.body.classList.toggle(
    'dark',
    isDark
);


if (themeToggle) {
    themeToggle.checked = isDark;
}
}


/* =====================================================
EVENT LISTENERS
===================================================== */

function addEventListeners() {

const themeToggle =
    document.getElementById('input');


if (themeToggle) {

    themeToggle.addEventListener(
        'change',
        function () {

            if (this.checked) {

                document.body.classList.add(
                    'dark'
                );

                localStorage.setItem(
                    'theme',
                    'dark'
                );

            } else {

                document.body.classList.remove(
                    'dark'
                );

                localStorage.setItem(
                    'theme',
                    'light'
                );
            }

        }
    );
}


setActiveLink();
}


/* =====================================================
ACTIVE LINK
===================================================== */

function setActiveLink() {

const navLinks =
    document.querySelectorAll(
        '.nav-link'
    );


const currentPage =
    window.location.pathname
        .split('/')
        .pop();


navLinks.forEach(function (link) {

    link.classList.remove(
        'active'
    );


    const linkPage =
        link.getAttribute('href');


    if (
        linkPage === currentPage
    ) {

        link.classList.add(
            'active'
        );
    }

});
}


/* =====================================================
MOBILE / ACCOUNT MENU
===================================================== */

function toggleMenu() {

const hamburger =
    document.querySelector(
        '.hamburger'
    );


const mobileMenu =
    document.getElementById(
        'mobileMenu'
    );


const menuOverlay =
    document.getElementById(
        'menuOverlay'
    );


if (
    !hamburger ||
    !mobileMenu ||
    !menuOverlay
) {
    return;
}


closeNotifications();


const isOpen =
    mobileMenu.classList.toggle(
        'show'
    );


hamburger.classList.toggle(
    'active',
    isOpen
);


menuOverlay.classList.toggle(
    'show',
    isOpen
);


hamburger.setAttribute(
    'aria-expanded',
    isOpen
        ? 'true'
        : 'false'
);


mobileMenu.setAttribute(
    'aria-hidden',
    isOpen
        ? 'false'
        : 'true'
);


document.body.style.overflow =
    isOpen
        ? 'hidden'
        : '';
}


/* =====================================================
CLOSE MOBILE MENU
===================================================== */

function closeMenu() {

const hamburger =
    document.querySelector(
        '.hamburger'
    );


const mobileMenu =
    document.getElementById(
        'mobileMenu'
    );


const menuOverlay =
    document.getElementById(
        'menuOverlay'
    );


if (
    !hamburger ||
    !mobileMenu ||
    !menuOverlay
) {
    return;
}


hamburger.classList.remove(
    'active'
);


mobileMenu.classList.remove(
    'show'
);


menuOverlay.classList.remove(
    'show'
);


hamburger.setAttribute(
    'aria-expanded',
    'false'
);


mobileMenu.setAttribute(
    'aria-hidden',
    'true'
);


document.body.style.overflow =
    '';
}


/* =====================================================
MOBILE MENU SETUP
===================================================== */

function setupMobileMenu() {

const overlay =
    document.getElementById(
        'menuOverlay'
    );


if (overlay) {

    overlay.addEventListener(
        'click',
        closeMenu
    );
}


const mobileLinks =
    document.querySelectorAll(
        '.mobile-menu a'
    );


mobileLinks.forEach(
    function (link) {

        link.addEventListener(
            'click',
            closeMenu
        );

    }
);


document.addEventListener(
    'keydown',
    function (event) {

        if (
            event.key === 'Escape'
        ) {

            closeMenu();

            closeNotifications();
        }

    }
);


window.addEventListener(
    'resize',
    function () {

        if (
            window.innerWidth > 992
        ) {

            closeMenu();
        }

    }
);
}


/* =====================================================
NOTIFICATIONS
===================================================== */

function toggleNotifications(event) {

if (event) {
    event.stopPropagation();
}


const dropdown =
    document.getElementById(
        'notificationDropdown'
    );


if (dropdown) {

    dropdown.classList.toggle(
        'show'
    );
}
}


function closeNotifications() {

const dropdown =
    document.getElementById(
        'notificationDropdown'
    );


if (dropdown) {

    dropdown.classList.remove(
        'show'
    );
}
}


document.addEventListener(
'click',
function () {

    closeNotifications();

}
);

/* =====================================================
   NAVBAR STUDENT DATA
===================================================== */

function initNavbarStudentData() {

    const name =
        localStorage.getItem("studentName") || "";


    /* =========================
       DESKTOP NAME
    ========================= */

    const desktopName =
        document.getElementById(
            "navbarStudentName"
        );


    if (desktopName) {

        desktopName.textContent =
            name;
    }


    /* =========================
       MOBILE NAME
    ========================= */

    const mobileName =
        document.getElementById(
            "mobilewelcomeName"
        );


    if (mobileName) {

        mobileName.textContent =
            name;
    }


    /* =========================
       AVATAR
    ========================= */

    if (name) {

        const firstLetter =
            name.trim().charAt(0);


        const smallAvatar =
            document.querySelector(
                ".student-avatar-small"
            );


        if (smallAvatar) {

            smallAvatar.textContent =
                firstLetter;
        }


        const mobileAvatar =
            document.querySelector(
                ".student-avatar"
            );


        if (mobileAvatar) {

            mobileAvatar.textContent =
                firstLetter;
        }
    }
}
/* =====================================================
WALLET
===================================================== */

function initWalletBalance() {

/*
    IMPORTANT:

    navbar-dashboard.js
    does NOT call the Wallet API.

    wallet.js is responsible for:
    - getting wallet transactions
    - calculating balance
    - calculating total charged
    - calculating total spent
    - updating wallet.html

    Here we only provide a localStorage
    fallback for pages that don't load wallet.js.
*/


const balanceEls =
    document.querySelectorAll(
        '#studentBalance, #studentBalanceMobile'
    );


if (!balanceEls.length) {
    return;
}


/* =================================================
    LOCAL STORAGE FALLBACK
================================================= */

const storedBalance =
    localStorage.getItem(
        'blanced'
    );


if (
    storedBalance !== null &&
    storedBalance !== ''
) {

    balanceEls.forEach(
        function (el) {

            if (!el) return;

            el.textContent =
                Number(
                    storedBalance
                ).toLocaleString(
                    'en-US'
                );

        }
    );

} else {

    /*
        No localStorage balance.

        Don't show fake 250.
        Leave it empty until the real
        wallet data is available.
    */

    balanceEls.forEach(
        function (el) {

            if (!el) return;

            el.textContent = '';

        }
    );
}


/*
    DO NOT call loadWalletData() here.

    wallet.js already does that on wallet.html.

    Calling it from both files causes:
    - duplicate API requests
    - duplicate rendering
    - possible race conditions
    - confusing balance updates
*/
}


/* =====================================================
OPTIONAL WALLET BALANCE SYNC
===================================================== */

function setNavbarWalletBalance(balance) {

const balanceEls =
    document.querySelectorAll(
        '#studentBalance, #studentBalanceMobile'
    );


const numericBalance =
    Number(balance) || 0;


balanceEls.forEach(
    function (el) {

        if (!el) return;


        el.textContent =
            numericBalance.toLocaleString(
                'en-US'
            );

    }
);


/*
    Keep localStorage as a fallback
    for pages that don't have wallet.js.
*/

localStorage.setItem(
    'blanced',
    String(numericBalance)
);
}


/* =====================================================
SCROLL EFFECTS
===================================================== */

function setupScrollEffects() {

const nav =
    document.getElementById(
        'siteNav'
    );


const progress =
    document.getElementById(
        'navProgress'
    );


if (!nav) {
    return;
}


let ticking = false;


function update() {

    const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop;


    const docHeight =
        document.documentElement
            .scrollHeight -
        document.documentElement
            .clientHeight;


    const percent =
        docHeight > 0
            ? (scrollTop / docHeight) * 100
            : 0;


    nav.classList.toggle(
        'is-scrolled',
        scrollTop > 20
    );


    if (progress) {

        progress.style.width =
            percent + '%';
    }


    ticking = false;
}


window.addEventListener(
    'scroll',
    function () {

        if (!ticking) {

            requestAnimationFrame(
                update
            );

            ticking = true;
        }

    },
    {
        passive: true
    }
);


update();
}