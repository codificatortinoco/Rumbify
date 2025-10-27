import { makeRequest, navigateTo, getCurrentUser } from "../app.js";

export default function renderPartyDetails(partyId) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="party-details-screen">
      <!-- Header -->
      <div class="party-details-header">
        <button class="back-btn" id="backBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="party-details-title">Party QR</h1>
      </div>

      <!-- Party Content -->
      <div class="party-details-content">
        <!-- Party Title -->
        <h2 class="party-main-title" id="partyTitle">Loading...</h2>

        <!-- Administrator Info -->
        <div class="administrator-section">
          <div class="administrator-info">
            <img src="" alt="Administrator" class="administrator-image" id="administratorImage" />
            <div class="administrator-details">
              <h3 class="administrator-name" id="administratorName">Loading...</h3>
              <div class="party-tags" id="partyTags">
                <!-- Tags will be loaded dynamically -->
              </div>
            </div>
          </div>
        </div>

        <!-- Active QR Section -->
        <div class="qr-section">
          <h3 class="section-title">Active QR</h3>
          <div class="qr-container">
            <div class="qr-code" id="qrCode">
              <!-- QR Code will be implemented later -->
              <div class="qr-placeholder">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
                </svg>
                <p>QR Code</p>
              </div>
            </div>
            <div class="qr-status">
              <span class="status-badge valid">Valid</span>
            </div>
            <div class="qr-info">
              <p class="qr-time" id="qrTime">Loading...</p>
              <p class="qr-validity">Valid until • Date</p>
            </div>
          </div>
        </div>

        <!-- Address Section -->
        <div class="address-section">
          <h3 class="section-title">Address</h3>
          <div class="address-info">
            <div class="address-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span id="partyAddress">Loading...</span>
            </div>
            <div class="map-container">
              <div class="map-placeholder" id="mapPlaceholder">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <p>Map View</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Party Description -->
        <div class="description-section">
          <h3 class="section-title">About this party</h3>
          <div class="description-content" id="partyDescription">
            <p>Loading description...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize party details
  initializePartyDetails(partyId);
}

async function initializePartyDetails(partyId) {
  try {
    console.log("=== INITIALIZING PARTY DETAILS ===");
    console.log("Party ID:", partyId);
    
    // Load party data
    console.log("Step 1: Loading party details...");
    await loadPartyDetails(partyId);
    console.log("Step 1: ✅ Party details loaded");
    
    // Setup event listeners
    console.log("Step 2: Setting up event listeners...");
    setupPartyDetailsEventListeners();
    console.log("Step 2: ✅ Event listeners setup");
    
    console.log("=== INITIALIZATION COMPLETE ===");
    
  } catch (error) {
    console.error("=== ERROR IN INITIALIZATION ===");
    console.error("Error initializing party details:", error);
    showError("Error loading party details");
  }
}

async function loadPartyDetails(partyId) {
  try {
    console.log('[loadPartyDetails] === STARTING PARTY DATA LOAD ===');
    console.log('[loadPartyDetails] Party ID:', partyId);
    
    // Get party information
    console.log('[loadPartyDetails] Making request to /parties/' + partyId);
    const partyResponse = await makeRequest(`/parties/${partyId}`, "GET");
    
    console.log('[loadPartyDetails] === PARTY RESPONSE RECEIVED ===');
    console.log('[loadPartyDetails] Party response:', partyResponse);
    console.log('[loadPartyDetails] Response success:', partyResponse?.success);
    console.log('[loadPartyDetails] Response data:', partyResponse?.party);
    
    if (!partyResponse) {
      throw new Error("No response received from server");
    }
    
    if (!partyResponse.success) {
      throw new Error(`Server error: ${partyResponse.message || 'Unknown error'}`);
    }

    const party = partyResponse.party || partyResponse;
    console.log('[loadPartyDetails] === PARTY DATA EXTRACTED ===');
    console.log('[loadPartyDetails] Party data:', party);
    
    if (!party) {
      throw new Error("No party data received");
    }
    
    console.log('[loadPartyDetails] === UPDATING UI ELEMENTS ===');
    
    // Update party title
    const partyTitleEl = document.getElementById("partyTitle");
    if (partyTitleEl) {
      console.log('[loadPartyDetails] Updating party title:', party.title);
      partyTitleEl.textContent = party.title;
    }
    
    // Update administrator info
    const adminNameEl = document.getElementById("administratorName");
    if (adminNameEl) {
      console.log('[loadPartyDetails] Updating administrator name:', party.administrator);
      adminNameEl.textContent = party.administrator;
    }
    
    // Debug administrator image
    console.log('[loadPartyDetails] Administrator image field:', party.administrator_image);
    console.log('[loadPartyDetails] Party image field:', party.image);
    console.log('[loadPartyDetails] All party fields:', Object.keys(party));
    
    // Use administrator_image from backend, with fallback
    const adminImage = party.administrator_image || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face";
    
    console.log('[loadPartyDetails] Using administrator image:', adminImage);
    
    const adminImageElement = document.getElementById("administratorImage");
    if (adminImageElement) {
      adminImageElement.src = adminImage;
      
      // Handle image load error
      adminImageElement.onerror = function() {
        console.log('[loadPartyDetails] Administrator image failed to load, using fallback');
        this.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face';
      };
    }
    
    // Update party tags
    const tagsContainer = document.getElementById("partyTags");
    if (tagsContainer) {
      if (party.tags && party.tags.length > 0) {
        tagsContainer.innerHTML = party.tags.map(tag => `
          <span class="tag">${tag}</span>
        `).join("");
      } else {
        tagsContainer.innerHTML = '<span class="tag">General</span>';
      }
    }
    
    // Update QR time
    const qrTimeEl = document.getElementById("qrTime");
    if (qrTimeEl) {
      qrTimeEl.textContent = party.date;
    }
    
    // Update address
    const addressEl = document.getElementById("partyAddress");
    if (addressEl) {
      addressEl.textContent = party.location;
    }
    
    // Load party description
    console.log('[loadPartyDetails] Loading party description...');
    await loadPartyDescription(partyId);
    console.log('[loadPartyDetails] ✅ Party description loaded');
    
    console.log('[loadPartyDetails] === PARTY DATA LOAD COMPLETE ===');
    
  } catch (error) {
    console.error('[loadPartyDetails] === ERROR IN PARTY DATA LOAD ===');
    console.error("Error loading party details:", error);
    showError("Error loading party details");
  }
}

async function loadPartyDescription(partyId) {
  try {
    console.log('[loadPartyDescription] Loading description for party:', partyId);
    
    // Get party description
    const descriptionResponse = await makeRequest(`/parties/${partyId}/description`, "GET");
    
    console.log('[loadPartyDescription] Description response:', descriptionResponse);
    
    const partyDescriptionElement = document.getElementById("partyDescription");
    if (!partyDescriptionElement) {
      console.error('[loadPartyDescription] partyDescription element not found in DOM');
      return;
    }
    
    if (descriptionResponse && descriptionResponse.success && descriptionResponse.description) {
      console.log('[loadPartyDescription] Description found:', descriptionResponse.description);
      partyDescriptionElement.innerHTML = `
        <p>${descriptionResponse.description}</p>
      `;
    } else {
      console.log('[loadPartyDescription] No description available');
      partyDescriptionElement.innerHTML = `
        <p>No description available for this party.</p>
      `;
    }
    
  } catch (error) {
    console.error('[loadPartyDescription] Error loading party description:', error);
    const partyDescriptionElement = document.getElementById("partyDescription");
    if (partyDescriptionElement) {
      partyDescriptionElement.innerHTML = `
        <p>No description available for this party.</p>
      `;
    }
  }
}

function setupPartyDetailsEventListeners() {
  // Back button
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigateTo("/member-dashboard");
    });
  }
}

function showError(message) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="error-screen">
      <h2>Error</h2>
      <p>${message}</p>
      <button class="retry-btn" id="errorBackBtn">Go Back</button>
    </div>
  `;
  
  // Add event listener for the back button
  const backBtn = document.getElementById("errorBackBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      navigateTo("/member-dashboard");
    });
  }
}

export function cleanupPartyDetails() {
  // Cleanup if needed
}
