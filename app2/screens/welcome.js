import { navigateTo } from "../app.js";
import { authManager } from "../auth.js";

export default function renderWelcome() {
  // Check if user is already logged in
  if (authManager.isAuthenticated() && authManager.isUserAdmin()) {
    navigateTo("/my-parties");
    return;
  }
  
  const app = document.getElementById("app");
  app.innerHTML = `
    <div id="welcome-screen">
      <div class="welcome-content">
        <div class="logo-container">
          <img src="assets/Llogowhite.png" alt="Rumbify Logo" class="logo-image" />
        </div>
        
        <div class="button-container">
          <button id="member-btn" class="role-button member-button">
            Member
          </button>
          <button id="admin-btn" class="role-button admin-button">
            Administrator
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("member-btn").addEventListener("click", () => {
    // En app2, redirigir a app1 si existe, o mostrar mensaje
    window.location.href = '/app1/welcome';
  });

  document.getElementById("admin-btn").addEventListener("click", () => {
    navigateTo("/admin-login");
  });
}
