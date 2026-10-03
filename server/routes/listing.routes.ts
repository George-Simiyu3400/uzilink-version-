import { Router } from "express";
import { 
  getListings, 
  getListingById, 
  createListing, 
  updateListing, 
  deleteListing,
  getChildrenHomes,
  claimDonation,
  getDonationClaims,
  updateDonationStatus
} from "../controllers/listing.controller.js";
import { requireAuth, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Children's Homes Directory & Connection
router.get("/children-homes", optionalAuth, getChildrenHomes);
router.get("/donations", requireAuth, getDonationClaims);
router.post("/donations/claim", requireAuth, claimDonation);
router.patch("/donations/:id", requireAuth, updateDonationStatus);

// Core Marketplace Listings
router.get("/", optionalAuth, getListings);
router.get("/:id", optionalAuth, getListingById);
router.post("/", requireAuth, createListing);
router.patch("/:id", requireAuth, updateListing);
router.delete("/:id", requireAuth, deleteListing);

// Legacy aliases mapping to donations
router.get("/bids", requireAuth, getDonationClaims);
router.post("/quotation", requireAuth, claimDonation);
router.patch("/bids/:id", requireAuth, updateDonationStatus);

export default router;
