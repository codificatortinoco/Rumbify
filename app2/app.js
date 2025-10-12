import renderScreen1 from "./screens/screen1.js";
import renderScreen2 from "./screens/screen2.js";
import renderAdminLogin from "./screens/adminLogin.js";
import renderAdminRegister from "./screens/adminRegister.js";
import renderAdminDashboard from "./screens/adminDashboard.js";
import renderCreateParty from "./screens/Create Party/createParty.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

// Initialize route based on current URL path
function getInitialRoute() {
  const path = window.location.pathname;
  // Remove /app2 prefix if present
  const cleanPath = path.replace('/app2', '') || '/admin-login';
  return { path: cleanPath, data: {} };
}

let route = getInitialRoute();
renderRoute(route);

// Handle browser back/forward navigation
window.addEventListener('popstate', (event) => {
  if (event.state) {
    route = event.state;
    renderRoute(route);
  } else {
    route = getInitialRoute();
    renderRoute(route);
  }
});

function renderRoute(currentRoute) {
  console.log('renderRoute called with:', currentRoute);
  switch (currentRoute?.path) {
    case "/":
      clearScripts();
      renderScreen1(currentRoute?.data);
      break;
    case "/admin-login":
      clearScripts();
      renderAdminLogin(currentRoute?.data);
      break;
    case "/admin-register":
      clearScripts();
      renderAdminRegister(currentRoute?.data);
      break;
    case "/admin-dashboard":
      clearScripts();
      renderAdminDashboard(currentRoute?.data);
      break;
    case "/create-party":
      clearScripts();
      renderCreateParty(currentRoute?.data);
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
  console.log('navigateTo called with:', { path, data });
  route = { path, data };
  renderRoute(route);
  
  // Update browser URL without page reload
  const newUrl = `/app2${path}`;
  console.log('Updating URL to:', newUrl);
  window.history.pushState({ path, data }, '', newUrl);
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
