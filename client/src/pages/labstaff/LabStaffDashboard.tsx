import { useEffect, useState } from "react";
import {
  getLabStatus,
  type LabFieldKey,
} from "../../utils/labUtils";
import { formatDate } from "../../utils/dateUtils";
import { RibbonBackground } from "../../components/shared/RibbonBackground";
import ErrorMessage from "../../components/common/ErrorMessage";
import { LabEntryForm } from "./LabEntryForm";
import {
  FlaskConical,
  LogOut,
  Search,
  Plus,
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
  const [deleteError, setDeleteError] = useState("");
  const [labToDelete, setLabToDelete] = useState<ApiLabResult | null>(null);

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
    try {
      await deleteLabResult(labId);
      if (selectedPatientId) await refreshLabs(selectedPatientId);
      setLabToDelete(null);
      setDeleteError("");
    } catch {
      setDeleteError("Could not delete lab result.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-y-2">
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
          <ErrorMessage message={saveError} className="mb-4 rounded-xl" />
        )}

        {deleteError && (
          <ErrorMessage
            message={deleteError}
            onDismiss={() => setDeleteError("")}
            className="mb-4 rounded-xl"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
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
              <ErrorMessage message={patientsError} className="rounded-xl p-4" />
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
                  <ErrorMessage message={labsError} className="rounded-xl p-4" />
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
                                onClick={() => setLabToDelete(lab)}
                                className="text-[#9CA3AF] hover:text-red-500"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-2">
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

      {labToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-[#E5E2DC]">
              <h2 className="text-base font-semibold text-[#2C3E2D]">
                Delete Lab Result
              </h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#6B7280]">
                Delete this lab result?
              </p>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
              <button
                type="button"
                onClick={() => setLabToDelete(null)}
                className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(labToDelete._id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


