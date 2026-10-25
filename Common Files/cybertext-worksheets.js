/* =====================================================================
   CYBER TEXT WORKSHEETS  —  guide-based simulation labs for Cyberindex.html
   ---------------------------------------------------------------------
   Left page : the GUIDE text (taken word for word from the weekly guide) + DO THIS NOW instructions
   Right page: an interactive simulation built on that guide text + RESULT box
   Start screen: lab introduction (left) + student details (right).  PDF unlocks at 40 %.

   HOW TO ADD A LAB (e.g. WEEK 11 LAB 1):
     1. GUIDES.<key>   = { code, title, chapter, sections:[{ id, tab, title, text:[ 'paragraph', ... ] }] }
                         **double stars** make a key term bold.  A paragraph that starts with
                         "Label: ..." shows the label in bold (used for bullet-style lines).
     2. PARTS.<name>   = { title, q, guide:'<key>', steps:[{ t:'mission text', sec:'<section id>' }],
                           mount(body, api) -> { guide(k), cleanup() } }
        api: award(n) · result(kind, html) · mistake(html) · done(k) · isDone(k) · refresh() · showSec(id)
     3. LABS.push({ id, week, slot:'LAB-1', title, topic, meta, guide, parts:[...], intro, objectives[], outcomes[] })
        The button WK-<week>-<slot> on that week's flip card opens the lab automatically.
   ===================================================================== */
(function () {
'use strict';
if (window.CyberWorksheets) return;

/* ------------------------------------------------------------------ styles ------------------------------------------------------------------ */
const CSS = `
.cw-root{--ink:#1E293B;--muted:#64748B;--line:#E2E8F0;--soft:#F8FAFC;--blue:#2563EB;--blue-l:#EFF6FF;--org:#EA580C;--good:#15803D;--good-l:#F0FDF4;--bad:#B91C1C;--bad-l:#FEF2F2;--red:#8B0000;
  --mono:'IBM Plex Mono',ui-monospace,Consolas,monospace;
  flex:1;min-height:0;min-width:0;width:100%;overflow:hidden;display:flex;flex-direction:column;font:14px/1.45 'Lexend',system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:#fff;
  -webkit-user-select:none;user-select:none}
.cw-root *{box-sizing:border-box}
.cw-root button{font-family:inherit}
.cw-root input{-webkit-user-select:text;user-select:text}
.cw-top,.cw-rhead{flex:none;height:46px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line);background:linear-gradient(90deg,#EEF4FF 0%,#F1FAF7 100%)}
.cw-top{padding:0 26px 0 14px}
.cw-rhead{padding:0 14px 0 26px}
.cw-tabs{flex:none;display:flex}
.cw-tab{border:1px solid #A7D7B5;border-left-width:0;background:#DCFCE7;padding:5px 11px;font-size:12.5px;font-weight:700;color:#14532D;cursor:pointer;white-space:nowrap;border-radius:0}
.cw-tab:first-child{border-left-width:1px;border-radius:6px 0 0 6px}
.cw-tab:last-child{border-radius:0 6px 6px 0}
.cw-tab:hover{background:#BBF7D0}
.cw-tab.on{background:#15803D;border-color:#15803D;color:#fff}
.cw-tab.done:not(.on)::after{content:' ✓';color:#15803D}
.cw-ttl{flex:1;min-width:0;display:flex;align-items:baseline;gap:8px;white-space:nowrap;overflow:hidden}
.cw-ttl small{flex:none;font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--blue)}
.cw-ttl b{font-size:14px;overflow:hidden;text-overflow:ellipsis}
.cw-score{flex:none;font-size:13px;color:var(--muted)}
.cw-score b{font-size:16px;color:var(--org)}
.cw-lbody{flex:1;min-height:0;overflow:hidden;padding:.55em 26px .45em 14px;display:flex;flex-direction:column;gap:.55em;font-size:18px}
.cw-lnav{flex:none;height:42px;margin-bottom:2px;display:flex;align-items:center;gap:6px;padding:0 26px 0 14px;border-top:1px solid var(--line)}
.cw-lnav span{flex:1;text-align:center;font-size:12px;color:var(--muted);white-space:nowrap}
.cw-home{flex:none;border:1px solid var(--red);background:var(--red);color:#fff;border-radius:7px;padding:5px 11px;font-weight:600;font-size:12.5px;cursor:pointer}
.cw-home:hover{background:#A50000}
.cw-btn{border:1px solid var(--blue);background:var(--blue);color:#fff;border-radius:7px;padding:5px 12px;font-weight:600;font-size:12.5px;cursor:pointer}
.cw-btn:hover{background:#1D4ED8}
.cw-btn.ghost{background:#fff;color:var(--blue)}
.cw-btn.ghost:hover{background:var(--blue-l)}
.cw-btn.gry{background:#fff;color:var(--ink);border-color:#CBD5E1}
.cw-btn.org{background:var(--org);border-color:var(--org)}
.cw-btn.red{background:var(--red);border-color:var(--red)}
.cw-btn.big{padding:9px 18px;font-size:14px}
.cw-btn:disabled{opacity:.45;cursor:not-allowed}
.cw-btn.pulse{outline:3px solid #BFDBFE}
.cw-pdf{opacity:.6}
.cw-pdf:disabled{opacity:.45;cursor:not-allowed}
.cw-pdf.ready{opacity:1;background:var(--good);border-color:var(--good);color:#fff}
/* left page: instructions + guide reader */
.cw-instr{font-size:.74em;font-weight:800;letter-spacing:.14em;color:var(--red);border-bottom:2px solid var(--red);padding-bottom:3px}
.cw-do{flex:none;border:1px solid #F3C4C4;background:#FFF5F5;border-radius:10px;padding:.5em .75em}
.cw-do small{display:block;font-size:.64em;font-weight:800;letter-spacing:.1em;color:var(--red);margin-bottom:.2em}
.cw-dob{font-size:.9em;font-weight:700;color:var(--red);line-height:1.42}
.cw-dob b{color:#5C0000}
.cw-dob kbd,.cw-root kbd{font-family:var(--mono);font-size:.9em;font-weight:700;background:#fff;border:1px solid #CBD5E1;border-radius:5px;padding:0 5px;color:var(--ink)}
.cw-do.fin{border-color:#BBF7D0;background:var(--good-l)}
.cw-do.fin small,.cw-do.fin .cw-dob{color:var(--good)}
.cw-guide{flex:1;min-height:0;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.cw-ghead{flex:none;display:flex;align-items:center;gap:8px;padding:.35em .7em;background:#0F2A44;color:#fff}
.cw-ghead b{font-size:.68em;letter-spacing:.14em}
.cw-ghead span{margin-left:auto;font:700 .66em 'Oswald','Lexend',sans-serif;letter-spacing:.08em;color:#FDBA74}
.cw-chips{flex:none;display:flex;flex-wrap:wrap;gap:.3em;padding:.45em .6em;border-bottom:1px solid var(--line);background:var(--soft)}
.cw-chip{border:1px solid #CBD5E1;background:#fff;border-radius:999px;padding:.12em .7em;font-size:.68em;font-weight:600;color:var(--ink);cursor:pointer;white-space:nowrap}
.cw-chip:hover{background:var(--blue-l)}
.cw-chip.on{background:#0F2A44;border-color:#0F2A44;color:#fff}
.cw-chip.need{box-shadow:0 0 0 2px #F59E0B}
.cw-gtext{flex:1;min-height:0;overflow:hidden;padding:.5em .8em}
.cw-gtext h4{margin:0 0 .3em;font:700 1.1em 'Oswald','Lexend',sans-serif;letter-spacing:.03em;color:#0F2A44}
.cw-gtext p{margin:0 0 .5em;font-size:1em;line-height:1.5;color:#1F2937}
.cw-gtext p b{color:#0F2A44}
.cw-gtext p.lbl{padding-left:.7em;border-left:3px solid #CBD5E1}
.cw-gtext p.lbl>b:first-child{color:var(--red)}
.cw-gtext.flash{animation:cw-glow 1s}
@keyframes cw-glow{0%{background:#FEF3C7}100%{background:transparent}}
/* intro */
.cw-intro h1{margin:0 0 .2em;font:700 1.4em/1.15 'Oswald','Lexend',sans-serif;letter-spacing:.02em;color:#0F2A44}
.cw-intro .tp{margin:0 0 .45em;font-size:.8em;font-weight:700;letter-spacing:.06em;color:var(--red)}
.cw-intro p{margin:0 0 .45em;font-size:.9em;line-height:1.5}
.cw-intro h4{margin:.5em 0 .2em;font-size:.72em;letter-spacing:.1em;text-transform:uppercase;color:var(--blue)}
.cw-intro ul,.cw-intro ol{margin:0;padding-left:1.25em;font-size:.88em;line-height:1.42}
.cw-intro li{margin:.12em 0}
.cw-intro li span{display:block;color:var(--muted);font-size:.9em}
/* right page */
.cw-rt{flex:1 1 50%;min-width:0}
.cw-rt h2{margin:0;font-size:15px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-rt p{margin:1px 0 0;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-result{flex:1 1 50%;min-width:0;height:38px;overflow:hidden;display:flex;align-items:center;gap:7px;padding:0 8px 0 6px;border-radius:8px;background:var(--red);border-left:4px solid #5C0000;color:#fff}
.cw-result small{flex:none;font-size:8.5px;font-weight:800;letter-spacing:.1em;writing-mode:vertical-rl;transform:rotate(180deg);color:#FECACA}
.cw-rbody{flex:1;min-width:0;font-size:12.5px;line-height:1.25;max-height:2.5em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cw-rbody b{color:#fff}
.cw-pop{animation:cw-pop .4s}
@keyframes cw-pop{40%{transform:scale(1.02)}}
.cw-miss{flex:none;display:flex;gap:.3em;align-items:center;overflow:hidden;font-size:.72em}
.cw-miss>small{flex:none;font-size:.85em;font-weight:800;letter-spacing:.12em;color:var(--red);margin-right:.2em}
.cw-ms{flex:1 1 0;min-width:0;display:flex;align-items:center;gap:.35em;border:1px solid var(--line);border-radius:7px;padding:.25em .5em;font-size:1em;background:#fff;white-space:nowrap;overflow:hidden}
.cw-ms i{flex:none;width:1.25em;height:1.25em;border-radius:4px;border:1.5px solid #CBD5E1;display:grid;place-items:center;font-style:normal;font-size:10px;color:#fff}
.cw-ms span{overflow:hidden;text-overflow:ellipsis}
.cw-ms.ok{background:var(--good-l);border-color:#BBF7D0}
.cw-ms.ok i{background:var(--good);border-color:var(--good)}
.cw-ms.now{border-color:var(--blue);background:var(--blue-l);flex-grow:2.2}
.cw-stars{flex:none;font-size:1.1em;letter-spacing:1px}
.cw-rfoot{flex:none;height:36px;margin-bottom:2px;display:flex;align-items:center;gap:10px;padding:0 14px 0 26px;border-top:1px solid var(--line)}
.cw-rfoot span{flex:1;text-align:center;font:400 11px 'Times New Roman',Times,serif;letter-spacing:.04em;color:#6B7280;white-space:nowrap;overflow:hidden}
.cw-fs{flex:none;border:1px solid #15803D;border-radius:7px;background:#15803D;color:#fff;font:700 11.5px 'Lexend',sans-serif;letter-spacing:.04em;padding:5px 11px;cursor:pointer}
.cw-fs:hover{background:#166534}
.cw-donebar{flex:none;display:flex;align-items:center;gap:10px;justify-content:space-between;margin:6px 14px 0 26px;padding:6px 10px;border:1px solid #86EFAC;border-radius:10px;background:var(--good-l);font-size:13.5px;color:var(--good)}
.cw-donebar .cw-btn{background:var(--good);border-color:var(--good)}
.cw-stage{flex:1;min-height:0;min-width:0;overflow:hidden;padding:0 14px 6px 26px}
.cw-fit{transform-origin:top left;width:100%}
.cw-card{border:1px solid var(--line);border-top:0;border-radius:0 0 12px 12px;background:#fff;padding:10px 14px 12px}
.cw-card h3{margin:0 0 4px;font:700 17px 'Oswald','Lexend',sans-serif;letter-spacing:.03em;color:#0F2A44}
.cw-card .sub{margin:0 0 10px;font-size:13px;color:var(--muted)}
.cw-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.cw-msg{font-size:13.5px;font-weight:600;min-height:1.2em;margin-top:6px}
.cw-msg.bad{color:var(--bad)}.cw-msg.good{color:var(--good)}
.cw-shake{animation:cw-shake .4s}
@keyframes cw-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
.cw-ghost{position:fixed;z-index:99999;pointer-events:none;opacity:.92;transform:rotate(-2deg);box-shadow:0 10px 24px -8px rgba(0,0,0,.35)}
.cw-lifting{opacity:.35}
/* start screen */
.cw-start{max-width:470px;margin:0 auto;padding-top:10px;display:flex;flex-direction:column;gap:14px}
.cw-start h3{margin:0;font:700 22px 'Oswald','Lexend',sans-serif;letter-spacing:.03em;color:#0F2A44}
.cw-start>p{margin:-8px 0 4px;color:var(--muted)}
.cw-start label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);flex:1;min-width:0}
.cw-srow{display:flex;gap:12px}
.cw-dark{width:100%;background:#000;color:#fff;border:1px solid #000;border-radius:8px;padding:10px 12px;font:600 15px 'Lexend',system-ui,sans-serif;outline:none}
.cw-dark::placeholder{color:#8A93A6}
.cw-dark:focus{border-color:var(--blue);box-shadow:0 0 0 3px #BFDBFE}
.cw-dark.err{border-color:var(--bad);box-shadow:0 0 0 3px #FECACA}
select.cw-dark option,select.cw-dark optgroup{background:#000;color:#fff}
.cw-note{margin:0;font-size:12px;color:var(--muted)}
/* PART 1 · phone + SMS */
.cw-p1{display:grid;grid-template-columns:250px minmax(0,1fr);gap:16px;align-items:start}
.cw-phone{border:10px solid #111827;border-radius:30px;background:#F3F4F6;height:440px;display:flex;flex-direction:column;overflow:hidden}
.cw-phone .bar{flex:none;display:flex;justify-content:space-between;padding:5px 12px;font:600 10.5px var(--mono);color:#374151;background:#E5E7EB}
.cw-phone .who{flex:none;padding:8px 12px;border-bottom:1px solid #D1D5DB;background:#fff;font-size:12px;color:var(--muted)}
.cw-phone .who b{display:block;font-size:13.5px;color:var(--ink)}
.cw-phone .msgs{flex:1;padding:12px 10px;display:flex;flex-direction:column;gap:8px;overflow:hidden}
.cw-sms{align-self:flex-start;max-width:96%;background:#fff;border:1px solid #D1D5DB;border-radius:4px 14px 14px 14px;padding:9px 11px;font-size:13px;line-height:1.5;transition:opacity .5s,transform .5s}
.cw-sms.gone{opacity:0;transform:translateX(-30px)}
.cw-tk{cursor:pointer;border-radius:4px;padding:0 1px}
.cw-tk:hover{background:#FEF3C7}
.cw-mono{font-family:var(--mono);font-size:12px;word-break:break-all}
.cw-tk.flag{background:#FEE2E2;color:#991B1B;font-weight:700;box-shadow:inset 0 -2px 0 #DC2626}
.cw-tk.no{background:#E5E7EB}
.cw-flagwho{cursor:pointer;border-radius:4px}
.cw-flagwho:hover{background:#FEF3C7}
.cw-flagwho.flag{background:#FEE2E2;color:#991B1B}
.cw-pact{flex:none;display:flex;gap:6px;padding:8px;border-top:1px solid #D1D5DB;background:#fff}
.cw-pact button{flex:1;border:none;border-radius:8px;padding:8px 4px;font-size:12px;font-weight:700;cursor:pointer}
.cw-pact .open{background:#E5E7EB;color:#374151}
.cw-pact .rep{background:var(--bad);color:#fff}
.cw-pact button:disabled{opacity:.4;cursor:not-allowed}
.cw-flags{display:flex;flex-direction:column;gap:8px}
.cw-fl{display:flex;gap:10px;align-items:flex-start;border:1.5px dashed #CBD5E1;border-radius:10px;padding:9px 11px;min-height:58px;font-size:13px;color:var(--muted)}
.cw-fl i{flex:none;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-style:normal;background:#F1F5F9;font-size:14px}
.cw-fl b{display:block;color:var(--ink);font-size:13.5px}
.cw-fl.got{border-style:solid;border-color:#FCA5A5;background:#FEF2F2;color:#7F1D1D}
.cw-fl.got i{background:#DC2626;color:#fff}
.cw-fl.got b{color:#991B1B}
/* sorter (drag or tap) */
.cw-pool{display:flex;flex-wrap:wrap;gap:8px;min-height:44px;padding:10px;border:1.5px dashed #CBD5E1;border-radius:10px;background:var(--soft)}
.cw-item{cursor:grab;touch-action:none;border:1px solid #94A3B8;background:#fff;border-radius:8px;padding:7px 11px;font-size:13.5px;font-weight:600;color:var(--ink);line-height:1.35}
.cw-item.case{flex:1 1 calc(50% - 8px);font-weight:500;font-size:13px;border-left:4px solid #0F2A44}
.cw-item.sel{outline:3px solid #F59E0B}
.cw-item.placed{cursor:default;background:var(--good-l);border-color:#86EFAC;font-size:12px;padding:4px 8px}
.cw-item.case.placed{flex:none;width:100%;border-left-color:var(--good)}
.cw-bins{display:grid;gap:10px;margin-top:12px}
.cw-bin{border:1.5px solid #CBD5E1;border-radius:10px;background:#fff;min-height:110px;display:flex;flex-direction:column;cursor:pointer}
.cw-bin .h{display:flex;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid var(--line);background:var(--soft);border-radius:10px 10px 0 0}
.cw-bin .h span{font-size:20px}
.cw-bin .h b{display:block;font-size:13.5px;color:#0F2A44;line-height:1.2}
.cw-bin .h small{display:block;font-size:11px;color:var(--muted)}
.cw-bin .h em{margin-left:auto;font-style:normal;font-weight:700;font-size:12px;color:var(--muted)}
.cw-bin .in{flex:1;display:flex;flex-wrap:wrap;gap:5px;align-content:flex-start;padding:7px}
.cw-bin.over{border-color:var(--blue);background:var(--blue-l)}
.cw-bin.hint{border-color:#F59E0B}
/* PART 2 · security centre */
.cw-sec{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px}
.cw-set{border:1px solid var(--line);border-radius:12px;padding:11px 13px;background:#fff}
.cw-set.done{border-color:#86EFAC;background:#F7FEF9}
.cw-set h4{margin:0 0 6px;font-size:14px;display:flex;align-items:center;gap:6px;color:#0F2A44}
.cw-set h4 em{margin-left:auto;font-style:normal;font-size:11px;font-weight:700;color:var(--good)}
.cw-field{width:100%;border:1px solid #CBD5E1;border-radius:8px;padding:8px 10px;font:600 15px var(--mono);color:var(--ink);background:#fff;outline:none}
.cw-field:focus{border-color:var(--blue);box-shadow:0 0 0 3px #DBEAFE}
.cw-meter{height:8px;border-radius:99px;background:#E5E7EB;margin:7px 0 6px;overflow:hidden}
.cw-meter i{display:block;height:100%;width:0;background:#DC2626;transition:width .25s,background .25s}
.cw-rules{list-style:none;margin:0 0 8px;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;font-size:12px;color:var(--muted)}
.cw-rules li::before{content:'✗ ';color:#DC2626;font-weight:700}
.cw-rules li.ok{color:var(--good)}
.cw-rules li.ok::before{content:'✓ ';color:var(--good)}
.cw-old{font-size:11.5px;color:var(--muted);margin:0 0 6px}
.cw-old kbd{font-size:11px}
.cw-tg{display:flex;align-items:center;gap:10px;padding:7px 0;font-size:13px;border-top:1px solid var(--line)}
.cw-tg:first-of-type{border-top:0}
.cw-tg span{flex:1}
.cw-tg span small{display:block;font-size:11px;color:var(--muted)}
.cw-sw{flex:none;width:44px;height:24px;border-radius:99px;border:none;background:#CBD5E1;position:relative;cursor:pointer;transition:background .2s}
.cw-sw::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
.cw-sw.on{background:var(--good)}
.cw-sw.on::after{left:23px}
.cw-sw:disabled{cursor:default}
.cw-otp{display:none;margin-top:6px;gap:8px;align-items:center}
.cw-otp.show{display:flex}
.cw-mini{flex:none;width:96px;border:5px solid #111827;border-radius:14px;background:#0F172A;color:#fff;text-align:center;padding:6px 4px}
.cw-mini small{display:block;font-size:9px;color:#93C5FD}
.cw-mini b{font:700 16px var(--mono);letter-spacing:.06em}
.cw-otpin{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.cw-otp .cw-field{width:100%;font-size:16px;letter-spacing:.2em;text-align:center}
.cw-urls{display:flex;flex-direction:column;gap:10px}
.cw-url{display:flex;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;cursor:pointer;text-align:left;width:100%}
.cw-url:hover{border-color:var(--blue);background:var(--blue-l)}
.cw-url .addr{flex:1;display:flex;align-items:center;gap:8px;background:#F1F5F9;border-radius:999px;padding:7px 12px;font:600 14px var(--mono);color:var(--ink);min-width:0;overflow:hidden;white-space:nowrap}
.cw-url .lk{font-size:15px}
.cw-url .why{flex:none;font-size:12px;font-weight:700;width:150px;text-align:right}
.cw-url.right{border-color:var(--good);background:var(--good-l)}
.cw-url.right .why{color:var(--good)}
.cw-url.wrong{border-color:#FCA5A5;background:var(--bad-l)}
.cw-url.wrong .why{color:var(--bad)}
.cw-form{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;opacity:.45;pointer-events:none}
.cw-form.on{opacity:1}
.cw-form div{border:1px solid #CBD5E1;border-radius:8px;padding:7px 10px;font-size:12.5px;color:var(--muted);background:#fff}
.cw-quiz{display:flex;flex-direction:column;gap:12px}
.cw-q{border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.cw-q.ok{border-color:#86EFAC;background:#F7FEF9}
.cw-q p{margin:0 0 7px;font-size:14px;font-weight:600}
.cw-q .opts{display:flex;flex-wrap:wrap;gap:7px}
.cw-q button{border:1px solid #CBD5E1;background:#fff;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;color:var(--ink)}
.cw-q button:hover{background:var(--blue-l)}
.cw-q button.right{background:var(--good);border-color:var(--good);color:#fff}
.cw-q button.wrong{background:var(--bad-l);border-color:#FCA5A5;color:var(--bad)}
.cw-q button:disabled{cursor:default}
.cw-done{text-align:center;padding:24px 10px}
.cw-done .big{font-size:44px}
.cw-done h3{margin:6px 0;font:700 22px 'Oswald','Lexend',sans-serif;letter-spacing:.03em;color:#0F2A44}
.cw-done p{margin:0 auto;max-width:440px;color:var(--muted)}
.cw-res{max-width:520px;margin:0 auto;text-align:center}
.cw-res .big{font-size:40px}
.cw-res h2{margin:4px 0;font:700 24px 'Oswald','Lexend',sans-serif;letter-spacing:.03em}
.cw-res table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
.cw-res td{padding:7px;border-top:1px solid var(--line);text-align:left}
.cw-res td:last-child{text-align:right}
/* ===== 3D stage (CSS 3D: a camera looks at a world of cubes and flat planes) ===== */
.cw-3d{position:relative;height:var(--sh,320px);border-radius:12px;overflow:hidden;perspective:1100px;perspective-origin:50% 25%;
  background:radial-gradient(120% 90% at 50% 0%,#1E3A5F 0%,#0B1628 62%,#050A13 100%);box-shadow:inset 0 0 0 1px #1E293B}
.cw-3d::before{content:'';position:absolute;inset:0;background:linear-gradient(transparent 0 60%,rgba(5,10,19,.55));pointer-events:none;z-index:2}
.cw-3d .tag3d{position:absolute;left:10px;top:8px;z-index:3;font:700 13px var(--mono);letter-spacing:.12em;color:#7DD3FC;background:rgba(2,6,23,.6);border:1px solid #1E3A5F;border-radius:6px;padding:3px 8px}
.cw-world{position:absolute;left:50%;top:var(--wy,70%);width:0;height:0;transform-style:preserve-3d;transform:scale3d(var(--s,1),var(--s,1),var(--s,1)) rotateX(var(--rx,-18deg)) rotateY(var(--ry,-16deg))}
.cw-o{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d}
.cw-floor{position:absolute;width:1300px;height:900px;left:-650px;top:-450px;transform:rotateX(90deg);
  background:radial-gradient(closest-side,rgba(56,189,248,.16),transparent 70%),repeating-linear-gradient(0deg,rgba(56,189,248,.16) 0 1px,transparent 1px 60px),repeating-linear-gradient(90deg,rgba(56,189,248,.16) 0 1px,transparent 1px 60px),#0A1324}
.cw-cube{position:absolute;width:var(--w);height:var(--h);margin-left:calc(var(--w) / -2);margin-top:calc(var(--h) / -2);transform-style:preserve-3d}
.cw-cube .f{position:absolute;left:0;top:0;background:var(--c,#475569);box-shadow:inset 0 0 0 1px rgba(255,255,255,.07)}
.cw-cube .fr{width:var(--w);height:var(--h);transform:translateZ(calc(var(--d) / 2));background:var(--fc,var(--c))}
.cw-cube .bk{width:var(--w);height:var(--h);transform:rotateY(180deg) translateZ(calc(var(--d) / 2));filter:brightness(.6)}
.cw-cube .lf{width:var(--d);height:var(--h);left:calc((var(--w) - var(--d)) / 2);transform:rotateY(-90deg) translateZ(calc(var(--w) / 2));filter:brightness(.82)}
.cw-cube .rt{width:var(--d);height:var(--h);left:calc((var(--w) - var(--d)) / 2);transform:rotateY(90deg) translateZ(calc(var(--w) / 2));filter:brightness(.68)}
.cw-cube .tp{width:var(--w);height:var(--d);top:calc((var(--h) - var(--d)) / 2);transform:rotateX(90deg) translateZ(calc(var(--h) / 2));background:var(--tc,var(--c));filter:brightness(1.15)}
.cw-cube .bt{width:var(--w);height:var(--d);top:calc((var(--h) - var(--d)) / 2);transform:rotateX(-90deg) translateZ(calc(var(--h) / 2));filter:brightness(.4)}
.cw-pl{position:absolute;width:var(--w);height:var(--h);margin-left:calc(var(--w) / -2);margin-top:calc(var(--h) / -2);transform:rotateX(90deg)}
.cw-bb{position:absolute;white-space:nowrap;transform:translate(-50%,-50%);font:700 18px var(--mono);letter-spacing:.06em;color:#E0F2FE;background:rgba(2,6,23,.82);border:1.5px solid #38BDF8;border-radius:6px;padding:3px 10px}
.cw-bb.red{border-color:#F87171;color:#FECACA}
.cw-bb.grn{border-color:#4ADE80;color:#DCFCE7}
.cw-hot{cursor:pointer}
.cw-hot:hover .f,.cw-hot:hover .cw-pl,.cw-hot:hover>.hotf{outline:2px solid #FDE68A}
.cw-hot.glow .f,.cw-hot.glow .cw-pl,.cw-hot.glow>.hotf{outline:2px solid #FBBF24;box-shadow:0 0 22px rgba(251,191,36,.9)}
.cw-hot.sel .f,.cw-hot.sel .cw-pl,.cw-hot.sel>.hotf{outline:3px solid #38BDF8;box-shadow:0 0 26px rgba(56,189,248,.95)}
.cw-hot.fixed{cursor:default}
.cw-hot.fixed .f,.cw-hot.fixed .cw-pl,.cw-hot.fixed>.hotf{outline:none;box-shadow:none}
.cw-gone{opacity:0;transition:opacity .6s,transform .6s;pointer-events:none}
.cw-led{display:inline-block;width:6px;height:6px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px #22C55E;margin:0 2px;animation:cw-blink 1.2s infinite}
.cw-led.r{background:#EF4444;box-shadow:0 0 6px #EF4444}
.cw-led.a{background:#F59E0B;box-shadow:0 0 6px #F59E0B;animation-duration:.5s}
@keyframes cw-blink{50%{opacity:.25}}
/* incident response: laptop, C2 server, firewall, terminal */
.cw-scr{position:absolute;overflow:hidden;background:#020617;border:5px solid #1F2937;border-radius:6px;font:700 10px/1.32 var(--mono);color:#4ADE80;padding:5px 6px;white-space:pre;text-align:left}
.cw-scr .w{color:#F87171}
.cw-beam{position:absolute;height:4px;margin-top:-2px;background:linear-gradient(90deg,rgba(239,68,68,.2),rgba(239,68,68,.95));box-shadow:0 0 12px rgba(239,68,68,.9);opacity:0;transition:opacity .5s}
.cw-beam.on{opacity:1}
.cw-beam.dim{opacity:.25;filter:grayscale(1)}
.cw-beam i{position:absolute;top:-3px;width:10px;height:10px;border-radius:2px;background:#FCA5A5;box-shadow:0 0 10px #EF4444;animation:cw-pkt 1.6s linear infinite}
.cw-beam.dim i{animation-play-state:paused;opacity:0}
.cw-beam i:nth-child(2){animation-delay:.55s}.cw-beam i:nth-child(3){animation-delay:1.1s}
@keyframes cw-pkt{from{left:0}to{left:calc(100% - 10px)}}
.cw-fw{transition:opacity .6s;opacity:0}
.cw-fw.on{opacity:1}
.cw-fw .f{background:repeating-linear-gradient(0deg,rgba(251,146,60,.5) 0 2px,transparent 2px 14px),repeating-linear-gradient(90deg,rgba(251,146,60,.5) 0 2px,transparent 2px 14px),rgba(234,88,12,.28)!important;box-shadow:0 0 18px rgba(251,146,60,.8)}
.cw-db{opacity:0;transition:opacity .6s}
.cw-db.on{opacity:1}
.cw-term{margin-top:10px;border-radius:10px;background:#0B1120;border:1px solid #1E293B;overflow:hidden;font:500 15px/1.5 var(--mono);color:#CBD5E1}
.cw-term .tb{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#111827;border-bottom:1px solid #1E293B;font-size:13px;color:#94A3B8}
.cw-term .tb i{width:10px;height:10px;border-radius:50%;background:#EF4444}.cw-term .tb i+i{background:#F59E0B}.cw-term .tb i+i+i{background:#22C55E}
.cw-term .tb span{margin-left:8px}
.cw-term .out{height:230px;overflow:hidden;padding:7px 11px;display:flex;flex-direction:column;justify-content:flex-end}
.cw-term .out div{white-space:pre-wrap;word-break:break-word}
.cw-term .c{color:#93C5FD}.cw-term .ok{color:#4ADE80}.cw-term .bad{color:#F87171}.cw-term .warn{color:#FBBF24}.cw-term .dim{color:#64748B}
.cw-term .in{display:flex;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid #1E293B;background:#0F172A}
.cw-term .in b{color:#4ADE80;white-space:nowrap;font-size:17px}
.cw-term .in input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:#F8FAFC;font:600 17px var(--mono);caret-color:#4ADE80}
.cw-cmds{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}
.cw-cmds kbd{cursor:pointer;font-size:14px;padding:2px 8px}
/* clean-desk patrol: action panel */
.cw-act{margin-top:10px;border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fff;min-height:96px}
.cw-act h4{margin:0 0 4px;font-size:14.5px;color:#0F2A44}
.cw-act p{margin:0 0 8px;font-size:13.5px;color:var(--ink)}
.cw-act .opts{display:flex;flex-wrap:wrap;gap:8px}
.cw-act .opts button{border:1px solid #CBD5E1;background:#fff;border-radius:8px;padding:7px 12px;font-size:13.5px;font-weight:600;cursor:pointer;color:var(--ink)}
.cw-act .opts button:hover{background:var(--blue-l);border-color:var(--blue)}
.cw-sticky{position:absolute;width:72px;height:60px;background:#FDE047;color:#713F12;font:700 11px/1.25 var(--mono);padding:4px;transform:rotate(-6deg);box-shadow:0 2px 0 #CA8A04}
.cw-post{position:absolute;inset:6px;background:#fff;border-radius:3px;padding:6px 8px;font:600 11.5px/1.3 'Lexend',sans-serif;color:#0F172A;text-align:left}
.cw-post b{display:block;color:#1D4ED8;font-size:12px}
.cw-post .pd{color:#B91C1C}
.cw-post.clean .pd{text-decoration:line-through;color:#94A3B8}
.cw-strips{position:absolute;left:10px;right:10px;bottom:-4px;height:0;background:repeating-linear-gradient(90deg,#F8FAFC 0 4px,transparent 4px 7px);transition:height .8s}
.cw-strips.on{height:26px}
/* ===== Week 11-12 labs: 3D props ===== */
.cw-link{position:absolute;left:0;top:-2px;height:4px;transform-origin:0 50%;background:var(--lc,#38BDF8);box-shadow:0 0 12px var(--lc,#38BDF8);opacity:0;transition:opacity .5s,background .4s}
.cw-link.on{opacity:1}
.cw-link i{position:absolute;top:-3px;width:10px;height:10px;border-radius:2px;background:#fff;box-shadow:0 0 10px var(--lc,#38BDF8);animation:cw-pkt 1.8s linear infinite}
.cw-link i:nth-child(2){animation-delay:.6s}.cw-link i:nth-child(3){animation-delay:1.2s}
.cw-av{position:absolute;left:0;transform:translate(-50%,-50%);font-size:44px;line-height:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}
.cw-mon{position:absolute;inset:4px;background:#0B1220;color:#E2E8F0;font:700 12px/1.3 var(--mono);padding:5px 6px;overflow:hidden;text-align:left}
.cw-mon .t{color:#7DD3FC;margin-bottom:3px}.cw-mon .d{color:#CBD5E1;font-weight:600}
.cw-ru{display:flex;justify-content:space-between;align-items:center;height:12px;margin-bottom:5px;border:1px solid #64748B;border-radius:2px;padding:0 4px;background:#0F172A;font:700 7px var(--mono);color:#94A3B8}
.cw-wall{position:absolute;background:#020617;border:7px solid #1F2937;border-radius:6px;color:#E2E8F0;font:700 14px/1.35 var(--mono);padding:8px 10px;overflow:hidden;box-shadow:0 0 30px rgba(56,189,248,.25)}
.cw-siem b{display:block;color:#7DD3FC;margin-bottom:6px}
.cw-siem .al{background:#7F1D1D;color:#FECACA;border-radius:4px;padding:6px 8px;animation:cw-blink 1s infinite}
.cw-siem .al.ok{background:#14532D;color:#BBF7D0;animation:none}
.cw-siem .kp{display:flex;gap:8px;margin-top:8px}.cw-siem .kp span{flex:1;background:#0F172A;border:1px solid #1E293B;border-radius:4px;padding:4px 6px;font-size:11px;color:#94A3B8}.cw-siem .kp b{display:block;color:#fff;font-size:16px;margin:0}
.cw-vf{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;border:3px solid rgba(255,255,255,.25);font:700 11px var(--mono);color:#fff;text-align:center}
.cw-vf span{font-size:26px}
.cw-siren.on .f{animation:cw-sir .7s infinite}
@keyframes cw-sir{50%{background:#F87171;box-shadow:0 0 34px #EF4444}}
.cw-ph3{height:100%;display:grid;place-items:center;text-align:center;font:700 10px/1.35 var(--mono);color:#94A3B8}
.cw-door{position:absolute;left:-42px;top:-94px;width:84px;height:188px;border:7px solid #475569;background:#020617;transform-style:preserve-3d}
.cw-door .leaf{position:absolute;inset:0;background:linear-gradient(#8B5E3C,#5B3720);transform-origin:left center;transition:transform 1.2s;display:grid;place-items:center;font-size:26px}
.cw-door.open .leaf{transform:rotateY(-80deg)}
.cw-rd{position:absolute;inset:6px 4px;border-radius:3px;background:#EF4444;box-shadow:0 0 10px #EF4444}
.cw-rd.ok{background:#22C55E;box-shadow:0 0 12px #22C55E}
.cw-okglow .f{animation:cw-okg 1.6s}
.cw-noglow .f{animation:cw-nog 1.6s}
@keyframes cw-okg{0%,60%{box-shadow:0 0 34px #22C55E,inset 0 0 0 3px #22C55E}}
@keyframes cw-nog{0%,60%{box-shadow:0 0 34px #EF4444,inset 0 0 0 3px #EF4444}}
.cw-pil span{writing-mode:vertical-rl;transform:rotate(180deg);font:800 15px var(--mono);letter-spacing:.12em}
.cw-siembox{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:700 12px var(--mono);color:#7DD3FC}
.cw-siembox b{font-size:18px;color:#fff}
.cw-pil{height:100%;display:grid;place-items:center;color:#0B1220;background:#475569;transition:background .4s,box-shadow .4s}
/* ===== Week 11-12 labs: app windows under the 3D stage ===== */
.cw-app{margin-top:10px;border:1px solid #CBD5E1;border-radius:10px;overflow:hidden;background:#fff}
.cw-app .tb{display:flex;align-items:center;gap:6px;padding:6px 12px;background:#E2E8F0;font:600 13.5px 'Lexend',sans-serif;color:#334155}
.cw-app .tb i{width:10px;height:10px;border-radius:50%;background:#EF4444}.cw-app .tb i+i{background:#F59E0B}.cw-app .tb i+i+i{background:#22C55E}
.cw-app .tb span{margin-left:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cw-app .ab{padding:10px 12px;font-size:14.5px}
.cw-app.dark{background:#0B1120;border-color:#1E293B;color:#E2E8F0}
.cw-app.dark .tb{background:#111827;color:#94A3B8}
.cw-hint{font-size:13px;color:var(--muted)}
.cw-mail{display:grid;grid-template-columns:230px minmax(0,1fr);gap:10px;min-height:150px}
.cw-mail .mi{border:1px solid var(--line);border-radius:8px;padding:6px 9px;margin-bottom:6px;cursor:pointer;font-size:13px}
.cw-mail .mi:hover{background:var(--soft)}
.cw-mail .mi.new{border-left:4px solid var(--blue);background:var(--blue-l)}
.cw-mail .mi.on{outline:2px solid var(--blue)}
.cw-mail .mi b{display:block;font-size:13.5px}.cw-mail .mi span{display:block}.cw-mail .mi small{color:var(--muted)}
.cw-mail .mv{border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-size:14.5px}
.cw-mail .mh b{display:block;font-size:15.5px}.cw-mail .mh small{color:var(--muted)}
.cw-mail .mb p{margin:6px 0}
.cw-dq{display:flex;flex-direction:column;gap:9px}
.cw-dq .n{font:700 11.5px var(--mono);letter-spacing:.12em;color:#7DD3FC}
.cw-dq.fin{font-size:15px;color:#4ADE80;font-weight:700}
.cw-dq .opts{display:flex;flex-wrap:wrap;gap:8px}
.cw-dbtn{border:1px solid #334155;background:#1E293B;color:#F8FAFC;border-radius:8px;padding:8px 14px;font-weight:700;font-size:14px;cursor:pointer}
.cw-dbtn.g:hover{background:#14532D}.cw-dbtn.r:hover{background:#7F1D1D}.cw-dbtn.a:hover{background:#78350F}
.cw-dbtn.right{background:#15803D;border-color:#15803D}
.cw-dbtn.wrong{background:#7F1D1D;border-color:#B91C1C;opacity:.7}
.cw-reqc .who{font-size:16px;font-weight:700;margin-bottom:6px}
.cw-reqc .sig{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}
.cw-reqc .sig div{background:#111827;border:1px solid #1E293B;border-radius:7px;padding:6px 9px}
.cw-reqc small{display:block;font:700 10.5px var(--mono);letter-spacing:.1em;color:#94A3B8}
.cw-reqc b{font-size:14px}.cw-reqc b.g{color:#4ADE80}.cw-reqc b.a{color:#FBBF24}.cw-reqc b.r{color:#F87171}
.cw-app:not(.dark) .cw-reqc .sig div{background:var(--soft);border-color:var(--line)}
.cw-mac{display:flex;align-items:center;gap:12px}
.cw-mac>div:not(.ar){flex:1;background:#111827;border:1px solid #1E293B;border-radius:8px;padding:8px 10px}
.cw-mac small{display:block;font:700 10.5px var(--mono);letter-spacing:.1em;color:#94A3B8}
.cw-mac b{display:block;font-size:15.5px;margin:2px 0}
.cw-mac .ar{font-size:24px;color:#7DD3FC}
.lv{font-style:normal;font-size:12px;font-weight:700;border-radius:99px;padding:2px 8px;display:inline-block}
.lv.c{background:#1E3A8A;color:#BFDBFE}.lv.s{background:#9A3412;color:#FED7AA}.lv.t{background:#7F1D1D;color:#FECACA}
.cw-perm{display:flex;align-items:center;gap:6px;padding:7px 0;border-top:1px solid var(--line)}
.cw-perm:first-child{border-top:0}
.cw-perm span{flex:1;font-weight:700}.cw-perm span small{display:block;font-weight:400;color:var(--muted);font-size:12px}
.cw-perm button{border:1px solid #CBD5E1;background:#fff;border-radius:7px;padding:5px 11px;font-size:13px;cursor:pointer}
.cw-perm button:hover{background:var(--blue-l)}
.cw-perm button.on{background:var(--good);border-color:var(--good);color:#fff}
.cw-perm.off em{font-style:normal;color:var(--bad);font-weight:700;font-size:13px}
.cw-mx{width:100%;border-collapse:collapse;font-size:14px}
.cw-mx th,.cw-mx td{border:1px solid var(--line);padding:6px 8px;text-align:center}
.cw-mx th{background:var(--soft);font-size:12.5px}
.cw-mx td:first-child{text-align:left;font-weight:700}
.cw-ck{width:26px;height:26px;border:2px solid #94A3B8;border-radius:6px;background:#fff;cursor:pointer}
.cw-ck.on{background:var(--good);border-color:var(--good)}
.cw-ck.on::after{content:'✓';color:#fff;font-weight:800}
.cw-ck.fixed{opacity:.55;cursor:default}
.cw-mx.acc td{text-align:left}
.cw-mx.acc td small{display:block;font-weight:400;color:var(--muted);font-size:12.5px}
.cw-mx.acc tr.okr{background:var(--good-l)}
.cw-ob{border:1px solid #CBD5E1;background:#fff;border-radius:7px;padding:4px 9px;font-size:12.5px;margin:2px;cursor:pointer}
.cw-ob:hover{background:var(--blue-l)}.cw-ob.on{background:var(--good);color:#fff;border-color:var(--good)}
.cw-sel{border:1px solid #CBD5E1;border-radius:8px;padding:7px 9px;font:600 14px 'Lexend',sans-serif;background:#fff;color:var(--ink)}
.cw-note2{border:1px solid #BFDBFE;background:var(--blue-l);border-radius:8px;padding:8px 10px;font-size:14px}
.cw-note2.bad{border-color:#FECACA;background:var(--bad-l)}
.cw-app.dark .cw-note2.bad{color:var(--ink)}
.cw-abac{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px;align-items:end}
.cw-abac>b{grid-column:1/-1;font-size:14px;color:var(--blue)}
.cw-abac label,.cw-form2 label,.cw-five label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.cw-form2{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cw-five{display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) auto;gap:8px;align-items:end;margin-top:10px}
.cw-five label{color:#94A3B8}
.cw-log{width:100%;border-collapse:collapse;font:600 13px var(--mono)}
.cw-log th{text-align:left;color:#94A3B8;font-size:11.5px;padding:4px 6px;border-bottom:1px solid #1E293B}
.cw-log td{padding:5px 6px;border-bottom:1px solid #1E293B;cursor:pointer}
.cw-log tr[data-i]:hover td{background:#1E293B}
.cw-log tr.hit td{background:#7F1D1D;color:#FECACA}
.cw-log tr.miss td{opacity:.45}
.cw-src{border:1px solid #CBD5E1;background:#fff;border-radius:8px;padding:7px 12px;font-weight:700;font-size:13.5px;cursor:pointer}
.cw-src.on{background:#0369A1;border-color:#0369A1;color:#fff}
.cw-ev small{display:block;font:700 11px var(--mono);color:#94A3B8;letter-spacing:.08em}
.cw-ev b{font-size:16px}
.cw-qr{width:84px;height:84px;display:grid;place-items:center;background:#fff;border:6px solid #0F172A;font:900 20px/1 var(--mono);color:#0F172A}
.cw-push{margin-top:8px;border:1px solid #CBD5E1;border-radius:14px;padding:10px 12px;background:#F8FAFC;max-width:420px;display:flex;flex-direction:column;gap:6px}
.cw-push b{font-size:15px}.cw-push small{color:var(--muted)}
.cw-push.big{margin:0 auto}
.cw-call{display:flex;gap:12px;align-items:center;font-size:15px}
.cw-call .ring{font-size:34px;animation:cw-shake .5s infinite}
`;

/* ------------------------------------------------------------------ helpers ------------------------------------------------------------------ */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const plain = s => String(s).replace(/\*\*/g, '');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function flash(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 600); }

function dragify(el, { targets, onDrop }) {
  el.addEventListener('pointerdown', e => {
    if (e.button > 0 || el.classList.contains('placed')) return;
    e.preventDefault();
    const r = el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top, sx = e.clientX, sy = e.clientY;
    let g = null, over = null;
    const move = ev => {
      if (!g) { if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        g = el.cloneNode(true); g.classList.add('cw-ghost'); g.classList.remove('sel'); g.style.width = r.width + 'px'; g.style.margin = '0';
        (el.closest('.cw-root') || document.body).appendChild(g); el.classList.add('cw-lifting'); }
      g.style.left = (ev.clientX - ox) + 'px'; g.style.top = (ev.clientY - oy) + 'px';
      const t = document.elementFromPoint(ev.clientX, ev.clientY), hit = t && t.closest(targets);
      if (hit !== over) { if (over) over.classList.remove('over'); over = hit; if (over) over.classList.add('over'); }
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      if (!g) { el.dispatchEvent(new CustomEvent('cw-tap')); return; }        // a click, not a drag
      g.remove(); el.classList.remove('cw-lifting');
      if (over) { over.classList.remove('over'); onDrop(over); }
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  });
}

/* Sorter: drag an item onto a box (or tap the item, then tap the box). */
function sorter(host, { items, bins, cols, caseStyle, onRight, onWrong, onAll }) {
  host.innerHTML = `<div class="cw-pool"></div><div class="cw-bins" style="grid-template-columns:repeat(${cols || bins.length},minmax(0,1fr))">${bins.map(b =>
    `<div class="cw-bin" data-bin="${b.id}"><div class="h"><span>${b.icon || ''}</span><div><b>${esc(b.label)}</b>${b.sub ? `<small>${esc(b.sub)}</small>` : ''}</div><em>0</em></div><div class="in"></div></div>`).join('')}</div>`;
  const pool = $('.cw-pool', host); let sel = null, left = items.length;
  const drop = (it, el, binEl) => {
    if (binEl.dataset.bin === it.bin) {
      el.classList.remove('sel'); el.classList.add('placed'); $('.in', binEl).appendChild(el); sel = null;
      const em = $('em', binEl); em.textContent = $$('.cw-item', binEl).length;
      left--; onRight(it, binEl); if (!left) onAll();
    } else { flash(el, 'cw-shake'); onWrong(it, bins.find(b => b.id === binEl.dataset.bin)); }
  };
  shuffle(items).forEach(it => {
    const el = document.createElement('div'); el.className = 'cw-item' + (caseStyle ? ' case' : ''); el.innerHTML = md(it.label);
    pool.appendChild(el);
    dragify(el, { targets: '.cw-bin', onDrop: b => drop(it, el, b) });
    el.addEventListener('cw-tap', () => { if (el.classList.contains('placed')) return; $$('.cw-item.sel', host).forEach(x => x.classList.remove('sel')); sel = { it, el }; el.classList.add('sel'); });
  });
  $$('.cw-bin', host).forEach(b => b.addEventListener('click', () => { if (sel) drop(sel.it, sel.el, b); }));
  return { left: () => left };
}

/* ------------------------------------------------------------------ GUIDE TEXT (word for word from the weekly guide) ------------------------------------------------------------------ */
const GUIDES = {};
GUIDES.idTheft = {
  code: '1.3.1', title: 'IDENTITY THEFT', chapter: 'Chapter 3: Cybersecurity Controls',
  sections: [
    { id: 'def', tab: 'Definition', title: 'Identity Theft', text: [
      "**Identity Theft** happens when a criminal steals someone's personal details and uses them to act as that person. The stolen data is known as **Personally Identifiable Information (PII)**, and it covers names, dates of birth, ID numbers, phone numbers, and home addresses. Attackers are also after **Login Credentials** such as usernames, passwords, and one-time codes. With this information, a criminal can open bank accounts, apply for loans, shop online, or take over **Social Media** profiles. Most victims only find out when they spot strange **Transactions** or receive bills for things they never bought. Since so much of daily life now happens online, identity theft has become one of the fastest-growing forms of **Cybercrime**." ] },
    { id: 'ex', tab: 'Example', title: 'Example', text: [
      "A student gets a text message that looks like it came from the school's **Learning Portal**. It warns that the account will be closed today unless the student verifies the password through a link. The student types the username, password, and **Date of Birth** into the fake page. Within an hour, the attacker logs in to the real portal, changes the recovery email, and asks classmates for gift cards. None of this would have happened if the student had checked the sender and had enabled **Multi-Factor Authentication**." ] },
    { id: 'how', tab: 'How it happens', title: 'How Identity Theft Happens', text: [
      "Criminals rarely depend on one trick, so they mix **Technical Attacks** with human manipulation. They usually choose the **Attack Method** that gives them the most data for the least effort.",
      "Phishing and Social Engineering: Attackers send fake emails, texts, or **Phone Calls** that pretend to come from banks, schools, or delivery companies. The aim is to create a sense of **Urgency** so the victim hands over passwords or codes without thinking.",
      "Data Breaches: When a company's **Database** is hacked, millions of customer records can leak at the same time. These records are often sold on the **Dark Web**, where other criminals buy them to commit fraud." ] },
    { id: 'how2', tab: 'How it happens (2)', title: 'How Identity Theft Happens (continued)', text: [
      "Malware and Spyware: Keyloggers and spyware quietly record everything a user types, including passwords and card numbers. The captured data is then sent to the attacker's **Command and Control (C2)** server without the victim noticing.",
      "Physical Theft and Dumpster Diving: Not every attack is digital, because thieves still steal **Wallets**, phones, and letters. Some even search rubbish bins for bank statements and receipts, a trick known as **Dumpster Diving**." ] },
    { id: 'prev', tab: 'Preventing', title: 'Preventing Identity Theft', text: [
      "Good protection starts with strong **Password Hygiene**, which means a long and unique password for every account. A **Password Manager** makes this easy by creating and storing complex passwords safely. Users should also switch on **Multi-Factor Authentication (MFA)** so that a stolen password alone is not enough to log in." ] },
    { id: 'prev2', tab: 'Preventing (2)', title: 'Preventing Identity Theft (continued)', text: [
      "Share as little **Personal Data** as possible on social media and public websites. Before typing sensitive details, check that the site uses **HTTPS** and that the web address is spelled correctly. It is also wise to review bank statements often and turn on **Account Alerts** for new logins or payments. Paper documents that show personal details should be **Shredded** instead of thrown away." ] },
    { id: 'imp', tab: 'Importance', title: 'Importance of Identity Protection', text: [
      "A stolen identity can lead to **Financial Loss**, a damaged credit record, and months of stress for the victim. For organizations, one breach of customer data can bring heavy **Fines**, lawsuits, and a loss of public trust. Laws such as the **Saudi Personal Data Protection Law (PDPL)** and the **European GDPR** require organizations to keep personal data safe. When users and organizations work together, **Identity Protection** becomes stronger and attacks become much harder to carry out." ] }
  ]
};

/* ------------------------------------------------------------------ ACTIVITIES ------------------------------------------------------------------ */
const PARTS = {};

/* PART 1 — Spot the attack */
PARTS.spotAttack = {
  title: 'Spot the Attack', guide: 'idTheft', q: 'How does identity theft happen?',
  steps: [
    { t: 'Find the 4 red flags in the text message', sec: 'ex' },
    { t: 'Report the message instead of opening the link', sec: 'how' },
    { t: 'Sort the data: PII or Login Credentials', sec: 'def' },
    { t: 'Match each case to how identity theft happens', sec: 'how' }
  ],
  mount(body, api) {
    const FLAGS = [
      { id: 'from', icon: '📵', name: 'Unknown sender', why: "The school's Learning Portal does not text from a private mobile number. Always check the sender." },
      { id: 'urg', icon: '⏰', name: 'Urgency', why: 'Phishing creates a sense of Urgency so the victim acts without thinking.' },
      { id: 'ask', icon: '🔑', name: 'Asks for login details', why: 'A real portal never asks you to send your password or Date of Birth.' },
      { id: 'link', icon: '🔗', name: 'Fake link', why: '"schoo1" uses the number 1, and the address is not HTTPS. It leads to a fake page.' }
    ];
    const found = new Set(); let stage = 0, cur = null;
    const show = () => {
      const k = [0, 1, 2, 3].find(i => !api.isDone(i));
      if (k === undefined) { body.innerHTML = `<div class="cw-card cw-done"><div class="big">🕵️</div><h3>Part 1 complete</h3><p>You spotted a phishing attack, named the data attackers want, and matched four ways identity theft happens. Click <b>Next part →</b> on the left page.</p></div>`; api.refresh(); return; }
      const want = k <= 1 ? 'sms' : k === 2 ? 'data' : 'cases';
      if (want !== cur) { cur = want; ({ sms: drawSms, data: drawData, cases: drawCases })[want](); }
      api.refresh();
    };
    function drawSms() {
      body.innerHTML = `<div class="cw-card"><h3>📱 Phishing text message</h3><p class="sub">This is the message from the guide's Example. Click every part that looks suspicious.</p>
        <div class="cw-p1"><div class="cw-phone"><div class="bar"><span>09:41</span><span>4G ▮▮▮</span></div>
          <div class="who"><span class="cw-flagwho" data-f="from"><b>+966 55 012 7781</b>Not in your contacts</span></div>
          <div class="msgs"><div class="cw-sms">
            <span class="cw-tk" data-f="">SCHOOL LEARNING PORTAL:</span> <span class="cw-tk" data-f="">Dear student,</span>
            <span class="cw-tk" data-f="urg">your account will be CLOSED TODAY</span>
            <span class="cw-tk" data-f="">because of a system update.</span>
            <span class="cw-tk" data-f="ask">Verify your password and Date of Birth now:</span>
            <span class="cw-tk cw-mono" data-f="link">http://schoo1-portal.verify-login.co</span>
            <span class="cw-tk" data-f="">Thank you, IT Team</span></div></div>
          <div class="cw-pact"><button type="button" class="open" disabled>Open link</button><button type="button" class="rep" disabled>🚩 Report &amp; delete</button></div></div>
        <div><div class="cw-flags">${FLAGS.map(f => `<div class="cw-fl" data-f="${f.id}"><i>?</i><div><b>Red flag ${FLAGS.indexOf(f) + 1}</b>Not found yet</div></div>`).join('')}</div>
          <div class="cw-msg"></div></div></div></div>`;
      const msg = $('.cw-msg', body);
      const mark = (f, el) => {
        const F = FLAGS.find(x => x.id === f), box = $(`.cw-fl[data-f="${f}"]`, body);
        el.classList.add('flag'); box.classList.add('got'); box.innerHTML = `<i>${F.icon}</i><div><b>${esc(F.name)}</b>${esc(F.why)}</div>`;
        msg.className = 'cw-msg good'; msg.textContent = `Red flags found: ${found.size} of 4`;
        return F;
      };
      const hit = el => {
        const f = el.dataset.f;
        if (api.isDone(0)) return;
        if (!f) { el.classList.add('no'); api.mistake('That part looks normal. Look for something <b>urgent</b>, a <b>strange sender</b>, a request for <b>login details</b>, or a <b>link</b>.'); return; }
        if (found.has(f)) return;
        found.add(f); const F = mark(f, el);
        api.award(5); api.result('good', `🚩 <b>${esc(F.name)}</b> — ${esc(F.why)}`);
        if (found.size === 4) { api.done(0); $$('.cw-pact button', body).forEach(b => b.disabled = false); }
        api.refresh();
      };
      $$('.cw-tk,.cw-flagwho', body).forEach(el => el.addEventListener('click', () => hit(el)));
      (api.isDone(0) ? FLAGS.map(x => x.id) : [...found]).forEach(f => { found.add(f); mark(f, $(`[data-f="${f}"]`, body)); });
      if (api.isDone(0)) $$('.cw-pact button', body).forEach(b => b.disabled = false);
      $('.cw-pact .open', body).addEventListener('click', () => api.mistake('Opening the link takes you to a <b>fake page</b>. In the Example, the attacker took over the real portal within an hour.'));
      $('.cw-pact .rep', body).addEventListener('click', () => {
        if (api.isDone(1)) return;
        $('.cw-sms', body).classList.add('gone'); api.award(10); api.done(1);
        api.result('good', '✅ Message <b>reported and deleted</b>. You checked the sender instead of typing your details into a fake page.');
        setTimeout(show, 1200);
      });
    }
    function drawData() {
      body.innerHTML = `<div class="cw-card"><h3>🗂️ What do attackers steal?</h3><p class="sub">Drag each piece of data into the right box — or tap it, then tap the box. Use the guide's <b>Definition</b>.</p><div class="srt"></div></div>`;
      sorter($('.srt', body), {
        cols: 2,
        bins: [{ id: 'pii', icon: '🪪', label: 'Personally Identifiable Information (PII)', sub: 'Who you are' }, { id: 'cred', icon: '🔐', label: 'Login Credentials', sub: 'How you log in' }],
        items: [['Name', 'pii'], ['Date of birth', 'pii'], ['ID number', 'pii'], ['Phone number', 'pii'], ['Home address', 'pii'], ['Username', 'cred'], ['Password', 'cred'], ['One-time code', 'cred']].map(([label, bin]) => ({ label, bin })),
        onRight: it => { api.award(2); api.result('good', `<b>${esc(it.label)}</b> → ${it.bin === 'pii' ? 'PII: it identifies who you are.' : 'Login Credentials: it is used to log in.'}`); },
        onWrong: (it, b) => api.mistake(`<b>${esc(it.label)}</b> is not ${esc(b.label)}. Check the Definition: PII covers names, dates of birth, ID numbers, phone numbers and home addresses.`),
        onAll: () => { api.award(10); api.done(2); api.result('good', '✅ All 8 sorted. Attackers want both your <b>PII</b> and your <b>Login Credentials</b>.'); setTimeout(show, 1100); }
      });
    }
    function drawCases() {
      body.innerHTML = `<div class="cw-card"><h3>🔎 How did it happen?</h3><p class="sub">Each case shows one attack method from <b>How Identity Theft Happens</b>. Drag each case to its method.</p><div class="srt"></div></div>`;
      sorter($('.srt', body), {
        cols: 2, caseStyle: true,
        bins: [{ id: 'ph', icon: '🎣', label: 'Phishing and Social Engineering' }, { id: 'db', icon: '🗄️', label: 'Data Breaches' }, { id: 'mw', icon: '🐛', label: 'Malware and Spyware' }, { id: 'pt', icon: '🗑️', label: 'Physical Theft and Dumpster Diving' }],
        items: [
          { bin: 'ph', label: 'A caller pretends to be from the bank and says the account is blocked. He needs the one-time code **right now**.' },
          { bin: 'db', label: "A shop's **database** is hacked. Millions of customer records are sold on the **Dark Web**." },
          { bin: 'mw', label: 'A free game installs a **keylogger** that records every password and sends it to a **C2 server**.' },
          { bin: 'pt', label: 'A thief searches a **rubbish bin** and finds old bank statements and receipts.' }
        ],
        onRight: it => { api.award(4); api.result('good', `Correct — “${esc(plain(it.label).slice(0, 48))}…” is <b>${{ ph: 'Phishing and Social Engineering', db: 'a Data Breach', mw: 'Malware and Spyware', pt: 'Physical Theft and Dumpster Diving' }[it.bin]}</b>.`); },
        onWrong: (it, b) => api.mistake(`Not <b>${esc(b.label)}</b>. Read the four methods in <b>How it happens</b> again and look for the key word in the case.`),
        onAll: () => { api.award(10); api.done(3); api.result('good', '✅ All four cases matched. Criminals mix <b>Technical Attacks</b> with human manipulation.'); setTimeout(show, 1100); }
      });
    }
    show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read the <b>Example</b> in the guide below.<br>Then click the <b>4 red flags</b> in the text message on the right page: the <b>sender</b>, the <b>urgent warning</b>, what it <b>asks for</b>, and the <b>link</b>. Found: <b>${found.size} of 4</b>.`;
        if (k === 1) return `All 4 red flags found.<br>On the phone, click <kbd>🚩 Report &amp; delete</kbd>. Do <b>not</b> click <kbd>Open link</kbd>.`;
        if (k === 2) return `📖 Read the <b>Definition</b>.<br>Drag each data card into <b>PII</b> or <b>Login Credentials</b> — or tap a card, then tap the box.`;
        return `📖 Read <b>How it happens</b> and <b>How it happens (2)</b> — four attack methods.<br>Drag each case card to the method it shows. Look for key words like <b>database</b>, <b>keylogger</b>, <b>rubbish bin</b> or <b>right now</b>.`;
      },
      cleanup() {}
    };
  }
};

/* ------------------------------------------------------------------ 3D STAGE HELPERS (pure CSS 3D) ------------------------------------------------------------------
   World units are px. x = right, y = down (the floor is y = 0, so heights are negative), z = toward the viewer.
   cube(w,h,d,colour,{fr,fc,tc,cls})  a box; fr = HTML on its front face
   plane(w,h,html,style)             a flat sheet lying on a surface (paper, phone, keyboard)
   obj(x,y,z,inner,{id,cls})         places anything at a point; id makes it clickable (data-obj)
   scene(objects,{h,s,rx,ry,wy,tag}) the stage: zoom s, camera tilt rx / turn ry, world height wy %                                             */
const cube = (w, h, d, c, o = {}) => `<div class="cw-cube ${o.cls || ''}" style="--w:${w}px;--h:${h}px;--d:${d}px;--c:${c};${o.fc ? `--fc:${o.fc};` : ''}${o.tc ? `--tc:${o.tc};` : ''}"><div class="f bk"></div><div class="f lf"></div><div class="f rt"></div><div class="f bt"></div><div class="f tp"></div><div class="f fr">${o.fr || ''}</div></div>`;
const plane = (w, h, html, style = '') => `<div class="cw-pl" style="--w:${w}px;--h:${h}px;${style}">${html || ''}</div>`;
const obj = (x, y, z, inner, o = {}) => `<div class="cw-o ${o.id ? 'cw-hot ' : ''}${o.cls || ''}"${o.id ? ` data-obj="${o.id}"` : ''}${o.domId ? ` id="${o.domId}"` : ''} style="transform:translate3d(${x}px,${y}px,${z}px)${o.ry ? ` rotateY(${o.ry}deg)` : ''}">${inner}</div>`;
const board = (txt, cls = '', y = 0) => `<div class="cw-bb ${cls}" style="top:${y}px">${txt}</div>`;
const scene = (objs, o = {}) => `<div class="cw-3d" data-s="${o.s || 1}" style="--sh:${o.h || 320}px;--s:${o.s || 1};--rx:${o.rx || -18}deg;--ry:${o.ry || -16}deg;--wy:${o.wy || 70}%">${o.tag ? `<div class="tag3d">${o.tag}</div>` : ''}<div class="cw-world"><div class="cw-floor"></div>${objs}</div></div>`;
function desk(x, z, w, d, top, colour, skipLeftLegs) {
  const legH = -top - 16, ly = top + 16 + legH / 2;
  let s = obj(x, top + 8, z, cube(w, 16, d, colour || '#8B5E3C', { tc: '#A47148' }));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { if (skipLeftLegs && a < 0) return; s += obj(x + a * (w / 2 - 12), ly, z + b * (d / 2 - 12), cube(14, legH, 14, '#3F2A1E')); });
  return s;
}

/* PART 2 — Incident response: cyber commands in a terminal, 3D laptop -> C2 server */
PARTS.incident = {
  title: 'Incident Response Terminal', guide: 'idTheft', q: 'How do malware and data breaches steal an identity?',
  steps: [
    { t: 'Scan the laptop for malware', sec: 'how2' },
    { t: 'Find the connection to the C2 server', sec: 'how2' },
    { t: 'Stop the keylogger process', sec: 'how2' },
    { t: 'Block the C2 server in the firewall', sec: 'how2' },
    { t: 'Check if the email leaked in a data breach', sec: 'how' },
    { t: 'Replace the leaked password with a Password Manager', sec: 'prev' },
    { t: 'Switch on Multi-Factor Authentication (MFA)', sec: 'prev' }
  ],
  mount(body, api) {
    const IP = '185.220.101.7', PID = '4242', EMAIL = 'sara.k@myschool.edu.sa', WEB_IP = '142.250.74.14', WEB_PID = '1180';
    const kb = 'repeating-linear-gradient(90deg,#1F2937 0 13px,#475569 13px 15px),#334155';
    const objs =
      desk(-150, 0, 430, 230, -110) +
      obj(-320, -119, -55, cube(72, 18, 46, '#334155', { fr: '<div style="padding:4px 6px;line-height:9px"><span class="cw-led"></span><span class="cw-led"></span><span class="cw-led a"></span></div>' })) +
      obj(-320, -160, -55, board('ROUTER')) +
      obj(-150, -111, 25, plane(214, 128, '', `background:${kb};border-radius:7px;box-shadow:inset 0 0 0 3px #64748B`)) +
      obj(-150, -186, -42, `<div class="cw-scr" id="cw-lscr" style="width:240px;height:152px;left:-120px;top:-76px;transform:rotateX(8deg)"></div>`) +
      obj(-150, -280, -42, board("SARA'S LAPTOP · 10.0.0.23")) +
      obj(10, -111, 40, plane(54, 92, '<div id="cw-mfaph" style="height:100%;display:grid;place-items:center;text-align:center;font:700 11px/1.3 var(--mono);color:#94A3B8">📱<br>MFA<br>OFF</div>', 'background:#0F172A;border:3px solid #111827;border-radius:9px')) +
      obj(300, -120, -70, cube(112, 240, 92, '#111827', { fr: `<div style="padding:8px 7px;font:700 8px var(--mono);color:#FCA5A5">${Array.from({ length: 9 }, () => '<div style="display:flex;justify-content:space-between;align-items:center;height:20px;margin-bottom:4px;border:1px solid #374151;border-radius:3px;padding:0 5px;background:#1F2937"><span>▮▮▮▮</span><span><span class="cw-led r"></span><span class="cw-led r"></span></span></div>').join('')}</div>` })) +
      obj(260, -270, -70, board('C2 SERVER · 185.220.101.7', 'red')) +
      obj(80, -192, -55, '<div class="cw-beam" id="cw-beam" style="width:330px;left:-165px"><i></i><i></i><i></i></div>') +
      obj(100, -100, -55, cube(14, 200, 200, 'rgba(234,88,12,.25)') + board('FIREWALL RULE', 'grn', -120), { cls: 'cw-fw', domId: 'cw-fw' }) +
      obj(195, -32, 95, cube(84, 64, 64, '#7F1D1D', { fr: '<div style="padding:6px 4px;font:700 12px/1.25 var(--mono);color:#FECACA;text-align:center">SHOPMART<br>DATABASE<br>3.2M</div>' }) + board('LEAKED → DARK WEB', 'red', -62), { cls: 'cw-db', domId: 'cw-db' });
    body.innerHTML = `<div class="cw-card" style="padding:10px 12px"><h3>💻 Incident response — Sara's laptop</h3>
        <p class="sub">Sara's portal account was taken over. Use the security terminal to find the attack, stop it and protect her identity.</p>
        ${scene(objs, { h: 275, s: .66, rx: -16, ry: -12, wy: 90, tag: 'LIVE NETWORK VIEW' })}
        <div class="cw-term"><div class="tb"><i></i><i></i><i></i><span>sara@laptop: ~ — Security Terminal · user ${EMAIL}</span></div>
          <div class="out"></div>
          <div class="in"><b>sara@laptop:~$</b><input id="cw-cmd" autocomplete="off" spellcheck="false" placeholder="type a command, then press Enter"></div></div>
        <div class="cw-cmds"><span style="font-size:13.5px;color:var(--muted)">Click to type:</span>${['help', 'scan', 'netstat', 'ps', 'mfa on', 'clear'].map(c => `<kbd data-c="${c}">${c}</kbd>`).join('')}</div></div>`;
    const out = $('.out', body), inp = $('#cw-cmd', body), scr = $('#cw-lscr', body), beam = $('#cw-beam', body), lines = [], hist = [];
    let hi = 0, busy = false;
    const paint = () => {
      out.innerHTML = lines.slice(-40).map(l => `<div class="${l[1]}">${esc(l[0])}</div>`).join('');
      scr.innerHTML = lines.slice(-9).map(l => `<span class="${l[1] === 'bad' || l[1] === 'warn' ? 'w' : ''}">${esc(l[0].slice(0, 36))}</span>`).join('\n');
    };
    const print = (t, c = '') => { String(t).split('\n').forEach(x => lines.push([x, c])); paint(); };
    const later = (ms, fn) => new Promise(r => setTimeout(() => { if (body.isConnected) fn(); r(); }, ms));
    const state = () => {
      beam.classList.toggle('on', api.isDone(1)); beam.classList.toggle('dim', api.isDone(2) || api.isDone(3));
      $('#cw-fw', body).classList.toggle('on', api.isDone(3)); $('#cw-db', body).classList.toggle('on', api.isDone(4));
      if (api.isDone(6)) { const ph = $('#cw-mfaph', body); ph.style.color = '#4ADE80'; ph.innerHTML = '📱<br>MFA<br>ON ✓'; }
    };
    async function run(raw) {
      const cmd = raw.trim(); if (!cmd || busy) return;
      hist.push(cmd); hi = hist.length; print('sara@laptop:~$ ' + cmd, 'c');
      const [c0, ...args] = cmd.split(/\s+/), c = c0.toLowerCase(), a = args.join(' ').trim();
      if (c === 'help') { print('scan                  scan files for malware and spyware\nnetstat               list network connections\nps                    list running processes\nkill <PID>            stop a process\nblock <IP>            add a firewall rule for an address\nbreachcheck <email>   search known data breaches\npasswd                new password from the Password Manager\nmfa on                switch on Multi-Factor Authentication\nclear                 clear the screen', 'dim'); api.result('', '📋 <b>help</b> lists every command. Follow the INSTRUCTIONS for the next one.'); return; }
      if (c === 'clear') { lines.length = 0; paint(); return; }
      if (c === 'scan') {
        busy = true; print('Scanning 48,213 files …', 'dim');
        await later(700, () => print('⚠ THREAT FOUND: Spyware.Keylogger\n  file : C:\\Users\\Sara\\AppData\\keylog.exe\n  PID  : 4242   (records every key typed)\n  log  : portal.myschool.edu.sa  sara.k  P*******!', 'bad'));
        busy = false;
        if (!api.isDone(0)) { api.award(10); api.done(0); }
        api.result('good', '⚠ <b>Keylogger found</b> (PID 4242). Keyloggers and spyware quietly record everything a user types, including passwords.'); state(); return;
      }
      if (c === 'ps') { print('PID    NAME            CPU\n 880   antivirus.exe   1%\n1180   browser.exe     6%\n4242   keylog.exe      2%   ⚠ unknown publisher', ''); api.result('', '📋 <b>ps</b> lists running programs. <b>keylog.exe</b> is PID 4242.'); return; }
      if (c === 'netstat') {
        print('Proto  Local            Foreign              State        PID  Program\nTCP    10.0.0.23:51100  142.250.74.14:443    ESTABLISHED  1180 browser.exe', '');
        print('TCP    10.0.0.23:51022  185.220.101.7:443    ESTABLISHED  4242 keylog.exe   ⚠ sending data', 'bad');
        if (!api.isDone(1)) { api.award(10); api.done(1); }
        api.result('good', '📡 keylog.exe is sending data to <b>185.220.101.7</b> — the attacker\'s <b>Command and Control (C2)</b> server.'); state(); return;
      }
      if (c === 'kill') {
        if (!a) { print('usage: kill <PID>', 'warn'); return; }
        if (a === PID) { print('Process 4242 (keylog.exe) stopped. Keystrokes are no longer recorded.', 'ok'); if (!api.isDone(2)) { api.award(15); api.done(2); } api.result('good', '🛑 <b>Keylogger stopped.</b> The spyware can no longer record passwords.'); state(); return; }
        if (a === WEB_PID) { print('Process 1180 (browser.exe) is the web browser — not the threat.', 'warn'); api.mistake('PID 1180 is the <b>web browser</b>. The keylogger is the process called <b>keylog.exe</b>.'); return; }
        print(`kill: no process with PID ${a}`, 'warn'); api.result('', `No process <b>${esc(a)}</b>. Use <b>ps</b> or <b>netstat</b> to find the PID.`); return;
      }
      if (c === 'block') {
        if (!a) { print('usage: block <IP>', 'warn'); return; }
        if (a === IP) { print('Firewall rule added: DENY all traffic to 185.220.101.7', 'ok'); if (!api.isDone(3)) { api.award(15); api.done(3); } api.result('good', '🧱 <b>C2 server blocked.</b> Captured data can no longer reach the attacker.'); state(); return; }
        if (a === WEB_IP) { print('142.250.74.14 is a normal website used by the browser.', 'warn'); api.mistake('That address belongs to a normal website. Block the <b>C2 server</b> that keylog.exe talks to.'); return; }
        print(`block: no connection to ${a}`, 'warn'); api.result('', `No connection to <b>${esc(a)}</b>. Check <b>netstat</b>.`); return;
      }
      if (c === 'breachcheck') {
        if (!a) { print('usage: breachcheck <email>', 'warn'); return; }
        busy = true; print('Searching known data breaches …', 'dim');
        await later(700, () => {
          if (a.toLowerCase() === EMAIL) {
            print('FOUND in 1 breach: ShopMart customer database (2025)\n  3.2 million records leaked and sold on the Dark Web\n  exposed: email, password, phone number', 'bad');
            if (!api.isDone(4)) { api.award(15); api.done(4); }
            api.result('good', '🗄️ Sara\'s email was in the <b>ShopMart</b> breach. Leaked records are sold on the <b>Dark Web</b> to commit fraud.'); state();
          } else { print(`${a}: not found in known breaches`, 'ok'); api.result('', `<b>${esc(a)}</b> was not found. Check <b>Sara's</b> email: ${EMAIL}.`); }
        });
        busy = false; return;
      }
      if (c === 'passwd') {
        busy = true; print('Password Manager: creating a new password …', 'dim');
        await later(700, () => print('New password saved: 20 characters, unique for this account ✓\nOld leaked password removed.', 'ok'));
        busy = false;
        if (!api.isDone(5)) { api.award(15); api.done(5); }
        scr.style.color = '#4ADE80';
        api.result('good', '🔑 New password from the <b>Password Manager</b> — long, unique and stored safely.'); return;
      }
      if (c === 'mfa') {
        if (a.toLowerCase() !== 'on') { print('usage: mfa on', 'warn'); return; }
        busy = true; print('Sending a test code to Sara\'s phone …', 'dim');
        await later(700, () => print('Code 482 913 confirmed on the phone ✓\nMulti-Factor Authentication is ON: password + phone code at every login.', 'ok'));
        busy = false;
        if (!api.isDone(6)) { api.award(15); api.done(6); }
        api.result('good', '📱 <b>MFA is on.</b> Even if the password is stolen again, the attacker still needs Sara\'s phone.'); state(); return;
      }
      print(`${c0}: command not found. Type help.`, 'warn'); api.result('', `<b>${esc(c0)}</b> is not a command. Type <b>help</b> to see the list.`);
    }
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const v = inp.value; inp.value = ''; run(v).then(() => api.refresh()); }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; inp.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hi < hist.length) { hi++; inp.value = hist[hi] || ''; } e.preventDefault(); }
    });
    $$('.cw-cmds kbd', body).forEach(k => k.addEventListener('click', () => { inp.value = k.dataset.c + (k.dataset.c === 'kill' || k.dataset.c === 'block' ? ' ' : ''); inp.focus(); }));
    $('.cw-term', body).addEventListener('click', () => inp.focus());
    print('Security Terminal 2.4 — connected to Sara\'s laptop (10.0.0.23)', 'dim'); print('Type help to see the commands.', 'dim');
    state();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>Malware and Spyware</b> in <b>How it happens (2)</b>.<br>Click the black terminal, type <kbd>scan</kbd> and press <kbd>Enter</kbd>. The antivirus looks for hidden spyware.`;
        if (k === 1) return `The scan found a <b>keylogger</b>. The guide says captured data is sent to a <b>Command and Control (C2)</b> server.<br>Type <kbd>netstat</kbd> and press <kbd>Enter</kbd>. Look for the connection owned by <b>keylog.exe</b>.`;
        if (k === 2) return `The keylogger is process <b>PID 4242</b>.<br>Type <kbd>kill 4242</kbd> and press <kbd>Enter</kbd>. Do not stop PID 1180 — that is the web browser.`;
        if (k === 3) return `The stolen keystrokes were going to <b>185.220.101.7</b>.<br>Type <kbd>block 185.220.101.7</kbd> and press <kbd>Enter</kbd> to add a firewall rule.`;
        if (k === 4) return `📖 Read <b>Data Breaches</b> in <b>How it happens</b>.<br>Type <kbd>breachcheck ${EMAIL}</kbd> and press <kbd>Enter</kbd> to see if Sara's email leaked from a hacked database.`;
        if (k === 5) return `📖 Read <b>Password Hygiene</b> in <b>Preventing</b>.<br>The old password is on the Dark Web. Type <kbd>passwd</kbd> and press <kbd>Enter</kbd> so the <b>Password Manager</b> creates a new, long and unique password.`;
        return `📖 The guide's Example says none of this would have happened if Sara had enabled <b>Multi-Factor Authentication</b>.<br>Type <kbd>mfa on</kbd> and press <kbd>Enter</kbd>. Watch the phone on the desk.`;
      },
      cleanup() {}
    };
  }
};

/* PART 3 — Clean-desk patrol: click the risks in a 3D office (Physical Theft and Dumpster Diving) */
PARTS.cleanDesk = {
  title: 'Clean-Desk Patrol', guide: 'idTheft', q: 'How can thieves steal an identity without a computer?',
  steps: [
    { t: 'Rescue the bank statement from the rubbish bin', sec: 'how2' },
    { t: 'Protect the wallet left on the desk', sec: 'how2' },
    { t: 'Secure the unlocked phone', sec: 'how2' },
    { t: 'Remove the password on the sticky note', sec: 'prev' },
    { t: 'Remove personal data from the social media post', sec: 'prev2' }
  ],
  mount(body, api) {
    const RISK = {
      bin: { k: 0, name: 'Rubbish bin', q: 'A bank statement with your name and account number is lying on top of the rubbish bin.', o: [['Take it out and put it in the shredder', 1], ['Leave it — the bin is emptied tonight', 0]],
        ok: '✂️ Statement shredded. Thieves search rubbish bins for bank statements and receipts — <b>Dumpster Diving</b>.', bad: 'Thieves search rubbish bins for bank statements and receipts. This trick is called <b>Dumpster Diving</b>.' },
      wallet: { k: 1, name: 'Wallet', q: 'Your wallet with your ID card and bank card is on the desk while you go to class.', o: [['Leave it — the office door is usually closed', 0], ['Lock it in the desk drawer', 1]],
        ok: '🔒 Wallet locked in the drawer. The guide says thieves still steal <b>Wallets</b>, phones, and letters.', bad: 'Not every attack is digital — thieves still steal <b>Wallets</b>. Lock it away.' },
      phone: { k: 2, name: 'Phone', q: 'Your phone is unlocked and shows your email and your banking app.', o: [['Turn the screen brightness down', 0], ['Turn on the screen lock with a PIN', 1]],
        ok: '📱 Phone locked with a PIN. A stolen phone can no longer open your accounts.', bad: 'Dimming the screen does not protect anything. Thieves steal phones — lock it with a PIN.' },
      sticky: { k: 3, name: 'Sticky note', q: 'A sticky note on the monitor says: portal  sara.k  Pa55word!', o: [['Save it in a Password Manager, then destroy the note', 1], ['Move the note under the keyboard', 0]],
        ok: '🔑 Password moved into a <b>Password Manager</b>, which stores complex passwords safely. Note destroyed.', bad: 'Anyone can still find it there. A <b>Password Manager</b> stores passwords safely.' },
      social: { k: 4, name: 'Social media post', q: 'Your public post shows your full Date of Birth and your home address.', o: [['Add your phone number so friends can call', 0], ['Delete the post and keep personal data private', 1]],
        ok: '🙈 Post removed. Share as little <b>Personal Data</b> as possible on social media.', bad: 'That shares even more PII. Share as little <b>Personal Data</b> as possible on social media.' }
    };
    const T = -125;
    const objs =
      desk(40, 0, 560, 250, T, '#8B5E3C', true) +
      obj(-160, -54, 0, cube(150, 108, 226, '#7C4A2A', { fr: `<div style="height:100%;display:flex;flex-direction:column;gap:6px;padding:8px">${[0, 1, 2].map(i => `<div style="flex:1;border:1px solid #5B3720;border-radius:3px;display:grid;place-items:center;color:#FDE68A;font:700 10px var(--mono)">${i === 0 ? '<span id="cw-drawer">━━</span>' : '━━'}</div>`).join('')}</div>` })) +
      obj(60, -140, -80, cube(26, 30, 26, '#1F2937')) +
      obj(60, -220, -80, cube(220, 132, 12, '#0F172A', { fr: `<div class="cw-post" id="cw-post"><b>Sara K. · Public</b>🎂 Happy birthday!<br><span class="pd">Born 14 May 2009</span><br><span class="pd">24 Al Noor St, Riyadh</span><br>❤ 214 💬 38</div>` }), { id: 'social' }) +
      obj(-55, -268, -72, '<div class="cw-sticky hotf" style="left:-36px;top:-30px">portal<br>sara.k<br>Pa55word!</div>', { id: 'sticky' }) +
      obj(60, -126, 45, plane(190, 58, '', 'background:repeating-linear-gradient(90deg,#1F2937 0 15px,#475569 15px 17px),#334155;border-radius:5px')) +
      obj(-110, -131, 70, cube(66, 12, 46, '#3F2A1E', { tc: '#5B3A28' }), { id: 'wallet', domId: 'cw-wallet' }) +
      obj(230, -126, 45, plane(58, 100, '<div id="cw-phs" style="height:100%;display:grid;place-items:center;text-align:center;font:700 11px/1.3 var(--mono);color:#FCA5A5">🔓<br>OPEN<br>📧 🏦</div>', 'background:#0F172A;border:3px solid #111827;border-radius:9px'), { id: 'phone' }) +
      obj(-10, -126, 95, plane(92, 58, '<div style="padding:6px;font:700 10px/1.3 var(--mono);color:#334155">✉ SARA K.<br>24 AL NOOR ST</div>', 'background:#F8FAFC;border-radius:2px'), { id: 'letter' }) +
      obj(370, -48, 40, cube(84, 96, 84, '#334155', { tc: '#0B1220' }) + '<div id="cw-stmt" class="hotf" style="position:absolute;left:-40px;top:-96px;width:80px;height:58px;background:#F8FAFC;border-radius:2px;font:700 11px/1.25 var(--mono);color:#1E3A8A;padding:5px;transform:rotate(-8deg)">🏦 BANK<br>STATEMENT<br>••4471</div>', { id: 'bin' }) +
      obj(-350, -40, 60, cube(100, 80, 62, '#1E293B', { fr: '<div style="position:relative;height:100%;padding:8px;font:700 14px var(--mono);color:#94A3B8;text-align:center">SHREDDER<div class="cw-strips" id="cw-strips"></div></div>' }), { id: 'shredder' }) +
      obj(-160, -170, 0, board('LOCKED ✓', 'grn'), { domId: 'cw-lockbb', cls: 'cw-gone' });
    body.innerHTML = `<div class="cw-card" style="padding:10px 12px"><h3>🏢 Clean-desk patrol</h3>
        <p class="sub">You are leaving the office for lunch. Find the 5 risks that could let a thief steal your identity — no computer needed.</p>
        ${scene(objs, { h: 330, s: .72, rx: -24, ry: -10, wy: 80, tag: 'OFFICE · ROOM 214' })}
        <div class="cw-act"></div></div>`;
    const act = $('.cw-act', body);
    const fixed = id => {
      const el = $(`[data-obj="${id}"]`, body); el.classList.add('fixed'); el.classList.remove('sel', 'glow');
      if (id === 'bin') { $('#cw-stmt', body).classList.add('cw-gone'); $('#cw-strips', body).classList.add('on'); }
      if (id === 'wallet') { el.classList.add('cw-gone'); $('#cw-lockbb', body).classList.remove('cw-gone'); $('#cw-drawer', body).textContent = '🔒'; }
      if (id === 'phone') { const s = $('#cw-phs', body); s.style.color = '#4ADE80'; s.innerHTML = '🔒<br>LOCKED<br>PIN ••••'; }
      if (id === 'sticky') el.classList.add('cw-gone');
      if (id === 'social') $('#cw-post', body).classList.add('clean');
    };
    const count = () => Object.values(RISK).filter(r => api.isDone(r.k)).length;
    const idle = () => { act.innerHTML = `<h4>🔍 Office patrol — risks fixed: ${count()} of 5</h4><p>Click an object in the office that puts your identity at risk. Then choose the safe action here.</p>`; };
    const glow = () => { const k = [0, 1, 2, 3, 4].find(i => !api.isDone(i)); $$('.cw-hot', body).forEach(h => h.classList.toggle('glow', !!(k !== undefined && RISK[h.dataset.obj] && RISK[h.dataset.obj].k === k))); };
    const pick = id => {
      const R = RISK[id];
      $$('.cw-hot', body).forEach(h => h.classList.toggle('sel', h.dataset.obj === id));
      if (!R) { act.innerHTML = `<h4>✅ ${id === 'letter' ? 'Letter' : 'Shredder'}</h4><p>${id === 'letter' ? 'A letter on your own desk while you are here is fine — just do not throw it in the bin.' : 'The shredder is where papers with personal details belong.'} Keep looking for risks.</p>`; api.result('', 'That object is safe. Keep looking.'); return; }
      if (api.isDone(R.k)) return;
      act.innerHTML = `<h4>🔍 ${esc(R.name)}</h4><p>${esc(R.q)} What should you do?</p><div class="opts">${R.o.map((x, i) => `<button type="button" data-i="${i}">${esc(x[0])}</button>`).join('')}</div>`;
      api.result('', `🔍 <b>${esc(R.name)}</b> selected. Choose the safe action under the office.`);
      $$('.opts button', act).forEach(b => b.addEventListener('click', () => {
        if (R.o[+b.dataset.i][1]) { fixed(id); api.award(12); api.done(R.k); api.result('good', '✅ ' + R.ok); idle(); glow(); api.refresh(); }
        else { flash(b, 'cw-shake'); api.mistake(R.bad); }
      }));
    };
    $$('.cw-hot', body).forEach(h => h.addEventListener('click', e => { e.stopPropagation(); if (!h.classList.contains('fixed')) pick(h.dataset.obj); }));
    Object.keys(RISK).forEach(id => { if (api.isDone(RISK[id].k)) fixed(id); });
    idle(); glow();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>Physical Theft and Dumpster Diving</b> in <b>How it happens (2)</b>.<br>In the 3D office, click the <b>rubbish bin</b> on the right (it glows), then choose the safe action under the office.`;
        if (k === 1) return `📖 The guide says thieves still steal <b>Wallets</b>, phones, and letters.<br>Click the brown <b>wallet</b> on the desk, then choose the safe action.`;
        if (k === 2) return `📖 Thieves steal <b>phones</b> too.<br>Click the <b>phone</b> on the right of the desk (it says UNLOCKED), then choose the safe action.`;
        if (k === 3) return `📖 Read <b>Preventing</b> — a <b>Password Manager</b> stores passwords safely.<br>Click the yellow <b>sticky note</b> on the monitor, then choose the safe action.`;
        return `📖 Read <b>Preventing (2)</b> — share as little <b>Personal Data</b> as possible.<br>Click the <b>monitor</b> showing the public post, then choose the safe action.`;
      },
      cleanup() {}
    };
  }
};

/* PART 4 — Defend your identity */
PARTS.defendId = {
  title: 'Defend Your Identity', guide: 'idTheft', q: 'How can we prevent identity theft?',
  steps: [
    { t: 'Create a long and unique password', sec: 'prev' },
    { t: 'Switch on Multi-Factor Authentication (MFA)', sec: 'prev' },
    { t: 'Turn on Account Alerts', sec: 'prev2' },
    { t: 'Choose the safe website before typing details', sec: 'prev2' },
    { t: 'Shred or recycle the paper documents', sec: 'prev2' },
    { t: 'Explain why identity protection is important', sec: 'imp' }
  ],
  mount(body, api) {
    const OLD = ['Sara2008', 'Password123'];
    const RULES = [['len', 'At least 12 characters', p => p.length >= 12], ['up', 'An UPPERCASE letter', p => /[A-Z]/.test(p)], ['low', 'A lowercase letter', p => /[a-z]/.test(p)],
      ['num', 'A number', p => /\d/.test(p)], ['sym', 'A symbol (! @ # $ …)', p => /[^A-Za-z0-9]/.test(p)], ['uni', 'Not an old password', p => p && !OLD.some(o => p.toLowerCase().includes(o.toLowerCase()))]];
    let code = String(Math.floor(100000 + Math.random() * 900000)), cur = null, pwTyped = 0;
    const show = () => {
      const k = [0, 1, 2, 3, 4, 5].find(i => !api.isDone(i));
      if (k === undefined) { body.innerHTML = `<div class="cw-card cw-done"><div class="big">🛡️</div><h3>Identity protected</h3><p>Strong password, MFA, alerts, safe websites and shredded papers — you used every defence from the guide. Click <b>Finish lab ✓</b> on the left page.</p></div>`; api.refresh(); return; }
      const want = k <= 2 ? 'sec' : k === 3 ? 'url' : k === 4 ? 'shred' : 'quiz';
      if (want !== cur) { cur = want; ({ sec: drawSec, url: drawUrl, shred: drawShred, quiz: drawQuiz })[want](); }
      api.refresh();
    };
    function drawSec() {
      body.innerHTML = `<div class="cw-card"><h3>🔐 Learning Portal — Security Centre</h3><p class="sub">Your account was attacked. Lock it down using <b>Preventing Identity Theft</b>.</p>
        <div class="cw-sec">
          <div class="cw-set" data-s="pw"><h4>🔑 New password <em></em></h4>
            <p class="cw-old">Old passwords used on other accounts: ${OLD.map(o => `<kbd>${o}</kbd>`).join(' ')}</p>
            <input class="cw-field" id="cw-pw" type="text" autocomplete="off" spellcheck="false" placeholder="Type a new password">
            <div class="cw-meter"><i></i></div>
            <ul class="cw-rules">${RULES.map(r => `<li data-r="${r[0]}">${r[1]}</li>`).join('')}</ul>
            <button type="button" class="cw-btn" id="cw-pwsave">Save password</button></div>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="cw-set" data-s="mfa"><h4>📲 Multi-Factor Authentication <em></em></h4>
              <div class="cw-tg"><span>Ask for a code from my phone<small>Something you have + something you know</small></span><button type="button" class="cw-sw" id="cw-mfa" aria-label="MFA"></button></div>
              <div class="cw-otp"><div class="cw-mini"><small>Authenticator</small><b>${code.slice(0, 3)} ${code.slice(3)}</b></div><div class="cw-otpin"><input class="cw-field" id="cw-code" inputmode="numeric" maxlength="7" placeholder="000000" autocomplete="off"><button type="button" class="cw-btn" id="cw-verify">Verify</button></div></div></div>
            <div class="cw-set" data-s="alr"><h4>🔔 Account Alerts <em></em></h4>
              <div class="cw-tg"><span>New login alerts<small>Email me when someone logs in</small></span><button type="button" class="cw-sw" data-a="login" aria-label="Login alerts"></button></div>
              <div class="cw-tg"><span>Payment alerts<small>Text me for every payment</small></span><button type="button" class="cw-sw" data-a="pay" aria-label="Payment alerts"></button></div></div>
          </div></div></div>`;
      const pw = $('#cw-pw', body), meter = $('.cw-meter i', body);
      const mark = (s, txt) => { const b = $(`.cw-set[data-s="${s}"]`, body); b.classList.add('done'); $('em', b).textContent = txt; };
      const check = () => { const p = pw.value; let n = 0;
        RULES.forEach(r => { const ok = r[2](p); if (ok) n++; $(`li[data-r="${r[0]}"]`, body).classList.toggle('ok', ok); });
        meter.style.width = (n / RULES.length * 100) + '%'; meter.style.background = n < 3 ? '#DC2626' : n < 6 ? '#F59E0B' : '#15803D'; return n === RULES.length; };
      pw.addEventListener('input', () => { check(); if (++pwTyped === 1) api.refresh(); });
      $('#cw-pwsave', body).addEventListener('click', () => {
        if (api.isDone(0)) return;
        if (!check()) { const miss = RULES.filter(r => !r[2](pw.value)).map(r => r[1]); api.mistake('Password not saved. Still missing: <b>' + miss.join(', ') + '</b>.'); flash(pw, 'cw-shake'); return; }
        pw.disabled = true; mark('pw', '✓ SAVED'); api.award(15); api.done(0);
        api.result('good', `✅ Strong password saved (${pw.value.length} characters). <b>Password Hygiene</b>: a long and unique password for every account.`); show();
      });
      const mfa = $('#cw-mfa', body), otp = $('.cw-otp', body), cin = $('#cw-code', body);
      mfa.addEventListener('click', () => { if (api.isDone(1)) return; mfa.classList.toggle('on'); otp.classList.toggle('show', mfa.classList.contains('on'));
        if (mfa.classList.contains('on')) { api.result('', '📲 A code was sent to the <b>Authenticator</b> app on your phone. Type it to finish turning on MFA.'); cin.focus(); } api.refresh(); });
      const verify = () => {
        if (api.isDone(1)) return;
        if (cin.value.replace(/\D/g, '') !== code) { api.mistake('That code does not match the code on the phone. Type the 6 digits shown in the Authenticator.'); flash(cin, 'cw-shake'); return; }
        otp.classList.remove('show'); mfa.disabled = true; mark('mfa', '✓ ON'); api.award(15); api.done(1);
        api.result('good', '✅ <b>MFA is on.</b> A stolen password alone is no longer enough to log in.'); show();
      };
      $('#cw-verify', body).addEventListener('click', verify); cin.addEventListener('keydown', e => { if (e.key === 'Enter') verify(); });
      $$('[data-a]', body).forEach(b => b.addEventListener('click', () => {
        if (api.isDone(2)) return; b.classList.toggle('on');
        const on = $$('[data-a].on', body).length;
        if (on === 2) { $$('[data-a]', body).forEach(x => x.disabled = true); mark('alr', '✓ ON'); api.award(10); api.done(2); api.result('good', '✅ <b>Account Alerts</b> are on for new logins and payments. You will know at once if someone uses your account.'); show(); }
        else api.result('', `🔔 ${on} of 2 alerts on.`); api.refresh();
      }));
      if (api.isDone(0)) { pw.value = '••••••••••••'; pw.disabled = true; mark('pw', '✓ SAVED'); }
      if (api.isDone(1)) { mfa.classList.add('on'); mfa.disabled = true; mark('mfa', '✓ ON'); }
      if (api.isDone(2)) { $$('[data-a]', body).forEach(x => { x.classList.add('on'); x.disabled = true; }); mark('alr', '✓ ON'); }
    }
    function drawUrl() {
      const URLS = [
        { a: 'http://portal.myschool.edu.sa/login', lock: '🔓', ok: false, why: 'Not HTTPS' },
        { a: 'https://portal.myschoo1.edu.sa/login', lock: '🔒', ok: false, why: 'Misspelled: "schoo1"' },
        { a: 'https://portal.myschool.edu.sa/login', lock: '🔒', ok: true, why: 'HTTPS + spelled correctly' }];
      body.innerHTML = `<div class="cw-card"><h3>🌐 Which website is safe?</h3><p class="sub">You need to type your username and password on the school portal (<b>portal.myschool.edu.sa</b>). Click the only safe address.</p>
        <div class="cw-urls">${shuffle(URLS).map(u => `<button type="button" class="cw-url" data-ok="${u.ok ? 1 : 0}" data-why="${esc(u.why)}"><span class="addr"><span class="lk">${u.lock}</span>${esc(u.a)}</span><span class="why"></span></button>`).join('')}</div>
        <div class="cw-form"><div>Username</div><div>Password</div></div></div>`;
      $$('.cw-url', body).forEach(b => b.addEventListener('click', () => {
        if (api.isDone(3)) return;
        $('.why', b).textContent = b.dataset.why;
        if (b.dataset.ok === '1') { b.classList.add('right'); $('.cw-form', body).classList.add('on'); api.award(15); api.done(3);
          api.result('good', '✅ Safe: the site uses <b>HTTPS</b> and the web address is <b>spelled correctly</b>.'); setTimeout(show, 1200); }
        else { b.classList.add('wrong'); api.mistake(`Unsafe — <b>${esc(b.dataset.why)}</b>. Check for HTTPS and the correct spelling before typing sensitive details.`); }
      }));
    }
    function drawShred() {
      body.innerHTML = `<div class="cw-card"><h3>🗑️ Clean the desk</h3><p class="sub">Papers that show personal details must be <b>shredded</b>. Papers with no personal data can be recycled.</p><div class="srt"></div></div>`;
      sorter($('.srt', body), {
        cols: 2,
        bins: [{ id: 'shr', icon: '✂️', label: 'Shredder', sub: 'Shows personal details' }, { id: 'rec', icon: '♻️', label: 'Recycling bin', sub: 'No personal data' }],
        items: [['🏦 Bank statement', 'shr'], ['🧾 Receipt with card number', 'shr'], ['✉️ Letter with home address', 'shr'], ['🪪 Copy of ID card', 'shr'], ['📰 School event flyer', 'rec'], ['🍕 Restaurant menu', 'rec']].map(([label, bin]) => ({ label, bin })),
        onRight: it => { api.award(3); api.result('good', it.bin === 'shr' ? `✂️ <b>${esc(it.label)}</b> shredded — no Dumpster Diving for this one.` : `♻️ <b>${esc(it.label)}</b> recycled — it has no personal data.`); },
        onWrong: (it, b) => api.mistake(b.id === 'rec' ? `<b>${esc(it.label)}</b> shows personal details. Thieves search rubbish bins for these — it must be <b>shredded</b>.` : `<b>${esc(it.label)}</b> has no personal details, so it can be recycled.`),
        onAll: () => { api.award(10); api.done(4); api.result('good', '✅ Desk clean. Paper documents that show personal details were <b>Shredded</b> instead of thrown away.'); setTimeout(show, 1100); }
      });
    }
    function drawQuiz() {
      const QS = [
        { q: 'A stolen identity can lead to … for the victim.', o: ['Financial Loss and a damaged credit record', 'A faster internet connection', 'Free online shopping'], a: 0 },
        { q: 'One breach of customer data can bring an organization …', o: ['More customers and lower costs', 'Heavy Fines, lawsuits and a loss of public trust', 'A new Password Manager'], a: 1 },
        { q: 'Which Saudi law requires organizations to keep personal data safe?', o: ['HTTPS', 'Multi-Factor Authentication', 'Personal Data Protection Law (PDPL)'], a: 2 }];
      const got = new Set();
      body.innerHTML = `<div class="cw-card"><h3>⚖️ Why does identity protection matter?</h3><p class="sub">Answer from <b>Importance of Identity Protection</b> in the guide.</p>
        <div class="cw-quiz">${QS.map((x, i) => `<div class="cw-q" data-q="${i}"><p>${i + 1}. ${esc(x.q)}</p><div class="opts">${x.o.map((o, j) => `<button type="button" data-j="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div></div>`;
      $$('.cw-q', body).forEach(box => $$('button', box).forEach(b => b.addEventListener('click', () => {
        const i = +box.dataset.q, Q = QS[i];
        if (got.has(i)) return;
        if (+b.dataset.j === Q.a) { got.add(i); b.classList.add('right'); box.classList.add('ok'); $$('button', box).forEach(x => x.disabled = true); api.award(5);
          api.result('good', `✅ Correct: <b>${esc(Q.o[Q.a])}</b>.`);
          if (got.size === QS.length) { api.award(10); api.done(5); api.result('good', '✅ When users and organizations work together, <b>Identity Protection</b> becomes stronger.'); setTimeout(show, 1200); }
          api.refresh(); }
        else { b.classList.add('wrong'); b.disabled = true; api.mistake('Not quite. Read <b>Importance of Identity Protection</b> again.'); }
      })));
    }
    show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>Preventing</b> — strong <b>Password Hygiene</b>.<br>Click the <b>New password</b> box and type a password with <b>12+ characters</b>, an <b>UPPERCASE</b> letter, a <b>lowercase</b> letter, a <b>number</b> and a <b>symbol</b> — e.g. <kbd>Desert#Falcon2026</kbd>. Do not reuse an old password. Then click <kbd>Save password</kbd>.`;
        if (k === 1) return `📖 Read about <b>MFA</b> in <b>Preventing</b>.<br>Click the switch next to <b>Ask for a code from my phone</b>. Type the 6-digit code <kbd>${code}</kbd> shown on the phone, then click <kbd>Verify</kbd>.`;
        if (k === 2) return `📖 The guide says: turn on <b>Account Alerts</b> for new logins or payments.<br>Switch on <b>New login alerts</b> and <b>Payment alerts</b>.`;
        if (k === 3) return `📖 Before typing sensitive details, check the site uses <b>HTTPS</b> and the address is <b>spelled correctly</b>.<br>Click the one safe address for <b>portal.myschool.edu.sa</b>.`;
        if (k === 4) return `📖 Paper documents that show personal details should be <b>Shredded</b>.<br>Drag each paper to the <b>Shredder</b> or the <b>Recycling bin</b> — or tap a paper, then tap the bin.`;
        return `📖 Read <b>Importance</b> in the guide.<br>Answer the 3 questions on the right page by clicking the correct answer.`;
      },
      cleanup() {}
    };
  }
};

/* =====================================================================================================================
   WEEK 11 & WEEK 12 — guide 1.3.4 Access Control Models, Auditing and Monitoring · guide 1.3.5 Access Control Tools
   ===================================================================================================================== */
GUIDES.acModels = {
  code: '1.3.4', title: 'ACCESS CONTROL MODELS, AUDITING AND MONITORING', chapter: 'Chapter 3: Cybersecurity Controls',
  sections: [
    { id: 'def', tab: 'Definition', title: 'Access Control Models, Auditing and Monitoring', text: [
      "An **Access Control Model** is the set of rules a system follows to decide who may read, change, or delete a resource. Each model answers the same question in a different way: **Who Decides** what a user is allowed to do? Some models let the data owner choose, while others rely on strict **Security Labels**, job roles, or detailed attributes. Choosing the right model is only half the job, because organizations must also **Audit** and **Monitor** how access is actually used. Together, these controls make sure that permissions are correct, that every action leaves a trace, and that **Suspicious Activity** is spotted quickly." ] },
    { id: 'ex', tab: 'Example', title: 'Example', text: [
      "A hospital stores patient records in one central **Database**. Doctors can read and update records, nurses can only read them, and reception staff can see appointment times but not medical notes. One night, the **Monitoring System** notices a reception account trying to open hundreds of patient files at 2:00 AM. An **Alert** reaches the security team, the account is locked, and the **Audit Log** shows exactly which files were requested." ] },
    { id: 'dac', tab: 'DAC', title: 'Discretionary Access Control (DAC)', text: [
      "In DAC, the owner of a file or folder decides who can open, edit, or share it. Sharing a document in Google Drive or setting **File Permissions** in Windows are everyday examples of DAC. It is flexible and easy to use, but one careless owner can give access to the wrong person, so it offers **Lower Security**." ] },
    { id: 'mac', tab: 'MAC', title: 'Mandatory Access Control (MAC)', text: [
      "MAC is controlled by the system, not by users, and it compares a **Security Label** on the data with the **Clearance Level** of the user. A user with Secret clearance can read Secret or Confidential files, but never Top Secret files. MAC is very strict, which is why it is used in **Military** and government systems where data leaks are unacceptable." ] },
    { id: 'rbac', tab: 'RBAC & ABAC', title: 'Role-Based and Attribute-Based Access Control', text: [
      "**Role-Based Access Control (RBAC)** groups permissions into roles such as student, teacher, or administrator, and users receive the rights of their role. When someone changes jobs, the administrator simply changes the **Role** instead of editing dozens of permissions. **Attribute-Based Access Control (ABAC)** goes further by checking attributes such as department, device, location, and time of day. For example, an ABAC rule may allow access to payroll only from a **Company Laptop** inside the office during working hours." ] },
    { id: 'audit', tab: 'Auditing', title: 'Security Auditing', text: [
      "**Auditing** is the process of recording and reviewing user activity to confirm that access rules are being followed. Every important event is written to an **Audit Log**, which acts like a black box recorder for the system. A good log entry answers five questions: **Who, What, When, Where**, and with what **Result**. Logs must be protected from changes, because attackers often try to **Delete Logs** to hide their tracks." ] },
    { id: 'mon', tab: 'Monitoring', title: 'Continuous Monitoring', text: [
      "**Continuous Monitoring** means watching systems and networks around the clock instead of checking logs once a month. A **Security Information and Event Management (SIEM)** platform collects logs from servers, firewalls, and computers in one place. It looks for **Patterns** such as repeated failed logins, logins from two countries within minutes, or large downloads at night. When a rule is triggered, the SIEM raises an **Alert** so that analysts in the **Security Operations Center (SOC)** can respond fast." ] },
    { id: 'ben', tab: 'Benefits', title: 'Benefits of Auditing and Monitoring', text: [
      "Auditing and monitoring help organizations **Detect Attacks** early, often before any real damage is done. They also provide **Digital Evidence** that investigators can use to understand what happened during an incident. Many laws and standards, such as **ISO 27001**, require organizations to keep and review security logs. Finally, users tend to follow the rules more carefully when they know their actions are **Recorded** and reviewed." ] }
  ]
};
GUIDES.acTools = {
  code: '1.3.5', title: 'CYBERSECURITY ACCESS CONTROL TOOLS', chapter: 'Chapter 3: Cybersecurity Controls',
  sections: [
    { id: 'def', tab: 'Definition', title: 'Cybersecurity Access Control Tools', text: [
      "**Access Control Tools** are the software and hardware that put access rules into action. Some tools protect **User Identities**, some protect the network, and others protect buildings and server rooms. No single tool can stop every attack, so organizations combine several tools in layers, an approach known as **Defense in Depth**. Knowing what each tool does helps learners understand how a real **Security Architecture** is built." ] },
    { id: 'ex', tab: 'Example', title: 'Example', text: [
      "A new employee joins a bank and receives one account through the **IAM System** on the first day. The account automatically gets the **Teller Role**, an authenticator app for MFA, and a smart card for the office door. When the employee works from home, a **VPN** encrypts the connection to the bank network. If the employee leaves the bank, a single click in IAM disables every account, card, and permission at once." ] },
    { id: 'iam', tab: 'IAM & MFA', title: 'Identity Tools', text: [
      "Identity and Access Management (IAM): IAM platforms such as **Microsoft Entra ID** create, manage, and remove user accounts from one central place. They also provide **Single Sign-On (SSO)**, so users log in once and reach all approved apps safely.",
      "Password Managers and MFA Apps: A **Password Manager** generates and stores strong, unique passwords in an encrypted vault. **Authenticator Apps** create one-time codes or push approvals that add a second factor to every login." ] },
    { id: 'pam', tab: 'PAM', title: 'Privileged Access Management', text: [
      "Privileged Access Management (PAM): PAM tools protect powerful administrator accounts by locking their passwords in a vault and recording every session. Admins receive **Just-in-Time Access** for a short period, and the rights are removed when the task is finished." ] },
    { id: 'net', tab: 'Network & Physical', title: 'Network and Physical Tools', text: [
      "Firewalls and Network Access Control (NAC): A **Firewall** allows or blocks traffic based on rules such as IP address, port, and application. **NAC** checks every device that joins the network and blocks those without updates or antivirus.",
      "VPN and Physical Access Tools: A **Virtual Private Network (VPN)** creates an encrypted tunnel for remote users. **Smart Cards**, biometric scanners, turnstiles, and **CCTV** cameras control and record who enters buildings and server rooms." ] },
    { id: 'zt', tab: 'Zero Trust', title: 'Zero Trust and Access Control Tools', text: [
      "Modern organizations follow a **Zero Trust** approach, which means never trust and always verify. Every login request is checked against the user's identity, **Device Health**, location, and behavior, even inside the company network. IAM, MFA, NAC, and the SIEM work together to make these **Real-Time Decisions** about access. If anything looks risky, the system can ask for extra verification or **Block Access** completely." ] },
    { id: 'mist', tab: 'Common Mistakes', title: 'Common Mistakes to Avoid', text: [
      "Shared Accounts: When several people use one login, the **Audit Log** cannot show who actually performed an action.",
      "Forgotten Accounts: Accounts of former staff that stay active become an easy **Entry Point** for attackers.",
      "MFA Fatigue: Attackers send many push requests hoping a tired user taps **Approve**, so users must reject any request they did not start.",
      "Excessive Permissions: Giving users more rights than they need breaks the **Least Privilege** rule and makes any stolen account far more dangerous." ] },
    { id: 'eff', tab: 'Using Tools', title: 'Using Access Control Tools Effectively', text: [
      "Tools only work well when they are configured correctly and kept **Up to Date**. Administrators should review **User Accounts** regularly and remove old or unused ones without delay. Logs from every tool should be sent to the **SIEM** so that one team can see the full picture. Finally, users need **Security Awareness** training, because even the best tool fails if someone shares a password or approves a fake MFA request." ] }
  ]
};

/* ------------------------------------------------------------------ more 3D building blocks + shared widgets ------------------------------------------------------------------ */
/* a glowing line on the floor plane at height y from (x1,z1) to (x2,z2); o.id names the line, o.c its colour, o.pk adds moving packets */
function link(x1, z1, x2, z2, y, o = {}) {
  const dx = x2 - x1, dz = z2 - z1, L = Math.hypot(dx, dz), a = Math.atan2(dz, dx) * 180 / Math.PI;
  return `<div class="cw-o" style="transform:translate3d(${x1}px,${y}px,${z1}px) rotateY(${-a}deg)"><div class="cw-link${o.on ? ' on' : ''}"${o.id ? ` id="${o.id}"` : ''} style="width:${L}px;--lc:${o.c || '#38BDF8'}">${o.pk ? '<i></i><i></i><i></i>' : ''}</div></div>`;
}
const bb = (txt, cls, y, id) => `<div class="cw-bb ${cls || ''}"${id ? ` id="${id}"` : ''} style="top:${y || 0}px">${txt}</div>`;
const person = (x, z, emoji, label, o = {}) => obj(x, -42, z, cube(34, 84, 22, o.c || '#1E3A8A') + `<div class="cw-av" style="top:-86px">${emoji}</div>` + bb(label, o.bc, -124, o.lid), { id: o.id, domId: o.domId, cls: o.cls });
function pcDesk(x, z, screen, o = {}) {
  return desk(x, z, o.w || 190, o.d || 100, -95, o.dc) + obj(x, -104, z - 28, cube(16, 18, 16, '#1F2937')) +
    obj(x, -152, z - 28, cube(o.mw || 140, o.mh || 86, 8, '#0F172A', { fr: `<div class="cw-mon"${o.sid ? ` id="${o.sid}"` : ''}>${screen || ''}</div>` }), { id: o.id }) +
    obj(x, -96, z + 14, plane(104, 30, '', 'background:repeating-linear-gradient(90deg,#1F2937 0 9px,#475569 9px 10px),#334155;border-radius:3px')) +
    (o.label ? obj(x, -222, z - 28, bb(o.label, o.bc)) : '');
}
const rackFace = (n, red) => `<div style="padding:6px 5px">${Array.from({ length: n }, () => `<div class="cw-ru"><span>▮▮▮</span><span><span class="cw-led${red ? ' r' : ''}"></span><span class="cw-led a"></span></span></div>`).join('')}</div>`;
function server(x, z, label, o = {}) { const h = o.h || 150; return obj(x, -h / 2, z, cube(o.w || 70, h, o.d || 60, o.c || '#334155', { fr: o.fr || rackFace(Math.floor(h / 19), o.red) }) + bb(label, o.bc, -h / 2 - 28, o.lid), { id: o.id, domId: o.domId, cls: o.cls }); }
const wall = (x, y, z, w, h, html, o = {}) => obj(x, y, z, `<div class="cw-wall"${o.sid ? ` id="${o.sid}"` : ''} style="width:${w}px;height:${h}px;left:${-w / 2}px;top:${-h / 2}px">${html}</div>`, { id: o.id, domId: o.domId, cls: o.cls });
const vault = (x, z, label, c, id) => obj(x, -66, z, cube(88, 132, 64, c, { fr: `<div class="cw-vf"><b>${label}</b><span id="${id}-st">🔒</span></div>` }), { domId: id });
const siren = (x, y, z, id) => obj(x, y, z, cube(26, 22, 26, '#7F1D1D'), { domId: id, cls: 'cw-siren' });
const phone3d = (x, y, z, html, id) => obj(x, y, z, plane(62, 108, `<div class="cw-ph3"${id ? ` id="${id}"` : ''}>${html}</div>`, 'background:#0F172A;border:4px solid #111827;border-radius:10px'));
const card3d = (x, y, z, id) => obj(x, y, z, plane(64, 40, '<div style="padding:5px;font:700 9px var(--mono);color:#fff">💳 STAFF<br>SMART CARD</div>', 'background:linear-gradient(135deg,#2563EB,#1E3A8A);border-radius:5px'), { domId: id, cls: 'cw-gone' });
function door(x, z, id, label) { return obj(x, -96, z, `<div class="cw-door" id="${id}"><div class="leaf"><span>🚪</span></div></div>`) + obj(x - 62, -110, z + 6, cube(20, 32, 10, '#1F2937', { fr: `<div class="cw-rd" id="${id}-rd"></div>` }), { id: id + '-reader' }) + obj(x, -215, z, bb(label || 'STAFF ROOM')); }
function glow(root, id, ok) { const el = $('#' + id, root); if (!el) return; el.classList.remove('cw-okglow', 'cw-noglow'); void el.offsetWidth; el.classList.add(ok ? 'cw-okglow' : 'cw-noglow'); }
function lineSet(root, id, on, c) { const el = $('#' + id, root); if (!el) return; el.classList.toggle('on', !!on); if (c) el.style.setProperty('--lc', c); }
const app = (title, body, o = {}) => `<div class="cw-app${o.dark ? ' dark' : ''}"${o.id ? ` id="${o.id}"` : ''}><div class="tb"><i></i><i></i><i></i><span>${title}</span></div><div class="ab">${body}</div></div>`;

/* mailbox: mails = [{ id, from, subj, time, body, actions:[[label, fn, cls]] }] */
function mailbox(host, mails, onOpen) {
  host.innerHTML = `<div class="cw-mail"><div class="ml">${mails.map(m => `<div class="mi new" data-m="${m.id}"><b>${esc(m.from)}</b><span>${esc(m.subj)}</span><small>${esc(m.time)}</small></div>`).join('')}</div><div class="mv"><p class="cw-hint">📩 Click an email on the left to open it.</p></div></div>`;
  const view = $('.mv', host);
  $$('.mi', host).forEach(el => el.addEventListener('click', () => {
    const m = mails.find(x => x.id === el.dataset.m); $$('.mi', host).forEach(x => x.classList.toggle('on', x === el)); el.classList.remove('new');
    view.innerHTML = `<div class="mh"><b>${esc(m.subj)}</b><small>From: ${esc(m.from)} · ${esc(m.time)}</small></div><div class="mb">${m.body}</div><div class="cw-row" style="margin-top:8px">${(m.actions || []).map((a, i) => `<button type="button" class="cw-btn ${a[2] || 'gry'}" data-a="${i}">${a[0]}</button>`).join('')}</div>`;
    $$('[data-a]', view).forEach(b => b.addEventListener('click', () => m.actions[+b.dataset.a][1](b)));
    if (onOpen) onOpen(m);
  }));
}
/* one request at a time: items = [{ html, a (right option), ok, bad }]; opts = [{ label, cls }] */
function decider(host, o) {
  let i = o.start || 0;
  const draw = () => {
    if (i >= o.items.length) { host.innerHTML = `<div class="cw-dq fin">✅ All ${o.items.length} decided.</div>`; if (o.onDone) o.onDone(); return; }
    const it = o.items[i]; if (o.onShow) o.onShow(it, i);
    host.innerHTML = `<div class="cw-dq"><div class="n">${esc(o.label || 'REQUEST')} ${i + 1} OF ${o.items.length}</div>${it.html}<div class="opts">${o.opts.map((x, j) => `<button type="button" class="cw-dbtn ${x.cls || ''}" data-j="${j}">${x.label}</button>`).join('')}</div></div>`;
    $$('.cw-dbtn', host).forEach(b => b.addEventListener('click', () => {
      const j = +b.dataset.j;
      if (j === it.a) { $$('.cw-dbtn', host).forEach(x => x.disabled = true); b.classList.add('right'); o.onRight(it, i); i++; setTimeout(() => { if (host.isConnected) draw(); }, 1000); }
      else { b.classList.add('wrong'); b.disabled = true; o.onWrong(it, j); }
    }));
  };
  draw(); return { index: () => i };
}
/* multiple-choice questions */
function quiz(host, QS, api, onAll) {
  const got = new Set();
  host.innerHTML = `<div class="cw-quiz">${QS.map((x, i) => `<div class="cw-q" data-q="${i}"><p>${i + 1}. ${esc(x.q)}</p><div class="opts">${x.o.map((o, j) => `<button type="button" data-j="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}</div>`;
  $$('.cw-q', host).forEach(box => $$('button', box).forEach(b => b.addEventListener('click', () => {
    const i = +box.dataset.q, Q = QS[i]; if (got.has(i)) return;
    if (+b.dataset.j === Q.a) { got.add(i); b.classList.add('right'); box.classList.add('ok'); $$('button', box).forEach(x => x.disabled = true); api.award(5); api.result('good', `✅ Correct: <b>${esc(Q.o[Q.a])}</b>.`); if (got.size === QS.length) onAll(); api.refresh(); }
    else { b.classList.add('wrong'); b.disabled = true; api.mistake(Q.hint || 'Not quite. Read the guide again.'); }
  })));
}
/* a small command console: run(cmd, args, print) returns nothing */
function miniTerm(host, o) {
  host.innerHTML = `<div class="cw-term" style="margin-top:0"><div class="tb"><i></i><i></i><i></i><span>${esc(o.title)}</span></div><div class="out" style="height:${o.h || 150}px"></div><div class="in"><b>${esc(o.prompt)}</b><input autocomplete="off" spellcheck="false" placeholder="type a command, then press Enter"></div></div>`;
  const out = $('.out', host), inp = $('input', host), lines = [];
  const print = (t, c = '') => { String(t).split('\n').forEach(x => lines.push([x, c])); out.innerHTML = lines.slice(-30).map(l => `<div class="${l[1]}">${esc(l[0])}</div>`).join(''); };
  inp.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const v = inp.value.trim(); inp.value = ''; if (!v) return; print(o.prompt + ' ' + v, 'c'); const [c, ...a] = v.split(/\s+/); o.run(c.toLowerCase(), a.join(' '), print); });
  $('.cw-term', host).addEventListener('click', () => inp.focus());
  (o.hello || []).forEach(l => print(l, 'dim'));
  return { print, focus: () => inp.focus() };
}
const reqCard = (rows, who) => `<div class="cw-reqc">${who ? `<div class="who">${who}</div>` : ''}<div class="sig">${rows.map(r => `<div><small>${r[0]}</small><b class="${r[2] || ''}">${r[1]}</b></div>`).join('')}</div></div>`;

/* ==================================== WEEK 11 · LAB 1 · PART 1 — DAC & MAC in the hospital ==================================== */
PARTS.hospDacMac = {
  title: 'DAC & MAC in the Records Office', guide: 'acModels', q: 'Who decides what a user is allowed to do?',
  steps: [
    { t: 'Read the share request email and decide', sec: 'dac' },
    { t: 'Share the report with Nurse Laila — Read only', sec: 'dac' },
    { t: 'Give Dr. Omar Edit rights', sec: 'dac' },
    { t: 'Decide 4 requests on the MAC Clearance Server', sec: 'mac' }
  ],
  mount(body, api) {
    const objs =
      pcDesk(-60, 30, '<div class="t">📄 Cardiology_Report.docx</div><div class="d" id="dm-share">Owner: Dr. Huda<br>Shared with: nobody</div>', { label: "DR. HUDA'S PC · FILE OWNER", id: 'pc' }) +
      person(-300, 140, '👩‍⚕️', 'NURSE LAILA', { c: '#0E7490', domId: 'dm-p-laila' }) +
      person(-330, -70, '👨‍⚕️', 'DR. OMAR', { c: '#166534', domId: 'dm-p-omar' }) +
      person(130, 150, '🧑‍💼', 'AHMED · RECEPTION', { c: '#92400E', lid: 'dm-b-ahmed' }) +
      link(-60, 30, -300, 140, -60, { id: 'dm-l-laila', c: '#38BDF8', pk: 1 }) + link(-60, 30, -330, -70, -60, { id: 'dm-l-omar', c: '#22C55E', pk: 1 }) + link(-60, 30, 130, 150, -60, { id: 'dm-l-ahmed', c: '#EF4444' }) +
      vault(200, -110, 'CONFIDENTIAL', '#1E3A8A', 'dm-v-c') + vault(300, -110, 'SECRET', '#9A3412', 'dm-v-s') + vault(400, -110, 'TOP SECRET', '#7F1D1D', 'dm-v-t') +
      obj(300, -225, -110, bb('MILITARY WING · MAC', 'red'));
    body.innerHTML = `<div class="cw-card"><h3>🏥 Al Noor Hospital — records office</h3><p class="sub">You are <b>Dr. Huda</b>, owner of a cardiology report (DAC). The hospital's Military Wing uses MAC.</p>
      ${scene(objs, { h: 270, s: .62, rx: -20, ry: -10, wy: 84, tag: 'RECORDS OFFICE · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, macDone = 0;
    const sync = () => {
      if (api.isDone(0)) { lineSet(body, 'dm-l-ahmed', 1); $('#dm-b-ahmed', body).innerHTML = 'AHMED · ✖ DENIED'; $('#dm-b-ahmed', body).classList.add('red'); }
      lineSet(body, 'dm-l-laila', api.isDone(1)); lineSet(body, 'dm-l-omar', api.isDone(2));
      const sh = [api.isDone(1) ? 'Nurse Laila (Read)' : '', api.isDone(2) ? 'Dr. Omar (Edit)' : ''].filter(Boolean);
      $('#dm-share', body).innerHTML = `Owner: Dr. Huda<br>Shared with: ${sh.length ? sh.join(', ') : 'nobody'}`;
    };
    const show = () => {
      const k = [0, 1, 2, 3].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : k === 0 ? 'mail' : k <= 2 ? 'share' : 'mac';
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'mail') {
        pane.innerHTML = app('Hospital Mail — dr.huda@alnoor-hospital.sa', '<div class="mbx"></div>');
        mailbox($('.mbx', pane), [
          { id: 'a', from: 'Ahmed (Reception)', subj: 'URGENT: share Cardiology_Report', time: '08:12', body: '<p>Hi Dr. Huda,</p><p>Please share <b>Cardiology_Report.docx</b> with me now. I need to check something before the patient arrives.</p><p>Thanks, Ahmed — Reception desk</p>',
            actions: [['✅ Share with Ahmed', () => api.mistake('Reception staff can see appointment times but <b>not medical notes</b>. In DAC one careless owner can give access to the wrong person.'), 'gry'], ['⛔ Deny the request', () => { api.award(15); api.done(0); api.result('good', '⛔ Request denied. As the <b>owner</b>, you decide — and reception must not see medical notes.'); sync(); show(); }, 'red']] },
          { id: 'b', from: 'IT Department', subj: 'Reminder: file permissions', time: '07:30', body: '<p>Owners of shared files control who can open, edit or share them. Check every sharing request carefully.</p>' }
        ], () => api.result('', '📩 Email opened. Read it, then choose an action.'));
      } else if (want === 'share') {
        const row = (id, who, role) => `<div class="cw-perm" data-u="${id}"><span>${who}<small>${role}</small></span>${['No access', 'Read', 'Edit'].map(x => `<button type="button" data-v="${x}">${x}</button>`).join('')}</div>`;
        pane.innerHTML = app('File Sharing — Cardiology_Report.docx · Owner: Dr. Huda (you)', row('laila', '👩‍⚕️ Nurse Laila', 'Nurse') + row('omar', '👨‍⚕️ Dr. Omar', 'Doctor') + '<div class="cw-perm off"><span>🧑‍💼 Ahmed<small>Reception</small></span><em>Request denied</em></div>');
        const mark = () => { if (api.isDone(1)) $('[data-u="laila"] [data-v="Read"]', pane).classList.add('on'); if (api.isDone(2)) $('[data-u="omar"] [data-v="Edit"]', pane).classList.add('on'); };
        $$('.cw-perm[data-u] button', pane).forEach(b => b.addEventListener('click', () => {
          const u = b.closest('[data-u]').dataset.u, v = b.dataset.v;
          if (u === 'laila') { if (api.isDone(1)) return; if (v === 'Read') { api.award(10); api.done(1); api.result('good', '🔵 Nurse Laila can now <b>read</b> the report. The Example says nurses can only read records.'); } else api.mistake(v === 'Edit' ? 'Nurses can only <b>read</b> records — Edit gives too much.' : 'Nurse Laila needs to read the report for her patient.'); }
          if (u === 'omar') { if (api.isDone(2)) return; if (v === 'Edit') { api.award(10); api.done(2); api.result('good', '🟢 Dr. Omar can now <b>read and update</b> the report.'); } else api.mistake(v === 'Read' ? 'Doctors can read <b>and update</b> records — choose Edit.' : 'Dr. Omar treats this patient and needs access.'); }
          sync(); mark(); if (api.isDone(1) && api.isDone(2)) show(); else api.refresh();
        }));
        mark();
      } else if (want === 'mac') {
        pane.innerHTML = app('MAC Clearance Server — Military Wing (the system decides)', '<div class="dq"></div>', { dark: true });
        const lv = (t, c) => `<em class="lv ${c}">${t}</em>`;
        const V = { CONFIDENTIAL: 'dm-v-c', SECRET: 'dm-v-s', 'TOP SECRET': 'dm-v-t' };
        const R = (u, ul, f, fl, a, why) => ({ f: fl, a, why, html: `<div class="cw-mac"><div><small>USER</small><b>${u}</b>${lv(ul + ' clearance', ul[0].toLowerCase())}</div><div class="ar">→</div><div><small>FILE</small><b>${f}</b>${lv(fl + ' label', fl[0].toLowerCase())}</div></div>` });
        decider($('.dq', pane), {
          label: 'REQUEST', opts: [{ label: '✅ ALLOW', cls: 'g' }, { label: '⛔ DENY', cls: 'r' }],
          items: [R('Capt. Sami', 'SECRET', 'Field_Surgery_Plan', 'CONFIDENTIAL', 0, 'Secret clearance can read Confidential files.'), R('Capt. Sami', 'SECRET', 'Operation_Supply_Route', 'TOP SECRET', 1, 'Secret clearance can never read Top Secret files.'),
            R('Lt. Rana', 'TOP SECRET', 'Wounded_Soldiers_List', 'SECRET', 0, 'Top Secret clearance is higher than the Secret label.'), R('Clerk Majed', 'CONFIDENTIAL', 'Officer_Health_Records', 'SECRET', 1, 'Confidential clearance is lower than the Secret label.')],
          onShow: it => glow(body, V[it.f], true),
          onRight: it => { const id = V[it.f]; glow(body, id, it.a === 0); $('#' + id + '-st', body).textContent = it.a === 0 ? '🔓' : '⛔'; setTimeout(() => { const s = $('#' + id + '-st', body); if (s) s.textContent = '🔒'; }, 1600); macDone++; api.award(5); api.result('good', `${it.a === 0 ? '✅ ALLOWED' : '⛔ DENIED'} — ${it.why}`); api.refresh(); },
          onWrong: it => api.mistake(`Compare the <b>Clearance Level</b> with the <b>Security Label</b>. ${it.a === 0 ? 'The clearance is high enough.' : 'The clearance is too low.'}`),
          onDone: () => { api.award(10); api.done(3); api.result('good', '✅ The MAC system — not the users — decided every request using labels and clearance.'); show(); }
        });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🏥</div><h3>Part 1 complete</h3><p>You used DAC as a file owner and let MAC decide by labels and clearance. Click <b>Next part →</b>.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>DAC</b>: the owner decides who can open, edit or share a file.<br>In <b>Hospital Mail</b> under the 3D room, click Ahmed's email, read it, then click the safe button. Watch Ahmed's line in the room.`;
        if (k === 1) return `You are the <b>owner</b>. In <b>File Sharing</b>, click <kbd>Read</kbd> next to <b>Nurse Laila</b> — the Example says nurses can only read records. A blue line will connect her to the file.`;
        if (k === 2) return `In <b>File Sharing</b>, click <kbd>Edit</kbd> next to <b>Dr. Omar</b> — doctors can read and update records. A green line will connect him.`;
        return `📖 Read <b>MAC</b>: the system compares the file's <b>Security Label</b> with the user's <b>Clearance Level</b>.<br>In the <b>MAC Clearance Server</b>, click <kbd>✅ ALLOW</kbd> or <kbd>⛔ DENY</kbd> for each request. The matching vault in the Military Wing glows. Decided: <b>${macDone} of 4</b>.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 11 · LAB 1 · PART 2 — RBAC & ABAC ==================================== */
PARTS.hospRbacAbac = {
  title: 'RBAC & ABAC on the Patient Database', guide: 'acModels', q: 'How do roles and attributes control access?',
  steps: [
    { t: 'Set the role permissions from the Example', sec: 'ex' },
    { t: "Change Laila's role after her promotion", sec: 'rbac' },
    { t: 'Build the ABAC rule for the payroll system', sec: 'rbac' },
    { t: 'Test 3 payroll logins against the rule', sec: 'rbac' }
  ],
  mount(body, api) {
    const objs =
      server(0, -170, 'PATIENT DATABASE', { h: 170, c: '#0F172A' }) + server(330, -120, 'PAYROLL SERVER', { h: 140, c: '#1E293B', bc: 'grn' }) +
      pcDesk(-300, 30, '<div class="t">🩺 DOCTOR OFFICE</div>', { w: 150, mw: 110, mh: 70 }) + pcDesk(-80, 120, '<div class="t">💉 NURSE STATION</div>', { w: 150, mw: 110, mh: 70 }) + pcDesk(160, 120, '<div class="t">🗓️ RECEPTION</div>', { w: 150, mw: 110, mh: 70 }) +
      person(-390, 20, '👨‍⚕️', 'DOCTOR', { c: '#166534' }) + person(-80, 210, '👩‍⚕️', 'LAILA · NURSE', { c: '#0E7490', lid: 'ra-b-laila', domId: 'ra-laila' }) + person(250, 150, '🧑‍💼', 'RECEPTION', { c: '#92400E' }) +
      link(-300, 30, 0, -170, -150, { id: 'ra-l-doc', c: '#22C55E', pk: 1 }) + link(-80, 120, 0, -170, -150, { id: 'ra-l-nur', c: '#38BDF8', pk: 1 }) + link(160, 120, 0, -170, -150, { id: 'ra-l-rec', c: '#F59E0B', pk: 1 }) +
      person(420, 60, '💼', 'FINANCE · NOURA', { c: '#4C1D95' }) + link(420, 60, 330, -120, -60, { id: 'ra-l-pay', c: '#22C55E', pk: 1 });
    body.innerHTML = `<div class="cw-card"><h3>🏥 Al Noor Hospital — patient database</h3><p class="sub">You are the <b>system administrator</b>. Set access by <b>role</b> (RBAC), then by <b>attributes</b> (ABAC).</p>
      ${scene(objs, { h: 270, s: .6, rx: -20, ry: -6, wy: 84, tag: 'HOSPITAL FLOOR · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, tests = 0;
    const sync = () => {
      lineSet(body, 'ra-l-doc', api.isDone(0)); lineSet(body, 'ra-l-nur', api.isDone(0)); lineSet(body, 'ra-l-rec', api.isDone(0));
      if (api.isDone(1)) { const b = $('#ra-b-laila', body); b.textContent = 'LAILA · DOCTOR ✓'; b.classList.add('grn'); lineSet(body, 'ra-l-nur', 1, '#22C55E'); }
    };
    const show = () => {
      const k = [0, 1, 2, 3].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : ['matrix', 'role', 'abac', 'test'][k];
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'matrix') {
        const C = [['r', 'Read records'], ['u', 'Update records'], ['a', 'Appointment times']], RO = [['doc', '👨‍⚕️ Doctor'], ['nur', '👩‍⚕️ Nurse'], ['rec', '🧑‍💼 Reception']];
        pane.innerHTML = app('RBAC Console — Patient Database roles', `<table class="cw-mx"><tr><th>Role</th>${C.map(c => `<th>${c[1]}</th>`).join('')}</tr>${RO.map(r => `<tr><td>${r[1]}</td>${C.map(c => `<td><button type="button" class="cw-ck${c[0] === 'a' && r[0] !== 'rec' ? ' on fixed' : ''}" data-r="${r[0]}" data-c="${c[0]}"></button></td>`).join('')}</tr>`).join('')}</table><div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn" id="ra-apply">Apply roles</button><span class="cw-hint">Doctors and nurses keep appointment times.</span></div>`);
        $$('.cw-ck:not(.fixed)', pane).forEach(b => b.addEventListener('click', () => b.classList.toggle('on')));
        $('#ra-apply', pane).addEventListener('click', () => {
          const on = (r, c) => $(`.cw-ck[data-r="${r}"][data-c="${c}"]`, pane).classList.contains('on');
          const errs = [];
          if (!on('doc', 'r') || !on('doc', 'u')) errs.push('Doctors can read <b>and update</b> records');
          if (!on('nur', 'r') || on('nur', 'u')) errs.push('nurses can <b>only read</b> records');
          if (on('rec', 'r') || on('rec', 'u') || !on('rec', 'a')) errs.push('reception can see <b>appointment times but not medical notes</b>');
          if (errs.length) { api.mistake('Check the Example: ' + errs.join('; ') + '.'); return; }
          api.award(15); api.done(0); api.result('good', '✅ Roles applied. Every user now gets the rights of their <b>role</b> — the green, blue and amber lines in the room.'); sync(); show();
        });
      } else if (want === 'role') {
        pane.innerHTML = app('HR notice + RBAC Users', `<div class="cw-note2">📢 <b>HR:</b> Laila Hassan finished her training and is <b>promoted to Doctor</b> from today.</div>
          <div class="cw-row" style="margin-top:8px"><span style="flex:1"><b>👩‍⚕️ Laila Hassan</b> · current role: <b>Nurse</b></span>
          <select class="cw-sel" id="ra-role"><option>Nurse</option><option>Doctor</option><option>Reception</option><option>Administrator</option></select><button type="button" class="cw-btn" id="ra-save">Change role</button></div>
          <div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn gry" id="ra-manual">✏️ Edit her 24 permissions one by one</button></div>`);
        $('#ra-manual', pane).addEventListener('click', () => api.mistake('With RBAC the administrator <b>simply changes the Role</b> instead of editing dozens of permissions.'));
        $('#ra-save', pane).addEventListener('click', () => {
          const v = $('#ra-role', pane).value;
          if (v !== 'Doctor') { api.mistake(v === 'Administrator' ? 'Administrator gives far more rights than a doctor needs.' : `Laila is now a <b>Doctor</b>, not ${esc(v)}.`); return; }
          api.award(15); api.done(1); api.result('good', '✅ Role changed to <b>Doctor</b>. Laila now gets every doctor permission at once — her line turns green.'); sync(); show();
        });
      } else if (want === 'abac') {
        const sel = (id, opts) => `<select class="cw-sel" id="${id}">${opts.map(o => `<option>${o}</option>`).join('')}</select>`;
        pane.innerHTML = app('ABAC Policy Builder — Payroll Server', `<div class="cw-abac"><b>ALLOW payroll access IF</b>
          <label>Department ${sel('ab-dep', ['Any department', 'Finance', 'Medical'])}</label><label>Device ${sel('ab-dev', ['Any device', 'Personal phone', 'Company Laptop'])}</label>
          <label>Location ${sel('ab-loc', ['Anywhere', 'Inside the office', 'At home'])}</label><label>Time of day ${sel('ab-time', ['Any time', 'Working hours', 'Night only'])}</label></div>
          <button type="button" class="cw-btn" id="ab-save" style="margin-top:8px">Save rule</button>`);
        $('#ab-save', pane).addEventListener('click', () => {
          const v = id => $('#' + id, pane).value, e = [];
          if (v('ab-dep') !== 'Finance') e.push('only the <b>Finance</b> department needs payroll');
          if (v('ab-dev') !== 'Company Laptop') e.push('only from a <b>Company Laptop</b>');
          if (v('ab-loc') !== 'Inside the office') e.push('only <b>inside the office</b>');
          if (v('ab-time') !== 'Working hours') e.push('only during <b>working hours</b>');
          if (e.length) { api.mistake('Rule not saved: ' + e.join(', ') + '.'); return; }
          api.award(15); api.done(2); api.result('good', '✅ ABAC rule saved: Finance + Company Laptop + inside the office + working hours.'); show();
        });
      } else if (want === 'test') {
        pane.innerHTML = app('ABAC Engine — live payroll logins', '<div class="dq"></div>', { dark: true });
        decider($('.dq', pane), {
          label: 'LOGIN', opts: [{ label: '✅ ALLOW', cls: 'g' }, { label: '⛔ DENY', cls: 'r' }],
          items: [
            { a: 0, why: 'every attribute matches the rule.', html: reqCard([['Department', 'Finance', 'g'], ['Device', 'Company Laptop', 'g'], ['Location', 'Inside the office', 'g'], ['Time', '10:15 — working hours', 'g']], '💼 Noura (Finance)') },
            { a: 1, why: 'a personal phone at home at night breaks three attributes.', html: reqCard([['Department', 'Finance', 'g'], ['Device', 'Personal phone', 'r'], ['Location', 'At home', 'r'], ['Time', '22:40 — night', 'r']], '💼 Noura (Finance)') },
            { a: 1, why: 'the department is Medical, not Finance.', html: reqCard([['Department', 'Medical', 'r'], ['Device', 'Company Laptop', 'g'], ['Location', 'Inside the office', 'g'], ['Time', '11:00 — working hours', 'g']], '👩‍⚕️ Dr. Laila') }],
          onShow: () => lineSet(body, 'ra-l-pay', 0),
          onRight: it => { tests++; lineSet(body, 'ra-l-pay', 1, it.a === 0 ? '#22C55E' : '#EF4444'); api.award(5); api.result('good', `${it.a === 0 ? '✅ ALLOWED' : '⛔ DENIED'} — ${it.why}`); api.refresh(); },
          onWrong: () => api.mistake('Check all four attributes against the rule. Every one must match.'),
          onDone: () => { api.award(10); api.done(3); api.result('good', '✅ ABAC checked department, device, location and time for every login.'); show(); }
        });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🗂️</div><h3>Lab complete</h3><p>You set permissions by role and by attributes. Click <b>Finish lab ✓</b> on the left page.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read the <b>Example</b>: doctors read and update, nurses only read, reception sees appointment times but not medical notes.<br>In the <b>RBAC Console</b>, click the boxes to tick the right permissions, then click <kbd>Apply roles</kbd>. Lines will connect each station to the database.`;
        if (k === 1) return `📖 Read <b>RBAC</b>: when someone changes jobs, change the <b>Role</b>.<br>Choose <kbd>Doctor</kbd> in the role list for Laila and click <kbd>Change role</kbd>. Her label in the room will change.`;
        if (k === 2) return `📖 Read <b>ABAC</b>: payroll only from a <b>Company Laptop</b> inside the office during working hours.<br>In the <b>ABAC Policy Builder</b>, choose <b>Finance</b>, <b>Company Laptop</b>, <b>Inside the office</b> and <b>Working hours</b>, then click <kbd>Save rule</kbd>.`;
        return `Now test the rule. For each login in the <b>ABAC Engine</b>, check the four attributes (red = does not match) and click <kbd>✅ ALLOW</kbd> or <kbd>⛔ DENY</kbd>. The payroll line turns green or red. Done: <b>${tests} of 3</b>.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 11 · LAB 2 · PART 1 — the 2:00 AM alert (SOC) ==================================== */
PARTS.socAlert = {
  title: 'The 2:00 AM Alert', guide: 'acModels', q: 'How do auditing and monitoring catch suspicious activity?',
  steps: [
    { t: 'Open the SIEM alert on the video wall', sec: 'ex' },
    { t: 'Find the suspicious entry in the Audit Log', sec: 'audit' },
    { t: 'Answer the 5 questions of a good log entry', sec: 'audit' },
    { t: 'Lock the account with a SOC command', sec: 'ex' },
    { t: 'Protect the logs from being deleted', sec: 'audit' }
  ],
  mount(body, api) {
    const objs =
      wall(-60, -200, -230, 420, 180, '<div class="cw-siem"><b>SIEM · AL NOOR HOSPITAL</b><div id="sa-alert" class="al">🚨 ALERT: reception02 opened 312 patient files at 02:00</div><div class="kp"><span>Events/min<b>1,240</b></span><span>Failed logins<b>3</b></span><span>Alerts<b id="sa-n">1</b></span></div></div>', { id: 'wall' }) +
      pcDesk(-120, 60, '<div class="t">SOC ANALYST</div><div class="d">audit-log.viewer</div>', { label: 'SOC DESK · YOU', w: 230 }) + siren(10, -112, 70, 'sa-siren') +
      pcDesk(300, 90, '<div class="t" id="sa-rscr">RECEPTION-PC-2</div><div class="d" id="sa-rst">user: reception02<br>status: ACTIVE</div>', { label: 'RECEPTION · GROUND FLOOR', w: 170, mw: 120, mh: 76 }) +
      server(150, -230, 'LOG SERVER', { h: 140, lid: 'sa-logb' }) +
      link(300, 90, 150, -230, -120, { id: 'sa-l-rec', c: '#EF4444', pk: 1, on: 1 });
    body.innerHTML = `<div class="cw-card"><h3>🖥️ Hospital Security Operations Center — 02:01 AM</h3><p class="sub">You are the <b>SOC analyst</b> on the night shift. The SIEM has just raised an alert.</p>
      ${scene(objs, { h: 280, s: .64, rx: -14, ry: -8, wy: 84, tag: 'SOC · NIGHT SHIFT · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null;
    const LOG = [['01:58:40', 'dr.omar', 'LOGIN', '—', 'WARD-3-PC', 'Success'], ['02:00:13', 'reception02', 'OPEN 312 patient files', '312', 'RECEPTION-PC-2', 'Success', 1], ['02:03:02', 'backup.svc', 'BACKUP database', '—', 'LOG-SERVER', 'Success'], ['02:05:51', 'nurse.laila', 'READ 1 record', '1', 'WARD-1-PC', 'Success'], ['02:06:20', 'reception02', 'VIEW appointments', '—', 'RECEPTION-PC-2', 'Success']];
    const sync = () => {
      $('#sa-siren', body).classList.toggle('on', !api.isDone(3));
      if (api.isDone(3)) { $('#sa-rst', body).innerHTML = 'user: reception02<br>status: 🔒 LOCKED'; $('#sa-rscr', body).style.color = '#F87171'; lineSet(body, 'sa-l-rec', 0); $('#sa-alert', body).textContent = '✅ reception02 LOCKED — investigation open'; $('#sa-alert', body).classList.add('ok'); }
      if (api.isDone(4)) { const b = $('#sa-logb', body); b.textContent = 'LOG SERVER · 🛡 WRITE-ONCE'; b.classList.add('grn'); }
    };
    const show = () => {
      const k = [0, 1, 2, 3, 4].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : ['alert', 'log', 'five', 'lock', 'protect'][k];
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'alert') pane.innerHTML = app('SIEM Alerts', '<div class="cw-hint">The video wall is flashing. Click the red alert on the wall in the 3D room, or here:</div><button type="button" class="cw-btn red" id="sa-open" style="margin-top:6px">🚨 Open alert #1</button>');
      else if (want === 'log' || want === 'five') {
        pane.innerHTML = app('Audit Log — patient-database (read only)', `<table class="cw-log"><tr><th>Time</th><th>User</th><th>Action</th><th>Source</th><th>Result</th></tr>${LOG.map((r, i) => `<tr data-i="${i}"${api.isDone(1) && r[6] ? ' class="hit"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}</table><div class="five"></div>`, { dark: true });
        $$('.cw-log tr[data-i]', pane).forEach(tr => tr.addEventListener('click', () => {
          if (api.isDone(1)) return; const r = LOG[+tr.dataset.i];
          if (r[6]) { tr.classList.add('hit'); api.award(15); api.done(1); api.result('good', '🔎 Found it: <b>reception02</b> opened <b>312 patient files</b> at 02:00 — reception should only see appointment times.'); show(); }
          else { tr.classList.add('miss'); api.mistake('That entry is normal work. Look for a <b>reception</b> account touching <b>patient files</b> in the night.'); }
        }));
        if (want === 'five') {
          const Q = [['Who', ['dr.omar', 'reception02', 'nurse.laila'], 1], ['What', ['Viewed appointments', 'Opened 312 patient files', 'Backed up the database'], 1], ['When', ['01:58 AM', '02:00 AM', '09:00 AM'], 1], ['Where', ['WARD-3-PC', 'LOG-SERVER', 'RECEPTION-PC-2'], 2], ['Result', ['Success', 'Failed'], 0]];
          $('.five', pane).innerHTML = `<div class="cw-five">${Q.map((q, i) => `<label>${q[0]}?<select class="cw-sel" data-i="${i}"><option value="">— choose —</option>${q[1].map((o, j) => `<option value="${j}">${o}</option>`).join('')}</select></label>`).join('')}<button type="button" class="cw-btn" id="sa-5">Save findings</button></div>`;
          $('#sa-5', pane).addEventListener('click', () => {
            const bad = Q.filter((q, i) => +$(`select[data-i="${i}"]`, pane).value !== q[2] || $(`select[data-i="${i}"]`, pane).value === '').map(q => q[0]);
            if (bad.length) { api.mistake('Check the highlighted log entry again: ' + bad.join(', ') + '.'); return; }
            api.award(15); api.done(2); api.result('good', '✅ <b>Who, What, When, Where, Result</b> — a good log entry answers all five.'); show();
          });
        }
      } else if (want === 'lock') {
        pane.innerHTML = app('SOC Console', '<div class="tm"></div>', { dark: true });
        miniTerm($('.tm', pane), {
          title: 'soc@alnoor-soc — Identity Console', prompt: 'soc$', h: 120, hello: ['Commands: help · whois <user> · lock <user>'],
          run: (c, a, print) => {
            if (c === 'help') { print('whois <user>   show the account\nlock <user>    lock an account at once', 'dim'); return; }
            if (c === 'whois') { print(a === 'reception02' ? 'reception02 · Reception desk · role: Reception · last login 02:00 from RECEPTION-PC-2' : `${a}: see the audit log`, ''); api.result('', '📋 Account details shown.'); return; }
            if (c === 'lock') {
              if (a === 'reception02') { print('Account reception02 LOCKED ✓  all sessions closed', 'ok'); api.award(15); api.done(3); api.result('good', '🔒 <b>reception02 locked.</b> The red line in the room is cut and the siren stops.'); sync(); show(); return; }
              print(`${a || '(no user)'}: not the suspicious account`, 'warn'); api.mistake('Lock the account from the suspicious log entry, not a normal user.'); return;
            }
            print(`${c}: unknown command. Type help.`, 'warn');
          }
        }).focus();
      } else if (want === 'protect') {
        pane.innerHTML = app('Log Server — security event', `<div class="cw-note2 bad">⚠️ <b>02:09:30</b> — reception02 tried to run <b>DELETE audit.log</b> before the lock. The attacker wanted to hide their tracks.</div>
          <div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn gry" id="sa-del">🗑 Delete old logs to save space</button><button type="button" class="cw-btn" id="sa-wo">🛡 Turn on write-once (tamper-proof) logs</button></div>`);
        $('#sa-del', pane).addEventListener('click', () => api.mistake('Deleting logs is exactly what attackers want. Logs must be <b>protected from changes</b>.'));
        $('#sa-wo', pane).addEventListener('click', () => { api.award(15); api.done(4); api.result('good', '🛡 Logs are now <b>write-once</b>: nobody can change or delete them — they stay as evidence.'); sync(); show(); });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🚨</div><h3>Part 1 complete</h3><p>Alert → audit log → 5 questions → account locked → logs protected. Click <b>Next part →</b>.</p></div>';
      const op = $('#sa-open', pane); if (op) op.addEventListener('click', openAlert);
      api.refresh();
    };
    const openAlert = () => { if (api.isDone(0)) return; api.award(10); api.done(0); api.result('good', '🚨 Alert opened: <b>reception02</b> tried to open hundreds of patient files at <b>2:00 AM</b>.'); show(); };
    $('[data-obj="wall"]', body).addEventListener('click', openAlert);
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read the <b>Example</b>.<br>In the 3D SOC, the <b>video wall</b> shows a red SIEM alert and the siren is flashing. Click the <b>video wall</b> (or <kbd>🚨 Open alert #1</kbd> below the room).`;
        if (k === 1) return `📖 Read <b>Security Auditing</b>: every event is written to an <b>Audit Log</b>.<br>In the <b>Audit Log</b> table, click the one suspicious row.`;
        if (k === 2) return `📖 A good log entry answers <b>Who, What, When, Where</b> and <b>Result</b>.<br>Under the log, choose the five answers from the highlighted row, then click <kbd>Save findings</kbd>.`;
        if (k === 3) return `The guide says the account is locked. Click the <b>SOC Console</b>, type <kbd>lock reception02</kbd> and press <kbd>Enter</kbd>. Watch the reception PC and the siren.`;
        return `📖 Logs must be protected — attackers try to <b>Delete Logs</b>.<br>Click the button that keeps the logs safe as evidence. The log server label will change.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 11 · LAB 2 · PART 2 — SIEM rules and live monitoring ==================================== */
PARTS.siemRules = {
  title: 'Continuous Monitoring with a SIEM', guide: 'acModels', q: 'How does a SIEM watch systems around the clock?',
  steps: [
    { t: 'Connect 3 log sources to the SIEM', sec: 'mon' },
    { t: 'Switch on the 3 detection rules from the guide', sec: 'mon' },
    { t: 'Raise alerts on the live event feed', sec: 'mon' },
    { t: 'Explain the benefits of auditing and monitoring', sec: 'ben' }
  ],
  mount(body, api) {
    const SRC = [['srv', 'EHR SERVER', -380, -170], ['fw', 'FIREWALL', -60, -230], ['pc', 'WARD COMPUTERS', -330, 150]];
    const objs =
      obj(220, -60, 0, cube(150, 120, 110, '#0B1220', { fr: '<div class="cw-siembox"><b>SIEM</b><span id="sr-cnt">0 sources</span><span id="sr-al">0 alerts</span></div>' }) + bb('SIEM PLATFORM', 'grn', -95)) +
      server(-380, -170, 'EHR SERVER', { h: 160, id: 'srv' }) +
      obj(-60, -55, -230, cube(160, 110, 26, '#7C2D12', { fr: '<div style="height:100%;background:repeating-linear-gradient(0deg,rgba(251,146,60,.5) 0 2px,transparent 2px 14px),repeating-linear-gradient(90deg,rgba(251,146,60,.5) 0 2px,transparent 2px 14px)"></div>' }) + bb('FIREWALL', '', -80), { id: 'fw' }) +
      pcDesk(-330, 150, '<div class="t">WARD PCs</div>', { w: 170, mw: 110, mh: 70, label: 'WARD COMPUTERS', id: 'pc' }) +
      SRC.map(s => link(s[2], s[3], 220, 0, -70, { id: 'sr-l-' + s[0], c: '#38BDF8', pk: 1 })).join('');
    body.innerHTML = `<div class="cw-card"><h3>📡 Al Noor Hospital — data center</h3><p class="sub">Set up <b>Continuous Monitoring</b>: send logs to the SIEM, switch on rules, then watch the live feed.</p>
      ${scene(objs, { h: 260, s: .6, rx: -18, ry: -8, wy: 84, tag: 'DATA CENTER · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, alerts = 0, decided = 0;
    const conn = new Set();
    const sync = () => {
      if (api.isDone(0)) SRC.forEach(s => conn.add(s[0]));
      SRC.forEach(s => lineSet(body, 'sr-l-' + s[0], conn.has(s[0])));
      $('#sr-cnt', body).textContent = conn.size + ' sources'; $('#sr-al', body).textContent = alerts + ' alerts';
    };
    const connect = id => {
      if (api.isDone(0) || conn.has(id)) return; conn.add(id); api.award(4); sync();
      api.result('good', `📡 <b>${SRC.find(s => s[0] === id)[1]}</b> now sends its logs to the SIEM.`);
      $$('.cw-src', pane).forEach(b => b.classList.toggle('on', conn.has(b.dataset.s)));
      if (conn.size === 3) { api.done(0); api.result('good', '✅ Servers, firewall and computers all send logs to <b>one place</b>.'); show(); } else api.refresh();
    };
    SRC.forEach(s => { const h = $(`[data-obj="${s[0]}"]`, body); if (h) h.addEventListener('click', () => connect(s[0])); });
    const show = () => {
      const k = [0, 1, 2, 3].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : ['src', 'rules', 'feed', 'quiz'][k];
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'src') {
        pane.innerHTML = app('SIEM Setup — log sources', `<div class="cw-hint">Click each source in the 3D room (or here) to send its logs to the SIEM:</div><div class="cw-row" style="margin-top:6px">${SRC.map(s => `<button type="button" class="cw-src${conn.has(s[0]) ? ' on' : ''}" data-s="${s[0]}">${s[1]}</button>`).join('')}</div>`);
        $$('.cw-src', pane).forEach(b => b.addEventListener('click', () => connect(b.dataset.s)));
      } else if (want === 'rules') {
        const RU = [['fail', 'Repeated failed logins', 1], ['toner', 'Printer is low on toner', 0], ['geo', 'Logins from two countries within minutes', 1], ['wall', 'User changed the desktop wallpaper', 0], ['night', 'Large downloads at night', 1]];
        pane.innerHTML = app('SIEM Rules — detection patterns', RU.map(r => `<div class="cw-tg"><span>${r[1]}</span><button type="button" class="cw-sw" data-r="${r[0]}"></button></div>`).join(''));
        $$('[data-r]', pane).forEach(b => b.addEventListener('click', () => {
          const r = RU.find(x => x[0] === b.dataset.r);
          if (!r[2]) { api.mistake(`“${esc(r[1])}” is not a security pattern. The guide lists failed logins, two countries, and night downloads.`); return; }
          b.classList.toggle('on'); const n = RU.filter(x => x[2] && $(`[data-r="${x[0]}"]`, pane).classList.contains('on')).length;
          if (n === 3) { api.award(15); api.done(1); api.result('good', '✅ 3 rules on: <b>failed logins</b>, <b>two countries</b>, <b>night downloads</b>.'); show(); } else { api.result('', `${n} of 3 rules on.`); api.refresh(); }
        }));
      } else if (want === 'feed') {
        pane.innerHTML = app('SIEM Live Feed — 24/7', '<div class="dq"></div>', { dark: true });
        const E = (t, src, a, why) => ({ a, why, src, html: `<div class="cw-ev"><small>${t} · ${src}</small><b>${a === 0 ? '' : ''}${why[0]}</b></div>`, msg: why[1] });
        decider($('.dq', pane), {
          label: 'EVENT', opts: [{ label: '🚨 Raise alert', cls: 'r' }, { label: '✔ Normal', cls: 'g' }],
          items: [E('08:00', 'WARD COMPUTERS', 1, ['dr.huda logged in successfully', 'a normal login.']),
            E('08:02', 'EHR SERVER', 0, ['12 failed logins for dr.omar in 2 minutes', 'repeated failed logins.']),
            E('08:06', 'FIREWALL', 0, ['nurse.laila logged in from Riyadh (08:01) and Brazil (08:06)', 'two countries within minutes.']),
            E('09:15', 'WARD COMPUTERS', 1, ['reception printed the appointment list', 'normal work.']),
            E('03:10', 'EHR SERVER', 0, ['9 GB of patient data downloaded at 03:10 AM', 'a large download at night.'])],
          onShow: it => { const s = SRC.find(x => x[1] === it.src); if (s) glow(body, 'sr-l-' + s[0], true); },
          onRight: it => { decided++; if (it.a === 0) { alerts++; sync(); } api.award(5); api.result('good', `${it.a === 0 ? '🚨 Alert raised' : '✔ Marked normal'} — ${it.msg}`); api.refresh(); },
          onWrong: it => api.mistake(it.a === 0 ? 'This matches a SIEM rule — raise an alert so the SOC can respond fast.' : 'This is normal activity. Too many false alerts hide the real ones.'),
          onDone: () => { api.award(10); api.done(2); api.result('good', `✅ ${alerts} real attacks caught by Continuous Monitoring.`); show(); }
        });
      } else if (want === 'quiz') {
        pane.innerHTML = app('Review — Benefits of Auditing and Monitoring', '<div class="qz"></div>');
        quiz($('.qz', pane), [
          { q: 'Auditing and monitoring help organizations …', o: ['Detect Attacks early', 'Buy cheaper computers', 'Stop using passwords'], a: 0, hint: 'Read Benefits: they help Detect Attacks early.' },
          { q: 'What can investigators use to understand an incident?', o: ['Desktop wallpapers', 'Digital Evidence from the logs', 'Printer settings'], a: 1, hint: 'Logs provide Digital Evidence.' },
          { q: 'Which standard requires organizations to keep and review security logs?', o: ['HTTP', 'Wi-Fi 6', 'ISO 27001'], a: 2, hint: 'The guide names ISO 27001.' }], api, () => { api.award(10); api.done(3); api.result('good', '✅ Users also follow the rules more carefully when actions are <b>Recorded</b>.'); show(); });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">📡</div><h3>Lab complete</h3><p>Your SIEM watches the hospital around the clock. Click <b>Finish lab ✓</b>.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>Continuous Monitoring</b>: a SIEM collects logs from servers, firewalls and computers.<br>Click the <b>EHR server</b>, the <b>firewall</b> and the <b>ward computers</b> in the 3D room (or the buttons below). A blue line appears for each. Connected: <b>${conn.size} of 3</b>.`;
        if (k === 1) return `📖 The SIEM looks for <b>Patterns</b>. Switch on only the 3 patterns named in the guide. Do not switch on the other two.`;
        if (k === 2) return `Events are arriving. For each event in the <b>Live Feed</b>, click <kbd>🚨 Raise alert</kbd> if it matches a rule, or <kbd>✔ Normal</kbd>. The alert counter on the SIEM goes up. Done: <b>${decided} of 5</b>.`;
        return `📖 Read <b>Benefits</b>. Answer the 3 questions below the room.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 12 · LAB 1 · PART 1 — joiner day at a school ==================================== */
PARTS.joinerDay = {
  title: 'Joiner Day: IAM, MFA & Smart Card', guide: 'acTools', q: 'How do identity tools give a new user safe access?',
  steps: [
    { t: 'Read the HR email about the new teacher', sec: 'ex' },
    { t: 'Create the account in the IAM System', sec: 'iam' },
    { t: 'Set up MFA with the Authenticator App', sec: 'iam' },
    { t: 'Print a smart card and open the staff-room door', sec: 'net' },
    { t: 'Sign in once with Single Sign-On (SSO)', sec: 'iam' }
  ],
  mount(body, api) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const objs =
      pcDesk(-40, 40, '<div class="t">IAM CONSOLE</div><div class="d" id="jd-scr">Users: 214<br>New: —</div>', { label: 'IT OFFICE · IAM SYSTEM', w: 240 }) +
      phone3d(70, -97, 60, '<div id="jd-ph">📱<br>Authenticator<br>not set up</div>', '') +
      obj(-210, -112, 50, cube(70, 34, 50, '#E5E7EB', { fr: '<div style="font:700 9px var(--mono);color:#334155;padding:6px">CARD<br>PRINTER</div>', tc: '#CBD5E1' }), { id: 'printer' }) + card3d(-210, -132, 95, 'jd-card') +
      door(-380, -150, 'jd-door', 'STAFF ROOM') +
      person(170, 130, '👨‍🏫', 'MR. FAISAL · NEW TEACHER', { c: '#1E3A8A', lid: 'jd-fb' }) +
      ['LMS', 'EMAIL', 'GRADES'].map((a, i) => obj(120 + i * 120, -60 - i * 0, -200, cube(90, 120, 20, '#1E293B', { fr: `<div class="cw-mon" style="display:grid;place-items:center;font-size:20px">${['📚', '✉️', '📝'][i]}</div>` }) + bb('🔒 ' + a, 'red', -82, 'jd-app' + i))).join('');
    body.innerHTML = `<div class="cw-card"><h3>🏫 Future Leaders School — IT office, 07:30</h3><p class="sub">You are the <b>IT administrator</b>. A new teacher starts today. Give him safe access with the school's tools.</p>
      ${scene(objs, { h: 270, s: .6, rx: -18, ry: -10, wy: 86, tag: 'IT OFFICE · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, card = false;
    const sync = () => {
      if (api.isDone(1)) { $('#jd-scr', body).innerHTML = 'Users: 215<br>New: faisal.khan ✓'; const b = $('#jd-fb', body); b.textContent = 'MR. FAISAL · TEACHER ✓'; b.classList.add('grn'); }
      if (api.isDone(2)) { const p = $('#jd-ph', body); p.innerHTML = '📱<br>MFA<br>READY ✓'; p.style.color = '#4ADE80'; }
      if (api.isDone(3) || card) $('#jd-card', body).classList.remove('cw-gone');
      if (api.isDone(3)) { $('#jd-door', body).classList.add('open'); $('#jd-door-rd', body).classList.add('ok'); }
      if (api.isDone(4)) [0, 1, 2].forEach(i => { const b = $('#jd-app' + i, body); b.textContent = '✓ ' + ['LMS', 'EMAIL', 'GRADES'][i]; b.classList.remove('red'); b.classList.add('grn'); });
    };
    const printCard = () => { if (!api.isDone(1) || card || api.isDone(3)) { if (!api.isDone(1)) api.result('', 'Create the IAM account first.'); return; } card = true; sync(); api.award(5); api.result('good', '💳 Smart card printed. Now tap it on the <b>door reader</b>.'); api.refresh(); };
    const tap = () => { if (api.isDone(3)) return; if (!card) { api.result('', 'Print the smart card first — click the card printer.'); return; } api.award(10); api.done(3); api.result('good', '🚪 Beep! The reader turns green and the staff-room door opens for Mr. Faisal.'); sync(); show(); };
    $('[data-obj="printer"]', body).addEventListener('click', printCard); $('[data-obj="jd-door-reader"]', body).addEventListener('click', tap);
    const show = () => {
      const k = [0, 1, 2, 3, 4].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : ['mail', 'iam', 'mfa', 'card', 'sso'][k];
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'mail') {
        pane.innerHTML = app('School Mail — it.admin@futureleaders.edu.sa', '<div class="mbx"></div>');
        mailbox($('.mbx', pane), [{ id: 'h', from: 'HR Office', subj: 'New teacher starts today', time: '07:28', body: '<p>Good morning,</p><p><b>Mr. Faisal Khan</b> joins the <b>Science</b> department today as a <b>Teacher</b>. Please set up: one IAM account (username <b>faisal.khan</b>), MFA, and a smart card for the staff room.</p><p>HR Office</p>',
          actions: [['👍 Got it — start setup', () => { api.award(5); api.done(0); api.result('good', '📩 Setup list: IAM account → MFA → smart card → SSO.'); show(); }, '']] },
          { id: 'n', from: 'Newsletter', subj: 'Sports day photos', time: 'Yesterday', body: '<p>See the photos on the school website.</p>' }]);
      } else if (want === 'iam') {
        pane.innerHTML = app('IAM System — New user (one central place)', `<div class="cw-form2"><label>Username<input class="cw-field" id="jd-u" autocomplete="off" placeholder="name.surname"></label><label>Department<select class="cw-sel" id="jd-d"><option>Science</option><option>Finance</option><option>Sports</option></select></label><label>Role<select class="cw-sel" id="jd-r"><option value="">— choose —</option><option>Student</option><option>Teacher</option><option>Administrator</option></select></label></div><button type="button" class="cw-btn" id="jd-c" style="margin-top:8px">Create account</button>`);
        $('#jd-c', pane).addEventListener('click', () => {
          const u = $('#jd-u', pane).value.trim().toLowerCase(), r = $('#jd-r', pane).value, d = $('#jd-d', pane).value;
          if (u !== 'faisal.khan') { api.mistake('Use the username from the HR email: <b>faisal.khan</b>.'); return; }
          if (r !== 'Teacher') { api.mistake(r === 'Administrator' ? 'Administrator gives more rights than he needs — that is <b>Excessive Permissions</b>.' : 'Mr. Faisal is a <b>Teacher</b>.'); return; }
          if (d !== 'Science') { api.mistake('He joins the <b>Science</b> department.'); return; }
          api.award(15); api.done(1); api.result('good', '✅ Account <b>faisal.khan</b> created in IAM with the <b>Teacher</b> role.'); sync(); show();
        });
      } else if (want === 'mfa') {
        pane.innerHTML = app('IAM — Enrol MFA', `<div class="cw-row"><div class="cw-qr" id="jd-qr">▚▞▚<br>▞▚▞<br>▚▞▚</div><div style="flex:1"><p style="margin:0 0 6px">1. Click <b>Scan QR</b> — the phone on the desk opens the Authenticator App.</p><button type="button" class="cw-btn gry" id="jd-scan">📷 Scan QR</button>
          <div class="cw-row" style="margin-top:8px"><input class="cw-field" id="jd-code" maxlength="7" placeholder="6-digit code" style="width:150px" disabled><button type="button" class="cw-btn" id="jd-ver" disabled>Verify</button></div></div></div>`);
        $('#jd-scan', pane).addEventListener('click', () => { const p = $('#jd-ph', body); p.innerHTML = `📱<br>Authenticator<br><b style="font-size:13px;color:#fff">${code.slice(0, 3)} ${code.slice(3)}</b>`; $('#jd-code', pane).disabled = false; $('#jd-ver', pane).disabled = false; $('#jd-code', pane).focus(); api.result('', '📱 Code shown on the phone in the 3D office. Type it in.'); });
        $('#jd-ver', pane).addEventListener('click', () => { if ($('#jd-code', pane).value.replace(/\D/g, '') !== code) { api.mistake('Type the 6-digit code shown on the phone on the desk.'); return; } api.award(15); api.done(2); api.result('good', '✅ <b>Authenticator App</b> linked: every login now needs a second factor.'); sync(); show(); });
      } else if (want === 'card') {
        pane.innerHTML = app('Physical Access — Smart Cards', `<div class="cw-row"><button type="button" class="cw-btn gry" id="jd-pr">🖨 Print smart card</button><button type="button" class="cw-btn" id="jd-tap">💳 Tap card on door reader</button></div><div class="cw-hint" style="margin-top:6px">You can also click the <b>card printer</b> and the <b>door reader</b> in the 3D room.</div>`);
        $('#jd-pr', pane).addEventListener('click', printCard); $('#jd-tap', pane).addEventListener('click', tap);
      } else if (want === 'sso') {
        pane.innerHTML = app('Single Sign-On — Mr. Faisal’s first login', `<div class="cw-row"><span style="flex:1">One login for all approved apps: <b>LMS</b>, <b>Email</b>, <b>Grades</b>.</span><button type="button" class="cw-btn" id="jd-sso">🔑 Sign in once (SSO)</button></div><div class="push"></div>`);
        $('#jd-sso', pane).addEventListener('click', () => {
          $('.push', pane).innerHTML = `<div class="cw-push"><b>📱 Approve sign-in?</b><small>faisal.khan · Future Leaders SSO · just now · you started this</small><div class="cw-row"><button type="button" class="cw-btn red" id="jd-no">Deny</button><button type="button" class="cw-btn" id="jd-yes">Approve</button></div></div>`;
          $('#jd-no', pane).addEventListener('click', () => api.mistake('Mr. Faisal started this sign-in himself, so it is safe to approve. Only reject requests you did <b>not</b> start.'));
          $('#jd-yes', pane).addEventListener('click', () => { api.award(15); api.done(4); api.result('good', '✅ <b>SSO</b>: one login, and LMS, Email and Grades all unlock.'); sync(); show(); });
        });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🏫</div><h3>Part 1 complete</h3><p>One IAM account gave the role, MFA, a smart card and SSO. Click <b>Next part →</b>.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read the <b>Example</b> — a new employee gets one account through the <b>IAM System</b>.<br>In <b>School Mail</b>, click the HR email, read it, then click <kbd>👍 Got it — start setup</kbd>.`;
        if (k === 1) return `📖 Read <b>IAM</b>: accounts are created from one central place.<br>In the <b>IAM System</b> form, type <kbd>faisal.khan</kbd>, choose <b>Science</b> and the role <b>Teacher</b>, then click <kbd>Create account</kbd>. His label in the room will change.`;
        if (k === 2) return `📖 <b>Authenticator Apps</b> add a second factor.<br>Click <kbd>📷 Scan QR</kbd>, read the 6-digit code on the <b>phone on the desk</b>, type it, then click <kbd>Verify</kbd>.`;
        if (k === 3) return `📖 Read <b>Network & Physical</b>: <b>Smart Cards</b> control who enters rooms.<br>Click the <b>card printer</b> (or <kbd>🖨 Print smart card</kbd>), then the <b>door reader</b> next to the staff-room door (or <kbd>💳 Tap card</kbd>). The door will open.`;
        return `📖 <b>SSO</b>: log in once and reach all approved apps.<br>Click <kbd>🔑 Sign in once (SSO)</kbd>. Mr. Faisal started this login, so approve the push. The three app labels unlock.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 12 · LAB 1 · PART 2 — defense in depth ==================================== */
PARTS.defenseDepth = {
  title: 'Defense in Depth', guide: 'acTools', q: 'How do layers of tools protect the network?',
  steps: [
    { t: 'Give the admin Just-in-Time access with PAM', sec: 'pam' },
    { t: 'Write a firewall rule to block the attacker', sec: 'net' },
    { t: 'Check 3 devices with NAC', sec: 'net' },
    { t: 'Connect the teacher at home through the VPN', sec: 'net' },
    { t: 'Disable every account of a teacher who left', sec: 'ex' }
  ],
  mount(body, api) {
    const DEV = [['a', 'LAPTOP-A', -150, 150], ['b', 'LAPTOP-B', -20, 170], ['c', 'TABLET-C', 110, 150]];
    const objs =
      obj(0, -40, 0, cube(160, 30, 70, '#1F2937', { fr: '<div style="padding:5px 8px;font:700 10px var(--mono);color:#7DD3FC">NAC SWITCH ▮▮▮▮▮▮▮▮</div>' }) + bb('SCHOOL NETWORK · NAC', '', -45)) +
      obj(260, -90, -40, cube(16, 180, 200, 'rgba(234,88,12,.35)') + bb('FIREWALL', '', -110, 'dd-fwb'), { domId: 'dd-fw' }) +
      server(430, -40, 'ATTACKER 203.0.113.45', { h: 120, red: 1, bc: 'red' }) + link(430, -40, 0, 0, -60, { id: 'dd-l-att', c: '#EF4444', pk: 1, on: 1 }) +
      vault(-230, -170, 'PAM VAULT', '#334155', 'dd-v') + server(-100, -200, 'EXAM SERVER', { h: 140 }) +
      DEV.map(d => obj(d[2], -10, d[3], plane(70, 46, '', 'background:#334155;border-radius:4px') + cube(70, 44, 4, '#0F172A', { fr: `<div class="cw-mon" style="font-size:9px">${d[1]}</div>` }) + bb(d[1], '', -50, 'dd-db-' + d[0])) + link(d[2], d[3], 0, 0, -20, { id: 'dd-l-' + d[0], c: '#22C55E' })).join('') +
      obj(-430, -60, 120, cube(120, 120, 100, '#78350F', { tc: '#9A3412' }) + bb('🏠 MS. SARA · HOME', '', -90)) + link(-430, 120, 0, 0, -60, { id: 'dd-l-vpn', c: '#A855F7', pk: 1 }) +
      obj(-330, -250, -40, bb('👤 HAMAD (LEFT) · ACTIVE', 'red', 0, 'dd-hb'));
    body.innerHTML = `<div class="cw-card"><h3>🛡️ Future Leaders School — network operations</h3><p class="sub">No single tool stops every attack. Add each layer: <b>PAM</b>, <b>firewall</b>, <b>NAC</b>, <b>VPN</b>, and clean <b>IAM</b>.</p>
      ${scene(objs, { h: 270, s: .56, rx: -20, ry: -6, wy: 82, tag: 'SCHOOL NETWORK · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, nac = 0;
    const sync = () => {
      if (api.isDone(0)) { glow(body, 'dd-v', true); $('#dd-v-st', body).textContent = '⏱ 60:00'; }
      if (api.isDone(1)) { lineSet(body, 'dd-l-att', 0); const b = $('#dd-fwb', body); b.textContent = 'FIREWALL · BLOCK 203.0.113.45:3389'; b.classList.add('grn'); }
      if (api.isDone(3)) lineSet(body, 'dd-l-vpn', 1);
      if (api.isDone(4)) { const b = $('#dd-hb', body); b.textContent = '👤 HAMAD · ALL ACCESS DISABLED'; b.classList.remove('red'); b.classList.add('grn'); }
    };
    const show = () => {
      const k = [0, 1, 2, 3, 4].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : ['pam', 'fw', 'nac', 'vpn', 'leaver'][k];
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'pam') {
        pane.innerHTML = app('PAM — Request privileged access', `<div class="cw-note2">🧑‍💻 <b>Mr. Yasir (IT)</b> must update the exam server tonight. He needs the <b>admin.exams</b> account.</div><div class="cw-form2" style="margin-top:8px"><label>Account<input class="cw-field" value="admin.exams" disabled></label><label>Duration<select class="cw-sel" id="dd-dur"><option value="">— choose —</option><option value="perm">Permanent admin rights</option><option value="jit">1 hour (Just-in-Time)</option></select></label><label>Record session<select class="cw-sel" id="dd-rec"><option value="">— choose —</option><option value="y">Yes — record every action</option><option value="n">No recording</option></select></label></div><button type="button" class="cw-btn" id="dd-req" style="margin-top:8px">Approve request</button>`);
        $('#dd-req', pane).addEventListener('click', () => {
          const d = $('#dd-dur', pane).value, r = $('#dd-rec', pane).value;
          if (d !== 'jit') { api.mistake('PAM gives <b>Just-in-Time Access</b> for a short period — never permanent admin rights.'); return; }
          if (r !== 'y') { api.mistake('PAM <b>records every session</b> of powerful accounts.'); return; }
          api.award(15); api.done(0); api.result('good', '⏱ The vault releases the admin password for <b>60 minutes</b>, and the session is recorded. Rights are removed when the task is finished.'); sync(); show();
        });
      } else if (want === 'fw') {
        const sel = (id, o) => `<select class="cw-sel" id="${id}"><option value="">—</option>${o.map(x => `<option>${x}</option>`).join('')}</select>`;
        pane.innerHTML = app('Firewall — new rule', `<div class="cw-note2 bad">🚨 <b>203.0.113.45</b> tried to log in on <b>port 3389 (Remote Desktop)</b> 400 times in 5 minutes. See the red line in the room.</div><div class="cw-form2" style="margin-top:8px"><label>Action${sel('fw-a', ['Allow', 'Block'])}</label><label>Source IP${sel('fw-ip', ['Any', '203.0.113.45', '10.0.0.23'])}</label><label>Port${sel('fw-p', ['80 (web)', '443 (web)', '3389 (Remote Desktop)'])}</label></div><button type="button" class="cw-btn" id="fw-add" style="margin-top:8px">Add rule</button>`);
        $('#fw-add', pane).addEventListener('click', () => {
          const v = id => $('#' + id, pane).value, e = [];
          if (v('fw-a') !== 'Block') e.push('the action must <b>Block</b>'); if (v('fw-ip') !== '203.0.113.45') e.push('the source IP is <b>203.0.113.45</b>'); if (!v('fw-p').startsWith('3389')) e.push('the port is <b>3389</b>');
          if (e.length) { api.mistake('A firewall rule uses IP address, port and application: ' + e.join(', ') + '.'); return; }
          api.award(15); api.done(1); api.result('good', '🧱 Rule added. The attacker\'s red line is cut at the firewall.'); sync(); show();
        });
      } else if (want === 'nac') {
        pane.innerHTML = app('NAC — devices joining the network', '<div class="dq"></div>', { dark: true });
        decider($('.dq', pane), {
          label: 'DEVICE', opts: [{ label: '✅ Allow', cls: 'g' }, { label: '⛔ Block', cls: 'r' }],
          items: [{ id: 'a', a: 0, why: 'updates and antivirus are OK.', html: reqCard([['Updates', 'Installed today', 'g'], ['Antivirus', 'ON', 'g']], '💻 LAPTOP-A (teacher)') },
            { id: 'b', a: 1, why: 'it has no updates for 94 days.', html: reqCard([['Updates', 'Missing — 94 days', 'r'], ['Antivirus', 'ON', 'g']], '💻 LAPTOP-B (guest)') },
            { id: 'c', a: 1, why: 'it has no antivirus.', html: reqCard([['Updates', 'Installed', 'g'], ['Antivirus', 'NONE', 'r']], '📱 TABLET-C (student)') }],
          onRight: it => { nac++; lineSet(body, 'dd-l-' + it.id, 1, it.a === 0 ? '#22C55E' : '#EF4444'); const b = $('#dd-db-' + it.id, body); b.textContent += it.a === 0 ? ' ✓' : ' ⛔'; b.classList.add(it.a === 0 ? 'grn' : 'red'); api.award(5); api.result('good', `${it.a === 0 ? '✅ Allowed' : '⛔ Blocked'} — ${it.why}`); api.refresh(); },
          onWrong: () => api.mistake('NAC blocks devices <b>without updates or antivirus</b>.'),
          onDone: () => { api.award(10); api.done(2); api.result('good', '✅ NAC checked every device before it joined the network.'); show(); }
        });
      } else if (want === 'vpn') {
        pane.innerHTML = app('Remote access — Ms. Sara at home', `<div class="cw-note2">🏠 Ms. Sara wants to mark exams from home tonight over her home Wi-Fi.</div><div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn gry" id="vp-no">🌐 Open the school server directly over the internet</button><button type="button" class="cw-btn" id="vp-yes">🔐 Connect with the school VPN</button></div>`);
        $('#vp-no', pane).addEventListener('click', () => api.mistake('Without a VPN the connection is not encrypted. A <b>VPN</b> creates an encrypted tunnel for remote users.'));
        $('#vp-yes', pane).addEventListener('click', () => { api.award(15); api.done(3); api.result('good', '🔐 Purple tunnel: the <b>VPN</b> encrypts everything between her home and the school.'); sync(); show(); });
      } else if (want === 'leaver') {
        pane.innerHTML = app('IAM — HR notice', `<div class="cw-note2 bad">📢 <b>HR:</b> Mr. Hamad left the school yesterday. His account, card and permissions are still <b>active</b>.</div><div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn gry" id="lv-1">📧 Delete only his email</button><button type="button" class="cw-btn gry" id="lv-2">⏳ Wait until the end of the year</button><button type="button" class="cw-btn red" id="lv-3">⛔ Disable all accounts, cards and permissions</button></div>`);
        $('#lv-1', pane).addEventListener('click', () => api.mistake('His card and other accounts would stay active. One click in IAM can disable <b>everything</b>.'));
        $('#lv-2', pane).addEventListener('click', () => api.mistake('Forgotten accounts of former staff become an easy <b>Entry Point</b> for attackers.'));
        $('#lv-3', pane).addEventListener('click', () => { api.award(15); api.done(4); api.result('good', '✅ One click in IAM disabled every account, card and permission at once.'); sync(); show(); });
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🛡️</div><h3>Lab complete</h3><p>PAM, firewall, NAC, VPN and IAM now protect the school in layers — Defense in Depth. Click <b>Finish lab ✓</b>.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>PAM</b>: admins get <b>Just-in-Time Access</b> and every session is recorded.<br>In the <b>PAM</b> form choose <b>1 hour (Just-in-Time)</b> and <b>Yes — record every action</b>, then click <kbd>Approve request</kbd>. Watch the vault.`;
        if (k === 1) return `📖 A <b>Firewall</b> blocks traffic by IP address, port and application.<br>Set Action <b>Block</b>, Source IP <b>203.0.113.45</b>, Port <b>3389</b>, then click <kbd>Add rule</kbd>. The red attack line will be cut.`;
        if (k === 2) return `📖 <b>NAC</b> blocks devices without updates or antivirus.<br>For each device, read the checks (red = problem) and click <kbd>✅ Allow</kbd> or <kbd>⛔ Block</kbd>. Its line turns green or red. Done: <b>${nac} of 3</b>.`;
        if (k === 3) return `📖 A <b>VPN</b> creates an encrypted tunnel for remote users.<br>Choose the safe way for Ms. Sara to connect. A purple tunnel will appear from her home.`;
        return `📖 The <b>Example</b>: if an employee leaves, a single click in IAM disables everything.<br>Choose the right action for Mr. Hamad. His red label will turn green.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 12 · LAB 2 · PART 1 — Zero Trust gateway ==================================== */
PARTS.zeroTrust = {
  title: 'Zero Trust Gateway', guide: 'acTools', q: 'Why never trust and always verify?',
  steps: [
    { t: 'Decide request 1 — Dr. Huda at the clinic', sec: 'zt' },
    { t: 'Decide request 2 — a second country', sec: 'zt' },
    { t: 'Decide request 3 — a new tablet at night', sec: 'zt' },
    { t: 'Decide request 4 — inside the network', sec: 'zt' }
  ],
  mount(body, api) {
    const CH = [['id', 'IDENTITY'], ['dev', 'DEVICE HEALTH'], ['loc', 'LOCATION'], ['beh', 'BEHAVIOR']];
    const objs =
      CH.map((c, i) => obj(-210 + i * 140, -90, 0, cube(44, 180, 40, '#1F2937', { fr: `<div class="cw-pil" id="zt-p-${c[0]}"><span>${c[1]}</span></div>` }))).join('') +
      obj(0, -195, 0, cube(500, 18, 50, '#334155') + bb('ZERO TRUST GATEWAY · NEVER TRUST, ALWAYS VERIFY', 'grn', -40)) +
      server(0, -320, 'PATIENT RECORDS', { h: 170 }) + obj(0, -150, 210, bb('…', '', 0, 'zt-who')) +
      link(0, 210, 0, -320, -40, { id: 'zt-l', c: '#22C55E', pk: 1 }) + obj(0, -40, 230, cube(40, 80, 26, '#1E3A8A') + '<div class="cw-av" style="top:-82px" id="zt-av">👤</div>');
    body.innerHTML = `<div class="cw-card"><h3>🔐 Al Noor Clinic — Zero Trust Gateway</h3><p class="sub">Every login request is checked against <b>identity, device health, location and behavior</b> — even inside the network.</p>
      ${scene(objs, { h: 280, s: .6, rx: -16, ry: -12, wy: 80, tag: 'ZERO TRUST · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body);
    const RQ = [
      { av: '👩‍⚕️', who: 'Dr. Huda', s: { id: ['dr.huda + MFA ✓', 'g'], dev: ['Clinic laptop · updated · antivirus ON', 'g'], loc: ['Al Noor Clinic, Riyadh', 'g'], beh: ['08:05 · usual start time', 'g'] }, a: 0, why: 'every check is green.' },
      { av: '❓', who: 'dr.huda (again)', s: { id: ['dr.huda · password only', 'a'], dev: ['Unknown PC', 'r'], loc: ['Brazil — 4 minutes after Riyadh', 'r'], beh: ['Two countries within minutes', 'r'] }, a: 2, why: 'nobody travels from Riyadh to Brazil in 4 minutes — this is a stolen account.' },
      { av: '👩‍⚕️', who: 'Nurse Laila', s: { id: ['nurse.laila', 'g'], dev: ['New personal tablet · updated', 'a'], loc: ['Home, Riyadh', 'a'], beh: ['21:40 · unusual time', 'a'] }, a: 1, why: 'nothing is clearly bad, but it looks unusual — ask for extra verification (MFA).' },
      { av: '🧑‍💻', who: 'admin.it', s: { id: ['admin.it', 'g'], dev: ['Server-room PC · antivirus OFF', 'r'], loc: ['Inside the clinic network', 'g'], beh: ['03:00 · copying 5,000 records', 'r'] }, a: 2, why: 'being inside the network is not enough — bad device health and strange behavior.' }];
    const C = { g: '#22C55E', a: '#F59E0B', r: '#EF4444' };
    const paint = (r) => {
      $('#zt-av', body).textContent = r.av; $('#zt-who', body).textContent = '→ ' + r.who.toUpperCase();
      CH.forEach(c => { const p = $('#zt-p-' + c[0], body); p.style.background = C[r.s[c[0]][1]]; p.style.boxShadow = `0 0 24px ${C[r.s[c[0]][1]]}`; });
      lineSet(body, 'zt-l', 0);
    };
    const first = RQ.findIndex((r, i) => !api.isDone(i));
    if (first < 0) pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🔐</div><h3>Part 1 complete</h3><p>Every request was verified — never trusted. Click <b>Next part →</b>.</p></div>';
    else {
      pane.innerHTML = app('Zero Trust Policy Engine — real-time decision', '<div class="dq"></div>', { dark: true });
      decider($('.dq', pane), {
        start: first, label: 'LOGIN REQUEST', opts: [{ label: '✅ Allow', cls: 'g' }, { label: '🔑 Ask extra verification', cls: 'a' }, { label: '⛔ Block access', cls: 'r' }],
        items: RQ.map(r => ({ a: r.a, r, html: reqCard(CH.map(c => [c[1], r.s[c[0]][0], r.s[c[0]][1]]), `${r.av} ${r.who}`) })),
        onShow: it => paint(it.r),
        onRight: (it, i) => { lineSet(body, 'zt-l', 1, C[['g', 'a', 'r'][it.a]]); api.award(12); api.done(i); api.result('good', `${['✅ Allowed', '🔑 Extra verification', '⛔ Blocked'][it.a]} — ${it.r.why}`); api.refresh(); },
        onWrong: (it) => api.mistake('Look at the four scanners: green = OK, amber = unusual, red = risky. If anything looks risky, ask for extra verification or <b>Block Access</b>.'),
        onDone: () => { pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">🔐</div><h3>Part 1 complete</h3><p>Every request was verified — never trusted. Click <b>Next part →</b>.</p></div>'; api.refresh(); }
      });
    }
    return {
      guide(k) {
        const hint = ['all four checks', 'the LOCATION and BEHAVIOR scanners', 'the amber scanners', 'DEVICE HEALTH and BEHAVIOR — even inside the network'][k];
        return `📖 Read <b>Zero Trust</b>: never trust, always verify.<br>Look at the 4 scanner pillars in the 3D gateway (green = OK, amber = unusual, red = risky) — check <b>${hint}</b>. Then click <kbd>✅ Allow</kbd>, <kbd>🔑 Ask extra verification</kbd> or <kbd>⛔ Block access</kbd>.`;
      }, cleanup() {}
    };
  }
};

/* ==================================== WEEK 12 · LAB 2 · PART 2 — common mistakes ==================================== */
PARTS.commonMistakes = {
  title: 'Fix the Common Mistakes', guide: 'acTools', q: 'Which mistakes make access control tools fail?',
  steps: [
    { t: 'Stop the MFA Fatigue attack on the phone', sec: 'mist' },
    { t: 'Handle the fake “IT support” call', sec: 'mist' },
    { t: 'Fix the forgotten account', sec: 'mist' },
    { t: 'Fix the shared account', sec: 'mist' },
    { t: 'Fix the excessive permissions', sec: 'mist' },
    { t: "Send every tool's logs to the SIEM", sec: 'eff' }
  ],
  mount(body, api) {
    const TOOLS = [['iam', 'IAM', -330, -150], ['fw', 'FIREWALL', -190, -290], ['vpn', 'VPN', 190, -290], ['nac', 'NAC', 330, -150]];
    const objs =
      pcDesk(-40, 110, '<div class="t">IAM ACCOUNT REVIEW</div><div class="d" id="cm-scr">Issues: 3</div>', { label: "DR. HUDA'S DESK · 01:12 AM", w: 230 }) +
      phone3d(60, -97, 120, '<div id="cm-ph" style="font-size:13px">📱<br><b style="color:#F87171">Approve<br>sign-in?</b></div>') +
      obj(0, -70, -260, cube(150, 140, 90, '#1E293B', { fr: '<div class="cw-siembox"><b>SIEM</b><span id="cm-n">0 / 4 tools</span></div>' }) + bb('SIEM', 'grn', -100)) +
      TOOLS.map(t => obj(t[2], -40, t[3], cube(70, 80, 50, '#334155', { fr: `<div class="cw-mon" style="font-size:10px">${t[1]}</div>` }) + bb(t[1], '', -62)) + link(t[2], t[3], 0, -260, -50, { id: 'cm-l-' + t[0], c: '#38BDF8', pk: 1 })).join('');
    body.innerHTML = `<div class="cw-card"><h3>🏥 Al Noor Clinic — night shift, 01:12 AM</h3><p class="sub">Dr. Huda's phone keeps buzzing. Then you review the clinic's accounts and tools.</p>
      ${scene(objs, { h: 270, s: .62, rx: -20, ry: -6, wy: 80, tag: 'CLINIC OFFICE · 3D' })}<div class="pane"></div></div>`;
    const pane = $('.pane', body); let cur = null, denied = 0, timer = null;
    const sync = () => {
      const p = $('#cm-ph', body);
      if (api.isDone(0) && api.isDone(1)) { p.innerHTML = '📱<br><b style="color:#4ADE80">Reported<br>✓</b>'; }
      const fixed = [2, 3, 4].filter(i => api.isDone(i)).length; $('#cm-scr', body).innerHTML = `Issues: ${3 - fixed}`;
      const n = TOOLS.filter(t => $('#cm-l-' + t[0], body).classList.contains('on')).length; $('#cm-n', body).textContent = n + ' / 4 tools';
    };
    const show = () => {
      if (timer) { clearInterval(timer); timer = null; }
      const k = [0, 1, 2, 3, 4, 5].find(i => !api.isDone(i));
      const want = k === undefined ? 'done' : k === 0 ? 'push' : k === 1 ? 'call' : k <= 4 ? 'review' : 'siem';
      if (want === cur) { api.refresh(); return; } cur = want;
      if (want === 'push') {
        pane.innerHTML = app('📱 Dr. Huda’s phone — Authenticator', '<div class="cw-push big"><b>Approve sign-in for dr.huda?</b><small id="cm-pi">Request 1 · 01:12 AM · Unknown location · You did not start this</small><div class="cw-row"><button type="button" class="cw-btn" id="cm-ap">Approve</button><button type="button" class="cw-btn red" id="cm-dn">Deny</button></div><div class="cw-hint" id="cm-cnt">Denied: 0 of 3</div></div>');
        let n = 1; const ph = $('#cm-ph', body);
        timer = setInterval(() => { if (!body.isConnected) { clearInterval(timer); return; } n++; const pi = $('#cm-pi', pane); if (pi) pi.textContent = `Request ${n} · 01:1${2 + Math.min(n, 7)} AM · Unknown location · You did not start this`; flash(ph, 'cw-shake'); }, 2500);
        $('#cm-ap', pane).addEventListener('click', () => api.mistake('<b>MFA Fatigue!</b> The attacker hopes a tired user taps Approve. Reject any request you did not start.'));
        $('#cm-dn', pane).addEventListener('click', () => { denied++; $('#cm-cnt', pane).textContent = `Denied: ${denied} of 3`; flash(ph, 'cw-shake'); api.result('good', `⛔ Request denied (${denied} of 3).`);
          if (denied >= 3) { api.award(15); api.done(0); api.result('good', '✅ You rejected every push you did not start — the MFA Fatigue attack failed.'); sync(); show(); } else api.refresh(); });
      } else if (want === 'call') {
        pane.innerHTML = app('📞 Incoming call — +966 50 000 4471', '<div class="cw-call"><div class="ring">📞</div><div><b>“Hello, this is IT Support. We are fixing your account. Please tap <u>Approve</u> on the next request so we can finish.”</b></div></div><div class="cw-row" style="margin-top:8px"><button type="button" class="cw-btn gry" id="cm-c1">👍 Tap Approve to help IT</button><button type="button" class="cw-btn red" id="cm-c2">📵 Hang up and report it to the SOC</button></div>');
        $('#cm-c1', pane).addEventListener('click', () => api.mistake('Real IT never asks you to approve a push you did not start. This is part of the MFA Fatigue attack.'));
        $('#cm-c2', pane).addEventListener('click', () => { api.award(15); api.done(1); api.result('good', '📵 Call ended and reported. Users must reject any request they did not start.'); sync(); show(); });
      } else if (want === 'review') {
        const ROWS = [
          { k: 2, u: 'k.alsaleh', info: 'Former nurse · left January 2025 · account ACTIVE', ok: 'dis', why: 'Accounts of former staff become an easy Entry Point.' },
          { k: 3, u: 'nurses-station', info: 'One login shared by 6 nurses', ok: 'split', why: 'With a shared account the Audit Log cannot show who did what.' },
          { k: 4, u: 'r.fahad', info: 'Receptionist · has Domain Admin rights', ok: 'rm', why: 'Excessive Permissions break the Least Privilege rule.' },
          { k: -1, u: 'dr.huda', info: 'Doctor · Doctor role · MFA on', ok: 'keep', why: '' }];
        const OPT = [['keep', 'Keep'], ['dis', 'Disable'], ['split', 'Give each person their own account'], ['rm', 'Remove extra rights']];
        pane.innerHTML = app('IAM — Account review', `<table class="cw-mx acc">${ROWS.map((r, i) => `<tr data-i="${i}"${r.k >= 0 && api.isDone(r.k) ? ' class="okr"' : ''}><td><b>${r.u}</b><small>${r.info}</small></td><td>${OPT.map(o => `<button type="button" class="cw-ob" data-o="${o[0]}">${o[1]}</button>`).join('')}</td></tr>`).join('')}</table>`);
        $$('.cw-mx.acc tr', pane).forEach(tr => $$('.cw-ob', tr).forEach(b => b.addEventListener('click', () => {
          const r = ROWS[+tr.dataset.i], o = b.dataset.o;
          if (r.k >= 0 && api.isDone(r.k)) return;
          if (r.k < 0) { if (o === 'keep') api.result('good', '✔ dr.huda is correct — keep it.'); else api.mistake('dr.huda has the right role and MFA — nothing to fix.'); return; }
          if (o !== r.ok) { api.mistake(`Not the right fix for <b>${r.u}</b>. ${r.why}`); return; }
          tr.classList.add('okr'); b.classList.add('on'); api.award(12); api.done(r.k); api.result('good', `✅ <b>${r.u}</b> fixed. ${r.why}`); sync();
          if ([2, 3, 4].every(i => api.isDone(i))) show(); else api.refresh();
        })));
      } else if (want === 'siem') {
        pane.innerHTML = app('Using tools effectively — send logs to the SIEM', `${TOOLS.map(t => `<div class="cw-tg"><span>${t[1]} logs → SIEM</span><button type="button" class="cw-sw" data-t="${t[0]}"></button></div>`).join('')}<div class="cw-tg"><span>Book <b>Security Awareness</b> training for all staff</span><button type="button" class="cw-sw" data-t="train"></button></div>`);
        $$('[data-t]', pane).forEach(b => b.addEventListener('click', () => {
          b.classList.toggle('on'); if (b.dataset.t !== 'train') lineSet(body, 'cm-l-' + b.dataset.t, b.classList.contains('on')); sync();
          const all = $$('[data-t]', pane).every(x => x.classList.contains('on'));
          if (all) { $$('[data-t]', pane).forEach(x => x.disabled = true); api.award(15); api.done(5); api.result('good', '✅ One team sees the full picture in the SIEM — and staff learn not to approve fake MFA requests.'); show(); }
          else { api.result('', 'Switch on every log source and the training.'); api.refresh(); }
        }));
      } else pane.innerHTML = '<div class="cw-card cw-done" style="border:0"><div class="big">✅</div><h3>Lab complete</h3><p>No MFA fatigue, no forgotten or shared accounts, no excessive rights — and all logs in the SIEM. Click <b>Finish lab ✓</b>.</p></div>';
      api.refresh();
    };
    sync(); show();
    return {
      guide(k) {
        if (k === 0) return `📖 Read <b>MFA Fatigue</b> in <b>Common Mistakes</b>.<br>Dr. Huda is asleep; the phone keeps asking to approve a sign-in she did not start. Click <kbd>Deny</kbd> 3 times. Never click Approve. Denied: <b>${denied} of 3</b>.`;
        if (k === 1) return `Now a caller says he is “IT Support”. Choose the safe action. Remember: reject any request you did not start.`;
        if (k <= 4) return `📖 Read <b>Shared Accounts</b>, <b>Forgotten Accounts</b> and <b>Excessive Permissions</b>.<br>In the <b>Account review</b>, click the right fix on each problem row: <b>k.alsaleh</b>, <b>nurses-station</b> and <b>r.fahad</b>. dr.huda is fine.`;
        return `📖 Read <b>Using Tools</b>: logs from every tool go to the SIEM, and users need Security Awareness training.<br>Switch on all 4 log sources and the training. Blue lines connect each tool to the SIEM.`;
      }, cleanup() { if (timer) clearInterval(timer); }
    };
  }
};

/* ------------------------------------------------------------------ LABS (one entry per flip-card button) ------------------------------------------------------------------ */
const LABS = [
  { id: 'CYB-W10-LAB-1', week: 10, slot: 'LAB-1', weekTitle: 'IDENTITY THEFT', icon: '🕵️', title: 'Identity Theft Lab 1: Spot & Stop the Attack', topic: '1.3.1 Identity Theft',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 10', guide: 'idTheft', parts: ['spotAttack', 'incident'],
    intro: "In this lab you read section 1.3.1 Identity Theft from your Week 10 guide on the left page, then use what you read in a simulation on the right page. You will investigate a phishing text message, sort the data attackers steal, match real cases to attack methods, and then type security commands on a hacked laptop to stop spyware and a data breach.",
    objectives: ['Define Identity Theft, PII and Login Credentials.', 'Identify the four ways identity theft happens.', 'Use security commands to stop spyware, block a C2 server and check for data breaches.'],
    outcomes: ['I can spot the red flags in a phishing message.', 'I can tell PII apart from Login Credentials.', 'I can stop a keylogger and block its C2 server.'] },
  { id: 'CYB-W10-LAB-2', week: 10, slot: 'LAB-2', weekTitle: 'IDENTITY THEFT', icon: '🛡️', title: 'Identity Theft Lab 2: Protect Your Identity', topic: '1.3.1 Identity Theft',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 10', guide: 'idTheft', parts: ['cleanDesk', 'defendId'],
    intro: "In this lab you read section 1.3.1 Identity Theft from your Week 10 guide on the left page, then use what you read in a simulation on the right page. You will patrol a 3D office for physical risks such as Dumpster Diving, then lock down a hacked school account with a strong password, MFA, alerts, safe websites and shredding.",
    objectives: ['Recognise physical identity theft: Physical Theft and Dumpster Diving.', 'Apply the prevention steps from the guide: Password Manager, MFA, Account Alerts, HTTPS checks and shredding.', 'Explain why identity protection matters for people and organizations.'],
    outcomes: ['I can find and fix physical risks in an office.', 'I can protect an account so a stolen password alone is not enough.', 'I can explain the effects of identity theft and the PDPL.'] }
  ,{ id: 'CYB-W11-LAB-1', week: 11, slot: 'LAB-1', weekTitle: 'ACCESS CONTROL MODELS', icon: '🏥', title: 'Hospital Access: Who Decides?', topic: '1.3.4 Access Control Models',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 11', guide: 'acModels', parts: ['hospDacMac', 'hospRbacAbac'],
    intro: "In this lab you work inside Al Noor Hospital. You read section 1.3.4 from your Week 11 guide on the left page and use it in a 3D hospital on the right: you answer a sharing request as a file owner (DAC), let the Military Wing's system decide by labels and clearance (MAC), set doctor, nurse and reception roles (RBAC), and build an attribute rule for the payroll system (ABAC).",
    objectives: ['Explain who decides in DAC, MAC, RBAC and ABAC.', 'Compare a Security Label with a Clearance Level.', 'Set permissions by role and by attributes such as device, location and time.'],
    outcomes: ['I can share a file safely as its owner.', 'I can predict MAC decisions.', 'I can build and test an RBAC and an ABAC policy.'] }
  ,{ id: 'CYB-W11-LAB-2', week: 11, slot: 'LAB-2', weekTitle: 'ACCESS CONTROL MODELS', icon: '🖥️', title: 'Hospital SOC: Auditing & Monitoring', topic: '1.3.4 Auditing and Monitoring',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 11', guide: 'acModels', parts: ['socAlert', 'siemRules'],
    intro: "In this lab you are the night-shift analyst in the hospital's Security Operations Center. A SIEM alert goes off at 2:00 AM: you investigate the Audit Log, answer the five questions of a good log entry, lock the account with a command and protect the logs. Then you set up Continuous Monitoring: connect log sources, switch on detection rules and watch a live event feed.",
    objectives: ['Read an Audit Log and answer Who, What, When, Where and Result.', 'Explain how a SIEM collects logs and raises alerts.', 'Describe the benefits of auditing and monitoring.'],
    outcomes: ['I can find a suspicious entry in an audit log.', 'I can choose the right SIEM detection rules.', 'I can tell real alerts from normal activity.'] }
  ,{ id: 'CYB-W12-LAB-1', week: 12, slot: 'LAB-1', weekTitle: 'ACCESS CONTROL TOOLS', icon: '🏫', title: 'School IT: Access Control Tools', topic: '1.3.5 Access Control Tools',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 12', guide: 'acTools', parts: ['joinerDay', 'defenseDepth'],
    intro: "In this lab you are the IT administrator at Future Leaders School. You read section 1.3.5 from your Week 12 guide on the left page. On the right, a new teacher joins: you create his IAM account, set up MFA, print a smart card and test SSO. Then you protect the network in layers with PAM, a firewall rule, NAC, a VPN and a leaver check — Defense in Depth.",
    objectives: ['Explain what IAM, SSO, MFA apps and smart cards do.', 'Use PAM, firewalls, NAC and VPN as layers of defense.', 'Disable all access of a person who leaves.'],
    outcomes: ['I can set up a new user safely.', 'I can write a simple firewall rule.', 'I can explain Defense in Depth.'] }
  ,{ id: 'CYB-W12-LAB-2', week: 12, slot: 'LAB-2', weekTitle: 'ACCESS CONTROL TOOLS', icon: '🔐', title: 'Zero Trust Clinic', topic: '1.3.5 Zero Trust and Common Mistakes',
    meta: 'Elective Cybersecurity | Chapter 3: Cybersecurity Controls | Week 12', guide: 'acTools', parts: ['zeroTrust', 'commonMistakes'],
    intro: "In this lab you protect Al Noor Clinic with Zero Trust: every login is checked against identity, device health, location and behavior — even inside the network. Then you stop an MFA Fatigue attack and a fake IT support call, fix forgotten, shared and over-powered accounts, and send every tool's logs to the SIEM.",
    objectives: ['Explain never trust, always verify.', 'Recognise MFA Fatigue, shared accounts, forgotten accounts and excessive permissions.', 'Use access control tools effectively.'],
    outcomes: ['I can make Zero Trust access decisions.', 'I can reject push requests I did not start.', 'I can fix common account mistakes.'] }
];
const GRADES = { 'Grade 10': 'ABCDEFGHIJK'.split('').map(c => 'CYBERSECURITY-GRADE-10-' + c), 'Grade 11': 'ABCDEFGHIJK'.split('').map(c => 'CYBERSECURITY-GRADE-11-' + c), 'Grade 12': 'ABCDEFGHIJK'.split('').map(c => 'CYBERSECURITY-GRADE-12-' + c) };
const PDF_MIN = 40;
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const STUDENT = { name: '', sid: '', grade: '' };
const ST = {};
function stOf(p) { return ST[p] || (ST[p] = { done: new Array(PARTS[p].steps.length).fill(false), mistakes: 0, complete: false, score: 0 }); }
const starsOf = st => st.mistakes <= 1 ? 3 : st.mistakes <= 4 ? 2 : 1;
function labStats(lab) { let done = 0, total = 0, score = 0; lab.parts.forEach(p => { const st = stOf(p); done += st.done.filter(Boolean).length; total += st.done.length; score += st.score; }); return { done, total, score, pct: total ? Math.round(done / total * 100) : 0 }; }

/* ------------------------------------------------------------------ book view ------------------------------------------------------------------ */
let view = null;
function ensureCss() { if (!document.getElementById('cyber-ws-css')) { const s = document.createElement('style'); s.id = 'cyber-ws-css'; s.textContent = CSS; document.head.appendChild(s); } }

function open(id) {
  const lab = LABS.find(l => l.id === id); if (!lab) return false;
  const pageL = $('section.guide'), pageR = $('section.work');
  if (!pageL || !pageR) { console.error('[CyberWorksheets] book pages not found'); return false; }
  if (view) close();
  ensureCss();
  const hidden = [];
  [pageL, pageR].forEach(pg => [...pg.children].forEach(el => { if (!el.classList.contains('runhead')) { hidden.push([el, el.style.display]); el.style.display = 'none'; } }));
  const wrapL = document.createElement('div'); wrapL.className = 'cw-root cw-left';
  const wrapR = document.createElement('div'); wrapR.className = 'cw-root cw-right';
  pageL.appendChild(wrapL); pageR.appendChild(wrapR);
  $$('.fc.flip').forEach(c => c.classList.remove('flip'));
  const n = (lab.slot || '').replace(/\D/g, '') || '1';
  wrapL.innerHTML = `<div class="cw-top"><div class="cw-tabs">${lab.parts.map((p, i) => `<button class="cw-tab" data-i="${i}" type="button" title="${esc(PARTS[p].title)}">Part ${i + 1}</button>`).join('')}</div>
      <div class="cw-ttl"><small>WEEK ${lab.week} · LAB ${n}</small><b>${esc(lab.topic)}</b></div><div class="cw-score">Score <b class="cw-sc">0</b></div></div>
    <div class="cw-lbody"></div>
    <div class="cw-lnav"><button class="cw-home" type="button" title="Back to the weeks">🏠 WEEKS HOME</button><button class="cw-btn ghost cw-prev" type="button">← Previous</button>
      <span class="cw-pos"></span><button class="cw-btn gry cw-pdf" type="button" title="Download your PDF (at least ${PDF_MIN}% done)">📄 PDF</button><button class="cw-btn cw-next" type="button">Next →</button></div>`;
  wrapR.innerHTML = `<div class="cw-rhead"><div class="cw-rt"><h2></h2><p></p></div><div class="cw-result"><small>RESULT</small><div class="cw-rbody"></div></div></div>
    <div class="cw-stage"><div class="cw-fit"></div></div>
    <div class="cw-rfoot"><span>I&nbsp; ELECTIVE:CYBERSECURITY LMS &nbsp;I&nbsp; Design &amp; Development &nbsp;I&nbsp; Lone A Firdous &nbsp;I</span><button class="cw-fs" type="button" title="Full screen on / off">⛶ FULL SCREEN</button></div>`;
  view = { lab, labNo: n, idx: -1, cur: null, wrapL, wrapR, hidden, sec: null, autoK: null, title: document.title, started: !!(STUDENT.name && STUDENT.sid && STUDENT.grade) };
  document.title = `WEEK ${lab.week} LAB ${n} | ${lab.title}`;
  $('.cw-home', wrapL).addEventListener('click', () => { if (window.confirm('Go back to all weeks? Your progress in this lab stays until you reload the page.')) close(); });
  $$('.cw-tab', wrapL).forEach(t => t.addEventListener('click', () => { if (!view.started) { setResult('', 'Enter your name, SID and grade, then click <b>Start lab</b> first.'); return; } showPart(+t.dataset.i); }));
  $('.cw-prev', wrapL).addEventListener('click', () => { if (view.idx === 99) showPart(lab.parts.length - 1); else if (view.idx > 0) showPart(view.idx - 1); else if (view.idx === 0) showIntro(); });
  $('.cw-next', wrapL).addEventListener('click', () => { if (view.idx < 0) { startLab(); return; } if (view.idx < lab.parts.length - 1) showPart(view.idx + 1); else showResults(); });
  $('.cw-pdf', wrapL).addEventListener('click', downloadPdf);
  const fsb = $('.cw-fs', wrapR); fsb.addEventListener('click', toggleFs);
  view.fsPaint = () => { fsb.textContent = (document.fullscreenElement || document.webkitFullscreenElement) ? '✕ EXIT FULL SCREEN' : '⛶ FULL SCREEN'; };
  document.addEventListener('fullscreenchange', view.fsPaint); view.fsPaint();
  view.ro = new ResizeObserver(() => fitAll()); view.ro.observe(wrapL); view.ro.observe(wrapR);
  view.mo = new MutationObserver(() => fitAll()); view.mo.observe($('.cw-fit', wrapR), { childList: true, subtree: true });   /* re-fit when an activity changes its content */
  showIntro();
  return true;
}
function close() {
  if (!view) return true;
  stopPart();
  const v = view; view = null;
  if (v.ro) v.ro.disconnect(); if (v.mo) v.mo.disconnect();
  document.removeEventListener('fullscreenchange', v.fsPaint);
  $$('.cw-ghost').forEach(g => g.remove());
  v.wrapL.remove(); v.wrapR.remove();
  v.hidden.forEach(([el, d]) => el.style.display = d);
  document.title = v.title;
  return true;
}

/* full screen on / off (uses the page's toggle when there is one) */
function toggleFs() {
  if (window.toggleFullScreen) { window.toggleFullScreen(); return; }
  const de = document.documentElement, on = document.fullscreenElement || document.webkitFullscreenElement;
  try { if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (de.requestFullscreen || de.webkitRequestFullscreen).call(de); } catch (_) {}
}
/* fit both pages into the available height (no scroll bars) */
function fitLeft() {
  if (!view) return; const body = $('.cw-lbody', view.wrapL); if (!body) return;
  const g = $('.cw-gtext', body);
  if (g) g.style.fontSize = '12px';
  const over = () => body.scrollHeight > body.clientHeight + 1 || $$('.cw-intro', body).some(x => x.scrollHeight > x.clientHeight + 1);
  let fs = g ? 18 : 20; body.style.fontSize = fs + 'px';
  while (fs > 11 && over()) { fs -= .5; body.style.fontSize = fs + 'px'; }
  if (g) { let gs = 26; g.style.fontSize = gs + 'px'; while (gs > 12 && g.scrollHeight > g.clientHeight + 1) { gs -= .5; g.style.fontSize = gs + 'px'; } }   /* guide text gets all the room left */
}
function fitRight() {
  if (!view) return;
  const stage = $('.cw-stage', view.wrapR), fit = $('.cw-fit', view.wrapR); if (!stage || !fit) return;
  const cs = getComputedStyle(stage), availH = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  /* scale the activity so it fills the page: smaller on short screens, up to 1.35x on large screens */
  fit.style.transform = ''; fit.style.marginLeft = '';
  let k = 1; const maxK = view.idx >= 0 && view.idx < 99 ? 1.35 : 1.1;
  for (let i = 0; i < 4; i++) { fit.style.width = (availW / k) + 'px'; const natH = fit.offsetHeight || 1, nk = Math.max(.5, Math.min(maxK, availH / natH)); if (Math.abs(nk - k) < .01) { k = nk; break; } k = nk; }
  fit.style.width = (availW / k) + 'px'; fit.style.transform = Math.abs(k - 1) > .005 ? `scale(${k})` : '';
  $$('.cw-3d', fit).forEach(sc => sc.style.setProperty('--s', (+sc.dataset.s || 1) * Math.min(1, sc.clientWidth / 640)));   /* 3D world zooms with the stage width, nothing is cut off */
}
let fitQ = false;
function fitAll() { if (fitQ) return; fitQ = true; requestAnimationFrame(() => { fitQ = false; fitLeft(); fitRight(); }); }

function setResult(kind, html) { if (!view) return; const box = $('.cw-result', view.wrapR); $('.cw-rbody', box).innerHTML = html; box.title = $('.cw-rbody', box).textContent; flash(box, 'cw-pop'); }
function setHead(t, q) { $('.cw-rt h2', view.wrapR).textContent = t; $('.cw-rt p', view.wrapR).textContent = q; }
function stopPart() { if (view && view.cur && view.cur.cleanup) { try { view.cur.cleanup(); } catch (_) {} } if (view) view.cur = null; }
function makeApi(p) {
  const st = stOf(p);
  const api = {
    result(kind, html) { setResult(kind, html); }, feedback(kind, html) { setResult(kind, html); },
    award(n) { st.score += n; renderSide(); },
    mistake(html) { st.mistakes++; setResult('bad', '✖ ' + html); renderSide(); },
    isDone: k => st.done[k],
    done(k) { if (st.done[k]) return; st.done[k] = true; if (st.done.every(Boolean) && !st.complete) { st.complete = true; st.score += 20; } renderSide(); },
    refresh() { if (view && view.lab.parts[view.idx] === p) { renderGuide(); fitAll(); } },
    showSec(id) { showSec(id, true); }
  };
  return api;
}

/* the guide reader on the left page */
function guideHtml(G) {
  return `<div class="cw-guide"><div class="cw-ghead"><b>📖 READ THE GUIDE</b><span>${esc(G.code)} ${esc(G.title)}</span></div>
    <div class="cw-chips">${G.sections.map(s => `<button type="button" class="cw-chip" data-sec="${s.id}">${esc(s.tab)}</button>`).join('')}</div>
    <div class="cw-gtext"></div></div>`;
}
function showSec(id, flashIt) {
  if (!view) return; const G = GUIDES[PARTS[view.lab.parts[view.idx]].guide], s = G.sections.find(x => x.id === id) || G.sections[0];
  view.sec = s.id;
  const box = $('.cw-gtext', view.wrapL); if (!box) return;
  box.innerHTML = `<h4>${esc(s.title)}</h4>` + s.text.map(t => { const m = t.match(/^([A-Z][A-Za-z ()&-]+): (.*)$/); return m ? `<p class="lbl"><b>${esc(m[1])}:</b> ${md(m[2])}</p>` : `<p>${s.id === 'ex' ? '► ' : ''}${md(t)}</p>`; }).join('');
  $$('.cw-chip', view.wrapL).forEach(c => c.classList.toggle('on', c.dataset.sec === s.id));
  if (flashIt) flash(box, 'flash');
  fitAll();
}

/* start screen: introduction (left) + student details (right) */
function showIntro() {
  stopPart(); view.idx = -1;
  const db = $('.cw-donebar', view.wrapR); if (db) db.remove();
  const lab = view.lab, G = GUIDES[lab.guide];
  $('.cw-lbody', view.wrapL).innerHTML = `<div class="cw-intro" style="flex:1;min-height:0;overflow:hidden"><div class="cw-instr">LAB INTRODUCTION</div>
      <h1 style="margin-top:.35em">${esc(lab.title)}</h1><div class="tp">${esc(G.chapter)} · ${esc(G.code)} ${esc(G.title)}</div>
      <p>${esc(lab.intro)}</p>
      <h4>This lab has ${lab.parts.length} parts</h4>
      <ol>${lab.parts.map((p, i) => `<li><b>Part ${i + 1}: ${esc(PARTS[p].title)}</b><span>${esc(PARTS[p].q)} — ${PARTS[p].steps.length} missions</span></li>`).join('')}</ol>
      <h4>Lab objectives</h4><ul>${lab.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
      <h4>Lab outcomes</h4><ul>${lab.outcomes.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>`;
  setHead('Student details', 'Enter your details, then click Start lab');
  setResult('', 'Fill in your <b>name</b>, <b>SID</b> and <b>grade</b>, then click <b>Start lab</b>.');
  const fit = $('.cw-fit', view.wrapR); fit.style.transform = ''; fit.style.marginLeft = '';
  fit.innerHTML = `<div class="cw-start"><h3>${esc(lab.icon)} ${esc(lab.title)}</h3><p>${esc(lab.meta)}</p>
      <div class="cw-srow"><label>Student Name<input class="cw-dark" id="cw-s-name" autocomplete="off" placeholder="Full name" value="${esc(STUDENT.name)}"></label>
        <label>SID<input class="cw-dark" id="cw-s-sid" autocomplete="off" placeholder="Student ID" value="${esc(STUDENT.sid)}"></label></div>
      <label>Grade<select class="cw-dark" id="cw-s-grade"><option value="">Select your grade</option>${Object.keys(GRADES).map(g => `<optgroup label="${g}">${GRADES[g].map(x => `<option${x === STUDENT.grade ? ' selected' : ''}>${x}</option>`).join('')}</optgroup>`).join('')}</select></label>
      <div class="cw-msg cw-smsg"></div>
      <button class="cw-btn big cw-go" type="button" style="align-self:flex-start">Start lab →</button>
      <p class="cw-note">Your PDF can be downloaded once at least ${PDF_MIN}% of the missions are done.</p></div>`;
  $('.cw-go', fit).addEventListener('click', startLab);
  $$('.cw-dark', fit).forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') startLab(); }));
  renderSide(); fitAll();
}
function startLab() {
  const fit = $('.cw-fit', view.wrapR), name = $('#cw-s-name', fit), sid = $('#cw-s-sid', fit), grade = $('#cw-s-grade', fit);
  if (!name) return;
  const miss = []; [[name, 'name'], [sid, 'SID'], [grade, 'grade']].forEach(([el, l]) => { el.classList.toggle('err', !el.value.trim()); if (!el.value.trim()) miss.push(l); });
  if (miss.length) { const m = 'Please enter your ' + miss.join(', ') + '.'; const sm = $('.cw-smsg', fit); sm.className = 'cw-msg bad cw-smsg'; sm.textContent = m; setResult('bad', m); return; }
  STUDENT.name = name.value.trim(); STUDENT.sid = sid.value.trim(); STUDENT.grade = grade.value; view.started = true;
  const first = view.lab.parts.findIndex(p => !stOf(p).complete);
  showPart(first < 0 ? 0 : first);
}

function showPart(i) {
  if (!view) return;
  stopPart(); view.idx = i; view.autoK = null;
  const p = view.lab.parts[i], P = PARTS[p], G = GUIDES[P.guide];
  setHead(`Part ${i + 1}: ${P.title}`, '❓ ' + P.q);
  $('.cw-lbody', view.wrapL).innerHTML = `<div class="cw-instr">INSTRUCTIONS</div>
    <div class="cw-do"><small class="cw-dot">STEP 1 — DO THIS NOW</small><div class="cw-dob"></div></div><div class="cw-miss"></div>${guideHtml(G)}`;
  $$('.cw-chip', view.wrapL).forEach(c => c.addEventListener('click', () => showSec(c.dataset.sec, true)));
  const fit = $('.cw-fit', view.wrapR); fit.innerHTML = ''; fit.style.transform = ''; fit.style.marginLeft = '';
  setResult('', 'Nothing has happened yet. Read the <b>GUIDE</b> and follow the <b>INSTRUCTIONS</b> on the left page.');
  showSec(P.steps[Math.max(0, stOf(p).done.indexOf(false))].sec || G.sections[0].id);
  view.cur = P.mount(fit, makeApi(p)) || {};
  renderSide(); fitAll();
}
function renderSide() {
  if (!view) return;
  const L = view.wrapL, lab = view.lab, s = labStats(lab), last = view.idx === lab.parts.length - 1;
  $('.cw-sc', L).textContent = s.score;
  $$('.cw-tab', L).forEach((t, i) => { t.classList.toggle('on', i === view.idx); t.classList.toggle('done', stOf(lab.parts[i]).complete); });
  $('.cw-pos', L).textContent = view.idx < 0 ? `${lab.parts.length} parts · ${s.pct}% done` : view.idx === 99 ? `Results · ${s.pct}% done` : `Part ${view.idx + 1} of ${lab.parts.length} · ${s.pct}% done`;
  $('.cw-prev', L).disabled = view.idx < 0;
  const nx = $('.cw-next', L); nx.textContent = view.idx < 0 ? 'Start lab →' : view.idx === 99 ? 'Results' : last ? 'Finish lab ✓' : 'Next part →'; nx.disabled = view.idx === 99;
  const pdfOk = s.pct >= PDF_MIN && view.started, pb = $('.cw-pdf', L);
  pb.classList.toggle('ready', pdfOk); pb.disabled = !pdfOk; pb.title = pdfOk ? 'Download your PDF' : `The PDF unlocks at ${PDF_MIN}% (now ${s.pct}%)`;
  if (view.idx >= 0 && view.idx < 99) {
    const p = lab.parts[view.idx], P = PARTS[p], st = stOf(p), k = st.done.indexOf(false);
    const ms = $('.cw-miss', L); if (ms) ms.innerHTML = `<small>MISSIONS</small>${P.steps.map((x, i) => `<div class="cw-ms${st.done[i] ? ' ok' : ''}${i === k ? ' now' : ''}" title="${esc(x.t)}"><i>${st.done[i] ? '✓' : ''}</i><span>${i === k ? esc(x.t) : i + 1}</span></div>`).join('')}<span class="cw-stars">${st.complete ? '⭐'.repeat(starsOf(st)) : ''}</span>`;
    nx.classList.toggle('pulse', st.complete);
    renderGuide();
  }
  fitAll();
}
function renderGuide() {
  if (!view || !view.cur || view.idx < 0 || view.idx === 99) return;
  const L = view.wrapL, p = view.lab.parts[view.idx], P = PARTS[p], st = stOf(p), k = st.done.indexOf(false);
  const box = $('.cw-do', L), head = $('.cw-dot', L), b = $('.cw-dob', L); if (!box) return;
  if (k < 0) {
    box.classList.add('fin'); head.textContent = `PART ${view.idx + 1} COMPLETE ${'⭐'.repeat(starsOf(st))}`;
    const last = view.idx === view.lab.parts.length - 1, all = view.lab.parts.every(q => stOf(q).complete);
    if (all && !$('.cw-donebar', view.wrapR)) {
      const d = document.createElement('div'); d.className = 'cw-donebar';
      d.innerHTML = `<span>🎉 <b>${esc(view.lab.title)}</b> — all ${view.lab.parts.length} parts complete.</span><button type="button" class="cw-btn">📄 Download PDF</button>`;
      $('button', d).addEventListener('click', downloadPdf); view.wrapR.insertBefore(d, $('.cw-stage', view.wrapR)); fitAll();
    }
    if (all) { b.innerHTML = `All ${view.lab.parts.length} parts are complete 🎉 <button type="button" class="cw-btn big cw-dl" style="margin:.35em 0 .1em;display:block">📄 Download PDF</button>or click <b>Finish lab ✓</b> to see your results.`; $('.cw-dl', b).addEventListener('click', downloadPdf); $$('.cw-chip', L).forEach(c => c.classList.remove('need')); return; }
    b.innerHTML = last ? 'All missions done. Click <b>Finish lab ✓</b> at the bottom of this page to see your results and download your PDF.' : `All missions done. Click <b>Next part →</b> at the bottom of this page to start <b>Part ${view.idx + 2}: ${esc(PARTS[view.lab.parts[view.idx + 1]].title)}</b>.`;
    $$('.cw-chip', L).forEach(c => c.classList.remove('need'));
    return;
  }
  box.classList.remove('fin'); head.textContent = `STEP ${k + 1} OF ${P.steps.length} — DO THIS NOW`;
  const html = view.cur.guide ? view.cur.guide(k) : '';
  if (b.innerHTML !== html) { b.innerHTML = html; fitAll(); }
  const need = P.steps[k].sec;
  $$('.cw-chip', L).forEach(c => c.classList.toggle('need', c.dataset.sec === need && view.sec !== need));
  if (view.autoK !== k) { view.autoK = k; if (need && view.sec !== need) showSec(need, true); }
}
function showResults() {
  if (!view) return;
  stopPart(); view.idx = 99;
  const lab = view.lab, s = labStats(lab);
  setHead(lab.title + ' — results', lab.topic);
  $('.cw-lbody', view.wrapL).innerHTML = `<div class="cw-instr">INSTRUCTIONS</div>
    <div class="cw-do fin"><small class="cw-dot">LAB RESULTS</small><div class="cw-dob">Your results are on the right page.<ul style="margin:.3em 0 0;padding-left:1.2em">
      <li>Click <b>📄 PDF</b> at the bottom to download your work${s.pct < PDF_MIN ? ` — you need at least <b>${PDF_MIN}%</b> (now ${s.pct}%)` : ''}.</li>
      <li>Click a <b>Part</b> button at the top to finish or improve a part.</li><li>Click <b>WEEKS HOME</b> to go back.</li></ul></div></div>`;
  const fit = $('.cw-fit', view.wrapR); fit.style.transform = ''; fit.style.marginLeft = '';
  fit.innerHTML = `<div class="cw-res"><div class="big">🏆</div><h2>${lab.parts.every(q => stOf(q).complete) ? 'Lab complete!' : 'Lab not finished yet'}</h2>
    <p>${esc(STUDENT.name)} · SID ${esc(STUDENT.sid)} · ${esc(STUDENT.grade)}</p>
    <p>Score <b style="color:#EA580C">${s.score}</b> · Missions done <b>${s.done}/${s.total}</b> (${s.pct}%)</p>
    <table>${lab.parts.map((q, i) => `<tr><td>Part ${i + 1}: ${esc(PARTS[q].title)}</td><td>${stOf(q).complete ? '⭐'.repeat(starsOf(stOf(q))) : `${stOf(q).done.filter(Boolean).length}/${stOf(q).done.length} missions`}</td></tr>`).join('')}</table>
    <div class="cw-row" style="justify-content:center"><button class="cw-btn ghost cw-again" type="button">Back to Part 1</button><button class="cw-btn big cw-pdf2" type="button">📄 Download PDF</button></div></div>`;
  $('.cw-again', fit).addEventListener('click', () => showPart(0));
  $('.cw-pdf2', fit).addEventListener('click', downloadPdf);
  setResult('', `Lab finished — score <b>${s.score}</b>, <b>${s.pct}%</b> of missions done.`);
  renderSide(); fitAll();
}

/* PDF: student details + every mission */
function loadJsPdf() {
  if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = JSPDF_URL; s.onload = res; s.onerror = () => rej(new Error('offline')); document.head.appendChild(s); });
}
async function downloadPdf() {
  if (!view) return;
  const lab = view.lab, s = labStats(lab);
  if (!view.started) { setResult('bad', 'Enter your details and click <b>Start lab</b> first.'); return; }
  if (s.pct < PDF_MIN) { setResult('bad', `The PDF unlocks at <b>${PDF_MIN}%</b>. You have done <b>${s.pct}%</b> of the missions (${s.done} of ${s.total}). Keep going!`); return; }
  try { await loadJsPdf(); } catch (_) { setResult('bad', 'The PDF tool needs an internet connection. Please connect and try again.'); return; }
  const J = window.jspdf.jsPDF, doc = new J({ unit: 'mm', format: 'a4' }), W = 210, H = 297, M = 16, CW = W - 2 * M, BOT = H - 18;
  const INK = [26, 34, 51], MUT = [91, 101, 121], GRN = [21, 128, 61], RED = [185, 28, 28], ACC = [139, 0, 0];
  let y = 0;
  const clean = t => String(t).replace(/<[^>]+>/g, '').replace(/\*\*/g, '').replace(/&amp;/g, '&').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/→/g, '->').replace(/[^\x20-\x7E]/g, '');
  const font = (sz, st, c) => { doc.setFontSize(sz); doc.setFont('helvetica', st); doc.setTextColor(c[0], c[1], c[2]); };
  const need = h => { if (y + h > BOT) { doc.addPage(); y = 18; } };
  const now = new Date(), when = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  doc.setFillColor(ACC[0], ACC[1], ACC[2]); doc.rect(0, 0, W, 38, 'F');
  font(9, 'normal', [254, 202, 202]); doc.text(clean(lab.meta), M, 12);
  font(21, 'bold', [255, 255, 255]); doc.text(clean(`WEEK ${lab.week} LAB ${view.labNo}: ${lab.title}`), M, 24);
  font(11, 'normal', [255, 228, 228]); doc.text(clean(lab.topic), M, 32);
  y = 46; doc.setFillColor(241, 243, 247); doc.roundedRect(M, y, CW, 30, 3, 3, 'F');
  const cx = [M + 5, M + CW * 0.55, M + CW * 0.78];
  [['Name', STUDENT.name], ['SID', STUDENT.sid], ['Grade', STUDENT.grade]].forEach((kv, i) => { font(8, 'normal', MUT); doc.text(kv[0], cx[i], y + 7); font(11, 'bold', INK); doc.text(doc.splitTextToSize(clean(kv[1]), i ? CW * 0.2 : CW * 0.48)[0] || '', cx[i], y + 13); });
  font(8, 'normal', MUT); doc.text('Downloaded', cx[0], y + 21); font(10, 'normal', INK); doc.text(clean(when), cx[0], y + 26.5);
  font(8, 'normal', MUT); doc.text('Missions done', cx[1], y + 21); font(12, 'bold', ACC); doc.text(`${s.done} / ${s.total} (${s.pct}%)`, cx[1], y + 26.5);
  font(8, 'normal', MUT); doc.text('Score', cx[2], y + 21); font(12, 'bold', ACC); doc.text(String(s.score), cx[2], y + 26.5);
  y += 40;
  lab.parts.forEach((p, i) => {
    const P = PARTS[p], st = stOf(p), got = st.done.filter(Boolean).length;
    need(30);
    doc.setFillColor(ACC[0], ACC[1], ACC[2]); doc.rect(M, y - 5, 2, 9, 'F');
    font(13, 'bold', INK); doc.text(clean(`Part ${i + 1}: ${P.title}`), M + 5, y + 1);
    font(9, 'bold', st.complete ? GRN : MUT); doc.text(st.complete ? `Complete - ${starsOf(st)} of 3 stars` : `${got} of ${st.done.length} missions`, M + CW, y + 1, { align: 'right' });
    y += 7; font(9.5, 'italic', MUT); const ql = doc.splitTextToSize(clean('Question: ' + P.q), CW - 5); doc.text(ql, M + 5, y); y += ql.length * 4.5 + 2;
    P.steps.forEach((step, k) => {
      const ok = st.done[k], col = ok ? GRN : RED, lines = doc.splitTextToSize(clean(step.t), CW - 32);
      need(lines.length * 4.6 + 2);
      doc.setFillColor(col[0], col[1], col[2]); doc.circle(M + 6.5, y - 1.2, 1.1, 'F');
      font(10, 'normal', INK); doc.text(lines, M + 10, y);
      font(8.5, 'bold', col); doc.text(ok ? 'Done' : 'Not done', M + CW, y, { align: 'right' });
      y += lines.length * 4.6 + 1.6;
    });
    font(9, 'normal', MUT); need(6); doc.text(`Points: ${st.score}    Mistakes: ${st.mistakes}`, M + 10, y + 1); y += 10;
  });
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) { doc.setPage(i); font(8, 'normal', MUT); doc.text(clean(`${lab.title}  |  ${STUDENT.name}  |  SID ${STUDENT.sid}`), M, H - 9); doc.text('Page ' + i + ' of ' + pages, W - M, H - 9, { align: 'right' }); }
  const safe = v => clean(v).replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
  doc.save(`CYB_WK${lab.week}_LAB${view.labNo}_${safe(STUDENT.name) || 'Student'}_${safe(STUDENT.sid)}.pdf`);
  setResult('good', 'Your PDF was downloaded.');
}

/* ------------------------------------------------------------------ public API (used by Cyberindex.html) ------------------------------------------------------------------ */
window.CyberWorksheets = {
  /* the lab for a flip-card button, e.g. labFor('10', 'LAB-1') -> { label, sim:'CYB-W10-LAB-1' } */
  weekTitle(week) { const l = LABS.find(x => String(x.week) === String(week) && x.weekTitle); return l ? l.weekTitle : ''; },
  labFor(week, slot) { const l = LABS.find(x => String(x.week) === String(week) && String(x.slot).toUpperCase() === String(slot).toUpperCase()); return l ? { label: `WK-${l.week}-${l.slot}`, sim: l.id, title: l.title } : null; },
  has: id => LABS.some(l => l.id === id),
  open, close, isOpen: () => !!view, currentId: () => view ? view.lab.id : null,
  LABS, PARTS, GUIDES
};
})();
