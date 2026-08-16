/* =============================================
1. PARTICLES
============================================= */
(function () {
    const c = document.getElementById('ptc');
    const colors = ['rgba(0,226,224,.5)', 'rgba(120,124,254,.5)', 'rgba(0,169,242,.45)', 'rgba(72,190,217,.4)', 'rgba(255,255,255,.55)'];
    for (let i = 0; i < 32; i++) {
        const p = document.createElement('div');
        p.className = 'pt';
        const sz = Math.random() * 5 + 2;
        p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}vw;bottom:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-duration:${Math.random() * 22 + 14}s;animation-delay:${Math.random() * 20}s;`;
        c.appendChild(p);
    }
})();

/* =============================================
2. SCROLL REVEAL
============================================= */
(function () {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('[data-r]').forEach(el => obs.observe(el));
})();

/* =============================================
    3. COUNTERS
    ============================================= */
(function () {
    function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
    function run(el) {
        const target = +el.dataset.count;
        const sfx = el.dataset.sfx || '';
        const dur = 2000;
        const t0 = performance.now();
        (function tick(now) {
            const p = Math.min((now - t0) / dur, 1);
            el.textContent = Math.round(easeOut(p) * target).toLocaleString('en-Ar') + sfx;
            if (p < 1) requestAnimationFrame(tick);
        })(t0);
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
    }, { threshold: .4 });
    document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
})();
/* =============================================
4. INFINITE SCHOOL SLIDER
============================================= */
const api = 'https://bubblesheet.runasp.net/api';
(async function () {

    const track = document.getElementById('stk');
    if (!track) return;

    try {
        const response = await fetch(`${api}/Ad/get-ads`);
        const schools = await response.json();
        function chip(s) {
            const d = document.createElement('div');
            d.className = 'school-chip';
            d.innerHTML = `
                <div class="chip-logo">
                    <img src="${s.imgLink}" alt="${s.name}">
                </div>
                <span class="chip-name">
                    ${s.name}
                </span>
            `;
            return d;
        }
        [...schools].forEach(s => {
            track.appendChild(chip(s));
        });
    } catch (error) {
        console.error("Schools API Error:", error);
    }
})();
function register()
{
    window.location.href = "login.html";
}
/* =============================================
5. PWA INSTALL POPUP — multi-browser support
    Chrome / Edge / Chromium  -> beforeinstallprompt
    Safari iOS / iPadOS       -> Share -> Add to Home Screen instructions
    Firefox / other browsers  -> best-effort manual fallback instructions
    Standalone / installed    -> never shown
============================================= */
(function () {

    const popup = document.getElementById("install-popup");
    const installBtn = document.getElementById("installBtn");
    const closeBtn = document.getElementById("closeBtn");
    if (!popup || !installBtn || !closeBtn) return;

    const titleEl = popup.querySelector("h3");
    const descEl = popup.querySelector("p");
    const iconEl = popup.querySelector(".install-icon");

    const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days — don't nag forever, but don't vanish forever either
    const CLOSED_AT_KEY = "installPopupClosedAt";

    let deferredPrompt = null;
    let shown = false;

    /* ---------- platform detection ---------- */
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";

    const isIOS =
        (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS 13+ reports as Mac

    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    const isFirefox = /firefox|fxios/i.test(ua);
    const isChromiumFamily = /chrome|chromium|crios|edg|opr|brave/i.test(ua) && !isFirefox;

    /* ---------- installed / standalone detection ---------- */
    const isInstalled = () => {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.matchMedia("(display-mode: fullscreen)").matches ||
            window.navigator.standalone === true
        );
    };

    /* ---------- cooldown handling ---------- */
    const isInCooldown = () => {
        const closedAt = parseInt(localStorage.getItem(CLOSED_AT_KEY) || "0", 10);
        return closedAt && (Date.now() - closedAt) < COOLDOWN_MS;
    };

    const setCooldown = () => {
        localStorage.setItem(CLOSED_AT_KEY, String(Date.now()));
    };

    const clearCooldown = () => {
        localStorage.removeItem(CLOSED_AT_KEY);
    };

    /* ---------- popup content per platform ---------- */
    function configurePopupFor(mode) {
        if (mode === "chromium") {
            if (titleEl) titleEl.textContent = "تثبيت Bubble Sheet";
            if (descEl) descEl.textContent = "ثبت التطبيق على جهازك للوصول السريع وحل الاختبارات بسهولة في أي وقت.";
            if (iconEl) iconEl.textContent = "📝";
            installBtn.textContent = "تثبيت";
            installBtn.style.display = "";
        } else if (mode === "ios") {
            if (titleEl) titleEl.textContent = "تثبيت Bubble Sheet";
            if (descEl) descEl.textContent = "لتثبيت التطبيق: اضغط على زر المشاركة Share من شريط المتصفح، ثم اختر \"Add to Home Screen\" (إضافة إلى الشاشة الرئيسية).";
            if (iconEl) iconEl.textContent = "📲";
            installBtn.textContent = "تمام، فهمت";
            installBtn.style.display = "";
        } else {
            // firefox / other browsers without a native install API
            if (titleEl) titleEl.textContent = "تثبيت Bubble Sheet";
            if (descEl) descEl.textContent = "لتثبيت التطبيق: افتح قائمة المتصفح (⋮ أو ≡) ثم اختر \"تثبيت التطبيق\" أو \"إضافة إلى الشاشة الرئيسية\".";
            if (iconEl) iconEl.textContent = "📝";
            installBtn.textContent = "تمام، فهمت";
            installBtn.style.display = "";
        }
    }

    function showPopup(mode) {
        if (shown || isInstalled() || isInCooldown()) return;
        configurePopupFor(mode);
        popup.dataset.mode = mode;
        shown = true;
        popup.style.display = "flex";
    }

    function hidePopup() {
        popup.style.display = "none";
    }

    /* ---------- Chrome / Edge / Chromium: real install prompt ---------- */
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;

        if (isInstalled() || isInCooldown()) return;

        // Show as soon as the browser tells us installation is possible —
        // a very short delay only, just enough to avoid popping in before paint.
        requestAnimationFrame(() => {
            setTimeout(() => showPopup("chromium"), 300);
        });
    });

    /* ---------- Safari iOS / iPadOS: manual instructions ---------- */
    /* ---------- Firefox / other: best-effort manual fallback ---------- */
    function initFallbackPrompt() {
        if (isInstalled() || isInCooldown()) return;

        if (isIOS && isSafari) {
            showPopup("ios");
            return;
        }

        if (isFirefox) {
            showPopup("firefox");
            return;
        }

        // Any other non-Chromium browser that never fired beforeinstallprompt
        // and isn't iOS/Firefox: give a generic fallback after a short grace
        // period, so Chromium-family browsers still get a chance to fire the
        // native event first instead of showing the generic version.
        if (!isChromiumFamily) {
            setTimeout(() => {
                if (!shown && !deferredPrompt) showPopup("firefox");
            }, 1500);
        }
    }

    if (document.readyState === "complete") {
        setTimeout(initFallbackPrompt, 400);
    } else {
        window.addEventListener("load", () => {
            setTimeout(initFallbackPrompt, 400);
        });
    }

    /* ---------- interactions ---------- */
    installBtn.addEventListener("click", async () => {

        if (popup.dataset.mode === "chromium" && deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === "accepted") {
                clearCooldown();
            } else {
                setCooldown();
            }

            deferredPrompt = null;
            hidePopup();
            return;
        }

        // iOS / Firefox / fallback: nothing to trigger programmatically,
        // just acknowledge and close with the normal cooldown.
        setCooldown();
        hidePopup();
    });

    closeBtn.addEventListener("click", () => {
        setCooldown();
        hidePopup();
    });

    window.addEventListener("appinstalled", () => {
        hidePopup();
        clearCooldown();
        deferredPrompt = null;
        console.log("Bubble Sheet installed successfully");
    });

})();