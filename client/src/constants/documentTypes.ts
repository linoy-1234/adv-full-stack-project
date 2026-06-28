export const DOCUMENT_TYPE_VALUES = [
  "visit_summary",
  "medical_certificate",
  "prescription",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPE_VALUES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  visit_summary: "Visit Summary",
  medical_certificate: "Medical Certificate",
  prescription: "Prescription",
  other: "Other",
};

export const DOCUMENT_TYPE_BADGE_COLORS: Record<DocumentType, string> = {
  visit_summary: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medical_certificate: "bg-blue-50 text-blue-700 border-blue-200",
  prescription: "bg-violet-50 text-violet-700 border-violet-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};
