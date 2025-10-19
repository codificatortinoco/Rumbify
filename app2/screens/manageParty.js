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

      <section class="entry-codes-section">
        <div class="entry-codes-header">
          <h3>Entry Codes</h3>
          <button id="createCodesBtn" class="create-codes-btn">Create Codes</button>
        </div>
        <div class="codes-info">
          <p>Generate entry codes for different ticket types</p>
        </div>
      </section>

      <!-- Create Codes Modal -->
      <div id="createCodesModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Create Entry Codes</h3>
            <button class="close-btn" id="closeCreateModal">&times;</button>
          </div>
          <div class="modal-body">
            <form id="createCodesForm">
              <div class="form-group">
                <label for="ticketType">Ticket Type</label>
                <select id="ticketType" required>
                  <option value="">Loading ticket types...</option>
                </select>
              </div>
              <div class="form-group">
                <label for="codeQuantity">Number of Codes</label>
                <input type="number" id="codeQuantity" min="1" max="100" value="1" required>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-btn" id="cancelCreateCodes">Cancel</button>
                <button type="submit" class="create-btn">Generate Codes</button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Display Codes Modal -->
      <div id="displayCodesModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Generated Entry Codes</h3>
            <button class="close-btn" id="closeDisplayModal">&times;</button>
          </div>
          <div class="modal-body">
            <div class="codes-container">
              <div class="codes-info">
                <p><strong>Ticket Type:</strong> <span id="displayTicketType"></span></p>
                <p><strong>Quantity:</strong> <span id="displayQuantity"></span></p>
              </div>
              <div class="codes-list" id="codesList">
                <!-- Codes will be displayed here -->
              </div>
              <div class="codes-actions">
                <button class="copy-all-btn" id="copyAllCodes">Copy All</button>
                <button class="download-btn" id="downloadCodes">Download as Text</button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

  // Initialize entry codes functionality
  initializeEntryCodes();
  
  // Load party prices for ticket type options
  loadPartyPrices();
}

// Entry Codes Functionality
function initializeEntryCodes() {
  const createCodesBtn = document.getElementById('createCodesBtn');
  const createCodesModal = document.getElementById('createCodesModal');
  const displayCodesModal = document.getElementById('displayCodesModal');
  const createCodesForm = document.getElementById('createCodesForm');
  const closeCreateModal = document.getElementById('closeCreateModal');
  const closeDisplayModal = document.getElementById('closeDisplayModal');
  const cancelCreateCodes = document.getElementById('cancelCreateCodes');

  // Open create codes modal
  createCodesBtn?.addEventListener('click', async () => {
    createCodesModal.style.display = 'block';
    // Refresh ticket types when modal opens
    await loadPartyPrices();
  });

  // Close modals
  closeCreateModal?.addEventListener('click', () => {
    createCodesModal.style.display = 'none';
  });

  closeDisplayModal?.addEventListener('click', () => {
    displayCodesModal.style.display = 'none';
  });

  cancelCreateCodes?.addEventListener('click', () => {
    createCodesModal.style.display = 'none';
  });

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === createCodesModal) {
      createCodesModal.style.display = 'none';
    }
    if (event.target === displayCodesModal) {
      displayCodesModal.style.display = 'none';
    }
  });

  // Handle form submission
  createCodesForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ticketType = document.getElementById('ticketType').value;
    const quantity = parseInt(document.getElementById('codeQuantity').value);
    
    if (!ticketType || !quantity) {
      alert('Please fill in all fields');
      return;
    }
    
    if (ticketType === 'No ticket types found for this party') {
      alert('This party has no ticket types configured. Please add ticket types to the party first.');
      return;
    }

    try {
      // Show loading state
      const submitBtn = createCodesForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Generating...';
      submitBtn.disabled = true;

      // Get current party ID
      const partyId = localStorage.getItem('selectedPartyId') || 1;
      
      // Generate codes
      const response = await makeRequest('/codes/generate', 'POST', {
        party_id: partyId,
        price_name: ticketType,
        quantity: quantity
      });

      if (response.success) {
        // Close create modal
        createCodesModal.style.display = 'none';
        
        // Show generated codes
        displayGeneratedCodes(ticketType, quantity, response.codes);
      } else {
        alert('Error generating codes: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      alert('Error generating codes. Please try again.');
    } finally {
      // Reset button state
      const submitBtn = createCodesForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Generate Codes';
      submitBtn.disabled = false;
    }
  });

  // Copy all codes functionality
  document.getElementById('copyAllCodes')?.addEventListener('click', () => {
    const codesList = document.getElementById('codesList');
    const codes = Array.from(codesList.querySelectorAll('.code-item')).map(item => item.textContent.trim());
    const codesText = codes.join('\n');
    
    navigator.clipboard.writeText(codesText).then(() => {
      alert('All codes copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy codes:', err);
      alert('Failed to copy codes. Please try again.');
    });
  });

  // Download codes functionality
  document.getElementById('downloadCodes')?.addEventListener('click', () => {
    const codesList = document.getElementById('codesList');
    const codes = Array.from(codesList.querySelectorAll('.code-item')).map(item => item.textContent.trim());
    const ticketType = document.getElementById('displayTicketType').textContent;
    const quantity = document.getElementById('displayQuantity').textContent;
    
    const content = `Entry Codes for ${ticketType} Tickets\nQuantity: ${quantity}\n\n${codes.join('\n')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entry-codes-${ticketType.toLowerCase().replace(' ', '-')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function displayGeneratedCodes(ticketType, quantity, codes) {
  const displayModal = document.getElementById('displayCodesModal');
  const displayTicketType = document.getElementById('displayTicketType');
  const displayQuantity = document.getElementById('displayQuantity');
  const codesList = document.getElementById('codesList');

  // Update modal content
  displayTicketType.textContent = ticketType;
  displayQuantity.textContent = quantity;

  // Display codes
  codesList.innerHTML = codes.map(code => `
    <div class="code-item">
      <span class="code-text">${code}</span>
      <button class="copy-code-btn" onclick="copySingleCode('${code}')">Copy</button>
    </div>
  `).join('');

  // Show modal
  displayModal.style.display = 'block';
}

// Load party prices for ticket type options
async function loadPartyPrices() {
  try {
    const partyId = localStorage.getItem('selectedPartyId') || 1;
    console.log('Loading party prices for party ID:', partyId);
    
    const response = await makeRequest(`/parties/${partyId}`, 'GET');
    console.log('Party response:', response);
    
    if (response && response.prices && response.prices.length > 0) {
      console.log('Found party prices:', response.prices);
      updateTicketTypeOptions(response.prices);
    } else {
      console.warn('No prices found for this party');
      // Fallback to default options if no prices found
      updateTicketTypeOptions([]);
    }
  } catch (error) {
    console.error('Error loading party prices:', error);
    // Fallback to default options on error
    updateTicketTypeOptions([]);
  }
}

// Update ticket type dropdown with party's actual prices
function updateTicketTypeOptions(prices) {
  const ticketTypeSelect = document.getElementById('ticketType');
  
  if (!ticketTypeSelect) {
    console.warn('Ticket type select element not found');
    return;
  }
  
  // Clear existing options
  ticketTypeSelect.innerHTML = '';
  
  if (prices && prices.length > 0) {
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select ticket type';
    ticketTypeSelect.appendChild(defaultOption);
    
    // Add options based on actual party prices
    prices.forEach(price => {
      const option = document.createElement('option');
      option.value = price.price_name || price.name || 'Unknown';
      option.textContent = `${price.price_name || price.name || 'Unknown'} - $${price.price || 'N/A'}`;
      ticketTypeSelect.appendChild(option);
    });
    
    console.log('Updated ticket type options with party prices:', prices.length);
  } else {
    // Fallback options if no prices found
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'No ticket types found for this party';
    ticketTypeSelect.appendChild(defaultOption);
    
    const fallbackOptions = [
      { value: 'VIP', text: 'VIP' },
      { value: 'General', text: 'General' },
      { value: 'Student', text: 'Student' },
      { value: 'Early Bird', text: 'Early Bird' }
    ];
    
    fallbackOptions.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      ticketTypeSelect.appendChild(optionElement);
    });
    
    console.log('Using fallback ticket type options');
  }
}

// Copy single code function (global for onclick)
window.copySingleCode = function(code) {
  navigator.clipboard.writeText(code).then(() => {
    // Show temporary feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#2ecc71';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 1000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
    alert('Failed to copy code. Please try again.');
  });
};

// Add test function for codes API
window.testCodesAPI = async function() {
  console.log('=== TESTING CODES API ===');
  
  try {
    console.log('1. Testing database connection...');
    const connectionTest = await makeRequest('/codes/test', 'GET');
    console.log('2. Connection test result:', connectionTest);
    
    if (connectionTest.success) {
      console.log('3. Testing code generation...');
      const partyId = localStorage.getItem('selectedPartyId') || 1;
      const testPayload = {
        party_id: partyId,
        price_name: 'Test',
        quantity: 1
      };
      
      console.log('4. Test payload:', testPayload);
      const generateTest = await makeRequest('/codes/generate', 'POST', testPayload);
      console.log('5. Generate test result:', generateTest);
    }
  } catch (error) {
    console.error('6. Test error:', error);
  }
  
  console.log('=== END CODES API TEST ===');
};

console.log('Codes API test function available: window.testCodesAPI()');