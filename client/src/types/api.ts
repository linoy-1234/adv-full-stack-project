export type UserRole = "patient" | "oncologist" | "lab_staff";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  patientProfile?: string | null;
  isActive?: boolean;
}

export interface PatientProfile {
  _id: string;
  user?: string | null;
  oncologist: string;
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  diagnosis: string;
  bloodType?: string;
  notes?: string;
  accountStatus?: "waiting_for_registration" | "linked";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface ApiMessageResponse {
  success: boolean;
  message: string;
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

export interface TreatmentProtocolResponse {
  success: boolean;
  protocol?: unknown;
  cycles?: unknown[];
  message?: string;
}

export interface LabResultsResponse {
  success: boolean;
  count: number;
  labResults: unknown[];
}

export interface MessagesResponse {
  success: boolean;
  count: number;
  messages: unknown[];
}

export interface MessageRecordResponse {
  success: boolean;
  message: string;
  messageRecord: unknown;
}

export interface SymptomLogsResponse {
  success: boolean;
  count: number;
  symptomLogs: unknown[];
}

//helps TypeScript, for seeing how data looks from the server