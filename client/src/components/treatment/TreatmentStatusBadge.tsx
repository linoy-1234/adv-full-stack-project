import { Calendar, CheckCircle2, Clock } from "lucide-react";
import type { ChemoDisplayStatus, RadiationDisplayStatus } from "../../utils/treatmentDisplay";

// Oncologist's chemo-cycle status pill. NOTE: the patient portal's own status
// badge (in the treatment-roadmap page) intentionally renders "active" with a
// different color (soft emerald vs this solid-green pill) - that is a real,
// currently-visible difference between the two portals, not an oversight, so
// it is NOT unified with this component. Both live in this file so they're
// easy to find and compare, not because they share one visual.
export function CycleDisplayBadge({ displayStatus }: { displayStatus: ChemoDisplayStatus }) {
  const cfg: Record<ChemoDisplayStatus, { label: string; color: string }> = {
    completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
    active: { label: "Active", color: "bg-[#7CAE8E] text-white" },
    waiting_for_review: { label: "Waiting for Review", color: "bg-violet-100 text-violet-700" },
    upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-700" },
  };
  const { label, color } = cfg[displayStatus];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export const radiationStatusConfig: Record<RadiationDisplayStatus, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
  active: { label: "Active", cls: "bg-amber-500 text-white" },
  upcoming: { label: "Upcoming", cls: "bg-blue-100 text-blue-700" },
};

// Patient portal's own status pill, used across chemo/radiation/surgery rows
// on the treatment-roadmap page. Kept as its own component (not merged with
// CycleDisplayBadge above) - "active" here is a soft emerald pill, not the
// oncologist card's solid green, and this one also needs a "today" case
// (surgery-only) that CycleDisplayBadge never has.
export function PatientCycleStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    completed: { label: "Completed", color: "bg-gray-100 text-gray-600", icon: <CheckCircle2 size={11} /> },
    active: { label: "Active", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={11} /> },
    waiting_for_review: { label: "Waiting for Review", color: "bg-violet-100 text-violet-700", icon: <Clock size={11} /> },
    upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-700", icon: <Clock size={11} /> },
    today: { label: "Today", color: "bg-blue-500 text-white", icon: <Calendar size={11} /> },
  };
  const { label, color, icon } = cfg[status] ?? { label: status, color: "bg-gray-100 text-gray-600", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}{label}
    </span>
  );
}
