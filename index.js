require("dotenv").config();
const express = require("express");
const path = require("path");
const { createServer } = require("http");

const usersRouter = require("./server/routes/users.router");
const partiesRouter = require("./server/routes/parties.router");
const adminRouter = require("./server/routes/admin.router");
const codesRouter = require("./server/routes/codes.router");
const { initSocketInstance } = require("./server/services/socket.service");

const PORT = Number(process.env.PORT) || 5050;

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static files for both apps
app.use("/app1", express.static(path.join(__dirname, "app1")));
app.use("/app2", express.static(path.join(__dirname, "app2")));

// Expose dynamic Supabase client module for app2
app.get("/app2/services/supabase.service.js", (req, res) => {
  const url = process.env.SUPABASE_URL || "";
  const anon = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY || "";
  res.type("application/javascript");
  if (!url || !anon) {
    return res.send("export const supabaseCli = null;\nconsole.warn('Supabase config missing');");
  }
  const moduleCode = `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';\nexport const supabaseCli = createClient('${url}', '${anon}');`;
  res.send(moduleCode);
});

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
