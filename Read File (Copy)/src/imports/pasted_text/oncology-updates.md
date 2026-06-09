The visual style is good, but the oncologist side still contains automation and unclear clinical ownership that we need to remove.

Please apply these corrections to the actual code/screens, not only to the plan.

1. Keep the current visual identity:
- warm cream background
- sage green primary color
- rounded cards
- soft shadows
- subtle crab/cancer watermark
- calm professional medical dashboard style

Do not redesign the visual style from scratch.

2. Remove all remaining fever-based treatment automation.

Delete/remove from the UI and logic:
- “Fever postponement recorded”
- “Recovery check in progress”
- “24-hour fever-free loop”
- “End date shifted”
- “Radiation Postponed — Fever Alert”
- any automatic radiation postponement
- any automatic calendar shifting
- any fever-based rescheduling logic

Temperature must never automatically change chemotherapy, radiation, surgery, or treatment dates.

3. Keep temperature only as a data point, not as treatment logic.

In the Patient Symptom Journal, keep temperature as an OPTIONAL field:
“Patient-reported temperature (optional)”

If temperature is 38°C or higher, show only a visual badge:
“Elevated temperature — please contact your care team.”

Do not trigger any automatic treatment action.

On the oncologist side, show patient-reported temperatures only in:
- Recent Temperature Readings
- Symptom Journal History

Use TemperatureBadge, but no automation.

4. Fix the 1 Jan 1970 bug everywhere.

The UI must never show:
“1 Jan 1970”

Do not use Date(0), invalid fallback dates, or empty date conversions.

If no date exists, show:
“No date scheduled”
or:
“No pre-treatment lab result entered yet.”

For treatment cycles, show only real planned dates from the treatment data.

5. Clarify lab result ownership.

The lab section should be called:

“Lab Results & Pre-Treatment Vitals — Care Team Entry”

or:

“Lab Results Management — Clinical Staff / Care Team Entry”

The wording should make clear that lab data is normally entered by clinical staff / care team / lab workflow, not personally typed by the oncologist.

Keep Add/Edit/Delete for project CRUD, but label actions clearly:
- Add Lab Result — Care Team Entry
- Edit Lab Result
- Delete Lab Result

In the lab form, include:
- Date
- WBC
- Neutrophils
- Hemoglobin
- Platelets
- ALT
- Creatinine
- Blood Pressure
- Weight
- Clinic Temperature
- Optional note
- Source / Entered by: Clinical Staff / Care Team

This is still acceptable for the project because it represents care-team data entry.

6. Keep patient lab visibility read-only.

The patient should only see read-only lab preview:
- WBC
- Neutrophils
- Hemoglobin
- Platelets

The patient must not add/edit/delete labs.

7. Add clear oncologist/care-team editing for patient medical profile and protocol.

The oncologist/care team is responsible for creating and editing:
- patient medical profile
- diagnosis
- allergies
- blood type
- current medications
- assigned oncologist
- treatment protocol
- cycle dates
- radiation dates
- surgery checkpoints if relevant

Add buttons in the oncologist workspace:
- Edit Medical Profile
- Edit Treatment Protocol
- Edit Treatment Dates

These can open modal/drawer forms.

8. Treatment protocol editing should be manual.

The treatment protocol editor should allow manual editing of:
- protocol name
- diagnosis
- treatment item type:
  - chemotherapy
  - radiation
  - surgery checkpoint
  - supportive medication
- title
- start date
- end date or planned date
- drugs / medication names
- number of radiation sessions if relevant
- status:
  - planned
  - active
  - completed
  - approved
  - on hold
- notes

Do not create automatic scheduling engines.

9. Chemotherapy authorization workflow:

Approve / Hold should be used for chemotherapy cycles.

Correct flow:

A. If no pre-treatment lab result exists for the cycle:
Show:
“Waiting for pre-treatment lab results”
and:
“Care team must enter lab results before oncologist review.”

Do not show active Approve / Hold buttons.

B. After lab results exist for the cycle:
Show:
“Ready for oncologist review”

Then show:
- Approve Next Cycle
- Hold Treatment

C. If Approve is clicked:
- status becomes Approved
- show approved date
- show approved by oncologist

D. If Hold Treatment is clicked:
Open inline panel:
- Hold reason textarea
- Rescheduled date input
- Confirm Hold
- Cancel

After confirm:
- status becomes On Hold
- show hold reason
- show rescheduled date

All decisions are manual oncologist actions only.

10. Radiation workflow:

Radiation should NOT be automatically postponed by fever.

Radiation dates are part of the treatment protocol and can be manually edited by the oncologist/care team.

For radiation cards, show:
- radiation title
- target area if available
- start date
- end date
- sessions completed / total sessions
- status

Add manual option:
- Edit Radiation Schedule

Do not show fever postponement blocks inside radiation cards.

11. Replace big automated clinical alerts with simple attention indicators.

Remove large Clinical Notifications that are caused by automatic fever/radiation logic.

Instead, use small red dot indicators or compact badges for:
- unread patient message
- cycle ready for oncologist review
- missing pre-treatment labs
- held treatment cycle

Patient directory rows can show:
- red dot for unread message
- amber badge for waiting for labs
- green badge for stable/active
- red/amber badge for on hold

Do not show automatic medical warning narratives.

12. Keep Trend Analysis neutral.

Use wording:
“Reference ranges”
or:
“Clinical reference lines”

Do not use:
“Safe minimums”
or wording that implies the system decides if treatment is safe.

The chart is visual only.

13. Oncologist workspace section order should be:

- SafetyNotice
- Patient summary
- Patient Medical Profile actions: Edit Profile / Edit Protocol
- Trend Analysis
- Lab Results & Pre-Treatment Vitals — Care Team Entry
- Recent Temperature Readings
- Treatment Protocol & Authorization
- Symptom Journal History
- Patient Questions
- Physician Direct Notes + UploadBox

14. Keep Physician Direct Notes and Upload Clinical Summary / Treatment Documentation.

This part is good.

Keep:
- notes textarea
- Upload Clinical Summary / Treatment Documentation
- PDF / DOCX / JPG hint
- future Multer upload target

Upload must stay independent from treatment approval.

15. Make sure all removed automation stays removed:
- no automatic fever postponement
- no radiation fever block
- no calendar shifting
- no 24-hour fever-free loop
- no predictive safety engine
- no correlation insights
- no automatic approval
- no automatic hold
- no AI recommendations

16. Backend readiness:

This must remain ready for future real backend implementation.

Final backend concept:
- PatientProfile created/edited by oncologist/care team
- TreatmentProtocol created/edited by oncologist/care team
- TreatmentCycle dates edited manually by oncologist/care team
- LabResult created/edited/deleted by care team entry workflow
- SymptomLog created/edited/deleted by patient
- Message sent by patient/oncologist
- ClinicalDocument uploaded by oncologist/care team with future Multer

Do not rely only on client mock data in the final architecture. Demo data can exist now, but the final implementation must be ready for MongoDB collections and REST API CRUD.