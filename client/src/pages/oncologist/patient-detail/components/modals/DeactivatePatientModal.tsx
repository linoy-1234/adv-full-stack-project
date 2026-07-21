import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { useErrorVisibility } from "../../../../../hooks/useErrorVisibility";
import type { PatientProfile as ApiPatientProfile } from "../../../../../types/api";
import { inputCls, labelCls } from "../../helpers";

const CONFIRMATION_TEXT = "DEACTIVATE";

export function DeactivatePatientModal({
  profile,
  onClose,
  onConfirm,
}: {
  profile: ApiPatientProfile;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const errorRef = useErrorVisibility(error);
  const canConfirm = confirmation.trim() === CONFIRMATION_TEXT;

  const handleDeactivate = async () => {
    if (saving || !canConfirm) return;

    setSaving(true);
    setError("");

    try {
      const confirmError = await onConfirm();

      if (confirmError) {
        setError(confirmError);
        setSaving(false);
      }
    } catch (deactivateError) {
      setError(
        deactivateError instanceof Error
          ? deactivateError.message
          : "Failed to deactivate patient"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            Deactivate patient
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 space-y-2">
            <p className="font-semibold">{profile.fullName} will be deactivated.</p>
            <p>
              This is a soft deactivation, not a permanent database deletion.
              The patient profile and related treatment, lab, message, symptom,
              and document records will be marked inactive according to the
              existing backend flow.
            </p>
          </div>

          <div>
            <label className={labelCls}>Type DEACTIVATE to confirm</label>
            <input
              className={inputCls}
              value={confirmation}
              disabled={saving}
              onChange={(event) => setConfirmation(event.target.value)}
              autoFocus
            />
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
            onClick={handleDeactivate}
            disabled={saving || !canConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Deactivating..." : "Deactivate patient"}
          </button>
        </div>
      </div>
    </div>
  );
}
