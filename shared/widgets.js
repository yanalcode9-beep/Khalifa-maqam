/* =========================================================================
   Interactive widgets — used by the website and the Android app alike.
   Each widget: MQW.name(container) -> { destroy() }. Re-renders on
   "mq:lang" so Arabic/English switch live.
   ========================================================================= */
(function () {
  const MQ = window.MQ, S = window.Sound;
  const W = (window.MQW = {});
  const t = (o) => MQ.t(o);
  const AR = () => MQ.lang === "ar";
  const NS = "http://www.w3.org/2000/svg";
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny DOM helpers ---------- */
  function h(tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") { for (const sk in v) sk.startsWith("--") ? e.style.setProperty(sk, v[sk]) : (e.style[sk] = v[sk]); }
      else e.setAttribute(k, v === true ? "" : v);
    }
    kids.flat(9).forEach((c) => c != null && c !== false && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  function s(tag, attrs, ...kids) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) { const v = attrs[k]; if (v == null) continue; if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
    kids.flat(9).forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
    return e;
  }
  W.h = h; W.s = s;
  const btn = (label, on, cls = "", extra = {}) => h("button", Object.assign({ type: "button", class: "mq-btn " + cls, onclick: on }, extra), label);
  const chip = (label, active, on, extra = {}) => h("button", Object.assign({ type: "button", class: "mq-chip" + (active ? " is-on" : ""), "aria-pressed": active ? "true" : "false", onclick: on }, extra), label);
  const L = (ar, en) => (AR() ? ar : en);
  W.btn = btn; W.chip = chip;

  /* live re-render on language change */
  function mount(el, render, cleanup) {
    el.classList.add("mq-w");
    const r = () => { el.innerHTML = ""; render(); };
    r();
    const onLang = () => r();
    document.addEventListener("mq:lang", onLang);
    const api = { rerender: r, onStop: null, destroy() { document.removeEventListener("mq:lang", onLang); document.removeEventListener("mq:stopall", onStop); cleanup && cleanup(); el.innerHTML = ""; } };
    const onStop = () => { if (api.onStop) api.onStop(); if (el.isConnected) r(); };
    document.addEventListener("mq:stopall", onStop);
    return api;
  }

  /* ---------- pitch naming ---------- */
  const LET = MQ.letters;
  const diat = (name) => { const m = /^([A-G])(#|b|hf)?(-?\d)$/.exec(name); return LET.indexOf(m[1]) + 7 * +m[3]; };
  const fromDiat = (n) => LET[((n % 7) + 7) % 7] + Math.floor(n / 7);
  const accSym = { "#": "♯", b: "♭", hf: "½♭" };
  function pname(name, withOct) { // "F#4" -> "فا♯" / "Fa♯ (F♯)"
    const m = /^([A-G])(#|b|hf)?(-?\d)$/.exec(name); if (!m) return name;
    const i = LET.indexOf(m[1]), a = m[2] ? accSym[m[2]] : "";
    if (AR()) return MQ.solfege.ar[i] + a;
    return MQ.solfege.en[i] + a + " (" + m[1] + a + (withOct ? m[3] : "") + ")";
  }
  W.pname = pname;
  const midiName = (m) => ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

  /* ---------- progressive event runner (cancellable) ---------- */
  function run(events, opts = {}) {
    // events: [{at (sec), fn(when)}] sorted or not
    if (!S.init()) return { stop() {} };
    events = events.slice().sort((a, b) => a.at - b.at);
    const t0 = S.now() + 0.1; let i = 0, alive = true, timer, raf;
    const total = opts.total || (events.length ? events[events.length - 1].at + 0.5 : 0);
    const tick = () => {
      if (!alive) return;
      const now = S.now();
      while (i < events.length && t0 + events[i].at < now + 0.2) { const e = events[i++]; e.fn(Math.max(0, t0 + e.at - now)); }
      if (now - t0 > total) { alive = false; opts.onEnd && opts.onEnd(); return; }
      timer = setTimeout(tick, 30);
    };
    const prog = () => { if (!alive) return; opts.onProgress && opts.onProgress(Math.max(0, S.now() - t0), total); raf = requestAnimationFrame(prog); };
    tick(); prog();
    const hdl = { stop() { if (!alive) return; alive = false; clearTimeout(timer); cancelAnimationFrame(raf); S.jobs.delete(hdl); opts.onEnd && opts.onEnd(true); }, get alive() { return alive; } };
    S.jobs.add(hdl);
    const fin = opts.onEnd; opts.onEnd = (x) => { S.jobs.delete(hdl); fin && fin(x); };
    return hdl;
  }
  W.run = run;

  /* =====================================================================
     1) KEYBOARD
     ===================================================================== */
  W.keyboard = function (el, o = {}) {
    const start = o.start || 60, octaves = o.octaves || 2, voice = o.voice || "piano";
    const MIN_KEY = o.labels === "both" ? 34 : 30; // px per white key before we page by octave
    let hl = new Set(o.highlight || []), off = 0, cap = octaves, keys = new Map(), api;
    const capacity = () => { const w = el.clientWidth || Math.min(innerWidth - 40, 1100); return Math.max(1, Math.min(octaves, Math.floor(w / MIN_KEY / 7))); };
    const render = () => {
      keys = new Map();
      cap = capacity(); off = Math.max(0, Math.min(off, octaves - cap));
      const lo = start + off * 12, hi = lo + cap * 12 + (off + cap === octaves ? 1 : 0);
      const wrap = h("div", { class: "mq-kb", dir: "ltr", role: "group", "aria-label": L("لوحة مفاتيح البيانو", "Piano keyboard") });
      const whites = [];
      for (let m = lo; m < hi; m++) {
        const pc = m % 12, black = [1, 3, 6, 8, 10].includes(pc);
        const name = midiName(m), li = LET.indexOf(name[0]), both = o.labels === "both";
        let lbl = null;
        if (both && !black) lbl = h("span", { class: "mq-key__lbl mq-key__lbl--both" }, h("b", {}, name[0]), h("small", {}, MQ.solfege[AR() ? "ar" : "en"][li]));
        else if (both && black) { const nx = LET[(li + 1) % 7]; lbl = h("span", { class: "mq-key__lbl mq-key__lbl--blk" }, h("b", {}, name[0] + "♯"), h("b", {}, nx + "♭")); }
        else if (!black) lbl = h("span", { class: "mq-key__lbl" }, AR() ? MQ.solfege.ar[li] : name[0] + name.slice(-1));
        const k = h("button", { type: "button", class: "mq-key " + (black ? "is-black" : "is-white") + (hl.has(m) ? " is-hl" : ""), "data-m": m, "aria-label": pname(name, true) }, lbl);
        k.addEventListener("pointerdown", (e) => { e.preventDefault(); press(m); });
        keys.set(m, k);
        if (!black) whites.push(k); else k.style.setProperty("--pos", whites.length);
        wrap.append(k);
      }
      wrap.style.setProperty("--whites", whites.length);
      if (cap < octaves) {
        const oct = (n) => (AR() ? "الأوكتاف " : "Octave ") + (Math.floor((start + n * 12) / 12) - 1);
        el.append(h("div", { class: "mq-kbpager" },
          h("button", { type: "button", class: "mq-kbpager__b", disabled: off === 0, "aria-label": L("أوكتاف أوطى", "Lower octave"), onclick: () => { off--; api.rerender(); } }, "‹"),
          h("span", {}, oct(off) + (cap > 1 ? " – " + (Math.floor((start + (off + cap - 1) * 12) / 12) - 1) : "")),
          h("button", { type: "button", class: "mq-kbpager__b", disabled: off + cap >= octaves, "aria-label": L("أوكتاف أعلى", "Higher octave"), onclick: () => { off++; api.rerender(); } }, "›")));
      }
      el.append(wrap);
    };
    function follow(m) {
      if (cap >= octaves) return;
      const lo = start + off * 12, hi = lo + cap * 12;
      if (m < lo || m >= hi + (off + cap === octaves ? 1 : 0)) { off = Math.max(0, Math.min(octaves - cap, Math.floor((m - start) / 12))); api.rerender(); }
    }
    function press(m, when = 0, dur = 0.9) {
      if (!o.silent) S.play(voice, m, when, dur);
      setTimeout(() => { follow(m); const k = keys.get(m); if (!k) return; k.classList.add("is-down"); setTimeout(() => k.classList.remove("is-down"), Math.min(600, dur * 1000)); }, when * 1000);
      o.onNote && o.onNote(m);
    }
    const kmap = "awsedftgyhujkolp;'".split("");
    const onKey = (e) => {
      if (e.repeat || !el.isConnected || e.target.closest("input,textarea")) return;
      const i = kmap.indexOf(e.key.toLowerCase()); if (i < 0) return;
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      press(start + off * 12 + i);
    };
    if (o.keys !== false) window.addEventListener("keydown", onKey);
    let ro = null;
    const m0 = mount(el, render, () => { window.removeEventListener("keydown", onKey); ro && ro.disconnect(); });
    api = Object.assign(m0, {
      press,
      highlight(set) { hl = new Set(set); keys.forEach((k, mm) => k.classList.toggle("is-hl", hl.has(mm))); if (set.length) follow(Math.min(...set)); },
      flash(m, dur = 0.4, beats) { m = Math.round(m); follow(m); const k = keys.get(m); if (!k) return; k.classList.remove("is-down"); void k.offsetWidth; k.classList.add("is-down"); clearTimeout(k._t); k._t = setTimeout(() => k.classList.remove("is-down"), Math.max(140, dur * 1000));
        if (beats != null && W.glyphFor) { const g = h("span", { class: "mq-key__pop mq-glyph", "aria-hidden": "true" }, W.glyphFor(beats)); k.append(g); setTimeout(() => g.remove(), 900); } },
    });
    if (window.ResizeObserver) { let last = cap; ro = new ResizeObserver(() => { const c = capacity(); if (c !== last) { last = c; api.rerender(); } }); ro.observe(el); }
    if (hl.size) follow(Math.min(...hl));
    return api;
  };

  /* =====================================================================
     2) STAFF (clefs, tap to hear, practice mode)
     ===================================================================== */
  const CLEF = {
    treble: { base: "E4", glyph: "\u{1D11E}", dy: 0, ar: "صول", en: "Treble" },
    bass: { base: "G2", glyph: "\u{1D122}", dy: 0, ar: "فا", en: "Bass" },
    alto: { base: "F3", glyph: "\u{1D121}", dy: 0, ar: "دو (ألطو)", en: "Alto" },
  };
  W.staffGeom = { top: 70, gap: 20, bottom: 150 };
  W.staff = function (el, o = {}) {
    let NW = false, clef = o.clef || "treble", mode = "explore", placed = [], target = null, score = { ok: 0, n: 0 }, fb = null;
    const B = 150, G = 20, Y = (step) => B - step * (G / 2);
    const nameAt = (step) => fromDiat(diat(CLEF[clef].base) + step);
    const where = (step) => {
      if (step % 2 === 0 && step >= 0 && step <= 8) return L("الخط " + ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"][step / 2], "line " + (step / 2 + 1));
      if (step % 2 && step > 0 && step < 8) return L("الفراغ " + ["الأول", "الثاني", "الثالث", "الرابع"][(step - 1) / 2], "space " + ((step + 1) / 2));
      if (step === -1) return L("تحت السطر الأول", "below line 1");
      if (step === 9) return L("فوق السطر الخامس", "above line 5");
      return L("على خط إضافي", "on a ledger line");
    };
    let svgEl, infoEl;
    const render = () => {
      const head = h("div", { class: "mq-row mq-row--between" },
        h("div", { class: "mq-seg", role: "tablist" }, Object.keys(CLEF).map((k) => chip(L("مفتاح ", "") + t(CLEF[k]) + L("", " clef"), clef === k, () => { clef = k; placed = []; if (mode === "train") newTarget(); api.rerender(); }))),
        h("div", { class: "mq-seg" }, chip(L("استكشاف", "Explore"), mode === "explore", () => { mode = "explore"; placed = []; api.rerender(); }), chip(L("تدريب", "Train"), mode === "train", () => { mode = "train"; placed = []; score = { ok: 0, n: 0 }; next(); })));
      NW = (el.clientWidth || Math.min(innerWidth - 40, 1100)) < 560;
      const VW = NW ? 360 : 640;
      svgEl = s("svg", { viewBox: `0 0 ${VW} 220`, class: "mq-staff" + (NW ? " is-narrow" : ""), role: "img", "aria-label": L("مدرج موسيقي تفاعلي", "Interactive staff") });
      for (let i = 0; i < 5; i++) svgEl.append(s("line", { x1: 12, x2: VW - 12, y1: B - i * G, y2: B - i * G, class: "mq-staff__line" }));
      svgEl.append(s("text", { x: 34, y: B + CLEF[clef].dy, class: "mq-glyph mq-staff__clef" }, CLEF[clef].glyph));
      // hit zones
      for (let st = -3; st <= 11; st++) {
        const r = s("rect", { x: NW ? 84 : 120, width: NW ? 270 : 500, y: Y(st) - G / 4, height: G / 2, class: "mq-staff__hit", "data-s": st, tabindex: mode === "explore" ? 0 : -1, role: "button", "aria-label": pname(nameAt(st)) + " — " + where(st) });
        r.addEventListener("pointerdown", (e) => { e.preventDefault(); if (mode === "explore") tap(st); });
        r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(st); } });
        svgEl.append(r);
      }
      const shown = NW ? placed.slice(-5) : placed;
      shown.forEach((p, i) => drawNote(p.step, (NW ? 110 : 150) + i * (NW ? 52 : 70), p.fresh && i === shown.length - 1, p.hl));
      if (mode === "train" && target != null) drawNote(target, NW ? 220 : 380, false, "target");
      infoEl = h("div", { class: "mq-staff__info", "aria-live": "polite" });
      if (mode === "explore") {
        const last = placed[placed.length - 1];
        infoEl.append(last ? h("div", {}, h("b", { class: "mq-big" }, pname(nameAt(last.step))), " ", h("span", { class: "mq-dim" }, where(last.step) + " · " + L("مفتاح ", "") + t(CLEF[clef]))) : h("span", { class: "mq-dim" }, o.hint || L("اضغط على خط أو فراغ.", "Tap a line or a space.")));
      } else {
        infoEl.append(h("div", { class: "mq-row mq-row--between" }, h("span", {}, L("ما اسم هذه النغمة؟", "Name this note:")), h("span", { class: "mq-score" }, score.ok + " / " + score.n)));
        infoEl.append(h("div", { class: "mq-answers" }, MQ.letters.map((l, i) => btn(AR() ? MQ.solfege.ar[i] : MQ.solfege.en[i] + " · " + l, () => answer(l), "mq-btn--ghost" + (fb && fb.l === l ? (fb.ok ? " is-ok" : " is-bad") : "")))));
        if (fb) infoEl.append(h("div", { class: "mq-fb " + (fb.ok ? "is-ok" : "is-bad") }, fb.ok ? L("أحسنت!", "Correct!") : [L("الصحيح: ", "It was ") + pname(nameAt(target)) + " ", btn(L("التالي", "Next"), next, "mq-btn--small")]));
      }
      el.append(head, h("div", { class: "mq-staffwrap" }, svgEl), infoEl);
    };
    function drawNote(step, x, fresh, hl) {
      const g = s("g", { class: "mq-staff__note" + (fresh && !RM ? " is-fresh" : "") + (hl === "target" ? " is-target" : "") });
      for (let l = -2; l >= step; l -= 2) g.append(s("line", { x1: x - 18, x2: x + 18, y1: Y(l), y2: Y(l), class: "mq-staff__ledger" }));
      for (let l = 10; l <= step; l += 2) g.append(s("line", { x1: x - 18, x2: x + 18, y1: Y(l), y2: Y(l), class: "mq-staff__ledger" }));
      const up = step < 4;
      g.append(s("ellipse", { cx: x, cy: Y(step), rx: 11.5, ry: 8.5, transform: `rotate(-20 ${x} ${Y(step)})`, class: "mq-staff__head" }));
      g.append(s("line", { x1: up ? x + 10.5 : x - 10.5, x2: up ? x + 10.5 : x - 10.5, y1: Y(step), y2: up ? Y(step) - 62 : Y(step) + 62, class: "mq-staff__stem" }));
      if (mode === "explore") g.append(s("text", { x, y: Math.max(Y(step) + 40, B + 44), class: "mq-staff__name", "text-anchor": "middle" }, AR() ? MQ.solfege.ar[LET.indexOf(nameAt(step)[0])] : nameAt(step).slice(0, 1)));
      svgEl.append(g);
    }
    function tap(st) {
      placed.forEach((p) => (p.fresh = false));
      placed.push({ step: st, fresh: true });
      if (placed.length > 7) placed.shift();
      S.play(o.voice || "piano", nameAt(st), 0, 1);
      api.rerender();
    }
    function newTarget() { let n; do { n = Math.floor(Math.random() * 11) - 1; } while (n === target); target = n; fb = null; }
    function answer(l) {
      if (fb) return;
      const ok = nameAt(target)[0] === l; score.n++; if (ok) score.ok++;
      fb = { l, ok }; S.play("piano", nameAt(target), 0, 0.8);
      api.rerender();
      if (ok) setTimeout(() => { if (mode === "train" && fb && fb.ok) next(); }, 900);
    }
    function next() { newTarget(); api.rerender(); setTimeout(() => S.play("piano", nameAt(target), 0, 0.8), 50); }
    const api = mount(el, render);
    return api;
  };

  /* =====================================================================
     3) DURATIONS — hear the bar divide
     ===================================================================== */
  W.durations = function (el) {
    let rests = false, playing = null, active = -1, lit = -1;
    const levels = [1, 2, 4, 8, 16];
    const render = () => {
      el.append(h("div", { class: "mq-row mq-row--between" },
        h("div", { class: "mq-seg" }, chip(L("العلامات", "Notes"), !rests, () => { rests = false; api.rerender(); }), chip(L("السكتات", "Rests"), rests, () => { rests = true; api.rerender(); })),
        h("span", { class: "mq-dim" }, L("المازورة = 4 وحدات (نوار)", "One bar = 4 quarter beats"))));
      const tree = h("div", { class: "mq-tree" });
      levels.forEach((n, li) => {
        const d = MQ.durations[li];
        const row = h("button", { type: "button", class: "mq-tree__row" + (active === li ? " is-on" : ""), onclick: () => play(li), "aria-label": t({ ar: d.ar, en: d.en }) + " × " + n },
          h("span", { class: "mq-tree__lbl" }, h("b", {}, AR() ? d.ar : d.en), h("small", {}, AR() ? "«" + d.arMean + "» · " + (d.beats >= 1 ? d.beats : d.frac) + " " + (d.beats === 1 ? "وحدة" : d.beats > 1 ? "وحدات" : "") : d.beats + (d.beats === 1 ? " beat" : " beats"))),
          h("span", { class: "mq-tree__cells", style: { "--n": n } }, Array.from({ length: n }, (_, i) => h("span", { class: "mq-tree__cell" + (active === li && lit === i ? " is-lit" : "") }, s("svg", { viewBox: "0 0 40 56", class: "mq-tree__svg", "aria-hidden": "true" }, s("text", { x: 20, y: rests ? 44 : 46, "text-anchor": "middle", class: "mq-glyph" }, rests ? d.r : d.g))))));
        tree.append(row);
      });
      el.append(tree);
      const dots = h("div", { class: "mq-dots" }, h("span", { class: "mq-dim" }, L("النقطة تزيد نصف الزمن:", "The dot adds half:")),
        [["noire", 1, 1.5], ["blanche", 2, 3], ["ronde", 4, 6]].map(([id, a, b]) => {
          const d = MQ.durations.find((x) => x.id === id);
          return h("div", { class: "mq-dotpair" },
            btn([h("span", { class: "mq-glyph" }, d.g), " " + a], () => beep(a), "mq-btn--ghost"),
            h("span", { class: "mq-arrow" }, "→"),
            btn([h("span", { class: "mq-glyph" }, d.g), h("b", { class: "mq-dot" }, "."), " " + b], () => beep(b), "mq-btn--ghost"));
        }));
      el.append(dots);
    };
    function beep(beats) { const sec = 60 / 84; S.play("clarinet", "A4", 0, beats * sec * 0.96, 0.8); S.play("click", 1600, 0); }
    function play(li) {
      playing && playing.stop();
      active = li; const n = levels[li], sec = (60 / 84) * 4 / n;
      const ev = [];
      for (let i = 0; i < n; i++) {
        ev.push({ at: i * sec, fn: (w) => { if (!rests) S.play(li >= 3 ? "xylophone" : "clarinet", ["C5", "E5", "G5", "E5"][i % 4], w, sec * 0.9, 0.7); setTimeout(() => { lit = i; api.rerender(); }, w * 1000); } });
      }
      for (let b = 0; b < 4; b++) ev.push({ at: b * (60 / 84), fn: (w) => S.play("click", b ? 900 : 1400, w, 0.05, 0.5) });
      playing = run(ev, { total: 4 * (60 / 84), onEnd: () => { lit = -1; active = -1; api.rerender(); } });
      api.rerender();
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     4) METRONOME / TIME SIGNATURES
     ===================================================================== */
  W.metronome = function (el) {
    let meter = MQ.meters[2], bpm = 96, on = false, loop = null, beat = -1, taps = [];
    const term = () => MQ.tempi.find((x) => bpm <= x.max);
    const accents = () => { const a = []; meter.groups.forEach((g, gi) => { for (let i = 0; i < g; i++) a.push(i === 0 ? (gi === 0 ? 2 : 1) : 0); }); return a; };
    const render = () => {
      el.append(h("div", { class: "mq-chips" }, MQ.meters.map((m) => chip(h("span", { class: "mq-frac" }, h("b", {}, m.n), h("i", {}, m.d)), meter === m, () => { meter = m; restart(); api.rerender(); }, { "aria-label": m.id }))));
      const acc = accents();
      el.append(h("div", { class: "mq-beats", style: { "--n": acc.length } }, acc.map((a, i) => h("span", { class: "mq-beat" + (a === 2 ? " is-down" : a ? " is-strong" : "") + (beat === i ? " is-now" : "") }))));
      const tr = term();
      el.append(h("div", { class: "mq-row mq-row--between mq-wrap" },
        h("div", {}, h("b", { class: "mq-big" }, meter.id), " ", h("span", { class: "mq-dim" }, t(meter.kind))),
        h("div", {}, h("b", {}, tr.term), " ", h("span", { class: "mq-dim" }, "— " + t(tr)))));
      const range = h("input", { type: "range", min: 40, max: 200, value: bpm, class: "mq-range", "aria-label": "BPM", oninput: (e) => { bpm = +e.target.value; if (loop) loop.step = stepSec(); bpmEl.textContent = bpm + " BPM"; const tr2 = term(); termEl.textContent = tr2.term; } });
      const bpmEl = h("span", { class: "mq-num" }, bpm + " BPM"), termEl = h("span", { class: "mq-dim" }, tr.term);
      el.append(h("div", { class: "mq-row mq-wrap" }, btn(on ? L("إيقاف", "Stop") : L("تشغيل", "Start"), toggle, "mq-btn--primary"), range, bpmEl, btn(L("اضغط الإيقاع", "Tap tempo"), tapTempo, "mq-btn--ghost")));
    };
    const stepSec = () => (60 / bpm) * (meter.d === 8 ? 0.5 : 1);
    function restart() { if (on) { loop && loop.stop(); start(); } }
    function start() {
      const acc = accents();
      loop = S.loop(stepSec(), acc.length, (i, w) => {
        S.play("click", acc[i] === 2 ? 1760 : acc[i] ? 1250 : 880, w, 0.05, acc[i] === 2 ? 1 : acc[i] ? 0.75 : 0.5);
        setTimeout(() => { beat = i; el.querySelectorAll(".mq-beat").forEach((b, j) => b.classList.toggle("is-now", j === i)); }, w * 1000);
      });
    }
    function toggle() { on = !on; if (on) start(); else { loop && loop.stop(); beat = -1; } api.rerender(); }
    function tapTempo() {
      const n = performance.now(); taps = taps.filter((x) => n - x < 2500); taps.push(n);
      if (taps.length > 1) { const d = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); bpm = Math.max(40, Math.min(200, Math.round(60000 / d))); if (loop) loop.step = stepSec(); api.rerender(); }
      S.play("click", 1200, 0);
    }
    const api = mount(el, render, () => loop && loop.stop());
    api.onStop = () => { on = false; beat = -1; };
    return api;
  };

  /* =====================================================================
     5) INTERVALS
     ===================================================================== */
  W.intervals = function (el) {
    let cur = MQ.intervals[3], root = 60, dir = 1, kb;
    const render = () => {
      el.append(h("div", { class: "mq-chips" }, MQ.intervals.map((iv) => chip(AR() ? iv.ar.split(" (")[1].replace(")", "") : iv.id, iv === cur, () => { cur = iv; api.rerender(); playIt(); }, { title: t(iv) }))));
      const box = h("div", { class: "mq-kbhost" }); el.append(box);
      const other = root + dir * cur.semi;
      kb = W.keyboard(box, { start: dir > 0 ? 60 : 48, octaves: 2, highlight: [root, other], keys: false });
      el.append(h("div", { class: "mq-card mq-card--flat" },
        h("div", { class: "mq-row mq-row--between mq-wrap" }, h("b", { class: "mq-big" }, t(cur)), h("span", { class: "mq-tag mq-tag--" + cur.kind }, t(MQ.consonance[cur.kind]))),
        h("p", {}, L("تحصر بينها ", "Spans ") + t(cur.tones) + " · " + cur.semi + L(" أنصاف أبعاد", " semitones") + " · " + pname(midiName(root)) + " → " + pname(midiName(other))),
        h("p", { class: "mq-feel" }, L("الإحساس: ", "Feeling: ") + t(cur.feel)),
        h("div", { class: "mq-row mq-wrap" }, btn(L("استمع", "Listen"), playIt, "mq-btn--primary"), chip(L("صاعدة", "Rising"), dir > 0, () => { dir = 1; api.rerender(); }), chip(L("هابطة", "Falling"), dir < 0, () => { dir = -1; api.rerender(); }))));
    };
    function playIt() {
      const other = root + dir * cur.semi;
      kb && kb.press(root, 0, 0.7); kb && kb.press(other, 0.75, 0.7);
      S.chord("piano", [root, other], 1.6, 1.6, 0.9);
    }
    const api = mount(el, render);
    return api;
  };

  /* =====================================================================
     6) CHORDS (triads)
     ===================================================================== */
  W.chords = function (el) {
    let cur = MQ.chords[0], root = 60, kb;
    const roots = [60, 62, 64, 65, 67, 69, 71];
    const render = () => {
      el.append(h("div", { class: "mq-chips" }, roots.map((r) => chip(pname(midiName(r)), r === root, () => { root = r; api.rerender(); playIt(); }))));
      el.append(h("div", { class: "mq-chips" }, MQ.chords.map((c) => chip(t(c), c === cur, () => { cur = c; api.rerender(); playIt(); }))));
      const box = h("div", { class: "mq-kbhost" }); el.append(box);
      kb = W.keyboard(box, { start: 60, octaves: 2, highlight: cur.semis.map((x) => root + x), keys: false });
      const stack = h("div", { class: "mq-stack" }, cur.semis.slice().reverse().map((x, i) => h("div", { class: "mq-stack__n" }, h("b", {}, pname(midiName(root + x))), h("small", {}, [L("الخامسة", "fifth"), L("الثالثة", "third"), L("الأساس", "root")][i]))));
      el.append(h("div", { class: "mq-card mq-card--flat mq-row mq-wrap" }, stack,
        h("div", { class: "mq-grow" }, h("b", { class: "mq-big" }, t(cur)), h("p", {}, t(cur.build)), h("p", { class: "mq-feel" }, t(cur.feel)), btn(L("استمع", "Listen"), playIt, "mq-btn--primary"))));
    };
    function playIt() { cur.semis.forEach((x, i) => kb && kb.press(root + x, i * 0.28, 0.6)); S.chord("piano", cur.semis.map((x) => root + x), 1.0, 2, 1); S.chord("pad", cur.semis.map((x) => root + x - 12), 1.0, 2, 0.6); }
    const api = mount(el, render);
    return api;
  };

  /* =====================================================================
     7) KEY SIGNATURES & MINOR SCALES
     ===================================================================== */
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function scaleFromKey(key, sig) { // key like "Bb"; sig {F:"#"} -> 8 midi numbers
    const L0 = key[0], start = LET.indexOf(L0);
    let m0 = 60 + PC[L0] + (key[1] === "#" ? 1 : key[1] === "b" ? -1 : 0);
    if (m0 > 66) m0 -= 12;
    const out = [m0];
    for (let i = 1; i <= 7; i++) {
      const letter = LET[(start + i) % 7], acc = sig[letter] || "";
      const pc = (PC[letter] + (acc === "#" ? 1 : acc === "b" ? -1 : 0) + 12) % 12;
      let m = out[i - 1] + 1;
      while (((m % 12) + 12) % 12 !== pc) m++;
      out.push(m);
    }
    return out;
  }
  W.circle = function (el) {
    let tab = "keys", kind = "sharp", n = 2, minor = "natural", kb, playing = null;
    const sharpSteps = { F: 8, C: 5, G: 9, D: 6, A: 3, E: 7, B: 4 }, flatSteps = { B: 4, E: 7, A: 3, D: 6, G: 2, C: 5, F: 1 };
    const render = () => {
      el.append(h("div", { class: "mq-seg" }, chip(L("السلالم الكبيرة", "Major keys"), tab === "keys", () => { tab = "keys"; api.rerender(); }), chip(L("السلالم الصغيرة", "Minor forms"), tab === "minor", () => { tab = "minor"; api.rerender(); })));
      if (tab === "keys") keys(); else minors();
    };
    function sigObj() { const o = {}; (kind === "sharp" ? MQ.sharpOrder : MQ.flatOrder).slice(0, n).forEach((l) => (o[l] = kind === "sharp" ? "#" : "b")); return o; }
    function keyName(k) { const m = /^([A-G])(#|b)?$/.exec(k); const i = LET.indexOf(m[1]); const a = m[2] ? accSym[m[2]] : ""; return AR() ? MQ.solfege.ar[i] + a : m[1] + a; }
    function keys() {
      const order = kind === "sharp" ? MQ.sharpOrder : MQ.flatOrder;
      const major = (kind === "sharp" ? MQ.majorBySharps : MQ.majorByFlats)[n], minorK = (kind === "sharp" ? MQ.minorBySharps : MQ.minorByFlats)[n];
      el.append(h("div", { class: "mq-row mq-wrap mq-row--between" },
        h("div", { class: "mq-seg" }, chip("♯ " + L("دييز", "Sharps"), kind === "sharp", () => { kind = "sharp"; api.rerender(); }), chip("♭ " + L("بيمول", "Flats"), kind === "flat", () => { kind = "flat"; api.rerender(); })),
        h("label", { class: "mq-row" }, h("span", { class: "mq-dim" }, L("العدد", "Count")), h("input", { type: "range", min: 0, max: 7, value: n, class: "mq-range", oninput: (e) => { n = +e.target.value; api.rerender(); } }), h("b", { class: "mq-num" }, n))));
      const NWc = (el.clientWidth || Math.min(innerWidth - 40, 1100)) < 560, VWc = NWc ? 360 : 640;
      const svgE = s("svg", { viewBox: `0 0 ${VWc} 200`, class: "mq-staff mq-staff--sig", role: "img", "aria-label": L("دليل السلم", "Key signature") });
      for (let i = 0; i < 5; i++) svgE.append(s("line", { x1: 12, x2: VWc - 12, y1: 150 - i * 20, y2: 150 - i * 20, class: "mq-staff__line" }));
      svgE.append(s("text", { x: 34, y: 150, class: "mq-glyph mq-staff__clef" }, "\u{1D11E}"));
      order.slice(0, n).forEach((l, i) => {
        const st = (kind === "sharp" ? sharpSteps : flatSteps)[l], y = 150 - st * 10;
        svgE.append(s("text", { x: (NWc ? 100 : 118) + i * (NWc ? 30 : 30), y: y + (kind === "sharp" ? 8 : 7), class: "mq-glyph mq-staff__acc" + (i === n - 1 ? " is-last" : kind === "flat" && i === n - 2 ? " is-key" : "") }, kind === "sharp" ? "♯" : "♭"));
      });
      el.append(h("div", { class: "mq-staffwrap" }, svgE));
      const rule = n === 0 ? L("بلا علامات تحويل: سلم دو الكبير ولا الصغير الطبيعيان.", "No accidentals: C major and A minor.")
        : kind === "sharp" ? L(`آخر دييز هو ${keyName(order[n - 1] + "#")} = الحسّاس، نصعد نصف درجة ← ${keyName(major)} الكبير.`, `The last sharp, ${keyName(order[n - 1] + "#")}, is the leading note; up a half step → ${keyName(major)} major.`)
          : n === 1 ? L("بيمول واحد (سي♭): سلم فا الكبير — حالة تُحفظ.", "One flat (B♭): F major — learn it by heart.")
            : L(`البيمول قبل الأخير (${keyName(order[n - 2] + "b")}) هو اسم السلم ← ${keyName(major)} الكبير.`, `The second-to-last flat (${keyName(order[n - 2] + "b")}) names the key → ${keyName(major)} major.`);
      el.append(h("div", { class: "mq-card mq-card--flat" },
        h("div", { class: "mq-row mq-wrap mq-row--between" }, h("b", { class: "mq-big" }, keyName(major) + L(" الكبير", " major")), h("span", { class: "mq-dim" }, L("الصغير المشترك معه: ", "Relative minor: ") + keyName(minorK) + L(" الصغير", " minor"))),
        h("p", {}, rule),
        h("p", { class: "mq-dim" }, L("الترتيب: ", "Order: ") + order.map((l, i) => h("span", { class: i < n ? "mq-hl" : "" }, keyName(l) + (kind === "sharp" ? "♯" : "♭") + (i < 6 ? " · " : ""))).map((x) => x.textContent).join("")),
        btn(L("اعزف السلم", "Play the scale"), () => playScale(scaleFromKey(major, sigObj())), "mq-btn--primary")));
      const box = h("div", { class: "mq-kbhost" }); el.append(box);
      kb = W.keyboard(box, { start: 48, octaves: 3, keys: false });
    }
    function minors() {
      el.append(h("div", { class: "mq-chips" }, [["natural", "طبيعي", "Natural"], ["harmonic", "هارموني", "Harmonic"], ["melodic", "ميلودي", "Melodic"]].map(([id, ar, en]) => chip(L(ar, en), minor === id, () => { minor = id; api.rerender(); }))));
      const up = { natural: [57, 59, 60, 62, 64, 65, 67, 69], harmonic: [57, 59, 60, 62, 64, 65, 68, 69], melodic: [57, 59, 60, 62, 64, 66, 68, 69] }[minor];
      const down = minor === "melodic" ? [69, 67, 65, 64, 62, 60, 59, 57] : up.slice().reverse();
      const txt = { natural: L("الترتيب الطبيعي: يبدأ من الدرجة السادسة لسلم دو الكبير.", "Natural order: starts on the 6th degree of C major."), harmonic: L("ترفع الدرجة السابعة (صول♯) نصف بعد صعودًا وهبوطًا.", "The 7th (G♯) is raised a half step, up and down."), melodic: L("ترفع السادسة والسابعة (فا♯، صول♯) صعودًا وتعودان طبيعيتين هبوطًا.", "The 6th and 7th (F♯, G♯) are raised going up, natural coming down.") }[minor];
      el.append(h("div", { class: "mq-card mq-card--flat" }, h("b", { class: "mq-big" }, L("سلم لا الصغير ", "A minor — ") + L({ natural: "الطبيعي", harmonic: "الهارموني", melodic: "الميلودي" }[minor], minor)), h("p", {}, txt),
        h("p", { class: "mq-dim", dir: "ltr" }, "↑ " + up.map((m) => pname(midiName(m))).join("  ") + "   ↓ " + down.map((m) => pname(midiName(m))).join("  ")),
        h("div", { class: "mq-row mq-wrap" }, btn(L("صعودًا ثم هبوطًا", "Up, then down"), () => playScale(up.concat(down.slice(1))), "mq-btn--primary"))));
      const box = h("div", { class: "mq-kbhost" }); el.append(box);
      kb = W.keyboard(box, { start: 57, octaves: 1, keys: false, highlight: up });
    }
    function playScale(ms) {
      playing && playing.stop();
      const ev = ms.map((m, i) => ({ at: i * 0.32, fn: (w) => kb && kb.press(m, w, 0.34) }));
      ev.push({ at: ms.length * 0.32, fn: (w) => S.chord("piano", [ms[0], ms[0] + 12], w, 1.2) });
      playing = run(ev);
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  W._util = { h, s, btn, chip, L, mount, run, pname, midiName, fromDiat, diat, RM };
})();
