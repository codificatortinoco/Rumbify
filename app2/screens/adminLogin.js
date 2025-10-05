import { navigateTo, makeRequest } from "../app.js";

export default function renderAdminLogin(data = {}) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="admin-login-screen">
      <div class="admin-login-content">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-container">
            <img src="assets/Llogowhite.png" alt="Rumbify Admin Logo" class="admin-login-logo" />
          </div>
        </div>

        <!-- Admin Login Form -->
        <div class="admin-login-form">
          <h1 class="admin-login-title">Administrator Login</h1>
          <p class="admin-login-subtitle">Access administrative controls and event management.</p>
          
          <form class="form-container">
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
            
            <div class="forgot-password">
              <a href="#" class="forgot-link">Forgot Password?</a>
            </div>
            
            <button type="submit" class="admin-login-btn">
              Access Admin Panel
            </button>
          </form>
        </div>

        <!-- Register Link -->
        <div class="register-section">
          <p class="register-text">
            Need an admin account? 
            <a href="#" class="register-link">Register Admin</a>
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
  const adminLoginForm = document.querySelector('.form-container');
  const forgotLink = document.querySelector('.forgot-link');
  const registerLink = document.querySelector('.register-link');
  const backBtn = document.querySelector('.back-btn');

  adminLoginForm.addEventListener('submit', handleAdminLogin);
  if (forgotLink) forgotLink.addEventListener('click', handleForgotPassword);
  if (registerLink) registerLink.addEventListener('click', handleRegister);
  backBtn.addEventListener('click', handleBackToWelcome);

  async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email-input').value;
    const password = document.getElementById('admin-password-input').value;
    
    // Show loading state
    const submitBtn = document.querySelector('.admin-login-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
      // Call admin login endpoint
      const response = await makeRequest('/admin/login', 'POST', {
        email,
        password
      });
      
      if (response.success) {
        console.log('Admin login successful:', response.user);
        
        // Store admin data in localStorage
        localStorage.setItem('adminUser', JSON.stringify(response.user));
        
        // Redirect to admin dashboard
        console.log('Login successful, navigating to admin-dashboard');
        navigateTo("/admin-dashboard", { 
          userType: "admin", 
          user: response.user 
        });
      } else {
        alert(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    // TODO: Implement admin forgot password logic
    console.log('Admin forgot password clicked');
  }

  function handleRegister(e) {
    e.preventDefault();
    console.log('Register button clicked, navigating to admin-register');
    navigateTo("/admin-register");
  }

  function handleBackToWelcome(e) {
    e.preventDefault();
    // Navigate back to main app (app1) welcome screen
    window.location.href = '/app1/welcome';
  }
}
