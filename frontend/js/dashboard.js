// Chart instances
let trendChart = null;

// Chart color palette
const CHART_COLORS = [
    'rgba(99, 102, 241, 1)',    // indigo
    'rgba(16, 185, 129, 1)',    // emerald
    'rgba(245, 158, 11, 1)',    // amber
    'rgba(239, 68, 68, 1)',     // red
    'rgba(59, 130, 246, 1)',    // blue
    'rgba(139, 92, 246, 1)',    // violet
    'rgba(236, 72, 153, 1)',    // pink
    'rgba(20, 184, 166, 1)',    // teal
];

const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c.replace(', 1)', ', 0.15)'));

// Global Chart.js defaults for dark theme
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(75, 85, 99, 0.2)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;

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
        } else {
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
        }
    } catch (err) {
        console.error('Failed to load dashboard', err);
    }

    // Load attendance trends
    await loadAttendanceTrends();
    // Load today's attendance names
    await loadTodayAttendance();
}

async function loadTodayAttendance() {
    try {
        const attendance = await apiCall('/attendance/today');
        const tbody = document.getElementById('attendance-today-table');
        tbody.innerHTML = '';
        
        if (attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No attendance marked yet for today</td></tr>';
            return;
        }

        const statusClasses = {
            'Present': 'badge-success',
            'Absent': 'badge-danger',
            'Late': 'badge-warning',
            'On Leave': 'badge-info'
        };

        attendance.forEach(att => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600">${att.first_name} ${att.last_name}</td>
                <td><span class="badge ${statusClasses[att.status] || ''}">${att.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load today\'s attendance', err);
    }
}

async function loadAttendanceTrends() {
    try {
        const trends = await apiCall('/attendance/trends');
        renderTrendChart(trends);
    } catch (err) {
        console.error('Failed to load attendance trends', err);
    }
}


function renderTrendChart(trends) {
    const ctx = document.getElementById('trendChart').getContext('2d');

    if (trendChart) trendChart.destroy();

    const labels = trends.map(t => {
        const d = new Date(t.date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Create gradient for Present
    const presentGradient = ctx.createLinearGradient(0, 0, 0, 400);
    presentGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    presentGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    const datasets = [
        {
            label: 'Present',
            data: trends.map(t => t.present),
            borderColor: '#10b981',
            backgroundColor: presentGradient,
            borderWidth: 4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.3,
            z: 10
        },
        {
            label: 'Absent',
            data: trends.map(t => t.absent),
            borderColor: '#ef4444',
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderDash: [5, 5],
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.3
        },
        {
            label: 'Late',
            data: trends.map(t => t.late),
            borderColor: '#f59e0b',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.3
        }
    ];

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { weight: '600' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    titleFont: { size: 14, weight: '700' },
                    bodyFont: { size: 13 },
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' Employee(s)';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Total Count',
                        font: { weight: '600' }
                    },
                    ticks: { 
                        stepSize: 1,
                        precision: 0
                    },
                    grid: { color: 'rgba(75, 85, 99, 0.1)' }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Date',
                        font: { weight: '600' }
                    },
                    grid: { display: false }
                }
            }
        }
    });
}


document.addEventListener('DOMContentLoaded', loadDashboard);
