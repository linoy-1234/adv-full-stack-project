import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Download, Info } from "lucide-react";
import { Message, MessageAttachment, PatientProfile, seedOncologist } from "../../utils/mockData";

interface PatientMessagesProps {
  profile: PatientProfile;
  messages: Message[];
  onSend: (text: string) => void;
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function AttachmentChip({ att }: { att: MessageAttachment }) {
  const iconMap: Record<string, string> = { pdf: "📄", docx: "📝", jpg: "🖼️", png: "🖼️" };
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/30 rounded-lg text-xs mt-1">
      <span>{iconMap[att.fileType] || "📎"}</span>
      <span className="font-medium">{att.fileName}</span>
      <button className="opacity-70 hover:opacity-100"><Download size={11} /></button>
    </div>
  );
}

export function PatientMessages({ profile, messages, onSend }: PatientMessagesProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: "70vh" }}>
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Messages & Documents — direct communication with your oncologist's team.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>Messages & Documents</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          Conversation with {seedOncologist.fullName}
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white border border-[#E5E2DC] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-[#9CA3AF]">
              No messages yet. Send a message to your oncologist's team.
            </div>
          ) : (
            messages.map((msg) => {
              const isPatient = msg.senderRole === "patient";
              return (
                <div key={msg.id} className={`flex ${isPatient ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[80%] rounded-2xl px-4 py-3"
                    style={{
                      backgroundColor: isPatient ? "#7CAE8E" : "#F5F2EE",
                      color: isPatient ? "#ffffff" : "#2C3E2D",
                      border: isPatient ? "none" : "1px solid #E5E2DC",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold opacity-80">{msg.sender}</span>
                      <span className="text-xs opacity-60">{formatMsgTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {msg.attachments.map((att) => <AttachmentChip key={att.id} att={att} />)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#E5E2DC] p-3 bg-[#F5F2EE]">
          <div className="flex gap-2 items-end">
            <textarea
              className="flex-1 bg-white border border-[#E5E2DC] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#7CAE8E]"
              rows={2}
              placeholder="Type a message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKey}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="px-3 py-2 bg-[#7CAE8E] text-white rounded-xl hover:bg-[#5A8A6A] disabled:opacity-50 transition-colors flex items-center gap-1.5 text-sm"
            >
              <Send size={14} /> Send
            </button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
            <Paperclip size={10} /> File attachments are available from your oncologist (PDF, DOCX, images)
          </p>
        </div>
      </div>
    </div>
  );
}
