import express, { Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import { requireAuth, AuthenticatedRequest } from "./server/middlewares/auth.middleware.js";

// Import Routers
import authRoutes from "./server/routes/auth.routes.js";
import listingRoutes from "./server/routes/listing.routes.js";
import messageRoutes from "./server/routes/message.routes.js";
import adminRoutes from "./server/routes/admin.routes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Boost payload payload size limit to accept base64 fabric images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Permissive CORS middleware for cross-origin & serverless deployments
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Serve static assets from public
const publicDir = path.join(process.cwd(), "public");
app.use(express.static(publicDir));
app.use("/assets", express.static(path.join(publicDir, "assets")));
app.use("/images", express.static(path.join(publicDir, "images")));

/**
 * REST API Root Endpoint Group
 */
app.get(["/api/health", "/health"], (req, res) => {
  res.json({ status: "ok", name: "UziLink API Service", version: "1.0.0" });
});

// Register Core Subrouters with and without /api prefix
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/listings", listingRoutes);
app.use("/api/messages", messageRoutes);
app.use("/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

// Direct signup & register convenience aliases
app.post(["/api/signup", "/signup", "/api/auth/signup", "/auth/signup"], (req, res, next) => {
  req.url = "/signup";
  authRoutes(req, res, next);
});
app.post(["/api/register", "/register", "/api/auth/register", "/auth/register"], (req, res, next) => {
  req.url = "/register";
  authRoutes(req, res, next);
});
app.post(["/api/login", "/login", "/api/auth/login", "/auth/login"], (req, res, next) => {
  req.url = "/login";
  authRoutes(req, res, next);
});

/**
 * Notifications micro-routes
 */
app.get(["/api/notifications", "/notifications"], requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = db.getNotifications().filter((n) => n.userId === req.user!.id);
    return res.json({ notifications: list });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

app.post(["/api/notifications/read", "/notifications/read"], requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.markNotificationsAsRead(req.user!.id);
    return res.json({ message: "All notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update notification flags" });
  }
});

// JSON fallback 404 for unhandled API calls
app.all(["/api/*", "/auth/*", "/listings/*", "/messages/*", "/admin/*"], (req, res) => {
  res.status(404).json({ message: `API endpoint ${req.method} ${req.path} not found` });
});

/**
 * Build Client & Framework Server integrations (Vite middleware or static fallback)
 */
async function initializeServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode (Vite middleware integration)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode (Static asset streaming service)...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`UziLink environment booted and listending on: http://localhost:${PORT}`);
  });
}

initializeServer().catch((err) => {
  console.error("Critical: Express core server boot sequence crashed!", err);
});
