import { MessagesPanel } from "../../components/shared/MessagesPanel";
import { ClinicalDocumentsPanel } from "../../components/shared/ClinicalDocumentsPanel";

interface PatientMessagesProps {
  patientId: string;
}

export function PatientMessages({ patientId }: PatientMessagesProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: "#2D4739" }}>
          Messages &amp; Documents
        </h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          Direct communication with your oncology team
        </p>
      </div>

      <MessagesPanel patientId={patientId} />

      <ClinicalDocumentsPanel patientId={patientId} canManage={false} />
    </div>
  );
}
