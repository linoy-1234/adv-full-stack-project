// ─── Date helpers ────────────────────────────────────────────────────────────

export const TODAY = "2026-06-05";

export function formatDate(iso: string): string {
  if (!iso) return "No date scheduled";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "No date scheduled";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Role types ───────────────────────────────────────────────────────────────

export type UserRole = "patient" | "oncologist" | "lab_staff";

// ─── Oncologist ───────────────────────────────────────────────────────────────

export interface Oncologist {
  id: string;
  fullName: string;
  email: string;
  department: string;
  password: string;
}

// ─── Lab Staff ────────────────────────────────────────────────────────────────

export interface LabStaff {
  id: string;
  fullName: string;
  email: string;
  department: string;
  password: string;
}

// ─── Medication (created/edited by Oncologist only) ───────────────────────────

export type MedicationCategory = "chemotherapy" | "supportive" | "chronic";
export type MedicationRoute = "IV" | "oral" | "subcutaneous" | "topical";

export interface Medication {
  id: string;
  name: string;
  dose: string;
  route: MedicationRoute;
  frequency: string;
  timing: string;
  category: MedicationCategory;
  notes?: string;
}

// ─── Treatment items (owned by Oncologist) ────────────────────────────────────

export type TreatmentItemType =
  | "chemotherapy"
  | "radiation"
  | "surgery"
  | "supportive";

export type CycleStatus =
  | "upcoming"
  | "approved"
  | "delayed"
  | "completed"
  | "waiting_labs";

export interface ChemoCycle {
  id: string;
  type: "chemotherapy";
  title: string;
  cycleNumber: number;
  startDate: string;
  endDate: string;
  status: CycleStatus;
  approvedDate?: string;
  approvedBy?: string;
  delayedTo?: string;
  delayedEndDate?: string;
  delayReason?: string;
  notes?: string;
  labResultId?: string;
}

export interface RadiationCourse {
  id: string;
  type: "radiation";
  title: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  status: "upcoming" | "in_progress" | "completed";
  notes?: string;
}

export interface SurgeryCheckpoint {
  id: string;
  type: "surgery";
  title: string;
  plannedDate: string;
  status: "upcoming" | "completed" | "postponed" | "today";
  notes?: string;
}

export type TreatmentItem = ChemoCycle | RadiationCourse | SurgeryCheckpoint;

// ─── Treatment Protocol (owned by Oncologist) ─────────────────────────────────

export interface TreatmentProtocol {
  id: string;
  patientProfileId: string;
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentItemType[];
  items: TreatmentItem[];
  drugs: string[];
  notes?: string;
  numberOfChemoCycles?: number;
  numberOfRadiationSessions?: number;
  numberOfSurgeryCheckpoints?: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

// ─── Lab Result (entered by Lab Staff only) ───────────────────────────────────

export interface LabResult {
  id: string;
  patientProfileId: string;
  date: string;
  wbc: number;
  neutrophils: number;
  hemoglobin: number;
  platelets: number;
  alt: number;
  creatinine: number;
  notes?: string;
  enteredBy: string;
  enteredAt: string;
  linkedCycleId?: string;
  linkedCycleLabel?: string;
}

export const LAB_NORMS = {
  wbc:         { min: 4.0,  max: 11.0 },
  neutrophils: { min: 1.5,  max: 8.0  },
  hemoglobin:  { min: 12.0, max: 17.5 },
  platelets:   { min: 150,  max: 400  },
  alt:         { min: 7,    max: 56   },
  creatinine:  { min: 0.6,  max: 1.2  },
};

export type LabFieldKey = keyof typeof LAB_NORMS;

export function getLabStatus(field: LabFieldKey, value: number): "normal" | "low" | "high" {
  const norm = LAB_NORMS[field];
  if (value < norm.min) return "low";
  if (value > norm.max) return "high";
  return "normal";
}

// ─── Patient Medical Profile (created/edited by Oncologist) ───────────────────

export type AccountStatus = "waiting_registration" | "linked";

export type PendingAction =
  | "waiting_labs"
  | "labs_received"
  | "cycle_ready_review"
  | "unread_message"
  | "treatment_delayed"
  | "none";

export interface PatientProfile {
  id: string;
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  diagnosis: string;
  bloodType: string;
  allergies: string[];
  assignedOncologistId: string;
  oncologistName?: string;
  medications: Medication[];
  notes?: string;
  createdByOncologistId: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  accountStatus: AccountStatus;
  currentTreatmentStatus: string;
}

// ─── Symptom Journal (patient-entered) ────────────────────────────────────────

export interface SymptomEntry {
  id: string;
  patientProfileId: string;
  date: string;
  time: string;
  temperature?: number;
  nausea: number;
  fatigue: number;
  pain: number;
  vomiting: number;
  appetiteLoss: number;
  mouthSores: number;
  notes?: string;
}

// ─── Messages & Documents (patient <-> oncologist) ────────────────────────────

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx" | "jpg" | "png";
  uploadDate: string;
  url?: string;
}

export interface Message {
  id: string;
  patientProfileId: string;
  sender: string;
  senderRole: "patient" | "oncologist";
  text: string;
  attachments?: MessageAttachment[];
  createdAt: string;
  read: boolean;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export const seedOncologist: Oncologist = {
  id: "onco-1",
  fullName: "Dr. Miriam Goldstein",
  email: "dr.goldstein@oncolog.com",
  department: "Oncology — Hematology",
  password: "onco123",
};

export const seedLabStaff: LabStaff = {
  id: "lab-1",
  fullName: "Noa Ben-David",
  email: "noa.lab@oncolog.com",
  department: "Clinical Laboratory",
  password: "lab123",
};

export const seedPatientProfiles: PatientProfile[] = [
  {
    id: "pp-1",
    fullName: "Sarah Cohen",
    email: "sarah.cohen@email.com",
    nationalId: "123456789",
    dateOfBirth: "1978-03-14",
    diagnosis: "Breast Cancer — Stage IIIA (ER+/PR+/HER2−)",
    bloodType: "A+",
    allergies: ["Penicillin", "Sulfa drugs"],
    assignedOncologistId: "onco-1",
    medications: [
      { id: "med-1", name: "Doxorubicin", dose: "60 mg/m²", route: "IV", frequency: "Every 21 days", timing: "Day 1 of cycle", category: "chemotherapy" },
      { id: "med-2", name: "Cyclophosphamide", dose: "600 mg/m²", route: "IV", frequency: "Every 21 days", timing: "Day 1 of cycle", category: "chemotherapy" },
      { id: "med-3", name: "Ondansetron", dose: "8 mg", route: "oral", frequency: "TID on chemo days", timing: "30 min before infusion", category: "supportive" },
      { id: "med-4", name: "Metformin", dose: "500 mg", route: "oral", frequency: "BID", timing: "With meals", category: "chronic", notes: "Pre-existing diabetes" },
    ],
    notes: "Patient is highly compliant. Monitor for anthracycline cardiotoxicity.",
    createdByOncologistId: "onco-1",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-20T10:30:00Z",
    accountStatus: "linked",
    currentTreatmentStatus: "Active — Cycle 3",
  },
  {
    id: "pp-2",
    fullName: "David Levi",
    email: "david.levi@email.com",
    nationalId: "987654321",
    dateOfBirth: "1965-07-22",
    diagnosis: "Non-Hodgkin Lymphoma — Diffuse Large B-Cell",
    bloodType: "O+",
    allergies: [],
    assignedOncologistId: "onco-1",
    medications: [
      { id: "med-5", name: "Rituximab", dose: "375 mg/m²", route: "IV", frequency: "Every 21 days", timing: "Day 1 of cycle", category: "chemotherapy" },
      { id: "med-6", name: "Prednisone", dose: "100 mg", route: "oral", frequency: "Daily x5 days", timing: "Days 1–5 of cycle", category: "chemotherapy" },
      { id: "med-7", name: "Pantoprazole", dose: "40 mg", route: "oral", frequency: "Daily", timing: "Morning", category: "supportive", notes: "GI protection during steroid use" },
    ],
    createdByOncologistId: "onco-1",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-25T09:00:00Z",
    accountStatus: "waiting_registration",
    currentTreatmentStatus: "Cycle 2 — Delayed",
  },
  {
    id: "pp-3",
    fullName: "Rachel Mizrahi",
    email: "rachel.m@email.com",
    nationalId: "456789123",
    dateOfBirth: "1982-11-08",
    diagnosis: "Ovarian Cancer — Stage II (Serous)",
    bloodType: "B−",
    allergies: ["Aspirin"],
    assignedOncologistId: "onco-1",
    medications: [
      { id: "med-8", name: "Carboplatin", dose: "AUC 5", route: "IV", frequency: "Every 21 days", timing: "Day 1 of cycle", category: "chemotherapy" },
      { id: "med-9", name: "Paclitaxel", dose: "175 mg/m²", route: "IV", frequency: "Every 21 days", timing: "Day 1, before carboplatin", category: "chemotherapy" },
      { id: "med-10", name: "Dexamethasone", dose: "20 mg", route: "IV", frequency: "Pre-chemo", timing: "30 min before paclitaxel", category: "supportive" },
    ],
    createdByOncologistId: "onco-1",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-06-01T14:15:00Z",
    accountStatus: "linked",
    currentTreatmentStatus: "Radiation — Week 3",
  },
  {
    id: "pp-4",
    fullName: "Yael Shapiro",
    email: "yael.shapiro@email.com",
    nationalId: "321654987",
    dateOfBirth: "1990-01-30",
    diagnosis: "Hodgkin Lymphoma — Stage IIA",
    bloodType: "AB+",
    allergies: [],
    assignedOncologistId: "onco-1",
    medications: [
      { id: "med-11", name: "Doxorubicin", dose: "25 mg/m²", route: "IV", frequency: "Days 1 & 15 of cycle", timing: "Day 1 and Day 15", category: "chemotherapy" },
      { id: "med-12", name: "Bleomycin", dose: "10 units/m²", route: "IV", frequency: "Days 1 & 15", timing: "After doxorubicin", category: "chemotherapy" },
      { id: "med-13", name: "Granisetron", dose: "1 mg", route: "oral", frequency: "BID on chemo days", timing: "Morning and evening", category: "supportive" },
    ],
    createdByOncologistId: "onco-1",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-06-03T11:45:00Z",
    accountStatus: "waiting_registration",
    currentTreatmentStatus: "Pre-treatment — Surgery Pending",
  },
  {
    id: "pp-5",
    fullName: "Tamar Katz",
    email: "tamar.katz@email.com",
    nationalId: "654321789",
    dateOfBirth: "1955-09-17",
    diagnosis: "Colorectal Cancer — Stage IIIB",
    bloodType: "A−",
    allergies: ["Iodine contrast", "Latex"],
    assignedOncologistId: "onco-1",
    medications: [
      { id: "med-14", name: "Oxaliplatin (FOLFOX)", dose: "85 mg/m²", route: "IV", frequency: "Every 14 days", timing: "Day 1", category: "chemotherapy" },
      { id: "med-15", name: "5-Fluorouracil", dose: "400 mg/m² bolus + 2400 mg/m² infusion", route: "IV", frequency: "Every 14 days", timing: "Days 1–2", category: "chemotherapy" },
      { id: "med-16", name: "Lorazepam", dose: "0.5 mg", route: "oral", frequency: "PRN", timing: "As needed for anxiety", category: "supportive" },
      { id: "med-17", name: "Lisinopril", dose: "10 mg", route: "oral", frequency: "Daily", timing: "Morning", category: "chronic", notes: "Hypertension management" },
    ],
    createdByOncologistId: "onco-1",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-30T16:00:00Z",
    accountStatus: "linked",
    currentTreatmentStatus: "Cycle 5 — Waiting for Labs",
  },
];

export const seedTreatmentProtocols: TreatmentProtocol[] = [
  {
    id: "tp-1",
    patientProfileId: "pp-1",
    protocolName: "AC Chemotherapy (Adriamycin + Cyclophosphamide)",
    diagnosis: "Breast Cancer — Stage IIIA",
    treatmentTypes: ["chemotherapy"],
    drugs: ["Doxorubicin (Adriamycin)", "Cyclophosphamide"],
    numberOfChemoCycles: 6,
    items: [
      { id: "cycle-1-1", type: "chemotherapy", title: "Cycle 1", cycleNumber: 1, startDate: "2026-04-01", endDate: "2026-04-21", status: "completed", approvedDate: "2026-04-01", approvedBy: "Dr. Miriam Goldstein" } as ChemoCycle,
      { id: "cycle-1-2", type: "chemotherapy", title: "Cycle 2", cycleNumber: 2, startDate: "2026-04-22", endDate: "2026-05-12", status: "completed", approvedDate: "2026-04-22", approvedBy: "Dr. Miriam Goldstein" } as ChemoCycle,
      { id: "cycle-1-3", type: "chemotherapy", title: "Cycle 3", cycleNumber: 3, startDate: "2026-05-13", endDate: "2026-06-02", status: "approved", approvedDate: "2026-05-13", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-1" } as ChemoCycle,
      { id: "cycle-1-4", type: "chemotherapy", title: "Cycle 4", cycleNumber: 4, startDate: "2026-06-03", endDate: "2026-06-23", status: "waiting_labs" } as ChemoCycle,
      { id: "cycle-1-5", type: "chemotherapy", title: "Cycle 5", cycleNumber: 5, startDate: "2026-06-24", endDate: "2026-07-14", status: "upcoming" } as ChemoCycle,
      { id: "cycle-1-6", type: "chemotherapy", title: "Cycle 6", cycleNumber: 6, startDate: "2026-07-15", endDate: "2026-08-04", status: "upcoming" } as ChemoCycle,
    ],
    notes: "Standard AC regimen. Monitor LVEF every 2 cycles.",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-20T10:30:00Z",
  },
  {
    id: "tp-2",
    patientProfileId: "pp-2",
    protocolName: "R-CHOP",
    diagnosis: "Non-Hodgkin Lymphoma — DLBCL",
    treatmentTypes: ["chemotherapy"],
    drugs: ["Rituximab", "Cyclophosphamide", "Doxorubicin", "Vincristine", "Prednisone"],
    numberOfChemoCycles: 6,
    items: [
      { id: "cycle-2-1", type: "chemotherapy", title: "Cycle 1", cycleNumber: 1, startDate: "2026-04-10", endDate: "2026-04-30", status: "completed", approvedDate: "2026-04-10", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-2" } as ChemoCycle,
      { id: "cycle-2-2", type: "chemotherapy", title: "Cycle 2", cycleNumber: 2, startDate: "2026-05-01", endDate: "2026-05-21", status: "delayed", delayedTo: "2026-06-10", delayedEndDate: "2026-06-30", delayReason: "WBC count below threshold. Patient to rest and return for recheck." } as ChemoCycle,
      { id: "cycle-2-3", type: "chemotherapy", title: "Cycle 3", cycleNumber: 3, startDate: "2026-06-10", endDate: "2026-06-30", status: "upcoming" } as ChemoCycle,
      { id: "cycle-2-4", type: "chemotherapy", title: "Cycle 4", cycleNumber: 4, startDate: "2026-07-01", endDate: "2026-07-21", status: "upcoming" } as ChemoCycle,
      { id: "cycle-2-5", type: "chemotherapy", title: "Cycle 5", cycleNumber: 5, startDate: "2026-07-22", endDate: "2026-08-11", status: "upcoming" } as ChemoCycle,
      { id: "cycle-2-6", type: "chemotherapy", title: "Cycle 6", cycleNumber: 6, startDate: "2026-08-12", endDate: "2026-09-01", status: "upcoming" } as ChemoCycle,
    ],
    notes: "Monitor for infusion reactions with first Rituximab dose.",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-25T09:00:00Z",
  },
  {
    id: "tp-3",
    patientProfileId: "pp-3",
    protocolName: "Carboplatin + Paclitaxel + Radiation",
    diagnosis: "Ovarian Cancer — Stage II",
    treatmentTypes: ["chemotherapy", "radiation"],
    drugs: ["Carboplatin", "Paclitaxel"],
    numberOfChemoCycles: 2,
    numberOfRadiationSessions: 25,
    items: [
      { id: "cycle-3-1", type: "chemotherapy", title: "Cycle 1", cycleNumber: 1, startDate: "2026-03-15", endDate: "2026-04-04", status: "completed", approvedDate: "2026-03-15", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-3" } as ChemoCycle,
      { id: "cycle-3-2", type: "chemotherapy", title: "Cycle 2", cycleNumber: 2, startDate: "2026-04-05", endDate: "2026-04-25", status: "completed", approvedDate: "2026-04-05", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-4" } as ChemoCycle,
      { id: "rad-3-1", type: "radiation", title: "Pelvic Radiation Course", startDate: "2026-05-10", endDate: "2026-06-21", totalSessions: 25, completedSessions: 18, status: "in_progress", notes: "Monday–Friday sessions. Weekly review with radiation oncologist." } as RadiationCourse,
    ],
    notes: "Concurrent chemoradiation completed. Now radiation maintenance only.",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-06-01T14:15:00Z",
  },
  {
    id: "tp-4",
    patientProfileId: "pp-4",
    protocolName: "ABVD + Surgery (Staging)",
    diagnosis: "Hodgkin Lymphoma — Stage IIA",
    treatmentTypes: ["chemotherapy", "surgery"],
    drugs: ["Doxorubicin", "Bleomycin", "Vinblastine", "Dacarbazine"],
    numberOfChemoCycles: 4,
    numberOfSurgeryCheckpoints: 1,
    items: [
      { id: "surg-4-1", type: "surgery", title: "Diagnostic Lymph Node Biopsy", plannedDate: "2026-06-20", status: "upcoming", notes: "Pre-treatment staging procedure." } as SurgeryCheckpoint,
      { id: "cycle-4-1", type: "chemotherapy", title: "Cycle 1", cycleNumber: 1, startDate: "2026-07-05", endDate: "2026-08-01", status: "upcoming" } as ChemoCycle,
      { id: "cycle-4-2", type: "chemotherapy", title: "Cycle 2", cycleNumber: 2, startDate: "2026-08-02", endDate: "2026-08-29", status: "upcoming" } as ChemoCycle,
      { id: "cycle-4-3", type: "chemotherapy", title: "Cycle 3", cycleNumber: 3, startDate: "2026-08-30", endDate: "2026-09-26", status: "upcoming" } as ChemoCycle,
      { id: "cycle-4-4", type: "chemotherapy", title: "Cycle 4", cycleNumber: 4, startDate: "2026-09-27", endDate: "2026-10-24", status: "upcoming" } as ChemoCycle,
    ],
    notes: "ABVD is standard for early-stage Hodgkin. PET-CT after 2 cycles.",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-06-03T11:45:00Z",
  },
  {
    id: "tp-5",
    patientProfileId: "pp-5",
    protocolName: "FOLFOX6",
    diagnosis: "Colorectal Cancer — Stage IIIB",
    treatmentTypes: ["chemotherapy"],
    drugs: ["Oxaliplatin", "Leucovorin", "5-Fluorouracil"],
    numberOfChemoCycles: 6,
    items: [
      { id: "cycle-5-1", type: "chemotherapy", title: "Cycle 1", cycleNumber: 1, startDate: "2026-02-20", endDate: "2026-03-05", status: "completed", approvedDate: "2026-02-20", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-5" } as ChemoCycle,
      { id: "cycle-5-2", type: "chemotherapy", title: "Cycle 2", cycleNumber: 2, startDate: "2026-03-06", endDate: "2026-03-19", status: "completed", approvedDate: "2026-03-06", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-6" } as ChemoCycle,
      { id: "cycle-5-3", type: "chemotherapy", title: "Cycle 3", cycleNumber: 3, startDate: "2026-03-20", endDate: "2026-04-02", status: "completed", approvedDate: "2026-03-20", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-7" } as ChemoCycle,
      { id: "cycle-5-4", type: "chemotherapy", title: "Cycle 4", cycleNumber: 4, startDate: "2026-04-03", endDate: "2026-04-16", status: "completed", approvedDate: "2026-04-03", approvedBy: "Dr. Miriam Goldstein", labResultId: "lab-r-8" } as ChemoCycle,
      { id: "cycle-5-5", type: "chemotherapy", title: "Cycle 5", cycleNumber: 5, startDate: "2026-06-05", endDate: "2026-06-18", status: "waiting_labs" } as ChemoCycle,
      { id: "cycle-5-6", type: "chemotherapy", title: "Cycle 6", cycleNumber: 6, startDate: "2026-06-19", endDate: "2026-07-02", status: "upcoming" } as ChemoCycle,
    ],
    notes: "Manage peripheral neuropathy closely — dose reduce if grade 2+.",
    lastUpdatedBy: "Dr. Miriam Goldstein",
    lastUpdatedAt: "2026-05-30T16:00:00Z",
  },
];

export const seedLabResults: LabResult[] = [
  { id: "lab-r-1", patientProfileId: "pp-1", date: "2026-05-12", wbc: 5.2, neutrophils: 2.8, hemoglobin: 11.4, platelets: 189, alt: 28, creatinine: 0.85, notes: "Pre-cycle 3 labs. Values acceptable for treatment.", enteredBy: "Noa Ben-David", enteredAt: "2026-05-12T09:30:00Z", linkedCycleId: "cycle-1-3" },
  { id: "lab-r-1b", patientProfileId: "pp-1", date: "2026-04-20", wbc: 6.1, neutrophils: 3.4, hemoglobin: 12.2, platelets: 215, alt: 22, creatinine: 0.80, enteredBy: "Noa Ben-David", enteredAt: "2026-04-20T10:00:00Z", linkedCycleId: "cycle-1-2" },
  { id: "lab-r-2", patientProfileId: "pp-2", date: "2026-04-08", wbc: 7.3, neutrophils: 4.1, hemoglobin: 13.8, platelets: 240, alt: 31, creatinine: 1.0, notes: "Pre-cycle 1. Good baseline.", enteredBy: "Noa Ben-David", enteredAt: "2026-04-08T08:45:00Z", linkedCycleId: "cycle-2-1" },
  { id: "lab-r-3", patientProfileId: "pp-3", date: "2026-03-13", wbc: 5.8, neutrophils: 3.2, hemoglobin: 12.9, platelets: 210, alt: 19, creatinine: 0.78, enteredBy: "Noa Ben-David", enteredAt: "2026-03-13T11:00:00Z", linkedCycleId: "cycle-3-1" },
  { id: "lab-r-4", patientProfileId: "pp-3", date: "2026-04-03", wbc: 4.1, neutrophils: 2.0, hemoglobin: 11.5, platelets: 162, alt: 24, creatinine: 0.82, notes: "Mild drop in counts. Continue monitoring.", enteredBy: "Noa Ben-David", enteredAt: "2026-04-03T09:15:00Z", linkedCycleId: "cycle-3-2" },
  { id: "lab-r-5", patientProfileId: "pp-5", date: "2026-02-18", wbc: 8.1, neutrophils: 5.0, hemoglobin: 14.0, platelets: 310, alt: 35, creatinine: 0.9, enteredBy: "Noa Ben-David", enteredAt: "2026-02-18T10:30:00Z", linkedCycleId: "cycle-5-1" },
  { id: "lab-r-6", patientProfileId: "pp-5", date: "2026-03-04", wbc: 6.4, neutrophils: 3.6, hemoglobin: 13.2, platelets: 275, alt: 38, creatinine: 0.92, enteredBy: "Noa Ben-David", enteredAt: "2026-03-04T09:00:00Z", linkedCycleId: "cycle-5-2" },
  { id: "lab-r-7", patientProfileId: "pp-5", date: "2026-03-18", wbc: 5.9, neutrophils: 3.1, hemoglobin: 12.8, platelets: 248, alt: 41, creatinine: 0.95, enteredBy: "Noa Ben-David", enteredAt: "2026-03-18T09:30:00Z", linkedCycleId: "cycle-5-3" },
  { id: "lab-r-8", patientProfileId: "pp-5", date: "2026-04-01", wbc: 5.1, neutrophils: 2.6, hemoglobin: 12.0, platelets: 220, alt: 44, creatinine: 0.98, notes: "ALT trending up — monitor liver function.", enteredBy: "Noa Ben-David", enteredAt: "2026-04-01T10:15:00Z", linkedCycleId: "cycle-5-4" },
];

export const seedSymptomEntries: SymptomEntry[] = [
  { id: "sym-1", patientProfileId: "pp-1", date: "2026-06-04", time: "08:30", temperature: 37.2, nausea: 4, fatigue: 6, pain: 3, vomiting: 1, appetiteLoss: 5, mouthSores: 2, notes: "Nausea manageable with Ondansetron. Feeling tired but functional." },
  { id: "sym-2", patientProfileId: "pp-1", date: "2026-06-03", time: "09:00", temperature: 37.0, nausea: 3, fatigue: 5, pain: 2, vomiting: 0, appetiteLoss: 4, mouthSores: 1 },
  { id: "sym-3", patientProfileId: "pp-1", date: "2026-06-02", time: "07:45", temperature: 37.8, nausea: 6, fatigue: 7, pain: 4, vomiting: 2, appetiteLoss: 6, mouthSores: 3, notes: "Rough day. Temperature slightly elevated." },
  { id: "sym-4", patientProfileId: "pp-3", date: "2026-06-04", time: "10:00", temperature: 36.8, nausea: 2, fatigue: 4, pain: 3, vomiting: 0, appetiteLoss: 3, mouthSores: 0, notes: "Radiation site irritation. Manageable." },
  { id: "sym-5", patientProfileId: "pp-5", date: "2026-06-05", time: "06:30", temperature: 36.9, nausea: 5, fatigue: 6, pain: 4, vomiting: 1, appetiteLoss: 5, mouthSores: 0, notes: "Fingers tingling — possible neuropathy." },
];

export const seedMessages: Message[] = [
  { id: "msg-1", patientProfileId: "pp-1", sender: "Sarah Cohen", senderRole: "patient", text: "Good morning, Dr. Goldstein. I've been experiencing more fatigue than usual after the last infusion. Is this expected at cycle 3?", createdAt: "2026-06-04T08:15:00Z", read: true },
  { id: "msg-2", patientProfileId: "pp-1", sender: "Dr. Miriam Goldstein", senderRole: "oncologist", text: "Good morning, Sarah. Yes, cumulative fatigue is very common by cycle 3 of AC. Please ensure you're resting between activities and staying hydrated. I've attached your updated care instructions.", attachments: [{ id: "att-1", fileName: "AC_CareInstructions_Cycle3.pdf", fileType: "pdf", uploadDate: "2026-06-04" }], createdAt: "2026-06-04T10:30:00Z", read: true },
  { id: "msg-3", patientProfileId: "pp-1", sender: "Sarah Cohen", senderRole: "patient", text: "Thank you. I'll read the document. One more question — I noticed a slight rash on my forearm. Should I come in?", createdAt: "2026-06-04T14:00:00Z", read: false },
  { id: "msg-4", patientProfileId: "pp-3", sender: "Rachel Mizrahi", senderRole: "patient", text: "Hi, I have a question about today's radiation session. My skin in the treatment area is quite red and sore. Is this normal?", createdAt: "2026-06-03T11:00:00Z", read: true },
  { id: "msg-5", patientProfileId: "pp-3", sender: "Dr. Miriam Goldstein", senderRole: "oncologist", text: "Rachel, what you're describing is radiation dermatitis — it's expected at week 3. I'm sending you a clinical summary with skin care instructions.", attachments: [{ id: "att-2", fileName: "Radiation_SkinCare_Instructions.pdf", fileType: "pdf", uploadDate: "2026-06-03" }], createdAt: "2026-06-03T13:30:00Z", read: true },
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  role?: UserRole;
  profileId?: string;
  oncologistId?: string;
  labStaffId?: string;
}

export function validateLogin(email: string, password: string): AuthResult {
  if (email === seedOncologist.email && password === seedOncologist.password) {
    return { success: true, role: "oncologist", oncologistId: seedOncologist.id };
  }
  if (email === seedLabStaff.email && password === seedLabStaff.password) {
    return { success: true, role: "lab_staff", labStaffId: seedLabStaff.id };
  }
  const profile = seedPatientProfiles.find(
    (p) => p.email === email && p.accountStatus === "linked"
  );
  if (profile) {
    if (password.length >= 6) return { success: true, role: "patient", profileId: profile.id };
    return { success: false, error: "Invalid password." };
  }
  const waitingProfile = seedPatientProfiles.find((p) => p.email === email);
  if (waitingProfile) {
    return { success: false, error: "Your account has not been activated yet. Please register first." };
  }
  return { success: false, error: "No account found with this email." };
}

export function validateRegistration(email: string, password: string): AuthResult {
  const profile = seedPatientProfiles.find((p) => p.email === email);
  if (!profile) {
    return { success: false, error: "Your medical profile has not been created by your oncologist yet." };
  }
  if (profile.accountStatus === "linked") {
    return { success: false, error: "An account already exists for this email. Please log in." };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }
  profile.accountStatus = "linked";
  return { success: true, role: "patient", profileId: profile.id };
}

// ─── Computed helpers ─────────────────────────────────────────────────────────

export function getPendingAction(
  profileId: string,
  labs: LabResult[],
  protocol: TreatmentProtocol | undefined,
  messages: Message[]
): PendingAction {
  const hasUnreadMsg = messages.some(
    (m) => m.patientProfileId === profileId && m.senderRole === "patient" && !m.read
  );
  if (hasUnreadMsg) return "unread_message";
  if (!protocol) return "none";
  const hasDelayed = protocol.items.some(
    (i) => i.type === "chemotherapy" && (i as ChemoCycle).status === "delayed"
  );
  if (hasDelayed) return "treatment_delayed";
  const waitingCycle = protocol.items.find(
    (i) => i.type === "chemotherapy" && (i as ChemoCycle).status === "waiting_labs"
  ) as ChemoCycle | undefined;
  if (waitingCycle) {
    const hasLabs = labs.some(
      (l) => l.patientProfileId === profileId && l.linkedCycleId === waitingCycle.id
    );
    if (hasLabs) return "cycle_ready_review";
    return "waiting_labs";
  }
  return "none";
}
