import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Patient, TreatmentCycle, RadiationPhase, SurgeryCheckpoint,
  getCycleStatus, getDayOfCycle, formatDate, getCompletedSessionCount, shiftDate, TODAY,
} from '../../components/mockData';

interface TreatmentCalendarProps {
  patient: Patient;
  feverEvents?: { date: string; temp: number }[];
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

type DayState = 'approved-treatment' | 'pending-scheduled' | 'held' | 'rest';

function resolveDayState(dateStr: string, cycles: TreatmentCycle[]): { state: DayState; cycle: TreatmentCycle | null } {
  const cycle = cycles.find((c) => dateStr >= c.startDate && dateStr <= c.endDate) ?? null;
  if (!cycle) return { state: 'rest', cycle: null };
  if (cycle.approvalStatus === 'approved') return { state: 'approved-treatment', cycle };
  if (cycle.approvalStatus === 'held') return { state: 'held', cycle };
  return { state: 'pending-scheduled', cycle };
}

type RadiationMarker = 'completed' | 'fever-postponed' | 'recovery-check' | 'scheduled' | null;

interface DayExtras {
  radiationMarker: RadiationMarker;
  radiationPhase: RadiationPhase | null;
  feverTemp?: number;
  surgery: SurgeryCheckpoint | null;
}

// Build the set of future scheduled radiation dates accounting for all fever+recovery skips
function computeScheduledDates(
  phase: RadiationPhase,
  feverEvents: { date: string; temp: number }[],
): Set<string> {
  // All fever dates: from dailyLogs + new UI events
  const feverDates = new Set([
    ...phase.dailyLogs.filter((l) => l.sessionStatus === 'fever-postponed').map((l) => l.date),
    ...feverEvents.map((e) => e.date),
  ]);
  // Recovery dates: day after each fever date
  const recoveryDates = new Set([...feverDates].map((d) => shiftDate(d, 1)));

  // Already-logged dates (completed, fever, recovery, etc.) — don't re-schedule
  const loggedDates = new Set(phase.dailyLogs.map((l) => l.date));
  // New fever events are not yet in logs but should be skipped
  feverEvents.forEach((e) => loggedDates.add(e.date));

  const completedCount = phase.dailyLogs.filter((l) => l.sessionStatus === 'completed').length;
  const remaining = phase.totalSessions - completedCount;

  const scheduled = new Set<string>();
  let cursor = TODAY < phase.plannedStartDate ? phase.plannedStartDate : TODAY;
  let count = 0;
  let guard = 365;

  while (count < remaining && guard-- > 0) {
    const dow = new Date(cursor).getDay();
    if (
      !phase.skipWeekdays.includes(dow) &&
      !feverDates.has(cursor) &&
      !recoveryDates.has(cursor) &&
      !loggedDates.has(cursor)
    ) {
      scheduled.add(cursor);
      count++;
    }
    cursor = shiftDate(cursor, 1);
  }
  return scheduled;
}

function resolveDayExtras(
  dateStr: string,
  patient: Patient,
  feverEvents: { date: string; temp: number }[] = [],
): DayExtras {
  let radiationMarker: RadiationMarker = null;
  let radiationPhase: RadiationPhase | null = null;
  let feverTemp: number | undefined;

  for (const phase of patient.radiationPhases) {
    // 1. Authoritative: use stored log if one exists for this date
    const log = phase.dailyLogs.find((l) => l.date === dateStr);
    if (log) {
      if (log.sessionStatus === 'fever-postponed') {
        radiationMarker = 'fever-postponed';
        feverTemp = log.temperature ?? undefined;
      } else if (log.sessionStatus === 'cleared-no-session') {
        radiationMarker = 'recovery-check';
      } else if (log.sessionStatus === 'completed') {
        radiationMarker = 'completed';
      } else {
        radiationMarker = 'scheduled';
      }
      radiationPhase = phase;
      break;
    }

    // 2. New fever logged in UI for this date
    const newFever = feverEvents.find((e) => e.date === dateStr);
    if (newFever) {
      radiationMarker = 'fever-postponed';
      feverTemp = newFever.temp;
      radiationPhase = phase;
      break;
    }

    // 3. Check if this is a recovery day (day after any fever date)
    const allFeverDates = [
      ...phase.dailyLogs.filter((l) => l.sessionStatus === 'fever-postponed').map((l) => l.date),
      ...feverEvents.map((e) => e.date),
    ];
    if (allFeverDates.some((d) => shiftDate(d, 1) === dateStr)) {
      radiationMarker = 'recovery-check';
      radiationPhase = phase;
      break;
    }

    // 4. Check if this is a computed future session date
    const scheduledDates = computeScheduledDates(phase, feverEvents);
    if (scheduledDates.has(dateStr)) {
      radiationMarker = 'scheduled';
      radiationPhase = phase;
      break;
    }
  }

  const surgery = patient.surgeries.find((s) => s.date === dateStr) ?? null;
  return { radiationMarker, radiationPhase, feverTemp, surgery };
}

// ── Minimalist calendar cell icons ────────────────────────────────────────────

function IVDripIcon({ color }: { color: string }) {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="0.5" width="5" height="4" rx="1" fill={color} />
      <line x1="4" y1="4.5" x2="4" y2="7.5" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="4" cy="9" rx="1.8" ry="1" fill={color} />
    </svg>
  );
}

function RadiationBeamIcon({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill={color} xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="5" r="1.5" />
      <path d="M5 5 L9 2.5 A4.5 4.5 0 0 1 9.5 5.5 L5 5Z" />
      <path d="M5 5 L8 8.5 A4.5 4.5 0 0 1 1.5 9 L5 5Z" />
      <path d="M5 5 L0.5 4.5 A4.5 4.5 0 0 1 2 1 L5 5Z" />
    </svg>
  );
}

function ScalpelIcon({ color }: { color: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="0.5" width="1" height="8" rx="0.5" fill={color} />
      <rect x="0.5" y="4" width="8" height="1" rx="0.5" fill={color} />
    </svg>
  );
}

function PillIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="6" viewBox="0 0 11 6" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="10" height="5" rx="2.5" fill={color} opacity="0.25" />
      <rect x="0.5" y="0.5" width="10" height="5" rx="2.5" stroke={color} strokeWidth="0.8" />
      <line x1="5.5" y1="0.5" x2="5.5" y2="5.5" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}

function ThermometerIcon({ color }: { color: string }) {
  return (
    <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0.5" width="3" height="7" rx="1.5" stroke={color} strokeWidth="0.8" />
      <line x1="3.5" y1="4" x2="3.5" y2="7" stroke={color} strokeWidth="0.8" />
      <circle cx="3.5" cy="9" r="1.8" fill={color} />
    </svg>
  );
}

function RecoveryCheckIcon({ color }: { color: string }) {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="4.5" cy="4.5" r="4" stroke={color} strokeWidth="0.8" />
      <path d="M2.5 4.5 L4 6 L6.5 3" stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MedRow({ name, dose, time, isChemo }: { name: string; dose: string; time: string; isChemo: boolean }) {
  const hour = parseInt(time.split(':')[0]);
  const timeIcon = hour < 12 ? '☀️' : hour >= 18 ? '🌙' : '🕑';
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        backgroundColor: isChemo ? 'rgba(237,233,254,0.5)' : 'rgba(255,255,255,0.7)',
        border: `1.5px solid ${isChemo ? '#C4B5FD' : '#E5E7EB'}`,
      }}
    >
      <span className="text-sm shrink-0">{timeIcon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: '#374151' }}>{name} — {dose}</p>
        <p className="text-xs" style={{ color: isChemo ? '#7C3AED' : '#9CA3AF' }}>
          {isChemo ? 'Via IV (Intravenous) · Clinic' : 'Oral (By Mouth)'}
        </p>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-lg shrink-0" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
        {time}
      </span>
    </div>
  );
}

function SupportiveMedsList({ patient }: { patient: Patient }) {
  const supportiveMeds = patient.medications.filter((m) => m.type !== 'chemo');
  if (supportiveMeds.length === 0) return null;
  return (
    <div>
      <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#374151' }}>
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#7CAE8E' }} />
        Supportive &amp; Daily Medications
      </p>
      <div className="flex flex-col gap-2">
        {supportiveMeds.flatMap((m) =>
          m.times.map((t) => (
            <MedRow key={`${m.name}-${t}`} name={m.name} dose={m.dose} time={t} isChemo={false} />
          ))
        )}
      </div>
    </div>
  );
}

function DayDetailCard({ dateStr, dayState, cycle, patient, extras, onClose }: {
  dateStr: string;
  dayState: DayState;
  cycle: TreatmentCycle | null;
  patient: Patient;
  extras: DayExtras;
  onClose: () => void;
}) {
  const isPast = dateStr < TODAY;
  const isToday = dateStr === TODAY;
  const chemoMeds = patient.medications.filter((m) => m.type === 'chemo');

  const dateLabel = new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (dayState === 'approved-treatment' && cycle) {
    const dayNum = getDayOfCycle(cycle, dateStr);
    const headerBg = isPast ? '#F3F4F6' : isToday ? '#D1FAE5' : '#F0FAF4';
    const headerBorder = isPast ? '#D1D5DB' : isToday ? '#7CAE8E' : '#A7F3D0';
    const headerColor = isPast ? '#6B7280' : '#166534';
    const statusLabel = isPast ? '✓ Completed' : isToday ? '🌿 Active Treatment' : '🌿 Approved Treatment';

    return (
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: `2px solid ${headerBorder}` }}>
        <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: headerBg }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: headerColor }}>{statusLabel}</p>
            <p className="text-sm" style={{ color: headerColor }}>{dateLabel}</p>
            <p className="text-xs mt-1" style={{ color: headerColor }}>
              Day {dayNum} of Cycle {cycle.number}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" style={{ color: headerColor }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {extras.radiationPhase && extras.radiationMarker && (
          <div
            className="px-5 py-3"
            style={{
              backgroundColor: extras.radiationMarker === 'fever-postponed' ? '#FEF2F2'
                : extras.radiationMarker === 'completed' ? '#F0FAF4' : '#FFF7ED',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <p className="text-xs" style={{ color: extras.radiationMarker === 'fever-postponed' ? '#991B1B' : extras.radiationMarker === 'completed' ? '#166534' : '#92400E' }}>
              {extras.radiationMarker === 'fever-postponed' ? '🚨 Radiation Postponed — Fever' : '☢️ Also a Radiation Session Day'}
              {' '}· {extras.radiationPhase.label}
            </p>
          </div>
        )}

        <div className="p-4 flex flex-col gap-4" style={{ backgroundColor: '#FFFFFF' }}>
          {chemoMeds.length > 0 && (
            <div>
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#5B21B6' }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
                Chemotherapy Protocol — Administered at Clinic
              </p>
              <div className="flex flex-col gap-2">
                {chemoMeds.map((m) =>
                  m.times.map((t) => (
                    <MedRow key={`${m.name}-${t}`} name={m.name} dose={m.dose} time={t} isChemo />
                  ))
                )}
              </div>
            </div>
          )}
          <SupportiveMedsList patient={patient} />
        </div>

        {isPast && (
          <div
            className="px-5 py-3 text-xs text-center"
            style={{ backgroundColor: '#F9FAFB', color: '#9CA3AF', borderTop: '1px solid #F3F4F6' }}
          >
            Historical record — Cycle {cycle.number} completed {formatDate(cycle.endDate)}
          </div>
        )}
      </div>
    );
  }

  if ((dayState === 'pending-scheduled' || dayState === 'held') && cycle) {
    const isHeld = dayState === 'held';
    const headerBg = isHeld ? '#FFF7ED' : '#EFF6FF';
    const headerBorder = isHeld ? '#FCD34D' : '#BFDBFE';
    const headerColor = isHeld ? '#92400E' : '#1E40AF';
    const statusLabel = isHeld ? '⏸ On Hold — Rescheduled' : '📋 Scheduled — Pending Oncologist Clearance';

    return (
      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: `2px solid ${headerBorder}` }}>
        <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: headerBg }}>
          <div>
            <p className="text-xs mb-0.5" style={{ color: headerColor }}>{statusLabel}</p>
            <p className="text-sm" style={{ color: headerColor }}>{dateLabel}</p>
            <p className="text-xs mt-1" style={{ color: headerColor }}>
              Cycle {cycle.number} · {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" style={{ color: headerColor }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="px-5 py-3 flex items-start gap-2"
          style={{ backgroundColor: isHeld ? '#FFFBEB' : '#EFF6FF', borderBottom: `1px solid ${headerBorder}` }}
        >
          <span className="text-sm shrink-0">{isHeld ? '⚠️' : 'ℹ️'}</span>
          <p className="text-xs" style={{ color: headerColor }}>
            {isHeld
              ? `This cycle is currently on hold. Your oncologist will reassess on ${cycle.delayedTo ? formatDate(cycle.delayedTo) : 'a rescheduled date'}.`
              : 'This treatment block is a projected schedule. Chemotherapy cannot be administered until your oncologist provides clinical clearance on the day of your appointment.'}
          </p>
        </div>

        <div className="p-4 flex flex-col gap-4" style={{ backgroundColor: '#FFFFFF' }}>
          {cycle.drugs.length > 0 && (
            <div>
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                Tentative Chemotherapy Protocol (Requires Approval)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cycle.drugs.map((d) => (
                  <span
                    key={d}
                    className="text-xs px-3 py-1.5 rounded-xl"
                    style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF', border: '1.5px solid #E5E7EB' }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          <SupportiveMedsList patient={patient} />
        </div>
      </div>
    );
  }

  const SurgeryPanel = extras.surgery ? (
    <div
      className="px-5 py-3 flex items-start gap-3"
      style={{
        backgroundColor: extras.surgery.status === 'completed' ? '#EFF6FF' : '#EEF2FF',
        borderBottom: '1px solid #BFDBFE',
      }}
    >
      <span className="text-lg shrink-0">🔪</span>
      <div>
        <p className="text-sm" style={{ color: '#1D4ED8' }}>
          {extras.surgery.procedureType}
          {' '}
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
            {extras.surgery.status}
          </span>
        </p>
        {extras.surgery.surgeon && (
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{extras.surgery.surgeon}</p>
        )}
        {extras.surgery.notes && (
          <p className="text-xs mt-1 italic" style={{ color: '#6B7280' }}>{extras.surgery.notes}</p>
        )}
      </div>
    </div>
  ) : null;

  const RadiationPanel = extras.radiationPhase && extras.radiationMarker ? (() => {
    const phase = extras.radiationPhase!;
    const marker = extras.radiationMarker;
    const completedCount = getCompletedSessionCount(phase);
    const bgColor = marker === 'fever-postponed' ? '#FEF2F2'
      : marker === 'recovery-check' ? '#FFFBEB'
      : marker === 'completed' ? '#F0FAF4' : '#FFF7ED';
    const borderColor = marker === 'fever-postponed' ? '#FCA5A5'
      : marker === 'recovery-check' ? '#FDE68A'
      : marker === 'completed' ? '#A7F3D0' : '#FDE68A';
    const textColor = marker === 'fever-postponed' ? '#991B1B'
      : marker === 'recovery-check' ? '#92400E'
      : marker === 'completed' ? '#166534' : '#92400E';
    const label = marker === 'fever-postponed'
      ? `🌡️ Radiation Postponed — Fever${extras.feverTemp ? ` (${extras.feverTemp}°C)` : ''}`
      : marker === 'recovery-check' ? '⏱ Recovery Check Day — No Radiation Session'
      : marker === 'completed' ? `☢️ Radiation Session ${completedCount}/${phase.totalSessions} — Completed`
      : `☢️ Radiation Session ${completedCount + 1}/${phase.totalSessions} — Scheduled`;
    return (
      <div
        className="px-5 py-3"
        style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}
      >
        <p className="text-sm" style={{ color: textColor }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
          {phase.label} · Target: {phase.targetArea}
        </p>
        {marker === 'fever-postponed' && (
          <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>
            24-hour fever-free recovery check required before resuming. Sessions shifted forward by 2 days.
          </p>
        )}
        {marker === 'recovery-check' && (
          <p className="text-xs mt-0.5" style={{ color: '#92400E' }}>
            Log a normal temperature today to confirm recovery. Sessions resume the next working day.
          </p>
        )}
      </div>
    );
  })() : null;

  const restBorder = extras.surgery ? '#BFDBFE'
    : extras.radiationMarker === 'fever-postponed' ? '#FCA5A5'
    : extras.radiationMarker === 'recovery-check' ? '#FDE68A'
    : '#E5E7EB';
  const restHeaderBg = extras.surgery ? '#EFF6FF'
    : extras.radiationMarker === 'fever-postponed' ? '#FEF2F2'
    : extras.radiationMarker === 'recovery-check' ? '#FFFBEB'
    : '#F9FAFB';
  const restTitle = extras.surgery
    ? '🔪 Surgery Day'
    : extras.radiationMarker === 'fever-postponed' ? '🌡️ Fever — Radiation Postponed'
    : extras.radiationMarker === 'recovery-check' ? '⏱ Recovery Check Day'
    : extras.radiationMarker === 'completed' ? '☢️ Radiation Session Day'
    : extras.radiationMarker === 'scheduled' ? '☢️ Radiation Scheduled'
    : '🛌 Rest Period';

  return (
    <div className="rounded-3xl overflow-hidden shadow-sm" style={{ border: `2px solid ${restBorder}` }}>
      <div className="px-5 py-4 flex items-start justify-between" style={{ backgroundColor: restHeaderBg }}>
        <div>
          <p className="text-xs mb-0.5" style={{ color: '#6B7280' }}>{restTitle}</p>
          <p className="text-sm" style={{ color: '#374151' }}>{dateLabel}</p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            {extras.surgery ? 'Surgical procedure day' :
             extras.radiationMarker ? `${extras.radiationPhase?.label ?? 'Radiation'}` :
             'No chemotherapy scheduled — routine home care day'}
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors" style={{ color: '#9CA3AF' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {SurgeryPanel}
      {RadiationPanel}

      <div className="p-4" style={{ backgroundColor: '#FFFFFF' }}>
        <SupportiveMedsList patient={patient} />
      </div>
    </div>
  );
}

export function TreatmentCalendar({ patient, feverEvents = [] }: TreatmentCalendarProps) {
  const todayDate = new Date(TODAY);
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allCycles = patient.cycles;
  const supportiveMeds = patient.medications.filter((m) => m.type !== 'chemo');
  const hasDailyMeds = supportiveMeds.length > 0;
  const hasRadiation = patient.radiationPhases.length > 0;
  const hasSurgery = patient.surgeries.length > 0;

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateStr(viewYear, viewMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  function getCellStyle(dateStr: string) {
    const { state } = resolveDayState(dateStr, allCycles);
    const extras = resolveDayExtras(dateStr, patient, feverEvents);
    const isToday = dateStr === TODAY;
    const isPast = dateStr < TODAY;
    const isSelected = dateStr === selectedDate;

    let bg = 'transparent';
    let borderColor = 'transparent';
    let dotColor: string | null = null;
    let dotType: 'chemo' | 'med' | null = null;
    let textColor = isPast ? '#D1D5DB' : '#374151';
    let feverIcon = false;
    let recoveryIcon = false;

    if (extras.surgery) {
      bg = extras.surgery.status === 'completed' ? '#EFF6FF' : '#EEF2FF';
      borderColor = extras.surgery.status === 'completed' ? '#BFDBFE' : '#C7D2FE';
      textColor = isPast ? '#9CA3AF' : '#1D4ED8';
    } else if (extras.radiationMarker === 'fever-postponed') {
      bg = '#FEF2F2'; borderColor = '#FCA5A5'; textColor = '#991B1B'; feverIcon = true;
    } else if (extras.radiationMarker === 'recovery-check') {
      bg = '#FFFBEB'; borderColor = '#FDE68A'; textColor = '#92400E'; recoveryIcon = true;
    } else {
      switch (state) {
        case 'approved-treatment':
          if (isPast) { bg = '#F3F4F6'; borderColor = '#E5E7EB'; dotColor = '#9CA3AF'; dotType = 'chemo'; textColor = '#9CA3AF'; }
          else if (isToday) { bg = '#D1FAE5'; borderColor = '#7CAE8E'; dotColor = '#166534'; dotType = 'chemo'; textColor = '#166534'; }
          else { bg = '#F0FAF4'; borderColor = '#A7F3D0'; dotColor = '#7CAE8E'; dotType = 'chemo'; textColor = '#374151'; }
          break;
        case 'pending-scheduled':
          if (isPast) { bg = '#F3F4F6'; borderColor = '#E5E7EB'; dotColor = '#9CA3AF'; dotType = 'chemo'; textColor = '#9CA3AF'; }
          else { bg = '#EFF6FF'; borderColor = '#BFDBFE'; dotColor = '#93C5FD'; dotType = 'chemo'; textColor = '#374151'; }
          break;
        case 'held':
          bg = '#FFF7ED'; borderColor = '#FED7AA'; dotColor = '#FB923C'; dotType = 'chemo';
          textColor = isPast ? '#9CA3AF' : '#374151';
          break;
        case 'rest':
          bg = isToday ? 'rgba(124,174,142,0.10)' : 'transparent';
          borderColor = isToday ? '#7CAE8E' : 'transparent';
          dotColor = hasDailyMeds ? '#D1D5DB' : null;
          dotType = hasDailyMeds ? 'med' : null;
          textColor = isPast ? '#D1D5DB' : '#374151';
          break;
      }
    }

    // Radiation dot only for completed/scheduled — fever/recovery get dedicated icons
    const radiationDot: string | null =
      extras.radiationMarker === 'completed' ? '#F59E0B'
      : extras.radiationMarker === 'scheduled' ? '#FCD34D'
      : null;

    const surgeryDot: string | null = extras.surgery ? '#93C5FD' : null;

    if (isSelected) borderColor = '#2D4739';

    return { bg, border: `1.5px solid ${borderColor}`, dotColor, dotType, radiationDot, surgeryDot, feverIcon, recoveryIcon, textColor, isSelected, state };
  }

  const selectedDayInfo = selectedDate ? resolveDayState(selectedDate, allCycles) : null;
  const selectedExtras = selectedDate ? resolveDayExtras(selectedDate, patient, feverEvents) : null;

  // Show fever shift notice when active radiation phase has any fever events (logged or new)
  const activePhase = patient.radiationPhases.find((p) => p.status === 'active');
  const seededFeverCount = activePhase
    ? activePhase.dailyLogs.filter((l) => l.sessionStatus === 'fever-postponed').length
    : 0;
  const hasFeverShift = (seededFeverCount > 0 || feverEvents.length > 0) && !!activePhase;
  const totalFeverCount = seededFeverCount + feverEvents.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: '#2D4739' }}>Treatment Calendar</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Tap any date to view your medication schedule and treatment status for that day.
        </p>
      </div>

      {/* Fever displacement notice */}
      {hasFeverShift && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5' }}>
          <span className="text-sm mt-0.5 shrink-0">🌡️</span>
          <div>
            <p className="text-xs" style={{ color: '#991B1B' }}>
              <strong>Schedule Dynamically Adjusted:</strong> {totalFeverCount} fever postponement{totalFeverCount > 1 ? 's' : ''} recorded during your active radiation phase.
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#BE123C' }}>
              Remaining sessions have been recalculated — fever &amp; recovery check days are excluded from the radiation grid below.
            </p>
          </div>
        </div>
      )}

      {/* Calendar card */}
      <div className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm" style={{ color: '#2D4739' }}>{monthLabel}</span>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DOW_LABELS.map((d) => (
            <div key={d} className="text-center py-1">
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((dateStr, i) => {
            if (!dateStr) return <div key={`empty-${i}`} />;

            const dayNum = parseInt(dateStr.split('-')[2]);
            const cellInfo = getCellStyle(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                className="relative flex flex-col items-center justify-center rounded-xl transition-all hover:opacity-80"
                style={{
                  aspectRatio: '1',
                  backgroundColor: cellInfo.bg,
                  border: cellInfo.border,
                  cursor: 'pointer',
                  outline: cellInfo.isSelected ? '2px solid #2D4739' : 'none',
                  outlineOffset: '1px',
                }}
              >
                <span
                  className="text-xs"
                  style={{
                    color: cellInfo.textColor,
                    fontWeight: dateStr === TODAY ? 700 : 400,
                  }}
                >
                  {dayNum}
                </span>
                {/* Icon indicator row */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {cellInfo.feverIcon && <ThermometerIcon color="#EF4444" />}
                  {cellInfo.recoveryIcon && <RecoveryCheckIcon color="#D97706" />}
                  {!cellInfo.feverIcon && !cellInfo.recoveryIcon && cellInfo.dotColor && cellInfo.dotType === 'chemo' && (
                    <IVDripIcon color={cellInfo.dotColor} />
                  )}
                  {!cellInfo.feverIcon && !cellInfo.recoveryIcon && cellInfo.dotColor && cellInfo.dotType === 'med' && (
                    <PillIcon color={cellInfo.dotColor} />
                  )}
                  {cellInfo.radiationDot && (
                    <RadiationBeamIcon color={cellInfo.radiationDot} />
                  )}
                  {cellInfo.surgeryDot && (
                    <ScalpelIcon color={cellInfo.surgeryDot} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid #F3F4F6' }}>
          {[
            { color: '#D1FAE5', border: '#7CAE8E', label: 'Active / Approved' },
            { color: '#EFF6FF', border: '#BFDBFE', label: 'Scheduled' },
            { color: '#FFF7ED', border: '#FED7AA', label: 'On Hold' },
            { color: '#F3F4F6', border: '#E5E7EB', label: 'Completed' },
          ].map(({ color, border, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: color, border: `1px solid ${border}` }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <IVDripIcon color="#7CAE8E" />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Chemo IV</span>
          </div>
          {hasRadiation && (
            <>
              <div className="flex items-center gap-1.5">
                <RadiationBeamIcon color="#F59E0B" />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Radiation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ThermometerIcon color="#EF4444" />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Fever postponed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RecoveryCheckIcon color="#D97706" />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Recovery check</span>
              </div>
            </>
          )}
          {hasSurgery && (
            <div className="flex items-center gap-1.5">
              <ScalpelIcon color="#93C5FD" />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>Surgery</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <PillIcon color="#D1D5DB" />
            <span className="text-xs" style={{ color: '#9CA3AF' }}>Medications</span>
          </div>
        </div>
      </div>

      {selectedDate && selectedDayInfo && (
        <DayDetailCard
          dateStr={selectedDate}
          dayState={selectedDayInfo.state}
          cycle={selectedDayInfo.cycle}
          patient={patient}
          extras={selectedExtras!}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
