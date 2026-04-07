// Chart instances
let trendChart = null;

// Chart color palette
const getThemeColor = () => localStorage.getItem('theme-accent-color') || '#bc13fe';
const themeHex = getThemeColor();
const themeRgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(themeHex);
const themeRgbStr = themeRgb ? `${parseInt(themeRgb[1], 16)}, ${parseInt(themeRgb[2], 16)}, ${parseInt(themeRgb[3], 16)}` : '188, 19, 254';

const CHART_COLORS = [
    `rgba(${themeRgbStr}, 1)`,    // theme accent
    'rgba(0, 242, 255, 1)',     // cyan/blue
    'rgba(255, 0, 212, 1)',     // pink
    'rgba(255, 204, 0, 1)',     // yellow
    'rgba(77, 94, 240, 1)',     // indigo
    'rgba(255, 0, 85, 1)',      // red-pink
];

const CHART_COLORS_ALPHA = CHART_COLORS.map(c => c.replace(', 1)', ', 0.15)'));

// Global Chart.js defaults for dark theme
Chart.defaults.color = '#d1d5db';
Chart.defaults.borderColor = `rgba(${themeRgbStr}, 0.1)`;
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
    
    // Create gradients
    const presentGradient = ctx.createLinearGradient(0, 0, 0, 400);
    presentGradient.addColorStop(0, 'rgba(0, 242, 255, 0.2)');
    presentGradient.addColorStop(1, 'rgba(0, 242, 255, 0)');

    const datasets = [
        {
            label: 'Present',
            data: trends.map(t => t.present),
            borderColor: '#00f2ff',
            backgroundColor: presentGradient,
            borderWidth: 4,
            pointBackgroundColor: '#00f2ff',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.4,
            z: 10
        },
        {
            label: 'Absent',
            data: trends.map(t => t.absent),
            borderColor: '#ff0055',
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderDash: [5, 5],
            pointBackgroundColor: '#ff0055',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.4
        },
        {
            label: 'Late',
            data: trends.map(t => t.late),
            borderColor: '#bc13fe',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointBackgroundColor: '#bc13fe',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 7,
            fill: false,
            tension: 0.4
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
