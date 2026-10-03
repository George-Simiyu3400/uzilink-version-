import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { db, Listing, DonationClaim } from "../db.js";

/**
 * Fetch listings with marketplace filtering (Category, Material, Weight, Price, Location, Recyclability, Condition, isDonation)
 */
export async function getListings(req: AuthenticatedRequest, res: Response) {
  try {
    let listings = db.getListings();

    const { 
      material, 
      category,
      minWeight, 
      maxWeight, 
      maxPrice, 
      location, 
      minRecyclability, 
      condition, 
      search, 
      sellerId,
      isDonation 
    } = req.query;

    if (sellerId) {
      listings = listings.filter((l) => l.sellerId === String(sellerId));
    } else {
      // By default query published and active listings
      listings = listings.filter((l) => l.status === "PUBLISHED" || l.status === "SOLD");
    }

    if (isDonation === "true") {
      listings = listings.filter((l) => l.isDonation === true || l.estimatedPriceKES === 0);
    } else if (isDonation === "false") {
      listings = listings.filter((l) => !l.isDonation && l.estimatedPriceKES > 0);
    }

    if (category) {
      const catStr = String(category).toLowerCase();
      listings = listings.filter((l) => (l.category || "").toLowerCase().includes(catStr));
    }

    if (material) {
      const matStr = String(material).toLowerCase();
      listings = listings.filter((l) => 
        l.material.toLowerCase().includes(matStr) || 
        l.fabricType.toLowerCase().includes(matStr)
      );
    }

    if (minWeight) {
      listings = listings.filter((l) => l.weightKg >= Number(minWeight));
    }
    
    if (maxWeight) {
      listings = listings.filter((l) => l.weightKg <= Number(maxWeight));
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      listings = listings.filter((l) => l.estimatedPriceKES <= Number(maxPrice));
    }

    if (location) {
      const locStr = String(location).toLowerCase();
      listings = listings.filter((l) => l.location.toLowerCase().includes(locStr));
    }

    if (minRecyclability) {
      listings = listings.filter((l) => l.recyclabilityScore >= Number(minRecyclability));
    }

    if (condition) {
      const condStr = String(condition).toLowerCase();
      listings = listings.filter((l) => l.condition.toLowerCase().includes(condStr));
    }

    if (search) {
      const query = String(search).toLowerCase();
      listings = listings.filter(
        (l) =>
          l.material.toLowerCase().includes(query) ||
          l.fabricType.toLowerCase().includes(query) ||
          (l.category && l.category.toLowerCase().includes(query)) ||
          l.description.toLowerCase().includes(query) ||
          l.location.toLowerCase().includes(query) ||
          (l.targetChildrenHomeName && l.targetChildrenHomeName.toLowerCase().includes(query))
      );
    }

    return res.json({ listings });
  } catch (error) {
    return res.status(500).json({ message: "Failed to query Listings database" });
  }
}

/**
 * Retrieve one listing details & increment view count
 */
export async function getListingById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const listings = db.getListings();
    const lIdx = listings.findIndex((l) => l.id === id);

    if (lIdx === -1) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const listing = listings[lIdx];
    db.updateListing(id, { viewsCount: (listing.viewsCount || 0) + 1 });

    return res.json({ listing: db.getListings()[lIdx] });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load listing details" });
  }
}

/**
 * Create listing - Clean and direct (no AI analysis blocker, user controls details)
 */
export async function createListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      weightKg, 
      quantity, 
      location, 
      fabricType,
      category,
      material,
      condition,
      color,
      texture,
      estimatedPriceKES,
      isDonation,
      targetChildrenHomeId,
      targetChildrenHomeName,
      contactPhone,
      description,
      imageB64, 
      imageUrl,
      mimeType, 
      isDraft 
    } = req.body;

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    if (!weightKg || !quantity || !location) {
      return res.status(400).json({ message: "Weight, quantity, and location are mandatory" });
    }

    const numWeight = Number(weightKg);
    const numQty = Number(quantity);
    const isFreeDonation = Boolean(isDonation) || Number(estimatedPriceKES) === 0;

    // Direct image handling
    let finalImg = imageUrl || "/assets/images/hero_kenyan_textile_1790988200150.jpg";
    if (imageB64) {
      finalImg = `data:${mimeType || "image/jpeg"};base64,${imageB64}`;
    }

    // Recyclability score estimation based on material
    let recScore = 85;
    const matLow = (material || "").toLowerCase();
    if (matLow.includes("cotton") || matLow.includes("flannel") || matLow.includes("wool")) {
      recScore = 95;
    } else if (matLow.includes("denim")) {
      recScore = 88;
    } else if (matLow.includes("polyester") || matLow.includes("fleece")) {
      recScore = 90;
    } else if (matLow.includes("blend") || matLow.includes("mixed")) {
      recScore = 75;
    }

    // Clean carbon savings calculation: standard 3.0 kg CO2 saved per kg diverted
    const carbonSavings = Math.round(numWeight * 3.0);

    // Default description if user didn't specify one
    let desc = description;
    if (!desc || !desc.trim()) {
      if (isFreeDonation) {
        desc = `Clean batch of ${fabricType || "wearable textiles"} available for direct donation to Children's Homes or charitable shelters.`;
      } else {
        desc = `Batch of ${fabricType || "textile scraps"} ready for upcycling, recycling, or artisan use. Clean and sorted.`;
      }
    }

    const newListing: Listing = {
      id: `list-${Date.now()}`,
      sellerId: req.user.id,
      sellerName: req.user.name,
      weightKg: numWeight,
      quantity: numQty,
      location: String(location),
      imageUrl: finalImg,
      category: category || (isFreeDonation ? "Children & Baby Clothes" : "General Textile Scraps"),
      fabricType: fabricType || (isFreeDonation ? "Wearable Clothing & Textiles" : "Sorted Textile Offcuts"),
      material: material || "Cotton & Fabric Blends",
      condition: condition || (isFreeDonation ? "Clean & Wearable (Ready for Use)" : "Sorted Scraps"),
      color: color || "Mixed / Assorted",
      texture: texture || "Soft & Clean",
      recyclabilityScore: recScore,
      estimatedPriceKES: isFreeDonation ? 0 : (Number(estimatedPriceKES) || Math.round(numWeight * 100)),
      confidence: 95,
      recommendedIndustries: isFreeDonation 
        ? ["Children's Homes Support", "Charity Shelters", "Vocational Training"] 
        : ["Eco-apparel Upcycling", "Mechanical Fiber Recycling", "Artisan Workshops"],
      upcyclingIdeas: isFreeDonation
        ? ["Direct wearing for children and babies", "Dormitory bedsheets and blankets", "Vocational sewing classes"]
        : ["Patchwork totes", "Acoustic padding", "Industrial wiping cottons"],
      carbonSavingsKg: carbonSavings,
      description: desc,
      status: isDraft ? "DRAFT" : "PUBLISHED",
      viewsCount: 0,
      isDonation: isFreeDonation,
      targetChildrenHomeId: targetChildrenHomeId || undefined,
      targetChildrenHomeName: targetChildrenHomeName || undefined,
      contactPhone: contactPhone || undefined,
      createdAt: new Date().toISOString()
    };

    db.addListing(newListing);

    // If it's a donation for Children's Homes, notify registered Children's Homes
    if (!isDraft && isFreeDonation) {
      db.getUsers().forEach((user) => {
        if (user.role === "CHILDRENS_HOME") {
          db.addNotification({
            id: `notif-${Date.now()}`,
            userId: user.id,
            title: "New Free Clothes / Textiles Donated Nearby!",
            message: `${newListing.sellerName} listed ${newListing.weightKg} Kg of ${newListing.fabricType} in ${newListing.location}.`,
            read: false,
            createdAt: new Date().toISOString()
          });
        }
      });
    }

    return res.status(201).json({
      message: isFreeDonation 
        ? "Donation batch listed successfully for Children's Homes!" 
        : "Listing declared and published successfully",
      listing: newListing
    });
  } catch (error) {
    console.error("Listing creation failed:", error);
    return res.status(500).json({ message: "Failed to create listing" });
  }
}

/**
 * Update listing parameters
 */
export async function updateListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const l = db.getListings().find((item) => item.id === id);

    if (!l) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (l.sellerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: You are not the owner of this listing" });
    }

    db.updateListing(id, req.body);
    return res.json({ message: "Listing updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update listing parameters" });
  }
}

/**
 * Delete a listing (by owner or admin)
 */
export async function deleteListing(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const l = db.getListings().find((item) => item.id === id);

    if (!l) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (l.sellerId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ message: "Forbidden: You are not authorized to delete this listing" });
    }

    db.deleteListing(id);
    return res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete listing" });
  }
}

/**
 * Children's Homes Directory Endpoint
 */
export async function getChildrenHomes(req: AuthenticatedRequest, res: Response) {
  try {
    const homes = db.getChildrenHomes();
    return res.json({ homes });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch Children's Homes directory" });
  }
}

/**
 * Claim or Connect Clothes/Textiles to a Children's Home
 */
export async function claimDonation(req: AuthenticatedRequest, res: Response) {
  try {
    const { 
      listingId, 
      childrenHomeId, 
      childrenHomeName, 
      notes, 
      pickupLocation 
    } = req.body;

    if (!childrenHomeId || !childrenHomeName) {
      return res.status(400).json({ message: "Please specify the receiving Children's Home" });
    }

    let itemTitle = "Clothes & Textile Donation";
    let weightKg = 0;
    let donorId = req.user!.id;
    let donorName = req.user!.name;

    if (listingId) {
      const listing = db.getListings().find((l) => l.id === listingId);
      if (listing) {
        itemTitle = `${listing.fabricType} (${listing.weightKg} Kg)`;
        weightKg = listing.weightKg;
        donorId = listing.sellerId;
        donorName = listing.sellerName || "Donor";

        // Mark listing status as reserved or coordinated
        db.updateListing(listingId, { 
          targetChildrenHomeId: childrenHomeId,
          targetChildrenHomeName: childrenHomeName,
          status: "SOLD" // Marked as allocated/fulfilled
        });

        // Notify donor
        db.addNotification({
          id: `notif-${Date.now()}`,
          userId: listing.sellerId,
          title: "Donation Connected to Children's Home!",
          message: `${childrenHomeName} was linked to your listing: ${listing.fabricType}.`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    const newClaim: DonationClaim = {
      id: `claim-${Date.now()}`,
      listingId: listingId || undefined,
      listingTitle: itemTitle,
      donorId,
      donorName,
      childrenHomeId,
      childrenHomeName,
      itemType: itemTitle,
      weightKg: weightKg || undefined,
      pickupLocation: pickupLocation || "Coordinated pickup or drop-off",
      notes: notes || "Connected via UziLink Children's Home circular network",
      status: "COORDINATED",
      createdAt: new Date().toISOString()
    };

    db.addDonationClaim(newClaim);

    // Send chat confirmation message to partner
    if (listingId && donorId !== req.user!.id) {
      db.addMessage({
        id: `msg-${Date.now()}`,
        senderId: req.user!.id,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        receiverId: donorId,
        receiverName: donorName,
        content: `Hello! We have connected ${childrenHomeName} to receive this donation (${itemTitle}). Note: ${notes || "Looking forward to pickup/delivery."}`,
        listingId,
        createdAt: new Date().toISOString(),
        read: false
      });
    }

    return res.status(201).json({
      message: `Successfully connected donation to ${childrenHomeName}!`,
      claim: newClaim
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to connect donation" });
  }
}

/**
 * Retrieve donation claims
 */
export async function getDonationClaims(req: AuthenticatedRequest, res: Response) {
  try {
    const allClaims = db.getDonationClaims();
    let filtered = allClaims;

    // Filter by user role if not admin
    if (req.user && req.user.role !== "ADMIN") {
      filtered = allClaims.filter(
        (c) => c.donorId === req.user!.id || c.childrenHomeId === req.user!.id
      );
      // If user has few or none, return all claims so they see recent circular impact!
      if (filtered.length === 0) {
        filtered = allClaims;
      }
    }

    return res.json({ claims: filtered });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch donation claims" });
  }
}

/**
 * Update donation claim status
 */
export async function updateDonationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["PENDING", "COORDINATED", "DELIVERED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ message: "Invalid donation status" });
    }

    db.updateDonationClaimStatus(id, status);
    return res.json({ message: `Donation status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update donation status" });
  }
}
