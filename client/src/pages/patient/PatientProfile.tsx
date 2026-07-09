import { type ReactNode } from "react";
import {
  AlertTriangle,
  Info,
  Pill,
  Scissors,
  Stethoscope,
  Syringe,
  Zap,
} from "lucide-react";
import {
  PatientProfile as PatientProfileType,
  TreatmentProtocol,
} from "../../types/patientPortalTypes";
import { formatDate } from "../../utils/dateUtils";

interface PatientProfileProps {
  profile: PatientProfileType;
  protocol?: TreatmentProtocol;
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
  children,
}: {
  title: string;
  source?: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F2EE] space-y-1">
        <h3 className="text-sm font-semibold text-[#2C3E2D]">{title}</h3>
        {source && <SourceLabel text={source} />}
        {meta && <p className="text-xs text-[#9CA3AF]">{meta}</p>}
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

function TypeIcon({ type }: { type: string }) {
  if (type === "chemotherapy") return <Syringe size={14} className="text-[#7CAE8E]" />;
  if (type === "radiation") return <Zap size={14} className="text-amber-500" />;
  if (type === "surgery") return <Scissors size={14} className="text-blue-500" />;
  return <Pill size={14} className="text-gray-400" />;
}


const categoryColor: Record<string, string> = {
  chemotherapy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  supportive: "bg-blue-50 text-blue-700 border-blue-200",
  chronic: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const categoryLabel: Record<string, string> = {
  chemotherapy: "Chemotherapy",
  supportive: "Supportive",
  chronic: "Chronic / Background",
  other: "Other",
};

const weekdayLabel: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
};

const typeLabel: Record<string, string> = {
  chemotherapy: "Chemotherapy",
  radiation: "Radiation",
  surgery: "Surgery",
  supportive: "Supportive",
};

export function PatientProfile({ profile, protocol }: PatientProfileProps) {
  const hasAllergies = profile.allergies.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Source label banner */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Profile managed by your oncologist. All information here is entered and maintained by your care team.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>My Profile</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Read-only clinical record</p>
      </div>

      {/* Patient Medical Profile */}
      <SectionCard
        title="Patient Medical Profile"
        source="Created by oncologist"
        meta={
          profile.lastUpdatedAt
            ? `Last updated by ${profile.lastUpdatedBy} · ${formatDate(profile.lastUpdatedAt)}`
            : undefined
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
            value={profile.bloodType !== "unknown" ? profile.bloodType : "Unknown"}
          />
          <MetaRow label="Oncologist" value={profile.oncologistName || "Assigned oncologist"} />
          <div className="col-span-2">
            <MetaRow label="Diagnosis" value={profile.diagnosis} />
          </div>
          {hasAllergies ? (
            <div className="col-span-2 flex gap-2 items-center">
              <span className="text-xs text-[#9CA3AF] w-28 shrink-0 flex items-center gap-1">
                <AlertTriangle size={11} className="text-red-500" /> Allergies
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.allergies.map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs border border-red-200">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="col-span-2">
              <span className="text-xs text-[#9CA3AF]">No known drug allergies</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Medication Plan */}
      <SectionCard
        title="Medication Plan"
        source="Medication list created by your oncologist"
        meta={
          protocol?.lastUpdatedAt
            ? `Last updated by ${protocol.lastUpdatedBy} · ${formatDate(protocol.lastUpdatedAt)}`
            : undefined
        }
      >
        {profile.medications.length === 0 ? (
          <div className="text-center py-6 text-sm text-[#9CA3AF]">
            <Pill size={22} className="mx-auto mb-2 opacity-40" />
            No medications on record.
          </div>
        ) : (
          <div className="space-y-2">
            {(["chemotherapy", "supportive", "chronic", "other"] as const).map((category) => {
              const meds = profile.medications.filter((m) => m.category === category);
              if (!meds.length) return null;
              return (
                <div key={category}>
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5">
                    {categoryLabel[category]}
                  </p>
                  <div className="space-y-1.5">
                    {meds.map((med) => (
                      <div
                        key={med.id}
                        className={`flex items-start justify-between rounded-lg px-3 py-2 border text-sm ${categoryColor[category]}`}
                      >
                        <div>
                          <span className="font-medium">{med.name}</span>
                          {(med.dose || med.route) && (
                            <span className="text-xs ml-2 opacity-70">
                              {[med.dose, med.route].filter(Boolean).join(" - ")}
                            </span>
                          )}
                          {med.timing && (
                            <div className="text-xs opacity-70 mt-0.5">
                              {med.timing}
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-0.5">
                            {med.asNeeded
                              ? "As needed"
                              : med.weekdays?.length
                              ? med.weekdays.map((day) => weekdayLabel[day]).join(", ")
                              : "No weekdays selected"}
                          </div>
                          {med.notes && (
                            <div className="text-xs opacity-70">{med.notes}</div>
                          )}
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

      {/* Treatment Protocol */}
      {protocol && (
        <SectionCard
          title="Treatment Protocol"
          source="Treatment protocol managed by oncologist"
          meta={
            protocol.lastUpdatedAt
              ? `Last updated by ${protocol.lastUpdatedBy} · ${formatDate(protocol.lastUpdatedAt)}`
              : undefined
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
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC]"
                  >
                    <TypeIcon type={t} /> {typeLabel[t] ?? t}
                  </span>
                ))}
              </div>
            </div>

            {protocol.treatmentTypes.includes("chemotherapy") && protocol.numberOfChemoCycles ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Chemo Cycles"
                  value={`${protocol.numberOfChemoCycles} cycles planned`}
                />
              </div>
            ) : null}

            {protocol.treatmentTypes.includes("radiation") && protocol.numberOfRadiationSessions ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Radiation"
                  value={`${protocol.numberOfRadiationSessions} sessions planned`}
                />
              </div>
            ) : null}

            {protocol.treatmentTypes.includes("surgery") && protocol.numberOfSurgeryCheckpoints ? (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Surgery"
                  value={`${protocol.numberOfSurgeryCheckpoints} checkpoint(s) planned`}
                />
              </div>
            ) : null}

            <div>
              <span className="text-xs text-[#9CA3AF] block mb-1.5">Drugs</span>
              <div className="flex flex-wrap gap-1.5">
                {protocol.drugs.length > 0 ? (
                  protocol.drugs.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full"
                    >
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[#9CA3AF]">No drugs listed.</span>
                )}
              </div>
            </div>

            {protocol.notes && <MetaRow label="Notes" value={protocol.notes} />}
          </div>
        </SectionCard>
      )}

      {!protocol && (
        <SectionCard title="Treatment Protocol" source="Treatment protocol managed by oncologist">
          <div className="text-center py-6 text-sm text-[#9CA3AF]">
            <Stethoscope size={22} className="mx-auto mb-2 opacity-40" />
            No treatment protocol has been assigned yet.
          </div>
        </SectionCard>
      )}
    </div>
  );
}

