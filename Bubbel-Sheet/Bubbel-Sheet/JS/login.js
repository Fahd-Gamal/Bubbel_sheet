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

    // إزالة أخطاء الـ Validation القديمة
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.value.trim())) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Password Validation
    if (password.value.trim() === '') {
        password.closest('.form-group').classList.add('error');
        isValid = false;
    }

    if (!isValid) return;

    try {

        const response = await fetch(`${api}/Account/Login`, {
            method: 'POST',
            credentials: 'include', // لاستقبال Refresh Token Cookie
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value.trim()
            })
        });

        console.log('Status:', response.status);
        console.log('OK:', response.ok);

        // قراءة الـ Response كنص أولاً
        const responseText = await response.text();

        console.log('Response:', responseText);

        let data = null;

        // تحويل الـ Response إلى JSON لو كان JSON
        try {
            data = responseText
                ? JSON.parse(responseText)
                : null;
        } catch {
            data = responseText;
        }


  /* =========================================================
   LOGIN SUCCESS
========================================================= */

if (response.ok) {

    const token = data?.token;
    const role = data?.role;

    console.log('Role:', role);

    if (!token) {
        console.error('Access Token not found:', data);

        alert(
            'تم تسجيل الدخول ولكن لم يتم استلام Access Token.'
        );

        return;
    }

    if (!role) {
        console.error('Role not found:', data);

        alert(
            'تم تسجيل الدخول ولكن لم يتم تحديد صلاحيات المستخدم.'
        );

        return;
    }

    // التوجيه حسب الـ Role
    if (role === 'Admin') {
        window.location.href = '../Bubbel_Sheet_Dashboard/dashboard.html';
    } else if (role === 'Student') {
        window.location.href = 'student_dashboard.html';
    } else {

        console.error('Unknown role:', role);

        alert('صلاحية المستخدم غير معروفة.');
    }

    return;
}


        /* =========================================================
           401 - INVALID EMAIL OR PASSWORD
        ========================================================= */

        if (response.status === 401) {

            // الـ Backend بيرجع:
            // {"message":"Invalid Email or Password"}

            if (
                data &&
                typeof data === 'object' &&
                data.message === 'Invalid Email or Password'
            ) {
                alert(
                    'البريد الإلكتروني أو كلمة المرور غير صحيحة'
                );

                return;
            }

            // لو الـ Backend رجع رسالة مختلفة
            if (
                data &&
                typeof data === 'object' &&
                data.message
            ) {
                alert(data.message);
                return;
            }

            // رسالة افتراضية
            alert(
                'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            );

            return;
        }


        /* =========================================================
           400 - BAD REQUEST
        ========================================================= */

        if (response.status === 400) {

            let message =
                'البيانات المدخلة غير صحيحة';

            if (
                data &&
                typeof data === 'object'
            ) {

                if (data.message) {
                    message = data.message;
                }

                else if (data.title) {
                    message = data.title;
                }

                else if (data.errors) {
                    message = Object.values(data.errors)
                        .flat()
                        .join('\n');
                }
            }

            else if (
                typeof data === 'string' &&
                data.trim()
            ) {
                message = data;
            }

            alert(message);

            return;
        }


        /* =========================================================
           500 - SERVER ERROR
        ========================================================= */

        if (response.status >= 500) {

            console.error(
                'Server Error:',
                response.status,
                data
            );

            alert(
                'حدث خطأ في السيرفر، حاول مرة أخرى لاحقًا.'
            );

            return;
        }


        /* =========================================================
           OTHER ERRORS
        ========================================================= */

        let message =
            'حدث خطأ أثناء تسجيل الدخول';

        if (
            data &&
            typeof data === 'object'
        ) {
            message =
                data.message ||
                data.title ||
                data.error ||
                message;
        }

        else if (
            typeof data === 'string' &&
            data.trim()
        ) {
            message = data;
        }

        alert(message);

    } catch (error) {

        console.error(
            'FETCH ERROR:',
            error
        );

        alert(
            'تعذر الاتصال بالسيرفر، حاول مرة أخرى.'
        );
    }
});