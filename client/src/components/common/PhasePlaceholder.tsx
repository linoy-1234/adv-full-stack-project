import type { ReactNode } from "react";

export function PhasePlaceholder({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="text-center py-8 text-sm text-[#9CA3AF]">
      <div className="mx-auto mb-2 w-8 h-8 rounded-full bg-[#F5F2EE] border border-[#E5E2DC] flex items-center justify-center text-[#7CAE8E]">
        {icon}
      </div>
      {children}
    </div>
  );
}
