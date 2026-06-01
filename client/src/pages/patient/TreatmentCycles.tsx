import { useState, useEffect } from 'react';
import { AlertTriangle, Heart, Thermometer, Weight } from 'lucide-react';
import {
  Patient, TreatmentCycle, RadiationPhase, SurgeryCheckpoint,
  getCycleStatus, getDayOfCycle, isPredictedSafe, formatDate,
  getBPStatus, getTempStatus, LAB_NORMS, getLabStatus, getCompletedSessionCount,
  TODAY,
} from '../../components/mockData';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';

interface TreatmentCyclesProps {
  patient: Patient;
}

type EntryLifecycle = 'completed' | 'active' | 'future';

const LIFECYCLE = {
  completed: { dot: '#065f46', bg: '#ECFDF5', border: '#065f46', text: '#065f46', badge: '#D1FAE5', badgeText: '#065f46' },
  active:    { dot: '#7CAE8E', bg: '#F0FDF4', border: '#7CAE8E', text: '#166534', badge: '#A7F3D0', badgeText: '#065f46' },
  future:    { dot: '#D1D5DB', bg: '#F9FAFB', border: '#E5E7EB', text: '#374151', badge: '#F3F4F6', badgeText: '#6B7280' },
};

// ── You Are Here badge — rendered INSIDE the card at its top ──────────────────
function YouAreHereBadge() {
  return (
    <>
      <style>{`@keyframes yah-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(1.04)} }`}</style>
      <div
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-3"
        style={{
          backgroundColor: '#F0FDF4',
          border: '2px solid #7CAE8E',
          boxShadow: '0 0 0 3px rgba(124,174,142,0.15)',
          animation: 'yah-pulse 2s ease-in-out infinite',
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
        <div className="ml-auto w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: '#7CAE8E', boxShadow: '0 0 0 3px rgba(124,174,142,0.35)' }} />
      </div>
    </>
  );
}

// ── Vertical rail wrapper ─────────────────────────────────────────────────────
function RailRow({
  lifecycle, isFirst, isLast, lastCompletedIdx, entryIdx, children,
}: {
  lifecycle: EntryLifecycle;
  isFirst: boolean;
  isLast: boolean;
  lastCompletedIdx: number;
  entryIdx: number;
  children: React.ReactNode;
}) {
  const dotColor = LIFECYCLE[lifecycle].dot;
  const lineAboveColor = entryIdx > 0 && entryIdx - 1 <= lastCompletedIdx ? '#065f46' : '#E5E7EB';
  const lineBelowColor = entryIdx <= lastCompletedIdx ? '#065f46' : '#E5E7EB';
  const dotSize = lifecycle === 'active' ? 14 : 10;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
        {!isFirst && (
          <div style={{ width: 2, height: 16, backgroundColor: lineAboveColor, flexShrink: 0 }} />
        )}
        <div
          style={{
            width: dotSize, height: dotSize, borderRadius: '50%',
            backgroundColor: dotColor,
            boxShadow: lifecycle === 'active' ? '0 0 0 4px rgba(124,174,142,0.25)' : 'none',
            marginTop: isFirst ? 14 : 0,
            flexShrink: 0,
          }}
        />
        {!isLast && (
          <div style={{ flex: 1, width: 2, minHeight: 16, backgroundColor: lineBelowColor }} />
        )}
      </div>
      <div className="flex-1 pb-3 min-w-0">{children}</div>
    </div>
  );
}

// ── Surgery card — matches UnifiedTimeline SurgeryEntry style ─────────────────
function SurgeryCard({ surgery, lifecycle, showBadge }: {
  surgery: SurgeryCheckpoint; lifecycle: EntryLifecycle; showBadge?: boolean;
}) {
  const isCancelled = surgery.status === 'cancelled';
  let bg = '#EEF2FF', border = '#C7D2FE', color = '#4338CA', badgeBg = '#EEF2FF', label = '📅 Scheduled';
  if (isCancelled) { bg = '#F3F4F6'; border = '#D1D5DB'; color = '#9CA3AF'; badgeBg = '#F3F4F6'; label = 'Cancelled'; }
  else if (lifecycle === 'completed') { bg = LIFECYCLE.completed.bg; border = LIFECYCLE.completed.border; color = LIFECYCLE.completed.text; badgeBg = LIFECYCLE.completed.badge; label = '✓ Completed'; }

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🔪</span>
          <div>
            <p className="text-sm" style={{ color }}>{surgery.procedureType}</p>
            {surgery.surgeon && (
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{surgery.surgeon}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: badgeBg, color }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(surgery.date)}</span>
        </div>
      </div>
      {surgery.notes && (
        <p className="text-xs mt-2 italic" style={{ color: '#6B7280' }}>{surgery.notes}</p>
      )}
    </div>
  );
}

// ── Radiation card — matches UnifiedTimeline style + patient-specific panels ──
function RadiationCard({ phase, overlapsChemo, lifecycle, showBadge }: {
  phase: RadiationPhase; overlapsChemo: boolean; lifecycle: EntryLifecycle; showBadge?: boolean;
}) {
  const completedCount = getCompletedSessionCount(phase);
  const progressPct = Math.round((completedCount / phase.totalSessions) * 100);

  let bg = '#EFF6FF', border = '#BFDBFE', color = '#1E40AF', badgeBg = '#DBEAFE', label = '📅 Planned';
  if (lifecycle === 'completed') { bg = LIFECYCLE.completed.bg; border = LIFECYCLE.completed.border; color = LIFECYCLE.completed.text; badgeBg = LIFECYCLE.completed.badge; label = '✓ Completed'; }
  else if (lifecycle === 'active') { bg = '#FFF7ED'; border = '#F59E0B'; color = '#92400E'; badgeBg = '#FEF9C3'; label = '☢️ Active'; }

  const recentFever = phase.dailyLogs
    .filter((l) => l.sessionStatus === 'fever-postponed')
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">☢️</span>
          <div>
            <p className="text-sm" style={{ color }}>{phase.label}</p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Target: {phase.targetArea}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: badgeBg, color }}>
            {label}
            {overlapsChemo && <span className="ml-1.5 opacity-70">⚡ concurrent</span>}
          </span>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{completedCount}/{phase.totalSessions} sessions</span>
        </div>
      </div>

      {/* Progress bar — patient-specific, kept intact */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
          <span>{formatDate(phase.plannedStartDate)}</span>
          <span>{progressPct}%</span>
          <span>{formatDate(phase.currentEndDate)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: lifecycle === 'completed' ? '#A7F3D0' : '#E5E7EB' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              backgroundColor: lifecycle === 'completed' ? '#065f46' : '#F59E0B',
            }}
          />
        </div>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Schedule: Sun–Thu · {phase.totalSessions - completedCount} sessions remaining
        </p>
        {lifecycle === 'active' && phase.currentEndDate !== phase.plannedEndDate && (
          <p className="text-xs mt-0.5" style={{ color: '#D97706' }}>
            ⚠ End date adjusted: {formatDate(phase.currentEndDate)} (was {formatDate(phase.plannedEndDate)})
          </p>
        )}
      </div>

      {/* Fever alert — patient-specific coral block */}
      {recentFever && recentFever.temperature && (
        <div
          className="mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2 text-xs"
          style={{ backgroundColor: '#FFF1F2', border: '1.5px solid #FECDD3', color: '#9F1239' }}
        >
          <span className="shrink-0">🌡️</span>
          <span>
            Fever postponement on {formatDate(recentFever.date)} ({recentFever.temperature}°C). A 24-hour recovery check was required before resuming sessions.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Chemo card — matches UnifiedTimeline ChemoEntry style + predictive panel ──
function ChemoCard({
  cycle, futureCycle, hypothesisAllowed, latestLab, predictedSafe,
  overlapsRadiation, lifecycle, showBadge,
}: {
  cycle: TreatmentCycle;
  futureCycle: TreatmentCycle | undefined;
  hypothesisAllowed: boolean;
  latestLab: { wbc: number; neutrophils: number; hemoglobin: number; platelets: number; date: string } | null;
  predictedSafe: boolean;
  overlapsRadiation: boolean;
  lifecycle: EntryLifecycle;
  showBadge?: boolean;
}) {
  const status = getCycleStatus(cycle);
  const approval = cycle.approvalStatus;
  const isFutureCandidate = status === 'future' && cycle.id === futureCycle?.id;

  // Match UnifiedTimeline's ChemoEntry color logic exactly
  const c = isFutureCandidate && hypothesisAllowed
    ? { bg: '#F5F3FF', border: '#C4B5FD', text: '#5B21B6', badge: '#EDE9FE', badgeText: '#5B21B6' }
    : LIFECYCLE[lifecycle];

  const cardBg = approval === 'held' ? '#FEF2F2' : c.bg;
  const cardBorder = approval === 'held' ? '#FCA5A5' : c.border;
  const cardText = approval === 'held' ? '#991B1B' : c.text;

  const statusLabel =
    approval === 'held' ? '⏸ On Hold' :
    lifecycle === 'completed' ? '✓ Completed' :
    lifecycle === 'active' ? '🌿 Active' : '📅 Upcoming';
  const approvalBg = approval === 'approved' ? '#D1FAE5' : approval === 'held' ? '#FEE2E2' : '#FEF9C3';
  const approvalColor = approval === 'approved' ? '#166534' : approval === 'held' ? '#991B1B' : '#92400E';
  const approvalLabel = approval === 'approved' ? '✓ Approved' : approval === 'held' ? '⏸ On Hold' : '⏳ Pending';

  const dayNum = status === 'active' ? getDayOfCycle(cycle) : null;

  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: cardBg, border: `1.5px solid ${cardBorder}` }}>
      {showBadge && <YouAreHereBadge />}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">💊</span>
          <div>
            <p className="text-sm" style={{ color: cardText }}>
              Chemotherapy — Cycle {cycle.number}
              {dayNum !== null && <span className="ml-1.5 text-xs opacity-80">Day {dayNum}</span>}
              {overlapsRadiation && <span className="ml-1.5 text-xs" style={{ color: '#92400E' }}>⚡ concurrent</span>}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {cycle.approvalStatus === 'held' && cycle.delayedTo
                ? `Rescheduled → ${formatDate(cycle.delayedTo)}`
                : `${formatDate(cycle.startDate)} → ${formatDate(cycle.endDate)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: approvalBg, color: approvalColor }}>
            {approvalLabel}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.badge, color: c.badgeText }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {cycle.drugs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {cycle.drugs.map((d) => (
            <span key={d} className="text-xs px-2.5 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: '#374151', border: '1px solid rgba(0,0,0,0.06)' }}>
              {d}
            </span>
          ))}
        </div>
      )}

      {cycle.heldNotes && (
        <div className="mt-2 px-3 py-2 rounded-xl text-xs italic" style={{ backgroundColor: 'rgba(255,255,255,0.6)', color: '#991B1B', border: '1px solid rgba(252,165,165,0.4)' }}>
          Physician note: "{cycle.heldNotes}"
        </div>
      )}

      {/* System Predictive Indicator — patient-specific, must remain */}
      {isFutureCandidate && hypothesisAllowed && latestLab && (
        <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: '#EDE9FE', border: '1.5px solid #C4B5FD' }}>
          <p className="text-xs mb-1" style={{ color: '#5B21B6' }}>
            <strong>🔬 System Predictive Indicator</strong>
          </p>
          <p className="text-xs mb-2" style={{ color: '#6D28D9' }}>
            Based on latest counts (WBC: {latestLab.wbc} K/µL · Neutrophils: {latestLab.neutrophils} K/µL):
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{ backgroundColor: predictedSafe ? '#D1FAE5' : '#FEE2E2', color: predictedSafe ? '#166534' : '#991B1B' }}
          >
            {predictedSafe ? '✓ Predicted Safe to Proceed' : '⚠ Counts May Require Review'}
          </div>
          <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl" style={{ backgroundColor: '#FFF7ED' }}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <p className="text-xs" style={{ color: '#92400E' }}>
              <strong>Medical Disclaimer:</strong> This is an automated hypothesis derived from blood counts and does not replace the official clinical decision of your oncologist.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Vital chip ────────────────────────────────────────────────────────────────
function VitalChip({ icon, label, value, unit, status }: {
  icon: React.ReactNode; label: string; value: string; unit: string;
  status: 'normal' | 'elevated' | 'high' | 'low';
}) {
  const isOk = status === 'normal';
  const isWarn = status === 'elevated' || status === 'low';
  const bg = isOk ? '#F0FAF4' : isWarn ? '#FFF7ED' : '#FEF2F2';
  const border = isOk ? '#A7F3D0' : isWarn ? '#FCD34D' : '#FCA5A5';
  const textColor = isOk ? '#166534' : isWarn ? '#92400E' : '#991B1B';
  const statusText = isOk ? '● Normal' : isWarn ? (status === 'low' ? '▼ Below Range' : '▲ Elevated') : '▲ High';

  return (
    <div className="rounded-2xl p-3.5 flex-1 min-w-0" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: textColor }}>{icon}</span>
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
      </div>
      <p className="text-base" style={{ color: textColor }}>{value}</p>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>{unit}</p>
      <p className="text-xs mt-1" style={{ color: textColor }}>{statusText}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TreatmentCycles({ patient }: TreatmentCyclesProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingSpinner message="Loading your treatment protocol..." />;

  const activeCycle = patient.cycles.find((c) => getCycleStatus(c) === 'active');
  const futureCycle = patient.cycles.find((c) => getCycleStatus(c) === 'future');
  const hypothesisAllowed = !activeCycle && !!futureCycle;
  const latestLab = patient.labResults[patient.labResults.length - 1] ?? null;
  const predictedSafe = hypothesisAllowed && isPredictedSafe(patient.labResults);
  const bpStatus = latestLab ? getBPStatus(latestLab.bloodPressure) : 'normal';
  const tempStatus = latestLab ? getTempStatus(latestLab.temperature) : 'normal';
  const vitalsOk = bpStatus === 'normal' && tempStatus === 'normal';

  type Entry =
    | { kind: 'surgery'; sortDate: string; data: SurgeryCheckpoint }
    | { kind: 'chemo'; sortDate: string; data: TreatmentCycle }
    | { kind: 'radiation'; sortDate: string; data: RadiationPhase };

  const timeline: Entry[] = [
    ...patient.surgeries.map((s) => ({ kind: 'surgery' as const, sortDate: s.date, data: s })),
    ...patient.cycles.map((c) => ({ kind: 'chemo' as const, sortDate: c.startDate, data: c })),
    ...patient.radiationPhases.map((r) => ({ kind: 'radiation' as const, sortDate: r.plannedStartDate, data: r })),
  ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));

  function chemoOverlapsRadiation(cycle: TreatmentCycle): boolean {
    return patient.radiationPhases.some(
      (r) => r.plannedStartDate <= cycle.endDate && r.currentEndDate >= cycle.startDate,
    );
  }
  function radiationOverlapsChemo(phase: RadiationPhase): boolean {
    return patient.cycles.some(
      (c) => c.startDate <= phase.currentEndDate && c.endDate >= phase.plannedStartDate,
    );
  }

  function getEntryLifecycle(entry: Entry): EntryLifecycle {
    if (entry.kind === 'chemo') {
      const s = getCycleStatus(entry.data);
      return s === 'past' ? 'completed' : s === 'active' ? 'active' : 'future';
    }
    if (entry.kind === 'radiation') {
      return entry.data.status === 'completed' ? 'completed' : entry.data.status === 'active' ? 'active' : 'future';
    }
    return entry.data.status === 'completed' ? 'completed' : entry.data.date === TODAY ? 'active' : 'future';
  }

  // "You Are Here" — only anchors to non-completed entries
  // Priority: active chemo > active radiation > held chemo > first future chemo > planned radiation > scheduled surgery
  let youAreHereIdx = -1;
  const candidates = [
    timeline.findIndex((e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'active'),
    timeline.findIndex((e) => e.kind === 'radiation' && (e.data as RadiationPhase).status === 'active'),
    timeline.findIndex((e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'held'),
    timeline.findIndex((e) => e.kind === 'chemo' && getCycleStatus(e.data as TreatmentCycle) === 'future'),
    timeline.findIndex((e) => e.kind === 'radiation' && (e.data as RadiationPhase).status === 'planned'),
    timeline.findIndex((e) => e.kind === 'surgery' && (e.data as SurgeryCheckpoint).status === 'scheduled'),
  ];
  for (const idx of candidates) {
    if (idx >= 0) {
      // Safety: never anchor to a completed entry
      if (getEntryLifecycle(timeline[idx]) !== 'completed') {
        youAreHereIdx = idx;
        break;
      }
    }
  }

  // Last completed index for rail line coloring
  const lastCompletedIdx = timeline.reduce((acc, entry, i) => {
    return getEntryLifecycle(entry) === 'completed' ? i : acc;
  }, -1);

  const feveredRadiationPhase = patient.radiationPhases.find(
    (p) => p.status === 'active' && p.dailyLogs.some((l) => l.sessionStatus === 'fever-postponed'),
  );

  const modalitiesActive = [
    patient.cycles.length > 0 && 'Chemotherapy',
    patient.radiationPhases.length > 0 && 'Radiation',
    patient.surgeries.length > 0 && 'Surgery',
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 style={{ color: '#2D4739' }}>Treatment Protocol Roadmap</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          {patient.diagnosis} · {timeline.length} protocol {timeline.length === 1 ? 'entry' : 'entries'} across {modalitiesActive.join(', ')}
        </p>
      </div>

      {/* Fever banner */}
      {feveredRadiationPhase && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5' }}>
          <span className="text-sm mt-0.5 shrink-0">🚨</span>
          <p className="text-xs" style={{ color: '#991B1B' }}>
            <strong>Radiation Schedule Adjusted.</strong>{' '}
            A fever postponement was recorded during <em>{feveredRadiationPhase.label}</em>. Sessions shifted forward by 2 days. Check your calendar for the updated schedule.
          </p>
        </div>
      )}

      {/* Active cycle notice */}
      {activeCycle && (
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: '#D1FAE5', border: '1.5px solid #7CAE8E' }}>
          <span className="text-sm mt-0.5">🌿</span>
          <p className="text-xs" style={{ color: '#166534' }}>
            <strong>Active chemotherapy — Cycle {activeCycle.number}, Day {getDayOfCycle(activeCycle)}.</strong>{' '}
            Readiness evaluation for the next cycle unlocks after this cycle ends.
          </p>
        </div>
      )}

      {/* Protocol rail */}
      <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
        {timeline.map((entry, i) => {
          const lifecycle = getEntryLifecycle(entry);
          const isFirst = i === 0;
          const isLast = i === timeline.length - 1;
          const showBadge = i === youAreHereIdx && youAreHereIdx >= 0;

          return (
            <RailRow
              key={entry.kind === 'chemo' ? `chemo-${entry.data.id}` : entry.kind === 'radiation' ? `rad-${entry.data.id}` : `surg-${entry.data.id}`}
              lifecycle={lifecycle}
              isFirst={isFirst}
              isLast={isLast}
              lastCompletedIdx={lastCompletedIdx}
              entryIdx={i}
            >
              {entry.kind === 'surgery' && (
                <SurgeryCard surgery={entry.data} lifecycle={lifecycle} showBadge={showBadge} />
              )}
              {entry.kind === 'chemo' && (
                <ChemoCard
                  cycle={entry.data}
                  futureCycle={futureCycle}
                  hypothesisAllowed={hypothesisAllowed}
                  latestLab={latestLab}
                  predictedSafe={predictedSafe}
                  overlapsRadiation={chemoOverlapsRadiation(entry.data)}
                  lifecycle={lifecycle}
                  showBadge={showBadge}
                />
              )}
              {entry.kind === 'radiation' && (
                <RadiationCard
                  phase={entry.data}
                  overlapsChemo={radiationOverlapsChemo(entry.data)}
                  lifecycle={lifecycle}
                  showBadge={showBadge}
                />
              )}
            </RailRow>
          );
        })}
      </div>

      {/* Treatment Readiness Evaluation */}
      {hypothesisAllowed && latestLab && (
        <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📋</span>
            <h3 style={{ color: '#2D4739' }}>Treatment Readiness Evaluation</h3>
          </div>
          <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>
            Pre-treatment physical vitals from your most recent clinical visit ({formatDate(latestLab.date)}).
          </p>

          <div className="flex gap-3 flex-wrap">
            <VitalChip
              icon={<Heart className="w-3.5 h-3.5" />}
              label="Blood Pressure"
              value={latestLab.bloodPressure}
              unit="mmHg · Normal <140/90"
              status={bpStatus === 'elevated' ? 'elevated' : bpStatus === 'high' ? 'high' : 'normal'}
            />
            <VitalChip
              icon={<Weight className="w-3.5 h-3.5" />}
              label="Body Weight"
              value={`${latestLab.weight} kg`}
              unit="Pre-treatment recorded"
              status="normal"
            />
            <VitalChip
              icon={<Thermometer className="w-3.5 h-3.5" />}
              label="Temperature"
              value={`${latestLab.temperature}°C`}
              unit="Normal 36.1–37.5°C"
              status={tempStatus}
            />
          </div>

          <div className="mt-4 pt-4 border-t" style={{ borderColor: '#F3F4F6' }}>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Key Blood Markers</p>
            <div className="grid grid-cols-2 gap-2">
              {(['wbc', 'neutrophils'] as const).map((key) => {
                const norm = LAB_NORMS[key];
                const value = latestLab[key];
                const s = getLabStatus(key, value);
                const clr = s === 'normal' ? '#166534' : s === 'low' ? '#DC2626' : '#D97706';
                const bg = s === 'normal' ? '#F0FAF4' : s === 'low' ? '#FEF2F2' : '#FFF7ED';
                const brdr = s === 'normal' ? '#A7F3D0' : s === 'low' ? '#FCA5A5' : '#FCD34D';
                return (
                  <div key={key} className="rounded-xl p-3" style={{ backgroundColor: bg, border: `1.5px solid ${brdr}` }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{norm.label}</p>
                    <p className="text-sm mt-0.5" style={{ color: clr }}>
                      {value} <span className="text-xs" style={{ color: '#9CA3AF' }}>{norm.unit}</span>
                    </p>
                    <p className="text-xs" style={{ color: clr }}>
                      {s === 'normal' ? '● Normal' : s === 'low' ? '▼ Below Range' : '▲ Above Range'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="mt-4 rounded-2xl px-4 py-3"
            style={{
              backgroundColor: (predictedSafe && vitalsOk) ? '#D1FAE5' : '#FEF9C3',
              border: `1.5px solid ${(predictedSafe && vitalsOk) ? '#7CAE8E' : '#FCD34D'}`,
            }}
          >
            <p className="text-xs" style={{ color: (predictedSafe && vitalsOk) ? '#166534' : '#92400E' }}>
              {(predictedSafe && vitalsOk)
                ? '✓ Overall indicators suggest readiness. Awaiting official oncologist authorization.'
                : '⚠ One or more parameters require clinical evaluation before the next cycle is authorized.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
