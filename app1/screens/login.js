import { navigateTo } from "../app.js";

export default function renderLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="login-screen">
      <div class="login-content">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-container">
            <!-- Replaceable Logo -->
            <img src="assets/Llogowhite.png" alt="Rumbify Logo" class="login-logo" />
          </div>
        </div>

        <!-- Login Form -->
        <div class="login-form">
          <h1 class="login-title">Log in</h1>
          <p class="login-subtitle">Access the most anticipated events.</p>
          
          <form class="form-container">
            <div class="input-group">
              <input 
                type="email" 
                id="email-input" 
                class="form-input" 
                placeholder="Enter Email"
                required
              />
            </div>
            
            <div class="input-group">
              <input 
                type="password" 
                id="password-input" 
                class="form-input" 
                placeholder="Enter Password"
                required
              />
            </div>
            
            <div class="forgot-password">
              <a href="#" class="forgot-link">Forgot Password?</a>
            </div>
            
            <button type="submit" class="login-btn">
              Sign In
            </button>
          </form>
        </div>

        <!-- Sign Up Link -->
        <div class="signup-section">
          <p class="signup-text">
            Don't have an account? 
            <a href="#" class="signup-link">Sign Up</a>
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
  const loginForm = document.querySelector('.form-container');
  const forgotLink = document.querySelector('.forgot-link');
  const signupLink = document.querySelector('.signup-link');
  const backBtn = document.querySelector('.back-btn');

  loginForm.addEventListener('submit', handleLogin);
  forgotLink.addEventListener('click', handleForgotPassword);
  signupLink.addEventListener('click', handleSignUp);
  backBtn.addEventListener('click', handleBackToWelcome);

  function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    
    // TODO: Implement login logic
    console.log('Login attempt:', { email, password });
    
    // For now, redirect to dashboard
    navigateTo("/dashboard", { userType: "member", email });
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    // TODO: Implement forgot password logic
    console.log('Forgot password clicked');
  }

  function handleSignUp(e) {
    e.preventDefault();
    navigateTo("/register");
  }

  function handleBackToWelcome(e) {
    e.preventDefault();
    navigateTo("/welcome");
  }
}
