import { Pencil, Stethoscope } from "lucide-react";

import type { TreatmentProtocolRecord } from "../../../../../types/api";
import {
  getProtocolDrugs,
  getProtocolMeta,
  getTreatmentCount,
  getTreatmentTypes,
  typeLabel,
} from "../../helpers";
import { MetaRow, PhasePlaceholder, SectionCard, TypeIcon } from "../shared/PatientDetailShared";

interface TreatmentProtocolCardProps {
  protocol: TreatmentProtocolRecord | null;
  treatmentLoading: boolean;
  savingTreatment: boolean;
  onEditClick: () => void;
}

export function TreatmentProtocolCard({
  protocol,
  treatmentLoading,
  savingTreatment,
  onEditClick,
}: TreatmentProtocolCardProps) {
  return (
    <SectionCard
      title="Treatment Protocol"
      source="Treatment protocol managed by oncologist"
      meta={protocol ? getProtocolMeta(protocol) : undefined}
      editButton={
        <button
          onClick={onEditClick}
          disabled={savingTreatment}
          className="flex items-center gap-1.5 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium border border-[#7CAE8E]/30 px-2.5 py-1 rounded-lg disabled:opacity-60"
        >
          <Pencil size={12} /> {protocol ? "Edit Protocol" : "Create Protocol"}
        </button>
      }
    >
      {treatmentLoading ? (
        <PhasePlaceholder icon={<Stethoscope size={16} />}>
          Loading treatment protocol...
        </PhasePlaceholder>
      ) : !protocol ? (
        <PhasePlaceholder icon={<Stethoscope size={16} />}>
          No treatment protocol has been created yet.
        </PhasePlaceholder>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <MetaRow label="Protocol" value={protocol.protocolName} />
            <MetaRow label="Diagnosis" value={protocol.diagnosis} />
          </div>
          <div>
            <span className="text-xs text-[#9CA3AF] block mb-1.5">
              Treatment Types
            </span>
            <div className="flex flex-wrap gap-1.5">
              {getTreatmentTypes(protocol).map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#F5F2EE] rounded-full text-xs font-medium text-[#374151] border border-[#E5E2DC]"
                >
                  <TypeIcon type={type} /> {typeLabel[type]}
                </span>
              ))}
            </div>
          </div>
          {getTreatmentTypes(protocol).includes("chemotherapy") &&
            getTreatmentCount(protocol, "chemotherapy") > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Chemotherapy Cycles"
                  value={`${getTreatmentCount(protocol, "chemotherapy")} cycles planned`}
                />
              </div>
            )}
          {getTreatmentTypes(protocol).includes("radiation") &&
            getTreatmentCount(protocol, "radiation") > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Radiation Sessions"
                  value={`${getTreatmentCount(protocol, "radiation")} sessions planned`}
                />
              </div>
            )}
          {getTreatmentTypes(protocol).includes("surgery") &&
            getTreatmentCount(protocol, "surgery") > 0 && (
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Surgery Checkpoints"
                  value={`${getTreatmentCount(protocol, "surgery")} checkpoint(s) planned`}
                />
              </div>
            )}
          <div>
            <span className="text-xs text-[#9CA3AF] block mb-1.5">Drugs</span>
            <div className="flex flex-wrap gap-1.5">
              {getProtocolDrugs(protocol).length > 0 ? (
                getProtocolDrugs(protocol).map((drug) => (
                  <span
                    key={drug}
                    className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full"
                  >
                    {drug}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9CA3AF]">No drugs listed.</span>
              )}
            </div>
          </div>
          {protocol.notes && <MetaRow label="Notes" value={protocol.notes} />}
        </div>
      )}
    </SectionCard>
  );
}

