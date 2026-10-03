import express, { Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { db } from "./db.js";
import { requireAuth, AuthenticatedRequest } from "./middlewares/auth.middleware.js";

// Import Routers
import authRoutes from "./routes/auth.routes.js";
import listingRoutes from "./routes/listing.routes.js";
import messageRoutes from "./routes/message.routes.js";
import adminRoutes from "./routes/admin.routes.js";

dotenv.config();

const app = express();

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

// Serve static assets from public/assets and public
const publicPath = path.join(process.cwd(), "public");
app.use(express.static(publicPath));
app.use("/assets", express.static(path.join(publicPath, "assets")));
app.use("/images", express.static(path.join(publicPath, "images")));

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

export { app };
export default app;
