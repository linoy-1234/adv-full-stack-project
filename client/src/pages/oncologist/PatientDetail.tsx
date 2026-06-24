import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  FlaskConical,
  Home,
  Info,
  MessageSquare,
  Pencil,
  Pill,
  Stethoscope,
  X,
} from "lucide-react";

import { RibbonBackground } from "../../components/shared/RibbonBackground";
import { formatDate } from "../../utils/mockData";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  clearPatientsError,
  editPatient,
  fetchPatientById,
} from "../../store/slices/patientsSlice";
import type {
  PatientAllergy,
  PatientProfile as ApiPatientProfile,
} from "../../types/api";
import type { PatientPayload } from "../../services/patientService";

interface PatientDetailProps {
  patientId: string;
  onBack: () => void;
  onHome: () => void;
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

const inputCls =
  "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
const labelCls =
  "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

const bloodTypes = ["unknown", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const toDateInputValue = (date?: string) => (date ? date.slice(0, 10) : "");

const getAllergyNames = (allergies?: PatientAllergy[]) =>
  (allergies ?? []).map((allergy) => allergy.name).filter(Boolean);

const normalizeBloodType = (value?: string) => {
  const normalized = (value || "unknown").trim();

  return bloodTypes.includes(normalized) ? normalized : "unknown";
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

export function PatientDetail({ patientId, onBack, onHome }: PatientDetailProps) {
  const dispatch = useAppDispatch();
  const {
    selectedPatient,
    loading,
    error: patientsError,
  } = useAppSelector((state) => state.patients);
  const [modal, setModal] = useState<"profile" | null>(null);

  useEffect(() => {
    dispatch(clearPatientsError());
    dispatch(fetchPatientById(patientId));
  }, [dispatch, patientId]);

  const profile =
    selectedPatient && selectedPatient._id === patientId ? selectedPatient : null;
  const allergies = getAllergyNames(profile?.allergies);

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
            >
              <PhasePlaceholder icon={<Pill size={16} />}>
                Medication details will be connected in the Treatment phase.
              </PhasePlaceholder>
            </SectionCard>

            <SectionCard
              title="Treatment Protocol"
              source="Treatment protocol managed by oncologist"
            >
              <PhasePlaceholder icon={<Stethoscope size={16} />}>
                Treatment details will be connected in the Treatment phase.
              </PhasePlaceholder>
            </SectionCard>

            <SectionCard
              title="Treatment Roadmap"
              source="Treatment schedule managed by oncologist"
            >
              <PhasePlaceholder icon={<Calendar size={16} />}>
                Treatment cycles will be connected in the Treatment phase.
              </PhasePlaceholder>
            </SectionCard>

            <SectionCard
              title="Lab Results - Lab Staff Entry"
              source="Lab results entered by Lab Staff"
            >
              <PhasePlaceholder icon={<FlaskConical size={16} />}>
                Lab results will be connected in the Labs phase.
              </PhasePlaceholder>
            </SectionCard>

            <SectionCard title="Messages & Documents">
              <PhasePlaceholder icon={<MessageSquare size={16} />}>
                Messages and documents will be connected in the Messages phase.
              </PhasePlaceholder>
            </SectionCard>

            <SectionCard title="Symptom Journal" source="Patient-reported">
              <PhasePlaceholder icon={<Activity size={16} />}>
                Symptom entries will be connected in the Symptoms phase.
              </PhasePlaceholder>
            </SectionCard>
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
    </div>
  );
}
