import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { ListingItem, UserProfile } from "../types.js";
import { 
  Search, MapPin, Scale, Leaf, Heart, ArrowRight, ShieldCheck, 
  HelpCircle, Filter, Phone, MessageSquare, Tag, Gift, CheckCircle2,
  Package, Truck, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface BuyerViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  listings: ListingItem[];
  onRefresh: () => void;
  openContactPartner: (partnerId: string, partnerName: string, listingId: string) => void;
}

export const BuyerView: React.FC<BuyerViewProps> = ({ 
  user, 
  showToast, 
  listings: initialListings, 
  onRefresh,
  openContactPartner
}) => {
  const [listings, setListings] = useState<ListingItem[]>(initialListings);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("");
  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyDonations, setOnlyDonations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Saved listings storage
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  // Selected Listing Detail Popup
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  // Direct Claim Modal state
  const [claimNotes, setClaimNotes] = useState("");
  const [claimantHomeName, setClaimantHomeName] = useState(
    user.role === "CHILDRENS_HOME" ? user.organizationName || user.name : "Local Children's Home / Shelter"
  );
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // Fetch / Query filtered list
  const applyFilters = async () => {
    setLoading(true);
    try {
      const response = await api.getListings({
        search,
        material,
        location,
        maxPrice: maxPrice ? Number(maxPrice) : "",
        isDonation: onlyDonations ? "true" : ""
      });
      setListings(response.listings);
    } catch (e: any) {
      showToast("Failed to apply filters.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [search, material, location, maxPrice, onlyDonations]);

  // Load Saved Listings
  useEffect(() => {
    const saved = localStorage.getItem(`saved_listings_${user.id}`);
    if (saved) {
      setSavedListingIds(JSON.parse(saved));
    }
  }, [user.id]);

  const toggleSaveListing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (savedListingIds.includes(id)) {
      updated = savedListingIds.filter(item => item !== id);
      showToast("Listing removed from favorites", "info");
    } else {
      updated = [...savedListingIds, id];
      showToast("Listing saved to favorites!", "success");
    }
    setSavedListingIds(updated);
    localStorage.setItem(`saved_listings_${user.id}`, JSON.stringify(updated));
  };

  // Direct Claim / Connection handler (No bidding!)
  const handleClaimDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    setSubmittingClaim(true);
    try {
      await api.claimDonation({
        listingId: selectedListing.id,
        childrenHomeId: selectedListing.targetChildrenHomeId || `home-user-${user.id}`,
        childrenHomeName: claimantHomeName || selectedListing.targetChildrenHomeName || "Children's Home Partner",
        notes: claimNotes || "Claimed via UziLink for children's care and clothing.",
        pickupLocation: selectedListing.location
      });

      showToast(`🎉 Connection confirmed! The donor has been notified to coordinate pickup.`, "success");
      setShowClaimModal(false);
      setSelectedListing(null);
      setClaimNotes("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to process connection", "error");
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="space-y-6" id="buyer-page-wrapper">
      {/* 1. Bright Search and Quick Category Filter Hub */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clothes, blankets, denim scraps, cotton, or location..."
              className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl outline-none transition"
              id="buyer-search-input"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setOnlyDonations(!onlyDonations)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                onlyDonations
                  ? "bg-amber-100 text-amber-900 border-amber-300 shadow-xs"
                  : "bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyDonations ? "fill-amber-600 text-amber-600" : "text-slate-400"}`} />
              <span>Children's Homes Free Items</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                showFilters
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : "bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100"
              }`}
              id="btn-toggle-filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Panel Expansion */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-stone-100 overflow-hidden"
              id="expanded-filters-panel"
            >
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Fabric Composition</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 text-slate-700 rounded-xl p-2.5 outline-none font-medium cursor-pointer"
                >
                  <option value="">All Materials</option>
                  <option value="Cotton">Pure Cotton / Flannel</option>
                  <option value="Denim">Denim & Twill</option>
                  <option value="Fleece">Warm Fleece & Wool</option>
                  <option value="Polyester">Synthetic Polyester</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Location Base</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Gikomba, Karen, Mombasa"
                  className="w-full text-xs bg-stone-50 border border-stone-200 text-slate-700 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Max Price (KES)</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 20000"
                  className="w-full text-xs bg-stone-50 border border-stone-200 text-slate-700 rounded-xl p-2.5 outline-none font-medium"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Grid of Listings */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs font-medium">Updating available textile feed...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-12 text-center text-slate-500 text-xs">
          No matching textile batches found. Try broadening your query!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="buyer-listings-grid">
          {listings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedListing(item)}
              className="bg-white border border-stone-200 hover:border-emerald-300 rounded-3xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between group cursor-pointer transition-all relative"
              id={`listing-card-${item.id}`}
            >
              {/* Image Section */}
              <div className="relative h-48 overflow-hidden bg-stone-100">
                <img
                  src={resolveImageUrl(item.imageUrl)}
                  alt={item.fabricType}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={handleImageFallback}
                />
                
                {/* Floating Tags */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {item.isDonation || item.estimatedPriceKES === 0 ? (
                    <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Heart className="w-3 h-3 fill-white" />
                      Free Donation
                    </span>
                  ) : (
                    <span className="bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
                      Recyclability: {item.recyclabilityScore}%
                    </span>
                  )}

                  {item.status === "SOLD" && (
                    <span className="bg-sky-600 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase shadow-sm">
                      Allocated
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => toggleSaveListing(item.id, e)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 p-2 rounded-full transition shadow-sm"
                  title="Bookmark"
                >
                  <Heart className={`w-4 h-4 ${savedListingIds.includes(item.id) ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                </button>

                {/* Carbon Offset badge */}
                <div className="absolute bottom-3 left-3 bg-white/95 border border-stone-200 backdrop-blur-xs px-2.5 py-1 rounded-xl text-[10px] text-emerald-800 font-bold flex items-center gap-1.5 shadow-xs">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  -{item.carbonSavingsKg} Kg CO2 Saved
                </div>
              </div>

              {/* Text Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                    <span>{item.category || item.material}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition line-clamp-1 mt-0.5">
                    {item.fabricType}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Target Children's Home Tag if linked */}
                {item.targetChildrenHomeName && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-amber-500 text-amber-600 shrink-0" />
                    <span className="truncate">Preferred for: {item.targetChildrenHomeName}</span>
                  </div>
                )}

                {/* Footer metrics */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-slate-400" /> {item.weightKg} Kg</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location.split(",")[0]}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    {item.isDonation || item.estimatedPriceKES === 0 ? (
                      <span className="text-amber-700 font-black text-sm flex items-center gap-1">
                        <Gift className="w-4 h-4 text-amber-600" />
                        Free for Children's Homes
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-black text-base">
                        KES {item.estimatedPriceKES?.toLocaleString()}
                      </span>
                    )}

                    <span className="text-[10px] bg-stone-100 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase truncate max-w-28">
                      {item.material.split(" ")[0]}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Detail Popup Modal */}
      <AnimatePresence>
        {selectedListing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-200 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative"
              id="buyer-detail-modal"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Photo & Carbon Banner */}
                <div className="relative h-56 md:h-full bg-stone-100 border-r border-stone-200">
                  <img
                    src={resolveImageUrl(selectedListing.imageUrl)}
                    alt={selectedListing.fabricType}
                    className="w-full h-full object-cover"
                    onError={handleImageFallback}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                    <h3 className="text-lg font-black">{selectedListing.fabricType}</h3>
                    <div className="text-xs text-emerald-300 font-bold flex items-center gap-1 mt-1">
                      <Leaf className="w-3.5 h-3.5" />
                      Saving {selectedListing.carbonSavingsKg} kg in carbon emissions
                    </div>
                  </div>
                </div>

                {/* Right Info Body */}
                <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-start">
                    <div>
                      {selectedListing.isDonation || selectedListing.estimatedPriceKES === 0 ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-amber-500 text-amber-500" />
                          Children's Home Donation
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase">
                          Recyclability: {selectedListing.recyclabilityScore}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedListing(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
                      id="modal-close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block">Description & Specs</span>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal">{selectedListing.description}</p>
                    
                    <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-slate-700 grid grid-cols-2 gap-2">
                      <span>• Composition: <strong className="text-slate-900">{selectedListing.material}</strong></span>
                      <span>• Condition: <strong className="text-slate-900">{selectedListing.condition}</strong></span>
                      <span>• Total Weight: <strong className="text-slate-900">{selectedListing.weightKg} Kg</strong></span>
                      <span>• Location: <strong className="text-slate-900">{selectedListing.location.split(",")[0]}</strong></span>
                    </div>
                  </div>

                  {/* Target Children's Home Note */}
                  {selectedListing.targetChildrenHomeName && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 font-medium">
                      <strong>Designated Receiver:</strong> {selectedListing.targetChildrenHomeName}
                    </div>
                  )}

                  {/* Pricing or Donation Notice */}
                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Pricing</span>
                      <div className="text-xl font-black text-emerald-700">
                        {selectedListing.isDonation || selectedListing.estimatedPriceKES === 0
                          ? "FREE (Charity Donation)"
                          : `KES ${selectedListing.estimatedPriceKES?.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Seller / Donor</span>
                      <div className="text-xs font-bold text-slate-900">{selectedListing.sellerName || "UziLink Member"}</div>
                    </div>
                  </div>

                  {/* Direct Action Buttons (No Bidding!) */}
                  <div className="pt-2 space-y-2">
                    {selectedListing.isDonation || selectedListing.estimatedPriceKES === 0 ? (
                      <button
                        onClick={() => setShowClaimModal(true)}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Heart className="w-4 h-4 fill-white" />
                        <span>Claim / Connect for Children's Home</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedListing(null);
                          openContactPartner(selectedListing.sellerId, selectedListing.sellerName || "Seller", selectedListing.id);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Direct Connect & Inquire with Seller</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedListing(null);
                        openContactPartner(selectedListing.sellerId, selectedListing.sellerName || "Seller", selectedListing.id);
                      }}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Direct Message</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Direct Claim Modal for Children's Homes */}
      <AnimatePresence>
        {showClaimModal && selectedListing && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            >
              <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Connect to Children's Home</h3>
                  <p className="text-xs text-slate-500">{selectedListing.fabricType} ({selectedListing.weightKg} Kg)</p>
                </div>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleClaimDonation} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Name of Children's Home</label>
                  <input
                    type="text"
                    required
                    value={claimantHomeName}
                    onChange={(e) => setClaimantHomeName(e.target.value)}
                    placeholder="e.g. Nyumbani Children's Home (Karen)"
                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Pickup & Transport Note</label>
                  <textarea
                    rows={2}
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="e.g. We will send our van for collection from your Gikomba depot on Friday morning."
                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimModal(false)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submittingClaim ? "Connecting..." : "Confirm & Connect Donation"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
