import { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Send,
  MessageSquare,
  Check,
  CheckCheck,
  Pencil,
  Trash2,
  X,
  BookOpenCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getPatientMessages,
  sendMessage,
  markAllRead,
  editMessage,
  deleteMessage,
} from "../../services/messageService";
import type { MessageRecord } from "../../types/api";

interface MessagesPanelProps {
  patientId: string;
  onUnreadCountChange?: (count: number) => void;
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}

function getSenderName(
  sender: MessageRecord["sender"],
  senderRole: string
): string {
  if (typeof sender === "object" && sender.fullName) return sender.fullName;
  return senderRole === "oncologist" ? "Oncologist" : "Patient";
}

// ─── Read-receipt check marks ─────────────────────────────────────────────────

function ReadReceipt({ read }: { read: boolean }) {
  return read ? (
    <span
      title="Read"
      className="inline-flex items-center gap-0.5 text-[10px] select-none"
      style={{ color: "rgba(255,255,255,0.75)" }}
    >
      <CheckCheck size={12} />
      <span className="sr-only">Read</span>
    </span>
  ) : (
    <span
      title="Sent"
      className="inline-flex items-center gap-0.5 text-[10px] select-none"
      style={{ color: "rgba(255,255,255,0.45)" }}
    >
      <Check size={12} />
      <span className="sr-only">Sent</span>
    </span>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────

interface MessageBubbleProps {
  msg: MessageRecord;
  isOwn: boolean;
  isReadByOther: boolean;
  canEditDelete: boolean;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  editDraft: string;
  onEditStart: (id: string, text: string) => void;
  onEditDraftChange: (v: string) => void;
  onEditSave: (id: string, draft: string) => void;
  onEditCancel: () => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  isReadByOther,
  canEditDelete,
  isEditing,
  isConfirmingDelete,
  editDraft,
  onEditStart,
  onEditDraftChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: MessageBubbleProps) {
  const senderName = getSenderName(msg.sender, msg.senderRole);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isOwn ? "#7CAE8E" : "#F5F2EE",
          color: isOwn ? "#ffffff" : "#2C3E2D",
          border: isOwn ? "none" : "1px solid #E5E2DC",
          minWidth: 120,
        }}
      >
        {/* Sender + timestamp */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold opacity-80">{senderName}</span>
          <span className="text-xs opacity-60">{formatMsgTime(msg.createdAt)}</span>
        </div>

        {/* Body: edit mode vs. normal text */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              className="w-full rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.3)",
                minHeight: 60,
              }}
              value={editDraft}
              onChange={(e) => onEditDraftChange(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => onEditSave(msg._id, editDraft)}
                disabled={!editDraft.trim()}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }}
              >
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="px-3 py-1 rounded-lg text-xs transition-colors"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{msg.text}</p>
        )}

        {/* Bottom row: read receipt + actions */}
        {isOwn && !isEditing && (
          <div className="flex items-center justify-end gap-2 mt-1.5">
            {/* Edit / Delete controls — only while other side hasn't read */}
            {canEditDelete && !isConfirmingDelete && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditStart(msg._id, msg.text)}
                  title="Edit message"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Pencil size={11} style={{ color: "rgba(255,255,255,0.9)" }} />
                </button>
                <button
                  onClick={() => onDeleteRequest(msg._id)}
                  title="Delete message"
                  className="opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={11} style={{ color: "rgba(255,255,255,0.9)" }} />
                </button>
              </div>
            )}

            {/* Inline delete confirmation */}
            {isConfirmingDelete && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] opacity-80">Delete?</span>
                <button
                  onClick={() => onDeleteConfirm(msg._id)}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ backgroundColor: "rgba(239,68,68,0.8)", color: "#fff" }}
                >
                  Yes
                </button>
                <button
                  onClick={onDeleteCancel}
                  className="text-[10px] opacity-70 hover:opacity-100"
                >
                  <X size={10} style={{ color: "#fff" }} />
                </button>
              </div>
            )}

            {/* Read receipt */}
            <ReadReceipt read={isReadByOther} />
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Main panel ───────────────────────────────────────────────────────────────

export function MessagesPanel({
  patientId,
  onUnreadCountChange,
}: MessagesPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const currentRole = user?.role ?? "patient";

  const isUnreadIncoming = useCallback(
    (msg: MessageRecord): boolean => {
      if (currentRole === "patient")
        return msg.senderRole === "oncologist" && !msg.readByPatient;
      if (currentRole === "oncologist")
        return msg.senderRole === "patient" && !msg.readByOncologist;
      return false;
    },
    [currentRole]
  );

  const isReadByOther = useCallback(
    (msg: MessageRecord): boolean => {
      if (currentRole === "patient") return msg.readByOncologist;
      if (currentRole === "oncologist") return msg.readByPatient;
      return false;
    },
    [currentRole]
  );

  const isOwnMessage = (msg: MessageRecord) => msg.senderRole === currentRole;

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadMessages = useCallback(async () => {
    try {
      const res = await getPatientMessages(patientId);
      setMessages(res.messages);
      setError("");
    } catch {
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  // Notify parent of unread count whenever messages change
  useEffect(() => {
    if (!user) return;
    const count = messages.filter(isUnreadIncoming).length;
    onUnreadCountChange?.(count);
  }, [messages, user, isUnreadIncoming, onUnreadCountChange]);

  // Scroll only the chat container — never the whole page
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const unreadIncoming = messages.filter(isUnreadIncoming);
  const hasUnreadIncoming = unreadIncoming.length > 0;
  const otherRoleLabel = currentRole === "patient" ? "oncologist" : "patient";

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await markAllRead(patientId);
      await loadMessages();
    } catch {
      setError("Failed to mark messages as read. Please try again.");
    } finally {
      setMarkingRead(false);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await sendMessage(patientId, trimmed);
      setText("");
      await loadMessages();
    } catch {
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Stable per-row handlers (referenced by memoized MessageBubble instances) —
  // each takes the message id/draft as an argument rather than closing over
  // per-row state, so their identity stays constant across re-renders.
  const handleEditStart = useCallback((id: string, text: string) => {
    setConfirmDeleteId(null);
    setEditingId(id);
    setEditDraft(text);
  }, []);

  const handleEditDraftChange = useCallback((value: string) => {
    setEditDraft(value);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditDraft("");
  }, []);

  const handleEditSave = useCallback(
    async (messageId: string, draft: string) => {
      if (!draft.trim()) return;
      try {
        await editMessage(messageId, draft.trim());
        setEditingId(null);
        setEditDraft("");
        await loadMessages();
      } catch {
        setError("Failed to edit message. Please try again.");
      }
    },
    [loadMessages]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setEditingId(null);
    setConfirmDeleteId(id);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (messageId: string) => {
      try {
        await deleteMessage(messageId);
        setConfirmDeleteId(null);
        await loadMessages();
      } catch {
        setError("Failed to delete message. Please try again.");
        setConfirmDeleteId(null);
      }
    },
    [loadMessages]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F5F2EE]">
        <MessageSquare size={15} className="text-[#7CAE8E]" />
        <h3 className="text-sm font-semibold text-[#2C3E2D]">Messages</h3>
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto px-5 py-4 space-y-3"
        style={{ minHeight: 200, maxHeight: 380 }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-[#9CA3AF]">
            Loading messages…
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-red-500">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-[#9CA3AF]">
            <MessageSquare size={22} className="opacity-40" />
            <p className="text-sm">No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const own = isOwnMessage(msg);
            const readByOther = isReadByOther(msg);
            const canAct = own && !readByOther;

            return (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOwn={own}
                isReadByOther={readByOther}
                canEditDelete={canAct}
                isEditing={editingId === msg._id}
                isConfirmingDelete={confirmDeleteId === msg._id}
                editDraft={editDraft}
                onEditStart={handleEditStart}
                onEditDraftChange={handleEditDraftChange}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onDeleteRequest={handleDeleteRequest}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={handleDeleteCancel}
              />
            );
          })
        )}
      </div>

      {/* Input / mark-as-read area */}
      <div className="border-t border-[#E5E2DC] px-5 py-3 bg-[#F5F2EE]">
        {error && !loading && messages.length > 0 && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}

        {hasUnreadIncoming ? (
          /* ── Mark-as-read gate ─────────────────────────────────────────── */
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 text-xs text-[#6B7280]">
              <BookOpenCheck size={14} className="text-[#7CAE8E] shrink-0 mt-0.5" />
              <span>
                {unreadIncoming.length} unread{" "}
                {unreadIncoming.length === 1 ? "message" : "messages"} from
                your {otherRoleLabel}
              </span>
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="w-full py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#7CAE8E", color: "#ffffff" }}
            >
              {markingRead ? "Marking as read…" : "Mark as read to reply"}
            </button>
          </div>
        ) : (
          /* ── Normal reply input ────────────────────────────────────────── */
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 bg-white border border-[#E5E2DC] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]"
              rows={2}
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-3 py-2 bg-[#7CAE8E] text-white rounded-xl hover:bg-[#5A8A6A] disabled:opacity-50 transition-colors flex items-center gap-1.5 text-sm shrink-0"
            >
              <Send size={14} />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
