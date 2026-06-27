import { useState } from "react";
import {
  PatientProfile,
  TreatmentProtocol,
  LabResult,
  Message,
  ChemoCycle,
  RadiationCourse,
  SurgeryCheckpoint,
  Medication,
  formatDate,
} from "../../utils/mockData";
import { PatientNavPage } from "../../App";
import { Calendar, Pill, MessageCircle, FlaskConical, Clock, CheckSquare, Square, Info } from "lucide-react";
import { todayIso } from "../../utils/treatmentDisplay";

interface PatientDashboardProps {
  profile: PatientProfile;
  protocol?: TreatmentProtocol;
  latestLab?: LabResult;
  unreadMessages: Message[];
  onNavigate: (page: PatientNavPage) => void;
}

function MedCheckRow({ med }: { med: Medication }) {
  const [done, setDone] = useState(false);
  const catColor: Record<string, string> = {
    chemotherapy: "rgba(237,233,254,0.6)",
    supportive: "rgba(240,249,244,0.8)",
    chronic: "rgba(254,252,232,0.8)",
  };
  return (
    <button
      onClick={() => setDone((p) => !p)}
      className="flex items-center gap-3 p-3 rounded-2xl text-left w-full transition-all"
      style={{
        backgroundColor: done ? "#D1FAE5" : catColor[med.category] ?? "#F9FAFB",
        border: `1.5px solid ${done ? "#7CAE8E" : "#E5E7EB"}`,
      }}
    >
      {done
        ? <CheckSquare className="w-4 h-4 shrink-0" style={{ color: "#7CAE8E" }} />
        : <Square className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />}
      <div className="flex-1 min-w-0">
        <span className="text-sm block truncate" style={{ color: done ? "#166534" : "#374151", textDecoration: done ? "line-through" : "none" }}>
          {med.name} — {med.dose}
        </span>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>{med.route} · {med.timing}</span>
      </div>
    </button>
  );
}

export function PatientDashboard({ profile, protocol, latestLab, unreadMessages, onNavigate }: PatientDashboardProps) {
  const todayValue = todayIso();
  const today = new Date(todayValue);
  const todayLabel = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // Derive today's treatment item from protocol
  const todayItem = protocol?.items.find((item) => {
    if (item.type === "chemotherapy") {
      const c = item as ChemoCycle;
      const status = c.status as string;
      return c.startDate <= todayValue && c.endDate >= todayValue && ["approved", "active", "waiting_labs", "ready_for_review"].includes(status);
    }
    if (item.type === "radiation") {
      const r = item as RadiationCourse;
      return r.status === "in_progress" && r.startDate <= todayValue && r.endDate >= todayValue;
    }
    if (item.type === "surgery") {
      const s = item as SurgeryCheckpoint;
      return s.plannedDate === todayValue && s.status === "upcoming";
    }
    return false;
  });

  const nextItem = !todayItem && protocol?.items.find((item) => {
    if (item.type === "chemotherapy") {
      const status = (item as ChemoCycle).status as string;
      return ["upcoming", "waiting_labs", "ready_for_review", "approved", "active"].includes(status);
    }
    if (item.type === "radiation") return (item as RadiationCourse).status === "in_progress";
    if (item.type === "surgery") return (item as SurgeryCheckpoint).status === "upcoming";
    return false;
  });

  const supportiveMeds = profile.medications.filter((m) => m.category === "supportive" || m.category === "chronic");
  const allMeds = profile.medications;

  return (
    <div className="flex flex-col gap-5">
      {/* Source label */}
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Today's plan is based on your oncologist's treatment schedule.
      </div>

      {/* Page title */}
      <div>
        <h2 style={{ color: "#2D4739" }}>What Are We Doing Today?</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          Your daily summary for {todayLabel}
        </p>
      </div>

      {/* Today card */}
      <div
        className="rounded-3xl p-5 shadow-sm"
        style={{
          backgroundColor: todayItem ? "#D1FAE5" : "#DBEAFE",
          border: `2px solid ${todayItem ? "#7CAE8E" : "#93C5FD"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5" style={{ color: todayItem ? "#166634" : "#1E40AF" }} />
          <h2 style={{ color: todayItem ? "#166534" : "#1E40AF" }}>Today — {todayLabel}</h2>
        </div>

        {todayItem ? (
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: "#A7F3D0", color: "#166534" }}
            >
              🌿 {todayItem.type === "chemotherapy" ? `Chemotherapy — ${todayItem.title}` : todayItem.type === "radiation" ? "Radiation Session Today" : `Surgery: ${todayItem.title}`}
            </div>
            <p className="text-sm mb-3" style={{ color: "#166534" }}>
              {todayItem.type === "chemotherapy" && (todayItem as ChemoCycle).status === "waiting_labs"
                ? "Your care team is waiting for lab results before this treatment can be reviewed."
                : todayItem.type === "chemotherapy" && ((todayItem as ChemoCycle).status as string) === "ready_for_review"
                ? "Your lab results have been received and this treatment is ready for oncologist review."
                : "You have a scheduled treatment today. Please follow your oncologist's instructions and attend your clinic appointment."}
            </p>
            {allMeds.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "#166534" }}>Today's Medications</p>
                <div className="flex flex-col gap-2">
                  {allMeds.map((med) => <MedCheckRow key={med.id} med={med} />)}
                </div>
              </>
            )}
          </div>
        ) : nextItem ? (
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full mb-3"
              style={{ backgroundColor: "#BFDBFE", color: "#1E40AF" }}
            >
              🌙 Rest Day — Recovery Period
            </div>
            <p className="text-sm mb-3" style={{ color: "#1E40AF" }}>
              No treatment scheduled today. Your next treatment is upcoming — check your Treatment Roadmap for details.
            </p>
            {supportiveMeds.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "#1E40AF" }}>Daily Medications</p>
                <div className="flex flex-col gap-2">
                  {supportiveMeds.map((med) => <MedCheckRow key={med.id} med={med} />)}
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm" style={{ color: "#1E40AF" }}>No treatment scheduled yet. Your oncologist will update your schedule.</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("patient-cycles")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <Calendar className="w-5 h-5" style={{ color: "#7CAE8E" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>Treatment Roadmap</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>View your treatment plan</p>
          </div>
        </button>

        <button
          onClick={() => onNavigate("patient-bloodwork")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <FlaskConical className="w-5 h-5" style={{ color: "#60A5FA" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>Blood Work</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {latestLab ? `Latest: ${formatDate(latestLab.date)}` : "No results yet"}
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate("patient-messages")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors relative"
        >
          <MessageCircle className="w-5 h-5" style={{ color: "#A78BFA" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>Messages</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {unreadMessages.length > 0 ? `${unreadMessages.length} unread` : "View messages"}
            </p>
          </div>
          {unreadMessages.length > 0 && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#7CAE8E]" />
          )}
        </button>

        <button
          onClick={() => onNavigate("patient-journal")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <Pill className="w-5 h-5" style={{ color: "#F59E0B" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>Symptom Journal</p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>Log how you feel</p>
          </div>
        </button>
      </div>

    </div>
  );
}
