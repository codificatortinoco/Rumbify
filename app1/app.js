import renderScreen1 from "./screens/screen1.js";

const socket = io("/", { path: "/real-time" });

function clearScripts() {
  document.getElementById("app").innerHTML = "";
}

let route = { path: "/", data: {} };

switch (route.path) {
  case "/":
    clearScripts();
    renderScreen1(route.data);
    break;
  default:
    const app = document.getElementById("app");
    app.innerHTML = `<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>`;
}

function navigateTo(path, data) {
  route = { path, data };
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
