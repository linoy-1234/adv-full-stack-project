import { useState } from "react";
import { Stethoscope, X } from "lucide-react";

import type {
  TreatmentProtocolRecord,
  TreatmentTypeRecord,
} from "../../../../types/api";
import type { ProtocolFormResult } from "../patientDetailTypes";
import {
  getProtocolDrugs,
  getTreatmentCount,
  getTreatmentTypes,
  inputCls,
  labelCls,
} from "../patientDetailHelpers";

export function EditProtocolModal({
  protocol,
  profileDiagnosis,
  onClose,
  onSave,
}: {
  protocol: TreatmentProtocolRecord | null;
  profileDiagnosis: string;
  onClose: () => void;
  onSave: (result: ProtocolFormResult) => Promise<void>;
}) {
  const [form, setForm] = useState({
    protocolName: protocol?.protocolName || "",
    diagnosis: protocol?.diagnosis || profileDiagnosis,
    drugs: getProtocolDrugs(protocol).join(", "),
    notes: protocol?.notes || "",
    includeChemotherapy: getTreatmentTypes(protocol).includes("chemotherapy"),
    includeRadiation: getTreatmentTypes(protocol).includes("radiation"),
    includeSurgery: getTreatmentTypes(protocol).includes("surgery"),
    includeSupportive: getTreatmentTypes(protocol).includes("supportive"),
    numberOfChemoCycles: getTreatmentCount(protocol, "chemotherapy")?.toString() || "",
    numberOfRadiationSessions: getTreatmentCount(protocol, "radiation")?.toString() || "",
    numberOfSurgeryCheckpoints: getTreatmentCount(protocol, "surgery")?.toString() || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const treatmentTypes: TreatmentTypeRecord[] = [];

    if (form.includeChemotherapy) {
      treatmentTypes.push({
        type: "chemotherapy",
        plannedCount: Number(form.numberOfChemoCycles) || 1,
      });
    }
    if (form.includeRadiation) {
      treatmentTypes.push({
        type: "radiation",
        plannedCount: Number(form.numberOfRadiationSessions) || 1,
      });
    }
    if (form.includeSurgery) {
      treatmentTypes.push({
        type: "surgery",
        plannedCount: Number(form.numberOfSurgeryCheckpoints) || 1,
      });
    }
    if (form.includeSupportive) {
      treatmentTypes.push({ type: "supportive", plannedCount: 0 });
    }

    setSaving(true);
    await onSave({
      protocolName: form.protocolName.trim(),
      diagnosis: form.diagnosis.trim(),
      treatmentTypes:
        treatmentTypes.length > 0
          ? treatmentTypes
          : [{ type: "chemotherapy", plannedCount: 1 }],
      drugs: form.drugs
        .split(",")
        .map((drug) => drug.trim())
        .filter(Boolean),
      notes: form.notes.trim(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Stethoscope size={15} className="text-[#7CAE8E]" />{" "}
            {protocol ? "Edit Treatment Protocol" : "Create Treatment Protocol"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className={labelCls}>Protocol Name</label>
            <input
              className={inputCls}
              value={form.protocolName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  protocolName: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Diagnosis</label>
            <input
              className={inputCls}
              value={form.diagnosis}
              onChange={(event) =>
                setForm((current) => ({ ...current, diagnosis: event.target.value }))
              }
            />
          </div>

          <div>
            <label className={labelCls}>Treatment Types Included</label>
            <div className="space-y-2 bg-white rounded-lg border border-[#E5E2DC] p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeChemotherapy}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      includeChemotherapy: event.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]"
                />
                <span className="text-sm text-[#2C3E2D]">Chemotherapy</span>
              </label>
              {form.includeChemotherapy && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">
                    Number of Chemotherapy Cycles
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    value={form.numberOfChemoCycles}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfChemoCycles: event.target.value,
                      }))
                    }
                    placeholder="e.g., 6"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeRadiation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      includeRadiation: event.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]"
                />
                <span className="text-sm text-[#2C3E2D]">Radiation Therapy</span>
              </label>
              {form.includeRadiation && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">
                    Number of Radiation Sessions
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    value={form.numberOfRadiationSessions}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfRadiationSessions: event.target.value,
                      }))
                    }
                    placeholder="e.g., 30"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeSurgery}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      includeSurgery: event.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]"
                />
                <span className="text-sm text-[#2C3E2D]">Surgery Checkpoint</span>
              </label>
              {form.includeSurgery && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">
                    Number of Surgery Checkpoints
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    value={form.numberOfSurgeryCheckpoints}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfSurgeryCheckpoints: event.target.value,
                      }))
                    }
                    placeholder="e.g., 1"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includeSupportive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      includeSupportive: event.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]"
                />
                <span className="text-sm text-[#2C3E2D]">Supportive Treatment</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Drugs / Medications (comma separated)</label>
            <input
              className={inputCls}
              value={form.drugs}
              onChange={(event) =>
                setForm((current) => ({ ...current, drugs: event.target.value }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.protocolName.trim() || !form.diagnosis.trim()}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Protocol"}
          </button>
        </div>
      </div>
    </div>
  );
}
