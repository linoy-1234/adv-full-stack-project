import {
  PatientProfile,
  TreatmentProtocol,
  ChemoCycle,
  RadiationCourse,
  SurgeryCheckpoint,
  formatDate,
} from "../../utils/mockData";
import { Calendar, CheckCircle2, Clock, Syringe, Zap, Scissors, AlertTriangle, Info } from "lucide-react";
import { todayIso } from "../../utils/treatmentDisplay";

interface TreatmentCyclesProps {
  profile: PatientProfile;
  protocol?: TreatmentProtocol;
}

function CycleStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    completed:    { label: "Completed",      color: "bg-gray-100 text-gray-600",        icon: <CheckCircle2 size={11} /> },
    approved:     { label: "Approved",       color: "bg-emerald-100 text-emerald-700",  icon: <CheckCircle2 size={11} /> },
    active:       { label: "Active",         color: "bg-emerald-100 text-emerald-700",  icon: <CheckCircle2 size={11} /> },
    waiting_labs: { label: "Waiting for labs", color: "bg-amber-100 text-amber-700",    icon: <Clock size={11} /> },
    ready_for_review: { label: "Ready for Review", color: "bg-violet-100 text-violet-700", icon: <CheckCircle2 size={11} /> },
    delayed:      { label: "Delayed",        color: "bg-red-100 text-red-700",          icon: <AlertTriangle size={11} /> },
    upcoming:     { label: "Upcoming",       color: "bg-blue-100 text-blue-700",        icon: <Clock size={11} /> },
    in_progress:  { label: "In Progress",    color: "bg-emerald-100 text-emerald-700",  icon: <CheckCircle2 size={11} /> },
    postponed:    { label: "Postponed",      color: "bg-red-100 text-red-700",          icon: <AlertTriangle size={11} /> },
    today:        { label: "Today",          color: "bg-blue-500 text-white",           icon: <Calendar size={11} /> },
  };
  const { label, color, icon } = cfg[status] ?? { label: status, color: "bg-gray-100 text-gray-600", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}{label}
    </span>
  );
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

export function TreatmentCycles({ profile, protocol }: TreatmentCyclesProps) {
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

  const items = protocol.items;
  const chemoItems = items.filter((i) => i.type === "chemotherapy") as ChemoCycle[];
  const radItems = items.filter((i) => i.type === "radiation") as RadiationCourse[];
  const surgItems = items.filter((i) => i.type === "surgery") as SurgeryCheckpoint[];

  const completedChemo = chemoItems.filter((c) => c.status === "completed").length;
  const totalChemo = protocol.numberOfChemoCycles ?? chemoItems.length;

  // Find "You Are Here"
  const currentItem = items.find((item) => {
    if (item.type === "chemotherapy") {
      const c = item as ChemoCycle;
      if ((c.status as string) !== "active") return false;
      return c.startDate <= todayValue && c.endDate >= todayValue;
    }
    if (item.type === "radiation") {
      const r = item as RadiationCourse;
      return r.status === "in_progress";
    }
    return false;
  });

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
          {protocol.treatmentTypes.map((t) => <TypeBadge key={t} type={t} />)}
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
              const status = cycle.status as string;
              const isActive = status === "active" && cycle.startDate <= todayValue && cycle.endDate >= todayValue;
              const hasDelayedContext = Boolean(cycle.delayedTo || cycle.delayReason);
              return (
                <div key={cycle.id} className={`px-4 py-3 ${isActive ? "bg-emerald-50" : ""}`}>
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive && (
                        <span className="text-xs bg-[#7CAE8E] text-white px-2 py-0.5 rounded-full font-medium">Active</span>
                      )}
                      <span className="text-sm font-medium text-[#2C3E2D]">{cycle.title}</span>
                      <CycleStatusBadge status={cycle.status} />
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {hasDelayedContext && cycle.delayedTo
                        ? `Delayed → ${formatDate(cycle.delayedTo)}${cycle.delayedEndDate ? ` – ${formatDate(cycle.delayedEndDate)}` : ""}`
                        : `${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`}
                    </span>
                  </div>
                  {["approved", "active", "completed"].includes(status) && cycle.approvedBy && (
                    <p className="text-xs text-emerald-600 mt-0.5">Approved by {cycle.approvedBy} · {formatDate(cycle.approvedDate || "")}</p>
                  )}
                  {hasDelayedContext && cycle.delayReason && (
                    <p className="text-xs text-red-600 mt-0.5">Reason: {cycle.delayReason}</p>
                  )}
                  {status === "waiting_labs" && (
                    <p className="text-xs text-amber-600 mt-0.5">Awaiting lab results before oncologist can review this cycle.</p>
                  )}
                  {status === "ready_for_review" && (
                    <p className="text-xs text-violet-600 mt-0.5">Lab results received. Ready for oncologist review.</p>
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
            {radItems.map((rad) => {
              const isActive = rad.status === "in_progress";
              return (
                <div key={rad.id} className={`px-4 py-3 ${isActive ? "bg-amber-50" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {isActive && <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">In Progress</span>}
                      <span className="text-sm font-medium text-[#2C3E2D]">{rad.title}</span>
                    </div>
                    <CycleStatusBadge status={rad.status} />
                  </div>
                  <p className="text-xs text-[#9CA3AF]">{formatDate(rad.startDate)} → {formatDate(rad.endDate)}</p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-[#6B7280] mb-1">
                      <span>Sessions: {rad.completedSessions}/{rad.totalSessions}</span>
                      <span>{Math.round((rad.completedSessions / rad.totalSessions) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F5F2EE] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(rad.completedSessions / rad.totalSessions) * 100}%` }} />
                    </div>
                  </div>
                  {rad.notes && <p className="text-xs text-[#9CA3AF] mt-1">{rad.notes}</p>}
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
            {surgItems.map((surg) => (
              <div key={surg.id} className={`px-4 py-3 ${surg.status === "today" ? "bg-blue-50" : surg.status === "completed" ? "bg-gray-50" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#2C3E2D]">{surg.title}</span>
                    <CycleStatusBadge status={surg.status} />
                  </div>
                  <span className="text-xs text-[#9CA3AF]">{formatDate(surg.plannedDate)}</span>
                </div>
                {surg.notes && <p className="text-xs text-[#9CA3AF] mt-0.5">{surg.notes}</p>}
              </div>
            ))}
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
