import type { ApiLabResult, TreatmentCycleRecord } from "../types/api";

export type ChemoDisplayStatus =
  | "upcoming"
  | "approved"
  | "delayed"
  | "completed"
  | "waiting_labs"
  | "ready_for_review"
  | "active";

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const toDateInputValue = (date?: string | null) =>
  date ? date.slice(0, 10) : "";

export const isSameDateKey = (left?: string | null, right?: string | null) =>
  !!left && !!right && toDateInputValue(left) === toDateInputValue(right);

export const getEffectiveCycleDates = (cycle: TreatmentCycleRecord) => {
  const delayedStart = toDateInputValue(cycle.decision?.delayedToStartDate);
  const delayedEnd = toDateInputValue(cycle.decision?.delayedToEndDate);
  const useDelayedDates =
    !!delayedStart &&
    (cycle.status === "delayed" ||
      cycle.status === "pending_review" ||
      cycle.status === "waiting_for_labs" ||
      cycle.status === "approved" ||
      cycle.decision?.decisionStatus === "delayed");
  const startDate = useDelayedDates
    ? delayedStart
    : toDateInputValue(cycle.startDate || cycle.plannedDate);
  const endDate = useDelayedDates
    ? delayedEnd || delayedStart
    : toDateInputValue(cycle.endDate || cycle.plannedDate || cycle.startDate);

  return { startDate, endDate };
};

export const hasValidLinkedLabForCurrentAttempt = (
  cycle: TreatmentCycleRecord,
  labResults: ApiLabResult[]
) => {
  const { startDate } = getEffectiveCycleDates(cycle);

  return labResults.some(
    (lab) =>
      lab.cycle?._id === cycle._id &&
      lab.isActive !== false &&
      isSameDateKey(lab.testDate, startDate)
  );
};

export const getChemoDisplayStatus = (
  cycle: TreatmentCycleRecord,
  labResults: ApiLabResult[]
): ChemoDisplayStatus => {
  const status = cycle.status;
  const today = todayIso();
  const { startDate, endDate } = getEffectiveCycleDates(cycle);
  const hasValidLab = hasValidLinkedLabForCurrentAttempt(cycle, labResults);
  const hasArrived = !!startDate && startDate <= today;

  if (status === "completed") return "completed";
  if (status === "pending_review") {
    if (hasValidLab) return "ready_for_review";
    return hasArrived ? "waiting_labs" : "upcoming";
  }
  if (status === "waiting_for_labs") return hasArrived ? "waiting_labs" : "upcoming";
  if (status === "delayed") return hasArrived ? "waiting_labs" : "delayed";
  if (status === "active") {
    if (endDate && endDate < today) return "completed";
    if (startDate && endDate && startDate <= today && endDate >= today) return "active";
    return "approved";
  }
  if (status === "approved") {
    if (endDate && endDate < today) return "completed";
    if (startDate && endDate && startDate <= today && endDate >= today) {
      return "active";
    }
    return "approved";
  }

  return hasArrived ? "waiting_labs" : "upcoming";
};
