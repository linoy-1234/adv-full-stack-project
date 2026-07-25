import type { UserRole } from "./auth";

export type SymptomType =
  | "nausea"
  | "fatigue"
  | "pain"
  | "vomiting"
  | "appetite_loss"
  | "mouth_sores"
  | "other";

export interface SymptomItem {
  type: SymptomType;
  severity: number;
  customSymptom?: string;
}

export interface SymptomLog {
  _id: string;
  patient: string;
  recordedBy:
    | { _id: string; fullName: string; email: string; role: UserRole }
    | string;
  logDate: string;
  symptoms: SymptomItem[];
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SymptomLogResponse {
  success: boolean;
  message?: string;
  symptomLog: SymptomLog;
}

export interface SymptomLogsResponse {
  success: boolean;
  count: number;
  symptomLogs: SymptomLog[];
}
