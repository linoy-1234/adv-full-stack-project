import type {
  ApiLabResult,
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
  TreatmentCycleRecord,
  TreatmentProtocolRecord,
  TreatmentTypeRecord,
  User,
} from "../types/api";
import type {
  ChemoCycle,
  LabResult,
  Medication,
  PatientProfile,
  RadiationCourse,
  SurgeryCheckpoint,
  TreatmentItem,
  TreatmentProtocol,
} from "../types/patientPortalTypes";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getRadiationDisplayStatus,
  getSurgeryDisplayStatus,
  toDateInputValue,
} from "./treatmentDisplay";
import { getMedicationPlan as getSharedMedicationPlan } from "./medicationPlan";

type PersonLike = string | { _id?: string; fullName?: string; email?: string } | null | undefined;

const getPersonName = (value: PersonLike, fallback = "") => {
  if (typeof value === "object" && value?.fullName) return value.fullName;
  return fallback;
};

const getPersonId = (value: PersonLike, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value?._id) return value._id;
  return fallback;
};

const getAllergyNames = (allergies?: PatientAllergy[]) =>
  (allergies ?? []).map((allergy) => allergy.name).filter(Boolean);

export const getUserPatientProfileId = (user: User | null | undefined) => {
  const patientProfile = user?.patientProfile;

  if (!patientProfile) return "";
  if (typeof patientProfile === "string") return patientProfile;
  return patientProfile._id || "";
};

// Medication normalization and plan-building now live in the shared
// utils/medicationPlan.ts, used by both this (patient) view and the
// oncologist patient-detail view, so the two views can never disagree on a
// medication's route or category again. Category is preserved as-is
// (defaulting only to "other", never remapped to "supportive"), and an
// unset route stays "" rather than being fabricated as "oral"/"IV".
export const getMedicationPlan = (
  protocol?: TreatmentProtocolRecord | null
): Medication[] =>
  getSharedMedicationPlan(protocol).map((medication) => ({
    ...medication,
    route: medication.route as Medication["route"],
  }));

export const adaptPatientProfile = (
  patient: ApiPatientProfile,
  protocol?: TreatmentProtocolRecord | null
): PatientProfile => ({
  id: patient._id,
  fullName: patient.fullName,
  email: patient.email,
  nationalId: patient.nationalId,
  dateOfBirth: toDateInputValue(patient.dateOfBirth),
  diagnosis: patient.diagnosis,
  bloodType: patient.bloodType || "unknown",
  allergies: getAllergyNames(patient.allergies),
  assignedOncologistId: getPersonId(patient.oncologist),
  oncologistName: getPersonName(patient.oncologist, "Assigned oncologist"),
  medications: getMedicationPlan(protocol),
  notes: patient.notes,
  createdByOncologistId: getPersonId(patient.createdBy),
  lastUpdatedBy: getPersonName(patient.updatedBy, "your care team"),
  lastUpdatedAt: patient.updatedAt || patient.createdAt || "",
  accountStatus:
    patient.accountStatus === "linked" ? "linked" : "waiting_registration",
  currentTreatmentStatus: "",
});

const plannedCount = (
  treatmentTypes: TreatmentTypeRecord[],
  type: TreatmentTypeRecord["type"]
) => treatmentTypes.find((entry) => entry.type === type)?.plannedCount || 0;

const getRoadmapItemTitle = (cycle: TreatmentCycleRecord) => {
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
    return cycle.title &&
      !/^cycle\b/i.test(cycle.title) &&
      cycle.title !== "Surgery Checkpoint"
      ? cycle.title
      : `Surgery Checkpoint ${cycle.cycleNumber}`;
  }

  return cycle.title;
};

const adaptCycle = (cycle: TreatmentCycleRecord): TreatmentItem => {
  const { startDate, endDate } = getEffectiveCycleDates(cycle);

  if (cycle.treatmentType === "chemotherapy") {
    const status = getChemoDisplayStatus(cycle);

    return {
      id: cycle._id,
      type: "chemotherapy",
      title: getRoadmapItemTitle(cycle),
      cycleNumber: cycle.cycleNumber,
      startDate,
      endDate,
      status,
      approvedDate: toDateInputValue(cycle.decision?.decidedAt),
      approvedBy: getPersonName(cycle.decision?.decidedBy, "oncologist"),
      notes: cycle.notes,
    } as ChemoCycle;
  }

  if (cycle.treatmentType === "radiation") {
    return {
      id: cycle._id,
      type: "radiation",
      title: getRoadmapItemTitle(cycle),
      startDate,
      endDate,
      totalSessions: cycle.totalSessions || 0,
      completedSessions: cycle.completedSessions || 0,
      weekdays: cycle.weekdays || [],
      status: getRadiationDisplayStatus(cycle),
      notes: cycle.notes,
    } as RadiationCourse;
  }

  return {
    id: cycle._id,
    type: "surgery",
    title: getRoadmapItemTitle(cycle),
    plannedDate: toDateInputValue(cycle.plannedDate || cycle.startDate),
    status: getSurgeryDisplayStatus(cycle),
    notes: cycle.notes,
  } as SurgeryCheckpoint;
};

export const adaptTreatmentProtocol = (
  protocol: TreatmentProtocolRecord,
  cycles: TreatmentCycleRecord[],
  _labResults: ApiLabResult[]
): TreatmentProtocol => ({
  id: protocol._id,
  patientProfileId: getPersonId(protocol.patient),
  protocolName: protocol.protocolName,
  diagnosis: protocol.diagnosis,
  treatmentTypes: protocol.treatmentTypes.map((entry) => entry.type),
  items: cycles.map((cycle) => adaptCycle(cycle)),
  drugs: protocol.drugs || [],
  notes: protocol.notes,
  numberOfChemoCycles: plannedCount(protocol.treatmentTypes, "chemotherapy"),
  numberOfRadiationSessions: plannedCount(protocol.treatmentTypes, "radiation"),
  numberOfSurgeryCheckpoints: plannedCount(protocol.treatmentTypes, "surgery"),
  lastUpdatedBy: getPersonName(protocol.updatedBy, "oncologist"),
  lastUpdatedAt: protocol.updatedAt || protocol.createdAt || "",
});

export const adaptLabResult = (lab: ApiLabResult): LabResult => ({
  id: lab._id,
  patientProfileId: lab.patient,
  date: toDateInputValue(lab.testDate),
  wbc: lab.wbc,
  neutrophils: lab.neutrophils,
  hemoglobin: lab.hemoglobin,
  platelets: lab.platelets,
  alt: lab.alt,
  creatinine: lab.creatinine,
  notes: lab.notes,
  enteredBy: lab.enteredBy?.fullName || "Lab Staff",
  enteredAt: lab.createdAt,
});

