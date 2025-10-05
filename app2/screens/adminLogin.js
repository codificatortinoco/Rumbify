import { navigateTo } from "../app.js";

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
  const backBtn = document.querySelector('.back-btn');

  adminLoginForm.addEventListener('submit', handleAdminLogin);
  if (forgotLink) forgotLink.addEventListener('click', handleForgotPassword);
  backBtn.addEventListener('click', handleBackToWelcome);

  function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email-input').value;
    const password = document.getElementById('admin-password-input').value;
    
    // TODO: Implement admin login logic
    console.log('Admin login attempt:', { email, password, userType: "admin" });
    
    // For administrators, redirect to admin dashboard
    navigateTo("/admin-dashboard", { userType: "admin", email });
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    // TODO: Implement admin forgot password logic
    console.log('Admin forgot password clicked');
  }

  function handleBackToWelcome(e) {
    e.preventDefault();
    // Navigate back to main app (app1) welcome screen
    window.location.href = '../app1/index.html';
  }
}
