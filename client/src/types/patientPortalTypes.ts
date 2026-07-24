export type MedicationCategory = "chemotherapy" | "supportive" | "chronic" | "other";
export type MedicationRoute = "IV" | "oral" | "subcutaneous" | "topical" | "other";
export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface Medication {
  id: string;
  name: string;
  dose: string;
  route: MedicationRoute;
  frequency?: string;
  timing: string;
  weekdays?: WeekdayKey[];
  asNeeded?: boolean;
  category: MedicationCategory;
  notes?: string;
}

export type TreatmentItemType =
  | "chemotherapy"
  | "radiation"
  | "surgery"
  | "supportive";

export type CycleStatus =
  | "upcoming"
  | "waiting_for_review"
  | "active"
  | "completed";

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
  notes?: string;
}

export interface RadiationCourse {
  id: string;
  type: "radiation";
  title: string;
  startDate: string;
  endDate: string;
  totalSessions: number;
  completedSessions: number;
  weekdays?: WeekdayKey[];
  status: "upcoming" | "active" | "completed";
  notes?: string;
}

export interface SurgeryCheckpoint {
  id: string;
  type: "surgery";
  title: string;
  plannedDate: string;
  status: "upcoming" | "completed" | "today";
  notes?: string;
}

export type TreatmentItem = ChemoCycle | RadiationCourse | SurgeryCheckpoint;

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
}

export type AccountStatus = "waiting_registration" | "linked";

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
