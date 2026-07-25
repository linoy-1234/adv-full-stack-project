import { useEffect, useRef, useState } from "react";
import { FlaskConical, X, Check } from "lucide-react";
import { LAB_NORMS } from "../../utils/labUtils";
import { formatDate, TODAY } from "../../utils/dateUtils";
import ErrorMessage from "../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../components/common/FieldError";
import { focusFirstField } from "../../hooks/useErrorVisibility";
import type { ApiLabResult, PatientProfile } from "../../types/api";
import type { LabResultPayload } from "../../services/labService";

function labDate(lab: ApiLabResult): string {
  return (lab.testDate ?? "").split("T")[0];
}
interface LabEntryFormProps {
  patients: PatientProfile[];
  labStaffName: string;
  selectedPatientId: string | null;
  onPatientChange: (patientId: string) => void;
  onSave: (patientId: string, payload: LabResultPayload, labResultId?: string) => Promise<void>;
  onClose: () => void;
  editingLab?: ApiLabResult;
  saving: boolean;
  externalError: string;
}

export function LabEntryForm({
  patients,
  labStaffName,
  selectedPatientId,
  onPatientChange,
  onSave,
  onClose,
  editingLab,
  saving,
  externalError,
}: LabEntryFormProps) {
  const [patientId, setPatientId] = useState(
    editingLab?.patient ?? selectedPatientId ?? ""
  );
  const [date, setDate] = useState(editingLab ? labDate(editingLab) : TODAY);
  const [wbc, setWbc] = useState(editingLab?.wbc?.toString() ?? "");
  const [neutrophils, setNeutrophils] = useState(editingLab?.neutrophils?.toString() ?? "");
  const [hemoglobin, setHemoglobin] = useState(editingLab?.hemoglobin?.toString() ?? "");
  const [platelets, setPlatelets] = useState(editingLab?.platelets?.toString() ?? "");
  const [alt, setAlt] = useState(editingLab?.alt?.toString() ?? "");
  const [creatinine, setCreatinine] = useState(editingLab?.creatinine?.toString() ?? "");
  const [notes, setNotes] = useState(editingLab?.notes ?? "");
  const [error, setError] = useState("");
  type LabField =
    | "patient"
    | "date"
    | "wbc"
    | "neutrophils"
    | "hemoglobin"
    | "platelets"
    | "alt"
    | "creatinine"
    | "notes";
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<LabField, string>>
  >({});
  const fieldRefs = useRef<
    Partial<Record<LabField, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>
  >({});

  const inputCls =
    "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
  const labelCls =
    "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const clearError = () => {
    if (error) setError("");
  };
  const clearFieldError = (field: LabField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleSave = async () => {
    const nextErrors: Partial<Record<LabField, string>> = {};
    if (!patientId) nextErrors.patient = "Select a patient.";
    if (!date) nextErrors.date = "Test date is required.";
    const values: Array<[LabField, string, string]> = [
      ["wbc", wbc, "WBC"],
      ["neutrophils", neutrophils, "Neutrophils"],
      ["hemoglobin", hemoglobin, "Hemoglobin"],
      ["platelets", platelets, "Platelets"],
      ["alt", alt, "ALT"],
      ["creatinine", creatinine, "Creatinine"],
    ];
    values.forEach(([field, value, label]) => {
      if (!value.trim()) nextErrors[field] = `${label} is required.`;
      else if (!Number.isFinite(Number(value)) || Number(value) < 0)
        nextErrors[field] = `${label} must be zero or greater.`;
    });
    if (notes.trim().length > 1000)
      nextErrors.notes = "Notes cannot exceed 1,000 characters.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      const order: LabField[] = [
        "patient",
        "date",
        "wbc",
        "neutrophils",
        "hemoglobin",
        "platelets",
        "alt",
        "creatinine",
        "notes",
      ];
      focusFirstField(
        order.map((field) => ({
          current: nextErrors[field] ? fieldRefs.current[field] ?? null : null,
        }))
      );
      return;
    }

    const payload: LabResultPayload = {
      testDate: date,
      wbc: parseFloat(wbc),
      neutrophils: parseFloat(neutrophils),
      hemoglobin: parseFloat(hemoglobin),
      platelets: parseFloat(platelets),
      alt: parseFloat(alt),
      creatinine: parseFloat(creatinine),
      notes: notes.trim() || undefined,
    };

    setError("");
    setFieldErrors({});
    await onSave(patientId, payload, editingLab?._id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm py-8 px-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-[#7CAE8E]" />
            <h2 className="text-base font-semibold text-[#2C3E2D]">
              {editingLab ? "Edit Lab Results" : "Enter Lab Results"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <ErrorMessage message={error} />
          )}

          <div>
            <label className={labelCls}>Patient *</label>
            <select
              ref={(element) => {
                fieldRefs.current.patient = element;
              }}
              className={`${inputCls} ${fieldErrors.patient ? invalidFieldClass : ""}`}
              value={patientId}
              disabled={!!editingLab}
              onChange={(e) => {
                clearError();
                clearFieldError("patient");
                setPatientId(e.target.value);
                onPatientChange(e.target.value);
              }}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.email})
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.patient} />
          </div>

          <div>
            <label className={labelCls}>Date *</label>
            <input
              ref={(element) => {
                fieldRefs.current.date = element;
              }}
              className={`${inputCls} ${fieldErrors.date ? invalidFieldClass : ""}`}
              type="date"
              value={date}
              onChange={(e) => {
                clearError();
                clearFieldError("date");
                setDate(e.target.value);
              }}
            />
            <FieldError message={fieldErrors.date} />
          </div>

          <div className="border-t border-[#E5E2DC] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Blood Work Values *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>WBC (×10⁹/L) *</label>
                <input ref={(element) => { fieldRefs.current.wbc = element; }} className={`${inputCls} ${fieldErrors.wbc ? invalidFieldClass : ""}`} type="number" step="0.1" placeholder="e.g. 5.2" value={wbc} onChange={(e) => { clearError(); clearFieldError("wbc"); setWbc(e.target.value); }} />
                <FieldError message={fieldErrors.wbc} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.wbc.min}–{LAB_NORMS.wbc.max}</p>
              </div>
              <div>
                <label className={labelCls}>Neutrophils (×10⁹/L) *</label>
                <input ref={(element) => { fieldRefs.current.neutrophils = element; }} className={`${inputCls} ${fieldErrors.neutrophils ? invalidFieldClass : ""}`} type="number" step="0.1" placeholder="e.g. 2.8" value={neutrophils} onChange={(e) => { clearError(); clearFieldError("neutrophils"); setNeutrophils(e.target.value); }} />
                <FieldError message={fieldErrors.neutrophils} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.neutrophils.min}–{LAB_NORMS.neutrophils.max}</p>
              </div>
              <div>
                <label className={labelCls}>Hemoglobin (g/dL) *</label>
                <input ref={(element) => { fieldRefs.current.hemoglobin = element; }} className={`${inputCls} ${fieldErrors.hemoglobin ? invalidFieldClass : ""}`} type="number" step="0.1" placeholder="e.g. 12.0" value={hemoglobin} onChange={(e) => { clearError(); clearFieldError("hemoglobin"); setHemoglobin(e.target.value); }} />
                <FieldError message={fieldErrors.hemoglobin} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.hemoglobin.min}–{LAB_NORMS.hemoglobin.max}</p>
              </div>
              <div>
                <label className={labelCls}>Platelets (×10⁹/L) *</label>
                <input ref={(element) => { fieldRefs.current.platelets = element; }} className={`${inputCls} ${fieldErrors.platelets ? invalidFieldClass : ""}`} type="number" step="1" placeholder="e.g. 200" value={platelets} onChange={(e) => { clearError(); clearFieldError("platelets"); setPlatelets(e.target.value); }} />
                <FieldError message={fieldErrors.platelets} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.platelets.min}–{LAB_NORMS.platelets.max}</p>
              </div>
              <div>
                <label className={labelCls}>ALT (U/L) *</label>
                <input ref={(element) => { fieldRefs.current.alt = element; }} className={`${inputCls} ${fieldErrors.alt ? invalidFieldClass : ""}`} type="number" step="1" placeholder="e.g. 28" value={alt} onChange={(e) => { clearError(); clearFieldError("alt"); setAlt(e.target.value); }} />
                <FieldError message={fieldErrors.alt} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.alt.min}–{LAB_NORMS.alt.max}</p>
              </div>
              <div>
                <label className={labelCls}>Creatinine (mg/dL) *</label>
                <input ref={(element) => { fieldRefs.current.creatinine = element; }} className={`${inputCls} ${fieldErrors.creatinine ? invalidFieldClass : ""}`} type="number" step="0.01" placeholder="e.g. 0.85" value={creatinine} onChange={(e) => { clearError(); clearFieldError("creatinine"); setCreatinine(e.target.value); }} />
                <FieldError message={fieldErrors.creatinine} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.creatinine.min}–{LAB_NORMS.creatinine.max}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              ref={(element) => {
                fieldRefs.current.notes = element;
              }}
              className={`${inputCls} resize-none ${fieldErrors.notes ? invalidFieldClass : ""}`}
              rows={2}
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => {
                clearError();
                clearFieldError("notes");
                setNotes(e.target.value);
              }}
            />
            <FieldError message={fieldErrors.notes} />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E2DC]">
          <p className="text-xs text-[#9CA3AF]">
            Entered by: <strong>{labStaffName}</strong> · {formatDate(TODAY)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check size={13} /> {saving ? "Saving…" : editingLab ? "Update" : "Save Results"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────


