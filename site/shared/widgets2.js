/* Widgets part 2 — orchestra, eras, forms, maqam, rhythms, mixer, quiz */
(function () {
  const MQ = window.MQ, S = window.Sound, W = window.MQW;
  const { h, s, btn, chip, L, mount, run, pname, midiName, RM } = W._util;
  const t = (o) => MQ.t(o);
  const AR = () => MQ.lang === "ar";

  /* =====================================================================
     ORCHESTRA — seating map (audience view)
     ===================================================================== */
  const SEATS = [
    // ring (r0,r1), angles in degrees (180 = left, 0 = right)
    ["violin1", 70, 150, 180, 128], ["violin2", 70, 150, 128, 90], ["viola", 70, 150, 90, 52], ["cello", 70, 150, 52, 0],
    ["harp", 150, 225, 180, 160], ["piano", 150, 225, 160, 140],
    // woodwinds, standard seating: flutes + oboes in the front row, clarinets + bassoons behind them
    ["piccolo", 150, 190, 140, 120], ["flute", 150, 190, 120, 90], ["oboe", 150, 190, 90, 60], ["ehorn", 150, 190, 60, 40],
    ["bclar", 190, 225, 140, 120], ["clarinet", 190, 225, 120, 90], ["bassoon", 190, 225, 90, 60], ["cbassoon", 190, 225, 60, 40], ["bass", 150, 225, 40, 0],
    ["horn", 225, 285, 180, 128], ["trumpet", 225, 285, 128, 96], ["trombone", 225, 285, 96, 66], ["btrombone", 225, 285, 66, 50], ["tuba", 225, 285, 50, 26],
    ["timpani", 285, 335, 112, 72], ["bdrum", 285, 335, 72, 54], ["snare", 285, 335, 54, 40], ["cymbals", 285, 335, 128, 112], ["triangle", 285, 335, 140, 128], ["gong", 285, 335, 40, 26], ["xylo", 285, 335, 152, 140],
  ];
  const CX = 360, CY = 370;
  const pt = (r, a) => [CX + r * Math.cos((a * Math.PI) / 180), CY - r * Math.sin((a * Math.PI) / 180)];
  function arc(r0, r1, a0, a1) {
    const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
    const big = Math.abs(a0 - a1) > 180 ? 1 : 0;
    return `M${x0},${y0} A${r1},${r1} 0 ${big} 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 ${big} 0 ${x3},${y3} Z`;
  }
  function motif(inst, when = 0) {
    const f = inst.f || 440, v = inst.voice;
    if (["cymbal", "triangle", "gong", "bassdrum", "snare"].includes(v)) { [0, 0.45, 0.9].forEach((d, i) => S.play(v, { hz: f }, when + d, 0.4, i ? 0.6 : 0.9)); return; }
    if (v === "timpani") { [0, 0.18, 0.36, 0.72].forEach((d, i) => S.play(v, { hz: i === 3 ? f * 1.5 : f }, when + d, 0.5)); return; }
    const semi = [0, 4, 7, 12, 7, 4, 0];
    semi.forEach((x, i) => S.play(v, { hz: f * Math.pow(2, x / 12) }, when + i * 0.2, i === semi.length - 1 ? 0.8 : 0.22, 0.8));
  }
  W.orchestra = function (el) {
    let sel = "violin1", playing = null;
    const render = () => {
      const inst = MQ.instruments.find((x) => x.id === sel), fam = MQ.families[inst.fam];
      const svg = s("svg", { viewBox: "0 0 720 400", class: "mq-orch", role: "img", "aria-label": L("خريطة جلوس الأوركسترا", "Orchestra seating map") });
      SEATS.forEach(([id, r0, r1, a0, a1]) => {
        const i = MQ.instruments.find((x) => x.id === id);
        const p = s("path", { d: arc(r0 + 2, r1 - 2, a0 - 0.6, a1 + 0.6), class: "mq-orch__seat mq-fam--" + i.fam + (id === sel ? " is-on" : "") + (inst.fam === i.fam ? " is-fam" : ""), tabindex: 0, role: "button", "aria-label": t(i) });
        const go = () => { sel = id; api.rerender(); motif(i); };
        p.addEventListener("click", go);
        p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        svg.append(p);
        const mid = (a0 + a1) / 2, [lx, ly] = pt((r0 + r1) / 2, mid);
        const lbl = id === "horn" ? L("الكورنو", "Horns") : t(i).split(" (")[0].replace("الفيولينة", "كمان").slice(0, 12);
        const span = Math.abs(a0 - a1);
        if (span >= 26 || (span >= 18 && lbl.length <= 8)) svg.append(s("text", { x: lx, y: ly + 4, class: "mq-orch__lbl", "text-anchor": "middle" }, lbl));
      });
      svg.append(s("circle", { cx: CX, cy: CY - 20, r: 14, class: "mq-orch__cond" }));
      svg.append(s("text", { x: CX, y: CY + 12, class: "mq-orch__lbl mq-dim", "text-anchor": "middle" }, L("قائد الأوركسترا — والجمهور هنا", "Conductor — audience here")));
      el.append(h("div", { class: "mq-orchwrap" }, svg));
      el.append(h("div", { class: "mq-row mq-wrap" }, Object.keys(MQ.families).map((k) => h("span", { class: "mq-legend mq-fam--" + k }, t(MQ.families[k]))),
        h("span", { class: "mq-grow" }), btn(L("الأوركسترا كاملة (توتي)", "Full orchestra (tutti)"), tutti, "mq-btn--primary")));
      el.append(h("div", { class: "mq-card mq-card--flat" },
        h("div", { class: "mq-row mq-row--between mq-wrap" }, h("b", { class: "mq-big" }, t(inst)), h("span", { class: "mq-tag" }, t(fam) + " · " + L("العدد: ", "Count: ") + inst.n)),
        h("p", {}, t(inst.d)), h("p", { class: "mq-feel" }, t(fam.feel)),
        h("div", { class: "mq-row mq-wrap" }, btn(L("استمع", "Listen"), () => motif(inst), "mq-btn--primary"), btn(L("استمع للعائلة", "Hear the family"), () => family(inst.fam), "mq-btn--ghost"))));
    };
    function family(f) {
      const list = MQ.instruments.filter((x) => x.fam === f);
      list.forEach((x, i) => motif(x, i * 0.35));
    }
    function tutti() {
      const chord = [48, 55, 60, 64, 67, 72, 76, 79];
      S.play("timpani", 36, 0, 1, 0.9); S.play("timpani", 36, 0.12, 1, 0.7); S.play("timpani", 43, 2.2, 1, 1);
      ["contrabass", "cello", "viola", "violin", "violin"].forEach((v, i) => S.play(v, chord[i + 2] - (i < 2 ? 24 : 0), 0.3, 2.6, 0.8));
      ["horn", "trombone", "trumpet", "tuba"].forEach((v, i) => S.play(v, [60, 55, 67, 36][i], 0.9, 2, 0.8));
      ["flute", "oboe", "clarinet"].forEach((v, i) => S.play(v, [79, 76, 72][i], 1.3, 1.6, 0.7));
      S.play("cymbal", 0, 2.2, 1, 0.8); S.chord("violin", [72, 76, 79, 84], 2.2, 1.8, 1);
      S.chord("trumpet", [72, 76, 79], 2.2, 1.6, 0.8); S.play("bassdrum", 0, 2.2, 1, 1);
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     ERAS — timeline + a sound for each era
     ===================================================================== */
  W.eras = function (el) {
    let cur = MQ.eras[0], playing = null;
    const X = (y) => 30 + ((y - 1540) / (1910 - 1540)) * 660;
    const render = () => {
      const svg = s("svg", { viewBox: "0 0 720 120", class: "mq-timeline", role: "img", "aria-label": L("خط زمني للعصور", "Timeline of the eras") });
      svg.append(s("line", { x1: 20, x2: 700, y1: 80, y2: 80, class: "mq-timeline__axis" }));
      [1550, 1600, 1650, 1700, 1750, 1800, 1850, 1900].forEach((y) => { svg.append(s("line", { x1: X(y), x2: X(y), y1: 74, y2: 86, class: "mq-timeline__tick" })); svg.append(s("text", { x: X(y), y: 104, "text-anchor": "middle", class: "mq-timeline__yr" }, y)); });
      MQ.eras.forEach((e) => {
        const g = s("g", { class: "mq-timeline__era" + (e === cur ? " is-on" : ""), tabindex: 0, role: "button", "aria-label": t(e) });
        g.append(s("rect", { x: X(e.from) + 2, y: 30, width: X(e.to) - X(e.from) - 4, height: 34, rx: 8 }));
        g.append(s("text", { x: (X(e.from) + X(e.to)) / 2, y: 54, "text-anchor": "middle" }, t(e).replace(/^(العصر |عصر )/, "")));
        const go = () => { cur = e; api.rerender(); };
        g.addEventListener("click", go); g.addEventListener("keydown", (ev) => { if (ev.key === "Enter") go(); });
        svg.append(g);
      });
      el.append(h("div", { class: "mq-staffwrap" }, svg));
      el.append(h("div", { class: "mq-card mq-card--flat" },
        h("div", { class: "mq-row mq-row--between mq-wrap" }, h("b", { class: "mq-big" }, t(cur) + " · " + cur.from + "–" + cur.to), btn(L("استمع لطابع العصر", "Hear the era"), () => hear(cur.id), "mq-btn--primary")),
        h("p", { class: "mq-dim" }, t(cur.word)),
        h("ul", { class: "mq-list" }, (AR() ? cur.traits.ar : cur.traits.en).map((x) => h("li", {}, x))),
        h("div", { class: "mq-chips mq-chips--static" }, (AR() ? cur.forms.ar : cur.forms.en).map((x) => h("span", { class: "mq-pill" }, x))),
        h("div", { class: "mq-people" }, cur.people.map((p) => h("span", { class: "mq-person" }, t(p))))));
    };
    function hear(id) {
      playing && playing.stop();
      const ev = [];
      if (id === "baroque") { // harpsichord counterpoint (canon-like)
        const m = [74, 72, 71, 69, 67, 69, 71, 72, 74, 76, 74, 72, 71, 72, 74, 67];
        m.forEach((n, i) => { ev.push({ at: i * 0.2, fn: (w) => S.play("qanun", n, w, 0.25, 0.7, -0.3) }); ev.push({ at: 0.8 + i * 0.2, fn: (w) => S.play("harp", n - 12, w, 0.25, 0.6, 0.3) }); });
        [43, 47, 48, 50].forEach((n, i) => ev.push({ at: i * 0.8, fn: (w) => S.play("cello", n, w, 0.75, 0.6) }));
      } else if (id === "classical") { // melody over Alberti bass
        const alb = [48, 55, 52, 55, 48, 55, 52, 55, 47, 55, 50, 55, 48, 55, 52, 55];
        alb.forEach((n, i) => ev.push({ at: i * 0.18, fn: (w) => S.play("piano", n, w, 0.2, 0.45) }));
        [[72, 0], [76, 0.72], [79, 1.08], [77, 1.44], [74, 1.8], [72, 2.16]].forEach(([n, a]) => ev.push({ at: a, fn: (w) => S.play("piano", n, w, 0.5, 0.85) }));
      } else { // lush romantic swell
        [[48, 55, 64, 72], [45, 57, 64, 72], [41, 57, 65, 69], [43, 55, 62, 71]].forEach((c, i) => ev.push({ at: i * 1.1, fn: (w) => { S.chord("violin", c.map((x) => x + 12), w, 1.3, 1); S.play("contrabass", c[0] - 12, w, 1.3, 0.7); S.chord("pad", c, w, 1.4, 0.8); } }));
        [76, 79, 84, 83, 79, 81, 79, 77].forEach((n, i) => ev.push({ at: 0.3 + i * 0.52, fn: (w) => S.play("horn", n - 12, w, 0.6, 0.6) }));
        ev.push({ at: 3.3, fn: (w) => S.play("harp", 84, w, 1) });
      }
      playing = run(ev);
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     SYMPHONY — four movements, four characters
     ===================================================================== */
  W.symphony = function (el) {
    let cur = -1, playing = null;
    const render = () => {
      el.append(h("div", { class: "mq-movs" }, MQ.symphony.map((m, i) => h("button", { type: "button", class: "mq-mov" + (cur === i ? " is-on" : ""), onclick: () => play(i) },
        h("span", { class: "mq-mov__bar", style: { "--h": Math.round((m.tempo / 180) * 100) + "%" } }),
        h("b", {}, t(m)), h("i", {}, m.term), h("small", {}, t(m.form))))));
    };
    function play(i) {
      playing && playing.stop(); cur = i; api.rerender();
      const b = 60 / MQ.symphony[i].tempo, ev = [];
      if (i === 0) { [60, 60, 64, 67, 72, 67, 64, 67, 72].forEach((n, k) => ev.push({ at: k * b * 0.5, fn: (w) => { S.play("violin", n, w, b * 0.45); if (k % 4 === 0) S.play("trumpet", n - 12, w, b * 0.4, 0.5); } })); [36, 43, 36, 43].forEach((n, k) => ev.push({ at: k * b, fn: (w) => S.play("contrabass", n, w, b) })); }
      if (i === 1) { [[67, 1], [69, 0.5], [67, 0.5], [72, 1.5], [71, 0.5], [69, 2]].reduce((a, [n, d]) => { ev.push({ at: a * b, fn: (w) => S.play("violin", n, w, d * b * 1.05, 0.7) }); return a + d; }, 0); [48, 53, 55].forEach((n, k) => ev.push({ at: k * 2 * b, fn: (w) => S.chord("pad", [n, n + 4, n + 7], w, 2 * b, 0.6) })); }
      if (i === 2) { for (let k = 0; k < 9; k++) { ev.push({ at: k * b, fn: (w) => S.play(k % 3 ? "viola" : "cello", k % 3 ? 64 : 48, w, b * 0.5, k % 3 ? 0.4 : 0.7) }); } [72, 74, 76, 77, 76, 74, 72, 71, 72].forEach((n, k) => ev.push({ at: k * b, fn: (w) => S.play("oboe", n, w, b * 0.8, 0.7) })); }
      if (i === 3) { [72, 74, 76, 77, 79, 81, 83, 84, 83, 81, 79, 77, 76, 74, 72, 67].forEach((n, k) => ev.push({ at: k * b * 0.5, fn: (w) => { S.play("flute", n, w, b * 0.45, 0.7); S.play("violin", n - 12, w, b * 0.45, 0.4); } })); ev.push({ at: 8 * b, fn: (w) => { S.chord("trumpet", [60, 64, 67], w, 1, 0.8); S.play("timpani", 36, w, 1); } }); }
      playing = run(ev, { onEnd: () => { cur = -1; api.rerender(); } });
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     SONATA FORM — an audible map
     ===================================================================== */
  W.sonata = function (el) {
    let playing = null, pos = 0, seg = null;
    const T1 = [[0, 0.5], [4, 0.25], [7, 0.25], [12, 0.75], [7, 0.25], [4, 0.5], [0, 0.5]];
    const T2 = [[11, 1], [9, 0.5], [7, 0.5], [9, 0.5], [11, 0.5], [14, 1], [12, 0.5], [11, 1]];
    const sections = [
      { id: "t1", group: "exp", key: "C", dur: 3.2 }, { id: "bridge", group: "exp", key: "C→G", dur: 1.6 }, { id: "t2", group: "exp", key: "G", dur: 3.4 },
      { id: "dev", group: "dev", key: "Am · F · Dm · G7", dur: 5.2 },
      { id: "t1", group: "rec", key: "C", dur: 3.2 }, { id: "bridge", group: "rec", key: "C", dur: 1.2 }, { id: "t2", group: "rec", key: "C", dur: 3.4 }, { id: "coda", group: "rec", key: "C", dur: 2.4 },
    ];
    const total = sections.reduce((a, x) => a + x.dur, 0);
    const G = { exp: { ar: "العرض", en: "Exposition" }, dev: { ar: "التفاعل", en: "Development" }, rec: { ar: "إعادة العرض", en: "Recapitulation" } };
    const render = () => {
      const bar = h("div", { class: "mq-sform" });
      let acc = 0;
      sections.forEach((x, i) => {
        const p = MQ.sonataForm.find((y) => y.id === x.id);
        bar.append(h("div", { class: "mq-sform__seg mq-sform--" + x.group + (seg === i ? " is-now" : ""), style: { flex: x.dur } }, h("b", {}, t(p)), h("small", { dir: "ltr" }, x.key)));
        acc += x.dur;
      });
      bar.append(h("span", { class: "mq-sform__head", style: { "--p": (pos / total) * 100 + "%" } }));
      el.append(h("div", { class: "mq-sform__groups" }, ["exp", "dev", "rec"].map((g) => h("span", { style: { flex: sections.filter((x) => x.group === g).reduce((a, x) => a + x.dur, 0) } }, t(G[g])))), h("div", { class: "mq-sformwrap", dir: "ltr" }, bar));
      el.append(h("div", { class: "mq-row mq-wrap" }, btn(playing && playing.alive ? L("إيقاف", "Stop") : L("شغّل الخريطة", "Play the map"), toggle, "mq-btn--primary"),
        seg != null ? h("span", { class: "mq-dim" }, t(MQ.sonataForm.find((y) => y.id === sections[seg].id).d)) : h("span", { class: "mq-dim" }, L("الموضوع الأول قوي على الترومبيت، والثاني غنائي على الكمان.", "Theme 1 is bold on trumpet; theme 2 sings on violin."))));
    };
    function phrase(ev, at, notes, base, voice, speed = 0.36, vel = 0.8) {
      let a = at; notes.forEach(([n, d]) => { const m = base + n; ev.push({ at: a, fn: (w) => S.play(voice, m, w, d * speed * 0.95, vel) }); a += d * speed; });
    }
    function toggle() {
      if (playing && playing.alive) { playing.stop(); return; }
      const ev = []; let a = 0;
      sections.forEach((x) => {
        if (x.id === "t1") { phrase(ev, a, T1, 60, "trumpet", 0.4); [48, 55, 48, 43].forEach((n, i) => ev.push({ at: a + i * 0.8, fn: (w) => S.play("cello", n, w, 0.75, 0.6) })); ev.push({ at: a, fn: (w) => S.play("timpani", 36, w, 0.5, 0.6) }); }
        if (x.id === "bridge") [60, 62, 64, 66, 67].slice(0, x.group === "rec" ? 3 : 5).forEach((n, i) => ev.push({ at: a + i * 0.3, fn: (w) => S.play("violin", n + 12, w, 0.28, 0.6) }));
        if (x.id === "t2") { const base = x.group === "exp" ? 55 + 12 : 48 + 12; phrase(ev, a, T2.map(([n, d]) => [n - 11, d]), base + 11 - 12, "violin", 0.42, 0.7); [0, 1.6].forEach((o) => ev.push({ at: a + o, fn: (w) => S.chord("pad", [base - 24, base - 20, base - 17], w, 1.6, 0.5) })); }
        if (x.id === "dev") [57, 53, 50, 55].forEach((root, i) => { phrase(ev, a + i * 1.3, T1.slice(0, 4), root, i % 2 ? "horn" : "oboe", 0.3, 0.7); ev.push({ at: a + i * 1.3, fn: (w) => S.play("contrabass", root - 12, w, 1.2, 0.6) }); });
        if (x.id === "coda") { ev.push({ at: a, fn: (w) => { S.chord("trumpet", [60, 64, 67], w, 0.6); S.play("timpani", 43, w, 0.5); } }); ev.push({ at: a + 0.7, fn: (w) => { S.chord("violin", [72, 76, 79, 84], w, 1.4, 1); S.chord("horn", [48, 55, 60], w, 1.4); S.play("timpani", 36, w, 1); S.play("cymbal", 0, w, 1, 0.5); } }); }
        a += x.dur;
      });
      playing = run(ev, {
        total,
        onProgress: (p) => { pos = p; let acc = 0, idx = 0; for (let i = 0; i < sections.length; i++) { if (p >= acc) idx = i; acc += sections[i].dur; } const head = el.querySelector(".mq-sform__head"); if (head) head.style.setProperty("--p", Math.min(100, (p / total) * 100) + "%"); if (idx !== seg) { seg = idx; api.rerender(); } },
        onEnd: () => { seg = null; pos = 0; setTimeout(() => api.rerender(), 30); },
      });
      api.rerender();
    }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     MAQAM — the octave as a circle with 24 quarter-tone stations.
     Every maqam draws its own shape; quarter tones sit between the
     piano's semitone marks, and "as a piano would" snaps them visibly.
     ===================================================================== */
  const halfFlat = () => h("span", { class: "mq-hf", "aria-label": "half flat" }, "♭");
  const ACC = { "#": "♯", b: "♭", hf: "½♭" };
  function noteTxt(name) { // "Ehf4" -> "مي½♭" / "E½♭"
    const m = /^([A-G])(#|b|hf)?(\d)$/.exec(name), i = MQ.letters.indexOf(m[1]);
    return (AR() ? MQ.solfege.ar[i] : m[1]) + (m[2] ? ACC[m[2]] : "");
  }
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const STEP = { 50: "¼", 100: "½", 150: "¾", 200: "1", 250: "1¼", 300: "1½", 350: "1¾", 400: "2" };
  W.maqam = function (el, o = {}) {
    let cur = MQ.maqamat.find((x) => x.id === (o.start || "rast")) || MQ.maqamat[0];
    let voice = "oud", lit = -1, playing = null, drone = true, raf = 0, pianoView = false;
    let shown = cur.notes.map((n) => n[1]);
    let R_ = null; // live element refs of the current render
    const VW = 520, VH = 476, CX = 260, CY = 238, R = 142;
    const P = (c, r) => { const a = ((c / 1200) * 360 - 90) * (Math.PI / 180); return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
    const arcD = (a, b, r) => { const [x0, y0] = P(a, r), [x1, y1] = P(b, r); return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${b - a > 600 ? 1 : 0} 1 ${x1.toFixed(1)},${y1.toFixed(1)}`; };
    const dn = (n) => t(MQ.degreeNames[n] || { ar: "", en: "" });
    const target = () => cur.notes.map((n) => (pianoView ? Math.round(n[1] / 100) * 100 : n[1]));

    function draw() {
      if (!R_ || !R_.svg.isConnected) return;
      const c = shown;
      R_.poly.setAttribute("points", c.slice(0, 7).map((x) => P(x, R).map((v) => v.toFixed(1)).join(",")).join(" "));
      cur.ajnas.forEach((j, k) => R_.arcs[k].setAttribute("d", arcD(c[j.from], c[j.to], R + 22)));
      R_.dots.forEach((g, i) => { const [x, y] = P(c[i], R); g.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`); });
      R_.steps.forEach((tx, k) => {
        const a = c[k], b = c[k + 1], [x, y] = P((a + b) / 2, R - 30), d = Math.round((b - a) / 50) * 50;
        tx.setAttribute("x", x.toFixed(1)); tx.setAttribute("y", y.toFixed(1));
        tx.textContent = STEP[d] || (d / 200).toString(); tx.classList.toggle("is-qt", d % 100 !== 0);
      });
      R_.labels.forEach((tx, i) => {
        const [x, y] = P(c[i], R + (R_.narrow ? 34 : 44)), anchor = x > CX + 24 ? "start" : x < CX - 24 ? "end" : "middle";
        const yy = y < CY - R ? y - 10 : y > CY + R ? y + 4 : y - 6;
        tx.setAttribute("text-anchor", anchor);
        tx.querySelectorAll("tspan").forEach((ts) => ts.setAttribute("x", x.toFixed(1)));
        tx.setAttribute("y", yy.toFixed(1));
      });
      const li = lit === 7 ? 0 : lit;
      if (li >= 0) { const [x, y] = P(c[li], R); R_.head.setAttribute("x2", x.toFixed(1)); R_.head.setAttribute("y2", y.toFixed(1)); }
      R_.head.classList.toggle("is-on", li >= 0);
    }
    function morph(to, ms = 760) {
      cancelAnimationFrame(raf);
      const from = shown.slice(), t0 = performance.now();
      if (RM) { shown = to.slice(); draw(); return; }
      const f = (now) => { const k = easeOut(Math.min(1, (now - t0) / ms)); shown = from.map((v, i) => v + (to[i] - v) * k); draw(); if (k < 1) raf = requestAnimationFrame(f); };
      raf = requestAnimationFrame(f);
    }
    function centre() {
      if (!R_) return;
      const li = lit === 7 ? 0 : lit;
      R_.root.classList.toggle("is-lit", li >= 0);
      R_.dots.forEach((g, i) => g.classList.toggle("is-lit", i === li));
      R_.labels.forEach((g, i) => g.classList.toggle("is-lit", i === li));
      if (li >= 0) {
        const [n, c] = cur.notes[lit];
        R_.c1.textContent = dn(n); R_.c2.textContent = noteTxt(n) + "  ·  " + (pianoView ? Math.round(c / 100) * 100 : c) + "¢";
      } else { R_.c1.textContent = t(cur); R_.c2.textContent = L("اضغط أي درجة لتسمعها", "Tap any degree to hear it"); }
      draw();
    }

    const render = () => {
      el.classList.add("mq-maq2");
      const narrow = (el.clientWidth || innerWidth) < 520;
      el.append(h("div", { class: "mq-chips mq-maqtabs" }, MQ.maqamat.map((m) => chip(t(m), m === cur, () => select(m)))));
      const svg = s("svg", { viewBox: `0 0 ${VW} ${VH}`, class: "mq-wheel" + (narrow ? " is-narrow" : ""), role: "img", "aria-label": L("دائرة المقام: الديوان كدائرة من ٢٤ ربع تون", "Maqam wheel: the octave as a circle of 24 quarter tones") });
      svg.append(s("circle", { cx: CX, cy: CY, r: R + 40, class: "mq-wheel__halo" }));
      svg.append(s("circle", { cx: CX, cy: CY, r: R, class: "mq-wheel__ring" }));
      for (let q = 0; q < 24; q++) {
        const semi = q % 2 === 0, [x0, y0] = P(q * 50, R - (semi ? 8 : 4)), [x1, y1] = P(q * 50, R + (semi ? 8 : 4));
        svg.append(s("line", { x1: x0, y1: y0, x2: x1, y2: y1, class: "mq-wheel__tick" + (semi ? "" : " is-q") }));
      }
      const poly = s("polygon", { class: "mq-wheel__poly" }); svg.append(poly);
      const arcs = cur.ajnas.map((j, k) => { const p = s("path", { class: "mq-wheel__jins " + (k ? "is-far" : "is-root") }); svg.append(p); return p; });
      const head = s("line", { x1: CX, y1: CY, x2: CX, y2: CY, class: "mq-wheel__head" }); svg.append(head);
      const steps = []; for (let k = 0; k < 7; k++) { const tx = s("text", { class: "mq-wheel__step", "text-anchor": "middle", "dominant-baseline": "central" }); svg.append(tx); steps.push(tx); }
      const dots = cur.notes.slice(0, 7).map(([n, c], i) => {
        const g = s("g", { class: "mq-wheel__deg" + (c % 100 ? " is-qt" : ""), tabindex: 0, role: "button", "aria-label": dn(n) + " — " + noteTxt(n) });
        g.append(s("circle", { r: 26, class: "mq-wheel__pulse" }), s("circle", { r: 18, class: "mq-wheel__dot" }), s("text", { class: "mq-wheel__n", "text-anchor": "middle", "dominant-baseline": "central" }, i ? String(i + 1) : "1"));
        const go = () => tone(i);
        g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        svg.append(g); return g;
      });
      const labels = cur.notes.slice(0, 7).map(([n], i) => {
        const tx = s("text", { class: "mq-wheel__lbl" + (cur.notes[i][1] % 100 ? " is-qt" : "") });
        tx.append(s("tspan", { class: "mq-wheel__sol" }, noteTxt(n)));
        if (!narrow) tx.append(s("tspan", { class: "mq-wheel__dn", dy: "1.3em" }, dn(n)));
        svg.append(tx); return tx;
      });
      const root = s("g", { class: "mq-wheel__centre" });
      root.append(s("circle", { cx: CX, cy: CY, r: R - 52, class: "mq-wheel__core" }));
      const c1 = s("text", { x: CX, y: CY - 4, "text-anchor": "middle", class: "mq-wheel__big" }), c2 = s("text", { x: CX, y: CY + 28, "text-anchor": "middle", class: "mq-wheel__small" });
      root.append(c1, c2); svg.append(root);
      R_ = { narrow, svg, poly, arcs, head, steps, dots, labels, root, c1, c2 };

      const panel = h("div", { class: "mq-maq2__panel" },
        h("p", { class: "mq-maq2__kick" }, L("مقام", "Maqam"), h("span", { class: "mq-tag " + (cur.fixed ? "mq-tag--perfect" : "mq-tag--diss") }, cur.fixed ? L("يُعزف على الآلات الثابتة", "Fixed instruments can play it") : L("فيه أرباع أصوات — لا يعزفه البيانو", "Quarter tones — no piano"))),
        h("h3", { class: "mq-maq2__name" }, t(cur)),
        h("p", { class: "mq-maq2__mood" }, t(cur.mood)),
        h("div", { class: "mq-maq2__ajnas" }, cur.ajnas.map((j, k) => h("div", { class: "mq-maq2__jins " + (k ? "is-far" : "is-root") }, h("i", { "aria-hidden": "true" }), h("span", {}, k ? L("الفرع", "Branch") : L("الجذع", "Root")), h("b", {}, t(j)))),
          h("small", {}, t(MQ.joins[cur.join]) + " — " + t(cur.gap))),
        h("p", {}, t(cur.origin)),
        h("p", { class: "mq-dim" }, h("b", {}, L("من فصيلته: ", "Family: ")), t(cur.family)),
        h("div", { class: "mq-chips mq-chips--static" }, h("span", { class: "mq-dim" }, L("من ألحانه:", "Songs:")), (AR() ? cur.songs.ar : cur.songs.en).map((x) => h("span", { class: "mq-pill" }, x))));

      el.append(h("div", { class: "mq-maq2__grid" }, h("div", { class: "mq-maq2__wheel", dir: "ltr" }, svg, h("p", { class: "mq-maq2__key", dir: AR() ? "rtl" : "ltr" }, h("i", { class: "k1" }), L("علامة طويلة = نصف تون (مفتاح بيانو)", "long mark = semitone (a piano key)"), h("i", { class: "k2" }), L("قصيرة = ربع تون", "short = quarter tone"))), panel));
      el.append(h("div", { class: "mq-row mq-wrap mq-maq2__ctl" },
        btn(L("صعودًا", "Ascend"), () => play("up"), "mq-btn--primary"), btn(L("هبوطًا", "Descend"), () => play("down"), "mq-btn--ghost"), btn(L("سَيْر لحني", "A short phrase"), () => play("sayr"), "mq-btn--ghost"),
        !cur.fixed ? btn(L("كما يعزفه البيانو", "As a piano would"), () => play("piano"), "mq-btn--ghost mq-btn--warn") : null,
        h("span", { class: "mq-grow" }),
        h("div", { class: "mq-seg" }, [["oud", "عود", "Oud"], ["nay", "ناي", "Nay"], ["qanun", "قانون", "Qanun"], ["violin", "كمان", "Violin"]].map(([v, a, e]) => chip(L(a, e), voice === v, () => { voice = v; api.rerender(); }))),
        chip(L("قرار ممتد", "Drone"), drone, () => { drone = !drone; api.rerender(); })));
      centre();
    };
    function select(m) {
      if (m === cur) return;
      playing && playing.stop();
      const from = shown.slice();
      cur = m; lit = -1; pianoView = false; shown = from; api.rerender(); morph(target()); play("up");
    }
    const fr = (i, piano) => { const base = S.freq(cur.notes[0][0]), c = cur.notes[i][1]; return S.cents(base, piano ? Math.round(c / 100) * 100 : c); };
    function tone(i, w = 0, piano) {
      S.play(piano ? "piano" : voice, { hz: fr(i, piano) }, w, 0.7, 0.85);
      setTimeout(() => { lit = i; centre(); }, w * 1000);
    }
    function play(kind) {
      playing && playing.stop();
      const seq = kind === "down" ? [7, 6, 5, 4, 3, 2, 1, 0] : kind === "sayr" ? [0, 1, 2, 3, 4, 3, 2, 1, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
      const sp = kind === "sayr" ? 0.34 : 0.42, piano = kind === "piano";
      if (piano) { pianoView = true; morph(target(), 500); }
      const ev = seq.map((i, k) => ({ at: k * sp + (piano ? 0.5 : 0), fn: (w) => tone(i, w, piano) }));
      if (drone && !piano) ev.push({ at: 0, fn: (w) => { S.play("pad", { hz: fr(0) / 2 }, w, seq.length * sp + 0.4, 0.7); S.play("cello", { hz: fr(0) / 2 }, w, seq.length * sp, 0.35); } });
      playing = run(ev, { onEnd: () => setTimeout(() => { lit = -1; if (pianoView) { pianoView = false; morph(target(), 700); } centre(); }, 450) });
    }
    const api = mount(el, render, () => { playing && playing.stop(); cancelAnimationFrame(raf); });
    api.onStop = () => { lit = -1; if (pianoView) { pianoView = false; shown = target(); } };
    return api;
  };

  /* quarter tone demo — the note that lives between two piano keys */
  W.quarter = function (el) {
    const opts = [["Eb4", 300, "مي بيمول", "E flat", "كرد", "Kurd"], ["Ehf4", 350, "مي نصف بيمول", "E half-flat", "سيكاه", "Sikah"], ["E4", 400, "مي طبيعية", "E natural", "بوسليك", "Busalik"]];
    let cur = 1, playing = null;
    const RX = [150, 260, 370];
    const render = () => {
      el.classList.add("mq-qt2");
      const svg = s("svg", { viewBox: "0 0 520 250", class: "mq-qt2__svg mq-qt2--" + cur, role: "img", "aria-label": L("موقع السيكاه بين مفتاحي البيانو", "Where Sikah sits between two piano keys") });
      const W_ = 100, X0 = 10, names = ["C", "D", "E", "F", "G"];
      names.forEach((n, i) => svg.append(s("rect", { x: X0 + i * W_, y: 8, width: W_ - 3, height: 128, rx: 8, class: "mq-qt2__white" + (n === "E" ? " is-e" : "") })));
      [110, 210, 410].forEach((bx) => svg.append(s("rect", { x: bx - 28, y: 8, width: 56, height: 80, rx: 6, class: "mq-qt2__black" + (bx === 210 ? " is-eb" : "") })));
      svg.append(s("rect", { x: 236, y: 14, width: 8, height: 120, rx: 4, class: "mq-qt2__crack" }));
      svg.append(s("text", { x: X0 + 2 * W_ + 66, y: 124, "text-anchor": "middle", class: "mq-qt2__klbl" }, "E"));
      svg.append(s("text", { x: 210, y: 76, "text-anchor": "middle", class: "mq-qt2__klbl is-b" }, "E♭"));
      // leaders from the rail to the keyboard
      const lead = [[RX[0], 210, 92], [RX[1], 240, 138], [RX[2], 266, 138]];
      lead.forEach(([rx, kx, ky], i) => svg.append(s("path", { d: `M${rx},186 C${rx},160 ${kx},170 ${kx},${ky}`, class: "mq-qt2__lead" + (i === 1 ? " is-ghost" : "") + (i === cur ? " is-on" : "") })));
      svg.append(s("line", { x1: 110, x2: 410, y1: 196, y2: 196, class: "mq-qt2__rail" }));
      opts.forEach(([, c], i) => {
        const g = s("g", { class: "mq-qt2__stop" + (i === cur ? " is-on" : ""), tabindex: 0, role: "button", "aria-label": L(opts[i][2], opts[i][3]) });
        g.append(s("circle", { cx: RX[i], cy: 196, r: 7 }));
        g.append(s("text", { x: RX[i], y: 230, "text-anchor": "middle", class: "mq-qt2__c" }, c + "¢"));
        const go = () => pick(i);
        g.addEventListener("click", go); g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        svg.append(g);
      });
      const mk = s("g", { class: "mq-qt2__mark", style: `transform:translateX(${RX[cur] - RX[1]}px)` });
      mk.append(s("circle", { cx: RX[1], cy: 196, r: 18, class: "mq-qt2__halo" }), s("circle", { cx: RX[1], cy: 196, r: 11, class: "mq-qt2__dot" }));
      svg.append(mk);
      el.append(h("div", { class: "mq-qt2__grid" },
        h("div", { class: "mq-qt2__art", dir: "ltr" }, svg),
        h("div", { class: "mq-qt2__side" },
          h("p", { class: "mq-qt2__kick" }, L("ربع التون", "The quarter tone")),
          h("p", { class: "mq-qt2__title" }, cur === 1 ? [L("مي", "E"), halfFlat()] : L(opts[cur][2], opts[cur][3]), h("span", {}, " — " + L(opts[cur][4], opts[cur][5]))),
          h("p", { class: "mq-dim" }, cur === 1
            ? L("لا مفتاح لها على البيانو: تسكن في الشق بين المي بيمول والمي، على بعد 50 سنت من كل منهما. هي روح مقام الراست والبياتي.", "No piano key exists for it: it lives in the crack between E♭ and E, 50 cents from each. It is the soul of Rast and Bayati.")
            : L("هذه النغمة لها مفتاح على البيانو. جرّب السيكاه لتسمع ما بين المفتاحين.", "This note has a piano key. Try Sikah to hear what lies between the keys.")),
          h("div", { class: "mq-qt" }, opts.map(([, c, a, e, ja, je], i) => h("button", { type: "button", class: "mq-qt__b" + (cur === i ? " is-on" : ""), "aria-pressed": cur === i ? "true" : "false", onclick: () => pick(i) },
            h("b", {}, i === 1 ? [L("مي", "E"), halfFlat()] : L(a, e)), h("small", {}, L(ja, je)), h("i", { dir: "ltr" }, c + " ¢")))),
          h("div", { class: "mq-row mq-wrap" }, btn(L("قارن الثلاثة", "Compare all three"), compare, "mq-btn--primary"), h("span", { class: "mq-dim", style: { fontSize: ".85rem" } }, L("كل خطوة = 50 سنت = ربع تون", "Each step = 50 cents = a quarter tone"))))));
    };
    function pick(i) {
      cur = i;
      const svg = el.querySelector(".mq-qt2__svg");
      if (svg) { // slide without a re-render so the motion is visible
        const mk = svg.querySelector(".mq-qt2__mark"); mk.style.transform = `translateX(${RX[i] - RX[1]}px)`;
        svg.querySelectorAll(".mq-qt2__stop").forEach((g, k) => g.classList.toggle("is-on", k === i));
        svg.querySelectorAll(".mq-qt2__lead").forEach((g, k) => g.classList.toggle("is-on", k === i));
        setTimeout(() => { if (cur === i) { api.rerender(); } }, 520);
      }
      hear(i);
    }
    function hear(i, w = 0) { const base = S.freq("C4"); S.play("pad", { hz: base / 2 }, w, 2, 0.6); [0, 200].forEach((c, k) => S.play("oud", { hz: S.cents(base, c) }, w + k * 0.35, 0.4)); S.play("oud", { hz: S.cents(base, opts[i][1]) }, w + 0.7, 1.2); S.chord("violin", [S.cents(base, 0), S.cents(base, opts[i][1])], w + 1.3, 1.2, 0.6); }
    function compare() {
      playing && playing.stop();
      playing = run([0, 1, 2].map((i) => ({ at: i * 2.3, fn: (w) => { hear(i, w); setTimeout(() => { if (playing && playing.alive) pick2(i); }, w * 1000); } })), { total: 7.2 });
    }
    function pick2(i) { cur = i; const svg = el.querySelector(".mq-qt2__svg"); if (!svg) return; svg.querySelector(".mq-qt2__mark").style.transform = `translateX(${RX[i] - RX[1]}px)`; svg.querySelectorAll(".mq-qt2__stop").forEach((g, k) => g.classList.toggle("is-on", k === i)); svg.querySelectorAll(".mq-qt2__lead").forEach((g, k) => g.classList.toggle("is-on", k === i)); }
    const api = mount(el, render, () => playing && playing.stop());
    return api;
  };

  /* =====================================================================
     IQAʿAT — Arabic rhythmic cycles
     ===================================================================== */
  W.iqaat = function (el) {
    let cur = MQ.iqaat[0], on = false, loop = null, bpm = 100, now = -1;
    const render = () => {
      el.append(h("div", { class: "mq-chips" }, MQ.iqaat.map((r) => chip([t(r), " ", h("small", { dir: "ltr" }, r.meter)], r === cur, () => { cur = r; if (on) { stop(); start(); } api.rerender(); }))));
      const n = cur.p.length, R = 78;
      const svg = s("svg", { viewBox: "0 0 220 220", class: "mq-cycle", role: "img", "aria-label": t(cur) + " " + cur.meter });
      svg.append(s("circle", { cx: 110, cy: 110, r: R, class: "mq-cycle__ring" }));
      cur.p.split("").forEach((c, i) => {
        const a = -Math.PI / 2 + (i / n) * Math.PI * 2 * (AR() ? -1 : 1);
        const x = 110 + R * Math.cos(a), y = 110 + R * Math.sin(a);
        svg.append(s("circle", { cx: x, cy: y, r: c === "D" ? 15 : c === "T" ? 10 : 5, class: "mq-cycle__b mq-cycle__b--" + c + (now === i ? " is-now" : "") }));
        if (c !== ".") svg.append(s("text", { x, y: y + 4, "text-anchor": "middle", class: "mq-cycle__t" }, c === "D" ? L("دُم", "D") : L("تَك", "T")));
      });
      svg.append(s("text", { x: 110, y: 106, "text-anchor": "middle", class: "mq-cycle__m" }, cur.meter));
      svg.append(s("text", { x: 110, y: 128, "text-anchor": "middle", class: "mq-cycle__s" }, t(cur)));
      el.append(h("div", { class: "mq-row mq-wrap mq-cyclewrap" }, svg,
        h("div", { class: "mq-grow" }, h("p", {}, h("b", {}, L("يُستعمل في: ", "Used for: ")), t(cur.use)),
          h("p", { class: "mq-dim" }, L("الدُّم ضربة غليظة في وسط الطبلة، والتَّك ضربة حادة على حافتها.", "Dum is the deep centre stroke; tak the sharp edge stroke.")),
          h("div", { class: "mq-row mq-wrap" }, btn(on ? L("إيقاف", "Stop") : L("اعزف الإيقاع", "Play the rhythm"), () => { on ? stop() : start(); api.rerender(); }, "mq-btn--primary"),
            h("input", { type: "range", min: 60, max: 180, value: bpm, class: "mq-range", "aria-label": "BPM", oninput: (e) => { bpm = +e.target.value; if (loop) loop.step = 30 / bpm; } })))));
    };
    function start() {
      on = true; const p = cur.p;
      loop = S.loop(30 / bpm, p.length, (i, w) => {
        const c = p[i];
        if (c === "D") S.play("dum", 0, w, 0.3, 1); else if (c === "T") S.play("tak", 0, w, 0.1, 0.9); else S.play("tak", 0, w, 0.05, 0.18);
        setTimeout(() => { now = i; el.querySelectorAll(".mq-cycle__b").forEach((b, k) => b.classList.toggle("is-now", k === i)); }, w * 1000);
      });
    }
    function stop() { on = false; loop && loop.stop(); now = -1; }
    const api = mount(el, render, stop);
    api.onStop = () => { on = false; now = -1; };
    return api;
  };

  /* =====================================================================
     MIXER — the six elements, audible
     ===================================================================== */
  W.mixer = function (el) {
    const on = { rhythm: true, melody: true, poly: false, form: false, instr: false, perf: false };
    let loop = null, playing = false, step = -1, section = "A";
    // 16 eighth-steps per 2 bars; [step, midi, lenSteps]
    const A = [[0, 72, 2], [2, 76, 2], [4, 79, 3], [7, 76, 1], [8, 77, 2], [10, 81, 2], [12, 79, 4], [16, 76, 2], [18, 79, 2], [20, 84, 3], [23, 83, 1], [24, 81, 2], [26, 79, 2], [28, 76, 2], [30, 72, 2]];
    const B = [[0, 81, 3], [3, 79, 1], [4, 77, 2], [6, 76, 2], [8, 74, 4], [12, 76, 2], [14, 77, 2], [16, 79, 3], [19, 77, 1], [20, 76, 2], [22, 74, 2], [24, 72, 4], [28, 71, 4]];
    const chordsA = [[48, 64, 67], [53, 65, 69], [48, 64, 67], [55, 62, 71]], chordsB = [[57, 64, 72], [50, 65, 69], [48, 64, 67], [55, 62, 71]];
    const counter = [[0, 67], [4, 69], [8, 69], [12, 67], [16, 64], [20, 65], [24, 67], [28, 67]];
    const render = () => {
      const lanes = h("div", { class: "mq-mixer" }, MQ.elements.map((e) => h("button", { type: "button", class: "mq-lane" + (on[e.id] ? " is-on" : ""), "data-lane": e.id, "aria-pressed": on[e.id] ? "true" : "false", onclick: () => { on[e.id] = !on[e.id]; api.rerender(); } },
        h("span", { class: "mq-lane__led" }), h("b", {}, t(e)), h("small", {}, e.term), h("span", { class: "mq-lane__d" }, t(e.d)))));
      el.append(lanes);
      el.append(h("div", { class: "mq-row mq-wrap mq-row--between" }, btn(playing ? L("إيقاف", "Stop") : L("شغّل المقطوعة", "Play the piece"), toggle, "mq-btn--primary"),
        h("div", { class: "mq-form" }, (on.form ? ["A", "B", "A"] : ["A"]).map((x, i) => h("span", { class: "mq-form__s" + (playing && section === x + i ? " is-now" : "") }, x))),
        h("span", { class: "mq-dim" }, L("أضف العناصر أثناء العزف.", "Add elements while it plays."))));
    };
    const flash = (id) => { const b = el.querySelector(`[data-lane="${id}"] .mq-lane__led`); if (b) { b.classList.add("is-hit"); setTimeout(() => b.classList.remove("is-hit"), 120); } };
    function toggle() {
      if (playing) { loop && loop.stop(); playing = false; api.rerender(); return; }
      playing = true; api.rerender();
      const secs = 32; let total = secs;
      loop = S.loop(() => (on.perf ? 0.27 + Math.sin(Date.now() / 900) * 0.012 : 0.27), secs * 3, (i, w) => {
        const len = on.form ? secs * 3 : secs, k = i % len, si = Math.floor(k / secs), st = k % secs;
        const sec = on.form ? ["A", "B", "A"][si] : "A", tag = sec + si;
        if (tag !== section) { section = tag; setTimeout(() => el.querySelectorAll(".mq-form__s").forEach((x, j) => x.classList.toggle("is-now", j === si)), w * 1000); }
        const phrase = st / secs, perf = on.perf;
        const vel = (base) => (perf ? base * (0.55 + 0.6 * Math.sin(Math.PI * phrase)) * (st % 8 === 0 ? 1.15 : 1) : base * 0.7);
        const inst = on.instr ? ({ A0: "flute", B1: "violin", A2: "trumpet" }[sec + si] || "flute") : "sine";
        if (on.rhythm) { if (st % 8 === 0) (S.play(on.instr ? "bassdrum" : "dum", 0, w, 0.2, vel(0.9)), setTimeout(() => flash("rhythm"), w * 1000)); if (st % 8 === 4) S.play(on.instr ? "snare" : "tak", 0, w, 0.1, vel(0.7)); if (st % 2 === 0 && on.instr) S.play("tak", 0, w, 0.05, vel(0.15)); }
        if (on.melody) (sec === "B" ? B : A).forEach(([s0, m, l]) => { if (s0 === st) { S.play(inst, m, w, l * 0.27 * (perf ? 1 : 0.8), vel(0.9)); setTimeout(() => flash("melody"), w * 1000); if (on.instr) setTimeout(() => flash("instr"), w * 1000); } });
        if (on.poly && st % 8 === 0) { const c = (sec === "B" ? chordsB : chordsA)[st / 8]; S.play(on.instr ? "contrabass" : "sine", c[0] - 12, w, 2, vel(0.7)); S.chord(on.instr ? "pad" : "sine", c.slice(1), w, 2, vel(0.5)); setTimeout(() => flash("poly"), w * 1000); }
        if (on.poly && on.instr) counter.forEach(([s0, m]) => { if (s0 === st) S.play("clarinet", m - 12, w, 1, vel(0.35)); });
        if (on.form && st === 0) setTimeout(() => flash("form"), w * 1000);
        if (on.perf && st % 8 === 0) setTimeout(() => flash("perf"), w * 1000);
      });
    }
    const api = mount(el, render, () => loop && loop.stop());
    api.onStop = () => { playing = false; };
    return api;
  };

  /* =====================================================================
     QUIZ
     ===================================================================== */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  W.quiz = function (el, o = {}) {
    let pool, i, picked, score, done, wrong;
    const reset = () => { pool = shuffle(MQ.quiz.filter((q) => !o.ch || o.ch === "all" || q.ch === o.ch)).slice(0, o.count || 10); i = 0; picked = null; score = 0; done = false; wrong = []; };
    reset();
    const render = () => {
      if (done) {
        const pct = Math.round((score / pool.length) * 100);
        el.append(h("div", { class: "mq-quiz mq-quiz--done" }, h("div", { class: "mq-ring", style: { "--p": pct } }, h("b", {}, pct + "%")),
          h("p", { class: "mq-big" }, score + " / " + pool.length + " — " + (pct >= 90 ? L("علامة كاملة تقريبًا!", "Nearly perfect!") : pct >= 70 ? L("ممتاز، راجع القليل فقط.", "Great — review a little.") : L("راجع الدروس وحاول مجددًا.", "Review the lessons and try again."))),
          wrong.length ? h("div", { class: "mq-review" }, h("b", {}, L("راجع هذه:", "Review these:")), wrong.map((q) => h("p", {}, "• " + t(q.q) + " ", h("b", { class: "mq-ok" }, t(q.o[q.a]))))) : null,
          btn(L("اختبار جديد", "New quiz"), () => { reset(); api.rerender(); }, "mq-btn--primary")));
        o.onDone && o.onDone(score, pool.length);
        return;
      }
      const q = pool[i], ch = MQ.chapters.find((c) => c.id === q.ch);
      el.append(h("div", { class: "mq-quiz" },
        h("div", { class: "mq-row mq-row--between" }, h("span", { class: "mq-dim" }, L("سؤال ", "Question ") + (i + 1) + " / " + pool.length), h("span", { class: "mq-tag", style: { "--c": ch.color } }, t(ch))),
        h("div", { class: "mq-progress" }, h("span", { style: { width: (i / pool.length) * 100 + "%" } })),
        h("p", { class: "mq-q" }, t(q.q)),
        h("div", { class: "mq-opts" + (q.o.length === 2 ? " mq-opts--tf" : "") }, q.o.map((opt, k) => h("button", { type: "button", class: "mq-opt" + (picked != null ? (k === q.a ? " is-ok" : k === picked ? " is-bad" : " is-dim") : ""), disabled: picked != null, onclick: () => pick(k) }, h("span", { class: "mq-opt__k" }, AR() ? "أبجد"[k] || "" : "abcd"[k]), t(opt)))),
        picked != null ? h("div", { class: "mq-fb " + (picked === q.a ? "is-ok" : "is-bad") }, h("b", {}, picked === q.a ? L("إجابة صحيحة.", "Correct.") : L("ليست هذه.", "Not quite.")), q.x ? " " + t(q.x) : "", " ", btn(i + 1 < pool.length ? L("التالي", "Next") : L("النتيجة", "See result"), nextQ, "mq-btn--primary mq-btn--small")) : null));
    };
    function pick(k) { const q = pool[i]; picked = k; if (k === q.a) { score++; S.play("xylophone", "E6", 0); S.play("xylophone", "B6", 0.09); } else { wrong.push(q); S.play("piano", "C3", 0, 0.4, 0.5); S.play("piano", "C#3", 0, 0.4, 0.5); } api.rerender(); }
    function nextQ() { picked = null; i++; if (i >= pool.length) done = true; api.rerender(); }
    const api = mount(el, render);
    api.restart = (opts) => { Object.assign(o, opts); reset(); api.rerender(); };
    return api;
  };

  /* flashcards */
  W.cards = function (el) {
    let order = shuffle(MQ.glossary), i = 0, flip = false;
    const render = () => {
      const c = order[i];
      el.append(h("button", { type: "button", class: "mq-flash" + (flip ? " is-flip" : ""), onclick: () => { flip = !flip; api.rerender(); }, "aria-label": L("اقلب البطاقة", "Flip card") },
        h("span", { class: "mq-flash__face mq-flash__front" }, h("b", {}, AR() ? c.ar : c.en), h("small", {}, AR() ? c.en : c.ar)),
        h("span", { class: "mq-flash__face mq-flash__back" }, t(c.d))));
      el.append(h("div", { class: "mq-row mq-row--between" }, btn(L("السابقة", "Previous"), () => { i = (i - 1 + order.length) % order.length; flip = false; api.rerender(); }, "mq-btn--ghost"), h("span", { class: "mq-dim" }, i + 1 + " / " + order.length), btn(L("التالية", "Next"), () => { i = (i + 1) % order.length; flip = false; api.rerender(); }, "mq-btn--ghost")));
    };
    const api = mount(el, render);
    return api;
  };


  /* =====================================================================
     GUESS THE MELODY — the tune is sung in solfege (do re mi…)
     ===================================================================== */
  const SYLS = ["do", "re", "mi", "fa", "sol", "la", "si"];
  function parseMel(str) {
    return str.trim().split(/\s+/).map((tok) => { const [n, b] = tok.split("/"); const beats = b ? +b : 1; if (n === "r") return { rest: true, beats }; const i = MQ.letters.indexOf(n[0]); return { n, beats, syl: SYLS[i], i, acc: n.includes("#") ? "♯" : n.includes("hf") ? "½♭" : /[A-G]b/.test(n) ? "♭" : "" }; });
  }

  /* =====================================================================
     FRETBOARD — guitar / violin / oud, animated finger positions
     ===================================================================== */
  const INSTR = {
    piano: { ar: "بيانو", en: "Piano", voice: "piano", t: 0 },
    guitar: { ar: "جيتار", en: "Guitar", voice: "guitar", t: -12, strings: [40, 45, 50, 55, 59, 64], frets: true, max: 15 },
    violin: { ar: "كمان", en: "Violin", voice: "violin", t: 0, strings: [55, 62, 69, 76], frets: false, max: 12 },
    oud: { ar: "عود", en: "Oud", voice: "oud", t: -12, strings: [36, 41, 45, 50, 55, 60], frets: false, max: 12 },
  };
  W.INSTR = INSTR;
  const nameOf = (m) => { const n = midiName(Math.round(m)); const i = MQ.letters.indexOf(n[0]); return { l: n.replace(/\d+$/, "").replace("#", "♯"), s: MQ.solfege[AR() ? "ar" : "en"][i] + (n.includes("#") ? "♯" : "") }; };
  /* the note-value symbol that matches a duration (in beats) */
  const glyphFor = (b) => (b == null ? "\u{1D15F}" : b >= 4 ? "\u{1D15D}" : b >= 2 ? "\u{1D15E}" : b >= 1 ? "\u{1D15F}" : b >= 0.5 ? "\u{1D160}" : "\u{1D161}");
  W.glyphFor = glyphFor;
  W.fretboard = function (el, o) {
    const cfg = INSTR[o.instr];
    const narrow = (el.clientWidth || Math.min(innerWidth - 40, 1100)) < 560;
    const VW = narrow ? 440 : 720, N = cfg.strings.length, X0 = narrow ? 44 : 64, X1 = VW - 16, gap = narrow ? 34 : 28, top = 26, H = gap * (N - 1) + 76;
    const fx = (n) => X0 + (X1 - X0) * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -cfg.max / 12));
    let svg, dot;
    const pos = (m) => { let best = null; cfg.strings.forEach((sm, si) => { const fr = Math.round(m) - sm; if (fr >= 0 && fr <= cfg.max && (!best || fr < best.fr)) best = { si, fr }; }); return best; };
    const render = () => {
      svg = s("svg", { viewBox: `0 0 ${VW} ${H}`, class: "mq-fret mq-fret--" + o.instr + (narrow ? " is-narrow" : ""), role: "img", "aria-label": t(cfg) });
      svg.append(s("rect", { x: X0 - 6, y: top - 10, width: X1 - X0 + 12, height: gap * (N - 1) + 20, rx: 6, class: "mq-fret__wood" }));
      for (let n = 1; n <= cfg.max; n++) {
        const x = fx(n);
        if (cfg.frets) svg.append(s("line", { x1: x, x2: x, y1: top - 10, y2: top + gap * (N - 1) + 10, class: "mq-fret__fret" }));
        if ([3, 5, 7, 9, 12, 15].includes(n)) {
          const cx = (fx(n - 1) + x) / 2, cy = top + gap * (N - 1) / 2;
          if (n === 12) { svg.append(s("circle", { cx, cy: cy - gap * 0.9, r: 4, class: "mq-fret__inlay" })); svg.append(s("circle", { cx, cy: cy + gap * 0.9, r: 4, class: "mq-fret__inlay" })); }
          else svg.append(s("circle", { cx, cy, r: 4, class: "mq-fret__inlay" }));
          svg.append(s("text", { x: cx, y: H - 6, "text-anchor": "middle", class: "mq-fret__num" }, n));
        }
      }
      svg.append(s("rect", { x: X0 - 8, y: top - 12, width: 8, height: gap * (N - 1) + 24, rx: 2, class: "mq-fret__nut" }));
      cfg.strings.slice().reverse().forEach((sm, k) => {
        const y = top + k * gap, w = 1 + (N - 1 - k) * 0.45;
        svg.append(s("line", { x1: X0 - 8, x2: X1 + 6, y1: y, y2: y, "stroke-width": w, class: "mq-fret__str", "data-si": N - 1 - k }));
        const nm = nameOf(sm);
        svg.append(s("text", { x: narrow ? 20 : 30, y: y + 5, "text-anchor": "middle", class: "mq-fret__open" }, nm.l));
      });
      dot = s("g", { class: "mq-fret__dot", opacity: 0 }, s("circle", { r: narrow ? 17 : 14 }), s("text", { y: narrow ? 9 : 8, "text-anchor": "middle", class: "mq-glyph" }, ""));
      svg.append(dot);
      el.append(h("div", { class: "mq-fretwrap", dir: "ltr" }, svg));
      if (narrow) svg.querySelectorAll(".mq-fret__num").forEach((n) => n.setAttribute("font-size", "18"));
    };
    const api = mount(el, render);
    api.flash = (m, dur = 0.4, beats) => {
      const p = pos(m + cfg.t); if (!p || !dot) return;
      const x = p.fr === 0 ? X0 - (narrow ? 12 : 20) : (fx(p.fr - 1) + fx(p.fr)) / 2, y = top + (N - 1 - p.si) * gap;
      dot.setAttribute("transform", `translate(${x} ${y})`); dot.setAttribute("opacity", 1);
      dot.querySelector("text").textContent = glyphFor(beats);
      dot.classList.remove("is-hit"); void dot.getBBox; dot.classList.add("is-hit");
      const str = svg.querySelector(`[data-si="${p.si}"]`);
      if (str) { str.classList.remove("is-vib"); void str.getBoundingClientRect(); str.classList.add("is-vib"); clearTimeout(str._t); str._t = setTimeout(() => str.classList.remove("is-vib"), Math.max(200, dur * 1000)); }
    };
    return api;
  };

  /* =====================================================================
     MY MELODIES — written by hand, kept in this browser, shareable by link
     Stored entries are re-validated on every read; names are only ever
     inserted as text nodes, so a crafted link cannot inject markup.
     ===================================================================== */
  const UKEY = "mq-mymel";
  const TOK = /^(r|[A-G](#|b|hf)?[2-6])(\/(\d{1,2}(\.\d{1,3})?|\.\d{1,3}))?$/;
  function cleanNotes(str) {
    if (typeof str !== "string") return null;
    const toks = str.trim().split(/\s+/).filter(Boolean);
    if (toks.length < 2 || toks.length > 240) return null;
    for (const tk of toks) { if (!TOK.test(tk)) return null; const b = tk.includes("/") ? +tk.split("/")[1] : 1; if (!(b >= 0.125 && b <= 8)) return null; }
    if (!toks.some((x) => x[0] !== "r")) return null;
    return toks.join(" ");
  }
  const clip = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, n) : "");
  function cleanMel(o) {
    if (!o || typeof o !== "object") return null;
    const n = cleanNotes(o.n), name = clip(o.t, 60);
    if (!n || !name) return null;
    const bpm = Math.round(Math.min(200, Math.max(40, +o.b || 100)));
    const id = typeof o.id === "string" && /^u-[a-z0-9]{4,16}$/.test(o.id) ? o.id : "u-" + Math.random().toString(36).slice(2, 10);
    return { id, t: name, s: clip(o.s, 80), b: bpm, n, at: +o.at || Date.now() };
  }
  const toMel = (u, shared) => ({
    id: u.id, ar: u.t, en: u.t, bpm: u.b, n: u.n, user: true, raw: u,
    by: shared ? { ar: "لحن أرسله لك صديق" + (u.s ? " — " + u.s : ""), en: "A melody a friend sent you" + (u.s ? " — " + u.s : "") }
               : { ar: "من ألحانك المدوّنة" + (u.s ? " — " + u.s : ""), en: "From your written melodies" + (u.s ? " — " + u.s : "") },
  });
  const UM = (W.userMel = {
    list() { try { const a = JSON.parse(localStorage.getItem(UKEY) || "[]"); return Array.isArray(a) ? a.map(cleanMel).filter(Boolean) : []; } catch (_) { return []; } },
    write(arr) { try { localStorage.setItem(UKEY, JSON.stringify(arr.slice(0, 80))); return true; } catch (_) { return false; } },
    mels() { return UM.list().map((u) => toMel(u)); },
    put(u) { const c = cleanMel(u); if (!c) return null; const a = UM.list().filter((x) => x.id !== c.id); a.unshift(c); return UM.write(a) ? c : null; },
    remove(id) { UM.write(UM.list().filter((x) => x.id !== id)); },
    has(id) { return UM.list().some((x) => x.id === id); },
    encode(u) { const j = JSON.stringify({ t: u.t, s: u.s || undefined, b: u.b, n: u.n }); return btoa(unescape(encodeURIComponent(j))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
    decode(str) { try { if (!str || str.length > 6000) return null; const b = str.replace(/-/g, "+").replace(/_/g, "/"); return cleanMel(JSON.parse(decodeURIComponent(escape(atob(b + "===".slice((b.length + 3) % 4)))))); } catch (_) { return null; } },
    link(u) { const base = location.href.split("#")[0].split("?")[0]; const q = new URLSearchParams(location.search); q.set("m", UM.encode(u)); return base + "?" + q.toString() + "#guess"; },
    code(u) { return `{ id: "${u.id.replace("u-", "my-")}", ar: ${JSON.stringify(u.t)}, en: ${JSON.stringify(u.t)}, by: { ar: ${JSON.stringify(u.s || "")}, en: ${JSON.stringify(u.s || "")} }, bpm: ${u.b}, n: "${u.n}" },`; },
    shared() { try { return UM.decode(new URLSearchParams(location.search).get("m")); } catch (_) { return null; } },
    changed(detail) { document.dispatchEvent(new CustomEvent("mq:mymel", { detail: detail || {} })); },
  });
  W.toMel = toMel;

  async function copyText(txt) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); return true; } } catch (_) { /* fall through */ }
    const ta = h("textarea", { readonly: "", style: { position: "fixed", top: "-1000px", opacity: "0" } }); ta.value = txt; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (_) { ok = false; } ta.remove(); return ok;
  }
  W.copyText = copyText;

  /* Arabic / Latin solfège text -> notation tokens ("صول4/2", "مي½", "do#5/.5", "E4/.5", "r/1") */
  const SOLF_AR = ["دو", "ري", "مي", "فا", "صول", "لا", "سي"], SOLF_EN = ["do", "re", "mi", "fa", "sol", "la", "si"];
  function textToNotes(src) {
    const out = [], bad = [];
    src.replace(/[،,|]+/g, " ").trim().split(/\s+/).filter(Boolean).forEach((raw) => {
      let tk = raw.replace(/♯/g, "#").replace(/½♭|♭½|½b/g, "hf").replace(/½/g, "hf").replace(/♭/g, "b").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
      const [head, beats] = tk.split("/");
      let m;
      if (/^(r|-|سكتة|س)$/i.test(head)) { m = "r"; }
      else {
        const ar = SOLF_AR.findIndex((x) => head.startsWith(x)), en = SOLF_EN.findIndex((x) => head.toLowerCase().startsWith(x)), lat = /^[A-G]/.test(head);
        let letter, rest;
        if (ar >= 0 && !(ar === 6 && head.startsWith("صول"))) { letter = MQ.letters[ar]; rest = head.slice(SOLF_AR[ar].length); }
        else if (en >= 0 && !lat) { const k = head.toLowerCase().startsWith("sol") ? 4 : en; letter = MQ.letters[k]; rest = head.slice(SOLF_EN[k].length); }
        else if (lat) { letter = head[0]; rest = head.slice(1); }
        const r2 = rest != null ? /^(#|b|hf)?(\d)?$/.exec(rest) : null;
        if (letter && r2) m = letter + (r2[1] || "") + (r2[2] || "4");
      }
      const tok = m ? m + (beats ? "/" + beats : "") : null;
      if (tok && TOK.test(tok)) out.push(tok); else bad.push(raw);
    });
    return { notes: out, bad };
  }

  W.composer = function (el) {
    const DUR = [[4, "\u{1D15D}", "مستديرة", "Whole"], [3, "\u{1D15E}.", "بيضاء بنقطة", "Dotted half"], [2, "\u{1D15E}", "بيضاء", "Half"], [1.5, "\u{1D15F}.", "سوداء بنقطة", "Dotted quarter"], [1, "\u{1D15F}", "سوداء", "Quarter"], [0.75, "\u{1D160}.", "كروش بنقطة", "Dotted eighth"], [0.5, "\u{1D160}", "كروش", "Eighth"], [0.25, "\u{1D161}", "دوبل كروش", "Sixteenth"]];
    const ACCS = [["", "♮", "طبيعية", "Natural"], ["#", "♯", "دييز", "Sharp"], ["b", "♭", "بيمول", "Flat"], ["hf", "½♭", "نصف بيمول", "Half-flat"]];
    let notes = [], dur = 1, acc = "", sel = -1, name = "", srcTxt = "", bpm = 100, editId = null, msg = null, playing = null, kb = null, confirmDel = null, lit = -1;
    let refs = {};
    const tokOf = (x) => x.n + (x.b === 1 ? "" : "/" + x.b);
    const notation = () => notes.map(tokOf).join(" ");
    const sylOf = (n) => { if (n === "r") return "·"; const m = /^([A-G])(#|b|hf)?(\d)$/.exec(n); const i = MQ.letters.indexOf(m[1]); return (AR() ? MQ.solfege.ar[i] : MQ.solfege.en[i]) + (m[2] ? { "#": "♯", b: "♭", hf: "½♭" }[m[2]] : ""); };

    function addMidi(m) {
      let n = midiName(m), isBlack = n.includes("#");
      if (!isBlack && acc) {
        const L0 = n[0], oct = n.slice(-1);
        if (acc === "#") n = (L0 === "E" || L0 === "B") ? midiName(m + 1) : L0 + "#" + oct;
        else if (acc === "b") n = (L0 === "C" || L0 === "F") ? midiName(m - 1) : L0 + "b" + oct;
        else if (acc === "hf") n = L0 + "hf" + oct;
      }
      S.play(acc === "hf" ? "oud" : "piano", n, 0, Math.min(1.2, 0.35 + dur * 0.3), 0.85);
      if (sel >= 0) { notes[sel] = { n, b: dur }; sel = sel + 1 < notes.length ? sel + 1 : -1; }
      else notes.push({ n, b: dur });
      if (acc) { acc = ""; paintTools(); }
      paintNotes(); syncText();
    }
    function addRest() { if (sel >= 0) { notes[sel] = { n: "r", b: dur }; sel = -1; } else notes.push({ n: "r", b: dur }); paintNotes(); syncText(); }
    function undo() { if (sel >= 0) { notes.splice(sel, 1); sel = -1; } else notes.pop(); paintNotes(); syncText(); }
    function clearAll() { notes = []; sel = -1; paintNotes(); syncText(); }
    function syncText() { if (refs.ta && document.activeElement !== refs.ta) refs.ta.value = notation(); }

    function perform(mel, onNote, onEnd) {
      stop();
      const ns = parseMel(mel.n), beat = 60 / (mel.bpm || 100) / 0.85, seq = []; let at = 0;
      ns.forEach((x) => { if (!x.rest) seq.push({ x, at, d: x.beats * beat }); at += x.beats * beat; });
      if (!seq.length) return;
      const sing = S.voiceReady && S.voiceReady();
      if (sing) {
        const ms = seq.map((q) => S.midi(q.x.n)); let shift = 0; while (Math.max(...ms) + shift > 81) shift -= 12; while (Math.min(...ms) + shift < 48) shift += 12;
        const nat = (x) => { const m = /^([A-G])(#|b|hf)?(\d)$/.exec(x.n); return S.midi(m[1] + m[3]); };
        S.singHuman(seq.map((q) => ({ at: q.at, d: q.d * 0.92, midi: S.midi(q.x.n) + shift, nat: nat(q.x) + shift, vel: 1 })), { style: "clear", vel: 1 });
      }
      const ev = seq.map((q, i) => ({ at: q.at, fn: (w) => { S.play(q.x.n.includes("hf") ? "oud" : "piano", q.x.n, w, q.d * 0.98, sing ? 0.35 : 0.9); setTimeout(() => onNote && onNote(i), w * 1000); } }));
      playing = run(ev, { total: at + 0.4, onEnd: () => { onEnd && onEnd(); } });
      if (S.loadVoice && !sing) S.loadVoice();
    }
    function stop() { if (playing && playing.alive) { playing.stop(); S.stopAll(); } }
    function playDraft() {
      if (playing && playing.alive) { stop(); return; }
      if (!notes.some((x) => x.n !== "r")) { say("warn", L("أضف بعض النغمات أولًا من البيانو.", "Add some notes from the piano first.")); return; }
      const idxMap = []; notes.forEach((x, i) => { if (x.n !== "r") idxMap.push(i); });
      perform({ n: notation(), bpm }, (k) => { lit = idxMap[k]; paintNotes(); }, () => { lit = -1; paintNotes(); paintActions(); });
      paintActions();
    }
    function say(kind, text, extra) { msg = { kind, text, extra }; paintMsg(); }

    function save() {
      const n = cleanNotes(notation());
      if (!name.trim()) { say("warn", L("اكتب اسمًا للحن — هذا هو الجواب الصحيح في اللعبة.", "Give the melody a name — that's the right answer in the game.")); refs.name && refs.name.focus(); return; }
      if (!n || notes.filter((x) => x.n !== "r").length < 3) { say("warn", L("اللحن يحتاج ثلاث نغمات على الأقل.", "A melody needs at least three notes.")); return; }
      const u = UM.put({ id: editId || undefined, t: name, s: srcTxt, b: bpm, n });
      if (!u) { say("bad", L("تعذّر الحفظ في هذا المتصفح (ربما وضع التصفح الخاص).", "Couldn't save in this browser (private mode?).")); return; }
      editId = u.id; UM.changed({ id: u.id });
      say("ok", L("حُفظ «" + u.t + "» وأُضيف إلى لعبة «خمّن اللحن».", "Saved “" + u.t + "” and added to “Guess the melody”."), u);
      paintList();
    }
    function load(u) { editId = u.id; name = u.t; srcTxt = u.s || ""; bpm = u.b; notes = parseMel(u.n).map((x) => ({ n: x.rest ? "r" : x.n, b: x.beats })); sel = -1; msg = null; api.rerender(); el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }); }
    function fresh() { editId = null; name = ""; srcTxt = ""; bpm = 100; notes = []; sel = -1; msg = null; api.rerender(); }
    async function share(u) {
      const url = UM.link(u);
      if (navigator.share && matchMedia("(pointer: coarse)").matches) { try { await navigator.share({ title: L("خمّن اللحن — مَقام", "Guess the melody — Maqam"), text: L("خمّن هذا اللحن!", "Guess this melody!"), url }); return; } catch (_) { /* cancelled -> copy */ } }
      const ok = await copyText(url);
      say(ok ? "ok" : "warn", ok ? L("نُسخ رابط التحدي — أرسله لأي أحد ليخمّن اللحن.", "Challenge link copied — send it to anyone to guess.") : L("انسخ الرابط يدويًا:", "Copy the link manually:"), ok ? null : { url });
    }

    /* ---------- painters (partial updates keep the keyboard and inputs alive) ---------- */
    function paintNotes() {
      const box = refs.notes; if (!box) return;
      box.innerHTML = "";
      if (!notes.length) { box.append(h("p", { class: "mq-comp__empty" }, L("اضغط مفاتيح البيانو لتدوين لحنك نغمةً نغمة…", "Tap the piano keys to write your melody note by note…"))); }
      const real = notes.filter((x) => x.n !== "r").map((x) => S.midi(x.n)), lo = Math.min(...real), span = Math.max(1, Math.max(...real) - lo);
      notes.forEach((x, i) => {
        const rest = x.n === "r", lift = rest ? 0 : Math.round(((S.midi(x.n) - lo) / span) * 30);
        const chipEl = h("button", { type: "button", class: "mq-comp__n" + (rest ? " is-rest" : "") + (i === sel ? " is-sel" : "") + (i === lit ? " is-now" : "") + (x.n.includes("hf") ? " is-qt" : ""), style: { "--lift": lift + "px" }, "aria-label": (rest ? L("سكتة", "Rest") : sylOf(x.n) + " " + x.n) + " · " + x.b,
          onclick: () => { sel = sel === i ? -1 : i; if (sel >= 0) { dur = notes[i].b; paintTools(); if (!rest) S.play(x.n.includes("hf") ? "oud" : "piano", x.n, 0, 0.5, 0.8); } paintNotes(); } },
          h("b", {}, rest ? "𝄽" : sylOf(x.n)), h("i", { class: "mq-glyph" }, (DUR.find((d) => d[0] === x.b) || [0, "♪"])[1]), h("small", { dir: "ltr" }, rest ? "" : x.n.replace("hf", "½♭").replace("#", "♯").replace(/([A-G])b/, "$1♭")));
        box.append(chipEl);
      });
      if (refs.count) refs.count.textContent = notes.length ? L(notes.length + " علامة · " + notes.reduce((a, x) => a + x.b, 0) + " ضربة", notes.length + " marks · " + notes.reduce((a, x) => a + x.b, 0) + " beats") : "";
      if (refs.selHint) refs.selHint.hidden = sel < 0;
    }
    function paintTools() {
      if (!refs.durs) return;
      refs.durs.querySelectorAll("button").forEach((b) => { const on = +b.dataset.v === dur; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
      refs.accs.querySelectorAll("button").forEach((b) => { const on = b.dataset.v === acc; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    }
    function paintActions() { if (refs.playBtn) refs.playBtn.textContent = playing && playing.alive ? L("إيقاف", "Stop") : L("اسمع لحنك", "Hear your melody"); }
    function paintMsg() {
      const box = refs.msg; if (!box) return; box.innerHTML = "";
      if (!msg) return;
      box.className = "mq-comp__msg is-" + msg.kind;
      box.append(h("span", {}, msg.text));
      if (msg.kind === "ok" && msg.extra && msg.extra.id) {
        const u = msg.extra;
        box.append(h("div", { class: "mq-row mq-wrap" },
          btn(L("خمّنه الآن في اللعبة", "Play it in the game"), () => { UM.changed({ id: u.id, play: true }); const g = document.getElementById("guess"); g && g.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); }, "mq-btn--primary mq-btn--small"),
          btn(L("انسخ رابط التحدي", "Copy challenge link"), () => share(u), "mq-btn--ghost mq-btn--small"),
          btn(L("لحن جديد", "New melody"), fresh, "mq-btn--ghost mq-btn--small")));
      }
      if (msg.extra && msg.extra.url) { const inp = h("input", { class: "mq-comp__in", readonly: "", value: msg.extra.url, dir: "ltr", onfocus: (e) => e.target.select() }); box.append(inp); }
    }
    function paintList() {
      const box = refs.list; if (!box) return; box.innerHTML = "";
      const arr = UM.list();
      box.append(h("div", { class: "mq-row mq-row--between mq-wrap" }, h("b", { class: "mq-comp__lt" }, L("ألحاني", "My melodies"), h("span", { class: "mq-comp__badge" }, arr.length)),
        arr.length ? btn(L("انسخ الكل ككود للموقع", "Copy all as site code"), async () => { const ok = await copyText(arr.map(UM.code).join("\n")); say(ok ? "ok" : "warn", ok ? L("نُسخ الكود — ألصقه داخل MQ.melodies في shared/content.js ليظهر للجميع.", "Code copied — paste it into MQ.melodies in shared/content.js so everyone gets it.") : L("تعذّر النسخ.", "Copy failed.")); }, "mq-btn--ghost mq-btn--small") : null));
      if (!arr.length) { box.append(h("p", { class: "mq-dim mq-comp__none" }, L("لا ألحان بعد. ما تحفظه هنا يدخل فورًا في أسئلة «خمّن اللحن»، ويبقى محفوظًا في هذا المتصفح.", "Nothing yet. Whatever you save joins the “Guess the melody” questions right away and stays saved in this browser."))); return; }
      box.append(h("ul", { class: "mq-comp__items" }, arr.map((u) => h("li", { class: "mq-comp__item" + (u.id === editId ? " is-edit" : "") },
        h("div", { class: "mq-comp__meta" }, h("b", {}, u.t), h("small", { class: "mq-dim" }, parseMel(u.n).filter((x) => !x.rest).length + L(" نغمة", " notes") + " · " + u.b + " bpm" + (u.s ? " · " + u.s : ""))),
        h("div", { class: "mq-comp__acts" },
          h("button", { type: "button", class: "mq-iconbtn", "aria-label": L("استمع", "Listen"), title: L("استمع", "Listen"), onclick: () => perform(toMel(u)) }, "▶"),
          h("button", { type: "button", class: "mq-iconbtn", "aria-label": L("خمّنه في اللعبة", "Play in game"), title: L("خمّنه في اللعبة", "Play in game"), onclick: () => { UM.changed({ id: u.id, play: true }); const g = document.getElementById("guess"); g && g.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); } }, "?"),
          h("button", { type: "button", class: "mq-iconbtn", "aria-label": L("شارك", "Share"), title: L("انسخ رابط التحدي", "Copy challenge link"), onclick: () => share(u) }, s("svg", { viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": "true" }, s("path", { d: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round" }))),
          h("button", { type: "button", class: "mq-iconbtn", "aria-label": L("عدّل", "Edit"), title: L("عدّل", "Edit"), onclick: () => load(u) }, "✎"),
          h("button", { type: "button", class: "mq-iconbtn is-del" + (confirmDel === u.id ? " is-confirm" : ""), "aria-label": L("احذف", "Delete"), title: L("احذف", "Delete"),
            onclick: () => { if (confirmDel !== u.id) { confirmDel = u.id; paintList(); setTimeout(() => { if (confirmDel === u.id) { confirmDel = null; paintList(); } }, 3000); return; } confirmDel = null; UM.remove(u.id); if (editId === u.id) editId = null; UM.changed({}); paintList(); } }, confirmDel === u.id ? L("متأكد؟", "Sure?") : "✕"))))));
    }

    const render = () => {
      el.classList.add("mq-comp");
      if (kb && kb.destroy) { try { kb.destroy(); } catch (_) {} } kb = null;
      const nameIn = h("input", { class: "mq-comp__in mq-comp__in--name", type: "text", maxlength: 60, value: name, placeholder: L("اسم اللحن — مثلًا: زوروني كل سنة مرة", "Melody name — e.g. Frère Jacques"), "aria-label": L("اسم اللحن", "Melody name"), oninput: (e) => { name = e.target.value; } });
      const srcIn = h("input", { class: "mq-comp__in", type: "text", maxlength: 80, value: srcTxt, placeholder: L("الملحن أو المصدر (اختياري)", "Composer or source (optional)"), "aria-label": L("الملحن أو المصدر", "Composer or source"), oninput: (e) => { srcTxt = e.target.value; } });
      const bpmOut = h("output", { class: "mq-comp__bpm" }, bpm);
      const bpmIn = h("input", { type: "range", min: 50, max: 180, step: 2, value: bpm, "aria-label": L("السرعة", "Tempo"), oninput: (e) => { bpm = +e.target.value; bpmOut.textContent = bpm; } });
      refs = { name: nameIn };
      el.append(h("div", { class: "mq-comp__head" },
        h("label", { class: "mq-comp__f mq-comp__f--name" }, h("small", {}, L("اسم اللحن (الجواب)", "Name (the answer)")), nameIn),
        h("label", { class: "mq-comp__f" }, h("small", {}, L("المصدر", "Source")), srcIn),
        h("label", { class: "mq-comp__f mq-comp__f--bpm" }, h("small", {}, L("السرعة", "Tempo"), " · ", bpmOut, " bpm"), bpmIn)));

      // the "score": the notes written so far, rising and falling with pitch
      refs.notes = h("div", { class: "mq-comp__notes", dir: "ltr", role: "list", "aria-live": "polite" });
      refs.count = h("span", { class: "mq-dim mq-comp__count" });
      refs.selHint = h("span", { class: "mq-comp__selhint", hidden: true }, L("نغمة محددة: اضغط مفتاحًا لاستبدالها، أو غيّر مدتها، أو «احذف».", "Note selected: press a key to replace it, change its length, or delete it."));
      el.append(h("div", { class: "mq-comp__score" }, h("div", { class: "mq-comp__staff", "aria-hidden": "true" }), refs.notes, h("div", { class: "mq-row mq-row--between mq-wrap mq-comp__under" }, refs.count, refs.selHint)));

      refs.durs = h("div", { class: "mq-comp__seg", role: "group", "aria-label": L("مدة النغمة", "Note length") }, DUR.map(([v, g, a, e]) => h("button", { type: "button", class: "mq-comp__tool", "data-v": v, title: L(a, e), "aria-label": L(a, e), onclick: () => { dur = v; if (sel >= 0) { notes[sel].b = v; paintNotes(); syncText(); } paintTools(); } }, h("span", { class: "mq-glyph" }, g), h("small", {}, L(a, e)))));
      refs.accs = h("div", { class: "mq-comp__seg mq-comp__seg--acc", role: "group", "aria-label": L("العلامة التحويلية للنغمة التالية", "Accidental for the next note") }, ACCS.map(([v, g, a, e]) => h("button", { type: "button", class: "mq-comp__tool" + (v === "hf" ? " is-qt" : ""), "data-v": v, title: L(a, e), "aria-label": L(a, e), onclick: () => { acc = acc === v ? "" : v; paintTools(); } }, h("span", {}, g), h("small", {}, L(a, e)))));
      el.append(h("div", { class: "mq-comp__tools" },
        h("div", { class: "mq-comp__grp" }, h("small", {}, L("المدة", "Length")), refs.durs),
        h("div", { class: "mq-comp__grp" }, h("small", {}, L("للنغمة التالية", "Next note")), refs.accs),
        h("div", { class: "mq-comp__grp mq-comp__grp--edit" }, h("small", {}, L("تحرير", "Edit")), h("div", { class: "mq-comp__seg" },
          h("button", { type: "button", class: "mq-comp__tool", onclick: addRest, title: L("سكتة", "Rest") }, h("span", { class: "mq-glyph" }, "𝄽"), h("small", {}, L("سكتة", "Rest"))),
          h("button", { type: "button", class: "mq-comp__tool", onclick: undo, title: L("احذف", "Delete") }, h("span", {}, "⌫"), h("small", {}, L("احذف", "Delete"))),
          h("button", { type: "button", class: "mq-comp__tool", onclick: clearAll, title: L("امسح الكل", "Clear") }, h("span", {}, "⟲"), h("small", {}, L("امسح", "Clear")))))));

      const host = h("div", { class: "mq-kbhost mq-comp__kb" }); el.append(host);
      kb = W.keyboard(host, { start: 48, octaves: 3, labels: "both", voice: "piano", silent: true, onNote: addMidi });

      refs.ta = h("textarea", { class: "mq-comp__in mq-comp__ta", dir: "ltr", rows: 2, spellcheck: "false", placeholder: "صول4/.75 صول4/.25 لا4 صول4 دو5 سي4/2   ·   G4/.75 G4/.25 A4 G4 C5 B4/2" });
      refs.ta.value = notation();
      const taMsg = h("small", { class: "mq-dim" });
      el.append(h("details", { class: "mq-comp__text" }, h("summary", {}, L("أو اكتب التدوين نصًا (للصق نوتة جاهزة)", "Or type the notation as text (paste a ready score)")),
        h("p", { class: "mq-dim" }, L("نغمة + أوكتاف (اختياري، الافتراضي 4) + /المدة بالضربات. أمثلة: «دو» «صول5/2» «مي½» للسيكاه «فا#» «r/1» للسكتة. يقبل الحروف اللاتينية أيضًا: C4 Eb4/.5", "Note + octave (optional, default 4) + /length in beats. Examples: do, sol5/2, mi½ (Sikah), fa#, r/1 for a rest. Latin letters work too: C4 Eb4/.5")),
        refs.ta, h("div", { class: "mq-row mq-wrap" }, btn(L("طبّق النص", "Apply text"), () => {
          const r = textToNotes(refs.ta.value);
          if (r.bad.length) { taMsg.textContent = L("لم أفهم: ", "Couldn't read: ") + r.bad.slice(0, 6).join("  "); taMsg.className = "mq-comp__bad"; return; }
          notes = r.notes.map((tk) => { const [n, b] = tk.split("/"); return { n, b: b ? +b : 1 }; }); sel = -1; paintNotes(); refs.ta.value = notation(); taMsg.textContent = L("تم ✓", "Done ✓"); taMsg.className = "mq-comp__good";
        }, "mq-btn--ghost mq-btn--small"), taMsg)));

      refs.playBtn = btn("", playDraft, "mq-btn--ghost");
      el.append(h("div", { class: "mq-row mq-wrap mq-comp__actions" }, refs.playBtn, btn(editId ? L("احفظ التعديل", "Save changes") : L("احفظ وأضفه للعبة", "Save & add to the game"), save, "mq-btn--primary"), editId ? btn(L("لحن جديد", "New melody"), fresh, "mq-btn--ghost") : null));
      refs.msg = h("div", { class: "mq-comp__msg", role: "status" }); el.append(refs.msg);
      refs.list = h("div", { class: "mq-comp__list" }); el.append(refs.list);
      paintNotes(); paintTools(); paintActions(); paintMsg(); paintList();
    };
    const api = mount(el, render, () => { stop(); kb && kb.destroy && kb.destroy(); });
    api.onStop = () => { lit = -1; };
    document.addEventListener("mq:mymel", () => { if (el.isConnected) paintList(); });
    return api;
  };

  W.guess = function (el) {
    const UMx = W.userMel, pool = () => MQ.melodies.concat(UMx.mels());
    let set = "all", challenge = null, savedChallenge = false;
    let order = shuffle(pool()), qi = 0, cur, opts, picked = null, score = 0, tries = 0, streak = 0;
    const shared = UMx.shared();
    if (shared) { challenge = W.toMel(shared, true); savedChallenge = UMx.has(shared.id) || UMx.list().some((u) => u.n === shared.n); order = [challenge].concat(order.filter((m) => m.n !== challenge.n)); }
    let show = true, src = "both", instr = "piano", level = "beginner", playing = null, lit = -1, hint = false, view = null;
    const SPEED = { beginner: 0.72, pro: 1 };
    if (S.loadVoice) S.loadVoice();
    const setup = () => { cur = order[qi % order.length]; opts = shuffle([cur].concat(shuffle(pool().filter((m) => m.n !== cur.n && t(m) !== t(cur))).slice(0, 3))); picked = null; hint = false; lit = -1; };
    function reorder(firstId) {
      const src = set === "mine" ? UMx.mels() : pool();
      if (!src.length) { set = "all"; return reorder(firstId); }
      order = shuffle(src); qi = 0;
      if (firstId) { const k = order.findIndex((m) => m.id === firstId); if (k > 0) order.unshift(order.splice(k, 1)[0]); }
    }
    document.addEventListener("mq:mymel", (e) => {
      if (!el.isConnected) return;
      const d = e.detail || {};
      if (set === "mine" && !UMx.list().length) set = "all";
      if (d.play) { stop(); reorder(d.id); setup(); api.rerender(); setTimeout(play, 350); }
      else if (!picked || set === "mine") { /* keep the current question; just refresh the pool */ api.rerender(); }
    });
    setup();
    const sylText = (x) => (AR() ? MQ.solfege.ar[x.i] : MQ.solfege.en[x.i]);
    const range = () => { const ms = parseMel(cur.n).filter((x) => !x.rest).map((x) => S.midi(x.n)); const lo = Math.floor(Math.min(...ms) / 12) * 12, hi = Math.ceil((Math.max(...ms) + 1) / 12) * 12; return { start: lo, octaves: Math.max(2, Math.min(3, (hi - lo) / 12)) }; };
    const render = () => {
      const notes = parseMel(cur.n), revealed = picked != null;
      const srcs = [["voice", "غناء الأسماء فقط", "Sung names only"], ["both", "غناء + الآلة", "Singing + instrument"], ["inst", "الآلة فقط", "Instrument only"]];
      el.append(h("div", { class: "mq-guess__ctl" },
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("الصوت", "Sound")), h("div", { class: "mq-seg" }, srcs.map(([m, a, e]) => chip(L(a, e), src === m, () => { stop(); src = m; api.rerender(); })))),
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("الآلة", "Instrument")), h("div", { class: "mq-seg" }, Object.keys(INSTR).map((k) => chip(t(INSTR[k]), instr === k, () => { stop(); instr = k; api.rerender(); })))),
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("المستوى", "Level")), h("div", { class: "mq-seg" }, chip(L("مبتدئ — بطيء وواضح", "Beginner — slow & clear"), level === "beginner", () => { stop(); level = "beginner"; api.rerender(); }), chip(L("محترف — أداء فنّي", "Pro — artistic performance"), level === "pro", () => { stop(); level = "pro"; api.rerender(); }))),
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("الألحان", "Melodies")), h("div", { class: "mq-seg" },
          chip(L("الكل", "All") + " · " + pool().length, set === "all", () => { if (set === "all") return; stop(); set = "all"; reorder(); setup(); api.rerender(); }),
          chip(L("ألحاني", "Mine") + " · " + UMx.list().length, set === "mine", () => { if (!UMx.list().length) { const c = document.getElementById("composer"); c && c.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); return; } if (set === "mine") return; stop(); set = "mine"; reorder(); setup(); api.rerender(); }))),
        h("div", { class: "mq-guess__grp mq-guess__grp--end" }, chip(L("أظهر النغمات", "Show notes"), show, () => { show = !show; api.rerender(); }),
          h("span", { class: "mq-score" }, score + " / " + tries + (streak > 1 ? " · " + L("متتالية ", "streak ") + streak : "")))));
      if (cur === challenge && !revealed) el.append(h("div", { class: "mq-guess__challenge" }, h("span", { class: "mq-glyph", "aria-hidden": "true" }, "\u{1D11E}"), h("div", {}, h("b", {}, L("تحدٍّ من صديق!", "A challenge from a friend!")), h("span", {}, L("أُرسل إليك هذا اللحن مدوّنًا باليد. اسمعه وخمّن اسمه.", "Someone wrote this melody by hand and sent it to you. Listen and name it.")))));
      const line = h("div", { class: "mq-sylls", dir: AR() ? "rtl" : "ltr" });
      let k = 0;
      const heights = notes.filter((x) => !x.rest).map((x) => x.i + (+x.n.slice(-1)) * 7);
      const lo = Math.min(...heights), span = Math.max(1, Math.max(...heights) - lo);
      notes.forEach((x) => {
        if (x.rest) { line.append(h("span", { class: "mq-syl is-rest", "aria-hidden": "true" }, "·")); return; }
        const idx = k++, visible = revealed || (show && lit >= idx) || (hint && idx < 4);
        const lift = Math.round(((x.i + (+x.n.slice(-1)) * 7 - lo) / span) * 26);
        line.append(h("span", { class: "mq-syl" + (lit === idx ? " is-now" : "") + (visible ? "" : " is-hid") + (x.beats >= 2 ? " is-long" : x.beats <= 0.5 ? " is-short" : ""), style: { "--lift": lift + "px" } },
          visible ? [sylText(x), x.acc ? h("sup", {}, x.acc) : null] : "?"));
      });
      el.append(line);
      if (view && view.destroy) { try { view.destroy(); } catch (_) {} } view = null;
      const host = h("div", { class: "mq-guess__view" });
      el.append(h("div", { class: "mq-guess__stage" }, h("span", { class: "mq-guess__tag" }, t(INSTR[instr]) + (INSTR[instr].t ? L(" · يُكتب بأوكتاف أعلى مما يُسمع", " · sounds an octave below written") : "")), host));
      if (instr === "piano") { const r = range(); host.classList.add("mq-kbhost"); view = W.keyboard(host, { start: r.start, octaves: r.octaves, labels: "both", keys: false, voice: "piano" }); }
      else view = W.fretboard(host, { instr });
      el.append(h("div", { class: "mq-row mq-wrap" },
        btn(playing && playing.alive ? L("إيقاف", "Stop") : L("اسمع اللحن", "Hear the melody"), () => (playing && playing.alive ? stop() : play()), "mq-btn--primary"),
        !revealed ? btn(L("تلميح: أول النغمات", "Hint: first notes"), () => { hint = true; play(); }, "mq-btn--ghost") : null));
      el.append(h("p", { class: "mq-dim mq-guess__q" }, L("ما هي هذه الأغنية؟", "Which song is this?")));
      el.append(h("div", { class: "mq-opts" }, opts.map((m, i) => h("button", { type: "button", class: "mq-opt" + (revealed ? (m === cur ? " is-ok" : m === picked ? " is-bad" : " is-dim") : ""), disabled: revealed, onclick: () => pick(m) }, h("span", { class: "mq-opt__k" }, AR() ? "أبجد"[i] : "abcd"[i]), t(m)))));
      if (revealed) el.append(h("div", { class: "mq-fb " + (picked === cur ? "is-ok" : "is-bad") },
        h("b", {}, picked === cur ? L("أذن موسيقية!", "Great ear!") : L("كانت: ", "It was: ") + t(cur)), " — ", t(cur.by), " ",
        cur === challenge && !savedChallenge ? btn(L("أضفه إلى ألحاني", "Save to my melodies"), () => { if (UMx.put(Object.assign({}, cur.raw, { id: undefined }))) { savedChallenge = true; UMx.changed({}); } }, "mq-btn--ghost mq-btn--small") : null, " ",
        btn(L("اللحن التالي", "Next melody"), () => { qi++; stop(); setup(); api.rerender(); setTimeout(play, 250); }, "mq-btn--primary mq-btn--small")));
    };
    function play() {
      stop();
      if (S.loadVoice && !S.voiceReady() && !voiceTried) { voiceTried = true; S.loadVoice().then(() => play()); return; }
      const notes = parseMel(cur.n), cfg = INSTR[instr], pro = level === "pro", beat = 60 / cur.bpm / SPEED[level];
      const seq = []; let at = 0;
      notes.forEach((x) => { if (!x.rest) seq.push({ x, at, d: x.beats * beat, beats: x.beats }); at += x.beats * beat; });
      // professional phrasing: swell toward the highest note, lean on long notes, broaden the final note
      if (pro && seq.length) {
        const ms = seq.map((q) => S.midi(q.x.n)), top = ms.indexOf(Math.max(...ms));
        seq.forEach((q, i) => { const toTop = i <= top ? i / Math.max(1, top) : 1 - (i - top) / Math.max(1, seq.length - top); q.vel = 0.72 + 0.28 * toTop + (q.beats >= 1.5 ? 0.06 : 0); });
        const lastQ = seq[seq.length - 1]; lastQ.d *= 1.35;
        if (seq.length > 2) { seq[seq.length - 2].d *= 1.08; lastQ.at += (seq[seq.length - 2].d - seq[seq.length - 2].beats * beat); }
        at = lastQ.at + lastQ.d;
      }
      const voiceOn = src === "voice" || src === "both", instOn = src === "inst" || src === "both";
      if (voiceOn) {
        const ms = seq.map((q) => S.midi(q.x.n));
        // keep the tune inside the singer's range (C3–B5)
        let shift = 0; while (Math.max(...ms) + shift > 81) shift -= 12; while (Math.min(...ms) + shift < 48) shift += 12;
        const nat = (x) => { const m = /^([A-G])(#|b|hf)?(\d)$/.exec(x.n); return S.midi(m[1] + m[3]); };
        if (S.voiceReady()) {
          S.singHuman(seq.map((q) => ({ at: q.at, d: q.d * (pro ? 1 : 0.9), midi: S.midi(q.x.n) + shift, nat: nat(q.x) + shift, vel: q.vel || 1 })), { style: pro ? "pro" : "clear", vel: 1 });
        } else {
          S.singPhrase(seq.map((q) => ({ at: q.at, d: q.d * (pro ? 0.99 : 0.95), pitch: S.midi(q.x.n) + shift, syl: q.x.syl, vel: q.vel || 1 })), { style: pro ? "pro" : "clear", read: src === "voice", vel: 1 });
        }
        singing = true;
      }
      const ev = seq.map((q, idx) => ({ at: q.at, fn: (w) => {
        if (instOn) S.play(cfg.voice, S.midi(q.x.n) + cfg.t, w, q.d * (cfg.voice === "guitar" || cfg.voice === "oud" ? 1.4 : 0.98), (voiceOn ? 0.32 : 0.9) * (q.vel || 1));
        setTimeout(() => { lit = idx; paint(); view && view.flash && view.flash(S.midi(q.x.n), q.d * 0.9, q.beats); }, w * 1000);
      } }));
      playing = run(ev, { total: at + 0.4, onEnd: () => { lit = -1; singing = false; paint(); api.rerender(); } });
      api.rerender();
    }
    function paint() {
      const notes = parseMel(cur.n).filter((x) => !x.rest), revealed = picked != null;
      el.querySelectorAll(".mq-syl:not(.is-rest)").forEach((sp, idx) => {
        const x = notes[idx], vis = revealed || (show && lit >= idx) || (hint && idx < 4);
        sp.classList.toggle("is-now", idx === lit); sp.classList.toggle("is-hid", !vis);
        sp.innerHTML = ""; if (vis) { sp.append(sylText(x)); if (x.acc) sp.append(h("sup", {}, x.acc)); } else sp.append("?");
      });
    }
    let singing = false, voiceTried = false;
    function stop() { const wasSinging = singing && playing && playing.alive; if (playing && playing.alive) playing.stop(); if (wasSinging) S.stopAll(); singing = false; }
    function pick(m) { picked = m; tries++; if (m === cur) { score++; streak++; S.play("xylophone", "E6", 0); S.play("xylophone", "B6", 0.09); } else streak = 0; api.rerender(); }
    const api = mount(el, render, stop);
    return api;
  };


  /* =====================================================================
     EAR TRAINING — hear an interval or a triad, name it
     ===================================================================== */
  W.ear = function (el) {
    let kind = "int", level = "beginner", q = null, picked = null, score = 0, tries = 0, streak = 0, kb = null, dir = 1;
    const POOL = {
      int: { beginner: ["m3", "M3", "P4", "P5", "P8"], pro: MQ.intervals.map((x) => x.id) },
      chord: { beginner: ["maj", "min"], pro: MQ.chords.map((x) => x.id) },
    };
    const item = (id) => (kind === "int" ? MQ.intervals : MQ.chords).find((x) => x.id === id);
    const fresh = () => {
      const ids = POOL[kind][level], id = ids[(Math.random() * ids.length) | 0];
      const root = 57 + ((Math.random() * 10) | 0);
      q = { id, root }; picked = null; dir = Math.random() < 0.5 || kind === "chord" ? 1 : -1;
    };
    fresh();
    const notesOf = () => kind === "int" ? [q.root, q.root + dir * item(q.id).semi] : item(q.id).semis.map((x) => q.root + x);
    const short = (x) => (kind === "int" ? (AR() ? x.ar.split(" (")[0] : x.en) : t(x).replace("تآلف ثلاثي ", "").replace(" triad", ""));
    const render = () => {
      el.append(h("div", { class: "mq-guess__ctl" },
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("التمرين", "Drill")), h("div", { class: "mq-seg" }, chip(L("المسافات", "Intervals"), kind === "int", () => { kind = "int"; fresh(); api.rerender(); hear(); }), chip(L("التآلفات", "Triads"), kind === "chord", () => { kind = "chord"; fresh(); api.rerender(); hear(); }))),
        h("div", { class: "mq-guess__grp" }, h("small", {}, L("المستوى", "Level")), h("div", { class: "mq-seg" }, chip(L("مبتدئ", "Beginner"), level === "beginner", () => { level = "beginner"; fresh(); api.rerender(); }), chip(L("محترف", "Pro"), level === "pro", () => { level = "pro"; fresh(); api.rerender(); }))),
        h("div", { class: "mq-guess__grp mq-guess__grp--end" }, h("span", { class: "mq-dim" }, L("اسمع ثم اختر", "Listen, then choose")), h("span", { class: "mq-score" }, score + " / " + tries + (streak > 1 ? " · " + L("متتالية ", "streak ") + streak : "")))));
      el.append(h("div", { class: "mq-ear__play" },
        h("button", { type: "button", class: "mq-ear__big", onclick: hear, "aria-label": L("استمع", "Listen") }, h("span", { class: "mq-glyph" }, kind === "int" ? "\u{1D15F}\u{1D15F}" : "\u266B")),
        h("div", { class: "mq-row mq-wrap" }, btn(L("لحنيًا (واحدة تلو الأخرى)", "Melodic (one by one)"), () => hear("mel"), "mq-btn--ghost mq-btn--small"), btn(L("هارمونيًا (معًا)", "Harmonic (together)"), () => hear("harm"), "mq-btn--ghost mq-btn--small"))));
      const ids = POOL[kind][level];
      el.append(h("div", { class: "mq-opts mq-opts--ear" }, ids.map((id, i) => { const x = item(id); return h("button", { type: "button", class: "mq-opt" + (picked ? (id === q.id ? " is-ok" : id === picked ? " is-bad" : " is-dim") : ""), disabled: !!picked, onclick: () => pick(id) }, h("span", { class: "mq-opt__k" }, i + 1), short(x)); })));
      if (picked) {
        const x = item(q.id);
        el.append(h("div", { class: "mq-fb " + (picked === q.id ? "is-ok" : "is-bad") },
          h("b", {}, (picked === q.id ? L("صحيح: ", "Right: ") : L("كانت: ", "It was: ")) + t(x)), " — ", kind === "int" ? t(x.tones) + " · " + t(x.feel) : t(x.build) + " · " + t(x.feel), " ",
          btn(L("التالي", "Next"), () => { fresh(); api.rerender(); hear(); }, "mq-btn--primary mq-btn--small")));
        const box = h("div", { class: "mq-kbhost" }); el.append(box);
        kb = W.keyboard(box, { start: 48, octaves: 3, highlight: notesOf(), keys: false });
      }
    };
    function hear(mode) {
      const ns = notesOf();
      if (mode !== "harm") ns.forEach((n, i) => S.play("piano", n, i * 0.55, 0.6, 0.85));
      if (mode !== "mel") S.chord("piano", ns, mode === "harm" ? 0 : ns.length * 0.55 + 0.15, 1.5, 0.95);
    }
    function pick(id) { picked = id; tries++; if (id === q.id) { score++; streak++; } else streak = 0; api.rerender(); hear("harm"); }
    const api = mount(el, render);
    return api;
  };
  W.render = function (name, el, opts) { return W[name] ? W[name](el, opts) : null; };
})();
