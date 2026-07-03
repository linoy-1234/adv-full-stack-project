import { useState } from "react";
import { X } from "lucide-react";

import type { TreatmentCycleRecord } from "../../../../../types/api";
import { inputCls, labelCls } from "../../../../../utils/patientDetailHelpers";

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

  const confirmPostpone = async () => {
    if (!newStartDate || !newEndDate) return;
    if (newEndDate < newStartDate) {
      setError("End date must be on or after start date.");
      return;
    }

    setSaving(true);
    setError("");
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New Start Date</label>
              <input
                className={inputCls}
                type="date"
                value={newStartDate}
                onChange={(event) => setNewStartDate(event.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>New End Date</label>
              <input
                className={inputCls}
                type="date"
                value={newEndDate}
                onChange={(event) => setNewEndDate(event.target.value)}
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
            onClick={confirmPostpone}
            disabled={saving || !newStartDate || !newEndDate}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Postpone"}
          </button>
        </div>
      </div>
    </div>
  );
}
