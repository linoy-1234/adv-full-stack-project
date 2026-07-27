import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

import ErrorMessage from "../../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../components/common/FieldError";
import type { PatientPayload } from "../../../services/patientService";
import { focusFirstField } from "../../../hooks/useErrorVisibility";
import {
  bloodTypes,
  inputCls,
  labelCls,
  normalizeBloodType,
  type PatientFormField,
  validatePatientForm,
} from "../patient-detail/helpers";

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (patientData: PatientPayload) => Promise<string | null>;
  oncologistName: string;
}

export function AddPatientModal({ onClose, onSave }: AddPatientModalProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    nationalId: "",
    dateOfBirth: "",
    bloodType: "unknown",
    diagnosis: "",
    allergiesRaw: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PatientFormField, string>>
  >({});
  const [saving, setSaving] = useState(false);
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const nationalIdRef = useRef<HTMLInputElement | null>(null);
  const dateOfBirthRef = useRef<HTMLInputElement | null>(null);
  const diagnosisRef = useRef<HTMLInputElement | null>(null);
  const allergiesRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const clearFieldError = (field: PatientFormField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleSave = async () => {
    const nextErrors = validatePatientForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.fullName ? fullNameRef : { current: null },
        nextErrors.email ? emailRef : { current: null },
        nextErrors.nationalId ? nationalIdRef : { current: null },
        nextErrors.dateOfBirth ? dateOfBirthRef : { current: null },
        nextErrors.diagnosis ? diagnosisRef : { current: null },
        nextErrors.allergiesRaw ? allergiesRef : { current: null },
        nextErrors.notes ? notesRef : { current: null },
      ]);
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});

    const patientData: PatientPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      nationalId: form.nationalId.trim(),
      dateOfBirth: form.dateOfBirth,
      bloodType: normalizeBloodType(form.bloodType),
      diagnosis: form.diagnosis.trim(),
      allergies: form.allergiesRaw
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          severity: "unknown" as const,
          notes: "",
        })),
      notes: form.notes.trim() || undefined,
    };

    const saveError = await onSave(patientData);

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Plus size={15} className="text-[#7CAE8E]" /> Create Patient Medical Profile
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input
                ref={fullNameRef}
                className={`${inputCls} ${fieldErrors.fullName ? invalidFieldClass : ""}`}
                value={form.fullName}
                onChange={(event) => {
                  clearFieldError("fullName");
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.fullName} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                ref={emailRef}
                className={`${inputCls} ${fieldErrors.email ? invalidFieldClass : ""}`}
                type="email"
                value={form.email}
                onChange={(event) => {
                  clearFieldError("email");
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <label className={labelCls}>National ID *</label>
              <input
                ref={nationalIdRef}
                className={`${inputCls} ${fieldErrors.nationalId ? invalidFieldClass : ""}`}
                value={form.nationalId}
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={(event) => {
                  clearFieldError("nationalId");
                  const digitsOnly = event.target.value.replace(/\D/g, "");
                  setForm((current) => ({
                    ...current,
                    nationalId: digitsOnly,
                  }));
                }}
              />
              <FieldError message={fieldErrors.nationalId} />
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input
                ref={dateOfBirthRef}
                className={`${inputCls} ${fieldErrors.dateOfBirth ? invalidFieldClass : ""}`}
                type="date"
                value={form.dateOfBirth}
                onChange={(event) => {
                  clearFieldError("dateOfBirth");
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.dateOfBirth} />
            </div>
            <div>
              <label className={labelCls}>Blood Type</label>
              <select
                className={inputCls}
                value={form.bloodType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bloodType: event.target.value,
                  }))
                }
              >
                {bloodTypes.map((bloodType) => (
                  <option key={bloodType} value={bloodType}>
                    {bloodType === "unknown" ? "Unknown" : bloodType}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Diagnosis *</label>
              <input
                ref={diagnosisRef}
                className={`${inputCls} ${fieldErrors.diagnosis ? invalidFieldClass : ""}`}
                value={form.diagnosis}
                onChange={(event) => {
                  clearFieldError("diagnosis");
                  setForm((current) => ({
                    ...current,
                    diagnosis: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.diagnosis} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Allergies (comma separated)</label>
              <input
                ref={allergiesRef}
                className={`${inputCls} ${fieldErrors.allergiesRaw ? invalidFieldClass : ""}`}
                value={form.allergiesRaw}
                onChange={(event) => {
                  clearFieldError("allergiesRaw");
                  setForm((current) => ({
                    ...current,
                    allergiesRaw: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.allergiesRaw} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea
                ref={notesRef}
                className={`${inputCls} resize-none ${fieldErrors.notes ? invalidFieldClass : ""}`}
                rows={2}
                value={form.notes}
                onChange={(event) => {
                  clearFieldError("notes");
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }));
                }}
              />
              <FieldError message={fieldErrors.notes} />
            </div>
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
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
