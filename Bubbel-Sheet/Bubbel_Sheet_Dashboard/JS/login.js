/* ----------------------------------------------------------------- */
/* SCROLL / ENTRANCE REVEAL ANIMATIONS                                 */
/* ----------------------------------------------------------------- */
const revealEls = document.querySelectorAll('[data-anim="reveal"]');

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const delay = Array.from(revealEls).indexOf(target) % 12 * 40;
                setTimeout(() => target.classList.add('is-visible'), delay);
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.12 });

    revealEls.forEach((el) => observer.observe(el));
} else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ----------------------------------------------------------------- */
/* FLOATING PARTICLES                                                  */
/* ----------------------------------------------------------------- */
const particleContainer = document.getElementById('heroParticles');

if (particleContainer) {
    const PARTICLE_COUNT = window.innerWidth < 768 ? 10 : 22;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';

        const size = 3 + Math.random() * 6;
        const left = Math.random() * 100;
        const duration = 14 + Math.random() * 18;
        const delay = Math.random() * -duration;
        const drift = (Math.random() - 0.5) * 160;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.bottom = '-40px';
        particle.style.setProperty('--drift-x', `${drift}px`);
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;

        particleContainer.appendChild(particle);
    }
}

/* ----------------------------------------------------------------- */
/* MOUSE PARALLAX ON BLOBS & ILLUSTRATION                              */
/* ----------------------------------------------------------------- */
const heroPane = document.querySelector('.hero-pane');
const blobs = document.querySelectorAll('.blob');
const illustration = document.querySelector('.hero-illustration');
let parallaxFrame = null;

if (heroPane && window.matchMedia('(pointer: fine)').matches) {
    heroPane.addEventListener('mousemove', (e) => {
        const rect = heroPane.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        if (parallaxFrame) cancelAnimationFrame(parallaxFrame);
        parallaxFrame = requestAnimationFrame(() => {
            blobs.forEach((blob, i) => {
                const strength = (i + 1) * 14;
                blob.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
            });
            if (illustration) {
                illustration.style.transform = `rotateX(${y * -4}deg) rotateY(${x * 6}deg)`;
            }
        });
    });

    heroPane.addEventListener('mouseleave', () => {
        blobs.forEach((blob) => { blob.style.transform = ''; });
        if (illustration) illustration.style.transform = '';
    });
}
/* ----------------------------------------------------------------- */
/* PASSWORD TOGGLE                                                    */
/* ----------------------------------------------------------------- */
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    passwordInput.type =
        passwordInput.type === 'password'
            ? 'text'
            : 'password';
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

/* ----------------------------------------------------------------- */
/* LOGIN                                                              */
/* ----------------------------------------------------------------- */

const form = document.getElementById('loginForm');
const email = document.getElementById('email');
const password = document.getElementById('password');

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    let isValid = true;
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.value.trim())) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
    }
    if (password.value.trim() === '') {
        password.closest('.form-group').classList.add('error');
        isValid = false;
    }
    if (!isValid) return;
    try {
        const response = await fetch(`${api}/Account/Login`, {
            method: 'POST',
            credentials: 'include', // لاستقبال Refresh Cookie
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value.trim()
            })
        });
        const data = await response.text();
        if (response.ok) {
            accessToken = data;
            // الانتقال للصفحة الرئيسية
            window.location.href = "student_dashbord.html";
        } else {
            alert(data.message || "بيانات الدخول غير صحيحة");
        }
    } catch (error) {
        alert("حدث خطأ في الاتصال بالسيرفر");
    }
});