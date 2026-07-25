import { memo } from "react";
import { FileText, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { ClinicalDocumentRecord } from "../../../../types/api";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_BADGE_COLORS,
} from "../../../../constants/documentTypes";
import { formatDate } from "../../../../utils/dateUtils";
import { formatBytes, getUploaderName } from "../helpers";

interface DocumentCardProps {
  doc: ClinicalDocumentRecord;
  canManage: boolean;
  onEdit: (doc: ClinicalDocumentRecord) => void;
  onDelete: (doc: ClinicalDocumentRecord) => void;
}

export const DocumentCard = memo(function DocumentCard({
  doc,
  canManage,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const badgeCls = DOCUMENT_TYPE_BADGE_COLORS[doc.documentType];
  const label = DOCUMENT_TYPE_LABELS[doc.documentType];

  return (
    <div className="bg-[#F9F8F5] border border-[#E5E2DC] rounded-xl px-4 py-3 flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        <FileText size={18} className="text-[#7CAE8E]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-[#2C3E2D] leading-snug">
            {doc.title}
          </p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${badgeCls}`}
          >
            {label}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-[#9CA3AF]">
            {formatDate(doc.createdAt)}
          </span>
          <span className="text-xs text-[#9CA3AF]">
            by {getUploaderName(doc.uploadedBy)}
          </span>
          <span className="text-xs text-[#9CA3AF]">
            {formatBytes(doc.size)}
          </span>
        </div>

        {doc.description && (
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            {doc.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7CAE8E] text-white text-xs font-medium rounded-lg hover:bg-[#5A8A6A] transition-colors"
          >
            <ExternalLink size={11} /> View / Download
          </a>

          {canManage && (
            <>
              <button
                onClick={() => onEdit(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E2DC] text-xs text-[#6B7280] rounded-lg hover:bg-[#F5F2EE] transition-colors"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => onDelete(doc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-xs text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={11} /> Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
