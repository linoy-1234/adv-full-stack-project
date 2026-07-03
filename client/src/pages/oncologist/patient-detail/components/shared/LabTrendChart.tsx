import { formatDate } from "../../../../../utils/mockData";
import type { ApiLabResult } from "../../../../../types/api";

export function LabTrendChart({ labResults }: { labResults: ApiLabResult[] }) {
  const sorted = [...labResults].sort((a, b) =>
    (a.testDate ?? "").localeCompare(b.testDate ?? "")
  );

  type Point = { date: string; WBC: number; Neutrophils: number; Hemoglobin: number };
  const data: Point[] = sorted.map((l, i) => ({
    date: `${formatDate((l.testDate ?? "").split("T")[0]).split(" ").slice(0, 2).join(" ")}_${i}`,
    WBC: l.wbc,
    Neutrophils: l.neutrophils,
    Hemoglobin: l.hemoglobin,
  }));

  if (data.length < 2) return null;

  const W = 600; const H = 150;
  const PAD = { top: 10, right: 10, bottom: 28, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const series = [
    { key: "WBC" as const, stroke: "#7CAE8E" },
    { key: "Neutrophils" as const, stroke: "#F59E0B" },
    { key: "Hemoglobin" as const, stroke: "#60A5FA" },
  ];
  const allVals = data.flatMap((d) => series.map((s) => d[s.key])).filter((v) => !isNaN(v));
  const minV = Math.min(...allVals, 1.5) - 0.5;
  const maxV = Math.max(...allVals, 15) + 0.5;
  const xScale = (i: number) =>
    PAD.left + (data.length < 2 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v: number) =>
    PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const pathD = (key: keyof Point) =>
    data.reduce((acc, d, i) => {
      const x = xScale(i); const y = yScale(d[key] as number);
      return acc === "" ? `M${x},${y}` : `${acc} L${x},${y}`;
    }, "");

  return (
    <div className="mt-4 pt-4 border-t border-[#F5F2EE]">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
        Trends Over Time
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <line x1={PAD.left} y1={yScale(4.0)} x2={W - PAD.right} y2={yScale(4.0)} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PAD.left} y1={yScale(1.5)} x2={W - PAD.right} y2={yScale(1.5)} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 3" />
        {series.map((s) => (
          <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) =>
          data.map((d, i) => (
            <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(d[s.key])} r={3} fill={s.stroke} />
          ))
        )}
        {data.map((d, i) => (
          <text key={`xl-${i}`} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9CA3AF">
            {d.date.split("_")[0]}
          </text>
        ))}
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <text key={`yl-${i}`} x={PAD.left - 4} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">
            {v.toFixed(1)}
          </text>
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
