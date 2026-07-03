import type {
  TreatmentKind,
  TreatmentMedicationCategory,
  TreatmentTypeRecord,
} from "../../../types/api";
import type { WeekdayKey } from "../../../utils/treatmentDisplay";

export type ModalName = "profile" | "medications" | "protocol" | "dates" | null;
export type MedicationCategory = TreatmentMedicationCategory;
export type TreatmentItemType = TreatmentKind;

export interface MedicationFormRecord {
  id: string;
  name: string;
  dose: string;
  route: string;
  timing: string;
  weekdays: WeekdayKey[];
  asNeeded: boolean;
  category: MedicationCategory;
  notes: string;
}

export interface ProtocolFormResult {
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypeRecord[];
  drugs: string[];
  notes: string;
}
