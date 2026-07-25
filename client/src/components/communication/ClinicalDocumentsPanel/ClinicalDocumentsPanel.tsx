import { useState, useEffect, useCallback } from "react";
import { FileText, Upload } from "lucide-react";
import {
  getPatientDocuments,
  deleteDocument,
} from "../../../services/documentService";
import ErrorMessage from "../../common/ErrorMessage";
import type { ClinicalDocumentRecord } from "../../../types/api";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "../../../constants/documentTypes";
import { DocumentCard } from "./components/DocumentCard";
import { UploadModal } from "./components/modals/UploadModal";
import { EditModal } from "./components/modals/EditModal";

interface ClinicalDocumentsPanelProps {
  patientId: string;
  canManage: boolean;
}

type FilterValue = "all" | DocumentType;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  ...DOCUMENT_TYPE_VALUES.map((v) => ({
    value: v as FilterValue,
    label: DOCUMENT_TYPE_LABELS[v],
  })),
];

export function ClinicalDocumentsPanel({
  patientId,
  canManage,
}: ClinicalDocumentsPanelProps) {
  const [documents, setDocuments] = useState<ClinicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] =
    useState<ClinicalDocumentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      const res = await getPatientDocuments(
        patientId,
        activeFilter === "all" ? undefined : activeFilter
      );
      setDocuments(res.documents);
      setError("");
    } catch {
      setError("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId, activeFilter]);

  useEffect(() => {
    setLoading(true);
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteConfirm = useCallback(
    async (doc: ClinicalDocumentRecord) => {
      setDeletingId(doc._id);
      setDeleteError("");
      try {
        await deleteDocument(doc._id);
        await loadDocuments();
      } catch {
        setDeleteError("Failed to delete document. Please try again.");
      } finally {
        setDeletingId(null);
      }
    },
    [loadDocuments]
  );

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F5F2EE]">
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-[#7CAE8E]" />
            <h3 className="text-sm font-semibold text-[#2C3E2D]">
              Clinical Documents
            </h3>
          </div>
          {canManage && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 text-xs text-white bg-[#7CAE8E] hover:bg-[#5A8A6A] font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Upload size={12} /> Upload Document
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b border-[#F5F2EE] flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors border"
              style={{
                backgroundColor:
                  activeFilter === f.value ? "#7CAE8E" : "#F5F2EE",
                color: activeFilter === f.value ? "#ffffff" : "#374151",
                borderColor:
                  activeFilter === f.value ? "#7CAE8E" : "#E5E2DC",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Document list */}
        <div className="px-5 py-4">
          {deleteError && (
            <ErrorMessage
              message={deleteError}
              onDismiss={() => setDeleteError("")}
              className="mb-3"
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-[#9CA3AF]">
              Loading documents…
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#9CA3AF]">
              <FileText size={26} className="opacity-30" />
              <p className="text-sm">
                {activeFilter === "all"
                  ? "No documents have been uploaded yet."
                  : `No ${DOCUMENT_TYPE_LABELS[activeFilter as DocumentType]} documents found.`}
              </p>
              {canManage && activeFilter === "all" && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="mt-1 text-xs text-[#7CAE8E] hover:text-[#5A8A6A] font-medium"
                >
                  Upload the first document
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  doc={doc}
                  canManage={canManage}
                  onEdit={setEditingDoc}
                  onDelete={handleDeleteConfirm}
                />
              ))}
              {deletingId && (
                <p className="text-xs text-center text-[#9CA3AF]">
                  Deleting…
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {showUpload && (
        <UploadModal
          patientId={patientId}
          onClose={() => setShowUpload(false)}
          onSuccess={loadDocuments}
        />
      )}

      {editingDoc && (
        <EditModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSuccess={loadDocuments}
        />
      )}
    </>
  );
}
