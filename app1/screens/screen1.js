import { makeRequest } from "../app.js";

export default function renderScreen1() {
  const app = document.getElementById("app");
  app.innerHTML = `
      <div id="screen1">
        <h2>Screen 1</h2>
        <button id="get-btn">Get users</button>
        <button id="change-screen-btn">Change screen on app 2</button>
    </div>
      `;

  document.getElementById("get-btn").addEventListener("click", getUsers);
  document
    .getElementById("change-screen-btn")
    .addEventListener("click", sendEventChangeScreen);

  async function getUsers() {
    const response = await makeRequest("/users", "GET");

    console.log("response", response);
  }

  async function sendEventChangeScreen() {
    const changeEventResponse = await makeRequest("/change-screen", "POST");
    console.log("changeEventResponse", changeEventResponse);
  }
}
