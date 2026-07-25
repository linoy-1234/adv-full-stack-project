import type { ReactNode } from "react";

import type { TreatmentProtocolRecord } from "../../types/treatment";
import {
  getProtocolDrugs,
  getTreatmentCount,
  getTreatmentTypes,
  typeLabel,
} from "../../utils/treatmentDisplay";
import { MetaRow } from "../common/MetaRow";
import { SectionCard } from "../common/SectionCard";
import { TypeIcon } from "../common/TypeIcon";

interface TreatmentProtocolCardProps {
  protocol: TreatmentProtocolRecord | null;
  meta?: string;
  treatmentLoading?: boolean;
  // Oncologist-only loading state; the patient portal has no separate
  // loading phase at this level and goes straight to noProtocolContent.
  loadingContent?: ReactNode;
  noProtocolContent: ReactNode;
  editButton?: ReactNode;
}

export function TreatmentProtocolCard({
  protocol,
  meta,
  treatmentLoading = false,
  loadingContent,
  noProtocolContent,
  editButton,
}: TreatmentProtocolCardProps) {
  return (
    <SectionCard
      title="Treatment Protocol"
      source="Treatment protocol managed by oncologist"
      meta={meta}
      editButton={editButton}
    >
      {treatmentLoading && loadingContent ? (
        loadingContent
      ) : !protocol ? (
        noProtocolContent
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Chemotherapy Cycles"
                  value={`${getTreatmentCount(protocol, "chemotherapy")} cycles planned`}
                />
              </div>
            )}
          {getTreatmentTypes(protocol).includes("radiation") &&
            getTreatmentCount(protocol, "radiation") > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <MetaRow
                  label="Radiation Sessions"
                  value={`${getTreatmentCount(protocol, "radiation")} sessions planned`}
                />
              </div>
            )}
          {getTreatmentTypes(protocol).includes("surgery") &&
            getTreatmentCount(protocol, "surgery") > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
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
                    className="px-2.5 py-0.5 bg-[#F5F2EE] border border-[#E5E2DC] text-xs text-[#374151] rounded-full break-words max-w-full"
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
