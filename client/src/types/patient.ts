import type { User } from "./auth";

export interface PatientAllergy {
  name: string;
  severity?: "mild" | "moderate" | "severe" | "unknown";
  notes?: string;
}

export type PendingAction =
  | "waiting_labs"
  | "labs_received"
  | "cycle_ready_review"
  | "unread_message"
  | "none";

export interface PatientProfile {
  _id: string;
  user?:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        role: User["role"];
        isActive?: boolean;
      }
    | null;
  oncologist:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        role: User["role"];
      };
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  diagnosis: string;
  bloodType?: string;
  allergies?: PatientAllergy[];
  notes?: string;
  accountStatus?: "waiting_for_registration" | "linked";
  isActive?: boolean;
  createdBy?: string | User;
  updatedBy?: string | User | null;
  createdAt?: string;
  updatedAt?: string;
  treatmentSummary?: {
    protocolName: string;
    treatmentTypes: string[];
  } | null;
  pendingAction?: PendingAction;
  pendingActions?: PendingAction[];
}

export interface PatientListResponse {
  success: boolean;
  count: number;
  patients: PatientProfile[];
}

export interface PatientResponse {
  success: boolean;
  patient: PatientProfile;
}
