const API_URL = 'http://127.0.0.1:5000/api';

async function apiCall(endpoint, method = 'GET', body = null) {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Add role and ID to URL for GET, or to body for others
    let finalEndpoint = endpoint;
    if (user) {
        if (method === 'GET' || method === 'DELETE') {
            const separator = endpoint.includes('?') ? '&' : '?';
            finalEndpoint = `${endpoint}${separator}role=${user.role}&requesting_id=${user.employee_id || ''}`;
        } else if (body) {
            body.user_role = user.role;
            body.requesting_employee_id = user.employee_id;
        }
    }

    const headers = {
        'Content-Type': 'application/json'
    };

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${finalEndpoint}`, config);
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            if (!response.ok) {
                throw new Error(`Server error (${response.status}). Is the backend or database running?`);
            }
            throw new Error("Invalid response format from server.");
        }
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Redirect to login if user is not authenticated
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Execute checkAuth immediately unless it's the login page
if (!window.location.pathname.includes('login.html')) {
    checkAuth();
}
