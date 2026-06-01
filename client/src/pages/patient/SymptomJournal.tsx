import { useState } from 'react';
import { CheckCircle, TrendingDown } from 'lucide-react';
import { Patient } from '../../components/mockData';

interface SymptomJournalProps {
  patient: Patient;
}

const SYMPTOMS = [
  { key: 'nausea', label: 'Nausea', emoji: '🤢' },
  { key: 'fatigue', label: 'Fatigue', emoji: '😴' },
  { key: 'pain', label: 'Pain', emoji: '😣' },
  { key: 'vomiting', label: 'Vomiting', emoji: '🤮' },
  { key: 'appetiteLoss', label: 'Appetite Loss', emoji: '🍽️' },
  { key: 'mouthSores', label: 'Mouth Sores', emoji: '👄' },
] as const;

type SymptomKey = typeof SYMPTOMS[number]['key'];

const intensityLabel = (v: number) => {
  if (v <= 2) return 'Mild';
  if (v <= 5) return 'Moderate';
  if (v <= 8) return 'Severe';
  return 'Very Severe';
};

const intensityColor = (v: number) => {
  if (v <= 2) return '#166534';
  if (v <= 5) return '#92400E';
  if (v <= 8) return '#C2410C';
  return '#991B1B';
};

function CorrelationInsights({ patient }: { patient: Patient }) {
  if (patient.correlationInsights.length === 0) return null;
  return (
    <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingDown className="w-5 h-5" style={{ color: '#7CAE8E' }} />
        <h2 style={{ color: '#2D4739' }}>Correlation Insights</h2>
      </div>
      <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
        Patterns observed from your symptom logs and lab results.
      </p>
      <div className="flex flex-col gap-3">
        {patient.correlationInsights.map((insight, i) => (
          <div key={i} className="rounded-2xl p-3.5" style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #A7F3D0' }}>
            <p className="text-sm" style={{ color: '#374151' }}>📊 {insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SymptomJournal({ patient }: SymptomJournalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState('2026-05-18');
  const [time, setTime] = useState('09:00');
  const [selected, setSelected] = useState<Set<SymptomKey>>(new Set());
  const [intensities, setIntensities] = useState<Record<SymptomKey, number>>({
    nausea: 5, fatigue: 5, pain: 5, vomiting: 5, appetiteLoss: 5, mouthSores: 5,
  });
  const [otherChecked, setOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (key: SymptomKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canSubmit = selected.size > 0 || (otherChecked && otherText.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <CheckCircle className="w-10 h-10" style={{ color: '#7CAE8E' }} />
          </div>
          <div>
            <h2 style={{ color: '#2D4739' }}>Journal Entry Saved 🌿</h2>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
              Thank you for logging how you feel. Your care team can now see your updated symptom data.
            </p>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setSelected(new Set());
              setOtherChecked(false);
              setOtherText('');
              setNotes('');
            }}
            className="px-6 py-3 rounded-xl text-white text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#7CAE8E' }}
          >
            Log Another Entry
          </button>
        </div>
        <CorrelationInsights patient={patient} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: '#2D4739' }}>Symptom Journal</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          How are you feeling today? Your entries help your care team understand patterns.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Date & Time */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
        >
          <h3 style={{ color: '#374151' }} className="mb-3">When are you logging?</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}
                onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
              />
            </div>
          </div>
        </div>

        {/* Symptom Checkboxes */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
        >
          <h3 style={{ color: '#374151' }} className="mb-3">
            Which symptoms are you experiencing?
          </h3>
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
                    backgroundColor: active ? '#D1FAE5' : '#F9FAFB',
                    border: `1.5px solid ${active ? '#7CAE8E' : '#E5E7EB'}`,
                  }}
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm" style={{ color: active ? '#166534' : '#374151' }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
            {/* Other — full width */}
            <button
              type="button"
              onClick={() => setOtherChecked((p) => !p)}
              className="col-span-2 flex items-center gap-2 p-3 rounded-xl text-left transition-all"
              style={{
                backgroundColor: otherChecked ? '#FEF9C3' : '#F9FAFB',
                border: `1.5px solid ${otherChecked ? '#FCD34D' : '#E5E7EB'}`,
              }}
            >
              <span className="text-lg">✏️</span>
              <span className="text-sm" style={{ color: otherChecked ? '#92400E' : '#374151' }}>
                Other
              </span>
            </button>
          </div>

          {otherChecked && (
            <div className="mt-3">
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="e.g. tingling in fingers, hair thinning..."
                className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{
                  backgroundColor: '#FFFBEB',
                  border: '1.5px solid #FCD34D',
                  fontFamily: 'Nunito, sans-serif',
                  color: '#374151',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
                onBlur={(e) => (e.target.style.borderColor = '#FCD34D')}
              />
            </div>
          )}
        </div>

        {/* Intensity Sliders */}
        {selected.size > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
          >
            <h3 style={{ color: '#374151' }} className="mb-4">Rate the intensity (1–10)</h3>
            <div className="flex flex-col gap-5">
              {SYMPTOMS.filter((s) => selected.has(s.key)).map((s) => {
                const val = intensities[s.key];
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{s.emoji}</span>
                        <span className="text-sm" style={{ color: '#374151' }}>
                          {s.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: '#F3F4F6',
                            color: intensityColor(val),
                          }}
                        >
                          {intensityLabel(val)}
                        </span>
                        <span className="text-sm" style={{ color: intensityColor(val) }}>
                          {val}/10
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={val}
                        onChange={(e) =>
                          setIntensities((prev) => ({
                            ...prev,
                            [s.key]: parseInt(e.target.value),
                          }))
                        }
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #7CAE8E ${((val - 1) / 9) * 100}%, #E5E7EB ${((val - 1) / 9) * 100}%)`,
                          accentColor: '#7CAE8E',
                        }}
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: '#D1D5DB' }}>1</span>
                        <span className="text-xs" style={{ color: '#D1D5DB' }}>10</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
        >
          <h3 style={{ color: '#374151' }} className="mb-2">Additional Notes (optional)</h3>
          <textarea
            rows={3}
            placeholder="Describe how you're feeling in your own words..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
            style={{
              backgroundColor: '#F9FAFB',
              border: '1.5px solid #E5E7EB',
              fontFamily: 'Nunito, sans-serif',
              color: '#374151',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
            onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
          />
        </div>

        {!canSubmit && (
          <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
            Please select at least one symptom to continue.
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full py-3.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: '#7CAE8E' }}
        >
          {loading ? '🌿 Saving your entry...' : '💾 Submit Journal Entry'}
        </button>

        {/* Previous entries */}
        {patient.symptomLog.length > 0 && (
          <div className="mt-2">
            <h3 style={{ color: '#2D4739' }} className="mb-3">Recent Entries</h3>
            <div className="flex flex-col gap-3">
              {[...patient.symptomLog].reverse().slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs" style={{ color: '#374151' }}>
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {entry.time}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SYMPTOMS.map((s) => {
                      const val = entry[s.key as keyof typeof entry] as number;
                      if (val === 0) return null;
                      return (
                        <span
                          key={s.key}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: '#F3F4F6',
                            color: intensityColor(val),
                          }}
                        >
                          {s.emoji} {s.label}: {val}/10
                        </span>
                      );
                    })}
                  </div>
                  {entry.notes && (
                    <p className="text-xs mt-2 italic" style={{ color: '#6B7280' }}>
                      "{entry.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      <CorrelationInsights patient={patient} />
    </div>
  );
}
