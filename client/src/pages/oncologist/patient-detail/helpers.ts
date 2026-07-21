import { formatDate, shiftDate } from "../../../utils/dateUtils";
import {
  toDateInputValue,
  todayIso,
  weekdayKeys,
  type RadiationDisplayStatus,
  type WeekdayKey,
} from "../../../utils/treatmentDisplay";
import type {
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
  TreatmentCycleRecord,
  TreatmentProtocolRecord,
} from "../../../types/api";
import type { CyclePayload, MedicationPayload } from "../../../services/treatmentService";
import type {
  MedicationCategory,
  MedicationFormRecord,
  ProtocolFormResult,
  TreatmentItemType,
} from "./types";
import { getMedicationPlan as getSharedMedicationPlan } from "../../../utils/medicationPlan";

export const inputCls =
  "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
export const labelCls =
  "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";
export const bloodTypes = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const getAllergyNames = (allergies?: PatientAllergy[]) =>
  (allergies ?? []).map((allergy) => allergy.name).filter(Boolean);

export const normalizeBloodType = (value?: string) => {
  const normalized = (value || "unknown").trim();
  return bloodTypes.includes(normalized) ? normalized : "unknown";
};

export const getPersonName = (value?: string | { fullName?: string } | null) => {
  if (typeof value === "object" && value?.fullName) return value.fullName;
  return "";
};

export const getOncologistName = (profile: ApiPatientProfile) => {
  if (typeof profile.oncologist === "object") {
    return profile.oncologist.fullName;
  }
  return "Assigned oncologist";
};

export const getPatientMeta = (profile: ApiPatientProfile) => {
  const updatedDate = profile.updatedAt || profile.createdAt;
  return updatedDate ? `Last updated ${formatDate(updatedDate)}` : undefined;
};

export const getProtocolMeta = (protocol: TreatmentProtocolRecord) => {
  const updatedBy =
    getPersonName(protocol.updatedBy) ||
    (typeof protocol.oncologist === "object" ? protocol.oncologist.fullName : "") ||
    "oncologist";
  const updatedAt = protocol.updatedAt || protocol.createdAt;

  return updatedAt
    ? `Last updated by ${updatedBy} - ${formatDate(updatedAt)}`
    : `Last updated by ${updatedBy}`;
};

export const getTreatmentCount = (
  protocol: TreatmentProtocolRecord | null,
  type: TreatmentItemType
) =>
  protocol?.treatmentTypes.find((entry) => entry.type === type)?.plannedCount ?? 0;

export const getTreatmentTypes = (protocol: TreatmentProtocolRecord | null) =>
  protocol?.treatmentTypes.map((entry) => entry.type) ?? [];

export const categoryColor: Record<MedicationCategory, string> = {
  chemotherapy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supportive: "bg-blue-50 text-blue-700 border-blue-200",
  chronic: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

export const categoryLabel: Record<MedicationCategory, string> = {
  chemotherapy: "Chemotherapy",
  supportive: "Supportive",
  chronic: "Chronic / Background",
  other: "Other",
};

export const typeLabel: Record<TreatmentItemType, string> = {
  chemotherapy: "Chemotherapy",
  radiation: "Radiation",
  surgery: "Surgery",
  supportive: "Supportive",
};

export const radiationStatusConfig: Record<RadiationDisplayStatus, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
  active: { label: "Active", cls: "bg-amber-500 text-white" },
  upcoming: { label: "Upcoming", cls: "bg-blue-100 text-blue-700" },
};

export const weekdayLabels: Record<WeekdayKey, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

export const normalizeWeekdays = (days?: string[]): WeekdayKey[] =>
  (days || []).filter((day): day is WeekdayKey =>
    (weekdayKeys as readonly string[]).includes(day)
  );

export const getProtocolDrugs = (protocol: TreatmentProtocolRecord | null) => {
  if (!protocol) return [];
  if (protocol.drugs?.length) return protocol.drugs;

  return protocol.medications
    .filter((medication) => medication.category === "chemotherapy")
    .map((medication) => medication.name)
    .filter(Boolean);
};

// Medication normalization and plan-building now live in the shared
// utils/medicationPlan.ts, used by both this (oncologist) view and the
// patient portal adapter, so the two views can never disagree on a
// medication's route or category again.
export const getMedicationPlan = (
  protocol: TreatmentProtocolRecord | null
): MedicationFormRecord[] => getSharedMedicationPlan(protocol);

export const medicationToPayload = (medication: MedicationFormRecord): MedicationPayload => ({
  id: medication.id,
  name: medication.name.trim(),
  dose: medication.dose.trim(),
  route: medication.route.trim(),
  timing: medication.timing.trim(),
  frequency: "",
  schedule: "",
  weekdays: medication.asNeeded ? [] : medication.weekdays,
  asNeeded: medication.asNeeded,
  category: medication.category,
  notes: medication.notes.trim(),
});

export const emptyMedicationForm = (): MedicationFormRecord => ({
  id: "",
  name: "",
  dose: "",
  route: "IV",
  timing: "",
  weekdays: [],
  asNeeded: false,
  category: "chemotherapy",
  notes: "",
});

export const prepareMedicationDraft = (
  medication: MedicationFormRecord
): MedicationFormRecord | null => {
  const name = medication.name.trim();

  if (!name) return null;

  return {
    ...medication,
    id: medication.id || `med-${Date.now()}`,
    name,
    dose: medication.dose.trim(),
    route: medication.route.trim(),
    timing: medication.timing.trim(),
    weekdays: medication.asNeeded ? [] : medication.weekdays,
    asNeeded: medication.asNeeded,
    notes: medication.notes.trim(),
  };
};

export const sortCycles = (cycles: TreatmentCycleRecord[]) =>
  [...cycles].sort((a, b) => {
    const dateA = toDateInputValue(a.startDate || a.plannedDate);
    const dateB = toDateInputValue(b.startDate || b.plannedDate);
    return dateA.localeCompare(dateB) || a.cycleNumber - b.cycleNumber;
  });

export const getRoadmapItemTitle = (cycle: TreatmentCycleRecord) => {
  if (cycle.treatmentType === "chemotherapy") {
    return cycle.title || `Cycle ${cycle.cycleNumber}`;
  }

  if (cycle.treatmentType === "radiation") {
    return cycle.title && !/^cycle\b/i.test(cycle.title)
      ? cycle.title
      : cycle.cycleNumber > 1
      ? `Radiation Course ${cycle.cycleNumber}`
      : "Radiation Course";
  }

  if (cycle.treatmentType === "surgery") {
    return cycle.title && !/^cycle\b/i.test(cycle.title) && cycle.title !== "Surgery Checkpoint"
      ? cycle.title
      : `Surgery Checkpoint ${cycle.cycleNumber}`;
  }

  return cycle.title;
};
export const toCyclePayload = (cycle: TreatmentCycleRecord): Partial<CyclePayload> => ({
  treatmentType: cycle.treatmentType,
  cycleNumber: cycle.cycleNumber,
  title: cycle.title,
  startDate: toDateInputValue(cycle.startDate),
  endDate: toDateInputValue(cycle.endDate),
  plannedDate: toDateInputValue(cycle.plannedDate) || undefined,
  totalSessions: cycle.totalSessions || 0,
  completedSessions: cycle.completedSessions || 0,
  weekdays: normalizeWeekdays(cycle.weekdays),
  medications: cycle.medications || [],
  notes: cycle.notes || "",
});

export const makeGeneratedCycle = (
  treatmentType: "chemotherapy" | "radiation" | "surgery",
  cycleNumber: number,
  title: string,
  startDate: string,
  endDate: string,
  extra: Partial<CyclePayload> = {}
): CyclePayload => ({
  treatmentType,
  cycleNumber,
  title,
  startDate,
  endDate,
  status: treatmentType === "radiation" ? "upcoming" : "upcoming",
  notes: "",
  ...extra,
});

export const buildInitialCycles = (result: ProtocolFormResult): CyclePayload[] => {
  const cycles: CyclePayload[] = [];
  const chemoCount =
    result.treatmentTypes.find((entry) => entry.type === "chemotherapy")?.plannedCount || 0;
  const radiationSessions =
    result.treatmentTypes.find((entry) => entry.type === "radiation")?.plannedCount || 0;
  const surgeryCount =
    result.treatmentTypes.find((entry) => entry.type === "surgery")?.plannedCount || 0;
  let referenceDate = todayIso();

  for (let index = 0; index < chemoCount; index += 1) {
    const startDate = index === 0 ? referenceDate : shiftDate(referenceDate, 21);
    const endDate = shiftDate(startDate, 20);
    cycles.push(
      makeGeneratedCycle("chemotherapy", index + 1, `Cycle ${index + 1}`, startDate, endDate)
    );
    referenceDate = endDate;
  }

  if (radiationSessions > 0) {
    const startDate = shiftDate(referenceDate, chemoCount > 0 ? 7 : 0);
    const endDate = shiftDate(startDate, Math.max(1, Math.ceil((radiationSessions * 7) / 5)));
    cycles.push(
      makeGeneratedCycle("radiation", 1, "Radiation Course", startDate, endDate, {
        totalSessions: radiationSessions,
        completedSessions: 0,
      })
    );
    referenceDate = endDate;
  }

  for (let index = 0; index < surgeryCount; index += 1) {
    const plannedDate = shiftDate(todayIso(), 30 + index * 14);
    cycles.push(
      makeGeneratedCycle(
        "surgery",
        index + 1,
        `Surgery Checkpoint ${index + 1}`,
        plannedDate,
        plannedDate,
        { plannedDate }
      )
    );
  }

  return cycles.length > 0
    ? cycles
    : [makeGeneratedCycle("chemotherapy", 1, "Cycle 1", todayIso(), shiftDate(todayIso(), 20))];
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

