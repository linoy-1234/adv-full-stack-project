import {
  PatientProfile,
  LabResult,
  getLabStatus,
  LabFieldKey,
  LAB_NORMS,
  formatDate,
} from "../mockData";
import { FlaskConical, Info } from "lucide-react";

interface BloodWorkProps {
  profile: PatientProfile;
  labResults: LabResult[];
}

function LabValueRow({ field, value }: { field: LabFieldKey; value: number }) {
  const status = getLabStatus(field, value);
  const norm = LAB_NORMS[field];
  const color = status === "normal" ? { bg: "#D1FAE5", text: "#166534" } : status === "low" ? { bg: "#FEF3C7", text: "#92400E" } : { bg: "#FEE2E2", text: "#991B1B" };
  const fieldLabels: Record<string, string> = {
    wbc: "WBC", neutrophils: "Neutrophils", hemoglobin: "Hemoglobin",
    platelets: "Platelets", alt: "ALT", creatinine: "Creatinine",
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#F5F2EE] last:border-0">
      <div>
        <span className="text-sm text-[#374151] font-medium">{fieldLabels[field]}</span>
        <span className="text-xs text-[#9CA3AF] ml-2">Normal: {norm.min}–{norm.max}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-[#2C3E2D]">{value}</span>
        {status !== "normal" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: color.bg, color: color.text }}>
            {status}
          </span>
        )}
        {status === "normal" && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#D1FAE5", color: "#166534" }}>✓</span>
        )}
      </div>
    </div>
  );
}

type ChartPoint = { date: string; WBC?: number; Neutrophils?: number; Hemoglobin?: number };

function BloodWorkChart({ data }: { data: ChartPoint[] }) {
  const W = 600; const H = 150; const PAD = { top: 10, right: 10, bottom: 28, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const series = [
    { key: "WBC" as const, stroke: "#7CAE8E" },
    { key: "Neutrophils" as const, stroke: "#F59E0B" },
    { key: "Hemoglobin" as const, stroke: "#60A5FA" },
  ];
  const allVals = data.flatMap((d) => series.map((s) => d[s.key] ?? null).filter((v) => v !== null)) as number[];
  const minV = Math.min(...allVals, 1.5) - 0.5;
  const maxV = Math.max(...allVals, 15) + 0.5;
  const xScale = (i: number) => PAD.left + (data.length < 2 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const pathD = (key: keyof ChartPoint) =>
    data.reduce((acc, d, i) => {
      const v = d[key] as number | undefined;
      if (v == null) return acc;
      const x = xScale(i); const y = yScale(v);
      return acc === "" ? `M${x},${y}` : `${acc} L${x},${y}`;
    }, "");
  return (
    <div className="bg-white border border-[#E5E2DC] rounded-2xl p-5">
      <p className="text-sm font-semibold text-[#2C3E2D] mb-4">Trends Over Time</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <line x1={PAD.left} y1={yScale(4.0)} x2={W - PAD.right} y2={yScale(4.0)} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PAD.left} y1={yScale(1.5)} x2={W - PAD.right} y2={yScale(1.5)} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 3" />
        {series.map((s) => (
          <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) =>
          data.map((d, i) => {
            const v = d[s.key] as number | undefined;
            if (v == null) return null;
            return <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill={s.stroke} />;
          })
        )}
        {data.map((d, i) => (
          <text key={`xl-${i}`} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9CA3AF">{d.date.split("_")[0]}</text>
        ))}
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <text key={`yl-${i}`} x={PAD.left - 4} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">{v.toFixed(1)}</text>
        ))}
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-[#9CA3AF]">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: s.stroke }} /> {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BloodWork({ profile, labResults }: BloodWorkProps) {
  const sortedLabs = [...labResults].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sortedLabs[0];

  const chartData = [...sortedLabs].reverse().map((l, i) => ({
    date: `${formatDate(l.date).split(" ").slice(0, 2).join(" ")}_${i}`,
    WBC: l.wbc,
    Neutrophils: l.neutrophils,
    Hemoglobin: l.hemoglobin,
  }));

  return (
    <div className="flex flex-col gap-5">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Lab results entered by Lab Staff — for oncologist review only. Do not adjust medications based on these values without consulting your oncologist.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>Blood Work</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          {sortedLabs.length} result{sortedLabs.length !== 1 ? "s" : ""} — {profile.diagnosis}
        </p>
      </div>

      {sortedLabs.length === 0 ? (
        <div className="bg-white border border-[#E5E2DC] rounded-2xl p-10 text-center">
          <FlaskConical size={32} className="mx-auto mb-3 text-[#9CA3AF] opacity-40" />
          <p className="text-sm text-[#9CA3AF]">No lab results have been entered yet. Lab Staff will add results after your blood draw.</p>
        </div>
      ) : (
        <>
          {/* Latest results */}
          {latest && (
            <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2C3E2D]">Latest Results — {formatDate(latest.date)}</p>
                  <p className="text-xs text-[#9CA3AF]">Entered by {latest.enteredBy} · {formatDate(latest.enteredAt)}</p>
                </div>
                {latest.linkedCycleId && (
                  <span className="text-xs text-[#7CAE8E] bg-[#F0F7F3] px-2 py-0.5 rounded-full border border-[#C8D9CC]">Linked to cycle</span>
                )}
              </div>
              <div className="px-5 divide-y divide-[#F5F2EE]">
                {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => (
                  <LabValueRow key={field} field={field} value={latest[field]} />
                ))}
              </div>
              {latest.notes && (
                <div className="px-5 py-3 bg-[#F5F2EE] border-t border-[#E5E2DC] text-xs text-[#6B7280]">
                  Note: {latest.notes}
                </div>
              )}
            </div>
          )}

          {/* Trend chart */}
          {chartData.length > 1 && <BloodWorkChart data={chartData} />}

          {/* History */}
          {sortedLabs.length > 1 && (
            <div className="bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC]">
                <p className="text-sm font-semibold text-[#2C3E2D]">Lab History</p>
              </div>
              {sortedLabs.slice(1).map((lab) => (
                <div key={lab.id} className="px-5 py-3 border-b border-[#F5F2EE] last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-[#2C3E2D]">{formatDate(lab.date)}</p>
                    <p className="text-xs text-[#9CA3AF]">by {lab.enteredBy}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                    {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => {
                      const status = getLabStatus(field, lab[field]);
                      const tc = status === "low" ? "text-amber-700" : status === "high" ? "text-red-700" : "text-emerald-700";
                      return (
                        <span key={field} className="flex items-center gap-1">
                          <span className="text-[#9CA3AF] capitalize w-20 shrink-0">{field}</span>
                          <span className={`font-medium ${tc}`}>{lab[field]}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
