export const TODAY = new Date().toISOString().slice(0, 10);

export function formatDate(iso: string): string {
  if (!iso) return "No date scheduled";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "No date scheduled";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function shiftDate(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
