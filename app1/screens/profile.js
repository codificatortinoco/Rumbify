import { makeRequest, navigateTo, getCurrentUser, logout } from "../app.js";

export default function renderProfile() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="profile-screen">
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-picture-container">
          <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" alt="Profile" class="profile-picture" />
          <button class="camera-btn">
            <img src="assets/edit.svg" alt="Edit" class="camera-icon" />
          </button>
        </div>
        <h1 class="profile-name" id="profileName">KC Lember</h1>
        <p class="profile-email" id="profileEmail">DJKC@hotmail.com</p>
        <div class="user-type-badge" id="userTypeBadge">
          <span class="user-type-text">Member</span>
        </div>
        
        <!-- Stats -->
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number" id="attendedCount">12</span>
            <span class="stat-label">Attended</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="favoritesCount">5</span>
            <span class="stat-label">Favorites</span>
          </div>
        </div>
      </div>

      <!-- My Interests Section -->
      <div class="interests-section">
        <div class="section-header">
          <h2 class="section-title">My interests</h2>
          <button class="edit-btn" id="editInterestsBtn">Edit</button>
        </div>
        <div class="interests-tags" id="interestsTags">
          <!-- Interests will be loaded dynamically -->
        </div>
      </div>

      <!-- History Section -->
      <div class="history-section">
        <div class="section-header">
          <h2 class="section-title">History</h2>
          <button class="see-more-btn" id="seeMoreHistoryBtn">See more</button>
        </div>
        <div class="history-list" id="historyList">
          <!-- History items will be loaded dynamically -->
        </div>
      </div>

      <!-- Settings Menu -->
      <div class="settings-section">
        <div class="settings-list">
          <div class="settings-item" id="notificationsBtn">
            <img src="assets/notifications.svg" alt="Notifications" class="settings-icon" />
            <span class="settings-text">Notifications</span>
            <img src="assets/arrow.svg" alt="Arrow" class="arrow-icon" />
          </div>
          <div class="settings-item" id="editProfileBtn">
            <img src="assets/edit.svg" alt="Edit Profile" class="settings-icon" />
            <span class="settings-text">Edit profile</span>
            <img src="assets/arrow.svg" alt="Arrow" class="arrow-icon" />
          </div>
          <div class="settings-item" id="logoutBtn">
            <img src="assets/logOut.svg" alt="Logout" class="settings-icon" />
            <span class="settings-text">Logout</span>
          </div>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <div class="nav-item" data-nav="parties">
          <span class="nav-icon icon-party"></span>
          <span>Parties</span>
        </div>
        <div class="nav-item" data-nav="home">
          <span class="nav-icon icon-home"></span>
          <span>Home</span>
        </div>
        <div class="nav-item active" data-nav="profile">
          <span class="nav-icon icon-user"></span>
          <span>Profile</span>
        </div>
      </nav>
    </div>
  `;

  // Initialize profile functionality
  initializeProfile();
}

async function initializeProfile() {
  // Load user profile data
  await loadUserProfile();
  
  // Load user history
  await loadUserHistory();
  
  // Setup event listeners
  setupProfileEventListeners();
  
  // Setup bottom navigation
  setupBottomNavigation();
}

async function loadUserProfile() {
  try {
    // Get current logged-in user data
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      // Use logged-in user data
      document.getElementById("profileName").textContent = currentUser.name || "User";
      document.getElementById("profileEmail").textContent = currentUser.email || "user@example.com";
      document.getElementById("attendedCount").textContent = currentUser.attended_count || 0;
      document.getElementById("favoritesCount").textContent = currentUser.favorites_count || 0;
      
      // Update user type badge
      const userTypeBadge = document.getElementById("userTypeBadge");
      const userTypeText = document.querySelector(".user-type-text");
      if (currentUser.is_admin) {
        userTypeBadge.className = "user-type-badge admin";
        userTypeText.textContent = "Admin";
      } else {
        userTypeBadge.className = "user-type-badge member";
        userTypeText.textContent = "Member";
      }
      
      // Update profile picture
      const profilePicture = document.querySelector(".profile-picture");
      if (profilePicture && currentUser.profile_image) {
        profilePicture.src = currentUser.profile_image;
      }
      
      // Load user interests
      loadUserInterests(currentUser.interests || []);
      
      console.log("Profile loaded from logged-in user:", currentUser);
      return;
    }
    
    // Fallback: Try to fetch from Supabase API
    const userId = localStorage.getItem("currentUserId") || "1";
    
    try {
      const response = await makeRequest(`/users/${userId}/profile`, "GET");
      
      // Update profile information with real data
      document.getElementById("profileName").textContent = response.name || "User";
      document.getElementById("profileEmail").textContent = response.email || "user@example.com";
      document.getElementById("attendedCount").textContent = response.attended_count || 0;
      document.getElementById("favoritesCount").textContent = response.favorites_count || 0;
      
      // Update user type badge
      const userTypeBadge = document.getElementById("userTypeBadge");
      const userTypeText = document.querySelector(".user-type-text");
      if (response.is_admin) {
        userTypeBadge.className = "user-type-badge admin";
        userTypeText.textContent = "Admin";
      } else {
        userTypeBadge.className = "user-type-badge member";
        userTypeText.textContent = "Member";
      }
      
      // Update profile picture
      const profilePicture = document.querySelector(".profile-picture");
      if (profilePicture && response.profile_image) {
        profilePicture.src = response.profile_image;
      }

      // Load user interests
      loadUserInterests(response.interests || []);

      // Store user data for later use
      localStorage.setItem("currentUser", JSON.stringify(response));
      
      console.log("Profile loaded from Supabase:", response);
      
    } catch (apiError) {
      console.warn("API call failed, using fallback data:", apiError);
      
      // Fallback to mock data if API fails
      const mockUser = {
        id: 1,
        name: "KC Lember",
        email: "DJKC@hotmail.com",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        attended_count: 12,
        favorites_count: 5,
        interests: ["Disco Music", "Elegant", "Cocktailing"]
      };

      // Update profile information
      document.getElementById("profileName").textContent = mockUser.name;
      document.getElementById("profileEmail").textContent = mockUser.email;
      document.getElementById("attendedCount").textContent = mockUser.attended_count;
      document.getElementById("favoritesCount").textContent = mockUser.favorites_count;
      
      // Update profile picture
      const profilePicture = document.querySelector(".profile-picture");
      if (profilePicture) {
        profilePicture.src = mockUser.profile_image;
      }

      // Load user interests
      loadUserInterests(mockUser.interests || []);

      // Store user data for later use
      localStorage.setItem("currentUser", JSON.stringify(mockUser));
    }
    
  } catch (error) {
    console.error("Error loading user profile:", error);
    // Show error message or fallback data
  }
}

async function loadUserHistory() {
  try {
    // Try to get history from the profile data first
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    
    if (currentUser.history && Array.isArray(currentUser.history)) {
      // Use history from Supabase if available
      const historyList = document.getElementById("historyList");
      historyList.innerHTML = currentUser.history.map(item => `
        <div class="history-item">
          <img src="${item.image}" alt="${item.title}" class="history-image" />
          <div class="history-content">
            <h3 class="history-title">${item.title}</h3>
            <p class="history-date">${item.date} • ${item.status}</p>
          </div>
          <div class="history-status">
            <span class="status-icon">✓</span>
          </div>
        </div>
      `).join("");
      
      console.log("History loaded from Supabase:", currentUser.history);
      return;
    }
    
    // Fallback to mock history data
    console.warn("No history data from API, using mock data");
    const mockHistory = [
      {
        id: 1,
        title: "Pre-New Year Party",
        date: "22/11/21",
        status: "Attended",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop",
        status_icon: "✓"
      },
      {
        id: 2,
        title: "Lore's Pool Party",
        date: "11/10/21",
        status: "Attended",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop",
        status_icon: "✓"
      },
      {
        id: 3,
        title: "Chicago Night",
        date: "5/9/21",
        status: "Not Attended",
        image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=80&h=80&fit=crop",
        status_icon: "✓"
      }
    ];

    const historyList = document.getElementById("historyList");
    historyList.innerHTML = mockHistory.map(item => `
      <div class="history-item">
        <img src="${item.image}" alt="${item.title}" class="history-image" />
        <div class="history-content">
          <h3 class="history-title">${item.title}</h3>
          <p class="history-date">${item.date} • ${item.status}</p>
        </div>
        <div class="history-status">
          <span class="status-icon">${item.status_icon}</span>
        </div>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error loading user history:", error);
  }
}

function loadUserInterests(interests) {
  const interestsContainer = document.getElementById("interestsTags");
  
  if (!interests || interests.length === 0) {
    interestsContainer.innerHTML = `
      <div class="no-interests">
        <p>No interests selected yet</p>
        <button class="add-interests-btn" onclick="navigateTo('/edit-profile')">Add Interests</button>
      </div>
    `;
    return;
  }

  // Map interest names to their corresponding CSS classes and icons
  const interestConfig = {
    "Disco Music": { class: "disco", icon: "assets/partyIcon.svg" },
    "Elegant": { class: "elegant", icon: "assets/edit.svg" },
    "Cocktailing": { class: "cocktail", icon: "assets/partyIcon.svg" },
    "House Music": { class: "house", icon: "assets/partyIcon.svg" },
    "Techno": { class: "techno", icon: "assets/partyIcon.svg" },
    "Jazz": { class: "jazz", icon: "assets/partyIcon.svg" },
    "Rock": { class: "rock", icon: "assets/partyIcon.svg" },
    "Pop": { class: "pop", icon: "assets/partyIcon.svg" },
    "Electronic": { class: "electronic", icon: "assets/partyIcon.svg" },
    "Classical": { class: "classical", icon: "assets/partyIcon.svg" },
    "Hip Hop": { class: "hiphop", icon: "assets/partyIcon.svg" },
    "R&B": { class: "rnb", icon: "assets/partyIcon.svg" },
    "Reggae": { class: "reggae", icon: "assets/partyIcon.svg" },
    "Country": { class: "country", icon: "assets/partyIcon.svg" },
    "Blues": { class: "blues", icon: "assets/partyIcon.svg" },
    "Folk": { class: "folk", icon: "assets/partyIcon.svg" },
    "Indie": { class: "indie", icon: "assets/partyIcon.svg" },
    "Alternative": { class: "alternative", icon: "assets/partyIcon.svg" }
  };

  interestsContainer.innerHTML = interests.map(interest => {
    const config = interestConfig[interest] || { class: "default", icon: "assets/partyIcon.svg" };
    return `
      <div class="interest-tag ${config.class}">
        <img src="${config.icon}" alt="${interest}" class="tag-icon" />
        <span>${interest}</span>
      </div>
    `;
  }).join("");

  console.log("Interests loaded:", interests);
}

function setupProfileEventListeners() {
  // Edit interests button
  document.getElementById("editInterestsBtn").addEventListener("click", () => {
    console.log("Edit interests clicked");
    navigateTo("/edit-profile");
  });

  // See more history button
  document.getElementById("seeMoreHistoryBtn").addEventListener("click", () => {
    console.log("See more history clicked");
    // TODO: Navigate to full history page
  });

  // Settings menu items
  document.getElementById("notificationsBtn").addEventListener("click", () => {
    console.log("Notifications clicked");
    // TODO: Navigate to notifications settings
  });

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    console.log("Edit profile clicked");
    navigateTo("/edit-profile");
  });


  document.getElementById("logoutBtn").addEventListener("click", () => {
    console.log("Logout clicked");
    handleLogout();
  });

  // Camera button for profile picture
  document.querySelector(".camera-btn").addEventListener("click", () => {
    console.log("Change profile picture clicked");
    // TODO: Implement profile picture change
  });
}

function handleLogout() {
  // Use the global logout function
  logout();
  // Redirect to welcome after clearing session
  navigateTo("/welcome");
}

function setupBottomNavigation() {
  const navItems = document.querySelectorAll(".bottom-nav .nav-item");
  
  navItems.forEach(item => {
    item.style.touchAction = "manipulation";
    item.addEventListener("click", () => {
      // Remove active class from all items
      navItems.forEach(nav => nav.classList.remove("active"));
      
      // Add active class to clicked item
      item.classList.add("active");
      
      // Handle navigation
      const target = item.dataset.nav;
      switch (target) {
        case "parties":
        case "My Parties":
          navigateTo("/parties");
          break;
        case "home":
        case "Home":
          navigateTo("/home");
          break;
        case "profile":
        case "Profile":
          // Already on profile page
          break;
      }
    });
  });
}
