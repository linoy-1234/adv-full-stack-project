import { useState } from "react";
import {
  seedPatientProfiles,
  seedLabResults,
  seedTreatmentProtocols,
  PatientProfile,
  LabResult,
  TreatmentProtocol,
  ChemoCycle,
  getLabStatus,
  LabFieldKey,
  formatDate,
  TODAY,
} from "../mockData";
import { RibbonBackground } from "../shared/RibbonBackground";
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
  Stethoscope,
} from "lucide-react";

interface LabStaffDashboardProps {
  labStaffName: string;
  onLogout: () => void;
  extraLabResults: LabResult[];
  onAddLabResult: (lr: LabResult) => void;
  onDeleteLabResult: (id: string) => void;
}

// ─── Lab field cell ───────────────────────────────────────────────────────────

function LabCell({ field, value }: { field: LabFieldKey; value: number }) {
  const status = getLabStatus(field, value);
  const color = status === "normal" ? "text-emerald-700 bg-emerald-50" : status === "low" ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}

// ─── Lab Entry Form ───────────────────────────────────────────────────────────

interface LabEntryFormProps {
  patients: PatientProfile[];
  labStaffName: string;
  allProtocols: TreatmentProtocol[];
  onSave: (lr: LabResult) => void;
  onClose: () => void;
  editingLab?: LabResult;
}

function LabEntryForm({ patients, labStaffName, allProtocols, onSave, onClose, editingLab }: LabEntryFormProps) {
  const [patientId, setPatientId] = useState(editingLab?.patientProfileId ?? "");
  const [date, setDate] = useState(editingLab?.date ?? TODAY);
  const [wbc, setWbc] = useState(editingLab?.wbc?.toString() ?? "");
  const [neutrophils, setNeutrophils] = useState(editingLab?.neutrophils?.toString() ?? "");
  const [hemoglobin, setHemoglobin] = useState(editingLab?.hemoglobin?.toString() ?? "");
  const [platelets, setPlatelets] = useState(editingLab?.platelets?.toString() ?? "");
  const [alt, setAlt] = useState(editingLab?.alt?.toString() ?? "");
  const [creatinine, setCreatinine] = useState(editingLab?.creatinine?.toString() ?? "");
  const [notes, setNotes] = useState(editingLab?.notes ?? "");
  const [linkedCycleId, setLinkedCycleId] = useState(editingLab?.linkedCycleId ?? "");
  const [error, setError] = useState("");

  const patientProtocol = allProtocols.find((p) => p.patientProfileId === patientId);
  const chemoCycles = (patientProtocol?.items.filter((i) => i.type === "chemotherapy") ?? []) as ChemoCycle[];

  const inputCls = "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
  const labelCls = "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

  const handleSave = () => {
    if (!patientId) { setError("Please select a patient."); return; }
    if (!wbc || !neutrophils || !hemoglobin || !platelets || !alt || !creatinine) {
      setError("All lab values are required."); return;
    }
    const lr: LabResult = {
      id: editingLab?.id ?? `lab-${Date.now()}`,
      patientProfileId: patientId,
      date,
      wbc: parseFloat(wbc),
      neutrophils: parseFloat(neutrophils),
      hemoglobin: parseFloat(hemoglobin),
      platelets: parseFloat(platelets),
      alt: parseFloat(alt),
      creatinine: parseFloat(creatinine),
      notes: notes.trim() || undefined,
      enteredBy: labStaffName,
      enteredAt: new Date().toISOString(),
      linkedCycleId: linkedCycleId || undefined,
    };
    onSave(lr);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm py-8 px-4 overflow-y-auto">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-[#7CAE8E]" />
            <h2 className="text-base font-semibold text-[#2C3E2D]">{editingLab ? "Edit Lab Results" : "Enter Lab Results"}</h2>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className={labelCls}>Patient *</label>
            <select className={inputCls} value={patientId} onChange={(e) => { setPatientId(e.target.value); setLinkedCycleId(""); }}>
              <option value="">Select patient…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Date *</label>
            <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {chemoCycles.length > 0 && (
            <div>
              <label className={labelCls}>Link to Chemotherapy Cycle (optional)</label>
              <select className={inputCls} value={linkedCycleId} onChange={(e) => setLinkedCycleId(e.target.value)}>
                <option value="">Not linked to a cycle</option>
                {chemoCycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.title} — {formatDate(c.startDate)} → {formatDate(c.endDate)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="border-t border-[#E5E2DC] pt-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">Blood Work Values *</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>WBC (×10⁹/L)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 5.2" value={wbc} onChange={(e) => setWbc(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 4.0–11.0</p>
              </div>
              <div>
                <label className={labelCls}>Neutrophils (×10⁹/L)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 2.8" value={neutrophils} onChange={(e) => setNeutrophils(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 1.5–8.0</p>
              </div>
              <div>
                <label className={labelCls}>Hemoglobin (g/dL)</label>
                <input className={inputCls} type="number" step="0.1" placeholder="e.g. 12.0" value={hemoglobin} onChange={(e) => setHemoglobin(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 12.0–17.5</p>
              </div>
              <div>
                <label className={labelCls}>Platelets (×10⁹/L)</label>
                <input className={inputCls} type="number" step="1" placeholder="e.g. 200" value={platelets} onChange={(e) => setPlatelets(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 150–400</p>
              </div>
              <div>
                <label className={labelCls}>ALT (U/L)</label>
                <input className={inputCls} type="number" step="1" placeholder="e.g. 28" value={alt} onChange={(e) => setAlt(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 7–56</p>
              </div>
              <div>
                <label className={labelCls}>Creatinine (mg/dL)</label>
                <input className={inputCls} type="number" step="0.01" placeholder="e.g. 0.85" value={creatinine} onChange={(e) => setCreatinine(e.target.value)} />
                <p className="text-xs text-[#9CA3AF] mt-0.5">Normal: 0.6–1.2</p>
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Optional notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E2DC]">
          <p className="text-xs text-[#9CA3AF]">Entered by: <strong>{labStaffName}</strong> · {formatDate(TODAY)}</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] flex items-center gap-1.5">
              <Check size={13} /> {editingLab ? "Update" : "Save Results"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function LabStaffDashboard({ labStaffName, onLogout, extraLabResults, onAddLabResult, onDeleteLabResult }: LabStaffDashboardProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLab, setEditingLab] = useState<LabResult | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const allLabs = [
    ...seedLabResults,
    ...extraLabResults.filter((l) => !seedLabResults.find((sl) => sl.id === l.id)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filteredPatients = seedPatientProfiles.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.nationalId.includes(search)
  );

  const patientLabs = selectedPatientId
    ? allLabs.filter((l) => l.patientProfileId === selectedPatientId)
    : [];

  const selectedPatient = selectedPatientId
    ? seedPatientProfiles.find((p) => p.id === selectedPatientId)
    : null;

  const handleSaveLab = (lr: LabResult) => {
    onAddLabResult(lr);
    // If linked to a waiting_labs cycle, update status in protocol
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this lab result?")) onDeleteLabResult(id);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.025] select-none z-0">
        <span className="text-[22rem] leading-none">♋</span>
      </div>

      {/* Header */}
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
            <button onClick={() => { setEditingLab(undefined); setShowForm(true); }} className="flex items-center gap-2 px-3 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors">
              <Plus size={14} /> Enter Lab Results
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Scope notice */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>Lab Staff access:</strong> You can enter, edit, and delete lab results. Patient profiles, diagnoses, medications, treatment protocols, and treatment decisions are managed by the oncologist.
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-6">
          {/* Patient list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#2C3E2D]">Patients</h2>
              <span className="text-xs text-[#9CA3AF]">{seedPatientProfiles.length} total</span>
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
            <div className="bg-white rounded-xl border border-[#E5E2DC] overflow-hidden">
              {filteredPatients.map((p) => {
                const labCount = allLabs.filter((l) => l.patientProfileId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 border-b border-[#F5F2EE] last:border-0 text-left transition-colors ${
                      selectedPatientId === p.id ? "bg-[#F0F7F3] border-l-2 border-l-[#7CAE8E]" : "hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2C3E2D]">{p.fullName}</p>
                      <p className="text-xs text-[#9CA3AF]">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {labCount > 0 && (
                        <span className="text-xs bg-[#7CAE8E]/10 text-[#7CAE8E] px-1.5 py-0.5 rounded-full font-medium">{labCount}</span>
                      )}
                      <ChevronRight size={13} className="text-[#9CA3AF]" />
                    </div>
                  </button>
                );
              })}
            </div>
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

                {patientLabs.length === 0 ? (
                  <div className="bg-white border border-[#E5E2DC] rounded-xl p-8 text-center text-sm text-[#9CA3AF]">
                    No lab results entered for this patient yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {patientLabs.map((lab) => (
                      <div key={lab.id} className="bg-white border border-[#E5E2DC] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-sm font-semibold text-[#2C3E2D]">{formatDate(lab.date)}</span>
                            {lab.linkedCycleId && (
                              <span className="ml-2 text-xs text-[#7CAE8E] bg-[#F0F7F3] px-2 py-0.5 rounded-full">Linked to cycle</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingLab(lab); setShowForm(true); }} className="text-[#9CA3AF] hover:text-[#7CAE8E]"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(lab.id)} className="text-[#9CA3AF] hover:text-red-500"><Trash2 size={13} /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                          {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => (
                            <div key={field} className="flex items-center gap-2">
                              <span className="text-[#9CA3AF] w-20 capitalize shrink-0">{field}</span>
                              <LabCell field={field} value={lab[field]} />
                            </div>
                          ))}
                        </div>
                        {lab.notes && <p className="text-xs text-[#9CA3AF]">{lab.notes}</p>}
                        <p className="text-xs text-[#9CA3AF] mt-2">Entered by {lab.enteredBy} · {formatDate(lab.enteredAt)}</p>
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
          patients={seedPatientProfiles}
          labStaffName={labStaffName}
          allProtocols={seedTreatmentProtocols}
          onSave={handleSaveLab}
          onClose={() => { setShowForm(false); setEditingLab(undefined); }}
          editingLab={editingLab}
        />
      )}
    </div>
  );
}
