import { useRef, useState } from "react";
import { X } from "lucide-react";

import ErrorMessage from "../../../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../../components/common/FieldError";
import { focusFirstField } from "../../../../utils/focusFirstField";
import type { TreatmentCycleRecord } from "../../../../types/treatment";
import { inputCls, labelCls } from "../helpers";

export function PostponeCycleModal({
  cycle,
  onClose,
  onConfirm,
}: {
  cycle: TreatmentCycleRecord;
  onClose: () => void;
  onConfirm: (newStartDate: string, newEndDate: string) => Promise<void>;
}) {
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    start?: string;
    end?: string;
  }>({});
  const newStartDateRef = useRef<HTMLInputElement | null>(null);
  const newEndDateRef = useRef<HTMLInputElement | null>(null);

  const confirmPostpone = async () => {
    const nextErrors: { start?: string; end?: string } = {};
    if (!newStartDate) nextErrors.start = "New start date is required.";
    if (!newEndDate) nextErrors.end = "New end date is required.";
    else if (newStartDate && newEndDate < newStartDate)
      nextErrors.end = "End date must be on or after start date.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.start ? newStartDateRef : { current: null },
        nextErrors.end ? newEndDateRef : { current: null },
      ]);
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      await onConfirm(newStartDate, newEndDate);
      setSaving(false);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to postpone cycle"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D]">Postpone {cycle.title}</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New Start Date *</label>
              <input
                ref={newStartDateRef}
                className={`${inputCls} ${
                  fieldErrors.start ? invalidFieldClass : ""
                }`}
                type="date"
                value={newStartDate}
                onChange={(event) => {
                  setFieldErrors((current) => ({ ...current, start: undefined }));
                  setNewStartDate(event.target.value);
                }}
              />
              <FieldError message={fieldErrors.start} />
            </div>
            <div>
              <label className={labelCls}>New End Date *</label>
              <input
                ref={newEndDateRef}
                className={`${inputCls} ${
                  fieldErrors.end ? invalidFieldClass : ""
                }`}
                type="date"
                value={newEndDate}
                onChange={(event) => {
                  setFieldErrors((current) => ({ ...current, end: undefined }));
                  setNewEndDate(event.target.value);
                }}
              />
              <FieldError message={fieldErrors.end} />
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
            onClick={confirmPostpone}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Postpone"}
          </button>
        </div>
      </div>
    </div>
  );
}
