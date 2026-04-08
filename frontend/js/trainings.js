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

async function loadTrainings() {
    try {
        const data = await apiCall(`/trainings/${empId}`);
        renderTable(data);
    } catch (err) {
        console.error('Failed to load trainings', err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('trainings-table');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No trainings found.</td></tr>';
        return;
    }
    
    data.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600; color:var(--text-primary)">${t.title}</td>
            <td>${t.date}</td>
            <td>${t.institution}</td>
            <td>
                <button onclick="deleteTraining('${t._id}')" class="btn-danger btn-sm">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal
const modal = document.getElementById('training-modal');
const form = document.getElementById('training-form');

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
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        institution: document.getElementById('institution').value,
    };
    
    try {
        await apiCall('/trainings', 'POST', body);
        closeModal();
        loadTrainings();
    } catch (err) {
        document.getElementById('modal-error').textContent = err.message;
        document.getElementById('modal-error').classList.remove('hidden');
    }
});

async function deleteTraining(id) {
    if (!confirm('Delete this training?')) return;
    try {
        await apiCall(`/trainings/${id}`, 'DELETE');
        loadTrainings();
    } catch (err) {
        alert(err.message);
    }
}

document.addEventListener('DOMContentLoaded', loadTrainings);
