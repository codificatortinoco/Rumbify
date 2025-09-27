import { makeRequest, navigateTo } from "../app.js";

// Configuration for data source
const CONFIG = {
  USE_MOCK_DATA: true, // Set to false when Supabase is ready
  API_ENDPOINTS: {
    HOT_TOPIC: "/parties/hot-topic",
    UPCOMING: "/parties/upcoming",
    SEARCH: "/parties/search",
    LIKE: "/parties"
  }
};

export default function renderDashboard() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="dashboard">
      <!-- Header Section -->
      <header class="dashboard-header">
        <div class="profile-section">
          <div class="profile-pic">
            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face" alt="Profile" />
          </div>
          <div class="profile-info">
            <h3>Welcome, KC</h3>
            <span class="member-badge">Member</span>
          </div>
        </div>
        <div class="notification-bell">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
      </header>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-bar">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" placeholder="Search Party..." id="searchInput" />
        </div>
      </div>

      <!-- Hot Topic Section -->
      <section class="hot-topic-section">
        <h2 class="section-title">Hot Topic</h2>
        <div class="hot-topic-carousel" id="hotTopicCarousel">
          <!-- Hot topic cards will be dynamically loaded here -->
        </div>
        <div class="carousel-dots" id="hotTopicDots">
          <!-- Dots will be dynamically generated -->
        </div>
      </section>

      <!-- Upcoming Section -->
      <section class="upcoming-section">
        <div class="section-header">
          <h2 class="section-title">Upcoming</h2>
          <a href="#" class="see-more-link">See more</a>
        </div>
        <div class="upcoming-events" id="upcomingEvents">
          <!-- Upcoming event cards will be dynamically loaded here -->
        </div>
      </section>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <div class="nav-item active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <span>Parties</span>
        </div>
        <div class="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9,22 9,12 15,12 15,22"></polyline>
          </svg>
          <span>Home</span>
        </div>
        <div class="nav-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  `;

  // Initialize dashboard functionality
  initializeDashboard();
}

function initializeDashboard() {
  // Load party data
  loadPartyData();
  
  // Setup search functionality
  setupSearch();
  
  // Setup carousel functionality
  setupCarousel();
  
  // Setup like functionality
  setupLikeButtons();
  
  // Setup event details navigation
  setupEventDetailsNavigation();
}

// Data Service Layer
class PartyDataService {
  static async getHotTopicParties() {
    if (CONFIG.USE_MOCK_DATA) {
      return this.getMockHotTopicParties();
    }
    
    try {
      const response = await makeRequest(CONFIG.API_ENDPOINTS.HOT_TOPIC, "GET");
      return response;
    } catch (error) {
      console.error("Error fetching hot topic parties:", error);
      return this.getMockHotTopicParties();
    }
  }

  static async getUpcomingParties() {
    if (CONFIG.USE_MOCK_DATA) {
      return this.getMockUpcomingParties();
    }
    
    try {
      const response = await makeRequest(CONFIG.API_ENDPOINTS.UPCOMING, "GET");
      return response;
    } catch (error) {
      console.error("Error fetching upcoming parties:", error);
      return this.getMockUpcomingParties();
    }
  }

  static async searchParties(query) {
    if (CONFIG.USE_MOCK_DATA) {
      return this.searchMockParties(query);
    }
    
    try {
      const response = await makeRequest(`${CONFIG.API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`, "GET");
      return response;
    } catch (error) {
      console.error("Error searching parties:", error);
      return this.searchMockParties(query);
    }
  }

  static async toggleLike(partyId, liked) {
    if (CONFIG.USE_MOCK_DATA) {
      return { success: true, liked };
    }
    
    try {
      const response = await makeRequest(`${CONFIG.API_ENDPOINTS.LIKE}/${partyId}/like`, "PATCH", { liked });
      return response;
    } catch (error) {
      console.error("Error toggling like:", error);
      return { success: true, liked };
    }
  }

  static async getEventDetails(eventId) {
    if (CONFIG.USE_MOCK_DATA) {
      return this.getMockEventDetails(eventId);
    }
    
    try {
      const response = await makeRequest(`${CONFIG.API_ENDPOINTS.LIKE}/${eventId}`, "GET");
      return response;
    } catch (error) {
      console.error("Error fetching event details:", error);
      return this.getMockEventDetails(eventId);
    }
  }

  // Mock data methods
  static getMockHotTopicParties() {
    return [
      {
        id: 1,
        title: "Chicago Night",
        attendees: "23/96",
        location: "Calle 23#32-26",
        date: "5/9/21 • 23:00-06:00",
        administrator: "Loco Foroko",
        price: "$65.000",
        image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=200&fit=crop",
        tags: ["Elegant", "Cocktailing"],
        liked: true,
        category: "hot-topic"
      },
      {
        id: 2,
        title: "Summer Vibes",
        attendees: "45/100",
        location: "Calle 15#45-12",
        date: "12/9/21 • 20:00-04:00",
        administrator: "DJ Summer",
        price: "$45.000",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=200&fit=crop",
        tags: ["Summer", "Outdoor"],
        liked: false,
        category: "hot-topic"
      }
    ];
  }

  static getMockUpcomingParties() {
    return [
      {
        id: 3,
        title: "Pre-New Year Pa...",
        attendees: "67/150",
        location: "Cra 51#39-26",
        date: "22/11/21 • 21:30-05:00",
        administrator: "DJ KC",
        price: "$80.000",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=150&fit=crop",
        tags: ["Disco Music", "Elegant"],
        liked: false,
        category: "upcoming"
      },
      {
        id: 4,
        title: "Neon Dreams",
        attendees: "89/120",
        location: "Calle 80#12-45",
        date: "15/9/21 • 22:00-05:00",
        administrator: "Neon DJ",
        price: "$55.000",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=150&fit=crop",
        tags: ["Electronic", "Neon"],
        liked: true,
        category: "upcoming"
      }
    ];
  }

  static searchMockParties(query) {
    const allParties = [...this.getMockHotTopicParties(), ...this.getMockUpcomingParties()];
    return allParties.filter(party => 
      party.title.toLowerCase().includes(query.toLowerCase()) ||
      party.administrator.toLowerCase().includes(query.toLowerCase()) ||
      party.location.toLowerCase().includes(query.toLowerCase())
    );
  }

  static getMockEventDetails(eventId) {
    // Mock data for event details
    const mockEvents = {
      1: {
        id: 1,
        title: "Chicago Night",
        attendees: "23/96",
        location: "Calle 23#32-26",
        date: "5/9/21 • 23:00-06:00",
        administrator: "Loco Foroko",
        price: "$65.000",
        image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=400&h=300&fit=crop",
        tags: ["Elegant", "Cocktailing"],
        liked: true,
        category: "hot-topic",
        description: "Experience the best of Chicago nightlife with our exclusive party featuring top DJs and premium cocktails.",
        inclusions: ["Drink of courtesy", "After midnight kiss dinamic", "Premium sound system"],
        dressCode: ["Elegant attire", "Cocktail dresses", "Dress shoes"],
        openingHour: "21:30"
      },
      2: {
        id: 2,
        title: "Summer Vibes",
        attendees: "45/100",
        location: "Calle 15#45-12",
        date: "12/9/21 • 20:00-04:00",
        administrator: "DJ Summer",
        price: "$45.000",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
        tags: ["Summer", "Outdoor"],
        liked: false,
        category: "hot-topic",
        description: "Celebrate summer with our outdoor party featuring tropical vibes and refreshing drinks.",
        inclusions: ["Welcome drink", "Tropical decorations", "Outdoor seating"],
        dressCode: ["Summer casual", "Bright colors", "Comfortable shoes"],
        openingHour: "20:00"
      },
      3: {
        id: 3,
        title: "Pre-New Year Pa...",
        attendees: "67/150",
        location: "Cra 51#39-26",
        date: "22/11/21 • 21:30-05:00",
        administrator: "DJ KC",
        price: "$80.000",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop",
        tags: ["Disco Music", "Elegant"],
        liked: false,
        category: "upcoming",
        description: "We do not need to be in the 31st of December to party as God intended.",
        inclusions: ["Drink of courtesy", "After midnight kiss dinamic", "New Year decorations"],
        dressCode: ["Neon Colors", "No formal attire required", "Comfortable dancing shoes"],
        openingHour: "21:30"
      },
      4: {
        id: 4,
        title: "Neon Dreams",
        attendees: "89/120",
        location: "Calle 80#12-45",
        date: "15/9/21 • 22:00-05:00",
        administrator: "Neon DJ",
        price: "$55.000",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
        tags: ["Electronic", "Neon"],
        liked: true,
        category: "upcoming",
        description: "Immerse yourself in a neon-lit electronic music experience like no other.",
        inclusions: ["Neon accessories", "Electronic music", "Light show"],
        dressCode: ["Neon colors", "Glow-in-the-dark items", "Comfortable shoes"],
        openingHour: "22:00"
      }
    };

    return mockEvents[eventId] || mockEvents[3]; // Default to Pre-New Year party
  }
}

async function loadPartyData() {
  try {
    // Load hot topic events
    const hotTopicEvents = await PartyDataService.getHotTopicParties();
    renderHotTopicEvents(hotTopicEvents);
    
    // Load upcoming events
    const upcomingEvents = await PartyDataService.getUpcomingParties();
    renderUpcomingEvents(upcomingEvents);
  } catch (error) {
    console.error("Error loading party data:", error);
    // Fallback to mock data
    const hotTopicEvents = PartyDataService.getMockHotTopicParties();
    const upcomingEvents = PartyDataService.getMockUpcomingParties();
    renderHotTopicEvents(hotTopicEvents);
    renderUpcomingEvents(upcomingEvents);
  }
}


function renderHotTopicEvents(events) {
  const carousel = document.getElementById("hotTopicCarousel");
  const dots = document.getElementById("hotTopicDots");
  
  carousel.innerHTML = events.map(event => createHotTopicCard(event)).join("");
  dots.innerHTML = events.map((_, index) => 
    `<div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
  ).join("");
}

function renderUpcomingEvents(events) {
  const container = document.getElementById("upcomingEvents");
  container.innerHTML = events.map(event => createUpcomingCard(event)).join("");
}

function createHotTopicCard(event) {
  return `
    <div class="hot-topic-card">
      <div class="card-image">
        <img src="${event.image}" alt="${event.title}" />
        <button class="like-btn ${event.liked ? 'liked' : ''}" data-event-id="${event.id}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      <div class="card-content">
        <div class="card-header">
          <h3 class="event-title">${event.title}</h3>
          <span class="attendees">${event.attendees}</span>
        </div>
        <div class="event-details">
          <div class="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${event.location}</span>
          </div>
          <div class="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${event.date}</span>
          </div>
          <div class="detail-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${event.administrator}</span>
          </div>
          <div class="price">${event.price}</div>
        </div>
         <div class="card-tags">
           ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
           <button class="see-more-btn" data-event-id="${event.id}">See More</button>
         </div>
      </div>
    </div>
  `;
}

function createUpcomingCard(event) {
  return `
    <div class="upcoming-card">
      <div class="card-image">
        <img src="${event.image}" alt="${event.title}" />
      </div>
      <div class="card-content">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-details">
          <div class="detail-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${event.location}</span>
          </div>
          <div class="detail-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${event.date}</span>
          </div>
          <div class="detail-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${event.administrator}</span>
          </div>
        </div>
         <div class="card-tags">
           ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
           <button class="see-more-btn" data-event-id="${event.id}">See More</button>
         </div>
      </div>
    </div>
  `;
}

function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;
  
  searchInput.addEventListener("input", async (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    if (searchTerm.length === 0) {
      // If search is empty, reload all data
      loadPartyData();
      return;
    }
    
    // Debounce search to avoid too many API calls
    searchTimeout = setTimeout(async () => {
      try {
        const searchResults = await PartyDataService.searchParties(searchTerm);
        displaySearchResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        // Fallback to client-side filtering
        filterEventsLocally(searchTerm);
      }
    }, 300);
  });
}

function displaySearchResults(results) {
  // Separate results by category
  const hotTopicResults = results.filter(party => party.category === "hot-topic");
  const upcomingResults = results.filter(party => party.category === "upcoming");
  
  // Render filtered results
  renderHotTopicEvents(hotTopicResults);
  renderUpcomingEvents(upcomingResults);
}

function filterEventsLocally(searchTerm) {
  // Fallback client-side filtering
  const hotTopicCards = document.querySelectorAll(".hot-topic-card");
  hotTopicCards.forEach(card => {
    const title = card.querySelector(".event-title").textContent.toLowerCase();
    const location = card.querySelector(".detail-item span").textContent.toLowerCase();
    const administrator = card.querySelectorAll(".detail-item span")[2].textContent.toLowerCase();
    
    const matches = title.includes(searchTerm) || location.includes(searchTerm) || administrator.includes(searchTerm);
    card.style.display = matches ? "block" : "none";
  });

  const upcomingCards = document.querySelectorAll(".upcoming-card");
  upcomingCards.forEach(card => {
    const title = card.querySelector(".event-title").textContent.toLowerCase();
    const location = card.querySelector(".detail-item span").textContent.toLowerCase();
    const administrator = card.querySelectorAll(".detail-item span")[2].textContent.toLowerCase();
    
    const matches = title.includes(searchTerm) || location.includes(searchTerm) || administrator.includes(searchTerm);
    card.style.display = matches ? "block" : "none";
  });
}

function setupCarousel() {
  const carousel = document.getElementById("hotTopicCarousel");
  const dots = document.querySelectorAll(".dot");
  let currentIndex = 0;

  // Setup dot navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      currentIndex = index;
      updateCarousel();
    });
  });

  function updateCarousel() {
    const cardWidth = carousel.querySelector(".hot-topic-card").offsetWidth;
    carousel.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  // Auto-advance carousel
  setInterval(() => {
    currentIndex = (currentIndex + 1) % dots.length;
    updateCarousel();
  }, 5000);
}

function setupLikeButtons() {
  // Use event delegation for dynamically added like buttons
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.like-btn')) {
      const likeBtn = e.target.closest('.like-btn');
      const eventId = likeBtn.dataset.eventId;
      const isLiked = likeBtn.classList.contains('liked');
      
      try {
        const response = await PartyDataService.toggleLike(eventId, !isLiked);
        
        if (response.success) {
          likeBtn.classList.toggle('liked', !isLiked);
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        // Still toggle the visual state for better UX
        likeBtn.classList.toggle('liked', !isLiked);
      }
    }
  });
}

function setupEventDetailsNavigation() {
  // Use event delegation for dynamically added see more buttons
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.see-more-btn')) {
      const seeMoreBtn = e.target.closest('.see-more-btn');
      const eventId = seeMoreBtn.dataset.eventId;
      
      if (eventId) {
        try {
          // Get event details and navigate
          const eventDetails = await PartyDataService.getEventDetails(eventId);
          navigateTo("/event-details", eventDetails);
        } catch (error) {
          console.error('Error getting event details:', error);
          // Fallback to mock data
          const mockEvent = PartyDataService.getMockEventDetails(eventId);
          navigateTo("/event-details", mockEvent);
        }
      }
    }
  });
}
