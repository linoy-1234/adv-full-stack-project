Update and simplify my existing Onco+Log Figma project.

Do not redesign the visual identity from scratch. Keep the current calm oncology visual style:

* Warm cream background.
* Sage green main color.
* Soft mint, soft blue, soft amber, soft red, and soft purple accent cards.
* Rounded cards.
* Gentle shadows.
* Clean medical dashboard layout.
* Subtle crab / cancer zodiac background pattern as a very light professional watermark.
* Calm, supportive, trustworthy healthcare feeling.

The goal is to reduce the current oversized medical platform into a realistic Advanced Full Stack final project that I can actually implement with:

Frontend:

* React SPA
* React Router
* Axios
* Context API for authentication/session
* Redux Toolkit for complex domain state
* Form validation
* Loading and error states
* Lazy loading and memoization later in code

Backend later:

* Node.js
* Express
* MongoDB
* Mongoose
* JWT authentication
* bcrypt password hashing
* JOI validation
* Multer file upload
* Protected routes
* REST API with CRUD
* Clean MVC folder structure

Important product direction:
Onco+Log is not a medical decision system.
It is a treatment coordination portal for oncology patients and oncology care teams.

The system should help:

* Patients view their treatment plan, daily schedule, profile, labs, and messages.
* Patients log symptoms and temperature.
* Oncologists / care team members create patient profiles, assign treatment protocols, review lab results, view symptoms, communicate with patients, upload clinical documents, and manually approve or hold treatment cycles.

The system must NOT:

* Make automatic treatment decisions.
* Automatically approve or hold treatment.
* Automatically postpone treatment based on fever.
* Shift calendars automatically.
* Generate medical predictions.
* Show medical AI recommendations.
* Show correlation insights between medication and symptoms.
* Use a predictive safety engine.
* Use “Hypothesis Evaluation” as a decision-making tool.
* Act like a hospital lab system or full hospital EMR.

Elevated temperature can be visually flagged, but it must never trigger automatic clinical actions.

Core realistic data flow:
The oncologist or care team creates a patient medical profile first.
The profile includes:

* Patient full name
* Email
* National ID
* Diagnosis
* Blood type
* Allergies
* Assigned oncologist
* Treatment protocol
* Current medications

Then the patient can register/login with email and password and becomes linked to the existing clinical profile.

Do not design the system as if the patient freely chooses their cancer diagnosis or protocol during registration.

Demo data can exist in the UI and later as MongoDB seed data, but the final implementation should be ready for real MongoDB collections and real API calls.

Recommended MongoDB collections for the future implementation:

* User
* PatientProfile
* TreatmentProtocol
* TreatmentCycle
* LabResult
* SymptomLog
* Message
* ClinicalDocument

Keep the design aligned with these future data objects.

Authentication screens:
Create / update these public screens:

1. Landing Page

* Warm welcome hero.
* Onco+Log logo.
* Short explanation:
  “A calm treatment coordination portal for oncology patients and care teams.”
* Two clear CTA buttons:

  * Log In
  * Register
* Keep the existing calm card-based design.

2. Login Page

* Segmented toggle:

  * Patient
  * Oncologist
* Both roles use:

  * Email
  * Password
* Remove National ID from login.
* Remove Full Name from login.
* National ID appears only inside the patient profile.
* Show demo credentials in a small hint card if needed.
* Add validation UI:

  * Valid email required.
  * Password required.
  * Friendly error message area.
  * Loading state on submit.

3. Register Page
   Register is mainly for patients.
   Fields:

* Full Name
* Email
* Password
* Confirm Password
  Optional explanation:
  “Your care team must create your medical profile before full portal access is available.”

After registration, patient account should be connected to an existing patient profile by matching email in the future backend.

Do not ask the patient to choose cancer type or treatment protocol during registration.

4. Not Found Page

* Calm centered 404 card.
* Button back to home.

Patient Portal:
The patient portal should contain exactly these 5 main pages:

1. Patient Dashboard
2. Treatment Cycles
3. Symptom Journal
4. Messages
5. My Profile

Patient navigation menu:

* Dashboard
* Treatment Cycles
* Symptom Journal
* Messages
* My Profile

Patient Dashboard:
This should be the patient’s calm daily home screen.

Include:

* SafetyNotice near the top:
  “This portal is not for emergencies. For urgent symptoms, contact your care team or emergency services.”
* “Today” card:

  * Current date.
  * Current cycle / treatment summary.
  * Today’s oncology treatment medications.
  * Supportive medications.
  * Checklist-style layout.
* Mini treatment timeline:

  * 5 treatment cycles.
  * Completed / active / upcoming.
  * Active cycle highlighted.
* Latest lab preview:

  * WBC
  * Neutrophils
  * Hemoglobin
  * Platelets
  * Normal / low / high status badges.
* Quick access cards:

  * Treatment Cycles
  * Symptom Journal
  * Ask Oncologist
  * My Profile

Remove from dashboard:

* Calendar page logic.
* Automatic treatment shifting.
* Fever postponement engine.
* Correlation insights.
* Predictive safety engine.

Treatment Cycles Page:
Keep the clean vertical roadmap style, but simplify the logic.

Show:

* Protocol name.
* Diagnosis.
* Current cycle.
* Treatment cycle cards.
* Completed cycles.
* Active cycle with “You Are Here”.
* Upcoming cycles.
* On Hold status only if an oncologist manually placed it on hold.
* Approved status only if an oncologist manually approved it.

The protocol can include several treatment item types such as:

* Chemotherapy
* Radiation
* Surgery checkpoint
* Supportive medication

But keep them under one simple unified protocol/timeline model.
Do not create separate complex scheduling engines for chemotherapy, radiation, and surgery.

Do not include:

* Automatic calendar displacement.
* Automatic fever-based rescheduling.
* System-generated treatment approval.
* Predictive treatment safety indicator.

Symptom Journal Page:
This page must support clear CRUD-ready symptom logs.

Form fields:

* Date
* Time
* Temperature in Celsius
* Symptom buttons:

  * Nausea
  * Fatigue
  * Pain
  * Vomiting
  * Appetite Loss
  * Mouth Sores
  * Other
* Severity scale 1–10
* Notes textarea
* Submit button

Validation UI:

* Date cannot be in the future.
* Time is required.
* Temperature must be numeric and reasonable, for example 34.0–42.5°C.
* Severity must be 1–10.
* Patient must select at least one symptom or write a note.

History list:

* Show previous symptom entries.
* Each entry has:

  * Edit
  * Delete
* Edit fills the form with existing data.
* Delete shows confirmation.
* Include loading and error states.

TemperatureBadge:

* Normal temperature: calm mint/green badge.
* Temperature 38°C or higher: amber/red visual flag.
* Text:
  “Elevated temperature — please notify your care team.”
* This visual flag does not trigger automatic decisions.

Remove:

* Correlation Insights.
* System Analysis.
* Hypothesis Evaluation.
* Medical prediction text.

Messages Page:
Keep the clinical communication hub.

Include:

* Emergency warning banner:
  “This portal is not for emergencies. For urgent symptoms, contact your care team or emergency services.”
* Doctor note card.
* Chat-style conversation.
* Patient messages in soft green bubbles.
* Doctor/care team messages in white cards.
* Message input.
* Send button.
* Loading state while sending.
* Friendly empty/error states.

My Profile Page:
This should be a clean read-only patient profile.

Include:

* Full name
* Email
* National ID
* Date of birth
* Diagnosis
* Assigned oncologist
* Blood type
* Drug allergies with red warning styling and AVOID badges
* Treatment protocol summary
* Current Medications List

Current Medications List:
A single consolidated medication registry showing every regular medication the patient takes.

Sections:

* Oncology treatment medications
* Supportive oncology medications
* Chronic/background medications

Each medication card should show:

* Medication name
* Dose
* Route
* Frequency / timing
* Category badge

This is read-only for the patient.
No patient-side medication editing.

Oncologist Portal:
The oncologist portal should contain:

1. Oncologist Dashboard
2. Patient Detail / Clinical Workspace

Oncologist navigation:

* Dashboard
* Patients

Oncologist Dashboard:
Include:

* Clinical notifications card.
* Active patient directory table.
* Add Patient / Create Medical Profile button.
* Patient rows navigate to Patient Detail.

Patient table columns:

* Patient
* Diagnosis
* Current Status
* Pending Action

Add Patient / Create Medical Profile:
Design this as a modal, drawer, or compact setup screen.
It should allow the oncologist/care team to create the patient’s medical profile.

Fields:

* Full name
* Email
* National ID
* Date of birth
* Diagnosis
* Blood type
* Allergies
* Assigned oncologist
* Initial protocol name
* Number of cycles
* Notes

This supports the realistic flow:
The care team creates the medical profile first, then the patient registers and is linked by email.

Patient Detail / Clinical Workspace:
This is the main professional oncologist screen.

Include these sections:

1. Back button.

2. SafetyNotice:
   “This portal is not for emergencies. For urgent symptoms, contact your care team or emergency services.”

3. Patient summary header:

* Patient name
* Email
* National ID
* Diagnosis
* Current cycle
* Blood type
* Allergies
* Assigned oncologist

4. Treatment Protocol Summary:

* Protocol name
* Total cycles
* Current status
* Simple readable overview.

5. Treatment Protocol & Authorization:

* Timeline of cycles.
* Current/next cycle has manual actions:

  * Approve Next Cycle
  * Hold Treatment
* Hold opens inline panel:

  * Hold reason textarea
  * Rescheduled date input
  * Confirm button
* This is always a manual oncologist action.
* No automatic approval/hold logic.

6. Lab Results Management — Care Team Entry:
   Do not frame this as “the oncologist manually enters every lab in real life”.
   Label it as care team / clinical staff entry.

This section should include:

* Latest blood work card.
* Add lab result.
* Edit lab result.
* Delete lab result.

Fields for lab result:

* Date
* Metric name
* Value
* Unit
* Status: normal / low / high / critical
* Optional note

This will be one of the main CRUD areas in the future backend.

7. Trend Analysis Chart:
   Show a simple line chart for:

* WBC
* Neutrophils
* Hemoglobin

This is only visual trend display.
No medical prediction.

8. Pre-Treatment Vitals:

* Blood pressure
* Weight
* Temperature
* Temperature uses TemperatureBadge.

9. Recent Temperature Readings:

* Read from patient symptom logs.
* Show latest temperature values with dates.
* Use TemperatureBadge.
* No automatic clinical action.

10. Symptom Journal History:

* Read-only list of patient symptom logs.
* Include date, symptoms, severity, temperature, notes.

11. Patient Questions:

* Incoming patient questions/messages.
* Reply textarea.
* Send button.
* Loading/error states.

12. Physician Direct Notes:

* Notes textarea.
* UploadBox for clinical summary / treatment documentation.
* PDF / DOCX / JPG hint.
* This should be designed as a future Multer upload target.
* Upload is independent from treatment approval.
* Broadcast / Save note button.

Remove from oncologist workspace:

* System Correlation Analysis.
* Automated fever mirroring.
* Automatic treatment postponement.
* Predictive clinical engine.
* Calendar shift system.
* Text implying that the system decides if treatment is safe.

Shared UI components to reflect in design:

* Logo
* SafetyNotice
* LoadingSpinner
* ErrorMessage
* EmptyState
* PrivateRoute / protected route behavior concept
* BackButton
* StatusBadge
* AppHeader
* SideDrawer
* AppShell
* PublicShell
* Button
* Card
* Input
* Textarea
* Badge
* Toggle
* LabResultCard
* TreatmentCard
* SymptomButton
* SymptomEntryCard
* MessageBubble
* PatientTable
* UploadBox
* TimelineDot
* SeverityScale
* TemperatureBadge

Important UI states:
Create visual states for:

* Loading login/register.
* Login/register error.
* Empty symptom history.
* Empty messages.
* Empty lab history.
* Lab save loading/error.
* Symptom save loading/error.
* Message send loading/error.
* Approve/Hold loading/error.
* 404 page.

Accessibility and responsiveness:

* Use readable font sizes.
* Clear labels for forms.
* Good color contrast.
* Keyboard-friendly controls.
* Responsive layout for desktop and mobile.
* Avoid tiny text.
* Avoid overcrowding.

Design cleanup:

* Remove unused/extra screens.
* Remove calendar screens.
* Remove separate medications page.
* Remove separate blood-work page for patient.
* Remove profile editing.
* Remove medical AI screens.
* Remove predictive/hypothesis/correlation panels.
* Keep the interface focused and buildable.

Future implementation folder structure:
If code structure is needed later, align the design with this frontend structure:

src/
assets/
components/
common/
layout/
ui/
domain/
pages/
auth/
patient/
oncologist/
context/
store/
slices/
services/
hooks/
utils/
data/
App.jsx
main.jsx
styles.css

Future backend structure:
server/
controllers/
models/
routes/
middleware/
config/
utils/
uploads/
app.js
server.js

Future state management rule:

* AuthContext manages logged-in user, role, token, login, logout.
* Redux manages domain data:

  * patient profiles
  * symptoms
  * labs
  * treatments
  * messages
  * documents

Future API-ready actions:
The design should support these actions:

* Register user
* Login user
* Oncologist creates patient profile
* Oncologist assigns / edits treatment protocol
* Patient creates symptom log
* Patient edits symptom log
* Patient deletes symptom log
* Patient sends message
* Oncologist replies to message
* Care team adds lab result
* Care team edits lab result
* Care team deletes lab result
* Oncologist approves treatment cycle
* Oncologist holds treatment cycle with reason and rescheduled date
* Oncologist uploads clinical document

Final design goal:
Create a smaller, realistic, professional oncology treatment coordination portal that keeps the current visual style but removes unbuildable medical automation. The final product should clearly support a real full-stack implementation with MongoDB, Express, JWT auth, CRUD, Context, Redux, Multer upload, loading states, error states, protected routes, and deployment.
