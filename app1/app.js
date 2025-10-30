import renderWelcome from "./screens/welcome.js";
import renderLogin from "./screens/login.js";
import renderRegister from "./screens/register.js";
import renderDashboard, { cleanupDashboard } from "./screens/dashboard.js";
import renderMemberDashboard, { cleanupMemberDashboard } from "./screens/memberDashboard.js";
import renderEventDetails from "./screens/eventDetails.js";
import renderPartyDetails, { cleanupPartyDetails } from "./screens/partyDetails.js";
import renderProfile from "./screens/profile.js";
import renderEditProfile from "./screens/editProfile.js";
import { authManager, checkRouteAccess, handleUnauthorizedAccess } from "./auth.js";

let socket = null;

// Initialize socket only if needed (don't auto-connect)
if (typeof io !== 'undefined') {
  try {
    socket = io("/", { 
      path: "/real-time",
      autoConnect: false
    });
  } catch (error) {
    console.warn('Socket.io initialization failed:', error);
  }
}

function clearScripts() {
  cleanupDashboard();
  cleanupMemberDashboard();
  cleanupPartyDetails();
  
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
  const protectedRoutes = ['/dashboard', '/member-dashboard', '/parties', '/profile', '/edit-profile', '/event-details'];
  
  // Check for party-details route with ID
  if (cleanPath.startsWith('/party-details/') && !isLoggedIn) {
    return { path: '/welcome', data: {} };
  }
  
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
      // Handle dynamic routes
      if (currentRoute.path.startsWith('/party-details/')) {
        clearScripts();
        const partyId = currentRoute.path.split('/')[2];
        console.log('Rendering party details for ID:', partyId);
        renderPartyDetails(partyId);
        break;
      }
      
      // Default fallback
      clearScripts();
      renderWelcome({});
  }
}

async function makeRequest(url, method, body, extraHeaders = {}) {
  console.log('[makeRequest] Making request:', { url, method, body });

  const BASE_URL = "https://my-backend-ochre.vercel.app"; 
  const endpoint = `${BASE_URL}${url}`;
  
  console.log('[makeRequest] Full endpoint:', endpoint);
  
  try {
    // Attach member email automatically for member-protected endpoints
    let userEmail = null;
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      userEmail = currentUser?.email || null;
    } catch (_) {}

    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(userEmail ? { 'x-user-email': userEmail } : {}),
      ...extraHeaders,
    };

    let response = await fetch(endpoint, {
      method: method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    console.log('[makeRequest] Raw response status:', response.status);
    console.log('[makeRequest] Raw response ok:', response.ok);

    // Try JSON first; if it fails, fall back to text for clearer errors
    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      const json = await response.json();
      console.log('[makeRequest] Parsed JSON response:', json);
      return json;
    } else {
      const text = await response.text();
      const normalized = { success: response.ok, status: response.status, message: text };
      console.log('[makeRequest] Non-JSON response:', normalized);
      return normalized;
    }
    
  } catch (error) {
    console.error('[makeRequest] Error in request:', error);
    throw error;
  }
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
