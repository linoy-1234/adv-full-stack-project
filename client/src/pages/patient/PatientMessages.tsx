import { useState, useRef, useEffect } from 'react';
import { Send, Phone } from 'lucide-react';
import { Patient, ClinicalMessage, PhysicianNote } from '../../components/mockData';

interface PatientMessagesProps {
  patient: Patient;
  messages: ClinicalMessage[];
  physicianNotes: PhysicianNote[];
  onSend: (text: string) => void;
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function PatientMessages({ patient, messages, physicianNotes, onSend }: PatientMessagesProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const myMessages = messages.filter((m) => m.patientId === patient.id);
  const myNotes = physicianNotes.filter((n) => n.patientId === patient.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [myMessages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 style={{ color: '#2D4739' }}>Questions for My Oncologist</h2>
        <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
          Send questions to Dr. Miriam Goldstein. Replies typically arrive within 24 hours.
        </p>
      </div>

      {/* Emergency disclaimer — always pinned */}
      <div
        className="rounded-3xl p-4"
        style={{ backgroundColor: '#FEF2F2', border: '2px solid #FCA5A5' }}
      >
        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <div>
            <p className="text-sm" style={{ color: '#991B1B' }}>
              <strong>Medical Emergency? Do not use this chat.</strong>
            </p>
            <p className="text-xs mt-1" style={{ color: '#B91C1C' }}>
              For urgent symptoms (fever ≥38°C, chest pain, severe bleeding, difficulty breathing) — call emergency services immediately: <strong>101</strong> or the oncology 24-hour line: <strong>*2900</strong>.
            </p>
            <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>
              This channel is for non-urgent clinical questions only. Response time is not guaranteed.
            </p>
          </div>
        </div>
      </div>

      {/* Physician Direct Notes — pinned from oncologist */}
      {myNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 style={{ color: '#2D4739' }}>📋 Notes from Your Care Team</h3>
          {myNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl p-4"
              style={{ backgroundColor: '#EEF2FF', border: '1.5px solid #C7D2FE' }}
            >
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <span className="text-xs" style={{ color: '#4338CA' }}>
                  📌 {note.oncologistName}
                </span>
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{formatMsgTime(note.timestamp)}</span>
              </div>
              <p className="text-sm" style={{ color: '#374151' }}>{note.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Message thread */}
      <div
        className="rounded-3xl overflow-hidden shadow-sm"
        style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
      >
        <div
          className="px-5 py-3.5 flex items-center gap-2"
          style={{ backgroundColor: '#F9FAFB', borderBottom: '1.5px solid #E5E7EB' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#D1FAE5' }}>
            🩺
          </div>
          <div>
            <p className="text-sm" style={{ color: '#374151' }}>Dr. Miriam Goldstein</p>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>Oncologist · Oncology Dept.</p>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3 min-h-[200px]">
          {myMessages.length === 0 && (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-center" style={{ color: '#9CA3AF' }}>
                No messages yet. Start by sending a non-urgent question below.
              </p>
            </div>
          )}
          {myMessages.map((msg) => {
            const isPatient = msg.fromRole === 'patient';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: isPatient ? '#D1FAE5' : '#F3F4F6',
                    borderBottomRightRadius: isPatient ? '4px' : '16px',
                    borderBottomLeftRadius: isPatient ? '16px' : '4px',
                  }}
                >
                  <p className="text-sm" style={{ color: '#374151' }}>{msg.text}</p>
                </div>
                <p className="text-xs mt-1 px-1" style={{ color: '#9CA3AF' }}>
                  {isPatient ? 'You' : 'Dr. Goldstein'} · {formatMsgTime(msg.timestamp)}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Compose form */}
        <div
          className="p-4"
          style={{ borderTop: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB' }}
        >
          <div className="flex gap-3 items-end">
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your question here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              className="flex-1 rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                backgroundColor: '#FFFFFF',
                border: '1.5px solid #E5E7EB',
                fontFamily: 'Nunito, sans-serif',
                color: '#374151',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#7CAE8E')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="p-3 rounded-2xl text-white transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
              style={{ backgroundColor: '#7CAE8E' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
