import { navigateTo } from "../app.js";

export default function renderScreen1(data = {}) {
  const app = document.getElementById("app");
  const userType = data.userType || "guest";
  
  app.innerHTML = `
      <div id="screen1">
        <h2>Screen 1</h2>
        <div class="user-type-display">
          <span class="user-badge ${userType}">${userType.toUpperCase()}</span>
        </div>
        <button id="dashboard-btn">Go to Dashboard</button>
        <button id="back-to-welcome">Back to Welcome</button>
    </div>
      `;

  document.getElementById("dashboard-btn").addEventListener("click", () => navigateTo("/dashboard"));
  document.getElementById("back-to-welcome").addEventListener("click", () => navigateTo("/welcome"));
}
