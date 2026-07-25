import type { ReactNode } from "react";
import { Info } from "lucide-react";

export function SourceLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-2 py-0.5 rounded-full border border-[#E5E2DC]">
      <Info size={10} /> {text}
    </span>
  );
}

export function SectionCard({
  title,
  source,
  meta,
  editButton,
  children,
}: {
  title: string;
  source?: string;
  meta?: string;
  editButton?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#F5F2EE]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#2C3E2D]">{title}</h3>
          {source && <SourceLabel text={source} />}
          {meta && <p className="text-xs text-[#9CA3AF]">{meta}</p>}
        </div>
        {editButton}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
