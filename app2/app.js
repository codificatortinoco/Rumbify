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

function renderRoute(currentRoute) {
  // Verificación adicional: si el usuario es admin, nunca permitir acceso a app1
  if (authManager.isUserAdmin() && window.location.href.includes('/app1')) {
    console.log('Admin detected on app1, redirecting to admin-dashboard');
    window.location.href = '/app2/admin-dashboard';
    return;
  }
  
  if (!checkRouteAccess(currentRoute?.path)) {
    handleUnauthorizedAccess(currentRoute?.path);
    return;
  }

  switch (currentRoute?.path) {
    case "/welcome":
    case "/":
      // Si hay usuario autenticado, redirigir según su tipo
      if (authManager.isAuthenticated()) {
        if (authManager.isUserAdmin()) {
          window.location.href = '/app2/admin-dashboard';
        } else if (authManager.isUserMember()) {
          window.location.href = '/app1/dashboard';
        }
      } else {
        window.location.href = '/app1/welcome';
      }
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
    case "/screen1":
      clearScripts();
      renderScreen1(currentRoute?.data);
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
    default:
      // Verificar si el usuario es admin antes de redirigir a app1
      if (authManager.isUserAdmin()) {
        window.location.href = '/app2/admin-dashboard';
      } else {
        window.location.href = '/app1/welcome';
      }
  }
}

function navigateTo(path, data) {
  // Verificar si el usuario es admin y está intentando navegar a app1
  if (authManager.isUserAdmin() && (path.includes('/app1') || path.includes('app1'))) {
    console.log('Admin attempting to access app1, redirecting to admin-dashboard');
    window.location.href = '/app2/admin-dashboard';
    return;
  }
  
  route = { path, data };
  renderRoute(route);
  
  const newUrl = `/app2${path}`;
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
