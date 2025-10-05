import { navigateTo } from "../app.js";

export default function renderRegister() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="register-screen">
      <div class="register-content">
        <!-- Logo Section -->
        <div class="logo-section">
          <div class="logo-container">
            <!-- Replaceable Logo -->
            <img src="assets/Llogowhite.png" alt="Rumbify Logo" class="register-logo" />
          </div>
        </div>

        <!-- Register Form -->
        <div class="register-form">
          <h1 class="register-title">Register</h1>
          <p class="register-subtitle">Access the most anticipated events.</p>
          
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
            
            <div class="input-group">
              <input 
                type="password" 
                id="repeat-password-input" 
                class="form-input" 
                placeholder="Repeat password"
                required
              />
            </div>
            
            <button type="submit" class="register-btn">
              Sign Up
            </button>
          </form>
        </div>

        <!-- Back to Login Link -->
        <div class="login-section">
          <p class="login-text">
            Already have an account? 
            <a href="#" class="login-link">Log In</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  const registerForm = document.querySelector('.form-container');
  const loginLink = document.querySelector('.login-link');

  registerForm.addEventListener('submit', handleRegister);
  loginLink.addEventListener('click', handleBackToLogin);

  function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('email-input').value;
    const password = document.getElementById('password-input').value;
    const repeatPassword = document.getElementById('repeat-password-input').value;
    
    // Validate passwords match
    if (password !== repeatPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // TODO: Implement register logic
    console.log('Register attempt:', { email, password });
    
    // For now, redirect to dashboard
    navigateTo("/dashboard", { userType: "member", email });
  }

  function handleBackToLogin(e) {
    e.preventDefault();
    navigateTo("/login");
  }
}
