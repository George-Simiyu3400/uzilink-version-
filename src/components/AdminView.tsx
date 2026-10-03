import React, { useState, useEffect } from "react";
import { api } from "../lib/api.js";
import { AdminAnalyticsReport, UserProfile, ListingItem } from "../types.js";
import { ShieldCheck, Users, Percent, Trash2, CheckCircle2, XCircle, AlertCircle, RefreshCw, BarChart2 } from "lucide-react";
import { motion } from "motion/react";
import { resolveImageUrl, handleImageFallback } from "../lib/imageMap.js";

interface AdminViewProps {
  user: UserProfile;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onRefresh: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, showToast, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "listings" | "audit">("analytics");
  const [report, setReport] = useState<AdminAnalyticsReport | null>(null);
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [inventoryList, setInventoryList] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync / pull report
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const reportRes = await api.getAnalytics();
      setReport(reportRes.analytics);

      if (activeTab === "users") {
        const usersRes = await api.getAdminUsers();
        setUserList(usersRes.users);
      } else if (activeTab === "listings") {
        const listRes = await api.getListings();
        setInventoryList(listRes.listings);
      }
    } catch (e: any) {
      showToast("Access restricted or administrative request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab]);

  const handleApproveBusiness = async (bizId: string, isApprove: boolean) => {
    try {
      const decision = isApprove ? "APPROVED" : "REJECTED";
      await api.approveUser(bizId, decision);
      showToast(`User status marked as: ${decision}`, "success");
      loadAdminData();
      onRefresh();
    } catch (err: any) {
      showToast("Failed to change user authorization state", "error");
    }
  };

  const handleModerateListing = async (listingId: string) => {
    try {
      await api.moderateListing(listingId);
      showToast("Listing deleted under administrative moderation", "success");
      setConfirmDeleteId(null);
      loadAdminData();
      onRefresh();
    } catch (err: any) {
      showToast("Moderation deletion failed", "error");
    }
  };

  return (
    <div className="space-y-6" id="admin-page-wrapper">
      {/* Admin Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-stone-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-emerald-700">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Administrative Moderation Center</h1>
            <p className="text-xs text-slate-500">Superuser hub to moderate traders, manage inventory, and audit circular impact.</p>
          </div>
        </div>
        <button
          onClick={loadAdminData}
          disabled={loading}
          className="bg-stone-50 hover:bg-stone-100 p-2.5 text-slate-700 rounded-xl border border-stone-200 cursor-pointer disabled:opacity-50 transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metric card grid scorecard */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="admin-analytics-grid">
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Circular Users Registered</span>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{report.userCount} <span className="text-xs font-normal text-slate-400">members</span></div>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Active Inventory Weight</span>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{report.totalWeightKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">Kg</span></div>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Total Carbon Abated</span>
            <div className="text-2xl font-black text-emerald-700 mt-1.5">-{report.totalCarbonSavedKg.toLocaleString()} <span className="text-xs font-normal text-emerald-600">kg CO2</span></div>
          </div>
          <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Marketplace Net Value</span>
            <div className="text-2xl font-black text-emerald-700 mt-1.5">KES {report.totalKESValue?.toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Quick Approvals Checklist */}
      {report && report.pendingReviewCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-900 shadow-xs" id="admin-notifications-warning">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-1">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            B2B Approvals review list ({report.pendingReviewCount})
          </h3>
          <p className="text-xs text-amber-800 mb-3 block">Recyclers and Manufacturers must pass credential audit and registration review before full platform authorization.</p>
          <button
            onClick={() => setActiveTab("users")}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            Review Business Accounts
          </button>
        </div>
      )}

      {/* Admin Tab Nav */}
      <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200" id="admin-subtabs">
        {(["analytics", "users", "listings", "audit"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl uppercase tracking-wider transition cursor-pointer ${
              activeTab === tab ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400 text-xs">Loading directory database...</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm overflow-hidden" id="admin-active-tab-content">
          {activeTab === "analytics" && report && (
            <div className="space-y-6" id="panel-admin-activity-report">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4">Textile User base Segmentation ratio</h3>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs space-y-3.5 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Waste Suppliers / Mitumba Traders:</span>
                      <strong className="text-slate-900 text-sm">{report.roleStats?.SELLER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Recycling Firms (Processors):</span>
                      <strong className="text-slate-900 text-sm">{report.roleStats?.RECYCLER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Product Manufacturers:</span>
                      <strong className="text-slate-900 text-sm">{report.roleStats?.MANUFACTURER || 0} users</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Children's Homes / Shelters:</span>
                      <strong className="text-slate-900 text-sm">{report.roleStats?.CHILDRENS_HOME || 0} homes</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Upcycling Artisans:</span>
                      <strong className="text-slate-900 text-sm">{report.roleStats?.ARTISAN || 0} tailors</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-4">Circular economy recycling rate</h3>
                  <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 text-xs flex flex-col justify-center h-full min-h-[140px]">
                    <div className="flex justify-between text-slate-600 mb-1.5 font-medium">
                      <span>Total Waste Saved / Re-channeled:</span>
                      <strong className="text-slate-900">{report.solvedWeightKg} Kg / {report.totalWeightKg} Kg</strong>
                    </div>
                    {/* Visual meter bar */}
                    <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${report.totalWeightKg ? (report.solvedWeightKg / report.totalWeightKg) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-2 text-right">
                      {report.totalWeightKg ? Math.round((report.solvedWeightKg / report.totalWeightKg) * 100) : 0}% Completed Circular Rate
                    </span>
                  </div>
                </div>
              </div>

              {/* Show Audit Logs Timeline */}
              <div className="pt-4">
                <h3 className="text-base font-bold text-slate-900 mb-4">Latest System Activities Logs</h3>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 divide-y divide-stone-200 font-mono text-[10px] text-slate-600 max-h-60 overflow-y-auto">
                  {report.recentLogs?.map((log) => (
                    <div key={log.id} className="py-2.5 flex justify-between items-start">
                      <div>
                        <span className="bg-white border border-stone-200 text-slate-700 font-bold px-1.5 py-0.5 rounded mr-2 uppercase text-[8px] tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-slate-800">{log.details}</span>
                        {log.userEmail && <span className="text-slate-400 ml-1">({log.userEmail})</span>}
                      </div>
                      <span className="text-slate-400 ml-4 font-normal select-all">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] text-slate-500 uppercase bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">User</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Organization</th>
                    <th scope="col" className="px-6 py-3">Location</th>
                    <th scope="col" className="px-6 py-3">Review Status</th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {userList.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/60">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div>{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">{u.role}</td>
                      <td className="px-6 py-4">{u.organizationName || "—"}</td>
                      <td className="px-6 py-4">{u.location || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.approvalStatus === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                          u.approvalStatus === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {u.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.approvalStatus === "PENDING" ? (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleApproveBusiness(u.id, false)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-800 px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveBusiness(u.id, true)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "listings" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="text-[10px] text-slate-500 uppercase bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-l-lg">Visual</th>
                    <th scope="col" className="px-6 py-3">Category / Fabric</th>
                    <th scope="col" className="px-6 py-3">Weight</th>
                    <th scope="col" className="px-6 py-3">Pricing</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 rounded-r-lg text-right">Moderate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {inventoryList.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/60">
                      <td className="px-6 py-4">
                        <img 
                          src={resolveImageUrl(l.imageUrl)} 
                          alt={l.fabricType}
                          className="w-10 h-10 object-cover rounded-xl border border-stone-200" 
                          onError={handleImageFallback}
                        />
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div>{l.fabricType}</div>
                        <div className="text-[10px] text-emerald-700">{l.category || l.material}</div>
                      </td>
                      <td className="px-6 py-4">{l.weightKg} Kg</td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">
                        {l.isDonation || l.estimatedPriceKES === 0 ? "FREE DONATION" : `KES ${l.estimatedPriceKES?.toLocaleString()}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-stone-100 text-slate-700">
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === l.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] text-rose-600 font-bold">Delete?</span>
                            <button
                              onClick={() => handleModerateListing(l.id)}
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
                            title="Remove Listing"
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

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Traceability & Compliance Verification</h3>
              <p className="text-xs text-slate-500">All registered circular transactions, donations to Children's Homes, and abated emissions logs.</p>
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 divide-y divide-stone-200 font-mono text-[11px] text-slate-600 max-h-96 overflow-y-auto">
                {report?.recentLogs?.map((l) => (
                  <div key={l.id} className="py-3 flex justify-between">
                    <div>
                      <span className="font-bold text-emerald-700 mr-2">[{l.action}]</span>
                      <span>{l.details}</span>
                    </div>
                    <span className="text-slate-400 shrink-0 ml-4">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
