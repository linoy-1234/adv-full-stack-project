import { useState, useRef } from "react";
import { Upload, X, ChevronDown } from "lucide-react";
import { uploadDocument } from "../../../../../services/documentService";
import ErrorMessage from "../../../../common/ErrorMessage";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "../../../../../constants/documentTypes";
import { getApiErrorMessage } from "../../../../../utils/apiError";
import { formatBytes, inputCls, labelCls } from "../../helpers";

interface UploadModalProps {
  patientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ patientId, onClose, onSuccess }: UploadModalProps) {
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
      setError(getApiErrorMessage(err, "Upload failed. Please try again."));
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
