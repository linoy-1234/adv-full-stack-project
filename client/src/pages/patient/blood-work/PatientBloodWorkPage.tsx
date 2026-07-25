import { useState } from "react";
import {
  PatientProfile,
  LabResult,
} from "../../types/patientPortalTypes";
import { formatDate } from "../../utils/dateUtils";
import { getLabStatus, LAB_NORMS, type LabFieldKey } from "../../utils/labUtils";
import { ChevronDown, ChevronUp, FlaskConical, Info } from "lucide-react";

interface BloodWorkProps {
  profile: PatientProfile;
  labResults: LabResult[];
}

function LabValueRow({ field, value }: { field: LabFieldKey; value: number }) {
  const status = getLabStatus(field, value);
  const norm = LAB_NORMS[field];
  const color = status === "normal" ? { bg: "#D1FAE5", text: "#166534" } : status === "low" ? { bg: "#FEF3C7", text: "#92400E" } : { bg: "#FEE2E2", text: "#991B1B" };
  const fieldLabels: Record<string, string> = {
    wbc: "WBC", neutrophils: "Neutrophils", hemoglobin: "Hemoglobin",
    platelets: "Platelets", alt: "ALT", creatinine: "Creatinine",
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F5F2EE] last:border-0">
      <div>
        <span className="text-sm text-[#374151] font-medium">{fieldLabels[field]}</span>
        <span className="text-xs text-[#9CA3AF] ml-2">Normal: {norm.min}–{norm.max}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#2C3E2D]">{value}</span>
        {status !== "normal" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: color.bg, color: color.text }}>
            {status}
          </span>
        )}
        {status === "normal" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#D1FAE5", color: "#166534" }}>✓</span>
        )}
      </div>
    </div>
  );
}


export function BloodWork({ profile, labResults }: BloodWorkProps) {
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const sortedLabs = [...labResults].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sortedLabs[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Lab results entered by Lab Staff — for oncologist review only. Do not adjust medications based on these values without consulting your oncologist.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>Blood Work</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {sortedLabs.length} result{sortedLabs.length !== 1 ? "s" : ""} — {profile.diagnosis}
        </p>
      </div>

      {sortedLabs.length === 0 ? (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-10 text-center">
          <FlaskConical size={32} className="mx-auto mb-3 text-[#9CA3AF] opacity-40" />
          <p className="text-sm text-[#9CA3AF]">No lab results have been entered yet. Lab Staff will add results after your blood draw.</p>
        </div>
      ) : (
        <>
          {/* Latest results */}
          {latest && (
            <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2C3E2D]">Latest Results — {formatDate(latest.date)}</p>
                  <p className="text-xs text-[#9CA3AF]">Entered by {latest.enteredBy} · {formatDate(latest.enteredAt)}</p>
                </div>
              </div>
              <div className="px-5 divide-y divide-[#F5F2EE]">
                {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => (
                  <LabValueRow key={field} field={field} value={latest[field]} />
                ))}
              </div>
              {latest.notes && (
                <div className="px-5 py-3 bg-[#F5F2EE] border-t border-[#E5E2DC] text-xs text-[#6B7280]">
                  Note: {latest.notes}
                </div>
              )}
            </div>
          )}

          {/* History — collapsible */}
          {sortedLabs.length > 1 && (
            <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
              <button
                onClick={() => setHistoryExpanded((v) => !v)}
                className="w-full px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] flex items-center justify-between hover:bg-[#EDE9E3] transition-colors"
              >
                <p className="text-sm font-semibold text-[#2C3E2D]">
                  Lab History ({sortedLabs.length - 1} older result{sortedLabs.length - 1 !== 1 ? "s" : ""})
                </p>
                {historyExpanded
                  ? <ChevronUp size={14} className="text-[#9CA3AF]" />
                  : <ChevronDown size={14} className="text-[#9CA3AF]" />}
              </button>
              {historyExpanded && sortedLabs.slice(1).map((lab) => (
                <div key={lab.id} className="px-5 py-3 border-b border-[#F5F2EE] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#2C3E2D]">{formatDate(lab.date)}</p>
                    <p className="text-xs text-[#9CA3AF]">by {lab.enteredBy}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                    {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => {
                      const status = getLabStatus(field, lab[field]);
                      const tc = status === "low" ? "text-amber-700" : status === "high" ? "text-red-700" : "text-emerald-700";
                      return (
                        <span key={field} className="flex items-center gap-1">
                          <span className="text-[#9CA3AF] capitalize w-20 shrink-0">{field}</span>
                          <span className={`font-medium ${tc}`}>{lab[field]}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

