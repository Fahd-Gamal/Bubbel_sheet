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
// register form
// Password Toggle Functionality
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

toggleConfirmPassword.addEventListener('click', function () {
    const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
    confirmPasswordInput.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Form Validation
const form = document.getElementById('registerForm');
const firstName = document.getElementById('firstName');
const lastName = document.getElementById('lastName');
const email = document.getElementById('email');
const school = document.getElementById('school');
const phone = document.getElementById('phone');
const fatherphone = document.getElementById('fatherphone');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');

const API_URL = 'https://bubblesheet.runasp.net';

form.addEventListener('submit', async function (e) {
    e.preventDefault();


    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    // Validate First Name
    if (firstName.value.trim() === '') {
        firstName.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Validate Last Name
    if (lastName.value.trim() === '') {
        lastName.closest('.form-group').classList.add('error');
        isValid = false;
    }
    // Validate school
    if (school.value.trim() === '') {
        school.closest('.form-group').classList.add('error');
        isValid = false;
    }
    // Validate gender
    const selectedGender = document.querySelector('input[name="gender"]:checked');

    if (!selectedGender) {
        document.querySelector('.gender-group').classList.add('error');
        isValid = false;
    }
    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value.trim())) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Validate Phone
    if (phone.value.trim() === '' || phone.value.trim().length < 11) {
        phone.closest('.form-group').classList.add('error');
        isValid = false;
    }
    // Validate Phone
    if (fatherphone.value.trim() === '' || fatherphone.value.trim().length < 11) {
        fatherphone.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Validate Password
    if (password.value.length < 8) {
        password.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Validate Confirm Password
    if (confirmPassword.value !== password.value) {
        confirmPassword.closest('.form-group').classList.add('error');
        isValid = false;
    }

    if (isValid) {
        const registerData = {
            name: `${firstName.value.trim()} ${lastName.value.trim()}`,
            password: password.value,
            confarimPassword: confirmPassword.value,
            email: email.value.trim(),
            phoneNumber: phone.value.trim(),
            school: document.getElementById('school').value,
            gender: selectedGender.value === 'true',
            parentphoneNumber: fatherphone.value.trim()
        };
        console.log(registerData);
        try {
            const response = await fetch(
                `${API_URL}/api/Account/Register`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(registerData)
                }
            );
            const result = await response.text();

        if (response.ok) {
            alert('تم إنشاء الحساب بنجاح');
            form.reset();
            window.location.href = 'login.html';
        } else {
            alert(
                result.message ||
                JSON.stringify(result.errors) ||
                'فشل إنشاء الحساب'
            );
        }
        } catch (error) {

            console.error(error);

            alert('خطأ في الاتصال بالسيرفر');

        }
    }
});

// Real-time validation for password match
confirmPassword.addEventListener('input', function () {
    if (this.value !== '' && this.value !== password.value) {
        this.closest('.form-group').classList.add('error');
    } else {
        this.closest('.form-group').classList.remove('error');
    }
});

password.addEventListener('input', function () {
    if (confirmPassword.value !== '' && confirmPassword.value !== this.value) {
        confirmPassword.closest('.form-group').classList.add('error');
    } else {
        confirmPassword.closest('.form-group').classList.remove('error');
    }
});
function formatState(state) {
    if (!state.id) return state.text;
    var imgUrl = $(state.element).data('image');
    if (imgUrl) {
        var $state = $(
            '<span><img src="' + imgUrl + '" class="img-flag" style="width:20px;height:15px;margin-right:5px;" /> ' + state.text + '</span>'
        );
        return $state;
    }
    return state.text;
}