import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import {
  Patient, TreatmentCycle, RadiationPhase, SurgeryCheckpoint,
  getCycleStatus, getCompletedSessionCount, formatDate, TODAY,
} from '../mockData';

// ── Auth context injected from oncologist portal ──────────────────────────────
export interface ChemoAuthContext {
  firstPendingCycleId: string | null;
  hasActiveCycle: boolean;
  isScheduledDateToday: boolean;
  freshLabForToday: boolean;
  hasUnevaluatedFreshLab: boolean;
  scheduledDate: string | null;
  onSimulateNewLab: () => void;
  onApprove: (cycleId: string, notes: string) => void;
  onHold: (cycleId: string, notes: string, returnDate: string) => void;
}

interface UnifiedTimelineProps {
  patient: Patient;
  compact?: boolean;
  showYouAreHere?: boolean;
  chemoAuthContext?: ChemoAuthContext | null;
}

type TimelineEntry =
  | { kind: 'surgery'; sortDate: string; data: SurgeryCheckpoint }
  | { kind: 'chemo'; sortDate: string; data: TreatmentCycle }
  | { kind: 'radiation'; sortDate: string; data: RadiationPhase };

type EntryLifecycle = 'completed' | 'active' | 'future';

function buildTimeline(patient: Patient): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...patient.surgeries.map((s) => ({ kind: 'surgery' as const, sortDate: s.date, data: s })),
    ...patient.cycles.map((c) => ({ kind: 'chemo' as const, sortDate: c.startDate, data: c })),
    ...patient.radiationPhases.map((r) => ({
      kind: 'radiation' as const,
      sortDate: r.plannedStartDate,
      data: r,
    })),
  ];
  return entries.sort((a, b) => a.sortDate.localeCompare(b.sortDate));
}

function getEntryKey(entry: TimelineEntry): string {
  return `${entry.kind}-${entry.data.id}`;
}

function getEntryLifecycle(entry: TimelineEntry): EntryLifecycle {
  if (entry.kind === 'surgery') {
    if (entry.data.status === 'completed') return 'completed';
    if (entry.data.date <= TODAY) return 'active';
    return 'future';
  }
  if (entry.kind === 'chemo') {
    const s = getCycleStatus(entry.data);
    if (s === 'past') return 'completed';
    if (s === 'active') return 'active';
    return 'future';
  }
  if (entry.data.status === 'completed') return 'completed';
  if (entry.data.status === 'active') return 'active';
  return 'future';
}

function getCurrentEntryKey(timeline: TimelineEntry[]): string | null {
  // Priority: active chemo > active radiation > held chemo > first future chemo > planned radiation > scheduled surgery
  const activeChemo = timeline.find(
    (e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'active',
  );
  if (activeChemo) return getEntryKey(activeChemo);

  const activeRad = timeline.find(
    (e) => e.kind === 'radiation' && (e.data as RadiationPhase).status === 'active',
  );
  if (activeRad) return getEntryKey(activeRad);

  const heldChemo = timeline.find(
    (e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'held',
  );
  if (heldChemo) return getEntryKey(heldChemo);

  const futureChemo = timeline.find(
    (e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'future',
  );
  if (futureChemo) return getEntryKey(futureChemo);

  const plannedRad = timeline.find(
    (e) => e.kind === 'radiation' && (e.data as RadiationPhase).status === 'planned',
  );
  if (plannedRad) return getEntryKey(plannedRad);

  const scheduledSurgery = timeline.find(
    (e) => e.kind === 'surgery' && (e.data as SurgeryCheckpoint).status === 'scheduled',
  );
  if (scheduledSurgery) return getEntryKey(scheduledSurgery);

  return null;
}

const LIFECYCLE_COLORS = {
  completed: { border: '#065f46', bg: '#ECFDF5', text: '#065f46', badge: '#D1FAE5', badgeText: '#065f46' },
  active:    { border: '#7CAE8E', bg: '#F0FDF4', text: '#166534', badge: '#A7F3D0', badgeText: '#065f46' },
  future:    { border: '#E5E7EB', bg: '#F9FAFB', text: '#374151', badge: '#F3F4F6', badgeText: '#6B7280' },
};

// ── You Are Here badge — rendered INSIDE the card so it's clearly on the entry ──
function YouAreHereBadge() {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-3"
      style={{
        backgroundColor: '#F0FDF4',
        border: '2px solid #7CAE8E',
        boxShadow: '0 0 0 3px rgba(124,174,142,0.15)',
        animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      }}
    >
      <span className="text-sm">📍</span>
      <div>
        <p className="text-xs" style={{ color: '#166534' }}>
          <strong>You Are Here</strong>
          <span className="mx-1.5" style={{ color: '#9CA3AF' }}>·</span>
          <span style={{ fontFamily: 'serif' }}>נמצא פה</span>
        </p>
        <p className="text-xs" style={{ color: '#4B7C5E' }}>Current treatment position</p>
      </div>
      <div
        className="ml-auto w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: '#7CAE8E', boxShadow: '0 0 0 3px rgba(124,174,142,0.35)' }}
      />
    </div>
  );
}

// ── Surgery entry ─────────────────────────────────────────────────────────────
function SurgeryEntry({ data, compact, lifecycle, showBadge }: {
  data: SurgeryCheckpoint; compact: boolean; lifecycle: EntryLifecycle; showBadge?: boolean;
}) {
  const isCancelled = data.status === 'cancelled';
  let bg = '#EEF2FF', border = '#C7D2FE', color = '#4338CA', badgeBg = '#EEF2FF', label = '📅 Scheduled';
  if (isCancelled) { bg = '#F3F4F6'; border = '#D1D5DB'; color = '#9CA3AF'; badgeBg = '#F3F4F6'; label = 'Cancelled'; }
  else if (lifecycle === 'completed') { bg = LIFECYCLE_COLORS.completed.bg; border = LIFECYCLE_COLORS.completed.border; color = LIFECYCLE_COLORS.completed.text; badgeBg = LIFECYCLE_COLORS.completed.badge; label = '✓ Completed'; }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🔪</span>
          <div>
            <p className="text-sm" style={{ color }}>{data.procedureType}</p>
            {!compact && data.surgeon && (
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{data.surgeon}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: badgeBg, color }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(data.date)}</span>
        </div>
      </div>
      {!compact && data.notes && (
        <p className="text-xs mt-2 italic" style={{ color: '#6B7280' }}>{data.notes}</p>
      )}
    </div>
  );
}

// ── Chemo entry — with optional inline auth ───────────────────────────────────
function ChemoEntry({ data, compact, lifecycle, showBadge, authContext }: {
  data: TreatmentCycle;
  compact: boolean;
  lifecycle: EntryLifecycle;
  showBadge?: boolean;
  authContext?: ChemoAuthContext | null;
}) {
  const [mode, setMode] = useState<'idle' | 'approving' | 'holding'>('idle');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [localResolved, setLocalResolved] = useState(false);

  const approval = data.approvalStatus;
  const c = lifecycle === 'completed' ? LIFECYCLE_COLORS.completed : lifecycle === 'active' ? LIFECYCLE_COLORS.active : LIFECYCLE_COLORS.future;

  const statusLabel =
    approval === 'held' ? '⏸ On Hold' :
    lifecycle === 'completed' ? '✓ Completed' :
    lifecycle === 'active' ? '🌿 Active' : '📅 Upcoming';
  const approvalBg = approval === 'approved' ? '#D1FAE5' : approval === 'held' ? '#FEE2E2' : '#FEF9C3';
  const approvalColor = approval === 'approved' ? '#166534' : approval === 'held' ? '#991B1B' : '#92400E';
  const approvalLabel = approval === 'approved' ? '✓ Approved' : approval === 'held' ? '⏸ On Hold' : '⏳ Pending';

  const cardBg = approval === 'held' ? '#FEF2F2' : c.bg;
  const cardBorder = approval === 'held' ? '#FCA5A5' : c.border;
  const cardText = approval === 'held' ? '#991B1B' : c.text;

  // Is this cycle the one getting auth attention?
  const isAuthTarget = authContext?.firstPendingCycleId === data.id;

  const inputStyle = (bc: string): React.CSSProperties => ({
    border: `1.5px solid ${bc}`,
    backgroundColor: '#FFF',
    fontFamily: 'Nunito, sans-serif',
    color: '#374151',
  });

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: cardBg, border: `1.5px solid ${cardBorder}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">💊</span>
          <div>
            <p className="text-sm" style={{ color: cardText }}>
              Chemotherapy — Cycle {data.number}
            </p>
            {!compact && (
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                {formatDate(data.startDate)} → {formatDate(data.endDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: approvalBg, color: approvalColor }}>
            {approvalLabel}
          </span>
          {!compact && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.badge, color: c.badgeText }}>
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {!compact && data.drugs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.drugs.map((d) => (
            <span key={d} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: '#374151', border: '1px solid rgba(0,0,0,0.06)' }}>
              {d}
            </span>
          ))}
        </div>
      )}
      {!compact && data.heldNotes && (
        <p className="text-xs mt-2 italic" style={{ color: '#991B1B' }}>
          Physician note: "{data.heldNotes}"
        </p>
      )}

      {/* ── Inline authorization (oncologist portal only) ── */}
      {!compact && isAuthTarget && authContext && !authContext.hasActiveCycle && !localResolved && mode === 'idle' && (() => {
        // State D: future date — not yet scheduled
        if (!authContext.isScheduledDateToday) {
          return (
            <div className="mt-3 rounded-xl px-3 py-2.5 flex items-start gap-2" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
              <FlaskConical className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
              <div>
                <p className="text-xs" style={{ color: '#374151' }}>
                  Next evaluation: <strong>{formatDate(authContext.scheduledDate!)}</strong>
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  Authorization unlocks on the scheduled clinic date.
                </p>
              </div>
            </div>
          );
        }
        // State C: today is the date but lab not received yet
        if (!authContext.freshLabForToday) {
          return (
            <div className="mt-3">
              <div className="rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2" style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
                <FlaskConical className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                <div>
                  <p className="text-xs" style={{ color: '#374151' }}>Clinic Visit Day — Awaiting Lab Sync</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Authorization unlocks when today's results arrive.</p>
                </div>
              </div>
              <button
                onClick={authContext.onSimulateNewLab}
                className="text-xs px-4 py-2.5 rounded-xl transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#EDE9FE', color: '#5B21B6', border: '1.5px solid #C4B5FD' }}
              >
                🔬 Simulate: Register Today's Lab Results
              </button>
            </div>
          );
        }
        // State B: lab received, ready to authorize
        if (authContext.hasUnevaluatedFreshLab) {
          return (
            <div className="mt-3">
              <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2 text-xs" style={{ backgroundColor: '#D1FAE5', color: '#166534', border: '1px solid #A7F3D0' }}>
                <FlaskConical className="w-3.5 h-3.5 shrink-0" />
                Fresh laboratory data received — review results above and authorize below.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('approving')}
                  className="text-xs px-3 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#7CAE8E' }}
                >
                  ✓ Approve Cycle {data.number}
                </button>
                <button
                  onClick={() => setMode('holding')}
                  className="text-xs px-3 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  ⏸ Place on Hold
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Approve form */}
      {!compact && isAuthTarget && authContext && mode === 'approving' && !localResolved && (
        <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1.5px solid #7CAE8E' }}>
          <p className="text-xs mb-2" style={{ color: '#166534' }}>Add a clinical note before confirming approval:</p>
          <textarea
            rows={2}
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none mb-2"
            style={inputStyle('#7CAE8E')}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setMode('idle'); setDoctorNotes(''); }} className="text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!doctorNotes.trim()) return;
                setLocalResolved(true);
                setMode('idle');
                authContext.onApprove(data.id, doctorNotes.trim());
              }}
              disabled={!doctorNotes.trim()}
              className="text-xs px-4 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#7CAE8E', fontFamily: 'Nunito, sans-serif' }}
            >
              Confirm Approval
            </button>
          </div>
        </div>
      )}

      {/* Hold form */}
      {!compact && isAuthTarget && authContext && mode === 'holding' && !localResolved && (
        <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.8)', border: '1.5px solid #FCA5A5' }}>
          <p className="text-xs mb-2" style={{ color: '#991B1B' }}>Complete both fields to postpone this cycle:</p>
          <div className="flex flex-col gap-2 mb-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Clinical note:</label>
              <textarea rows={2} value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none" style={inputStyle('#FCA5A5')} />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: '#6B7280' }}>Return date for repeat evaluation:</label>
              <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} min={TODAY} className="w-full rounded-xl px-3 py-2 text-xs outline-none" style={inputStyle('#FCA5A5')} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setMode('idle'); setDoctorNotes(''); setReturnDate(''); }} className="text-xs px-3 py-1.5 rounded-xl" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              Cancel
            </button>
            <button
              onClick={() => {
                if (!doctorNotes.trim() || !returnDate) return;
                setLocalResolved(true);
                setMode('idle');
                authContext.onHold(data.id, doctorNotes.trim(), returnDate);
              }}
              disabled={!doctorNotes.trim() || !returnDate}
              className="text-xs px-4 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: '#EF4444', fontFamily: 'Nunito, sans-serif' }}
            >
              Confirm Hold &amp; Set Return Date
            </button>
          </div>
        </div>
      )}

      {/* Active treatment lock notice */}
      {!compact && isAuthTarget && authContext?.hasActiveCycle && (
        <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs" style={{ backgroundColor: '#D1FAE5', color: '#166534', border: '1px solid #A7F3D0' }}>
          🌿 Active treatment in progress — authorization locked.
        </div>
      )}
    </div>
  );
}

// ── Fever alert helper — dismisses once a completed session follows the last fever ──
function getActiveFeverInfo(phase: RadiationPhase): { active: boolean; temp?: number } {
  const lastFever = [...phase.dailyLogs]
    .filter((l) => l.sessionStatus === 'fever-postponed')
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!lastFever) return { active: false };
  const hasResumed = phase.dailyLogs.some(
    (l) => l.sessionStatus === 'completed' && l.date > lastFever.date,
  );
  return hasResumed ? { active: false } : { active: true, temp: lastFever.temperature ?? undefined };
}

// ── Radiation entry ───────────────────────────────────────────────────────────
function RadiationEntry({ data, compact, lifecycle, showBadge }: {
  data: RadiationPhase; compact: boolean; lifecycle: EntryLifecycle; showBadge?: boolean;
}) {
  const completedCount = getCompletedSessionCount(data);
  const progressPct = Math.round((completedCount / data.totalSessions) * 100);

  let bg = '#EFF6FF', border = '#BFDBFE', color = '#1E40AF', badgeBg = '#DBEAFE', label = '📅 Planned';
  if (lifecycle === 'completed') { bg = LIFECYCLE_COLORS.completed.bg; border = LIFECYCLE_COLORS.completed.border; color = LIFECYCLE_COLORS.completed.text; badgeBg = LIFECYCLE_COLORS.completed.badge; label = '✓ Completed'; }
  else if (lifecycle === 'active') { bg = '#FFF7ED'; border = '#F59E0B'; color = '#92400E'; badgeBg = '#FEF9C3'; label = '☢️ Active'; }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">☢️</span>
          <div>
            <p className="text-sm" style={{ color }}>{data.label}</p>
            {!compact && (
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Target: {data.targetArea}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: badgeBg, color }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {completedCount}/{data.totalSessions} sessions
          </span>
        </div>
      </div>
      {!compact && lifecycle !== 'future' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
            <span>{formatDate(data.plannedStartDate)}</span>
            <span>{progressPct}%</span>
            <span>{formatDate(data.currentEndDate)}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#E5E7EB' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                backgroundColor: lifecycle === 'completed' ? '#065f46' : '#F59E0B',
              }}
            />
          </div>
          {lifecycle === 'active' && data.currentEndDate !== data.plannedEndDate && (
            <p className="text-xs mt-1" style={{ color: '#D97706' }}>
              ⚠ End date shifted: {formatDate(data.currentEndDate)} (was {formatDate(data.plannedEndDate)})
            </p>
          )}
        </div>
      )}

      {/* Fever alert — mirrors patient portal; auto-dismisses when treatment resumes */}
      {!compact && lifecycle === 'active' && (() => {
        const fi = getActiveFeverInfo(data);
        if (!fi.active) return null;
        return (
          <div
            className="mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2 text-xs"
            style={{ backgroundColor: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#9F1239' }}
          >
            <span className="shrink-0">🌡️</span>
            <div>
              <p>
                <strong>Fever postponement recorded{fi.temp ? ` — ${fi.temp}°C` : ''}.</strong>{' '}
                Recovery check in progress.
              </p>
              <p className="mt-0.5" style={{ color: '#BE123C' }}>
                24-hour fever-free loop required before sessions resume.
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function UnifiedTimeline({
  patient,
  compact = false,
  showYouAreHere = false,
  chemoAuthContext = null,
}: UnifiedTimelineProps) {
  const timeline = buildTimeline(patient);

  if (timeline.length === 0) {
    return <p className="text-sm" style={{ color: '#9CA3AF' }}>No treatment protocol data available.</p>;
  }

  const currentKey = showYouAreHere ? getCurrentEntryKey(timeline) : null;

  let lastCompletedIdx = -1;
  timeline.forEach((e, i) => {
    const lc = getEntryLifecycle(e);
    if (lc === 'completed' || lc === 'active') lastCompletedIdx = i;
  });

  const renderEntry = (entry: TimelineEntry, showBadge: boolean, isCompact: boolean) => {
    if (entry.kind === 'surgery') {
      return <SurgeryEntry data={entry.data} compact={isCompact} lifecycle={getEntryLifecycle(entry)} showBadge={showBadge} />;
    }
    if (entry.kind === 'chemo') {
      return (
        <ChemoEntry
          data={entry.data}
          compact={isCompact}
          lifecycle={getEntryLifecycle(entry)}
          showBadge={showBadge}
          authContext={chemoAuthContext}
        />
      );
    }
    return <RadiationEntry data={entry.data} compact={isCompact} lifecycle={getEntryLifecycle(entry)} showBadge={showBadge} />;
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {timeline.map((entry) => {
          const key = getEntryKey(entry);
          const showBadge = !!(showYouAreHere && key === currentKey);
          return <div key={key}>{renderEntry(entry, showBadge, true)}</div>;
        })}
      </div>
    );
  }

  return (
    <div className="relative">
      {timeline.map((entry, idx) => {
        const key = getEntryKey(entry);
        const lc = getEntryLifecycle(entry);
        const isLast = idx === timeline.length - 1;
        const showBadge = !!(showYouAreHere && key === currentKey);

        const dotColor = lc === 'completed' ? '#065f46' : lc === 'active' ? '#7CAE8E' : '#D1D5DB';
        const lineColorAbove = idx > 0 && idx - 1 <= lastCompletedIdx ? '#065f46' : '#E5E7EB';
        const lineColorBelow = idx <= lastCompletedIdx ? '#065f46' : '#E5E7EB';

        return (
          <div key={key} className="flex gap-3">
            {/* Rail */}
            <div className="flex flex-col items-center shrink-0" style={{ width: '20px' }}>
              {idx > 0 && (
                <div style={{ width: '2px', height: '16px', backgroundColor: lineColorAbove, flexShrink: 0 }} />
              )}
              <div
                style={{
                  width: lc === 'active' ? '14px' : '10px',
                  height: lc === 'active' ? '14px' : '10px',
                  borderRadius: '50%',
                  backgroundColor: dotColor,
                  boxShadow: lc === 'active' ? '0 0 0 4px rgba(124,174,142,0.25)' : 'none',
                  marginTop: idx === 0 ? '14px' : '0',
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <div style={{ width: '2px', flex: 1, minHeight: '16px', backgroundColor: lineColorBelow }} />
              )}
            </div>
            {/* Card */}
            <div className="flex-1 pb-4">
              {renderEntry(entry, showBadge, false)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
