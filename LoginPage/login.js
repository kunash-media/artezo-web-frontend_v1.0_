const BASE_URL = "http://localhost:8085";

const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
    googleBtn.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/oauth2/authorization/google?prompt=select_account`;
    });
}

// Toast notification helper
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('i');

    toastMsg.textContent = message;

    if (isError) {
        toast.style.background = '#ef4444';
        toastIcon.className = 'fa-solid fa-circle-exclamation';
    } else {
        toast.style.background = '#10b981';
        toastIcon.className = 'fa-solid fa-circle-check';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Helper: Show field error
function showFieldError(inputElement, message) {
    const parentGroup = inputElement.closest('.input-group');
    let existingError = parentGroup.querySelector('.error-msg');
    if (existingError) existingError.remove();

    if (message) {
        const errSpan = document.createElement('div');
        errSpan.className = 'error-msg';
        errSpan.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;
        parentGroup.appendChild(errSpan);
        inputElement.style.borderColor = '#e53e3e';
    } else {
        inputElement.style.borderColor = '#e2e8f0';
    }
}

function clearFieldErrors(formElement) {
    const allGroups = formElement.querySelectorAll('.input-group');
    allGroups.forEach(group => {
        const err = group.querySelector('.error-msg');
        if (err) err.remove();
        const input = group.querySelector('input');
        if (input) input.style.borderColor = '#e2e8f0';
    });
}

// Tab switching
const loginTab = document.getElementById('loginTabBtn');
const registerTab = document.getElementById('registerTabBtn');
const loginFormContainer = document.getElementById('loginForm');
const registerFormContainer = document.getElementById('registerForm');
const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');

loginTab.addEventListener('click', () => {
    loginFormContainer.classList.remove('form-hidden');
    registerFormContainer.classList.add('form-hidden');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    clearFieldErrors(loginFormElement);
});

registerTab.addEventListener('click', () => {
    registerFormContainer.classList.remove('form-hidden');
    loginFormContainer.classList.add('form-hidden');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    clearFieldErrors(registerFormElement);
});

// Password visibility toggle for all password fields
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        const icon = btn.querySelector('i');

        if (targetInput.type === 'password') {
            targetInput.type = 'text';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            targetInput.type = 'password';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
});

// Validation Functions
function validateLogin(email, password) {
    let isValid = true;
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');

    clearFieldErrors(loginFormElement);

    if (!email.trim()) {
        showFieldError(emailInput, 'Email is required');
        isValid = false;
    } else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
        showFieldError(emailInput, 'Enter a valid email address');
        isValid = false;
    }

    if (!password) {
        showFieldError(passInput, 'Password cannot be empty');
        isValid = false;
    } else if (password.length < 4) {
        showFieldError(passInput, 'Password must be at least 4 characters');
        isValid = false;
    }

    return isValid;
}

function validateRegistration(fullname, email, password, confirmPwd) {
    let isValid = true;
    const nameInput = document.getElementById('regFullname');
    const emailInput = document.getElementById('regEmail');
    const pwdInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regConfirmPassword');

    clearFieldErrors(registerFormElement);

    if (!fullname.trim()) {
        showFieldError(nameInput, 'Full name is required');
        isValid = false;
    } else if (fullname.trim().length < 2) {
        showFieldError(nameInput, 'Name must be at least 2 characters');
        isValid = false;
    }

    if (!email.trim()) {
        showFieldError(emailInput, 'Email address is required');
        isValid = false;
    } else if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
        showFieldError(emailInput, 'Provide a valid email address');
        isValid = false;
    }

    if (!password) {
        showFieldError(pwdInput, 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError(pwdInput, 'Password must be at least 6 characters');
        isValid = false;
    }

    if (password !== confirmPwd) {
        showFieldError(confirmInput, 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

// Login Form Submission
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!validateLogin(email, password)) return;

    // Simulate API call
    showToast('Signing in...', false);

    setTimeout(() => {
        showToast(`✅ Welcome back! You're now signed in.`, false);
        // In production: window.location.href = "/dashboard";
    }, 800);
});

// Registration Form Submission with Confirm Password validation
registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullname = document.getElementById('regFullname').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPwd = document.getElementById('regConfirmPassword').value;

    if (!validateRegistration(fullname, email, password, confirmPwd)) return;

    showToast('Creating your account...', false);

    setTimeout(() => {
        showToast(`✅ Account created successfully! Please sign in.`, false);

        // Auto-switch to login form after successful registration
        setTimeout(() => {
            document.getElementById('loginEmail').value = email;
            loginTab.click();
        }, 1500);
    }, 800);
});

// Forgot Password Modal
const forgotLink = document.getElementById('forgotPasswordLink');
const forgotModal = document.getElementById('forgotModal');

forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.style.display = 'flex';
});

function closeForgotModal() {
    forgotModal.style.display = 'none';
    document.getElementById('forgotEmail').value = '';
}

function sendResetLink() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
        showToast('Please enter your email address', true);
        return;
    }
    if (!/^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/.test(email)) {
        showToast('Please enter a valid email address', true);
        return;
    }

    showToast(`📧 Password reset link sent to ${email}`, false);
    setTimeout(closeForgotModal, 2000);
}

// Close modal when clicking outside
forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) closeForgotModal();
});

// Initialize floating labels for any pre-filled inputs
document.querySelectorAll('.input-group input').forEach(input => {
    if (input.value) {
        input.setAttribute('placeholder', ' ');
    }
});
