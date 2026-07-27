import { useEffect, useState } from "react";
import type { ApiLabResult } from "../../../types/labs";
import type { TreatmentCycleRecord, MedicationDisplayRecord } from "../../../types/treatment";
import { formatDate } from "../../../utils/dateUtils";
import { PatientNavPage } from "../PatientPortalPage";
import { Calendar, Pill, MessageCircle, FlaskConical, Clock, CheckSquare, Square, Info } from "lucide-react";
import {
  categoryLabel,
  getChemoDisplayStatus,
  getEffectiveCycleDates,
  getRadiationDisplayStatus,
  getRoadmapItemTitle,
  getSurgeryDisplayStatus,
  getTodayWeekdayKey,
  toDateInputValue,
  todayIso,
} from "../../../utils/treatmentDisplay";

interface PatientDashboardProps {
  patientId: string;
  cycles: TreatmentCycleRecord[];
  medicationPlan: MedicationDisplayRecord[];
  latestLab?: ApiLabResult;
  unreadMessagesCount: number;
  onNavigate: (page: PatientNavPage) => void;
}

const MED_CHECK_STORAGE_PREFIX = "onco-log:med-check";

function getMedCheckStorageKey(patientId: string, dateIso: string) {
  return `${MED_CHECK_STORAGE_PREFIX}:${patientId}:${dateIso}`;
}

function loadMedCheckMap(patientId: string, dateIso: string): Record<string, boolean> {
  if (!patientId) return {};
  try {
    const raw = localStorage.getItem(getMedCheckStorageKey(patientId, dateIso));
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function saveMedCheckMap(patientId: string, dateIso: string, map: Record<string, boolean>) {
  if (!patientId) return;
  try {
    localStorage.setItem(getMedCheckStorageKey(patientId, dateIso), JSON.stringify(map));
  } catch {
    // localStorage unavailable (private browsing, quota) - checkbox just won't persist.
  }
}

/** Drops med-check entries from other days/patients so localStorage doesn't accumulate history. */
function clearStaleMedCheckKeys(patientId: string, dateIso: string) {
  if (!patientId) return;
  try {
    const keepKey = getMedCheckStorageKey(patientId, dateIso);
    const staleKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${MED_CHECK_STORAGE_PREFIX}:`) && key !== keepKey) {
        staleKeys.push(key);
      }
    }
    staleKeys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage unavailable - nothing to clean up.
  }
}

function MedCheckRow({
  med,
  patientId,
  dateIso,
}: {
  med: MedicationDisplayRecord;
  patientId: string;
  dateIso: string;
}) {
  const [done, setDone] = useState(() => loadMedCheckMap(patientId, dateIso)[med.id] ?? false);
  const catColor: Record<string, string> = {
    chemotherapy: "rgba(237,233,254,0.6)",
    supportive: "rgba(240,249,244,0.8)",
    chronic: "rgba(254,252,232,0.8)",
  };

  const toggleDone = () => {
    setDone((previous) => {
      const next = !previous;
      const map = loadMedCheckMap(patientId, dateIso);
      map[med.id] = next;
      saveMedCheckMap(patientId, dateIso, map);
      return next;
    });
  };

  return (
    <button
      onClick={toggleDone}
      className="flex items-center gap-3 p-3 rounded-2xl text-left w-full transition-all"
      style={{
        backgroundColor: done ? "#D1FAE5" : catColor[med.category] ?? "#F9FAFB",
        border: `1.5px solid ${done ? "#7CAE8E" : "#E5E7EB"}`,
      }}
    >
      {done ? (
        <CheckSquare className="w-4 h-4 shrink-0" style={{ color: "#7CAE8E" }} />
      ) : (
        <Square className="w-4 h-4 shrink-0" style={{ color: "#D1D5DB" }} />
      )}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm block truncate"
          style={{
            color: done ? "#166534" : "#374151",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {med.name} - {med.dose}
        </span>
        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          {[med.route, med.timing, categoryLabel[med.category]].filter(Boolean).join(" - ")}
        </span>
      </div>
    </button>
  );
}

export function PatientDashboard({
  patientId,
  cycles,
  medicationPlan,
  latestLab,
  unreadMessagesCount,
  onNavigate,
}: PatientDashboardProps) {
  const todayValue = todayIso();
  const todayWeekday = getTodayWeekdayKey();

  useEffect(() => {
    clearStaleMedCheckKeys(patientId, todayValue);
  }, [patientId, todayValue]);
  const today = new Date(todayValue);
  const todayLabel = today.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const chemoCycles = cycles.filter((cycle) => cycle.treatmentType === "chemotherapy");
  const radiationCycles = cycles.filter((cycle) => cycle.treatmentType === "radiation");
  const surgeryCycles = cycles.filter((cycle) => cycle.treatmentType === "surgery");

  const chemoReviewToday = chemoCycles.find((cycle) => {
    const { startDate } = getEffectiveCycleDates(cycle);
    return getChemoDisplayStatus(cycle) === "waiting_for_review" && startDate === todayValue;
  });

  const activeChemo = chemoCycles.find((cycle) => {
    const { startDate, endDate } = getEffectiveCycleDates(cycle);
    return getChemoDisplayStatus(cycle) === "active" && startDate <= todayValue && endDate >= todayValue;
  });

  const radiationToday = radiationCycles.find((cycle) => {
    const { startDate, endDate } = getEffectiveCycleDates(cycle);
    return (
      getRadiationDisplayStatus(cycle) === "active" &&
      startDate <= todayValue &&
      endDate >= todayValue &&
      (cycle.weekdays || []).includes(todayWeekday)
    );
  });

  const surgeryToday = surgeryCycles.find((cycle) => {
    const plannedDate = toDateInputValue(cycle.plannedDate || cycle.startDate);
    return plannedDate === todayValue && getSurgeryDisplayStatus(cycle) !== "completed";
  });

  const todayItem = chemoReviewToday || activeChemo || radiationToday || surgeryToday;
  const hasActiveChemoToday = Boolean(activeChemo);
  const todaysMeds = medicationPlan.filter((med) => {
    if (med.asNeeded) return false;
    if (!med.weekdays.includes(todayWeekday)) return false;
    if (med.category === "chemotherapy") return hasActiveChemoToday;
    return true;
  });

  const nextItem =
    !todayItem &&
    (chemoCycles.find((cycle) =>
      ["upcoming", "waiting_for_review", "active"].includes(getChemoDisplayStatus(cycle))
    ) ||
      radiationCycles.find((cycle) => getRadiationDisplayStatus(cycle) === "active") ||
      surgeryCycles.find((cycle) => getSurgeryDisplayStatus(cycle) === "upcoming"));

  const todayTitle = chemoReviewToday
    ? "Expected treatment start today"
    : activeChemo
    ? `Chemotherapy - ${getRoadmapItemTitle(activeChemo)}`
    : radiationToday
    ? "Radiation today"
    : surgeryToday
    ? `Surgery: ${getRoadmapItemTitle(surgeryToday)}`
    : "";

  const todayDescription = chemoReviewToday
    ? "Your chemotherapy cycle is waiting for oncologist review before it can begin."
    : activeChemo
    ? "You are currently in active chemotherapy treatment. Follow your care team's instructions for today's scheduled medications."
    : radiationToday
    ? "You have a radiation session scheduled today."
    : surgeryToday
    ? "You have a surgery checkpoint scheduled today."
    : "";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF] bg-[#F5F2EE] px-3 py-2 rounded-xl border border-[#E5E2DC]">
        <Info size={12} className="text-[#7CAE8E]" />
        Today's plan is based on your oncologist's treatment schedule.
      </div>

      <div>
        <h2 style={{ color: "#2D4739" }}>What Are We Doing Today?</h2>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
          Your daily summary for {todayLabel}
        </p>
      </div>

      <div
        className="rounded-3xl p-5 shadow-sm"
        style={{
          backgroundColor: todayItem ? "#D1FAE5" : "#DBEAFE",
          border: `2px solid ${todayItem ? "#7CAE8E" : "#93C5FD"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5" style={{ color: todayItem ? "#166634" : "#1E40AF" }} />
          <h2 style={{ color: todayItem ? "#166534" : "#1E40AF" }}>
            Today - {todayLabel}
          </h2>
        </div>

        {todayItem ? (
          <div>
            <div
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: "#A7F3D0", color: "#166534" }}
            >
              {todayTitle}
            </div>
            <p className="text-sm mb-3" style={{ color: "#166534" }}>
              {todayDescription}
            </p>
            {todaysMeds.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "#166534" }}>
                  Today's Medications
                </p>
                <div className="flex flex-col gap-2">
                  {todaysMeds.map((med) => (
                    <MedCheckRow key={med.id} med={med} patientId={patientId} dateIso={todayValue} />
                  ))}
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
              Rest Day - Recovery Period
            </div>
            <p className="text-sm mb-3" style={{ color: "#1E40AF" }}>
              No treatment scheduled today. Your next treatment is upcoming - check your Treatment Roadmap for details.
            </p>
            {todaysMeds.length > 0 && (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "#1E40AF" }}>
                  Daily Medications
                </p>
                <div className="flex flex-col gap-2">
                  {todaysMeds.map((med) => (
                    <MedCheckRow key={med.id} med={med} patientId={patientId} dateIso={todayValue} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm" style={{ color: "#1E40AF" }}>
              No treatment scheduled yet. Your oncologist will update your schedule.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("patient-cycles")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <Calendar className="w-5 h-5" style={{ color: "#7CAE8E" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>
              Treatment Roadmap
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              View your treatment plan
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate("patient-bloodwork")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <FlaskConical className="w-5 h-5" style={{ color: "#60A5FA" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>
              Blood Work
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {latestLab ? `Latest: ${formatDate(toDateInputValue(latestLab.testDate))}` : "No results yet"}
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate("patient-messages")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors relative"
        >
          <MessageCircle className="w-5 h-5" style={{ color: "#A78BFA" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>
              Messages
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {unreadMessagesCount > 0 ? `${unreadMessagesCount} unread` : "View messages"}
            </p>
          </div>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#7CAE8E]" />
          )}
        </button>

        <button
          onClick={() => onNavigate("patient-journal")}
          className="flex items-center gap-3 p-4 rounded-2xl text-left border border-[#E5E2DC] bg-white hover:bg-[#F5F2EE] transition-colors"
        >
          <Pill className="w-5 h-5" style={{ color: "#F59E0B" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#2C3E2D" }}>
              Symptom Journal
            </p>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              Log how you feel
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
