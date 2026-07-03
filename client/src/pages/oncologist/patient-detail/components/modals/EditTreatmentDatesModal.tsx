import { useState } from "react";
import { Calendar, Scissors, Syringe, X, Zap } from "lucide-react";

import { shiftDate } from "../../../../../utils/mockData";
import { toDateInputValue, type WeekdayKey } from "../../../../../utils/treatmentDisplay";
import type { TreatmentCycleRecord } from "../../../../../types/api";
import {
  getRoadmapItemTitle,
  inputCls,
  labelCls,
  normalizeWeekdays,
} from "../../../../../utils/patientDetailHelpers";
import { WeekdaySelector } from "../shared/PatientDetailShared";

export function EditTreatmentDatesModal({
  cycles,
  onClose,
  onSave,
}: {
  cycles: TreatmentCycleRecord[];
  onClose: () => void;
  onSave: (cycles: TreatmentCycleRecord[], removedCycleIds: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState<TreatmentCycleRecord[]>(
    cycles.map((cycle) => ({ ...cycle }))
  );
  const [removedCycleIds, setRemovedCycleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (
    id: string,
    field: keyof TreatmentCycleRecord,
    value: string | number | WeekdayKey[]
  ) => {
    setItems((current) =>
      current.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item._id !== id));
    setRemovedCycleIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const updateChemoStartDate = (changedId: string, newStart: string) => {
    setItems((current) => {
      const changedItem = current.find((item) => item._id === changedId);
      if (!changedItem) return current;

      const oldStart = toDateInputValue(changedItem.startDate);
      if (!oldStart || !newStart) return current;

      const deltaDays = Math.round(
        (new Date(newStart).getTime() - new Date(oldStart).getTime()) / 86_400_000
      );
      if (deltaDays === 0) return current;

      // Chemo cycles sorted by cycleNumber; shift the changed one and everything after it
      const changedCycleNumber = changedItem.cycleNumber;

      return current.map((item) => {
        if (item.treatmentType !== "chemotherapy") return item;
        if (item.cycleNumber < changedCycleNumber) return item;

        const s = toDateInputValue(item.startDate);
        const e = toDateInputValue(item.endDate);
        return {
          ...item,
          startDate: s ? shiftDate(s, deltaDays) : item.startDate,
          endDate: e ? shiftDate(e, deltaDays) : item.endDate,
        };
      });
    });
  };

  const saveDates = async () => {
    const radiationMissingWeekdays = items.some(
      (item) =>
        item.treatmentType === "radiation" &&
        normalizeWeekdays(item.weekdays).length === 0
    );

    if (radiationMissingWeekdays) {
      setError("Select at least one weekday for each radiation course.");
      return;
    }

    const chemoItems = items.filter((item) => item.treatmentType === "chemotherapy");
    for (let index = 0; index < chemoItems.length; index += 1) {
      const current = chemoItems[index];
      const currentStart = toDateInputValue(current.startDate);
      const currentEnd = toDateInputValue(current.endDate);

      for (let nextIndex = index + 1; nextIndex < chemoItems.length; nextIndex += 1) {
        const next = chemoItems[nextIndex];
        const nextStart = toDateInputValue(next.startDate);
        const nextEnd = toDateInputValue(next.endDate);

        if (currentStart <= nextEnd && currentEnd >= nextStart) {
          setError("This chemotherapy cycle overlaps with another chemotherapy cycle. Please choose different dates.");
          return;
        }
      }
    }

    setSaving(true);
    setError("");
    try {
      await onSave(items, removedCycleIds);
      setSaving(false);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save treatment dates"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Calendar size={15} className="text-[#7CAE8E]" /> Edit Treatment Dates
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {items.map((item) => (
            <div key={item._id} className="bg-white border border-[#E5E2DC] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.treatmentType === "chemotherapy" && (
                    <Syringe size={13} className="text-[#7CAE8E]" />
                  )}
                  {item.treatmentType === "radiation" && (
                    <Zap size={13} className="text-amber-500" />
                  )}
                  {item.treatmentType === "surgery" && (
                    <Scissors size={13} className="text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-[#2C3E2D]">
                    {getRoadmapItemTitle(item)}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">({item.treatmentType})</span>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="text-[#9CA3AF] hover:text-red-500"
                  disabled={saving}
                  title="Remove from roadmap"
                  aria-label={`Remove ${getRoadmapItemTitle(item)} from roadmap`}
                >
                  <X size={14} />
                </button>
              </div>

              {item.treatmentType === "chemotherapy" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateChemoStartDate(item._id, event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {item.treatmentType === "radiation" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateItem(item._id, "startDate", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Total Sessions</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={item.totalSessions || 0}
                      onChange={(event) =>
                        updateItem(item._id, "totalSessions", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Radiation Weekdays</label>
                    <WeekdaySelector
                      selected={normalizeWeekdays(item.weekdays)}
                      disabled={saving}
                      onChange={(days) => updateItem(item._id, "weekdays", days)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {item.treatmentType === "surgery" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Planned Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.plannedDate || item.startDate)}
                      onChange={(event) => {
                        updateItem(item._id, "plannedDate", event.target.value);
                        updateItem(item._id, "startDate", event.target.value);
                        updateItem(item._id, "endDate", event.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
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
            onClick={saveDates}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Dates"}
          </button>
        </div>
      </div>
    </div>
  );
}
