import { navigateTo, makeRequest } from "../app.js";

export default async function renderGuestsSummary(routeData = {}) {
  const app = document.getElementById("app");
  const partyId = routeData?.partyId || localStorage.getItem('selectedPartyId') || 1;

  app.innerHTML = `
    <div id="guests-summary-screen" class="manage-party">
      <div class="top-section">
        <div class="top-label">Admin's management</div>
        <div class="page-header">
          <button class="back-btn" id="gs-back"><img src="/app2/assets/backIcon.svg" alt="Back"/></button>
          <h2 class="page-title">Guests List</h2>
        </div>
      </div>

      <section class="status-card">
        <div class="status-header">
          <h3 id="partyTitle">Party</h3>
        </div>
        <div class="status-grid">
          <div class="status-item">
            <div class="status-number" id="pendingCount">0</div>
            <div class="status-label">Pending</div>
          </div>
          <div class="status-item">
            <div class="status-number" id="validatedCount">0</div>
            <div class="status-label">Validated</div>
          </div>
          <div class="status-item">
            <div class="status-number" id="deniedCount">0</div>
            <div class="status-label">Denied</div>
          </div>
        </div>
      </section>

      <section class="guest-list">
        <div class="guest-list-header">
          <h3>Latest Verifications</h3>
        </div>
        <ul id="validatedList" class="guest-items"></ul>
        <div class="guest-list-header">
          <h3>Pending</h3>
        </div>
        <ul id="pendingList" class="guest-items"></ul>
        <div class="guest-list-header">
          <h3>Access denied</h3>
        </div>
        <ul id="deniedList" class="guest-items"></ul>
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
    const cssHref = '/app2/screens/guestsSummary.css';
    if (!document.querySelector(`link[href="${cssHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      document.head.appendChild(link);
    }
  })();

  document.getElementById('gs-back')?.addEventListener('click', () => navigateTo('/manage-party', { partyId }));

  try {
    const summary = await (await fetch(`http://localhost:5050/parties/${partyId}/guests/summary`)).json();
    document.getElementById('partyTitle').textContent = summary?.party?.title || `Party #${partyId}`;
    document.getElementById('pendingCount').textContent = summary?.totals?.pending ?? 0;
    document.getElementById('validatedCount').textContent = summary?.totals?.validated ?? 0;
    document.getElementById('deniedCount').textContent = summary?.totals?.denied ?? 0;

    const renderItems = (items, status) => items.map(g => `
      <li class="guest-item">
        <img src="/app2/assets/userIcon.svg" alt="${g.name}" class="guest-avatar"/>
        <div class="guest-info">
          <div class="guest-name">${g.name}</div>
          <div class="guest-time"></div>
        </div>
        <div class="guest-status ${status === 'Valid' ? 'valid' : (status === 'Invalid' ? 'invalid' : 'pending')}">${status}</div>
      </li>
    `).join('');

    document.getElementById('validatedList').innerHTML = renderItems(summary?.lists?.validated || [], 'Valid');
    document.getElementById('pendingList').innerHTML = renderItems(summary?.lists?.pending || [], 'Pending');
    document.getElementById('deniedList').innerHTML = renderItems(summary?.lists?.denied || [], 'Invalid');
  } catch (err) {
    console.error('Error loading guests summary:', err);
  }

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