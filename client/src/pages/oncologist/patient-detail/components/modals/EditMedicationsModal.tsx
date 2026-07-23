import { useState } from "react";
import { Pill, X } from "lucide-react";

import { useErrorVisibility } from "../../../../../hooks/useErrorVisibility";
import type { WeekdayKey } from "../../../../../utils/treatmentDisplay";
import type { MedicationCategory, MedicationFormRecord } from "../../types";
import {
  emptyMedicationForm,
  inputCls,
  labelCls,
  prepareMedicationDraft,
} from "../../helpers";
import { WeekdaySelector } from "../shared/PatientDetailShared";

export function EditMedicationsModal({
  medications: initialMedications,
  onClose,
  onSave,
}: {
  medications: MedicationFormRecord[];
  onClose: () => void;
  onSave: (medications: MedicationFormRecord[]) => Promise<void>;
}) {
  const [medications, setMedications] = useState<MedicationFormRecord[]>(
    initialMedications.map((medication) => ({ ...medication }))
  );
  const [medForm, setMedForm] = useState<MedicationFormRecord>({
    ...emptyMedicationForm(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useErrorVisibility<HTMLDivElement>(error);

  const addMedication = () => {
    const draft = prepareMedicationDraft(medForm);

    if (!draft) return;

    setMedications((current) => [
      ...current,
      draft,
    ]);
    setMedForm(emptyMedicationForm());
    setError("");
  };

  const removeMedication = (id: string) =>
    setMedications((current) => current.filter((medication) => medication.id !== id));

  const updateMedication = (
    id: string,
    field: keyof MedicationFormRecord,
    value: string | boolean | WeekdayKey[]
  ) => {
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id ? { ...medication, [field]: value } : medication
      )
    );
  };

  const saveMedications = async () => {
    const draft = prepareMedicationDraft(medForm);
    const medicationsToSave = draft ? [...medications, draft] : medications;
    const missingWeekdays = medicationsToSave.some(
      (medication) => !medication.asNeeded && medication.weekdays.length === 0
    );

    if (missingWeekdays) {
      setError("Select at least one weekday for each scheduled medication, or mark it as As needed.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave(medicationsToSave);
      setSaving(false);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save medications"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Pill size={15} className="text-[#7CAE8E]" /> Edit Medication Plan
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {medications.map((medication) => (
            <div
              key={medication.id}
              className="bg-white rounded-xl px-3 py-3 border border-[#E5E2DC] space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Medication
                </p>
                <button
                  onClick={() => removeMedication(medication.id)}
                  className="text-[#9CA3AF] hover:text-red-500"
                  disabled={saving}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    className={inputCls}
                    value={medication.name}
                    onChange={(event) =>
                      updateMedication(medication.id, "name", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Dose</label>
                  <input
                    className={inputCls}
                    value={medication.dose}
                    onChange={(event) =>
                      updateMedication(medication.id, "dose", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Route</label>
                  <select
                    className={inputCls}
                    value={medication.route}
                    onChange={(event) =>
                      updateMedication(medication.id, "route", event.target.value)
                    }
                  >
                    {["IV", "oral", "subcutaneous", "topical", "other"].map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={medication.category}
                    onChange={(event) =>
                      updateMedication(medication.id, "category", event.target.value)
                    }
                  >
                    <option value="chemotherapy">Chemotherapy</option>
                    <option value="supportive">Supportive</option>
                    <option value="chronic">Chronic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Timing</label>
                  <input
                    className={inputCls}
                    value={medication.timing}
                    onChange={(event) =>
                      updateMedication(medication.id, "timing", event.target.value)
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className={labelCls}>Weekdays *</label>
                  <WeekdaySelector
                    selected={medication.weekdays}
                    disabled={saving || medication.asNeeded}
                    onChange={(days) => updateMedication(medication.id, "weekdays", days)}
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-[#6B7280]">
                    <input
                      type="checkbox"
                      checked={medication.asNeeded}
                      disabled={saving}
                      onChange={(event) => {
                        updateMedication(medication.id, "asNeeded", event.target.checked);
                        if (event.target.checked) {
                          updateMedication(medication.id, "weekdays", []);
                        }
                      }}
                    />
                    <span>As needed</span>
                    <span className="text-[#9CA3AF]">(not scheduled for specific days)</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes</label>
                  <input
                    className={inputCls}
                    value={medication.notes}
                    onChange={(event) =>
                      updateMedication(medication.id, "notes", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white border border-dashed border-[#C8D9CC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Add Medication
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name *</label>
                <input
                  className={inputCls}
                  value={medForm.name}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Dose</label>
                <input
                  className={inputCls}
                  value={medForm.dose}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, dose: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Route</label>
                <select
                  className={inputCls}
                  value={medForm.route}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, route: event.target.value }))
                  }
                >
                  {["IV", "oral", "subcutaneous", "topical", "other"].map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  className={inputCls}
                  value={medForm.category}
                  onChange={(event) =>
                    setMedForm((current) => ({
                      ...current,
                      category: event.target.value as MedicationCategory,
                    }))
                  }
                >
                  <option value="chemotherapy">Chemotherapy</option>
                  <option value="supportive">Supportive</option>
                  <option value="chronic">Chronic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Timing</label>
                <input
                  className={inputCls}
                  value={medForm.timing}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, timing: event.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-2">
                <label className={labelCls}>Weekdays *</label>
                <WeekdaySelector
                  selected={medForm.weekdays}
                  disabled={saving || medForm.asNeeded}
                  onChange={(days) => setMedForm((current) => ({ ...current, weekdays: days }))}
                />
                <label className="inline-flex items-center gap-2 text-xs text-[#6B7280]">
                  <input
                    type="checkbox"
                    checked={medForm.asNeeded}
                    disabled={saving}
                    onChange={(event) =>
                      setMedForm((current) => ({
                        ...current,
                        asNeeded: event.target.checked,
                        weekdays: event.target.checked ? [] : current.weekdays,
                      }))
                    }
                  />
                  <span>As needed</span>
                  <span className="text-[#9CA3AF]">(not scheduled for specific days)</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <input
                  className={inputCls}
                  value={medForm.notes}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addMedication}
              className="text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium flex items-center gap-1"
            >
              + Add
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={saveMedications}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Medications"}
          </button>
        </div>
      </div>
    </div>
  );
}

