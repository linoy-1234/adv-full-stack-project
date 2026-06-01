import { useState, useEffect } from 'react';
import { Patient } from '../../components/mockData';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { LabFolderGrid } from '../../components/shared/LabFolderGrid';

interface BloodWorkProps {
  patient: Patient;
  showVitals?: boolean;
}

export function BloodWork({ patient }: BloodWorkProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <LoadingSpinner message="Loading your blood work history..." />;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: '#2D4739' }}>Blood Work History</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          {patient.labResults.length} recorded test{patient.labResults.length !== 1 ? 's' : ''} — {patient.diagnosis}
        </p>
      </div>

      <LabFolderGrid labResults={patient.labResults} fullMetrics={false} showVitals />

      <div
        className="rounded-2xl p-4 text-xs"
        style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FCD34D', color: '#92400E' }}
      >
        ⚠ Lab values are automatically synced from the hospital system. Always discuss any abnormal results with your oncologist before drawing conclusions.
      </div>
    </div>
  );
}
