import renderScreen1 from "./screens/screen1.js";
import renderScreen2 from "./screens/screen2.js";
import renderAdminLogin from "./screens/adminLogin.js";
import renderAdminRegister from "./screens/adminRegister.js";
import renderAdminDashboard from "./screens/adminDashboard.js";
import renderCreateParty from "./screens/Create Party/createParty.js";
import renderManageParty from "./screens/manageParty.js";
import renderGuestsSummary from "./screens/guestsSummary.js";
import renderProfile from "./screens/profile.js";
import renderEditProfile from "./screens/editProfile.js";
import renderMyParties from "./screens/myParties.js";
import { authManager, checkRouteAccess, handleUnauthorizedAccess } from "./auth.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

function getInitialRoute() {
  const path = window.location.pathname;
  const cleanPath = path.replace('/app2', '') || '/admin-login';
  return { path: cleanPath, data: {} };
}

let route = getInitialRoute();
renderRoute(route);

window.addEventListener('popstate', (event) => {
  if (event.state) {
    route = event.state;
    renderRoute(route);
  } else {
    route = getInitialRoute();
    renderRoute(route);
  }
});

function navigateTo(path, data = {}) {
  const newRoute = { path, data };
  window.history.pushState(newRoute, "", `/app2${path}`);
  renderRoute(newRoute);
}

function renderRoute(currentRoute) {
  if (!checkRouteAccess(currentRoute.path)) {
    handleUnauthorizedAccess(currentRoute.path);
    return;
  }

  switch (currentRoute.path) {
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
    case "/screen1":
      clearScripts();
      renderScreen1();
      break;
    case "/screen2":
      clearScripts();
      renderScreen2(currentRoute?.data);
      break;
    case "/manage-party":
      clearScripts();
      renderManageParty(currentRoute?.data);
      break;
    case "/guests-summary":
      clearScripts();
      renderGuestsSummary(currentRoute?.data);
      break;
    case "/profile":
      clearScripts();
      renderProfile(currentRoute?.data);
      break;
    case "/edit-profile":
      clearScripts();
      renderEditProfile(currentRoute?.data);
      break;
    case "/my-parties":
      clearScripts();
      renderMyParties(currentRoute?.data);
      break;
    default:
      // Verificar si el usuario es admin antes de redirigir a app1
      if (authManager.isUserAdmin()) {
        window.location.href = '/app2/admin-dashboard';
      } else {
        window.location.href = '/app1/welcome';
      }
  }
}

// Centralized request helper that always targets current origin to avoid CORS
async function makeRequest(url, method, body) {
  const BASE_URL = window.location.origin; // same-origin to avoid CORS issues
  const endpoint = `${BASE_URL}${url}`;
  let response = await fetch(endpoint, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  response = await response.json();

  return response;
}

export { navigateTo, socket, makeRequest };
