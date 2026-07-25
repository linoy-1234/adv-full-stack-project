import { useRef, useState } from "react";
import { Pencil, X, ChevronDown } from "lucide-react";
import { updateDocumentMetadata } from "../../../../../services/documentService";
import ErrorMessage from "../../../../common/ErrorMessage";
import FieldError, {
  invalidFieldClass,
} from "../../../../common/FieldError";
import { focusFirstField } from "../../../../../hooks/useErrorVisibility";
import type { ClinicalDocumentRecord } from "../../../../../types/api";
import {
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
} from "../../../../../constants/documentTypes";
import { getApiErrorMessage } from "../../../../../utils/apiError";
import { inputCls, labelCls } from "../../helpers";

interface EditModalProps {
  doc: ClinicalDocumentRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditModal({ doc, onClose, onSuccess }: EditModalProps) {
  const [title, setTitle] = useState(doc.title);
  const [documentType, setDocumentType] = useState<DocumentType>(
    doc.documentType
  );
  const [description, setDescription] = useState(doc.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    description?: string;
  }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    const nextErrors: typeof fieldErrors = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) nextErrors.title = "Title is required.";
    else if (trimmedTitle.length > 120)
      nextErrors.title = "Title cannot exceed 120 characters.";
    if (description.trim().length > 1000)
      nextErrors.description = "Description cannot exceed 1,000 characters.";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstField([
        nextErrors.title ? titleRef : { current: null },
        nextErrors.description ? descriptionRef : { current: null },
      ]);
      return;
    }

    setSaving(true);
    setError("");
    setFieldErrors({});

    try {
      await updateDocumentMetadata(doc._id, {
        title: title.trim(),
        documentType,
        description: description.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to save changes."));
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
              ref={titleRef}
              className={`${inputCls} ${fieldErrors.title ? invalidFieldClass : ""}`}
              value={title}
              onChange={(e) => {
                setFieldErrors((current) => ({ ...current, title: undefined }));
                setTitle(e.target.value);
              }}
              disabled={saving}
            />
            <FieldError message={fieldErrors.title} />
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
              ref={descriptionRef}
              className={`${inputCls} resize-none ${
                fieldErrors.description ? invalidFieldClass : ""
              }`}
              rows={2}
              value={description}
              onChange={(e) => {
                setFieldErrors((current) => ({
                  ...current,
                  description: undefined,
                }));
                setDescription(e.target.value);
              }}
              disabled={saving}
            />
            <FieldError message={fieldErrors.description} />
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
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#7CAE8E] text-white text-sm font-medium hover:bg-[#5A8A6A] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
