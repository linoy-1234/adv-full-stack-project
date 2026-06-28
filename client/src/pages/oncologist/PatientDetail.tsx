import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Home,
  Info,
  Pencil,
  Pill,
  Scissors,
  Stethoscope,
  Syringe,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { MessagesPanel } from "../../components/shared/MessagesPanel";
import { ClinicalDocumentsPanel } from "../../components/shared/ClinicalDocumentsPanel";
import { SymptomJournalPanel } from "../../components/shared/SymptomJournalPanel";

import { RibbonBackground } from "../../components/shared/RibbonBackground";
import { formatDate, shiftDate, getLabStatus, LAB_NORMS, type LabFieldKey } from "../../utils/mockData";
import {
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getSurgeryDisplayStatus,
  toDateInputValue,
  todayIso,
  type ChemoDisplayStatus,
  type SurgeryDisplayStatus,
} from "../../utils/treatmentDisplay";
import { getPatientLabs } from "../../services/labService";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  clearPatientsError,
  editPatient,
  fetchPatientById,
} from "../../store/slices/patientsSlice";
import {
  approveCycle,
  createCycle,
  createProtocol,
  delayCycle,
  deleteCycle,
  getPatientProtocol,
  updateCycle,
  updateProtocol,
  type CyclePayload,
  type MedicationPayload,
  type ProtocolPayload,
} from "../../services/treatmentService";
import type { PatientPayload } from "../../services/patientService";
import type {
  ApiLabResult,
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
  TreatmentCycleRecord,
  TreatmentCycleStatus,
  TreatmentKind,
  TreatmentMedicationCategory,
  TreatmentMedicationRecord,
  TreatmentProtocolRecord,
  TreatmentProtocolResponse,
  TreatmentTypeRecord,
} from "../../types/api";

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onHome: () => void;
}

type ModalName = "profile" | "medications" | "protocol" | "dates" | null;
type MedicationCategory = TreatmentMedicationCategory;
type TreatmentItemType = TreatmentKind;

interface MedicationFormRecord {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  timing: string;
  category: MedicationCategory;
  notes: string;
}

interface ProtocolFormResult {
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypeRecord[];
  drugs: string[];
  notes: string;
}

function SourceLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-2 py-0.5 rounded-full border border-[#E5E2DC]">
      <Info size={10} /> {text}
    </span>
  );
}

function SectionCard({
  title,
  source,
  meta,
  editButton,
  children,
}: {
  title: string;
  source?: string;
  meta?: string;
  editButton?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 py-4 border-b border-[#F5F2EE]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[#2C3E2D]">{title}</h3>
          {source && <SourceLabel text={source} />}
          {meta && <p className="text-xs text-[#9CA3AF]">{meta}</p>}
        </div>
        {editButton}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-[#9CA3AF] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#2C3E2D]">{value || "-"}</span>
    </div>
  );
}

function PhasePlaceholder({
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

function TypeIcon({ type }: { type: string }) {
  if (type === "chemotherapy") return <Syringe size={14} className="text-[#7CAE8E]" />;
  if (type === "radiation") return <Zap size={14} className="text-amber-500" />;
  if (type === "surgery") return <Scissors size={14} className="text-blue-500" />;
  return <Pill size={14} className="text-gray-400" />;
}

function CycleDisplayBadge({ displayStatus }: { displayStatus: ChemoDisplayStatus }) {
  const cfg: Record<ChemoDisplayStatus, { label: string; color: string }> = {
    completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
    approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
    active: { label: "Active", color: "bg-[#7CAE8E] text-white" },
    waiting_labs: { label: "Waiting for labs", color: "bg-amber-100 text-amber-700" },
    ready_for_review: { label: "Ready for Review", color: "bg-violet-100 text-violet-700" },
    delayed: { label: "Delayed", color: "bg-red-100 text-red-700" },
    upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-700" },
  };
  const { label, color } = cfg[displayStatus];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

const inputCls =
  "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
const labelCls =
  "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";
const bloodTypes = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const getAllergyNames = (allergies?: PatientAllergy[]) =>
  (allergies ?? []).map((allergy) => allergy.name).filter(Boolean);

const normalizeBloodType = (value?: string) => {
  const normalized = (value || "unknown").trim();
  return bloodTypes.includes(normalized) ? normalized : "unknown";
};

const getPersonName = (value?: string | { fullName?: string } | null) => {
  if (typeof value === "object" && value?.fullName) return value.fullName;
  return "";
};

const getOncologistName = (profile: ApiPatientProfile) => {
  if (typeof profile.oncologist === "object") {
    return profile.oncologist.fullName;
  }
  return "Assigned oncologist";
};

const getPatientMeta = (profile: ApiPatientProfile) => {
  const updatedDate = profile.updatedAt || profile.createdAt;
  return updatedDate ? `Last updated ${formatDate(updatedDate)}` : undefined;
};

const getProtocolMeta = (protocol: TreatmentProtocolRecord) => {
  const updatedBy =
    getPersonName(protocol.updatedBy) ||
    (typeof protocol.oncologist === "object" ? protocol.oncologist.fullName : "") ||
    "oncologist";
  const updatedAt = protocol.updatedAt || protocol.createdAt;

  return updatedAt
    ? `Last updated by ${updatedBy} - ${formatDate(updatedAt)}`
    : `Last updated by ${updatedBy}`;
};

const getTreatmentCount = (
  protocol: TreatmentProtocolRecord | null,
  type: TreatmentItemType
) =>
  protocol?.treatmentTypes.find((entry) => entry.type === type)?.plannedCount ?? 0;

const getTreatmentTypes = (protocol: TreatmentProtocolRecord | null) =>
  protocol?.treatmentTypes.map((entry) => entry.type) ?? [];

const categoryColor: Record<MedicationCategory, string> = {
  chemotherapy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supportive: "bg-blue-50 text-blue-700 border-blue-200",
  chronic: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const categoryLabel: Record<MedicationCategory, string> = {
  chemotherapy: "Chemotherapy",
  supportive: "Supportive",
  chronic: "Chronic / Background",
  other: "Other",
};

const typeLabel: Record<TreatmentItemType, string> = {
  chemotherapy: "Chemotherapy",
  radiation: "Radiation",
  surgery: "Surgery",
  supportive: "Supportive",
};

const getMedicationId = (medication: TreatmentMedicationRecord) =>
  medication.id || medication._id || `med-${medication.name}`;

const normalizeMedication = (
  medication: TreatmentMedicationRecord
): MedicationFormRecord => ({
  id: getMedicationId(medication),
  name: medication.name || "",
  dose: medication.dose || "",
  route: medication.route || "IV",
  frequency: medication.frequency || medication.schedule || "",
  timing: medication.timing || "",
  category: medication.category || "other",
  notes: medication.notes || "",
});

const getProtocolDrugs = (protocol: TreatmentProtocolRecord | null) => {
  if (!protocol) return [];
  if (protocol.drugs?.length) return protocol.drugs;

  return protocol.medications
    .filter((medication) => medication.category === "chemotherapy")
    .map((medication) => medication.name)
    .filter(Boolean);
};

const getMedicationPlan = (protocol: TreatmentProtocolRecord | null) => {
  if (!protocol) return [];

  const medications = protocol.medications.map(normalizeMedication);
  const existingNames = new Set(
    medications.map((medication) => medication.name.trim().toLowerCase())
  );

  getProtocolDrugs(protocol).forEach((drug) => {
    const key = drug.trim().toLowerCase();
    if (!key || existingNames.has(key)) return;

    medications.push({
      id: `drug-${key}`,
      name: drug,
      dose: "",
      route: "",
      frequency: "",
      timing: "",
      category: "chemotherapy",
      notes: "Listed in treatment protocol",
    });
  });

  return medications;
};

const medicationToPayload = (medication: MedicationFormRecord): MedicationPayload => ({
  id: medication.id,
  name: medication.name.trim(),
  dose: medication.dose.trim(),
  route: medication.route.trim(),
  frequency: medication.frequency.trim(),
  timing: medication.timing.trim(),
  schedule: [medication.frequency.trim(), medication.timing.trim()]
    .filter(Boolean)
    .join(" - "),
  category: medication.category,
  notes: medication.notes.trim(),
});

const emptyMedicationForm = (): MedicationFormRecord => ({
  id: "",
  name: "",
  dose: "",
  route: "IV",
  frequency: "",
  timing: "",
  category: "chemotherapy",
  notes: "",
});

const prepareMedicationDraft = (
  medication: MedicationFormRecord
): MedicationFormRecord | null => {
  const name = medication.name.trim();

  if (!name) return null;

  return {
    ...medication,
    id: medication.id || `med-${Date.now()}`,
    name,
    dose: medication.dose.trim(),
    route: medication.route.trim(),
    frequency: medication.frequency.trim(),
    timing: medication.timing.trim(),
    notes: medication.notes.trim(),
  };
};

const sortCycles = (cycles: TreatmentCycleRecord[]) =>
  [...cycles].sort((a, b) => {
    const dateA = toDateInputValue(a.startDate || a.plannedDate);
    const dateB = toDateInputValue(b.startDate || b.plannedDate);
    return dateA.localeCompare(dateB) || a.cycleNumber - b.cycleNumber;
  });

const getRoadmapItemTitle = (cycle: TreatmentCycleRecord) => {
  if (cycle.treatmentType === "chemotherapy") {
    return cycle.title || `Cycle ${cycle.cycleNumber}`;
  }

  if (cycle.treatmentType === "radiation") {
    return cycle.title && !/^cycle\b/i.test(cycle.title)
      ? cycle.title
      : cycle.cycleNumber > 1
      ? `Radiation Course ${cycle.cycleNumber}`
      : "Radiation Course";
  }

  if (cycle.treatmentType === "surgery") {
    return cycle.title && !/^cycle\b/i.test(cycle.title) && cycle.title !== "Surgery Checkpoint"
      ? cycle.title
      : `Surgery Checkpoint ${cycle.cycleNumber}`;
  }

  return cycle.title;
};
const toCyclePayload = (cycle: TreatmentCycleRecord): Partial<CyclePayload> => ({
  treatmentType: cycle.treatmentType,
  cycleNumber: cycle.cycleNumber,
  title: cycle.title,
  startDate: toDateInputValue(cycle.startDate),
  endDate: toDateInputValue(cycle.endDate),
  plannedDate: toDateInputValue(cycle.plannedDate) || undefined,
  totalSessions: cycle.totalSessions || 0,
  completedSessions: cycle.completedSessions || 0,
  medications: cycle.medications || [],
  notes: cycle.notes || "",
});

const makeGeneratedCycle = (
  treatmentType: "chemotherapy" | "radiation" | "surgery",
  cycleNumber: number,
  title: string,
  startDate: string,
  endDate: string,
  extra: Partial<CyclePayload> = {}
): CyclePayload => ({
  treatmentType,
  cycleNumber,
  title,
  startDate,
  endDate,
  status: treatmentType === "radiation" ? "upcoming" : "upcoming",
  notes: "",
  ...extra,
});

const buildInitialCycles = (result: ProtocolFormResult): CyclePayload[] => {
  const cycles: CyclePayload[] = [];
  const chemoCount =
    result.treatmentTypes.find((entry) => entry.type === "chemotherapy")?.plannedCount || 0;
  const radiationSessions =
    result.treatmentTypes.find((entry) => entry.type === "radiation")?.plannedCount || 0;
  const surgeryCount =
    result.treatmentTypes.find((entry) => entry.type === "surgery")?.plannedCount || 0;
  let referenceDate = todayIso();

  for (let index = 0; index < chemoCount; index += 1) {
    const startDate = index === 0 ? referenceDate : shiftDate(referenceDate, 21);
    const endDate = shiftDate(startDate, 20);
    cycles.push(
      makeGeneratedCycle("chemotherapy", index + 1, `Cycle ${index + 1}`, startDate, endDate)
    );
    referenceDate = endDate;
  }

  if (radiationSessions > 0) {
    const startDate = shiftDate(referenceDate, chemoCount > 0 ? 7 : 0);
    const endDate = shiftDate(startDate, Math.max(1, Math.ceil((radiationSessions * 7) / 5)));
    cycles.push(
      makeGeneratedCycle("radiation", 1, "Radiation Course", startDate, endDate, {
        totalSessions: radiationSessions,
        completedSessions: 0,
      })
    );
    referenceDate = endDate;
  }

  for (let index = 0; index < surgeryCount; index += 1) {
    const plannedDate = shiftDate(todayIso(), 30 + index * 14);
    cycles.push(
      makeGeneratedCycle(
        "surgery",
        index + 1,
        `Surgery Checkpoint ${index + 1}`,
        plannedDate,
        plannedDate,
        { plannedDate }
      )
    );
  }

  return cycles.length > 0
    ? cycles
    : [makeGeneratedCycle("chemotherapy", 1, "Cycle 1", todayIso(), shiftDate(todayIso(), 20))];
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

function EditProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: ApiPatientProfile;
  onClose: () => void;
  onSave: (patientData: Partial<PatientPayload>) => Promise<string | null>;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    nationalId: profile.nationalId,
    dateOfBirth: toDateInputValue(profile.dateOfBirth),
    diagnosis: profile.diagnosis,
    bloodType: normalizeBloodType(profile.bloodType),
    allergiesRaw: getAllergyNames(profile.allergies).join(", "),
    notes: profile.notes || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.nationalId.trim() ||
      !form.dateOfBirth ||
      !form.diagnosis.trim()
    ) {
      setError(
        "Full name, email, national ID, date of birth, and diagnosis are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    const saveError = await onSave({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      nationalId: form.nationalId.trim(),
      dateOfBirth: form.dateOfBirth,
      diagnosis: form.diagnosis.trim(),
      bloodType: normalizeBloodType(form.bloodType),
      allergies: form.allergiesRaw
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          severity: "unknown" as const,
          notes: "",
        })),
      notes: form.notes.trim(),
    });

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Pencil size={15} className="text-[#7CAE8E]" /> Edit Medical Profile
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Full Name</label>
              <input
                className={inputCls}
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>National ID</label>
              <input
                className={inputCls}
                value={form.nationalId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nationalId: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input
                className={inputCls}
                type="date"
                value={form.dateOfBirth}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dateOfBirth: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Blood Type</label>
              <select
                className={inputCls}
                value={form.bloodType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bloodType: event.target.value,
                  }))
                }
              >
                {bloodTypes.map((bloodType) => (
                  <option key={bloodType} value={bloodType}>
                    {bloodType === "unknown" ? "Unknown" : bloodType}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Diagnosis</label>
              <input
                className={inputCls}
                value={form.diagnosis}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    diagnosis: event.target.value,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Allergies (comma separated)</label>
              <input
                className={inputCls}
                value={form.allergiesRaw}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    allergiesRaw: event.target.value,
                  }))
                }
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </div>
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
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMedicationsModal({
  medications: initialMedications,
  onClose,
  onSave,
}: {
  medications: MedicationFormRecord[];
  onClose: () => void;
  onSave: (medications: MedicationFormRecord[]) => Promise<void>;
}) {
  const [medications, setMedications] = useState<MedicationFormRecord[]>(
    initialMedications.map((medication) => ({ ...medication }))
  );
  const [medForm, setMedForm] = useState<MedicationFormRecord>({
    ...emptyMedicationForm(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addMedication = () => {
    const draft = prepareMedicationDraft(medForm);

    if (!draft) return;

    setMedications((current) => [
      ...current,
      draft,
    ]);
    setMedForm(emptyMedicationForm());
    setError("");
  };

  const removeMedication = (id: string) =>
    setMedications((current) => current.filter((medication) => medication.id !== id));

  const updateMedication = (
    id: string,
    field: keyof MedicationFormRecord,
    value: string
  ) => {
    setMedications((current) =>
      current.map((medication) =>
        medication.id === id ? { ...medication, [field]: value } : medication
      )
    );
  };

  const saveMedications = async () => {
    const draft = prepareMedicationDraft(medForm);
    const medicationsToSave = draft ? [...medications, draft] : medications;

    setSaving(true);
    setError("");

    try {
      await onSave(medicationsToSave);
      setSaving(false);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save medications"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Pill size={15} className="text-[#7CAE8E]" /> Edit Medication Plan
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {medications.map((medication) => (
            <div
              key={medication.id}
              className="bg-white rounded-xl px-3 py-3 border border-[#E5E2DC] space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Medication
                </p>
                <button
                  onClick={() => removeMedication(medication.id)}
                  className="text-[#9CA3AF] hover:text-red-500"
                  disabled={saving}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Name</label>
                  <input
                    className={inputCls}
                    value={medication.name}
                    onChange={(event) =>
                      updateMedication(medication.id, "name", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Dose</label>
                  <input
                    className={inputCls}
                    value={medication.dose}
                    onChange={(event) =>
                      updateMedication(medication.id, "dose", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Route</label>
                  <select
                    className={inputCls}
                    value={medication.route}
                    onChange={(event) =>
                      updateMedication(medication.id, "route", event.target.value)
                    }
                  >
                    {["IV", "oral", "subcutaneous", "topical", "other"].map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    className={inputCls}
                    value={medication.category}
                    onChange={(event) =>
                      updateMedication(medication.id, "category", event.target.value)
                    }
                  >
                    <option value="chemotherapy">Chemotherapy</option>
                    <option value="supportive">Supportive</option>
                    <option value="chronic">Chronic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Frequency</label>
                  <input
                    className={inputCls}
                    value={medication.frequency}
                    onChange={(event) =>
                      updateMedication(medication.id, "frequency", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Timing</label>
                  <input
                    className={inputCls}
                    value={medication.timing}
                    onChange={(event) =>
                      updateMedication(medication.id, "timing", event.target.value)
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Notes</label>
                  <input
                    className={inputCls}
                    value={medication.notes}
                    onChange={(event) =>
                      updateMedication(medication.id, "notes", event.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white border border-dashed border-[#C8D9CC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
              Add Medication
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  className={inputCls}
                  value={medForm.name}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Dose</label>
                <input
                  className={inputCls}
                  value={medForm.dose}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, dose: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Route</label>
                <select
                  className={inputCls}
                  value={medForm.route}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, route: event.target.value }))
                  }
                >
                  {["IV", "oral", "subcutaneous", "topical", "other"].map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  className={inputCls}
                  value={medForm.category}
                  onChange={(event) =>
                    setMedForm((current) => ({
                      ...current,
                      category: event.target.value as MedicationCategory,
                    }))
                  }
                >
                  <option value="chemotherapy">Chemotherapy</option>
                  <option value="supportive">Supportive</option>
                  <option value="chronic">Chronic</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Frequency</label>
                <input
                  className={inputCls}
                  value={medForm.frequency}
                  onChange={(event) =>
                    setMedForm((current) => ({
                      ...current,
                      frequency: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Timing</label>
                <input
                  className={inputCls}
                  value={medForm.timing}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, timing: event.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Notes</label>
                <input
                  className={inputCls}
                  value={medForm.notes}
                  onChange={(event) =>
                    setMedForm((current) => ({ ...current, notes: event.target.value }))
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addMedication}
              className="text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium flex items-center gap-1"
            >
              + Add
            </button>
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
            onClick={saveMedications}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Medications"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProtocolModal({
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

function EditTreatmentDatesModal({
  cycles,
  onClose,
  onSave,
}: {
  cycles: TreatmentCycleRecord[];
  onClose: () => void;
  onSave: (cycles: TreatmentCycleRecord[], removedCycleIds: string[]) => Promise<void>;
}) {
  const [items, setItems] = useState<TreatmentCycleRecord[]>(
    cycles.map((cycle) => ({ ...cycle }))
  );
  const [removedCycleIds, setRemovedCycleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const updateItem = (id: string, field: keyof TreatmentCycleRecord, value: string | number) => {
    setItems((current) =>
      current.map((item) => (item._id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item._id !== id));
    setRemovedCycleIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const updateChemoStartDate = (changedId: string, newStart: string) => {
    setItems((current) => {
      const changedItem = current.find((item) => item._id === changedId);
      if (!changedItem) return current;

      const oldStart = toDateInputValue(changedItem.startDate);
      if (!oldStart || !newStart) return current;

      const deltaDays = Math.round(
        (new Date(newStart).getTime() - new Date(oldStart).getTime()) / 86_400_000
      );
      if (deltaDays === 0) return current;

      // Chemo cycles sorted by cycleNumber; shift the changed one and everything after it
      const changedCycleNumber = changedItem.cycleNumber;

      return current.map((item) => {
        if (item.treatmentType !== "chemotherapy") return item;
        if (item.cycleNumber < changedCycleNumber) return item;

        const s = toDateInputValue(item.startDate);
        const e = toDateInputValue(item.endDate);
        return {
          ...item,
          startDate: s ? shiftDate(s, deltaDays) : item.startDate,
          endDate: e ? shiftDate(e, deltaDays) : item.endDate,
        };
      });
    });
  };

  const saveDates = async () => {
    setSaving(true);
    await onSave(items, removedCycleIds);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Calendar size={15} className="text-[#7CAE8E]" /> Edit Treatment Dates
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white border border-[#E5E2DC] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {item.treatmentType === "chemotherapy" && (
                    <Syringe size={13} className="text-[#7CAE8E]" />
                  )}
                  {item.treatmentType === "radiation" && (
                    <Zap size={13} className="text-amber-500" />
                  )}
                  {item.treatmentType === "surgery" && (
                    <Scissors size={13} className="text-blue-500" />
                  )}
                  <span className="text-sm font-medium text-[#2C3E2D]">
                    {getRoadmapItemTitle(item)}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">({item.treatmentType})</span>
                </div>
                <button
                  onClick={() => removeItem(item._id)}
                  className="text-[#9CA3AF] hover:text-red-500"
                  disabled={saving}
                  title="Remove from roadmap"
                  aria-label={`Remove ${getRoadmapItemTitle(item)} from roadmap`}
                >
                  <X size={14} />
                </button>
              </div>

              {item.treatmentType === "chemotherapy" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateChemoStartDate(item._id, event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {item.treatmentType === "radiation" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.startDate)}
                      onChange={(event) => updateItem(item._id, "startDate", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.endDate)}
                      onChange={(event) => updateItem(item._id, "endDate", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Total Sessions</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={item.totalSessions || 0}
                      onChange={(event) =>
                        updateItem(item._id, "totalSessions", Number(event.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Completed Sessions</label>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      value={item.completedSessions || 0}
                      onChange={(event) =>
                        updateItem(item._id, "completedSessions", Number(event.target.value))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {item.treatmentType === "surgery" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Planned Date</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={toDateInputValue(item.plannedDate || item.startDate)}
                      onChange={(event) => {
                        updateItem(item._id, "plannedDate", event.target.value);
                        updateItem(item._id, "startDate", event.target.value);
                        updateItem(item._id, "endDate", event.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Notes</label>
                    <input
                      className={inputCls}
                      value={item.notes || ""}
                      onChange={(event) => updateItem(item._id, "notes", event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
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
            onClick={saveDates}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Dates"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabTrendChart({ labResults }: { labResults: ApiLabResult[] }) {
  const sorted = [...labResults].sort((a, b) =>
    (a.testDate ?? "").localeCompare(b.testDate ?? "")
  );

  type Point = { date: string; WBC: number; Neutrophils: number; Hemoglobin: number };
  const data: Point[] = sorted.map((l, i) => ({
    date: `${formatDate((l.testDate ?? "").split("T")[0]).split(" ").slice(0, 2).join(" ")}_${i}`,
    WBC: l.wbc,
    Neutrophils: l.neutrophils,
    Hemoglobin: l.hemoglobin,
  }));

  if (data.length < 2) return null;

  const W = 600; const H = 150;
  const PAD = { top: 10, right: 10, bottom: 28, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const series = [
    { key: "WBC" as const, stroke: "#7CAE8E" },
    { key: "Neutrophils" as const, stroke: "#F59E0B" },
    { key: "Hemoglobin" as const, stroke: "#60A5FA" },
  ];
  const allVals = data.flatMap((d) => series.map((s) => d[s.key])).filter((v) => !isNaN(v));
  const minV = Math.min(...allVals, 1.5) - 0.5;
  const maxV = Math.max(...allVals, 15) + 0.5;
  const xScale = (i: number) =>
    PAD.left + (data.length < 2 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yScale = (v: number) =>
    PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const pathD = (key: keyof Point) =>
    data.reduce((acc, d, i) => {
      const x = xScale(i); const y = yScale(d[key] as number);
      return acc === "" ? `M${x},${y}` : `${acc} L${x},${y}`;
    }, "");

  return (
    <div className="mt-4 pt-4 border-t border-[#F5F2EE]">
      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
        Trends Over Time
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <line x1={PAD.left} y1={yScale(4.0)} x2={W - PAD.right} y2={yScale(4.0)} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PAD.left} y1={yScale(1.5)} x2={W - PAD.right} y2={yScale(1.5)} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 3" />
        {series.map((s) => (
          <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) =>
          data.map((d, i) => (
            <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(d[s.key])} r={3} fill={s.stroke} />
          ))
        )}
        {data.map((d, i) => (
          <text key={`xl-${i}`} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9CA3AF">
            {d.date.split("_")[0]}
          </text>
        ))}
        {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
          <text key={`yl-${i}`} x={PAD.left - 4} y={yScale(v) + 3} textAnchor="end" fontSize={9} fill="#9CA3AF">
            {v.toFixed(1)}
          </text>
        ))}
      </svg>
      <div className="flex gap-4 mt-2 text-xs text-[#9CA3AF]">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: s.stroke }} /> {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}

function DelayCycleModal({
  cycle,
  onClose,
  onConfirm,
}: {
  cycle: TreatmentCycleRecord;
  onClose: () => void;
  onConfirm: (reason: string, newStartDate: string, newEndDate: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const confirmDelay = async () => {
    if (!reason.trim() || !newStartDate || !newEndDate) return;

    setSaving(true);
    await onConfirm(reason.trim(), newStartDate, newEndDate);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D]">Delay {cycle.title}</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <div>
            <label className={labelCls}>Reason for Delay</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Clinical reason for delaying this cycle..."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New Start Date</label>
              <input
                className={inputCls}
                type="date"
                value={newStartDate}
                onChange={(event) => setNewStartDate(event.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>New End Date</label>
              <input
                className={inputCls}
                type="date"
                value={newEndDate}
                onChange={(event) => setNewEndDate(event.target.value)}
              />
            </div>
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
            onClick={confirmDelay}
            disabled={saving || !reason.trim() || !newStartDate || !newEndDate}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Confirm Delay"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PatientDetail({ patientId, onBack, onHome }: PatientDetailProps) {
  const dispatch = useAppDispatch();
  const {
    selectedPatient,
    loading,
    error: patientsError,
  } = useAppSelector((state) => state.patients);
  const [modal, setModal] = useState<ModalName>(null);
  const [protocol, setProtocol] = useState<TreatmentProtocolRecord | null>(null);
  const [cycles, setCycles] = useState<TreatmentCycleRecord[]>([]);
  const [treatmentLoading, setTreatmentLoading] = useState(false);
  const [treatmentError, setTreatmentError] = useState("");
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [cycleToDelay, setCycleToDelay] = useState<TreatmentCycleRecord | null>(null);

  const [labResults, setLabResults] = useState<ApiLabResult[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labHistoryExpanded, setLabHistoryExpanded] = useState(false);

  useEffect(() => {
    dispatch(clearPatientsError());
    dispatch(fetchPatientById(patientId));
  }, [dispatch, patientId]);

  useEffect(() => {
    setLabsLoading(true);
    getPatientLabs(patientId)
      .then((res) => setLabResults(res.labResults))
      .catch(() => setLabResults([]))
      .finally(() => setLabsLoading(false));
  }, [patientId]);

  const applyTreatmentResponse = (response: TreatmentProtocolResponse) => {
    setProtocol(response.protocol || null);
    setCycles(sortCycles(response.cycles || []));
  };

  const refreshTreatment = async () => {
    setTreatmentLoading(true);
    setTreatmentError("");

    try {
      const response = await getPatientProtocol(patientId);
      applyTreatmentResponse(response);
    } catch (error) {
      const maybeResponse = error as { response?: { status?: number } };
      if (maybeResponse.response?.status === 404) {
        setProtocol(null);
        setCycles([]);
      } else {
        setTreatmentError(
          getApiErrorMessage(error, "Failed to load treatment protocol")
        );
      }
    } finally {
      setTreatmentLoading(false);
    }
  };

  useEffect(() => {
    void refreshTreatment();
  }, [patientId]);

  const profile =
    selectedPatient && selectedPatient._id === patientId ? selectedPatient : null;
  const allergies = getAllergyNames(profile?.allergies);

  const medicationPlan = useMemo(() => getMedicationPlan(protocol), [protocol]);
  const chemoCycles = cycles.filter((cycle) => cycle.treatmentType === "chemotherapy");
  const radiationCycles = cycles.filter((cycle) => cycle.treatmentType === "radiation");
  const surgeryCycles = cycles.filter((cycle) => cycle.treatmentType === "surgery");

  const handleSaveProfile = async (
    patientData: Partial<PatientPayload>
  ): Promise<string | null> => {
    try {
      await dispatch(editPatient({ patientId, patientData })).unwrap();
      return null;
    } catch (error) {
      return typeof error === "string" ? error : "Failed to update patient";
    }
  };

  const handleSaveMedications = async (medications: MedicationFormRecord[]) => {
    if (!protocol) {
      throw new Error("Create a treatment protocol before saving medications");
    }

    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const payloadMedications = medications
        .filter((medication) => medication.name.trim())
        .map(medicationToPayload);
      const response = await updateProtocol(protocol._id, {
        medications: payloadMedications,
        drugs: payloadMedications
          .filter((medication) => medication.category === "chemotherapy")
          .map((medication) => medication.name),
      });
      applyTreatmentResponse(response);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to save medications");
      setTreatmentError(message);
      throw new Error(message);
    } finally {
      setSavingTreatment(false);
    }
  };

  const syncCyclesToProtocol = async (
    protocolId: string,
    result: ProtocolFormResult,
    currentCycles: TreatmentCycleRecord[]
  ) => {
    const targetChemo =
      result.treatmentTypes.find((entry) => entry.type === "chemotherapy")?.plannedCount || 0;
    const targetRadiation =
      result.treatmentTypes.find((entry) => entry.type === "radiation")?.plannedCount || 0;
    const targetSurgery =
      result.treatmentTypes.find((entry) => entry.type === "surgery")?.plannedCount || 0;
    const existingChemo = currentCycles.filter(
      (cycle) => cycle.treatmentType === "chemotherapy"
    );
    const existingRadiation = currentCycles.filter(
      (cycle) => cycle.treatmentType === "radiation"
    );
    const existingSurgery = currentCycles.filter(
      (cycle) => cycle.treatmentType === "surgery"
    );

    for (const cycle of existingChemo.slice(targetChemo)) {
      await deleteCycle(cycle._id);
    }

    let chemoReferenceEnd =
      targetChemo > 0 && existingChemo.length > 0
        ? toDateInputValue(existingChemo[Math.min(existingChemo.length, targetChemo) - 1].endDate)
        : "";

    for (let index = existingChemo.length; index < targetChemo; index += 1) {
      const startDate = chemoReferenceEnd ? shiftDate(chemoReferenceEnd, 1) : todayIso();
      const endDate = shiftDate(startDate, 20);
      chemoReferenceEnd = endDate;
      await createCycle(
        protocolId,
        makeGeneratedCycle("chemotherapy", index + 1, `Cycle ${index + 1}`, startDate, endDate)
      );
    }

    if (targetRadiation > 0) {
      if (existingRadiation.length > 0) {
        const [firstRadiation, ...extraRadiation] = existingRadiation;
        await updateCycle(firstRadiation._id, {
          totalSessions: targetRadiation,
          completedSessions: firstRadiation.completedSessions || 0,
        });
        for (const cycle of extraRadiation) await deleteCycle(cycle._id);
      } else {
        const startDate =
          targetChemo > 0 && chemoReferenceEnd
            ? shiftDate(chemoReferenceEnd, 7)
            : todayIso();
        const endDate = shiftDate(startDate, Math.max(1, Math.ceil((targetRadiation * 7) / 5)));
        await createCycle(
          protocolId,
          makeGeneratedCycle("radiation", 1, "Radiation Course", startDate, endDate, {
            totalSessions: targetRadiation,
            completedSessions: 0,
          })
        );
      }
    } else {
      for (const cycle of existingRadiation) await deleteCycle(cycle._id);
    }

    for (const cycle of existingSurgery.slice(targetSurgery)) {
      await deleteCycle(cycle._id);
    }
    for (let index = existingSurgery.length; index < targetSurgery; index += 1) {
      const plannedDate = shiftDate(todayIso(), 30 + index * 14);
      await createCycle(
        protocolId,
        makeGeneratedCycle(
          "surgery",
          index + 1,
          `Surgery Checkpoint ${index + 1}`,
          plannedDate,
          plannedDate,
          { plannedDate }
        )
      );
    }
  };

  const handleSaveProtocol = async (result: ProtocolFormResult) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      if (!protocol) {
        const payload: ProtocolPayload = {
          protocolName: result.protocolName,
          diagnosis: result.diagnosis,
          treatmentTypes: result.treatmentTypes,
          medications: [],
          drugs: result.drugs,
          notes: result.notes,
          cycles: buildInitialCycles(result),
        };
        const response = await createProtocol(patientId, payload);
        applyTreatmentResponse(response);
        return;
      }

      const response = await updateProtocol(protocol._id, {
        protocolName: result.protocolName,
        diagnosis: result.diagnosis,
        treatmentTypes: result.treatmentTypes,
        drugs: result.drugs,
        notes: result.notes,
      });
      applyTreatmentResponse(response);
      await syncCyclesToProtocol(protocol._id, result, response.cycles || cycles);
      await refreshTreatment();
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to save protocol"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleSaveDates = async (
    updatedCycles: TreatmentCycleRecord[],
    removedCycleIds: string[]
  ) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      for (const cycleId of removedCycleIds) {
        await deleteCycle(cycleId);
      }

      for (const cycle of updatedCycles) {
        const payload = toCyclePayload(cycle);
        if (cycle.treatmentType === "surgery") {
          payload.plannedDate = toDateInputValue(cycle.plannedDate || cycle.startDate);
          payload.startDate = payload.plannedDate;
          payload.endDate = payload.plannedDate;
        }
        await updateCycle(cycle._id, payload);
      }
      await refreshTreatment();
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to save treatment dates"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleApprove = async (cycle: TreatmentCycleRecord) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const response = await approveCycle(cycle._id);
      applyTreatmentResponse(response);
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to approve cycle"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const handleDelay = async (
    cycle: TreatmentCycleRecord,
    reason: string,
    newStartDate: string,
    newEndDate: string
  ) => {
    setSavingTreatment(true);
    setTreatmentError("");

    try {
      const response = await delayCycle(cycle._id, {
        delayReason: reason,
        newStartDate,
        newEndDate,
      });
      applyTreatmentResponse(response);
    } catch (error) {
      setTreatmentError(getApiErrorMessage(error, "Failed to delay cycle"));
    } finally {
      setSavingTreatment(false);
    }
  };

  const headerTitle = profile?.fullName || "Patient Detail";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2C3E2D] transition-colors"
            >
              <ArrowLeft size={15} /> Directory
            </button>
            <span className="text-[#E5E2DC]">-</span>
            <h1 className="text-sm font-semibold text-[#2C3E2D]">
              {headerTitle}
            </h1>
            {allergies.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertTriangle size={10} /> Allergies
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9CA3AF]">
              {profile ? getOncologistName(profile) : "Oncologist"}
            </span>
            <button onClick={onHome} className="text-[#9CA3AF] hover:text-[#6B7280]">
              <Home size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5 relative z-10">
        {!profile && (
          <SectionCard title="Patient Medical Profile" source="Created by oncologist">
            {patientsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
                <span>{patientsError}</span>
                <button
                  type="button"
                  onClick={() => dispatch(clearPatientsError())}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-[#9CA3AF]">
                {loading ? "Loading patient profile..." : "Loading patient profile..."}
              </div>
            )}
          </SectionCard>
        )}

        {profile && (
          <>
            {patientsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between gap-3">
                <span>{patientsError}</span>
                <button
                  type="button"
                  onClick={() => dispatch(clearPatientsError())}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {treatmentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between gap-3">
                <span>{treatmentError}</span>
                <button
                  type="button"
                  onClick={() => setTreatmentError("")}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <SectionCard
              title="Patient Medical Profile"
              source="Created by oncologist"
              meta={getPatientMeta(profile)}
              editButton={
                <button
                  onClick={() => setModal("profile")}
                  className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg"
                >
                  <Pencil size={12} /> Edit Profile
                </button>
              }
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow label="Full Name" value={profile.fullName} />
                <MetaRow label="Email" value={profile.email} />
                <MetaRow label="National ID" value={profile.nationalId} />
                <MetaRow
                  label="Date of Birth"
                  value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "-"}
                />
                <MetaRow
                  label="Blood Type"
                  value={
                    profile.bloodType && profile.bloodType !== "unknown"
                      ? profile.bloodType
                      : "Unknown"
                  }
                />
                <MetaRow label="Oncologist" value={getOncologistName(profile)} />
                <div className="col-span-2">
                  <MetaRow label="Diagnosis" value={profile.diagnosis} />
                </div>
                {allergies.length > 0 && (
                  <div className="col-span-2 flex gap-2 items-center">
                    <span className="text-xs text-[#9CA3AF] w-28 shrink-0">
                      Allergies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {allergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs border border-red-200"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile.notes && (
                  <div className="col-span-2">
                    <MetaRow label="Notes" value={profile.notes} />
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="Medication Plan"
              source="Medication list created by oncologist"
              meta={protocol ? getProtocolMeta(protocol) : undefined}
              editButton={
                protocol && (
                  <button
                    onClick={() => setModal("medications")}
                    disabled={savingTreatment}
                    className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
                  >
                    <Pencil size={12} /> Edit Medications
                  </button>
                )
              }
            >
              {treatmentLoading ? (
                <PhasePlaceholder icon={<Pill size={16} />}>
                  Loading medication plan...
                </PhasePlaceholder>
              ) : !protocol ? (
                <PhasePlaceholder icon={<Pill size={16} />}>
                  Create a treatment protocol to manage medications.
                </PhasePlaceholder>
              ) : medicationPlan.length === 0 ? (
                <p className="text-sm text-[#9CA3AF]">No medications added yet.</p>
              ) : (
                <div className="space-y-2">
                  {(["chemotherapy", "supportive", "chronic", "other"] as MedicationCategory[]).map(
                    (category) => {
                      const medications = medicationPlan.filter(
                        (medication) => medication.category === category
                      );
                      if (!medications.length) return null;

                      return (
                        <div key={category}>
                          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                            {categoryLabel[category]}
                          </p>
                          <div className="space-y-1.5">
                            {medications.map((medication) => (
                              <div
                                key={medication.id}
                                className={`flex items-start justify-between rounded-lg px-3 py-2 border text-sm ${categoryColor[category]}`}
                              >
                                <div>
                                  <span className="font-medium">{medication.name}</span>
                                  {(medication.dose || medication.route) && (
                                    <span className="text-xs ml-2 opacity-70">
                                      {[medication.dose, medication.route]
                                        .filter(Boolean)
                                        .join(" - ")}
                                    </span>
                                  )}
                                  {(medication.frequency || medication.timing) && (
                                    <div className="text-xs opacity-70 mt-0.5">
                                      {[medication.frequency, medication.timing]
                                        .filter(Boolean)
                                        .join(" - ")}
                                    </div>
                                  )}
                                  {medication.notes && (
                                    <div className="text-xs opacity-70">{medication.notes}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Treatment Protocol"
              source="Treatment protocol managed by oncologist"
              meta={protocol ? getProtocolMeta(protocol) : undefined}
              editButton={
                <button
                  onClick={() => setModal("protocol")}
                  disabled={savingTreatment}
                  className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
                >
                  <Pencil size={12} /> {protocol ? "Edit Protocol" : "Create Protocol"}
                </button>
              }
            >
              {treatmentLoading ? (
                <PhasePlaceholder icon={<Stethoscope size={16} />}>
                  Loading treatment protocol...
                </PhasePlaceholder>
              ) : !protocol ? (
                <PhasePlaceholder icon={<Stethoscope size={16} />}>
                  No treatment protocol has been created yet.
                </PhasePlaceholder>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    <MetaRow label="Protocol" value={protocol.protocolName} />
                    <MetaRow label="Diagnosis" value={protocol.diagnosis} />
                  </div>
                  <div>
                    <span className="text-xs text-[#9CA3AF] block mb-1.5">
                      Treatment Types
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {getTreatmentTypes(protocol).map((type) => (
                        <span
                          key={type}
                          className="flex items-center gap-1 px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC]"
                        >
                          <TypeIcon type={type} /> {typeLabel[type]}
                        </span>
                      ))}
                    </div>
                  </div>
                  {getTreatmentTypes(protocol).includes("chemotherapy") &&
                    getTreatmentCount(protocol, "chemotherapy") > 0 && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <MetaRow
                          label="Chemotherapy Cycles"
                          value={`${getTreatmentCount(protocol, "chemotherapy")} cycles planned`}
                        />
                      </div>
                    )}
                  {getTreatmentTypes(protocol).includes("radiation") &&
                    getTreatmentCount(protocol, "radiation") > 0 && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <MetaRow
                          label="Radiation Sessions"
                          value={`${getTreatmentCount(protocol, "radiation")} sessions planned`}
                        />
                      </div>
                    )}
                  {getTreatmentTypes(protocol).includes("surgery") &&
                    getTreatmentCount(protocol, "surgery") > 0 && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <MetaRow
                          label="Surgery Checkpoints"
                          value={`${getTreatmentCount(protocol, "surgery")} checkpoint(s) planned`}
                        />
                      </div>
                    )}
                  <div>
                    <span className="text-xs text-[#9CA3AF] block mb-1.5">Drugs</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getProtocolDrugs(protocol).length > 0 ? (
                        getProtocolDrugs(protocol).map((drug) => (
                          <span
                            key={drug}
                            className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full"
                          >
                            {drug}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">No drugs listed.</span>
                      )}
                    </div>
                  </div>
                  {protocol.notes && <MetaRow label="Notes" value={protocol.notes} />}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Treatment Roadmap"
              source="Treatment schedule managed by oncologist"
              editButton={
                protocol && cycles.length > 0 && (
                  <button
                    onClick={() => setModal("dates")}
                    disabled={savingTreatment}
                    className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
                  >
                    <Pencil size={12} /> Edit Dates
                  </button>
                )
              }
            >
              {treatmentLoading ? (
                <PhasePlaceholder icon={<Calendar size={16} />}>
                  Loading treatment roadmap...
                </PhasePlaceholder>
              ) : !protocol ? (
                <PhasePlaceholder icon={<Calendar size={16} />}>
                  Create a treatment protocol to schedule roadmap items.
                </PhasePlaceholder>
              ) : cycles.length === 0 ? (
                <PhasePlaceholder icon={<Calendar size={16} />}>
                  No roadmap items have been scheduled yet.
                </PhasePlaceholder>
              ) : (
                <div className="space-y-2">
                  {chemoCycles.map((cycle) => {
                    const displayStatus = getChemoDisplayStatus(cycle, labResults);
                    const isExpanded = expandedCycle === cycle._id;
                    const { startDate: effectiveStart, endDate: effectiveEnd } =
                      getEffectiveCycleDates(cycle);
                    const delayedStart = toDateInputValue(cycle.decision?.delayedToStartDate);
                    const delayedEnd = toDateInputValue(cycle.decision?.delayedToEndDate);
                    const effectiveDateStr =
                      displayStatus === "delayed" && delayedStart
                        ? `Delayed to ${formatDate(delayedStart)}${
                            delayedEnd ? ` - ${formatDate(delayedEnd)}` : ""
                          }`
                        : `${formatDate(effectiveStart || cycle.startDate)} - ${formatDate(
                            effectiveEnd || cycle.endDate
                          )}`;

                    return (
                      <div key={cycle._id} className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#FAF8F5] transition-colors text-left"
                          onClick={() => setExpandedCycle(isExpanded ? null : cycle._id)}
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <Syringe size={14} className="text-[#7CAE8E] shrink-0" />
                            <span className="text-sm font-medium text-[#2C3E2D]">
                              {getRoadmapItemTitle(cycle)}
                            </span>
                            <CycleDisplayBadge displayStatus={displayStatus} />
                            <span className="text-xs text-[#9CA3AF]">{effectiveDateStr}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-[#9CA3AF] shrink-0" />
                          ) : (
                            <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 py-3 bg-[#F5F2EE] border-t border-[#E5E2DC] space-y-3">
                            {displayStatus === "upcoming" && (
                              <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                <p>
                                  Scheduled: {formatDate(effectiveStart || cycle.startDate)} -{" "}
                                  {formatDate(effectiveEnd || cycle.endDate)}
                                </p>
                                <p className="text-xs mt-1 text-blue-600">
                                  No action required yet.
                                </p>
                              </div>
                            )}
                            {displayStatus === "waiting_labs" && (
                              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                <FlaskConical size={14} />
                                <span>
                                  Waiting for lab results before this cycle can be reviewed.
                                </span>
                              </div>
                            )}
                            {displayStatus === "ready_for_review" && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                  <CheckCircle2 size={14} />
                                  <span>
                                    Lab results received. Ready for oncologist approval.
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApprove(cycle)}
                                    disabled={savingTreatment}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors disabled:opacity-60"
                                  >
                                    <Check size={13} /> Approve Cycle
                                  </button>
                                  <button
                                    onClick={() => setCycleToDelay(cycle)}
                                    disabled={savingTreatment}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-60"
                                  >
                                    <XCircle size={13} /> Delay Cycle
                                  </button>
                                </div>
                              </div>
                            )}
                            {(displayStatus === "approved" || displayStatus === "active") && (
                              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <p>
                                  Approved on{" "}
                                  {formatDate(cycle.decision?.decidedAt || cycle.updatedAt || "")}{" "}
                                  by {getPersonName(cycle.decision?.decidedBy) || "oncologist"}
                                </p>
                                {displayStatus === "active" && (
                                  <p className="text-xs mt-0.5 text-emerald-600">
                                    Currently in progress.
                                  </p>
                                )}
                              </div>
                            )}
                            {displayStatus === "delayed" && (
                              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                                <p>
                                  Delayed to: {formatDate(delayedStart || cycle.startDate)}
                                  {delayedEnd ? ` - ${formatDate(delayedEnd)}` : ""}
                                </p>
                                {cycle.decision?.delayReason && (
                                  <p className="text-xs">
                                    Reason: {cycle.decision.delayReason}
                                  </p>
                                )}
                              </div>
                            )}
                            {displayStatus === "completed" && (
                              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                Cycle completed.
                                {cycle.decision?.decidedAt && (
                                  <span className="text-xs ml-1">
                                    Approved {formatDate(cycle.decision.decidedAt)} by{" "}
                                    {getPersonName(cycle.decision.decidedBy) || "oncologist"}.
                                  </span>
                                )}
                              </div>
                            )}
                            {cycle.notes && (
                              <p className="text-xs text-[#9CA3AF]">{cycle.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {radiationCycles.map((cycle) => {
                    const radStart = toDateInputValue(cycle.startDate);
                    const radEnd   = toDateInputValue(cycle.endDate);
                    const radToday = todayIso();
                    const radDone  = cycle.status === "completed" || (!!radEnd && radEnd < radToday);
                    const radActive = !radDone && !!radStart && !!radEnd && radStart <= radToday && radEnd >= radToday;
                    const radLabel  = radDone ? "Completed" : radActive ? "Active" : "Upcoming";
                    const radCls    = radDone
                      ? "bg-gray-100 text-gray-600"
                      : radActive
                      ? "bg-amber-500 text-white"
                      : "bg-blue-100 text-blue-700";
                    return (
                      <div
                        key={cycle._id}
                        className={`flex items-start gap-3 p-3 rounded-xl border border-[#E5E2DC] ${radActive ? "bg-amber-50" : radDone ? "bg-gray-50" : "bg-[#F5F2EE]"}`}
                      >
                        <div className="mt-0.5">
                          <Zap size={14} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#2C3E2D]">
                              {getRoadmapItemTitle(cycle)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${radCls}`}>
                              {radLabel}
                            </span>
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">
                            {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)} ·{" "}
                            {cycle.completedSessions || 0}/{cycle.totalSessions || 0} sessions
                          </div>
                          {cycle.notes && (
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {surgeryCycles.map((cycle) => {
                    const surgDisplay = getSurgeryDisplayStatus(cycle);
                    const surgCfg: Record<SurgeryDisplayStatus, { label: string; cls: string }> = {
                      upcoming:  { label: "Upcoming",  cls: "bg-blue-100 text-blue-700" },
                      today:     { label: "Today",     cls: "bg-blue-500 text-white" },
                      completed: { label: "Completed", cls: "bg-gray-100 text-gray-600" },
                    };
                    return (
                      <div
                        key={cycle._id}
                        className={`flex items-start gap-3 p-3 rounded-xl border border-[#E5E2DC] ${surgDisplay === "today" ? "bg-blue-50" : surgDisplay === "completed" ? "bg-gray-50" : "bg-[#F5F2EE]"}`}
                      >
                        <div className="mt-0.5">
                          <Scissors size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#2C3E2D]">
                              {getRoadmapItemTitle(cycle)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${surgCfg[surgDisplay].cls}`}>
                              {surgCfg[surgDisplay].label}
                            </span>
                          </div>
                          <div className="text-xs text-[#9CA3AF] mt-0.5">
                            Planned: {formatDate(cycle.plannedDate || cycle.startDate)}
                          </div>
                          {cycle.notes && (
                            <p className="text-xs text-[#9CA3AF] mt-0.5">{cycle.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Lab Results — Lab Staff Entry"
              source="Lab results entered by Lab Staff"
            >
              {labsLoading ? (
                <p className="text-sm text-[#9CA3AF] py-4 text-center">Loading lab results…</p>
              ) : labResults.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-[#9CA3AF]">
                  <FlaskConical size={22} className="opacity-40" />
                  <p className="text-sm">No lab results have been entered yet.</p>
                </div>
              ) : (() => {
                const sorted = [...labResults].sort((a, b) =>
                  (b.testDate ?? "").localeCompare(a.testDate ?? "")
                );
                const latest = sorted[0];
                const older = sorted.slice(1);
                const fieldLabels: Record<string, string> = {
                  wbc: "WBC", neutrophils: "Neutrophils", hemoglobin: "Hemoglobin",
                  platelets: "Platelets", alt: "ALT", creatinine: "Creatinine",
                };
                return (
                  <div className="space-y-4">
                    {/* Latest Results */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                          Latest Results — {formatDate((latest.testDate ?? "").split("T")[0])}
                        </p>
                        <span className="text-xs text-[#9CA3AF]">
                          by {latest.enteredBy?.fullName ?? "Unknown"}
                          {latest.cycle && ` · ${latest.cycle.title}`}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["wbc", "neutrophils", "hemoglobin", "platelets", "alt", "creatinine"] as LabFieldKey[]).map((field) => {
                          const val = latest[field];
                          const status = getLabStatus(field, val);
                          const norm = LAB_NORMS[field];
                          const colorCls = status === "normal"
                            ? "text-emerald-700 bg-emerald-50"
                            : status === "low"
                            ? "text-amber-700 bg-amber-50"
                            : "text-red-700 bg-red-50";
                          return (
                            <div key={field} className="bg-[#F5F2EE] rounded-lg px-3 py-2">
                              <p className="text-xs text-[#9CA3AF] mb-0.5">{fieldLabels[field]}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-semibold px-1.5 py-0.5 rounded ${colorCls}`}>
                                  {val}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                                Normal: {norm.min}–{norm.max}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {latest.notes && (
                        <p className="text-xs text-[#9CA3AF] mt-2">Note: {latest.notes}</p>
                      )}
                    </div>

                    {/* Trend chart */}
                    <LabTrendChart labResults={labResults} />

                    {/* Lab History (collapsible) */}
                    {older.length > 0 && (
                      <div className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                        <button
                          onClick={() => setLabHistoryExpanded((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F5F2EE] hover:bg-[#EDE9E3] transition-colors text-left"
                        >
                          <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                            Lab History ({older.length} older result{older.length !== 1 ? "s" : ""})
                          </span>
                          {labHistoryExpanded
                            ? <ChevronUp size={13} className="text-[#9CA3AF]" />
                            : <ChevronDown size={13} className="text-[#9CA3AF]" />
                          }
                        </button>
                        {labHistoryExpanded && (
                          <div className="divide-y divide-[#F5F2EE]">
                            {older.map((lab) => {
                              const dateStr = (lab.testDate ?? "").split("T")[0];
                              return (
                                <div key={lab._id} className="px-4 py-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-[#2C3E2D]">{formatDate(dateStr)}</span>
                                      {lab.cycle && (
                                        <span className="text-xs text-[#7CAE8E] bg-[#F0F7F3] border border-[#C8D9CC] px-2 py-0.5 rounded-full">
                                          {lab.cycle.title}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-[#9CA3AF]">by {lab.enteredBy?.fullName ?? "Unknown"}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-xs">
                                    {(["wbc", "neutrophils", "hemoglobin", "platelets", "alt", "creatinine"] as LabFieldKey[]).map((field) => {
                                      const val = lab[field];
                                      const status = getLabStatus(field, val);
                                      const norm = LAB_NORMS[field];
                                      const colorCls = status === "normal" ? "text-emerald-700 bg-emerald-50" : status === "low" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
                                      return (
                                        <div key={field} className="flex items-center gap-1.5">
                                          <span className="text-[#9CA3AF] w-20 capitalize shrink-0">{fieldLabels[field]}</span>
                                          <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${colorCls}`} title={`Normal: ${norm.min}–${norm.max}`}>{val}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {lab.notes && <p className="text-xs text-[#9CA3AF] mt-1">{lab.notes}</p>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </SectionCard>

            <MessagesPanel patientId={patientId} />

            <ClinicalDocumentsPanel patientId={patientId} canManage={true} />

            <SymptomJournalPanel patientId={patientId} />
          </>
        )}
      </main>

      {modal === "profile" && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setModal(null)}
          onSave={handleSaveProfile}
        />
      )}
      {modal === "medications" && protocol && (
        <EditMedicationsModal
          medications={medicationPlan}
          onClose={() => setModal(null)}
          onSave={handleSaveMedications}
        />
      )}
      {modal === "protocol" && profile && (
        <EditProtocolModal
          protocol={protocol}
          profileDiagnosis={profile.diagnosis}
          onClose={() => setModal(null)}
          onSave={handleSaveProtocol}
        />
      )}
      {modal === "dates" && (
        <EditTreatmentDatesModal
          cycles={cycles}
          onClose={() => setModal(null)}
          onSave={handleSaveDates}
        />
      )}
      {cycleToDelay && (
        <DelayCycleModal
          cycle={cycleToDelay}
          onClose={() => setCycleToDelay(null)}
          onConfirm={(reason, newStartDate, newEndDate) =>
            handleDelay(cycleToDelay, reason, newStartDate, newEndDate)
          }
        />
      )}
    </div>
  );
}
