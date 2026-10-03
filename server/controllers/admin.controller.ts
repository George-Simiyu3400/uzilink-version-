import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db } from "../db.js";

/**
 * Moderate User registration approvals (Recyclers & Manufacturers)
 */
export async function approveUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (status !== "APPROVED" && status !== "REJECTED") {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    const u = db.getUsers().find((item) => item.id === id);
    if (!u) {
      return res.status(404).json({ message: "User account not found" });
    }

    db.updateUser(id, { approvalStatus: status });

    db.addNotification({
      id: `notif-${Date.now()}`,
      userId: id,
      title: `Account Review: ${status}`,
      message: `Your business account application has been reviewed and: ${status} by UziLink Administrators.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    db.addAuditLog(req.user!.id, "USER_APPROVED", `Admin ${req.user!.email} updated ${u.email} status to ${status}`);

    return res.json({ message: `User registration updated to: ${status}` });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update business credentials" });
  }
}

/**
 * Delete fraudulent listing
 */
export async function deleteFraudulentListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const listing = db.getListings().find((l) => l.id === id);
    
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    db.deleteListing(id);

    // Notify original seller
    db.addNotification({
      id: `notif-${Date.now()}`,
      userId: listing.sellerId,
      title: "Listing Moderated / Removed",
      message: `Your listing for "${listing.fabricType}" was removed by Administrators due to platform guidelines compliance review.`,
      read: false,
      createdAt: new Date().toISOString()
    });

    db.addAuditLog(req.user!.id, "LISTING_MODERATED", `Listing ${id} removed by administrator`);

    return res.json({ message: "Fraudulent listing successfully moderated and deleted." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete listing" });
  }
}

/**
 * Gather aggregated textile performance analytics
 */
export async function getAdminAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const listings = db.getListings();
    const users = db.getUsers();
    
    const totalWeightKg = listings.reduce((acc, l) => acc + l.weightKg, 0);
    const solvedWeightKg = listings.filter(l => l.status === "SOLD").reduce((acc, l) => acc + l.weightKg, 0);
    const totalCarbonSavedKg = listings.reduce((acc, l) => acc + l.carbonSavingsKg, 0);
    const totalKESValue = listings.reduce((acc, l) => acc + l.estimatedPriceKES, 0);

    const userCount = users.length;
    const roleStats = {
      SELLER: users.filter(u => u.role === "SELLER").length,
      RECYCLER: users.filter(u => u.role === "RECYCLER").length,
      MANUFACTURER: users.filter(u => u.role === "MANUFACTURER").length,
      EPR: users.filter(u => u.role === "EPR").length,
      ADMIN: users.filter(u => u.role === "ADMIN").length
    };

    // Recyclers / manufacturers needing confirmation
    const pendingReviewCount = users.filter(u => u.approvalStatus === "PENDING").length;

    // Compile recent audit activity logs
    const recentLogs = db.getAuditLogs().slice(0, 15);

    return res.json({
      analytics: {
        totalWeightKg,
        solvedWeightKg,
        totalCarbonSavedKg,
        totalKESValue,
        userCount,
        roleStats,
        pendingReviewCount,
        recentLogs
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to retrieve analytics" });
  }
}

/**
 * Retrieve list of all users
 */
export async function getUsersList(req: AuthenticatedRequest, res: Response) {
  try {
    const users = db.getUsers().map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      approvalStatus: u.approvalStatus,
      verified: u.verified,
      organizationName: u.organizationName,
      location: u.location,
      createdAt: u.createdAt
    }));
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user directory" });
  }
}
