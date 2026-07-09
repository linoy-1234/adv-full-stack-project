import { useState } from "react";
import { Plus, X, Pill } from "lucide-react";
import type { PatientPayload } from "../../../services/patientService";
import type {
  Medication,
  TreatmentItemType,
  MedicationCategory,
  MedicationRoute,
} from "../../../types/patientPortalTypes";
interface AddPatientModalProps {
  onClose: () => void;
  onSave: (patientData: PatientPayload) => Promise<string | null>;
  oncologistName: string;
}

export function AddPatientModal({ onClose, onSave, oncologistName }: AddPatientModalProps) {
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
    setMedForm({ name: "", dose: "", route: "IV", timing: "", category: "chemotherapy", notes: "" });
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
                  <label className={labelCls}>Timing</label>
                  <input className={inputCls} placeholder="e.g. morning and evening" value={medForm.timing} onChange={(e) => setMedForm((p) => ({ ...p, timing: e.target.value }))} />
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
            Assigned oncologist: <strong>{oncologistName}</strong>
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


