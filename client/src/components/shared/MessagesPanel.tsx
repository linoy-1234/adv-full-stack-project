import { useState, useRef, useEffect, useCallback } from "react";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getPatientMessages,
  sendMessage,
} from "../../services/messageService";
import type { MessageRecord } from "../../types/api";

interface MessagesPanelProps {
  patientId: string;
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

export function MessagesPanel({ patientId }: MessagesPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      await sendMessage(patientId, trimmed, []);
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

  const currentRole = user?.role ?? "patient";

  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F5F2EE]">
        <MessageSquare size={15} className="text-[#7CAE8E]" />
        <h3 className="text-sm font-semibold text-[#2C3E2D]">Messages</h3>
      </div>

      {/* Chat area */}
      <div className="flex flex-col" style={{ minHeight: 280 }}>
        <div
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{ maxHeight: 380 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-[#9CA3AF]">
              Loading messages…
            </div>
          ) : error ? (
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
              const isOwnMessage = msg.senderRole === currentRole;
              const senderName = getSenderName(msg.sender, msg.senderRole);

              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isOwnMessage ? "#7CAE8E" : "#F5F2EE",
                      color: isOwnMessage ? "#ffffff" : "#2C3E2D",
                      border: isOwnMessage ? "none" : "1px solid #E5E2DC",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold opacity-80">
                        {senderName}
                      </span>
                      <span className="text-xs opacity-60">
                        {formatMsgTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#E5E2DC] px-5 py-3 bg-[#F5F2EE]">
          {error && !loading && (
            <p className="text-xs text-red-500 mb-2">{error}</p>
          )}
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
        </div>
      </div>
    </div>
  );
}
