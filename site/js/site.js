/* ===== Site controller ===== */
(function () {
  const MQ = window.MQ, S = window.Sound, W = window.MQW;
  const root = document.documentElement;
  const $ = (q, c = document) => c.querySelector(q), $$ = (q, c = document) => [...c.querySelectorAll(q)];
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ---------- language ---------- */
  MQ.lang = root.lang === "en" ? "en" : "ar";
  const META = {
    ar: { t: document.title, d: (document.querySelector('meta[name="description"]') || {}).content },
    en: { t: "Maqam | Interactive Introduction to Musicology — supervised by Dr. Khalifa Jadallah | An-Najah National University",
          d: "Maqam: an interactive, sound-first website for An-Najah National University's Introduction to Musicology course, supervised by Dr. Khalifa Jadallah — staff and clefs, intervals and scales, the orchestra, musical eras, Arabic maqamat in true quarter tones, Arabic rhythms and a guess-the-melody game." },
  };
  function applyMeta() {
    const m = META[MQ.lang] || META.ar, md = document.querySelector('meta[name="description"]');
    document.title = m.t; if (md && m.d) md.content = m.d;
    const can = document.querySelector('link[rel="canonical"]');
    if (can) { const base = can.href.split("?")[0]; can.href = MQ.lang === "en" ? base + "?lang=en" : base; }
    try { const u = new URL(location.href); if (MQ.lang === "en") u.searchParams.set("lang", "en"); else u.searchParams.delete("lang"); history.replaceState(null, "", u.pathname + u.search + u.hash); } catch (_) {}
  }
  function setLang(l) {
    MQ.lang = l; root.lang = l; root.dir = l === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("mq-lang", l); } catch (_) {}
    applyMeta();
    document.dispatchEvent(new Event("mq:lang"));
    buildStatic();
  }
  $$("[data-toggle-lang]").forEach((b) => b.addEventListener("click", () => setLang(MQ.lang === "ar" ? "en" : "ar")));

  /* ---------- theme ---------- */
  $("#themeBtn").addEventListener("click", () => {
    const th = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = th; try { localStorage.setItem("mq-theme", th); } catch (_) {}
    $('meta[name="theme-color"]').content = th === "light" ? "#F5F2FB" : "#130F1E";
  });

  /* ---------- sound ---------- */
  const soundBtn = $("#soundBtn");
  const syncSound = () => { soundBtn.setAttribute("aria-pressed", S.enabled ? "true" : "false"); soundBtn.setAttribute("aria-label", S.enabled ? (MQ.lang === "ar" ? "كتم الصوت" : "Mute") : (MQ.lang === "ar" ? "تشغيل الصوت" : "Unmute")); };
  soundBtn.addEventListener("click", () => { S.init(); S.setEnabled(!S.enabled); syncSound(); });
  syncSound();

  /* ---------- veil (curtain) ---------- */
  const veil = $("#veil");
  let entered = false;
  const seen = (() => { try { return sessionStorage.getItem("mq-in") === "1"; } catch (_) { return false; } })();
  function enter(withSound) {
    if (entered) return; entered = true;
    S.init(); S.setEnabled(withSound); syncSound();
    veil.classList.add("is-open"); document.body.classList.remove("is-veiled");
    try { sessionStorage.setItem("mq-in", "1"); } catch (_) {}
    setTimeout(() => { veil.hidden = true; }, 1600);
    setTimeout(() => strings && strings.strum(), 650);
    $("#hero").focus && $("#heroTitle").setAttribute("tabindex", "-1");
  }
  if (seen) { veil.classList.add("is-open"); veil.hidden = true; entered = true; }
  else {
    document.body.classList.add("is-veiled");
    $("#enterSound").addEventListener("click", () => enter(true));
    $("#enterSilent").addEventListener("click", () => enter(false));
    veil.addEventListener("keydown", (e) => { if (e.key === "Escape") enter(false); });
    setTimeout(() => $("#enterSound").focus(), 300);
  }

  /* ---------- mobile sheet ---------- */
  const sheet = $("#sheet"), menuBtn = $("#menuBtn");
  menuBtn.addEventListener("click", () => { const open = sheet.hidden; sheet.hidden = !open; menuBtn.setAttribute("aria-expanded", open); document.body.style.overflow = open ? "hidden" : ""; });
  sheet.addEventListener("click", (e) => { if (e.target.closest("a")) { sheet.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; } });

  /* =====================================================================
     HERO: five staff lines as playable strings (Karplus-Strong audio)
     ===================================================================== */
  const strings = (function () {
    const cv = $("#strings"); if (!cv) return null;
    const ctx = cv.getContext("2d");
    const NOTES = ["E4", "G4", "B4", "D5", "F5"]; // bottom -> top, treble staff lines
    const st = NOTES.map((n, i) => ({ n, i, amp: 0, t0: 0, px: 0.5, glow: 0 }));
    const parts = [];
    let w = 0, h = 0, dpr = 1, gap = 0, baseY = 0, last = null, col = {}, raf;
    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      const r = cv.getBoundingClientRect(); w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = Math.min(44, Math.max(28, innerHeight / 22));
      const hero = cv.parentElement, need = gap * 4 + 110;
      if (hero.style.getPropertyValue("--strings-h") !== need + "px") { hero.style.setProperty("--strings-h", need + "px"); const r2 = cv.getBoundingClientRect(); h = r2.height; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      baseY = h - 70;
      const cs = getComputedStyle(root);
      col = { line: cs.getPropertyValue("--ink-3").trim(), hot: cs.getPropertyValue("--brass").trim(), ink: cs.getPropertyValue("--ink").trim(), wave: cs.getPropertyValue("--wave").trim() };
    }
    const yOf = (i) => baseY - i * gap;
    function pluck(i, x, vel = 1) {
      const s = st[i]; s.amp = Math.min(22, 8 + vel * 14); s.t0 = performance.now(); s.px = Math.max(0.05, Math.min(0.95, x / w)); s.glow = 1;
      S.play("string", s.n, 0, 2.2, Math.min(1, 0.45 + vel * 0.55), (s.px - 0.5) * 1.2);
      const glyphs = ["\u{1D15F}", "\u{1D160}", "\u{1D15E}", "\u{1D161}"];
      for (let k = 0; k < 2; k++) parts.push({ x, y: yOf(i), vx: (Math.random() - 0.5) * 0.6, vy: -0.6 - Math.random() * 0.9, life: 1, g: glyphs[(Math.random() * 4) | 0], r: (Math.random() - 0.5) * 0.6 });
      const nm = $("#heroNow"); if (nm) nm.textContent = W.pname(s.n, true);
    }
    function onMove(e) {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (last) {
        const dy = y - last.y, speed = Math.hypot(x - last.x, dy) / Math.max(1, e.timeStamp - last.t);
        st.forEach((s) => { const sy = yOf(s.i); if ((last.y - sy) * (y - sy) < 0 && performance.now() - s.t0 > 60) pluck(s.i, x, Math.min(1.4, speed)); });
      }
      last = { x, y, t: e.timeStamp };
    }
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", () => (last = null));
    cv.addEventListener("pointerdown", (e) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = -1, d = 1e9; st.forEach((s) => { const dd = Math.abs(yOf(s.i) - y); if (dd < d) { d = dd; best = s.i; } });
      if (d < gap * 0.6) pluck(best, x, 0.8);
      last = { x, y, t: e.timeStamp };
    });
    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      // faint bar lines, like a score
      ctx.strokeStyle = col.line; ctx.globalAlpha = 0.25; ctx.lineWidth = 1;
      [0.06, 0.94].forEach((f) => { ctx.beginPath(); ctx.moveTo(w * f, yOf(0)); ctx.lineTo(w * f, yOf(4)); ctx.stroke(); });
      st.forEach((s) => {
        const age = (now - s.t0) / 1000, a = s.amp * Math.exp(-age * 2.2), y0 = yOf(s.i);
        const idle = RM ? 0 : Math.sin(now / 900 + s.i) * 0.6;
        ctx.globalAlpha = 0.45 + 0.55 * Math.min(1, a / 6 + s.glow * 0.4);
        ctx.strokeStyle = a > 0.4 ? col.hot : col.line; ctx.lineWidth = a > 0.4 ? 2 : 1.3;
        ctx.beginPath();
        const N = 90, osc = Math.cos(age * (28 + s.i * 7));
        for (let k = 0; k <= N; k++) {
          const u = k / N, x = w * 0.06 + u * w * 0.88;
          const shape = u < s.px ? u / s.px : (1 - u) / (1 - s.px);
          const y = y0 + (a > 0.05 ? a * shape * osc * Math.sin(Math.PI * u) * 1.4 : idle * Math.sin(Math.PI * u));
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        s.glow *= 0.94;
      });
      ctx.globalAlpha = 1;
      ctx.font = "34px Notation"; ctx.textAlign = "center";
      for (let k = parts.length - 1; k >= 0; k--) {
        const p = parts[k]; p.x += p.vx; p.y += p.vy; p.vy -= 0.004; p.life -= 0.009;
        if (p.life <= 0) { parts.splice(k, 1); continue; }
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = col.hot; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillText(p.g, 0, 0); ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    }
    resize();
    addEventListener("resize", resize);
    new MutationObserver(resize).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(draw); });
    io.observe(cv);
    return { strum() { [0, 1, 2, 3, 4].forEach((i, k) => setTimeout(() => pluck(i, w * (0.3 + k * 0.1), 0.7), k * 110)); } };
  })();

  /* ---------- I. trio cards ---------- */
  (function trio() {
    const sci = $('[data-trio="science"]'), cv = $(".trio__scope", sci), range = $("input", sci), hz = $(".trio__hz", sci);
    const c2 = cv.getContext("2d");
    let f = 220, t0 = 0, raf;
    const drawScope = () => {
      const W0 = cv.width, H0 = cv.height; c2.clearRect(0, 0, W0, H0);
      c2.strokeStyle = getComputedStyle(root).getPropertyValue("--wave"); c2.lineWidth = 2; c2.beginPath();
      for (let x = 0; x < W0; x++) { const y = H0 / 2 + Math.sin((x / W0) * Math.PI * 2 * (f / 55) + t0) * H0 * 0.36; x ? c2.lineTo(x, y) : c2.moveTo(x, y); }
      c2.stroke(); t0 += 0.08; raf = requestAnimationFrame(drawScope);
    };
    new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) drawScope(); }).observe(cv);
    range.addEventListener("click", (e) => e.stopPropagation());
    range.addEventListener("input", () => { f = +range.value; hz.textContent = f + " Hz"; });
    range.addEventListener("change", () => S.play("sine", { hz: f }, 0, 0.7));
    sci.addEventListener("click", () => S.play("sine", { hz: f }, 0, 0.8));
    $('[data-trio="art"]').addEventListener("click", () => {
      [[67, 0, 0.5, 0.5], [72, 0.5, 0.35, 0.7], [76, 0.9, 0.5, 0.9], [74, 1.45, 0.25, 0.7], [72, 1.75, 1.2, 0.5]].forEach(([m, a, d, v]) => S.play("violin", m, a, d, v));
      S.chord("pad", [48, 55, 64], 0, 3, 0.7);
    });
    const lang = $('[data-trio="language"]'), nts = $(".trio__notes", lang);
    lang.addEventListener("click", () => {
      nts.textContent = "";
      ["C4", "D4", "E4", "F4", "G4"].forEach((n, i) => { S.play("piano", n, i * 0.3, 0.4); setTimeout(() => (nts.textContent += "\u{1D15F}"), i * 300); });
    });
  })();

  /* ---------- static bilingual blocks built from data ---------- */
  function buildStatic() {
    const t = MQ.t;
    const clefs = $("#clefs"); clefs.innerHTML = "";
    MQ.clefs.forEach((c) => clefs.append(W.h("div", { class: "clef" }, W.h("span", { class: "mq-glyph", "aria-hidden": "true" }, c.glyph), W.h("div", {}, W.h("b", {}, t(c)), W.h("small", {}, t(c.range))))));
    const forms = $("#forms"); forms.innerHTML = "";
    MQ.arabicVocal.filter((f) => ["muwash", "dawr", "mawwal", "nashid", "qasida", "taqtuqa"].includes(f.id)).forEach((f) =>
      forms.append(W.h("article", { class: "form" }, W.h("h4", {}, t(f)), W.h("p", {}, t(f.d)), f.parts ? W.h("div", { class: "form__parts" }, f.parts.map((p) => W.h("span", {}, t(p)))) : null)));
    MQ.arabicInstr.forEach((f) => forms.append(W.h("article", { class: "form form--instr" }, W.h("h4", {}, t(f)), W.h("p", {}, t(f.d)), f.ex ? W.h("div", { class: "form__parts" }, W.h("span", {}, t(f.ex))) : null)));
    $("#year").textContent = new Date().getFullYear();
  }

  /* ---------- lazy-mount widgets as they approach the viewport ---------- */
  const mounted = new WeakMap();
  const wio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting || mounted.has(e.target)) return;
    const el = e.target, name = el.dataset.widget;
    const inst = W[name] && W[name](el, name === "quiz" ? { count: +el.dataset.count || 6 } : {});
    mounted.set(el, inst);
    wio.unobserve(el);
  }), { rootMargin: "300px 0px" });
  $$("[data-widget]").forEach((el) => wio.observe(el));

  /* ---------- reveal + nav state + score line ---------- */
  if (!RM) {
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".mvt__head, .mvt__lead, .stage, .trio, .origin, .forms, .maestro__copy, .about").forEach((el) => { el.classList.add("reveal"); rio.observe(el); });
  }
  const navLinks = $$(".nav a");
  const sio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main > section[id]").forEach((s) => sio.observe(s));
  const fill = $("#scoreFill");
  addEventListener("scroll", () => { const m = document.documentElement.scrollHeight - innerHeight; fill.style.width = (m > 0 ? (scrollY / m) * 100 : 0) + "%"; }, { passive: true });

  /* ---------- APK button ---------- */

  $("#toTop").addEventListener("click", (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: RM ? "auto" : "smooth" }); });
  applyMeta();
  buildStatic();
})();

/* About ("Coda"): live numbers from the content, count-up on view, pointer glow on the map cards */
(function () {
  const sec = document.getElementById("about");
  if (!sec) return;
  const MQ = window.MQ || {};
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nums = [...sec.querySelectorAll("[data-count]")];
  nums.forEach((b) => { const k = b.dataset.src; if (k && Array.isArray(MQ[k])) b.dataset.count = MQ[k].length; b.textContent = b.dataset.count; });
  const run = () => nums.forEach((b, i) => {
    const to = +b.dataset.count; if (RM) { b.textContent = to; return; }
    const t0 = performance.now() + i * 120, dur = 1100;
    const f = (now) => { const k = Math.max(0, Math.min(1, (now - t0) / dur)); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); };
    b.textContent = "0"; requestAnimationFrame(f);
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: 0.3 });
  io.observe(sec.querySelector(".about__stats"));
  if (matchMedia("(pointer: fine)").matches) sec.querySelectorAll(".atlas__card").forEach((c) => c.addEventListener("pointermove", (e) => {
    const r = c.getBoundingClientRect(); c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
  }));
})();

/* Scroll choreography — calm, two-way transitions between sections.
   Each section eases in (rise + fade) as it arrives and softly recedes as it
   leaves, in both scroll directions. Only CSS variables are written, once per
   frame, for sections near the viewport. A side rail shows where you are. */
(function () {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const secs = [...document.querySelectorAll("main > section.mvt, main > section.maestro")];
  if (!secs.length) return;
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (x) => x * x * (3 - 2 * x); // ease-in-out: slow start, slow finish

  /* side rail: one dot per movement; the current one stretches and names itself */
  const rail = document.createElement("nav");
  rail.className = "srail is-hidden"; rail.setAttribute("aria-label", "Sections");
  const items = secs.map((s) => {
    const no = s.querySelector(".mvt__no");
    const roman = no && !no.classList.contains("about__clef") ? no.textContent.trim() : s.id === "maestro" ? "✦" : "♪";
    const a = document.createElement("a");
    a.href = "#" + s.id; a.className = "srail__i";
    a.innerHTML = '<span class="srail__d" aria-hidden="true"></span><span class="srail__t"><b></b><span></span></span>';
    a.querySelector("b").textContent = roman;
    const paint = () => {
      const h = s.querySelector("h2 [data-l='" + (document.documentElement.lang === "en" ? "en" : "ar") + "']") || s.querySelector("h2");
      const txt = (h ? h.textContent : "").split(" — ")[0].trim();
      a.querySelector(".srail__t > span").textContent = txt; a.setAttribute("aria-label", roman + " — " + txt);
    };
    paint(); document.addEventListener("mq:lang", paint);
    rail.append(a); return { s, a };
  });
  document.body.append(rail);

  if (!RM) secs.forEach((s) => s.classList.add("sv"));
  let ticking = false, active = null;
  const frame = () => {
    ticking = false;
    const vh = innerHeight, mark = vh * 0.45;
    let cur = null;
    for (const s of secs) {
      const r = s.getBoundingClientRect();
      if (r.top <= mark && r.bottom > mark) cur = s;
      if (RM || r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      // symmetric in both directions: the edge that is entering the screen decides.
      const fromBelow = smooth(clamp((vh - r.top) / (vh * 0.62)));  // top edge rising into view (scrolling down)
      const fromAbove = smooth(clamp(r.bottom / (vh * 0.62)));      // bottom edge dropping into view (scrolling up)
      const v = Math.min(fromBelow, fromAbove);
      const dir = fromBelow <= fromAbove ? 1 : -1;                  // below: rises up · above: settles down
      s.style.setProperty("--sv-o", (0.06 + 0.94 * v).toFixed(3));
      s.style.setProperty("--sv-y", (dir * (1 - v) * 70).toFixed(1) + "px");
      s.style.setProperty("--sv-s", (1 - 0.05 * (1 - v)).toFixed(4));
      s.style.setProperty("--sv-e", v.toFixed(3));
      s.style.setProperty("--sv-org", dir > 0 ? "50% 0%" : "50% 100%");
    }
    if (cur !== active) { active = cur; items.forEach((it) => it.a.classList.toggle("is-on", it.s === cur)); }
    rail.classList.toggle("is-hidden", !cur);
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", req, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(req).observe(document.body);
  frame();
})();
