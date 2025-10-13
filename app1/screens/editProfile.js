import { makeRequest, navigateTo, getCurrentUser, setLoggedInUser } from "../app.js";

export default function renderEditProfile() {
  const currentUser = getCurrentUser();
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="edit-profile-screen">
      <!-- Header -->
      <div class="edit-profile-header">
        <button class="back-btn" id="backBtn">
          <img src="assets/arrow.svg" alt="Back" class="back-icon" />
        </button>
        <h1 class="edit-profile-title">Edit Profile</h1>
        <button class="save-btn" id="saveBtn">Save</button>
      </div>

      <!-- Profile Picture Section -->
      <div class="profile-picture-edit-section">
        <div class="profile-picture-container">
          <img src="${currentUser?.profile_image || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'}" alt="Profile" class="profile-picture" id="profilePicture" />
          <button class="camera-btn" id="changePictureBtn">
            <img src="assets/edit.svg" alt="Edit" class="camera-icon" />
          </button>
        </div>
        <p class="profile-picture-hint">Tap to change profile picture</p>
      </div>

      <!-- Form Section -->
      <div class="edit-profile-form">
        <div class="form-group">
          <label for="nameInput" class="form-label">Full Name</label>
          <input 
            type="text" 
            id="nameInput" 
            class="form-input" 
            value="${currentUser?.name || ''}" 
            placeholder="Enter your full name"
            maxlength="50"
          />
        </div>

        <div class="form-group">
          <label for="emailInput" class="form-label">Email</label>
          <input 
            type="email" 
            id="emailInput" 
            class="form-input" 
            value="${currentUser?.email || ''}" 
            placeholder="Enter your email"
            maxlength="100"
          />
        </div>

        <div class="form-group">
          <label for="bioInput" class="form-label">Bio (Optional)</label>
          <textarea 
            id="bioInput" 
            class="form-textarea" 
            placeholder="Tell us about yourself..."
            maxlength="200"
            rows="3"
          >${currentUser?.bio || ''}</textarea>
          <div class="char-count" id="bioCharCount">0/200</div>
        </div>

        <!-- Password Change Section -->
        <div class="form-group">
          <label class="form-label">Change Password</label>
          <div class="password-change-container">
            <div class="password-input-group">
              <input 
                type="password" 
                id="currentPasswordInput" 
                class="form-input" 
                placeholder="Current Password"
                maxlength="100"
              />
            </div>
            <div class="password-input-group">
              <input 
                type="password" 
                id="newPasswordInput" 
                class="form-input" 
                placeholder="New Password"
                maxlength="100"
              />
            </div>
            <div class="password-input-group">
              <input 
                type="password" 
                id="confirmPasswordInput" 
                class="form-input" 
                placeholder="Confirm New Password"
                maxlength="100"
              />
            </div>
            <div class="password-requirements">
              <small>Password must be at least 8 characters long and contain at least one letter and one number.</small>
            </div>
          </div>
        </div>

        <!-- Interests Section -->
        <div class="form-group">
          <label class="form-label">Interests</label>
          <div class="interests-edit-container">
            <div class="selected-interests" id="selectedInterests">
              <!-- Selected interests will be displayed here -->
            </div>
            <div class="available-interests" id="availableInterests">
              <!-- Available interests will be displayed here -->
            </div>
          </div>
        </div>

        <!-- Privacy Settings -->
        <div class="form-group">
          <label class="form-label">Privacy Settings</label>
          <div class="privacy-options">
            <div class="privacy-option">
              <span class="privacy-label">Show profile to other users</span>
              <label class="toggle-switch">
                <input type="checkbox" id="profileVisibility" ${currentUser?.profile_visible !== false ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="privacy-option">
              <span class="privacy-label">Show attendance history</span>
              <label class="toggle-switch">
                <input type="checkbox" id="attendanceVisibility" ${currentUser?.attendance_visible !== false ? 'checked' : ''} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Account Section -->
      <div class="danger-zone">
        <h3 class="danger-zone-title">Danger Zone</h3>
        <button class="delete-account-btn" id="deleteAccountBtn">
          Delete Account
        </button>
        <p class="danger-zone-warning">This action cannot be undone</p>
      </div>
    </div>
  `;

  // Initialize edit profile functionality
  initializeEditProfile();
}

async function initializeEditProfile() {
  // Load current user data
  await loadCurrentUserData();
  
  // Setup event listeners
  setupEditProfileEventListeners();
  
  // Setup form validation
  setupFormValidation();
  
  // Load interests
  loadInterests();
}

async function loadCurrentUserData() {
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    // Populate form with current user data
    document.getElementById("nameInput").value = currentUser.name || "";
    document.getElementById("emailInput").value = currentUser.email || "";
    document.getElementById("bioInput").value = currentUser.bio || "";
    
    // Update character count for bio
    updateBioCharCount();
    
    // Load interests
    if (currentUser.interests && Array.isArray(currentUser.interests)) {
      loadSelectedInterests(currentUser.interests);
    }
  }
}

function loadInterests() {
  // Available interests that users can select from
  const availableInterests = [
    "Disco Music", "Elegant", "Cocktailing", "House Music", "Techno", 
    "Jazz", "Rock", "Pop", "Electronic", "Classical", "Hip Hop", 
    "R&B", "Reggae", "Country", "Blues", "Folk", "Indie", "Alternative"
  ];

  const availableContainer = document.getElementById("availableInterests");
  availableContainer.innerHTML = availableInterests.map(interest => `
    <div class="interest-chip" data-interest="${interest}">
      <span>${interest}</span>
    </div>
  `).join("");

  // Add click listeners to interest chips
  availableContainer.querySelectorAll(".interest-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      toggleInterest(chip.dataset.interest);
    });
  });
}

function loadSelectedInterests(interests) {
  const selectedContainer = document.getElementById("selectedInterests");
  selectedContainer.innerHTML = interests.map(interest => `
    <div class="selected-interest-chip" data-interest="${interest}">
      <span>${interest}</span>
      <button class="remove-interest-btn" data-interest="${interest}">×</button>
    </div>
  `).join("");

  // Add click listeners to remove buttons
  selectedContainer.querySelectorAll(".remove-interest-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleInterest(btn.dataset.interest);
    });
  });
}

function toggleInterest(interest) {
  const selectedContainer = document.getElementById("selectedInterests");
  const availableContainer = document.getElementById("availableInterests");
  
  // Check if interest is already selected
  const isSelected = selectedContainer.querySelector(`[data-interest="${interest}"]`);
  
  if (isSelected) {
    // Remove from selected
    isSelected.remove();
    
    // Add back to available
    const availableChip = availableContainer.querySelector(`[data-interest="${interest}"]`);
    if (availableChip) {
      availableChip.style.display = "block";
    }
  } else {
    // Add to selected (limit to 5 interests)
    const selectedCount = selectedContainer.children.length;
    if (selectedCount >= 5) {
      alert("You can select up to 5 interests");
      return;
    }
    
    // Remove from available
    const availableChip = availableContainer.querySelector(`[data-interest="${interest}"]`);
    if (availableChip) {
      availableChip.style.display = "none";
    }
    
    // Add to selected
    const selectedChip = document.createElement("div");
    selectedChip.className = "selected-interest-chip";
    selectedChip.dataset.interest = interest;
    selectedChip.innerHTML = `
      <span>${interest}</span>
      <button class="remove-interest-btn" data-interest="${interest}">×</button>
    `;
    
    // Add click listener to remove button
    selectedChip.querySelector(".remove-interest-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleInterest(interest);
    });
    
    selectedContainer.appendChild(selectedChip);
  }
}

function setupEditProfileEventListeners() {
  // Back button
  document.getElementById("backBtn").addEventListener("click", () => {
    navigateTo("/profile");
  });

  // Save button
  document.getElementById("saveBtn").addEventListener("click", handleSaveProfile);

  // Change profile picture button
  document.getElementById("changePictureBtn").addEventListener("click", handleChangeProfilePicture);

  // Delete account button
  document.getElementById("deleteAccountBtn").addEventListener("click", handleDeleteAccount);

  // Bio character count
  document.getElementById("bioInput").addEventListener("input", updateBioCharCount);
}

function setupFormValidation() {
  const nameInput = document.getElementById("nameInput");
  const emailInput = document.getElementById("emailInput");
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  
  // Real-time validation
  nameInput.addEventListener("input", validateName);
  emailInput.addEventListener("input", validateEmail);
  currentPasswordInput.addEventListener("input", validateCurrentPassword);
  newPasswordInput.addEventListener("input", validatePassword);
  confirmPasswordInput.addEventListener("input", validatePassword);
}

function validateName() {
  const nameInput = document.getElementById("nameInput");
  const name = nameInput.value.trim();
  
  if (name.length < 2) {
    nameInput.classList.add("error");
    return false;
  } else {
    nameInput.classList.remove("error");
    return true;
  }
}

function validateEmail() {
  const emailInput = document.getElementById("emailInput");
  const email = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    emailInput.classList.add("error");
    return false;
  } else {
    emailInput.classList.remove("error");
    return true;
  }
}

function validatePassword() {
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Check if password fields are filled
  const isNewPasswordFilled = newPassword.length > 0;
  const isConfirmPasswordFilled = confirmPassword.length > 0;
  
  // If no password fields are filled, it's valid (optional change)
  if (!isNewPasswordFilled && !isConfirmPasswordFilled) {
    newPasswordInput.classList.remove("error");
    confirmPasswordInput.classList.remove("error");
    return true;
  }
  
  // If only one field is filled, it's invalid
  if (isNewPasswordFilled !== isConfirmPasswordFilled) {
    newPasswordInput.classList.add("error");
    confirmPasswordInput.classList.add("error");
    return false;
  }
  
  // Check password strength
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    newPasswordInput.classList.add("error");
    return false;
  }
  
  // Check if passwords match
  if (newPassword !== confirmPassword) {
    confirmPasswordInput.classList.add("error");
    return false;
  }
  
  // All validations passed
  newPasswordInput.classList.remove("error");
  confirmPasswordInput.classList.remove("error");
  return true;
}

function validateCurrentPassword() {
  const currentPasswordInput = document.getElementById("currentPasswordInput");
  const newPasswordInput = document.getElementById("newPasswordInput");
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  
  // If no new password is provided, current password is not required
  if (newPassword.length === 0) {
    currentPasswordInput.classList.remove("error");
    return true;
  }
  
  // If new password is provided, current password is required
  if (currentPassword.length === 0) {
    currentPasswordInput.classList.add("error");
    return false;
  }
  
  currentPasswordInput.classList.remove("error");
  return true;
}

function updateBioCharCount() {
  const bioInput = document.getElementById("bioInput");
  const charCount = document.getElementById("bioCharCount");
  const count = bioInput.value.length;
  
  charCount.textContent = `${count}/200`;
  
  if (count > 200) {
    charCount.classList.add("over-limit");
  } else {
    charCount.classList.remove("over-limit");
  }
}

async function handleSaveProfile() {
  const saveBtn = document.getElementById("saveBtn");
  const originalText = saveBtn.textContent;
  
  try {
    // Show loading state
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
    
    // Validate form
    const isNameValid = validateName();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isCurrentPasswordValid = validateCurrentPassword();
    
    if (!isNameValid || !isEmailValid || !isPasswordValid || !isCurrentPasswordValid) {
      alert("Please fix the errors in the form before saving");
      return;
    }
    
    // Get form data
    const name = document.getElementById("nameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const bio = document.getElementById("bioInput").value.trim();
    const profileVisible = document.getElementById("profileVisibility").checked;
    const attendanceVisible = document.getElementById("attendanceVisibility").checked;
    const currentPassword = document.getElementById("currentPasswordInput").value;
    const newPassword = document.getElementById("newPasswordInput").value;
    
    // Get selected interests
    const selectedInterests = Array.from(document.querySelectorAll(".selected-interest-chip"))
      .map(chip => chip.dataset.interest);
    
    // Prepare update data
    const updateData = {
      name,
      email,
      bio,
      interests: selectedInterests,
      profile_visible: profileVisible,
      attendance_visible: attendanceVisible
    };
    
    // Add password data if provided
    if (newPassword.length > 0) {
      updateData.currentPassword = currentPassword;
      updateData.newPassword = newPassword;
    }
    
    // Get current user
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("User not found. Please log in again.");
      navigateTo("/welcome");
      return;
    }
    
    // Update user profile via API
    try {
      const response = await makeRequest(`/users/${currentUser.id}`, "PUT", updateData);
      
      if (response.success) {
        // Update local storage with new user data
        const updatedUser = { ...currentUser, ...updateData };
        setLoggedInUser(updatedUser);
        
        // Show success message
        alert("Profile updated successfully!");
        
        // Navigate back to profile (this will reload the profile with updated data)
        navigateTo("/profile");
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (apiError) {
      console.error("API error:", apiError);
      
      // Fallback: Update local storage only
      const updatedUser = { ...currentUser, ...updateData };
      setLoggedInUser(updatedUser);
      
      alert("Profile updated locally. Some changes may not be saved to the server.");
      navigateTo("/profile");
    }
    
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Failed to save profile. Please try again.");
  } finally {
    // Reset button state
    saveBtn.textContent = originalText;
    saveBtn.disabled = false;
  }
}

function handleChangeProfilePicture() {
  // Create file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const profilePicture = document.getElementById("profilePicture");
        profilePicture.src = e.target.result;
        
        // TODO: Upload to server and update user profile
        console.log("Profile picture changed:", file.name);
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Trigger file selection
  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function handleDeleteAccount() {
  const confirmed = confirm(
    "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
  );
  
  if (confirmed) {
    const doubleConfirmed = confirm(
      "This is your final warning. Your account and all associated data will be permanently deleted. Are you absolutely sure?"
    );
    
    if (doubleConfirmed) {
      // TODO: Implement account deletion
      console.log("Account deletion requested");
      alert("Account deletion feature will be implemented soon.");
    }
  }
}
