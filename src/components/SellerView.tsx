import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile } from "../types.js";
import { 
  UploadCloud, FileText, Weight, Layers, MapPin, Heart, FolderPlus, 
  Trash2, Sparkles, CheckCircle2, Tag, ShieldCheck, Phone, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

const KENYAN_LOCATIONS = [
  "Gikomba Market, Nairobi",
  "Industrial Area, Nairobi",
  "Westlands Depot, Nairobi",
  "Lang'ata Road, Nairobi",
  "Karen Depot, Nairobi",
  "Eastleigh Garment Center, Nairobi",
  "Mombasa Port Warehouse",
  "Nakuru Free Area Depot",
  "Eldoret Rivatex Depot",
  "Thika Textile Center",
  "Kisumu Industrial Estate"
];

const TEXTILE_CATEGORIES = [
  { id: "kids_clothes", label: "Children & Baby Clothes (Ready to Wear)", defaultDonation: true },
  { id: "blankets", label: "Warm Blankets & Bedding Linens", defaultDonation: true },
  { id: "adult_clothes", label: "Adult Wearable Clothes (T-Shirts, Sweaters, Pants)", defaultDonation: true },
  { id: "denim", label: "Denim & Twill Cutting Offcuts", defaultDonation: false },
  { id: "cotton_jersey", label: "Pure Combed Cotton Jersey Scraps", defaultDonation: false },
  { id: "fleece", label: "Synthetic Fleece & Winter Bales", defaultDonation: false },
  { id: "tailoring", label: "Tailoring Remnants (Great for Sewing Classes)", defaultDonation: true },
  { id: "general_scraps", label: "General Sorted Mitumba Scraps", defaultDonation: false }
];

const PRESET_CHILDRENS_HOMES = [
  { id: "home-1", name: "Nyumbani Children's Home (Karen, Nairobi)" },
  { id: "home-2", name: "Thomas Barnardo House (Lang'ata, Nairobi)" },
  { id: "home-3", name: "Mogra Children's Centre (Kiambu Rd / Muthaiga)" },
  { id: "home-4", name: "New Life Home Trust - Infants (Kilimani, Nairobi)" },
  { id: "home-5", name: "SOS Children's Village (Buruburu, Nairobi)" },
  { id: "home-6", name: "St. Nicholas Children's Home (Karen, Nairobi)" },
  { id: "home-7", name: "Mama Ngina Children's Home (South C, Nairobi)" },
  { id: "home-8", name: "Tumaini Children's Home (Eldoret)" },
  { id: "home-9", name: "St. Joseph's Children's Home (Nakuru)" },
  { id: "home-10", name: "Amani Children's Home (Mtwapa, Mombasa)" }
];

interface SellerViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onRefresh: () => void;
}

export const SellerView: React.FC<SellerViewProps> = ({ user, showToast, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "mylistings">("upload");
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form parameters
  const [isDonation, setIsDonation] = useState(true);
  const [category, setCategory] = useState("Children & Baby Clothes (Ready to Wear)");
  const [fabricType, setFabricType] = useState("Sorted Children's Sweaters & Clothing");
  const [material, setMaterial] = useState("100% Combed Cotton & Fleece");
  const [condition, setCondition] = useState("Gently Worn, Clean & Sorted");
  const [color, setColor] = useState("Assorted Bright Colors");
  const [weight, setWeight] = useState("50");
  const [quantity, setQuantity] = useState("2");
  const [priceKES, setPriceKES] = useState("0");
  const [location, setLocation] = useState(user.location || "Gikomba Market, Nairobi");
  const [contactPhone, setContactPhone] = useState("+254 712 345 678");
  const [targetChildrenHomeId, setTargetChildrenHomeId] = useState("home-1");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    "/assets/images/scraps_transformation_1790988212084.jpg"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync / load seller listings
  const loadSellerListings = async () => {
    setLoadingListings(true);
    try {
      const response = await api.getListings({ sellerId: user.id });
      setListings(response.listings);
    } catch (e: any) {
      showToast(e.message || "Failed to load your listing portfolio", "error");
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mylistings") {
      loadSellerListings();
    }
  }, [activeTab]);

  // Adjust defaults when category changes
  const handleCategorySelect = (catName: string) => {
    setCategory(catName);
    if (catName.includes("Children") || catName.includes("Baby")) {
      setIsDonation(true);
      setFabricType("Sorted Children's Wear & Rompers");
      setMaterial("100% Soft Cotton");
      setCondition("Clean & Wearable");
      setPriceKES("0");
    } else if (catName.includes("Blanket")) {
      setIsDonation(true);
      setFabricType("Warm Polar Fleece & Heavy Blankets");
      setMaterial("Polyester Fleece & Cotton Flannel");
      setCondition("Clean Sanitized Bedding");
      setPriceKES("0");
    } else if (catName.includes("Denim")) {
      setIsDonation(false);
      setFabricType("Denim Offcuts & Scraps");
      setMaterial("100% Cotton Denim");
      setCondition("Hardware-Free Sorted Mitumba Scraps");
      setPriceKES("15000");
    } else if (catName.includes("Jersey")) {
      setIsDonation(false);
      setFabricType("Knit Jersey Cutting Scraps");
      setMaterial("Cotton-Poly 60/40");
      setCondition("Factory Clean Scraps");
      setPriceKES("10000");
    }
  };

  // Image helpers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !quantity || !location) {
      showToast("Please specify the total weight, quantity and base location", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      let b64 = "";
      let mType = "image/jpeg";
      if (imagePreview && imagePreview.startsWith("data:")) {
        const parts = imagePreview.split(",");
        b64 = parts[1] || "";
        const match = parts[0].match(/data:(.*?);/);
        mType = match ? match[1] : "image/jpeg";
      }

      const matchedHome = PRESET_CHILDRENS_HOMES.find((h) => h.id === targetChildrenHomeId);

      await api.createListing({
        weightKg: Number(weight),
        quantity: Number(quantity),
        location,
        category,
        fabricType,
        material,
        condition,
        color,
        texture: "Clean & Sorted",
        estimatedPriceKES: isDonation ? 0 : Number(priceKES) || 0,
        isDonation,
        targetChildrenHomeId: isDonation ? targetChildrenHomeId : undefined,
        targetChildrenHomeName: isDonation ? matchedHome?.name : undefined,
        contactPhone,
        description,
        imageB64: b64 || undefined,
        imageUrl: !b64 ? imagePreview : undefined,
        mimeType: mType,
        isDraft: false
      });

      showToast(
        isDonation
          ? "🎉 Free Clothes/Textiles Donation declared! Children's homes can now view and claim it."
          : "✅ Scrap batch published successfully to the marketplace!",
        "success"
      );

      // Reset form
      setWeight("");
      setQuantity("");
      setDescription("");
      onRefresh();
      setActiveTab("mylistings");
    } catch (err: any) {
      showToast(err.message || "Failed to publish listing", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteListing = async (id: string) => {
    try {
      await api.deleteListing(id);
      showToast("Listing deleted successfully.", "success");
      setConfirmDeleteId(null);
      loadSellerListings();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to delete listing", "error");
    }
  };

  return (
    <div className="space-y-6" id="seller-page-wrapper">
      {/* Tab Control */}
      <div className="flex border-b border-stone-200 gap-4" id="seller-navigation-tabs">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-3 text-xs sm:text-sm font-bold transition relative cursor-pointer ${
            activeTab === "upload"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="tab-seller-upload"
        >
          Declare Textiles or Donate Clothes
        </button>
        <button
          onClick={() => setActiveTab("mylistings")}
          className={`pb-3 text-xs sm:text-sm font-bold transition relative cursor-pointer ${
            activeTab === "mylistings"
              ? "text-emerald-700 border-b-2 border-emerald-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
          id="tab-seller-mylistings"
        >
          My Declared Batches ({listings.length})
        </button>
      </div>

      {activeTab === "upload" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="seller-upload-panel">
          {/* Main Declaration Form */}
          <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Textile & Clothes Declaration</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">Declare a Batch of Scraps or Clothing</h2>
              <p className="text-xs text-slate-500 mt-1">
                Direct your batch to nearby Children's Homes as a free warm donation, or list it for industrial textile recycling & artisans.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Switcher: Donation for Children's Homes vs Commercial Sale */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-stone-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsDonation(true);
                    setPriceKES("0");
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    isDonation
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span>Free for Children's Homes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDonation(false);
                    if (priceKES === "0") setPriceKES("15000");
                  }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    !isDonation
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Marketplace Sale / Recycling</span>
                </button>
              </div>

              {/* Children's Home Target if donation is selected */}
              {isDonation && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>Designated Receiving Children's Home in Kenya:</span>
                  </div>
                  <select
                    value={targetChildrenHomeId}
                    onChange={(e) => setTargetChildrenHomeId(e.target.value)}
                    className="w-full bg-white border border-amber-300 text-slate-800 text-xs p-2.5 rounded-xl outline-none font-semibold cursor-pointer"
                  >
                    {PRESET_CHILDRENS_HOMES.map((home) => (
                      <option key={home.id} value={home.id}>
                        {home.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-800">
                    The chosen home will receive an alert to coordinate pickup or drop-off for their children.
                  </p>
                </div>
              )}

              {/* Category Quick Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Select Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEXTILE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.label)}
                      className={`p-2.5 rounded-xl border text-xs text-left font-medium transition cursor-pointer flex items-center justify-between ${
                        category === cat.label
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs"
                          : "bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100"
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      {cat.defaultDonation && (
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-black shrink-0 ml-1">
                          Warmth
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Material Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Item / Batch Title</label>
                  <input
                    type="text"
                    required
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    placeholder="e.g. Clean Sorted Children Sweaters & Shirts"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Material Composition</label>
                  <input
                    type="text"
                    required
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="e.g. 100% Combed Cotton, Denim, Fleece"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Condition & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Condition</label>
                  <input
                    type="text"
                    required
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="e.g. Gently Worn & Clean (Ready to Wear), Sorted Factory Scraps"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Dominant Colors</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Blue, Gray, Assorted Pastels"
                    className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Weight, Quantity & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Total Est Weight (Kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs pl-9 pr-3 py-3 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Package Qty (Bags/Bales)</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 2"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs pl-9 pr-3 py-3 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isDonation ? "Price (KES)" : "Market Price (KES)"}
                  </label>
                  <input
                    type="number"
                    disabled={isDonation}
                    value={isDonation ? 0 : priceKES}
                    onChange={(e) => setPriceKES(e.target.value)}
                    placeholder="0"
                    className={`w-full text-xs p-3 rounded-xl outline-none font-bold ${
                      isDonation
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-not-allowed"
                        : "bg-stone-50 border border-stone-200 text-slate-800 focus:border-emerald-500"
                    }`}
                  />
                  {isDonation && <span className="text-[10px] text-emerald-700 font-bold">100% Free Donation</span>}
                </div>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Depot Location in Kenya</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Gikomba Market, Nairobi"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs pl-9 pr-3 py-3 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Contact Phone / WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs pl-9 pr-3 py-3 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Description & Instructions</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any details on packaging, garment sizes, washing status, or transport coordination..."
                  className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !weight}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Publishing batch...</span>
                ) : isDonation ? (
                  <>
                    <Heart className="w-5 h-5 fill-white" />
                    <span>Publish Free Donation for Children's Homes</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Publish Batch to Scrap Marketplace</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Visual Photo Box & Live Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Batch Photo</h3>
              
              <div className="relative h-48 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                <img
                  src={resolveImageUrl(imagePreview)}
                  alt="Textile preview"
                  className="w-full h-full object-cover"
                  onError={handleImageFallback}
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="textile-image-file"
                />
                <label
                  htmlFor="textile-image-file"
                  className="w-full bg-stone-100 hover:bg-stone-200 text-slate-700 text-xs font-bold py-2 rounded-xl text-center block cursor-pointer transition"
                >
                  Choose New Photo
                </label>
              </div>

              {/* Impact Card */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                  Estimated Circular Impact
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Carbon Abated:</span>
                  <span className="text-base font-black text-emerald-700">
                    -{Math.round((Number(weight) || 0) * 3)} kg CO2e
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-600">Material Recyclability:</span>
                  <span className="text-sm font-black text-emerald-700">95% Pure Fiber</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* My Listings Tab */
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm" id="seller-records-panel">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Manage Your Declared Inventory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All batches of clothing and textile scraps you have listed on UziLink.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("upload")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Declare New Batch</span>
            </button>
          </div>

          {loadingListings ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading listings...</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No scrap shipments declared yet. Switch to declaration tab to submit your first batch!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] text-slate-500 uppercase bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-5 py-3 rounded-l-lg">Visual</th>
                    <th scope="col" className="px-5 py-3">Batch & Category</th>
                    <th scope="col" className="px-5 py-3">Weight (Kg)</th>
                    <th scope="col" className="px-5 py-3">Terms / Pricing</th>
                    <th scope="col" className="px-5 py-3">Location</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {listings.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/60 transition">
                      <td className="px-5 py-3">
                        <img
                          src={resolveImageUrl(l.imageUrl)}
                          alt={l.fabricType}
                          className="w-10 h-10 object-cover rounded-xl border border-stone-200"
                          onError={handleImageFallback}
                        />
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900">
                        <div>{l.fabricType}</div>
                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          {l.category || l.material}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {l.weightKg} Kg ({l.quantity} packages)
                      </td>
                      <td className="px-5 py-3">
                        {l.isDonation || l.estimatedPriceKES === 0 ? (
                          <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Free Donation
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">
                            KES {l.estimatedPriceKES?.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 truncate max-w-xs">{l.location}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "SOLD"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-stone-100 text-slate-700"
                          }`}
                        >
                          {l.status === "SOLD" ? "ALLOCATED" : l.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {confirmDeleteId === l.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-600 font-bold">Delete?</span>
                            <button
                              onClick={() => handleDeleteListing(l.id)}
                              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded transition cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-stone-200 hover:bg-stone-300 text-slate-700 text-[10px] px-2 py-1 rounded transition cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(l.id)}
                            className="bg-stone-100 hover:bg-rose-50 border border-stone-200 text-rose-600 p-1.5 rounded-lg transition cursor-pointer"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
