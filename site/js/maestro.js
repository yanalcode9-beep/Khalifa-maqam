/* Supervisor section — oud taqsim in maqam Rast (true quarter tones).
   While the oud plays, the photo comes alive: the plucking hand strikes with
   the risha, the strings vibrate, the left hand moves along the neck and
   sound rings open from the rosette. On desktop the "tap the oud" button
   only appears when the pointer reaches the oud. */
(function () {
  const S = window.Sound, W = window.MQW, MQ = window.MQ;
  const stage = document.getElementById("maestroStage");
  if (!stage || !S || !W) return;
  const sec = document.getElementById("maestro");
  const notesBox = document.getElementById("maestroNotes");
  const playBtn = document.getElementById("maestroPlay");
  const oudBtn = document.getElementById("maestroOud");
  const photo = stage.querySelector(".maestro__photo");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Rast on C3 (oud register): cents from the tonic. 350 = E half-flat (Sikah), 1050 = B half-flat (Awj) */
  const BASE = S.freq("C3");
  const RAST = [0, 200, 350, 500, 700, 900, 1050, 1200];
  const hz = (deg) => S.cents(BASE, RAST[((deg % 8) + 8) % 8] + (deg >= 8 ? 1200 : 0));

  // [degree, beats, tremolo?] — a short sayr: open the jins, rise to Nawa, touch Awj, turn and close (qafla) on Rast
  const SHORT = [[0, 0.5], [1, 0.5], [2, 1, 1], [1, 0.5], [2, 0.5], [3, 1], [2, 0.5], [1, 0.5], [0, 2, 1]];
  const LONG = [
    [0, 0.5], [0, 0.25], [1, 0.25], [2, 1.5, 1], [3, 0.5], [2, 0.5], [1, 0.5], [2, 1, 1], [0, 0.5], [1, 0.5],
    [2, 0.5], [3, 0.5], [4, 2, 1], [5, 0.5], [6, 0.5], [7, 1.5, 1], [6, 0.5], [5, 0.5], [4, 1, 1],
    [3, 0.5], [2, 0.5], [3, 0.5], [4, 0.5], [3, 0.5], [2, 1, 1], [1, 0.5], [2, 0.5], [1, 0.5], [0, 3, 1],
  ];
  const GLYPHS = ["\u{1D15F}", "\u{1D160}", "\u{1D161}", "♪", "♫"];
  let job = null;

  /* ---------- the living photo: layers cut from the same picture ---------- */
  const W0 = 760, H0 = 1048, NS = "http://www.w3.org/2000/svg";
  const pc = (x, y) => (x / W0 * 100).toFixed(2) + "% " + (y / H0 * 100).toFixed(2) + "%";
  const live = document.createElement("div");
  live.className = "maestro__live"; live.setAttribute("aria-hidden", "true");
  function cut(poly, origin) {
    const im = document.createElement("img");
    im.src = photo.getAttribute("src"); im.alt = ""; im.decoding = "async"; im.className = "maestro__cut";
    im.style.clipPath = "polygon(" + poly.map(([x, y]) => pc(x, y)).join(",") + ")";
    im.style.transformOrigin = pc(origin[0], origin[1]);
    live.append(im); return im;
  }
  // right hand holding the risha, pivoting at the wrist
  const hand = cut([[0, 592], [58, 584], [112, 602], [134, 636], [136, 690], [112, 726], [62, 734], [0, 716]], [4, 668]);
  // strings (six courses) + rings from the rosette
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W0} ${H0}`); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("class", "maestro__strings");
  const STR = [];
  for (let k = 0; k < 6; k++) {
    const a = [78 + k * 2.8, 598 - k * 2.6], b = [330 + k * 3.6, 922 - k * 4.4];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("class", "maestro__str");
    svg.append(p);
    STR.push({ p, a, b, nx: -dy / len, ny: dx / len, amp: 0, t0: 0 });
  }
  const ROSE = [172, 702];
  live.append(svg);
  stage.insertBefore(live, oudBtn);

  let raf = 0;
  function drawStrings(now) {
    let busy = false;
    STR.forEach((s) => {
      const t = (now - s.t0) / 1000, env = s.amp * Math.exp(-t / 0.3);
      const off = env * Math.sin(2 * Math.PI * 7 * t);
      const mx = (s.a[0] + s.b[0]) / 2 + s.nx * off, my = (s.a[1] + s.b[1]) / 2 + s.ny * off;
      s.p.setAttribute("d", `M${s.a[0]},${s.a[1]} Q${mx.toFixed(2)},${my.toFixed(2)} ${s.b[0]},${s.b[1]}`);
      s.p.style.opacity = Math.min(0.42, Math.abs(env) / 4).toFixed(3);
      if (env > 0.03) busy = true;
    });
    raf = busy ? requestAnimationFrame(drawStrings) : 0;
  }
  function ring() {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", ROSE[0]); c.setAttribute("cy", ROSE[1]); c.setAttribute("r", 46); c.setAttribute("class", "maestro__wave");
    svg.append(c); setTimeout(() => c.remove(), 1400);
  }
  function pluck(deg, trem, strong) {
    if (RM) return;
    const now = performance.now(), course = Math.min(5, Math.floor((((deg % 8) + 8) % 8) * 6 / 8));
    STR.forEach((s, i) => { const d = Math.abs(i - course); const a = d === 0 ? 1.8 : d === 1 ? 0.5 : 0; if (a) { s.amp = a; s.t0 = now; } });
    if (!raf) raf = requestAnimationFrame(drawStrings);
    const k = trem ? 0.55 : 1;
    hand.animate([{ transform: "translate(0,0) rotate(0deg)" }, { transform: `translate(${(0.9 * k).toFixed(2)}px,${(1.1 * k).toFixed(2)}px) rotate(${(-0.7 * k).toFixed(2)}deg)` }, { transform: "translate(0,0) rotate(0deg)" }], { duration: trem ? 150 : 340, easing: "ease-in-out" });
    if (!trem || strong) ring();
  }
  function settle() {}

  function burst(n = 1) {
    if (RM) return;
    for (let i = 0; i < n; i++) {
      const g = document.createElement("span");
      g.className = "maestro__note";
      g.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      g.style.setProperty("--x", (Math.random() * 120 - 60).toFixed(0) + "px");
      g.style.setProperty("--r", (Math.random() * 50 - 25).toFixed(0) + "deg");
      g.style.setProperty("--d", (1.6 + Math.random() * 1.2).toFixed(2) + "s");
      notesBox.append(g);
      setTimeout(() => g.remove(), 3000);
    }
  }

  function play(seq, beat) {
    if (job && job.alive) { job.stop(); return; }
    S.init();
    const ev = [];
    let at = 0;
    seq.forEach(([deg, b, trem]) => {
      const f = hz(deg), d = b * beat;
      if (trem) {
        // risha tremolo on long notes, like an oud player
        const n = Math.max(2, Math.round(d / 0.085));
        for (let k = 0; k < n; k++) ev.push({ at: at + k * (d / n), fn: (w) => { S.play("oud", { hz: f }, w, 0.25, k ? 0.5 : 0.95); setTimeout(() => pluck(deg, true, k === 0), w * 1000); } });
      } else ev.push({ at, fn: (w) => { S.play("oud", { hz: f }, w, Math.max(0.4, d * 1.3), 0.95); setTimeout(() => pluck(deg, false), w * 1000); } });
      ev.push({ at, fn: (w) => setTimeout(() => burst(trem ? 2 : 1), w * 1000) });
      at += d;
    });
    // a soft drone on the tonic underneath
    ev.push({ at: 0, fn: (w) => S.play("pad", { hz: BASE / 2 }, w, at + 0.6, 0.45) });
    sec.classList.add("is-playing");
    stage.classList.remove("near-oud");
    sync(true);
    job = W.run(ev, { total: at + 0.8, onEnd: () => { sec.classList.remove("is-playing"); sync(false); settle(); } });
  }
  function sync(on) {
    playBtn.classList.toggle("is-on", on);
    playBtn.querySelector('[data-l="ar"]').textContent = on ? "إيقاف" : "اسمع تقسيمة على مقام الراست";
    playBtn.querySelector('[data-l="en"]').textContent = on ? "Stop" : "Hear a taqsim in maqam Rast";
  }
  playBtn.addEventListener("click", () => play(LONG, 0.36));
  oudBtn.addEventListener("click", (e) => { e.stopPropagation(); play(SHORT, 0.32); });
  document.addEventListener("mq:stopall", () => { sec.classList.remove("is-playing"); sync(false); settle(); });

  /* the oud itself is the instrument: tapping it plays, and on desktop the
     button only shows up when the pointer reaches the oud */
  const onOud = (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const ex = (x - 0.27) / 0.24, ey = (y - 0.66) / 0.25; // ellipse around the oud's body and neck root
    return ex * ex + ey * ey <= 1;
  };
  stage.addEventListener("click", (e) => { if (e.target.closest("button")) return; if (onOud(e) && !(job && job.alive)) play(SHORT, 0.32); });
  if (FINE) {
    stage.classList.add("is-hover-reveal");
    stage.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") stage.classList.toggle("near-oud", onOud(e) && !sec.classList.contains("is-playing")); });
    stage.addEventListener("pointerleave", () => stage.classList.remove("near-oud"));
  }

  /* reveal on view */
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) sec.classList.add("is-in"); }), { threshold: 0.25 }).observe(sec);

  /* parallax (fine pointers only) */
  if (!RM && FINE) {
    let pr = 0, tx = 0, ty = 0;
    stage.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(pr);
      pr = requestAnimationFrame(() => { stage.style.setProperty("--px", tx.toFixed(3)); stage.style.setProperty("--py", ty.toFixed(3)); });
    });
    stage.addEventListener("pointerleave", () => { stage.style.setProperty("--px", 0); stage.style.setProperty("--py", 0); });
  }
})();
