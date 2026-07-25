import type { PatientProfile as ApiPatientProfile } from "../../../types/patient";
import type { TreatmentCycleRecord, TreatmentProtocolRecord } from "../../../types/treatment";
import { formatDate } from "../../../utils/dateUtils";
import { Calendar, Syringe, Zap, Scissors, Info } from "lucide-react";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getRadiationDisplayStatus,
  getRoadmapItemTitle,
  getSurgeryDisplayStatus,
  getTreatmentCount,
  toDateInputValue,
  todayIso,
  weekdayLabels,
} from "../../../utils/treatmentDisplay";
import { getPersonName } from "../../../utils/personUtils";
import { PatientCycleStatusBadge } from "../../../components/treatment/TreatmentStatusBadge";

interface TreatmentCyclesProps {
  profile: ApiPatientProfile;
  protocol: TreatmentProtocolRecord | null;
  cycles: TreatmentCycleRecord[];
}

function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ReactNode; label: string }> = {
    chemotherapy: { icon: <Syringe size={12} className="text-[#7CAE8E]" />, label: "Chemotherapy" },
    radiation:    { icon: <Zap size={12} className="text-amber-500" />,    label: "Radiation" },
    surgery:      { icon: <Scissors size={12} className="text-blue-500" />, label: "Surgery" },
    supportive:   { icon: null,                                              label: "Supportive" },
  };
  const c = cfg[type] ?? { icon: null, label: type };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC]">
      {c.icon}{c.label}
    </span>
  );
}

export function TreatmentCycles({ profile, protocol, cycles }: TreatmentCyclesProps) {
  const todayValue = todayIso();

  if (!protocol) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h2 style={{ color: "#2D4739" }}>Treatment Roadmap</h2>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Your treatment plan will appear here once your oncologist sets it up.</p>
        </div>
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-10 text-center text-sm text-[#9CA3AF]">
          <Calendar size={32} className="mx-auto mb-3 opacity-40" />
          No treatment protocol has been created yet.
        </div>
      </div>
    );
  }

  const chemoItems = cycles.filter((cycle) => cycle.treatmentType === "chemotherapy");
  const radItems = cycles.filter((cycle) => cycle.treatmentType === "radiation");
  const surgItems = cycles.filter((cycle) => cycle.treatmentType === "surgery");

  const completedChemo = chemoItems.filter((cycle) => getChemoDisplayStatus(cycle) === "completed").length;
  const totalChemo = getTreatmentCount(protocol, "chemotherapy");

  // "You are here" marker - computed but not currently referenced anywhere in
  // the rendered JSX below. This was already true before this migration
  // (pre-existing dead computation in the original TreatmentCycles.tsx);
  // preserved as-is rather than silently dropped.
  const currentItem = cycles.find((cycle) => {
    if (cycle.treatmentType === "chemotherapy") {
      if (getChemoDisplayStatus(cycle) !== "active") return false;
      const { startDate, endDate } = getEffectiveCycleDates(cycle);
      return startDate <= todayValue && endDate >= todayValue;
    }
    if (cycle.treatmentType === "radiation") return getRadiationDisplayStatus(cycle) === "active";
    return false;
  });
  void currentItem;

  return (
    <div className="flex flex-col gap-5">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Treatment schedule managed by oncologist. All dates are set and updated by your care team.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>Treatment Roadmap</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {protocol.protocolName} · {profile.diagnosis}
        </p>
      </div>

      {/* Protocol type badges */}
      {protocol.treatmentTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {protocol.treatmentTypes.map((t) => <TypeBadge key={t.type} type={t.type} />)}
        </div>
      )}

      {/* Progress summary */}
      {totalChemo > 0 && (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2C3E2D]">Chemotherapy Progress</span>
            <span className="text-sm text-[#7CAE8E] font-semibold">{completedChemo}/{totalChemo} cycles</span>
          </div>
          <div className="h-2 bg-[#F5F2EE] rounded-full overflow-hidden">
            <div className="h-full bg-[#7CAE8E] rounded-full transition-all" style={{ width: `${(completedChemo / totalChemo) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Chemotherapy cycles */}
      {chemoItems.length > 0 && (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] flex items-center gap-2">
            <Syringe size={14} className="text-[#7CAE8E]" />
            <h3 className="text-sm font-semibold text-[#2C3E2D]">Chemotherapy Cycles</h3>
          </div>
          <div className="divide-y divide-[#F5F2EE]">
            {chemoItems.map((cycle) => {
              const status = getChemoDisplayStatus(cycle);
              const { startDate, endDate } = getEffectiveCycleDates(cycle);
              const isActive = status === "active" && startDate <= todayValue && endDate >= todayValue;
              const approvedBy = getPersonName(cycle.decision?.decidedBy, "oncologist");
              const approvedDate = toDateInputValue(cycle.decision?.decidedAt);
              return (
                <div key={cycle._id} className={`px-4 py-3 ${isActive ? "bg-emerald-50" : ""}`}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-xs bg-[#7CAE8E] text-white px-2 py-0.5 rounded-full font-medium">Active</span>
                      )}
                      <span className="text-sm font-medium text-[#2C3E2D]">{getRoadmapItemTitle(cycle)}</span>
                      <PatientCycleStatusBadge status={status} />
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {formatDate(startDate)} – {formatDate(endDate)}
                    </span>
                  </div>
                  {["active", "completed"].includes(status) && approvedBy && (
                    <p className="text-xs text-emerald-600 mt-0.5">Approved by {approvedBy} · {formatDate(approvedDate || "")}</p>
                  )}
                  {status === "waiting_for_review" && (
                    <p className="text-xs text-violet-600 mt-0.5">Waiting for oncologist review.</p>
                  )}
                  {cycle.notes && <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Radiation */}
      {radItems.length > 0 && (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FEF3C7] border-b border-[#FCD34D] flex items-center gap-2">
            <Zap size={14} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-[#92400E]">Radiation Course</h3>
          </div>
          <div className="divide-y divide-[#F5F2EE]">
            {radItems.map((cycle) => {
              const status = getRadiationDisplayStatus(cycle);
              const { startDate, endDate } = getEffectiveCycleDates(cycle);
              const isActive = status === "active";
              return (
                <div key={cycle._id} className={`px-4 py-3 ${isActive ? "bg-amber-50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isActive && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">Active</span>}
                      <span className="text-sm font-medium text-[#2C3E2D]">{getRoadmapItemTitle(cycle)}</span>
                    </div>
                    <PatientCycleStatusBadge status={status} />
                  </div>
                  <p className="text-xs text-[#9CA3AF]">{formatDate(startDate)} → {formatDate(endDate)}</p>
                  <p className="text-xs text-[#6B7280] mt-2">Sessions planned: {cycle.totalSessions || 0}</p>
                  {(cycle.weekdays?.length ?? 0) > 0 ? (
                    <p className="text-xs text-[#6B7280] mt-1">
                      Weekdays: {(cycle.weekdays || []).map((day) => weekdayLabels[day]).join(", ")}
                    </p>
                  ) : null}
                  {cycle.notes && <p className="text-xs text-[#9CA3AF] mt-1">{cycle.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Surgery */}
      {surgItems.length > 0 && (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-[#EFF6FF] border-b border-[#BFDBFE] flex items-center gap-2">
            <Scissors size={14} className="text-blue-600" />
            <h3 className="text-sm font-semibold text-[#1E40AF]">Surgery Checkpoints</h3>
          </div>
          <div className="divide-y divide-[#F5F2EE]">
            {surgItems.map((cycle) => {
              const status = getSurgeryDisplayStatus(cycle);
              const plannedDate = toDateInputValue(cycle.plannedDate || cycle.startDate);
              return (
                <div key={cycle._id} className={`px-4 py-3 ${status === "today" ? "bg-blue-50" : status === "completed" ? "bg-gray-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#2C3E2D]">{getRoadmapItemTitle(cycle)}</span>
                      <PatientCycleStatusBadge status={status} />
                    </div>
                    <span className="text-xs text-[#9CA3AF]">{formatDate(plannedDate)}</span>
                  </div>
                  {cycle.notes && <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {protocol.notes && (
        <div className="bg-[#F0F7F3] border border-[#C8D9CC] rounded-2xl p-4 text-sm text-[#2C3E2D]">
          <p className="text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide">Protocol Notes</p>
          {protocol.notes}
        </div>
      )}
    </div>
  );
}
