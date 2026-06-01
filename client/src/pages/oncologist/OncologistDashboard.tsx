import { useState, useEffect } from 'react';
import { LogOut, Leaf, Users, Bell } from 'lucide-react';
import {
  patients, Patient, Oncologist, RadiationPhase,
  getCycleStatus, formatDate, hasFeverAlert, getCompletedSessionCount,
  TODAY,
} from '../../components/mockData';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { RibbonBackground } from '../../components/shared/RibbonBackground';

interface OncologistDashboardProps {
  oncologist: Oncologist;
  onSelectPatient: (patientId: string) => void;
  onLogout: () => void;
}

// ── Alert derivation helpers ──────────────────────────────────────────────────

interface PendingAuthAlert {
  patient: Patient;
  cycleNumber: number;
  isHeld: boolean;
}

interface FeverAlert {
  patient: Patient;
  phase: RadiationPhase;
  feverDate: string;
  temp: number;
  sessionLabel: string;
}

function derivePendingAuthAlerts(myPatients: Patient[]): PendingAuthAlert[] {
  const alerts: PendingAuthAlert[] = [];
  for (const p of myPatients) {
    const hasTodayLab = p.labResults.some((l) => l.date === TODAY);
    if (!hasTodayLab) continue;
    // Held cycle with delayedTo today (re-evaluation visit)
    const heldReturnCycle = p.cycles.find(
      (c) => c.approvalStatus === 'held' && c.delayedTo === TODAY,
    );
    if (heldReturnCycle) {
      alerts.push({ patient: p, cycleNumber: heldReturnCycle.number, isHeld: true });
      continue;
    }
    // Pending cycle starting today (first-time visit)
    const pendingTodayCycle = p.cycles.find(
      (c) => c.approvalStatus === 'pending' && c.startDate === TODAY,
    );
    if (pendingTodayCycle) {
      alerts.push({ patient: p, cycleNumber: pendingTodayCycle.number, isHeld: false });
    }
  }
  return alerts;
}

function deriveFeverAlerts(myPatients: Patient[]): FeverAlert[] {
  const alerts: FeverAlert[] = [];
  for (const p of myPatients) {
    for (const phase of p.radiationPhases) {
      if (phase.status !== 'active') continue;
      const { hasFever, feverDate, temp } = hasFeverAlert(phase);
      if (hasFever && feverDate && temp !== undefined) {
        const done = getCompletedSessionCount(phase);
        alerts.push({
          patient: p,
          phase,
          feverDate,
          temp,
          sessionLabel: `Session ${done + 1} / ${phase.totalSessions}`,
        });
      }
    }
  }
  return alerts;
}

// ── Clinical Notifications Panel ──────────────────────────────────────────────

function ClinicalNotificationsPanel({
  authAlerts,
  feverAlerts,
  onSelectPatient,
}: {
  authAlerts: PendingAuthAlert[];
  feverAlerts: FeverAlert[];
  onSelectPatient: (id: string) => void;
}) {
  const totalAlerts = authAlerts.length + feverAlerts.length;
  if (totalAlerts === 0) return null;

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-sm"
      style={{ backgroundColor: '#FFFFFF', border: '2px solid #FCD34D' }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-3.5 flex items-center gap-2"
        style={{ backgroundColor: '#FFFBEB', borderBottom: '1.5px solid #FDE68A' }}
      >
        <Bell className="w-4 h-4" style={{ color: '#D97706' }} />
        <h3 style={{ color: '#92400E' }}>Clinical Notifications</h3>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
        >
          {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#FEF9C3' }}>
        {/* ⚠️ Pending Cycle Authorization alerts */}
        {authAlerts.map((alert) => (
          <button
            key={`auth-${alert.patient.id}`}
            onClick={() => onSelectPatient(alert.patient.id)}
            className="w-full px-5 py-4 text-left hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#374151' }}>
                  <strong>Pending Cycle Authorization</strong> — {alert.patient.fullName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {alert.isHeld
                    ? `Cycle ${alert.cycleNumber} — held cycle returned today with fresh blood work. Awaiting Approve / Hold decision.`
                    : `Cycle ${alert.cycleNumber} — same-day lab received. Patient is waiting for treatment clearance.`}
                </p>
                <p className="text-xs mt-1" style={{ color: '#D97706' }}>
                  Tap to open patient profile → authorize or hold
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full shrink-0"
                style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
              >
                {alert.isHeld ? '↩ Re-evaluation' : '🔬 Lab Received'}
              </span>
            </div>
          </button>
        ))}

        {/* 🚨 Radiation Fever alerts */}
        {feverAlerts.map((alert) => (
          <button
            key={`fever-${alert.patient.id}-${alert.phase.id}`}
            onClick={() => onSelectPatient(alert.patient.id)}
            className="w-full px-5 py-4 text-left hover:bg-red-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg shrink-0 mt-0.5">🚨</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#374151' }}>
                  <strong>Radiation Postponed — Fever Alert</strong> — {alert.patient.fullName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {alert.phase.label} · {alert.sessionLabel} · Target: {alert.phase.targetArea}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>
                  Temperature <strong>{alert.temp}°C</strong> recorded on {formatDate(alert.feverDate)}.
                  Session postponed — 24-hour fever-free recovery protocol is active.
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full shrink-0"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
              >
                🌡️ Fever {alert.temp}°C
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export function OncologistDashboard({ oncologist, onSelectPatient, onLogout }: OncologistDashboardProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const myPatients = patients.filter((p) => p.oncologistId === oncologist.id);
  const authAlerts = derivePendingAuthAlerts(myPatients);
  const feverAlerts = deriveFeverAlerts(myPatients);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5', fontFamily: 'Nunito, sans-serif', position: 'relative' }}>
      <RibbonBackground />

      {/* Header */}
      <header
        className="sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between border-b"
        style={{ backgroundColor: 'rgba(250,248,245,0.92)', backdropFilter: 'blur(8px)', borderColor: '#E5E7EB' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2D4739' }}>
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <span style={{ color: '#2D4739' }} className="text-sm">
              Onco<span style={{ color: '#7CAE8E' }}>+</span>Log
            </span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#E0E7FF', color: '#4338CA' }}>
              Clinical Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: '#374151' }}>{oncologist.fullName}</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{oncologist.department}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl transition-colors hover:bg-gray-100 flex items-center gap-1.5 text-sm"
            style={{ color: '#9CA3AF' }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <LoadingSpinner message="Loading patient directory..." />
        ) : (
          <div className="flex flex-col gap-5">

            {/* ── Clinical Notifications Panel ── */}
            <ClinicalNotificationsPanel
              authAlerts={authAlerts}
              feverAlerts={feverAlerts}
              onSelectPatient={onSelectPatient}
            />

            {/* ── Patient Directory ── */}
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: '#7CAE8E' }} />
              <h2 style={{ color: '#2D4739' }}>Active Patient Directory</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-full ml-auto"
                style={{ backgroundColor: '#D1FAE5', color: '#166534' }}
              >
                {myPatients.length} patients
              </span>
            </div>

            <div
              className="rounded-3xl overflow-hidden shadow-sm"
              style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
            >
              {/* Table Header */}
              <div
                className="grid px-5 py-3 text-xs"
                style={{
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  backgroundColor: '#F9FAFB',
                  borderBottom: '1.5px solid #E5E7EB',
                  color: '#6B7280',
                }}
              >
                <span>Patient</span>
                <span>Diagnosis</span>
                <span>Current Status</span>
                <span>Pending Action</span>
              </div>

              {myPatients.map((patient, idx) => {
                const activeCycle = patient.cycles.find((c) => getCycleStatus(c) === 'active');
                const heldCycle = patient.cycles.find((c) => getCycleStatus(c) === 'held');
                const pendingCycle = patient.cycles.find((c) => c.approvalStatus === 'pending');
                const activeRadiation = patient.radiationPhases.find((r) => r.status === 'active');

                // Derive row status label
                let statusLabel = 'Rest Period';
                let statusColor = '#1E40AF';
                let statusBg = '#DBEAFE';

                if (activeCycle) {
                  statusLabel = `Active — Cycle ${activeCycle.number}`;
                  statusColor = '#166534';
                  statusBg = '#D1FAE5';
                } else if (heldCycle) {
                  statusLabel = 'Treatment On Hold';
                  statusColor = '#991B1B';
                  statusBg = '#FEE2E2';
                } else if (activeRadiation) {
                  const done = getCompletedSessionCount(activeRadiation);
                  statusLabel = `Radiation ${done}/${activeRadiation.totalSessions}`;
                  statusColor = '#92400E';
                  statusBg = '#FEF9C3';
                }

                const latestLab = patient.labResults[patient.labResults.length - 1];

                // Pending actions column
                const hasFeverToday = patient.radiationPhases.some(
                  (r) => r.status === 'active' && hasFeverAlert(r).hasFever,
                );

                return (
                  <button
                    key={patient.id}
                    onClick={() => onSelectPatient(patient.id)}
                    className="grid w-full px-5 py-4 text-left transition-colors hover:bg-[#F0FAF4]"
                    style={{
                      gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      borderBottom: idx < myPatients.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}
                  >
                    {/* Patient Identity */}
                    <div>
                      <p className="text-sm" style={{ color: '#111827' }}>{patient.fullName}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: '#374151' }}>ת.ז. {patient.nationalId}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>DOB: {formatDate(patient.birthDate)}</p>
                    </div>

                    {/* Diagnosis */}
                    <div>
                      <p className="text-xs" style={{ color: '#374151' }}>{patient.diagnosis}</p>
                      {latestLab && (
                        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                          WBC: {latestLab.wbc} · Neut: {latestLab.neutrophils}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className="inline-block text-xs px-2 py-1 rounded-full"
                        style={{ backgroundColor: statusBg, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                      {heldCycle?.delayedTo && (
                        <p className="text-xs mt-1" style={{ color: '#991B1B' }}>
                          Delayed to {formatDate(heldCycle.delayedTo)}
                        </p>
                      )}
                      {activeRadiation && (
                        <p className="text-xs mt-1" style={{ color: '#92400E' }}>
                          ☢️ {activeRadiation.label}
                        </p>
                      )}
                    </div>

                    {/* Pending Action */}
                    <div className="flex flex-col gap-1">
                      {hasFeverToday && (
                        <span
                          className="inline-block text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                        >
                          🚨 Fever Alert
                        </span>
                      )}
                      {pendingCycle && (
                        <span
                          className="inline-block text-xs px-2 py-1 rounded-full"
                          style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
                        >
                          ⏳ Approve Cycle {pendingCycle.number}
                        </span>
                      )}
                      {!hasFeverToday && !pendingCycle && (
                        <span className="text-xs" style={{ color: '#9CA3AF' }}>No action needed</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-center" style={{ color: '#9CA3AF' }}>
              Click any patient row to view full clinical profile and authorize treatment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
