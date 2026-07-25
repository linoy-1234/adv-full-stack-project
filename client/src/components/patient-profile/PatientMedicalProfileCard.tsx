import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

import ErrorMessage from "../common/ErrorMessage";
import { formatDate } from "../../utils/dateUtils";
import type { PatientProfile as ApiPatientProfile } from "../../types/patient";
import { getOncologistName } from "../../utils/personUtils";
import { MetaRow } from "../common/MetaRow";
import { SectionCard } from "../common/SectionCard";

interface PatientMedicalProfileCardProps {
  profile: ApiPatientProfile | null;
  allergies: string[];
  meta?: string;
  loading?: boolean;
  patientsError?: string | null;
  onDismissError?: () => void;
  editButton?: ReactNode;
  // Only the patient portal renders an allergy icon + an explicit
  // "no known allergies" fallback; the oncologist card shows neither
  // (this mirrors the two views' current, already-live behavior exactly).
  allergiesIcon?: boolean;
  emptyAllergiesLabel?: string;
}

export function PatientMedicalProfileCard({
  profile,
  allergies,
  meta,
  loading = false,
  patientsError = null,
  onDismissError,
  editButton,
  allergiesIcon = false,
  emptyAllergiesLabel,
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
      meta={meta}
      editButton={editButton}
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
        {allergies.length > 0 ? (
          <div className="md:col-span-2 flex gap-2 items-center min-w-0">
            <span
              className={
                allergiesIcon
                  ? "text-xs text-[#9CA3AF] w-28 shrink-0 flex items-center gap-1"
                  : "text-xs text-[#9CA3AF] w-28 shrink-0"
              }
            >
              {allergiesIcon && <AlertTriangle size={11} className="text-red-500" />} Allergies
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
        ) : emptyAllergiesLabel ? (
          <div className="md:col-span-2">
            <span className="text-xs text-[#9CA3AF]">{emptyAllergiesLabel}</span>
          </div>
        ) : null}
        {profile.notes && (
          <div className="md:col-span-2">
            <MetaRow label="Notes" value={profile.notes} />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
