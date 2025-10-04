import { makeRequest, navigateTo } from "../app.js";

export default function renderScreen1(data = {}) {
  const app = document.getElementById("app");
  const userType = data.userType || "guest";
  
  app.innerHTML = `
      <div id="screen1">
        <h2>Screen 1</h2>
        <div class="user-type-display">
          <span class="user-badge ${userType}">${userType.toUpperCase()}</span>
        </div>
        <button id="get-btn">Get users</button>
        <button id="change-screen-btn">Change screen on app 2</button>
        <button id="dashboard-btn">Go to Dashboard</button>
        <button id="back-to-welcome">Back to Welcome</button>
    </div>
      `;

  document.getElementById("get-btn").addEventListener("click", getUsers);
  document.getElementById("change-screen-btn").addEventListener("click", sendEventChangeScreen);
  document.getElementById("dashboard-btn").addEventListener("click", () => navigateTo("/dashboard"));
  document.getElementById("back-to-welcome").addEventListener("click", () => navigateTo("/welcome"));

  async function getUsers() {
    const response = await makeRequest("/users", "GET");

    console.log("response", response);
  }

  async function sendEventChangeScreen() {
    const changeEventResponse = await makeRequest("/change-screen", "POST");
    console.log("changeEventResponse", changeEventResponse);
  }
}
