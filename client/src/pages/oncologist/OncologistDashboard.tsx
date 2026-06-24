import { useEffect, useState } from "react";
import {
  seedOncologist,
  Medication,
  TreatmentItemType,
  MedicationCategory,
  MedicationRoute,
  AccountStatus,
  PendingAction,
  formatDate,
  TODAY,
} from "../../utils/mockData";
import { RibbonBackground } from "../../components/shared/RibbonBackground";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addPatient,
  clearPatientsError,
  fetchPatients,
} from "../../store/slices/patientsSlice";
import type { PatientProfile as ApiPatientProfile } from "../../types/api";
import type { PatientPayload } from "../../services/patientService";
import {
  Users,
  Plus,
  LogOut,
  FlaskConical,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X,
  Stethoscope,
  UserCheck,
  UserX,
  Calendar,
  Pill,
} from "lucide-react";

interface OncologistDashboardProps {
  onSelectPatient: (id: string) => void;
  onLogout: () => void;
}

function PendingBadge({ action }: { action: PendingAction }) {
  if (action === "none") return <span className="text-xs text-[#9CA3AF]">-</span>;
  const cfg: Record<PendingAction, { label: string; color: string; icon: React.ReactNode }> = {
    waiting_labs: { label: "Waiting for labs", color: "bg-amber-100 text-amber-700", icon: <FlaskConical size={11} /> },
    labs_received: { label: "Labs received", color: "bg-blue-100 text-blue-700", icon: <FlaskConical size={11} /> },
    cycle_ready_review: { label: "Cycle ready for review", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 size={11} /> },
    unread_message: { label: "Unread message", color: "bg-purple-100 text-purple-700", icon: <MessageSquare size={11} /> },
    treatment_delayed: { label: "Treatment delayed", color: "bg-red-100 text-red-700", icon: <AlertCircle size={11} /> },
    none: { label: "", color: "", icon: null },
  };
  const { label, color, icon } = cfg[action];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {icon}{label}
    </span>
  );
}

type AccountStatusLike =
  | AccountStatus
  | ApiPatientProfile["accountStatus"]
  | undefined;

function AccountBadge({ status }: { status: AccountStatusLike }) {
  if (status === "linked") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <UserCheck size={11} /> Linked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
      <UserX size={11} /> Awaiting registration
    </span>
  );
}

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (patientData: PatientPayload) => Promise<string | null>;
}

function AddPatientModal({ onClose, onSave }: AddPatientModalProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    nationalId: "",
    dateOfBirth: "",
    diagnosis: "",
    bloodType: "",
    allergiesRaw: "",
    notes: "",
    protocolName: "",
    treatmentTypes: [] as TreatmentItemType[],
    chemoCount: "6",
    chemoIntervalDays: "21",
    chemoStartDate: "",
    radTotalSessions: "25",
    radStartDate: "",
    radEndDate: "",
    surgCount: "1",
    surgStartDate: "",
  });
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medForm, setMedForm] = useState({
    name: "",
    dose: "",
    route: "IV" as MedicationRoute,
    frequency: "",
    timing: "",
    category: "chemotherapy" as MedicationCategory,
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const treatmentTypeOptions: { value: TreatmentItemType; label: string }[] = [
    { value: "chemotherapy", label: "Chemotherapy" },
    { value: "radiation", label: "Radiation" },
    { value: "surgery", label: "Surgery Checkpoint" },
    { value: "supportive", label: "Supportive Medication" },
  ];

  const normalizeBloodType = (value: string) => {
    const normalized = value.trim();
    const allowed = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    return allowed.includes(normalized) ? normalized : "unknown";
  };

  const toggleType = (t: TreatmentItemType) => {
    setForm((prev) => ({
      ...prev,
      treatmentTypes: prev.treatmentTypes.includes(t)
        ? prev.treatmentTypes.filter((x) => x !== t)
        : [...prev.treatmentTypes, t],
    }));
  };

  const addMedication = () => {
    if (!medForm.name.trim() || !medForm.dose.trim()) return;
    setMedications((prev) => [
      ...prev,
      { ...medForm, id: `med-new-${Date.now()}` },
    ]);
    setMedForm({ name: "", dose: "", route: "IV", frequency: "", timing: "", category: "chemotherapy", notes: "" });
  };

  const removeMed = (id: string) =>
    setMedications((prev) => prev.filter((m) => m.id !== id));

  const handleSave = async () => {
    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.nationalId.trim() ||
      !form.dateOfBirth ||
      !form.diagnosis.trim()
    ) {
      setError("Full name, email, national ID, date of birth, and diagnosis are required.");
      return;
    }

    setSaving(true);
    setError("");

    const patientData: PatientPayload = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      nationalId: form.nationalId.trim(),
      dateOfBirth: form.dateOfBirth,
      diagnosis: form.diagnosis.trim(),
      notes: form.notes.trim() || undefined,
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
    };

    const saveError = await onSave(patientData);

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
  };

  const inputCls =
    "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E] focus:border-transparent";
  const labelCls = "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm overflow-y-auto py-8 px-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#7CAE8E]/20 flex items-center justify-center">
              <Plus size={16} className="text-[#7CAE8E]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#2C3E2D]">Create Patient Medical Profile</h2>
              <p className="text-xs text-[#9CA3AF]">All clinical data is managed by the oncologist</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg px-4 py-2 text-sm text-[#1E40AF]">
            This phase saves the patient medical profile only. Treatment protocol and medication details will be managed in the Treatment Protocol phase.
          </div>

          <section>
            <h3 className="text-sm font-semibold text-[#2C3E2D] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#7CAE8E] text-white text-xs flex items-center justify-center font-bold">1</span>
              Patient Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} placeholder="e.g. Rachel Cohen" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input className={inputCls} type="email" placeholder="patient@email.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>National ID</label>
                <input className={inputCls} placeholder="ID number" value={form.nationalId} onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input className={inputCls} type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Blood Type</label>
                <select className={inputCls} value={form.bloodType} onChange={(e) => setForm((p) => ({ ...p, bloodType: e.target.value }))}>
                  <option value="">Select</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Diagnosis</label>
                <input className={inputCls} placeholder="e.g. Breast Cancer - Stage IIIA" value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Allergies (comma separated)</label>
                <input className={inputCls} placeholder="e.g. Penicillin, Sulfa drugs" value={form.allergiesRaw} onChange={(e) => setForm((p) => ({ ...p, allergiesRaw: e.target.value }))} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[#2C3E2D] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#7CAE8E] text-white text-xs flex items-center justify-center font-bold">2</span>
              Treatment Protocol
            </h3>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Protocol Name</label>
                <input className={inputCls} placeholder="e.g. AC Chemotherapy" value={form.protocolName} onChange={(e) => setForm((p) => ({ ...p, protocolName: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Treatment Types</label>
                <div className="flex flex-wrap gap-2">
                  {treatmentTypeOptions.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => toggleType(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.treatmentTypes.includes(value)
                          ? "bg-[#7CAE8E] text-white border-[#7CAE8E]"
                          : "bg-white text-[#6B7280] border-[#E5E2DC] hover:border-[#7CAE8E]"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {form.treatmentTypes.includes("chemotherapy") && (
                <div className="bg-[#F0FAF4] border border-[#C8D9CC] rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#2D4739]">Chemotherapy Schedule</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Number of Cycles</label>
                      <input className={inputCls} type="number" min="1" max="20" value={form.chemoCount} onChange={(e) => setForm((p) => ({ ...p, chemoCount: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Cycle Interval (days)</label>
                      <input className={inputCls} type="number" min="7" max="60" placeholder="21" value={form.chemoIntervalDays} onChange={(e) => setForm((p) => ({ ...p, chemoIntervalDays: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>First Cycle Start Date</label>
                      <input className={inputCls} type="date" value={form.chemoStartDate} onChange={(e) => setForm((p) => ({ ...p, chemoStartDate: e.target.value }))} />
                      <p className="text-xs text-[#9CA3AF] mt-0.5">All cycle dates will be generated automatically from this start date.</p>
                    </div>
                  </div>
                </div>
              )}

              {form.treatmentTypes.includes("radiation") && (
                <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#92400E]">Radiation Schedule</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Total Sessions</label>
                      <input className={inputCls} type="number" min="1" placeholder="25" value={form.radTotalSessions} onChange={(e) => setForm((p) => ({ ...p, radTotalSessions: e.target.value }))} />
                    </div>
                    <div />
                    <div>
                      <label className={labelCls}>Start Date</label>
                      <input className={inputCls} type="date" value={form.radStartDate} onChange={(e) => setForm((p) => ({ ...p, radStartDate: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>End Date</label>
                      <input className={inputCls} type="date" value={form.radEndDate} onChange={(e) => setForm((p) => ({ ...p, radEndDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {form.treatmentTypes.includes("surgery") && (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-[#1E40AF]">Surgery Checkpoints</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>Number of Checkpoints</label>
                      <input className={inputCls} type="number" min="1" max="10" value={form.surgCount} onChange={(e) => setForm((p) => ({ ...p, surgCount: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>First Date</label>
                      <input className={inputCls} type="date" value={form.surgStartDate} onChange={(e) => setForm((p) => ({ ...p, surgStartDate: e.target.value }))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[#2C3E2D] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#7CAE8E] text-white text-xs flex items-center justify-center font-bold">3</span>
              Medication Plan
            </h3>
            {medications.length > 0 && (
              <div className="mb-3 space-y-1.5">
                {medications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-[#E5E2DC]">
                    <div className="flex items-center gap-2">
                      <Pill size={13} className="text-[#7CAE8E]" />
                      <span className="text-sm font-medium text-[#2C3E2D]">{med.name}</span>
                      <span className="text-xs text-[#9CA3AF]">{med.dose} · {med.route} · {med.category}</span>
                    </div>
                    <button onClick={() => removeMed(med.id)} className="text-[#9CA3AF] hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white border border-dashed border-[#C8D9CC] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Medication Name</label>
                  <input className={inputCls} placeholder="e.g. Doxorubicin" value={medForm.name} onChange={(e) => setMedForm((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Dose</label>
                  <input className={inputCls} placeholder="e.g. 60 mg/m²" value={medForm.dose} onChange={(e) => setMedForm((p) => ({ ...p, dose: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Route</label>
                  <select className={inputCls} value={medForm.route} onChange={(e) => setMedForm((p) => ({ ...p, route: e.target.value as MedicationRoute }))}>
                    {(["IV","oral","subcutaneous","topical"] as MedicationRoute[]).map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={medForm.category} onChange={(e) => setMedForm((p) => ({ ...p, category: e.target.value as MedicationCategory }))}>
                    <option value="chemotherapy">Chemotherapy</option>
                    <option value="supportive">Supportive</option>
                    <option value="chronic">Chronic/Background</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Frequency</label>
                  <input className={inputCls} placeholder="e.g. Every 21 days" value={medForm.frequency} onChange={(e) => setMedForm((p) => ({ ...p, frequency: e.target.value }))} />
                </div>
                <div>
                  <label className={labelCls}>Timing / Days</label>
                  <input className={inputCls} placeholder="e.g. Day 1 of cycle" value={medForm.timing} onChange={(e) => setMedForm((p) => ({ ...p, timing: e.target.value }))} />
                </div>
              </div>
              <button type="button" onClick={addMedication} className="flex items-center gap-1.5 text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium">
                <Plus size={14} /> Add Medication
              </button>
            </div>
          </section>

          <section>
            <label className={labelCls}>Clinical Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Additional clinical notes…" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </section>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E2DC]">
          <p className="text-xs text-[#9CA3AF]">
            Assigned oncologist: <strong>{seedOncologist.fullName}</strong>
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] transition-colors disabled:opacity-60">{saving ? "Creating..." : "Create Profile"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OncologistDashboard({ onSelectPatient, onLogout }: OncologistDashboardProps) {
  const dispatch = useAppDispatch();
  const {
    list: patients,
    loading,
    error: patientsError,
  } = useAppSelector((state) => state.patients);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    dispatch(fetchPatients());
  }, [dispatch]);

  const filtered = patients.filter((patient) => {
    const query = search.toLowerCase();

    return (
      patient.fullName.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient.diagnosis.toLowerCase().includes(query) ||
      patient.nationalId.toLowerCase().includes(query)
    );
  });

  const directoryError = actionError || patientsError;

  const handleCreatePatient = async (
    patientData: PatientPayload
  ): Promise<string | null> => {
    try {
      await dispatch(addPatient(patientData)).unwrap();
      setActionError("");
      return null;
    } catch (error) {
      return typeof error === "string" ? error : "Failed to create patient";
    }
  };

  const handleOpenPatient = (patient: ApiPatientProfile) => {
    setActionError("");
    onSelectPatient(patient._id);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7CAE8E]/20 flex items-center justify-center">
              <Stethoscope size={18} className="text-[#7CAE8E]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#2C3E2D]">Onco+Log</h1>
              <p className="text-xs text-[#9CA3AF]">{seedOncologist.fullName} · {seedOncologist.department}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2C3E2D] flex items-center gap-2">
              <Users size={20} className="text-[#7CAE8E]" /> Patient Directory
            </h2>
            <p className="text-sm text-[#9CA3AF] mt-0.5">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} under your care · {formatDate(TODAY)}
            </p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors shadow-sm">
            <Plus size={15} /> Add Patient
          </button>
        </div>

        <div className="mb-4">
          <input
            className="w-full max-w-sm border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]"
            placeholder="Search by name, email, or diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {directoryError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 flex items-center justify-between gap-3">
            <span>{directoryError}</span>
            <button
              type="button"
              onClick={() => {
                setActionError("");
                dispatch(clearPatientsError());
              }}
              className="text-red-500 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E2DC] overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-4 px-5 py-3 bg-[#F5F2EE] border-b border-[#E5E2DC] text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
            <span>Patient</span>
            <span>Diagnosis</span>
            <span>Treatment Status</span>
            <span>Account</span>
            <span>Pending Action</span>
            <span></span>
          </div>

          {loading && patients.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#9CA3AF]">Loading patients...</div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[#9CA3AF]">No patients found.</div>
          ) : (
            filtered.map((profile) => {
              return (
                <div key={profile._id} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-4 px-5 py-4 border-b border-[#F5F2EE] last:border-0 hover:bg-[#FAF8F5] transition-colors items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#2C3E2D]">{profile.fullName}</p>
                    <p className="text-xs text-[#9CA3AF]">{profile.email}</p>
                    {profile.nationalId && <p className="text-xs text-[#9CA3AF]">ID: {profile.nationalId}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-[#374151] leading-snug">{profile.diagnosis || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#374151]">Treatment not connected yet</p>
                  </div>
                  <div>
                    <AccountBadge status={profile.accountStatus} />
                  </div>
                  <div>
                    <PendingBadge action="none" />
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => handleOpenPatient(profile)} className="flex items-center gap-0.5 text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium">
                      Open <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl border border-[#E5E2DC] flex flex-wrap gap-4 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#7CAE8E]" /> Today: <strong>{formatDate(TODAY)}</strong></span>
          <span className="flex items-center gap-1.5"><FlaskConical size={12} className="text-amber-500" /> Lab results entered by Lab Staff only</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> Treatment decisions made by oncologist only</span>
          <span className="flex items-center gap-1.5"><Clock size={12} className="text-gray-400" /> Patient profiles created and managed by oncologist</span>
        </div>
      </main>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreatePatient}
        />
      )}
    </div>
  );
}
