export const LAB_NORMS = {
  wbc: { min: 4.0, max: 11.0 },
  neutrophils: { min: 1.5, max: 8.0 },
  hemoglobin: { min: 12.0, max: 17.5 },
  platelets: { min: 150, max: 400 },
  alt: { min: 7, max: 56 },
  creatinine: { min: 0.6, max: 1.2 },
};

export type LabFieldKey = keyof typeof LAB_NORMS;

export function getLabStatus(
  field: LabFieldKey,
  value: number
): "normal" | "low" | "high" {
  const norm = LAB_NORMS[field];
  if (value < norm.min) return "low";
  if (value > norm.max) return "high";
  return "normal";
}
