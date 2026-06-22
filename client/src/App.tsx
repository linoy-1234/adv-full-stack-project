import { useState, lazy, Suspense, useTransition } from "react";
import {
  seedOncologist,
  seedLabStaff,
  seedPatientProfiles,
  seedTreatmentProtocols,
  seedLabResults,
  seedMessages,
  seedSymptomEntries,
  PatientProfile,
  TreatmentProtocol,
  LabResult,
  Message,
  SymptomEntry,
  validateRegistration,
  UserRole,
} from "./utils/mockData";
import { LoadingSpinner } from "./components/shared/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

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
  const { login: loginUser, logout: authLogout } = useAuth();
  const [page, setPage] = useState<Page>("landing");
  const [pageHistory, setPageHistory] = useState<Page[]>([]);
  const [isPending, startTransition] = useTransition();

  // Active user
  const [role, setRole] = useState<UserRole | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Mutable state (simulating backend collections)
  const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>(seedPatientProfiles);
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>(seedTreatmentProtocols);
  const [extraLabResults, setExtraLabResults] = useState<LabResult[]>([]);
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const [extraSymptomEntries, setExtraSymptomEntries] = useState<SymptomEntry[]>([]);

  // All data merged
  const allLabResults = [
    ...seedLabResults,
    ...extraLabResults.filter((l) => !seedLabResults.find((sl) => sl.id === l.id)),
  ];
  const allMessages = [
    ...seedMessages,
    ...extraMessages.filter((m) => !seedMessages.find((sm) => sm.id === m.id)),
  ];
  const allSymptomEntries = [
    ...seedSymptomEntries,
    ...extraSymptomEntries.filter((e) => !seedSymptomEntries.find((se) => se.id === e.id)),
  ];

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

  const handleUpdateProtocol = (tp: TreatmentProtocol) => {
    setProtocols((prev) => prev.map((x) => (x.id === tp.id ? tp : x)));
  };

  const handleAddLabResult = (lr: LabResult) => {
    setExtraLabResults((prev) => {
      const filtered = prev.filter((x) => x.id !== lr.id);
      return [...filtered, lr];
    });
    // If linked to a waiting_labs cycle, update that cycle to ready for review
    if (lr.linkedCycleId) {
      const protocol = protocols.find((p) => p.patientProfileId === lr.patientProfileId);
      if (protocol) {
        const updatedItems = protocol.items.map((item) => {
          if (item.id === lr.linkedCycleId && item.type === "chemotherapy") {
            return { ...item, labResultId: lr.id };
          }
          return item;
        });
        handleUpdateProtocol({ ...protocol, items: updatedItems });
      }
    }
  };

  const handleDeleteLabResult = (id: string) => {
    setExtraLabResults((prev) => prev.filter((l) => l.id !== id));
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
                const matchingMockProfile = patientProfiles.find(
                  (profile) =>
                    profile.email.toLowerCase() === loggedInUser.email.toLowerCase()
                );

                if (!matchingMockProfile) {
                  return "Login succeeded, but this patient profile is not connected to the current UI data yet.";
                }

                startTransition(() => {
                  setRole("patient");
                  setActiveProfileId(matchingMockProfile.id);
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
          onRegister={(email, password) => {
            const result = validateRegistration(email, password);
            if (!result.success) return result.error ?? "Registration failed.";
            startTransition(() => {
              setRole("patient");
              setActiveProfileId(result.profileId!);
              setPage("patient-dashboard");
              setPageHistory([]);
            });
            return null;
          }}
          onBack={() => startTransition(() => setPage("login"))}
          onBackToHome={() => navigate("landing")}
        />
      </Suspense>
    );
  }

  // ─── Patient Portal ─────────────────────────────────────────────────────────
  if (PATIENT_PAGES.includes(page) && role === "patient" && activeProfileId) {
    const profile = patientProfiles.find((p) => p.id === activeProfileId)!;
    const protocol = protocols.find((p) => p.patientProfileId === activeProfileId);
    const patientLabs = allLabResults.filter((l) => l.patientProfileId === activeProfileId).sort((a, b) => b.date.localeCompare(a.date));
    const patientMessages = allMessages.filter((m) => m.patientProfileId === activeProfileId);
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
              profile={profile}
              symptomEntries={allSymptomEntries}
              onAddEntry={handleAddSymptomEntry}
              onDeleteEntry={handleDeleteSymptomEntry}
            />
          )}
          {page === "patient-messages" && (
            <PatientMessages
              profile={profile}
              messages={patientMessages}
              onSend={(text) => handleSendMessage({
                id: `msg-${Date.now()}`,
                patientProfileId: profile.id,
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
          profiles={patientProfiles}
          onAddProfile={handleAddProfile}
          onAddProtocol={(tp) => setProtocols((prev) => [...prev, tp])}
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
          allProfiles={patientProfiles}
          allProtocols={protocols}
          allLabResults={allLabResults}
          allMessages={allMessages}
          allSymptomEntries={allSymptomEntries}
          onUpdateProfile={handleUpdateProfile}
          onUpdateProtocol={handleUpdateProtocol}
          onUpdateCycleStatus={(protocolId, cycleId, status, extra) => {
            setProtocols((prev) => prev.map((p) => {
              if (p.id !== protocolId) return p;
              return {
                ...p,
                items: p.items.map((item) => {
                  if (item.id !== cycleId || item.type !== "chemotherapy") return item;
                  return { ...item, status, ...(extra ?? {}) };
                }),
              };
            }));
          }}
          onAddLabResult={handleAddLabResult}
          onSendMessage={handleSendMessage}
        />
      </Suspense>
    );
  }

  // ─── Lab Staff Portal ───────────────────────────────────────────────────────
  if (page === "labstaff-dashboard" && role === "lab_staff") {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LabStaffDashboard
          labStaffName={seedLabStaff.fullName}
          onLogout={logout}
          extraLabResults={extraLabResults}
          onAddLabResult={handleAddLabResult}
          onDeleteLabResult={handleDeleteLabResult}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<SuspenseFallback />}>
      <NotFound onGoHome={() => startTransition(() => setPage("landing"))} />
    </Suspense>
  );
}
