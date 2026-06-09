# Onco+Log Redesign Implementation Plan

## Context

The current Onco+Log implementation includes advanced automation features that simulate a medical decision system with automatic fever postponement, calendar shifting, correlation insights, and predictive safety engines. However, these features exceed the scope of a realistic Advanced Full Stack final project and create an unbuildable medical automation system.

The redesign transforms Onco+Log into a **treatment coordination portal** that:
- Removes all automatic clinical decision-making
- Simplifies to manual oncologist-driven workflows
- Reduces from 6+ patient pages to 5 core pages
- Aligns authentication with email-based approach
- Prepares the codebase for future MongoDB/Express backend implementation
- Maintains the existing calm sage green/cream visual identity

This redesign makes the application realistic and implementable as a full-stack MERN application with JWT auth, REST API, and CRUD operations.

---

## Figma Organization Alignment

The Figma file should be organized to mirror the future code architecture:

### Frontend Structure (client/)
```
client/
├── src/
│   ├── assets/               → Figma: Images, SVGs, icons
│   ├── components/
│   │   ├── common/          → Figma: Logo, SafetyNotice, BackButton
│   │   ├── layout/          → Figma: AppHeader, SideDrawer, AppShell, PublicShell
│   │   ├── ui/              → Figma: Button, Card, Input, Badge, Toggle, etc.
│   │   └── domain/          → Figma: LabResultCard, TreatmentCard, SymptomButton,
│   │                                 SymptomEntryCard, MessageBubble, PatientTable,
│   │                                 UploadBox, TimelineDot, TemperatureBadge
│   ├── pages/
│   │   ├── auth/            → Figma: Landing, Login, Register, NotFound
│   │   ├── patient/         → Figma: Dashboard, TreatmentCycles, SymptomJournal,
│   │                                 Messages, MyProfile
│   │   └── oncologist/      → Figma: Dashboard, PatientDetail, AddPatientModal
│   ├── context/             → Developer handoff: AuthContext
│   ├── store/slices/        → Developer handoff: Redux slices
│   ├── services/            → Developer handoff: Axios API layer
│   ├── hooks/               → Developer handoff: Custom hooks
│   └── utils/               → Developer handoff: Helper functions
```

### Backend Structure (server/)
```
server/
├── controllers/             → Developer handoff: Business logic
├── models/                  → Developer handoff: MongoDB schemas
├── routes/                  → Developer handoff: Express routes
├── middleware/              → Developer handoff: Auth, validation, error handling
├── config/                  → Developer handoff: DB connection, env config
├── utils/                   → Developer handoff: Helper functions
└── uploads/                 → Developer handoff: Multer file storage
```

## Critical Files to Modify

### Files to REMOVE Entirely
1. `src/app/components/patient/TreatmentCalendar.tsx` - automatic fever-based calendar rescheduling
2. `src/app/components/patient/MyMedications.tsx` - will be consolidated into profile page
3. `src/app/components/patient/BloodWork.tsx` - **IMPORTANT**: Remove standalone page, but keep read-only lab preview on dashboard

### Files to Modify Heavily
1. `src/app/App.tsx` - remove routing for deleted pages, update page types
2. `src/app/components/patient/PatientLayout.tsx` - update navigation to 5 pages only
3. `src/app/components/patient/PatientDashboard.tsx` - remove automatic radiation gate, fever logic, predictive panels
4. `src/app/components/patient/SymptomJournal.tsx` - add temperature field, add CRUD (edit/delete), add TemperatureBadge
5. `src/app/components/auth/LoginPage.tsx` - change from fullName+nationalId+password to email+password
6. `src/app/components/auth/RegisterPage.tsx` - change from nationalId+birthDate to email+fullName+password+confirmPassword
7. `src/app/components/mockData.ts` - add temperature to SymptomEntry, add email to Patient/Oncologist, remove correlation insights
8. `src/app/components/oncologist/PatientDetail.tsx` - remove automatic approval logic, add lab CRUD UI
9. `src/app/components/patient/TreatmentCycles.tsx` - remove automatic calendar displacement references
10. `src/app/components/PatientProfile.tsx` - already has consolidated medications registry (keep as-is mostly)

### New Components to Create
1. `src/app/components/shared/SafetyNotice.tsx` - reusable emergency disclaimer banner
2. `src/app/components/shared/TemperatureBadge.tsx` - visual temperature flag (no automation)

---

## Performance Optimization Requirements

### Route-Level Lazy Loading
All main page components must use React.lazy() with Suspense for code splitting:

```typescript
// App.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Lazy load all page components
const LandingPage = lazy(() => import('./components/auth/LandingPage'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const RegisterPage = lazy(() => import('./components/auth/RegisterPage'));
const PatientDashboard = lazy(() => import('./components/patient/PatientDashboard'));
const TreatmentCycles = lazy(() => import('./components/patient/TreatmentCycles'));
const SymptomJournal = lazy(() => import('./components/patient/SymptomJournal'));
const PatientMessages = lazy(() => import('./components/patient/PatientMessages'));
const PatientProfile = lazy(() => import('./components/PatientProfile'));
const OncologistDashboard = lazy(() => import('./components/oncologist/OncologistDashboard'));
const PatientDetail = lazy(() => import('./components/oncologist/PatientDetail'));
const NotFound = lazy(() => import('./components/NotFound'));

// Wrap route rendering in Suspense
<Suspense fallback={<LoadingSpinner message="Loading..." />}>
  {page === 'landing' && <LandingPage ... />}
  {page === 'login' && <LoginPage ... />}
  // ... etc
</Suspense>
```

### Component Memoization
Wrap repeated/presentational components with React.memo to prevent unnecessary re-renders:

**Components to Memoize**:
- `TreatmentCard` - displays individual treatment cycle cards
- `LabResultCard` - displays individual lab result entries
- `SymptomEntryCard` - displays individual symptom log entries
- `MessageBubble` - displays individual message bubbles in chat
- `PatientTableRow` - displays individual rows in oncologist patient table
- `TemperatureBadge` - displays temperature with visual flag
- `SafetyNotice` - static emergency disclaimer
- `MedicationChecklist` items (if extracted as separate component)

**Pattern**:
```typescript
// components/domain/TreatmentCard.tsx
import { memo } from 'react';

interface TreatmentCardProps {
  cycle: TreatmentCycle;
  status: CycleStatus;
  onAction?: (action: string) => void;
}

export const TreatmentCard = memo(({ cycle, status, onAction }: TreatmentCardProps) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if cycle.id or status changed
  return prevProps.cycle.id === nextProps.cycle.id && 
         prevProps.status === nextProps.status;
});

TreatmentCard.displayName = 'TreatmentCard';
```

### Callback and Value Memoization
Use useCallback and useMemo to optimize performance when passing props to memoized components:

**useCallback for event handlers**:
```typescript
// Parent component
const handleCycleAction = useCallback((cycleId: string, action: string) => {
  // Handle action
}, []); // Dependencies array - only recreate if dependencies change

<TreatmentCard cycle={cycle} onAction={handleCycleAction} />
```

**useMemo for computed values**:
```typescript
// Memoize expensive calculations
const activeCycle = useMemo(
  () => patient.cycles.find(c => getCycleStatus(c) === 'active'),
  [patient.cycles]
);

const labSummary = useMemo(
  () => ({
    wbc: latestLab.wbc,
    neutrophils: latestLab.neutrophils,
    hemoglobin: latestLab.hemoglobin,
    platelets: latestLab.platelets,
  }),
  [latestLab]
);
```

### Future Code Reorganization Compatibility

The current implementation uses `src/app/components/` structure, but it MUST be designed so it can be easily reorganized into the future structure:

**Current**: `src/app/components/patient/PatientDashboard.tsx`  
**Future**: `client/src/pages/patient/PatientDashboard.tsx`

**Guidelines**:
- Use relative imports consistently
- Avoid hardcoded absolute paths
- Keep shared components in shared/ folder that can move to components/common or components/domain
- Keep UI components in ui/ folder that can move to components/ui
- Ensure no circular dependencies
- All component exports should be named exports or default exports (consistent pattern)

**Migration-Ready Structure**:
```
Current (src/app/):
├── components/
│   ├── shared/          → Future: client/src/components/common/
│   ├── ui/              → Future: client/src/components/ui/
│   ├── patient/         → Future: client/src/pages/patient/
│   ├── oncologist/      → Future: client/src/pages/oncologist/
│   └── auth/            → Future: client/src/pages/auth/

The code should use relative imports like:
import { LoadingSpinner } from '../shared/LoadingSpinner';

So when moved to:
client/src/pages/patient/Dashboard.tsx
It becomes:
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
```

This allows for straightforward search-and-replace reorganization when transitioning to the full-stack architecture.

---

## Detailed Implementation Steps

### Phase 1: Remove Automatic Clinical Features

#### 1.1 Delete Automatic Calendar/Fever System
- **DELETE** `src/app/components/patient/TreatmentCalendar.tsx`
- **REMOVE** from `App.tsx`:
  - `patient-calendar` from Page type
  - `patient-calendar` from PatientNavPage type
  - `patient-calendar` from PATIENT_PAGES array
  - Import statement for TreatmentCalendar
  - Rendering logic for TreatmentCalendar
  - `feverEvents` state
  - `handleFeverLogged` function
  - Pass-through of fever props

#### 1.2 Remove Radiation Automatic Postponement
- **IN** `src/app/components/patient/PatientDashboard.tsx`:
  - Remove `RadiationGate` component (lines ~186-324)
  - Remove `getRadiationTodayState`, `RadiationTodayState`, `getCompletedSessionCount` imports
  - Remove `radTempStr`, `radLocalTemp`, `radState`, `radNeedsTemp` state/logic
  - Remove `handleRadTempSubmit` function
  - Remove `onFeverLogged` prop and all fever logging
  - Keep medication checklist but remove temperature gating

- **IN** `src/app/components/mockData.ts`:
  - Remove `getRadiationTodayState` function
  - Remove `RadiationTodayState` type
  - Keep `RadiationPhase` but remove automatic dailyLogs logic
  - Remove `shiftDate` if only used for automatic calendar

#### 1.3 Remove Correlation Insights
- **IN** `src/app/components/mockData.ts`:
  - Remove `correlationInsights: string[]` from Patient interface
  - Remove all `correlationInsights` data from patient seed data

- **IN** `src/app/components/patient/SymptomJournal.tsx`:
  - Already removed in current code (verify clean)

- **IN** `src/app/components/oncologist/PatientDetail.tsx`:
  - Remove any "System Correlation Analysis" panels if present
  - Remove predictive/hypothesis UI elements

### Phase 2: Simplify Page Structure

#### 2.1 Remove Medications Page
- **DELETE** `src/app/components/patient/MyMedications.tsx`
- **REMOVE** from `App.tsx`:
  - `patient-medications` from Page type
  - `patient-medications` from PatientNavPage type
  - `patient-medications` from PATIENT_PAGES array
  - Import statement
  - Rendering logic
- **REMOVE** from `PatientLayout.tsx` NAV_ITEMS array

#### 2.2 Remove Blood Work Standalone Page (Patient Side)
- **DELETE** `src/app/components/patient/BloodWork.tsx` as standalone page
- **REMOVE** from `App.tsx`:
  - `patient-bloodwork` from Page type
  - `patient-bloodwork` from PatientNavPage type  
  - `patient-bloodwork` from PATIENT_PAGES array
  - Import statement
  - Rendering logic for BloodWork component
- **REMOVE** from `PatientLayout.tsx` NAV_ITEMS:
  - Remove "Blood Work & Vitals" navigation item

**IMPORTANT - Lab Results Visibility**:
- Patients CAN still view labs (read-only)
- Lab preview appears on Patient Dashboard as "Latest Lab Results" card
- Shows: WBC, Neutrophils, Hemoglobin, Platelets with normal/low/high badges
- Lab CRUD (add/edit/delete) is **oncologist/care-team only** in PatientDetail
- Patient sees read-only snapshot, oncologist manages the data

**Result**: Patient portal now has exactly 5 pages:
1. patient-dashboard (Home) - includes read-only lab preview
2. patient-cycles (Treatment Cycles)
3. patient-journal (Symptom Journal)
4. patient-messages (Messages)
5. patient-profile (My Profile)

### Phase 3: Fix Authentication Screens

#### 3.1 Update LoginPage
- **IN** `src/app/components/auth/LoginPage.tsx`:
  - **REMOVE** fullName and nationalId fields from both patient and oncologist forms
  - **ADD** email field to patient login form
  - **KEEP** email field in oncologist form (already exists)
  - Update `patientForm` state: `{ email: '', password: '' }`
  - Update `oncoForm` state: already correct `{ email: '', password: '' }`
  - Update `handlePatientSubmit` to call `validatePatientLogin(email, password)`
  - Add email validation (must contain @)
  - Add password validation (required, min 6 chars suggested)
  - Update form UI to show Email + Password inputs only
  - Add demo credentials hint card if needed

- **IN** `src/app/components/mockData.ts`:
  - Update `validatePatientLogin(email: string, password: string)` function
  - Update `validateOncologistLogin(email: string, password: string)` - should already use email

#### 3.2 Update RegisterPage
- **IN** `src/app/components/auth/RegisterPage.tsx`:
  - Update form state to: `{ fullName: '', email: '', password: '', confirmPassword: '' }`
  - **REMOVE** nationalId and birthDate fields
  - **ADD** email field and confirmPassword field
  - Update validation:
    - Email required and must contain @
    - Password required and min 6 chars
    - Passwords must match
    - Full name required
  - Update `validateRegistration(email)` call
  - Add explanatory text: "Your care team must create your medical profile before full portal access is available."
  - Update success message to reference email instead of National ID

- **IN** `src/app/components/mockData.ts`:
  - Update `validateRegistration(email: string)` to check against email instead of nationalId
  - Consider keeping hospitalPatientIds as `hospitalPatientEmails` for demo purposes

#### 3.3 Update Data Model
- **IN** `src/app/components/mockData.ts`:
  - **ADD** `email: string` to Patient interface (keep nationalId for profile display)
  - Ensure Oncologist interface already has `email: string` (verify)
  - Update all patient seed data to include email addresses
  - Update all oncologist seed data to ensure emails exist

### Phase 4: Update Symptom Journal with Temperature & CRUD

#### 4.1 Add Temperature Field to Data Model
- **IN** `src/app/components/mockData.ts`:
  - Update `SymptomEntry` interface to add:
    ```typescript
    temperature: number; // Celsius, e.g., 36.8, 38.2
    ```
  - Update all symptom log seed data to include temperature values

#### 4.2 Create TemperatureBadge Component
- **CREATE** `src/app/components/shared/TemperatureBadge.tsx`:
  ```typescript
  interface TemperatureBadgeProps {
    temperature: number;
    size?: 'small' | 'medium' | 'large';
  }
  
  export function TemperatureBadge({ temperature, size = 'medium' }: TemperatureBadgeProps) {
    const isElevated = temperature >= 38.0;
    const bgColor = isElevated ? '#FEF2F2' : '#D1FAE5';
    const borderColor = isElevated ? '#FCA5A5' : '#7CAE8E';
    const textColor = isElevated ? '#991B1B' : '#166534';
    
    return (
      <div style={{ backgroundColor: bgColor, border: `1.5px solid ${borderColor}`, ... }}>
        <span style={{ color: textColor }}>
          {temperature}°C
        </span>
        {isElevated && (
          <p>Elevated temperature — please notify your care team.</p>
        )}
      </div>
    );
  }
  ```
  - This is **visual only** - no automatic actions
  - Used in symptom journal history, oncologist view, dashboard preview

#### 4.3 Update SymptomJournal Component
- **IN** `src/app/components/patient/SymptomJournal.tsx`:
  - Add temperature input field in form:
    ```tsx
    <input
      type="number"
      step="0.1"
      min="34.0"
      max="42.5"
      placeholder="e.g. 37.2"
      value={temperature}
      onChange={(e) => setTemperature(e.target.value)}
    />
    ```
  - Add temperature validation:
    - Required field
    - Must be numeric
    - Range 34.0°C - 42.5°C
  - Add state: `const [temperature, setTemperature] = useState('')`
  - Include temperature in submission
  - Display temperature in history entries using `<TemperatureBadge temperature={entry.temperature} />`
  - **ADD CRUD operations**:
    - Add Edit button to each history entry
    - Add Delete button to each history entry
    - Edit: populate form with existing entry data
    - Delete: show confirmation dialog before removing
    - Add loading states for edit/delete operations
    - Add error handling UI
  - Show previous entries at bottom with edit/delete controls
  - Add empty state when no entries exist

### Phase 5: Design All Required Pages & States

#### 5.0 Complete Page Coverage

Ensure Figma designs exist for ALL pages and states:

**Public Pages** (Figma: pages/auth/):
- Landing Page - hero, CTA buttons for Login/Register, calm branding
- Login Page - segmented toggle (Patient/Oncologist), email+password, demo hint
- Register Page - fullName, email, password, confirmPassword, care team note
- Not Found / 404 Page - calm centered card, "Go Home" button

**Patient Pages** (Figma: pages/patient/):
- Dashboard - SafetyNotice, Today card, mini timeline, latest lab preview, quick access
- Treatment Cycles - unified timeline, You Are Here marker, manual approval badges
- Symptom Journal - form with temperature, CRUD controls, history list
- Messages - SafetyNotice, chat UI, send input
- My Profile - identity, blood type, allergies, medications registry, protocol summary

**Oncologist Pages** (Figma: pages/oncologist/):
- Dashboard - notifications, patient table, Add Patient button
- Patient Detail / Clinical Workspace - all sections per Phase 8.3
- Add Patient Modal/Drawer - create medical profile form

**UI States** (Figma: Design System section):
- Loading states: spinner component, skeleton loaders, "Saving..." buttons
- Error states: error message component, inline field errors, failed operation alerts
- Empty states: no symptom entries, no messages, no labs, no patients
- Success states: green checkmark confirmations, success toasts

**Protected Route Concept** (Developer handoff note):
- PrivateRoute wrapper checks AuthContext for logged-in user
- Redirects to /login if no user
- Role-based routing: patient routes require patient role, oncologist routes require oncologist role

#### 5.1 Create SafetyNotice Component
- **CREATE** `src/app/components/shared/SafetyNotice.tsx`:
  ```typescript
  export function SafetyNotice() {
    return (
      <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFF7ED', border: '1.5px solid #FCD34D' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: '#D97706' }} />
          <p className="text-xs" style={{ color: '#92400E' }}>
            <strong>Important:</strong> This portal is not for emergencies. 
            For urgent symptoms, contact your care team or emergency services.
          </p>
        </div>
      </div>
    );
  }
  ```

#### 5.2 Simplify PatientDashboard
- **IN** `src/app/components/patient/PatientDashboard.tsx`:
  - **ADD** `<SafetyNotice />` at top of dashboard
  - **KEEP** "Today" card with medication checklist
  - **KEEP** mini treatment timeline (5 cycles display)
  - **KEEP** latest lab preview card (WBC, Neutrophils, Hemoglobin, Platelets)
  - **KEEP** quick access cards to other pages
  - **REMOVE** all radiation gate logic
  - **REMOVE** fever logging
  - **REMOVE** automatic temperature gating
  - **REMOVE** predictive safety panels
  - **REMOVE** correlation insights
  - **REMOVE** neutropenic care panel (move to static resources if needed)

### Phase 6: Simplify Treatment Cycles Page

#### 6.1 Update TreatmentCycles Component
- **IN** `src/app/components/patient/TreatmentCycles.tsx`:
  - Remove references to automatic calendar displacement
  - Remove fever postponement automation
  - **KEEP** unified timeline display with:
    - Completed cycles (visual only)
    - Active cycle with "You Are Here" marker
    - Upcoming cycles
    - On Hold status (manual oncologist action only)
    - Approved status (manual oncologist action only)
  - **KEEP** treatment modalities (chemo, radiation, surgery) in timeline
  - Remove any automatic rescheduling text/UI
  - Ensure status badges reflect manual oncologist decisions only

### Phase 7: Update Messages Page

#### 7.1 Update PatientMessages Component
- **IN** `src/app/components/patient/PatientMessages.tsx`:
  - **ADD** `<SafetyNotice />` emergency warning banner at top
  - **KEEP** doctor note card display
  - **KEEP** chat-style conversation UI
  - **KEEP** message input and send button
  - **ADD** loading state while sending
  - **ADD** error state handling
  - **ADD** empty state ("No messages yet")
  - Ensure patient messages styled as soft green bubbles
  - Ensure oncologist messages styled as white cards

### Phase 8: Update Oncologist Portal

#### 8.1 Update OncologistDashboard
- **IN** `src/app/components/oncologist/OncologistDashboard.tsx`:
  - **ADD** "Add Patient / Create Medical Profile" button
  - **KEEP** patient directory table
  - Update table columns to:
    - Patient (name)
    - Diagnosis
    - Current Status
    - Pending Action
  - Each row navigates to Patient Detail

#### 8.2 Create Add Patient Modal/Drawer
- **CREATE** `src/app/components/oncologist/AddPatientModal.tsx` (or drawer):
  - Modal/drawer for oncologist to create patient medical profile
  - Form fields:
    - Full name (required)
    - Email (required, will link to future patient registration)
    - National ID (required)
    - Date of birth (required)
    - Diagnosis (required)
    - Blood type (required, dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
    - Allergies (textarea, comma-separated)
    - Assigned oncologist (dropdown, default to current oncologist)
    - Initial protocol name (text input)
    - Number of cycles (number input)
    - Notes (textarea, optional)
  - Add validation for all required fields
  - Add loading/error states
  - On success: close modal, refresh patient list
  - This supports the workflow: care team creates profile FIRST, then patient registers with matching email

#### 8.3 Update PatientDetail (Clinical Workspace)
- **IN** `src/app/components/oncologist/PatientDetail.tsx`:
  - **ADD** `<SafetyNotice />` at top
  - **KEEP** patient summary header
  - **KEEP** treatment protocol summary
  - **UPDATE** Treatment Authorization section:
    - Remove automatic approval logic
    - Keep manual "Approve Next Cycle" button
    - Keep manual "Hold Treatment" button with inline panel:
      - Hold reason textarea
      - Rescheduled date input
      - Confirm button
    - Ensure buttons trigger manual actions only
    - Remove any "system recommendation" or "predictive safety" text
  
  - **ADD** Lab Results Management CRUD:
    - "Add Lab Result" button
    - Form for new lab entry:
      - Date (date picker)
      - WBC, Neutrophils, Hemoglobin, Platelets (number inputs)
      - ALT, Creatinine (number inputs)
      - Blood Pressure (text, format XXX/YY)
      - Weight (number)
      - Temperature (number)
      - Optional note (textarea)
    - Each lab result card has Edit and Delete buttons
    - Edit: populate form with existing data
    - Delete: confirmation dialog
    - Loading states for add/edit/delete
    - Error handling UI
    - Label as "Care Team Entry" not "manual oncologist entry"

  - **KEEP** Trend Analysis Chart (visual only, no predictions)
  - **KEEP** Pre-Treatment Vitals display
  - **UPDATE** Recent Temperature Readings:
    - Read from patient symptom logs (temperature field)
    - Display with `<TemperatureBadge />`
    - No automatic actions
    - Visual flag only

  - **KEEP** Symptom Journal History (read-only)
  - **KEEP** Patient Questions messaging area
  - **KEEP** Physician Direct Notes with Multer upload placeholder

  - **REMOVE** automatic fever mirroring
  - **REMOVE** automatic treatment postponement logic
  - **REMOVE** predictive clinical engine text
  - **REMOVE** calendar shift system references
  - **REMOVE** "system decides if treatment is safe" language

### Phase 9: Update Profile Page

#### 9.1 Review PatientProfile
- **IN** `src/app/components/PatientProfile.tsx`:
  - **VERIFY** consolidated medications registry already implemented
  - Ensure shows:
    - Full name
    - Email (add this field)
    - National ID
    - Date of birth
    - Diagnosis
    - Assigned oncologist
    - Blood type with visual color coding
    - Drug allergies with red warning styling and AVOID badges
    - Treatment protocol summary (counts only, no dates/statuses)
    - Current Medications List:
      - Oncology treatment medications section
      - Supportive oncology medications section
      - Chronic/background medications section
  - This should be **read-only** for patients
  - Oncologist view can show same info when viewing patient

### Phase 10: Update Navigation and Routing

#### 10.1 Finalize PatientLayout Navigation
- **IN** `src/app/components/patient/PatientLayout.tsx`:
  - Update NAV_ITEMS to exactly 5 items:
    ```typescript
    const NAV_ITEMS: NavItem[] = [
      { page: 'patient-dashboard', label: 'Dashboard', icon: <Home /> },
      { page: 'patient-cycles', label: 'Treatment Cycles', icon: <Calendar /> },
      { page: 'patient-journal', label: 'Symptom Journal', icon: <BookOpen /> },
      { page: 'patient-messages', label: 'Messages', icon: <MessageCircle /> },
      { page: 'patient-profile', label: 'My Profile', icon: <UserCircle /> },
    ];
    ```

#### 10.2 Finalize App.tsx Routing
- **IN** `src/app/App.tsx`:
  - Update Page type to only include:
    - landing
    - login
    - register
    - patient-dashboard
    - patient-cycles
    - patient-journal
    - patient-messages
    - patient-profile
    - oncologist-dashboard
    - oncologist-patient-detail
    - 404

  - Update PatientNavPage type to only include:
    - patient-dashboard
    - patient-cycles
    - patient-journal
    - patient-messages
    - patient-profile

  - Update PATIENT_PAGES array to match

  - Verify rendering logic only handles these pages

### Phase 11: Add Loading/Error/Empty States

#### 11.1 Create Reusable State Components
- **VERIFY** `src/app/components/shared/LoadingSpinner.tsx` exists
- **VERIFY** `src/app/components/shared/ErrorMessage.tsx` exists
- **CREATE** `src/app/components/shared/EmptyState.tsx` if not exists:
  ```typescript
  interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }
  
  export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {icon && <div className="mb-4">{icon}</div>}
        <h3 style={{ color: '#374151' }}>{title}</h3>
        <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>{description}</p>
        {action && (
          <button onClick={action.onClick} className="mt-4 px-4 py-2 rounded-xl" style={{ backgroundColor: '#7CAE8E', color: '#FFF' }}>
            {action.label}
          </button>
        )}
      </div>
    );
  }
  ```

#### 11.2 Apply States Throughout
- **IN** `SymptomJournal.tsx`:
  - Add loading state during submission
  - Add error state if submission fails
  - Add empty state when no entries exist
  
- **IN** `PatientMessages.tsx`:
  - Add loading state when sending message
  - Add error state if send fails
  - Add empty state when no messages exist

- **IN** `PatientDetail.tsx` (oncologist side):
  - Add loading states for lab add/edit/delete
  - Add error states for lab operations
  - Add empty state when no labs exist
  - Add loading state for approve/hold actions
  - Add error states for treatment actions

---

## Data Model Changes Summary

### Patient Interface Updates
```typescript
export interface Patient {
  id: string;
  fullName: string;
  email: string;           // ← ADD THIS
  nationalId: string;      // keep for profile display
  birthDate: string;
  diagnosis: string;
  bloodType: string;
  allergies: string[];
  oncologistId: string;
  medications: Medication[];
  backgroundMedications: BackgroundMedication[];
  cycles: TreatmentCycle[];
  labResults: LabResult[];
  symptomLog: SymptomEntry[];
  // correlationInsights: string[];  ← REMOVE THIS
  radiationPhases: RadiationPhase[];
  surgeries: SurgeryCheckpoint[];
}
```

### SymptomEntry Interface Updates
```typescript
export interface SymptomEntry {
  id: string;
  date: string;
  time: string;
  temperature: number;     // ← ADD THIS (Celsius)
  nausea: number;
  fatigue: number;
  pain: number;
  vomiting: number;
  appetiteLoss: number;
  mouthSores: number;
  notes: string;
}
```

### Functions to Update
- `validatePatientLogin(email: string, password: string): Patient | null`
- `validateOncologistLogin(email: string, password: string): Oncologist | null`
- `validateRegistration(email: string): boolean`

### Functions to Remove
- `getRadiationTodayState()` - automatic fever logic
- `shiftDate()` - if only used for automatic calendar
- Any correlation/prediction functions

---

## Developer Handoff Notes

### Frontend Architecture

#### AuthContext (client/src/context/AuthContext.tsx)
**Purpose**: Single source of truth for authentication state

**Responsibilities**:
- Store logged-in user (Patient or Oncologist object)
- Store user role ('patient' | 'oncologist')
- Store JWT token from login response
- Provide `login(email, password, role)` function
- Provide `logout()` function
- Provide `isAuthenticated` boolean
- Persist token in localStorage
- Auto-logout on token expiration

**Usage**:
```typescript
const { user, role, isAuthenticated, login, logout } = useAuth();
```

#### Redux Toolkit (client/src/store/)
**Purpose**: Manage complex domain state across the app

**Slices** (client/src/store/slices/):
- `patientsSlice.ts` - patient profiles, current patient
- `symptomsSlice.ts` - symptom log entries
- `labsSlice.ts` - lab results
- `treatmentsSlice.ts` - treatment cycles, protocols
- `messagesSlice.ts` - clinical messages, physician notes
- `documentsSlice.ts` - uploaded clinical documents

**Pattern**:
```typescript
// Async thunks call API services
export const fetchSymptoms = createAsyncThunk('symptoms/fetch', async (patientId) => {
  const response = await symptomService.getByPatient(patientId);
  return response.data;
});

// Slice manages loading/error states
const symptomsSlice = createSlice({
  name: 'symptoms',
  initialState: { items: [], loading: false, error: null },
  extraReducers: (builder) => {
    builder.addCase(fetchSymptoms.pending, (state) => { state.loading = true; });
    builder.addCase(fetchSymptoms.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
  }
});
```

#### Axios Service Layer (client/src/services/)
**Purpose**: Centralized API communication

**Services**:
- `authService.ts` - login, register, logout
- `patientService.ts` - CRUD patient profiles
- `symptomService.ts` - CRUD symptom logs
- `labService.ts` - CRUD lab results
- `treatmentService.ts` - approve/hold cycles
- `messageService.ts` - send/receive messages
- `documentService.ts` - upload clinical documents (Multer)

**Pattern**:
```typescript
// services/symptomService.ts
import axios from 'axios';

const API_URL = '/api/symptoms';

export const symptomService = {
  getByPatient: (patientId) => axios.get(`${API_URL}/patient/${patientId}`),
  create: (data) => axios.post(API_URL, data),
  update: (id, data) => axios.put(`${API_URL}/${id}`, data),
  delete: (id) => axios.delete(`${API_URL}/${id}`),
};
```

**Axios Interceptors** (client/src/services/axiosConfig.ts):
- Attach JWT token to every request header
- Handle 401 unauthorized → logout
- Handle network errors globally

#### PrivateRoute Component (client/src/components/common/PrivateRoute.tsx)
**Purpose**: Protect patient and oncologist routes

**Pattern**:
```typescript
function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/404" />;
  }
  
  return children;
}

// Usage in routing:
<Route path="/patient/*" element={
  <PrivateRoute allowedRoles={['patient']}>
    <PatientLayout />
  </PrivateRoute>
} />
```

#### UploadBox Component (client/src/components/domain/UploadBox.tsx)
**Purpose**: File upload UI for clinical documents

**Multer Integration**:
```typescript
// Frontend sends FormData
const formData = new FormData();
formData.append('document', file);
formData.append('patientId', patientId);
formData.append('notes', notes);

await documentService.upload(formData);

// Backend receives with Multer
// server/routes/documents.js
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', auth, upload.single('document'), documentController.upload);
```

### Backend Architecture

#### MongoDB Collections (server/models/)

**User Model**:
```javascript
{
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['patient', 'oncologist'] },
  createdAt: Date
}
```

**PatientProfile Model**:
```javascript
{
  userId: { type: ObjectId, ref: 'User' }, // links to User via email match
  fullName: String,
  nationalId: String,
  birthDate: Date,
  diagnosis: String,
  bloodType: String,
  allergies: [String],
  assignedOncologistId: { type: ObjectId, ref: 'User' },
  medications: [{ name, dose, times, type, route }],
  backgroundMedications: [{ name, dose, frequency, condition, route }]
}
```

**SymptomLog Model**:
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile' },
  date: Date,
  time: String,
  temperature: Number, // ← critical field
  nausea: Number,
  fatigue: Number,
  pain: Number,
  vomiting: Number,
  appetiteLoss: Number,
  mouthSores: Number,
  notes: String
}
```

**LabResult Model**:
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile' },
  date: Date,
  wbc: Number,
  neutrophils: Number,
  hemoglobin: Number,
  platelets: Number,
  alt: Number,
  creatinine: Number,
  bloodPressure: String,
  weight: Number,
  temperature: Number,
  enteredBy: { type: ObjectId, ref: 'User' }, // care team member
  notes: String
}
```

**TreatmentCycle Model**:
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile' },
  cycleNumber: Number,
  startDate: Date,
  endDate: Date,
  approvalStatus: { type: String, enum: ['pending', 'approved', 'held'] },
  approvedBy: { type: ObjectId, ref: 'User' }, // oncologist
  approvalDate: Date,
  heldReason: String,
  rescheduledDate: Date,
  drugs: [String]
}
```

**Message Model**:
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile' },
  fromRole: { type: String, enum: ['patient', 'oncologist'] },
  fromUserId: { type: ObjectId, ref: 'User' },
  text: String,
  timestamp: Date,
  read: Boolean
}
```

**ClinicalDocument Model**:
```javascript
{
  patientId: { type: ObjectId, ref: 'PatientProfile' },
  uploadedBy: { type: ObjectId, ref: 'User' },
  fileName: String,
  fileUrl: String, // Multer storage path
  fileType: String,
  notes: String,
  uploadDate: Date
}
```

#### Express Routes (server/routes/)
```javascript
// routes/auth.js
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

// routes/patients.js (oncologist only)
POST /api/patients - create patient profile
GET /api/patients - list all patients
GET /api/patients/:id - get patient detail
PUT /api/patients/:id - update patient profile

// routes/symptoms.js
GET /api/symptoms/patient/:patientId - get all symptoms for patient
POST /api/symptoms - create symptom log (patient)
PUT /api/symptoms/:id - update symptom log (patient)
DELETE /api/symptoms/:id - delete symptom log (patient)

// routes/labs.js (oncologist/care-team only)
GET /api/labs/patient/:patientId - get all labs for patient
POST /api/labs - create lab result
PUT /api/labs/:id - update lab result
DELETE /api/labs/:id - delete lab result

// routes/treatments.js
GET /api/treatments/patient/:patientId - get all cycles
POST /api/treatments/approve - approve cycle (oncologist)
POST /api/treatments/hold - hold cycle (oncologist)

// routes/messages.js
GET /api/messages/patient/:patientId - get messages
POST /api/messages - send message
PUT /api/messages/:id/read - mark as read

// routes/documents.js (oncologist only)
POST /api/documents/upload - upload file (Multer)
GET /api/documents/patient/:patientId - list documents
DELETE /api/documents/:id - delete document
```

#### Middleware (server/middleware/)
- `auth.js` - verify JWT token, attach user to req.user
- `roleCheck.js` - verify user role (oncologist, patient)
- `validation.js` - JOI schema validation for request bodies
- `errorHandler.js` - centralized error handling
- `multer.js` - file upload configuration (PDF, DOCX, JPG, max 10MB)

### API-Ready Actions Designed

**Patient Actions**:
- Register account (POST /api/auth/register)
- Login with email+password (POST /api/auth/login)
- Create symptom log with temperature (POST /api/symptoms)
- Edit symptom log (PUT /api/symptoms/:id)
- Delete symptom log (DELETE /api/symptoms/:id)
- Send message to oncologist (POST /api/messages)
- View read-only lab results (GET /api/labs/patient/:patientId)
- View treatment cycles (GET /api/treatments/patient/:patientId)

**Oncologist Actions**:
- Login with email+password (POST /api/auth/login)
- Create patient medical profile (POST /api/patients)
- Add lab result (POST /api/labs)
- Edit lab result (PUT /api/labs/:id)
- Delete lab result (DELETE /api/labs/:id)
- Manually approve treatment cycle (POST /api/treatments/approve)
- Manually hold treatment cycle with reason (POST /api/treatments/hold)
- Reply to patient message (POST /api/messages)
- Upload clinical document (POST /api/documents/upload with Multer)

### No Automatic Medical Logic

**Explicitly Removed**:
- ❌ No automatic fever postponement
- ❌ No calendar shifting based on temperature
- ❌ No correlation insights between meds and symptoms
- ❌ No predictive safety engine
- ❌ No hypothesis evaluation panels
- ❌ No system-generated treatment approval
- ❌ No automatic treatment hold
- ❌ No AI recommendations

**Manual Workflows Only**:
- ✅ Temperature is logged by patient → displays visually with TemperatureBadge
- ✅ Oncologist manually reviews temperature readings
- ✅ Oncologist manually decides to approve or hold treatment
- ✅ Oncologist manually enters hold reason and reschedule date
- ✅ System provides data visualization only, not decisions

---

## Performance Verification

After implementing lazy loading and memoization:

1. **Verify Lazy Loading**:
   - Open browser DevTools → Network tab
   - Navigate between pages
   - Confirm separate JavaScript chunks load on demand (chunk-[name].js)
   - Verify LoadingSpinner appears briefly during page transitions

2. **Verify Memoization**:
   - Install React DevTools browser extension
   - Enable "Highlight updates when components render"
   - Scroll through lists (symptoms, messages, lab results)
   - Confirm individual cards don't re-render when parent updates
   - Toggle selections/filters - only affected items should highlight

3. **Test Re-render Prevention**:
   - Log renders in memoized components: `console.log('TreatmentCard render', cycle.id)`
   - Perform actions that don't affect specific cards
   - Confirm those cards don't log re-renders

4. **Check Bundle Size**:
   - Run production build (vite build)
   - Check dist/ folder for chunk sizes
   - Main bundle should be small (~50-100KB)
   - Page chunks should be separate (dashboard, cycles, journal, etc.)

---

## Verification Steps

After implementation:

1. **Test Authentication Flow**:
   - Register new patient with email+password
   - Login as patient with email+password
   - Login as oncologist with email+password
   - Verify no nationalId/fullName in login forms

2. **Test Patient Portal Navigation**:
   - Verify exactly 5 pages accessible
   - Verify patient-calendar, patient-bloodwork, patient-medications routes removed
   - Test navigation between all 5 pages

3. **Test Symptom Journal**:
   - Create new symptom entry with temperature field
   - Verify temperature validation (34-42.5°C)
   - Edit existing symptom entry
   - Delete symptom entry with confirmation
   - Verify TemperatureBadge shows correctly
   - Verify elevated temp (≥38°C) shows visual flag only (no automation)

4. **Test Patient Dashboard**:
   - Verify SafetyNotice appears
   - Verify Today card shows medications
   - Verify no radiation temperature gate blocks anything
   - Verify no automatic fever logic
   - Verify no correlation insights
   - Verify quick access cards navigate correctly

5. **Test Treatment Cycles**:
   - Verify timeline shows chemo, radiation, surgery
   - Verify "You Are Here" marker on active cycle
   - Verify On Hold status shows (manual oncologist action)
   - Verify no automatic calendar displacement text

6. **Test Messages**:
   - Verify SafetyNotice appears
   - Send message as patient
   - Reply as oncologist
   - Verify loading states
   - Verify empty state when no messages

7. **Test Profile Page**:
   - Verify email field appears
   - Verify national ID appears (read-only)
   - Verify consolidated medications registry shows all meds
   - Verify blood type color coding
   - Verify allergy warnings with AVOID badges

8. **Test Oncologist Portal**:
   - Click "Add Patient" button (verify modal/drawer opens)
   - Create new patient profile with all required fields
   - View patient detail
   - Add new lab result
   - Edit lab result
   - Delete lab result
   - Manually approve treatment cycle
   - Manually hold treatment cycle with reason
   - Verify no automatic approval logic
   - Verify temperature readings from symptom logs display

9. **Verify Files Deleted**:
   - Confirm TreatmentCalendar.tsx does not exist
   - Confirm MyMedications.tsx does not exist
   - Confirm BloodWork.tsx does not exist

10. **Verify No Automatic Logic Remains**:
    - Search codebase for "automatic", "fever postpone", "correlation", "predictive"
    - Verify temperature badge is visual only
    - Verify all treatment actions require manual oncologist input

---

## Visual Identity Preservation

All changes maintain the existing design system:
- **Background**: Warm cream (#FAF8F5)
- **Primary**: Sage green (#7CAE8E)
- **Accent colors**: 
  - Soft mint (#D1FAE5) - success, approved states
  - Soft blue (#DBEAFE) - info, upcoming states
  - Soft amber (#FEF9C3) - warning, pending states
  - Soft red (#FEE2E2) - error, held states, allergies
  - Soft purple (#EDE9FE) - chemotherapy treatments
- **Cards**: Rounded corners (border-radius: 1rem-2rem)
- **Shadows**: Gentle, subtle drop shadows
- **Layout**: Clean medical dashboard style with breathing room
- **Pattern**: Subtle crab/cancer zodiac watermark via RibbonBackground component
- **Tone**: Calm, supportive, trustworthy healthcare aesthetic
- **Typography**: Nunito font family throughout
- **Icons**: Lucide React icon library
- **Badges**: Pill-shaped status indicators with soft colors

**Design Consistency**:
- All buttons use rounded-xl styling
- All input fields use rounded-xl with sage green focus state
- All cards use 2px solid borders with soft accent colors
- All sections use consistent padding (p-4, p-5)
- All text follows hierarchy: h2 for section titles, text-sm for body, text-xs for hints
- All interactive elements have hover:opacity-90 states

---

## Notes

- This redesign removes ~30% of code complexity
- Reduces from 8 patient pages to 5 core pages
- Eliminates all automatic medical decision logic
- Prepares for realistic MERN stack implementation
- Maintains professional medical UI/UX standards
- All manual workflows align with realistic clinical practice
- Future backend can be built with MongoDB, Express, JWT, bcrypt, JOI validation, Multer uploads
