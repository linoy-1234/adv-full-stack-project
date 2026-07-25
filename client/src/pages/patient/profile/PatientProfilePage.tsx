import { Info, Pill, Stethoscope } from "lucide-react";

import type { PatientProfile as ApiPatientProfile } from "../../../types/patient";
import type { TreatmentProtocolRecord } from "../../../types/treatment";
import { formatDate } from "../../../utils/dateUtils";
import { getAllergyNames, getPersonName } from "../../../utils/personUtils";
import { getMedicationPlan } from "../../../utils/medicationPlan";
import { PatientMedicalProfileCard } from "../../../components/patient-profile/PatientMedicalProfileCard";
import { MedicationPlanCard } from "../../../components/patient-profile/MedicationPlanCard";
import { TreatmentProtocolCard } from "../../../components/patient-profile/TreatmentProtocolCard";

interface PatientProfileProps {
  profile: ApiPatientProfile;
  protocol: TreatmentProtocolRecord | null;
}

export function PatientProfile({ profile, protocol }: PatientProfileProps) {
  const allergies = getAllergyNames(profile.allergies);
  const medicationPlan = getMedicationPlan(protocol);

  const profileUpdatedAt = profile.updatedAt || profile.createdAt;
  const profileMeta = profileUpdatedAt
    ? `Last updated by ${getPersonName(profile.updatedBy, "your care team")} · ${formatDate(profileUpdatedAt)}`
    : undefined;

  const protocolUpdatedAt = protocol && (protocol.updatedAt || protocol.createdAt);
  const protocolMeta = protocol && protocolUpdatedAt
    ? `Last updated by ${getPersonName(protocol.updatedBy, "oncologist")} · ${formatDate(protocolUpdatedAt)}`
    : undefined;

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

      <PatientMedicalProfileCard
        profile={profile}
        allergies={allergies}
        meta={profileMeta}
        allergiesIcon
        emptyAllergiesLabel="No known drug allergies"
      />

      <MedicationPlanCard
        protocol={protocol}
        medicationPlan={medicationPlan}
        source="Medication list created by your oncologist"
        meta={protocolMeta}
        emptyContent={
          <div className="text-center py-6 text-sm text-[#9CA3AF]">
            <Pill size={22} className="mx-auto mb-2 opacity-40" />
            No medications on record.
          </div>
        }
      />

      <TreatmentProtocolCard
        protocol={protocol}
        meta={protocolMeta}
        noProtocolContent={
          <div className="text-center py-6 text-sm text-[#9CA3AF]">
            <Stethoscope size={22} className="mx-auto mb-2 opacity-40" />
            No treatment protocol has been assigned yet.
          </div>
        }
      />
    </div>
  );
}
