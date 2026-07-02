import { lazy, Suspense, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  PatientProfile,
  TreatmentProtocol,
  LabResult,
} from "./utils/mockData";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import Unauthorized from "./components/common/Unauthorized";
import { getMyLabs } from "./services/labService";
import { getPatientById } from "./services/patientService";
import { getMyProtocol } from "./services/treatmentService";
import { getMyUnreadCount } from "./services/messageService";
import {
  adaptLabResult,
  adaptPatientProfile,
  adaptTreatmentProtocol,
  getUserPatientProfileId,
} from "./utils/patientPortalAdapters";
import type { TreatmentProtocolResponse, UserRole } from "./types/api";

const LandingPage = lazy(() =>
  import("./pages/auth/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const PatientLayout = lazy(() =>
  import("./pages/patient/PatientLayout").then((m) => ({
    default: m.PatientLayout,
  }))
);
const PatientDashboard = lazy(() =>
  import("./pages/patient/PatientDashboard").then((m) => ({
    default: m.PatientDashboard,
  }))
);
const TreatmentCycles = lazy(() =>
  import("./pages/patient/TreatmentCycles").then((m) => ({
    default: m.TreatmentCycles,
  }))
);
const BloodWork = lazy(() =>
  import("./pages/patient/BloodWork").then((m) => ({ default: m.BloodWork }))
);
const SymptomJournal = lazy(() =>
  import("./pages/patient/SymptomJournal").then((m) => ({
    default: m.SymptomJournal,
  }))
);
const PatientMessages = lazy(() =>
  import("./pages/patient/PatientMessages").then((m) => ({
    default: m.PatientMessages,
  }))
);
const PatientProfilePage = lazy(() =>
  import("./components/PatientProfile").then((m) => ({
    default: m.PatientProfile,
  }))
);
const OncologistDashboard = lazy(() =>
  import("./pages/oncologist/OncologistDashboard").then((m) => ({
    default: m.OncologistDashboard,
  }))
);
const PatientDetail = lazy(() =>
  import("./pages/oncologist/PatientDetail").then((m) => ({
    default: m.PatientDetail,
  }))
);
const LabStaffDashboard = lazy(() =>
  import("./pages/labstaff/LabStaffDashboard").then((m) => ({
    default: m.LabStaffDashboard,
  }))
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound }))
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

function SuspenseFallback() {
  return <LoadingSpinner message="Loading..." />;
}

function getApiStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  return (error as { response?: { status?: number } }).response?.status;
}

function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
    };

    return axiosError.response?.data?.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getRoleDashboardPath(role: UserRole): string {
  if (role === "patient") return "/patient/dashboard";
  if (role === "oncologist") return "/oncologist/dashboard";
  if (role === "lab_staff") return "/lab-staff/dashboard";
  return "/";
}

interface PatientPortalPageProps {
  page: PatientNavPage;
  onLogout: () => void;
}

function PatientPortalPage({
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

function OncologistPatientDetail() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();

  if (!patientId) {
    return <NotFound onGoHome={() => navigate("/")} />;
  }

  return (
    <PatientDetail
      patientId={patientId}
      onBack={() => navigate("/oncologist/dashboard")}
      onHome={() => navigate("/oncologist/dashboard")}
    />
  );
}

export default function App() {
  const {
    login: loginUser,
    register: registerUser,
    logout: authLogout,
  } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    authLogout();
    navigate("/", { replace: true });
  };

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              onGoToLogin={() => navigate("/login")}
              onGoToRegister={() => navigate("/register")}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={async (email, password) => {
                try {
                  const data = await loginUser(email, password);
                  const loggedInUser = data.user;

                  if (loggedInUser.role === "patient") {
                    const patientProfileId =
                      getUserPatientProfileId(loggedInUser);

                    if (!patientProfileId) {
                      return "Login succeeded, but this patient account is not linked to a patient profile yet.";
                    }
                  }

                  navigate(getRoleDashboardPath(loggedInUser.role), {
                    replace: true,
                  });

                  return null;
                } catch (error) {
                  if (getApiStatus(error) === 401) {
                    return "Invalid email or password";
                  }

                  return getApiErrorMessage(error, "Invalid email or password");
                }
              }}
              onGoToRegister={() => navigate("/register")}
              onBackToHome={() => navigate("/")}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              onRegister={async (email, password, confirmPassword) => {
                try {
                  const normalizedEmail = email.trim().toLowerCase();
                  const fullName =
                    normalizedEmail
                      .split("@")[0]
                      .replace(/[._-]+/g, " ")
                      .trim() ||
                    "Patient";

                  const data = await registerUser(
                    fullName,
                    normalizedEmail,
                    password,
                    confirmPassword
                  );

                  const registeredUser = data.user;

                  if (registeredUser.role !== "patient") {
                    return "Only patient accounts can register from this page.";
                  }

                  const patientProfileId =
                    getUserPatientProfileId(registeredUser);

                  if (!patientProfileId) {
                    return "Registration succeeded, but this patient account is not linked to a patient profile yet.";
                  }

                  navigate("/patient/dashboard", { replace: true });

                  return null;
                } catch (error) {
                  return getApiErrorMessage(error, "Registration failed.");
                }
              }}
              onBack={() => navigate("/login")}
              onBackToHome={() => navigate("/")}
            />
          }
        />

        <Route path="/patient" element={<Navigate to="/patient/dashboard" replace />} />
        <Route
          path="/patient/dashboard"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-dashboard"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/treatment-cycles"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-cycles"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/blood-work"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-bloodwork"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/symptom-journal"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-journal"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/messages"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-messages"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <PrivateRoute allowedRoles={["patient"]}>
              <PatientPortalPage
                page="patient-profile"
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />

        <Route path="/oncologist" element={<Navigate to="/oncologist/dashboard" replace />} />
        <Route
          path="/oncologist/dashboard"
          element={
            <PrivateRoute allowedRoles={["oncologist"]}>
              <OncologistDashboard
                onSelectPatient={(id) => navigate(`/oncologist/patients/${id}`)}
                onLogout={logout}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/oncologist/patients/:patientId"
          element={
            <PrivateRoute allowedRoles={["oncologist"]}>
              <OncologistPatientDetail />
            </PrivateRoute>
          }
        />

        <Route path="/lab-staff" element={<Navigate to="/lab-staff/dashboard" replace />} />
        <Route
          path="/lab-staff/dashboard"
          element={
            <PrivateRoute allowedRoles={["lab_staff"]}>
              <LabStaffDashboard onLogout={logout} />
            </PrivateRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound onGoHome={() => navigate("/")} />} />
      </Routes>
    </Suspense>
  );
}
