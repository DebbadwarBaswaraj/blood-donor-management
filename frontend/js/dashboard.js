function renderSidebar(activePage) {
    const user = JSON.parse(localStorage.getItem('user'));

    let menuItems = `
        <a href="dashboard.html" class="menu-item ${activePage === 'dashboard' ? 'active' : ''}">
            <i>📊</i> Dashboard
        </a>
    `;

    if (user.role === 'Admin') {
        menuItems += `
        <a href="donors.html" class="menu-item ${activePage === 'donors' ? 'active' : ''}">
            <i>🩸</i> Donors Directory
        </a>
        <a href="users.html" class="menu-item ${activePage === 'users' ? 'active' : ''}">
            <i>👥</i> Users Directory
        </a>
        `;
    }

    menuItems += `
        <a href="search.html" class="menu-item ${activePage === 'search' ? 'active' : ''}">
            <i>🔍</i> Search Blood
        </a>
    `;

    if (user.role !== 'Donor') {
        menuItems += `
        <a href="hospitals.html" class="menu-item ${activePage === 'hospitals' ? 'active' : ''}">
            <i>🏥</i> Nearby Hospitals
        </a>
        `;
    }

    menuItems += `
        <a href="emergency.html" class="menu-item ${activePage === 'emergency' ? 'active' : ''}">
            <i>⚠️</i> Emergency Requests
        </a>
        <a href="profile.html" class="menu-item ${activePage === 'profile' ? 'active' : ''}">
            <i>👤</i> Profile
        </a>
        <a href="#" onclick="logout()" class="menu-item">
            <i>🚪</i> Logout
        </a>
    `;

    const sidebar = `
        <div class="sidebar">
            <div class="sidebar-header">
                <h3>BDMS ${user.role}</h3>
            </div>
            <div class="sidebar-menu">
                ${menuItems}
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', sidebar);
}

function renderNavbar() {
    const user = JSON.parse(localStorage.getItem('user'));
    const navbar = `
        <nav class="navbar">
            <div class="nav-brand">
                <h2 style="color: var(--primary);">Blood Donor Management</h2>
            </div>
            <div style="display: flex; align-items: center; gap: 20px;">
                <div id="notification-bell" style="position: relative; cursor: pointer;" onclick="toggleNotifications()">
                    <span style="font-size: 1.2rem;">🔔</span>
                    <span id="notif-count" class="badge badge-danger" style="position: absolute; top: -8px; right: -8px; font-size: 0.6rem; padding: 2px 5px; display: none;">0</span>
                    <div id="notif-dropdown" class="card" style="position: absolute; top: 30px; right: 0; width: 300px; display: none; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-height: 400px; overflow-y: auto;">
                        <div class="card-header" style="padding: 10px;"><h4>Recent Alerts</h4></div>
                        <div id="notif-list" style="padding: 0;">
                            <div style="padding: 15px; text-align: center; color: var(--text-muted);">No new alerts</div>
                        </div>
                    </div>
                </div>
                <div class="user-profile">
                    <div style="text-align: right">
                        <div style="font-weight: 700">${user.username}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted)">${user.role}</div>
                    </div>
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                        ${user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </nav>
    `;
    document.querySelector('.main-content').insertAdjacentHTML('afterbegin', navbar);
    fetchNotifications();
}

async function fetchNotifications() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'Donor') return;

    try {
        const response = await fetch(`http://localhost:5001/api/notifications/${user.id}`);
        const alerts = await response.json();
        const countEl = document.getElementById('notif-count');
        const listEl = document.getElementById('notif-list');

        if (alerts.length > 0) {
            countEl.innerText = alerts.length;
            countEl.style.display = 'block';
            listEl.innerHTML = alerts.map(alert => `
                <div style="padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 0.85rem;">
                    <strong>Emergency!</strong> ${alert.blood_group_needed} needed at ${alert.hospital_name} in ${alert.city}.
                    <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 4px;">${new Date(alert.created_at).toLocaleDateString()}</div>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Failed to fetch notifications:', err);
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notif-dropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

/**
 * Calculate donor eligibility based on gender rules.
 * Male  → 60 days wait after last donation
 * Female → 90 days wait after last donation
 */
function calculateEligibility(lastDonationDate, nextAvailableDate, gender) {
    if (!lastDonationDate) return { eligible: true, daysLeft: 0, waitDays: gender === 'Female' ? 90 : 60 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const waitDays = (gender || '').toLowerCase() === 'female' ? 90 : 60;

    let nextDate;
    if (nextAvailableDate && nextAvailableDate !== 'Available Now') {
        nextDate = new Date(nextAvailableDate);
    } else {
        // Compute from last donation + gender wait
        nextDate = new Date(lastDonationDate);
        nextDate.setDate(nextDate.getDate() + waitDays);
    }
    nextDate.setHours(0, 0, 0, 0);

    if (today >= nextDate) {
        return { eligible: true, daysLeft: 0, waitDays };
    } else {
        const diffTime = nextDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { eligible: false, daysLeft: diffDays, waitDays, nextDate };
    }
}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function openInMaps(address, city, state) {
    if (!address && !city) {
        alert('No location information available for this donor.');
        return;
    }
    const query = encodeURIComponent(`${address || ''} ${city || ''} ${state || ''}`.trim());
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
}
