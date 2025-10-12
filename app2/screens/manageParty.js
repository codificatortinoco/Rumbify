import { navigateTo, makeRequest } from "../app.js";

export default async function renderManageParty(routeData = {}) {
  const app = document.getElementById("app");
  const partyId = routeData?.partyId || localStorage.getItem('selectedPartyId') || 1; // default demo id

  app.innerHTML = `
    <div id="manage-party-screen" class="manage-party">
      <div class="top-section">
        <div class="top-label">Admin's management</div>
        <div class="page-header">
          <button class="back-btn" id="mp-back"><img src="/app2/assets/backIcon.svg" alt="Back"/></button>
          <h2 class="page-title">Manage Party</h2>
        </div>
      </div>

      <section class="scan-card">
        <div class="scan-box">
          <div class="scan-icon"></div>
          <p>Scan Qr</p>
        </div>
      </section>

      <section class="status-card">
        <div class="status-header">
          <h3>Current Status</h3>
          <span class="live-dot">• Live</span>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-number" id="insideCount">0</div>
            <div class="status-label">Inside</div>
          </div>
          <div class="status-item">
            <div class="status-number" id="remainingCount">0</div>
            <div class="status-label">Remaining</div>
          </div>
          <div class="status-item">
            <div class="status-number" id="capacityCount">0</div>
            <div class="status-label">Capacity</div>
          </div>
        </div>
      </section>

      <section class="guest-list">
        <div class="guest-list-header">
          <h3>Guest List</h3>
          <button id="seeMoreBtn" class="see-more">See more</button>
        </div>
        <ul id="guestList" class="guest-items"></ul>
      </section>

      <nav class="bottom-nav">
        <div class="nav-item" data-nav="parties">
          <span class="nav-icon icon-party"></span>
          <span class="nav-label">My Parties</span>
        </div>
        <div class="nav-item" data-nav="new">
          <span class="nav-icon icon-plus"></span>
          <span class="nav-label">New Party</span>
        </div>
        <div class="nav-item" data-nav="profile">
          <span class="nav-icon icon-user"></span>
          <span class="nav-label">Profile</span>
        </div>
      </nav>
    </div>
  `;

  // Cargar CSS específico de la pantalla
  (function(){
    const cssHref = '/app2/screens/manageParty.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
  })();

  // Back to Admin Dashboard
  document.getElementById('mp-back')?.addEventListener('click', () => navigateTo('/admin-dashboard'));
  document.getElementById('seeMoreBtn')?.addEventListener('click', () => navigateTo('/guests-summary', { partyId }));

  // Fetch guests from backend (Supabase via server)
  try {
    const eventDetails = await makeRequest(`/parties/${partyId}`, 'GET');
    const guestsRes = await fetch(`http://localhost:5050/parties/${partyId}/guests`);
    const guestsData = await guestsRes.json();

    // Update status counts
    const capacity = eventDetails?.capacity || 220;
    const inside = guestsData.filter(g => g.status === 'Valid').length;
    const remaining = Math.max(capacity - inside, 0);

    document.getElementById('insideCount').textContent = inside;
    document.getElementById('remainingCount').textContent = remaining;
    document.getElementById('capacityCount').textContent = capacity;

    // Render guest list
    const listEl = document.getElementById('guestList');
    listEl.innerHTML = guestsData.slice(0, 10).map(g => `
      <li class="guest-item">
        <img src="${g.avatar || '/app2/assets/userIcon.svg'}" alt="${g.name}" class="guest-avatar"/>
        <div class="guest-info">
          <div class="guest-name">${g.name}</div>
          <div class="guest-time">${g.time || ''}</div>
        </div>
        <div class="guest-status ${g.status === 'Valid' ? 'valid' : 'invalid'}">${g.status}</div>
      </li>
    `).join('');
  } catch (err) {
    console.error('Error fetching guests:', err);
  }

  // Bottom nav behavior
  const bottomNav = document.querySelector('.bottom-nav');
  bottomNav?.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.nav;
      if (target === 'parties') navigateTo('/admin-dashboard');
      if (target === 'new') navigateTo('/create-party');
      if (target === 'profile') navigateTo('/admin-dashboard');
    });
  });
}