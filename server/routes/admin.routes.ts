import { Router } from "express";
import { 
  getUsersList, 
  approveUser, 
  deleteFraudulentListing, 
  getAdminAnalytics 
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure all admin endpoints specifically for the Admin user role
router.get("/users", requireAuth, requireRole(["ADMIN"]), getUsersList);
router.patch("/users/approve/:id", requireAuth, requireRole(["ADMIN"]), approveUser);
router.delete("/listings/moderate/:id", requireAuth, requireRole(["ADMIN"]), deleteFraudulentListing);
router.get("/analytics", requireAuth, requireRole(["ADMIN", "EPR"]), getAdminAnalytics); // allow EPR to view analytics too

export default router;
