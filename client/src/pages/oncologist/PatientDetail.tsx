import { useState } from "react";
import {
  ArrowLeft,
  Home,
  Pencil,
  X,
  Check,
  FlaskConical,
  Pill,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  Paperclip,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Stethoscope,
  Syringe,
  Zap,
  Scissors,
  Info,
} from "lucide-react";
import {
  seedOncologist,
  seedPatientProfiles,
  seedTreatmentProtocols,
  seedLabResults,
  seedMessages,
  PatientProfile,
  TreatmentProtocol,
  LabResult,
  Message,
  MessageAttachment,
  ChemoCycle,
  RadiationCourse,
  SurgeryCheckpoint,
  TreatmentItem,
  Medication,
  MedicationCategory,
  MedicationRoute,
  CycleStatus,
  TreatmentItemType,
  getLabStatus,
  LabFieldKey,
  formatDate,
  formatDateShort,
  shiftDate,
  TODAY,
} from "../../utils/mockData";
import { RibbonBackground } from "../../components/shared/RibbonBackground";

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onHome: () => void;
  allProfiles: PatientProfile[];
  allProtocols: TreatmentProtocol[];
  allLabResults: LabResult[];
  allMessages: Message[];
  onUpdateProfile: (p: PatientProfile) => void;
  onUpdateProtocol: (tp: TreatmentProtocol) => void;
  onUpdateCycleStatus: (protocolId: string, cycleId: string, status: CycleStatus, extra?: Partial<ChemoCycle>) => void;
  onAddLabResult: (lr: LabResult) => void;
  onSendMessage: (m: Message) => void;
}

function SourceLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-2 py-0.5 rounded-full border border-[#E5E2DC]">
      <Info size={10} /> {text}
    </span>
  );
}

function SectionCard({ title, source, meta, editButton, children }: {
  title: string;
  source?: string;
  meta?: string;
  editButton?: React.ReactNode;
  children: React.ReactNode;
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-[#9CA3AF] w-28 shrink-0">{label}</span>
      <span className="text-sm text-[#2C3E2D]">{value || "—"}</span>
    </div>
  );
}

const inputCls = "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
const labelCls = "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

function LabCell({ field, value }: { field: LabFieldKey; value: number }) {
  const status = getLabStatus(field, value);
  const color = status === "normal" ? "text-emerald-700" : status === "low" ? "text-amber-700" : "text-red-700";
  const bg = status === "normal" ? "bg-emerald-50" : status === "low" ? "bg-amber-50" : "bg-red-50";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${bg} ${color}`}>
      {value} {status !== "normal" && `(${status})`}
    </span>
  );
}

function CycleBadge({ status }: { status: CycleStatus }) {
  const cfg: Record<CycleStatus, { label: string; color: string }> = {
    completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
    approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
    waiting_labs: { label: "Waiting for labs", color: "bg-amber-100 text-amber-700" },
    delayed: { label: "Delayed", color: "bg-red-100 text-red-700" },
    upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-700" },
  };
  const { label, color } = cfg[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function EditProfileModal({ profile, onClose, onSave }: { profile: PatientProfile; onClose: () => void; onSave: (p: PatientProfile) => void }) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    nationalId: profile.nationalId,
    dateOfBirth: profile.dateOfBirth,
    diagnosis: profile.diagnosis,
    bloodType: profile.bloodType,
    allergiesRaw: profile.allergies.join(", "),
    notes: profile.notes || "",
  });

  const handleSave = () => {
    onSave({
      ...profile,
      ...form,
      allergies: form.allergiesRaw.split(",").map((s) => s.trim()).filter(Boolean),
      lastUpdatedBy: seedOncologist.fullName,
      lastUpdatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2"><Pencil size={15} className="text-[#7CAE8E]" /> Edit Medical Profile</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className={labelCls}>Full Name</label><input className={inputCls} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div><label className={labelCls}>National ID</label><input className={inputCls} value={form.nationalId} onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))} /></div>
            <div><label className={labelCls}>Date of Birth</label><input className={inputCls} type="date" value={form.dateOfBirth} onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))} /></div>
            <div>
              <label className={labelCls}>Blood Type</label>
              <select className={inputCls} value={form.bloodType} onChange={(e) => setForm((p) => ({ ...p, bloodType: e.target.value }))}>
                {["A+","A−","B+","B−","AB+","AB−","O+","O−"].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div className="col-span-2"><label className={labelCls}>Diagnosis</label><input className={inputCls} value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} /></div>
            <div className="col-span-2"><label className={labelCls}>Allergies (comma separated)</label><input className={inputCls} value={form.allergiesRaw} onChange={(e) => setForm((p) => ({ ...p, allergiesRaw: e.target.value }))} /></div>
            <div className="col-span-2"><label className={labelCls}>Notes</label><textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A]">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function EditMedicationsModal({ profile, onClose, onSave }: { profile: PatientProfile; onClose: () => void; onSave: (meds: Medication[]) => void }) {
  const [medications, setMedications] = useState<Medication[]>([...profile.medications]);
  const [medForm, setMedForm] = useState({ name: "", dose: "", route: "IV" as MedicationRoute, frequency: "", timing: "", category: "chemotherapy" as MedicationCategory, notes: "" });

  const addMedication = () => {
    if (!medForm.name.trim() || !medForm.dose.trim()) return;
    setMedications((prev) => [...prev, { ...medForm, id: `med-${Date.now()}` }]);
    setMedForm({ name: "", dose: "", route: "IV", frequency: "", timing: "", category: "chemotherapy", notes: "" });
  };

  const removeMed = (id: string) => setMedications((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2"><Pill size={15} className="text-[#7CAE8E]" /> Edit Medication Plan</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-4">
          {medications.map((med) => (
            <div key={med.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-[#E5E2DC]">
              <div>
                <p className="text-sm font-medium text-[#2C3E2D]">{med.name} <span className="text-[#9CA3AF] font-normal">— {med.dose}</span></p>
                <p className="text-xs text-[#9CA3AF]">{med.route} · {med.frequency} · {med.category}</p>
              </div>
              <button onClick={() => removeMed(med.id)} className="text-[#9CA3AF] hover:text-red-500"><X size={14} /></button>
            </div>
          ))}
          <div className="bg-white border border-dashed border-[#C8D9CC] rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Add Medication</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Name</label><input className={inputCls} value={medForm.name} onChange={(e) => setMedForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><label className={labelCls}>Dose</label><input className={inputCls} value={medForm.dose} onChange={(e) => setMedForm((p) => ({ ...p, dose: e.target.value }))} /></div>
              <div><label className={labelCls}>Route</label><select className={inputCls} value={medForm.route} onChange={(e) => setMedForm((p) => ({ ...p, route: e.target.value as MedicationRoute }))}>{(["IV","oral","subcutaneous","topical"] as MedicationRoute[]).map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><label className={labelCls}>Category</label><select className={inputCls} value={medForm.category} onChange={(e) => setMedForm((p) => ({ ...p, category: e.target.value as MedicationCategory }))}><option value="chemotherapy">Chemotherapy</option><option value="supportive">Supportive</option><option value="chronic">Chronic</option></select></div>
              <div><label className={labelCls}>Frequency</label><input className={inputCls} value={medForm.frequency} onChange={(e) => setMedForm((p) => ({ ...p, frequency: e.target.value }))} /></div>
              <div><label className={labelCls}>Timing</label><input className={inputCls} value={medForm.timing} onChange={(e) => setMedForm((p) => ({ ...p, timing: e.target.value }))} /></div>
            </div>
            <button type="button" onClick={addMedication} className="text-sm text-[#7CAE8E] hover:text-[#5A8A6A] font-medium flex items-center gap-1">+ Add</button>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
          <button onClick={() => { onSave(medications); onClose(); }} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A]">Save Medications</button>
        </div>
      </div>
    </div>
  );
}

function EditProtocolModal({ protocol, onClose, onSave }: { protocol: TreatmentProtocol; onClose: () => void; onSave: (tp: TreatmentProtocol) => void }) {
  const [form, setForm] = useState({
    protocolName: protocol.protocolName,
    diagnosis: protocol.diagnosis,
    drugs: protocol.drugs.join(", "),
    notes: protocol.notes || "",
    includeChemotherapy: protocol.treatmentTypes.includes("chemotherapy"),
    includeRadiation: protocol.treatmentTypes.includes("radiation"),
    includeSurgery: protocol.treatmentTypes.includes("surgery"),
    includeSupportive: protocol.treatmentTypes.includes("supportive"),
    numberOfChemoCycles: protocol.numberOfChemoCycles?.toString() || "",
    numberOfRadiationSessions: protocol.numberOfRadiationSessions?.toString() || "",
    numberOfSurgeryCheckpoints: protocol.numberOfSurgeryCheckpoints?.toString() || "",
  });

  const handleSave = () => {
    const treatmentTypes: TreatmentItemType[] = [];
    if (form.includeChemotherapy) treatmentTypes.push("chemotherapy");
    if (form.includeRadiation) treatmentTypes.push("radiation");
    if (form.includeSurgery) treatmentTypes.push("surgery");
    if (form.includeSupportive) treatmentTypes.push("supportive");

    onSave({
      ...protocol,
      protocolName: form.protocolName,
      diagnosis: form.diagnosis,
      drugs: form.drugs.split(",").map((s) => s.trim()).filter(Boolean),
      notes: form.notes,
      treatmentTypes,
      numberOfChemoCycles: form.includeChemotherapy && form.numberOfChemoCycles ? parseInt(form.numberOfChemoCycles) : undefined,
      numberOfRadiationSessions: form.includeRadiation && form.numberOfRadiationSessions ? parseInt(form.numberOfRadiationSessions) : undefined,
      numberOfSurgeryCheckpoints: form.includeSurgery && form.numberOfSurgeryCheckpoints ? parseInt(form.numberOfSurgeryCheckpoints) : undefined,
      lastUpdatedBy: seedOncologist.fullName,
      lastUpdatedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2"><Stethoscope size={15} className="text-[#7CAE8E]" /> Edit Treatment Protocol</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className={labelCls}>Protocol Name</label><input className={inputCls} value={form.protocolName} onChange={(e) => setForm((p) => ({ ...p, protocolName: e.target.value }))} /></div>
          <div><label className={labelCls}>Diagnosis</label><input className={inputCls} value={form.diagnosis} onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} /></div>

          <div>
            <label className={labelCls}>Treatment Types Included</label>
            <div className="space-y-2 bg-white rounded-lg border border-[#E5E2DC] p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.includeChemotherapy} onChange={(e) => setForm((p) => ({ ...p, includeChemotherapy: e.target.checked }))} className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]" />
                <span className="text-sm text-[#2C3E2D]">Chemotherapy</span>
              </label>
              {form.includeChemotherapy && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">Number of Chemotherapy Cycles</label>
                  <input type="number" min="1" className={inputCls} value={form.numberOfChemoCycles} onChange={(e) => setForm((p) => ({ ...p, numberOfChemoCycles: e.target.value }))} placeholder="e.g., 6" />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.includeRadiation} onChange={(e) => setForm((p) => ({ ...p, includeRadiation: e.target.checked }))} className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]" />
                <span className="text-sm text-[#2C3E2D]">Radiation Therapy</span>
              </label>
              {form.includeRadiation && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">Number of Radiation Sessions</label>
                  <input type="number" min="1" className={inputCls} value={form.numberOfRadiationSessions} onChange={(e) => setForm((p) => ({ ...p, numberOfRadiationSessions: e.target.value }))} placeholder="e.g., 30" />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.includeSurgery} onChange={(e) => setForm((p) => ({ ...p, includeSurgery: e.target.checked }))} className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]" />
                <span className="text-sm text-[#2C3E2D]">Surgery Checkpoint</span>
              </label>
              {form.includeSurgery && (
                <div className="ml-6">
                  <label className="block text-xs text-[#6B7280] mb-1">Number of Surgery Checkpoints</label>
                  <input type="number" min="1" className={inputCls} value={form.numberOfSurgeryCheckpoints} onChange={(e) => setForm((p) => ({ ...p, numberOfSurgeryCheckpoints: e.target.value }))} placeholder="e.g., 1" />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.includeSupportive} onChange={(e) => setForm((p) => ({ ...p, includeSupportive: e.target.checked }))} className="w-4 h-4 text-[#7CAE8E] rounded focus:ring-[#7CAE8E]" />
                <span className="text-sm text-[#2C3E2D]">Supportive Treatment</span>
              </label>
            </div>
          </div>

          <div><label className={labelCls}>Drugs / Medications (comma separated)</label><input className={inputCls} value={form.drugs} onChange={(e) => setForm((p) => ({ ...p, drugs: e.target.value }))} /></div>
          <div><label className={labelCls}>Notes</label><textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A]">Save Protocol</button>
        </div>
      </div>
    </div>
  );
}

function EditTreatmentDatesModal({ protocol, onClose, onSave }: { protocol: TreatmentProtocol; onClose: () => void; onSave: (tp: TreatmentProtocol) => void }) {
  const [items, setItems] = useState([...protocol.items]);

  const updateItem = (id: string, field: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2"><Calendar size={15} className="text-[#7CAE8E]" /> Edit Treatment Dates</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-[#E5E2DC] rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                {item.type === "chemotherapy" && <Syringe size={13} className="text-[#7CAE8E]" />}
                {item.type === "radiation" && <Zap size={13} className="text-amber-500" />}
                {item.type === "surgery" && <Scissors size={13} className="text-blue-500" />}
                <span className="text-sm font-medium text-[#2C3E2D]">{item.title}</span>
                <span className="text-xs text-[#9CA3AF]">({item.type})</span>
              </div>
              {item.type === "chemotherapy" && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Start Date</label><input className={inputCls} type="date" value={(item as ChemoCycle).startDate} onChange={(e) => updateItem(item.id, "startDate", e.target.value)} /></div>
                  <div><label className={labelCls}>End Date</label><input className={inputCls} type="date" value={(item as ChemoCycle).endDate} onChange={(e) => updateItem(item.id, "endDate", e.target.value)} /></div>
                  <div className="col-span-2"><label className={labelCls}>Notes</label><input className={inputCls} value={(item as ChemoCycle).notes || ""} onChange={(e) => updateItem(item.id, "notes", e.target.value)} /></div>
                </div>
              )}
              {item.type === "radiation" && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Start Date</label><input className={inputCls} type="date" value={(item as RadiationCourse).startDate} onChange={(e) => updateItem(item.id, "startDate", e.target.value)} /></div>
                  <div><label className={labelCls}>End Date</label><input className={inputCls} type="date" value={(item as RadiationCourse).endDate} onChange={(e) => updateItem(item.id, "endDate", e.target.value)} /></div>
                  <div><label className={labelCls}>Total Sessions</label><input className={inputCls} type="number" value={(item as RadiationCourse).totalSessions} onChange={(e) => updateItem(item.id, "totalSessions", e.target.value)} /></div>
                </div>
              )}
              {item.type === "surgery" && (
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Planned Date</label><input className={inputCls} type="date" value={(item as SurgeryCheckpoint).plannedDate} onChange={(e) => updateItem(item.id, "plannedDate", e.target.value)} /></div>
                  <div><label className={labelCls}>Notes</label><input className={inputCls} value={(item as SurgeryCheckpoint).notes || ""} onChange={(e) => updateItem(item.id, "notes", e.target.value)} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
          <button onClick={() => { onSave({ ...protocol, items, lastUpdatedBy: seedOncologist.fullName, lastUpdatedAt: new Date().toISOString() }); onClose(); }} className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A]">Save Dates</button>
        </div>
      </div>
    </div>
  );
}

function DelayCycleModal({ cycle, onClose, onConfirm }: { cycle: ChemoCycle; onClose: () => void; onConfirm: (reason: string, newStartDate: string, newEndDate: string) => void }) {
  const [reason, setReason] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D]">Delay {cycle.title}</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280]"><X size={18} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className={labelCls}>Reason for Delay</label>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Clinical reason for delaying this cycle…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>New Start Date</label>
              <input className={inputCls} type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>New End Date</label>
              <input className={inputCls} type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE]">Cancel</button>
          <button onClick={() => { if (reason && newStartDate && newEndDate) { onConfirm(reason, newStartDate, newEndDate); onClose(); } }} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50" disabled={!reason || !newStartDate || !newEndDate}>Confirm Delay</button>
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === "chemotherapy") return <Syringe size={14} className="text-[#7CAE8E]" />;
  if (type === "radiation") return <Zap size={14} className="text-amber-500" />;
  if (type === "surgery") return <Scissors size={14} className="text-blue-500" />;
  return <Pill size={14} className="text-gray-400" />;
}

function AttachmentChip({ att }: { att: MessageAttachment }) {
  const iconMap: Record<string, string> = { pdf: "📄", docx: "📝", jpg: "🖼️", png: "🖼️" };
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F5F2EE] border border-[#E5E2DC] rounded-lg text-xs">
      <span>{iconMap[att.fileType] || "📎"}</span>
      <span className="text-[#374151] font-medium">{att.fileName}</span>
      <span className="text-[#9CA3AF]">{att.uploadDate}</span>
      <button className="text-[#7CAE8E] hover:text-[#5A8A6A]"><Download size={11} /></button>
    </div>
  );
}

type ChemoDisplayStatus = CycleStatus | "active" | "ready_for_review";

function getChemoDisplayStatus(cycle: ChemoCycle, hasLabs: boolean): ChemoDisplayStatus {
  if (cycle.status === "completed") return "completed";
  if (cycle.status === "approved") {
    if (cycle.startDate <= TODAY && cycle.endDate >= TODAY) return "active";
    return "approved";
  }
  if (cycle.status === "waiting_labs") return hasLabs ? "ready_for_review" : "waiting_labs";
  if (cycle.status === "delayed") return "delayed";
  return "upcoming";
}

function CycleDisplayBadge({ displayStatus }: { displayStatus: ChemoDisplayStatus }) {
  const cfg: Record<ChemoDisplayStatus, { label: string; color: string }> = {
    completed:        { label: "Completed",       color: "bg-gray-100 text-gray-600" },
    approved:         { label: "Approved",         color: "bg-emerald-100 text-emerald-700" },
    active:           { label: "Active",           color: "bg-[#7CAE8E] text-white" },
    waiting_labs:     { label: "Waiting for labs", color: "bg-amber-100 text-amber-700" },
    ready_for_review: { label: "Ready for Review", color: "bg-violet-100 text-violet-700" },
    delayed:          { label: "Delayed",          color: "bg-red-100 text-red-700" },
    upcoming:         { label: "Upcoming",         color: "bg-blue-100 text-blue-700" },
  };
  const { label, color } = cfg[displayStatus] ?? { label: displayStatus, color: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function syncItemsToProtocol(oldItems: TreatmentItem[], newProtocol: TreatmentProtocol): TreatmentItem[] {
  const existingChemo = oldItems.filter((i) => i.type === "chemotherapy") as ChemoCycle[];
  const existingRad = oldItems.filter((i) => i.type === "radiation") as RadiationCourse[];
  const existingSurg = oldItems.filter((i) => i.type === "surgery") as SurgeryCheckpoint[];

  let newChemo: ChemoCycle[] = existingChemo;
  let newRad: RadiationCourse[] = existingRad;
  let newSurg: SurgeryCheckpoint[] = existingSurg;

  if (newProtocol.treatmentTypes.includes("chemotherapy") && newProtocol.numberOfChemoCycles) {
    const target = newProtocol.numberOfChemoCycles;
    if (target > existingChemo.length) {
      const additions: ChemoCycle[] = [];
      for (let i = existingChemo.length; i < target; i++) {
        const prev = newChemo[i - 1];
        const start = prev ? shiftDate(prev.endDate, 1) : TODAY;
        const end = shiftDate(start, 20);
        additions.push({ id: `cycle-${Date.now()}-${i}`, type: "chemotherapy", title: `Cycle ${i + 1}`, cycleNumber: i + 1, startDate: start, endDate: end, status: "upcoming" });
      }
      newChemo = [...existingChemo, ...additions];
    } else if (target < existingChemo.length) {
      newChemo = existingChemo.slice(0, target);
    }
  } else if (!newProtocol.treatmentTypes.includes("chemotherapy")) {
    newChemo = [];
  }

  if (newProtocol.treatmentTypes.includes("radiation") && newProtocol.numberOfRadiationSessions) {
    if (existingRad.length > 0) {
      newRad = existingRad.map((r) => ({ ...r, totalSessions: newProtocol.numberOfRadiationSessions! }));
    } else {
      const refDate = newChemo.length > 0 ? newChemo[newChemo.length - 1].endDate : TODAY;
      const start = shiftDate(refDate, 7);
      const end = shiftDate(start, Math.ceil((newProtocol.numberOfRadiationSessions * 7) / 5));
      newRad = [{ id: `rad-${Date.now()}`, type: "radiation", title: "Radiation Course", startDate: start, endDate: end, totalSessions: newProtocol.numberOfRadiationSessions, completedSessions: 0, status: "upcoming" }];
    }
  } else if (!newProtocol.treatmentTypes.includes("radiation")) {
    newRad = [];
  }

  if (newProtocol.treatmentTypes.includes("surgery") && newProtocol.numberOfSurgeryCheckpoints) {
    const target = newProtocol.numberOfSurgeryCheckpoints;
    if (target > existingSurg.length) {
      const additions: SurgeryCheckpoint[] = [];
      for (let i = existingSurg.length; i < target; i++) {
        additions.push({ id: `surg-${Date.now()}-${i}`, type: "surgery", title: i === 0 ? "Surgery Checkpoint" : `Surgery Checkpoint ${i + 1}`, plannedDate: shiftDate(TODAY, 30 + i * 14), status: "upcoming" });
      }
      newSurg = [...existingSurg, ...additions];
    } else if (target < existingSurg.length) {
      newSurg = existingSurg.slice(0, target);
    }
  } else if (!newProtocol.treatmentTypes.includes("surgery")) {
    newSurg = [];
  }

  return [...newChemo, ...newRad, ...newSurg];
}

type ChartPoint = { date: string; WBC?: number; Neutrophils?: number; Hemoglobin?: number };

function LabTrendChart({ data }: { data: ChartPoint[] }) {
  const W = 600; const H = 140; const PAD = { top: 10, right: 10, bottom: 28, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const series = [
    { key: "WBC" as const, stroke: "#7CAE8E" },
    { key: "Neutrophils" as const, stroke: "#F59E0B" },
    { key: "Hemoglobin" as const, stroke: "#60A5FA" },
  ];

  const allVals = data.flatMap((d) => series.map((s) => d[s.key] ?? null).filter((v) => v !== null)) as number[];
  const minV = Math.min(...allVals, 1.5) - 0.5;
  const maxV = Math.max(...allVals, 15) + 0.5;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;

  const pathD = (key: keyof ChartPoint) =>
    data.reduce((acc, d, i) => {
      const v = d[key] as number | undefined;
      if (v == null) return acc;
      const x = xScale(i); const y = yScale(v);
      return acc === "" ? `M${x},${y}` : `${acc} L${x},${y}`;
    }, "");

  const yRefWBC = yScale(4.0);
  const yRefNeut = yScale(1.5);

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wide">Trends</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <line x1={PAD.left} y1={yRefWBC} x2={W - PAD.right} y2={yRefWBC} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 3" />
        <line x1={PAD.left} y1={yRefNeut} x2={W - PAD.right} y2={yRefNeut} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 3" />
        {series.map((s) => (
          <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map((s) =>
          data.map((d, i) => {
            const v = d[s.key] as number | undefined;
            if (v == null) return null;
            return <circle key={`${s.key}-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill={s.stroke} />;
          })
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
        {series.map((s, i) => (
          <g key={`leg-${s.key}`} transform={`translate(${PAD.left + i * 90}, ${PAD.top})`}>
            <line x1={0} y1={5} x2={14} y2={5} stroke={s.stroke} strokeWidth={2} />
            <text x={17} y={9} fontSize={9} fill="#6B7280">{s.key}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function PatientDetail({
  patientId,
  onBack,
  onHome,
  allProfiles,
  allProtocols,
  allLabResults,
  allMessages,
  onUpdateProfile,
  onUpdateProtocol,
  onUpdateCycleStatus,
  onSendMessage,
}: PatientDetailProps) {
  const [profile, setProfile] = useState<PatientProfile>(
    allProfiles.find((p) => p.id === patientId) ?? seedPatientProfiles.find((p) => p.id === patientId)!
  );
  const [protocol, setProtocol] = useState<TreatmentProtocol | undefined>(
    allProtocols.find((tp) => tp.patientProfileId === patientId) ??
    seedTreatmentProtocols.find((tp) => tp.patientProfileId === patientId)
  );

  const labs = [
    ...seedLabResults.filter((l) => l.patientProfileId === patientId),
    ...allLabResults.filter((l) => l.patientProfileId === patientId && !seedLabResults.find((sl) => sl.id === l.id)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const messages = [
    ...seedMessages.filter((m) => m.patientProfileId === patientId),
    ...allMessages.filter((m) => m.patientProfileId === patientId && !seedMessages.find((sm) => sm.id === m.id)),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const [modal, setModal] = useState<"profile" | "medications" | "protocol" | "dates" | null>(null);
  const [delayCycle, setDelayCycle] = useState<ChemoCycle | null>(null);
  const [messageText, setMessageText] = useState("");
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);

  const latestLab = labs[0];

  const chartData = [...labs].reverse().map((l, i) => ({
    date: `${formatDateShort(l.date)}_${i}`,
    dateLabel: formatDateShort(l.date),
    WBC: l.wbc,
    Neutrophils: l.neutrophils,
    Hemoglobin: l.hemoglobin,
  }));

  const handleApprove = (cycle: ChemoCycle) => {
    if (!protocol) return;
    const updated = {
      ...protocol,
      items: protocol.items.map((item) =>
        item.id === cycle.id
          ? { ...item, status: "approved" as CycleStatus, approvedDate: TODAY, approvedBy: seedOncologist.fullName }
          : item
      ),
      lastUpdatedBy: seedOncologist.fullName,
      lastUpdatedAt: new Date().toISOString(),
    };
    setProtocol(updated);
    onUpdateProtocol(updated);
  };

  const handleDelay = (cycle: ChemoCycle, reason: string, newStartDate: string, newEndDate: string) => {
    if (!protocol) return;
    const updated = {
      ...protocol,
      items: protocol.items.map((item) =>
        item.id === cycle.id
          ? { ...item, status: "delayed" as CycleStatus, delayedTo: newStartDate, delayedEndDate: newEndDate, delayReason: reason }
          : item
      ),
      lastUpdatedBy: seedOncologist.fullName,
      lastUpdatedAt: new Date().toISOString(),
    };
    setProtocol(updated);
    onUpdateProtocol(updated);
  };

  const handleSaveProfile = (p: PatientProfile) => {
    setProfile(p);
    onUpdateProfile(p);
  };

  const handleSaveMedications = (meds: Medication[]) => {
    const updated = { ...profile, medications: meds, lastUpdatedBy: seedOncologist.fullName, lastUpdatedAt: new Date().toISOString() };
    setProfile(updated);
    onUpdateProfile(updated);
  };

  const handleSaveProtocol = (tp: TreatmentProtocol) => {
    const syncedItems = syncItemsToProtocol(protocol?.items ?? [], tp);
    const final = { ...tp, items: syncedItems };
    setProtocol(final);
    onUpdateProtocol(final);
  };

  const handleSaveDates = (tp: TreatmentProtocol) => {
    setProtocol(tp);
    onUpdateProtocol(tp);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}`,
      patientProfileId: patientId,
      sender: seedOncologist.fullName,
      senderRole: "oncologist",
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
      read: true,
    };
    onSendMessage(msg);
    setMessageText("");
  };

  const hasCycleLabResult = (cycle: ChemoCycle) =>
    labs.some((l) => l.linkedCycleId === cycle.id) || !!cycle.labResultId;

  const cycleItems = protocol?.items.filter((i) => i.type === "chemotherapy") as ChemoCycle[] | undefined;
  const radiationItems = protocol?.items.filter((i) => i.type === "radiation") as RadiationCourse[] | undefined;
  const surgeryItems = protocol?.items.filter((i) => i.type === "surgery") as SurgeryCheckpoint[] | undefined;

  const categoryColor: Record<string, string> = {
    chemotherapy: "bg-emerald-50 text-emerald-700 border-emerald-200",
    supportive: "bg-blue-50 text-blue-700 border-blue-200",
    chronic: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <RibbonBackground />

      <header className="sticky top-0 z-20 bg-[#FAF8F5]/95 backdrop-blur border-b border-[#E5E2DC]">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#2C3E2D] transition-colors">
              <ArrowLeft size={15} /> Directory
            </button>
            <span className="text-[#E5E2DC]">·</span>
            <h1 className="text-sm font-semibold text-[#2C3E2D]">{profile.fullName}</h1>
            {profile.allergies.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                <AlertTriangle size={10} /> Allergies
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9CA3AF]">{seedOncologist.fullName}</span>
            <button onClick={onHome} className="text-[#9CA3AF] hover:text-[#6B7280]"><Home size={15} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5 relative z-10">

        <SectionCard
          title="Patient Medical Profile"
          source="Created by oncologist"
          meta={`Last updated by ${profile.lastUpdatedBy} · ${formatDate(profile.lastUpdatedAt)}`}
          editButton={
            <button onClick={() => setModal("profile")} className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg">
              <Pencil size={12} /> Edit Profile
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <MetaRow label="Full Name" value={profile.fullName} />
            <MetaRow label="Email" value={profile.email} />
            <MetaRow label="National ID" value={profile.nationalId} />
            <MetaRow label="Date of Birth" value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"} />
            <MetaRow label="Blood Type" value={profile.bloodType} />
            <MetaRow label="Oncologist" value={seedOncologist.fullName} />
            <div className="col-span-2"><MetaRow label="Diagnosis" value={profile.diagnosis} /></div>
            {profile.allergies.length > 0 && (
              <div className="col-span-2 flex gap-2 items-center">
                <span className="text-xs text-[#9CA3AF] w-28 shrink-0">Allergies</span>
                <div className="flex flex-wrap gap-1">
                  {profile.allergies.map((a) => (
                    <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs border border-red-200">{a}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.notes && (
              <div className="col-span-2"><MetaRow label="Notes" value={profile.notes} /></div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Medication Plan"
          source="Medication list created by oncologist"
          meta={`Last updated by ${profile.lastUpdatedBy} · ${formatDate(profile.lastUpdatedAt)}`}
          editButton={
            <button onClick={() => setModal("medications")} className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg">
              <Pencil size={12} /> Edit Medications
            </button>
          }
        >
          {profile.medications.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No medications added yet.</p>
          ) : (
            <div className="space-y-2">
              {(["chemotherapy", "supportive", "chronic"] as MedicationCategory[]).map((cat) => {
                const meds = profile.medications.filter((m) => m.category === cat);
                if (!meds.length) return null;
                return (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                      {cat === "chemotherapy" ? "Chemotherapy" : cat === "supportive" ? "Supportive" : "Chronic / Background"}
                    </p>
                    <div className="space-y-1.5">
                      {meds.map((med) => (
                        <div key={med.id} className={`flex items-start justify-between rounded-lg px-3 py-2 border text-sm ${categoryColor[cat]}`}>
                          <div>
                            <span className="font-medium">{med.name}</span>
                            <span className="text-xs ml-2 opacity-70">{med.dose} · {med.route}</span>
                            <div className="text-xs opacity-70 mt-0.5">{med.frequency} — {med.timing}</div>
                            {med.notes && <div className="text-xs opacity-70">{med.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {protocol && (
          <SectionCard
            title="Treatment Protocol"
            source="Treatment protocol managed by oncologist"
            meta={`Last updated by ${protocol.lastUpdatedBy} · ${formatDate(protocol.lastUpdatedAt)}`}
            editButton={
              <button onClick={() => setModal("protocol")} className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg">
                <Pencil size={12} /> Edit Protocol
              </button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow label="Protocol" value={protocol.protocolName} />
                <MetaRow label="Diagnosis" value={protocol.diagnosis} />
              </div>
              <div>
                <span className="text-xs text-[#9CA3AF] block mb-1.5">Treatment Types</span>
                <div className="flex flex-wrap gap-1.5">
                  {protocol.treatmentTypes.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC]">
                      <TypeIcon type={t} /> {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              {protocol.treatmentTypes.includes("chemotherapy") && protocol.numberOfChemoCycles && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <MetaRow label="Chemotherapy Cycles" value={`${protocol.numberOfChemoCycles} cycles planned`} />
                </div>
              )}
              {protocol.treatmentTypes.includes("radiation") && protocol.numberOfRadiationSessions && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <MetaRow label="Radiation Sessions" value={`${protocol.numberOfRadiationSessions} sessions planned`} />
                </div>
              )}
              {protocol.treatmentTypes.includes("surgery") && protocol.numberOfSurgeryCheckpoints && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  <MetaRow label="Surgery Checkpoints" value={`${protocol.numberOfSurgeryCheckpoints} checkpoint(s) planned`} />
                </div>
              )}
              <div>
                <span className="text-xs text-[#9CA3AF] block mb-1.5">Drugs</span>
                <div className="flex flex-wrap gap-1.5">
                  {protocol.drugs.map((d) => (
                    <span key={d} className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full">{d}</span>
                  ))}
                </div>
              </div>
              {protocol.notes && <MetaRow label="Notes" value={protocol.notes} />}
            </div>
          </SectionCard>
        )}

        {protocol && (
          <SectionCard
            title="Treatment Roadmap"
            source="Treatment schedule managed by oncologist"
            editButton={
              <button onClick={() => setModal("dates")} className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg">
                <Pencil size={12} /> Edit Dates
              </button>
            }
          >
            <div className="space-y-2">
              {protocol.items.map((item) => {
                const isChemo = item.type === "chemotherapy";
                const isRad = item.type === "radiation";
                const isSurg = item.type === "surgery";
                const chemo = item as ChemoCycle;
                const rad = item as RadiationCourse;
                const surg = item as SurgeryCheckpoint;

                if (isChemo) {
                  const hasLabs = hasCycleLabResult(chemo);
                  const displayStatus = getChemoDisplayStatus(chemo, hasLabs);
                  const isExpanded = expandedCycle === chemo.id;
                  const effectiveDateStr = chemo.status === "delayed" && chemo.delayedTo
                    ? `Delayed → ${formatDate(chemo.delayedTo)}${chemo.delayedEndDate ? ` – ${formatDate(chemo.delayedEndDate)}` : ""}`
                    : `${formatDate(chemo.startDate)} – ${formatDate(chemo.endDate)}`;
                  return (
                    <div key={item.id} className="border border-[#E5E2DC] rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#FAF8F5] transition-colors text-left"
                        onClick={() => setExpandedCycle(isExpanded ? null : chemo.id)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <Syringe size={14} className="text-[#7CAE8E] shrink-0" />
                          <span className="text-sm font-medium text-[#2C3E2D]">{chemo.title}</span>
                          <CycleDisplayBadge displayStatus={displayStatus} />
                          <span className="text-xs text-[#9CA3AF]">{effectiveDateStr}</span>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-[#9CA3AF] shrink-0" /> : <ChevronDown size={14} className="text-[#9CA3AF] shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="px-4 py-3 bg-[#F5F2EE] border-t border-[#E5E2DC] space-y-3">
                          {displayStatus === "upcoming" && (
                            <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                              <p>Scheduled: {formatDate(chemo.startDate)} – {formatDate(chemo.endDate)}</p>
                              <p className="text-xs mt-1 text-blue-600">No action required yet.</p>
                            </div>
                          )}
                          {displayStatus === "waiting_labs" && (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              <FlaskConical size={14} />
                              <span>Waiting for lab results before this cycle can be reviewed.</span>
                            </div>
                          )}
                          {displayStatus === "ready_for_review" && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <CheckCircle2 size={14} />
                                <span>Lab results received. Ready for oncologist approval.</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleApprove(chemo)} className="flex items-center gap-1.5 px-4 py-2 bg-[#7CAE8E] text-white rounded-lg text-sm font-medium hover:bg-[#5A8A6A] transition-colors">
                                  <Check size={13} /> Approve Cycle
                                </button>
                                <button onClick={() => setDelayCycle(chemo)} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                                  <XCircle size={13} /> Delay Cycle
                                </button>
                              </div>
                            </div>
                          )}
                          {(displayStatus === "approved" || displayStatus === "active") && (
                            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                              <p>✓ Approved on {formatDate(chemo.approvedDate || "")} by {chemo.approvedBy}</p>
                              {displayStatus === "active" && <p className="text-xs mt-0.5 text-emerald-600">Currently in progress.</p>}
                            </div>
                          )}
                          {displayStatus === "delayed" && (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
                              <p>⚠ Delayed to: {formatDate(chemo.delayedTo || "")}{chemo.delayedEndDate ? ` – ${formatDate(chemo.delayedEndDate)}` : ""}</p>
                              {chemo.delayReason && <p className="text-xs">Reason: {chemo.delayReason}</p>}
                            </div>
                          )}
                          {displayStatus === "completed" && (
                            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                              ✓ Cycle completed.{chemo.approvedDate && <span className="text-xs ml-1">Approved {formatDate(chemo.approvedDate)} by {chemo.approvedBy}.</span>}
                            </div>
                          )}
                          {chemo.notes && <p className="text-xs text-[#9CA3AF]">{chemo.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                }

                if (isRad) {
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded-xl border border-[#E5E2DC]">
                      <div className="mt-0.5"><Zap size={14} className="text-amber-500" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#2C3E2D]">{rad.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{rad.status.replace("_", " ")}</span>
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(rad.startDate)} → {formatDate(rad.endDate)} · {rad.completedSessions}/{rad.totalSessions} sessions</div>
                        {rad.notes && <p className="text-xs text-[#9CA3AF] mt-0.5">{rad.notes}</p>}
                      </div>
                    </div>
                  );
                }

                if (isSurg) {
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 bg-[#F5F2EE] rounded-xl border border-[#E5E2DC]">
                      <div className="mt-0.5"><Scissors size={14} className="text-blue-500" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[#2C3E2D]">{surg.title}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{surg.status}</span>
                        </div>
                        <div className="text-xs text-[#9CA3AF] mt-0.5">Planned: {formatDate(surg.plannedDate)}</div>
                        {surg.notes && <p className="text-xs text-[#9CA3AF] mt-0.5">{surg.notes}</p>}
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </SectionCard>
        )}

        <SectionCard
          title="Lab Results — Lab Staff Entry"
          source="Lab results entered by Lab Staff"
        >
          <p className="text-xs text-[#9CA3AF] mb-4">Lab results are entered by Lab Staff and displayed here for oncologist review. No editing is available in this view.</p>

          {labs.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">
              <FlaskConical size={24} className="mx-auto mb-2 opacity-40" />
              No lab results have been entered yet.
            </div>
          ) : (
            <>
              {chartData.length > 1 && <LabTrendChart data={chartData} />}

              <div className="space-y-3">
                {labs.map((lab) => (
                  <div key={lab.id} className="border border-[#E5E2DC] rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-sm font-semibold text-[#2C3E2D]">{formatDate(lab.date)}</span>
                        {lab.linkedCycleId && (
                          <span className="ml-2 text-xs text-[#7CAE8E] bg-[#F0F7F3] px-2 py-0.5 rounded-full">Linked to cycle</span>
                        )}
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        Entered by {lab.enteredBy} · {formatDate(lab.enteredAt)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {(["wbc","neutrophils","hemoglobin","platelets","alt","creatinine"] as LabFieldKey[]).map((field) => (
                        <div key={field} className="flex items-center gap-2">
                          <span className="text-[#9CA3AF] w-20 capitalize shrink-0">{field}</span>
                          <LabCell field={field} value={lab[field]} />
                        </div>
                      ))}
                    </div>
                    {lab.notes && <p className="text-xs text-[#9CA3AF] mt-2">{lab.notes}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Messages & Documents">
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-4">No messages yet.</p>
            ) : (
              messages.map((msg) => {
                const isOnco = msg.senderRole === "oncologist";
                return (
                  <div key={msg.id} className={`flex ${isOnco ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isOnco ? "bg-[#7CAE8E] text-white" : "bg-[#F5F2EE] text-[#2C3E2D] border border-[#E5E2DC]"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${isOnco ? "text-white/80" : "text-[#6B7280]"}`}>{msg.sender}</span>
                        <span className={`text-xs ${isOnco ? "text-white/60" : "text-[#9CA3AF]"}`}>{new Date(msg.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {msg.attachments.map((att) => <AttachmentChip key={att.id} att={att} />)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border border-[#E5E2DC] rounded-xl overflow-hidden bg-white">
            <textarea
              className="w-full px-4 py-3 text-sm text-[#2C3E2D] resize-none focus:outline-none"
              rows={3}
              placeholder="Write a message to the patient…"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <div className="flex items-center justify-between px-4 py-2 bg-[#F5F2EE] border-t border-[#E5E2DC]">
              <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <Paperclip size={12} />
                <span>Attachments will be supported via file upload (PDF, DOCX, JPG, PNG)</span>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7CAE8E] text-white rounded-lg text-xs font-medium hover:bg-[#5A8A6A] disabled:opacity-50 transition-colors"
              >
                <Send size={11} /> Send
              </button>
            </div>
          </div>
        </SectionCard>

      </main>

      {modal === "profile" && <EditProfileModal profile={profile} onClose={() => setModal(null)} onSave={handleSaveProfile} />}
      {modal === "medications" && <EditMedicationsModal profile={profile} onClose={() => setModal(null)} onSave={handleSaveMedications} />}
      {modal === "protocol" && protocol && <EditProtocolModal protocol={protocol} onClose={() => setModal(null)} onSave={handleSaveProtocol} />}
      {modal === "dates" && protocol && <EditTreatmentDatesModal protocol={protocol} onClose={() => setModal(null)} onSave={handleSaveDates} />}
      {delayCycle && <DelayCycleModal cycle={delayCycle} onClose={() => setDelayCycle(null)} onConfirm={(reason, newStartDate, newEndDate) => handleDelay(delayCycle, reason, newStartDate, newEndDate)} />}
    </div>
  );
}
