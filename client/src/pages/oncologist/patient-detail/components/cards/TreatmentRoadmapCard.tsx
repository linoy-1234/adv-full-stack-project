import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Scissors,
  Syringe,
  Zap,
} from "lucide-react";

import { formatDate } from "../../../../../utils/dateUtils";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getRadiationDisplayStatus,
  getSurgeryDisplayStatus,
  type SurgeryDisplayStatus,
} from "../../../../../utils/treatmentDisplay";
import type { TreatmentCycleRecord, TreatmentProtocolRecord } from "../../../../../types/api";
import {
  getPersonName,
  getRoadmapItemTitle,
  normalizeWeekdays,
  radiationStatusConfig,
  weekdayLabels,
} from "../../helpers";
import { CycleDisplayBadge, PhasePlaceholder, SectionCard } from "../shared/PatientDetailShared";

interface TreatmentRoadmapCardProps {
  protocol: TreatmentProtocolRecord | null;
  treatmentLoading: boolean;
  hasCycles: boolean;
  chemoCycles: TreatmentCycleRecord[];
  radiationCycles: TreatmentCycleRecord[];
  surgeryCycles: TreatmentCycleRecord[];
  expandedCycle: string | null;
  onToggleExpand: (cycleId: string) => void;
  savingTreatment: boolean;
  onApprove: (cycle: TreatmentCycleRecord) => void;
  onRequestPostpone: (cycle: TreatmentCycleRecord) => void;
  onEditDatesClick: () => void;
}

export function TreatmentRoadmapCard({
  protocol,
  treatmentLoading,
  hasCycles,
  chemoCycles,
  radiationCycles,
  surgeryCycles,
  expandedCycle,
  onToggleExpand,
  savingTreatment,
  onApprove,
  onRequestPostpone,
  onEditDatesClick,
}: TreatmentRoadmapCardProps) {
  return (
    <SectionCard
      title="Treatment Roadmap"
      source="Treatment schedule managed by oncologist"
      editButton={
        protocol && hasCycles && (
          <button
            onClick={onEditDatesClick}
            disabled={savingTreatment}
            className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
          >
            <Pencil size={12} /> Edit Dates
          </button>
        )
      }
    >
      {treatmentLoading ? (
        <PhasePlaceholder icon={<Calendar size={16} />}>
          Loading treatment roadmap...
        </PhasePlaceholder>
      ) : !protocol ? (
        <PhasePlaceholder icon={<Calendar size={16} />}>
          Create a treatment protocol to schedule roadmap items.
        </PhasePlaceholder>
      ) : !hasCycles ? (
        <PhasePlaceholder icon={<Calendar size={16} />}>
          No roadmap items have been scheduled yet.
        </PhasePlaceholder>
      ) : (
        <div className="space-y-2">
          {chemoCycles.map((cycle) => {
            const displayStatus = getChemoDisplayStatus(cycle);
            const isExpanded = expandedCycle === cycle._id;
            const { startDate: effectiveStart, endDate: effectiveEnd } =
              getEffectiveCycleDates(cycle);
            const effectiveDateStr = `${formatDate(
              effectiveStart || cycle.startDate
            )} - ${formatDate(effectiveEnd || cycle.endDate)}`;

            return (
              <div key={cycle._id} className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#FAF8F5] transition-colors text-left"
                  onClick={() => onToggleExpand(cycle._id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Syringe size={14} className="text-[#7CAE8E] shrink-0" />
                    <span className="text-sm font-medium text-[#2C3E2D]">
                      {getRoadmapItemTitle(cycle)}
                    </span>
                    <CycleDisplayBadge displayStatus={displayStatus} />
                    <span className="text-xs text-[#9CA3AF]">{effectiveDateStr}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-[#9CA3AF] shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 bg-[#F5F2EE] border-t border-[#E5E2DC] space-y-3">
                    {displayStatus === "upcoming" && (
                      <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                        <p>
                          Scheduled: {formatDate(effectiveStart || cycle.startDate)} -{" "}
                          {formatDate(effectiveEnd || cycle.endDate)}
                        </p>
                        <p className="text-xs mt-1 text-blue-600">
                          No action required yet.
                        </p>
                      </div>
                    )}
                    {displayStatus === "waiting_for_review" && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          <CheckCircle2 size={14} />
                          <span>
                            Current start date has arrived. Review latest bloodwork and decide whether to approve or postpone.
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onApprove(cycle)}
                            disabled={savingTreatment}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors disabled:opacity-60"
                          >
                            <Check size={13} /> Approve Cycle
                          </button>
                          <button
                            onClick={() => onRequestPostpone(cycle)}
                            disabled={savingTreatment}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors disabled:opacity-60"
                          >
                            <Calendar size={13} /> Postpone
                          </button>
                        </div>
                      </div>
                    )}
                    {displayStatus === "active" && (
                      <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <p>
                          Approved on{" "}
                          {formatDate(cycle.decision?.decidedAt || cycle.updatedAt || "")}{" "}
                          by {getPersonName(cycle.decision?.decidedBy) || "oncologist"}
                        </p>
                        <p className="text-xs mt-0.5 text-emerald-600">
                          Currently in progress.
                        </p>
                      </div>
                    )}
                    {displayStatus === "completed" && (
                      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        Cycle completed.
                        {cycle.decision?.decidedAt && (
                          <span className="text-xs ml-1">
                            Approved {formatDate(cycle.decision.decidedAt)} by{" "}
                            {getPersonName(cycle.decision.decidedBy) || "oncologist"}.
                          </span>
                        )}
                      </div>
                    )}
                    {cycle.notes && (
                      <p className="text-xs text-[#9CA3AF]">{cycle.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {radiationCycles.map((cycle) => {
            const radStatus = getRadiationDisplayStatus(cycle);
            const radCfg = radiationStatusConfig[radStatus];
            return (
              <div
                key={cycle._id}
                className={`flex items-start gap-3 p-3 rounded-xl border border-[#E5E2DC] ${radStatus === "active" ? "bg-amber-50" : radStatus === "completed" ? "bg-gray-50" : "bg-[#F5F2EE]"}`}
              >
                <div className="mt-0.5">
                  <Zap size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#2C3E2D]">
                      {getRoadmapItemTitle(cycle)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${radCfg.cls}`}>
                      {radCfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)} ·{" "}
                    {cycle.totalSessions || 0} sessions planned
                  </div>
                  {normalizeWeekdays(cycle.weekdays).length > 0 && (
                    <div className="text-xs text-[#9CA3AF] mt-0.5">
                      {normalizeWeekdays(cycle.weekdays)
                        .map((day) => weekdayLabels[day])
                        .join(", ")}
                    </div>
                  )}
                  {cycle.notes && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>
                  )}
                </div>
              </div>
            );
          })}

          {surgeryCycles.map((cycle) => {
            const surgDisplay = getSurgeryDisplayStatus(cycle);
            const surgCfg: Record<SurgeryDisplayStatus, { label: string; cls: string }> = {
              upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700" },
              today:     { label: "Today",     cls: "bg-blue-500 text-white" },
              completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
            };
            return (
              <div
                key={cycle._id}
                className={`flex items-start gap-3 p-3 rounded-xl border border-[#E5E2DC] ${surgDisplay === "today" ? "bg-blue-50" : surgDisplay === "completed" ? "bg-gray-50" : "bg-[#F5F2EE]"}`}
              >
                <div className="mt-0.5">
                  <Scissors size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#2C3E2D]">
                      {getRoadmapItemTitle(cycle)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${surgCfg[surgDisplay].cls}`}>
                      {surgCfg[surgDisplay].label}
                    </span>
                  </div>
                  <div className="text-xs text-[#9CA3AF] mt-0.5">
                    Planned: {formatDate(cycle.plannedDate || cycle.startDate)}
                  </div>
                  {cycle.notes && (
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

