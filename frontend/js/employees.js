let employeesData = [];
let attendanceData = [];

async function loadAttendance() {
    try {
        attendanceData = await apiCall('/attendance/today');
    } catch (err) {
        console.error('Failed to load attendance', err);
    }
}

function initUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
        document.getElementById('user-display-name').textContent = user.username;
        document.getElementById('user-avatar').textContent = user.username.charAt(0).toUpperCase();
    }
}

async function loadEmployees() {
    try {
        await loadAttendance();
        employeesData = await apiCall('/employees');
        renderTable(employeesData);
    } catch (err) {
        console.error('Failed to load employees', err);
    }
}

function getStatusBadge(status) {
    const classes = {
        'Permanent': 'badge-success',
        'Temporary': 'badge-warning',
        'Separated': 'badge-danger'
    };
    return `<span class="badge ${classes[status] || 'badge-warning'}">${status}</span>`;
}

function getAttendanceBadge(empId) {
    const record = attendanceData.find(a => String(a.employee_id) === String(empId));
    if (!record) return `<button class="btn-ghost btn-sm" style="color:var(--text-muted)" onclick="openAttendanceModal('${empId}')">Mark</button>`;
    
    const classes = {
        'Present': 'badge-success',
        'Absent': 'badge-danger',
        'Late': 'badge-warning',
        'On Leave': 'badge-info'
    };
    return `<span class="badge ${classes[record.status] || 'badge-warning'}" onclick="openAttendanceModal('${empId}')" style="cursor:pointer">${record.status}</span>`;
}

function renderTable(data) {
    const tbody = document.getElementById('employees-table');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees found.</td></tr>';
        return;
    }
    
    data.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-muted" style="font-size:0.78rem; font-family: monospace;">${emp._id}</td>
            <td style="font-weight:600; color:var(--text-primary)">${emp.first_name}</td>
            <td>${emp.last_name}</td>
            <td>${getStatusBadge(emp.status)}</td>
            <td>${getAttendanceBadge(emp._id)}</td>
            <td>
                <div class="actions-cell">
                    <button class="btn-secondary btn-sm" onclick="window.location.href='employee-info.html?id=${emp._id}'">View</button>
                    <button class="btn-primary btn-sm" onclick="openModal('edit', '${emp._id}')">Edit</button>
                    <button class="btn-danger btn-sm" onclick="deleteEmployee('${emp._id}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Search
document.getElementById('search-bar').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = employeesData.filter(emp => 
        emp.first_name.toLowerCase().includes(term) ||
        emp.last_name.toLowerCase().includes(term) ||
        String(emp._id).toLowerCase().includes(term)
    );
    renderTable(filtered);
});

// Modal
const modal = document.getElementById('employee-modal');
const form = document.getElementById('employee-form');

function openModal(mode, id = null) {
    document.getElementById('modal-error').classList.add('hidden');
    
    if (mode === 'add') {
        document.getElementById('modal-title').textContent = 'Add Employee';
        document.getElementById('save-btn').textContent = 'Save Employee';
        form.reset();
        document.getElementById('emp-id').value = '';
    } else {
        document.getElementById('modal-title').textContent = 'Edit Employee';
        document.getElementById('save-btn').textContent = 'Update Employee';
        const emp = employeesData.find(e => String(e._id) === String(id));
        if (emp) {
            document.getElementById('emp-id').value = emp._id;
            document.getElementById('first-name').value = emp.first_name;
            document.getElementById('last-name').value = emp.last_name;
            document.getElementById('birthday').value = emp.birthday;
            document.getElementById('status').value = emp.status;
            document.getElementById('position').value = emp.position;
            document.getElementById('date-hired').value = emp.date_hired;
        }
    }
    modal.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('emp-id').value;
    const body = {
        first_name: document.getElementById('first-name').value,
        last_name: document.getElementById('last-name').value,
        birthday: document.getElementById('birthday').value,
        status: document.getElementById('status').value,
        position: document.getElementById('position').value,
        date_hired: document.getElementById('date-hired').value,
    };
    
    try {
        if (id) {
            await apiCall(`/employees/${id}`, 'PUT', body);
        } else {
            await apiCall('/employees', 'POST', body);
        }
        closeModal();
        loadEmployees();
    } catch (err) {
        document.getElementById('modal-error').textContent = err.message;
        document.getElementById('modal-error').classList.remove('hidden');
    }
});

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
        await apiCall(`/employees/${id}`, 'DELETE');
        loadEmployees();
    } catch (err) {
        alert(err.message);
    }
}

// Attendance Modal
const attendanceModal = document.getElementById('attendance-modal');
const attendanceForm = document.getElementById('attendance-form');

function openAttendanceModal(id) {
    document.getElementById('attendance-error').classList.add('hidden');
    const emp = employeesData.find(e => String(e._id) === String(id));
    if (emp) {
        document.getElementById('attendance-emp-id').value = emp._id;
        document.getElementById('attendance-employee-name').textContent = `${emp.first_name} ${emp.last_name}`;
        
        // Default to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('attendance-date').value = today;
        
        // Find existing status if any
        const record = attendanceData.find(a => String(a.employee_id) === String(id));
        if (record) {
            document.getElementById('attendance-status').value = record.status;
        } else {
            document.getElementById('attendance-status').value = 'Present';
        }
        
        attendanceModal.classList.remove('hidden');
    }
}

function closeAttendanceModal() {
    attendanceModal.classList.add('hidden');
}

attendanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const body = {
        employee_id: document.getElementById('attendance-emp-id').value,
        status: document.getElementById('attendance-status').value,
        date: document.getElementById('attendance-date').value
    };
    
    try {
        await apiCall('/attendance', 'POST', body);
        closeAttendanceModal();
        loadEmployees();
    } catch (err) {
        document.getElementById('attendance-error').textContent = err.message;
        document.getElementById('attendance-error').classList.remove('hidden');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    initUser();
    loadEmployees();
});
