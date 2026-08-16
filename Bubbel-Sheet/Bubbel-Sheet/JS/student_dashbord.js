/* PARTICLES */
    (function () {
        const c = document.getElementById('ptc');
        const cls = ['transparent'];
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'pt';
            const sz = Math.random() * 5 + 2;
            p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}vw;bottom:-8px;background:${cls[Math.floor(Math.random() * cls.length)]};animation-duration:${Math.random() * 22 + 12}s;animation-delay:${Math.random() * 20}s;`;
            c.appendChild(p);
        }
    })();

    /* SCROLL REVEAL */
    (function () {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('vis'); obs.unobserve(e.target); }
            });
        }, { threshold: .1, rootMargin: '0px 0px -30px 0px' });
        document.querySelectorAll('[data-r]').forEach(el => obs.observe(el));
        // Also mark child elements of achievement grid
        document.querySelectorAll('[data-d]').forEach(el => {
            el.setAttribute('data-r', 'up');
            obs.observe(el);
        });
    })();

    /* COUNTERS */
    (function () {
        function easeOut(t) { return 1 - Math.pow(1 - t, 4); }
        function run(el) {
            const target = +el.dataset.count;
            const sfx = el.dataset.sfx || '';
            const dur = 2000; const t0 = performance.now();
            (function tick(now) {
                const prog = Math.min((now - t0) / dur, 1);
                el.textContent = Math.round(easeOut(prog) * target).toLocaleString('ar-EG') + sfx;
                if (prog < 1) requestAnimationFrame(tick);
            })(t0);
        }
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
        }, { threshold: .4 });
        document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
    })();

    /* PROGRESS BARS animate on scroll */
    (function () {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    const fills = e.target.querySelectorAll('.prog-fill');
                    fills.forEach(f => { const w = f.style.width; f.style.width = '0'; setTimeout(() => { f.style.width = w; }, 100); });
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: .3 });
        document.querySelectorAll('.gc').forEach(el => obs.observe(el));
    })();
/* =========================
AUTH INITIALIZATION
========================= */

async function initDashboard() {

const refreshed = await refreshToken();

if (!refreshed) {
    window.location.href = "login.html";
    return;
}

getUserData();

}

/* =========================
GET USER DATA
========================= */

async function getUserData() {

try {


    let response = await fetch(
        `${api}/Dashboard/get-data`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );



    // Token expired
    if (response.status === 401) {


        const refreshed = await refreshToken();

        if (!refreshed) {

            window.location.href = "login.html";
            return;
        }

        // Retry request

        response = await fetch(
            `${api}/Dashboard/get-data`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

    }

    if (!response.ok) {
        throw new Error("Failed to fetch user data");
    }
    const data = await response.json();

    document.getElementById("studentName").textContent = data.name ?? "";

    document.getElementById("studentSchool").textContent = data.school ?? "";

    document.getElementById("studentPhone").textContent = data.phoneNumber ?? "";

    document.getElementById("parentPhone").textContent = data.parentphoneNumber ?? "";

    document.getElementById("studentEmail").textContent = data.email ?? "";

    document.getElementById("studentGender").textContent = data.gender ?? "";
    document.getElementById("welcomeName").textContent = data.name;
    document.getElementById("mobilewelcomeName").textContent = data.name;
    document.getElementById("studentName").textContent =
    data.name ?? "";
    document.getElementById("navbarStudentName").textContent =data.name ?? "";
    document.getElementById("studentBalance").textContent =data.balance ?? 0;
    document.getElementById("studentBalanceMobile").textContent = data.balance ?? 0;
/* =========================
    SAVE NAVBAR DATA
========================= */
        localStorage.setItem(
            "studentName",
            data.name ?? ""
        );
        localStorage.setItem(
            "studentBalance",
            String(data.balance ?? 0)
        );

        localStorage.setItem(
            "blanced",
            String(data.balance ?? 0)
        );
// Last Login
const lastLogin = new Date(data.lastLogin);

document.querySelector(".dot-live")
.nextElementSibling.textContent =
`اخر تسجيل دخول ${lastLogin.toLocaleDateString('ar-EG')} ${lastLogin.toLocaleTimeString('ar-EG')}`;
    const firstLetter = data.name.charAt(0);
    document.querySelector(".student-avatar-small").textContent = firstLetter;

    document.querySelector(".welcome-avatar").textContent = firstLetter;



} catch (error) {

    console.error("Error:", error);

}

}
/* =========================
GO TO ACADEMIC YEARS
========================= */

function goToAcademicYears(level) {
window.location.href = `years.html?level=${level}`;
}
/* =========================
START DASHBOARD
========================= */
document.addEventListener("DOMContentLoaded", () => {
initDashboard();
});