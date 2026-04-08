const urlParams = new URLSearchParams(window.location.search);
const empId = urlParams.get('id');
const empName = urlParams.get('name');

if (!empId) {
    alert('Employee ID is missing');
    window.location.href = 'employee-list.html';
}

document.getElementById('emp-name-display').textContent = empName || 'Employee';

// User display
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check Access
if (user.role === 'employee') {
    if (user.employee_id) {
        window.location.href = `employee-info.html?id=${user.employee_id}`;
    }
}

if (user.display_name) {
    document.getElementById('user-display-name').textContent = user.display_name;
    document.getElementById('user-avatar').textContent = user.display_name.charAt(0).toUpperCase();
}

function goBack() {
    window.location.href = `employee-info.html?id=${empId}`;
}

async function loadRecords() {
    try {
        const data = await apiCall(`/service-records/${empId}`);
        renderTable(data);
    } catch (err) {
        console.error('Failed to load service records', err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('records-table');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No service records found.</td></tr>';
        return;
    }
    
    data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--text-primary)">${r.position}</td>
            <td>${r.start_date}</td>
            <td>${r.end_date || '<span class="badge badge-success">Present</span>'}</td>
            <td>
                <button onclick="deleteRecord('${r._id}')" class="btn-danger btn-sm">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal
const modal = document.getElementById('record-modal');
const form = document.getElementById('record-form');

function openModal() {
    form.reset();
    document.getElementById('modal-error').classList.add('hidden');
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const body = {
        employee_id: empId,
        position: document.getElementById('position').value,
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value,
    };
    
    try {
        await apiCall('/service-records', 'POST', body);
        closeModal();
        loadRecords();
    } catch (err) {
        document.getElementById('modal-error').textContent = err.message;
        document.getElementById('modal-error').classList.remove('hidden');
    }
});

async function deleteRecord(id) {
    if (!confirm('Delete this service record?')) return;
    try {
        await apiCall(`/service-records/${id}`, 'DELETE');
        loadRecords();
    } catch (err) {
        alert(err.message);
    }
}

document.addEventListener('DOMContentLoaded', loadRecords);
