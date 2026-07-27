import { useRef, useState } from "react";
import { Calendar, Scissors, Syringe, X, Zap } from "lucide-react";

import ErrorMessage from "../../../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../../components/common/FieldError";
import { focusFirstField } from "../../../../utils/focusFirstField";
import { shiftDate } from "../../../../utils/dateUtils";
import {
  getRoadmapItemTitle,
  normalizeWeekdays,
  toDateInputValue,
  type WeekdayKey,
} from "../../../../utils/treatmentDisplay";
import type { TreatmentCycleRecord } from "../../../../types/treatment";
import { inputCls, labelCls } from "../helpers";
import { WeekdaySelector } from "../../../../components/treatment/WeekdaySelector";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const clearFieldError = (key: string) => {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
  };

  const updateItem = (
    id: string,
    field: keyof TreatmentCycleRecord,
    value: string | number | WeekdayKey[]
  ) => {
    const suffix =
      field === "startDate" || field === "plannedDate"
        ? "start"
        : field === "endDate"
          ? "end"
          : field === "weekdays"
            ? "weekdays"
            : field === "totalSessions"
              ? "sessions"
              : field === "notes"
                ? "notes"
                : "";
    if (suffix) clearFieldError(`${id}-${suffix}`);
    setItems((current) =>
      current.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item._id !== id));
    setRemovedCycleIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const updateChemoStartDate = (changedId: string, newStart: string) => {
    clearFieldError(`${changedId}-start`);
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
    if (items.length === 0) {
      setError("At least one treatment item must remain on the roadmap.");
      return;
    }

    const nextErrors: Record<string, string> = {};
    items.forEach((item) => {
      const start = toDateInputValue(
        item.treatmentType === "surgery"
          ? item.plannedDate || item.startDate
          : item.startDate
      );
      const end =
        item.treatmentType === "surgery"
          ? start
          : toDateInputValue(item.endDate);

      if (!start) {
        nextErrors[`${item._id}-start`] =
          item.treatmentType === "surgery"
            ? "Planned date is required."
            : "Start date is required.";
      }
      if (item.treatmentType !== "surgery" && !end) {
        nextErrors[`${item._id}-end`] = "End date is required.";
      } else if (start && end && end < start) {
        nextErrors[`${item._id}-end`] =
          "End date must be on or after start date.";
      }
      if (
        item.treatmentType === "radiation" &&
        normalizeWeekdays(item.weekdays).length === 0
      ) {
        nextErrors[`${item._id}-weekdays`] =
          "Select at least one radiation weekday.";
      }
      if (
        item.treatmentType === "radiation" &&
        (item.totalSessions == null ||
          !Number.isInteger(item.totalSessions) ||
          item.totalSessions < 0)
      ) {
        nextErrors[`${item._id}-sessions`] =
          "Total sessions must be a whole number of zero or more.";
      }
      if ((item.notes || "").length > 500) {
        nextErrors[`${item._id}-notes`] =
          "Notes cannot exceed 500 characters.";
      }
    });

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
          nextErrors[`${next._id}-start`] =
            "This cycle overlaps another chemotherapy cycle.";
        }
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      focusFirstField([
        { current: firstKey ? fieldRefs.current[firstKey] : null },
      ]);
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});
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
          {error && <ErrorMessage message={error} />}

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
                    <label className={labelCls}>Start Date *</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-start`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-start`] ? invalidFieldClass : ""
                      }`}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateChemoStartDate(item._id, event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-start`]} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date *</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-end`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-end`] ? invalidFieldClass : ""
                      }`}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-end`]} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-notes`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-notes`] ? invalidFieldClass : ""
                      }`}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-notes`]} />
                  </div>
                </div>
              )}

              {item.treatmentType === "radiation" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Start Date *</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-start`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-start`] ? invalidFieldClass : ""
                      }`}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateItem(item._id, "startDate", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-start`]} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date *</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-end`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-end`] ? invalidFieldClass : ""
                      }`}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-end`]} />
                  </div>
                  <div>
                    <label className={labelCls}>Total Sessions</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-sessions`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-sessions`] ? invalidFieldClass : ""
                      }`}
                      type="number"
                      min="0"
                      value={item.totalSessions || 0}
                      onChange={(event) =>
                        updateItem(item._id, "totalSessions", Number(event.target.value))
                      }
                    />
                    <FieldError message={fieldErrors[`${item._id}-sessions`]} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Radiation Weekdays *</label>
                    <div
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-weekdays`] = element;
                      }}
                      tabIndex={-1}
                      className={`rounded-lg ${
                        fieldErrors[`${item._id}-weekdays`]
                          ? "border border-red-400 p-2"
                          : ""
                      }`}
                    >
                      <WeekdaySelector
                        selected={normalizeWeekdays(item.weekdays)}
                        disabled={saving}
                        onChange={(days) =>
                          updateItem(item._id, "weekdays", days)
                        }
                      />
                    </div>
                    <FieldError
                      message={fieldErrors[`${item._id}-weekdays`]}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-notes`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-notes`] ? invalidFieldClass : ""
                      }`}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-notes`]} />
                  </div>
                </div>
              )}

              {item.treatmentType === "surgery" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Planned Date *</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-start`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-start`] ? invalidFieldClass : ""
                      }`}
                      type="date"
                      value={toDateInputValue(item.plannedDate || item.startDate)}
                      onChange={(event) => {
                        updateItem(item._id, "plannedDate", event.target.value);
                        updateItem(item._id, "startDate", event.target.value);
                        updateItem(item._id, "endDate", event.target.value);
                      }}
                    />
                    <FieldError message={fieldErrors[`${item._id}-start`]} />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <input
                      ref={(element) => {
                        fieldRefs.current[`${item._id}-notes`] = element;
                      }}
                      className={`${inputCls} ${
                        fieldErrors[`${item._id}-notes`] ? invalidFieldClass : ""
                      }`}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                    <FieldError message={fieldErrors[`${item._id}-notes`]} />
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
