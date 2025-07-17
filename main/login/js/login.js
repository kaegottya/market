// Login/Register Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initTabSwitching();
    initFormValidation();
    initPasswordToggles();
    initPasswordStrength();
    initFormSubmission();
    initSocialLogin();

    console.log('Login/Register page loaded successfully');
});

// Tab Switching Functionality
function initTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show corresponding form
            authForms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}-form`) {
                    form.classList.add('active');
                }
            });

            // Reset forms when switching
            resetForms();
        });
    });
}

// Form Validation
function initFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input');

        inputs.forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
    });
}

// Validate individual field
function validateField(input) {
    const fieldType = input.type;
    const fieldName = input.name;
    const fieldValue = input.value.trim();
    const isRequired = input.hasAttribute('required');
    const formType = input.closest('.auth-form').id; // Get form type (login-form or register-form)

    let isValid = true;
    let errorMessage = '';

    // Required field validation
    if (isRequired && !fieldValue) {
        isValid = false;
        errorMessage = 'This field is required';
    }

    // Email validation
    else if (fieldType === 'email' && fieldValue) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }

    // Username validation (only for register form)
    else if (fieldName === 'username' && fieldValue && formType === 'register-form') {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(fieldValue)) {
            isValid = false;
            errorMessage = 'Username must be 3-20 characters long and contain only letters, numbers, and underscores';
        }
    }

    // Password validation (different rules for login vs register)
    else if (fieldName === 'password' && fieldValue) {
        if (formType === 'register-form') {
            // Strict validation for registration
            if (fieldValue.length < 8) {
                isValid = false;
                errorMessage = 'Password must be at least 8 characters long';
            } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(fieldValue)) {
                isValid = false;
                errorMessage = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
            }
        } else if (formType === 'login-form') {
            // Simple validation for login - just check if not empty
            if (fieldValue.length === 0) {
                isValid = false;
                errorMessage = 'Password is required';
            }
            // For login, we don't validate password strength
        }
    }

    // Confirm password validation (only for register form)
    else if (fieldName === 'confirmPassword' && fieldValue && formType === 'register-form') {
        const passwordInput = document.getElementById('registerPassword');
        if (fieldValue !== passwordInput.value) {
            isValid = false;
            errorMessage = 'Passwords do not match';
        }
    }

    // Terms checkbox validation (only for register form)
    else if (fieldType === 'checkbox' && fieldName === 'agreeTerms' && formType === 'register-form') {
        if (!input.checked) {
            isValid = false;
            errorMessage = 'You must agree to the terms and conditions';
        }
    }

    // Update field appearance
    updateFieldValidation(input, isValid, errorMessage);

    return isValid;
}

// Update field validation appearance
function updateFieldValidation(input, isValid, errorMessage) {
    const feedbackElement = input.parentNode.querySelector('.invalid-feedback') ||
        input.parentNode.parentNode.querySelector('.invalid-feedback');

    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (feedbackElement) {
            feedbackElement.textContent = '';
        }
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        if (feedbackElement) {
            feedbackElement.textContent = errorMessage;
        }
    }
}

// Clear field error
function clearFieldError(input) {
    input.classList.remove('is-invalid');
    const feedbackElement = input.parentNode.querySelector('.invalid-feedback') ||
        input.parentNode.parentNode.querySelector('.invalid-feedback');
    if (feedbackElement) {
        feedbackElement.textContent = '';
    }
}

// Password Toggle Functionality
function initPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            const icon = toggle.querySelector('i');

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                targetInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Password Strength Indicator (only for register form)
function initPasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text span');

    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const strength = calculatePasswordStrength(password);

            // Update strength bar
            strengthBar.className = 'strength-fill';
            strengthBar.classList.add(strength.class);

            // Update strength text
            strengthText.textContent = strength.text;
        });
    }
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Return strength object
    if (score <= 2) {
        return { class: 'weak', text: 'Weak' };
    } else if (score <= 4) {
        return { class: 'medium', text: 'Medium' };
    } else if (score <= 5) {
        return { class: 'strong', text: 'Strong' };
    } else {
        return { class: 'very-strong', text: 'Very Strong' };
    }
}

// Form Submission
function initFormSubmission() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const inputs = form.querySelectorAll('input[required]');

    // Validate all required fields
    let isFormValid = true;
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        showError('Please fill in all required fields');
        return;
    }

    // Show loading state
    showLoading(form);

    // Get form data
    const email = formData.get('email');
    const password = formData.get('password');

    // Try to submit to backend
    submitToBackend('login', { email, password })
        .then(response => {
            hideLoading(form);
            if (response.success) {
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    // Use absolute path to avoid path resolution issues
                    window.location.href = '/MARKET/main/dashboard/html/dashboard.html';
                }, 1500);
            } else {
                showError(response.message || 'Login failed. Please check your credentials.');
            }
        })
        .catch(error => {
            hideLoading(form);
            console.error('Login error:', error);
            showError('Network error. Please check your connection and try again.');
        });
}

// Handle register form submission
function handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const inputs = form.querySelectorAll('input[required]');

    // Validate all required fields
    let isFormValid = true;
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });

    if (!isFormValid) {
        showError('Please fill in all required fields');
        return;
    }

    // Show loading state
    showLoading(form);

    // Get form data
    const email = formData.get('email');
    const username = formData.get('username');
    const password = formData.get('password');

    // Try to submit to backend
    submitToBackend('register', { email, username, password })
        .then(response => {
            hideLoading(form);
            if (response.success) {
                showSuccess('Registration successful! Please check your email to verify your account.');
                setTimeout(() => {
                    // Switch to login tab
                    document.querySelector('[data-tab="login"]').click();
                }, 2000);
            } else {
                showError(response.message || 'Registration failed. Please try again.');
            }
        })
        .catch(error => {
            hideLoading(form);
            console.error('Registration error:', error);
            showError('Network error. Please check your connection and try again.');
        });
}

// Submit to backend
async function submitToBackend(action, data) {
    const formData = new FormData();
    formData.append('action', action);

    // Add data to FormData
    for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
    }

    // Use correct path for XAMPP
    const response = await fetch('http://localhost/MARKET/main/database/users/credentials.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// Social Login
function initSocialLogin() {
    const socialButtons = document.querySelectorAll('.social-btn');

    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = button.getAttribute('data-provider');
            showError(`${provider} login is not implemented yet`);
        });
    });
}

// Loading States
function showLoading(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.btn-text');
    const spinner = submitButton.querySelector('.btn-loading');

    if (submitButton && buttonText && spinner) {
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        spinner.classList.remove('d-none');
        spinner.style.display = 'inline-block';
    }
}

function hideLoading(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    const buttonText = submitButton.querySelector('.btn-text');
    const spinner = submitButton.querySelector('.btn-loading');

    if (submitButton && buttonText && spinner) {
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        spinner.classList.add('d-none');
        spinner.style.display = 'none';
    }
}

// Notification Functions
function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Reset forms
function resetForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.reset();
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
            const feedbackElement = input.parentNode.querySelector('.invalid-feedback') ||
                input.parentNode.parentNode.querySelector('.invalid-feedback');
            if (feedbackElement) {
                feedbackElement.textContent = '';
            }
        });
    });
}