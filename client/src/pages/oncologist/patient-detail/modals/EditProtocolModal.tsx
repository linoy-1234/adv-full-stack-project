import { useRef, useState } from "react";
import { Stethoscope, X } from "lucide-react";

import ErrorMessage from "../../../../../components/common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../../../components/common/FieldError";
import { focusFirstField } from "../../../../../hooks/useErrorVisibility";
import type {
  TreatmentProtocolRecord,
  TreatmentTypeRecord,
} from "../../../../../types/api";
import type { ProtocolFormResult } from "../../types";
import {
  getProtocolDrugs,
  getTreatmentCount,
  getTreatmentTypes,
  inputCls,
  labelCls,
} from "../../helpers";

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
  type QuantityField =
    | "numberOfChemoCycles"
    | "numberOfRadiationSessions"
    | "numberOfSurgeryCheckpoints";
  type ProtocolField =
    | "protocolName"
    | "diagnosis"
    | "drugs"
    | "notes"
    | QuantityField;

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
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<ProtocolField, string>>
  >({});
  const [formError, setFormError] = useState("");
  const protocolNameRef = useRef<HTMLInputElement | null>(null);
  const diagnosisRef = useRef<HTMLInputElement | null>(null);
  const chemoCountRef = useRef<HTMLInputElement | null>(null);
  const radiationCountRef = useRef<HTMLInputElement | null>(null);
  const surgeryCountRef = useRef<HTMLInputElement | null>(null);
  const drugsRef = useRef<HTMLInputElement | null>(null);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);

  const quantityError = (value: string, label: string) => {
    const trimmed = value.trim();
    const parsed = Number(trimmed);

    if (
      !trimmed ||
      Number.isNaN(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < 1
    ) {
      return `${label} must be a whole number of at least 1.`;
    }

    return "";
  };

  const requiredCount = (field: QuantityField) => {
    const parsed = Number(form[field]);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const clearFieldError = (field: ProtocolField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleSave = async () => {
    const nextErrors: Partial<Record<ProtocolField, string>> = {};
    const protocolName = form.protocolName.trim();
    const diagnosis = form.diagnosis.trim();
    const drugs = form.drugs
      .split(",")
      .map((drug) => drug.trim())
      .filter(Boolean);

    if (!protocolName) nextErrors.protocolName = "Protocol name is required.";
    else if (protocolName.length < 2)
      nextErrors.protocolName = "Protocol name must be at least 2 characters.";
    else if (protocolName.length > 120)
      nextErrors.protocolName = "Protocol name cannot exceed 120 characters.";

    if (!diagnosis) nextErrors.diagnosis = "Diagnosis is required.";
    else if (diagnosis.length < 2)
      nextErrors.diagnosis = "Diagnosis must be at least 2 characters.";
    else if (diagnosis.length > 160)
      nextErrors.diagnosis = "Diagnosis cannot exceed 160 characters.";

    if (form.includeChemotherapy) {
      const error = quantityError(
        form.numberOfChemoCycles,
        "Number of chemotherapy cycles"
      );
      if (error) nextErrors.numberOfChemoCycles = error;
    }

    if (form.includeRadiation) {
      const error = quantityError(
        form.numberOfRadiationSessions,
        "Number of radiation sessions"
      );
      if (error) nextErrors.numberOfRadiationSessions = error;
    }

    if (form.includeSurgery) {
      const error = quantityError(
        form.numberOfSurgeryCheckpoints,
        "Number of surgery checkpoints"
      );
      if (error) nextErrors.numberOfSurgeryCheckpoints = error;
    }

    if (drugs.some((drug) => drug.length > 100)) {
      nextErrors.drugs = "Each drug or medication must be 100 characters or fewer.";
    }
    if (form.notes.trim().length > 1000) {
      nextErrors.notes = "Notes cannot exceed 1,000 characters.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.protocolName ? protocolNameRef : { current: null },
        nextErrors.diagnosis ? diagnosisRef : { current: null },
        nextErrors.numberOfChemoCycles
          ? chemoCountRef
          : { current: null },
        nextErrors.numberOfRadiationSessions
          ? radiationCountRef
          : { current: null },
        nextErrors.numberOfSurgeryCheckpoints
          ? surgeryCountRef
          : { current: null },
        nextErrors.drugs ? drugsRef : { current: null },
        nextErrors.notes ? notesRef : { current: null },
      ]);
      return;
    }

    const treatmentTypes: TreatmentTypeRecord[] = [];

    if (form.includeChemotherapy) {
      treatmentTypes.push({
        type: "chemotherapy",
        plannedCount: requiredCount("numberOfChemoCycles"),
      });
    }
    if (form.includeRadiation) {
      treatmentTypes.push({
        type: "radiation",
        plannedCount: requiredCount("numberOfRadiationSessions"),
      });
    }
    if (form.includeSurgery) {
      treatmentTypes.push({
        type: "surgery",
        plannedCount: requiredCount("numberOfSurgeryCheckpoints"),
      });
    }
    if (form.includeSupportive) {
      treatmentTypes.push({ type: "supportive", plannedCount: 0 });
    }

    setSaving(true);
    setFieldErrors({});
    setFormError("");
    try {
      await onSave({
        protocolName,
        diagnosis,
        treatmentTypes,
        drugs,
        notes: form.notes.trim(),
      });
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to save protocol"
      );
    } finally {
      setSaving(false);
    }
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
          {formError && <ErrorMessage message={formError} />}
          <div>
            <label className={labelCls}>Protocol Name *</label>
            <input
              ref={protocolNameRef}
              className={`${inputCls} ${
                fieldErrors.protocolName ? invalidFieldClass : ""
              }`}
              value={form.protocolName}
              aria-invalid={!!fieldErrors.protocolName}
              aria-describedby={
                fieldErrors.protocolName ? "protocol-name-error" : undefined
              }
              onChange={(event) => {
                clearFieldError("protocolName");
                setForm((current) => ({
                  ...current,
                  protocolName: event.target.value,
                }));
              }}
            />
            <FieldError
              id="protocol-name-error"
              message={fieldErrors.protocolName}
            />
          </div>
          <div>
            <label className={labelCls}>Diagnosis *</label>
            <input
              ref={diagnosisRef}
              className={`${inputCls} ${
                fieldErrors.diagnosis ? invalidFieldClass : ""
              }`}
              value={form.diagnosis}
              aria-invalid={!!fieldErrors.diagnosis}
              aria-describedby={
                fieldErrors.diagnosis ? "protocol-diagnosis-error" : undefined
              }
              onChange={(event) => {
                clearFieldError("diagnosis");
                setForm((current) => ({ ...current, diagnosis: event.target.value }));
              }}
            />
            <FieldError
              id="protocol-diagnosis-error"
              message={fieldErrors.diagnosis}
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
                    Number of Chemotherapy Cycles *
                  </label>
                  <input
                    ref={chemoCountRef}
                    type="number"
                    min="1"
                    className={`${inputCls} ${
                      fieldErrors.numberOfChemoCycles
                        ? "border-red-300 focus:ring-red-300"
                        : ""
                    }`}
                    value={form.numberOfChemoCycles}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfChemoCycles: event.target.value,
                      }))
                    }
                    onInput={() => clearFieldError("numberOfChemoCycles")}
                    placeholder="e.g., 6"
                  />
                  <FieldError message={fieldErrors.numberOfChemoCycles} />
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
                    Number of Radiation Sessions *
                  </label>
                  <input
                    ref={radiationCountRef}
                    type="number"
                    min="1"
                    className={`${inputCls} ${
                      fieldErrors.numberOfRadiationSessions
                        ? "border-red-300 focus:ring-red-300"
                        : ""
                    }`}
                    value={form.numberOfRadiationSessions}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfRadiationSessions: event.target.value,
                      }))
                    }
                    onInput={() =>
                      clearFieldError("numberOfRadiationSessions")
                    }
                    placeholder="e.g., 30"
                  />
                  <FieldError message={fieldErrors.numberOfRadiationSessions} />
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
                    Number of Surgery Checkpoints *
                  </label>
                  <input
                    ref={surgeryCountRef}
                    type="number"
                    min="1"
                    className={`${inputCls} ${
                      fieldErrors.numberOfSurgeryCheckpoints
                        ? "border-red-300 focus:ring-red-300"
                        : ""
                    }`}
                    value={form.numberOfSurgeryCheckpoints}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        numberOfSurgeryCheckpoints: event.target.value,
                      }))
                    }
                    onInput={() =>
                      clearFieldError("numberOfSurgeryCheckpoints")
                    }
                    placeholder="e.g., 1"
                  />
                  <FieldError message={fieldErrors.numberOfSurgeryCheckpoints} />
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
              ref={drugsRef}
              className={`${inputCls} ${fieldErrors.drugs ? invalidFieldClass : ""}`}
              value={form.drugs}
              onChange={(event) => {
                clearFieldError("drugs");
                setForm((current) => ({ ...current, drugs: event.target.value }));
              }}
            />
            <FieldError message={fieldErrors.drugs} />
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              ref={notesRef}
              className={`${inputCls} resize-none ${
                fieldErrors.notes ? invalidFieldClass : ""
              }`}
              rows={3}
              value={form.notes}
              onChange={(event) => {
                clearFieldError("notes");
                setForm((current) => ({ ...current, notes: event.target.value }));
              }}
            />
            <FieldError message={fieldErrors.notes} />
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
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Protocol"}
          </button>
        </div>
      </div>
    </div>
  );
}

