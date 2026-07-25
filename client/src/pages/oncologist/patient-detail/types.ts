import type {
  MedicationDisplayRecord,
  TreatmentKind,
  TreatmentMedicationCategory,
  TreatmentTypeRecord,
} from "../../../types/treatment";

export type ModalName =
  | "profile"
  | "medications"
  | "protocol"
  | "dates"
  | "deactivate"
  | null;
export type MedicationCategory = TreatmentMedicationCategory;
export type TreatmentItemType = TreatmentKind;

// Canonical medication-display shape now lives in types/treatment.ts (shared
// with the patient portal's MedicationPlanCard usage) - re-exported under its
// original name here since this page's own files import it as
// `MedicationFormRecord`.
export type MedicationFormRecord = MedicationDisplayRecord;

export interface ProtocolFormResult {
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypeRecord[];
  drugs: string[];
  notes: string;
}
