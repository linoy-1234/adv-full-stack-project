import { lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PatientProfile,
  TreatmentProtocol,
  LabResult,
} from "../../types/patientPortalTypes";
import { LoadingSpinner } from "../../components/shared/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";
import { getMyLabs } from "../../services/labService";
import { getPatientById } from "../../services/patientService";
import { getMyProtocol } from "../../services/treatmentService";
import { getMyUnreadCount } from "../../services/messageService";
import {
  adaptLabResult,
  adaptPatientProfile,
  adaptTreatmentProtocol,
  getUserPatientProfileId,
} from "../../utils/patientPortalAdapters";
import { getApiErrorMessage, getApiStatus } from "../../utils/apiError";
import type { TreatmentProtocolResponse } from "../../types/api";

const PatientLayout = lazy(() =>
  import("./PatientLayout").then((m) => ({ default: m.PatientLayout }))
);
const PatientDashboard = lazy(() =>
  import("./PatientDashboard").then((m) => ({ default: m.PatientDashboard }))
);
const TreatmentCycles = lazy(() =>
  import("./TreatmentCycles").then((m) => ({ default: m.TreatmentCycles }))
);
const BloodWork = lazy(() =>
  import("./BloodWork").then((m) => ({ default: m.BloodWork }))
);
const SymptomJournal = lazy(() =>
  import("./SymptomJournal").then((m) => ({ default: m.SymptomJournal }))
);
const PatientMessages = lazy(() =>
  import("./PatientMessages").then((m) => ({ default: m.PatientMessages }))
);
const PatientProfilePage = lazy(() =>
  import("./PatientProfile").then((m) => ({ default: m.PatientProfile }))
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

  const [patientPortalProfile, setPatientPortalProfile] =
    useState<PatientProfile | null>(null);
  const [patientPortalProtocol, setPatientPortalProtocol] = useState<
    TreatmentProtocol | undefined
  >(undefined);
  const [patientPortalLabs, setPatientPortalLabs] = useState<LabResult[]>([]);
  const [patientPortalLoading, setPatientPortalLoading] = useState(false);
  const [patientPortalError, setPatientPortalError] = useState("");
  const [patientUnreadCount, setPatientUnreadCount] = useState(0);

  useEffect(() => {
    if (!activeProfileId) {
      setPatientPortalProfile(null);
      setPatientPortalProtocol(undefined);
      setPatientPortalLabs([]);
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

        const apiLabs = labsResponse.labResults || [];
        const apiProtocol = protocolResponse.protocol || null;
        const adaptedLabs = apiLabs
          .map(adaptLabResult)
          .sort((a, b) => b.date.localeCompare(a.date));

        setPatientPortalLabs(adaptedLabs);
        setPatientPortalProtocol(
          apiProtocol
            ? adaptTreatmentProtocol(
                apiProtocol,
                protocolResponse.cycles || [],
                apiLabs
              )
            : undefined
        );
        setPatientPortalProfile(
          adaptPatientProfile(profileResponse.patient, apiProtocol)
        );
      } catch (error) {
        if (cancelled) return;
        setPatientPortalProfile(null);
        setPatientPortalProtocol(undefined);
        setPatientPortalLabs([]);
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

  if (patientPortalLoading || !patientPortalProfile) {
    return (
      <LoadingSpinner
        message={patientPortalError || "Loading patient portal..."}
      />
    );
  }

  const profile = patientPortalProfile;
  const protocol = patientPortalProtocol;
  const patientLabs = patientPortalLabs;

  const handlePatientNavigation = (navPage: PatientNavPage) => {
    navigate(PATIENT_PATHS[navPage]);
  };

  return (
    <PatientLayout
      patientName={profile.fullName}
      patientId={profile.id}
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
          profile={profile}
          protocol={protocol}
          latestLab={patientLabs[0]}
          unreadMessagesCount={patientUnreadCount}
          onNavigate={handlePatientNavigation}
        />
      )}
      {page === "patient-cycles" && (
        <TreatmentCycles profile={profile} protocol={protocol} />
      )}
      {page === "patient-bloodwork" && (
        <BloodWork profile={profile} labResults={patientLabs} />
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
