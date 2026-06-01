import { Medication, Patient, getCycleStatus } from '../../components/mockData';

interface MyMedicationsProps {
  patient: Patient;
}

function RouteBadge({ route }: { route: 'IV' | 'oral' }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: route === 'IV' ? '#EDE9FE' : '#FEF9C3',
        color: route === 'IV' ? '#5B21B6' : '#92400E',
      }}
    >
      {route === 'IV' ? '💉 Via IV (Intravenous)' : '💊 Oral (By Mouth)'}
    </span>
  );
}

function MedCard({ med, isChemo }: { med: Medication; isChemo: boolean }) {
  const times = med.times;
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundColor: isChemo ? '#F5F3FF' : '#FFFFFF',
        border: `1.5px solid ${isChemo ? '#C4B5FD' : '#E5E7EB'}`,
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
        <div>
          <p className="text-sm" style={{ color: isChemo ? '#4C1D95' : '#111827' }}>
            {med.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {med.dose}
          </p>
        </div>
        <RouteBadge route={med.route} />
      </div>

      {isChemo ? (
        <div
          className="text-xs px-3 py-1.5 rounded-xl mt-1"
          style={{ backgroundColor: 'rgba(196,181,253,0.3)', color: '#5B21B6' }}
        >
          🏥 Administered in clinic on treatment Day 1 of each cycle
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mt-1">
          {times.map((t) => {
            const hour = parseInt(t.split(':')[0]);
            const isMorning = hour < 12;
            const isEvening = hour >= 18;
            const icon = isMorning ? '☀️' : isEvening ? '🌙' : '🕑';
            return (
              <span
                key={t}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
              >
                {icon} {t}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function MyMedications({ patient }: MyMedicationsProps) {
  const activeCycle = patient.cycles.find((c) => getCycleStatus(c) === 'active');
  const referenceCycle = activeCycle || patient.cycles.find((c) => getCycleStatus(c) === 'future');

  const chemoMeds = patient.medications.filter((m) => m.type === 'chemo');
  const supportiveMeds = patient.medications.filter((m) => m.type !== 'chemo');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: '#2D4739' }}>My Medications</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          {patient.diagnosis}
          {referenceCycle ? ` — Cycle ${referenceCycle.number} regimen` : ''}
        </p>
      </div>

      {/* Active Chemotherapy Protocol */}
      <div
        className="rounded-3xl p-5"
        style={{ backgroundColor: '#FAFAFA', border: '2px solid #DDD6FE' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ backgroundColor: '#EDE9FE' }}
          >
            🧬
          </div>
          <div>
            <h3 style={{ color: '#4C1D95' }}>Active Chemotherapy Protocol</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {referenceCycle
                ? `Cycle ${referenceCycle.number} — ${referenceCycle.drugs.join(' + ')}`
                : 'Current treatment drugs'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {chemoMeds.length > 0 ? (
            chemoMeds.map((med) => (
              <MedCard key={med.name} med={med} isChemo />
            ))
          ) : (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              No active chemotherapy drugs on record.
            </p>
          )}
        </div>

        <div
          className="mt-4 p-3 rounded-xl text-xs"
          style={{ backgroundColor: '#FFF7ED', color: '#92400E' }}
        >
          ⚠ Chemotherapy is administered intravenously at your oncology clinic. Do not self-administer.
        </div>
      </div>

      {/* Supportive & Daily Medications */}
      <div
        className="rounded-3xl p-5"
        style={{ backgroundColor: '#FAFAFA', border: '2px solid #E5E7EB' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ backgroundColor: '#D1FAE5' }}
          >
            🌿
          </div>
          <div>
            <h3 style={{ color: '#2D4739' }}>Supportive &amp; Daily Medications</h3>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              Take as prescribed — do not skip doses
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {supportiveMeds.length > 0 ? (
            supportiveMeds.map((med) => (
              <MedCard key={med.name} med={med} isChemo={false} />
            ))
          ) : (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              No daily supportive medications on record.
            </p>
          )}
        </div>
      </div>

      {/* Info note */}
      <div
        className="rounded-2xl p-4 text-xs"
        style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #A7F3D0', color: '#374151' }}
      >
        <strong style={{ color: '#166534' }}>Important:</strong> This is a reference for your prescribed regimen. Always follow your oncologist's most recent instructions. Contact your care team before skipping or adjusting any medication.
      </div>
    </div>
  );
}
