import { useState, useEffect, memo } from "react";
import { Activity, Info } from "lucide-react";
import { getPatientSymptoms } from "../../services/symptomService";
import ErrorMessage from "../common/ErrorMessage";
import type { SymptomLog, SymptomItem } from "../../types/api";

interface SymptomJournalPanelProps {
  patientId: string;
}

const SYMPTOM_META: Record<string, { label: string; emoji: string }> = {
  nausea:        { label: "Nausea",       emoji: "🤢" },
  fatigue:       { label: "Fatigue",      emoji: "😴" },
  pain:          { label: "Pain",         emoji: "😣" },
  vomiting:      { label: "Vomiting",     emoji: "🤮" },
  appetite_loss: { label: "Appetite Loss",emoji: "🍽️" },
  mouth_sores:   { label: "Mouth Sores",  emoji: "👄" },
  other:         { label: "Other",        emoji: "✏️" },
};

const intensityColor = (v: number) => {
  if (v <= 2) return "#166534";
  if (v <= 5) return "#92400E";
  if (v <= 8) return "#C2410C";
  return "#991B1B";
};

const intensityLabel = (v: number) => {
  if (v <= 2) return "Mild";
  if (v <= 5) return "Moderate";
  if (v <= 8) return "Severe";
  return "Very Severe";
};

function formatLogDate(isoString: string) {
  const d = new Date(isoString);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) +
    " at " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

const SymptomBadge = memo(function SymptomBadge({ item }: { item: SymptomItem }) {
  const meta = SYMPTOM_META[item.type] ?? { label: item.type, emoji: "•" };
  const label = item.type === "other" && item.customSymptom ? item.customSymptom : meta.label;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: "#F3F4F6", color: intensityColor(item.severity) }}
    >
      {meta.emoji} {label}: {item.severity}/10
      <span className="text-[10px] opacity-70">({intensityLabel(item.severity)})</span>
    </span>
  );
});

const EntryCard = memo(function EntryCard({ entry }: { entry: SymptomLog }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "#F9FAFB", border: "1.5px solid #E5E7EB" }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: "#374151" }}>
        {formatLogDate(entry.logDate)}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {entry.symptoms.map((item, i) => (
          <SymptomBadge key={`${item.type}-${i}`} item={item} />
        ))}
      </div>
      {entry.notes && (
        <p className="text-xs italic mt-2" style={{ color: "#6B7280" }}>
          "{entry.notes}"
        </p>
      )}
    </div>
  );
});

export function SymptomJournalPanel({ patientId }: SymptomJournalPanelProps) {
  const [entries, setEntries] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getPatientSymptoms(patientId)
      .then((res) => { if (!cancelled) setEntries(res.symptomLogs); })
      .catch(() => { if (!cancelled) setError("Failed to load symptom entries."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [patientId]);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F2EE]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-[#7CAE8E]" />
            <h3 className="text-sm font-semibold text-[#2C3E2D]">Symptom Journal</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-2 py-0.5 rounded-full border border-[#E5E2DC]">
            <Info size={10} /> Patient-reported
          </span>
        </div>
        {!loading && !error && (
          <span className="text-xs text-[#9CA3AF]">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-[#9CA3AF]">
            Loading symptom entries...
          </div>
        ) : error ? (
          <ErrorMessage message={error} className="rounded-xl" />
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#9CA3AF]">
            <div className="mx-auto mb-2 w-8 h-8 rounded-full bg-[#F5F2EE] border border-[#E5E2DC] flex items-center justify-center text-[#7CAE8E]">
              <Activity size={16} />
            </div>
            No symptom entries from this patient yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <EntryCard key={entry._id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
