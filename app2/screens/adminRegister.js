import { navigateTo, makeRequest } from "../app.js";

export default function renderAdminRegister(data = {}) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="admin-register-screen">
      <div class="admin-register-content">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-container">
            <img src="assets/Llogowhite.png" alt="Rumbify Admin Logo" class="admin-register-logo" />
          </div>
        </div>

        <!-- Admin Register Form -->
        <div class="admin-register-form">
          <h1 class="admin-register-title">Administrator Registration</h1>
          <p class="admin-register-subtitle">Create a new administrator account to access administrative controls.</p>
          
          <form class="form-container">
            <div class="input-group">
              <input 
                type="text" 
                id="admin-name-input" 
                class="form-input" 
                placeholder="Enter Full Name"
                required
              />
            </div>
            
            <div class="input-group">
              <input 
                type="email" 
                id="admin-email-input" 
                class="form-input" 
                placeholder="Enter Admin Email"
                required
              />
            </div>
            
            <div class="input-group">
              <input 
                type="password" 
                id="admin-password-input" 
                class="form-input" 
                placeholder="Enter Admin Password"
                required
              />
            </div>
            
            <div class="input-group">
              <input 
                type="password" 
                id="admin-repeat-password-input" 
                class="form-input" 
                placeholder="Repeat Admin Password"
                required
              />
            </div>

            <div class="input-group">
              <input 
                type="tel" 
                id="admin-phone-input" 
                class="form-input" 
                placeholder="Enter Phone Number"
                required
              />
              <small class="admin-phone-hint">Required for administrator registration</small>
            </div>
            
            <button type="submit" class="admin-register-btn">
              Create Admin Account
            </button>
          </form>
        </div>

        <!-- Back to Login Link -->
        <div class="login-section">
          <p class="login-text">
            Already have an admin account? 
            <a href="#" class="login-link">Log In</a>
          </p>
        </div>

        <!-- Back Button -->
        <div class="back-section">
          <button class="back-btn">
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  const registerForm = document.querySelector('.form-container');
  const loginLink = document.querySelector('.login-link');
  const backBtn = document.querySelector('.back-btn');

  registerForm.addEventListener('submit', handleAdminRegister);
  loginLink.addEventListener('click', handleBackToLogin);
  backBtn.addEventListener('click', handleBackToWelcome);

  async function handleAdminRegister(e) {
    e.preventDefault();
    const name = document.getElementById('admin-name-input').value;
    const email = document.getElementById('admin-email-input').value;
    const password = document.getElementById('admin-password-input').value;
    const repeatPassword = document.getElementById('admin-repeat-password-input').value;
    const phone = document.getElementById('admin-phone-input').value;
    
    // Validate passwords match
    if (password !== repeatPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      alert('Please enter a valid phone number (at least 10 digits)!');
      return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.admin-register-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
      // Call admin register endpoint
      const response = await makeRequest('/admin/register', 'POST', {
        name,
        email,
        password,
        phone
      });
      
      if (response.success) {
        console.log('Admin registration successful:', response.user);
        
        // Store admin data in localStorage
        localStorage.setItem('adminUser', JSON.stringify(response.user));
        
        // Redirect to admin dashboard
        console.log('Registration successful, navigating to admin-dashboard');
        navigateTo("/admin-dashboard", { 
          userType: "admin", 
          user: response.user 
        });
      } else {
        alert(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Admin registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  function handleBackToLogin(e) {
    e.preventDefault();
    console.log('Back to login button clicked, navigating to admin-login');
    navigateTo("/admin-login");
  }

  function handleBackToWelcome(e) {
    e.preventDefault();
    // Navigate back to main app (app1) welcome screen
    window.location.href = '/app1/welcome';
  }
}
