import { Pencil, Pill } from "lucide-react";

import type { TreatmentProtocolRecord } from "../../../../types/api";
import type { MedicationCategory, MedicationFormRecord } from "../patientDetailTypes";
import { categoryColor, categoryLabel, getProtocolMeta, weekdayLabels } from "../patientDetailHelpers";
import { PhasePlaceholder, SectionCard } from "./PatientDetailShared";

interface MedicationPlanCardProps {
  protocol: TreatmentProtocolRecord | null;
  treatmentLoading: boolean;
  medicationPlan: MedicationFormRecord[];
  savingTreatment: boolean;
  onEditClick: () => void;
}

export function MedicationPlanCard({
  protocol,
  treatmentLoading,
  medicationPlan,
  savingTreatment,
  onEditClick,
}: MedicationPlanCardProps) {
  return (
    <SectionCard
      title="Medication Plan"
      source="Medication list created by oncologist"
      meta={protocol ? getProtocolMeta(protocol) : undefined}
      editButton={
        protocol && (
          <button
            onClick={onEditClick}
            disabled={savingTreatment}
            className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
          >
            <Pencil size={12} /> Edit Medications
          </button>
        )
      }
    >
      {treatmentLoading ? (
        <PhasePlaceholder icon={<Pill size={16} />}>
          Loading medication plan...
        </PhasePlaceholder>
      ) : !protocol ? (
        <PhasePlaceholder icon={<Pill size={16} />}>
          Create a treatment protocol to manage medications.
        </PhasePlaceholder>
      ) : medicationPlan.length === 0 ? (
        <p className="text-sm text-[#9CA3AF]">No medications added yet.</p>
      ) : (
        <div className="space-y-2">
          {(["chemotherapy", "supportive", "chronic", "other"] as MedicationCategory[]).map(
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
