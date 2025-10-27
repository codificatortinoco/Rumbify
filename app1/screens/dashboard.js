import { makeRequest, navigateTo, getCurrentUser } from "../app.js";

// Configuration for data source
const CONFIG = {
  USE_MOCK_DATA: false, 
  API_ENDPOINTS: {
    HOT_TOPIC: "/parties/hot-topic",
    UPCOMING: "/parties/upcoming",
    SEARCH: "/parties/search",
    LIKE: "/parties"
  }
};

let dashboardController = {
  isActive: false,
  abortController: null,
  isLoading: false
};

export default function renderDashboard() {
  const currentUser = getCurrentUser();
  const userName = currentUser?.name || "User";
  
  dashboardController.isActive = true;
  if (dashboardController.abortController) {
    dashboardController.abortController.abort();
  }
  dashboardController.abortController = new AbortController();
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="dashboard">
      <!-- Header Section -->
      <header class="dashboard-header">
        <div class="profile-section" id="headerProfileBtn">
          <div class="profile-pic">
            <img src="${currentUser?.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'}" alt="Profile" />
          </div>
          <div class="profile-info">
            <h3>Welcome, ${userName}</h3>
            <span class="member-badge">Member</span>
          </div>
        </div>
        <div class="notification-bell">
          Notificaciones
        </div>
      </header>

      <!-- Search Section -->
      <div class="search-section">
        <div class="search-bar">
          <span class="search-icon">Buscar</span>
          <input type="text" placeholder="Search Party..." id="searchInput" />
        </div>

        <!-- Categories Row -->
        <div class="filter-bar" id="categoryBar">
          <button class="filter-pill active" data-category="">All</button>
          <button class="filter-pill" data-category="hot-topic">Hot Topic</button>
          <button class="filter-pill" data-category="upcoming">Upcoming</button>
        </div>

        <!-- Tags Row -->
        <div class="filter-bar tags" id="tagsBar">
          <!-- Tag pills will be injected dynamically on load -->
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
        <div class="nav-item active" data-nav="Parties">
          <span class="nav-icon icon-party"></span>
          <span>Parties</span>
        </div>
        <div class="nav-item" data-nav="Home">
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

  initializeDashboard();
}

function initializeDashboard() {
  // Load party data
  loadPartyData();
  
  setupSearch();
  setupFilters();
  
  setupLikeButtons();
  
  setupEventDetailsNavigation();
  
  setupBottomNavigation();
  
  setupHeaderProfileButton();
}

// Data Service Layer
class PartyDataService {
  static async getHotTopicParties() {
    console.log("getHotTopicParties - USE_MOCK_DATA:", CONFIG.USE_MOCK_DATA);
    
    if (CONFIG.USE_MOCK_DATA) {
      console.log("Using mock data for hot topic parties");
      return this.getMockHotTopicParties();
    }
    
    try {
      console.log("Making API request to:", CONFIG.API_ENDPOINTS.HOT_TOPIC);
      const response = await makeRequest(CONFIG.API_ENDPOINTS.HOT_TOPIC, "GET");
      console.log("API response received:", response.length, "parties");
      return response;
    } catch (error) {
      console.error("Error fetching hot topic parties:", error);
      throw new Error("No se pudo conectar con la base de datos. Verifica que Supabase esté configurado correctamente.");
    }
  }

  static async getUpcomingParties() {
    console.log("getUpcomingParties - USE_MOCK_DATA:", CONFIG.USE_MOCK_DATA);
    
    if (CONFIG.USE_MOCK_DATA) {
      console.log("Using mock data for upcoming parties");
      return this.getMockUpcomingParties();
    }
    
    try {
      console.log("Making API request to:", CONFIG.API_ENDPOINTS.UPCOMING);
      const response = await makeRequest(CONFIG.API_ENDPOINTS.UPCOMING, "GET");
      console.log("API response received:", response.length, "parties");
      return response;
    } catch (error) {
      console.error("Error fetching upcoming parties:", error);
      throw new Error("No se pudo conectar con la base de datos. Verifica que Supabase esté configurado correctamente.");
    }
  }

  static async searchParties(query) {
    // Overloaded: can receive object or string
    if (typeof query === "object") {
      const { q = "", tags = [], category = "" } = query || {};
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (Array.isArray(tags) && tags.length) params.set("tags", tags.join(","));
        if (category) params.set("category", category);
        const response = await makeRequest(`${CONFIG.API_ENDPOINTS.SEARCH}?${params.toString()}`, "GET");
        return response;
      } catch (error) {
        console.error("Error searching parties with filters:", error);
        throw error;
      }
    }
    if (CONFIG.USE_MOCK_DATA) {
      return this.searchMockParties(query);
    }
    
    try {
      const response = await makeRequest(`${CONFIG.API_ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`, "GET");
      return response;
    } catch (error) {
      console.error("Error searching parties:", error);
      throw new Error("No se pudo realizar la búsqueda. Verifica que Supabase esté configurado correctamente.");
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
      throw new Error("No se pudo actualizar el like. Verifica que Supabase esté configurado correctamente.");
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
      throw new Error("No se pudo obtener los detalles del evento. Verifica que Supabase esté configurado correctamente.");
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
    // Support string or object
    if (typeof query === "object") {
      const { q = "", tags = [], category = "" } = query || {};
      return allParties.filter(party => {
        const matchesText = !q || party.title.toLowerCase().includes(q.toLowerCase()) ||
          party.administrator.toLowerCase().includes(q.toLowerCase()) ||
          party.location.toLowerCase().includes(q.toLowerCase());
        const matchesCategory = !category || party.category === category;
        const matchesTags = !tags?.length || tags.every(t => party.tags?.includes(t));
        return matchesText && matchesCategory && matchesTags;
      });
    }
    const q = String(query || "");
    return allParties.filter(party => 
      party.title.toLowerCase().includes(q.toLowerCase()) ||
      party.administrator.toLowerCase().includes(q.toLowerCase()) ||
      party.location.toLowerCase().includes(q.toLowerCase())
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
  if (!dashboardController.isActive || dashboardController.isLoading) {
    console.log("Dashboard no longer active or already loading, skipping data load");
    return;
  }

  dashboardController.isLoading = true;
  showLoadingState();

  try {
    const hotTopicEvents = await PartyDataService.getHotTopicParties();
    
    if (!dashboardController.isActive) {
      console.log("Dashboard no longer active, skipping hot topic render");
      return;
    }
    renderHotTopicEvents(hotTopicEvents);
    
    const upcomingEvents = await PartyDataService.getUpcomingParties();
    
    if (!dashboardController.isActive) {
      console.log("Dashboard no longer active, skipping upcoming render");
      return;
    }
    renderUpcomingEvents(upcomingEvents);
    
    hideLoadingState();
  } catch (error) {
    console.error("Error loading party data:", error);
    
    if (dashboardController.isActive) {
      hideLoadingState();
      showDatabaseError(error.message);
    }
  } finally {
    dashboardController.isLoading = false;
  }
}

function showDatabaseError(message) {
  if (!dashboardController.isActive) {
    return;
  }

  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div id="error-container" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
      background: #f5f5f5;
      color: #333;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 500px;
        width: 100%;
      ">
        <h2 style="margin: 0 0 15px 0; font-size: 24px; color: #e74c3c;">Error de Conexión</h2>
        <p style="margin: 0 0 20px 0; line-height: 1.5; color: #666;">
          ${message || 'No se pudo conectar con la base de datos.'}
        </p>
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #999;">
          Verifica tu conexión a internet y que el servidor esté funcionando correctamente.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button onclick="retryConnection()" style="
            background: #3498db;
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">
            Reintentar
          </button>
          <button onclick="navigateTo('/member-dashboard')" style="
            background: #95a5a6;
            border: none;
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">
            Ir a Inicio
          </button>
        </div>
      </div>
    </div>
  `;
}

window.retryConnection = function() {
  if (dashboardController.isActive) {
    loadPartyData();
  }
};

function showLoadingState() {
  const hotTopicCarousel = document.getElementById("hotTopicCarousel");
  const upcomingEvents = document.getElementById("upcomingEvents");
  
  if (hotTopicCarousel) {
    hotTopicCarousel.innerHTML = '<div class="loading-spinner">Cargando eventos...</div>';
  }
  
  if (upcomingEvents) {
    upcomingEvents.innerHTML = '<div class="loading-spinner">Cargando eventos próximos...</div>';
  }
}

function hideLoadingState() {
}

function renderHotTopicEvents(events) {
  const carousel = document.getElementById("hotTopicCarousel");
  const dots = document.getElementById("hotTopicDots");
  
  if (!carousel || !dots) {
    console.warn("Hot topic elements not found, skipping render");
    return;
  }
  
  if (!events || !Array.isArray(events)) {
    carousel.innerHTML = "";
    dots.innerHTML = "";
    carouselController.isInitialized = false;
    return;
  }
  
  // Pick 5 random parties from hot topic events
  const shuffled = events.sort(() => 0.5 - Math.random());
  const selectedEvents = shuffled.slice(0, Math.min(5, events.length));
  
  carousel.innerHTML = selectedEvents.map(event => createHotTopicCard(event)).join("");
  dots.innerHTML = selectedEvents.map((_, index) => 
    `<div class="dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`
  ).join("");
  
  // Setup carousel functionality after content is rendered
  setTimeout(() => {
    setupCarousel();
  }, 100);
}

function renderUpcomingEvents(events) {
  const container = document.getElementById("upcomingEvents");
  
  if (!container) {
    console.warn("Element 'upcomingEvents' not found, skipping render");
    return;
  }
  
  if (!events || !Array.isArray(events)) {
    container.innerHTML = "";
    return;
  }
  
  // Pick 5 random parties from upcoming events
  const shuffled = events.sort(() => 0.5 - Math.random());
  const selectedEvents = shuffled.slice(0, Math.min(5, events.length));
  
  container.innerHTML = selectedEvents.map(event => createUpcomingCard(event)).join("");
}

function createHotTopicCard(event) {
  const displayPrice = event.price || (Array.isArray(event.prices) && event.prices.length ? event.prices[0].price : "");
  return `
    <div class="hot-topic-card">
      <div class="card-image">
        <img src="${event.image}" alt="${event.title}" />
        <button class="like-btn ${event.liked ? 'liked' : ''}" data-event-id="${event.id}">
          ${event.liked ? 'Me gusta' : 'Like'}
        </button>
      </div>
      <div class="card-content">
        <div class="card-header">
          <h3 class="event-title">${event.title}</h3>
          <span class="attendees">${event.attendees}</span>
        </div>
        <div class="event-details">
          <div class="detail-item">
            <span>${event.location}</span>
          </div>
          <div class="detail-item">
            <span>${event.date}</span>
          </div>
          <div class="detail-item">
            <span>${event.administrator}</span>
          </div>
          <div class="price">${displayPrice}</div>
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
  const displayPrice = event.price || (Array.isArray(event.prices) && event.prices.length ? event.prices[0].price : "");
  return `
    <div class="upcoming-card">
      <div class="card-image">
        <img src="${event.image}" alt="${event.title}" />
      </div>
      <div class="card-content">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-details">
          <div class="detail-item">
            <span>${event.location}</span>
          </div>
          <div class="detail-item">
            <span>${event.date}</span>
          </div>
          <div class="detail-item">
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
  const categoryBar = document.getElementById("categoryBar");
  let selectedCategory = "";
  let selectedTags = [];
  let searchTimeout;
  
  searchInput.addEventListener("input", async (e) => {
    const searchTerm = e.target.value.trim();
    
    // Clear previous timeout
    clearTimeout(searchTimeout);
    
    if (searchTerm.length === 0 && !selectedCategory && selectedTags.length === 0) {
      // If search is empty, reload all data
      loadPartyData();
      return;
    }
    
    // Debounce search to avoid too many API calls
    searchTimeout = setTimeout(async () => {
      try {
        if (!dashboardController.isActive) {
          return;
        }
        
        const searchResults = await PartyDataService.searchParties({ q: searchTerm, tags: selectedTags, category: selectedCategory });
        
        if (!dashboardController.isActive) {
          return;
        }
        
        displaySearchResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        
        if (dashboardController.isActive) {
          filterEventsLocally(searchTerm, selectedTags, selectedCategory);
        }
      }
    }, 300);
  });

  // Category click handling
  categoryBar.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (!pill) return;
    // Toggle active state: single-select
    categoryBar.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');
    selectedCategory = pill.dataset.category || "";

    triggerSearch();
  });

  setupSearch._setSelectedTags = (tags) => {
    selectedTags = tags;
    triggerSearch();
  };

  function triggerSearch() {
    const q = searchInput.value.trim();
    if (!q && !selectedCategory && selectedTags.length === 0) {
      loadPartyData();
      return;
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      try {
        const results = await PartyDataService.searchParties({ q, tags: selectedTags, category: selectedCategory });
        displaySearchResults(results);
      } catch (err) {
        console.error('Search with filters failed:', err);
        filterEventsLocally(q, selectedTags, selectedCategory);
      }
    }, 150);
  }
}

function displaySearchResults(results) {
  // Separate results by category
  const hotTopicResults = results.filter(party => party.category === "hot-topic");
  const upcomingResults = results.filter(party => party.category === "upcoming");
  
  // Render filtered results
  renderHotTopicEvents(hotTopicResults);
  renderUpcomingEvents(upcomingResults);
}

function filterEventsLocally(searchTerm, tags = [], category = "") {
  // Fallback client-side filtering
  const hotTopicCards = document.querySelectorAll(".hot-topic-card");
  hotTopicCards.forEach(card => {
    const title = card.querySelector(".event-title").textContent.toLowerCase();
    const location = card.querySelector(".detail-item span").textContent.toLowerCase();
    const administrator = card.querySelectorAll(".detail-item span")[2].textContent.toLowerCase();
    const tagTexts = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.trim());
    
    const matchesText = !searchTerm || title.includes(searchTerm) || location.includes(searchTerm) || administrator.includes(searchTerm);
    const matchesTags = !tags?.length || tags.every(t => tagTexts.includes(t));
    const matchesCategory = !category || card.closest('.hot-topic-card'); // hot-topic section
    const matches = matchesText && matchesTags && (!category || category === 'hot-topic');
    card.style.display = matches ? "block" : "none";
  });

  const upcomingCards = document.querySelectorAll(".upcoming-card");
  upcomingCards.forEach(card => {
    const title = card.querySelector(".event-title").textContent.toLowerCase();
    const location = card.querySelector(".detail-item span").textContent.toLowerCase();
    const administrator = card.querySelectorAll(".detail-item span")[2].textContent.toLowerCase();
    const tagTexts = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.trim());
    
    const matchesText = !searchTerm || title.includes(searchTerm) || location.includes(searchTerm) || administrator.includes(searchTerm);
    const matchesTags = !tags?.length || tags.every(t => tagTexts.includes(t));
    const matches = matchesText && matchesTags && (!category || category === 'upcoming');
    card.style.display = matches ? "block" : "none";
  });
}

let carouselController = {
  currentIndex: 0,
  intervalId: null,
  isInitialized: false,
  isDragging: false,
  startX: 0,
  currentX: 0,
  threshold: 50, // Minimum distance for swipe
  carouselElement: null,
  eventHandlers: {
    touchStart: null,
    touchMove: null,
    touchEnd: null,
    mouseDown: null,
    mouseMove: null,
    mouseUp: null,
    mouseLeave: null,
    selectStart: null,
    scroll: null
  }
};

function setupCarousel() {
  // This function will be called after data is loaded
  const carousel = document.getElementById("hotTopicCarousel");
  const dots = document.querySelectorAll(".dot");
  
  if (!carousel || dots.length === 0) {
    console.warn("Carousel elements not found or no dots available");
    return;
  }

  // Clear any existing interval
  if (carouselController.intervalId) {
    clearInterval(carouselController.intervalId);
  }

  carouselController.currentIndex = 0;
  carouselController.isInitialized = true;
  carouselController.carouselElement = carousel;

  // Setup dot navigation
  dots.forEach((dot, index) => {
    // Remove any existing event listeners
    dot.replaceWith(dot.cloneNode(true));
  });

  // Re-query dots after cloning
  const freshDots = document.querySelectorAll(".dot");

  function updateCarousel() {
    if (!carouselController.isInitialized) return;
    
    const cards = carousel.querySelectorAll(".hot-topic-card");
    if (cards.length === 0) return;
    
    // Get card width, with fallback to container width if card width is 0
    let cardWidth = cards[0].offsetWidth;
    if (cardWidth === 0) {
      cardWidth = carousel.offsetWidth;
    }
    
    // Ensure currentIndex is within bounds
    carouselController.currentIndex = Math.max(0, Math.min(carouselController.currentIndex, cards.length - 1));
    
    // Update dot indicators
    freshDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === carouselController.currentIndex);
    });
  }

  // Touch/Swipe functionality
  carouselController.eventHandlers.touchStart = function(e) {
    carouselController.isDragging = true;
    carouselController.startX = e.touches[0].clientX;
    carouselController.currentX = carouselController.startX;
    
    // Pause auto-advance while dragging
    if (carouselController.intervalId) {
      clearInterval(carouselController.intervalId);
    }
    
    carousel.style.transition = 'none';
  };

  carouselController.eventHandlers.touchMove = function(e) {
    if (!carouselController.isDragging) return;
    
    carouselController.currentX = e.touches[0].clientX;
    const deltaX = carouselController.currentX - carouselController.startX;
    
    const cards = carousel.querySelectorAll(".hot-topic-card");
    if (cards.length === 0) return;
    
    let cardWidth = cards[0].offsetWidth;
    if (cardWidth === 0) {
      cardWidth = carousel.offsetWidth;
    }
    
    const baseTransform = carouselController.currentIndex * cardWidth;
    carousel.scrollLeft = baseTransform - deltaX;
  };

  carouselController.eventHandlers.touchEnd = function(e) {
    if (!carouselController.isDragging) return;
    
    carouselController.isDragging = false;
    carousel.style.transition = '';
    
    const deltaX = carouselController.currentX - carouselController.startX;
    const cards = carousel.querySelectorAll(".hot-topic-card");
    
    if (cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth || carousel.offsetWidth;
    
    // Determine if we should change slides based on swipe
    if (Math.abs(deltaX) > carouselController.threshold) {
      if (deltaX > 0 && carouselController.currentIndex > 0) {
        // Swipe right - go to previous slide
        carouselController.currentIndex--;
      } else if (deltaX < 0 && carouselController.currentIndex < cards.length - 1) {
        // Swipe left - go to next slide
        carouselController.currentIndex++;
      }
      
      // Scroll to the new position
      carousel.scrollTo({
        left: carouselController.currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  // Mouse drag functionality (for desktop)
  carouselController.eventHandlers.mouseDown = function(e) {
    carouselController.isDragging = true;
    carouselController.startX = e.clientX;
    carouselController.currentX = carouselController.startX;
    
    // Pause auto-advance while dragging
    if (carouselController.intervalId) {
      clearInterval(carouselController.intervalId);
    }
    
    carousel.style.transition = 'none';
    e.preventDefault();
  };

  carouselController.eventHandlers.mouseMove = function(e) {
    if (!carouselController.isDragging) return;
    
    carouselController.currentX = e.clientX;
    const deltaX = carouselController.currentX - carouselController.startX;
    
    const cards = carousel.querySelectorAll(".hot-topic-card");
    if (cards.length === 0) return;
    
    let cardWidth = cards[0].offsetWidth;
    if (cardWidth === 0) {
      cardWidth = carousel.offsetWidth;
    }
    
    const baseTransform = carouselController.currentIndex * cardWidth;
    carousel.scrollLeft = baseTransform - deltaX;
  };

  carouselController.eventHandlers.mouseUp = function(e) {
    if (!carouselController.isDragging) return;
    
    carouselController.isDragging = false;
    carousel.style.transition = '';
    
    const deltaX = carouselController.currentX - carouselController.startX;
    const cards = carousel.querySelectorAll(".hot-topic-card");
    
    if (cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth || carousel.offsetWidth;
    
    // Determine if we should change slides based on drag
    if (Math.abs(deltaX) > carouselController.threshold) {
      if (deltaX > 0 && carouselController.currentIndex > 0) {
        // Drag right - go to previous slide
        carouselController.currentIndex--;
      } else if (deltaX < 0 && carouselController.currentIndex < cards.length - 1) {
        // Drag left - go to next slide
        carouselController.currentIndex++;
      }
      
      // Scroll to the new position
      carousel.scrollTo({
        left: carouselController.currentIndex * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  carouselController.eventHandlers.mouseLeave = carouselController.eventHandlers.mouseUp; // Same as mouseUp
  carouselController.eventHandlers.selectStart = function(e) {
    if (carouselController.isDragging) {
      e.preventDefault();
    }
  };

  // Handle scroll events for horizontal scrolling
  carouselController.eventHandlers.scroll = function(e) {
    if (carouselController.isDragging) return; // Don't interfere with drag/swipe
    
    const cards = carousel.querySelectorAll(".hot-topic-card");
    if (cards.length === 0) return;
    
    const cardWidth = cards[0].offsetWidth || carousel.offsetWidth;
    const scrollLeft = carousel.scrollLeft;
    const newIndex = Math.round(scrollLeft / cardWidth);
    
    if (newIndex !== carouselController.currentIndex && newIndex >= 0 && newIndex < cards.length) {
      carouselController.currentIndex = newIndex;
      
      // Update dots
      const freshDots = document.querySelectorAll(".dot");
      freshDots.forEach((dot, index) => {
        dot.classList.toggle("active", index === carouselController.currentIndex);
      });
    }
  };
  
  // Handle manual dot clicks with native scroll
  freshDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const cards = carousel.querySelectorAll(".hot-topic-card");
      if (cards.length === 0) return;
      
      const cardWidth = cards[0].offsetWidth || carousel.offsetWidth;
      carouselController.currentIndex = index;
      carousel.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    });
  });

  // Add event listeners for touch events
  carousel.addEventListener('touchstart', carouselController.eventHandlers.touchStart, { passive: false });
  carousel.addEventListener('touchmove', carouselController.eventHandlers.touchMove, { passive: false });
  carousel.addEventListener('touchend', carouselController.eventHandlers.touchEnd, { passive: false });

  // Add event listeners for mouse events (desktop)
  carousel.addEventListener('mousedown', carouselController.eventHandlers.mouseDown);
  carousel.addEventListener('mousemove', carouselController.eventHandlers.mouseMove);
  carousel.addEventListener('mouseup', carouselController.eventHandlers.mouseUp);
  carousel.addEventListener('mouseleave', carouselController.eventHandlers.mouseLeave); // Handle mouse leaving the carousel

  // Prevent text selection while dragging
  carousel.addEventListener('selectstart', carouselController.eventHandlers.selectStart);

  // Add scroll event listener for horizontal scrolling
  carousel.addEventListener('scroll', carouselController.eventHandlers.scroll);

  // Auto-advance carousel - DISABLED
  // if (freshDots.length > 1) {
  //   carouselController.intervalId = setInterval(() => {
  //     carouselController.currentIndex = (carouselController.currentIndex + 1) % freshDots.length;
  //     updateCarousel();
  //   }, 5000);
  // }

  // Initialize the carousel position
  updateCarousel();
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

function setupBottomNavigation() {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  
  navItems.forEach(item => {
    // Mejor respuesta táctil en móviles
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
          navigateTo("/member-dashboard");
          break;
        case "Profile":
          navigateTo("/profile");
          break;
      }
    });
  });
}

function setupHeaderProfileButton() {
  const headerProfileBtn = document.getElementById('headerProfileBtn');
  if (headerProfileBtn) {
    headerProfileBtn.style.cursor = 'pointer';
    headerProfileBtn.addEventListener('click', () => {
      navigateTo("/profile");
    });
  }
}

function setupFilters() {
  const tagsBar = document.getElementById('tagsBar');
  const DEFAULT_TAGS = [
    "Disco Music", "Elegant", "Cocktailing", "Electronic", "Neon", "Summer", "Outdoor", "House", "Techno"
  ];
  tagsBar.innerHTML = DEFAULT_TAGS.map(t => `<button class="filter-pill" data-tag="${t}">${t}</button>`).join("");

  const activeTags = new Set();

  tagsBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    const tag = pill.dataset.tag;
    if (pill.classList.contains('active')) {
      pill.classList.remove('active');
      activeTags.delete(tag);
    } else {
      pill.classList.add('active');
      activeTags.add(tag);
    }
    if (typeof setupSearch._setSelectedTags === 'function') {
      setupSearch._setSelectedTags(Array.from(activeTags));
    }
  });
}

export function cleanupDashboard() {
  dashboardController.isActive = false;
  dashboardController.isLoading = false;
  if (dashboardController.abortController) {
    dashboardController.abortController.abort();
  }
  
  // Clean up carousel
  if (carouselController.intervalId) {
    clearInterval(carouselController.intervalId);
    carouselController.intervalId = null;
  }
  
  // Remove event listeners from carousel
  if (carouselController.carouselElement && carouselController.eventHandlers.touchStart) {
    const carousel = carouselController.carouselElement;
    carousel.removeEventListener('touchstart', carouselController.eventHandlers.touchStart);
    carousel.removeEventListener('touchmove', carouselController.eventHandlers.touchMove);
    carousel.removeEventListener('touchend', carouselController.eventHandlers.touchEnd);
    carousel.removeEventListener('mousedown', carouselController.eventHandlers.mouseDown);
    carousel.removeEventListener('mousemove', carouselController.eventHandlers.mouseMove);
    carousel.removeEventListener('mouseup', carouselController.eventHandlers.mouseUp);
    carousel.removeEventListener('mouseleave', carouselController.eventHandlers.mouseLeave);
    carousel.removeEventListener('selectstart', carouselController.eventHandlers.selectStart);
    carousel.removeEventListener('scroll', carouselController.eventHandlers.scroll);
  }
  
  carouselController.isInitialized = false;
  carouselController.isDragging = false;
  carouselController.carouselElement = null;
}
