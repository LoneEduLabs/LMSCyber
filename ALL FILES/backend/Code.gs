/* =====================================================================================================================
   CYBER LABS — DATABASE + API   (Google Apps Script, bound to the Google Sheet that IS the database)
   ---------------------------------------------------------------------------------------------------------------------
   ONE script for the whole app:
     1. Receives what every lab records (sessions, steps, quiz answers, work products, events)  -> doPost "ingest"
     2. Serves the reports (class list, one student, one lab, quiz marking)                       -> doPost / doGet(JSONP)
     3. Keeps the WEEK LOCKS + CURRENT WEEK working exactly as before                             -> doGet ?grade=CYBER&callback=
   FIRST TIME:  Extensions > Apps Script > paste this file (and appsscript.json) > run  setupDatabase()  once.
                Then  Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone  -> copy the /exec URL
                into cyber-data.js  ->  "db": { "url": "<the /exec URL>" }   (and "book.weekLock.url" if you want the same one)
   Full guide: DATABASE_DESIGN.md
   ===================================================================================================================== */
var APP_NAME = 'CYBER LABS DB';
var VERSION = '2.9.0';

/* column types:  t = text (stored as plain text, so a student can never inject a formula)   n = number   d = date-time   b = TRUE/FALSE */
var SCHEMA = {
  Roster: [['SID', 't', 100], ['SNAME', 't', 240], ['GRADE', 't', 100], ['SCHOOL', 't', 110]],      /* the school's student list: the app checks every SID against it (all rows, any number of students) */
  Students: [['sid', 't', 90], ['name', 't', 210], ['grade', 't', 230], ['class_short', 't', 80], ['first_seen', 'd', 150], ['last_seen', 'd', 150], ['sessions', 'n', 80], ['notes', 't', 220], ['grade_level', 't', 90], ['section', 't', 70]],
  Teachers: [['teacher_id', 't', 100], ['name', 't', 200], ['role', 't', 90], ['pin_sha256', 't', 120], ['grades', 't', 220], ['active', 'b', 70], ['created_at', 'd', 150], ['last_login', 'd', 150],
    ['boys_grades', 't', 260], ['girls_grades', 't', 260], ['boys', 'n', 60], ['girls', 'n', 60], ['access_synced', 'd', 150]],   /* the last five are filled by the script from the Roster (menu: Refresh staff access) */
  Weeks: [['grade', 't', 80], ['week_id', 't', 110], ['locked', 'b', 80], ['note', 't', 320]],
  Units: [['unit_id', 't', 120], ['week', 'n', 60], ['slot', 't', 90], ['label', 't', 200], ['module', 't', 90], ['title', 't', 300], ['active', 'b', 70], ['updated_at', 'd', 150]],
  Labs: [['lab_id', 't', 150], ['module', 't', 90], ['week', 'n', 60], ['slot', 't', 70], ['title', 't', 360], ['topic', 't', 240], ['steps_total', 'n', 90], ['max_points', 'n', 90], ['steps_json', 't', 420], ['active', 'b', 70], ['updated_at', 'd', 150]],
  Sessions: [['session_id', 't', 150], ['sid', 't', 90], ['name', 't', 190], ['grade', 't', 200], ['lab_id', 't', 140], ['lab_title', 't', 280], ['module', 't', 80], ['week', 'n', 60],
    ['attempt_no', 'n', 70], ['status', 't', 100], ['started_at', 'd', 150], ['last_active', 'd', 150], ['completed_at', 'd', 150], ['active_seconds', 'n', 90],
    ['steps_done', 'n', 80], ['steps_total', 'n', 80], ['completion_pct', 'n', 90], ['points', 'n', 70], ['max_points', 'n', 80], ['quiz_score', 'n', 80], ['quiz_max', 'n', 70],
    ['mistakes', 'n', 70], ['hints', 'n', 60], ['accuracy_pct', 'n', 80], ['files_saved', 'n', 80], ['extra_json', 't', 260], ['app_version', 't', 80], ['client', 't', 160],
    ['slot', 't', 80]],      /* week + slot = the week card and the button the student pressed (the "unit"); lab_id is whichever lab they picked inside it */
  StepLog: [['key', 't', 190], ['session_id', 't', 150], ['sid', 't', 90], ['lab_id', 't', 140], ['step_no', 'n', 60], ['step_key', 't', 90], ['step_title', 't', 380], ['status', 't', 70],
    ['points', 'n', 60], ['first_seen_at', 'd', 150], ['done_at', 'd', 150], ['seconds_on_step', 'n', 90], ['mistakes', 'n', 70], ['hints', 'n', 60]],
  Answers: [['key', 't', 190], ['session_id', 't', 150], ['sid', 't', 90], ['lab_id', 't', 140], ['qid', 't', 80], ['q_type', 't', 80], ['question', 't', 360], ['student_answer', 't', 360],
    ['correct_answer', 't', 260], ['is_correct', 't', 80], ['points', 'n', 60], ['max_points', 'n', 80], ['needs_marking', 'b', 100], ['teacher_points', 'n', 100], ['teacher_comment', 't', 300],
    ['marked_by', 't', 120], ['marked_at', 'd', 150], ['answered_at', 'd', 150]],
  Artifacts: [['key', 't', 190], ['session_id', 't', 150], ['sid', 't', 90], ['lab_id', 't', 140], ['kind', 't', 120], ['updated_at', 'd', 150], ['size', 'n', 70],
    ['data_1', 't', 200], ['data_2', 't', 200], ['data_3', 't', 200], ['data_4', 't', 200]],
  Shots: [['key', 't', 200], ['session_id', 't', 150], ['sid', 't', 90], ['lab_id', 't', 140], ['week', 'n', 60], ['slot', 't', 70], ['kind', 't', 80], ['taken_at', 'd', 150], ['size', 'n', 70],
    ['data_1', 't', 200], ['data_2', 't', 200], ['data_3', 't', 200], ['data_4', 't', 200]],   /* lab screenshots (JPEG data-URL, "before" and "after" of a session) for the portfolio — kept apart from Artifacts so the reports stay fast */
  Events: [['ts', 'd', 150], ['session_id', 't', 150], ['sid', 't', 90], ['lab_id', 't', 140], ['type', 't', 110], ['step_key', 't', 90], ['detail', 't', 420]],
  Log: [['ts', 'd', 150], ['level', 't', 70], ['source', 't', 120], ['message', 't', 600]]
};
var SETTINGS_DEFAULTS = [
  ['school_name', 'Al-Rowad International Schools', 'Shown on printed reports'],
  ['report_title', 'Elective Cybersecurity — Student Lab Report', 'Title of the printed student report'],
  ['timezone', 'Asia/Riyadh', 'Used for dates and for the automatic current week'],
  ['week_anchor_date', '2026-10-25', 'A SUNDAY whose week number is known (week 10 = week of 25 Oct 2026)'],
  ['week_anchor_number', '10', 'The week number of that Sunday'],
  ['auto_advance', 'TRUE', 'TRUE = CURRENT WEEK moves on by itself every Sunday (school week Sunday–Thursday)'],
  ['current_week_override', '', 'Type a week number to force the CURRENT WEEK (empty = automatic). Per grade: current_week_override.G10'],
  ['max_weeks', '20', 'Highest week number'],
  ['lock_future_weeks', 'FALSE', 'TRUE = every week AFTER the current week is locked automatically and opens by itself when its week starts (the Weeks tab still works for single weeks)'],
  ['current_week_now', '', 'Information only (filled by the script): the current week the app is showing right now'],
  ['student_self_view', 'TRUE', 'TRUE = a student can open their own report (SID + name must match)'],
  ['app_key', '', 'Optional shared key: if filled, it must also be in cyber-data.js -> db.key (blocks casual spam)'],
  ['retention_days_events', '180', 'Events older than this are removed by the daily clean-up']
];

/* ===================================================================================================================
   SET-UP  (run once, safe to run again: it only adds what is missing)
   =================================================================================================================== */
function setupDatabase() {
  var ss = db_();
  Object.keys(SCHEMA).forEach(function (name) { ensureSheet_(ss, name); });
  ensureSettings_(ss);
  seedWeeks_(ss);
  ensureProgressSheets_(ss);
  backfillStudents_();
  writeReadme_(ss);
  if (!PropertiesService.getScriptProperties().getProperty('SALT')) PropertiesService.getScriptProperties().setProperty('SALT', Utilities.getUuid());
  var rows = rowsOf_('Teachers');
  var msg = 'Database ready (' + VERSION + ').';
  if (!rows.length) msg += '\nNext: menu CYBER LABS > Add / reset a teacher, to create the first teacher (ID + password).';
  msg += '\nThen Deploy > New deployment > Web app (Execute as: Me, Access: Anyone) and paste the /exec URL into cyber-data.js -> db.url';
  log_('info', 'setup', msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}

/* students saved by an older version: fill grade_level and section from the grade */
function backfillStudents_() {
  try {
    var t = table_('Students'), n = t.sh.getLastRow(); if (n < 2) return;
    var ig = colOf_(t, 'grade'), il = colOf_(t, 'grade_level'), is = colOf_(t, 'section');
    var vals = t.sh.getRange(2, 1, n - 1, t.cols.length).getValues(), out = [], dirty = false;
    vals.forEach(function (r) { var pg = parseGrade_(r[ig]); if (pg.level && (r[il] !== pg.level || r[is] !== pg.section)) { r[il] = pg.level; r[is] = pg.section; dirty = true; } out.push([r[il], r[is]]); });
    if (dirty) t.sh.getRange(2, il + 1, out.length, 1).setValues(out.map(function (x) { return [x[0]]; })), t.sh.getRange(2, is + 1, out.length, 1).setValues(out.map(function (x) { return [x[1]]; }));
  } catch (e) { log_('warn', 'backfill', String(e.message || e)); }
}
function ensureSheet_(ss, name) {
  var cols = SCHEMA[name], sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var n = cols.length;
  if (sh.getMaxColumns() < n) sh.insertColumnsAfter(sh.getMaxColumns(), n - sh.getMaxColumns());
  var head = sh.getRange(1, 1, 1, n);
  var cur = head.getValues()[0];
  var names = cols.map(function (c) { return c[0]; });
  if (cur.join('|') !== names.join('|')) head.setValues([names]);   // adds missing headers; never touches data rows
  head.setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF').setWrap(false);
  sh.setFrozenRows(1);
  var rows = Math.max(sh.getMaxRows() - 1, 1);
  cols.forEach(function (c, i) {
    sh.setColumnWidth(i + 1, c[2]);
    var r = sh.getRange(2, i + 1, rows, 1);
    r.setNumberFormat(c[1] === 't' ? '@' : c[1] === 'd' ? 'yyyy-mm-dd hh:mm:ss' : c[1] === 'b' ? 'General' : '0.##');
  });
  if (name === 'Sessions') {
    var st = SpreadsheetApp.newDataValidation().requireValueInList(['in_progress', 'completed', 'abandoned'], true).build();
    sh.getRange(2, names.indexOf('status') + 1, rows, 1).setDataValidation(st);
  }
  if (name === 'Teachers') {
    sh.getRange(2, names.indexOf('role') + 1, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['admin', 'teacher'], true).build());
  }
  return sh;
}

function ensureSettings_(ss) {
  var sh = ss.getSheetByName('Settings') || ss.insertSheet('Settings');
  if (sh.getLastRow() < 1) sh.getRange(1, 1, 1, 3).setValues([['key', 'value', 'note']]);
  sh.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
  sh.setFrozenRows(1); sh.setColumnWidth(1, 220); sh.setColumnWidth(2, 260); sh.setColumnWidth(3, 560);
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), 2).setNumberFormat('@');
  var have = {}, vals = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues() : [];
  vals.forEach(function (r) { have[String(r[0])] = true; });
  var add = SETTINGS_DEFAULTS.filter(function (d) { return !have[d[0]]; });
  if (add.length) sh.getRange(sh.getLastRow() + 1, 1, add.length, 3).setValues(add);
}

function seedWeeks_(ss) {
  var sh = ss.getSheetByName('Weeks');
  if (sh.getLastRow() > 1) return;
  var rows = [], grades = ['CYBER', 'G10', 'G11'];
  grades.forEach(function (g) {
    for (var w = 1; w <= 20; w++) rows.push([g, 'WEEK ' + w, false, '']);
    for (var q = 1; q <= 4; q++) rows.push([g, 'PROJECT Q' + q, false, '']);
  });
  sh.getRange(2, 1, rows.length, 4).setValues(rows);
}

function ensureProgressSheets_(ss) {
  ['Progress', 'LabStats', 'UnitProgress'].forEach(function (n) { if (!ss.getSheetByName(n)) ss.insertSheet(n); });
}

function writeReadme_(ss) {
  var sh = ss.getSheetByName('README') || ss.insertSheet('README', 0);
  var lines = [
    [APP_NAME + '  v' + VERSION],
    ['This spreadsheet is the database of the CYBER LABS app. The app writes into it; you can read, filter and mark here.'],
    [''],
    ['TABS YOU USE'],
    ['Settings    school name, self-view on/off, CURRENT WEEK rules: automatic (week_anchor_date + week_anchor_number: a new week starts every Sunday, Sun-Thu school days, Fri/Sat stay in the same week) or manual (current_week_override, or menu CYBER LABS > Set CURRENT WEEK).'],
    ['            lock_future_weeks = TRUE locks every week after the current one and opens it by itself when its Sunday comes.'],
    ['Weeks       lock a week or a project for a class group: locked = TRUE, optional note shown on the card (grade = CYBER, G10, G11) — or use the menu CYBER LABS > Lock / unlock a week.'],
    ['Teachers    who may open the TEACHER DASHBOARD (menu CYBER LABS > Add / reset a teacher: ID such as LF2033 + password). Passwords are stored only as a salted hash in column pin_sha256 — never in the app files.'],
    ['Roster      the school\'s student list: SID, SNAME, GRADE (e.g. G-10E), SCHOOL (e.g. BOYS). The start screen of every lab asks for the SID only and shows these details. Add new students as new rows at the bottom (any number).'],
    ['Units       every button of every week card (week + slot). A lab is stored under the week + button the student pressed, whatever lab they pick inside it.'],
    ['Labs        the catalogue of every lab and its steps (filled by the app: Reports > Sync lab catalogue).'],
    ['Answers     every quiz / short answer. Teachers can type teacher_points + teacher_comment here OR in the app.'],
    ['Progress    one row per student (rebuilt automatically every 30 min, or menu CYBER LABS > Rebuild report tabs).'],
    ['UnitProgress one row per student x week button: status, steps, %, attempts, mistakes.'],
    ['LabStats    one row per lab: attempts, completion rate, mistakes, the hardest step.'],
    [''],
    ['TABS THE APP WRITES (do not edit)'],
    ['Students · Sessions (one row per attempt of a lab) · StepLog (one row per step) · Artifacts (PBL plan, role-play entries …) · Events · Log'],
    [''],
    ['Everything is plain text in the data tabs, so a student can never put a formula into the sheet.']
  ];
  sh.clear();
  sh.getRange(1, 1, lines.length, 1).setValues(lines);
  sh.setColumnWidth(1, 900);
  sh.getRange(1, 1).setFontSize(16).setFontWeight('bold');
  [4, 13].forEach(function (r) { sh.getRange(r, 1).setFontWeight('bold'); });
}

function onOpen() {
  try {
    SpreadsheetApp.getUi().createMenu('CYBER LABS')
      .addItem('Set up / repair database', 'setupDatabase')
      .addItem('Add / reset a teacher', 'addTeacherDialog')
      .addItem('Refresh staff access from the Roster', 'syncTeacherAccess')
      .addSeparator()
      .addItem('Set CURRENT WEEK (manual / auto)…', 'setCurrentWeekDialog')
      .addItem('Lock / unlock a week…', 'lockWeekDialog')
      .addSeparator()
      .addItem('Rebuild report tabs now', 'refreshReports')
      .addItem('Install automatic jobs (reports + clean-up)', 'installTriggers')
      .addItem('Clean old events now', 'cleanOldEvents')
      .addSeparator()
      .addItem('Show status', 'showStatus')
      .addToUi();
  } catch (e) {}
}

function showStatus() {
  var s = status_();
  SpreadsheetApp.getUi().alert(APP_NAME + ' v' + VERSION + '\n\nStudents: ' + s.students + '\nSessions: ' + s.sessions + '\nSteps logged: ' + s.steps +
    '\nTeachers: ' + s.teachers + '\nCurrent week (CYBER): ' + s.currentWeek + '\nWeb app URL: ' + (ScriptApp.getService().getUrl() || '(not deployed yet)'));
}

function addTeacherDialog() {
  var ui = SpreadsheetApp.getUi();
  var i = ui.prompt('Teacher ID (what the teacher types in MY DASHBOARD, e.g. LF2033):');
  if (i.getSelectedButton() !== ui.Button.OK || !i.getResponseText().trim()) return;
  var n = ui.prompt('Teacher name (shown in the dashboard):');
  if (n.getSelectedButton() !== ui.Button.OK || !n.getResponseText().trim()) return;
  var p = ui.prompt('Password for ' + i.getResponseText().trim() + ' (4–30 characters). It is stored only as a salted hash in the Teachers tab:');
  if (p.getSelectedButton() !== ui.Button.OK) return;
  var r = ui.alert('Make this teacher an ADMIN (all grades + can sync the lab catalogue)?', ui.ButtonSet.YES_NO);
  try { addTeacher(n.getResponseText().trim(), p.getResponseText().trim(), r === ui.Button.YES ? 'admin' : 'teacher', 'ALL', i.getResponseText().trim()); ui.alert('Saved. The teacher opens MY DASHBOARD, types ' + i.getResponseText().trim() + ' and the password.'); }
  catch (e) { ui.alert(e.message); }
}
/* run from the editor too:  addTeacher('Lone A Firdous', 'my-password', 'admin', 'ALL', 'LF2033')   grades: ALL or e.g. 'CYBERSECURITY-GRADE-11-A,CYBERSECURITY-GRADE-11-B'
   running it again with the same ID resets the password */
function addTeacher(name, pin, role, grades, id) {
  if (!name || !pin || String(pin).length < 4) throw new Error('Name and a password of at least 4 characters are needed.');
  setupSalt_();
  var t = table_('Teachers'), tid = String(id || '').trim() || slug_(name), row = 0;
  var lastT = t.sh.getLastRow(); if (lastT > 1) t.sh.getRange(2, 1, lastT - 1, 1).getValues().forEach(function (v, i) { if (String(v[0]).toLowerCase() === tid.toLowerCase()) row = i + 2; });
  var obj = { teacher_id: tid, name: name, role: role === 'admin' ? 'admin' : 'teacher', pin_sha256: hash_(pin), grades: grades || 'ALL', active: true, created_at: new Date() };
  if (row) writeRow_(t, row, obj); else appendRow_(t, obj);
  return tid;
}

/* ===================================================================================================================
   WEB APP ENTRY POINTS
   =================================================================================================================== */
function doGet(e) {
  var p = (e && e.parameter) || {}, out;
  try {
    if (p.q) out = dispatch_(JSON.parse(p.q));                                   // JSONP report call (works from file:// too)
    else if (p.grade || p.callback && !p.action) out = weekState_(p.grade || 'CYBER'); // the original week-lock call
    else if (p.action === 'ping') out = { ok: true, app: APP_NAME, version: VERSION, time: new Date().toISOString() };
    else return ContentService.createTextOutput(APP_NAME + ' v' + VERSION + ' is running.').setMimeType(ContentService.MimeType.TEXT);
  } catch (err) { out = fail_(err); }
  return reply_(out, p.callback);
}

function doPost(e) {
  var out;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = dispatch_(body);
  } catch (err) { out = fail_(err); }
  return reply_(out);
}

function reply_(obj, cb) {
  var json = JSON.stringify(obj);
  if (cb && /^[A-Za-z_$][\w$.]*$/.test(cb)) return ContentService.createTextOutput(cb + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function fail_(err) {
  var m = String(err && err.message || err);
  if (!/^(Not allowed|Bad |Wrong |Too many|Busy|Unknown)/.test(m)) log_('error', 'api', m);
  return { ok: false, error: m, retry: /Busy/.test(m) };
}

function dispatch_(b) {
  ROSTER_ = null; RIDX_ = null;                                   // the Roster is read fresh for every request
  var s = getSettings_();
  if (s.app_key && String(b.key || '') !== String(s.app_key) && b.action !== 'login' && b.action !== 'myReport' && b.action !== 'verify') {
    if (b.action === 'ingest') throw new Error('Not allowed: wrong app key');
  }
  switch (b.action) {
    case 'ping': return { ok: true, app: APP_NAME, version: VERSION, time: new Date().toISOString(), currentWeek: currentWeek_('CYBER', s) };
    case 'weeks': return weekState_(b.grade || 'CYBER');
    case 'ingest': return withLock_(function () { return ingest_(b); });
    case 'login': return login_(b);
    case 'verify': return verify_(b);
    case 'lookup': return lookup_(b);
    case 'myReport': return myReport_(b, s);
    case 'myWeek': return myWeek_(b);
    case 'classReport': return classReport_(auth_(b), b);
    case 'studentReport': return studentReport_(auth_(b), b.sid);
    case 'labReport': return labReport_(auth_(b), b.lab_id);
    case 'artifact': return artifact_(auth_(b), b);
    case 'shots': return shots_(auth_(b), b);
    case 'myShots': return myShots_(b, s);
    case 'mark': return withLock_(function () { return mark_(auth_(b), b); });
    case 'catalog': return withLock_(function () { return catalog_(auth_(b, true), b); });
    case 'settings': return { ok: true, settings: publicSettings_(s) };
    default: throw new Error('Unknown action: ' + b.action);
  }
}

/* ===================================================================================================================
   WEEK LOCKS + CURRENT WEEK  (same answer shape as the old script: {ok, locked:[{id,note}], currentWeek})
   =================================================================================================================== */
function weekState_(grade) {
  var s = getSettings_(), g = String(grade || 'CYBER').toUpperCase(), locked = [], seen = {};
  rowsOf_('Weeks').forEach(function (r) {
    if (String(r.grade).toUpperCase() === g && (r.locked === true || String(r.locked).toUpperCase() === 'TRUE')) { locked.push({ id: String(r.week_id), note: String(r.note || '') }); seen[String(r.week_id).toUpperCase()] = 1; }
  });
  var info = currentWeekInfo_(g, s), cw = info.week;
  /* optional rule: every week after the current one is locked, and unlocks by itself when its week starts */
  if (String(s.lock_future_weeks).toUpperCase() === 'TRUE' && cw > 0) {
    var max = +s.max_weeks || 20;
    for (var w = cw + 1; w <= max; w++) { var id = 'WEEK ' + w; if (!seen[id]) locked.push({ id: id, note: 'Not open yet' + (info.mode === 'auto' ? ' - opens ' + weekStartText_(s, w) : '') }); }
  }
  return { ok: true, locked: locked, currentWeek: cw, mode: info.mode, serverTime: new Date().toISOString() };
}
/* the Sunday on which a week starts, e.g. "Sun 1 Nov" */
function weekStartText_(s, w) {
  var a = String(s.anchor || s.week_anchor_date).split('-'); if (a.length < 3) return 'soon';
  var d = new Date(Date.UTC(+a[0], +a[1] - 1, +a[2] + ((+w - (+s.week_anchor_number || 1)) * 7)));
  return Utilities.formatDate(d, 'UTC', 'EEE d MMM');
}
/* CURRENT WEEK = manual number (Settings: current_week_override) if there is one, otherwise automatic:
   the anchor Sunday is week <week_anchor_number>; a new week starts every Sunday; the school week is Sunday-Thursday, Friday and Saturday stay in the same week. */
function currentWeekInfo_(grade, s) {
  var max = +s.max_weeks || 20;
  var ov = s['current_week_override.' + grade] || s.current_week_override;
  if (ov !== undefined && String(ov).trim() !== '' && !isNaN(+ov)) return { week: Math.max(0, Math.min(max, +ov)), mode: 'manual' };
  if (String(s.auto_advance).toUpperCase() !== 'TRUE') return { week: 0, mode: 'off' };
  var tz = s.timezone || 'Asia/Riyadh';
  var a = String(s.anchor || s.week_anchor_date).split('-'); if (a.length < 3) return { week: 0, mode: 'off' };
  var today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd').split('-');
  var d0 = Date.UTC(+a[0], +a[1] - 1, +a[2]), d1 = Date.UTC(+today[0], +today[1] - 1, +today[2]);
  var weeks = Math.floor((d1 - d0) / (7 * 86400000));
  return { week: Math.max(1, Math.min(max, (+s.week_anchor_number || 1) + weeks)), mode: 'auto' };
}
function currentWeek_(grade, s) { return currentWeekInfo_(grade, s).week; }

/* ---- manual control (menu CYBER LABS, or run from the editor) ---- */
function setSetting_(key, value, note) {
  var sh = db_().getSheetByName('Settings'), n = sh.getLastRow(), vals = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues() : [];
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === key) { sh.getRange(i + 2, 2).setValue(value); return; }
  sh.getRange(n + 1, 1, 1, 3).setValues([[key, value, note || '']]);
}
/* setCurrentWeek(11) = force WEEK 11 now;  setCurrentWeek('') / setCurrentWeek('auto') = automatic again */
function setCurrentWeek(week) {
  var v = String(week === undefined || week === null ? '' : week).trim().toLowerCase();
  if (v === 'auto' || v === '0' || v === '') v = '';
  else if (isNaN(+v) || +v < 1 || +v > (+getSettings_().max_weeks || 20)) throw new Error('Week must be a number from 1 to ' + (getSettings_().max_weeks || 20) + ', or "auto".');
  setSetting_('current_week_override', v === '' ? '' : +v);
  var w = currentWeek_('CYBER', getSettings_()); setSetting_('current_week_now', w);
  return { currentWeek: w, mode: v === '' ? 'auto' : 'manual' };
}
/* lockWeek('CYBER', 12, true, 'Opens next Sunday')  - weekId: 12, 'WEEK 12' or 'PROJECT Q1' */
function lockWeek(grade, weekId, locked, note) {
  var g = String(grade || 'CYBER').toUpperCase(), id = /^\d+$/.test(String(weekId).trim()) ? 'WEEK ' + String(weekId).trim() : String(weekId).trim().toUpperCase();
  var sh = db_().getSheetByName('Weeks'), n = sh.getLastRow(), vals = n > 1 ? sh.getRange(2, 1, n - 1, 2).getValues() : [], row = 0;
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).toUpperCase() === g && String(vals[i][1]).toUpperCase() === id) { row = i + 2; break; }
  if (!row) { row = n + 1; sh.getRange(row, 1, 1, 2).setValues([[g, id]]); }
  sh.getRange(row, 3).setValue(!!locked); sh.getRange(row, 4).setValue(locked ? String(note || '') : '');
  return { grade: g, week: id, locked: !!locked };
}
function setCurrentWeekDialog() {
  var ui = SpreadsheetApp.getUi(), s = getSettings_(), info = currentWeekInfo_('CYBER', s);
  var r = ui.prompt('Set the CURRENT WEEK', 'Now: WEEK ' + info.week + ' (' + info.mode + ').\nType a week number to force it, or the word auto to let it move on by itself every Sunday.', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  try { var o = setCurrentWeek(r.getResponseText()); ui.alert('Current week is now WEEK ' + o.currentWeek + ' (' + o.mode + '). The app shows it within a minute.'); } catch (e) { ui.alert(e.message); }
}
function lockWeekDialog() {
  var ui = SpreadsheetApp.getUi();
  var w = ui.prompt('Lock / unlock a week', 'Week number (e.g. 12) or PROJECT Q1:', ui.ButtonSet.OK_CANCEL); if (w.getSelectedButton() !== ui.Button.OK || !w.getResponseText().trim()) return;
  var a = ui.alert('Lock WEEK ' + w.getResponseText().trim() + '?', 'YES = lock it, NO = unlock it.', ui.ButtonSet.YES_NO_CANCEL); if (a === ui.Button.CANCEL || a === ui.Button.CLOSE) return;
  var note = ''; if (a === ui.Button.YES) { var n = ui.prompt('Message shown on the card (optional):'); if (n.getSelectedButton() === ui.Button.OK) note = n.getResponseText(); }
  lockWeek('CYBER', w.getResponseText().trim(), a === ui.Button.YES, note);
  ui.alert('Done. Students see it within a minute. (Other class groups: use the Weeks tab.)');
}

/* ===================================================================================================================
   INGEST — what the labs send
   =================================================================================================================== */
var RE_SID = /^[A-Za-z0-9_\-\.]{2,24}$/, RE_ID = /^[A-Za-z0-9_\-\.:]{1,80}$/, RE_SESSION = /^[A-Za-z0-9_\-]{6,48}$/;

function ingest_(b) {
  EV_CACHE_ = null;
  var items = b.items || [];
  if (items.length > 400) throw new Error('Bad request: too many items');
  var st = b.student || {}, sid = String(st.sid || '').trim();
  if (!RE_SID.test(sid)) throw new Error('Bad student id');
  if (staffIds_()[sid.toLowerCase()]) return { ok: true, saved: 0, rejected: [], staff: true, serverTime: new Date().toISOString() };   // teachers / admins: their lab work is not stored as student work
  var saved = 0, rejected = [], now = new Date();
  var lastSeen = now;
  items.forEach(function (it, i) {
    try {
      var ok = true;
      switch (it.t) {
        case 'session': ok = putSession_(sid, st, it); break;
        case 'step': ok = putStep_(sid, it); break;
        case 'answer': ok = putAnswer_(sid, it); break;
        case 'artifact': ok = putArtifact_(sid, it); break;
        case 'shot': ok = putShot_(sid, it); break;
        case 'event': ok = putEvent_(sid, it); break;
        default: ok = false;
      }
      if (ok) saved++; else rejected.push(i);
    } catch (err) { rejected.push(i); log_('warn', 'ingest', String(err.message || err)); }
  });
  touchStudent_(sid, st, lastSeen, false);
  return { ok: true, saved: saved, rejected: rejected, serverTime: now.toISOString() };
}

function touchStudent_(sid, st, when, newSession) {
  var t = table_('Students'), row = findRow_(t, 'sid', sid);
  var grade = clip_(st.grade, 60), name = clip_(st.name, 80);
  if (!row) {
    var pg0 = parseGrade_(grade);
    appendRow_(t, { sid: sid, name: name, grade: grade, class_short: shortGrade_(grade), grade_level: pg0.level, section: pg0.section, first_seen: when, last_seen: when, sessions: newSession ? 1 : 0 });
  } else {
    var cur = readRow_(t, row), o = { last_seen: when };
    if (name) o.name = name; if (grade) { var pg = parseGrade_(grade); o.grade = grade; o.class_short = shortGrade_(grade); o.grade_level = pg.level; o.section = pg.section; }
    if (newSession) o.sessions = (+cur.sessions || 0) + 1;
    writeRow_(t, row, o);
  }
}

function putSession_(sid, st, it) {
  var id = String(it.session_id || '');
  if (!RE_SESSION.test(id) || !RE_ID.test(String(it.lab_id || ''))) return false;
  var t = table_('Sessions'), row = findRow_(t, 'session_id', id);
  var steps = num_(it.steps_total), done = Math.min(num_(it.steps_done), steps || 1e9);
  var o = {
    session_id: id, sid: sid, name: clip_(st.name, 80), grade: clip_(st.grade, 60), lab_id: it.lab_id, lab_title: clip_(it.lab_title, 200), module: clip_(it.module, 20), week: num_(it.week), slot: clip_(it.slot, 30),
    status: it.status === 'completed' ? 'completed' : it.status === 'abandoned' ? 'abandoned' : 'in_progress',
    started_at: it.started_at, last_active: it.last_active || new Date(), completed_at: it.completed_at, active_seconds: num_(it.active_seconds),
    steps_done: done, steps_total: steps, completion_pct: steps ? Math.round(done / steps * 100) : 0,
    quiz_score: num_(it.quiz_score), quiz_max: num_(it.quiz_max), mistakes: num_(it.mistakes), hints: num_(it.hints),
    extra_json: clip_(it.extra_json, 900), app_version: clip_(it.app_version, 20), client: clip_(it.client, 120), files_saved: num_(it.files_saved)
  };
  o.points = done + o.quiz_score; o.max_points = steps + o.quiz_max;
  var tries = o.mistakes + done;
  o.accuracy_pct = tries ? Math.round(done / tries * 100) : 0;
  if (!row) {
    o.attempt_no = countRows_(t, 'sid', sid, 'lab_id', it.lab_id) + 1;
    appendRow_(t, o);
    registerLab_(it);
    registerUnit_(o.week, o.slot, it);
    touchStudent_(sid, st, new Date(), true);
  } else {
    var cur = readRow_(t, row);
    o.attempt_no = cur.attempt_no; o.started_at = cur.started_at || o.started_at;
    o.week = cur.week === '' || cur.week === undefined ? o.week : +cur.week; o.slot = cur.slot || o.slot;     // the unit of a session never moves
    if (cur.status === 'completed') { o.status = 'completed'; o.completed_at = cur.completed_at || o.completed_at; }
    ['active_seconds', 'steps_done', 'mistakes', 'hints', 'quiz_score', 'files_saved'].forEach(function (k) { o[k] = Math.max(+cur[k] || 0, +o[k] || 0); });
    o.completion_pct = o.steps_total ? Math.round(o.steps_done / o.steps_total * 100) : 0;
    o.points = o.steps_done + o.quiz_score; o.max_points = o.steps_total + o.quiz_max;
    writeRow_(t, row, o);
  }
  return true;
}

/* the first session of a lab teaches the catalogue its steps (so new labs appear in reports without any manual work) */
function registerLab_(it) {
  var steps = (it.steps || []).slice(0, 80).map(function (x) { return String(x).slice(0, 120); });
  var t = table_('Labs'), row = findRow_(t, 'lab_id', it.lab_id);
  /* the catalogue keeps the lab's OWN week/slot (cat_week/cat_slot); the session's week/slot is the card + button the student pressed */
  var o = { lab_id: it.lab_id, module: clip_(it.module, 20), week: num_(it.cat_week !== undefined ? it.cat_week : it.week), slot: clip_(it.cat_slot !== undefined ? it.cat_slot : it.slot, 20), title: clip_(it.lab_title, 200), topic: clip_(it.topic, 160) };
  if (steps.length) { o.steps_total = steps.length; o.steps_json = clip_(JSON.stringify(steps), 40000); o.max_points = steps.length + num_(it.quiz_max); }
  o.updated_at = new Date();
  if (!row) { o.active = true; appendRow_(t, o); }
  else { var cur = readRow_(t, row); if (!steps.length || +cur.steps_total === steps.length && cur.title) return; writeRow_(t, row, o); }
}

/* a button of a week card (week + slot) is registered the first time a student uses it, so reports know every unit */
function registerUnit_(week, slot, it) {
  slot = String(slot || ''); if (!slot) return;
  var t = table_('Units'), id = 'W' + num_(week) + '|' + slot, row = findRow_(t, 'unit_id', id);
  if (!row) appendRow_(t, { unit_id: id, week: num_(week), slot: slot, label: clip_(it.unit_label || slot, 60), module: clip_(it.module, 20), title: '', active: true, updated_at: new Date() });
}

function putStep_(sid, it) {
  var sess = String(it.session_id || ''), sk = String(it.step_key || '');
  if (!RE_SESSION.test(sess) || !sk || sk.length > 30) return false;
  var t = table_('StepLog'), key = sess + '|' + sk, row = findRow_(t, 'key', key);
  var o = { key: key, session_id: sess, sid: sid, lab_id: clip_(it.lab_id, 80), step_no: num_(it.step_no), step_key: sk, step_title: clip_(it.step_title, 300), status: it.status === 'done' ? 'done' : 'open',
    points: it.status === 'done' ? 1 : 0, first_seen_at: it.first_seen_at, done_at: it.done_at, seconds_on_step: num_(it.seconds_on_step), mistakes: num_(it.mistakes), hints: num_(it.hints) };
  if (!row) appendRow_(t, o);
  else {
    var cur = readRow_(t, row);
    if (cur.status === 'done') { o.status = 'done'; o.points = 1; o.done_at = cur.done_at || o.done_at; }
    o.mistakes = Math.max(+cur.mistakes || 0, o.mistakes); o.hints = Math.max(+cur.hints || 0, o.hints);
    writeRow_(t, row, o);
  }
  return true;
}

function putAnswer_(sid, it) {
  var sess = String(it.session_id || ''), q = String(it.qid || '');
  if (!RE_SESSION.test(sess) || !q || q.length > 40) return false;
  var t = table_('Answers'), key = sess + '|' + q, row = findRow_(t, 'key', key);
  var correct = it.is_correct === true ? 'yes' : it.is_correct === false ? 'no' : '';
  var o = { key: key, session_id: sess, sid: sid, lab_id: clip_(it.lab_id, 80), qid: q, q_type: clip_(it.q_type, 20), question: clip_(it.question, 1200), student_answer: clip_(it.student_answer, 2000),
    correct_answer: clip_(it.correct_answer, 800), is_correct: correct, points: num_(it.points), max_points: num_(it.max_points), needs_marking: it.needs_marking === true, answered_at: it.answered_at || new Date() };
  if (!row) appendRow_(t, o); else writeRow_(t, row, o);       // marks given by the teacher stay (they are not in o)
  return true;
}

function putArtifact_(sid, it) {
  var sess = String(it.session_id || ''), kind = String(it.kind || '');
  if (!RE_SESSION.test(sess) || !/^[A-Za-z0-9_\-\.]{1,40}$/.test(kind)) return false;
  var data = String(it.data || ''); if (data.length > 180000) data = data.slice(0, 180000);
  var t = table_('Artifacts'), key = sess + '|' + kind, row = findRow_(t, 'key', key);
  var o = { key: key, session_id: sess, sid: sid, lab_id: clip_(it.lab_id, 80), kind: kind, updated_at: new Date(), size: data.length };
  for (var i = 0; i < 4; i++) o['data_' + (i + 1)] = data.slice(i * 45000, (i + 1) * 45000);
  if (!row) appendRow_(t, o); else writeRow_(t, row, o);
  return true;
}

/* a lab screenshot: kind = before | after, data = 'data:image/jpeg;base64,...' (the browser keeps it under ~175 000 characters). One row per session + kind; a newer one replaces the older. */
function putShot_(sid, it) {
  var sess = String(it.session_id || ''), kind = String(it.kind || '');
  if (!RE_SESSION.test(sess) || (kind !== 'before' && kind !== 'after')) return false;
  var data = String(it.data || ''); if (data.indexOf('data:image/jpeg;base64,') !== 0 || data.length > 180000) return false;
  var t = table_('Shots'), key = sess + '|' + kind, row = findRow_(t, 'key', key);
  var o = { key: key, session_id: sess, sid: sid, lab_id: clip_(it.lab_id, 80), week: num_(it.week), slot: clip_(it.slot, 40), kind: kind, taken_at: new Date(), size: data.length };
  for (var i = 0; i < 4; i++) o['data_' + (i + 1)] = data.slice(i * 45000, (i + 1) * 45000);
  if (!row) appendRow_(t, o); else writeRow_(t, row, o);
  return true;
}
/* the screenshots of one student for one week (week 0 = all weeks). Only the sid + week columns are scanned; the images are read for the matching rows only. */
function shotsOf_(sid, week) {
  var t = table_('Shots'), last = t.sh.getLastRow(); if (last < 2) return [];
  var ci = colOf_(t, 'sid'), cw = colOf_(t, 'week'), n = last - 1;
  var sids = t.sh.getRange(2, ci + 1, n, 1).getValues(), wks = t.sh.getRange(2, cw + 1, n, 1).getValues(), out = [];
  for (var i = 0; i < n; i++) {
    if (String(sids[i][0]) !== String(sid)) continue;
    if (week && num_(wks[i][0]) !== week) continue;
    var r = readRow_(t, i + 2);
    out.push({ session_id: r.session_id, lab_id: r.lab_id, week: r.week, slot: r.slot, kind: r.kind, taken_at: r.taken_at, data: [r.data_1, r.data_2, r.data_3, r.data_4].join('') });
  }
  return out;
}
function shots_(me, b) {
  var sid = String(b.sid || '').trim(), stu = studentRowOf_(sid);
  if (!stu) throw new Error('Bad student: not found');
  if (!scopeOk_(me, stu.sid, stu.grade)) throw new Error('Not allowed: this class is not yours');
  return { ok: true, shots: shotsOf_(sid, num_(b.week)) };
}
function myShots_(b, s) {
  if (String(s.student_self_view).toUpperCase() !== 'TRUE') throw new Error('Not allowed: student view is off');
  var stu = studentLookup_(b);
  return { ok: true, shots: shotsOf_(String(stu.sid), num_(b.week)) };
}

var EV_CACHE_ = null;
function putEvent_(sid, it) {
  var type = String(it.type || ''); if (!/^[a-z_]{2,24}$/.test(type)) return false;
  /* the same event can arrive twice (page-close beacon + normal send): skip it when it is already among the last rows */
  var t = table_('Events'), when = it.ts ? new Date(it.ts).getTime() : 0, sig = [it.session_id, type, when, clip_(it.detail, 600)].join('|');
  if (!EV_CACHE_) {
    EV_CACHE_ = {}; var last = t.sh.getLastRow();
    if (last > 1) { var n = Math.min(300, last - 1); t.sh.getRange(last - n + 1, 1, n, 7).getValues().forEach(function (r) { EV_CACHE_[[r[1], r[4], r[0] instanceof Date ? r[0].getTime() : 0, r[6]].join('|')] = 1; }); }
  }
  if (EV_CACHE_[sig]) return true;
  EV_CACHE_[sig] = 1;
  appendRow_(table_('Events'), { ts: it.ts || new Date(), session_id: clip_(it.session_id, 48), sid: sid, lab_id: clip_(it.lab_id, 80), type: type, step_key: clip_(it.step_key, 30), detail: clip_(it.detail, 600) });
  return true;
}

/* ===================================================================================================================
   AUTH — teachers log in with name + PIN, get a token valid 6 hours
   =================================================================================================================== */
/* a teacher signs in with the teacher ID (e.g. LF2033) or the name, plus the password. Only a salted SHA-256 of the password is stored (Teachers tab, column pin_sha256). */
function isTeacherRow_(r, who) {
  var w = String(who || '').trim().toLowerCase(), act = (r.active === true || String(r.active).toUpperCase() === 'TRUE');
  return act && w && (String(r.teacher_id).toLowerCase() === w || slug_(r.name) === slug_(w));
}
/* A teacher row typed by hand into the Teachers tab (ID, name, role and a PLAIN password in pin_sha256) is completed here:
   the plain password is replaced by its salted hash, empty active -> TRUE, empty grades -> ALL, empty role -> teacher.
   Rows made by "Add / reset a teacher" are already complete and are left alone. */
function tidyTeachers_() {
  var t = table_('Teachers'), last = t.sh.getLastRow(); if (last < 2) return;
  var vals = t.sh.getRange(2, 1, last - 1, t.cols.length).getValues(), ci = {}; t.cols.forEach(function (c, i) { ci[c] = i; });
  vals.forEach(function (v, i) {
    if (String(v[ci.teacher_id]).trim() === '') return;
    var pin = String(v[ci.pin_sha256]).trim(), upd = {};
    if (pin && !/^[0-9a-f]{64}$/.test(pin)) { setupSalt_(); upd.pin_sha256 = hash_(pin); }
    if (v[ci.active] === '' || v[ci.active] === null) upd.active = true;
    if (String(v[ci.grades]).trim() === '') upd.grades = 'ALL';
    if (String(v[ci.role]).trim() === '') upd.role = 'teacher';
    if (v[ci.created_at] === '' && Object.keys(upd).length) upd.created_at = new Date();
    if (Object.keys(upd).length) writeRow_(t, i + 2, upd);
  });
}
/* public: what kind of ID is this?
     staff    = a row of the Teachers tab with NO password (pin_sha256 empty): signs in with the ID alone, sees only the grades written in its "grades" column
     teacher  = a row of the Teachers tab WITH a password: ID + password (login)
     student  = anything else (checked against the Roster by the lab / dashboard) */
function verify_(b) {
  var id = String(b.sid || b.user || '').trim(); if (!id) throw new Error('Wrong ID');
  tidyTeachers_();
  var tr = teacherById_(id);
  if (tr && !String(tr.pin_sha256).trim()) {
    var sf = staffObj_(tr), info = tokenInfo_(sf);
    var row = findRow_(table_('Teachers'), 'teacher_id', tr.teacher_id); if (row) writeRow_(table_('Teachers'), row, { last_login: new Date() });
    try { syncTeacherRow_(tr, row); } catch (e) { log_('warn', 'sync', String(e.message || e)); }
    return { ok: true, kind: 'staff', token: issueToken_(info), teacher: { id: sf.sid, name: sf.name, role: sf.role, grades: sf.spec }, school: getSettings_().school_name };
  }
  var t = false; rowsOf_('Teachers').forEach(function (r) { if (isTeacherRow_(r, id) && String(r.pin_sha256).trim()) t = true; });
  if (t) return { ok: true, kind: 'teacher' };
  return { ok: true, kind: 'student' };
}
function issueToken_(info) {
  var token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  CacheService.getScriptCache().put('tok:' + token, JSON.stringify(info), 21600);
  return token;
}

/* ---- STAFF: teachers / admins live in the TEACHERS tab (never in the app files, never in the Roster) ----
   teacher_id | name | role (admin / teacher) | pin_sha256 (empty = ID only) | grades | active | ...
   grades = what this person may see, written as you like:   BOYS-G-10E,G-10F,G-11D,G-12C   |   BOYS ALL   |   GIRLS ALL   |   BOYS ALL , GIRLS ALL   |   G-10C to G-10J GIRLS
   The students themselves always come from the Roster tab (SID, SNAME, GRADE, SCHOOL). Change the Teachers tab and the access changes. */
var ROSTER_ = null;
var STAFFNAME_ = /^(FACULTY|TEACHER|HOD|ADMIN|ADMINISTRATOR|DIRECTOR|PRINCIPAL|V\s*PRINCIPAL|VICE|ACADEMIC)\b/i;
function rosterAll_() {
  if (ROSTER_) return ROSTER_;
  var t = table_('Roster'), last = t.sh.getLastRow(), out = [], tids = staffIds_();
  if (last >= 2) {
    var n = Math.max(4, t.sh.getLastColumn()), v = t.sh.getRange(2, 1, last - 1, n).getValues();
    v.forEach(function (r) {
      var sid = String(r[0]).trim(); if (!sid) return;
      if (tids[sid.toLowerCase()] || STAFFNAME_.test(String(r[1]).trim())) return;            // a teacher / admin row (Teachers tab, or old-style text) is never a student
      var cells = r.slice(2).map(function (x) { return String(x).trim(); }), school = '', grade = '';
      cells.forEach(function (c) {                                   // BOYS / GIRLS and the grade (G-10E) are found wherever they are written after the name
        if (!school && /^(BOYS|GIRLS)$/i.test(c)) school = c.toUpperCase();
        var g = gradeTok_(c); if (!grade && g && g.level && g.sect) grade = c;
      });
      out.push({ sid: sid, name: String(r[1]).trim(), grade: grade || cells[0] || '', school: school || cells[1] || '', spec: cells.filter(String).join(' ') });
    });
  }
  return (ROSTER_ = out);
}
/* "G-10E" "G10E" "G-10-E" "GRADE 10E" -> {level:10, sect:'E'}; "G-12ALL" "G-12" -> {level:12, sect:''}; "ALL" -> {level:0, sect:''} */
function gradeTok_(t) {
  t = String(t || '').toUpperCase().replace(/^GRADES?[-_ ]*/, 'G-');
  if (t === 'ALL') return { level: 0, sect: '' };
  var m = /^G-?(\d{1,2})[-_]?([A-Z]*)$/.exec(t); if (!m) return null;
  return { level: +m[1], sect: m[2] === 'ALL' ? '' : m[2] };
}
/* the access text -> { BOYS: [items]|null, GIRLS: [items]|null, ANY: [items]|null, n: grade tokens, all: a token said ALL } ; items = {level, sect} (0 / '' = every grade / every section)
   understands:  BOYS: G-10E,G-10F   BOYS-G-10E,G-10F   G-10E,G-10F BOYS   BOYS ALL   ALL GIRLS SECTIONS   G-10C to G-10J   G-12ALL   BOYS ALL , GIRLS ALL  (also in several cells / lines, with - – — : ; separators) */
function expandRanges_(s) {
  return s.replace(/G-?(\d{1,2})-?([A-Z])\s*(?:TO|THRU|THROUGH|UNTIL|~|-(?=\s*G)|\u2013|\u2014)\s*(?:G-?(\d{1,2})-?)?([A-Z])(?![A-Z0-9])/g, function (m, l1, a1, l2, a2) {
    var out = [], lo = a1.charCodeAt(0), hi = a2.charCodeAt(0); if (lo > hi) { var t = lo; lo = hi; hi = t; }
    var levels = (l2 && l2 !== l1) ? [l1, l2] : [l1];
    levels.forEach(function (lv, k) { if (levels.length === 2) { var from = k === 0 ? a1.charCodeAt(0) : 65, to = k === 0 ? 90 : a2.charCodeAt(0); for (var c = from; c <= to; c++) out.push('G-' + lv + String.fromCharCode(c)); } else for (var c2 = lo; c2 <= hi; c2++) out.push('G-' + lv + String.fromCharCode(c2)); });
    return ' ' + out.join(' ') + ' ';
  });
}
function parseScope_(spec) {
  var s = String(spec || '').toUpperCase().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[;|\/&\n\r]/g, ' ').replace(/\bAND\b/g, ' ');
  s = expandRanges_(s).replace(/(BOYS|GIRLS)\s*[-:=]+/g, '$1 ');
  var toks = s.split(/[,\s]+/).filter(Boolean), scope = { BOYS: null, GIRLS: null, ANY: null, n: 0, all: false };
  var kw = function (t) { return t === 'BOYS' || t === 'GIRLS'; };
  var before = toks.length && !kw(toks[0]), pending = [], cur = null;
  var add = function (key, it) { (scope[key] = scope[key] || []).push(it); };
  toks.forEach(function (t) {
    if (kw(t)) { pending.forEach(function (it) { add(t, it); }); pending = []; cur = t; scope[t] = scope[t] || []; return; }
    var g = gradeTok_(t); if (!g) return;
    scope.n++; if (g.level === 0) scope.all = true;
    if (before || !cur) pending.push(g); else add(cur, g);
  });
  pending.forEach(function (it) { add('ANY', it); });
  return scope;
}
function scopeAllOf_(items) { return !!items && items.some(function (it) { return it.level === 0; }); }
function scopeEvery_(sc) { return !!sc && (scopeAllOf_(sc.ANY) || (scopeAllOf_(sc.BOYS) && scopeAllOf_(sc.GIRLS))); }
function isActive_(r) { return r.active === true || String(r.active).toUpperCase() === 'TRUE'; }
/* the active Teachers row of an ID (exact teacher_id, any letter case) */
function teacherById_(id) {
  var w = String(id || '').trim().toLowerCase(), hit = null; if (!w) return null;
  rowsOf_('Teachers').forEach(function (r) { if (!hit && isActive_(r) && String(r.teacher_id).trim().toLowerCase() === w) hit = r; });
  return hit;
}
/* the grades column -> a scope, or null when it is an old-style list (ALL, or CYBERSECURITY-GRADE-11-A,...) */
function accessScope_(spec) {
  var s = String(spec || '').trim(); if (!/BOYS|GIRLS|(^|[^A-Z])G-?\d{1,2}/i.test(s)) return null;
  var sc = parseScope_(s); return { BOYS: sc.BOYS, GIRLS: sc.GIRLS, ANY: sc.ANY };
}
function staffObj_(r) {
  var spec = String(r.grades || '').trim() || 'ALL', sc = accessScope_(spec), first = null;
  if (sc) ['ANY', 'BOYS', 'GIRLS'].forEach(function (k) { (sc[k] || []).forEach(function (it) { if (!first && it.level) first = it; }); });
  return { sid: String(r.teacher_id).trim(), name: String(r.name || '').trim(), spec: spec, scope: sc, every: sc ? scopeEvery_(sc) : false,
    role: String(r.role).toLowerCase() === 'admin' ? 'admin' : 'teacher', grade: first ? 'G-' + first.level + (first.sect || 'E') : 'G-10E' };
}
function tokenInfo_(sf) { return { tid: sf.sid, name: sf.name, role: sf.role, grades: sf.spec, scope: sf.scope, every: sf.every, admin: sf.role === 'admin' && (!sf.scope || sf.every), src: 'teachers' }; }
/* which grades / how many students a Teachers row gets from the Roster:  { BOYS: {grades:['G-10E',..], n}, GIRLS: {...} } */
function accessOf_(sf) {
  var out = { BOYS: { g: {}, n: 0 }, GIRLS: { g: {}, n: 0 } };
  if (!sf.scope) return out;
  var me = { scope: sf.scope, every: sf.every };
  rosterAll_().forEach(function (r) {
    var g = gradeTok_(r.grade); if (!g || !g.level || !g.sect) return;
    if (!scopeOk_(me, r.sid, 'G-' + g.level + g.sect)) return;
    var k = String(r.school).toUpperCase() === 'GIRLS' ? 'GIRLS' : 'BOYS';
    out[k].g['G-' + g.level + g.sect] = [g.level, g.sect]; out[k].n++;
  });
  return out;
}
function gradeList_(o) { return Object.keys(o.g).sort(function (a, b) { return (o.g[a][0] - o.g[b][0]) || (o.g[a][1] < o.g[b][1] ? -1 : 1); }).join(', '); }
/* write the five computed columns of one Teachers row (grades fetched from the Roster) */
function syncTeacherRow_(r, row) {
  var t = table_('Teachers'); ensureTeacherCols_(); row = row || findRow_(t, 'teacher_id', r.teacher_id); if (!row) return;
  var sf = staffObj_(r), a = accessOf_(sf);
  writeRow_(t, row, { boys_grades: gradeList_(a.BOYS), girls_grades: gradeList_(a.GIRLS), boys: a.BOYS.n, girls: a.GIRLS.n, access_synced: new Date() });
}
function ensureTeacherCols_() {
  var sh = db_().getSheetByName('Teachers'); if (!sh) return;
  var head = sh.getRange(1, 1, 1, SCHEMA.Teachers.length).getValues()[0];
  if (String(head[8]) !== 'boys_grades') ensureSheet_(db_(), 'Teachers');
}
/* menu CYBER LABS > Refresh staff access from the Roster: fills boys_grades / girls_grades / boys / girls for every Teachers row */
function syncTeacherAccess() {
  ROSTER_ = null; RIDX_ = null; tidyTeachers_(); ensureTeacherCols_();
  var rows = rowsOf_('Teachers'), n = 0; rows.forEach(function (r, i) { if (String(r.teacher_id).trim()) { syncTeacherRow_(r, i + 2); n++; } });
  try { CacheService.getScriptCache().remove('staffids'); } catch (e) {}
  var msg = 'Staff access refreshed for ' + n + ' Teachers row(s).';
  log_('info', 'sync', msg); try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}
/* run from the editor to see what one ID gets:  checkAccess('BT4088')  -> View > Logs */
function checkAccess(id) {
  id = String(id || 'BT4088'); ROSTER_ = null; RIDX_ = null;
  var tr = teacherById_(id);
  Logger.log('Roster students read: ' + rosterAll_().length + ' (version ' + VERSION + ')');
  if (!tr) { Logger.log(id + ' is NOT an active row of the Teachers tab (check teacher_id and active).'); return; }
  var sf = staffObj_(tr), a = accessOf_(sf);
  Logger.log(id + ' | ' + sf.name + ' | role ' + sf.role + ' | password ' + (String(tr.pin_sha256).trim() ? 'YES (ID + password)' : 'no (ID only)') + ' | grades text: ' + sf.spec);
  Logger.log('parsed: ' + JSON.stringify(sf.scope) + (sf.scope ? '' : '   (old-style list: ' + sf.spec + ')'));
  Logger.log('BOYS  ' + a.BOYS.n + ' students: ' + gradeList_(a.BOYS));
  Logger.log('GIRLS ' + a.GIRLS.n + ' students: ' + gradeList_(a.GIRLS));
}
/* the IDs of all Teachers rows (cached 5 minutes): their lab work is not written to the student reports, and they are never listed as students */
function staffIds_() {
  var cache = CacheService.getScriptCache(), raw = cache.get('staffids');
  if (raw) { try { return JSON.parse(raw); } catch (e) {} }
  var m = {}; rowsOf_('Teachers').forEach(function (r) { var id = String(r.teacher_id).trim().toLowerCase(); if (id) m[id] = 1; });
  try { cache.put('staffids', JSON.stringify(m), 300); } catch (e) {}
  return m;
}
function labGrade_(g) { var t = gradeTok_(g); return t && t.level && t.sect ? 'CYBERSECURITY-GRADE-' + t.level + '-' + t.sect : ''; }
/* the Students row of a SID, or - for a student who has not started anything yet - a row made from the Roster */
function studentRowOf_(sid) {
  var stu = null; rowsOf_('Students').forEach(function (r) { if (String(r.sid) === String(sid)) stu = r; });
  if (stu) return stu;
  var w = String(sid || '').trim().toLowerCase(), hit = null; rosterAll_().forEach(function (r) { if (!hit && r.sid.toLowerCase() === w) hit = r; });
  if (!hit) return null;
  var g = labGrade_(hit.grade), pg = parseGrade_(g);
  return { sid: hit.sid, name: hit.name, grade: g, class_short: shortGrade_(g), grade_level: pg.level, section: pg.section, first_seen: '', last_seen: '', sessions: 0 };
}
var RIDX_ = null;
function rosterIdx_() {
  if (RIDX_) return RIDX_;
  var m = {}; rosterAll_().forEach(function (r) { var g = gradeTok_(r.grade) || { level: 0, sect: '' }; m[r.sid.toLowerCase()] = { school: String(r.school).toUpperCase().trim(), level: g.level, sect: g.sect }; });
  return (RIDX_ = m);
}
/* may this signed-in teacher see this student? (Teachers-tab teachers: by grade list as before; Roster staff: by school + grade + section from the Roster) */
function scopeOk_(me, sid, grade) {
  if (!me.scope) return gradeAllowed_(me, grade);
  if (me.every) return true;
  var r = rosterIdx_()[String(sid || '').trim().toLowerCase()]; if (!r) return false;
  var items = (me.scope[r.school] || []).concat(me.scope.ANY || []);
  return items.some(function (it) { return (!it.level || it.level === r.level) && (!it.sect || it.sect === r.sect); });
}
/* SID check for the start screen of every lab: finds the SID in the Roster tab (SID, SNAME, GRADE, SCHOOL) and returns that student's details.
   It reads the WHOLE SID column (row 2 down to the last row), so the list can grow to any size and new grades / schools can simply be added as new rows. */
function lookup_(b) {
  var sid = String(b.sid || '').trim();
  if (!/^[A-Za-z0-9_.\-]{2,24}$/.test(sid)) throw new Error('Bad SID');
  var tr = teacherById_(sid);                                         // a teacher / admin (Teachers tab): may open every lab in every week
  if (tr) { var sf0 = staffObj_(tr); return { ok: true, student: { sid: sf0.sid, name: sf0.name.replace(/^[A-Za-z ]{3,14}:\s*/, '') || sf0.name, grade: sf0.grade, school: 'STAFF', staff: true, role: sf0.role } }; }
  var all = rosterAll_(); if (!all.length) throw new Error('Wrong SID: the student list is empty');
  var want = sid.toLowerCase(), hit = null; all.forEach(function (r) { if (!hit && r.sid.toLowerCase() === want) hit = r; });
  if (!hit) throw new Error('Wrong SID: not in the student list');
  return { ok: true, student: { sid: hit.sid, name: hit.name, grade: hit.grade, school: hit.school } };
}
function login_(b) {
  var cache = CacheService.getScriptCache(), who = String(b.user || '').trim().toLowerCase(), pin = String(b.pin || '');
  if (!who || !pin) throw new Error('Wrong ID or password');
  tidyTeachers_();
  var failKey = 'fail:' + slug_(who), fails = +(cache.get(failKey) || 0);
  if (fails >= 5) throw new Error('Too many attempts. Wait 10 minutes.');
  var t = table_('Teachers'), rows = rowsOf_('Teachers'), me = null, h = hash_(pin);
  rows.forEach(function (r) { if (isTeacherRow_(r, who) && String(r.pin_sha256) === h) me = r; });
  if (!me) { cache.put(failKey, String(fails + 1), 600); throw new Error('Wrong ID or password'); }
  cache.remove(failKey);
  var token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  var info = tokenInfo_(staffObj_(me));
  cache.put('tok:' + token, JSON.stringify(info), 21600);
  var row = findRow_(t, 'teacher_id', me.teacher_id); if (row) writeRow_(t, row, { last_login: new Date() });
  return { ok: true, token: token, teacher: { id: me.teacher_id, name: me.name, role: info.role, grades: info.grades }, school: getSettings_().school_name };
}
function auth_(b, adminOnly) {
  var raw = CacheService.getScriptCache().get('tok:' + String(b.token || ''));
  if (!raw) throw new Error('Not allowed: please log in again');
  var me = JSON.parse(raw);
  if (adminOnly && me.role !== 'admin') throw new Error('Not allowed: admin only');
  return me;
}
function gradeAllowed_(me, grade) {
  if (!me.grades || me.grades === 'ALL') return true;
  return me.grades.split(',').map(function (x) { return x.trim(); }).indexOf(String(grade)) >= 0;
}

/* ===================================================================================================================
   REPORTS
   =================================================================================================================== */
function bestPerLab_(sessions) {
  var best = {};
  sessions.forEach(function (s) {
    var k = s.lab_id, b = best[k];
    if (!b) best[k] = { best: s, attempts: 1, last: s.last_active };
    else {
      b.attempts++;
      if ((+s.completion_pct || 0) > (+b.best.completion_pct || 0) || ((+s.completion_pct || 0) === (+b.best.completion_pct || 0) && (+s.points || 0) > (+b.best.points || 0))) b.best = s;
      if (String(s.last_active) > String(b.last)) b.last = s.last_active;
    }
  });
  return best;
}

/* ---- UNITS: a "unit" = a week card + one of its buttons (week + slot). Whatever lab the student picks inside it counts for that unit. ---- */
var SLOT_RANK_ = { 'LAB-1': 1, 'LAB-2': 2, 'LAB-3': 3, 'CS-TEST': 4, 'HW': 5, 'PROJECT-Q1': 6, 'PROJECT-Q2': 7 };
function ukey_(w, s) { return num_(w) + '|' + String(s || ''); }
function better_(a, b) {                       // is session b a better attempt than a?
  if (!a) return true;
  var pa = +a.completion_pct || 0, pb = +b.completion_pct || 0;
  return pb > pa || (pb === pa && (+b.points || 0) > (+a.points || 0));
}
function unitCatalog_() { return rowsOf_('Units').filter(function (u) { return u.active !== false && String(u.active).toUpperCase() !== 'FALSE'; }); }
function unitsOf_(sessions, cat) {
  var by = {}, order = [];
  function get(w, sl) {
    var k = ukey_(w, sl);
    if (!by[k]) { by[k] = { unit_id: 'W' + num_(w) + '|' + String(sl || ''), week: num_(w), slot: String(sl || ''), label: '', module: '', title: '', inCatalog: false, sessions: [] }; order.push(k); }
    return by[k];
  }
  (cat || []).forEach(function (c) { var u = get(c.week, c.slot); u.label = c.label || u.label; u.module = c.module || u.module; u.title = c.title || u.title; u.inCatalog = true; });
  sessions.forEach(function (x) { get(x.week, x.slot).sessions.push(x); });
  var res = order.map(function (k) {
    var u = by[k], best = null, completed = false, mis = 0, hints = 0, secs = 0, last = '', labs = {};
    u.sessions.forEach(function (x) {
      if (better_(best, x)) best = x;
      if (x.status === 'completed') completed = true;
      mis += +x.mistakes || 0; hints += +x.hints || 0; secs += +x.active_seconds || 0;
      if (String(x.last_active) > last) last = String(x.last_active);
      var l = labs[x.lab_id] = labs[x.lab_id] || { lab_id: x.lab_id, title: x.lab_title, attempts: 0, best: null, status: 'in_progress' };
      l.attempts++; if (better_(l.best, x)) l.best = x; if (x.status === 'completed') l.status = 'completed';
    });
    u.label = u.label || u.slot || (u.week ? 'Week ' + u.week : 'Other');
    u.status = completed ? 'completed' : u.sessions.length ? 'in_progress' : 'not_started';
    u.best = best; u.attempts = u.sessions.length; u.mistakes = mis; u.hints = hints; u.seconds = secs; u.lastActive = last;
    u.labs = Object.keys(labs).map(function (id) { return labs[id]; });
    u.session_ids = u.sessions.map(function (x) { return x.session_id; });
    delete u.sessions;
    return u;
  });
  res.sort(function (a, b) { return (a.week - b.week) || ((SLOT_RANK_[a.slot] || 9) - (SLOT_RANK_[b.slot] || 9)) || String(a.slot).localeCompare(String(b.slot)); });
  return res;
}

function classReport_(me, b) {
  var gradeFilter = b.grade ? String(b.grade) : '';
  var students = {}, order = [];
  rowsOf_('Students').forEach(function (r) {
    if (!scopeOk_(me, r.sid, r.grade)) return;
    if (gradeFilter && String(r.grade) !== gradeFilter) return;
    students[r.sid] = { sid: r.sid, name: r.name, grade: r.grade, class_short: r.class_short, firstSeen: r.first_seen, lastSeen: r.last_seen, sessions: [] };
    order.push(r.sid);
  });
  var sfIds = staffIds_();                                          // every student of the teacher's classes from the Roster is listed - also those who never started a lab
  rosterAll_().forEach(function (r) {
    if (students[r.sid] || sfIds[r.sid.toLowerCase()]) return;
    var g = labGrade_(r.grade); if (!g || !scopeOk_(me, r.sid, g)) return;
    if (gradeFilter && g !== gradeFilter) return;
    students[r.sid] = { sid: r.sid, name: r.name, grade: g, class_short: shortGrade_(g), firstSeen: '', lastSeen: '', sessions: [] };
    order.push(r.sid);
  });
  rowsOf_('Sessions').forEach(function (s) { if (students[s.sid]) students[s.sid].sessions.push(s); });
  var labs = rowsOf_('Labs').filter(function (l) { return l.active !== false && String(l.active).toUpperCase() !== 'FALSE'; });
  /* every unit of the catalogue + any unit a listed student has used */
  var units = {}, cat = unitCatalog_();
  cat.forEach(function (c) { units[ukey_(c.week, c.slot)] = { unit_id: 'W' + num_(c.week) + '|' + c.slot, week: num_(c.week), slot: c.slot, label: c.label || c.slot }; });
  order.forEach(function (sid) { students[sid].sessions.forEach(function (x) { var k = ukey_(x.week, x.slot); if (!units[k]) units[k] = { unit_id: 'W' + num_(x.week) + '|' + (x.slot || ''), week: num_(x.week), slot: x.slot || '', label: x.slot || (x.week ? 'Week ' + x.week : 'Other') }; }); });
  var perWeek = {}; Object.keys(units).forEach(function (k) { var u = units[k]; if (u.week > 0) (perWeek[u.week] = perWeek[u.week] || []).push(k); });
  var out = order.map(function (sid) {
    var s = students[sid], ub = {}, started = 0, completed = 0, pts = 0, mis = 0, hints = 0, secs = 0, last = '', sumPct = 0;
    s.sessions.forEach(function (x) {
      var k = ukey_(x.week, x.slot), u = ub[k] = ub[k] || { best: null, comp: false };
      if (better_(u.best, x)) u.best = x; if (x.status === 'completed') u.comp = true;
      mis += +x.mistakes || 0; hints += +x.hints || 0; secs += +x.active_seconds || 0; if (String(x.last_active) > last) last = String(x.last_active);
    });
    Object.keys(ub).forEach(function (k) { var u = ub[k]; started++; if (u.comp) completed++; sumPct += u.comp ? 100 : (+u.best.completion_pct || 0); pts += +u.best.points || 0; });
    var weeks = {};
    Object.keys(perWeek).forEach(function (w) {
      var ks = perWeek[w], tot = 0; ks.forEach(function (k) { tot += ub[k] ? (ub[k].comp ? 100 : (+ub[k].best.completion_pct || 0)) : 0; });
      weeks[w] = Math.round(tot / ks.length);
    });
    var pu = {};   /* unit_id -> [pct, 'c' completed | 'p' in progress, points, mistakes, hints, seconds] : every unit this student has touched */
    Object.keys(ub).forEach(function (k) { var u = ub[k], q = k.split('|'); pu['W' + q[0] + '|' + q[1]] = [u.comp ? 100 : (+u.best.completion_pct || 0), u.comp ? 'c' : 'p', +u.best.points || 0, 0, 0, 0]; });
    s.sessions.forEach(function (x) { var e = pu['W' + num_(x.week) + '|' + String(x.slot || '')]; if (e) { e[3] += +x.mistakes || 0; e[4] += +x.hints || 0; e[5] += +x.active_seconds || 0; } });
    var pg = parseGrade_(s.grade);
    return { sid: sid, name: s.name, grade: s.grade, school: (rosterIdx_()[String(sid).toLowerCase()] || {}).school || '', class_short: s.class_short, grade_level: pg.level, section: pg.section, labsStarted: started, labsCompleted: completed, avgCompletion: started ? Math.round(sumPct / started) : 0,
      points: pts, mistakes: mis, hints: hints, minutes: Math.round(secs / 60), lastActive: last || s.lastSeen, weeks: weeks, units: pu };
  });
  var grades = {}; order.forEach(function (id) { var g = students[id].grade; grades[g] = (grades[g] || 0) + 1; });
  var ulist = Object.keys(units).map(function (k) { return units[k]; }).sort(function (a, b) { return (a.week - b.week) || ((SLOT_RANK_[a.slot] || 9) - (SLOT_RANK_[b.slot] || 9)); });
  var nb = 0, ng = 0; out.forEach(function (x) { if (x.school === 'GIRLS') ng++; else nb++; });
  return { ok: true, server: VERSION, access: { id: me.tid || me.teacher_id || '', name: me.name || '', role: me.role || '', spec: String(me.grades || ''), src: me.src || '', boys: nb, girls: ng }, students: out, grades: grades, units: ulist, catalog: labs.map(function (l) { return { lab_id: l.lab_id, week: l.week, title: l.title, steps_total: l.steps_total }; }), generatedAt: new Date().toISOString(), currentWeek: currentWeek_('CYBER', getSettings_()), school: getSettings_().school_name, title: getSettings_().report_title };
}

function studentReport_(me, sid, forStudent) {
  sid = String(sid || '').trim();
  var stu = studentRowOf_(sid);
  if (!stu) throw new Error('Bad student: not found');
  if (!forStudent && !scopeOk_(me, stu.sid, stu.grade)) throw new Error('Not allowed: this class is not yours');
  var sessions = rowsOf_('Sessions').filter(function (s) { return String(s.sid) === sid; });
  var steps = rowsOf_('StepLog').filter(function (s) { return String(s.sid) === sid; });
  var answers = rowsOf_('Answers').filter(function (s) { return String(s.sid) === sid; });
  var arts = rowsOf_('Artifacts').filter(function (s) { return String(s.sid) === sid; }).map(function (a) { return { key: a.key, session_id: a.session_id, lab_id: a.lab_id, kind: a.kind, updated_at: a.updated_at, size: a.size }; });
  var events = rowsOf_('Events').filter(function (s) { return String(s.sid) === sid; }).slice(-150);
  var cat = unitCatalog_(), units = unitsOf_(sessions, cat);
  var labIds = {}, labSteps = {}; sessions.forEach(function (s) { labIds[s.lab_id] = 1; });      // the step names of the labs this student worked on (the portfolio lists every rubric step, also the ones not done)
  rowsOf_('Labs').forEach(function (l) { if (labIds[l.lab_id] && l.steps_json) { try { var a = JSON.parse(l.steps_json); if (a && a.length) labSteps[l.lab_id] = a.slice(0, 80).map(function (x) { return String(x).slice(0, 160); }); } catch (e) {} } });
  var t = { started: 0, completed: 0, points: 0, maxPoints: 0, mistakes: 0, hints: 0, minutes: 0 };
  units.forEach(function (u) { if (u.status !== 'not_started') t.started++; if (u.status === 'completed') t.completed++; if (u.best) { t.points += +u.best.points || 0; t.maxPoints += +u.best.max_points || 0; } });
  sessions.forEach(function (s) { t.mistakes += +s.mistakes || 0; t.hints += +s.hints || 0; t.minutes += (+s.active_seconds || 0) / 60; });
  t.minutes = Math.round(t.minutes);
  t.labsInCatalog = Math.max(cat.length, units.length);
  return { ok: true, student: { sid: stu.sid, name: stu.name, grade: stu.grade, class_short: stu.class_short, grade_level: parseGrade_(stu.grade).level, section: parseGrade_(stu.grade).section, firstSeen: stu.first_seen, lastSeen: stu.last_seen },
    currentWeek: currentWeek_('CYBER', getSettings_()), units: units, sessions: sessions, steps: steps, labSteps: labSteps, answers: answers, artifacts: arts, events: events, totals: t, school: getSettings_().school_name, title: getSettings_().report_title, generatedAt: new Date().toISOString() };
}

function studentLookup_(b) {
  var sid = String(b.sid || '').trim(), nm = norm_(b.name), stu = null;
  rowsOf_('Students').forEach(function (r) { if (String(r.sid) === sid) stu = r; });
  if (!stu || !nm || norm_(stu.name) !== nm) throw new Error('Wrong SID or name');
  return stu;
}
function myReport_(b, s) {
  if (String(s.student_self_view).toUpperCase() !== 'TRUE') throw new Error('Not allowed: student view is off');
  var stu = studentLookup_(b);
  var r = studentReport_(null, stu.sid, true);
  r.events = []; r.artifacts = [];                     // a student sees scores, steps and own answers only
  return r;
}

/* the master table at the bottom of every lab: this student's state of every button of ONE week (works from any device) */
function myWeek_(b) {
  var stu = studentLookup_(b), w = num_(b.week);
  var sessions = rowsOf_('Sessions').filter(function (s) { return String(s.sid) === String(stu.sid) && num_(s.week) === w; });
  var cat = unitCatalog_().filter(function (c) { return num_(c.week) === w; });
  var pdfBy = {}; sessions.forEach(function (x) { if (+x.files_saved > 0) pdfBy[x.slot || ''] = true; });   // a lab PDF / certificate was saved from this button
  var units = unitsOf_(sessions, cat).map(function (u) {
    var x = u.best;
    return { slot: u.slot, label: u.label, status: u.status, done: x ? +x.steps_done || 0 : 0, total: x ? +x.steps_total || 0 : 0, pct: x ? +x.completion_pct || 0 : 0,
      mis: x ? +x.mistakes || 0 : 0, hints: x ? +x.hints || 0 : 0, lab: x ? x.lab_id : '', title: x ? x.lab_title : '', attempts: u.attempts, pdf: !!pdfBy[u.slot] };
  });
  return { ok: true, week: w, units: units };
}

function labReport_(me, labId) {
  var sessions = rowsOf_('Sessions').filter(function (s) { return String(s.lab_id) === String(labId) && scopeOk_(me, s.sid, s.grade); });
  var ids = {}; sessions.forEach(function (s) { ids[s.session_id] = 1; });
  var steps = rowsOf_('StepLog').filter(function (s) { return ids[s.session_id]; });
  var answers = rowsOf_('Answers').filter(function (s) { return ids[s.session_id]; });
  var by = {};
  steps.forEach(function (s) {
    var k = s.step_key, x = by[k] = by[k] || { step_key: k, step_no: s.step_no, title: s.step_title, n: 0, done: 0, mistakes: 0, hints: 0, secs: 0 };
    x.n++; if (s.status === 'done') { x.done++; x.secs += +s.seconds_on_step || 0; } x.mistakes += +s.mistakes || 0; x.hints += +s.hints || 0;
  });
  var stepStats = Object.keys(by).map(function (k) { var x = by[k]; return { step_key: k, step_no: x.step_no, title: x.title, reached: x.n, done: x.done, mistakes: x.mistakes, hints: x.hints, avgSeconds: x.done ? Math.round(x.secs / x.done) : 0 }; })
    .sort(function (a, b) { return a.step_no - b.step_no; });
  var q = {}; answers.forEach(function (a) { var x = q[a.qid] = q[a.qid] || { qid: a.qid, question: a.question, type: a.q_type, n: 0, correct: 0 }; x.n++; if (a.is_correct === 'yes') x.correct++; });
  var students = {}, comp = 0, mis = 0, secs = 0;
  sessions.forEach(function (s) { students[s.sid] = 1; if (s.status === 'completed') comp++; mis += +s.mistakes || 0; secs += +s.active_seconds || 0; });
  return { ok: true, lab_id: labId, attempts: sessions.length, students: Object.keys(students).length, completed: comp, avgMistakes: sessions.length ? +(mis / sessions.length).toFixed(1) : 0,
    avgMinutes: sessions.length ? Math.round(secs / sessions.length / 60) : 0, steps: stepStats, questions: Object.keys(q).map(function (k) { return q[k]; }) };
}

function artifact_(me, b) {
  var key = String(b.key || ''), t = table_('Artifacts'), row = findRow_(t, 'key', key);
  if (!row) throw new Error('Bad artifact: not found');
  var r = readRow_(t, row);
  var stu = null; rowsOf_('Students').forEach(function (x) { if (String(x.sid) === String(r.sid)) stu = x; });
  if (stu && !scopeOk_(me, stu.sid, stu.grade)) throw new Error('Not allowed: this class is not yours');
  return { ok: true, kind: r.kind, lab_id: r.lab_id, updated_at: r.updated_at, data: [r.data_1, r.data_2, r.data_3, r.data_4].join('') };
}

function mark_(me, b) {
  var t = table_('Answers'), row = findRow_(t, 'key', String(b.key || ''));
  if (!row) throw new Error('Bad answer: not found');
  var o = { teacher_points: num_(b.teacher_points), teacher_comment: clip_(b.comment, 600), marked_by: me.name, marked_at: new Date(), needs_marking: false };
  writeRow_(t, row, o);
  return { ok: true };
}

function catalog_(me, b) {
  var labs = b.labs || [], t = table_('Labs'), n = 0;
  labs.slice(0, 400).forEach(function (l) {
    if (!RE_ID.test(String(l.lab_id || ''))) return;
    var steps = (l.steps || []).slice(0, 80).map(function (x) { return String(x).slice(0, 120); });
    var o = { lab_id: l.lab_id, module: clip_(l.module, 20), week: num_(l.week), slot: clip_(l.slot, 20), title: clip_(l.title, 200), topic: clip_(l.topic, 160), steps_total: steps.length + num_(l.extra_steps),
      max_points: steps.length + num_(l.extra_steps) + num_(l.quiz_max), steps_json: clip_(JSON.stringify(steps), 40000), active: true, updated_at: new Date() };
    var row = findRow_(t, 'lab_id', o.lab_id);
    if (row && !steps.length) { delete o.steps_total; delete o.max_points; delete o.steps_json; }   // never wipe known steps with an empty list
    if (row) writeRow_(t, row, o); else appendRow_(t, o);
    n++;
  });
  var un = 0, ut = table_('Units');
  (b.units || []).slice(0, 200).forEach(function (u) {
    var slot = String(u.slot || ''), w = num_(u.week);
    if (!/^[A-Za-z0-9_\-]{1,30}$/.test(slot) || w < 0 || w > 60) return;
    var id = 'W' + w + '|' + slot, row = findRow_(ut, 'unit_id', id);
    var o = { unit_id: id, week: w, slot: slot, label: clip_(u.label, 60) || slot, module: clip_(u.module, 20), title: clip_(u.title, 200), active: u.available !== false, updated_at: new Date() };
    if (row) writeRow_(ut, row, o); else appendRow_(ut, o);
    un++;
  });
  return { ok: true, saved: n, units: un };
}

/* ===================================================================================================================
   DERIVED TABS for people who work inside the spreadsheet  (Progress, LabStats)
   =================================================================================================================== */
function refreshReports() {
  var ss = db_(), me = { grades: 'ALL' };
  try { setSetting_('current_week_now', currentWeek_('CYBER', getSettings_())); } catch (e) {}
  var rep = classReport_(me, {});
  var weekCols = {}; rep.units.forEach(function (u) { if (u.week > 0) weekCols[u.week] = 1; });
  var weeks = Object.keys(weekCols).map(Number).sort(function (a, b) { return a - b; });
  var head = ['sid', 'name', 'grade', 'labs_started', 'labs_completed', 'avg_completion_pct', 'points', 'mistakes', 'hints', 'minutes', 'last_active'].concat(weeks.map(function (w) { return 'W' + w + '_%'; }));
  var rows = rep.students.map(function (s) {
    return [toCell_(s.sid, 't'), toCell_(s.name, 't'), toCell_(s.grade, 't'), s.labsStarted, s.labsCompleted, s.avgCompletion, s.points, s.mistakes, s.hints, s.minutes, s.lastActive].concat(weeks.map(function (w) { return s.weeks[w] === undefined ? '' : s.weeks[w]; }));
  });
  var sh = ss.getSheetByName('Progress') || ss.insertSheet('Progress');
  sh.clear(); sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF'); sh.setFrozenRows(1); sh.setFrozenColumns(2);
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows);
  if (rows.length && weeks.length) {
    var rng = sh.getRange(2, 12, rows.length, weeks.length);
    rng.setBackground(null);
    var rule = SpreadsheetApp.newConditionalFormatRule().setGradientMinpointWithValue('#FEE2E2', SpreadsheetApp.InterpolationType.NUMBER, '0').setGradientMaxpointWithValue('#86EFAC', SpreadsheetApp.InterpolationType.NUMBER, '100').setRanges([rng]).build();
    sh.setConditionalFormatRules([rule]);
  }
  /* LabStats */
  var ls = ss.getSheetByName('LabStats') || ss.insertSheet('LabStats');
  var sessions = rowsOf_('Sessions'), steps = rowsOf_('StepLog'), by = {};
  sessions.forEach(function (s) { var x = by[s.lab_id] = by[s.lab_id] || { title: s.lab_title, week: s.week, att: 0, stu: {}, comp: 0, mis: 0, secs: 0, sess: {} }; x.att++; x.stu[s.sid] = 1; if (s.status === 'completed') x.comp++; x.mis += +s.mistakes || 0; x.secs += +s.active_seconds || 0; x.sess[s.session_id] = 1; });
  var hard = {}; steps.forEach(function (st) { var h = hard[st.lab_id] = hard[st.lab_id] || {}; var k = st.step_no + '. ' + st.step_title; h[k] = (h[k] || 0) + (+st.mistakes || 0); });
  rowsOf_('Labs').forEach(function (l) { if (!by[l.lab_id]) by[l.lab_id] = { title: l.title, week: l.week, att: 0, stu: {}, comp: 0, mis: 0, secs: 0 }; else if (l.title) by[l.lab_id].title = l.title; });
  var lrows = Object.keys(by).sort().map(function (id) {
    var x = by[id], h = hard[id] || {}, hk = Object.keys(h).sort(function (a, b) { return h[b] - h[a]; })[0];
    return [toCell_(id, 't'), toCell_(x.title, 't'), x.week, x.att, Object.keys(x.stu).length, x.comp, x.att ? Math.round(x.comp / x.att * 100) : 0, x.att ? +(x.mis / x.att).toFixed(1) : 0, x.att ? Math.round(x.secs / x.att / 60) : 0, hk && h[hk] ? toCell_(hk + ' (' + h[hk] + ' mistakes)', 't') : ''];
  });
  var lh = ['lab_id', 'title', 'week', 'attempts', 'students', 'completed', 'completion_rate_%', 'avg_mistakes', 'avg_minutes', 'hardest_step'];
  ls.clear(); ls.getRange(1, 1, 1, lh.length).setValues([lh]).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF'); ls.setFrozenRows(1);
  if (lrows.length) ls.getRange(2, 1, lrows.length, lh.length).setValues(lrows);
  /* UnitProgress: one row per student x week button */
  var up = ss.getSheetByName('UnitProgress') || ss.insertSheet('UnitProgress');
  var uh = ['sid', 'name', 'grade', 'week', 'button', 'label', 'status', 'lab_done', 'lab_title', 'steps_done', 'steps_total', 'completion_pct', 'attempts', 'mistakes', 'hints', 'minutes', 'last_active'];
  var cat = unitCatalog_(), bySid = {}, urows = [];
  rowsOf_('Sessions').forEach(function (x) { (bySid[x.sid] = bySid[x.sid] || []).push(x); });
  rowsOf_('Students').forEach(function (stu) {
    unitsOf_(bySid[stu.sid] || [], cat).forEach(function (u) {
      var x = u.best;
      urows.push([toCell_(stu.sid, 't'), toCell_(stu.name, 't'), toCell_(stu.grade, 't'), u.week, toCell_(u.slot, 't'), toCell_(u.label, 't'), u.status, x ? toCell_(x.lab_id, 't') : '', x ? toCell_(x.lab_title, 't') : '',
        x ? +x.steps_done || 0 : 0, x ? +x.steps_total || 0 : 0, x ? +x.completion_pct || 0 : 0, u.attempts, u.mistakes, u.hints, Math.round(u.seconds / 60), u.lastActive]);
    });
  });
  up.clear(); up.getRange(1, 1, 1, uh.length).setValues([uh]).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF'); up.setFrozenRows(1);
  if (urows.length) up.getRange(2, 1, urows.length, uh.length).setValues(urows);
  log_('info', 'reports', 'Progress: ' + rows.length + ' students, LabStats: ' + lrows.length + ' labs, UnitProgress: ' + urows.length + ' rows');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (['refreshReports', 'cleanOldEvents'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('refreshReports').timeBased().everyMinutes(30).create();
  ScriptApp.newTrigger('cleanOldEvents').timeBased().everyDays(1).atHour(3).create();
  try { SpreadsheetApp.getUi().alert('Automatic jobs installed: report tabs every 30 min, clean-up daily at 03:00.'); } catch (e) {}
}

function cleanOldEvents() {
  var s = getSettings_(), days = +s.retention_days_events || 180, t = table_('Events'), last = t.sh.getLastRow();
  if (last < 2) return;
  var ts = t.sh.getRange(2, 1, last - 1, 1).getValues(), cutoff = Date.now() - days * 86400000, n = 0;
  while (n < ts.length && ts[n][0] instanceof Date && ts[n][0].getTime() < cutoff) n++;
  if (n) t.sh.deleteRows(2, n);
  var lg = table_('Log'); if (lg.sh.getLastRow() > 1500) lg.sh.deleteRows(2, lg.sh.getLastRow() - 1000);
  log_('info', 'cleanup', 'removed ' + n + ' old events');
}

/* ===================================================================================================================
   LOW-LEVEL HELPERS
   =================================================================================================================== */
function db_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) { var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID'); if (id) ss = SpreadsheetApp.openById(id); }
  if (!ss) throw new Error('No spreadsheet: bind this script to the Google Sheet (Extensions > Apps Script).');
  return ss;
}
var TABLE_OK_ = {};
function table_(name) {
  var ss = db_(), sh = ss.getSheetByName(name);
  if (!sh) sh = ensureSheet_(ss, name);
  if (!TABLE_OK_[name]) {            // a sheet made by an older version lacks the newest columns: add them once, never touching the data
    var want = SCHEMA[name][SCHEMA[name].length - 1][0];
    if (sh.getMaxColumns() < SCHEMA[name].length || String(sh.getRange(1, SCHEMA[name].length).getValue()) !== want) sh = ensureSheet_(ss, name);
    TABLE_OK_[name] = true;
  }
  var cols = SCHEMA[name].map(function (c) { return c[0]; }), types = SCHEMA[name].map(function (c) { return c[1]; });
  return { name: name, sh: sh, cols: cols, types: types };
}
function colOf_(t, c) { var i = t.cols.indexOf(c); if (i < 0) throw new Error('Bad column ' + c); return i; }
function findRow_(t, col, key) {
  var last = t.sh.getLastRow(); if (last < 2) return 0;
  var f = t.sh.getRange(2, colOf_(t, col) + 1, last - 1, 1).createTextFinder(String(key)).matchEntireCell(true).matchCase(true).findNext();
  return f ? f.getRow() : 0;
}
function countRows_(t, colA, a, colB, b) {
  var last = t.sh.getLastRow(); if (last < 2) return 0;
  var hits = t.sh.getRange(2, colOf_(t, colA) + 1, last - 1, 1).createTextFinder(String(a)).matchEntireCell(true).matchCase(true).findAll(), n = 0, bi = colOf_(t, colB) + 1;
  hits.forEach(function (h) { if (String(t.sh.getRange(h.getRow(), bi).getValue()) === String(b)) n++; });
  return n;
}
function toCell_(v, type) {
  if (v === undefined || v === null) return '';
  if (type === 'd') { var d = v instanceof Date ? v : new Date(v); return isNaN(d.getTime()) ? '' : d; }
  if (type === 'n') { var n = Number(v); return isNaN(n) ? '' : n; }
  if (type === 'b') return v === true || String(v).toUpperCase() === 'TRUE' || v === 1;
  var s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s;      // a text starting with = + - @ can never become a formula
  return s.length > 49000 ? s.slice(0, 49000) : s;
}
function fromCell_(v, type) {
  if (v instanceof Date) return v.toISOString();
  if (type === 't' && typeof v === 'string' && /^'[=+\-@]/.test(v)) return v.slice(1);
  return v;
}
function appendRow_(t, obj) {
  var row = t.sh.getLastRow() + 1;
  t.sh.getRange(row, 1, 1, t.cols.length).setValues([t.cols.map(function (c, i) { return toCell_(obj[c], t.types[i]); })]);
  return row;
}
function writeRow_(t, row, obj) {
  var cur = t.sh.getRange(row, 1, 1, t.cols.length).getValues()[0];
  var vals = t.cols.map(function (c, i) { return (obj[c] !== undefined && obj[c] !== null) ? toCell_(obj[c], t.types[i]) : cur[i]; });
  t.sh.getRange(row, 1, 1, t.cols.length).setValues([vals]);
}
function readRow_(t, row) {
  var v = t.sh.getRange(row, 1, 1, t.cols.length).getValues()[0], o = {};
  t.cols.forEach(function (c, i) { o[c] = fromCell_(v[i], t.types[i]); });
  return o;
}
function rowsOf_(name) {
  var t = table_(name), last = t.sh.getLastRow(); if (last < 2) return [];
  return t.sh.getRange(2, 1, last - 1, t.cols.length).getValues().map(function (v) {
    var o = {}; t.cols.forEach(function (c, i) { o[c] = fromCell_(v[i], t.types[i]); }); return o;
  }).filter(function (o) { return o[t.cols[0]] !== '' && o[t.cols[0]] !== undefined; });
}
function getSettings_() {
  var sh = db_().getSheetByName('Settings'), o = {};
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (r[0] !== '') o[String(r[0])] = (r[1] instanceof Date) ? Utilities.formatDate(r[1], 'UTC', 'yyyy-MM-dd') : String(r[1]); });
  return o;
}
function publicSettings_(s) { return { school_name: s.school_name, report_title: s.report_title, student_self_view: s.student_self_view, timezone: s.timezone }; }
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) throw new Error('Busy: try again');
  try { return fn(); } finally { try { SpreadsheetApp.flush(); } catch (e) {} lock.releaseLock(); }
}
function setupSalt_() { var p = PropertiesService.getScriptProperties(); if (!p.getProperty('SALT')) p.setProperty('SALT', Utilities.getUuid()); }
function hash_(pin) {
  var salt = PropertiesService.getScriptProperties().getProperty('SALT') || '';
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + String(pin), Utilities.Charset.UTF_8).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function log_(level, source, message) {
  try { appendRow_(table_('Log'), { ts: new Date(), level: level, source: source, message: String(message).slice(0, 1500) }); } catch (e) {}
}
function status_() {
  var s = getSettings_();
  return { students: Math.max(0, table_('Students').sh.getLastRow() - 1), sessions: Math.max(0, table_('Sessions').sh.getLastRow() - 1), steps: Math.max(0, table_('StepLog').sh.getLastRow() - 1),
    teachers: Math.max(0, table_('Teachers').sh.getLastRow() - 1), currentWeek: currentWeek_('CYBER', s) };
}
function num_(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
function clip_(v, n) { return v === undefined || v === null ? '' : String(v).slice(0, n); }
function norm_(v) { return String(v || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function slug_(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
/* "CYBERSECURITY-GRADE-10-A" -> { level: 'GRADE 10', section: 'A' } */
function parseGrade_(g) {
  var m = /GRADE-(\d+)(?:-([A-Za-z]+))?\s*$/i.exec(String(g || ''));
  return m ? { level: 'GRADE ' + m[1], section: (m[2] || '').toUpperCase() } : { level: '', section: '' };
}
function shortGrade_(g) { return String(g || '').replace(/^CYBERSECURITY-GRADE-/, 'G'); }
