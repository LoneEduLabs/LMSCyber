# CYBER LABS — database design (Google Sheet) and shared lab module

## 1. How it fits together

```
 Lab (any of the 5 modules + weeks-book worksheets)
        │  nothing to write per lab: steps, student, mistakes, hints, PDF downloads are read automatically
        ▼
 cyber-db.js  ── CyberApp.track ──►  queue in the browser (localStorage "cybi-dbq", survives offline / reload)
        │                                   │  every ~20 s, on completion, and when the page closes
        ▼                                   ▼
 Reports screen (Cyberlab.html?m=reports)  ◄── Apps Script web app (backend/Code.gs) ──►  Google Sheet = the database
```

**Week and button decide where a lab is stored.** Every button on a week card passes its week and button to the lab it opens
(`Cyberlab.html?m=cmdlab&wk=10&slot=LAB-3`; role play = `&wk=10&slot=CS-TEST`). The tracker stores the session under that
**week + slot** (a *unit*), whichever lab the student then picks inside it. So WEEK 10 · CMD-LAB-3 and WEEK 10 · ROLE-PLAY are always
in week 10, never in "Others". The lab's own week stays in the `Labs` catalogue only.

**Master table (bottom of every lab).** 2 rows: heading (one column per button of the selected week) and one data row with this
student's live status per button: `Not started` · `4/9 · 44%` (live, outlined) · `✓ Done 9/9` · `Opened` (AI lab) · `n/a` (no lab on that button),
plus `WEEK TOTAL`. The weeks page draws it under the lab frame; the lab pages send their status to it every second
(`postMessage 'cyberlab-status'`). A lab opened alone draws the same table itself. State is cached in the browser (`cybi-units`)
and restored from the database (`myWeek`) on another computer.

**One module for all labs.** `cyber-db.js` is loaded on every page (`cyber-data.js → "extensions"`). A lab is tracked
automatically if it uses `CyberApp.stepsPanel` (all five do) and the shared student profile. Extras are one line:

| Need | Call inside the lab |
|---|---|
| a quiz / written answer | `CyberApp.track.answer({ qid, q_type, question, student_answer, correct_answer, is_correct, points, max_points, needs_marking })` |
| a work product (plan, entries…) | `CyberApp.track.provide('kind', () => objectToStore)` |
| extra numbers (quiz score…) | `CyberApp.track.metrics(() => ({ quiz_score, quiz_max }))` |
| an audit event | `CyberApp.track.event('type', { detail })` |

A **new lab** that registers a steps panel shows up in Sessions, StepLog, Reports and PDF reports with no other change
and registers itself in the `Labs` tab the first time a student opens it.

## 2. What is stored (and why)

| Tab | One row per | Why it is needed |
|---|---|---|
| **Students** | student (SID) | name, grade/class, first/last seen, number of lab sessions — the key for every report |
| **Sessions** | attempt of a lab | **week + slot (the button it was opened from)**, status (in progress / completed / left early), start, last active, completed time, **active seconds** (idle time excluded), steps done/total, completion %, points, quiz score/max, mistakes, hints, accuracy %, PDFs/certificates saved, attempt number |
| **StepLog** | step of an attempt | done time, seconds on the step, **mistakes and hints on that step** → shows exactly where a student (and the whole class) struggles |
| **Answers** | quiz / written answer | the student's answer, the correct answer, right/wrong, points; short answers wait for **teacher_points + teacher_comment** |
| **Artifacts** | work product | PBL plan and design, role-play station entries (JSON, up to ~180 KB each) — evidence for marking |
| **Events** | notable event | lab opened/closed/completed, each mistake with its message, PDF / certificate downloads. Cleaned after 180 days |
| **Units** | week button | `W10\|CS-TEST` = week 10 · ROLE-PLAY: week, slot, label, active. Reports list every unit, also those a student has **not started**. `active = FALSE` hides a button. Filled by the first session and by *Sync lab catalogue* |
| **Labs** | lab | catalogue: id, module, the lab's **own** week/slot, title, steps (reports use week/slot of the *Units* instead) |
| **Weeks** | week or project per class group | locks + notes (replaces the old week-lock sheet; same URL contract) |
| **Settings** | setting | current-week rules (auto every Sunday, school week Sun–Thu, manual override), school name, self-view switch, optional app key |
| **Teachers** | teacher | name, role (admin/teacher), allowed classes, **salted SHA-256 PIN hash** |
| **Progress** *(derived)* | student | buttons started/completed, average %, points, mistakes, hints, minutes, last active, a % per week (heat-map: average of that week's buttons, not started = 0) |
| **UnitProgress** *(derived)* | student × button | status, lab done, steps, %, attempts, mistakes, hints, minutes |
| **LabStats** *(derived)* | lab | attempts, completion rate, mistakes, minutes, hardest step |
| **Log** | backend error | debugging |

Everything is keyed so that re-sending is safe: `session_id`, `session_id|step_key`, `session_id|qid`, `session_id|kind`.
A lab opened again is a **new attempt** (`attempt_no`); reports show, per week button, the best attempt over all labs opened from it
and let the teacher open any other attempt (the picker names the lab).

### Deliberately NOT stored
- PINs in clear text; passwords of any kind
- screenshots and the lab PDFs themselves (the PDF stays with the student; only the fact it was saved is logged)
- every click / keystroke / mouse movement (only steps, mistakes, hints and time)
- the lab content (scenarios, quiz questions) — that stays in `cyber-data.js`; the Answers tab keeps just the question text asked
- anything about students beyond SID, name and class

## 3. Reports in the app

`MY PERFORMANCE DASHBOARD` button (right page header of the weeks book) or `Cyberlab.html?m=reports`. Both start with one small
window: **Enter SID → Verify**. The server decides whether the ID belongs to a teacher (it only answers "teacher" or "student").

- **Teacher** (ID such as `LF2033` + password): `LF2033` sees **all grades, all sections, all students**; other teachers see only their `Teachers.grades`.
  Top bar: school logo, teacher ID and name, GRADE and SECTION filters, week, PDF REPORT, EXIT. The weeks sidebar is unchanged (students-done per week, NOW and lock marks) with the label TEACHER DASHBOARD as its footer.
  Per week: lab chips, a compact student table right under the buttons, and a **📊 Charts** button that opens the charts
  (donut of completed / in progress / not started, % of students completing each lab, average completion by class). The table
  (one thin row per student with a light grey line; one column per lab button, week %, points, mistakes, hints, time, last active; search, status filter, sortable) and downloads:
  CSV this week, CSV all weeks, class PDF, student-cards PDF (one card per student). Click **any student** → full report (attempts, steps,
  quiz & written answers with **marking**, work products, PDF) and ← CLASS LIST to return. Admins also get **Sync lab catalogue**.
- **Student** (SID): must match the SID + name saved on that computer (checked again on the server) → own progress only, no marking, no other students.
  Switch off with `Settings → student_self_view = FALSE`.

**Grade and section** are stored in `Students.grade` (combined, e.g. `CYBERSECURITY-GRADE-10-A`) and in two separate columns `grade_level` (`GRADE 10`) and `section` (`A`).

## 4. Security notes
- Writes need only the web-app URL (anyone who can open the app can reach it). Set `Settings → app_key` and the same
  value in `cyber-data.js → db.key` to block casual spam.
- Reports need a teacher token (6 h) obtained with teacher ID + password; 5 wrong passwords lock that ID for 10 minutes. Passwords exist only as salted SHA-256 hashes in `Teachers.pin_sha256` (salt in Script Properties) – never in the HTML.
- Student-typed text can never become a formula: text columns are plain text and a leading `= + - @` is neutralised.
- Student self-view checks SID **and** name; it is convenience, not strong authentication.
- The Sheet itself: share it only with staff. Students never open it.

## 5. Capacity and tuning
Apps Script handles one write at a time (a lock) and takes ~1 s per request. With a class of ~25 students the default
`flushSeconds: 20` is comfortable. For several classes at once raise `flushSeconds` to 30–45 in `cyber-data.js → db`.
A Google Sheet holds 10 million cells; at roughly 40 students × 40 labs × 15 steps the StepLog stays well under that
for several years. Reports read the data tabs directly; very large years can be archived by copying the Sheet.

## 6. Updating from v2.0
Replace `Code.gs`, run `setupDatabase` once (adds the `slot` column to Sessions and the Units tab; no data is touched) and deploy a **new version** of the web app.
Sessions saved by v2.0 have no `slot`: they stay in their old week. v2.1 never moves a stored session.

## 7. Week locks
`Weeks` replaces the old lock sheet. The app still calls the same URL (`?grade=CYBER&callback=…`) and receives the same
`{ok, locked:[{id,note}], currentWeek}`. Lock a week: set `locked = TRUE` (+ note) on the row for that grade. Current week
= automatic from `Settings` (week 10 = week of 25 Oct 2026, moves every Sunday); type a number in `current_week_override`
(or `current_week_override.G10`) to force it.

**v2.2 – current week and locks**
- *Automatic:* a new week starts every **Sunday**; Sunday–Thursday are school days and Friday/Saturday stay in the same week.
  Week 10 ends Saturday 31 Oct 2026, **WEEK 11 starts by itself on Sunday 1 Nov** (no trigger, no click: it is computed on every request, in the `Asia/Riyadh` time zone).
- *Manual:* menu **CYBER LABS → Set CURRENT WEEK (manual / auto)…** (or `setCurrentWeek(11)` / `setCurrentWeek('auto')` in the editor), or type a number in `current_week_override`. Empty = automatic.
- *Lock:* menu **CYBER LABS → Lock / unlock a week…** (or `lockWeek('CYBER', 12, true, 'note')`), or tick `locked` on the `Weeks` tab.
- *Lock future weeks:* `Settings → lock_future_weeks = TRUE` locks every week after the current one ("Not open yet – opens Sun 8 Nov") and each week opens by itself when its Sunday comes.
- `current_week_now` (Settings) shows what the app is using; it is refreshed with the reports.
- The app also counts the week locally from `cyber-data.js → book.weekLock (anchorDate, anchorNumber, manualWeek)` when the sheet cannot be reached; the sheet always wins when it answers.

**v2.3 – grade + section, SID verification, teacher dashboard**
Replace `Code.gs`, run *Set up / repair database* (appends `grade_level` + `section` to Students and back-fills them), deploy a **new version**. Add the teacher with *Add / reset a teacher* (ID `LF2033`, your own password).

## V6 — HW-CYBER FLOWCHART (weeks 10-16)
Flowchart keys `Week10-Flowchart` … `Week16-Flowchart` carry a `week` field. Their sessions are stored with `week = <that week>`, `slot = HW`, `lab_id = FLOW-HW-<week>` (the old flowcharts `Week1…6-Flowchart` keep `FLOW-<week+1>` on `LAB-3`). The status bar shows them in the HW column; the master table label comes from `book.flowchartHwButton`.

## V7 — weeks 13-16 labs
Eight new worksheet labs are stored like the weeks 10-12 ones: `lab_id = CYB-W<week>-LAB-<1|2>` (for example `CYB-W13-LAB-1`), `module = worksheets`, `week = 13…16`, `slot = LAB-1 | LAB-2`. They show in the CYBER-LAB-1 / CYBER-LAB-2 columns of the status bar and the master table; no change to `Code.gs` or to the sheet columns is needed. Each lab reports 8-10 steps (4-5 per activity). The browser no longer keeps the previous student's SID, name and grade between page loads, so a new student always starts from an empty details box; the sheet is not affected.

### V8 note
Weeks 11-16 `CYB-Wxx-LAB-1/2` now report **16-18 steps per lab** (8 or 9 per Part A / Part B, 1 point each) instead of 8-10. Same columns, same `lab_id` values; old sessions keep their stored `steps_total`, new sessions store the new one. No change to `Code.gs` or the sheet is needed.

### V9 note
No schema change. The portfolio is read from the existing `studentReport` data (Sessions + StepLog).

### V10 note — new sheet `Shots`
`key` (session|kind), `session_id`, `sid`, `lab_id`, `week`, `slot`, `kind` (before | after), `taken_at`, `size`, `data_1..data_4` (the JPEG as a data-URL split in 45 000-character pieces). A newer picture replaces the older one of the same session + kind. Read with the actions `shots` (teacher token + sid + week) and `myShots` (sid + name + week). Kept apart from `Artifacts` so the normal reports stay fast.
