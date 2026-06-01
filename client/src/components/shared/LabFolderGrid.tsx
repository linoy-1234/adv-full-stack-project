import { useState } from 'react';
import { ChevronDown, ChevronUp, Thermometer, Weight, Heart } from 'lucide-react';
import { LabResult, LAB_NORMS, getLabStatus, getBPStatus, getTempStatus, formatDate } from '../mockData';

const ALL_LAB_KEYS = ['wbc', 'neutrophils', 'hemoglobin', 'platelets', 'alt', 'creatinine'] as const;
const SUMMARY_LAB_KEYS = ['wbc', 'neutrophils', 'hemoglobin', 'platelets'] as const;

function LabMetricCell({ keyName, value }: { keyName: string; value: number }) {
  const norm = LAB_NORMS[keyName];
  if (!norm) return null;
  const status = getLabStatus(keyName, value);
  const color = status === 'normal' ? '#166534' : status === 'low' ? '#DC2626' : '#D97706';
  const bg = status === 'normal' ? '#F0FAF4' : status === 'low' ? '#FEF2F2' : '#FFF7ED';
  const border = status === 'normal' ? '#A7F3D0' : status === 'low' ? '#FCA5A5' : '#FCD34D';
  const indicator = status === 'normal' ? '●' : status === 'low' ? '▼' : '▲';
  const pct = Math.min(100, Math.max(0, ((value - norm.min) / (norm.max - norm.min)) * 100));

  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs" style={{ color: '#6B7280' }}>{norm.label}</p>
        <span className="text-xs" style={{ color }}>{indicator}</span>
      </div>
      <p className="text-sm" style={{ color }}>
        {value} <span className="text-xs" style={{ color: '#9CA3AF' }}>{norm.unit}</span>
      </p>
      <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
        {norm.min}–{norm.max} {norm.unit}
      </p>
    </div>
  );
}

function VitalsPanel({ lab }: { lab: LabResult }) {
  const bpStatus = getBPStatus(lab.bloodPressure);
  const tempStatus = getTempStatus(lab.temperature);

  const bpColor = bpStatus === 'normal' ? '#166534' : bpStatus === 'elevated' ? '#D97706' : '#DC2626';
  const bpBg = bpStatus === 'normal' ? '#F0FAF4' : bpStatus === 'elevated' ? '#FFF7ED' : '#FEF2F2';
  const bpBorder = bpStatus === 'normal' ? '#A7F3D0' : bpStatus === 'elevated' ? '#FCD34D' : '#FCA5A5';
  const bpLabel = bpStatus === 'normal' ? '● Normal' : bpStatus === 'elevated' ? '▲ Elevated' : '▲ High';

  const tempColor = tempStatus === 'normal' ? '#166534' : tempStatus === 'high' ? '#DC2626' : '#1E40AF';
  const tempBg = tempStatus === 'normal' ? '#F0FAF4' : tempStatus === 'high' ? '#FEF2F2' : '#DBEAFE';
  const tempBorder = tempStatus === 'normal' ? '#A7F3D0' : tempStatus === 'high' ? '#FCA5A5' : '#93C5FD';
  const tempLabel = tempStatus === 'normal' ? '● Normal' : tempStatus === 'high' ? '▲ Elevated' : '▼ Low';

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: '#E5E7EB' }}>
      <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>Pre-Treatment Vitals</p>
      <div className="grid grid-cols-3 gap-2">
        {/* Blood Pressure */}
        <div className="rounded-xl p-2.5" style={{ backgroundColor: bpBg, border: `1.5px solid ${bpBorder}` }}>
          <div className="flex items-center gap-1 mb-1">
            <Heart className="w-3 h-3" style={{ color: bpColor }} />
            <p className="text-xs" style={{ color: '#6B7280' }}>BP</p>
          </div>
          <p className="text-sm" style={{ color: bpColor }}>{lab.bloodPressure}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>mmHg</p>
          <p className="text-xs mt-0.5" style={{ color: bpColor }}>{bpLabel}</p>
        </div>

        {/* Weight */}
        <div className="rounded-xl p-2.5" style={{ backgroundColor: '#F3F4F6', border: '1.5px solid #E5E7EB' }}>
          <div className="flex items-center gap-1 mb-1">
            <Weight className="w-3 h-3" style={{ color: '#6B7280' }} />
            <p className="text-xs" style={{ color: '#6B7280' }}>Weight</p>
          </div>
          <p className="text-sm" style={{ color: '#374151' }}>{lab.weight}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>kg</p>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>● Recorded</p>
        </div>

        {/* Temperature */}
        <div className="rounded-xl p-2.5" style={{ backgroundColor: tempBg, border: `1.5px solid ${tempBorder}` }}>
          <div className="flex items-center gap-1 mb-1">
            <Thermometer className="w-3 h-3" style={{ color: tempColor }} />
            <p className="text-xs" style={{ color: '#6B7280' }}>Temp</p>
          </div>
          <p className="text-sm" style={{ color: tempColor }}>{lab.temperature}°</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>Celsius</p>
          <p className="text-xs mt-0.5" style={{ color: tempColor }}>{tempLabel}</p>
        </div>
      </div>
    </div>
  );
}

interface LabFolderGridProps {
  labResults: LabResult[];
  fullMetrics?: boolean;
  showVitals?: boolean;
}

export function LabFolderGrid({ labResults, fullMetrics = false, showVitals = false }: LabFolderGridProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const sorted = [...labResults].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const history = sorted.slice(1);
  const keys = fullMetrics ? ALL_LAB_KEYS : SUMMARY_LAB_KEYS;

  function MetricsGrid({ lab }: { lab: LabResult }) {
    return (
      <div className="grid grid-cols-2 gap-2 mt-3">
        {keys.map((k) => (
          <LabMetricCell key={k} keyName={k} value={lab[k as keyof LabResult] as number} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Featured latest blood work */}
      {latest && (
        <div className="rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF', border: '2px solid #7CAE8E' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: '#D1FAE5' }}>
              🩸
            </div>
            <div>
              <p className="text-xs" style={{ color: '#7CAE8E' }}>Most Recent</p>
              <h3 style={{ color: '#2D4739' }}>Latest Blood Work</h3>
            </div>
            <span className="ml-auto text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#D1FAE5', color: '#166534' }}>
              {formatDate(latest.date)}
            </span>
          </div>
          <MetricsGrid lab={latest} />
          {showVitals && <VitalsPanel lab={latest} />}
        </div>
      )}

      {/* Historical folder grid */}
      {history.length > 0 && (
        <div>
          <h3 className="mb-3" style={{ color: '#2D4739' }}>Historical Results</h3>
          <div className="flex flex-col gap-3">
            {history.map((lab) => {
              const isOpen = expandedDate === lab.date;
              const labDate = new Date(lab.date);
              const shortLabel = labDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
              const abnormalCount = keys.filter((k) => getLabStatus(k, lab[k as keyof LabResult] as number) !== 'normal').length;

              return (
                <div key={lab.date}>
                  <button
                    onClick={() => setExpandedDate(isOpen ? null : lab.date)}
                    className="w-full rounded-2xl p-4 text-left flex items-center justify-between gap-3 transition-all"
                    style={{ backgroundColor: isOpen ? '#F0FAF4' : '#FFFFFF', border: `1.5px solid ${isOpen ? '#7CAE8E' : '#E5E7EB'}` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ backgroundColor: isOpen ? '#D1FAE5' : '#F3F4F6' }}
                      >
                        <span className="text-xs leading-none" style={{ color: '#9CA3AF' }}>
                          {labDate.toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="text-base leading-tight" style={{ color: isOpen ? '#166534' : '#374151' }}>
                          {labDate.getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: '#374151' }}>
                          Blood Test — {shortLabel}
                        </p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>{formatDate(lab.date)}</p>
                        {abnormalCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                            {abnormalCount} value{abnormalCount > 1 ? 's' : ''} out of range
                          </span>
                        )}
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#7CAE8E' }} />
                      : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                    }
                  </button>

                  {isOpen && (
                    <div
                      className="rounded-b-2xl px-4 pb-4"
                      style={{ backgroundColor: '#F0FAF4', border: '1.5px solid #7CAE8E', borderTop: 'none', marginTop: '-4px' }}
                    >
                      <MetricsGrid lab={lab} />
                      {showVitals && <VitalsPanel lab={lab} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {labResults.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No lab results recorded yet.</p>
      )}
    </div>
  );
}
