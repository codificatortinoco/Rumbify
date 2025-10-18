import { navigateTo, makeRequest } from "../app.js";
import { authManager } from "../auth.js";

export default function renderAdminDashboard(data = {}) {
  if (!authManager.isUserAdmin()) {
    if (authManager.isUserMember()) {
      window.location.href = '/app2/screen1';
    } else {
      window.location.href = '/app2/admin-login';
    }
    return;
  }

  // Protección adicional: asegurar que el admin nunca pueda acceder a app1
  if (window.location.href.includes('/app1')) {
    console.log('Admin detected on app1, redirecting to admin-dashboard');
    window.location.href = '/app2/admin-dashboard';
    return;
  }

  let adminUser = data.user || authManager.getCurrentUser();
  
  const email = adminUser?.email || 'admin@rumbify.com';
  const name = adminUser?.name || 'Administrator';
  const phone = adminUser?.phone || 'N/A';
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="admin-dashboard-screen">
      <div class="admin-dashboard-content">
        <!-- Header -->
        <div class="admin-header">
          <div class="admin-logo">
            <img src="assets/Llogowhite.png" alt="Rumbify Admin" class="admin-logo-img" />
          </div>
          <div class="admin-user-info">
            <h2 class="admin-welcome">Welcome, ${name}</h2>
            <p class="admin-email">${email}</p>
            <p class="admin-phone">${phone}</p>
          </div>
          <div class="admin-header-actions">
            <button class="admin-profile-btn" id="profileBtn">
              <img src="assets/person.svg" alt="Profile" class="profile-icon" />
            </button>
            <button class="admin-logout-btn" onclick="handleLogout()">Logout</button>
          </div>
        </div>

        <!-- Admin Dashboard Content -->
        <div class="admin-dashboard-body">
          <h1 class="admin-dashboard-title">Admin Dashboard</h1>
          
          <div class="admin-stats-grid">
            <div class="stat-card">
              <h3>Total Events</h3>
              <p class="stat-number" id="totalEvents">0</p>
            </div>
            <div class="stat-card">
              <h3>Active Users</h3>
              <p class="stat-number" id="activeUsers">0</p>
            </div>
            <div class="stat-card">
              <h3>Pending Approvals</h3>
              <p class="stat-number" id="pendingApprovals">0</p>
            </div>
            <div class="stat-card">
              <h3>Revenue</h3>
              <p class="stat-number" id="revenue">$0</p>
            </div>
          </div>

          <div class="admin-actions">
            <button class="admin-action-btn" onclick="handleManageEvents()">
              Manage Events
            </button>
            <button class="admin-action-btn" onclick="handleManageUsers()">
              Manage Users
            </button>
            <button class="admin-action-btn" onclick="handleAnalytics()">
              View Analytics
            </button>
            <button class="admin-action-btn" onclick="handleSettings()">
              Settings
            </button>
          </div>
        </div>
        <nav class="bottom-nav">
          <div class="nav-item active" id="nav-parties" data-nav="parties">
            <span class="nav-icon icon-party" aria-hidden="true"></span>
            <span class="nav-label">My Parties</span>
          </div>
          <div class="nav-item" id="nav-new" data-nav="new">
            <span class="nav-icon icon-plus" aria-hidden="true"></span>
            <span class="nav-label">New Party</span>
          </div>
          <div class="nav-item" id="nav-profile" data-nav="profile">
            <span class="nav-icon icon-user" aria-hidden="true"></span>
            <span class="nav-label">Profile</span>
          </div>
        </nav>
      </div>
    </div>
  `;

  // Make functions globally available for onclick handlers
  window.handleLogout = handleLogout;
  window.handleManageEvents = handleManageEvents;
  window.handleManageUsers = handleManageUsers;
  window.handleAnalytics = handleAnalytics;
  window.handleSettings = handleSettings;

  // Load admin statistics
  loadAdminStatistics();

  function handleLogout() {
    authManager.clearAuth();
    navigateTo("/admin-login");
  }

  function handleManageEvents() {
    const selectedPartyId = localStorage.getItem('selectedPartyId');
    navigateTo("/manage-party", { partyId: selectedPartyId || null });
  }

  function handleManageUsers() {
    console.log('Manage Users clicked');
  }

  function handleAnalytics() {
    console.log('Analytics clicked');
  }

  function handleSettings() {
    console.log('Settings clicked');
  }
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      navigateTo('/edit-profile');
    });
  }
  
  const bottomNav = document.querySelector('.bottom-nav');
  const navItems = bottomNav ? Array.from(bottomNav.querySelectorAll('.nav-item')) : [];
  
  navItems.forEach((item) => {
    item.style.touchAction = 'manipulation';
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const target = item.dataset.nav;
      if (target === 'parties') {
        navigateTo('/my-parties');
      } else if (target === 'new') {
        navigateTo('/create-party');
      } else if (target === 'profile') {
        navigateTo('/edit-profile');
      }
    });
  });
}

async function loadAdminStatistics() {
  try {
    // Get current admin user email for authentication
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminEmail = adminUser.email;
    
    console.log('Admin user data:', adminUser);
    console.log('Admin email:', adminEmail);
    
    if (!adminEmail) {
      console.warn('No admin email found for authentication, showing default values');
      // Show default values
      document.getElementById('totalEvents').textContent = '0';
      document.getElementById('activeUsers').textContent = '0';
      document.getElementById('pendingApprovals').textContent = '0';
      document.getElementById('revenue').textContent = '$0';
      return;
    }
    
    console.log('Attempting to fetch admin statistics...');
    const response = await makeRequest('/admin/statistics', 'POST', { email: adminEmail });
    console.log('API response:', response);
    
    if (response.success && response.statistics) {
      const stats = response.statistics;
      
      // Update the statistics display
      document.getElementById('totalEvents').textContent = stats.totalEvents || 0;
      document.getElementById('activeUsers').textContent = stats.activeUsers || 0;
      document.getElementById('pendingApprovals').textContent = stats.pendingApprovals || 0;
      document.getElementById('revenue').textContent = stats.revenue || '$0';
      
      console.log('Admin statistics loaded successfully:', stats);
    } else {
      console.warn('Failed to load admin statistics:', response.message || 'Unknown error');
      // Show default values instead of error
      document.getElementById('totalEvents').textContent = '0';
      document.getElementById('activeUsers').textContent = '0';
      document.getElementById('pendingApprovals').textContent = '0';
      document.getElementById('revenue').textContent = '$0';
    }
  } catch (error) {
    console.error('Error loading admin statistics:', error);
    // Show default values instead of error
    document.getElementById('totalEvents').textContent = '0';
    document.getElementById('activeUsers').textContent = '0';
    document.getElementById('pendingApprovals').textContent = '0';
    document.getElementById('revenue').textContent = '$0';
  }
}
