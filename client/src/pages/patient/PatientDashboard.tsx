import { useState, useEffect } from 'react';
import { CheckSquare, Square, FlaskConical, ChevronRight, Clock, MessageCircle } from 'lucide-react';
import {
  Patient, TreatmentCycle, RadiationPhase, PhysicianNote,
  getCycleStatus, getDayOfCycle, getLabStatus, LAB_NORMS, formatDate,
  getRadiationTodayState, RadiationTodayState, getCompletedSessionCount,
  TODAY,
} from '../../components/mockData';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { UnifiedTimeline } from '../../components/shared/UnifiedTimeline';
import { PatientNavPage } from '../../App';

interface PatientDashboardProps {
  patient: Patient;
  onNavigate: (page: PatientNavPage) => void;
  physicianNotes?: PhysicianNote[];
  onFeverLogged?: (date: string, temp: number) => void;
}

function MedicationChecklist({ patient, showChemo }: { patient: Patient; showChemo: boolean }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecked((p) => ({ ...p, [key]: !p[key] }));

  const chemoMeds = patient.medications.filter((m) => m.type === 'chemo');
  const supportiveMeds = patient.medications.filter((m) => m.type !== 'chemo');

  function MedRow({ name, dose, time, routeTag, isChemo }: {
    name: string; dose: string; time: string; routeTag: string; isChemo: boolean;
  }) {
    const key = `${name}-${time}`;
    const done = checked[key];
    const hour = parseInt(time.split(':')[0]);
    const timeIcon = hour < 12 ? '☀️' : hour >= 18 ? '🌙' : '🕑';
    return (
      <button
        onClick={() => toggle(key)}
        className="flex items-center gap-3 p-3 rounded-2xl text-left w-full transition-all"
        style={{
          backgroundColor: done ? '#D1FAE5' : isChemo ? 'rgba(237,233,254,0.5)' : 'rgba(255,255,255,0.7)',
          border: `1.5px solid ${done ? '#7CAE8E' : isChemo ? '#C4B5FD' : '#E5E7EB'}`,
        }}
      >
        {done
          ? <CheckSquare className="w-4 h-4 shrink-0" style={{ color: '#7CAE8E' }} />
          : <Square className="w-4 h-4 shrink-0" style={{ color: '#D1D5DB' }} />
        }
        <span className="text-sm shrink-0">{timeIcon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm block truncate" style={{
            color: done ? '#166534' : '#374151',
            textDecoration: done ? 'line-through' : 'none',
          }}>
            {name} — {dose}
          </span>
          <span className="text-xs" style={{ color: isChemo ? '#7C3AED' : '#9CA3AF' }}>{routeTag}</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-lg shrink-0" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
          {time}
        </span>
      </button>
    );
  }

  const hasAnything = (showChemo && chemoMeds.length > 0) || supportiveMeds.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="flex flex-col gap-4">
      {showChemo && chemoMeds.length > 0 && (
        <div>
          <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#5B21B6' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
            Active Chemotherapy Protocol — 🏥 Administered at clinic
          </p>
          <div className="flex flex-col gap-2">
            {chemoMeds.map((m) =>
              m.times.map((t) => (
                <MedRow key={`${m.name}-${t}`} name={m.name} dose={m.dose} time={t} routeTag="Via IV (Intravenous)" isChemo />
              ))
            )}
          </div>
        </div>
      )}
      {supportiveMeds.length > 0 && (
        <div>
          <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#374151' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#7CAE8E' }} />
            Supportive &amp; Daily Medications
          </p>
          <div className="flex flex-col gap-2">
            {supportiveMeds.flatMap((m) =>
              m.times.map((t) => (
                <MedRow
                  key={`${m.name}-${t}`} name={m.name} dose={m.dose} time={t}
                  routeTag={m.route === 'IV' ? 'Via IV (Intravenous)' : 'Oral (By Mouth)'}
                  isChemo={false}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CycleCard({ cycle, size }: { cycle: TreatmentCycle; size: 'small' | 'large' }) {
  const status = getCycleStatus(cycle);
  const config = {
    past:   { bg: '#E5E7EB', border: '#D1D5DB', badge: '#6B7280', badgeBg: '#F3F4F6', label: 'Completed', emoji: '✓' },
    active: { bg: '#D1FAE5', border: '#7CAE8E',  badge: '#166534', badgeBg: '#A7F3D0', label: 'Active',    emoji: '🌿' },
    future: { bg: '#DBEAFE', border: '#93C5FD',  badge: '#1E40AF', badgeBg: '#BFDBFE', label: 'Upcoming',  emoji: '📅' },
    held:   { bg: '#FEE2E2', border: '#FCA5A5',  badge: '#991B1B', badgeBg: '#FECACA', label: 'Was Delayed', emoji: '⏸' },
  };
  const c = config[status];
  const dayNum = status === 'active' ? getDayOfCycle(cycle) : null;
  const approval = cycle.approvalStatus;

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{ backgroundColor: c.bg, border: `2px solid ${c.border}`, opacity: status === 'past' ? 0.7 : 1 }}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span>{c.emoji}</span>
            <span className="text-sm" style={{ color: '#374151' }}>Cycle {cycle.number}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.badgeBg, color: c.badge }}>
              {c.label}
            </span>
          </div>
          {status === 'active' && dayNum !== null && (
            <p className="text-xs" style={{ color: '#166534' }}>Day {dayNum} of treatment</p>
          )}
          {status === 'held' && cycle.delayedTo && (
            <p className="text-xs" style={{ color: '#991B1B' }}>Next evaluation: {formatDate(cycle.delayedTo)}</p>
          )}
          {status === 'future' && (
            <p className="text-xs" style={{ color: '#1E40AF' }}>Clinic date: {formatDate(cycle.startDate)}</p>
          )}
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: approval === 'approved' ? '#D1FAE5' : approval === 'held' ? '#FEE2E2' : '#FEF9C3',
            color: approval === 'approved' ? '#166534' : approval === 'held' ? '#991B1B' : '#92400E',
          }}
        >
          {approval === 'approved' ? '✓ Approved' : approval === 'held' ? '⏸ On Hold' : '⏳ Pending Evaluation'}
        </span>
      </div>
      {size === 'large' && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: c.border }}>
          <p className="text-xs mb-1" style={{ color: '#6B7280' }}>
            {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {cycle.drugs.map((d) => (
              <span key={d} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: '#374151' }}>
                {d}
              </span>
            ))}
          </div>
          {status === 'held' && cycle.heldNotes && (
            <p className="text-xs mt-2 italic" style={{ color: '#991B1B' }}>
              Physician note: "{cycle.heldNotes}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Radiation temperature gate component ──────────────────────────────────────
function RadiationGate({
  phase,
  radState,
  tempStr,
  onTempChange,
  onSubmit,
}: {
  phase: RadiationPhase;
  radState: RadiationTodayState;
  tempStr: string;
  onTempChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const completedCount = getCompletedSessionCount(phase);
  const isRecovery = radState.type === 'needs-temp-recovery';
  const tempVal = parseFloat(tempStr);
  const canSubmit = !isNaN(tempVal) && tempVal >= 34 && tempVal <= 42;

  // ── Status result displays ──
  if (radState.type === 'fever-active') {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#FEF2F2', border: '2px solid #FCA5A5' }}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">🚨</span>
          <div>
            <p className="text-sm" style={{ color: '#991B1B' }}>
              Radiation Session {radState.sessionNumber} Postponed — Fever Detected
            </p>
            <p className="text-xs mt-1" style={{ color: '#B91C1C' }}>
              Temperature recorded: <strong>{radState.loggedTemp}°C</strong> (≥38°C threshold).
              Today's radiation session has been automatically canceled.
            </p>
            <p className="text-xs mt-1.5" style={{ color: '#B91C1C' }}>
              A temperature verification check will be required tomorrow. If clear, radiation resumes the following day.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (radState.type === 'cleared-no-session') {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#D1FAE5', border: '2px solid #7CAE8E' }}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <p className="text-sm" style={{ color: '#166534' }}>
              Recovery Verified — Session Blocked Today
            </p>
            <p className="text-xs mt-1" style={{ color: '#166534' }}>
              Temperature: <strong>{radState.loggedTemp}°C</strong> — you have been fever-free for 24 hours.
            </p>
            <p className="text-xs mt-1.5" style={{ color: '#15803D' }}>
              Protocol requires one additional rest day after the recovery check. Radiation session {completedCount + 1} resumes tomorrow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (radState.type === 'session-ok') {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#D1FAE5', border: '2px solid #7CAE8E' }}>
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0">☢️</span>
          <div>
            <p className="text-sm" style={{ color: '#166534' }}>
              Radiation Session {radState.sessionNumber} / {phase.totalSessions} — Cleared to Proceed
            </p>
            <p className="text-xs mt-1" style={{ color: '#166534' }}>
              Temperature: <strong>{radState.loggedTemp}°C</strong> ✓ — attend clinic for today's session.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (radState.type === 'session-done') {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #A7F3D0' }}>
        <p className="text-xs" style={{ color: '#166534' }}>
          ☢️ Radiation Session {radState.sessionNumber} / {phase.totalSessions} — completed today.
        </p>
      </div>
    );
  }

  // ── Temperature input forms ──
  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: isRecovery ? '#FFF7ED' : '#FFFBEB',
        border: `2px solid ${isRecovery ? '#FCD34D' : '#FDE68A'}`,
      }}
    >
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xl shrink-0">{isRecovery ? '⚕️' : '🌡️'}</span>
        <div>
          <p className="text-sm" style={{ color: '#92400E' }}>
            {isRecovery
              ? 'Day 2 — 24-Hour Recovery Verification Check'
              : `Radiation Session ${radState.sessionNumber} / ${phase.totalSessions} — Morning Temperature Required`}
          </p>
          <p className="text-xs mt-1" style={{ color: '#B45309' }}>
            {isRecovery
              ? 'Yesterday\'s fever postponed your session. Enter today\'s temperature to verify recovery. Normal (<38°C) confirms 24 hours fever-free — you will be cleared to resume tomorrow.'
              : 'Enter your temperature before today\'s tasks are unlocked. A reading ≥38°C will postpone today\'s radiation session per clinical protocol.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs mb-1" style={{ color: '#92400E' }}>Temperature (°C)</label>
          <input
            type="number"
            step="0.1"
            min="34"
            max="42"
            placeholder="e.g. 36.8"
            value={tempStr}
            onChange={(e) => onTempChange(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1.5px solid #FCD34D', fontFamily: 'Nunito, sans-serif' }}
            onFocus={(e) => (e.target.style.borderColor = '#F59E0B')}
            onBlur={(e) => (e.target.style.borderColor = '#FCD34D')}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="px-4 py-2.5 rounded-xl text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          style={{ backgroundColor: '#D97706', marginTop: '18px' }}
        >
          Log Temp
        </button>
      </div>

      <p className="text-xs mt-2.5" style={{ color: '#9CA3AF' }}>
        ☢️ Target: {phase.targetArea} · {getCompletedSessionCount(phase)} sessions completed
      </p>
    </div>
  );
}

function NeutropenicCarePanel() {
  return (
    <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: '#FFFBEB', border: '2px solid #FCD34D' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🛡️</span>
        <h2 style={{ color: '#92400E' }}>Safety &amp; Neutropenic Care</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: '#B45309' }}>
        Chemotherapy lowers your immune defenses. Follow these precautions closely.
      </p>
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1.5px solid #FCD34D' }}>
        <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#92400E' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          Immune Protection Reminders
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            '😷  Wear a mask in crowded or enclosed spaces',
            '🧼  Wash hands frequently — before meals and after touching surfaces',
            '🤧  Avoid close contact with people who are sick',
            '🌡️  Report a temperature above 38°C (100.4°F) to your care team immediately',
            '🌸  Avoid fresh flowers and plants — they carry mold and bacteria',
          ].map((item) => (
            <li key={item} className="text-xs" style={{ color: '#78350F' }}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.7)', border: '1.5px solid #FCD34D' }}>
        <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#92400E' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          Dietary Restrictions (Neutropenic Diet)
        </p>
        <ul className="flex flex-col gap-1.5">
          {[
            '🥩  No raw or undercooked meat, poultry, or seafood',
            '🥚  No raw or runny eggs (e.g. sunny-side up)',
            '🧀  Avoid soft cheeses (brie, camembert, blue cheese)',
            '🥗  No unwashed raw fruits or vegetables — rinse and peel everything',
            '🍣  No sushi, sashimi, or raw fish of any kind',
            '🥛  Use only pasteurised dairy products',
          ].map((item) => (
            <li key={item} className="text-xs" style={{ color: '#78350F' }}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="text-xs mt-3 text-center px-2" style={{ color: '#B45309' }}>
        If you're unsure about any food or activity, contact your oncology nurse before proceeding.
      </p>
    </div>
  );
}

export function PatientDashboard({ patient, onNavigate, physicianNotes = [], onFeverLogged }: PatientDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [radTempStr, setRadTempStr] = useState('');
  const [radLocalTemp, setRadLocalTemp] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

  const cycles = patient.cycles;
  const activeCycle = cycles.find((c) => getCycleStatus(c) === 'active');
  const isInTreatment = !!activeCycle;
  const prominentCycle =
    activeCycle ||
    cycles.find((c) => getCycleStatus(c) === 'held') ||
    cycles.find((c) => getCycleStatus(c) === 'future');

  const latestLab = patient.labResults[patient.labResults.length - 1];
  const LAB_SUMMARY_KEYS = ['wbc', 'neutrophils', 'hemoglobin', 'platelets'] as const;

  const clinicAppointmentCycle = cycles.find(
    (c) =>
      (getCycleStatus(c) === 'held' && c.delayedTo === TODAY) ||
      (c.approvalStatus === 'pending' && c.startDate === TODAY),
  );
  const hasClinicAppointmentToday = !!clinicAppointmentCycle;

  // Radiation today state
  const activeRadiation = patient.radiationPhases.find((p) => p.status === 'active') ?? null;
  const radState: RadiationTodayState | null = activeRadiation
    ? getRadiationTodayState(activeRadiation, TODAY, radLocalTemp)
    : null;
  const radNeedsTemp =
    radState?.type === 'needs-temp-morning' || radState?.type === 'needs-temp-recovery';

  const handleRadTempSubmit = () => {
    const val = parseFloat(radTempStr);
    if (!isNaN(val) && val >= 34 && val <= 42) {
      setRadLocalTemp(val);
      if (val >= 38) onFeverLogged?.(TODAY, val);
    }
  };

  const QUICK_LINKS: { page: PatientNavPage; emoji: string; label: string; sub: string }[] = [
    { page: 'patient-cycles',      emoji: '🗓',  label: 'Treatment Cycles',  sub: 'Full protocol roadmap' },
    { page: 'patient-medications', emoji: '💊',  label: 'My Medications',    sub: 'Daily medication list' },
    { page: 'patient-bloodwork',   emoji: '🩸',  label: 'Blood Work',        sub: 'Lab results & trends' },
    { page: 'patient-journal',     emoji: '📓',  label: 'Symptom Journal',   sub: 'Log how you feel' },
    { page: 'patient-calendar',    emoji: '📅',  label: 'Calendar',          sub: 'Treatment schedule' },
    { page: 'patient-messages',    emoji: '💬',  label: 'Ask Oncologist',    sub: 'Questions & answers' },
    { page: 'patient-profile',     emoji: '👤',  label: 'My Profile',        sub: 'Personal & medical info' },
  ];

  const hasMultiModality =
    patient.surgeries.length > 0 || patient.radiationPhases.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Physician Direct Notes — prominent alert if any exist */}
      {physicianNotes.length > 0 && (
        <div
          className="rounded-3xl overflow-hidden shadow-sm"
          style={{ backgroundColor: '#FFFFFF', border: '2px solid #C7D2FE' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2"
            style={{ backgroundColor: '#EEF2FF', borderBottom: '1.5px solid #C7D2FE' }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: '#4338CA' }} />
            <h3 style={{ color: '#3730A3' }}>Notes from Dr. Miriam Goldstein</h3>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#C7D2FE', color: '#3730A3' }}
            >
              📋 {physicianNotes.length} note{physicianNotes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {physicianNotes.map((note) => (
              <div key={note.id} className="flex flex-col gap-1">
                <p className="text-sm" style={{ color: '#374151' }}>{note.text}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {new Date(note.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
            <button
              onClick={() => onNavigate('patient-messages')}
              className="text-xs text-left underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: '#7CAE8E' }}
            >
              Open messages & ask a question →
            </button>
          </div>
        </div>
      )}

      {/* Today Block */}
      <div
        className="rounded-3xl p-5 shadow-sm"
        style={{
          backgroundColor: isInTreatment ? '#D1FAE5' : hasClinicAppointmentToday ? '#FEE2E2' : '#DBEAFE',
          border: `2px solid ${isInTreatment ? '#7CAE8E' : hasClinicAppointmentToday ? '#FCA5A5' : '#93C5FD'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5" style={{ color: isInTreatment ? '#166534' : hasClinicAppointmentToday ? '#991B1B' : '#1E40AF' }} />
          <h2 style={{ color: isInTreatment ? '#166534' : hasClinicAppointmentToday ? '#991B1B' : '#1E40AF' }}>
            Today — {new Date(TODAY).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
        </div>

        {/* Radiation temperature gate — gates ALL active tasks when temp is needed */}
        {activeRadiation && radState && radState.type !== 'skip-day' && radState.type !== 'phase-complete' && radState.type !== 'no-active-phase' && (
          <RadiationGate
            phase={activeRadiation}
            radState={radState}
            tempStr={radTempStr}
            onTempChange={setRadTempStr}
            onSubmit={handleRadTempSubmit}
          />
        )}

        {/* Active tasks — rendered only after temperature gate is resolved */}
        {!radNeedsTemp && (
          <>
            {isInTreatment && activeCycle ? (
              <>
                <div
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full mb-4"
                  style={{ backgroundColor: '#A7F3D0', color: '#166534' }}
                >
                  🌿 Active Treatment — Day {getDayOfCycle(activeCycle)} of Cycle {activeCycle.number}
                </div>
                <h3 className="text-sm mb-2" style={{ color: '#166634' }}>Today's Medication Schedule</h3>
                <MedicationChecklist patient={patient} showChemo={true} />
              </>
            ) : prominentCycle ? (
              <>
                <div
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full mb-3"
                  style={{
                    backgroundColor: hasClinicAppointmentToday ? '#FEE2E2' : '#BFDBFE',
                    color: hasClinicAppointmentToday ? '#991B1B' : '#1E40AF',
                  }}
                >
                  {hasClinicAppointmentToday ? '🏥 Clinic Appointment Today' : '🌙 Rest Window — Recovery Period'}
                </div>

                {hasClinicAppointmentToday ? (
                  <div className="flex flex-col gap-3 mb-3">
                    <div
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: 'rgba(255,255,255,0.75)', border: '2px solid #FCA5A5' }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">🩺</span>
                        <div>
                          <p className="text-sm" style={{ color: '#991B1B' }}>
                            Attend Clinic: Scheduled for Repeat Blood Work &amp; Vitals Evaluation
                          </p>
                          <p className="text-xs mt-1" style={{ color: '#B91C1C' }}>
                            Your physician has scheduled this visit to reassess your treatment readiness.
                          </p>
                        </div>
                      </div>
                    </div>
                    {clinicAppointmentCycle?.heldNotes && (
                      <div
                        className="rounded-2xl px-4 py-3 text-sm italic"
                        style={{ backgroundColor: 'rgba(255,255,255,0.5)', border: '1.5px solid #FCD34D', color: '#92400E' }}
                      >
                        Physician note: "{clinicAppointmentCycle.heldNotes}"
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm mb-3" style={{ color: '#1E40AF' }}>
                    Your next clinic appointment is scheduled for{' '}
                    <strong>{formatDate(prominentCycle.delayedTo || prominentCycle.startDate)}</strong>.
                    Blood work and treatment will both take place on the same day.
                  </p>
                )}
                <MedicationChecklist patient={patient} showChemo={false} />
              </>
            ) : null}
          </>
        )}

        {/* Gate notice when temp entry is still pending */}
        {radNeedsTemp && (
          <p className="text-xs text-center mt-2" style={{ color: '#92400E' }}>
            🔒 Today's medication schedule will appear after your temperature is logged.
          </p>
        )}
      </div>

      {/* Treatment Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ color: '#2D4739' }}>Treatment Timeline</h2>
          <button
            onClick={() => onNavigate('patient-cycles')}
            className="text-sm underline underline-offset-2 transition-opacity hover:opacity-70"
            style={{ color: '#7CAE8E' }}
          >
            Full roadmap →
          </button>
        </div>
        {hasMultiModality ? (
          <UnifiedTimeline patient={patient} compact />
        ) : (
          <div className="flex flex-col gap-3">
            {cycles.map((cycle) => {
              const status = getCycleStatus(cycle);
              const isProminent = cycle.id === prominentCycle?.id;
              const size: 'small' | 'large' = (status === 'active' || isProminent) ? 'large' : 'small';
              return (
                <div key={cycle.id} style={{ opacity: status === 'past' ? 0.65 : 1 }}>
                  <CycleCard cycle={cycle} size={size} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Latest Lab Results */}
      {latestLab && (
        <button
          onClick={() => onNavigate('patient-bloodwork')}
          className="rounded-3xl p-5 shadow-sm text-left w-full transition-all hover:shadow-md hover:scale-[1.01]"
          style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5" style={{ color: '#7CAE8E' }} />
            <h2 style={{ color: '#2D4739' }}>Latest Lab Results</h2>
            <span className="text-xs ml-auto" style={{ color: '#9CA3AF' }}>{formatDate(latestLab.date)}</span>
            <ChevronRight className="w-4 h-4" style={{ color: '#9CA3AF' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {LAB_SUMMARY_KEYS.map((key) => {
              const norm = LAB_NORMS[key];
              const value = latestLab[key as keyof typeof latestLab] as number;
              const status = getLabStatus(key, value);
              return (
                <div
                  key={key}
                  className="rounded-2xl p-3"
                  style={{
                    backgroundColor: status === 'normal' ? '#F0FAF4' : status === 'low' ? '#FEF2F2' : '#FFF7ED',
                    border: `1.5px solid ${status === 'normal' ? '#A7F3D0' : status === 'low' ? '#FCA5A5' : '#FCD34D'}`,
                  }}
                >
                  <p className="text-xs mb-0.5" style={{ color: '#6B7280' }}>{norm.label}</p>
                  <p className="text-base" style={{ color: status === 'normal' ? '#166534' : status === 'low' ? '#DC2626' : '#D97706' }}>
                    {value} <span className="text-xs">{norm.unit}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {status === 'low' ? '▼ Below range' : status === 'high' ? '▲ Above range' : '● Normal'}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-3 text-center" style={{ color: '#7CAE8E' }}>Tap to view full blood work history →</p>
        </button>
      )}

      {/* Safety & Neutropenic Care */}
      <NeutropenicCarePanel />

      {/* Quick Access */}
      <div>
        <h2 className="mb-3" style={{ color: '#2D4739' }}>Quick Access</h2>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {QUICK_LINKS.map(({ page, emoji, label, sub }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="rounded-2xl p-4 text-left transition-all hover:shadow-md"
              style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
            >
              <span className="text-2xl block mb-2">{emoji}</span>
              <p className="text-sm" style={{ color: '#374151' }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
