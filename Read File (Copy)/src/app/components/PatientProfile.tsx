import { AlertTriangle, CheckCircle, Droplets, Layers, User, Pill, Info, Stethoscope } from "lucide-react";
import {
  PatientProfile as PatientProfileType,
  TreatmentProtocol,
  seedOncologist,
  formatDate,
} from "./mockData";

interface PatientProfileProps {
  profile: PatientProfileType;
  protocol?: TreatmentProtocol;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
      <span className="text-xs shrink-0 w-28" style={{ color: "#9CA3AF" }}>{label}</span>
      <span className="text-sm" style={{ color: "#374151" }}>{value || "—"}</span>
    </div>
  );
}

function SourceLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-1.5 rounded-full border border-[#E5E2DC] inline-flex w-fit">
      <Info size={10} /> {text}
    </div>
  );
}

const BLOOD_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "A+":  { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  "A−":  { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  "B+":  { bg: "#FEF9C3", text: "#92400E", border: "#FCD34D" },
  "B−":  { bg: "#FEF9C3", text: "#92400E", border: "#FCD34D" },
  "AB+": { bg: "#EDE9FE", text: "#4C1D95", border: "#C4B5FD" },
  "AB−": { bg: "#EDE9FE", text: "#4C1D95", border: "#C4B5FD" },
  "O+":  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  "O−":  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
};

export function PatientProfile({ profile, protocol }: PatientProfileProps) {
  const hasAllergies = profile.allergies.length > 0;
  const btColor = BLOOD_TYPE_COLORS[profile.bloodType] ?? { bg: "#F3F4F6", text: "#374151", border: "#D1D5DB" };

  return (
    <div className="flex flex-col gap-5">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Profile managed by your oncologist. All information here is entered and maintained by your care team.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>My Profile</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Read-only clinical record</p>
      </div>

      {/* Identity */}
      <div className="rounded-2xl p-5 bg-white border border-[#E5E2DC]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#D1FAE5" }}>
            <User className="w-6 h-6" style={{ color: "#7CAE8E" }} />
          </div>
          <div>
            <h3 style={{ color: "#111827" }}>{profile.fullName}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>ID: {profile.nationalId}</p>
          </div>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          <Row label="Email" value={profile.email} />
          <Row label="Date of Birth" value={profile.dateOfBirth ? formatDate(profile.dateOfBirth) : "—"} />
          <Row label="Diagnosis" value={profile.diagnosis} />
          <Row label="Oncologist" value={seedOncologist.fullName} />
        </div>
        <div className="mt-3">
          <SourceLabel text="Created by oncologist" />
          <p className="text-xs text-[#9CA3AF] mt-1">Last updated by {profile.lastUpdatedBy} · {formatDate(profile.lastUpdatedAt)}</p>
        </div>
      </div>

      {/* Blood Type */}
      <div className="rounded-2xl p-5 bg-white border border-[#E5E2DC]">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5" style={{ color: "#7CAE8E" }} />
          <h3 style={{ color: "#2D4739" }}>Blood Type</h3>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: btColor.bg, border: `2px solid ${btColor.border}` }}
          >
            <span className="text-xl font-bold" style={{ color: btColor.text }}>{profile.bloodType}</span>
          </div>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            {profile.bloodType.endsWith("+") ? "Rh Positive" : "Rh Negative"} · Universal compatibility verified before transfusions.
          </p>
        </div>
      </div>

      {/* Allergies */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: hasAllergies ? "#FFF5F5" : "#F0FAF4", border: `2px solid ${hasAllergies ? "#FCA5A5" : "#A7F3D0"}` }}>
        <div className="flex items-center gap-2 mb-3">
          {hasAllergies ? <AlertTriangle className="w-5 h-5" style={{ color: "#DC2626" }} /> : <CheckCircle className="w-5 h-5" style={{ color: "#7CAE8E" }} />}
          <h3 style={{ color: hasAllergies ? "#991B1B" : "#166534" }}>
            {hasAllergies ? "Known Drug Allergies" : "No Known Drug Allergies"}
          </h3>
        </div>
        {hasAllergies ? (
          <div className="flex flex-col gap-2">
            {profile.allergies.map((allergy) => (
              <div key={allergy} className="flex items-center gap-3 rounded-xl px-4 py-2.5" style={{ backgroundColor: "#FFFFFF", border: "1.5px solid #FCA5A5" }}>
                <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
                <span className="text-sm" style={{ color: "#374151" }}>{allergy}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>AVOID</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#166534" }}>No drug allergies on record.</p>
        )}
      </div>

      {/* Medication Plan */}
      <div className="rounded-2xl p-5 bg-white border border-[#E5E2DC]">
        <div className="flex items-center gap-2 mb-1">
          <Pill className="w-5 h-5" style={{ color: "#7CAE8E" }} />
          <h3 style={{ color: "#2D4739" }}>Medication Plan</h3>
        </div>
        <div className="mb-3"><SourceLabel text="Medication list created by your oncologist" /></div>
        {profile.medications.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No medications on record.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {profile.medications.map((med) => {
              const catBg: Record<string, string> = { chemotherapy: "#F5F3FF", supportive: "#F0FAF4", chronic: "#FFFBEB" };
              const catBorder: Record<string, string> = { chemotherapy: "#C4B5FD", supportive: "#A7F3D0", chronic: "#FCD34D" };
              const catText: Record<string, string> = { chemotherapy: "#5B21B6", supportive: "#166534", chronic: "#92400E" };
              return (
                <div key={med.id} className="rounded-xl p-3" style={{ backgroundColor: catBg[med.category] ?? "#F9FAFB", border: `1.5px solid ${catBorder[med.category] ?? "#E5E7EB"}` }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#374151" }}>{med.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{med.dose} · {med.route} · {med.frequency}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{med.timing}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: "white", color: catText[med.category] ?? "#374151", border: `1px solid ${catBorder[med.category] ?? "#E5E7EB"}` }}>
                      {med.category}
                    </span>
                  </div>
                  {med.notes && <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{med.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Treatment Protocol Summary */}
      {protocol && (
        <div className="rounded-2xl p-5 bg-white border border-[#E5E2DC]">
          <div className="flex items-center gap-2 mb-1">
            <Stethoscope className="w-5 h-5" style={{ color: "#7CAE8E" }} />
            <h3 style={{ color: "#2D4739" }}>Treatment Protocol</h3>
          </div>
          <div className="mb-3"><SourceLabel text="Treatment protocol managed by oncologist" /></div>
          <div className="divide-y divide-[#F3F4F6]">
            <Row label="Protocol Name" value={protocol.protocolName} />
            <Row label="Diagnosis" value={protocol.diagnosis} />

            <div className="py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
              <span className="text-xs shrink-0 w-28 block mb-2" style={{ color: "#9CA3AF" }}>Treatment Types</span>
              <div className="flex flex-wrap gap-1.5">
                {protocol.treatmentTypes.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC] capitalize">
                    {t === "chemotherapy" && <Layers className="w-3 h-3 inline-block mr-1" />}
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {protocol.treatmentTypes.includes("chemotherapy") && protocol.numberOfChemoCycles && (
              <Row label="Chemotherapy Cycles" value={`${protocol.numberOfChemoCycles} cycles planned`} />
            )}
            {protocol.treatmentTypes.includes("radiation") && protocol.numberOfRadiationSessions && (
              <Row label="Radiation Sessions" value={`${protocol.numberOfRadiationSessions} sessions planned`} />
            )}
            {protocol.treatmentTypes.includes("surgery") && protocol.numberOfSurgeryCheckpoints && (
              <Row label="Surgery Checkpoints" value={`${protocol.numberOfSurgeryCheckpoints} checkpoint(s) planned`} />
            )}

            <div className="py-2.5 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
              <span className="text-xs shrink-0 w-28 block mb-2" style={{ color: "#9CA3AF" }}>Medications / Drugs</span>
              <div className="flex flex-wrap gap-1.5">
                {protocol.drugs.map((d) => (
                  <span key={d} className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full">{d}</span>
                ))}
              </div>
            </div>

            {protocol.notes && <Row label="Notes" value={protocol.notes} />}
          </div>
          <p className="text-xs text-[#9CA3AF] mt-3">Last updated by {protocol.lastUpdatedBy} · {formatDate(protocol.lastUpdatedAt)}</p>
        </div>
      )}
    </div>
  );
}
