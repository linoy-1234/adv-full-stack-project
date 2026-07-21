import { useState, useEffect, useCallback, useRef, memo } from "react";
import {
  FileText,
  Upload,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  ChevronDown,
} from "lucide-react";
import {
  getPatientDocuments,
  uploadDocument,
  updateDocumentMetadata,
  deleteDocument,
} from "../../services/documentService";
import ErrorMessage from "../common/ErrorMessage";
import type { ClinicalDocumentRecord } from "../../types/api";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_BADGE_COLORS,
  type DocumentType,
} from "../../constants/documentTypes";

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

const inputCls =
  "w-full border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]";
const labelCls =
  "block text-xs font-semibold text-[#6B7280] mb-1 uppercase tracking-wide";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploaderName(
  uploadedBy: ClinicalDocumentRecord["uploadedBy"]
): string {
  if (typeof uploadedBy === "object" && uploadedBy.fullName)
    return uploadedBy.fullName;
  return "Oncologist";
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

interface UploadModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadModal({ patientId, onClose, onSuccess }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] =
    useState<DocumentType>("visit_summary");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!file) {
      setError("Please select a file.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("documentType", documentType);
      formData.append("description", description.trim());
      formData.append("file", file);

      await uploadDocument(patientId, formData);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      setError(msg || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Upload size={15} className="text-[#7CAE8E]" /> Upload Document
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={uploading}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {error && (
            <ErrorMessage message={error} />
          )}

          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visit Summary — June 2025"
              disabled={uploading}
            />
          </div>

          <div>
            <label className={labelCls}>Document Type *</label>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8`}
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as DocumentType)
                }
                disabled={uploading}
              >
                {DOCUMENT_TYPE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {DOCUMENT_TYPE_LABELS[v]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief notes about this document…"
              disabled={uploading}
            />
          </div>

          <div>
            <label className={labelCls}>File *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full border border-dashed border-[#C8D9CC] rounded-lg px-4 py-3 text-sm text-left hover:bg-[#F0FAF4] transition-colors"
            >
              {file ? (
                <span className="text-[#2C3E2D]">
                  {file.name}{" "}
                  <span className="text-[#9CA3AF]">
                    ({formatBytes(file.size)})
                  </span>
                </span>
              ) : (
                <span className="text-[#9CA3AF]">
                  Click to choose a file — PDF, DOC, DOCX, JPG, PNG (max 10 MB)
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={uploading || !title.trim() || !file}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  doc: ClinicalDocumentRecord;
  onClose: () => void;
  onSuccess: () => void;
}

function EditModal({ doc, onClose, onSuccess }: EditModalProps) {
  const [title, setTitle] = useState(doc.title);
  const [documentType, setDocumentType] = useState<DocumentType>(
    doc.documentType
  );
  const [description, setDescription] = useState(doc.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateDocumentMetadata(doc._id, {
        title: title.trim(),
        documentType,
        description: description.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message;
      setError(msg || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-[#FAF8F5] rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E2DC]">
          <h2 className="text-base font-semibold text-[#2C3E2D] flex items-center gap-2">
            <Pencil size={15} className="text-[#7CAE8E]" /> Edit Document
          </h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#6B7280]"
            disabled={saving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {error && (
            <ErrorMessage message={error} />
          )}

          <div>
            <label className={labelCls}>Title *</label>
            <input
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelCls}>Document Type *</label>
            <div className="relative">
              <select
                className={`${inputCls} appearance-none pr-8`}
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as DocumentType)
                }
                disabled={saving}
              >
                {DOCUMENT_TYPE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {DOCUMENT_TYPE_LABELS[v]}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description (optional)</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#E5E2DC]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#E5E2DC] text-sm text-[#6B7280] hover:bg-[#F5F2EE] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: ClinicalDocumentRecord;
  canManage: boolean;
  onEdit: (doc: ClinicalDocumentRecord) => void;
  onDelete: (doc: ClinicalDocumentRecord) => void;
}

const DocumentCard = memo(function DocumentCard({ doc, canManage, onEdit, onDelete }: DocumentCardProps) {
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

// ─── Main Panel ───────────────────────────────────────────────────────────────

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
