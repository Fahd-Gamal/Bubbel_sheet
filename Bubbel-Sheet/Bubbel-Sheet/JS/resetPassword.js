let currentStep = 1;
const totalSteps = 4;

// Step Navigation
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));

    // Show current step
    switch (step) {
        case 1:
            document.getElementById('emailStep').classList.add('active');
            break;
        case 2:
            document.getElementById('otpStep').classList.add('active');
            break;
        case 3:
            document.getElementById('passwordStep').classList.add('active');
            break;
        case 4:
            document.getElementById('successStep').classList.add('active');
            startCountdown();
            break;
    }

    // Update step indicators
    for (let i = 1; i <= totalSteps; i++) {
        const stepEl = document.getElementById(`step${i}`);
        const lineEl = document.getElementById(`line${i}`);

        if (i < step) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
            if (lineEl) lineEl.classList.add('completed');
        } else if (i === step) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
            if (lineEl) lineEl.classList.remove('completed');
        }
    }

    currentStep = step;
}

// Step 1: Email Form
const emailForm = document.getElementById('emailForm');
const resetEmail = document.getElementById('resetEmail');

emailForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Clear errors
    resetEmail.closest('.form-group').classList.remove('error');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.value.trim())) {
        resetEmail.closest('.form-group').classList.add('error');
        return;
    }

    // Show OTP message and go to step 2
    document.getElementById('otpSentMessage').style.display = 'block';
    goToStep(2);

    // Focus first OTP input
    setTimeout(() => {
        document.querySelector('.otp-input').focus();
    }, 100);
});

// Step 2: OTP Handling
const otpInputs = document.querySelectorAll('.otp-input');
const otpForm = document.getElementById('otpForm');

// Auto-focus next input
otpInputs.forEach((input, index) => {
    input.addEventListener('input', function (e) {
        const value = e.target.value;

        // Only allow numbers
        e.target.value = value.replace(/[^0-9]/g, '');

        // Move to next input
        if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    // Handle backspace
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    // Handle paste
    input.addEventListener('paste', function (e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');

        for (let i = 0; i < pastedData.length && index + i < otpInputs.length; i++) {
            otpInputs[index + i].value = pastedData[i];
        }

        const nextIndex = Math.min(index + pastedData.length, otpInputs.length - 1);
        otpInputs[nextIndex].focus();
    });
});

otpForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get OTP value
    const otpValue = Array.from(otpInputs).map(input => input.value).join('');

    // Hide previous messages
    document.getElementById('otpErrorMessage').style.display = 'none';

    // Validate OTP (demo: correct code is 123456)
    if (otpValue === '123456') {
        goToStep(3);
    } else {
        document.getElementById('otpErrorMessage').style.display = 'block';
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    }
});

// Step 3: Password Toggle
const toggleNewPassword = document.getElementById('toggleNewPassword');
const newPassword = document.getElementById('newPassword');
const toggleConfirmNewPassword = document.getElementById('toggleConfirmNewPassword');
const confirmNewPassword = document.getElementById('confirmNewPassword');

toggleNewPassword.addEventListener('click', function () {
    const type = newPassword.type === 'password' ? 'text' : 'password';
    newPassword.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

toggleConfirmNewPassword.addEventListener('click', function () {
    const type = confirmNewPassword.type === 'password' ? 'text' : 'password';
    confirmNewPassword.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Password Form Validation
const passwordForm = document.getElementById('passwordForm');

passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let isValid = true;

    // Clear errors
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    // Validate password length
    if (newPassword.value.length < 6) {
        newPassword.closest('.form-group').classList.add('error');
        isValid = false;
    }

    // Validate passwords match
    if (confirmNewPassword.value !== newPassword.value) {
        confirmNewPassword.closest('.form-group').classList.add('error');
        isValid = false;
    }

    if (isValid) {
        goToStep(4);
    }
});

// Real-time password match validation
confirmNewPassword.addEventListener('input', function () {
    if (this.value !== '' && this.value !== newPassword.value) {
        this.closest('.form-group').classList.add('error');
    } else {
        this.closest('.form-group').classList.remove('error');
    }
});

// Step 4: Countdown and Redirect
function startCountdown() {
    let seconds = 3;
    const countdownEl = document.getElementById('countdown');

    const interval = setInterval(() => {
        seconds--;
        countdownEl.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            alert('جارٍ إعادة التوجيه إلى صفحة تسجيل الدخول....');
            window.location.href = 'login.html';
        }
    }, 1000);
}

// Back to Login links
document.querySelectorAll('a[href="login"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        alert('جارٍ إعادة التوجيه إلى صفحة تسجيل الدخول....');
    });
});