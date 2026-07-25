import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";

import { formatDate } from "../../../../../utils/dateUtils";
import { getLabStatus, LAB_NORMS, type LabFieldKey } from "../../../../../utils/labUtils";
import type { ApiLabResult } from "../../../../../types/api";
import { LabTrendChart } from "../shared/LabTrendChart";
import { SectionCard } from "../shared/PatientDetailShared";

interface LabResultsCardProps {
  labsLoading: boolean;
  labResults: ApiLabResult[];
  labHistoryExpanded: boolean;
  onToggleLabHistory: () => void;
}

export function LabResultsCard({
  labsLoading,
  labResults,
  labHistoryExpanded,
  onToggleLabHistory,
}: LabResultsCardProps) {
  return (
    <SectionCard
      title="Lab Results — Lab Staff Entry"
      source="Lab results entered by Lab Staff"
    >
      {labsLoading ? (
        <p className="text-sm text-[#9CA3AF] py-4 text-center">Loading lab results…</p>
      ) : labResults.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-[#9CA3AF]">
          <FlaskConical size={22} className="opacity-40" />
          <p className="text-sm">No lab results have been entered yet.</p>
        </div>
      ) : (() => {
        const sorted = [...labResults].sort((a, b) =>
          (b.testDate ?? "").localeCompare(a.testDate ?? "")
        );
        const latest = sorted[0];
        const older = sorted.slice(1);
        const fieldLabels: Record<string, string> = {
          wbc: "WBC", neutrophils: "Neutrophils", hemoglobin: "Hemoglobin",
          platelets: "Platelets", alt: "ALT", creatinine: "Creatinine",
        };
        return (
          <div className="space-y-4">
            {/* Latest Results */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Latest Results — {formatDate((latest.testDate ?? "").split("T")[0])}
                </p>
                <span className="text-xs text-[#9CA3AF]">
                  by {latest.enteredBy?.fullName ?? "Unknown"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["wbc", "neutrophils", "hemoglobin", "platelets", "alt", "creatinine"] as LabFieldKey[]).map((field) => {
                  const val = latest[field];
                  const status = getLabStatus(field, val);
                  const norm = LAB_NORMS[field];
                  const colorCls = status === "normal"
                    ? "text-emerald-700 bg-emerald-50"
                    : status === "low"
                    ? "text-amber-700 bg-amber-50"
                    : "text-red-700 bg-red-50";
                  return (
                    <div key={field} className="bg-[#F5F2EE] rounded-lg px-3 py-2">
                      <p className="text-xs text-[#9CA3AF] mb-0.5">{fieldLabels[field]}</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-semibold px-1.5 py-0.5 rounded ${colorCls}`}>
                          {val}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                        Normal: {norm.min}–{norm.max}
                      </p>
                    </div>
                  );
                })}
              </div>
              {latest.notes && (
                <p className="text-xs text-[#9CA3AF] mt-2">Note: {latest.notes}</p>
              )}
            </div>

            {/* Trend chart */}
            <LabTrendChart labResults={labResults} />

            {/* Lab History (collapsible) */}
            {older.length > 0 && (
              <div className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                <button
                  onClick={onToggleLabHistory}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F2EE] hover:bg-[#EDE9E3] transition-colors text-left"
                >
                  <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                    Lab History ({older.length} older result{older.length !== 1 ? "s" : ""})
                  </span>
                  {labHistoryExpanded
                    ? <ChevronUp size={13} className="text-[#9CA3AF]" />
                    : <ChevronDown size={13} className="text-[#9CA3AF]" />
                  }
                </button>
                {labHistoryExpanded && (
                  <div className="divide-y divide-[#F5F2EE]">
                    {older.map((lab) => {
                      const dateStr = (lab.testDate ?? "").split("T")[0];
                      return (
                        <div key={lab._id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#2C3E2D]">{formatDate(dateStr)}</span>
                            </div>
                            <span className="text-xs text-[#9CA3AF]">by {lab.enteredBy?.fullName ?? "Unknown"}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {(["wbc", "neutrophils", "hemoglobin", "platelets", "alt", "creatinine"] as LabFieldKey[]).map((field) => {
                              const val = lab[field];
                              const status = getLabStatus(field, val);
                              const norm = LAB_NORMS[field];
                              const colorCls = status === "normal" ? "text-emerald-700 bg-emerald-50" : status === "low" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
                              return (
                                <div key={field} className="flex items-center gap-1.5">
                                  <span className="text-[#9CA3AF] w-20 capitalize shrink-0">{fieldLabels[field]}</span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${colorCls}`} title={`Normal: ${norm.min}–${norm.max}`}>{val}</span>
                                </div>
                              );
                            })}
                          </div>
                          {lab.notes && <p className="text-xs text-[#9CA3AF] mt-1">{lab.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </SectionCard>
  );
}

