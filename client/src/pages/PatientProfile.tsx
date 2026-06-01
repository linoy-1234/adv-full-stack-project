import { AlertTriangle, CheckCircle, Droplets, Layers, User } from 'lucide-react';
import { Patient, formatDate } from './../components/mockData';

interface PatientProfileProps {
  patient: Patient;
  viewerRole?: 'patient' | 'oncologist';
}

const BLOOD_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+':  { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  'A-':  { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  'B+':  { bg: '#FEF9C3', text: '#92400E', border: '#FCD34D' },
  'B-':  { bg: '#FEF9C3', text: '#92400E', border: '#FCD34D' },
  'AB+': { bg: '#EDE9FE', text: '#4C1D95', border: '#C4B5FD' },
  'AB-': { bg: '#EDE9FE', text: '#4C1D95', border: '#C4B5FD' },
  'O+':  { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
  'O-':  { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
};

function StaticProtocolSummary({ patient }: { patient: Patient }) {
  const numCycles = patient.cycles.length;
  const numSessions = patient.radiationPhases.reduce((sum, r) => sum + r.totalSessions, 0);
  const numSurgeries = patient.surgeries.length;

  if (numCycles === 0 && numSessions === 0 && numSurgeries === 0) return null;

  const parts: string[] = [];
  if (numCycles > 0) parts.push(`${numCycles} Chemotherapy Cycle${numCycles > 1 ? 's' : ''}`);
  if (numSessions > 0) parts.push(`${numSessions} Radiation Session${numSessions > 1 ? 's' : ''}`);
  if (numSurgeries > 0) parts.push(`${numSurgeries} Surgery Checkpoint${numSurgeries > 1 ? 's' : ''}`);

  return (
    <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-5 h-5" style={{ color: '#7CAE8E' }} />
        <h3 style={{ color: '#2D4739' }}>Current Treatment Protocol</h3>
      </div>
      <p className="text-sm" style={{ color: '#374151' }}>
        {parts.join(' · ')}
      </p>
    </div>
  );
}

export function PatientProfile({ patient, viewerRole = 'patient' }: PatientProfileProps) {
  const hasAllergies = patient.allergies.length > 0;
  const btColor = BLOOD_TYPE_COLORS[patient.bloodType] ?? { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
      <div>
        <h2 style={{ color: '#2D4739' }}>Patient Profile</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Permanent clinical record — read only
        </p>
      </div>

      {/* Identity card */}
      <div
        className="rounded-3xl p-5"
        style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            <User className="w-7 h-7" style={{ color: '#7CAE8E' }} />
          </div>
          <div>
            <h3 style={{ color: '#111827' }}>{patient.fullName}</h3>
            <p className="text-xs mt-0.5 font-mono" style={{ color: '#6B7280' }}>
              ת.ז. {patient.nationalId}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Row label="Date of Birth" value={formatDate(patient.birthDate)} />
          <Row label="Diagnosis" value={patient.diagnosis} />
          {viewerRole === 'oncologist' && (
            <Row label="Oncologist ID" value={patient.oncologistId} />
          )}
        </div>
      </div>

      {/* Blood Type */}
      <div
        className="rounded-3xl p-5"
        style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5" style={{ color: '#7CAE8E' }} />
          <h3 style={{ color: '#2D4739' }}>Blood Type</h3>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: btColor.bg, border: `2px solid ${btColor.border}` }}
          >
            <span style={{ color: btColor.text }}>{patient.bloodType}</span>
          </div>
          <div>
            <p className="text-sm" style={{ color: '#374151' }}>
              {patient.bloodType.endsWith('+') ? 'Rh Positive' : 'Rh Negative'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Universal compatibility must be verified before transfusions.
            </p>
            {patient.bloodType === 'O-' && (
              <span
                className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block"
                style={{ backgroundColor: '#DBEAFE', color: '#1E40AF' }}
              >
                🩸 Universal Donor
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div
        className="rounded-3xl p-5"
        style={{
          backgroundColor: hasAllergies ? '#FFF5F5' : '#F0FAF4',
          border: `2px solid ${hasAllergies ? '#FCA5A5' : '#A7F3D0'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          {hasAllergies
            ? <AlertTriangle className="w-5 h-5" style={{ color: '#DC2626' }} />
            : <CheckCircle className="w-5 h-5" style={{ color: '#7CAE8E' }} />
          }
          <h3 style={{ color: hasAllergies ? '#991B1B' : '#166534' }}>
            {hasAllergies ? 'Known Drug Allergies' : 'No Known Drug Allergies'}
          </h3>
          {hasAllergies && (
            <span
              className="ml-auto text-xs px-2.5 py-1 rounded-full"
              style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
            >
              ⚠ {patient.allergies.length} allergen{patient.allergies.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {hasAllergies ? (
          <>
            <div
              className="rounded-2xl p-3 mb-4 text-xs"
              style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
            >
              <strong>⚠ Clinical Alert:</strong> Verify all administered medications and contrast agents against this allergy profile before treatment initiation.
            </div>
            <div className="flex flex-col gap-2">
              {patient.allergies.map((allergy) => (
                <div
                  key={allergy}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ backgroundColor: '#FFFFFF', border: '1.5px solid #FCA5A5' }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: '#EF4444' }} />
                  <span className="text-sm" style={{ color: '#374151' }}>{allergy}</span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
                  >
                    AVOID
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: '#166534' }}>
            No drug allergies are recorded in this patient's clinical profile.
          </p>
        )}
      </div>

      {/* Static Protocol Blueprint */}
      <StaticProtocolSummary patient={patient} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-b-0" style={{ borderColor: '#F3F4F6' }}>
      <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-sm text-right" style={{ color: '#374151' }}>{value}</span>
    </div>
  );
}
