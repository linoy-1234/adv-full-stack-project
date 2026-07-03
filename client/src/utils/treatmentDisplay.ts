import type { TreatmentCycleRecord } from "../types/api";

export type ChemoDisplayStatus =
  | "upcoming"
  | "completed"
  | "waiting_for_review"
  | "active";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const toDateInputValue = (date?: string | null) =>
  date ? date.slice(0, 10) : "";

export const isSameDateKey = (left?: string | null, right?: string | null) =>
  !!left && !!right && toDateInputValue(left) === toDateInputValue(right);

export const getEffectiveCycleDates = (cycle: TreatmentCycleRecord) => {
  const startDate = toDateInputValue(cycle.startDate || cycle.plannedDate);
  const endDate = toDateInputValue(cycle.endDate || cycle.plannedDate || cycle.startDate);

  return { startDate, endDate };
};

export type SurgeryDisplayStatus = "upcoming" | "today" | "completed";

export const getSurgeryDisplayStatus = (
  cycle: TreatmentCycleRecord
): SurgeryDisplayStatus => {
  const today = todayIso();
  const plannedStr = toDateInputValue(cycle.plannedDate || cycle.startDate);
  if (cycle.status === "completed" || (plannedStr && plannedStr < today))
    return "completed";
  if (plannedStr && plannedStr === today) return "today";
  return "upcoming";
};

const isApproved = (cycle: TreatmentCycleRecord) =>
  cycle.decision?.decisionStatus === "approved" ||
  ["approved", "active", "completed"].includes(cycle.status);

export const getChemoDisplayStatus = (
  cycle: TreatmentCycleRecord
): ChemoDisplayStatus => {
  const today = todayIso();
  const { startDate, endDate } = getEffectiveCycleDates(cycle);
  const approved = isApproved(cycle);

  if (!approved) {
    return startDate && today < startDate ? "upcoming" : "waiting_for_review";
  }

  if (startDate && today < startDate) {
    return "upcoming";
  }

  if (endDate && today > endDate) {
    return "completed";
  }

  return "active";
};
