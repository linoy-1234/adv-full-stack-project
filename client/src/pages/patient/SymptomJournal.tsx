import { useState } from "react";
import { CheckCircle, Edit2, Trash2, X } from "lucide-react";
import { PatientProfile, SymptomEntry, TODAY } from "../../utils/mockData";
import { TemperatureBadge } from "../../components/shared/TemperatureBadge";

interface SymptomJournalProps {
  profile: PatientProfile;
  symptomEntries: SymptomEntry[];
  onAddEntry: (e: SymptomEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const SYMPTOMS = [
  { key: "nausea", label: "Nausea", emoji: "🤢" },
  { key: "fatigue", label: "Fatigue", emoji: "😴" },
  { key: "pain", label: "Pain", emoji: "😣" },
  { key: "vomiting", label: "Vomiting", emoji: "🤮" },
  { key: "appetiteLoss", label: "Appetite Loss", emoji: "🍽️" },
  { key: "mouthSores", label: "Mouth Sores", emoji: "👄" },
] as const;

type SymptomKey = (typeof SYMPTOMS)[number]["key"];

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

export function SymptomJournal({ profile, symptomEntries, onAddEntry, onDeleteEntry }: SymptomJournalProps) {
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState("09:00");
  const [temperature, setTemperature] = useState("");
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [intensities, setIntensities] = useState<Record<SymptomKey, number>>({
    nausea: 5, fatigue: 5, pain: 5, vomiting: 5, appetiteLoss: 5, mouthSores: 5,
  });
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const patientEntries = symptomEntries
    .filter((e) => e.patientProfileId === profile.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const toggleSymptom = (key: SymptomKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tempNum = parseFloat(temperature);
  const isTempValid = temperature === "" || (!isNaN(tempNum) && tempNum >= 34.0 && tempNum <= 42.5);
  const canSubmit = isTempValid && (selected.size > 0 || (otherChecked && otherText.trim().length > 0));

  const resetForm = () => {
    setSelected(new Set());
    setOtherChecked(false);
    setOtherText("");
    setNotes("");
    setTemperature("");
    setEditingId(null);
  };

  const handleEdit = (entry: SymptomEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTime(entry.time);
    setTemperature(entry.temperature?.toString() ?? "");
    setNotes(entry.notes ?? "");
    const selectedSet = new Set<SymptomKey>();
    SYMPTOMS.forEach((s) => { if (entry[s.key] > 0) selectedSet.add(s.key); });
    setSelected(selectedSet);
    setIntensities({
      nausea: entry.nausea, fatigue: entry.fatigue, pain: entry.pain,
      vomiting: entry.vomiting, appetiteLoss: entry.appetiteLoss, mouthSores: entry.mouthSores,
    });
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onDeleteEntry(id);
    setDeleteConfirmId(null);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const entry: SymptomEntry = {
      id: editingId ?? `sym-${Date.now()}`,
      patientProfileId: profile.id,
      date,
      time,
      temperature: temperature ? tempNum : undefined,
      nausea: selected.has("nausea") ? intensities.nausea : 0,
      fatigue: selected.has("fatigue") ? intensities.fatigue : 0,
      pain: selected.has("pain") ? intensities.pain : 0,
      vomiting: selected.has("vomiting") ? intensities.vomiting : 0,
      appetiteLoss: selected.has("appetiteLoss") ? intensities.appetiteLoss : 0,
      mouthSores: selected.has("mouthSores") ? intensities.mouthSores : 0,
      notes: notes.trim() || undefined,
    };
    onAddEntry(entry);
    setLoading(false);
    setSubmitted(true);
  };

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
          <button onClick={() => { setSubmitted(false); resetForm(); }} className="px-6 py-3 rounded-xl text-white text-sm" style={{ backgroundColor: "#7CAE8E" }}>
            Log Another Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: "#2D4739" }}>{editingId ? "Edit Symptom Entry" : "Symptom Journal"}</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {editingId ? "Update your symptom entry below." : "How are you feeling today? Your entries help your care team understand patterns."}
        </p>
      </div>

      {editingId && (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#FFFBEB", border: "1.5px solid #FCD34D" }}>
          <span className="text-sm" style={{ color: "#92400E" }}>✏️ Editing mode active</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Date & Time */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-3">When are you logging?</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={TODAY} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "#6B7280" }}>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }} />
            </div>
          </div>
        </div>

        {/* Temperature */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-3">Temperature (optional)</h3>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <input type="number" step="0.1" min="34.0" max="42.5" placeholder="e.g. 37.2 (°C)" value={temperature} onChange={(e) => setTemperature(e.target.value)} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none" style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }} />
              <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>Normal: 36.0–37.5°C. Contact your care team if ≥38°C.</p>
            </div>
            {isTempValid && temperature && !isNaN(tempNum) && <div className="pt-2"><TemperatureBadge temperature={tempNum} /></div>}
          </div>
        </div>

        {/* Symptoms */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-3">Which symptoms are you experiencing?</h3>
          <div className="grid grid-cols-2 gap-2">
            {SYMPTOMS.map((s) => {
              const active = selected.has(s.key);
              return (
                <button key={s.key} type="button" onClick={() => toggleSymptom(s.key)} className="flex items-center gap-2 p-3 rounded-xl text-left transition-all" style={{ backgroundColor: active ? "#D1FAE5" : "#F9FAFB", border: `1.5px solid ${active ? "#7CAE8E" : "#E5E7EB"}` }}>
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm" style={{ color: active ? "#166534" : "#374151" }}>{s.label}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setOtherChecked((p) => !p)} className="col-span-2 flex items-center gap-2 p-3 rounded-xl text-left transition-all" style={{ backgroundColor: otherChecked ? "#FEF9C3" : "#F9FAFB", border: `1.5px solid ${otherChecked ? "#FCD34D" : "#E5E7EB"}` }}>
              <span className="text-lg">✏️</span>
              <span className="text-sm" style={{ color: otherChecked ? "#92400E" : "#374151" }}>Other</span>
            </button>
          </div>
          {otherChecked && (
            <div className="mt-3">
              <input type="text" value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="e.g. tingling in fingers, hair thinning..." className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ backgroundColor: "#FFFBEB", border: "1.5px solid #FCD34D", color: "#374151" }} />
            </div>
          )}
        </div>

        {/* Intensities */}
        {selected.size > 0 && (
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
            <h3 style={{ color: "#374151" }} className="mb-4">Rate the intensity (1–10)</h3>
            <div className="flex flex-col gap-5">
              {SYMPTOMS.filter((s) => selected.has(s.key)).map((s) => {
                const val = intensities[s.key];
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span>{s.emoji}</span><span className="text-sm" style={{ color: "#374151" }}>{s.label}</span></div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: intensityColor(val) }}>{intensityLabel(val)}</span>
                        <span className="text-sm" style={{ color: intensityColor(val) }}>{val}/10</span>
                      </div>
                    </div>
                    <input type="range" min={1} max={10} value={val} onChange={(e) => setIntensities((prev) => ({ ...prev, [s.key]: parseInt(e.target.value) }))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #7CAE8E ${((val - 1) / 9) * 100}%, #E5E7EB ${((val - 1) / 9) * 100}%)`, accentColor: "#7CAE8E" }} />
                    <div className="flex justify-between mt-1"><span className="text-xs" style={{ color: "#D1D5DB" }}>1</span><span className="text-xs" style={{ color: "#D1D5DB" }}>10</span></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="rounded-2xl p-4" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E7EB" }}>
          <h3 style={{ color: "#374151" }} className="mb-2">Additional Notes (optional)</h3>
          <textarea rows={3} placeholder="Describe how you're feeling in your own words..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none" style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB", color: "#374151" }} />
        </div>

        {!isTempValid && temperature && (
          <p className="text-xs text-center rounded-xl px-4 py-2" style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}>Temperature must be between 34.0°C and 42.5°C</p>
        )}

        {editingId && (
          <button type="button" onClick={resetForm} className="w-full py-2.5 rounded-xl text-sm" style={{ backgroundColor: "#E5E7EB", color: "#374151" }}>
            <X className="w-4 h-4 inline mr-1" /> Cancel Edit
          </button>
        )}

        <button type="submit" disabled={!canSubmit || loading} className="w-full py-3.5 rounded-xl text-white text-sm hover:opacity-90 disabled:opacity-40 transition-opacity" style={{ backgroundColor: "#7CAE8E" }}>
          {loading ? "🌿 Saving..." : editingId ? "💾 Update Entry" : "💾 Submit Journal Entry"}
        </button>

        {/* Previous entries */}
        {patientEntries.length > 0 && (
          <div className="mt-2">
            <h3 style={{ color: "#2D4739" }} className="mb-3">Recent Entries</h3>
            <div className="flex flex-col gap-3">
              {patientEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-2xl p-4 relative" style={{ backgroundColor: editingId === entry.id ? "#F0FAF4" : "#F9FAFB", border: `1.5px solid ${editingId === entry.id ? "#7CAE8E" : "#E5E7EB"}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs block mb-1" style={{ color: "#374151" }}>
                        {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {entry.time}
                      </span>
                      {entry.temperature != null && <TemperatureBadge temperature={entry.temperature} size="small" />}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(entry)} className="p-1.5 rounded-lg hover:bg-white" style={{ color: "#7CAE8E" }}><Edit2 className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setDeleteConfirmId(entry.id)} className="p-1.5 rounded-lg hover:bg-white" style={{ color: "#DC2626" }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {SYMPTOMS.map((s) => {
                      const val = entry[s.key];
                      if (!val) return null;
                      return (
                        <span key={s.key} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: intensityColor(val) }}>
                          {s.emoji} {s.label}: {val}/10
                        </span>
                      );
                    })}
                  </div>
                  {entry.notes && <p className="text-xs mt-2 italic" style={{ color: "#6B7280" }}>"{entry.notes}"</p>}

                  {deleteConfirmId === entry.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                      <div className="bg-white rounded-xl p-4 mx-4 max-w-xs">
                        <p className="text-sm mb-4" style={{ color: "#374151" }}>Delete this journal entry?</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setDeleteConfirmId(null)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "#E5E7EB", color: "#374151" }}>Cancel</button>
                          <button type="button" onClick={() => handleDelete(entry.id)} disabled={loading} className="flex-1 px-3 py-2 rounded-lg text-sm text-white disabled:opacity-50" style={{ backgroundColor: "#DC2626" }}>
                            {loading ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
