import type { TreatmentMedicationRecord, TreatmentProtocolRecord } from "../types/api";
import { normalizeWeekdays, type WeekdayKey } from "./treatmentDisplay";

export type MedicationCategory = "chemotherapy" | "supportive" | "chronic" | "other";

export interface CanonicalMedication {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  timing: string;
  weekdays: WeekdayKey[];
  asNeeded: boolean;
  category: MedicationCategory;
  notes: string;
}

// Canonical medication normalization shared by the oncologist and patient
// views. Category is preserved as-is (defaulting only a missing value to
// "other", which is the same default the backend schema itself uses — never
// remapped to another category). Route is preserved as-is, including empty
// string — an unset route is never replaced with a fabricated value such as
// "IV" or "oral", since the schema imposes no such default.
export const normalizeMedication = (
  medication: TreatmentMedicationRecord
): CanonicalMedication => ({
  id: medication.id || medication._id || `med-${medication.name}`,
  name: medication.name || "",
  dose: medication.dose || "",
  route: medication.route || "",
  frequency: medication.frequency || medication.schedule || "",
  timing: medication.timing || "",
  weekdays: normalizeWeekdays(medication.weekdays),
  asNeeded: Boolean(medication.asNeeded),
  category: medication.category || "other",
  notes: medication.notes || "",
});

// Builds the full medication plan for a protocol: every recorded medication,
// plus a synthetic entry for any drug listed in protocol.drugs that has no
// matching medication by name. Synthetic entries follow the same route/
// category rule as normalizeMedication — no fabricated route, and "chemotherapy"
// (not "other") since a drug-only entry always originates from the protocol's
// chemotherapy drug list.
export const getMedicationPlan = (
  protocol?: TreatmentProtocolRecord | null
): CanonicalMedication[] => {
  if (!protocol) return [];

  const medications = (protocol.medications || []).map(normalizeMedication);
  const existingNames = new Set(
    medications.map((medication) => medication.name.trim().toLowerCase())
  );

  (protocol.drugs || []).forEach((drug) => {
    const key = drug.trim().toLowerCase();
    if (!key || existingNames.has(key)) return;

    medications.push({
      id: `drug-${key}`,
      name: drug,
      dose: "",
      route: "",
      frequency: "",
      timing: "",
      weekdays: [],
      asNeeded: false,
      category: "chemotherapy",
      notes: "Listed in treatment protocol",
    });
  });

  return medications;
};
