/* =========================================================
   Cybersecurity Foundations — Practice Test Center
   Dashboard shell: header + sidebar week directory + main quiz panel.
   Loads ALL JSON/Practice Tests/All Weeks Practice Test.json
   Five-category quiz engine:
   MULTIPLE-CHOICE QUESTIONS · MATCHING · DRAG AND DROP · YES / NO · SHORT ANSWER
   ========================================================= */
(() => {
  "use strict";

  const DATA_PATH = "ALL JSON/Practice Tests/All Weeks Practice Test.json";
  const MAX_ATTEMPTS = 3;
  const TOTAL_WEEKS = 18;

  const CATEGORY_LABELS = {
    "MULTIPLE-CHOICE QUESTIONS": "Multiple Choice",
    "MATCHING": "Matching",
    "DRAG AND DROP": "Drag & Drop",
    "YES / NO": "Yes / No",
    "SHORT ANSWER": "Short Answer"
  };

  /** @type {{practiceTests: any[]}} */
  let DB = { practiceTests: [] };
  let testMap = {};
  let completedScores = {}; // id -> { correct, total }
  let activeId = null;

  // ---- active quiz state ----
  let state = null;

  // ---- DOM refs ----
  const el = {
    weekList: document.getElementById("weekList"),
    headerStats: document.getElementById("headerStats"),
    sidebar: document.getElementById("sidebar"),
    sidebarToggle: document.getElementById("sidebarToggle"),
    stage: document.getElementById("quizStage"),
    empty: document.getElementById("emptyState"),
    studentNameInput: document.getElementById("studentNameInput"),
    studentIdInput: document.getElementById("studentIdInput"),
    studentGradeInput: document.getElementById("studentGradeInput"),
    studentDetailsError: document.getElementById("studentDetailsError"),
  };

  // ============================================================
  // BOOTSTRAP
  // ============================================================
  async function init() {
    renderSidebar(); // locked placeholders immediately
    renderHeaderStats();

    let loaded = false;
    try {
      const res = await fetch(DATA_PATH);
      if (!res.ok) throw new Error("HTTP " + res.status);
      DB = await res.json();
      loaded = true;
    } catch (err) {
      // fetch() is blocked on file:// pages — fall back to the embedded copy
      // (data.js) so the app still works when opened by double-click.
      if (window.PRACTICE_DATA) {
        console.warn("Live JSON fetch failed, using embedded fallback data:", err.message);
        DB = window.PRACTICE_DATA;
        loaded = true;
      } else {
        console.error("Could not load practice test bank:", err);
      }
    }

    if (loaded) {
      (DB.practiceTests || []).forEach(t => (testMap[t.id] = t));
      renderSidebar();
      renderHeaderStats();
    } else {
      const note = document.createElement("p");
      note.style.cssText = "font-size:11.5px;color:#C24435;font-family:var(--font-mono);padding:10px 6px;";
      note.textContent =
        "Question bank could not be loaded. Make sure data.js and \"" + DATA_PATH + "\" are both present alongside index.html.";
      el.weekList.prepend(note);
    }
  }

  el.sidebarToggle.addEventListener("click", () => {
    const open = el.sidebar.classList.toggle("is-open");
    el.sidebarToggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!el.sidebar.classList.contains("is-open")) return;
    if (el.sidebar.contains(e.target) || el.sidebarToggle.contains(e.target)) return;
    el.sidebar.classList.remove("is-open");
    el.sidebarToggle.setAttribute("aria-expanded", "false");
  });

  [el.studentNameInput, el.studentIdInput, el.studentGradeInput].forEach(input => {
    if (!input) return;
    input.addEventListener("input", () => {
      input.classList.remove("is-invalid");
      const allValid = [el.studentNameInput, el.studentIdInput, el.studentGradeInput]
        .every(i => !i || !i.classList.contains("is-invalid"));
      if (allValid && el.studentDetailsError) {
        el.studentDetailsError.textContent = "";
      }
    });
  });

  // ============================================================
  // HEADER STATS
  // ============================================================
  function renderHeaderStats() {
    const available = Object.keys(testMap).length;
    const doneCount = Object.keys(completedScores).length;
    el.headerStats.innerHTML = `
      <div class="stat-chip">
        <span class="stat-chip__icon">${unlockIcon()}</span>
        <b>${available}</b><span>/ ${TOTAL_WEEKS} weeks ready</span>
      </div>
      <div class="stat-chip">
        <span class="stat-chip__icon gold">${checkBadgeIcon()}</span>
        <b>${doneCount}</b><span>completed</span>
      </div>`;
  }

  // ============================================================
  // SIDEBAR — WEEK DIRECTORY
  // ============================================================
  function renderSidebar() {
    el.weekList.innerHTML = "";
    for (let i = 1; i <= TOTAL_WEEKS; i++) {
      const id = `Week${i}-PT`;
      const wk = String(i).padStart(2, "0");
      const test = testMap[id];
      const unlocked = !!test;
      const done = !!completedScores[id];
      const isActive = id === activeId;

      const item = document.createElement("button");
      item.type = "button";
      item.className = "week-item" + (unlocked ? "" : " is-locked") + (isActive ? " is-active" : "") + (done ? " is-done" : "");
      item.disabled = !unlocked;

      let statusHtml;
      if (!unlocked) {
        statusHtml = `<span class="week-item__status">${lockClosedIcon()}</span>`;
      } else if (done) {
        const s = completedScores[id];
        statusHtml = `<span class="status-pill status-pill--done">${s.correct}/${s.total}</span>`;
      } else {
        statusHtml = `<span class="status-pill status-pill--ready">Ready</span>`;
      }

      item.innerHTML = `
        <span class="week-item__num">W${wk}</span>
        <span class="week-item__body">
          <span class="week-item__title">Week ${i}</span>
        </span>
        ${statusHtml}`;

      if (unlocked) {
        item.addEventListener("click", () => {
          if (!checkStudentDetailsFilled()) return;
          openTest(id);
          el.sidebar.classList.remove("is-open");
          el.sidebarToggle.setAttribute("aria-expanded", "false");
        });
      }

      el.weekList.appendChild(item);
    }
  }

  function checkStudentDetailsFilled() {
    const name = el.studentNameInput ? el.studentNameInput.value.trim() : "";
    const id = el.studentIdInput ? el.studentIdInput.value.trim() : "";
    const grade = el.studentGradeInput ? el.studentGradeInput.value.trim() : "";
    const invalid = !name || !id || !grade;
    if (el.studentNameInput) el.studentNameInput.classList.toggle("is-invalid", !name);
    if (el.studentIdInput) el.studentIdInput.classList.toggle("is-invalid", !id);
    if (el.studentGradeInput) el.studentGradeInput.classList.toggle("is-invalid", !grade);
    if (el.studentDetailsError) {
      el.studentDetailsError.textContent = invalid ? "Enter Your Details" : "";
    }
    return !invalid;
  }

  function unlockIcon() {
    return `<svg viewBox="0 0 20 20" width="12" height="12" fill="none"><path d="M6 8.5V6a4 4 0 0 1 7.6-1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="4" y="8.5" width="10" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.6"/></svg>`;
  }
  function checkBadgeIcon() {
    return `<svg viewBox="0 0 20 20" width="12" height="12" fill="none"><path d="m5 10.2 3 3 7-7.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function lockClosedIcon() {
    return `<svg viewBox="0 0 20 20" width="14" height="14" fill="none"><path d="M6.5 8.5V6a3.5 3.5 0 1 1 7 0v2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="4.5" y="8.5" width="11" height="7.5" rx="1.6" stroke="currentColor" stroke-width="1.6"/></svg>`;
  }

  // ============================================================
  // QUIZ ENGINE — state machine
  // ============================================================
  function openTest(id) {
    const test = testMap[id];
    if (!test) return;

    activeId = id;
    state = {
      test,
      catIndex: 0,
      catState: test.categories.map(buildCatState),
      scoreByCat: test.categories.map(() => ({ correct: 0, total: 0 })),
    };
    state.test.categories.forEach((cat, i) => recomputeCategoryScore(i));

    el.empty.hidden = true;
    el.stage.hidden = false;
    renderSidebar();
    renderShell();
    renderCategoryView();
  }

  function shuffled(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function buildCatState(cat) {
    switch (cat.id) {
      case "MULTIPLE-CHOICE QUESTIONS":
      case "SHORT ANSWER":
        return { kind: "list", items: cat.questions.map(() => ({ status: "pending", attemptsLeft: MAX_ATTEMPTS })) };
      case "YES / NO":
        return { kind: "table", attemptsLeft: MAX_ATTEMPTS, rows: cat.questions.map(() => ({ selected: null, status: "pending" })) };
      case "MATCHING": {
        const q = cat.questions[0];
        return { kind: "match", attemptsLeft: MAX_ATTEMPTS, rightOrder: shuffled(q.right), connections: {}, lockedTerms: {}, wrongTerms: {}, resolved: false, correctCount: 0 };
      }
      case "DRAG AND DROP": {
        const q = cat.questions[0];
        return { kind: "sort", attemptsLeft: MAX_ATTEMPTS, itemsOrder: shuffled(q.items), placements: {}, lockedItems: {}, wrongItems: {}, resolved: false, correctCount: 0 };
      }
      default:
        return { kind: "unknown" };
    }
  }

  function totalScore() {
    return state.scoreByCat.reduce((acc, s) => ({ correct: acc.correct + s.correct, total: acc.total + s.total }), { correct: 0, total: 0 });
  }

  function recomputeCategoryScore(catIdx) {
    const cat = state.test.categories[catIdx];
    const cs = state.catState[catIdx];
    if (cs.kind === "list") {
      state.scoreByCat[catIdx] = { correct: cs.items.filter(it => it.status === "correct").length, total: cs.items.length };
    } else if (cs.kind === "table") {
      state.scoreByCat[catIdx] = { correct: cs.rows.filter(r => r.status === "correct").length, total: cs.rows.length };
    } else if (cs.kind === "match" || cs.kind === "sort") {
      state.scoreByCat[catIdx] = { correct: cs.resolved && cs.wonWithoutReveal ? 1 : 0, total: 1 };
    }
  }

  function isCategoryResolved(catIdx) {
    const cs = state.catState[catIdx];
    if (cs.kind === "list") return cs.items.every(it => it.status !== "pending");
    if (cs.kind === "table") return cs.rows.every(r => r.status !== "pending");
    if (cs.kind === "match" || cs.kind === "sort") return !!cs.resolved;
    return false;
  }

  function resolvedItemCount(catIdx) {
    const cs = state.catState[catIdx];
    if (cs.kind === "list") return cs.items.filter(it => it.status !== "pending").length;
    if (cs.kind === "table") return cs.rows.filter(r => r.status !== "pending").length;
    if (cs.kind === "match" || cs.kind === "sort") return cs.resolved ? 1 : 0;
    return 0;
  }

  function renderShell() {
    const { test } = state;
    el.stage.innerHTML = `
      <div class="quiz-head">
        <div class="quiz-head__top">
          <div>
            <h2 class="quiz-head__title">${escapeHtml(test.subtitle)}</h2>
          </div>
          <div class="quiz-head__right">
            <div class="quiz-head__score" id="scoreBadge"></div>
            <button class="btn btn--ghost pdf-download-btn" id="pdfDownloadBtn" type="button">${pdfIcon()} Download PDF</button>
          </div>
        </div>
        <div class="tabs" id="tabRow"></div>
        <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
      </div>
      <div class="panel-scroll" id="panelScroll">
        <div id="questionZone"></div>
      </div>
    `;
    renderTabs();
    updateScoreBadge();
    document.getElementById("pdfDownloadBtn").addEventListener("click", (e) => generatePDF(e.currentTarget));
  }

  function pdfIcon() {
    return `<svg viewBox="0 0 20 20" width="13" height="13" fill="none" style="vertical-align:-2px;margin-right:2px;"><path d="M5 2.5h7l3 3V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V3a.5.5 0 0 1 .5-.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 2.5V6h3.5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  }

  function renderTabs() {
    const row = document.getElementById("tabRow");
    row.innerHTML = "";
    state.test.categories.forEach((cat, i) => {
      const done = isCategoryResolved(i);
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "tab" + (i === state.catIndex ? " is-active" : "") + (done ? " is-done" : "");
      tab.innerHTML = `<span class="tab__dot"></span>${CATEGORY_LABELS[cat.id] || cat.id}`;
      tab.addEventListener("click", () => {
        state.catIndex = i;
        renderCategoryView();
        const scroller = document.getElementById("panelScroll");
        if (scroller) scroller.scrollTop = 0;
      });
      row.appendChild(tab);
    });
  }

  function updateScoreBadge() {
    const s = totalScore();
    const badge = document.getElementById("scoreBadge");
    if (badge) badge.innerHTML = `Score&nbsp; <b>${s.correct}</b>&nbsp;/&nbsp;${s.total}`;
  }

  function updateProgress() {
    const totalQ = state.test.categories.reduce((a, c) => a + c.questions.length, 0);
    const doneQ = state.test.categories.reduce((a, c, i) => a + resolvedItemCount(i), 0);
    const fill = document.getElementById("progressFill");
    if (fill) fill.style.width = Math.round((doneQ / totalQ) * 100) + "%";
  }

  function refreshChrome() {
    renderTabs();
    updateScoreBadge();
    updateProgress();
  }

  function renderAttemptsFor(attemptsLeft) {
    return "ATTEMPTS&nbsp;&nbsp;" + Array.from({ length: MAX_ATTEMPTS })
      .map((_, i) => `<span class="attempts__dot ${i < (MAX_ATTEMPTS - attemptsLeft) ? "is-used" : ""}"></span>`).join("");
  }

  // ---- main dispatcher: renders the WHOLE category at once ----
  function renderCategoryView() {
    const catIdx = state.catIndex;
    const cat = state.test.categories[catIdx];
    const cs = state.catState[catIdx];
    const zone = document.getElementById("questionZone");
    zone.innerHTML = "";

    switch (cat.id) {
      case "MULTIPLE-CHOICE QUESTIONS": renderMCQList(zone, cat, catIdx, cs); break;
      case "SHORT ANSWER": renderShortList(zone, cat, catIdx, cs); break;
      case "YES / NO": renderYesNoTable(zone, cat, catIdx, cs); break;
      case "MATCHING": renderMatchingConnect(zone, cat, catIdx, cs); break;
      case "DRAG AND DROP": renderDragDropBins(zone, cat, catIdx, cs); break;
      default: zone.appendChild(document.createTextNode("Unsupported category."));
    }

    renderCatFooter(zone, catIdx);
    refreshChrome();
  }

  function renderCatFooter(zone, catIdx) {
    const resolved = isCategoryResolved(catIdx);
    const isLastCat = catIdx === state.test.categories.length - 1;
    const s = state.scoreByCat[catIdx];
    const footer = document.createElement("div");
    footer.className = "cat-footer" + (resolved ? " is-resolved" : "");
    if (resolved) {
      footer.innerHTML = `
        <span class="cat-footer__msg">✓ Category complete — ${s.correct}/${s.total} correct.</span>
        <button class="btn btn--primary" id="catNextBtn">${isLastCat ? "See final results" : "Next category →"}</button>`;
    } else {
      footer.innerHTML = `<span class="cat-footer__msg">Answer every item above to unlock ${isLastCat ? "your results" : "the next category"}.</span>`;
    }
    zone.appendChild(footer);
    if (resolved) {
      document.getElementById("catNextBtn").addEventListener("click", () => {
        if (isLastCat) {
          renderResults();
        } else {
          state.catIndex++;
          renderCategoryView();
        }
        const scroller = document.getElementById("panelScroll");
        if (scroller) scroller.scrollTop = 0;
      });
    }
  }

  function afterInteraction(catIdx) {
    recomputeCategoryScore(catIdx);
    const zone = document.getElementById("questionZone");
    const oldFooter = zone.querySelector(".cat-footer");
    if (oldFooter) oldFooter.remove();
    renderCatFooter(zone, catIdx);
    refreshChrome();
  }

  // ============================================================
  // MULTIPLE CHOICE — all questions listed at once
  // ============================================================
  function renderMCQList(zone, cat, catIdx, cs) {
    const list = document.createElement("div");
    list.className = "stack-list";
    zone.appendChild(list);

    cat.questions.forEach((q, qi) => {
      const item = cs.items[qi];
      const card = document.createElement("div");
      card.className = "mini-card";
      card.innerHTML = `
        <p class="mini-card__prompt"><span class="mini-card__qno">Q${qi + 1}:</span> ${escapeHtml(q.question)}</p>
        <div class="attempts mini-attempts"></div>
        <div class="mcq-row"></div>
      `;
      const attemptsBox = card.querySelector(".mini-attempts");
      const row = card.querySelector(".mcq-row");
      const buttons = [];

      q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "mcq-opt";
        btn.textContent = opt;
        buttons.push(btn);
        btn.addEventListener("click", () => {
          if (item.status !== "pending") return;
          const correct = opt === q.answer;
          item.chosen = opt;
          if (correct) {
            item.status = "correct";
            btn.classList.add("is-correct-reveal");
            buttons.forEach(b => (b.disabled = true));
            attemptsBox.innerHTML = "";
          } else {
            item.attemptsLeft--;
            btn.classList.add("is-wrong");
            setTimeout(() => btn.classList.remove("is-wrong"), 700);
            if (item.attemptsLeft <= 0) {
              item.status = "revealed";
              buttons.forEach(b => { if (b.textContent === q.answer) b.classList.add("is-correct-reveal"); b.disabled = true; });
              attemptsBox.innerHTML = "";
            } else {
              attemptsBox.innerHTML = renderAttemptsFor(item.attemptsLeft);
            }
          }
          afterInteraction(catIdx);
        });
        row.appendChild(btn);
      });

      // initial paint (covers already-resolved items on tab re-entry)
      if (item.status !== "pending") {
        buttons.forEach(b => {
          b.disabled = true;
          if (b.textContent === q.answer) b.classList.add("is-correct-reveal");
        });
      } else {
        attemptsBox.innerHTML = renderAttemptsFor(item.attemptsLeft);
      }

      list.appendChild(card);
    });
  }

  // ============================================================
  // SHORT ANSWER — all questions listed at once
  // ============================================================
  const STOPWORDS = new Set(["a","an","the","is","are","of","to","and","or","in","on","for","by","with","that","this","it","as","be","their","its","from","or,","was","were","which","who","what","when","only","must","can"]);

  function normalizeWords(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w && !STOPWORDS.has(w));
  }
  function shortAnswerScore(userText, correctText) {
    const userWords = new Set(normalizeWords(userText));
    const correctWords = normalizeWords(correctText);
    if (!correctWords.length) return 0;
    const uniqueCorrect = [...new Set(correctWords)];
    const hits = uniqueCorrect.filter(w => userWords.has(w)).length;
    return hits / uniqueCorrect.length;
  }

  function renderShortList(zone, cat, catIdx, cs) {
    const list = document.createElement("div");
    list.className = "stack-list";
    zone.appendChild(list);

    cat.questions.forEach((q, qi) => {
      const item = cs.items[qi];
      const card = document.createElement("div");
      card.className = "mini-card";
      card.innerHTML = `
        <p class="mini-card__prompt"><span class="mini-card__qno">Q${qi + 1}:</span> ${escapeHtml(q.question)}</p>
        <div class="attempts mini-attempts"></div>
        <div class="short-row">
          <textarea class="short-input" rows="1" placeholder="Type your answer here…" aria-label="Your answer"></textarea>
          <button class="btn btn--primary short-row__btn" type="button">Submit</button>
        </div>
      `;
      const attemptsBox = card.querySelector(".mini-attempts");
      const ta = card.querySelector(".short-input");
      const submitBtn = card.querySelector(".short-row__btn");

      function paintResolved() {
        ta.disabled = true;
        submitBtn.disabled = true;
        attemptsBox.innerHTML = "";
        const fb = document.createElement("div");
        fb.className = "short-feedback " + (item.status === "correct" ? "is-correct" : "is-reveal");
        fb.innerHTML = `<b>${item.status === "correct" ? "Correct" : "Model answer"}</b>${escapeHtml(q.answer)}`;
        card.appendChild(fb);
      }

      if (item.status !== "pending") {
        if (item.lastAnswer) ta.value = item.lastAnswer;
        paintResolved();
      } else {
        attemptsBox.innerHTML = renderAttemptsFor(item.attemptsLeft);
      }

      submitBtn.addEventListener("click", () => {
        if (item.status !== "pending") return;
        const val = ta.value.trim();
        if (!val) { ta.focus(); return; }
        item.lastAnswer = val;
        const score = shortAnswerScore(val, q.answer);
        const correct = score >= 0.45;
        if (correct) {
          item.status = "correct";
        } else {
          item.attemptsLeft--;
          if (item.attemptsLeft <= 0) {
            item.status = "revealed";
          } else {
            attemptsBox.innerHTML = renderAttemptsFor(item.attemptsLeft);
          }
        }
        if (item.status !== "pending") paintResolved();
        afterInteraction(catIdx);
      });

      list.appendChild(card);
    });
  }

  // ============================================================
  // YES / NO — single table, all questions
  // ============================================================
  function renderYesNoTable(zone, cat, catIdx, cs) {
    const wrap = document.createElement("div");
    wrap.className = "qcard qcard--wide";
    wrap.innerHTML = `
      <span class="qcard__eyebrow">Yes / No · ${cat.questions.length} statements</span>
      <div class="attempts" id="ynAttempts" style="margin-bottom:4px;"></div>
      <div class="yn-table-wrap">
        <table class="yn-table">
          <thead><tr><th class="yn-th-q">Question</th><th class="yn-th-opt">Yes</th><th class="yn-th-opt">No</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="hint-banner" id="ynHint" hidden></div>
      <div class="qcard__actions" id="ynActions"><button class="btn btn--primary" id="ynSubmit" type="button">Check answers</button></div>
    `;
    zone.appendChild(wrap);

    const tbody = wrap.querySelector("tbody");
    const attemptsBox = wrap.querySelector("#ynAttempts");
    const actionsBox = wrap.querySelector("#ynActions");
    const rowEls = [];

    cat.questions.forEach((q, qi) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="yn-td-q">${escapeHtml(q.question)}</td>
        <td class="yn-td-opt"><button type="button" class="yn-checkbox" data-value="Yes" aria-label="Yes"></button></td>
        <td class="yn-td-opt"><button type="button" class="yn-checkbox" data-value="No" aria-label="No"></button></td>
      `;
      tbody.appendChild(tr);
      rowEls.push(tr);

      tr.querySelectorAll(".yn-checkbox").forEach(btn => {
        btn.addEventListener("click", () => {
          const row = cs.rows[qi];
          if (row.status === "correct" || row.status === "revealed") return;
          row.selected = row.selected === btn.dataset.value ? null : btn.dataset.value;
          row.status = "pending";
          syncRow(qi);
        });
      });
    });

    function syncRow(qi) {
      const row = cs.rows[qi];
      const tr = rowEls[qi];
      tr.className = "yn-tr" + (row.status === "correct" ? " is-correct" : row.status === "revealed" ? " is-revealed" : row.status === "incorrect" ? " is-incorrect" : "");
      const locked = row.status === "correct" || row.status === "revealed";
      tr.querySelectorAll(".yn-checkbox").forEach(btn => {
        const checked = row.selected === btn.dataset.value;
        btn.classList.toggle("is-checked", checked);
        btn.innerHTML = checked ? checkIcon() : "";
        btn.disabled = locked;
      });
    }

    function syncTop() {
      attemptsBox.innerHTML = (cs.attemptsLeft > 0 && !allTableResolved(cs)) ? renderAttemptsFor(cs.attemptsLeft) : "";
      actionsBox.style.display = allTableResolved(cs) ? "none" : "";
    }

    cat.questions.forEach((_, qi) => syncRow(qi));
    syncTop();

    wrap.querySelector("#ynSubmit").addEventListener("click", () => {
      const unanswered = cs.rows.some(r => r.status === "pending" && !r.selected);
      if (unanswered) {
        const hint = wrap.querySelector("#ynHint");
        hint.hidden = false;
        hint.innerHTML = `${infoIcon()} Select Yes or No for every statement before checking.`;
        return;
      }
      wrap.querySelector("#ynHint").hidden = true;

      let allCorrect = true;
      cat.questions.forEach((q, qi) => {
        const row = cs.rows[qi];
        if (row.status === "correct") return;
        const isRight = row.selected === q.answer;
        row.status = isRight ? "correct" : "incorrect";
        if (!isRight) allCorrect = false;
      });

      if (!allCorrect) {
        cs.attemptsLeft--;
        if (cs.attemptsLeft <= 0) {
          cat.questions.forEach((q, qi) => {
            const row = cs.rows[qi];
            if (row.status !== "correct") { row.selected = q.answer; row.status = "revealed"; }
          });
        }
        // if attempts remain, incorrect rows stay red (status stays "incorrect")
        // so the student can see exactly which ones to fix — they clear on next click.
      }

      cat.questions.forEach((_, qi) => syncRow(qi));
      syncTop();
      afterInteraction(catIdx);
    });
  }
  function allTableResolved(cs) { return cs.rows.every(r => r.status === "correct" || r.status === "revealed"); }
  function checkIcon(){ return `<svg viewBox="0 0 20 20" width="14" height="14" fill="none"><path d="M4 10.5 8 14l8-8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
  function infoIcon(){ return `<svg viewBox="0 0 20 20" width="14" height="14" fill="none" style="flex-shrink:0;margin-top:1px;"><circle cx="10" cy="10" r="7.3" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v4.5M10 6.6v.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`; }

  // ============================================================
  // MATCHING — connect-the-dots with flexible curved lines
  // ============================================================
  let matchResizeHandler = null;

  function renderMatchingConnect(zone, cat, catIdx, cs) {
    const q = cat.questions[0];
    const answerMap = {};
    q.answers.forEach(a => (answerMap[a.left] = a.right));

    const wrap = document.createElement("div");
    wrap.className = "qcard qcard--wide";
    wrap.innerHTML = `
      <span class="qcard__eyebrow">Matching · tap a term, then tap its definition</span>
      <p class="qcard__prompt">${escapeHtml(q.question)}</p>
      <div class="attempts" id="matchAttempts" style="margin-bottom:2px;"></div>
      <div class="match-wrap" id="matchWrap">
        <svg class="match-svg" id="matchSvg"></svg>
        <div class="match-col match-col--left" id="matchLeft"></div>
        <div class="match-col match-col--right" id="matchRight"></div>
      </div>
      <div class="hint-banner" id="matchHint" hidden></div>
      <div class="qcard__actions" id="matchActions"><button class="btn btn--primary" id="matchSubmit" type="button">Check answers</button></div>
    `;
    zone.appendChild(wrap);

    const leftCol = wrap.querySelector("#matchLeft");
    const rightCol = wrap.querySelector("#matchRight");
    const svg = wrap.querySelector("#matchSvg");
    const matchWrap = wrap.querySelector("#matchWrap");
    const attemptsBox = wrap.querySelector("#matchAttempts");
    const actionsBox = wrap.querySelector("#matchActions");

    const leftBtnByTerm = {};
    const rightBtnByDef = {};

    q.left.forEach(term => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-node match-node--left";
      btn.dataset.term = term;
      btn.innerHTML = `${escapeHtml(term)}<span class="match-dot" aria-hidden="true"></span>`;
      leftCol.appendChild(btn);
      leftBtnByTerm[term] = btn;

      btn.addEventListener("click", () => {
        if (cs.resolved || btn.disabled) return;
        if (cs.connections[term]) {
          delete cs.connections[term];
          delete cs.wrongTerms[term];
          cs.picked = null;
        } else if (cs.picked === term) {
          cs.picked = null;
        } else {
          cs.picked = term;
        }
        syncAll();
      });
    });

    cs.rightOrder.forEach(defText => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-node match-node--right";
      btn.dataset.def = defText;
      btn.innerHTML = `<span class="match-dot" aria-hidden="true"></span>${escapeHtml(defText)}`;
      rightCol.appendChild(btn);
      rightBtnByDef[defText] = btn;

      btn.addEventListener("click", () => {
        if (cs.resolved || btn.disabled) return;
        const connectedTerm = Object.keys(cs.connections).find(t => cs.connections[t] === defText);
        if (cs.picked) {
          connect(cs.picked, defText);
          delete cs.wrongTerms[cs.picked];
          cs.picked = null;
        } else if (connectedTerm) {
          delete cs.connections[connectedTerm];
          delete cs.wrongTerms[connectedTerm];
        }
        syncAll();
      });
    });

    function connect(term, defText) {
      const prevTerm = Object.keys(cs.connections).find(t => cs.connections[t] === defText);
      if (prevTerm) { delete cs.connections[prevTerm]; delete cs.wrongTerms[prevTerm]; }
      cs.connections[term] = defText;
    }

    function drawLines() {
      const wrapRect = matchWrap.getBoundingClientRect();
      svg.setAttribute("width", wrapRect.width);
      svg.setAttribute("height", wrapRect.height);
      svg.setAttribute("viewBox", `0 0 ${wrapRect.width} ${wrapRect.height}`);
      svg.innerHTML = "";

      Object.entries(cs.connections).forEach(([term, defText]) => {
        const leftBtn = leftBtnByTerm[term];
        const rightBtn = rightBtnByDef[defText];
        if (!leftBtn || !rightBtn) return;
        const leftDot = leftBtn.querySelector(".match-dot");
        const rightDot = rightBtn.querySelector(".match-dot");
        const lr = (leftDot || leftBtn).getBoundingClientRect();
        const rr = (rightDot || rightBtn).getBoundingClientRect();
        const x1 = lr.left + lr.width / 2 - wrapRect.left;
        const y1 = lr.top + lr.height / 2 - wrapRect.top;
        const x2 = rr.left + rr.width / 2 - wrapRect.left;
        const y2 = rr.top + rr.height / 2 - wrapRect.top;
        const midX = (x1 + x2) / 2;
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
        let stroke = "var(--accent)";
        if (leftBtn.classList.contains("is-locked-correct")) stroke = "var(--success)";
        else if (leftBtn.classList.contains("is-wrong")) stroke = "var(--danger)";
        path.setAttribute("stroke", stroke);
        path.setAttribute("stroke-width", "2.4");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        svg.appendChild(path);
      });
    }

    function syncAll() {
      q.left.forEach(term => {
        const btn = leftBtnByTerm[term];
        const connectedTo = cs.connections[term];
        const isLockedTerm = !!cs.lockedTerms[term];
        const isWrongTerm = !!cs.wrongTerms[term];
        btn.className = "match-node match-node--left" + (connectedTo ? " is-connected" : "") + (isLockedTerm ? " is-locked-correct" : "") + (isWrongTerm ? " is-wrong" : "") + (cs.picked === term ? " is-picked" : "");
        btn.disabled = cs.resolved || isLockedTerm;
      });
      cs.rightOrder.forEach(defText => {
        const btn = rightBtnByDef[defText];
        const connectedTerm = Object.keys(cs.connections).find(t => cs.connections[t] === defText);
        const isLockedDef = connectedTerm && cs.lockedTerms[connectedTerm];
        const isWrongDef = connectedTerm && cs.wrongTerms[connectedTerm];
        btn.className = "match-node match-node--right" + (connectedTerm ? " is-connected" : "") + (isLockedDef ? " is-locked-correct" : "") + (isWrongDef ? " is-wrong" : "");
        btn.disabled = cs.resolved || !!isLockedDef;
      });
      attemptsBox.innerHTML = !cs.resolved ? renderAttemptsFor(cs.attemptsLeft) : "";
      actionsBox.style.display = cs.resolved ? "none" : "";
      drawLines();
    }

    syncAll();
    if (matchResizeHandler) window.removeEventListener("resize", matchResizeHandler);
    matchResizeHandler = () => drawLines();
    window.addEventListener("resize", matchResizeHandler);

    wrap.querySelector("#matchSubmit").addEventListener("click", () => {
      if (q.left.some(term => !cs.connections[term])) {
        const hint = wrap.querySelector("#matchHint");
        hint.hidden = false;
        hint.innerHTML = `${infoIcon()} Connect every term to a definition before checking.`;
        return;
      }
      wrap.querySelector("#matchHint").hidden = true;

      let allCorrect = true;
      let correctCount = 0;
      q.left.forEach(term => {
        const isRight = cs.connections[term] === answerMap[term];
        if (isRight) {
          cs.lockedTerms[term] = true;
          delete cs.wrongTerms[term];
          correctCount++;
        } else {
          cs.wrongTerms[term] = true;
          allCorrect = false;
        }
      });
      cs.correctCount = correctCount;

      if (allCorrect) {
        cs.resolved = true;
        cs.wonWithoutReveal = true;
      } else {
        cs.attemptsLeft--;
        if (cs.attemptsLeft <= 0) {
          q.left.forEach(term => { cs.connections[term] = answerMap[term]; cs.lockedTerms[term] = true; delete cs.wrongTerms[term]; });
          cs.resolved = true;
          cs.wonWithoutReveal = false;
        }
        // if attempts remain, wrong pairs stay connected and red (cs.wrongTerms)
        // so the student can see exactly which ones to fix — they clear on next click.
      }

      syncAll();
      afterInteraction(catIdx);
    });
  }

  function cssEscape(str) { return String(str).replace(/["\\]/g, "\\$&"); }

  // ============================================================
  // DRAG AND DROP — item pool + category bins (all at once)
  // ============================================================
  function renderDragDropBins(zone, cat, catIdx, cs) {
    const q = cat.questions[0];
    const answerMap = {};
    q.answers.forEach(a => (answerMap[a.item] = a.category));

    const wrap = document.createElement("div");
    wrap.className = "qcard qcard--wide";
    wrap.innerHTML = `
      <span class="qcard__eyebrow">Drag &amp; Drop</span>
      <p class="qcard__prompt">${escapeHtml(q.question)}</p>
      <div class="attempts" id="ddAttempts" style="margin-bottom:2px;"></div>
      <span class="pair-col__label" style="margin-top:6px;">Drag each item into its category (or tap, then tap a category)</span>
      <div class="chip-pool" id="ddPool"></div>
      <div class="bin-grid" id="ddBins"></div>
      <div class="hint-banner" id="ddHint" hidden></div>
      <div class="qcard__actions" id="ddActions"><button class="btn btn--primary" id="ddSubmit" type="button">Check answers</button></div>
    `;
    zone.appendChild(wrap);

    const pool = wrap.querySelector("#ddPool");
    const bins = wrap.querySelector("#ddBins");
    const attemptsBox = wrap.querySelector("#ddAttempts");
    const actionsBox = wrap.querySelector("#ddActions");
    const chipByItem = {};
    const binItemsByCategory = {};
    const binByCategory = {};

    q.categories.forEach(catName => {
      const bin = document.createElement("div");
      bin.className = "bin";
      bin.dataset.category = catName;
      bin.innerHTML = `<span class="bin__label">${escapeHtml(catName)}</span><div class="bin__items"></div><button type="button" class="bin__drop" data-category="${escapeAttr(catName)}">+ Place here</button>`;
      bins.appendChild(bin);
      binByCategory[catName] = bin;
      binItemsByCategory[catName] = bin.querySelector(".bin__items");

      bin.addEventListener("dragover", (e) => { e.preventDefault(); bin.classList.add("is-over"); });
      bin.addEventListener("dragleave", () => bin.classList.remove("is-over"));
      bin.addEventListener("drop", (e) => {
        e.preventDefault();
        bin.classList.remove("is-over");
        if (cs.resolved) return;
        const val = e.dataTransfer.getData("text/plain");
        if (!val) return;
        cs.placements[val] = catName;
        cs.picked = null;
        syncAll();
      });
      bin.querySelector(".bin__drop").addEventListener("click", (e) => {
        e.stopPropagation();
        if (cs.resolved || !cs.picked) return;
        cs.placements[cs.picked] = catName;
        cs.picked = null;
        syncAll();
      });
    });

    cs.itemsOrder.forEach(item => {
      const chip = document.createElement("div");
      chip.textContent = item;
      chip.dataset.value = item;
      chipByItem[item] = chip;

      chip.addEventListener("click", () => {
        if (cs.resolved) return;
        if (cs.placements[item]) {
          if (cs.lockedItems[item]) return;
          delete cs.placements[item];
          delete cs.wrongItems[item];
          syncAll();
        } else {
          cs.picked = cs.picked === item ? null : item;
          syncAll();
        }
      });
      chip.addEventListener("dragstart", (e) => e.dataTransfer.setData("text/plain", item));
    });

    function syncAll() {
      cs.itemsOrder.forEach(item => {
        const chip = chipByItem[item];
        const category = cs.placements[item];
        const locked = cs.lockedItems[item];

        if (category) {
          chip.className = "bin__chip" + (locked ? " is-correct" : cs.wrongItems[item] ? " is-incorrect" : "");
          chip.draggable = false;
          const targetList = binItemsByCategory[category];
          if (chip.parentElement !== targetList) targetList.appendChild(chip);
        } else {
          chip.className = "chip" + (cs.picked === item ? " is-picked" : "");
          chip.draggable = !cs.resolved;
          if (chip.parentElement !== pool) pool.appendChild(chip);
        }
      });
      bins.querySelectorAll(".bin__drop").forEach(btn => (btn.style.display = cs.resolved ? "none" : ""));
      attemptsBox.innerHTML = !cs.resolved ? renderAttemptsFor(cs.attemptsLeft) : "";
      actionsBox.style.display = cs.resolved ? "none" : "";
    }

    syncAll();

    wrap.querySelector("#ddSubmit").addEventListener("click", () => {
      if (Object.keys(cs.placements).length < q.items.length) {
        const hint = wrap.querySelector("#ddHint");
        hint.hidden = false;
        hint.innerHTML = `${infoIcon()} Place every item into a category before checking.`;
        return;
      }
      wrap.querySelector("#ddHint").hidden = true;

      let allCorrect = true;
      q.items.forEach(item => {
        const isRight = cs.placements[item] === answerMap[item];
        if (isRight) {
          cs.lockedItems[item] = "correct";
          delete cs.wrongItems[item];
        } else {
          cs.wrongItems[item] = true;
          allCorrect = false;
        }
      });

      if (allCorrect) {
        cs.resolved = true;
        cs.wonWithoutReveal = true;
      } else {
        cs.attemptsLeft--;
        if (cs.attemptsLeft <= 0) {
          q.items.forEach(item => { cs.placements[item] = answerMap[item]; cs.lockedItems[item] = "correct"; delete cs.wrongItems[item]; });
          cs.resolved = true;
          cs.wonWithoutReveal = false;
        }
        // if attempts remain, wrong items stay placed and red (cs.wrongItems)
        // so the student can see exactly which ones to fix — they clear on next click.
      }

      syncAll();
      afterInteraction(catIdx);
    });
  }

  // ============================================================
  // RESULTS
  // ============================================================
  function renderResults() {
    const zone = document.getElementById("questionZone");
    zone.innerHTML = "";
    const s = totalScore();
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;

    completedScores[state.test.id] = { correct: s.correct, total: s.total };
    renderSidebar();
    renderHeaderStats();

    const cells = state.test.categories.map((cat, i) => {
      const cs = state.scoreByCat[i];
      return `<div class="results__cell"><b>${cs.correct}/${cs.total}</b><span>${CATEGORY_LABELS[cat.id] || cat.id}</span></div>`;
    }).join("");

    zone.innerHTML = `
      <div class="results">
        <div class="results__ring" style="--pct:${pct}">
          <div class="results__ring-inner">${pct}%</div>
        </div>
        <h2 class="results__title">${resultsHeadline(pct)}</h2>
        <p class="results__sub">${state.test.subtitle} — ${s.correct} of ${s.total} questions correct</p>
        <div class="results__grid">${cells}</div>
        <div class="results__actions">
          <button class="btn btn--primary" id="retakeBtn">Retake this test</button>
          <button class="btn btn--ghost" id="switchWeekBtn">Browse other weeks</button>
        </div>
      </div>`;

    document.getElementById("retakeBtn").addEventListener("click", () => openTest(state.test.id));
    document.getElementById("switchWeekBtn").addEventListener("click", () => {
      el.sidebar.classList.add("is-open");
      el.sidebarToggle.setAttribute("aria-expanded", "true");
      el.sidebar.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resultsHeadline(pct) {
    if (pct === 100) return "Full clearance — perfect score.";
    if (pct >= 80) return "Strong performance.";
    if (pct >= 60) return "Solid effort — a bit more review will help.";
    return "Keep practicing — review the material and try again.";
  }

  // ============================================================
  // helpers
  // ============================================================
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
  function escapeAttr(str) { return escapeHtml(str); }


  // ============================================================
  // PDF REPORT — downloads the current test in its current status
  // (attempted / partially attempted / not attempted), category by
  // category, with green/red marking only on items actually attempted.
  // ============================================================
  const PDF_BG_SVG_DATAURL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1OTUgODQyIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJkb3RncmlkIiB3aWR0aD0iMTQiIGhlaWdodD0iMTQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMSIgZmlsbD0iIzhlYzllZSIgb3BhY2l0eT0iMC41NSI+PC9jaXJjbGU+CiAgICA8L3BhdHRlcm4+CiAgICA8cGF0dGVybiBpZD0iY2lyY3VpdGxpbmUiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxwYXRoIGQ9Ik0yIDIwIEgxNCBWOCBIMjggVjMyIEgzOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNzliZmU5IiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNCI+PC9wYXRoPgogICAgICA8Y2lyY2xlIGN4PSIyIiBjeT0iMjAiIHI9IjEuNiIgZmlsbD0iIzVhYThkYSIgb3BhY2l0eT0iMC41NSI+PC9jaXJjbGU+CiAgICAgIDxjaXJjbGUgY3g9IjM4IiBjeT0iMzIiIHI9IjEuNiIgZmlsbD0iIzVhYThkYSIgb3BhY2l0eT0iMC41NSI+PC9jaXJjbGU+CiAgICAgIDxyZWN0IHg9IjEyIiB5PSI2IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1YWE4ZGEiIHN0cm9rZS13aWR0aD0iMC42IiBvcGFjaXR5PSIwLjQiPjwvcmVjdD4KICAgIDwvcGF0dGVybj4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZmFkZVRvcCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNiZmUzZmEiIHN0b3Atb3BhY2l0eT0iMC42Ij48L3N0b3A+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2JmZTNmYSIgc3RvcC1vcGFjaXR5PSIwIj48L3N0b3A+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJmYWRlQm90dG9tIiB4MT0iMCIgeTE9IjEiIHgyPSIwIiB5Mj0iMCI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2JmZTNmYSIgc3RvcC1vcGFjaXR5PSIwLjYiPjwvc3RvcD4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjYmZlM2ZhIiBzdG9wLW9wYWNpdHk9IjAiPjwvc3RvcD4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImZhZGVMZWZ0IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMCI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2JmZTNmYSIgc3RvcC1vcGFjaXR5PSIwLjYiPjwvc3RvcD4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjYmZlM2ZhIiBzdG9wLW9wYWNpdHk9IjAiPjwvc3RvcD4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImZhZGVSaWdodCIgeDE9IjEiIHkxPSIwIiB4Mj0iMCIgeTI9IjAiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNiZmUzZmEiIHN0b3Atb3BhY2l0eT0iMC42Ij48L3N0b3A+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2JmZTNmYSIgc3RvcC1vcGFjaXR5PSIwIj48L3N0b3A+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjU5NSIgaGVpZ2h0PSIzNCIgZmlsbD0idXJsKCNkb3RncmlkKSI+PC9yZWN0PgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI1OTUiIGhlaWdodD0iMzQiIGZpbGw9InVybCgjY2lyY3VpdGxpbmUpIiBvcGFjaXR5PSIwLjYiPjwvcmVjdD4KICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iNTk1IiBoZWlnaHQ9IjM0IiBmaWxsPSJ1cmwoI2ZhZGVUb3ApIj48L3JlY3Q+CgogIDxyZWN0IHg9IjAiIHk9IjgwOCIgd2lkdGg9IjU5NSIgaGVpZ2h0PSIzNCIgZmlsbD0idXJsKCNkb3RncmlkKSI+PC9yZWN0PgogIDxyZWN0IHg9IjAiIHk9IjgwOCIgd2lkdGg9IjU5NSIgaGVpZ2h0PSIzNCIgZmlsbD0idXJsKCNjaXJjdWl0bGluZSkiIG9wYWNpdHk9IjAuNiI+PC9yZWN0PgogIDxyZWN0IHg9IjAiIHk9IjgwOCIgd2lkdGg9IjU5NSIgaGVpZ2h0PSIzNCIgZmlsbD0idXJsKCNmYWRlQm90dG9tKSI+PC9yZWN0PgoKICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMzQiIGhlaWdodD0iODQyIiBmaWxsPSJ1cmwoI2RvdGdyaWQpIj48L3JlY3Q+CiAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9Ijg0MiIgZmlsbD0idXJsKCNjaXJjdWl0bGluZSkiIG9wYWNpdHk9IjAuNiI+PC9yZWN0PgogIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIzNCIgaGVpZ2h0PSI4NDIiIGZpbGw9InVybCgjZmFkZUxlZnQpIj48L3JlY3Q+CgogIDxyZWN0IHg9IjU2MSIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9Ijg0MiIgZmlsbD0idXJsKCNkb3RncmlkKSI+PC9yZWN0PgogIDxyZWN0IHg9IjU2MSIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9Ijg0MiIgZmlsbD0idXJsKCNjaXJjdWl0bGluZSkiIG9wYWNpdHk9IjAuNiI+PC9yZWN0PgogIDxyZWN0IHg9IjU2MSIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9Ijg0MiIgZmlsbD0idXJsKCNmYWRlUmlnaHQpIj48L3JlY3Q+CgogIDxyZWN0IHg9IjM0IiB5PSIzNCIgd2lkdGg9IjUyNyIgaGVpZ2h0PSI3NzQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2JmZTNmYSIgc3Ryb2tlLXdpZHRoPSIwLjc1IiBvcGFjaXR5PSIwLjUiIHJ4PSI0IiByeT0iNCI+PC9yZWN0PgoKICA8cGF0aCBkPSJNMzQgNDYgVjM0IEg0NiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNWFhOGRhIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNTUiPjwvcGF0aD4KICA8cGF0aCBkPSJNNTYxIDQ2IFYzNCBINTQ5IiBmaWxsPSJub25lIiBzdHJva2U9IiM1YWE4ZGEiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSI+PC9wYXRoPgogIDxwYXRoIGQ9Ik0zNCA3OTYgVjgwOCBINDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzVhYThkYSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjU1Ij48L3BhdGg+CiAgPHBhdGggZD0iTTU2MSA3OTYgVjgwOCBINTQ5IiBmaWxsPSJub25lIiBzdHJva2U9IiM1YWE4ZGEiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC41NSI+PC9wYXRoPgoKICA8dGV4dCB4PSIyOTcuNSIgeT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE1IiBsZXR0ZXItc3BhY2luZz0iMi41IiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjM2I3YmIwIiBvcGFjaXR5PSIwLjkiPkNZQkVSU0VDVVJJVFkgRk9VTkRBVElPTlM8L3RleHQ+Cjwvc3ZnPgo=";

  let _pdfBgPngCache = null;
  function loadPdfBgPng(pxW, pxH) {
    return new Promise((resolve, reject) => {
      if (_pdfBgPngCache) { resolve(_pdfBgPngCache); return; }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = pxW; canvas.height = pxH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, pxW, pxH);
        _pdfBgPngCache = canvas.toDataURL("image/png");
        resolve(_pdfBgPngCache);
      };
      img.onerror = reject;
      img.src = PDF_BG_SVG_DATAURL;
    });
  }

  function pdfWeekNumber() {
    const m = /Week(\d+)/.exec(activeId || "");
    return m ? m[1] : "?";
  }

  function pdfTestStatus() {
    if (!state) return "Not Attempted";
    let anyAttempted = false, allResolved = true;
    state.test.categories.forEach((cat, i) => {
      const cs = state.catState[i];
      if (!isCategoryAttempted(cat, cs)) return;
      anyAttempted = true;
    });
    state.test.categories.forEach((cat, i) => { if (!isCategoryResolved(i)) allResolved = false; });
    if (!anyAttempted) return "Not Attempted";
    if (allResolved) return "Completed";
    return "Incomplete";
  }

  function isCategoryAttempted(cat, cs) {
    switch (cat.id) {
      case "MULTIPLE-CHOICE QUESTIONS":
      case "SHORT ANSWER":
        return cs.items.some(it => it.status !== "pending");
      case "YES / NO":
        return cs.rows.some(r => r.status !== "pending");
      case "MATCHING":
        return Object.keys(cs.connections).length > 0 || cs.resolved;
      case "DRAG AND DROP":
        return Object.keys(cs.placements).length > 0 || cs.resolved;
      default:
        return false;
    }
  }

  function pdfTotals() {
    let correct = 0, total = 0;
    if (state) {
      state.scoreByCat.forEach(s => { correct += s.correct; total += s.total; });
    }
    return { correct, total };
  }

  async function generatePDF(triggerBtn) {
    if (!state) return;
    const originalLabel = triggerBtn ? triggerBtn.innerHTML : "";
    if (triggerBtn) { triggerBtn.disabled = true; triggerBtn.innerHTML = "Generating PDF…"; }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth(), pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      const MAX_PAGES = 2;

      const bgPng = await loadPdfBgPng(Math.round(pageW * 2), Math.round(pageH * 2));
      const drawBg = () => doc.addImage(bgPng, "PNG", 0, 0, pageW, pageH);
      drawBg();

      // page-budget helper: only ever allows one addPage() (2 pages total).
      function ensureRoom(y, needed) {
        if (y + needed > pageH - 34 && doc.internal.getNumberOfPages() < MAX_PAGES) {
          doc.addPage(); drawBg();
          return margin + 6;
        }
        return y;
      }

      // ---- header ----
      // (the "CYBERSECURITY FOUNDATIONS" title is already baked into the
      // background artwork at the top of the page — no need to draw it again)
      doc.setFont("helvetica", "bold"); doc.setFontSize(15.5); doc.setTextColor(18, 26, 43);
      doc.text("WEEK " + pdfWeekNumber() + " - CYBER PRACTICE TEST", pageW / 2, 50, { align: "center" });

      doc.setDrawColor(190, 227, 250); doc.setLineWidth(1);
      doc.line(margin, 60, pageW - margin, 60);

      // ---- date / time row ----
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = now.toLocaleTimeString();
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(90, 100, 120);
      doc.text(dateStr, margin, 76);
      doc.text(timeStr, pageW - margin, 76, { align: "right" });

      // ---- name / id / grade row (name gets the most width) ----
      let y = 98;
      const name = (el.studentNameInput && el.studentNameInput.value.trim()) || "-";
      const sid = (el.studentIdInput && el.studentIdInput.value.trim()) || "-";
      const grade = (el.studentGradeInput && el.studentGradeInput.value.trim()) || "-";

      const nameLabelX = margin, idLabelX = margin + 250, gradeLabelX = margin + 370;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 40, 60);
      doc.text("Name:", nameLabelX, y);
      doc.text("ID:", idLabelX, y);
      doc.text("Grade:", gradeLabelX, y);
      doc.setFont("helvetica", "normal"); doc.setTextColor(60, 70, 90);
      doc.text(name, nameLabelX + 34, y, { maxWidth: 205 });
      doc.text(sid, idLabelX + 18, y, { maxWidth: 110 });
      doc.text(grade, gradeLabelX + 38, y, { maxWidth: pageW - margin - (gradeLabelX + 38) });
      doc.setDrawColor(200, 210, 225); doc.setLineWidth(0.6);
      doc.line(nameLabelX + 34, y + 3, idLabelX - 10, y + 3);
      doc.line(idLabelX + 18, y + 3, gradeLabelX - 10, y + 3);
      doc.line(gradeLabelX + 38, y + 3, pageW - margin, y + 3);

      // ---- status / points row ----
      y += 22;
      const status = pdfTestStatus();
      const totals = pdfTotals();
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.setTextColor(status === "Completed" ? 20 : status === "Incomplete" ? 176 : 160,
                        status === "Completed" ? 140 : status === "Incomplete" ? 130 : 70,
                        status === "Completed" ? 110 : status === "Incomplete" ? 40 : 70);
      doc.text("Cyber Practice Test: " + status, margin, y);
      doc.setTextColor(18, 26, 43);
      doc.text("Practice Test Points: " + totals.correct + " / " + totals.total, pageW - margin, y, { align: "right" });

      doc.setDrawColor(190, 227, 250); doc.setLineWidth(0.75);
      doc.line(margin, y + 10, pageW - margin, y + 10);
      y += 24;

      const catByType = {};
      state.test.categories.forEach((cat, i) => (catByType[cat.id] = { cat, cs: state.catState[i] }));

      if (catByType["MULTIPLE-CHOICE QUESTIONS"]) y = pdfDrawMCQ(doc, catByType["MULTIPLE-CHOICE QUESTIONS"], margin, pageW, pageH, y, ensureRoom);
      if (catByType["YES / NO"]) y = pdfDrawYesNo(doc, catByType["YES / NO"], margin, pageW, pageH, y, ensureRoom);
      if (catByType["MATCHING"]) y = pdfDrawMatching(doc, catByType["MATCHING"], margin, pageW, pageH, y, ensureRoom);
      if (catByType["DRAG AND DROP"]) y = pdfDrawDragDrop(doc, catByType["DRAG AND DROP"], margin, pageW, pageH, y, ensureRoom);
      if (catByType["SHORT ANSWER"]) y = pdfDrawShortAnswer(doc, catByType["SHORT ANSWER"], margin, pageW, pageH, y, ensureRoom);

      const safeName = (name || "student").replace(/[^a-z0-9]+/gi, "_");
      doc.save("Week" + pdfWeekNumber() + "_Cyber_Practice_Test_" + safeName + ".pdf");
    } catch (err) {
      console.error(err);
      alert("Something went wrong generating the PDF. Please try again.");
    } finally {
      if (triggerBtn) { triggerBtn.disabled = false; triggerBtn.innerHTML = originalLabel; }
    }
  }

  function pdfSectionTitle(doc, text, margin, y) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(11.5); doc.setTextColor(18, 26, 43);
    doc.text(text, margin, y);
    return y + 13;
  }

  function pdfDrawMCQ(doc, { cat, cs }, margin, pageW, pageH, y, ensureRoom) {
    y = ensureRoom(y, 24);
    y = pdfSectionTitle(doc, "Multiple Choice Questions", margin, y);
    const qMaxW = pageW - margin * 2;

    cat.questions.forEach((q, i) => {
      y = ensureRoom(y, 32);
      const item = cs.items[i];
      const attempted = item.status !== "pending";

      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(30, 40, 60);
      const qLines = doc.splitTextToSize((i + 1) + ". " + q.question, qMaxW);
      doc.text(qLines, margin, y);
      y += qLines.length * 10.5 + 4;

      doc.setFont("helvetica", "normal"); doc.setFontSize(8.8);
      let cx = margin;
      const rowH = 15;
      q.options.forEach(opt => {
        const label = opt;
        const isCorrect = opt === q.answer;
        const isWronglyChosen = attempted && item.chosen === opt && !isCorrect;
        const w = doc.getTextWidth(label) + 10;
        if (cx + w > pageW - margin) { cx = margin; y += rowH; }
        let borderColor = null;
        if (attempted && isCorrect) borderColor = [30, 160, 110];
        else if (isWronglyChosen) borderColor = [190, 60, 70];
        if (borderColor) {
          doc.setDrawColor(...borderColor); doc.setLineWidth(0.8);
          doc.roundedRect(cx - 3, y - 9, w, 13, 2, 2);
          doc.setTextColor(...borderColor);
        } else {
          doc.setTextColor(80, 90, 110);
        }
        doc.text(label, cx, y);
        cx += w + 8;
      });
      y += rowH + 6;

      // darker thin bottom border below each question's answer options
      doc.setDrawColor(160, 174, 194); doc.setLineWidth(0.6);
      doc.line(margin, y - 4, pageW - margin, y - 4);
      y += 7;
    });
    return y + 4;
  }

  function pdfDrawYesNo(doc, { cat, cs }, margin, pageW, pageH, y, ensureRoom) {
    y = ensureRoom(y, 24);
    y = pdfSectionTitle(doc, "Yes / No", margin, y);
    const qMaxW = pageW - margin * 2 - 78;

    cat.questions.forEach((q, i) => {
      y = ensureRoom(y, 17);
      const row = cs.rows[i];
      const attempted = row.status !== "pending";
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.2); doc.setTextColor(50, 60, 80);
      const lines = doc.splitTextToSize((i + 1) + ". " + q.question, qMaxW);
      doc.text(lines, margin, y);

      const answerLabel = attempted ? (row.selected || "-") : "Not attempted";
      if (attempted) {
        const isCorrect = row.selected === q.answer;
        doc.setTextColor(...(isCorrect ? [30, 160, 110] : [190, 60, 70]));
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.2);
      } else {
        doc.setTextColor(150, 155, 165);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.6);
      }
      doc.text(answerLabel, pageW - margin, y, { align: "right" });

      y += Math.max(lines.length * 11, 13);

      doc.setDrawColor(160, 174, 194); doc.setLineWidth(0.6);
      doc.line(margin, y - 6, pageW - margin, y - 6);
      y += 4;
    });
    return y + 2;
  }

  function pdfDrawMatching(doc, { cat, cs }, margin, pageW, pageH, y, ensureRoom) {
    const q = cat.questions[0];
    const answerMap = {};
    q.answers.forEach(a => (answerMap[a.left] = a.right));

    const rowH = 15;
    const needed = 20 + q.left.length * rowH;
    y = ensureRoom(y, Math.min(needed, pageH - margin * 2 - 20));
    y = pdfSectionTitle(doc, "Matching", margin, y);

    const leftColW = (pageW - margin * 2) * 0.28;
    const rightColX = margin + (pageW - margin * 2) * 0.44;
    const rightColW = pageW - margin - rightColX;
    const startY = y;
    const leftDotX = margin + leftColW - 4;
    const rightDotX = rightColX + 4;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const rightOrder = cs.rightOrder && cs.rightOrder.length ? cs.rightOrder : q.right;

    q.left.forEach((term, i) => {
      const ly = startY + i * rowH;
      if (ly > pageH - margin) return;
      const connectedDef = cs.connections[term];
      const attempted = !!connectedDef;
      const isCorrect = attempted && connectedDef === answerMap[term];
      const color = attempted ? (isCorrect ? [30, 160, 110] : [190, 60, 70]) : [70, 80, 100];
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(term, leftColW - 8);
      doc.text(lines[0], margin, ly);
    });

    rightOrder.forEach((defText, i) => {
      const ry = startY + i * rowH;
      if (ry > pageH - margin) return;
      const connectedTerm = Object.keys(cs.connections).find(t => cs.connections[t] === defText);
      const attempted = !!connectedTerm;
      const isCorrect = attempted && answerMap[connectedTerm] === defText;
      const color = attempted ? (isCorrect ? [30, 160, 110] : [190, 60, 70]) : [70, 80, 100];
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(defText, rightColW - 8);
      doc.text(lines[0], rightColX, ry);
    });

    q.left.forEach((term, i) => {
      const connectedDef = cs.connections[term];
      if (!connectedDef) return;
      const j = rightOrder.indexOf(connectedDef);
      if (j < 0) return;
      const isCorrect = connectedDef === answerMap[term];
      const y1 = startY + i * rowH - 3, y2 = startY + j * rowH - 3;
      if (y1 > pageH - margin || y2 > pageH - margin) return;
      doc.setDrawColor(...(isCorrect ? [30, 160, 110] : [190, 60, 70]));
      doc.setLineWidth(0.8);
      doc.line(leftDotX, y1, rightDotX, y2);
    });

    const rowCount = Math.max(q.left.length, rightOrder.length);
    doc.setDrawColor(160, 174, 194); doc.setLineWidth(0.6);
    for (let i = 0; i < rowCount; i++) {
      const by = startY + (i + 1) * rowH - 4;
      if (by > pageH - margin) break;
      doc.line(margin, by, pageW - margin, by);
    }

    return startY + rowCount * rowH + 6;
  }

  function pdfDrawDragDrop(doc, { cat, cs }, margin, pageW, pageH, y, ensureRoom) {
    const q = cat.questions[0];
    const answerMap = {};
    q.answers.forEach(a => (answerMap[a.item] = a.category));

    const items = cs.itemsOrder || q.items;
    const itemsByCategory = {};
    q.categories.forEach(c => (itemsByCategory[c] = items.filter(it => cs.placements[it] === c)));
    const estBoxesH = q.categories.reduce((sum, c) => sum + 18 + Math.max(itemsByCategory[c].length, 1) * 12 + 8, 0);
    const estListH = items.length * 14;
    const needed = 24 + Math.max(estListH, estBoxesH);
    y = ensureRoom(y, Math.min(needed, pageH - margin * 2 - 20));
    y = pdfSectionTitle(doc, "Drag & Drop", margin, y);

    const contentW = pageW - margin * 2;
    const leftColW = contentW * 0.28;
    const rightColX = margin + contentW * 0.36;
    const rightColW = pageW - margin - rightColX;
    const startY = y;

    // ---- left column: all draggable items ----
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    const rowH = 14;
    let ly = startY;
    items.forEach(item => {
      const placedCategory = cs.placements[item];
      const attempted = !!placedCategory;
      const isCorrect = attempted && placedCategory === answerMap[item];
      doc.setTextColor(...(attempted ? (isCorrect ? [30, 160, 110] : [190, 60, 70]) : [90, 100, 120]));
      const lines = doc.splitTextToSize(item, leftColW - 6);
      doc.text(lines[0], margin, ly);
      ly += rowH;
    });

    // ---- right column: one box per category, listing what landed inside it ----
    let ry = startY;
    q.categories.forEach(catName => {
      const inCat = itemsByCategory[catName];
      const boxH = 16 + Math.max(inCat.length, 1) * 12;
      doc.setDrawColor(205, 214, 228); doc.setLineWidth(0.7);
      doc.roundedRect(rightColX, ry - 10, rightColW, boxH, 3, 3);

      doc.setFont("helvetica", "bold"); doc.setFontSize(8.8); doc.setTextColor(18, 26, 43);
      const headerLines = doc.splitTextToSize(catName, rightColW - 10);
      doc.text(headerLines[0], rightColX + 6, ry);

      let iy = ry + 13;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.4);
      if (inCat.length) {
        inCat.forEach(it => {
          const isCorrect = answerMap[it] === catName;
          doc.setTextColor(...(isCorrect ? [30, 160, 110] : [190, 60, 70]));
          const l = doc.splitTextToSize("• " + it, rightColW - 12);
          doc.text(l[0], rightColX + 8, iy);
          iy += 12;
        });
      } else {
        doc.setTextColor(160, 165, 175);
        doc.text("(nothing placed here)", rightColX + 8, iy);
      }
      ry += boxH + 8;
    });

    return Math.max(ly, ry) + 4;
  }

  function pdfDrawShortAnswer(doc, { cat, cs }, margin, pageW, pageH, y, ensureRoom) {
    y = ensureRoom(y, 24);
    y = pdfSectionTitle(doc, "Short Answer", margin, y);
    const qMaxW = pageW - margin * 2 - 12;

    cat.questions.forEach((q, i) => {
      const item = cs.items[i];
      const attempted = !!(item.lastAnswer && item.lastAnswer.trim());
      y = ensureRoom(y, 26);

      doc.setFont("helvetica", "bold"); doc.setFontSize(9.4); doc.setTextColor(30, 40, 60);
      const qLines = doc.splitTextToSize((i + 1) + ". " + q.question, qMaxW);
      doc.text(qLines, margin, y);
      y += qLines.length * 10.6 + 3;

      const answerText = attempted ? (item.lastAnswer || "-") : "Not attempted";
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.2);
      const aLines = doc.splitTextToSize("A: " + answerText, qMaxW - 6);
      const boxH = aLines.length * 10.6 + 7;
      y = ensureRoom(y, boxH + 6);

      if (attempted) {
        const isCorrect = item.status === "correct";
        const color = isCorrect ? [30, 160, 110] : [190, 60, 70];
        doc.setDrawColor(...color); doc.setLineWidth(0.8);
        doc.roundedRect(margin - 2, y - 8, qMaxW + 8, boxH, 3, 3);
        doc.setTextColor(...color);
      } else {
        doc.setTextColor(150, 155, 165);
        doc.setFont("helvetica", "italic");
      }
      doc.text(aLines, margin + 2, y);
      y += boxH + 6;
    });
    return y;
  }

  init();
})();
