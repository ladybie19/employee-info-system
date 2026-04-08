const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-btn');
const toggleText = document.getElementById('toggle-text');
const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');

const positionSelect = document.getElementById('position');
const passwordGroup = document.getElementById('password-group');
const passwordInput = document.getElementById('password');

let isLogin = true;

positionSelect.addEventListener('change', () => {
    if (positionSelect.value === 'employee') {
        passwordGroup.classList.add('hidden');
        passwordInput.removeAttribute('required');
    } else {
        passwordGroup.classList.remove('hidden');
        passwordInput.setAttribute('required', '');
    }
});

toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.textContent = isLogin ? 'Welcome Back' : 'Create Account';
    formSubtitle.textContent = isLogin ? 'Sign in to your account' : 'Register for a new account';
    submitBtn.textContent = isLogin ? 'Sign In' : 'Create Account';
    toggleText.textContent = isLogin ? "Don't have an account? " : "Already have an account? ";
    toggleBtn.textContent = isLogin ? 'Create one' : 'Sign in';
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorMsg.classList.add('hidden');
    successMsg.classList.add('hidden');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const position = document.getElementById('position').value;
    
    try {
        const data = await apiCall(isLogin ? '/login' : '/register', 'POST', { username, password });
        
        if (isLogin) {
            // Check if selected position matches user role
            if (data.user.role !== position) {
                throw new Error(`Invalid position selected for this account. This account is registered as ${data.user.role}.`);
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            
            if (data.user.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                // Employee redirect to their profile/attendance
                if (data.user.employee_id) {
                    window.location.href = `employee-info.html?id=${data.user.employee_id}`;
                } else {
                    throw new Error('Employee record not found for this account.');
                }
            }
        } else {
            successMsg.textContent = 'Registration successful! You can now sign in.';
            successMsg.classList.remove('hidden');
            isLogin = true;
            formTitle.textContent = 'Welcome Back';
            formSubtitle.textContent = 'Sign in to your account';
            submitBtn.textContent = 'Sign In';
            toggleText.textContent = "Don't have an account? ";
            toggleBtn.textContent = 'Create one';
        }
    } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.classList.remove('hidden');
    }
});
