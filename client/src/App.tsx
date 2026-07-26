import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import Unauthorized from "./components/common/Unauthorized";
import { getUserPatientProfileId } from "./utils/userUtils";
import { getApiErrorMessage, getApiStatus } from "./utils/apiError";
import { useAppDispatch } from "./store/hooks";
import { resetPatients } from "./store/slices/patientsSlice";
import type { UserRole } from "./types/auth";

const LandingPage = lazy(() =>
  import("./pages/auth/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import("./pages/auth/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import("./pages/auth/RegisterPage").then((m) => ({ default: m.RegisterPage }))
);
const PatientPortalPage = lazy(() =>
  import("./pages/patient/PatientPortalPage").then((m) => ({
    default: m.PatientPortalPage,
  }))
);
const OncologistDashboard = lazy(() =>
  import("./pages/oncologist/dashboard/OncologistDashboard").then((m) => ({
    default: m.OncologistDashboard,
  }))
);
const PatientDetail = lazy(() =>
  import("./pages/oncologist/patient-detail/PatientDetailPage").then((m) => ({
    default: m.PatientDetail,
  }))
);
const LabStaffDashboard = lazy(() =>
  import("./pages/lab-staff/dashboard/LabStaffDashboard").then((m) => ({
    default: m.LabStaffDashboard,
  }))
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound }))
);

function SuspenseFallback() {
  return <LoadingSpinner message="Loading..." />;
}

function getRoleDashboardPath(role: UserRole): string {
  if (role === "patient") return "/patient/dashboard";
  if (role === "oncologist") return "/oncologist/dashboard";
  if (role === "lab_staff") return "/lab-staff/dashboard";
  return "/";
}

function OncologistPatientDetail() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();

  if (!patientId) {
    return <NotFound onGoHome={() => navigate("/oncologist/dashboard")} />;
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
    user,
    login: loginUser,
    loginWithGoogle,
    register: registerUser,
    logout: authLogout,
  } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const logout = () => {
    authLogout();
    dispatch(resetPatients());
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
              onGoogleLogin={async (credential) => {
                try {
                  const data = await loginWithGoogle(credential);
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
                  return getApiErrorMessage(error, "Google sign-in failed.");
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

        <Route
          path="/unauthorized"
          element={
            <Unauthorized
              onGoToDashboard={() =>
                navigate(user ? getRoleDashboardPath(user.role) : "/")
              }
            />
          }
        />
        <Route
          path="*"
          element={
            <NotFound
              onGoHome={() =>
                navigate(user ? getRoleDashboardPath(user.role) : "/")
              }
            />
          }
        />
      </Routes>
    </Suspense>
  );
}
