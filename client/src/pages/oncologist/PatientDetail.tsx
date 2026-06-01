import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Home, AlertTriangle, FlaskConical, UserCircle, MessageCircle, Send, Layers, Upload } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import {
  Patient, Oncologist, TreatmentCycle, LabResult, ClinicalMessage,
  getCycleStatus, formatDate, patients, shiftDate, TODAY,
} from '../../components/mockData';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { LabFolderGrid } from '../../components/shared/LabFolderGrid';
import { PatientProfile } from '../PatientProfile';
import { RibbonBackground } from '../../components/shared/RibbonBackground';
import { UnifiedTimeline, ChemoAuthContext } from '../../components/shared/UnifiedTimeline';

interface PatientDetailProps {
  patientId: string;
  oncologist: Oncologist;
  onBack: () => void;
  onHome: () => void;
  onCycleOverride: (updates: Record<string, Partial<TreatmentCycle>>) => void;
  messages?: ClinicalMessage[];
  onReply?: (patientId: string, text: string) => void;
  onBroadcastNote?: (patientId: string, text: string, oncologistName: string) => void;
}

// File upload for Physician Direct Notes — connects to Multer storage engine on Node.js server
function NoteFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="rounded-xl p-3.5 cursor-pointer transition-all"
      style={{
        border: `2px dashed ${isDragging ? '#4338CA' : '#C7D2FE'}`,
        backgroundColor: isDragging ? '#EEF2FF' : '#F9FAFB',
      }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setIsDragging(false);
        const f = e.dataTransfer.files[0]; if (f) setFile(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
      />
      {file ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Upload className="w-3.5 h-3.5 shrink-0" style={{ color: '#4338CA' }} />
            <span className="text-xs truncate" style={{ color: '#374151' }}>{file.name}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
            className="text-xs shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: '#EF4444' }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Upload className="w-4 h-4 shrink-0" style={{ color: '#6366F1' }} />
          <div>
            <p className="text-xs" style={{ color: '#374151' }}>Upload Clinical Summary / Treatment Documentation</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Drag &amp; drop or click · PDF, DOCX, JPG</p>
          </div>
        </div>
      )}
    </div>
  );
}

const SYMPTOM_LABELS: Record<string, string> = {
  nausea: 'Nausea', fatigue: 'Fatigue', pain: 'Pain',
  vomiting: 'Vomiting', appetiteLoss: 'Appetite Loss', mouthSores: 'Mouth Sores',
};

export function PatientDetail({
  patientId, oncologist, onBack, onHome, onCycleOverride,
  messages = [], onReply, onBroadcastNote,
}: PatientDetailProps) {
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [noteSubmitted, setNoteSubmitted] = useState(false);
  const basePatient = patients.find((p) => p.id === patientId) as Patient;

  const [cycleOverrides, setCycleOverrides] = useState<Record<string, Partial<TreatmentCycle>>>({});
  const [extraLabResults, setExtraLabResults] = useState<LabResult[]>([]);

  // Tracks whether we have already acted on TODAY's lab — null means nothing evaluated yet
  const [lastEvaluatedLabDate, setLastEvaluatedLabDate] = useState<string | null>(null);

  const patient: Patient = {
    ...basePatient,
    cycles: basePatient.cycles.map((c) => ({ ...c, ...(cycleOverrides[c.id] ?? {}) })),
  };

  const allLabResults = [...patient.labResults, ...extraLabResults];

  useEffect(() => { const t = setTimeout(() => setLoading(false), 800); return () => clearTimeout(t); }, []);

  useEffect(() => {
    setCycleOverrides({});
    setExtraLabResults([]);
    setLastEvaluatedLabDate(null);
  }, [patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sequential lock: only the FIRST unresolved pending/held cycle can be authorized
  const firstPendingIdx = patient.cycles.findIndex((c) => {
    const s = getCycleStatus(c);
    return (s === 'future' || s === 'held') && c.approvalStatus !== 'approved';
  });
  const firstPendingCycle = firstPendingIdx >= 0 ? patient.cycles[firstPendingIdx] : null;

  // Same-day rule: treatment date === lab date === evaluation date
  const scheduledDate = firstPendingCycle
    ? (firstPendingCycle.delayedTo || firstPendingCycle.startDate)
    : null;
  const isScheduledDateToday = scheduledDate === TODAY;

  // A "fresh lab for today" means a result whose date is exactly the scheduled clinic date
  const freshLabForToday = allLabResults.find((l) => l.date === TODAY) ?? null;

  // Unevaluated: we have today's lab AND haven't acted on it yet
  const hasUnevaluatedFreshLab = !!freshLabForToday && lastEvaluatedLabDate !== TODAY;

  const hasActiveCycle = patient.cycles.some((c) => getCycleStatus(c) === 'active');

  // Buttons only surface when: not in active treatment, today IS the scheduled date, and fresh lab is present
  const showAuthButtons = !hasActiveCycle && isScheduledDateToday && hasUnevaluatedFreshLab;

  function handleApprove(cycleId: string, _notes: string) {
    const cycleIdx = patient.cycles.findIndex((c) => c.id === cycleId);
    if (cycleIdx < 0) return;

    const cycle = patient.cycles[cycleIdx];
    const originalStart = new Date(cycle.startDate);
    const todayDate = new Date(TODAY);
    const shiftDays = Math.round((todayDate.getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));
    const durationDays = Math.round((new Date(cycle.endDate).getTime() - originalStart.getTime()) / (1000 * 60 * 60 * 24));

    const updates: Record<string, Partial<TreatmentCycle>> = {};
    updates[cycleId] = {
      startDate: TODAY,
      endDate: shiftDate(TODAY, durationDays),
      approvalStatus: 'approved',
      delayedTo: undefined,
      heldNotes: undefined,
    };
    for (let i = cycleIdx + 1; i < patient.cycles.length; i++) {
      const c = patient.cycles[i];
      updates[c.id] = {
        startDate: shiftDate(c.startDate, shiftDays),
        endDate: shiftDate(c.endDate, shiftDays),
      };
    }

    setCycleOverrides((prev) => ({ ...prev, ...updates }));
    onCycleOverride(updates);
    setLastEvaluatedLabDate(TODAY);
  }

  function handleHold(cycleId: string, notes: string, returnDate: string) {
    const updates: Record<string, Partial<TreatmentCycle>> = {
      [cycleId]: { approvalStatus: 'held', heldNotes: notes, delayedTo: returnDate },
    };
    setCycleOverrides((prev) => ({ ...prev, ...updates }));
    onCycleOverride(updates);
    setLastEvaluatedLabDate(TODAY);
  }

  // Simulate receiving today's lab results from the clinic — always dated TODAY (same-day rule)
  function simulateNewLab() {
    const base = allLabResults[allLabResults.length - 1];
    const newLab: LabResult = {
      date: TODAY,
      wbc: parseFloat(((base?.wbc ?? 5.0) + 0.4).toFixed(1)),
      neutrophils: parseFloat(((base?.neutrophils ?? 2.5) + 0.3).toFixed(1)),
      hemoglobin: parseFloat(((base?.hemoglobin ?? 12.0) + 0.2).toFixed(1)),
      platelets: Math.round((base?.platelets ?? 200) + 18),
      alt: Math.round((base?.alt ?? 30) - 2),
      creatinine: base?.creatinine ?? 0.9,
      bloodPressure: '122/80',
      weight: parseFloat(((base?.weight ?? 65.0) - 0.3).toFixed(1)),
      temperature: 36.8,
    };
    // Replace any previously simulated TODAY entry to prevent duplicates
    setExtraLabResults((prev) => [...prev.filter((l) => l.date !== TODAY), newLab]);
  }

  const chartData = allLabResults.map((lab) => ({
    date: new Date(lab.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    WBC: lab.wbc,
    Neutrophils: lab.neutrophils,
    Hemoglobin: lab.hemoglobin,
  }));

  const hasAllergies = patient.allergies.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif', position: 'relative' }}>
      <RibbonBackground />
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: 'rgba(250,248,245,0.96)', backdropFilter: 'blur(8px)', borderColor: '#E5E7EB' }}
      >
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button onClick={onBack} className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-colors hover:bg-gray-100" style={{ color: '#6B7280' }}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button onClick={onHome} className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs transition-colors hover:bg-[#E8F5EE]" style={{ color: '#7CAE8E' }}>
              <Home className="w-4 h-4" />
              Directory
            </button>
          </div>

          <div className="text-center shrink-0">
            <p className="text-sm" style={{ color: '#111827' }}>{patient.fullName}</p>
            <p className="text-xs font-mono" style={{ color: '#6B7280' }}>ת.ז. {patient.nationalId}</p>
            {(patient.cycles.length > 0 || patient.radiationPhases.length > 0 || patient.surgeries.length > 0) && (
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                Protocol:{' '}
                {[
                  patient.cycles.length > 0 && `${patient.cycles.length} Chemo`,
                  patient.radiationPhases.length > 0 && `${patient.radiationPhases.reduce((s, r) => s + r.totalSessions, 0)} Radiation`,
                  patient.surgeries.length > 0 && `${patient.surgeries.length} Surgery`,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs" style={{ color: '#374151' }}>{oncologist.fullName}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Clinical Portal</p>
            </div>
            <button
              onClick={() => setShowProfile((v) => !v)}
              title="View Patient Profile"
              className="p-2 rounded-xl transition-colors hover:bg-[#E8F5EE]"
              style={{ color: showProfile ? '#7CAE8E' : '#9CA3AF' }}
            >
              <UserCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safety bar — Blood Type + Allergies permanently pinned */}
        <div
          className="px-4 py-2 flex items-center gap-3 flex-wrap border-t"
          style={{ borderColor: '#F3F4F6', backgroundColor: hasAllergies ? '#FFF5F5' : '#F0FAF4' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Blood Type:</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' }}>
              🩸 {patient.bloodType}
            </span>
          </div>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasAllergies ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: '#DC2626' }} />
                <span className="text-xs" style={{ color: '#991B1B' }}>Allergies:</span>
                {patient.allergies.map((a) => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }}>
                    {a}
                  </span>
                ))}
              </>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#166534' }}>
                ✓ No Known Allergies
              </span>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="max-w-3xl mx-auto px-4 py-6"><LoadingSpinner message="Loading patient clinical profile..." /></div>
      ) : (
        <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

          {/* Profile overlay */}
          {showProfile && (
            <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: '2px solid #7CAE8E' }}>
              <div className="px-5 pt-4 pb-2 flex items-center justify-between" style={{ backgroundColor: '#F0FAF4' }}>
                <p className="text-xs" style={{ color: '#7CAE8E' }}>Patient Profile</p>
                <button onClick={() => setShowProfile(false)} className="text-xs underline" style={{ color: '#9CA3AF' }}>Close</button>
              </div>
              <div className="p-5 bg-white">
                <PatientProfile patient={patient} viewerRole="oncologist" />
              </div>
            </div>
          )}

          {/* Identity Banner */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 style={{ color: '#111827' }}>{patient.fullName}</h2>
                <p className="text-base mt-0.5 font-mono" style={{ color: '#374151' }}>ת.ז. <strong>{patient.nationalId}</strong></p>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{patient.diagnosis}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>DOB: {formatDate(patient.birthDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Oncologist</p>
                <p className="text-sm" style={{ color: '#374151' }}>{oncologist.fullName}</p>
              </div>
            </div>
          </div>

          {/* Lab Trend Chart */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <h3 style={{ color: '#2D4739' }} className="mb-1">Trend Analysis</h3>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Safe minimums — WBC: 3.0 K/µL · Neutrophils: 1.5 K/µL</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis key="x-axis" dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis key="y-axis" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <Tooltip key="tooltip" contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontFamily: 'Nunito, sans-serif', fontSize: 12 }} />
                <Legend key="legend" wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito, sans-serif' }} />
                <ReferenceLine key="ref-wbc" y={3.0} stroke="#FCA5A5" strokeDasharray="4 2" label={{ value: 'WBC min', position: 'right', fontSize: 10, fill: '#EF4444' }} />
                <ReferenceLine key="ref-neut" y={1.5} stroke="#FCD34D" strokeDasharray="4 2" label={{ value: 'Neut min', position: 'right', fontSize: 10, fill: '#D97706' }} />
                <Line key="line-wbc" type="monotone" dataKey="WBC" stroke="#7CAE8E" strokeWidth={2} dot={{ r: 4, fill: '#7CAE8E' }} />
                <Line key="line-neut" type="monotone" dataKey="Neutrophils" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4, fill: '#F59E0B' }} />
                <Line key="line-hgb" type="monotone" dataKey="Hemoglobin" stroke="#60A5FA" strokeWidth={2} dot={{ r: 4, fill: '#60A5FA' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Laboratory Results — vitals displayed alongside each lab entry */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <h3 style={{ color: '#2D4739' }} className="mb-4">Laboratory Results &amp; Pre-Treatment Vitals</h3>
            <LabFolderGrid labResults={allLabResults} fullMetrics showVitals />
          </div>

          {/* Treatment Protocol & Authorization — merged panel with inline auth */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5" style={{ color: '#7CAE8E' }} />
              <h3 style={{ color: '#2D4739' }}>Treatment Protocol &amp; Authorization</h3>
            </div>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Multi-modality roadmap with inline authorization. When today's lab results arrive, the pending cycle card expands with Approve / Hold controls.
            </p>
            <UnifiedTimeline
              patient={patient}
              compact={false}
              showYouAreHere
              chemoAuthContext={{
                firstPendingCycleId: firstPendingCycle?.id ?? null,
                hasActiveCycle,
                isScheduledDateToday,
                freshLabForToday: !!freshLabForToday,
                hasUnevaluatedFreshLab,
                scheduledDate,
                onSimulateNewLab: simulateNewLab,
                onApprove: (cycleId, notes) => handleApprove(cycleId, notes),
                onHold: (cycleId, notes, date) => handleHold(cycleId, notes, date),
              }}
            />
          </div>

          {/* Symptom History */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <h3 style={{ color: '#2D4739' }} className="mb-4">Symptom Journal History</h3>
            {patient.symptomLog.length === 0 ? (
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No symptom entries recorded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {[...patient.symptomLog].reverse().map((entry) => (
                  <div key={entry.id} className="rounded-2xl p-4" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
                    <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                      {new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} at {entry.time}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(SYMPTOM_LABELS).map(([key, label]) => {
                        const val = entry[key as keyof typeof entry] as number;
                        if (val === 0) return null;
                        const color = val >= 7 ? '#DC2626' : val >= 4 ? '#D97706' : '#16A34A';
                        return (
                          <div key={key}>
                            <p className="text-xs" style={{ color: '#9CA3AF' }}>{label}</p>
                            <p className="text-sm" style={{ color }}>{val}/10</p>
                          </div>
                        );
                      })}
                    </div>
                    {entry.notes && <p className="text-xs mt-2 italic" style={{ color: '#6B7280' }}>"{entry.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correlation Insights */}
          {patient.correlationInsights.length > 0 && (
            <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
              <h3 style={{ color: '#2D4739' }} className="mb-3">System Correlation Analysis</h3>
              <div className="flex flex-col gap-2">
                {patient.correlationInsights.map((insight, i) => (
                  <div key={i} className="rounded-2xl p-3.5" style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #A7F3D0' }}>
                    <p className="text-sm" style={{ color: '#374151' }}>📊 {insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Patient Questions + Reply */}
          <div
            className="rounded-3xl overflow-hidden shadow-sm"
            style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
          >
            <div
              className="px-5 py-3.5 flex items-center gap-2"
              style={{ backgroundColor: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: '#7CAE8E' }} />
              <h3 style={{ color: '#2D4739' }}>Patient Questions</h3>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: messages.length > 0 ? '#D1FAE5' : '#F3F4F6', color: messages.length > 0 ? '#166534' : '#9CA3AF' }}
              >
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {messages.length === 0 ? (
                <p className="text-sm" style={{ color: '#9CA3AF' }}>No messages from this patient yet.</p>
              ) : (
                <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
                  {messages.map((msg) => {
                    const isPatient = msg.fromRole === 'patient';
                    const time = new Date(msg.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
                      new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-4 py-3"
                          style={{
                            backgroundColor: isPatient ? '#F3F4F6' : '#D1FAE5',
                            borderBottomLeftRadius: isPatient ? '4px' : '16px',
                            borderBottomRightRadius: isPatient ? '16px' : '4px',
                          }}
                        >
                          <p className="text-sm" style={{ color: '#374151' }}>{msg.text}</p>
                        </div>
                        <p className="text-xs mt-1 px-1" style={{ color: '#9CA3AF' }}>
                          {isPatient ? patient.fullName.split(' ')[0] : 'You'} · {time}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Reply form */}
              <div
                className="rounded-2xl p-4 mt-1"
                style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}
              >
                <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Reply to patient:</p>
                <div className="flex gap-3 items-end">
                  <textarea
                    rows={2}
                    value={replyDraft}
                    onChange={(e) => setReplyDraft(e.target.value)}
                    placeholder="Write your clinical reply..."
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #E5E7EB', fontFamily: 'Nunito, sans-serif', color: '#374151' }}
                    onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
                    onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                  />
                  <button
                    onClick={() => {
                      const text = replyDraft.trim();
                      if (!text) return;
                      onReply?.(patientId, text);
                      setReplyDraft('');
                    }}
                    disabled={!replyDraft.trim()}
                    className="p-3 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                    style={{ backgroundColor: '#7CAE8E' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Physician Direct Notes Broadcast */}
          <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5" style={{ color: '#4338CA' }} />
              <h3 style={{ color: '#2D4739' }}>Physician Direct Notes</h3>
              <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ backgroundColor: '#EEF2FF', color: '#4338CA' }}>
                Syncs to Patient Dashboard
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
              Broadcast a clinical note directly to this patient's home dashboard. Use for important instructions, dietary guidance, or follow-up reminders.
            </p>

            {noteSubmitted ? (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: '#D1FAE5', border: '1.5px solid #7CAE8E' }}>
                <span className="text-xl">✅</span>
                <div>
                  <p className="text-sm" style={{ color: '#166534' }}>Note broadcast to patient's dashboard.</p>
                  <button
                    onClick={() => setNoteSubmitted(false)}
                    className="text-xs underline mt-0.5"
                    style={{ color: '#7CAE8E' }}
                  >
                    Send another note
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="e.g. Increase fluid intake to 2L/day. Avoid raw foods this week..."
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                  style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB', fontFamily: 'Nunito, sans-serif', color: '#374151' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4338CA')}
                  onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
                />
                <NoteFileUpload />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const text = noteDraft.trim();
                      if (!text) return;
                      onBroadcastNote?.(patientId, text, oncologist.fullName);
                      setNoteDraft('');
                      setNoteSubmitted(true);
                    }}
                    disabled={!noteDraft.trim()}
                    className="px-5 py-2.5 rounded-xl text-white text-sm transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
                    style={{ backgroundColor: '#4338CA' }}
                  >
                    <Send className="w-4 h-4" />
                    Broadcast to Patient
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
