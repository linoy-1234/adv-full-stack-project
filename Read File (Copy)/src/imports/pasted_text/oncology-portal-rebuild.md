I want to rebuild the Oncologist Portal and fix the project data flow.

Keep the existing Onco+Log visual identity:
- warm cream background
- sage green primary color
- soft mint / blue / amber / red cards
- rounded medical cards
- soft shadows
- subtle crab/cancer watermark
- calm professional oncology dashboard style

Do not redesign the brand from scratch.
Do not add medical automation, AI recommendations, predictive logic, fever-based postponement, calendar shifting, or automatic treatment decisions.

The goal is to make the app more realistic and backend-ready.

Core roles:
1. Patient
2. Oncologist
3. Lab Staff

Important role ownership:
- The Oncologist owns and edits the patient medical profile, diagnosis, blood type, allergies, medications, treatment protocol, treatment dates, and treatment decisions.
- The Lab Staff only enters/manages blood test results.
- The Patient only views clinical data, sends messages, uploads symptom logs if available, and views documents/results.

The patient should never create their own diagnosis, protocol, allergies, medications, blood type, or treatment schedule.

Patient registration flow:
The Oncologist creates the Patient Medical Profile first, including the patient email.
Then the Patient registers with that same email.
The future backend links the Patient User account to the existing PatientProfile by matching email.

If a patient tries to register with an email that does not have a PatientProfile, show:
“Your medical profile has not been created by your oncologist yet.”

Oncologist Portal — rebuild this clearly:

1. Oncologist Dashboard

The oncologist should see only the patients assigned to them / created by them.

Dashboard should include:
- Patient directory table
- Add Patient / Create Medical Profile button
- compact status indicators, not large alert panels

Patient table columns:
- Patient name
- Email
- Diagnosis
- Current treatment status
- Account status
- Pending action

Account status badges:
- Patient account linked
- Waiting for patient registration

Pending action badges:
- Waiting for labs
- Labs received
- Cycle ready for review
- Unread message
- Treatment delayed

Use small dots/badges, not large medical warning banners.

2. Add Patient / Create Medical Profile

This is the main way the Oncologist creates the patient profile.

Create a modal/drawer/form with:
- Full name
- Email
- National ID
- Date of birth
- Diagnosis
- Blood type
- Allergies
- Assigned oncologist
- Current medications
- Treatment protocol name
- Treatment types included:
  - chemotherapy
  - radiation
  - surgery checkpoint
  - supportive medication
- Chemotherapy cycles
- Radiation schedule if relevant
- Surgery checkpoint if relevant
- Notes

After creating the profile, the patient appears in the Oncologist Dashboard.

Show account status:
“Waiting for patient registration”

After the patient registers with the same email, status becomes:
“Patient account linked”

3. Oncologist Patient Detail / Clinical Workspace

Rebuild this page so it is clean, logical, and editable in the correct places.

Page sections:

A. Patient summary card
Show:
- Full name
- Email
- National ID
- Date of birth
- Diagnosis
- Blood type
- Allergies
- Assigned oncologist

Add pencil icon / Edit Medical Profile button near this section.

Edit Medical Profile should allow editing:
- full name
- email
- national ID
- date of birth
- diagnosis
- blood type
- allergies
- assigned oncologist
- notes

Show source label:
“Created by oncologist”

Show metadata:
“Last updated by Dr. Miriam Goldstein”
“Updated on [date]”

B. Medication Plan

Add a clear Medication Plan section.

Important:
The medications that the Patient sees must come from what the Oncologist entered.

The Oncologist can add/edit/remove medications.

Medication fields:
- medication name
- dose
- route
- frequency
- timing / days
- category:
  - chemotherapy
  - supportive
  - chronic/background
- notes

Add pencil icon / Edit Medication Plan button near this section.

Patient side should show medications as read-only.

Add source label:
“Medication list created by your oncologist”

C. Treatment Protocol

The Oncologist creates and edits the protocol.

Show:
- protocol name
- diagnosis
- treatment types included
- chemotherapy cycles
- radiation course if relevant
- surgery checkpoint if relevant
- treatment drugs/medications
- notes

Add pencil icon / Edit Treatment Protocol button near this section.

Show:
“Treatment protocol managed by oncologist”

Show metadata:
“Last updated by Dr. Miriam Goldstein”
“Updated on [date]”

D. Treatment Dates / Roadmap

The Oncologist creates and edits treatment dates.

Show a clean visual roadmap/timeline generated from the treatment protocol data.

Each treatment item can be:
- chemotherapy cycle
- radiation course
- surgery checkpoint
- supportive medication item

Each item should show:
- title
- type
- planned date / start date / end date
- status
- notes if relevant

Add pencil icon / Edit Treatment Dates button near this section.

Edit Treatment Dates should allow editing:
- chemotherapy cycle dates
- radiation start date
- radiation end date
- number of radiation sessions
- surgery checkpoint date
- notes

Do not create automatic scheduling logic.
All date changes are manual Oncologist edits.

E. Chemotherapy approval / delay workflow

For chemotherapy cycles only, allow manual approval or delay by the Oncologist.

If no Lab Result exists for the cycle:
Show:
“Waiting for lab results”

Do not show Approve / Delay buttons yet.

If Lab Result exists for the cycle:
Show:
“Ready for oncologist review”

Then show:
- Approve Cycle
- Delay Cycle

If Approve is clicked:
- status becomes Approved
- show approved date
- show approved by oncologist

If Delay is clicked:
Open inline panel/modal with:
- reason textarea
- new planned date input
- Confirm Delay
- Cancel

After confirming:
- status becomes Delayed
- show “Delayed to: [date]”
- show “Reason: [reason]”

This must be a manual Oncologist decision only.
No automatic approval.
No automatic delay.

F. Lab Results section inside Oncologist Patient Detail

The Oncologist should see lab results, but not enter them here.

Section title:
“Lab Results — Lab Staff Entry”

Helper text:
“Lab results are entered by Lab Staff and displayed here for oncologist review.”

Show:
- latest lab result
- lab history
- trend chart if already available

Fields to display:
- date
- WBC
- neutrophils
- hemoglobin
- platelets
- ALT
- creatinine
- notes
- entered by
- entered at

Do not show Add/Edit/Delete lab controls inside the Oncologist Patient Detail page.

The Oncologist only reviews lab results here.

G. Messages & Documents

Unify messages and document sending into one communication area.

Replace separate “Patient Questions”, “Physician Direct Notes”, and “Upload Clinical Summary” areas with one section:

“Messages & Documents”

This should work like a chat.

The Patient can:
- send messages
- view messages from the Oncologist
- view/download attached documents

The Oncologist can:
- send messages
- reply to patient messages
- attach files to a message

Supported attachment types:
- PDF
- DOCX
- JPG
- PNG

Attachment UI:
- file name
- file type
- upload date
- View / Download button

This prepares the project for future Multer file upload.

Message object should support:
- text
- sender
- senderRole
- patientId
- attachments
- createdAt
- read/unread status

Oncologist Dashboard should show a small unread message dot if the patient sent a new message.

4. Lab Staff Portal

Add a small, focused Lab Staff Portal.

Do not make it complex.

Lab Staff can only:
- log in
- view existing patients
- search/filter patients
- enter lab results
- edit lab results
- delete lab results if needed

Lab Staff cannot:
- create patients
- edit medical profile
- edit diagnosis
- edit allergies
- edit medications
- edit treatment protocol
- edit treatment dates
- approve or delay treatment
- send messages to patients
- upload oncologist documents

Lab Staff Dashboard:
- patient list
- search by name/email/national ID
- button: Enter Lab Results

Enter Lab Results form:
- patient
- date
- WBC
- neutrophils
- hemoglobin
- platelets
- ALT
- creatinine
- notes

Show:
“Entered by Lab Staff”
“Entered on [date]”

When Lab Staff saves lab results:
- the results appear in the Oncologist Patient Detail page
- the results appear in the Patient Blood Work page
- if the lab result is linked to a chemotherapy cycle, that cycle becomes “Ready for oncologist review”

5. Patient Portal updates

A. Restore Patient Blood Work page

Add back a separate Patient Blood Work / Lab Results page.

Patient can only view lab results.
Patient cannot add/edit/delete lab results.

Patient Blood Work page should show:
- latest lab result
- lab history
- WBC
- neutrophils
- hemoglobin
- platelets
- ALT
- creatinine
- date
- entered by Lab Staff
- simple trend chart if available

Add source label:
“Lab results entered by Lab Staff”

B. Remove latest lab results from Treatment Protocol Roadmap

The Patient Treatment Protocol Roadmap page should focus only on treatment:
- treatment cycles
- radiation course if relevant
- surgery checkpoint if relevant
- treatment statuses
- You Are Here
- Approved / Delayed / Upcoming / Completed

Do not show latest lab results inside Treatment Protocol Roadmap.

C. Patient Dashboard “What are we doing today?”

Keep the Patient Dashboard “Today” section.

But make it clear that the content comes from the Oncologist’s treatment schedule.

Add label:
“Today’s plan is based on your oncologist’s treatment schedule.”

The dashboard should derive today’s plan from:
- treatment dates entered by the Oncologist
- medication plan entered by the Oncologist
- treatment statuses entered by the Oncologist

Show:
- today’s treatment if scheduled
- today’s medications
- next upcoming treatment if no treatment today
- latest unread message/document if relevant

Do not make this AI-based.
This is only date-based display from existing treatment and medication data.

D. Patient Profile

Patient Profile should be read-only.

Show:
- personal details
- diagnosis
- blood type
- allergies
- medication plan
- assigned oncologist
- treatment protocol summary

Add source labels:
- “Profile managed by your oncologist”
- “Medication list created by your oncologist”
- “Treatment protocol managed by your oncologist”

6. Navigation updates

Patient navigation should include:
- Dashboard
- Treatment Roadmap
- Blood Work
- Symptoms / Journal if already included
- Messages & Documents
- My Profile

Oncologist navigation should include:
- Dashboard
- Patients

Lab Staff navigation should include:
- Dashboard
- Enter Lab Results / Patients

7. Data ownership labels

Add small source labels across the UI:

For patient profile:
“Created by oncologist”

For medications:
“Medication list created by your oncologist”

For treatment protocol:
“Treatment protocol managed by oncologist”

For treatment dates:
“Treatment schedule managed by oncologist”

For lab results:
“Lab results entered by Lab Staff”

For dashboard today plan:
“Based on your oncologist’s treatment schedule”

8. Metadata

Add metadata where useful:
- Last updated by
- Updated on
- Entered by
- Entered on

Examples:
- “Last updated by Dr. Miriam Goldstein”
- “Updated on 05 Jun 2026”
- “Entered by Lab Staff”
- “Entered on 05 Jun 2026”

9. Remove old broken logic

Remove or avoid:
- “1 Jan 1970”
- “Authorization unlocks on scheduled clinic date”
- “authorization locked”
- automatic medical alerts
- automatic treatment scheduling
- automatic treatment approval
- automatic treatment delay
- predictive safety engine
- correlation insights
- fever-based workflow

If a date is missing, show:
“No date scheduled”

Do not render invalid fallback dates.

10. Backend readiness

Design/code should be ready for these future MongoDB collections:
- User
- PatientProfile
- TreatmentProtocol
- TreatmentItem / TreatmentCycle
- Medication
- LabResult
- Message
- ClinicalDocument
- SymptomLog if already included

Role-based access:
- patient
- oncologist
- lab_staff

Future backend behavior:
- Oncologist creates PatientProfile
- Patient registers and links to PatientProfile by email
- Oncologist creates/edits protocol, medications, treatment dates
- Lab Staff creates/edits/deletes LabResults
- Patient views labs read-only
- Oncologist views labs read-only and approves/delays treatment manually
- Patient and Oncologist communicate through Messages & Documents
- Oncologist can attach files to messages for future Multer upload

11. Keep scope controlled

Do not add:
- full hospital EMR
- nurse portal
- admin portal
- medical AI
- complex lab integrations
- automatic decision engines
- calendar automation

Only rebuild what is needed for:
- clear role ownership
- realistic data flow
- editable oncologist-created clinical data
- lab-staff-entered blood tests
- patient read-only clinical view
- manual oncologist treatment approval/delay
- unified messages with attachments

Please apply these changes to the actual screens/code, not only to the plan.