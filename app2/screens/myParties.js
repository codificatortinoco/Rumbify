import { navigateTo, makeRequest } from "../app.js";
import { authManager } from "../auth.js";

export default function renderMyParties(data = {}) {
  if (!authManager.isUserAdmin()) {
    if (authManager.isUserMember()) {
      window.location.href = '/app2/screen1';
    } else {
      window.location.href = '/app2/admin-login';
    }
    return;
  }

  // Protection: ensure admin never accesses app1
  if (window.location.href.includes('/app1')) {
    console.log('Admin detected on app1, redirecting to my-parties');
    window.location.href = '/app2/my-parties';
    return;
  }

  let adminUser = data.user || authManager.getCurrentUser();
  
  const email = adminUser?.email || 'admin@rumbify.com';
  const name = adminUser?.name || 'Administrator';
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="my-parties-screen">
      <div class="my-parties-content">
        <!-- Header -->
        <div class="admin-header">
          <div class="admin-logo">
            <img src="assets/Llogowhite.png" alt="Rumbify Admin" class="admin-logo-img" />
          </div>
          <div class="admin-user-info">
            <h2 class="admin-welcome">Welcome, ${name}</h2>
            <p class="admin-email">${email}</p>
          </div>
          <div class="admin-header-actions">
            <button class="admin-profile-btn" id="profileBtn">
              <img src="assets/person.svg" alt="Profile" class="profile-icon" />
            </button>
            <button class="admin-logout-btn" onclick="handleLogout()">Logout</button>
          </div>
        </div>

        <!-- Quick Metrics -->
        <div class="quick-metrics-card">
          <div class="metrics-left">
            <h3 class="metrics-title">Quick Metrics</h3>
            <div class="metric-item">
              <span class="metric-number" id="totalAttendees">0</span>
              <span class="metric-label">Total Attendees</span>
            </div>
          </div>
          <div class="metrics-right">
            <div class="metric-item">
              <span class="metric-number" id="totalRevenue">$0</span>
              <span class="metric-label">Revenue</span>
            </div>
          </div>
        </div>

        <!-- My Events Section -->
        <div class="my-events-section">
          <h2 class="section-title">My Events</h2>
          <div class="events-list" id="eventsList">
            <!-- Events will be loaded dynamically -->
            <div class="loading-events">Loading events...</div>
          </div>
        </div>

        <!-- Bottom Navigation -->
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
  window.handleManageParty = handleManageParty;
  window.handleEditParty = handleEditParty;
  window.handleDeleteParty = handleDeleteParty;

  // Load admin parties and metrics
  loadAdminParties();
  loadQuickMetrics();
  
  // Add test function for debugging
  window.testCreateParty = function() {
    const testParty = {
      id: Date.now(),
      title: "Test Party",
      location: "Test Location",
      date: "18/10/25 • 20:00",
      attendees: "50/100",
      administrator: "Test Admin",
      image: "",
      tags: ["Test"],
      description: "Test description",
      status: 'active',
      category: 'upcoming',
      created_at: new Date().toISOString()
    };
    
    const existingParties = JSON.parse(localStorage.getItem('createdParties') || '[]');
    existingParties.unshift(testParty);
    localStorage.setItem('createdParties', JSON.stringify(existingParties));
    
    console.log('Test party created:', testParty);
    console.log('All parties:', JSON.parse(localStorage.getItem('createdParties')));
    
    // Reload the parties
    loadAdminParties();
    loadQuickMetrics();
    
    alert('Test party created! Check console for details.');
  };
  
  console.log('Test function available: window.testCreateParty()');

  function handleLogout() {
    authManager.clearAuth();
    navigateTo("/admin-login");
  }

  function handleManageParty(partyId) {
    console.log('Managing party:', partyId);
    navigateTo("/manage-party", { partyId: partyId });
  }

  function handleEditParty(partyId) {
    console.log('Editing party:', partyId);
    // For now, redirect to manage party screen
    navigateTo("/manage-party", { partyId: partyId });
  }

  function handleDeleteParty(partyId) {
    console.log('Deleting party:', partyId);
    if (confirm('Are you sure you want to delete this party?')) {
      deleteParty(partyId);
    }
  }

  async function deleteParty(partyId) {
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      const response = await makeRequest(`/parties/${partyId}`, 'DELETE', { email: adminUser.email });
      
      if (response.success) {
        console.log('Party deleted successfully');
        // Reload the parties list
        loadAdminParties();
      } else {
        console.error('Failed to delete party:', response.message);
        alert('Failed to delete party. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting party:', error);
      alert('Error deleting party. Please try again.');
    }
  }

  // Setup bottom navigation
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

  // Profile button
  const profileBtn = document.getElementById('profileBtn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      navigateTo('/edit-profile');
    });
  }
}

async function loadAdminParties() {
  try {
    console.log('Loading admin parties from Supabase...');
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminEmail = adminUser.email;
    
    if (!adminEmail) {
      console.warn('No admin email found for authentication');
      document.getElementById('eventsList').innerHTML = '<div class="no-events">No events found</div>';
      return;
    }

    console.log('Loading admin parties...');
    const response = await makeRequest('/admin/parties', 'POST', { email: adminEmail });
    console.log('Parties response:', response);
    
    if (response.success && response.parties) {
      displayParties(response.parties);
    } else {
      console.warn('Failed to load parties from API:', response.message || 'Unknown error');
      document.getElementById('eventsList').innerHTML = '<div class="no-events">No events found</div>';
    }
  } catch (error) {
    console.error('Error loading admin parties:', error);
    document.getElementById('eventsList').innerHTML = '<div class="no-events">Error loading events</div>';
  }
}

function displayParties(parties) {
  const eventsList = document.getElementById('eventsList');
  
  if (!parties || parties.length === 0) {
    eventsList.innerHTML = '<div class="no-events">No events found</div>';
    return;
  }

  eventsList.innerHTML = parties.map(party => `
    <div class="event-card">
      <div class="event-image">
        <img src="${party.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop'}" alt="${party.title}" />
      </div>
      <div class="event-content">
        <h3 class="event-title">${party.title}</h3>
        <p class="event-location">${party.location}</p>
        <p class="event-date">${party.date}</p>
        <p class="event-attendees">${party.attendees} attendees</p>
        <div class="event-actions">
          <button class="status-btn ${getStatusClass(party.status)}">${getStatusText(party.status)}</button>
          <button class="manage-btn" onclick="handleManageParty(${party.id})">Manage</button>
        </div>
      </div>
      <div class="event-controls">
        <button class="edit-btn" onclick="handleEditParty(${party.id})">
          <img src="assets/edit.svg" alt="Edit" />
        </button>
        <button class="delete-btn" onclick="handleDeleteParty(${party.id})">
          <img src="assets/deleteButton.svg" alt="Delete" />
        </button>
      </div>
    </div>
  `).join('');
}

function displayMockParties() {
  const mockParties = [
    {
      id: 1,
      title: "Pre-New Year Party",
      location: "Cra 51#39-26",
      date: "5/9/21 • 21:30-06:00",
      attendees: "123/220",
      status: "active",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop"
    },
    {
      id: 2,
      title: "Joshua's BD",
      location: "Cra 57#29-346",
      date: "6/9/21 • 23:00-06:00",
      attendees: "156/300",
      status: "inactive",
      image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop"
    }
  ];
  
  displayParties(mockParties);
}

function getStatusClass(status) {
  switch (status) {
    case 'active':
      return 'active';
    case 'inactive':
      return 'inactive';
    case 'finished':
      return 'finished';
    default:
      return 'active';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'finished':
      return 'Finished';
    default:
      return 'Active';
  }
}

async function loadQuickMetrics() {
  try {
    console.log('Loading quick metrics from Supabase...');
    
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const adminEmail = adminUser.email;
    
    if (!adminEmail) {
      console.warn('No admin email found for authentication');
      document.getElementById('totalAttendees').textContent = '0';
      document.getElementById('totalRevenue').textContent = '$0';
      return;
    }

    console.log('Loading metrics from API...');
    const response = await makeRequest('/admin/metrics', 'POST', { email: adminEmail });
    console.log('Metrics response:', response);
    
    if (response.success && response.metrics) {
      const metrics = response.metrics;
      document.getElementById('totalAttendees').textContent = metrics.totalAttendees || '0';
      document.getElementById('totalRevenue').textContent = metrics.totalRevenue || '$0';
    } else {
      console.warn('Failed to load metrics from API:', response.message || 'Unknown error');
      document.getElementById('totalAttendees').textContent = '0';
      document.getElementById('totalRevenue').textContent = '$0';
    }
  } catch (error) {
    console.error('Error loading metrics:', error);
    document.getElementById('totalAttendees').textContent = '0';
    document.getElementById('totalRevenue').textContent = '$0';
  }
}
