async function loadDashboard() {
    // Set user display
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
        document.getElementById('user-display-name').textContent = user.username;
        document.getElementById('user-avatar').textContent = user.username.charAt(0).toUpperCase();
    }

    try {
        const data = await apiCall('/dashboard-stats');
        
        document.getElementById('stat-total').textContent = data.summary.total;
        document.getElementById('stat-permanent').textContent = data.summary.permanent;
        document.getElementById('stat-temporary').textContent = data.summary.temporary;
        document.getElementById('stat-separated').textContent = data.summary.separated;
        
        const tbody = document.getElementById('activities-table');
        tbody.innerHTML = '';
        
        if (data.activities.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No recent activities</td></tr>';
            return;
        }
        
        data.activities.forEach(act => {
            const tr = document.createElement('tr');
            const date = new Date(act.timestamp).toLocaleString();
            tr.innerHTML = `
                <td>${act.action}</td>
                <td>${act.details}</td>
                <td class="text-muted">${date}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error('Failed to load dashboard', err);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
