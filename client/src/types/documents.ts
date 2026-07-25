import type { UserRole } from "./auth";

export type DocumentType =
  | "visit_summary"
  | "medical_certificate"
  | "prescription"
  | "other";

export interface ClinicalDocumentRecord {
  _id: string;
  patient: string;
  uploadedBy:
    | { _id: string; fullName: string; email: string; role: UserRole }
    | string;
  title: string;
  originalName: string;
  publicId: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  documentType: DocumentType;
  description?: string;
  isActive: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsResponse {
  success: boolean;
  count: number;
  documents: ClinicalDocumentRecord[];
}

export interface DocumentResponse {
  success: boolean;
  message?: string;
  document: ClinicalDocumentRecord;
}

export interface DocumentUrlResponse {
  success: boolean;
  fileUrl: string;
}
