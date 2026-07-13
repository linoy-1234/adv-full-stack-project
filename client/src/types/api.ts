export type UserRole = "patient" | "oncologist" | "lab_staff";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  patientProfile?: string | { _id: string; fullName?: string; email?: string } | null;
  isActive?: boolean;
  googleSubject?: string | null;
}

export interface PatientAllergy {
  name: string;
  severity?: "mild" | "moderate" | "severe" | "unknown";
  notes?: string;
}

export interface PatientProfile {
  _id: string;
  user?:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        role: UserRole;
        isActive?: boolean;
      }
    | null;
  oncologist:
    | string
    | {
        _id: string;
        fullName: string;
        email: string;
        role: UserRole;
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

export type PendingAction =
  | "waiting_labs"
  | "labs_received"
  | "cycle_ready_review"
  | "unread_message"
  | "treatment_delayed"
  | "none";

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

export type TreatmentKind =
  | "chemotherapy"
  | "radiation"
  | "surgery"
  | "supportive";

export type TreatmentCycleStatus =
  | "upcoming"
  | "waiting_for_labs"
  | "waiting_for_review"
  | "pending_review"
  | "approved"
  | "active"
  | "completed"
  | "delayed"
  | "cancelled"
  | "in_progress"
  | "postponed";

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

export interface TreatmentDecision {
  decisionStatus?: "none" | "approved" | "delayed";
  decidedBy?:
    | string
    | {
        _id: string;
        fullName: string;
        email?: string;
        role?: UserRole;
      }
    | null;
  decidedAt?: string | null;
  decisionNotes?: string;
  delayReason?: string;
  delayedToStartDate?: string | null;
  delayedToEndDate?: string | null;
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
        role: UserRole;
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
  cancelReason?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  protocol?: TreatmentProtocolRecord;
  cycles?: TreatmentCycleRecord[];
  message?: string;
}

export interface ApiLabResultCycle {
  _id: string;
  title: string;
  cycleNumber: number;
  treatmentType: string;
  status: TreatmentCycleStatus;
  startDate: string;
  endDate: string;
}

export interface ApiLabResultUser {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface ApiLabResult {
  _id: string;
  patient: string;
  cycle: ApiLabResultCycle | null;
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

export interface MessageAttachmentRecord {
  originalName: string;
  storedName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface MessageRecord {
  _id: string;
  patient: string;
  sender:
    | { _id: string; fullName: string; email: string; role: UserRole }
    | string;
  senderRole: "patient" | "oncologist";
  text: string;
  attachments?: MessageAttachmentRecord[];
  readByPatient: boolean;
  readByOncologist: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  success: boolean;
  count: number;
  messages: MessageRecord[];
}

export interface MessageRecordResponse {
  success: boolean;
  message: string;
  messageRecord: MessageRecord;
}

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

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface UnreadCountsResponse {
  success: boolean;
  counts: Record<string, number>;
}

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

//helps TypeScript, for seeing how data looks from the server
