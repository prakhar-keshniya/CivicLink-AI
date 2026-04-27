// Authentication Check
if (!localStorage.getItem('civiclink_token')) {
    window.location.href = 'login.html';
}

// Global variables to store fetched data
let urgentNeeds = [];
let smartMatches = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch data from backend
    try {
        const token = localStorage.getItem('civiclink_token');
        const response = await fetch('http://localhost:3000/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        urgentNeeds = data.needs;
        smartMatches = data.matches;

        // Render KPIs if elements exist
        if (document.getElementById('kpi-critical')) document.getElementById('kpi-critical').textContent = data.kpis.criticalNeeds;
        if (document.getElementById('kpi-signals')) document.getElementById('kpi-signals').textContent = data.kpis.activeSignals.toLocaleString();
        if (document.getElementById('kpi-volunteers')) document.getElementById('kpi-volunteers').textContent = data.kpis.readyVolunteers;
        if (document.getElementById('kpi-matchrate')) document.getElementById('kpi-matchrate').textContent = data.kpis.matchRate;

        // Render data if the elements exist
        if (document.getElementById('needsList')) renderNeeds(urgentNeeds);
        if (document.getElementById('matchList')) renderMatches(smartMatches);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // If unauthorized, token might be expired
        if (error.message.includes('Failed to fetch') || response?.status === 401) {
            localStorage.removeItem('civiclink_token');
            window.location.href = 'login.html';
        }
    }

    // Setup Profile Menu
    setupProfileMenu();
});

// Expose functions to global scope for HTML onclick attributes
window.showSettingsModal = showSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.saveSettings = saveSettings;
window.handleLogout = handleLogout;
window.switchAccount = switchAccount;

let profileMenuInitialized = false;

function setupProfileMenu() {
    const user = JSON.parse(localStorage.getItem('civiclink_user') || '{}');
    const profileBtn = document.getElementById('userProfileBtn');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileBtn && user.name) {
        // 1. Update the data (Initials and Header)
        const initials = user.name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
        profileBtn.textContent = initials;
        
        if (document.getElementById('dropdownUserName')) document.getElementById('dropdownUserName').textContent = user.name;
        if (document.getElementById('dropdownUserEmail')) document.getElementById('dropdownUserEmail').textContent = user.email;

        // 2. Attach listeners ONLY ONCE
        if (!profileMenuInitialized) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });

            dropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            
            profileMenuInitialized = true;
        }
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('civiclink_token');
        localStorage.removeItem('civiclink_user');
        window.location.href = 'login.html';
    }
}

function switchAccount() {
    // Similar to logout but specifically for switching
    localStorage.removeItem('civiclink_token');
    localStorage.removeItem('civiclink_user');
    window.location.href = 'login.html';
}

function showSettingsModal() {
    const user = JSON.parse(localStorage.getItem('civiclink_user') || '{}');
    
    // Create modal if it doesn't exist
    if (!document.getElementById('settingsModal')) {
        const modalHtml = `
            <div class="modal-overlay" id="settingsModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2 style="font-size: 1.2rem;"><i class="fa-solid fa-gear"></i> Account Settings</h2>
                        <button class="icon-btn" onclick="closeSettingsModal()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="settingsName" class="form-input" value="${user.name || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email Address</label>
                            <input type="email" id="settingsEmail" class="form-input" value="${user.email || ''}">
                        </div>
                        
                        <div style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 20px;">
                            <h4 style="font-size: 0.9rem; margin-bottom: 15px; color: var(--text-primary);">Preferences</h4>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">Push Notifications</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">Auto-Match Engine</span>
                                <label class="switch">
                                    <input type="checkbox" checked>
                                    <span class="slider round"></span>
                                </label>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <span style="font-size: 0.85rem; color: var(--text-secondary);">Dark Mode</span>
                                <label class="switch">
                                    <input type="checkbox" checked disabled>
                                    <span class="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <div id="settingsMessage" style="font-size: 0.85rem; margin-top: 10px; display: none;"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeSettingsModal()">Cancel</button>
                        <button class="primary-btn" onclick="saveSettings()">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } else {
        document.getElementById('settingsName').value = user.name || '';
        document.getElementById('settingsEmail').value = user.email || '';
    }
    
    document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

async function saveSettings() {
    const name = document.getElementById('settingsName').value;
    const email = document.getElementById('settingsEmail').value;
    const msg = document.getElementById('settingsMessage');
    const token = localStorage.getItem('civiclink_token');

    try {
        const res = await fetch('http://localhost:3000/api/user/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, email })
        });

        const data = await res.json();

        if (res.ok) {
            msg.style.color = 'var(--success)';
            msg.textContent = 'Settings updated successfully!';
            msg.style.display = 'block';
            
            // Update local storage
            localStorage.setItem('civiclink_user', JSON.stringify(data.user));
            
            // Refresh UI
            setupProfileMenu();
            
            setTimeout(() => closeSettingsModal(), 1500);
        } else {
            throw new Error(data.error || 'Failed to update settings');
        }
    } catch (error) {
        msg.style.color = 'var(--danger)';
        msg.textContent = error.message;
        msg.style.display = 'block';
    }
}

function renderNeeds(needsArray) {
    const list = document.getElementById('needsList');
    if (!list) return;
    list.innerHTML = '';

    if (needsArray.length === 0) {
        list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-circle-check" style="font-size:2rem; margin-bottom:8px; color: var(--success);"></i><br>No active needs. Everything is under control.</div>';
        return;
    }
    needsArray.forEach(need => {
        const item = document.createElement('div');
        item.className = `need-item ${need.urgency}`;
        
        let tagsHtml = need.tags.map(tag => 
            `<span class="tag ${need.urgency === 'urgent' ? 'urgent-tag' : 'skill-tag'}">${tag}</span>`
        ).join('');

        item.innerHTML = `
            <div class="need-content">
                <div class="need-title">
                    ${need.title}
                    <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted)">${need.id}</span>
                </div>
                <div class="need-meta">
                    <span><i class="fa-regular fa-clock"></i> ${need.time}</span>
                    <span><i class="fa-solid fa-location-dot"></i> ${need.location}</span>
                </div>
                <div class="need-tags">
                    ${tagsHtml}
                </div>
            </div>
            <div class="need-action">
                <button class="btn-secondary" onclick="window.location.href='needs.html'">Review</button>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function renderMatches(matchesArray) {
    const list = document.getElementById('matchList');
    if (!list) return;
    list.innerHTML = '';

    if (matchesArray.length === 0) {
        list.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-wand-magic-sparkles" style="font-size:2rem; margin-bottom:8px; color: var(--primary);"></i><br>No pending matches.<br><a href="matches.html" style="color:var(--primary);">Generate matches &rarr;</a></div>';
        return;
    }
    matchesArray.forEach(match => {
        const card = document.createElement('div');
        card.className = 'match-card';
        
        card.innerHTML = `
            <div class="match-score"><i class="fa-solid fa-bolt"></i> ${match.score}</div>
            <div class="match-entities">
                <div class="volunteer-avatar" style="background-color: ${match.color}20; color: ${match.color}; border: 1px solid ${match.color}40;">
                    ${match.initials}
                </div>
                <div class="match-task">
                    <div class="match-task-name">${match.volunteerName}</div>
                    <div class="match-task-loc"><i class="fa-solid fa-arrow-right-arrow-left"></i> ${match.task}</div>
                </div>
            </div>
            <div class="match-connection" style="margin-bottom: 12px;">
                <i class="fa-solid fa-location-crosshairs" style="margin-right: 4px;"></i> ${match.location}
            </div>
            <button class="match-action" onclick="window.location.href='matches.html'">Dispatch Volunteer</button>
        `;
        
        list.appendChild(card);
    });
}
