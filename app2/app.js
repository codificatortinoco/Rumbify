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

//const socket = io("/", { path: "/real-time" });
const SUPABASE_URL = "https://brqucbjfhlarzrspgoto.supabase.co/"; // Placeholder, will be set dynamically
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycXVjYmpmaGxhcnpyc3Bnb3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODgxMTUsImV4cCI6MjA3NDQ2NDExNX0.0AoeSubn25i8GfJLq5kTJ9JIMrL9Y3YvqYL3RnsHoyg"; // Placeholder, will be set dynamically

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const channel = supabase.channel("realtime-events");

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

function getInitialRoute() {
  const path = window.location.pathname;
  let cleanPath = path.replace('/app2', '') || '/admin-login';
  
  // If admin user is accessing admin-dashboard, redirect to my-parties
  if (cleanPath === '/admin-dashboard' && authManager.isUserAdmin()) {
    cleanPath = '/my-parties';
    // Update the URL in the browser to reflect the redirect
    window.history.replaceState({ path: cleanPath, data: {} }, '', '/app2/my-parties');
  }
  
  const params = new URLSearchParams(window.location.search);
  const data = {};
  // Recuperar contexto de edición para create-party desde query/localStorage
  if (cleanPath === '/create-party') {
    const qsId = params.get('id') || params.get('partyId');
    const qsEdit = params.get('edit');
    if (qsId) data.partyId = Number(qsId);
    if (qsEdit) data.edit = (qsEdit === '1' || qsEdit === 'true');
    if (!data.partyId) {
      try {
        const stored = JSON.parse(localStorage.getItem('createPartyEditContext') || '{}');
        if (stored && stored.partyId) {
          data.partyId = Number(stored.partyId);
          data.edit = true;
        }
      } catch (_) {}
    }
  }
  return { path: cleanPath, data };
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
  let url = `/app2${path}`;
  // Para create-party en modo edición, persistir en query y localStorage
  if (path === '/create-party' && (data.edit || data.mode === 'edit') && data.partyId) {
    const params = new URLSearchParams();
    params.set('edit', '1');
    params.set('id', String(data.partyId));
    url += `?${params.toString()}`;
    try {
      localStorage.setItem('createPartyEditContext', JSON.stringify({ partyId: Number(data.partyId) }));
    } catch (_) {}
  } else {
    try { localStorage.removeItem('createPartyEditContext'); } catch (_) {}
  }
  window.history.pushState(newRoute, "", url);
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
        window.location.href = '/app2/my-parties';
      } else {
        window.location.href = '/app1/welcome';
      }
  }
}

// Centralized request helper that always targets current origin to avoid CORS
async function makeRequest(url, method, body, extraHeaders = {}) {
  const BASE_URL = "https://my-backend-ochre.vercel.app/"; // same-origin to avoid CORS issues
  const endpoint = `${BASE_URL}${url}`;

  // Attach admin email header automatically if present
  let adminEmail = null;
  try {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    adminEmail = adminUser?.email || null;
  } catch (_) {}

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    ...(adminEmail ? { 'x-admin-email': adminEmail } : {}),
    ...extraHeaders,
  };

  const resp = await fetch(endpoint, {
    method,
    headers,
    // Don't send body for GET/HEAD requests (not allowed by HTTP spec)
    body: (body !== undefined && !['GET', 'HEAD'].includes(method.toUpperCase())) 
      ? JSON.stringify(body) 
      : undefined,
  });

  const contentType = (resp.headers.get('content-type') || '').toLowerCase();

  // Try to parse JSON if available; otherwise, read text for clearer errors
  if (contentType.includes('application/json')) {
    const json = await resp.json();
    return json;
  } else {
    const text = await resp.text();
    // Normalize into a consistent object so callers can show message
    return {
      success: resp.ok,
      status: resp.status,
      message: text || `Unexpected ${resp.status} response`,
    };
  }
}

export { navigateTo, channel, makeRequest };
