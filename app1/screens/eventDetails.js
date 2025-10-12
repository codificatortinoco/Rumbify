import { makeRequest, navigateTo } from "../app.js";

// Configuration for data source
const CONFIG = {
  USE_MOCK_DATA: true, // Set to false when Supabase is ready
  API_ENDPOINTS: {
    EVENT_DETAILS: "/parties"
  }
};

export default function renderEventDetails(eventData) {
  const app = document.getElementById("app");

  function renderPriceListHTML(evt) {
    const pricesList = Array.isArray(evt?.prices) && evt.prices.length
      ? evt.prices
      : (evt?.price ? [{ price_name: "Ticket", price: evt.price }] : []);
    if (!pricesList.length) return `<div class="price-item"><span class="price-name">No tickets</span></div>`;
    return pricesList.map(p => `
      <div class="price-item">
        <span class="price-name">${p.price_name}</span>
        <span class="price-amount">${p.price}</span>
      </div>
    `).join("");
  }

  app.innerHTML = `
    <div id="event-details">
      <!-- Event Header -->
      <header class="event-header">
        <button class="back-btn" id="backBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="event-title-header">Party Details</h1>
        <span class="attendees-count">${eventData.attendees}</span>
      </header>

      <!-- Event Overview -->
      <div class="event-overview">
        <h2 class="main-event-title">${eventData.title}</h2>
        
        <div class="organizer-info">
          <div class="organizer-avatar">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" alt="Organizer" />
          </div>
          <div class="organizer-details">
            <div class="organizer-name">${eventData.administrator}</div>
            <div class="organizer-phone">+57 3016531423</div>
          </div>
        </div>

        <div class="event-tags">
          ${eventData.tags.map((tag, index) => `
            <div class="event-tag">
              ${index === 0 ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'}
              ${tag}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Event Image -->
      <div class="event-image-section">
        <div class="event-image">
          <img src="${eventData.image}" alt="${eventData.title}" />
        </div>
      </div>

      <!-- Tickets and Location -->
      <div class="price-location">
        <div class="prices-list">
          ${renderPriceListHTML(eventData)}
        </div>
        <div class="location-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${eventData.location}</span>
        </div>
        <p class="event-description">We do not need to be in the 31st of December to party as God intended.</p>
      </div>

      <!-- Event Info -->
      <div class="event-info">
        <div class="info-section">
          <h3 class="info-title">Inclusions</h3>
          <ul class="info-list">
            <li>Drink of courtesy</li>
            <li>After midnight kiss dinamic</li>
          </ul>
        </div>

        <div class="info-section">
          <h3 class="info-title">Dress code</h3>
          <ul class="info-list">
            <li>Neon Colors</li>
            <li>No formal attire required</li>
            <li>Comfortable dancing shoes</li>
          </ul>
        </div>
      </div>

      <!-- Opening Hours -->
      <div class="opening-hours">
        <h3 class="opening-title">Opening Hour</h3>
        <div class="time-display">
          <div class="time-box">
            <span class="time-number">9</span>
            <span class="time-label">Hour</span>
          </div>
          <span class="time-separator">:</span>
          <div class="time-box">
            <span class="time-number">30</span>
            <span class="time-label">Minute</span>
          </div>
          <div class="time-box">
            <span class="time-number">PM</span>
          </div>
        </div>
      </div>

      <!-- Calendar -->
      <div class="calendar-section">
        <div class="calendar">
          <div class="calendar-header">
            <h3>November 2021</h3>
          </div>
          <div class="calendar-grid">
            <div class="calendar-weekdays">
              <div class="weekday">S</div>
              <div class="weekday">M</div>
              <div class="weekday">T</div>
              <div class="weekday">W</div>
              <div class="weekday">T</div>
              <div class="weekday">F</div>
              <div class="weekday">S</div>
            </div>
            <div class="calendar-days" id="calendarDays">
              <!-- Calendar days will be generated dynamically -->
            </div>
          </div>
        </div>
      </div>

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
          <span>New Party</span>
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

  // Initialize event details functionality
  initializeEventDetails(eventData);
}

function initializeEventDetails(eventData) {
  // Setup back button
  setupBackButton();
  
  // Setup calendar
  setupCalendar();
  
  // Setup bottom navigation
  setupBottomNavigation();
}

function setupBackButton() {
  const backBtn = document.getElementById("backBtn");
  backBtn.addEventListener("click", () => {
    navigateTo("/dashboard");
  });
}

function setupCalendar() {
  const calendarDays = document.getElementById("calendarDays");
  
  // Generate calendar days for November 2021
  const days = [];
  
  // Add empty cells for days before the 1st (November 1st was a Monday)
  for (let i = 0; i < 1; i++) {
    days.push('<div class="calendar-day empty"></div>');
  }
  
  // Add days 1-30
  for (let day = 1; day <= 30; day++) {
    const isEventDay = day === 22; // Highlight the 22nd as the event day
    days.push(`
      <div class="calendar-day ${isEventDay ? 'event-day' : ''}">
        ${day}
      </div>
    `);
  }
  
  calendarDays.innerHTML = days.join("");
}

function setupBottomNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Remove active class from all items
      navItems.forEach(nav => nav.classList.remove("active"));
      
      // Add active class to clicked item
      item.classList.add("active");
      
      // Handle navigation
      const text = item.querySelector("span").textContent;
      switch (text) {
        case "Parties":
          navigateTo("/dashboard");
          break;
        case "New Party":
          window.location.assign("/app2/create-party");
          break;
        case "Profile":
          console.log("Profile clicked");
          break;
      }
    });
  });
}

// Data Service for Event Details
class EventDetailsService {
  static async getEventDetails(eventId) {
    if (CONFIG.USE_MOCK_DATA) {
      return this.getMockEventDetails(eventId);
    }
    
    try {
      const response = await makeRequest(`${CONFIG.API_ENDPOINTS.EVENT_DETAILS}/${eventId}`, "GET");
      return response;
    } catch (error) {
      console.error("Error fetching event details:", error);
      return this.getMockEventDetails(eventId);
    }
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
        prices: [
          { price_name: "Normal Ticket", price: "$65.000" },
          { price_name: "VIP", price: "$90.000" }
        ],
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
        prices: [
          { price_name: "General", price: "$45.000" },
          { price_name: "Premium", price: "$65.000" }
        ],
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
        prices: [
          { price_name: "Normal", price: "$80.000" },
          { price_name: "VIP", price: "$120.000" }
        ],
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
        prices: [
          { price_name: "General", price: "$55.000" },
          { price_name: "Front Row", price: "$70.000" }
        ],
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

// Export the service for use in other components
export { EventDetailsService };
