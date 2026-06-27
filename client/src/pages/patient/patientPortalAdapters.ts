import type {
  ApiLabResult,
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
  TreatmentCycleRecord,
  TreatmentMedicationRecord,
  TreatmentProtocolRecord,
  TreatmentTypeRecord,
  User,
} from "../../types/api";
import type {
  ChemoCycle,
  LabResult,
  Medication,
  PatientProfile,
  RadiationCourse,
  SurgeryCheckpoint,
  TreatmentItem,
  TreatmentProtocol,
} from "../../utils/mockData";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getSurgeryDisplayStatus,
  toDateInputValue,
  todayIso,
} from "../../utils/treatmentDisplay";

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

const normalizeMedication = (
  medication: TreatmentMedicationRecord
): Medication => ({
  id: medication.id || medication._id || `med-${medication.name}`,
  name: medication.name || "",
  dose: medication.dose || "",
  route: (medication.route || "oral") as Medication["route"],
  frequency: medication.frequency || medication.schedule || "",
  timing: medication.timing || "",
  category:
    medication.category === "other"
      ? "supportive"
      : medication.category || "supportive",
  notes: medication.notes || "",
});

export const getMedicationPlan = (
  protocol?: TreatmentProtocolRecord | null
): Medication[] => {
  if (!protocol) return [];

  const medications = (protocol.medications || []).map(normalizeMedication);
  const existingNames = new Set(
    medications.map((medication) => medication.name.trim().toLowerCase())
  );

  (protocol.drugs || []).forEach((drug) => {
    const key = drug.trim().toLowerCase();
    if (!key || existingNames.has(key)) return;

    medications.push({
      id: `drug-${key}`,
      name: drug,
      dose: "",
      route: "IV",
      frequency: "",
      timing: "",
      category: "chemotherapy",
      notes: "Listed in treatment protocol",
    });
  });

  return medications;
};

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

const adaptCycle = (
  cycle: TreatmentCycleRecord,
  labResults: ApiLabResult[]
): TreatmentItem => {
  const { startDate, endDate } = getEffectiveCycleDates(cycle);
  const delayedTo = toDateInputValue(cycle.decision?.delayedToStartDate);
  const delayedEndDate = toDateInputValue(cycle.decision?.delayedToEndDate);

  if (cycle.treatmentType === "chemotherapy") {
    const status = getChemoDisplayStatus(cycle, labResults);
    const linkedLab = labResults.find((lab) => lab.cycle?._id === cycle._id);

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
      delayedTo,
      delayedEndDate,
      delayReason: cycle.decision?.delayReason,
      notes: cycle.notes,
      labResultId: linkedLab?._id,
    } as ChemoCycle;
  }

  if (cycle.treatmentType === "radiation") {
    const today = todayIso();
    const isCompleted = cycle.status === "completed" || (!!endDate && endDate < today);
    const isActive = !isCompleted && !!startDate && !!endDate && startDate <= today && endDate >= today;

    return {
      id: cycle._id,
      type: "radiation",
      title: getRoadmapItemTitle(cycle),
      startDate,
      endDate,
      totalSessions: cycle.totalSessions || 0,
      completedSessions: cycle.completedSessions || 0,
      status: isCompleted ? "completed" : isActive ? "in_progress" : "upcoming",
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
  labResults: ApiLabResult[]
): TreatmentProtocol => ({
  id: protocol._id,
  patientProfileId: getPersonId(protocol.patient),
  protocolName: protocol.protocolName,
  diagnosis: protocol.diagnosis,
  treatmentTypes: protocol.treatmentTypes.map((entry) => entry.type),
  items: cycles.map((cycle) => adaptCycle(cycle, labResults)),
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
  linkedCycleId: lab.cycle?._id,
  linkedCycleLabel: lab.cycle
    ? lab.cycle.title || `${lab.cycle.treatmentType} cycle ${lab.cycle.cycleNumber}`
    : undefined,
});
