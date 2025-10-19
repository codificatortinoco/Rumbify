require("dotenv").config();
const express = require("express");
const path = require("path");
const { createServer } = require("http");

const usersRouter = require("./server/routes/users.router");
const partiesRouter = require("./server/routes/parties.router");
const adminRouter = require("./server/routes/admin.router");
const codesRouter = require("./server/routes/codes.router");
const { initSocketInstance } = require("./server/services/socket.service");

const PORT = 5050;

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(express.json());

// Serve static files for both apps
app.use("/app1", express.static(path.join(__dirname, "app1")));
app.use("/app2", express.static(path.join(__dirname, "app2")));

// Ruta principal - redirige a la pantalla de bienvenida
app.get("/", (req, res) => {
  res.redirect("/app1/welcome");
});

// Ruta de inicio para la aplicación principal
app.get("/start", (req, res) => {
  res.redirect("/app1/welcome");
});

// Handle SPA routing for app1 - serve index.html for any non-API routes
app.get("/app1/*", (req, res) => {
  res.sendFile(path.join(__dirname, "app1", "index.html"));
});

// Handle SPA routing for app2 - serve index.html for any non-API routes
app.get("/app2/*", (req, res) => {
  res.sendFile(path.join(__dirname, "app2", "index.html"));
});

// Routes
app.use("/", usersRouter);
app.use("/", partiesRouter);
app.use("/", adminRouter);
app.use("/codes", codesRouter);

// Services
initSocketInstance(httpServer);

httpServer.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
