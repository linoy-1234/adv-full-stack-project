import { useEffect, useState } from "react";
import {
  getLabStatus,
  LAB_NORMS,
  formatDate,
  TODAY,
  type LabFieldKey,
} from "../../utils/mockData";
import { RibbonBackground } from "../../components/shared/RibbonBackground";
import {
  FlaskConical,
  LogOut,
  Search,
  Plus,
  X,
  Check,
  ChevronRight,
  Trash2,
  Pencil,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getPatients } from "../../services/patientService";
import {
  getPatientLabs,
  createLabResult,
  updateLabResult,
  deleteLabResult,
  type LabResultPayload,
} from "../../services/labService";
import type {
  PatientProfile,
  ApiLabResult,
} from "../../types/api";

// ─── Pure display helpers (no mock data dependency) ───────────────────────────

function LabCell({ field, value }: { field: LabFieldKey; value: number }) {
  const status = getLabStatus(field, value);
  const color =
    status === "normal"
      ? "text-emerald-700 bg-emerald-50"
      : status === "low"
      ? "text-amber-700 bg-amber-50"
      : "text-red-700 bg-red-50";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}

// ─── Adapter: backend ApiLabResult → display-friendly shape ──────────────────

function labDate(lab: ApiLabResult): string {
  return (lab.testDate ?? "").split("T")[0];
}

function labEnteredBy(lab: ApiLabResult): string {
  return lab.enteredBy?.fullName ?? "Unknown";
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

// ─── Lab Entry Form ───────────────────────────────────────────────────────────

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

function LabEntryForm({
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
  const cyclesLoading = false;
  const chemoCycles: Array<{ _id: string; title: string; startDate: string; endDate: string }> = [];
  const linkedCycleId = "";
  const setLinkedCycleId = (_value: string) => {};

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
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
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

          {false && patientId && (
            <div>
              <label className={labelCls}>Legacy hidden field</label>
              {cyclesLoading ? (
                <p className="text-xs text-[#9CA3AF]">Loading cycles…</p>
              ) : chemoCycles.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">No chemotherapy cycles found for this patient.</p>
              ) : (
                <select
                  className={inputCls}
                  value={linkedCycleId}
                  onChange={(e) => setLinkedCycleId(e.target.value)}
                >
                  <option value="">Not linked to a cycle</option>
                  {chemoCycles.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} — {formatDate(c.startDate)} → {formatDate(c.endDate)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

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

interface LabStaffDashboardProps {
  onLogout: () => void;
}

export function LabStaffDashboard({ onLogout }: LabStaffDashboardProps) {
  const { user } = useAuth();
  const labStaffName = user?.fullName ?? "Lab Staff";

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLab, setEditingLab] = useState<ApiLabResult | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState("");

  const [labResults, setLabResults] = useState<ApiLabResult[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [labsError, setLabsError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Load all patients on mount
  useEffect(() => {
    setPatientsLoading(true);
    setPatientsError("");
    getPatients()
      .then((res) => setPatients(res.patients))
      .catch(() => setPatientsError("Could not load patients."))
      .finally(() => setPatientsLoading(false));
  }, []);

  // Load lab results when a patient is selected
  useEffect(() => {
    if (!selectedPatientId) {
      setLabResults([]);
      return;
    }

    setLabsLoading(true);
    setLabsError("");
    getPatientLabs(selectedPatientId)
      .then((res) => setLabResults(res.labResults))
      .catch(() => setLabsError("Could not load lab results."))
      .finally(() => setLabsLoading(false));
  }, [selectedPatientId]);

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.nationalId.includes(search)
  );

  const selectedPatient = selectedPatientId
    ? patients.find((p) => p._id === selectedPatientId) ?? null
    : null;

  const handlePatientChange = (patientId: string) => {
    if (!patientId) return;
    setSelectedPatientId(patientId);
  };

  const refreshLabs = async (patientId: string) => {
    const res = await getPatientLabs(patientId);
    setLabResults(res.labResults);
  };

  const handleSave = async (
    patientId: string,
    payload: LabResultPayload,
    labResultId?: string
  ) => {
    setSaving(true);
    setSaveError("");
    try {
      if (labResultId) {
        await updateLabResult(labResultId, payload);
      } else {
        await createLabResult(patientId, payload);
      }
      setShowForm(false);
      setEditingLab(undefined);
      if (selectedPatientId) await refreshLabs(selectedPatientId);
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save lab result. Please try again."));
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const handleDelete = async (labId: string) => {
    if (!window.confirm("Delete this lab result?")) return;
    try {
      await deleteLabResult(labId);
      if (selectedPatientId) await refreshLabs(selectedPatientId);
    } catch {
      alert("Could not delete lab result.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7CAE8E]/20 flex items-center justify-center">
              <FlaskConical size={18} className="text-[#7CAE8E]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#2C3E2D]">Onco+Log — Lab Portal</h1>
              <p className="text-xs text-[#9CA3AF]">{labStaffName} · Clinical Laboratory</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditingLab(undefined); setShowForm(true); }}
              className="flex items-center gap-2 px-3 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors"
            >
              <Plus size={14} /> Enter Lab Results
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>Lab Staff access:</strong> You can enter, edit, and delete lab results. Patient profiles, diagnoses, medications, treatment protocols, and treatment decisions are managed by the oncologist.
        </div>

        {saveError && !showForm && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-[1fr_2fr] gap-6">
          {/* Patient list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#2C3E2D]">Patients</h2>
              <span className="text-xs text-[#9CA3AF]">{patients.length} total</span>
            </div>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                className="w-full border border-[#E5E2DC] rounded-lg pl-8 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]"
                placeholder="Search patients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {patientsLoading ? (
              <div className="bg-white rounded-xl border border-[#E5E2DC] p-6 text-center text-sm text-[#9CA3AF]">
                Loading patients…
              </div>
            ) : patientsError ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {patientsError}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E5E2DC] overflow-hidden">
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF] p-4 text-center">No patients found.</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedPatientId(p._id)}
                      className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#F5F2EE] last:border-0 text-left transition-colors ${
                        selectedPatientId === p._id
                          ? "bg-[#F0F7F3] border-l-2 border-l-[#7CAE8E]"
                          : "hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-[#2C3E2D]">{p.fullName}</p>
                        <p className="text-xs text-[#9CA3AF]">{p.email}</p>
                      </div>
                      <ChevronRight size={13} className="text-[#9CA3AF]" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lab results panel */}
          <div>
            {!selectedPatient ? (
              <div className="flex flex-col items-center justify-center h-64 text-[#9CA3AF] text-sm">
                <FlaskConical size={32} className="mb-3 opacity-40" />
                Select a patient to view or enter lab results
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#2C3E2D]">{selectedPatient.fullName}</h2>
                    <p className="text-xs text-[#9CA3AF]">{selectedPatient.diagnosis}</p>
                  </div>
                  <button
                    onClick={() => { setEditingLab(undefined); setShowForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm hover:bg-[#5A8A6A] transition-colors"
                  >
                    <Plus size={13} /> New Lab Result
                  </button>
                </div>

                {labsLoading ? (
                  <div className="bg-white border border-[#E5E2DC] rounded-xl p-8 text-center text-sm text-[#9CA3AF]">
                    Loading lab results…
                  </div>
                ) : labsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    {labsError}
                  </div>
                ) : labResults.length === 0 ? (
                  <div className="bg-white border border-[#E5E2DC] rounded-xl p-8 text-center text-sm text-[#9CA3AF]">
                    No lab results entered for this patient yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...labResults]
                      .sort((a, b) => labDate(b).localeCompare(labDate(a)))
                      .map((lab) => (
                        <div key={lab._id} className="bg-white border border-[#E5E2DC] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-sm font-semibold text-[#2C3E2D]">
                                {formatDate(labDate(lab))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingLab(lab); setShowForm(true); }}
                                className="text-[#9CA3AF] hover:text-[#7CAE8E]"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDelete(lab._id)}
                                className="text-[#9CA3AF] hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                            {(["wbc", "neutrophils", "hemoglobin", "platelets", "alt", "creatinine"] as LabFieldKey[]).map(
                              (field) => (
                                <div key={field} className="flex items-center gap-2">
                                  <span className="text-[#9CA3AF] w-20 capitalize shrink-0">{field}</span>
                                  <LabCell field={field} value={lab[field]} />
                                </div>
                              )
                            )}
                          </div>
                          {lab.notes && (
                            <p className="text-xs text-[#9CA3AF]">{lab.notes}</p>
                          )}
                          <p className="text-xs text-[#9CA3AF] mt-2">
                            Entered by {labEnteredBy(lab)} · {formatDate(lab.createdAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showForm && (
        <LabEntryForm
          patients={patients}
          labStaffName={labStaffName}
          selectedPatientId={selectedPatientId}
          onPatientChange={handlePatientChange}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingLab(undefined); setSaveError(""); }}
          editingLab={editingLab}
          saving={saving}
          externalError={saveError}
        />
      )}
    </div>
  );
}
