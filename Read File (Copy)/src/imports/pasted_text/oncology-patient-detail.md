The visual style is good and should stay the same, but the Oncologist Patient Detail / Clinical Workspace still needs to be updated according to the reduced scope plan.

Please apply these changes to the actual oncologist screen, not only to the plan.

1. Keep the current visual identity exactly:
- warm cream background
- sage green primary color
- rounded cards
- soft shadows
- subtle crab/cancer watermark
- calm medical dashboard style

Do not redesign the page visually from scratch.

2. Fix the date bug:
The page currently shows:
“Next evaluation: 1 Jan 1970”

This must never appear.

Do not use Date(0), empty fallback dates, or invalid default dates.

If there is no linked pre-treatment lab result yet, show:
“No pre-treatment lab result entered yet.”

If there is no next evaluation date, show:
“No evaluation date scheduled”

If there is a real planned cycle date, show the real planned date from the treatment cycle data.

3. Correct the Approve / Hold workflow.

Approve / Hold buttons should NOT appear before pre-treatment lab results are available for that cycle.

The correct flow is:

State A — Waiting for labs:
If the next/current cycle has no linked pre-treatment lab result yet, show a neutral state inside the cycle card:

“Waiting for pre-treatment lab results”

Optional helper text:
“Care team must enter lab results before oncologist review.”

Do NOT show active Approve / Hold buttons in this state.

State B — Ready for oncologist review:
After the care team enters lab results for this cycle, change the cycle state to:

“Ready for oncologist review”

Only then show the manual action buttons:
- Approve Next Cycle
- Hold Treatment

State C — Approved:
When Approve Next Cycle is clicked:
- Change status to Approved
- Show approved date
- Show approved by oncologist

State D — On Hold:
When Hold Treatment is clicked:
Open an inline panel with:
- Hold reason textarea
- Rescheduled date input
- Confirm Hold button
- Cancel button

After Confirm Hold:
- Change status to On Hold
- Show hold reason
- Show rescheduled date

Important:
Approve / Hold must always be manual oncologist actions only.
The system must never approve, hold, recommend, or decide treatment automatically.

4. Replace automatic authorization language.

Remove text like:
“Authorization unlocks on the scheduled clinic date”

Also remove anything that sounds like the system automatically unlocks, recommends, or decides.

Use neutral manual workflow wording instead:
- “Waiting for pre-treatment lab results”
- “Oncologist review will be available after lab results are entered.”
- “Oncologist review required before the next cycle.”
- “Decision must be entered manually by the oncologist.”

5. Update the Lab Results section into:

“Lab Results Management — Care Team Entry”

This section should make it clear that lab data is managed by the clinical/care team, not necessarily typed personally by the oncologist.

It should include:
- Latest Blood Work display
- Add Lab Result button
- Edit button on existing lab result
- Delete button on existing lab result

Add/Edit form fields:
- Date
- WBC
- Neutrophils
- Hemoglobin
- Platelets
- ALT
- Creatinine
- Blood Pressure
- Weight
- Temperature
- Optional note

Use loading/error states for add/edit/delete.

This is the main lab CRUD area for the future backend.

6. Keep patient lab visibility read-only.

The patient should still see a read-only latest lab preview on the Patient Dashboard:
- WBC
- Neutrophils
- Hemoglobin
- Platelets

But only the oncologist/care-team side manages lab CRUD.

7. Change “Safe minimums” in Trend Analysis to neutral wording.

Replace:
“Safe minimums”

With:
“Reference ranges”
or:
“Clinical reference lines”

Do not show predictive or automatic safety-decision language.

The trend chart should only visualize lab values.
It should not decide whether treatment is safe.

8. Add or verify Recent Temperature Readings section.

This section should:
- Read temperature values from patient symptom logs
- Show date, time, and temperature
- Use TemperatureBadge
- If temperature is 38°C or higher, show visual flag only:
  “Elevated temperature — please notify your care team.”

No automatic treatment action.
No automatic postponement.
No automatic approval/hold.

9. Add demo symptom history data so the oncologist screen is not always empty.

Each demo symptom entry should include:
- Date
- Time
- Symptoms
- Severity
- Temperature
- Notes

The oncologist view should show this as read-only Symptom Journal History.

10. Keep Physician Direct Notes and Upload Clinical Summary / Treatment Documentation.

This part is good.

Keep:
- Notes textarea
- Upload Clinical Summary / Treatment Documentation
- PDF / DOCX / JPG hint
- Future Multer upload target behavior

The upload must stay independent from treatment approval.

11. Make sure the Oncologist Workspace sections are ordered like this:

- SafetyNotice
- Patient summary
- Trend Analysis
- Lab Results Management — Care Team Entry
- Pre-Treatment Vitals
- Recent Temperature Readings
- Treatment Protocol & Authorization
- Symptom Journal History
- Patient Questions
- Physician Direct Notes + UploadBox

12. Keep all removed medical automation removed:
- no automatic fever postponement
- no calendar shifting
- no correlation insights
- no predictive safety engine
- no automatic treatment approval
- no automatic treatment hold
- no AI medical recommendations

13. Please verify after implementation:
- “1 Jan 1970” never appears anywhere.
- Approve / Hold does not appear before lab results exist.
- After lab results are added, the cycle changes to “Ready for oncologist review.”
- Approve / Hold appears only in “Ready for oncologist review.”
- Lab Results Management has Add/Edit/Delete.
- Temperature readings come from symptom logs.
- The page still keeps the existing calm sage/cream visual style.