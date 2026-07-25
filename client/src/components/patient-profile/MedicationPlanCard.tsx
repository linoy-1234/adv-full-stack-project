import type { ReactNode } from "react";

import type { TreatmentProtocolRecord, MedicationDisplayRecord, TreatmentMedicationCategory } from "../../types/treatment";
import { categoryColor, categoryLabel, weekdayLabels } from "../../utils/treatmentDisplay";
import { SectionCard } from "../common/SectionCard";

interface MedicationPlanCardProps {
  protocol: TreatmentProtocolRecord | null;
  medicationPlan: MedicationDisplayRecord[];
  source: string;
  meta?: string;
  treatmentLoading?: boolean;
  // Oncologist-only states; the patient portal has no distinct loading or
  // "no protocol yet" messaging here and simply falls through to
  // `emptyContent` in both cases, matching its current behavior exactly.
  loadingContent?: ReactNode;
  noProtocolContent?: ReactNode;
  emptyContent: ReactNode;
  editButton?: ReactNode;
}

export function MedicationPlanCard({
  protocol,
  medicationPlan,
  source,
  meta,
  treatmentLoading = false,
  loadingContent,
  noProtocolContent,
  emptyContent,
  editButton,
}: MedicationPlanCardProps) {
  return (
    <SectionCard title="Medication Plan" source={source} meta={meta} editButton={editButton}>
      {treatmentLoading && loadingContent ? (
        loadingContent
      ) : !protocol && noProtocolContent ? (
        noProtocolContent
      ) : medicationPlan.length === 0 ? (
        emptyContent
      ) : (
        <div className="space-y-2">
          {(["chemotherapy", "supportive", "chronic", "other"] as TreatmentMedicationCategory[]).map(
            (category) => {
              const medications = medicationPlan.filter(
                (medication) => medication.category === category
              );
              if (!medications.length) return null;

              return (
                <div key={category}>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                    {categoryLabel[category]}
                  </p>
                  <div className="space-y-1.5">
                    {medications.map((medication) => (
                      <div
                        key={medication.id}
                        className={`flex items-start justify-between rounded-lg px-3 py-2 border text-sm ${categoryColor[category]}`}
                      >
                        <div>
                          <span className="font-medium">{medication.name}</span>
                          {(medication.dose || medication.route) && (
                            <span className="text-xs ml-2 opacity-70">
                              {[medication.dose, medication.route]
                                .filter(Boolean)
                                .join(" - ")}
                            </span>
                          )}
                          {medication.timing && (
                            <div className="text-xs opacity-70 mt-0.5">
                              {medication.timing}
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-0.5">
                            {medication.asNeeded
                              ? "As needed"
                              : medication.weekdays.length > 0
                              ? medication.weekdays.map((day) => weekdayLabels[day]).join(", ")
                              : "No weekdays selected"}
                          </div>
                          {medication.notes && (
                            <div className="text-xs opacity-70">{medication.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}
    </SectionCard>
  );
}
