import { lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { RibbonBackground } from "../../components/common/RibbonBackground";
import ErrorMessage from "../../components/common/ErrorMessage";
import { useAuth } from "../../context/AuthContext";
import { getMyLabs } from "../../services/labService";
import { getPatientById } from "../../services/patientService";
import { getMyProtocol } from "../../services/treatmentService";
import { getMyUnreadCount } from "../../services/messageService";
import { getUserPatientProfileId } from "../../utils/userUtils";
import { getMedicationPlan } from "../../utils/medicationPlan";
import { getApiErrorMessage, getApiStatus } from "../../utils/apiError";
import type {
  TreatmentCycleRecord,
  TreatmentProtocolRecord,
  TreatmentProtocolResponse,
} from "../../types/treatment";
import type { PatientProfile as ApiPatientProfile } from "../../types/patient";
import type { ApiLabResult } from "../../types/labs";

const PatientLayout = lazy(() =>
  import("./PatientLayout").then((m) => ({ default: m.PatientLayout }))
);
const PatientDashboard = lazy(() =>
  import("./home/PatientHomePage").then((m) => ({ default: m.PatientDashboard }))
);
const TreatmentCycles = lazy(() =>
  import("./treatment-roadmap/PatientTreatmentRoadmapPage").then((m) => ({ default: m.TreatmentCycles }))
);
const BloodWork = lazy(() =>
  import("./blood-work/PatientBloodWorkPage").then((m) => ({ default: m.BloodWork }))
);
const SymptomJournal = lazy(() =>
  import("./symptoms/PatientSymptomJournalPage").then((m) => ({ default: m.SymptomJournal }))
);
const PatientMessages = lazy(() =>
  import("./messages/PatientMessagesPage").then((m) => ({ default: m.PatientMessages }))
);
const PatientProfilePage = lazy(() =>
  import("./profile/PatientProfilePage").then((m) => ({ default: m.PatientProfile }))
);

export type PatientNavPage =
  | "patient-dashboard"
  | "patient-cycles"
  | "patient-bloodwork"
  | "patient-journal"
  | "patient-messages"
  | "patient-profile";

const PATIENT_PATHS: Record<PatientNavPage, string> = {
  "patient-dashboard": "/patient/dashboard",
  "patient-cycles": "/patient/treatment-cycles",
  "patient-bloodwork": "/patient/blood-work",
  "patient-journal": "/patient/symptom-journal",
  "patient-messages": "/patient/messages",
  "patient-profile": "/patient/profile",
};

interface PatientPortalPageProps {
  page: PatientNavPage;
  onLogout: () => void;
}

export function PatientPortalPage({
  page,
  onLogout,
}: PatientPortalPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeProfileId =
    user?.role === "patient" ? getUserPatientProfileId(user) : null;

  const [profile, setProfile] = useState<ApiPatientProfile | null>(null);
  const [protocol, setProtocol] = useState<TreatmentProtocolRecord | null>(null);
  const [cycles, setCycles] = useState<TreatmentCycleRecord[]>([]);
  const [labs, setLabs] = useState<ApiLabResult[]>([]);
  const [patientPortalLoading, setPatientPortalLoading] = useState(false);
  const [patientPortalError, setPatientPortalError] = useState("");
  const [patientUnreadCount, setPatientUnreadCount] = useState(0);

  useEffect(() => {
    if (!activeProfileId) {
      setProfile(null);
      setProtocol(null);
      setCycles([]);
      setLabs([]);
      setPatientPortalError("");
      setPatientPortalLoading(false);
      setPatientUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadPatientPortalData = async () => {
      setPatientPortalLoading(true);
      setPatientPortalError("");

      try {
        const protocolRequest = getMyProtocol().catch((error: unknown) => {
          if (getApiStatus(error) === 404) {
            return { success: false } as TreatmentProtocolResponse;
          }

          throw error;
        });

        const [
          profileResponse,
          labsResponse,
          protocolResponse,
          unreadResponse,
        ] = await Promise.all([
          getPatientById(activeProfileId),
          getMyLabs(),
          protocolRequest,
          getMyUnreadCount().catch(() => ({ success: true, count: 0 })),
        ]);

        if (cancelled) return;

        setPatientUnreadCount(unreadResponse.count ?? 0);
        setProfile(profileResponse.patient);
        setProtocol(protocolResponse.protocol || null);
        setCycles(protocolResponse.cycles || []);
        setLabs(labsResponse.labResults || []);
      } catch (error) {
        if (cancelled) return;
        setProfile(null);
        setProtocol(null);
        setCycles([]);
        setLabs([]);
        setPatientPortalError(
          getApiErrorMessage(error, "Failed to load patient portal data.")
        );
      } finally {
        if (!cancelled) {
          setPatientPortalLoading(false);
        }
      }
    };

    void loadPatientPortalData();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId]);

  if (!activeProfileId) {
    return (
      <LoadingSpinner message="This patient account is not linked to a patient profile yet." />
    );
  }

  if (patientPortalLoading) {
    return <LoadingSpinner message="Loading patient portal..." />;
  }

  if (patientPortalError || !profile) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
        style={{ backgroundColor: "#FAF8F5", position: "relative" }}
      >
        <RibbonBackground />
        <div className="relative z-10 w-full max-w-md">
          <ErrorMessage
            message={patientPortalError || "Failed to load patient portal."}
          />
        </div>
      </div>
    );
  }

  const medicationPlan = getMedicationPlan(protocol);
  const latestLab = [...labs].sort((a, b) => (b.testDate ?? "").localeCompare(a.testDate ?? ""))[0];

  const handlePatientNavigation = (navPage: PatientNavPage) => {
    navigate(PATIENT_PATHS[navPage]);
  };

  return (
    <PatientLayout
      patientName={profile.fullName}
      patientId={profile._id}
      currentPage={page}
      onNavigate={handlePatientNavigation}
      onLogout={onLogout}
      onBack={
        page !== "patient-dashboard"
          ? () => navigate(PATIENT_PATHS["patient-dashboard"])
          : undefined
      }
      unreadMessages={patientUnreadCount}
    >
      {page === "patient-dashboard" && (
        <PatientDashboard
          patientId={activeProfileId ?? ""}
          cycles={cycles}
          medicationPlan={medicationPlan}
          latestLab={latestLab}
          unreadMessagesCount={patientUnreadCount}
          onNavigate={handlePatientNavigation}
        />
      )}
      {page === "patient-cycles" && (
        <TreatmentCycles profile={profile} protocol={protocol} cycles={cycles} />
      )}
      {page === "patient-bloodwork" && (
        <BloodWork profile={profile} labResults={labs} />
      )}
      {page === "patient-journal" && <SymptomJournal />}
      {page === "patient-messages" && (
        <PatientMessages
          patientId={activeProfileId}
          onUnreadCountChange={setPatientUnreadCount}
        />
      )}
      {page === "patient-profile" && (
        <PatientProfilePage profile={profile} protocol={protocol} />
      )}
    </PatientLayout>
  );
}
