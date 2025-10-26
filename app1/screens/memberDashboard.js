import { makeRequest, navigateTo, getCurrentUser } from "../app.js";

// Configuration for data source
const CONFIG = {
  USE_MOCK_DATA: false,
  API_ENDPOINTS: {
    UPCOMING_FOR_YOU: "/parties",
    LIKE: "/parties"
  }
};

let memberDashboardController = {
  isActive: false,
  abortController: null,
  isLoading: false
};

export default function renderMemberDashboard() {
  const currentUser = getCurrentUser();
  const userName = currentUser?.name || "User";
  
  memberDashboardController.isActive = true;
  if (memberDashboardController.abortController) {
    memberDashboardController.abortController.abort();
  }
  memberDashboardController.abortController = new AbortController();
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="member-dashboard">
      <!-- Header Section -->
      <header class="dashboard-header">
        <div class="profile-section" id="headerProfileBtn">
          <div class="profile-pic">
            <img src="${currentUser?.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'}" alt="Profile" />
          </div>
          <div class="profile-info">
            <h3>Welcome, ${userName} Member</h3>
          </div>
        </div>
        <div class="notification-bell">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
          </svg>
          <div class="notification-dot"></div>
        </div>
      </header>

      <!-- Welcome Message -->
      <div class="welcome-message">
        <h2>Hi ${userName}, ready for the weekend?</h2>
        <button class="add-party-btn" id="addPartyBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
          </svg>
          Add Party
        </button>
      </div>

      <!-- Upcoming For You Section -->
      <section class="upcoming-for-you-section">
        <h2 class="section-title">Upcoming For You</h2>
        <div class="upcoming-carousel" id="upcomingCarousel">
          <!-- Upcoming events will be loaded here -->
        </div>
        <div class="carousel-dots" id="upcomingDots">
          <!-- Dots will be dynamically generated -->
        </div>
      </section>

      <!-- Favorites Section -->
      <section class="favorites-section">
        <div class="section-header">
          <h2 class="section-title">Favorites</h2>
          <a href="#" class="see-more-link" id="seeMoreFavorites">See more</a>
        </div>
        <div class="no-favorites">
          <p>No tienes eventos favoritos aún</p>
        </div>
      </section>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <div class="nav-item" data-nav="Parties">
          <span class="nav-icon icon-party"></span>
          <span>Parties</span>
        </div>
        <div class="nav-item active" data-nav="Home">
          <span class="nav-icon icon-home"></span>
          <span>Home</span>
        </div>
        <div class="nav-item" data-nav="Profile">
          <span class="nav-icon icon-user"></span>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  `;

  initializeMemberDashboard();
}

function initializeMemberDashboard() {
  // Load upcoming events for user
  loadUpcomingForYou();
  
  setupUpcomingCarousel();
  
  setupActionButtons();
  
  setupBottomNavigation();
  
  setupHeaderProfileButton();
  
  setupAddPartyButton();
}

// Data Service Layer
class MemberDataService {
  static async getUpcomingForYou() {
    if (CONFIG.USE_MOCK_DATA) {
      return this.getMockUpcomingForYou();
    }
    
    try {
      const response = await makeRequest(CONFIG.API_ENDPOINTS.UPCOMING_FOR_YOU, "GET");
      
      if (!response || !Array.isArray(response)) {
        return this.getMockUpcomingForYou();
      }
      
      const upcomingEvents = response
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      
      return upcomingEvents;
    } catch (error) {
      console.error("Error fetching upcoming for you:", error);
      return this.getMockUpcomingForYou();
    }
  }


  static getMockUpcomingForYou() {
    return [
      {
        id: 1,
        title: "Neon Night",
        attendees: "89/120",
        location: "Club Downtown",
        date: "15/12/24 • 22:00-06:00",
        administrator: "DJ Neon",
        price: "$35.000",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
        tags: ["Neon", "Electronic"],
        liked: false,
        category: "upcoming"
      },
      {
        id: 2,
        title: "Summer Vibes",
        attendees: "45/100",
        location: "Calle 15#45-12",
        date: "20/12/24 • 20:00-04:00",
        administrator: "DJ Summer",
        price: "$45.000",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
        tags: ["Summer", "Outdoor"],
        liked: true,
        category: "upcoming"
      },
      {
        id: 3,
        title: "New Year Party",
        attendees: "67/150",
        location: "Rooftop Bar",
        date: "31/12/24 • 21:00-05:00",
        administrator: "Event Organizer",
        price: "$60.000",
        image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
        tags: ["New Year", "Celebration"],
        liked: false,
        category: "upcoming"
      }
    ];
  }

}

async function loadUpcomingForYou() {
  if (!memberDashboardController.isActive || memberDashboardController.isLoading) {
    console.log("Member dashboard no longer active or already loading, skipping data load");
    return;
  }

  memberDashboardController.isLoading = true;
  showUpcomingLoadingState();

  try {
    const upcomingEvents = await MemberDataService.getUpcomingForYou();
    
    if (!memberDashboardController.isActive) {
      console.log("Member dashboard no longer active, skipping render");
      return;
    }
    
    renderUpcomingCarousel(upcomingEvents);
  } catch (error) {
    console.error("Error loading upcoming for you:", error);
  } finally {
    memberDashboardController.isLoading = false;
  }
}

function showUpcomingLoadingState() {
  const carousel = document.getElementById("upcomingCarousel");
  const dots = document.getElementById("upcomingDots");
  
  if (carousel) {
    carousel.innerHTML = '<div class="loading-spinner">Cargando eventos para ti...</div>';
  }
  
  if (dots) {
    dots.innerHTML = '';
  }
}

function renderUpcomingCarousel(events) {
  const carousel = document.getElementById("upcomingCarousel");
  const dots = document.getElementById("upcomingDots");
  
  if (!carousel || !dots) {
    console.warn("Upcoming carousel elements not found, skipping render");
    return;
  }
  
  if (!events || events.length === 0) {
    carousel.innerHTML = '<p>No hay eventos próximos</p>';
    return;
  }

  // Limit to 3 events max
  const limitedEvents = events.slice(0, 3);
  
  const eventsHTML = limitedEvents.map(event => {
    // Format date for display
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    const formattedTime = eventDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Format attendees count
    const attendeesCount = event.attendees_count || 0;
    const maxAttendees = event.max_attendees || 100;
    const attendeesDisplay = `${attendeesCount}/${maxAttendees}`;
    
    return `
      <div class="upcoming-card" data-party-id="${event.id}">
        <div class="event-image">
          <img src="${event.image_url || event.image || 'https://images.unsplash.com/photo-1571266028243-e68f952df624?w=400&h=300&fit=crop'}" alt="${event.title}" />
        </div>
        <div class="event-info">
          <h3 class="event-title">${event.title} ${attendeesDisplay}</h3>
          <div class="event-details">
            <div class="event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>${event.location}</span>
            </div>
            <div class="event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <span>${formattedDate} • ${formattedTime}</span>
            </div>
            <div class="event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <span>${event.organizer_name || event.administrator || 'Organizador'}</span>
            </div>
          </div>
          <div class="event-actions">
            <button class="action-btn going" data-event-id="${event.id}">I'm going</button>
            <button class="action-btn maybe" data-event-id="${event.id}">Maybe</button>
            <button class="action-btn not-going" data-event-id="${event.id}">Not going</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  carousel.innerHTML = eventsHTML;
  
  // Generate dots
  const dotsHTML = limitedEvents.map((_, index) => 
    `<span class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>`
  ).join('');
  
  dots.innerHTML = dotsHTML;
}


function setupUpcomingCarousel() {
  const carousel = document.getElementById("upcomingCarousel");
  const dots = document.getElementById("upcomingDots");
  
  if (!carousel || !dots) return;

  let currentSlide = 0;
  const slides = carousel.querySelectorAll('.upcoming-card');
  const dotElements = dots.querySelectorAll('.dot');

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.display = i === index ? 'block' : 'none';
    });
    
    dotElements.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  // Initialize first slide
  if (slides.length > 0) {
    showSlide(0);
  }

  // Auto-advance carousel
  if (slides.length > 1) {
    setInterval(() => {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }, 5000);
  }

  // Dot navigation
  dotElements.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentSlide = index;
      showSlide(currentSlide);
    });
  });
}

function setupActionButtons() {
  document.addEventListener('click', async (e) => {
    // Handle party card clicks
    if (e.target.closest('.upcoming-card') && !e.target.closest('.action-btn')) {
      const card = e.target.closest('.upcoming-card');
      const partyId = card.dataset.partyId;
      
      if (partyId) {
        console.log('Navigating to party details:', partyId);
        navigateTo(`/party-details/${partyId}`);
      }
    }
    
    // Handle action button clicks
    if (e.target.closest('.action-btn')) {
      e.stopPropagation(); // Prevent card click
      
      const button = e.target.closest('.action-btn');
      const eventId = button.dataset.eventId;
      const action = button.classList.contains('going') ? 'going' : 
                    button.classList.contains('maybe') ? 'maybe' : 'not-going';
      
      // Remove active class from all buttons in the same card
      const card = button.closest('.upcoming-card');
      const allButtons = card.querySelectorAll('.action-btn');
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      try {
        await makeRequest(`${CONFIG.API_ENDPOINTS.LIKE}/${eventId}/attendance`, "POST", {
          action: action
        });
        
      } catch (error) {
        console.error("Error updating attendance:", error);
      }
    }
  });
}

function setupAddPartyButton() {
  const addPartyBtn = document.getElementById("addPartyBtn");
  if (addPartyBtn) {
    addPartyBtn.addEventListener("click", () => {
      showAddPartyModal();
    });
  }
}

function setupBottomNavigation() {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  
  navItems.forEach(item => {
    item.style.touchAction = "manipulation";
    item.addEventListener("click", () => {
      navItems.forEach(nav => nav.classList.remove("active"));
      
      item.classList.add("active");
      
      const target = item.dataset.nav;
      switch (target) {
        case "Parties":
-         navigateTo("/parties");
+         navigateTo("/dashboard");
          break;
        case "Home":
          break;
        case "Profile":
          navigateTo("/profile");
          break;
      }
    });
  });
}

function setupHeaderProfileButton() {
  const profileBtn = document.getElementById("headerProfileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      navigateTo("/profile");
    });
  }
}

// Modal functions
function showAddPartyModal() {
  const modalHTML = `
    <div id="addPartyModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">Add Party</h2>
          <button class="modal-close" id="closeModalBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-instruction">Enter your code</p>
          <div class="input-container">
            <input 
              type="text" 
              id="partyCodeInput" 
              placeholder="Party's code" 
              maxlength="8"
              autocomplete="off"
            />
          </div>
          <button class="add-party-submit-btn" id="submitCodeBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
            </svg>
            Add Party
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Setup modal event listeners
  setupModalEventListeners();
  
  // Focus on input
  setTimeout(() => {
    const input = document.getElementById('partyCodeInput');
    if (input) input.focus();
  }, 100);
}

function setupModalEventListeners() {
  const modal = document.getElementById('addPartyModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const submitBtn = document.getElementById('submitCodeBtn');
  const input = document.getElementById('partyCodeInput');
  
  // Close modal events
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Submit code
  submitBtn.addEventListener('click', handleCodeSubmission);
  
  // Enter key to submit
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleCodeSubmission();
    }
  });
  
  // Format input (uppercase, alphanumeric only)
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  });
}

function closeModal() {
  const modal = document.getElementById('addPartyModal');
  if (modal) {
    modal.remove();
  }
}

async function handleCodeSubmission() {
  const input = document.getElementById('partyCodeInput');
  const submitBtn = document.getElementById('submitCodeBtn');
  const code = input.value.trim();
  
  if (!code) {
    showModalError('Please enter a code');
    return;
  }
  
  if (code.length < 4) {
    showModalError('Code must be at least 4 characters');
    return;
  }
  
  // Disable button and show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <div class="loading-spinner-small"></div>
    Verifying...
  `;
  
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('User not logged in');
    }
    
    // Verify code and get party info
    const response = await makeRequest('/codes/verify-and-add', 'POST', {
      code: code,
      user_id: currentUser.id
    });
    
    if (response.success) {
      showModalSuccess('Party added successfully!');
      
      // Close modal after delay
      setTimeout(() => {
        closeModal();
        // Refresh the dashboard to show updated data
        loadUpcomingForYou();
      }, 1500);
    } else {
      showModalError(response.message || 'Invalid code');
    }
    
  } catch (error) {
    console.error('Error verifying code:', error);
    showModalError(error.message || 'Error verifying code. Please try again.');
  } finally {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
      </svg>
      Add Party
    `;
  }
}

function showModalError(message) {
  const modalBody = document.querySelector('.modal-body');
  let errorDiv = modalBody.querySelector('.modal-error');
  
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.className = 'modal-error';
    modalBody.appendChild(errorDiv);
  }
  
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
  
  // Remove error after 3 seconds
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 3000);
}

function showModalSuccess(message) {
  const modalBody = document.querySelector('.modal-body');
  let successDiv = modalBody.querySelector('.modal-success');
  
  if (!successDiv) {
    successDiv = document.createElement('div');
    successDiv.className = 'modal-success';
    modalBody.appendChild(successDiv);
  }
  
  successDiv.textContent = message;
  successDiv.style.display = 'block';
  
  // Remove success message after 2 seconds
  setTimeout(() => {
    successDiv.style.display = 'none';
  }, 2000);
}

export function cleanupMemberDashboard() {
  memberDashboardController.isActive = false;
  memberDashboardController.isLoading = false;
  if (memberDashboardController.abortController) {
    memberDashboardController.abortController.abort();
  }
  
  // Clean up modal if it exists
  const modal = document.getElementById('addPartyModal');
  if (modal) {
    modal.remove();
  }
}

