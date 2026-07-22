import { useRef, useState } from "react";
import { Pencil, X } from "lucide-react";

import {
  focusFirstField,
  useErrorVisibility,
} from "../../../../../hooks/useErrorVisibility";
import { toDateInputValue } from "../../../../../utils/treatmentDisplay";
import type { PatientProfile as ApiPatientProfile } from "../../../../../types/api";
import type { PatientPayload } from "../../../../../services/patientService";
import {
  bloodTypes,
  getAllergyNames,
  inputCls,
  labelCls,
  normalizeBloodType,
} from "../../helpers";

export function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ApiPatientProfile;
  onClose: () => void;
  onSave: (patientData: Partial<PatientPayload>) => Promise<string | null>;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    nationalId: profile.nationalId,
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    diagnosis: profile.diagnosis,
    bloodType: normalizeBloodType(profile.bloodType),
    allergiesRaw: getAllergyNames(profile.allergies).join(", "),
    notes: profile.notes || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isEmailLocked = profile.accountStatus === "linked";
  const fullNameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const nationalIdRef = useRef<HTMLInputElement | null>(null);
  const dateOfBirthRef = useRef<HTMLInputElement | null>(null);
  const diagnosisRef = useRef<HTMLInputElement | null>(null);
  const errorRef = useErrorVisibility(error);

  const handleSave = async () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.nationalId.trim() ||
      !form.dateOfBirth ||
      !form.diagnosis.trim()
    ) {
      setError(
        "Full name, email, national ID, date of birth, and diagnosis are required."
      );
      focusFirstField([
        !form.fullName.trim() ? fullNameRef : { current: null },
        !form.email.trim() ? emailRef : { current: null },
        !form.nationalId.trim() ? nationalIdRef : { current: null },
        !form.dateOfBirth ? dateOfBirthRef : { current: null },
        !form.diagnosis.trim() ? diagnosisRef : { current: null },
      ]);
      return;
    }

    setSaving(true);
    setError("");

    const patientData: Partial<PatientPayload> = {
      fullName: form.fullName.trim(),
      nationalId: form.nationalId.trim(),
      dateOfBirth: form.dateOfBirth,
      diagnosis: form.diagnosis.trim(),
      bloodType: normalizeBloodType(form.bloodType),
      allergies: form.allergiesRaw
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          severity: "unknown" as const,
          notes: "",
        })),
      notes: form.notes.trim(),
    };

    if (!isEmailLocked) {
      patientData.email = form.email.trim().toLowerCase();
    }

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
            <Pencil size={15} className="text-[#7CAE8E]" /> Edit Medical Profile
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
          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input
                ref={fullNameRef}
                className={inputCls}
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input
                ref={emailRef}
                className={inputCls}
                type="email"
                value={form.email}
                disabled={isEmailLocked || saving}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
              {isEmailLocked && (
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Email cannot be changed after the patient account is linked.
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>National ID *</label>
              <input
                ref={nationalIdRef}
                className={inputCls}
                value={form.nationalId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nationalId: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Date of Birth *</label>
              <input
                ref={dateOfBirthRef}
                className={inputCls}
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
              />
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
                className={inputCls}
                value={form.diagnosis}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    diagnosis: event.target.value,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Allergies (comma separated)</label>
              <input
                className={inputCls}
                value={form.allergiesRaw}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    allergiesRaw: event.target.value,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

