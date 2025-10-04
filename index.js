require("dotenv").config();
const express = require("express");
const path = require("path");
const { createServer } = require("http");

const usersRouter = require("./server/routes/users.router");
const screen1EventsRouter = require("./server/routes/screen1Events.router");
const partiesRouter = require("./server/routes/parties.router");
const { initSocketInstance } = require("./server/services/socket.service");

const PORT = 5050;

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(express.json());
app.use("/app1", express.static(path.join(__dirname, "app1")));
app.use("/app2", express.static(path.join(__dirname, "app2")));

// Ruta principal - redirige a la aplicación principal
app.get("/", (req, res) => {
  res.redirect("/app1");
});

// Ruta de inicio para la aplicación principal
app.get("/start", (req, res) => {
  res.redirect("/app1");
});

// Routes
app.use("/", usersRouter);
app.use("/", screen1EventsRouter);
app.use("/", partiesRouter);

// Services
initSocketInstance(httpServer);

httpServer.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
