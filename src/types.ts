export type UserRole = "SELLER" | "RECYCLER" | "MANUFACTURER" | "ARTISAN" | "CHILDRENS_HOME" | "EPR" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  verified: boolean;
  organizationName?: string;
  location?: string;
  createdAt?: string;
}

export interface ListingItem {
  id: string;
  sellerId: string;
  sellerName?: string;
  weightKg: number;
  quantity: number;
  location: string;
  imageUrl: string;
  category?: string;
  fabricType: string;
  material: string;
  condition: string;
  color: string;
  texture: string;
  recyclabilityScore: number;
  estimatedPriceKES: number;
  confidence: number;
  recommendedIndustries: string[];
  upcyclingIdeas: string[];
  carbonSavingsKg: number;
  description: string;
  status: "PUBLISHED" | "SOLD" | "DRAFT";
  viewsCount: number;
  isDonation?: boolean;
  targetChildrenHomeId?: string;
  targetChildrenHomeName?: string;
  contactPhone?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
}

export interface ChildrenHomeItem {
  id: string;
  name: string;
  county: string;
  neighborhood: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  contactPerson: string;
  childrenCount: number;
  ageRange: string;
  urgentNeeds: string[];
  acceptedItems: string[];
  description: string;
  imageUrl?: string;
  verified: boolean;
  distanceKm?: number; // Computed on the fly based on user coordinates!
}

export interface DonationClaimItem {
  id: string;
  listingId?: string;
  listingTitle?: string;
  donorId: string;
  donorName: string;
  childrenHomeId: string;
  childrenHomeName: string;
  itemType: string;
  weightKg?: number;
  quantityNotes?: string;
  pickupLocation: string;
  notes: string;
  status: "PENDING" | "COORDINATED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  receiverId: string;
  receiverName?: string;
  content: string;
  listingId?: string;
  createdAt: string;
  read: boolean;
}

export interface ChatThread {
  lastMessage: DirectMessage;
  partnerId: string;
  partnerName: string;
}

// Backwards-compatible alias for any residual references
export type BuyerRequestItem = DonationClaimItem;

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminAnalyticsReport {
  totalWeightKg: number;
  solvedWeightKg: number;
  totalCarbonSavedKg: number;
  totalKESValue: number;
  userCount: number;
  roleStats: {
    SELLER: number;
    RECYCLER: number;
    MANUFACTURER: number;
    ARTISAN: number;
    CHILDRENS_HOME: number;
    EPR: number;
    ADMIN: number;
  };
  pendingReviewCount: number;
  recentLogs: AuditLogItem[];
}
