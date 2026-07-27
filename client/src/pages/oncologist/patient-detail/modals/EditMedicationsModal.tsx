import { useRef, useState } from "react";
import { Pill, X } from "lucide-react";

import ErrorMessage from "../../../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../../components/common/FieldError";
import { focusFirstField } from "../../../../utils/focusFirstField";
import type { WeekdayKey } from "../../../../utils/treatmentDisplay";
import type { MedicationCategory, MedicationFormRecord } from "../types";
import {
  emptyMedicationForm,
  inputCls,
  labelCls,
  prepareMedicationDraft,
} from "../helpers";
import { WeekdaySelector } from "../../../../components/treatment/WeekdaySelector";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const addMedication = () => {
    const draft = validateDraft();
    if (!draft) return;

    setMedications((current) => [
      ...current,
      draft,
    ]);
    setMedForm(emptyMedicationForm());
    setError("");
    setFieldErrors({});
  };

  const removeMedication = (id: string) =>
    setMedications((current) => current.filter((medication) => medication.id !== id));

  const updateMedication = (
    id: string,
    field: keyof MedicationFormRecord,
    value: string | boolean | WeekdayKey[]
  ) => {
    if (
      field === "name" ||
      field === "dose" ||
      field === "timing" ||
      field === "notes" ||
      field === "weekdays"
    ) {
      clearFieldError(`${id}-${field}`);
    }
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id ? { ...medication, [field]: value } : medication
      )
    );
  };

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  };

  const hasDraftValues =
    !!medForm.name.trim() ||
    !!medForm.dose.trim() ||
    !!medForm.timing.trim() ||
    !!medForm.notes.trim() ||
    medForm.weekdays.length > 0 ||
    medForm.asNeeded ||
    medForm.route !== "IV" ||
    medForm.category !== "chemotherapy";

  const validateMedication = (
    medication: MedicationFormRecord,
    keyPrefix: string,
    nextErrors: Record<string, string>
  ) => {
    const name = medication.name.trim();
    if (!name) nextErrors[`${keyPrefix}-name`] = "Medication name is required.";
    else if (name.length < 2)
      nextErrors[`${keyPrefix}-name`] =
        "Medication name must be at least 2 characters.";
    else if (name.length > 100)
      nextErrors[`${keyPrefix}-name`] =
        "Medication name cannot exceed 100 characters.";
    if (medication.dose.trim().length > 80)
      nextErrors[`${keyPrefix}-dose`] =
        "Dose cannot exceed 80 characters.";
    if (medication.timing.trim().length > 160)
      nextErrors[`${keyPrefix}-timing`] =
        "Timing cannot exceed 160 characters.";
    if (!medication.asNeeded && medication.weekdays.length === 0) {
      nextErrors[`${keyPrefix}-weekdays`] =
        "Select at least one weekday or mark this medication as As needed.";
    }
    if (medication.notes.trim().length > 500)
      nextErrors[`${keyPrefix}-notes`] =
        "Notes cannot exceed 500 characters.";
  };

  const focusFirstMedicationError = (nextErrors: Record<string, string>) => {
    const firstKey = Object.keys(nextErrors)[0];
    focusFirstField([
      { current: firstKey ? fieldRefs.current[firstKey] : null },
    ]);
  };

  const validateDraft = () => {
    const nextErrors: Record<string, string> = {};
    validateMedication(medForm, "draft", nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      focusFirstMedicationError(nextErrors);
      return null;
    }
    return prepareMedicationDraft(medForm);
  };

  const saveMedications = async () => {
    const nextErrors: Record<string, string> = {};
    medications.forEach((medication) =>
      validateMedication(medication, medication.id, nextErrors)
    );
    if (hasDraftValues) validateMedication(medForm, "draft", nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstMedicationError(nextErrors);
      return;
    }

    const draft = hasDraftValues ? prepareMedicationDraft(medForm) : null;
    const medicationsToSave = draft ? [...medications, draft] : medications;

    setSaving(true);
    setError("");
    setFieldErrors({});

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
          {error && <ErrorMessage message={error} />}

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
                    ref={(element) => {
                      fieldRefs.current[`${medication.id}-name`] = element;
                    }}
                    className={`${inputCls} ${
                      fieldErrors[`${medication.id}-name`]
                        ? invalidFieldClass
                        : ""
                    }`}
                    value={medication.name}
                    onChange={(event) =>
                      updateMedication(medication.id, "name", event.target.value)
                    }
                  />
                  <FieldError
                    message={fieldErrors[`${medication.id}-name`]}
                  />
                </div>
                <div>
                  <label className={labelCls}>Dose</label>
                  <input
                    ref={(element) => {
                      fieldRefs.current[`${medication.id}-dose`] = element;
                    }}
                    className={`${inputCls} ${
                      fieldErrors[`${medication.id}-dose`]
                        ? invalidFieldClass
                        : ""
                    }`}
                    value={medication.dose}
                    onChange={(event) =>
                      updateMedication(medication.id, "dose", event.target.value)
                    }
                  />
                  <FieldError message={fieldErrors[`${medication.id}-dose`]} />
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
                    ref={(element) => {
                      fieldRefs.current[`${medication.id}-timing`] = element;
                    }}
                    className={`${inputCls} ${
                      fieldErrors[`${medication.id}-timing`]
                        ? invalidFieldClass
                        : ""
                    }`}
                    value={medication.timing}
                    onChange={(event) =>
                      updateMedication(medication.id, "timing", event.target.value)
                    }
                  />
                  <FieldError message={fieldErrors[`${medication.id}-timing`]} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className={labelCls}>Weekdays *</label>
                  <div
                    ref={(element) => {
                      fieldRefs.current[`${medication.id}-weekdays`] = element;
                    }}
                    tabIndex={-1}
                    className={`rounded-lg ${
                      fieldErrors[`${medication.id}-weekdays`]
                        ? "border border-red-400 p-2"
                        : ""
                    }`}
                  >
                    <WeekdaySelector
                      selected={medication.weekdays}
                      disabled={saving || medication.asNeeded}
                      onChange={(days) =>
                        updateMedication(medication.id, "weekdays", days)
                      }
                    />
                  </div>
                  <FieldError
                    message={fieldErrors[`${medication.id}-weekdays`]}
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
                          clearFieldError(`${medication.id}-weekdays`);
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
                    ref={(element) => {
                      fieldRefs.current[`${medication.id}-notes`] = element;
                    }}
                    className={`${inputCls} ${
                      fieldErrors[`${medication.id}-notes`]
                        ? invalidFieldClass
                        : ""
                    }`}
                    value={medication.notes}
                    onChange={(event) =>
                      updateMedication(medication.id, "notes", event.target.value)
                    }
                  />
                  <FieldError message={fieldErrors[`${medication.id}-notes`]} />
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
                  ref={(element) => {
                    fieldRefs.current["draft-name"] = element;
                  }}
                  className={`${inputCls} ${
                    fieldErrors["draft-name"] ? invalidFieldClass : ""
                  }`}
                  value={medForm.name}
                  onChange={(event) => {
                    clearFieldError("draft-name");
                    setMedForm((current) => ({ ...current, name: event.target.value }))
                  }}
                />
                <FieldError message={fieldErrors["draft-name"]} />
              </div>
              <div>
                <label className={labelCls}>Dose</label>
                <input
                  ref={(element) => {
                    fieldRefs.current["draft-dose"] = element;
                  }}
                  className={`${inputCls} ${
                    fieldErrors["draft-dose"] ? invalidFieldClass : ""
                  }`}
                  value={medForm.dose}
                  onChange={(event) => {
                    clearFieldError("draft-dose");
                    setMedForm((current) => ({ ...current, dose: event.target.value }))
                  }}
                />
                <FieldError message={fieldErrors["draft-dose"]} />
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
                  ref={(element) => {
                    fieldRefs.current["draft-timing"] = element;
                  }}
                  className={`${inputCls} ${
                    fieldErrors["draft-timing"] ? invalidFieldClass : ""
                  }`}
                  value={medForm.timing}
                  onChange={(event) => {
                    clearFieldError("draft-timing");
                    setMedForm((current) => ({ ...current, timing: event.target.value }))
                  }}
                />
                <FieldError message={fieldErrors["draft-timing"]} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className={labelCls}>Weekdays *</label>
                <div
                  ref={(element) => {
                    fieldRefs.current["draft-weekdays"] = element;
                  }}
                  tabIndex={-1}
                  className={`rounded-lg ${
                    fieldErrors["draft-weekdays"]
                      ? "border border-red-400 p-2"
                      : ""
                  }`}
                >
                  <WeekdaySelector
                    selected={medForm.weekdays}
                    disabled={saving || medForm.asNeeded}
                    onChange={(days) => {
                      clearFieldError("draft-weekdays");
                      setMedForm((current) => ({ ...current, weekdays: days }));
                    }}
                  />
                </div>
                <FieldError message={fieldErrors["draft-weekdays"]} />
                <label className="inline-flex items-center gap-2 text-xs text-[#6B7280]">
                  <input
                    type="checkbox"
                    checked={medForm.asNeeded}
                    disabled={saving}
                    onChange={(event) => {
                      if (event.target.checked) clearFieldError("draft-weekdays");
                      setMedForm((current) => ({
                        ...current,
                        asNeeded: event.target.checked,
                        weekdays: event.target.checked ? [] : current.weekdays,
                      }))
                    }}
                  />
                  <span>As needed</span>
                  <span className="text-[#9CA3AF]">(not scheduled for specific days)</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <input
                  ref={(element) => {
                    fieldRefs.current["draft-notes"] = element;
                  }}
                  className={`${inputCls} ${
                    fieldErrors["draft-notes"] ? invalidFieldClass : ""
                  }`}
                  value={medForm.notes}
                  onChange={(event) => {
                    clearFieldError("draft-notes");
                    setMedForm((current) => ({ ...current, notes: event.target.value }))
                  }}
                />
                <FieldError message={fieldErrors["draft-notes"]} />
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
