import renderWelcome from "./screens/welcome.js";
import renderLogin from "./screens/login.js";
import renderRegister from "./screens/register.js";
import renderDashboard, { cleanupDashboard } from "./screens/dashboard.js";
import renderMemberDashboard, { cleanupMemberDashboard } from "./screens/memberDashboard.js";
import renderEventDetails from "./screens/eventDetails.js";
import renderProfile from "./screens/profile.js";
import renderEditProfile from "./screens/editProfile.js";
import { authManager, checkRouteAccess, handleUnauthorizedAccess } from "./auth.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  cleanupDashboard();
  cleanupMemberDashboard();
  
  document.getElementById("app").innerHTML = "";
}

// Initialize route based on current URL path
function getInitialRoute() {
  const path = window.location.pathname;
  // Remove /app1 prefix if present
  const cleanPath = path.replace('/app1', '') || '/welcome';
  
  // Si el usuario es admin, redirigir a app2
  if (authManager.isUserAdmin()) {
    console.log('Admin detected in app1, redirecting to app2');
    window.location.href = '/app2/admin-dashboard';
    return { path: '/welcome', data: {} };
  }
  
  // Check if user is logged in for protected routes
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const protectedRoutes = ['/dashboard', '/parties', '/home', '/profile', '/edit-profile', '/event-details'];
  
  if (protectedRoutes.includes(cleanPath) && !isLoggedIn) {
    return { path: '/welcome', data: {} };
  }
  
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
  window.history.pushState(newRoute, "", `/app1${path}`);
  renderRoute(newRoute);
}

function renderRoute(currentRoute) {
  if (!checkRouteAccess(currentRoute.path)) {
    handleUnauthorizedAccess(currentRoute.path);
    return;
  }

  switch (currentRoute.path) {
    case "/welcome":
    case "/":
      clearScripts();
      renderWelcome(currentRoute?.data);
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
    case "/member-dashboard":
      clearScripts();
      renderMemberDashboard(currentRoute?.data);
      break;
    case "/event-details":
      clearScripts();
      renderEventDetails(currentRoute?.data);
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
      clearScripts();
      renderWelcome({});
  }
}

async function makeRequest(url, method, body) {
  const BASE_URL = window.location.origin; // same-origin
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

function setLoggedInUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
  localStorage.setItem('isLoggedIn', 'true');
}

function logout() {
  authManager.clearAuth();
}

function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

function isUserLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
}

export { navigateTo, socket, makeRequest, setLoggedInUser, logout, getCurrentUser, isUserLoggedIn };
