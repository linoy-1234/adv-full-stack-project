import { useEffect, useState } from "react";
import { FlaskConical, X, Check } from "lucide-react";
import { LAB_NORMS } from "../../utils/labUtils";
import { formatDate, TODAY } from "../../utils/dateUtils";
import ErrorMessage from "../../components/common/ErrorMessage";
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

  const handleSave = async () => {
    if (!patientId) { setError("Please select a patient."); return; }
    if (!wbc || !neutrophils || !hemoglobin || !platelets || !alt || !creatinine) {
      setError("All lab values are required."); return;
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
              className={inputCls}
              value={patientId}
              disabled={!!editingLab}
              onChange={(e) => {
                clearError();
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
          </div>

          <div>
            <label className={labelCls}>Date *</label>
            <input
              className={inputCls}
              type="date"
              value={date}
              onChange={(e) => {
                clearError();
                setDate(e.target.value);
              }}
            />
          </div>

          <div className="border-t border-[#E5E2DC] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
              Blood Work Values *
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>WBC (×10⁹/L)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 5.2" value={wbc} onChange={(e) => { clearError(); setWbc(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.wbc.min}–{LAB_NORMS.wbc.max}</p>
              </div>
              <div>
                <label className={labelCls}>Neutrophils (×10⁹/L)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 2.8" value={neutrophils} onChange={(e) => { clearError(); setNeutrophils(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.neutrophils.min}–{LAB_NORMS.neutrophils.max}</p>
              </div>
              <div>
                <label className={labelCls}>Hemoglobin (g/dL)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 12.0" value={hemoglobin} onChange={(e) => { clearError(); setHemoglobin(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.hemoglobin.min}–{LAB_NORMS.hemoglobin.max}</p>
              </div>
              <div>
                <label className={labelCls}>Platelets (×10⁹/L)</label>
                <input className={inputCls} type="number" step="1" placeholder="e.g. 200" value={platelets} onChange={(e) => { clearError(); setPlatelets(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.platelets.min}–{LAB_NORMS.platelets.max}</p>
              </div>
              <div>
                <label className={labelCls}>ALT (U/L)</label>
                <input className={inputCls} type="number" step="1" placeholder="e.g. 28" value={alt} onChange={(e) => { clearError(); setAlt(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.alt.min}–{LAB_NORMS.alt.max}</p>
              </div>
              <div>
                <label className={labelCls}>Creatinine (mg/dL)</label>
                <input className={inputCls} type="number" step="0.01" placeholder="e.g. 0.85" value={creatinine} onChange={(e) => { clearError(); setCreatinine(e.target.value); }} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: {LAB_NORMS.creatinine.min}–{LAB_NORMS.creatinine.max}</p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => {
                clearError();
                setNotes(e.target.value);
              }}
            />
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


