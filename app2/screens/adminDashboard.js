import { navigateTo } from "../app.js";

export default function renderAdminDashboard(data = {}) {
  // Get admin user data from localStorage or passed data
  let adminUser = data.user;
  if (!adminUser) {
    const storedUser = localStorage.getItem('adminUser');
    adminUser = storedUser ? JSON.parse(storedUser) : null;
  }
  
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
          <button class="admin-logout-btn" onclick="handleLogout()">Logout</button>
        </div>

        <!-- Admin Dashboard Content -->
        <div class="admin-dashboard-body">
          <h1 class="admin-dashboard-title">Admin Dashboard</h1>
          
          <div class="admin-stats-grid">
            <div class="stat-card">
              <h3>Total Events</h3>
              <p class="stat-number">24</p>
            </div>
            <div class="stat-card">
              <h3>Active Users</h3>
              <p class="stat-number">1,247</p>
            </div>
            <div class="stat-card">
              <h3>Pending Approvals</h3>
              <p class="stat-number">8</p>
            </div>
            <div class="stat-card">
              <h3>Revenue</h3>
              <p class="stat-number">$12,450</p>
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
      </div>
    </div>
  `;

  // Make functions globally available for onclick handlers
  window.handleLogout = handleLogout;
  window.handleManageEvents = handleManageEvents;
  window.handleManageUsers = handleManageUsers;
  window.handleAnalytics = handleAnalytics;
  window.handleSettings = handleSettings;

  function handleLogout() {
    console.log('Admin logout');
    // Clear admin data from localStorage
    localStorage.removeItem('adminUser');
    navigateTo("/admin-login");
  }

  function handleManageEvents() {
    console.log('Manage Events clicked');
    navigateTo("/create-party");
  }

  function handleManageUsers() {
    console.log('Manage Users clicked');
    // TODO: Navigate to users management
  }

  function handleAnalytics() {
    console.log('Analytics clicked');
    // TODO: Navigate to analytics
  }

  function handleSettings() {
    console.log('Settings clicked');
    // TODO: Navigate to settings
  }
}
