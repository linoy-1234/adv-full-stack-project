import { formatDate, shiftDate } from "../../../utils/dateUtils";
import {
  normalizeWeekdays,
  toDateInputValue,
  todayIso,
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

export type PatientFormField =
  | "fullName"
  | "email"
  | "nationalId"
  | "dateOfBirth"
  | "diagnosis"
  | "allergiesRaw"
  | "notes";

export const validatePatientForm = (form: {
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  diagnosis: string;
  allergiesRaw: string;
  notes: string;
}) => {
  const errors: Partial<Record<PatientFormField, string>> = {};
  const fullName = form.fullName.trim();
  const email = form.email.trim();
  const nationalId = form.nationalId.trim();
  const diagnosis = form.diagnosis.trim();
  const allergyNames = form.allergiesRaw
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (!fullName) errors.fullName = "Full name is required.";
  else if (fullName.length < 2)
    errors.fullName = "Full name must be at least 2 characters.";
  else if (fullName.length > 80)
    errors.fullName = "Full name cannot exceed 80 characters.";

  if (!email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";

  if (!nationalId) errors.nationalId = "National ID is required.";
  else if (nationalId.length < 5)
    errors.nationalId = "National ID must be at least 5 characters.";
  else if (nationalId.length > 20)
    errors.nationalId = "National ID cannot exceed 20 characters.";

  if (!form.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";

  if (!diagnosis) errors.diagnosis = "Diagnosis is required.";
  else if (diagnosis.length < 2)
    errors.diagnosis = "Diagnosis must be at least 2 characters.";
  else if (diagnosis.length > 200)
    errors.diagnosis = "Diagnosis cannot exceed 200 characters.";

  if (allergyNames.some((name) => name.length < 2 || name.length > 80)) {
    errors.allergiesRaw =
      "Each allergy must be between 2 and 80 characters.";
  }
  if (form.notes.trim().length > 1000)
    errors.notes = "Notes cannot exceed 1,000 characters.";

  return errors;
};

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

  return cycles;
};
