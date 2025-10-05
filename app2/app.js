import renderScreen1 from "./screens/screen1.js";
import renderScreen2 from "./screens/screen2.js";
import renderAdminLogin from "./screens/adminLogin.js";
import renderAdminDashboard from "./screens/adminDashboard.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

let route = { path: "/admin-login", data: {} };
renderRoute(route);

function renderRoute(currentRoute) {
  switch (currentRoute?.path) {
    case "/":
      clearScripts();
      renderScreen1(currentRoute?.data);
      break;
    case "/admin-login":
      clearScripts();
      renderAdminLogin(currentRoute?.data);
      break;
    case "/admin-dashboard":
      clearScripts();
      renderAdminDashboard(currentRoute?.data);
      break;
    case "/screen2":
      clearScripts();
      renderScreen2(currentRoute?.data);
      break;
    default:
      const app = document.getElementById("app");
      app.innerHTML = `<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>`;
  }
}

function navigateTo(path, data) {
  route = { path, data };
  renderRoute(route);
}

async function makeRequest(url, method, body) {
  const BASE_URL = "http://localhost:5050";
  let response = await fetch(`${BASE_URL}${url}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  response = await response.json();

  return response;
}

export { navigateTo, socket, makeRequest };
