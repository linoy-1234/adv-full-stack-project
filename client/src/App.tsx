import { useState } from 'react';
import {
  Patient, Oncologist, TreatmentCycle,
  ClinicalMessage, PhysicianNote, seedMessages, seedPhysicianNotes,
} from './components/mockData';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PatientLayout } from './pages/patient/PatientLayout';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { TreatmentCycles } from './pages/patient/TreatmentCycles';
import { MyMedications } from './pages/patient/MyMedications';
import { SymptomJournal } from './pages/patient/SymptomJournal';
import { BloodWork } from './pages/patient/BloodWork';
import { TreatmentCalendar } from './pages/patient/TreatmentCalendar';
import { PatientMessages } from './pages/patient/PatientMessages';
import { PatientProfile } from './pages/PatientProfile';
import { OncologistDashboard } from './pages/oncologist/OncologistDashboard';
import { PatientDetail } from './pages/oncologist/PatientDetail';
import { NotFound } from './pages/NotFound';

type Page =
  | 'login'
  | 'register'
  | 'patient-dashboard'
  | 'patient-cycles'
  | 'patient-medications'
  | 'patient-journal'
  | 'patient-bloodwork'
  | 'patient-calendar'
  | 'patient-messages'
  | 'patient-profile'
  | 'oncologist-dashboard'
  | 'oncologist-patient-detail'
  | '404';

export type PatientNavPage =
  | 'patient-dashboard'
  | 'patient-cycles'
  | 'patient-medications'
  | 'patient-journal'
  | 'patient-bloodwork'
  | 'patient-calendar'
  | 'patient-messages'
  | 'patient-profile';

const PATIENT_PAGES: Page[] = [
  'patient-dashboard',
  'patient-cycles',
  'patient-medications',
  'patient-journal',
  'patient-bloodwork',
  'patient-calendar',
  'patient-messages',
  'patient-profile',
];

export default function App() {
  const [page, setPage] = useState<Page>('login');
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [currentOncologist, setCurrentOncologist] = useState<Oncologist | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<Page[]>([]);

  // Fever events: each logged fever ≥38°C tracked with date + temp for calendar schedule recalculation
  const [feverEvents, setFeverEvents] = useState<{ date: string; temp: number }[]>([]);
  const handleFeverLogged = (date: string, temp: number) =>
    setFeverEvents((prev) => [...prev, { date, temp }]);

  // Shared cycle overrides — written by oncologist portal, read by patient portal
  const [globalCycleOverrides, setGlobalCycleOverrides] = useState<Record<string, Partial<TreatmentCycle>>>({});

  // Clinical communication shared state
  const [messages, setMessages] = useState<ClinicalMessage[]>(seedMessages);
  const [physicianNotes, setPhysicianNotes] = useState<PhysicianNote[]>(seedPhysicianNotes);

  const handleCycleOverride = (updates: Record<string, Partial<TreatmentCycle>>) => {
    setGlobalCycleOverrides((prev) => ({ ...prev, ...updates }));
  };

  const handlePatientSendMessage = (patientId: string, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        patientId,
        fromRole: 'patient',
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleOncologistReply = (patientId: string, text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        patientId,
        fromRole: 'oncologist',
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleBroadcastNote = (patientId: string, text: string, oncologistName: string) => {
    setPhysicianNotes((prev) => [
      ...prev,
      {
        id: `pn-${Date.now()}`,
        patientId,
        oncologistName,
        text,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Build patient with global overrides applied so patient portal reflects oncologist decisions
  const buildPatientWithOverrides = (p: Patient): Patient => ({
    ...p,
    cycles: p.cycles.map((c) => ({ ...c, ...(globalCycleOverrides[c.id] ?? {}) })),
  });

  const navigate = (next: Page) => {
    setPageHistory((prev) => [...prev, page]);
    setPage(next);
  };

  const goBack = () => {
    const prev = pageHistory[pageHistory.length - 1];
    // Never route back into login/register once a session is active
    if (prev && prev !== 'login' && prev !== 'register') {
      setPageHistory((h) => h.slice(0, -1));
      setPage(prev);
    } else if (currentPatient) {
      setPageHistory([]);
      setPage('patient-dashboard');
    } else if (currentOncologist) {
      setPageHistory([]);
      setPage('oncologist-dashboard');
    } else {
      setPage('login');
    }
  };

  const logout = () => {
    setCurrentPatient(null);
    setCurrentOncologist(null);
    setSelectedPatientId(null);
    setPageHistory([]);
    setGlobalCycleOverrides({});
    setFeverEvents([]);
    setPage('login');
  };

  const handlePatientNavigation = (navPage: PatientNavPage) => {
    setPageHistory([]);
    setPage(navPage);
  };

  // Auth screens
  if (page === 'login') {
    return (
      <LoginPage
        onPatientLogin={(patient) => {
          setCurrentPatient(patient);
          setPageHistory([]);
          setPage('patient-dashboard');
        }}
        onOncologistLogin={(onco) => {
          setCurrentOncologist(onco);
          setPageHistory([]);
          setPage('oncologist-dashboard');
        }}
        onGoToRegister={() => navigate('register')}
      />
    );
  }

  if (page === 'register') {
    return <RegisterPage onBack={() => setPage('login')} />;
  }

  // Patient portal — always use patient with overrides applied
  if (PATIENT_PAGES.includes(page) && currentPatient) {
    const patient = buildPatientWithOverrides(currentPatient);
    const patientMessages = messages.filter((m) => m.patientId === patient.id);
    const patientNotes = physicianNotes.filter((n) => n.patientId === patient.id);
    const unreadCount = patientMessages.filter((m) => m.fromRole === 'oncologist').length;

    return (
      <PatientLayout
        patient={patient}
        currentPage={page}
        onNavigate={handlePatientNavigation}
        onLogout={logout}
        onBack={page !== 'patient-dashboard' ? goBack : undefined}
        unreadMessages={unreadCount}
      >
        {page === 'patient-dashboard' && (
          <PatientDashboard
            patient={patient}
            onNavigate={handlePatientNavigation}
            physicianNotes={patientNotes}
            onFeverLogged={handleFeverLogged}
          />
        )}
        {page === 'patient-cycles' && <TreatmentCycles patient={patient} />}
        {page === 'patient-medications' && <MyMedications patient={patient} />}
        {page === 'patient-journal' && <SymptomJournal patient={patient} />}
        {page === 'patient-bloodwork' && <BloodWork patient={patient} showVitals />}
        {page === 'patient-calendar' && <TreatmentCalendar patient={patient} feverEvents={feverEvents} />}
        {page === 'patient-messages' && (
          <PatientMessages
            patient={patient}
            messages={patientMessages}
            physicianNotes={patientNotes}
            onSend={(text) => handlePatientSendMessage(patient.id, text)}
          />
        )}
        {page === 'patient-profile' && <PatientProfile patient={patient} viewerRole="patient" />}
      </PatientLayout>
    );
  }

  // Oncologist portal
  if (page === 'oncologist-dashboard' && currentOncologist) {
    return (
      <OncologistDashboard
        oncologist={currentOncologist}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          navigate('oncologist-patient-detail');
        }}
        onLogout={logout}
      />
    );
  }

  if (page === 'oncologist-patient-detail' && currentOncologist && selectedPatientId) {
    return (
      <PatientDetail
        patientId={selectedPatientId}
        oncologist={currentOncologist}
        onCycleOverride={handleCycleOverride}
        onBack={goBack}
        onHome={() => {
          setPageHistory([]);
          setPage('oncologist-dashboard');
        }}
        messages={messages.filter((m) => m.patientId === selectedPatientId)}
        onReply={(patientId, text) =>
          handleOncologistReply(patientId, text)
        }
        onBroadcastNote={(patientId, text) =>
          handleBroadcastNote(patientId, text, currentOncologist.fullName)
        }
      />
    );
  }

  return <NotFound onGoHome={() => setPage('login')} />;
}
