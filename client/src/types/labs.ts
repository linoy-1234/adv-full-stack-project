import type { UserRole } from "./auth";

export interface ApiLabResultUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ApiLabResult {
  _id: string;
  patient: string;
  enteredBy: ApiLabResultUser;
  updatedBy: ApiLabResultUser | null;
  testDate: string;
  wbc: number;
  neutrophils: number;
  hemoglobin: number;
  platelets: number;
  alt: number;
  creatinine: number;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabResultResponse {
  success: boolean;
  message?: string;
  labResult: ApiLabResult;
}

export interface LabResultsResponse {
  success: boolean;
  count: number;
  labResults: ApiLabResult[];
}
