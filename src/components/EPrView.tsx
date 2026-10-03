import React, { useState } from "react";
import { UserProfile, ListingItem } from "../types.js";
import { Leaf, Award, FileSpreadsheet, ShieldAlert, CheckCircle, BarChart as ChartIcon, FileText } from "lucide-react";
import { motion } from "motion/react";

interface EPrViewProps {
  user: UserProfile;
  listings: ListingItem[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const EPrView: React.FC<EPrViewProps> = ({ user, listings, showToast }) => {
  const [auditYear, setAuditYear] = useState("2026");
  const [auditNotes, setAuditNotes] = useState("");
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // Circular calculations
  const totalWeightRecycled = listings.filter(l => l.status === "SOLD").reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalWeightSavedRaw = listings.reduce((acc, curr) => acc + curr.weightKg, 0);
  const totalCarbonOffsetKg = listings.reduce((acc, curr) => acc + curr.carbonSavingsKg, 0);

  const circularityIdx = totalWeightSavedRaw ? Math.round((totalWeightRecycled / totalWeightSavedRaw) * 105) : 0;

  const handleGenerateComplianceReport = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAudit(true);

    setTimeout(() => {
      showToast(`EPR Circular Sustainability Audit for ${auditYear} generated and certified.`, "success");
      setAuditNotes("");
      setSubmittingAudit(false);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="epr-view-wrapper">
      {/* Title section */}
      <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm flex items-start gap-4">
        <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 text-emerald-700">
          <Leaf className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">EPR Compliance & Circular Audit</h1>
          <p className="text-xs text-slate-500">Authorized Extended Producer Responsibility center. Track carbon credit accumulation, verify textile circular index, and generate conformity certifications.</p>
        </div>
      </div>

      {/* Grid of metrics badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="epr-metrics-grid">
        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">National Recycling Rate</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            {totalWeightSavedRaw ? Math.round((totalWeightRecycled / totalWeightSavedRaw) * 100) : 0}%
          </div>
          <div className="text-[10px] text-emerald-700 mt-2 font-semibold">
            {totalWeightRecycled} Kg out of {totalWeightSavedRaw} Kg documented waste
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Carbon offsets savings</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            -{(totalCarbonOffsetKg / 1000).toFixed(2)} <span className="text-emerald-700 text-lg">M/T</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            Equivalent to (~{Math.round(totalCarbonOffsetKg * 1.5)} trees planted over 10 years)
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Textile circular index</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-3">
            {circularityIdx}/100
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            Calculated from fiber homogeneity & monomaterial rates
          </div>
        </div>
      </div>

      {/* Main compliance tracking layout panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-emerald-600" />
            Compliance audit logs and fiber fractions
          </h2>
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              National compliance rules mandate that textile imports/manufacturers must declare waste stream integration of at least 15% recycled content by weight.
            </p>

            <div className="space-y-3.5">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs font-semibold flex justify-between items-center text-slate-700">
                <span>KEPRO Verified status:</span>
                <span className="text-emerald-800 flex items-center gap-1.5 bg-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                  Highly Compliant (Class A)
                </span>
              </div>

              {/* Progress bars */}
              <div className="bg-stone-50 p-4 border border-stone-200 rounded-xl space-y-4 text-xs font-medium">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Recycling breakdown of fibers</span>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Recycled Cotton Composition:</span>
                    <strong className="text-emerald-700">76% utilization</strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: "76%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Recycled Synthetic polymers (Polyester/Nylon):</span>
                    <strong className="text-sky-700">42% utilization</strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{ width: "42%" }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>Relational wool and felt compounds:</span>
                    <strong className="text-amber-700">18% utilization</strong>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: "18%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Certificate forms */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between" id="epr-audit-certify">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
              File Circular Security Audit
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">Generate formal KEPRO sustainability certifications for verified participants on UziLink.</p>

            <form onSubmit={handleGenerateComplianceReport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Audit Term / Calendar Year</label>
                <select
                  value={auditYear}
                  onChange={(e) => setAuditYear(e.target.value)}
                  className="w-full text-xs bg-stone-50 border border-stone-200 text-slate-800 rounded-xl p-2.5 outline-none font-semibold cursor-pointer"
                >
                  <option value="2026">2026 Audit (Current)</option>
                  <option value="2025">2025 Audit (Past)</option>
                  <option value="2024">2024 Audit (Archive)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Compliance notes & verification audit criteria</label>
                <textarea
                  required
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Insert notes on company credentials, carbon verification benchmarks, and material fiber balance sheets."
                  className="w-full min-h-[90px] bg-stone-50 border border-stone-200 focus:border-emerald-500 text-slate-800 text-xs p-3 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingAudit || !auditNotes}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {submittingAudit ? "Saving Certificate record..." : "Certify EPR Compliance Status"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
