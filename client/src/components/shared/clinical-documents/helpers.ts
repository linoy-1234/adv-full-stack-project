import type { ClinicalDocumentRecord } from "../../../types/api";

export const inputCls =
  "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
export const labelCls =
  "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getUploaderName(
  uploadedBy: ClinicalDocumentRecord["uploadedBy"]
): string {
  if (typeof uploadedBy === "object" && uploadedBy.fullName)
    return uploadedBy.fullName;
  return "Oncologist";
}
