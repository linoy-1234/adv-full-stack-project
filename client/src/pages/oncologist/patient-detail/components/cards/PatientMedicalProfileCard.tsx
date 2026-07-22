import { Pencil } from "lucide-react";

import ErrorMessage from "../../../../../components/common/ErrorMessage";
import { formatDate } from "../../../../../utils/dateUtils";
import type { PatientProfile as ApiPatientProfile } from "../../../../../types/api";
import { getOncologistName, getPatientMeta } from "../../helpers";
import { MetaRow, SectionCard } from "../shared/PatientDetailShared";

interface PatientMedicalProfileCardProps {
  profile: ApiPatientProfile | null;
  loading: boolean;
  patientsError: string | null;
  allergies: string[];
  onDismissError: () => void;
  onEditClick: () => void;
}

export function PatientMedicalProfileCard({
  profile,
  loading,
  patientsError,
  allergies,
  onDismissError,
  onEditClick,
}: PatientMedicalProfileCardProps) {
  if (!profile) {
    return (
      <SectionCard title="Patient Medical Profile" source="Created by oncologist">
        {patientsError ? (
          <ErrorMessage
            message={patientsError}
            onDismiss={onDismissError}
            className="py-3"
          />
        ) : (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">
            {loading ? "Loading patient profile..." : "Loading patient profile..."}
          </div>
        )}
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Patient Medical Profile"
      source="Created by oncologist"
      meta={getPatientMeta(profile)}
      editButton={
        <button
          onClick={onEditClick}
          className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg"
        >
          <Pencil size={12} /> Edit Profile
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
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
        <div className="md:col-span-2">
          <MetaRow label="Diagnosis" value={profile.diagnosis} />
        </div>
        {allergies.length > 0 && (
          <div className="md:col-span-2 flex gap-2 items-center min-w-0">
            <span className="text-xs text-[#9CA3AF] w-28 shrink-0">
              Allergies
            </span>
            <div className="flex flex-wrap gap-1 min-w-0">
              {allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs border border-red-200 break-words max-w-full"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        )}
        {profile.notes && (
          <div className="md:col-span-2">
            <MetaRow label="Notes" value={profile.notes} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}

