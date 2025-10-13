import { makeRequest, navigateTo } from "../app.js";

export default function renderProfile() {
  console.log('renderProfile called in app2');
  const app = document.getElementById("app");
  
  // Force reload CSS to ensure latest styles are applied
  const existingLink = document.querySelector('link[href*="styles.css"]');
  if (existingLink) {
    const newLink = existingLink.cloneNode(true);
    newLink.href = existingLink.href + '?v=' + Date.now();
    existingLink.parentNode.replaceChild(newLink, existingLink);
  }
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
        <h1 class="profile-name" id="profileName">DJ KC</h1>
        <p class="profile-email" id="profileEmail">DJKC@hotmail.com</p>
        <div class="user-type-badge" id="userTypeBadge">
          <span class="user-type-text">Admin</span>
        </div>
        
        <!-- Stats -->
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-number" id="attendedCount">13</span>
            <span class="stat-label">Parties</span>
          </div>
          <div class="stat-item">
            <span class="stat-number" id="favoritesCount">3.2k</span>
            <span class="stat-label">Attendents</span>
          </div>
        </div>
      </div>

      <!-- My Interests Section -->
      <div class="interests-section">
        <div class="section-header">
          <h2 class="section-title">My usual thematics</h2>
          <button class="edit-btn" id="editInterestsBtn">Edit</button>
        </div>
        <div class="interests-tags" id="interestsTags">
          <!-- Interests will be loaded dynamically -->
        </div>
      </div>

      <!-- My Parties Section -->
      <div class="parties-section">
        <div class="section-header">
          <h2 class="section-title">My Parties</h2>
          <button class="see-more-btn" id="seeMorePartiesBtn">See more</button>
        </div>
        <div class="parties-list" id="partiesList">
          <!-- Parties will be loaded dynamically -->
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
          <div class="settings-item" id="yourCodesBtn">
            <img src="assets/copyIcon.svg" alt="Your codes" class="settings-icon" />
            <span class="settings-text">Your codes</span>
            <img src="assets/arrow.svg" alt="Arrow" class="arrow-icon" />
          </div>
          <div class="settings-item" id="editProfileBtn">
            <img src="assets/edit.svg" alt="Edit Profile" class="settings-icon" />
            <span class="settings-text">Edit profile</span>
            <img src="assets/arrow.svg" alt="Arrow" class="arrow-icon" />
          </div>
          <div class="settings-item" id="changeUserBtn">
            <img src="assets/person.svg" alt="Change User" class="settings-icon" />
            <span class="settings-text">Change User</span>
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
        <div class="nav-item" data-nav="dashboard">
          <span class="nav-icon icon-dashboard"></span>
          <span>Dashboard</span>
        </div>
        <div class="nav-item" data-nav="parties">
          <span class="nav-icon icon-party"></span>
          <span>Parties</span>
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
  
  // Load user parties
  await loadUserParties();
  
  // Setup event listeners
  setupProfileEventListeners();
  
  // Setup bottom navigation
  setupBottomNavigation();
}

async function loadUserProfile() {
  try {
    // Get current logged-in admin user data
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    
    if (adminUser && Object.keys(adminUser).length > 0) {
      // Use logged-in admin user data
      document.getElementById("profileName").textContent = adminUser.name || "Admin";
      document.getElementById("profileEmail").textContent = adminUser.email || "admin@example.com";
      document.getElementById("attendedCount").textContent = adminUser.parties_count || 13;
      document.getElementById("favoritesCount").textContent = adminUser.attendees_count || "3.2k";
      
      // Update user type badge
      const userTypeBadge = document.getElementById("userTypeBadge");
      const userTypeText = document.querySelector(".user-type-text");
      if (adminUser.is_admin) {
        userTypeBadge.className = "user-type-badge admin";
        userTypeText.textContent = "Admin";
      } else {
        userTypeBadge.className = "user-type-badge member";
        userTypeText.textContent = "Member";
      }
      
      // Update profile picture
      const profilePicture = document.querySelector(".profile-picture");
      if (profilePicture && adminUser.profile_image) {
        profilePicture.src = adminUser.profile_image;
      }
      
      // Load user interests
      loadUserInterests(adminUser.interests || []);
      
      console.log("Profile loaded from logged-in admin user:", adminUser);
      return;
    }
    
    // Fallback: Try to fetch from Supabase API
    const userId = localStorage.getItem("currentUserId") || "1";
    
    try {
      const response = await makeRequest(`/users/${userId}/profile`, "GET");
      
      // Update profile information with real data
      document.getElementById("profileName").textContent = response.name || "Admin";
      document.getElementById("profileEmail").textContent = response.email || "admin@example.com";
      document.getElementById("attendedCount").textContent = response.parties_count || 13;
      document.getElementById("favoritesCount").textContent = response.attendees_count || "3.2k";
      
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
      localStorage.setItem("adminUser", JSON.stringify(response));
      
      console.log("Profile loaded from Supabase:", response);
      
    } catch (apiError) {
      console.warn("API call failed, using fallback data:", apiError);
      
      // Fallback to mock data if API fails
      const mockUser = {
        id: 1,
        name: "DJ KC",
        email: "DJKC@hotmail.com",
        profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        parties_count: 13,
        attendees_count: "3.2k",
        interests: ["Disco Music", "Elegant", "Cocktailing"],
        is_admin: true
      };

      // Update profile information
      document.getElementById("profileName").textContent = mockUser.name;
      document.getElementById("profileEmail").textContent = mockUser.email;
      document.getElementById("attendedCount").textContent = mockUser.parties_count;
      document.getElementById("favoritesCount").textContent = mockUser.attendees_count;
      
      // Update profile picture
      const profilePicture = document.querySelector(".profile-picture");
      if (profilePicture) {
        profilePicture.src = mockUser.profile_image;
      }

      // Load user interests
      loadUserInterests(mockUser.interests || []);

      // Store user data for later use
      localStorage.setItem("adminUser", JSON.stringify(mockUser));
    }
    
  } catch (error) {
    console.error("Error loading user profile:", error);
    // Show error message or fallback data
  }
}

async function loadUserParties() {
  try {
    // Mock parties data for admin
    const mockParties = [
      {
        id: 1,
        title: "Pre-New Year Party",
        date: "22/11/21",
        status: "In progress",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop",
        buttonText: "Manage",
        buttonClass: "manage-btn"
      },
      {
        id: 2,
        title: "Lore's Pool Party",
        date: "11/10/21",
        status: "Inactive",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=80&h=80&fit=crop",
        buttonText: "Statistics",
        buttonClass: "stats-btn"
      },
      {
        id: 3,
        title: "Chicago Night",
        date: "5/9/21",
        status: "Finished",
        image: "https://images.unsplash.com/photo-1571266028243-d220b6b0b8c5?w=80&h=80&fit=crop",
        buttonText: "Statistics",
        buttonClass: "stats-btn"
      }
    ];

    const partiesList = document.getElementById("partiesList");
    partiesList.innerHTML = mockParties.map(party => `
      <div class="party-item">
        <img src="${party.image}" alt="${party.title}" class="party-image" />
        <div class="party-content">
          <h3 class="party-title">${party.title}</h3>
          <p class="party-date">${party.date} • ${party.status}</p>
        </div>
        <div class="party-action">
          <button class="party-btn ${party.buttonClass}">${party.buttonText}</button>
        </div>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error loading user parties:", error);
  }
}

function loadUserInterests(interests) {
  const interestsContainer = document.getElementById("interestsTags");
  
  // Ensure interests is always an array
  const interestsArray = Array.isArray(interests) ? interests : [];
  
  if (interestsArray.length === 0) {
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

  interestsContainer.innerHTML = interestsArray.map(interest => {
    const config = interestConfig[interest] || { class: "default", icon: "assets/partyIcon.svg" };
    return `
      <div class="interest-tag ${config.class}">
        <img src="${config.icon}" alt="${interest}" class="tag-icon" />
        <span>${interest}</span>
      </div>
    `;
  }).join("");

  console.log("Interests loaded:", interestsArray);
}

function setupProfileEventListeners() {
  // Edit interests button
  document.getElementById("editInterestsBtn").addEventListener("click", () => {
    console.log("Edit interests clicked");
    navigateTo("/edit-profile");
  });

  // See more parties button
  document.getElementById("seeMorePartiesBtn").addEventListener("click", () => {
    console.log("See more parties clicked");
    navigateTo("/admin-dashboard");
  });

  // Settings menu items
  document.getElementById("notificationsBtn").addEventListener("click", () => {
    console.log("Notifications clicked");
    // TODO: Navigate to notifications settings
  });

  document.getElementById("yourCodesBtn").addEventListener("click", () => {
    console.log("Your codes clicked");
    // TODO: Navigate to codes page
  });

  document.getElementById("editProfileBtn").addEventListener("click", () => {
    console.log("Edit profile clicked");
    navigateTo("/edit-profile");
  });

  document.getElementById("changeUserBtn").addEventListener("click", () => {
    console.log("Change user clicked");
    // TODO: Implement user switching
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
  // Clear admin user data
  localStorage.removeItem('adminUser');
  localStorage.removeItem('currentUserId');
  
  // Redirect to admin login
  navigateTo("/admin-login");
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
        case "dashboard":
          navigateTo("/admin-dashboard");
          break;
        case "parties":
          navigateTo("/admin-dashboard");
          break;
        case "profile":
          // Already on profile page
          break;
      }
    });
  });
}
