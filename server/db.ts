import fs from "fs";
import path from "path";
import { hashPassword } from "./utils/crypto.js";

// Database file path
const DB_FILE = path.join(process.cwd(), "db_data.json");

export type UserRole = "SELLER" | "RECYCLER" | "MANUFACTURER" | "ARTISAN" | "CHILDRENS_HOME" | "EPR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  verified: boolean;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  organizationName?: string;
  location?: string;
  createdAt: string;
}

export interface Listing {
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

export interface ChildrenHome {
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
}

export interface DonationClaim {
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

export interface Message {
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

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

interface DBStructure {
  users: User[];
  listings: Listing[];
  childrenHomes: ChildrenHome[];
  donationClaims: DonationClaim[];
  messages: Message[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

// In-Memory Fallback State in case we run in write-prohibited servers
let dbState: DBStructure = {
  users: [],
  listings: [],
  childrenHomes: [],
  donationClaims: [],
  messages: [],
  notifications: [],
  auditLogs: []
};

// Seed Children's Homes in Kenya with realistic coordinates
export const SEED_CHILDRENS_HOMES: ChildrenHome[] = [
  {
    id: "home-1",
    name: "Nyumbani Children's Home",
    county: "Nairobi",
    neighborhood: "Karen / Dagoretti South",
    lat: -1.3328,
    lng: 36.7198,
    phone: "+254 722 201 103",
    email: "info@nyumbani.org",
    contactPerson: "Sister Mary Owens",
    childrenCount: 110,
    ageRange: "0 - 18 Years",
    urgentNeeds: ["Warm winter sweaters", "Bed sheets & blankets", "Baby flannels", "Fabric offcuts for vocational tailoring"],
    acceptedItems: ["Clean wearable clothes", "Bedding & towels", "Shoe pairs", "Tailoring scrap fabrics"],
    description: "Home providing compassionate holistic care, education, and vocational tailoring training to orphaned and vulnerable children in Karen.",
    imageUrl: "/assets/images/artisans_workshop_1790988232395.jpg",
    verified: true
  },
  {
    id: "home-2",
    name: "Thomas Barnardo House (Kenya Children's Home)",
    county: "Nairobi",
    neighborhood: "Lang'ata Road (near Wilson Airport)",
    lat: -1.3283,
    lng: 36.7972,
    phone: "+254 722 200 404",
    email: "reception@kch.or.ke",
    contactPerson: "David Muthama",
    childrenCount: 200,
    ageRange: "0 - 17 Years",
    urgentNeeds: ["Infant baby wear (0-3 yrs)", "Primary school uniforms", "Heavy fleece blankets", "Socks & nightwear"],
    acceptedItems: ["Baby clothing", "Children casual wear", "Towels & face cloths", "Curtain & bed linen fabrics"],
    description: "One of Kenya's oldest sanctuary homes caring for orphaned babies, toddlers, and youth with full schooling and vocational crafts.",
    imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
    verified: true
  },
  {
    id: "home-3",
    name: "Mogra Children's Centre",
    county: "Nairobi",
    neighborhood: "Muthaiga North / Kiambu Road",
    lat: -1.2405,
    lng: 36.8582,
    phone: "+254 722 841 332",
    email: "contact@mograchildren.org",
    contactPerson: "Hannah Wairimu",
    childrenCount: 350,
    ageRange: "1 - 19 Years",
    urgentNeeds: ["Toddler everyday play clothes", "Warm jackets & hoodies", "Denim pants", "Cotton cutting scraps for quilt making"],
    acceptedItems: ["Children clothes (all ages)", "Blankets & mattress covers", "Textile remnants for sewing classes"],
    description: "Vibrant home and academy rescuing street-connected children and orphans along Kiambu Road, featuring an active tailoring training studio.",
    imageUrl: "/assets/images/hero_kenyan_textile_1790988200150.jpg",
    verified: true
  },
  {
    id: "home-4",
    name: "New Life Home Trust",
    county: "Nairobi",
    neighborhood: "Kilimani / Ring Road",
    lat: -1.2985,
    lng: 36.7905,
    phone: "+254 722 406 064",
    email: "kilimani@newlifehometrust.org",
    contactPerson: "Pastor Janet Kilonzo",
    childrenCount: 65,
    ageRange: "0 - 4 Years (Infants & Toddlers)",
    urgentNeeds: ["Newborn baby onesies", "Soft swaddle wraps", "Baby caps and booties", "Pure cotton flannel cloths"],
    acceptedItems: ["Infant wear", "Crib bedding", "Soft cotton scraps", "Baby blankets"],
    description: "Dedicated crisis infant care rescue center specializing in orphaned, abandoned, and vulnerable babies aged 0 to 4 years.",
    imageUrl: "/assets/images/kenyan_textile_collection_1790988223725.jpg",
    verified: true
  },
  {
    id: "home-5",
    name: "SOS Children's Village Nairobi",
    county: "Nairobi",
    neighborhood: "Buruburu Phase 2 / Eastlands",
    lat: -1.2872,
    lng: 36.8795,
    phone: "+254 722 203 144",
    email: "nairobi@soskenya.org",
    contactPerson: "Kevin Otieno",
    childrenCount: 140,
    ageRange: "4 - 18 Years",
    urgentNeeds: ["Teen casual clothes", "School shoes & socks", "Sports tracksuits", "Cotton sheets & duvet covers"],
    acceptedItems: ["Pre-teen and teen clothes", "Sports wear", "Uniform fabrics", "Heavy blankets"],
    description: "Family-like community village in Eastlands offering continuous shelter, education, and youth empowerment for orphaned children.",
    imageUrl: "/assets/images/artisans_workshop_1790988232395.jpg",
    verified: true
  },
  {
    id: "home-6",
    name: "St. Nicholas Children's Home",
    county: "Nairobi",
    neighborhood: "Karen / Ngong Road",
    lat: -1.3190,
    lng: 36.7320,
    phone: "+254 721 544 321",
    email: "stnicholas@karenchildren.org",
    contactPerson: "Father Anthony",
    childrenCount: 85,
    ageRange: "3 - 16 Years",
    urgentNeeds: ["Warm pullovers", "Primary school skirts & trousers", "Bedsheets", "Textile offcuts for craft lessons"],
    acceptedItems: ["Kids clothes", "Linens", "Textile offcuts", "Blankets"],
    description: "Community children's sanctuary supporting orphaned kids with education, Christian mentorship, and life skills tailoring.",
    imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
    verified: true
  },
  {
    id: "home-7",
    name: "Mama Ngina Children's Home",
    county: "Nairobi",
    neighborhood: "South C / Bellevue",
    lat: -1.3198,
    lng: 36.8324,
    phone: "+254 722 390 120",
    email: "info@mamangina.org",
    contactPerson: "Gladys Cherono",
    childrenCount: 90,
    ageRange: "2 - 16 Years",
    urgentNeeds: ["Boys trousers and t-shirts", "Girls dresses", "Warm sweaters", "Bedding & pillow covers"],
    acceptedItems: ["Clean wearable clothing", "Blankets", "Shoes", "Scrap fabrics for cushion making"],
    description: "Government-supported registered charitable children's institution in South C catering for vulnerable children.",
    imageUrl: "/assets/images/hero_kenyan_textile_1790988200150.jpg",
    verified: true
  },
  {
    id: "home-8",
    name: "Tumaini Children's Home",
    county: "Uasin Gishu",
    neighborhood: "Eldoret Town / Pioneer",
    lat: 0.5143,
    lng: 35.2698,
    phone: "+254 722 612 890",
    email: "tumaini@eldoretkids.org",
    contactPerson: "Pastor Wilson Kiprono",
    childrenCount: 120,
    ageRange: "2 - 18 Years",
    urgentNeeds: ["Heavy highland winter jackets", "Warm wool blankets", "School uniform materials", "Raincoats"],
    acceptedItems: ["Cold-climate clothing", "Heavy fleece sheets", "Sturdy footwear", "Sewing fabric rolls"],
    description: "Highland shelter in Eldoret where cold morning temperatures create high continuous demand for warm blankets and heavy clothing.",
    imageUrl: "/assets/images/kenyan_textile_collection_1790988223725.jpg",
    verified: true
  },
  {
    id: "home-9",
    name: "St. Joseph's Children's Home",
    county: "Nakuru",
    neighborhood: "Nakuru West / Free Area",
    lat: -0.3031,
    lng: 36.0800,
    phone: "+254 723 908 112",
    email: "stjoseph@nakuruchildren.org",
    contactPerson: "Sister Beatrice",
    childrenCount: 95,
    ageRange: "4 - 17 Years",
    urgentNeeds: ["School sweaters & tracksuits", "Everyday play clothes", "Warm duvets", "Tailoring scraps"],
    acceptedItems: ["Wearable clothes", "Blankets", "Fabric rolls", "Towels"],
    description: "Faith-based home and vocational workshop in Nakuru rescuing orphaned children from across the Rift Valley.",
    imageUrl: "/assets/images/artisans_workshop_1790988232395.jpg",
    verified: true
  },
  {
    id: "home-10",
    name: "Amani Children's Home",
    county: "Mombasa",
    neighborhood: "Mtwapa / North Coast",
    lat: -3.9458,
    lng: 39.7431,
    phone: "+254 724 331 990",
    email: "info@amanicoast.org",
    contactPerson: "Fatuma Bakari",
    childrenCount: 80,
    ageRange: "1 - 16 Years",
    urgentNeeds: ["Light breathable cotton clothes", "Shorts & t-shirts", "School uniforms", "Mosquito net fabric / light bedsheets"],
    acceptedItems: ["Pure cotton clothing", "Light linens", "Sandals & shoes", "Cotton fabric remnants"],
    description: "Coast community rescue center supporting orphaned and vulnerable coastal children with holistic education and shelter.",
    imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
    verified: true
  }
];

// Seed Function
function generateSeedData(): DBStructure {
  const users: User[] = [
    {
      id: "u-admin",
      name: "UziLink System Admin",
      email: "admin@uzilink.com",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "UziLink Kenya",
      location: "Nairobi, HQ",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-seller-1",
      name: "David Mitumba Trader",
      email: "seller@uzilink.com",
      passwordHash: hashPassword("seller123"),
      role: "SELLER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Nairobi Mitumba Sorting",
      location: "Gikomba Market, Nairobi",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-recycler-1",
      name: "Green Loop Fiber Recyclers",
      email: "recycler@uzilink.com",
      passwordHash: hashPassword("recycler123"),
      role: "RECYCLER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Green Loop Textile Solutions",
      location: "Industrial Area, Nairobi",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-home-1",
      name: "Sister Mary Owens",
      email: "childrenshome@uzilink.com",
      passwordHash: hashPassword("children123"),
      role: "CHILDRENS_HOME",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Nyumbani Children's Home (Karen)",
      location: "Karen, Nairobi",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-artisan-1",
      name: "Wanjiku Upcycled Crafts",
      email: "artisan@uzilink.com",
      passwordHash: hashPassword("artisan123"),
      role: "ARTISAN",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Wanjiku Textile Collective",
      location: "Kibera Arts Center, Nairobi",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-manuf-1",
      name: "Rivatex East Africa",
      email: "manufacturer@uzilink.com",
      passwordHash: hashPassword("manufacturer123"),
      role: "MANUFACTURER",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Rivatex Textile Millers",
      location: "Eldoret, Kenya",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-epr-1",
      name: "Joyce Kamau (KEPRO)",
      email: "epr@uzilink.com",
      passwordHash: hashPassword("epr123"),
      role: "EPR",
      verified: true,
      approvalStatus: "APPROVED",
      organizationName: "Kenya Extended Producer Responsibility Org",
      location: "Gigiri, Nairobi",
      createdAt: new Date().toISOString()
    }
  ];

  const listings: Listing[] = [
    {
      id: "list-clothes-1",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 85,
      quantity: 4,
      location: "Gikomba Market, Nairobi",
      imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
      category: "Children & Baby Clothes",
      fabricType: "Sorted Kids Sweaters, T-Shirts & Pants",
      material: "100% Combed Cotton & Fleece Blends",
      condition: "Gently Worn, Clean & Sorted (Ready to Wear)",
      color: "Assorted Bright Colors & Heathers",
      texture: "Soft knit, clean & wearable",
      recyclabilityScore: 95,
      estimatedPriceKES: 0,
      confidence: 96,
      recommendedIndustries: ["Children's Homes Donation", "Charitable Shelter Care"],
      upcyclingIdeas: ["Immediate wearing for children aged 2-10", "Warm layer sweaters for cold nights"],
      carbonSavingsKg: 255,
      description: "Clean, sorted bundle of kids t-shirts, warm sweaters, and elastic waist pants from our Gikomba sorting warehouse. 100% free donation reserved for nearby Children's Homes!",
      status: "PUBLISHED",
      viewsCount: 38,
      isDonation: true,
      targetChildrenHomeId: "home-2",
      targetChildrenHomeName: "Thomas Barnardo House (Lang'ata)",
      contactPhone: "+254 712 345 678",
      coordinates: { lat: -1.2858, lng: 36.8398 },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "list-blankets-2",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 120,
      quantity: 6,
      location: "Lang'ata Depot, Nairobi",
      imageUrl: "/assets/images/kenyan_textile_collection_1790988223725.jpg",
      category: "Warm Blankets & Bedding",
      fabricType: "Heavy Polar Fleece & Flannel Blankets",
      material: "Polyester Fleece & Heavy Cotton Flannel",
      condition: "Clean Sorted Linen Overstock",
      color: "Blue, Green, Charcoal & Plaids",
      texture: "Warm, fluffy high-pile fleece",
      recyclabilityScore: 90,
      estimatedPriceKES: 0,
      confidence: 94,
      recommendedIndustries: ["Children's Homes Donation", "Bedding & Shelter Comfort"],
      upcyclingIdeas: ["Warm bedding blankets for children's dormitories", "Mattress comfort pads"],
      carbonSavingsKg: 360,
      description: "High quality warm blankets, bedsheets, and fleece swaddles sorted from retail overstock. Ready for pickup or delivery to local orphanages and shelters in Lang'ata / Karen.",
      status: "PUBLISHED",
      viewsCount: 42,
      isDonation: true,
      targetChildrenHomeId: "home-1",
      targetChildrenHomeName: "Nyumbani Children's Home (Karen)",
      contactPhone: "+254 712 345 678",
      coordinates: { lat: -1.3320, lng: 36.7500 },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "list-1",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 450,
      quantity: 9,
      location: "Gikomba Market, Nairobi",
      imageUrl: "/assets/images/hero_kenyan_textile_1790988200150.jpg",
      category: "Denim & Twill Offcuts",
      fabricType: "Denim & Twill Scraps",
      material: "100% Cotton & Denim Blends",
      condition: "Hardware-Free Sorted Mitumba Offcuts",
      color: "Blue, Teal, Charcoal",
      texture: "Rough, Heavy weave",
      recyclabilityScore: 84,
      estimatedPriceKES: 27500,
      confidence: 94,
      recommendedIndustries: ["Vocational Tailoring at Children's Homes", "Eco-Jeans Manufacturing", "Insulation & Acoustic Panel Production"],
      upcyclingIdeas: ["Children vocational training: denim tote bags", "Patchwork quilts for shelters", "Thermal insulation boards"],
      carbonSavingsKg: 1350,
      description: "Batch of sorted post-consumer denim and denim waste cutouts stripped of metal rivets, buttons, and zippers. Excellent for vocational tailoring classes or industrial recycling.",
      status: "PUBLISHED",
      viewsCount: 24,
      isDonation: false,
      contactPhone: "+254 712 345 678",
      coordinates: { lat: -1.2858, lng: 36.8398 },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "list-2",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 280,
      quantity: 5,
      location: "Industrial Area, Nairobi",
      imageUrl: "/assets/images/scraps_transformation_1790988212084.jpg",
      category: "Combed Cotton Jersey Scraps",
      fabricType: "Knit Jersey Cutting Scraps",
      material: "Polyester-Cotton Blends (60/40)",
      condition: "Pre-consumer Manufacturing Cutting Scraps",
      color: "Multi-color Mixed",
      texture: "Soft, Stretchy",
      recyclabilityScore: 72,
      estimatedPriceKES: 14000,
      confidence: 88,
      recommendedIndustries: ["Wiping rags & industrial absorbents", "Children craft workshops", "Automotive seat stuffing"],
      upcyclingIdeas: ["Quilt stuffing for children dorms", "Craft rugs and braided mats", "Industrial oil absorption"],
      carbonSavingsKg: 620,
      description: "Fresh manufacturing scraps and offcuts of knit jersey sports apparel. Pure dry waste, clean and unwashed. Great for youth vocational craft projects and textile compounding.",
      status: "PUBLISHED",
      viewsCount: 15,
      isDonation: false,
      contactPhone: "+254 712 345 678",
      coordinates: { lat: -1.3060, lng: 36.8450 },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "list-baby-3",
      sellerId: "u-seller-1",
      sellerName: "David Mitumba Trader",
      weightKg: 60,
      quantity: 3,
      location: "Westlands Sorting Depot, Nairobi",
      imageUrl: "/assets/images/artisans_workshop_1790988232395.jpg",
      category: "Children & Baby Clothes",
      fabricType: "Baby Rompers, Flannels & Swaddles",
      material: "100% Soft Combed Cotton",
      condition: "Gently Worn, Sanitized & Sorted",
      color: "Pastel Yellow, White, Baby Blue & Pink",
      texture: "Ultra-soft gentle cotton",
      recyclabilityScore: 98,
      estimatedPriceKES: 0,
      confidence: 98,
      recommendedIndustries: ["Infant Rescue Shelters", "Newborn Care Charities"],
      upcyclingIdeas: ["Immediate use for newborn and toddler care in orphanages"],
      carbonSavingsKg: 180,
      description: "Carefully sorted soft infant clothing, swaddle blankets, and baby rompers. Offered completely free to infant rescue centers such as New Life Home Trust or Thomas Barnardo.",
      status: "PUBLISHED",
      viewsCount: 51,
      isDonation: true,
      targetChildrenHomeId: "home-4",
      targetChildrenHomeName: "New Life Home Trust (Kilimani)",
      contactPhone: "+254 712 345 678",
      coordinates: { lat: -1.2680, lng: 36.8040 },
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const donationClaims: DonationClaim[] = [
    {
      id: "claim-1",
      listingId: "list-clothes-1",
      listingTitle: "Sorted Kids Sweaters, T-Shirts & Pants (85 Kg)",
      donorId: "u-seller-1",
      donorName: "David Mitumba Trader",
      childrenHomeId: "home-2",
      childrenHomeName: "Thomas Barnardo House (Lang'ata)",
      itemType: "Children Wearable Clothes",
      weightKg: 85,
      quantityNotes: "4 large sorted bundles (approx 120 garment pieces)",
      pickupLocation: "Gikomba Depot / Pickup coordinated",
      notes: "Van scheduled for pickup on Saturday morning. Clothes will be distributed to junior primary dormitories.",
      status: "COORDINATED",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const messages: Message[] = [
    {
      id: "msg-1",
      senderId: "u-home-1",
      senderName: "Sister Mary Owens (Nyumbani Home)",
      senderRole: "CHILDRENS_HOME",
      receiverId: "u-seller-1",
      receiverName: "David Mitumba Trader",
      content: "Jambo David! Thank you so much for allocating the 120 Kg warm fleece blankets for Nyumbani Children's Home. Nights in Karen get very cold, this will keep our 110 children warm!",
      listingId: "list-blankets-2",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: "msg-2",
      senderId: "u-seller-1",
      senderName: "David Mitumba Trader",
      senderRole: "SELLER",
      receiverId: "u-home-1",
      receiverName: "Sister Mary Owens (Nyumbani Home)",
      content: "Habari Sister Mary! It is our absolute pleasure. We also have about 25 kg of clean denim scraps that your tailoring students can use for sewing school bags. We will deliver them together on Friday!",
      listingId: "list-blankets-2",
      createdAt: new Date().toISOString(),
      read: false
    }
  ];

  const notifications: Notification[] = [
    {
      id: "notif-1",
      userId: "u-seller-1",
      title: "Children's Home Connected!",
      message: "Nyumbani Children's Home (Karen) connected to receive your fleece blankets donation.",
      read: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "notif-2",
      userId: "u-home-1",
      title: "New Free Clothes Available Nearby",
      message: "A new bundle of sorted kids clothes was listed 4.2 km from your Karen location.",
      read: false,
      createdAt: new Date().toISOString()
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: "audit-1",
      action: "SYSTEM_START",
      details: "UziLink Circular Textile & Children's Homes Hub booted successfully.",
      timestamp: new Date().toISOString()
    }
  ];

  return { 
    users, 
    listings, 
    childrenHomes: SEED_CHILDRENS_HOMES, 
    donationClaims, 
    messages, 
    notifications, 
    auditLogs 
  };
}

/**
 * Load Database from File or fallback to seeded data
 */
export function lockAndLoadDB(): DBStructure {
  try {
    if (fs.existsSync(DB_FILE)) {
      const p = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(p);
      
      // Ensure childrenHomes and donationClaims arrays exist if loading older DB file
      if (!parsed.childrenHomes || parsed.childrenHomes.length === 0) {
        parsed.childrenHomes = SEED_CHILDRENS_HOMES;
      }
      if (!parsed.donationClaims) {
        parsed.donationClaims = [];
      }
      dbState = parsed;
      return dbState;
    } else {
      dbState = generateSeedData();
      saveDB();
      return dbState;
    }
  } catch (e) {
    console.error("DB File read failed. Working on in-memory state", e);
    if (dbState.users.length === 0) {
      dbState = generateSeedData();
    }
    return dbState;
  }
}

/**
 * Save Database back to JSON file
 */
export function saveDB(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (error) {
    console.error("DB write failed. Using in-memory states.", error);
  }
}

// Initial Sync
lockAndLoadDB();

// DB Data Getters & Setters
export const db = {
  getUsers: () => dbState.users,
  addUser: (user: User) => {
    dbState.users.push(user);
    saveDB();
    db.addAuditLog("u-system", "USER_REGISTERED", `New user registered: ${user.name} (${user.email}) as ${user.role}`);
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const idx = dbState.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      dbState.users[idx] = { ...dbState.users[idx], ...updates };
      saveDB();
    }
  },
  
  getListings: () => dbState.listings,
  addListing: (listing: Listing) => {
    dbState.listings.unshift(listing);
    saveDB();
    const actionLabel = listing.isDonation ? "DONATION_LISTING_CREATED" : "LISTING_CREATED";
    db.addAuditLog(listing.sellerId, actionLabel, `Listing declared: ${listing.fabricType} - ${listing.weightKg}Kg (${listing.isDonation ? "Free for Children's Homes" : "For Sale/Recycling"})`);
  },
  updateListing: (id: string, updates: Partial<Listing>) => {
    const idx = dbState.listings.findIndex((l) => l.id === id);
    if (idx !== -1) {
      dbState.listings[idx] = { ...dbState.listings[idx], ...updates };
      saveDB();
    }
  },
  deleteListing: (id: string) => {
    dbState.listings = dbState.listings.filter((l) => l.id !== id);
    saveDB();
    db.addAuditLog("u-admin", "LISTING_DELETED", `Listing with ID ${id} removed.`);
  },

  // Children's Homes Hub
  getChildrenHomes: () => dbState.childrenHomes,
  addChildrenHome: (home: ChildrenHome) => {
    dbState.childrenHomes.push(home);
    saveDB();
  },
  updateChildrenHome: (id: string, updates: Partial<ChildrenHome>) => {
    const idx = dbState.childrenHomes.findIndex((h) => h.id === id);
    if (idx !== -1) {
      dbState.childrenHomes[idx] = { ...dbState.childrenHomes[idx], ...updates };
      saveDB();
    }
  },

  // Donation Claims
  getDonationClaims: () => dbState.donationClaims,
  addDonationClaim: (claim: DonationClaim) => {
    dbState.donationClaims.unshift(claim);
    saveDB();
    db.addAuditLog(claim.donorId, "DONATION_CLAIM_CREATED", `Donation connected: ${claim.itemType} to ${claim.childrenHomeName}`);
  },
  updateDonationClaimStatus: (id: string, status: "PENDING" | "COORDINATED" | "DELIVERED" | "CANCELLED") => {
    const claim = dbState.donationClaims.find((c) => c.id === id);
    if (claim) {
      claim.status = status;
      saveDB();
    }
  },

  getMessages: () => dbState.messages,
  addMessage: (msg: Message) => {
    dbState.messages.push(msg);
    saveDB();
  },
  markMessagesAsRead: (userId: string, senderId: string) => {
    dbState.messages.forEach((m) => {
      if (m.receiverId === userId && m.senderId === senderId) {
        m.read = true;
      }
    });
    saveDB();
  },

  getNotifications: () => dbState.notifications,
  addNotification: (notif: Notification) => {
    dbState.notifications.unshift(notif);
    saveDB();
  },
  markNotificationsAsRead: (userId: string) => {
    dbState.notifications.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    saveDB();
  },

  getAuditLogs: () => dbState.auditLogs,
  addAuditLog: (userId: string, action: string, details: string) => {
    const user = dbState.users.find((u) => u.id === userId);
    dbState.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userEmail: user?.email || "system",
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (dbState.auditLogs.length > 500) {
      dbState.auditLogs = dbState.auditLogs.slice(0, 500);
    }
    saveDB();
  }
};
