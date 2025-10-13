import renderWelcome from "./screens/welcome.js";
import renderLogin from "./screens/login.js";
import renderRegister from "./screens/register.js";
import renderDashboard from "./screens/dashboard.js";
import renderEventDetails from "./screens/eventDetails.js";
import renderProfile from "./screens/profile.js";
import renderEditProfile from "./screens/editProfile.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

// Initialize route based on current URL path
function getInitialRoute() {
  const path = window.location.pathname;
  // Remove /app1 prefix if present
  const cleanPath = path.replace('/app1', '') || '/welcome';
  
  // Check if user is logged in for protected routes
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const protectedRoutes = ['/dashboard', '/profile', '/edit-profile', '/event-details'];
  
  if (protectedRoutes.includes(cleanPath) && !isLoggedIn) {
    return { path: '/welcome', data: {} };
  }
  
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
      renderWelcome(currentRoute?.data);
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
  // Check authentication for protected routes
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const protectedRoutes = ['/dashboard', '/profile', '/edit-profile', '/event-details'];
  
  if (protectedRoutes.includes(path) && !isLoggedIn) {
    console.log('Access denied: User not logged in');
    route = { path: '/welcome', data: {} };
    renderRoute(route);
    const newUrl = `/app1/welcome`;
    window.history.pushState({ path: '/welcome', data: {} }, '', newUrl);
    return;
  }
  
  route = { path, data };
  renderRoute(route);
  
  // Update browser URL without page reload
  const newUrl = `/app1${path}`;
  window.history.pushState({ path, data }, '', newUrl);
}

// Authentication helper functions
function setLoggedInUser(userData) {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('currentUser', JSON.stringify(userData));
  localStorage.setItem('currentUserId', userData.id || '1');
}

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('currentUserId');
  navigateTo('/welcome');
}

function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

function isUserLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true';
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

export { navigateTo, socket, makeRequest, setLoggedInUser, logout, getCurrentUser, isUserLoggedIn };
