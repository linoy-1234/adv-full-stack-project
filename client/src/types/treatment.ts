import type { User } from "./auth";
import type { PatientAllergy } from "./patient";

export type TreatmentKind =
  | "chemotherapy"
  | "radiation"
  | "surgery"
  | "supportive";

export type TreatmentCycleStatus =
  | "upcoming"
  | "waiting_for_review"
  | "active"
  | "completed"
  | "cancelled";

export type TreatmentMedicationCategory =
  | "chemotherapy"
  | "supportive"
  | "chronic"
  | "other";

export type WeekdayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface TreatmentTypeRecord {
  type: TreatmentKind;
  plannedCount: number;
  notes?: string;
}

export interface TreatmentMedicationRecord {
  id?: string;
  _id?: string;
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
  timing?: string;
  schedule?: string;
  weekdays?: WeekdayKey[];
  asNeeded?: boolean;
  category?: TreatmentMedicationCategory;
  notes?: string;
}

// Canonical medication-display shape used by both portals (see MedicationPlanCard
// / utils/medicationPlan.ts). Replaces the two previously-duplicated local types
// (patient-detail's MedicationFormRecord and medicationPlan.ts's CanonicalMedication),
// which were identical apart from an unused `frequency` field.
export interface MedicationDisplayRecord {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  timing: string;
  weekdays: WeekdayKey[];
  asNeeded: boolean;
  category: TreatmentMedicationCategory;
  notes: string;
}

export interface TreatmentDecision {
  decisionStatus?: "none" | "approved";
  decidedBy?:
    | string
    | {
        _id: string;
        fullName: string;
        email?: string;
        role?: User["role"];
      }
    | null;
  decidedAt?: string | null;
}

export interface TreatmentProtocolRecord {
  _id: string;
  patient:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        nationalId: string;
        diagnosis: string;
        bloodType?: string;
        allergies?: PatientAllergy[];
      };
  oncologist:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        role: User["role"];
      };
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypeRecord[];
  medications: TreatmentMedicationRecord[];
  drugs?: string[];
  notes?: string;
  createdBy?: string | User;
  updatedBy?: string | User | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentCycleRecord {
  _id: string;
  protocol: string;
  patient: string;
  oncologist: string;
  treatmentType: Exclude<TreatmentKind, "supportive">;
  cycleNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  plannedDate?: string;
  totalSessions?: number;
  completedSessions?: number;
  weekdays?: WeekdayKey[];
  medications?: string[];
  status: TreatmentCycleStatus;
  notes?: string;
  decision?: TreatmentDecision;
  cancelledAt?: string | null;
  cancelledBy?: string | User | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreatmentProtocolResponse {
  success: boolean;
  protocol?: TreatmentProtocolRecord;
  cycles?: TreatmentCycleRecord[];
  message?: string;
}
