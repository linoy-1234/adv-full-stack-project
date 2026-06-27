import { useEffect, useState, lazy, Suspense, useTransition } from "react";
import {
  seedPatientProfiles,
  seedMessages,
  seedSymptomEntries,
  PatientProfile,
  TreatmentProtocol,
  LabResult,
  Message,
  SymptomEntry,
  UserRole,
} from "./utils/mockData";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import { getMyLabs } from "./services/labService";
import { getPatientById } from "./services/patientService";
import { getMyProtocol } from "./services/treatmentService";
import {
  adaptLabResult,
  adaptPatientProfile,
  adaptTreatmentProtocol,
  getUserPatientProfileId,
} from "./pages/patient/patientPortalAdapters";
import type { TreatmentProtocolResponse } from "./types/api";

// ─── Lazy loads ───────────────────────────────────────────────────────────────

const LandingPage = lazy(() => import("./pages/auth/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage").then(m => ({ default: m.RegisterPage })));
const PatientLayout = lazy(() => import("./pages/patient/PatientLayout").then(m => ({ default: m.PatientLayout })));
const PatientDashboard = lazy(() => import("./pages/patient/PatientDashboard").then(m => ({ default: m.PatientDashboard })));
const TreatmentCycles = lazy(() => import("./pages/patient/TreatmentCycles").then(m => ({ default: m.TreatmentCycles })));
const BloodWork = lazy(() => import("./pages/patient/BloodWork").then(m => ({ default: m.BloodWork })));
const SymptomJournal = lazy(() => import("./pages/patient/SymptomJournal").then(m => ({ default: m.SymptomJournal })));
const PatientMessages = lazy(() => import("./pages/patient/PatientMessages").then(m => ({ default: m.PatientMessages })));
const PatientProfilePage = lazy(() => import("./components/PatientProfile").then(m => ({ default: m.PatientProfile })));
const OncologistDashboard = lazy(() => import("./pages/oncologist/OncologistDashboard").then(m => ({ default: m.OncologistDashboard })));
const PatientDetail = lazy(() => import("./pages/oncologist/PatientDetail").then(m => ({ default: m.PatientDetail })));
const LabStaffDashboard = lazy(() => import("./pages/labstaff/LabStaffDashboard").then(m => ({ default: m.LabStaffDashboard })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

// ─── Page type ────────────────────────────────────────────────────────────────

type Page =
  | "landing"
  | "login"
  | "register"
  | "patient-dashboard"
  | "patient-cycles"
  | "patient-bloodwork"
  | "patient-journal"
  | "patient-messages"
  | "patient-profile"
  | "oncologist-dashboard"
  | "oncologist-patient-detail"
  | "labstaff-dashboard"
  | "404";

export type PatientNavPage =
  | "patient-dashboard"
  | "patient-cycles"
  | "patient-bloodwork"
  | "patient-journal"
  | "patient-messages"
  | "patient-profile";

const PATIENT_PAGES: Page[] = [
  "patient-dashboard",
  "patient-cycles",
  "patient-bloodwork",
  "patient-journal",
  "patient-messages",
  "patient-profile",
];

function SuspenseFallback() {
  return <LoadingSpinner message="Loading..." />;
}
function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong."
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
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
// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const {
    login: loginUser,
    register: registerUser,
    logout: authLogout,
  } = useAuth();
  const [page, setPage] = useState<Page>("landing");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [isPending, startTransition] = useTransition();

  // Active user
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Mutable state (simulating backend collections)
  const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>(seedPatientProfiles);
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const [extraSymptomEntries, setExtraSymptomEntries] = useState<SymptomEntry[]>([]);
  const [patientPortalProfile, setPatientPortalProfile] = useState<PatientProfile | null>(null);
  const [patientPortalProtocol, setPatientPortalProtocol] = useState<TreatmentProtocol | undefined>(undefined);
  const [patientPortalLabs, setPatientPortalLabs] = useState<LabResult[]>([]);
  const [patientPortalLoading, setPatientPortalLoading] = useState(false);
  const [patientPortalError, setPatientPortalError] = useState("");

  const allMessages = [
    ...seedMessages,
    ...extraMessages.filter((m) => !seedMessages.find((sm) => sm.id === m.id)),
  ];
  const allSymptomEntries = [
    ...seedSymptomEntries,
    ...extraSymptomEntries.filter((e) => !seedSymptomEntries.find((se) => se.id === e.id)),
  ];

  useEffect(() => {
    if (role !== "patient" || !activeProfileId) {
      setPatientPortalProfile(null);
      setPatientPortalProtocol(undefined);
      setPatientPortalLabs([]);
      setPatientPortalError("");
      setPatientPortalLoading(false);
      return;
    }

    let cancelled = false;

    const loadPatientPortalData = async () => {
      setPatientPortalLoading(true);
      setPatientPortalError("");

      try {
        const protocolRequest = getMyProtocol().catch((error: unknown) => {
          const status =
            typeof error === "object" &&
            error !== null &&
            "response" in error &&
            typeof (error as { response?: { status?: number } }).response?.status === "number"
              ? (error as { response?: { status?: number } }).response?.status
              : undefined;

          if (status === 404) {
            return { success: false } as TreatmentProtocolResponse;
          }

          throw error;
        });

        const [profileResponse, labsResponse, protocolResponse] =
          await Promise.all([
            getPatientById(activeProfileId),
            getMyLabs(),
            protocolRequest,
          ]);

        if (cancelled) return;

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

    loadPatientPortalData();

    return () => {
      cancelled = true;
    };
  }, [role, activeProfileId]);

  const navigate = (next: Page) => {
    startTransition(() => {
      setPageHistory((prev) => [...prev, page]);
      setPage(next);
    });
  };

  const goBack = () => {
    const prev = pageHistory[pageHistory.length - 1];
    startTransition(() => {
      if (prev && !["landing", "login", "register"].includes(prev)) {
        setPageHistory((h) => h.slice(0, -1));
        setPage(prev);
      } else if (role === "patient") {
        setPage("patient-dashboard");
      } else if (role === "oncologist") {
        setPage("oncologist-dashboard");
      } else if (role === "lab_staff") {
        setPage("labstaff-dashboard");
      } else {
        setPage("landing");
      }
    });
  };

  const logout = () => {
    authLogout();

    startTransition(() => {
      setRole(null);
      setActiveProfileId(null);
      setSelectedPatientId(null);
      setPageHistory([]);
      setPage("landing");
    });
  };

  const handlePatientNavigation = (navPage: PatientNavPage) => {
    startTransition(() => {
      setPageHistory([]);
      setPage(navPage);
    });
  };

  // Data mutation handlers
  const handleAddProfile = (p: PatientProfile) => {
    setPatientProfiles((prev) => [...prev, p]);
  };

  const handleUpdateProfile = (p: PatientProfile) => {
    setPatientProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
  };

  const handleSendMessage = (m: Message) => {
    setExtraMessages((prev) => [...prev, m]);
  };

  const handleAddSymptomEntry = (e: SymptomEntry) => {
    setExtraSymptomEntries((prev) => {
      const filtered = prev.filter((x) => x.id !== e.id);
      return [...filtered, e];
    });
  };

  const handleDeleteSymptomEntry = (id: string) => {
    setExtraSymptomEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // ─── Landing ────────────────────────────────────────────────────────────────
  if (page === "landing") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LandingPage onGoToLogin={() => navigate("login")} onGoToRegister={() => navigate("register")} />
      </Suspense>
    );
  }

  // ─── Login ──────────────────────────────────────────────────────────────────
  if (page === "login") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LoginPage
          onLogin={async (email, password) => {
            try {
              const data = await loginUser(email, password);
              const loggedInUser = data.user;

              if (loggedInUser.role === "patient") {
                const patientProfileId = getUserPatientProfileId(loggedInUser);

                if (!patientProfileId) {
                  return "Login succeeded, but this patient account is not linked to a patient profile yet.";
                }

                startTransition(() => {
                  setRole("patient");
                  setActiveProfileId(patientProfileId);
                  setSelectedPatientId(null);
                  setPageHistory([]);
                  setPage("patient-dashboard");
                });

                return null;
              }

              if (loggedInUser.role === "oncologist") {
                startTransition(() => {
                  setRole("oncologist");
                  setActiveProfileId(null);
                  setSelectedPatientId(null);
                  setPageHistory([]);
                  setPage("oncologist-dashboard");
                });

                return null;
              }

              if (loggedInUser.role === "lab_staff") {
                startTransition(() => {
                  setRole("lab_staff");
                  setActiveProfileId(null);
                  setSelectedPatientId(null);
                  setPageHistory([]);
                  setPage("labstaff-dashboard");
                });

                return null;
              }

              return "Unsupported user role.";
            } catch (error) {
              return getApiErrorMessage(error, "Invalid credentials.");
            }
          }}
          onGoToRegister={() => navigate("register")}
          onBackToHome={() => navigate("landing")}
        />
      </Suspense>
    );
  }

  // ─── Register ───────────────────────────────────────────────────────────────
  if (page === "register") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <RegisterPage
          onRegister={async (email, password, confirmPassword) => {
            try {
              const normalizedEmail = email.trim().toLowerCase();
              const matchingMockProfile = patientProfiles.find(
                (profile) =>
                  profile.email.toLowerCase() === normalizedEmail
              );

              const fullName =
                matchingMockProfile?.fullName ||
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

              const patientProfileId = getUserPatientProfileId(registeredUser);

              if (!patientProfileId) {
                return "Registration succeeded, but this patient account is not linked to a patient profile yet.";
              }

              startTransition(() => {
                setRole("patient");
                setActiveProfileId(patientProfileId);
                setSelectedPatientId(null);
                setPage("patient-dashboard");
                setPageHistory([]);
              });

              return null;
            } catch (error) {
              return getApiErrorMessage(error, "Registration failed.");
            }
          }}
          onBack={() => startTransition(() => setPage("login"))}
          onBackToHome={() => navigate("landing")}
        />
      </Suspense>
    );
  }

  // ─── Patient Portal ─────────────────────────────────────────────────────────
  if (PATIENT_PAGES.includes(page) && role === "patient" && activeProfileId) {
    if (patientPortalLoading || !patientPortalProfile) {
      return (
        <Suspense fallback={<SuspenseFallback />}>
          <LoadingSpinner
            message={patientPortalError || "Loading patient portal..."}
          />
        </Suspense>
      );
    }

    const profile = patientPortalProfile;
    const protocol = patientPortalProtocol;
    const patientLabs = patientPortalLabs;
    const mockProfileForUnconnectedSections =
      patientProfiles.find(
        (p) => p.email.toLowerCase() === profile.email.toLowerCase()
      ) || profile;
    const patientMessages = allMessages.filter((m) => m.patientProfileId === mockProfileForUnconnectedSections.id);
    const unreadFromOnco = patientMessages.filter((m) => m.senderRole === "oncologist" && !m.read);

    return (
      <Suspense fallback={<SuspenseFallback />}>
        <PatientLayout
          patientName={profile.fullName}
          patientId={profile.id}
          currentPage={page}
          onNavigate={handlePatientNavigation}
          onLogout={logout}
          onBack={page !== "patient-dashboard" ? goBack : undefined}
          unreadMessages={unreadFromOnco.length}
        >
          {page === "patient-dashboard" && (
            <PatientDashboard
              profile={profile}
              protocol={protocol}
              latestLab={patientLabs[0]}
              unreadMessages={unreadFromOnco}
              onNavigate={handlePatientNavigation}
            />
          )}
          {page === "patient-cycles" && (
            <TreatmentCycles profile={profile} protocol={protocol} />
          )}
          {page === "patient-bloodwork" && (
            <BloodWork profile={profile} labResults={patientLabs} />
          )}
          {page === "patient-journal" && (
            <SymptomJournal
              profile={mockProfileForUnconnectedSections}
              symptomEntries={allSymptomEntries}
              onAddEntry={handleAddSymptomEntry}
              onDeleteEntry={handleDeleteSymptomEntry}
            />
          )}
          {page === "patient-messages" && (
            <PatientMessages
              profile={mockProfileForUnconnectedSections}
              messages={patientMessages}
              onSend={(text) => handleSendMessage({
                id: `msg-${Date.now()}`,
                patientProfileId: mockProfileForUnconnectedSections.id,
                sender: profile.fullName,
                senderRole: "patient",
                text,
                createdAt: new Date().toISOString(),
                read: false,
              })}
            />
          )}
          {page === "patient-profile" && (
            <PatientProfilePage profile={profile} protocol={protocol} />
          )}
        </PatientLayout>
      </Suspense>
    );
  }

  // ─── Oncologist Portal ──────────────────────────────────────────────────────
  if (page === "oncologist-dashboard" && role === "oncologist") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <OncologistDashboard
          onSelectPatient={(id) => {
            startTransition(() => {
              setSelectedPatientId(id);
              setPageHistory((prev) => [...prev, page]);
              setPage("oncologist-patient-detail");
            });
          }}
          onLogout={logout}
        />
      </Suspense>
    );
  }

  if (page === "oncologist-patient-detail" && role === "oncologist" && selectedPatientId) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <PatientDetail
          patientId={selectedPatientId}
          onBack={goBack}
          onHome={() => { startTransition(() => { setPageHistory([]); setPage("oncologist-dashboard"); }); }}
        />
      </Suspense>
    );
  }

  // ─── Lab Staff Portal ───────────────────────────────────────────────────────
  if (page === "labstaff-dashboard" && role === "lab_staff") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LabStaffDashboard onLogout={logout} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <NotFound onGoHome={() => startTransition(() => setPage("landing"))} />
    </Suspense>
  );
}
