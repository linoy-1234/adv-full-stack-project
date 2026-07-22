import { useState, useEffect } from "react";
import { CheckCircle, Edit2, Trash2, X } from "lucide-react";
import { todayIso } from "../../utils/treatmentDisplay";
import {
  getMySymptoms,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
} from "../../services/symptomService";
import type { SymptomType, SymptomItemPayload } from "../../services/symptomService";
import type { SymptomLog } from "../../types/api";

const SYMPTOMS = [
  { key: "nausea",      label: "Nausea",        emoji: "🤢", type: "nausea"        as SymptomType },
  { key: "fatigue",     label: "Fatigue",        emoji: "😴", type: "fatigue"       as SymptomType },
  { key: "pain",        label: "Pain",           emoji: "😣", type: "pain"          as SymptomType },
  { key: "vomiting",    label: "Vomiting",       emoji: "🤮", type: "vomiting"      as SymptomType },
  { key: "appetiteLoss",label: "Appetite Loss",  emoji: "🍽️", type: "appetite_loss" as SymptomType },
  { key: "mouthSores",  label: "Mouth Sores",    emoji: "👄", type: "mouth_sores"   as SymptomType },
] as const;

type SymptomKey = (typeof SYMPTOMS)[number]["key"];

// Maps backend type string → frontend key (for hydrating edit form)
const TYPE_TO_KEY: Partial<Record<string, SymptomKey>> = {
  nausea:        "nausea",
  fatigue:       "fatigue",
  pain:          "pain",
  vomiting:      "vomiting",
  appetite_loss: "appetiteLoss",
  mouth_sores:   "mouthSores",
};

const DEFAULT_INTENSITIES: Record<SymptomKey, number> = {
  nausea: 5, fatigue: 5, pain: 5, vomiting: 5, appetiteLoss: 5, mouthSores: 5,
};

const intensityLabel = (v: number) => {
  if (v <= 2) return "Mild";
  if (v <= 5) return "Moderate";
  if (v <= 8) return "Severe";
  return "Very Severe";
};

const intensityColor = (v: number) => {
  if (v <= 2) return "#166534";
  if (v <= 5) return "#92400E";
  if (v <= 8) return "#C2410C";
  return "#991B1B";
};

function formatLogDate(isoString: string) {
  const d = new Date(isoString);
  return {
    dateLabel: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    timeLabel: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function IntensitySlider({
  emoji,
  label,
  value,
  onChange,
}: {
  emoji: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="text-sm" style={{ color: "#374151" }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: intensityColor(value) }}>
            {intensityLabel(value)}
          </span>
          <span className="text-sm" style={{ color: intensityColor(value) }}>{value}/10</span>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #7CAE8E ${((value - 1) / 9) * 100}%, #E5E7EB ${((value - 1) / 9) * 100}%)`,
          accentColor: "#7CAE8E",
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: "#D1D5DB" }}>1</span>
        <span className="text-xs" style={{ color: "#D1D5DB" }}>10</span>
      </div>
    </div>
  );
}

export function SymptomJournal() {
  const TODAY = todayIso();

  // ── Fetched entries ──────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<SymptomLog[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // ── Form state ───────────────────────────────────────────────────────────────
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("09:00");
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [intensities, setIntensities] = useState<Record<SymptomKey, number>>({ ...DEFAULT_INTENSITIES });
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [otherIntensity, setOtherIntensity] = useState(5);
  const [notes, setNotes] = useState("");

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFetchLoading(true);
    setFetchError("");
    getMySymptoms()
      .then((res) => { if (!cancelled) setEntries(res.symptomLogs); })
      .catch(() => { if (!cancelled) setFetchError("Failed to load your entries. Please refresh the page."); })
      .finally(() => { if (!cancelled) setFetchLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const toggleSymptom = (key: SymptomKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const canSubmit = selected.size > 0 || (otherChecked && otherText.trim().length > 0);

  const resetForm = () => {
    setDate(TODAY);
    setTime("09:00");
    setSelected(new Set());
    setIntensities({ ...DEFAULT_INTENSITIES });
    setOtherChecked(false);
    setOtherText("");
    setOtherIntensity(5);
    setNotes("");
    setEditingId(null);
    setError("");
  };

  const handleEdit = (log: SymptomLog) => {
    setEditingId(log._id);
    // Extract local date and time from the stored ISO datetime
    const dt = new Date(log.logDate);
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const h = String(dt.getHours()).padStart(2, "0");
    const mi = String(dt.getMinutes()).padStart(2, "0");
    setDate(`${y}-${mo}-${d}`);
    setTime(`${h}:${mi}`);
    setNotes(log.notes ?? "");
    setError("");

    const selectedSet = new Set<SymptomKey>();
    const newIntensities: Record<SymptomKey, number> = { ...DEFAULT_INTENSITIES };

    // Reset other before hydrating
    setOtherChecked(false);
    setOtherText("");
    setOtherIntensity(5);

    log.symptoms.forEach((item) => {
      const key = TYPE_TO_KEY[item.type];
      if (key) {
        selectedSet.add(key);
        newIntensities[key] = item.severity;
      } else if (item.type === "other") {
        setOtherChecked(true);
        setOtherText(item.customSymptom ?? "");
        setOtherIntensity(item.severity);
      }
    });

    setSelected(selectedSet);
    setIntensities(newIntensities);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      await deleteSymptomLog(id);
      setEntries((prev) => prev.filter((e) => e._id !== id));
      setDeleteConfirmId(null);
    } catch {
      setError("Failed to delete entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      const symptoms: SymptomItemPayload[] = [
        ...SYMPTOMS.filter((s) => selected.has(s.key)).map((s) => ({
          type: s.type,
          severity: intensities[s.key],
        })),
        ...(otherChecked && otherText.trim()
          ? [{ type: "other" as SymptomType, severity: otherIntensity, customSymptom: otherText.trim() }]
          : []),
      ];

      const payload = {
        logDate: `${date}T${time}:00`,
        symptoms,
        notes: notes.trim() || undefined,
      };

      if (editingId) {
        const res = await updateSymptomLog(editingId, payload);
        setEntries((prev) => prev.map((e) => (e._id === editingId ? res.symptomLog : e)));
      } else {
        const res = await createSymptomLog(payload);
        setEntries((prev) => [res.symptomLog, ...prev]);
      }

      resetForm();
      setSubmitted(true);
    } catch {
      setError("Failed to save entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: "#D1FAE5" }}>
            <CheckCircle className="w-10 h-10" style={{ color: "#7CAE8E" }} />
          </div>
          <div>
            <h2 style={{ color: "#2D4739" }}>Journal Entry Saved 🌿</h2>
            <p className="text-sm mt-2" style={{ color: "#6B7280" }}>
              Thank you for logging how you feel. Your care team can now see your updated symptom data.
            </p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-3 rounded-xl text-white text-sm"
            style={{ backgroundColor: "#7CAE8E" }}
          >
            Log Another Entry
          </button>
        </div>
      </div>
    );
  }

  const showIntensities = selected.size > 0 || (otherChecked && otherText.trim().length > 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: "#2D4739" }}>{editingId ? "Edit Symptom Entry" : "Symptom Journal"}</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {editingId
            ? "Update your symptom entry below."
            : "How are you feeling today? Your entries help your care team understand patterns."}
        </p>
      </div>

      {editingId && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#FFFBEB", border: "1.5px solid #FCD34D" }}>
          <span className="text-sm" style={{ color: "#92400E" }}>✏️ Editing mode active</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3" style={{ backgroundColor: "#FEF2F2", border: "1.5px solid #FCA5A5" }}>
          <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Date & Time */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-3">When are you logging?</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={TODAY}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Time *</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
              />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-3">Which symptoms are you experiencing?</h3>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => {
              const active = selected.has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSymptom(s.key)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left transition-all"
                  style={{
                    backgroundColor: active ? "#D1FAE5" : "#F9FAFB",
                    border: `1.5px solid ${active ? "#7CAE8E" : "#E5E7EB"}`,
                  }}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm" style={{ color: active ? "#166534" : "#374151" }}>{s.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setOtherChecked((p) => !p)}
              className="col-span-2 flex items-center gap-2 p-3 rounded-xl text-left transition-all"
              style={{
                backgroundColor: otherChecked ? "#FEF9C3" : "#F9FAFB",
                border: `1.5px solid ${otherChecked ? "#FCD34D" : "#E5E7EB"}`,
              }}
            >
              <span className="text-lg">✏️</span>
              <span className="text-sm" style={{ color: otherChecked ? "#92400E" : "#374151" }}>Other</span>
            </button>
          </div>
          {otherChecked && (
            <div className="mt-3">
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. tingling in fingers, hair thinning..."
                maxLength={120}
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "#FFFBEB", border: "1.5px solid #FCD34D", color: "#374151" }}
              />
            </div>
          )}
        </div>

        {/* Intensities */}
        {showIntensities && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
            <h3 style={{ color: "#374151" }} className="mb-4">Rate the intensity (1–10)</h3>
            <div className="flex flex-col gap-5">
              {SYMPTOMS.filter((s) => selected.has(s.key)).map((s) => (
                <IntensitySlider
                  key={s.key}
                  emoji={s.emoji}
                  label={s.label}
                  value={intensities[s.key]}
                  onChange={(v) => setIntensities((prev) => ({ ...prev, [s.key]: v }))}
                />
              ))}
              {otherChecked && otherText.trim() && (
                <IntensitySlider
                  emoji="✏️"
                  label={`Other: ${otherText}`}
                  value={otherIntensity}
                  onChange={setOtherIntensity}
                />
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-2">Additional Notes (optional)</h3>
          <textarea
            rows={3}
            placeholder="Describe how you're feeling in your own words..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={1000}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#374151" }}
          />
        </div>

        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-2.5 rounded-xl text-sm"
            style={{ backgroundColor: "#E5E7EB", color: "#374151" }}
          >
            <X className="w-4 h-4 inline mr-1" /> Cancel Edit
          </button>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full py-3.5 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#7CAE8E" }}
        >
          {loading ? "🌿 Saving..." : editingId ? "💾 Update Entry" : "💾 Submit Journal Entry"}
        </button>

        {/* Recent Entries */}
        {fetchLoading ? (
          <div className="py-8 text-center text-sm" style={{ color: "#9CA3AF" }}>
            Loading your entries...
          </div>
        ) : fetchError ? (
          <div className="rounded-xl p-3" style={{ backgroundColor: "#FEF2F2", border: "1.5px solid #FCA5A5" }}>
            <p className="text-sm" style={{ color: "#DC2626" }}>{fetchError}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              No entries yet. Start logging how you feel above.
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <h3 style={{ color: "#2D4739" }} className="mb-3">Recent Entries</h3>
            <div className="flex flex-col gap-3">
              {entries.slice(0, 5).map((entry) => {
                const { dateLabel, timeLabel } = formatLogDate(entry.logDate);
                return (
                  <div
                    key={entry._id}
                    className="rounded-2xl p-4 relative"
                    style={{
                      backgroundColor: editingId === entry._id ? "#F0FAF4" : "#F9FAFB",
                      border: `1.5px solid ${editingId === entry._id ? "#7CAE8E" : "#E5E7EB"}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs block" style={{ color: "#374151" }}>
                        {dateLabel} at {timeLabel}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded-lg hover:bg-white"
                          style={{ color: "#7CAE8E" }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(entry._id)}
                          className="p-1.5 rounded-lg hover:bg-white"
                          style={{ color: "#DC2626" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {entry.symptoms.map((item) => {
                        const def = SYMPTOMS.find((s) => s.type === item.type);
                        const label = def?.label ?? item.customSymptom ?? item.type;
                        const emoji = def?.emoji ?? "✏️";
                        return (
                          <span
                            key={item.type}
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#F3F4F6", color: intensityColor(item.severity) }}
                          >
                            {emoji} {label}: {item.severity}/10
                          </span>
                        );
                      })}
                    </div>

                    {entry.notes && (
                      <p className="text-xs mt-2 italic" style={{ color: "#6B7280" }}>
                        "{entry.notes}"
                      </p>
                    )}

                    {deleteConfirmId === entry._id && (
                      <div
                        className="absolute inset-0 flex items-center justify-center rounded-2xl"
                        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                      >
                        <div className="bg-white rounded-xl p-4 mx-4 max-w-xs">
                          <p className="text-sm mb-4" style={{ color: "#374151" }}>
                            Delete this journal entry?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 px-3 py-2 rounded-lg text-sm"
                              style={{ backgroundColor: "#E5E7EB", color: "#374151" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(entry._id)}
                              disabled={loading}
                              className="flex-1 px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50"
                              style={{ backgroundColor: "#DC2626" }}
                            >
                              {loading ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
