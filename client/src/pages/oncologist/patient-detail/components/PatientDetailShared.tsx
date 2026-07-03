import type { ReactNode } from "react";
import { Info, Pill, Scissors, Syringe, Zap } from "lucide-react";

import {
  weekdayKeys,
  type ChemoDisplayStatus,
  type WeekdayKey,
} from "../../../../utils/treatmentDisplay";
import { weekdayLabels } from "../patientDetailHelpers";

export function SourceLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-2 py-0.5 rounded-full border border-[#E5E2DC]">
      <Info size={10} /> {text}
    </span>
  );
}

export function SectionCard({
  title,
  source,
  meta,
  editButton,
  children,
}: {
  title: string;
  source?: string;
  meta?: string;
  editButton?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#F5F2EE]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#2C3E2D]">{title}</h3>
          {source && <SourceLabel text={source} />}
          {meta && <p className="text-xs text-[#9CA3AF]">{meta}</p>}
        </div>
        {editButton}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-[#9CA3AF] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#2C3E2D]">{value || "-"}</span>
    </div>
  );
}

export function PhasePlaceholder({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="text-center py-8 text-sm text-[#9CA3AF]">
      <div className="mx-auto mb-2 w-8 h-8 rounded-full bg-[#F5F2EE] border border-[#E5E2DC] flex items-center justify-center text-[#7CAE8E]">
        {icon}
      </div>
      {children}
    </div>
  );
}

export function TypeIcon({ type }: { type: string }) {
  if (type === "chemotherapy") return <Syringe size={14} className="text-[#7CAE8E]" />;
  if (type === "radiation") return <Zap size={14} className="text-amber-500" />;
  if (type === "surgery") return <Scissors size={14} className="text-blue-500" />;
  return <Pill size={14} className="text-gray-400" />;
}

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

export function WeekdaySelector({
  selected,
  onChange,
  disabled,
}: {
  selected: WeekdayKey[];
  onChange: (days: WeekdayKey[]) => void;
  disabled?: boolean;
}) {
  const toggleDay = (day: WeekdayKey) => {
    if (selected.includes(day)) {
      onChange(selected.filter((selectedDay) => selectedDay !== day));
      return;
    }

    onChange([...selected, day]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {weekdayKeys.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggleDay(day)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors disabled:opacity-60 ${
            selected.includes(day)
              ? "bg-[#7CAE8E] text-white border-[#7CAE8E]"
              : "bg-white text-[#6B7280] border-[#E5E2DC] hover:border-[#7CAE8E]"
          }`}
        >
          {weekdayLabels[day]}
        </button>
      ))}
    </div>
  );
}
