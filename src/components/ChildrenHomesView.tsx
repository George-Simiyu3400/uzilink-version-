import React, { useState, useEffect } from "react";
import { ChildrenHomeItem, ListingItem, UserProfile, DonationClaimItem } from "../types.js";
import { api } from "../lib/api.js";
import { 
  Heart, MapPin, Phone, Mail, Navigation, Sparkles, CheckCircle2, 
  Search, Filter, ShieldCheck, ArrowRight, Package, Calendar, Clock,
  Truck, Users, Baby, ExternalLink, MessageSquare, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

// Popular Kenyan hubs with precise GPS coordinates
const KENYA_LOCATION_PRESETS = [
  { name: "Nairobi - Gikomba Market", lat: -1.2858, lng: 36.8398 },
  { name: "Nairobi - Central CBD", lat: -1.286389, lng: 36.817223 },
  { name: "Nairobi - Westlands", lat: -1.2680, lng: 36.8040 },
  { name: "Nairobi - Lang'ata / Karen", lat: -1.3328, lng: 36.7198 },
  { name: "Nairobi - Buruburu / Eastlands", lat: -1.2872, lng: 36.8795 },
  { name: "Nairobi - Industrial Area", lat: -1.3060, lng: 36.8450 },
  { name: "Kiambu / Muthaiga North", lat: -1.2405, lng: 36.8582 },
  { name: "Thika Town", lat: -1.0388, lng: 37.0834 },
  { name: "Nakuru City", lat: -0.3031, lng: 36.0800 },
  { name: "Eldoret Town", lat: 0.5143, lng: 35.2698 },
  { name: "Kisumu City", lat: -0.0917, lng: 34.7680 },
  { name: "Mombasa / Mtwapa", lat: -3.9458, lng: 39.7431 }
];

// Haversine formula to compute geodesic distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

interface ChildrenHomesViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  openChat: (partnerId: string, partnerName: string, listingId?: string) => void;
  listings: ListingItem[];
  onRefresh: () => void;
}

export const ChildrenHomesView: React.FC<ChildrenHomesViewProps> = ({
  user,
  showToast,
  openChat,
  listings,
  onRefresh
}) => {
  const [homes, setHomes] = useState<ChildrenHomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<DonationClaimItem[]>([]);

  // User location coordinates & address
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: -1.2858,
    lng: 36.8398 // Default: Gikomba Market, Nairobi
  });
  const [userLocationName, setUserLocationName] = useState("Nairobi - Gikomba Market");
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [countyFilter, setCountyFilter] = useState("ALL");
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "donations">("directory");

  // Donation Dialog State
  const [selectedHomeForDonation, setSelectedHomeForDonation] = useState<ChildrenHomeItem | null>(null);
  const [selectedListingId, setSelectedListingId] = useState<string>("");
  const [customItemDescription, setCustomItemDescription] = useState("");
  const [customWeightKg, setCustomWeightKg] = useState("");
  const [pickupLocation, setPickupLocation] = useState(user.location || "Gikomba Market, Nairobi");
  const [donationNotes, setDonationNotes] = useState("");
  const [submittingDonation, setSubmittingDonation] = useState(false);

  // Fetch children homes and donations
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getChildrenHomes();
      const rawHomes: ChildrenHomeItem[] = res.homes || [];

      // Fetch existing donation claims
      const donRes = await api.getDonations();
      setDonations(donRes.claims || []);

      // Calculate distances immediately
      const homesWithDistance = rawHomes.map((home) => ({
        ...home,
        distanceKm: calculateDistanceKm(userCoords.lat, userCoords.lng, home.lat, home.lng)
      }));

      // Sort by nearest first
      homesWithDistance.sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
      setHomes(homesWithDistance);
    } catch (e: any) {
      showToast("Failed to load Children's Homes directory.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userCoords]);

  // Handle browser Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "info");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setUserLocationName("Your Detected GPS Location");
        setDetectingLocation(false);
        showToast("Location updated! Children's homes re-sorted by proximity.", "success");
      },
      (err) => {
        setDetectingLocation(false);
        showToast("Unable to retrieve location. Please choose a Kenyan city from the dropdown.", "info");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectPresetLocation = (presetName: string) => {
    const matched = KENYA_LOCATION_PRESETS.find((p) => p.name === presetName);
    if (matched) {
      setUserCoords({ lat: matched.lat, lng: matched.lng });
      setUserLocationName(matched.name);
      showToast(`Location set to ${matched.name}. Sorting nearest homes!`, "info");
    }
  };

  // Submit donation claim/connection
  const handleConnectDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHomeForDonation) return;

    setSubmittingDonation(true);
    try {
      const chosenListing = listings.find((l) => l.id === selectedListingId);

      await api.claimDonation({
        listingId: selectedListingId || undefined,
        childrenHomeId: selectedHomeForDonation.id,
        childrenHomeName: selectedHomeForDonation.name,
        itemType: chosenListing ? chosenListing.fabricType : customItemDescription || "Children Wearable Clothes & Blankets",
        weightKg: chosenListing ? chosenListing.weightKg : Number(customWeightKg) || 20,
        pickupLocation,
        notes: donationNotes || "Connecting surplus wearable clothes and textile scraps to warm children."
      });

      showToast(`Donation connected successfully to ${selectedHomeForDonation.name}!`, "success");
      setSelectedHomeForDonation(null);
      setSelectedListingId("");
      setCustomItemDescription("");
      setCustomWeightKg("");
      setDonationNotes("");
      loadData();
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to submit donation connection", "error");
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Filtered Homes list
  const filteredHomes = homes.filter((home) => {
    const matchesSearch =
      home.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.urgentNeeds.some((need) => need.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCounty = countyFilter === "ALL" || home.county.toLowerCase() === countyFilter.toLowerCase();

    return matchesSearch && matchesCounty;
  });

  const nearestHome = homes[0];
  const donationListings = listings.filter((l) => l.isDonation || l.estimatedPriceKES === 0);

  return (
    <div className="space-y-6" id="children-homes-container">
      {/* 1. Header Banner & Proximity Spotlight */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <Heart className="w-64 h-64 fill-white text-white" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide">
            <Heart className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>Connecting Warmth & Hope Across Kenya</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Children's Homes Textile & Clothing Connection
          </h1>

          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-medium">
            Over 50,000 children in Kenyan shelters and orphanages need wearable clothing, warm blankets, and fabric remnants for vocational tailoring skills. Direct your surplus textile batches and gently worn garments to the nearest home in need!
          </p>

          {/* User Location Proximity Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="bg-white text-slate-800 text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location: <strong>{userLocationName}</strong></span>
            </div>

            <button
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
              id="btn-detect-gps"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? "animate-spin" : ""}`} />
              <span>{detectingLocation ? "Detecting GPS..." : "📍 Detect My Location"}</span>
            </button>

            <select
              value={userLocationName}
              onChange={(e) => handleSelectPresetLocation(e.target.value)}
              className="bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl outline-none shadow-sm cursor-pointer"
            >
              <option value="" disabled>Or Pick Kenyan City / Neighborhood:</option>
              {KENYA_LOCATION_PRESETS.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Nearest Children's Home Highlight Card */}
      {nearestHome && (
        <div className="bg-amber-50/70 border-2 border-amber-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-200 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                  Nearest Children's Home to You
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  {nearestHome.distanceKm} km away
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-1">{nearestHome.name}</h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {nearestHome.neighborhood}, {nearestHome.county} • Caring for <strong>{nearestHome.childrenCount} children</strong> ({nearestHome.ageRange})
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-amber-900 font-bold">Urgent needs:</span>
                {nearestHome.urgentNeeds.map((need, idx) => (
                  <span key={idx} className="bg-white border border-amber-300 text-amber-900 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {need}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
            <button
              onClick={() => setSelectedHomeForDonation(nearestHome)}
              className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Donate to Nearest Home</span>
            </button>
            <a
              href={`tel:${nearestHome.phone}`}
              className="bg-white hover:bg-stone-50 border border-stone-200 text-slate-700 font-bold text-xs p-2.5 rounded-xl transition flex items-center justify-center"
              title="Call Home Directly"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
            </a>
          </div>
        </div>
      )}

      {/* 3. Sub-tabs Navigation: Directory vs Active Donation Impact */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab("directory")}
            className={`font-bold text-xs sm:text-sm pb-2 transition relative cursor-pointer ${
              activeSubTab === "directory"
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Verified Children's Homes ({homes.length})
          </button>
          <button
            onClick={() => setActiveSubTab("donations")}
            className={`font-bold text-xs sm:text-sm pb-2 transition relative cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === "donations"
                ? "text-emerald-700 border-b-2 border-emerald-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Community Donation Connections ({donations.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Sorted by nearest proximity to <strong>{userLocationName.split(",")[0]}</strong>
        </div>
      </div>

      {activeSubTab === "directory" ? (
        <>
          {/* 4. Search & Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by home name, neighborhood, or specific urgent need (e.g. sweaters, blankets)..."
                className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs pl-10 pr-4 py-2.5 rounded-xl outline-none transition"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl outline-none cursor-pointer"
              >
                <option value="ALL">All Counties</option>
                <option value="Nairobi">Nairobi</option>
                <option value="Nakuru">Nakuru</option>
                <option value="Uasin Gishu">Uasin Gishu (Eldoret)</option>
                <option value="Mombasa">Mombasa</option>
              </select>
            </div>
          </div>

          {/* 5. Children's Homes Grid */}
          {loading ? (
            <div className="text-center py-16 text-slate-500 font-medium text-xs">
              Calculating distances and loading Children's Homes in Kenya...
            </div>
          ) : filteredHomes.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No children's homes matched your query. Try clearing filters!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="homes-grid">
              {filteredHomes.map((home, idx) => (
                <div
                  key={home.id}
                  className="bg-white border border-stone-200 hover:border-emerald-300 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Name, Distance & Verified Badge */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {home.distanceKm} km away
                          </span>
                          {idx === 0 && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                              ★ Closest
                            </span>
                          )}
                          <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-sky-600" /> Verified
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition mt-2">
                          {home.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {home.neighborhood}, {home.county}
                        </p>
                      </div>
                    </div>

                    {/* Stats pill */}
                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-3 grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Children Supported</div>
                        <div className="text-sm font-black text-slate-900 flex items-center justify-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{home.childrenCount} Kids</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase">Age Group</div>
                        <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1 mt-1 truncate">
                          <Baby className="w-3.5 h-3.5 text-amber-600" />
                          <span title={home.ageRange}>{home.ageRange}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2">
                      {home.description}
                    </p>

                    {/* Urgent Needs Tags */}
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                        Urgent Textile & Clothing Needs:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {home.urgentNeeds.map((need, nIdx) => (
                          <span
                            key={nIdx}
                            className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                          >
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-5 pt-4 border-t border-stone-100 space-y-2">
                    <button
                      onClick={() => setSelectedHomeForDonation(home)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Donate Clothes / Textiles to this Home</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${home.phone}`}
                        className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 text-[11px] font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{home.phone}</span>
                      </a>
                      <button
                        onClick={() => openChat("u-home-1", home.name)}
                        className="bg-stone-100 hover:bg-stone-200 text-slate-700 p-2 rounded-lg transition text-[11px] font-bold"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* 6. Active Donations Impact & Tracking Feed */
        <div className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Recent Community Donations Delivered to Children's Homes</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Track the flow of clean clothing, blankets, and sewing scraps making an immediate difference in children's homes.
            </p>

            {donations.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No active donation shipments recorded yet. Connect your first batch above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="text-[10px] text-slate-500 uppercase bg-stone-50 border-b border-stone-200">
                    <tr>
                      <th scope="col" className="px-5 py-3 rounded-l-lg">Receiving Children's Home</th>
                      <th scope="col" className="px-5 py-3">Donated Batch</th>
                      <th scope="col" className="px-5 py-3">Donor / Trader</th>
                      <th scope="col" className="px-5 py-3">Logistics Pickup Location</th>
                      <th scope="col" className="px-5 py-3">Impact Status</th>
                      <th scope="col" className="px-5 py-3 rounded-r-lg text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50/60 transition">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                            <span>{d.childrenHomeName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800">{d.itemType}</span>
                          {d.weightKg ? <span className="text-emerald-700 font-bold block mt-0.5">{d.weightKg} Kg</span> : null}
                        </td>
                        <td className="px-5 py-4">{d.donorName}</td>
                        <td className="px-5 py-4 text-slate-500 truncate max-w-xs">{d.pickupLocation}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                              d.status === "DELIVERED"
                                ? "bg-emerald-100 text-emerald-800"
                                : d.status === "COORDINATED"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-slate-400">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Connect Donation Modal */}
      <AnimatePresence>
        {selectedHomeForDonation && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-stone-200 rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
                <button
                  onClick={() => setSelectedHomeForDonation(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                  <Heart className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  Free Donation Connection
                </div>
                <h3 className="text-xl font-black">{selectedHomeForDonation.name}</h3>
                <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                  {selectedHomeForDonation.neighborhood}, {selectedHomeForDonation.county} ({selectedHomeForDonation.distanceKm} km from your location)
                </p>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleConnectDonation} className="p-6 space-y-4">
                {/* Needs Reminder */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                  <span className="font-bold block mb-1">Their top requested items:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedHomeForDonation.urgentNeeds.map((need, idx) => (
                      <span key={idx} className="bg-white border border-amber-300 px-2 py-0.5 rounded text-[10px]">
                        {need}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Option 1: Select an existing declared listing */}
                {listings.filter((l) => l.sellerId === user.id).length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Connect from Your Declared Listings (Optional)
                    </label>
                    <select
                      value={selectedListingId}
                      onChange={(e) => setSelectedListingId(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                    >
                      <option value="">-- Or enter custom donation below --</option>
                      {listings
                        .filter((l) => l.sellerId === user.id && l.status === "PUBLISHED")
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.fabricType} ({l.weightKg} Kg) - {l.location}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Option 2: Custom details if no listing chosen */}
                {!selectedListingId && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Items Being Donated</label>
                      <input
                        type="text"
                        required
                        value={customItemDescription}
                        onChange={(e) => setCustomItemDescription(e.target.value)}
                        placeholder="e.g. 2 bags of children sweaters & blankets"
                        className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Est Weight (Kg)</label>
                      <input
                        type="number"
                        min="1"
                        value={customWeightKg}
                        onChange={(e) => setCustomWeightKg(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Pickup or Drop-off Depot Location</label>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. Gikomba Market Depot, Nairobi or Delivery to Karen"
                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Note for the Children's Home (Optional)</label>
                  <textarea
                    rows={2}
                    value={donationNotes}
                    onChange={(e) => setDonationNotes(e.target.value)}
                    placeholder="e.g. All clothes are cleaned and packed by age group. We can help with transport on Saturday."
                    className="w-full bg-stone-50 border border-stone-200 text-slate-800 text-xs p-2.5 rounded-xl outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedHomeForDonation(null)}
                    className="flex-1 bg-stone-100 hover:bg-stone-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDonation}
                    className="flex-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{submittingDonation ? "Connecting..." : "Confirm & Send to Children's Home"}</span>
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
