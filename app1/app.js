import renderWelcome from "./screens/welcome.js";
import renderScreen1 from "./screens/screen1.js";
import renderLogin from "./screens/login.js";
import renderRegister from "./screens/register.js";
import renderDashboard from "./screens/dashboard.js";
import renderEventDetails from "./screens/eventDetails.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

// Initialize route based on current URL path
function getInitialRoute() {
  const path = window.location.pathname;
  // Remove /app1 prefix if present
  const cleanPath = path.replace('/app1', '') || '/welcome';
  return { path: cleanPath, data: {} };
}

let route = getInitialRoute();

function renderRoute(currentRoute) {
  switch (currentRoute?.path) {
    case "/welcome":
      clearScripts();
      renderWelcome(currentRoute?.data);
      break;
    case "/":
      clearScripts();
      renderScreen1(currentRoute?.data);
      break;
    case "/login":
      clearScripts();
      renderLogin(currentRoute?.data);
      break;
    case "/register":
      clearScripts();
      renderRegister(currentRoute?.data);
      break;
    case "/dashboard":
      clearScripts();
      renderDashboard(currentRoute?.data);
      break;
    case "/event-details":
      clearScripts();
      renderEventDetails(currentRoute?.data);
      break;
    default:
      const app = document.getElementById("app");
      app.innerHTML = `<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>`;
  }
}

// Initial render
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

function navigateTo(path, data) {
  route = { path, data };
  renderRoute(route);
  
  // Update browser URL without page reload
  const newUrl = `/app1${path}`;
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
