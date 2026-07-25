export function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2 min-w-0">
      <span className="text-xs text-[#9CA3AF] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#2C3E2D] min-w-0 flex-1 break-words">{value || "-"}</span>
    </div>
  );
}
