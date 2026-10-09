/* =========================================================================
   Sound — a tiny orchestra in Web Audio. No samples: every timbre is
   synthesised, so the site and the APK work fully offline.
   ========================================================================= */
(function () {
  const S = {};
  let ctx = null, master, comp, wet, dry, verb, analyser;
  const ksCache = new Map();
  S.enabled = true;
  S.volume = 0.8;

  const listeners = new Set();
  S.onNote = (fn) => (listeners.add(fn), () => listeners.delete(fn));
  const emit = (e) => listeners.forEach((f) => { try { f(e); } catch (_) {} });

  function impulse(c, sec = 1.6, decay = 3.6) {
    const len = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  S.init = function () {
    if (ctx) { if (ctx.state !== "running" && ctx.state !== "closed") ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = S.enabled ? S.volume : 0;
    analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    dry = ctx.createGain(); dry.gain.value = 0.86;
    wet = ctx.createGain(); wet.gain.value = 0.16;
    verb = ctx.createConvolver(); verb.buffer = impulse(ctx);
    dry.connect(comp); wet.connect(verb); verb.connect(comp);
    comp.connect(master); master.connect(analyser); analyser.connect(ctx.destination);
    return ctx;
  };
  S.ready = () => !!ctx && ctx.state === "running";
  S.now = () => (ctx ? ctx.currentTime : 0);
  S.ctx = () => ctx;
  S.analyser = () => analyser;
  S.setEnabled = function (on) {
    S.enabled = !!on;
    if (master) master.gain.setTargetAtTime(S.enabled ? S.volume : 0, ctx.currentTime, 0.03);
    try { localStorage.setItem("mq-sound", S.enabled ? "1" : "0"); } catch (_) {}
    document.dispatchEvent(new CustomEvent("mq:sound", { detail: S.enabled }));
  };
  try { const v = localStorage.getItem("mq-sound"); if (v === "0") S.enabled = false; } catch (_) {}

  /* ---------- pitch helpers ---------- */
  const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  S.midi = (name) => { // "C4", "F#4", "Bb3", "Ehf4" (half-flat) -> fractional midi
    const m = /^([A-G])(#|b|hf|hs)?(-?\d)$/.exec(name);
    if (!m) return 60;
    let v = LETTER[m[1]] + (+m[3] + 1) * 12;
    if (m[2] === "#") v += 1; else if (m[2] === "b") v -= 1; else if (m[2] === "hf") v -= 0.5; else if (m[2] === "hs") v += 0.5;
    return v;
  };
  S.freq = (x) => 440 * Math.pow(2, ((typeof x === "number" ? x : S.midi(x)) - 69) / 12);
  S.cents = (base, c) => base * Math.pow(2, c / 1200);
  /* One rule for every pitch argument: "C4"/"Ehf4" = note name, a number
     below 128 = MIDI note (fractions allowed), a number from 128 up = Hz,
     { hz } = explicit Hz. */
  S.toHz = (p) => (p == null || p === 0 ? 0 : typeof p === "object" ? p.hz : typeof p === "string" ? S.freq(p) : p < 128 ? S.freq(p) : p);

  /* ---------- building blocks ---------- */
  const waves = {};
  function pw(key, fn, n = 32) {
    if (waves[key]) return waves[key];
    const re = new Float32Array(n), im = new Float32Array(n);
    for (let i = 1; i < n; i++) im[i] = fn(i);
    return (waves[key] = ctx.createPeriodicWave(re, im));
  }
  function out(node, pan = 0, send = 1) {
    let n = node;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; n.connect(p); n = p; }
    n.connect(dry);
    if (send) { const s = ctx.createGain(); s.gain.value = send; n.connect(s); s.connect(wet); }
  }
  function env(g, t, a, peak, d, sus, rel, dur) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sus, t + a, d);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, dur), rel);
  }
  function noiseBuf() {
    if (waves._noise) return waves._noise;
    const len = ctx.sampleRate * 2, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (waves._noise = b);
  }
  function noise(t, dur, type, f, q, gain, pan) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf();
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q || 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(flt); flt.connect(g); out(g, pan, 0.6);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  /* Karplus-Strong plucked string, rendered once per pitch and cached */
  function ks(freq, bright = 0.5, sec = 3, decay = 0.996) {
    const key = freq.toFixed(2) + "|" + bright + "|" + decay;
    if (ksCache.has(key)) return ksCache.get(key);
    const sr = ctx.sampleRate, N = Math.max(2, Math.round(sr / freq)), len = Math.floor(sr * sec);
    const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = bright * r + (1 - bright) * prev; ring[i] = prev; }
    let p = 0;
    for (let i = 0; i < len; i++) {
      const a = ring[p], b = ring[(p + 1) % N];
      d[i] = a; ring[p] = decay * 0.5 * (a + b); p = (p + 1) % N;
    }
    let mx = 0; for (let i = 0; i < Math.min(len, sr * 0.2); i++) mx = Math.max(mx, Math.abs(d[i]));
    if (mx > 0) for (let i = 0; i < len; i++) d[i] /= mx;
    if (ksCache.size > 160) ksCache.delete(ksCache.keys().next().value);
    ksCache.set(key, buf);
    return buf;
  }

  /* ---------- voices ---------- */
  const V = {};
  function osc(type, f, t, dur, o) {
    o = o || {};
    const g = ctx.createGain(), os = ctx.createOscillator();
    if (typeof type === "string") os.type = type; else os.setPeriodicWave(type);
    os.frequency.setValueAtTime(f, t);
    let node = os;
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib[1], t + (o.vibDelay || 0.25));
      l.connect(lg); lg.connect(os.detune); l.start(t); l.stop(t + dur + 1.5);
    }
    if (o.lp) {
      const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = o.q || 0.8;
      if (Array.isArray(o.lp)) { fl.frequency.setValueAtTime(o.lp[0], t); fl.frequency.exponentialRampToValueAtTime(o.lp[1], t + (o.lpT || 0.12)); if (o.lp[2]) fl.frequency.setTargetAtTime(o.lp[2], t + (o.lpT || 0.12), 0.3); }
      else fl.frequency.value = o.lp;
      node.connect(fl); node = fl;
    }
    if (o.bp) { const b = ctx.createBiquadFilter(); b.type = "peaking"; b.frequency.value = o.bp[0]; b.Q.value = o.bp[1]; b.gain.value = o.bp[2]; node.connect(b); node = b; }
    node.connect(g);
    const [a, d, s, r] = o.adsr || [0.01, 0.2, 0.6, 0.3];
    env(g, t, a, o.gain ?? 0.3, d, s, r, dur);
    out(g, o.pan || 0, o.send ?? 1);
    os.start(t); os.stop(t + dur + r * 6 + 0.1);
    return os;
  }
  const bowed = (dark) => (f, t, dur, v, pan) => {
    const w = pw("bow" + dark, (n) => (n % 2 ? 1 : 0.7) / Math.pow(n, dark ? 1.25 : 1.05));
    osc(w, f, t, dur, { vib: [5.6, 14], lp: dark ? 2200 : 4200, adsr: [0.09, 0.3, 0.85, 0.28], gain: 0.2 * v, pan });
    noise(t, 0.12, "bandpass", Math.min(6000, f * 6), 1.2, 0.02 * v, pan);
  };
  V.violin = bowed(false); V.viola = bowed(true);
  V.cello = (f, t, dur, v, pan) => osc(pw("cello", (n) => 1 / Math.pow(n, 1.3)), f, t, dur, { vib: [5, 12], lp: 1600, adsr: [0.11, 0.3, 0.85, 0.35], gain: 0.28 * v, pan });
  V.contrabass = (f, t, dur, v, pan) => osc(pw("cb", (n) => 1 / Math.pow(n, 1.5)), f, t, dur, { lp: 700, adsr: [0.12, 0.3, 0.8, 0.35], gain: 0.42 * v, pan });
  V.flute = (f, t, dur, v, pan) => {
    osc(pw("flute", (n) => (n === 1 ? 1 : n === 2 ? 0.18 : n === 3 ? 0.06 : 0)), f, t, dur, { vib: [5, 9], vibDelay: 0.35, adsr: [0.06, 0.2, 0.8, 0.22], gain: 0.26 * v, pan });
    noise(t, Math.min(dur, 0.5), "bandpass", Math.min(9000, f * 2), 2.5, 0.03 * v, pan);
  };
  V.nay = (f, t, dur, v, pan) => {
    osc(pw("nay", (n) => (n === 1 ? 1 : n === 2 ? 0.08 : 0.02 / n)), f, t, dur, { vib: [4.2, 16], vibDelay: 0.4, adsr: [0.12, 0.25, 0.75, 0.35], gain: 0.25 * v, pan });
    noise(t, dur + 0.2, "bandpass", Math.min(8000, f * 1.5), 1.6, 0.04 * v, pan);
  };
  V.oboe = (f, t, dur, v, pan) => osc(pw("oboe", (n) => [0, 0.55, 1, 0.8, 0.55, 0.4, 0.25, 0.18, 0.1][n] || 0.05 / n), f, t, dur, { vib: [5.2, 8], lp: 5000, bp: [1400, 2, 5], adsr: [0.03, 0.2, 0.8, 0.18], gain: 0.2 * v, pan });
  V.ehorn = (f, t, dur, v, pan) => osc(pw("eh", (n) => [0, 0.8, 1, 0.6, 0.35, 0.2, 0.1][n] || 0.03 / n), f, t, dur, { vib: [4.6, 8], lp: 2600, bp: [900, 2, 6], adsr: [0.05, 0.25, 0.8, 0.25], gain: 0.22 * v, pan });
  V.clarinet = (f, t, dur, v, pan) => osc(pw("cl", (n) => (n % 2 ? 1 / n : 0.02)), f, t, dur, { lp: 3200, adsr: [0.04, 0.2, 0.85, 0.2], gain: 0.24 * v, pan });
  V.bassoon = (f, t, dur, v, pan) => osc(pw("bsn", (n) => 1 / Math.pow(n, 0.9)), f, t, dur, { lp: 1100, bp: [500, 3, 6], adsr: [0.04, 0.2, 0.8, 0.2], gain: 0.28 * v, pan });
  const brass = (dark, g) => (f, t, dur, v, pan) => osc(pw("br" + dark, (n) => 1 / n), f, t, dur, { lp: [f * 1.2, Math.min(9000, f * (dark ? 4 : 8)), f * (dark ? 3 : 5)], lpT: 0.08, q: 1.2, vib: [5, 5], vibDelay: 0.4, adsr: [0.04, 0.3, 0.8, 0.2], gain: g * v, pan });
  V.trumpet = brass(false, 0.2); V.horn = brass(true, 0.26); V.trombone = brass(true, 0.26); V.tuba = brass(true, 0.4);
  V.piano = (f, t, dur, v, pan) => {
    const g = ctx.createGain();
    [1, 2, 3, 4, 5, 6].forEach((h, i) => {
      const o = ctx.createOscillator(); o.frequency.value = f * h * (1 + 0.0004 * h * h);
      const hg = ctx.createGain(); hg.gain.value = 0.5 / Math.pow(h, 1.6);
      o.connect(hg); hg.connect(g); o.start(t); o.stop(t + dur + 2.6);
    });
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.34 * v, t + 0.004);
    g.gain.setTargetAtTime(0.0001, t + 0.004, 0.35 + 180 / f * 0.4);
    g.gain.setTargetAtTime(0.0001, t + dur, 0.12);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(Math.min(12000, f * 9), t); lp.frequency.setTargetAtTime(f * 3, t, 0.4);
    g.connect(lp); out(lp, pan, 0.8);
    noise(t, 0.03, "highpass", 3000, 0.7, 0.03 * v, pan);
  };
  const plucked = (bright, decay, gain, body) => (f, t, dur, v, pan) => {
    const s = ctx.createBufferSource(); s.buffer = ks(f, bright, Math.min(4, Math.max(1.2, dur + 1)), decay);
    const g = ctx.createGain(); g.gain.value = gain * v;
    let n = s;
    if (body) { const b = ctx.createBiquadFilter(); b.type = "peaking"; b.frequency.value = body; b.Q.value = 1.2; b.gain.value = 5; s.connect(b); n = b; }
    n.connect(g); out(g, pan, 0.9); s.start(t);
  };
  V.guitar = plucked(0.5, 0.9978, 0.62, 190);
  V.harp = plucked(0.75, 0.997, 0.5, 0); V.qanun = plucked(0.8, 0.996, 0.45, 1800); V.string = plucked(0.6, 0.9965, 0.5, 0);
  /* Oud — "the pure oud" (chosen by the supervisor's team):
     Karplus–Strong with a fractional delay so every pitch is exact (vital for
     quarter tones), a risha pluck-position comb, two strings per course detuned
     by 1.5 cents, the body's air + wood resonances and a soft plectrum click. */
  const oudCache = new Map();
  function oudString(f, sec) {
    const sr = ctx.sampleRate, len = Math.floor(sr * sec), out = new Float32Array(len);
    const s = 0.32, D = sr / f - s, M = Math.floor(D), fr = D - M, g = Math.pow(10, -3 / (f * 2.2));
    const size = M + 3, buf = new Float32Array(size), P = Math.max(2, Math.round(sr / f)), ex = new Float32Array(P);
    let lp = 0;
    for (let i = 0; i < P; i++) { const r = Math.random() * 2 - 1; lp = 0.55 * r + 0.45 * lp; ex[i] = lp; }
    const pp = Math.max(1, Math.round(P * 0.13));
    let w = 0, prev = 0;
    for (let n = 0; n < len; n++) {
      const e = n < P ? ex[n] - (n >= pp ? ex[n - pp] : 0) * 0.9 : 0;
      const i1 = (w - M + size * 4) % size, i2 = (w - M - 1 + size * 4) % size;
      const dl = buf[i1] * (1 - fr) + buf[i2] * fr, fl = (1 - s) * dl + s * prev; prev = dl;
      const y = e + g * fl; buf[w] = y; out[n] = y; w = (w + 1) % size;
    }
    return out;
  }
  function oudBuffer(f) {
    const key = f.toFixed(3);
    if (oudCache.has(key)) return oudCache.get(key);
    const sr = ctx.sampleRate, A = oudString(f, 3), B = oudString(f * Math.pow(2, 1.5 / 1200), 3);
    const buf = ctx.createBuffer(2, A.length, sr), L = buf.getChannelData(0), R = buf.getChannelData(1);
    let mx = 0;
    for (let i = 0; i < A.length; i++) { L[i] = A[i] * 0.58 + B[i] * 0.42; R[i] = A[i] * 0.42 + B[i] * 0.58; if (i < sr * 0.25) mx = Math.max(mx, Math.abs(L[i]), Math.abs(R[i])); }
    if (mx) for (let i = 0; i < A.length; i++) { L[i] /= mx; R[i] /= mx; }
    if (oudCache.size > 120) oudCache.delete(oudCache.keys().next().value);
    oudCache.set(key, buf); return buf;
  }
  V.oud = (f, t, dur, v, pan) => {
    const src = ctx.createBufferSource(); src.buffer = oudBuffer(f);
    let n = src;
    [["peaking", 110, 1.4, 6], ["peaking", 280, 1.2, 3], ["peaking", 1200, 1, -2.5], ["highshelf", 5200, 0.7, -5]].forEach(([type, fq, q, gn]) => {
      const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = fq; b.Q.value = q; b.gain.value = gn; n.connect(b); n = b;
    });
    const g = ctx.createGain(), hold = Math.max(0.2, dur);
    g.gain.setValueAtTime(0.85 * v, t); g.gain.setTargetAtTime(0.0001, t + hold, 0.3);
    n.connect(g); out(g, pan, 1.1);
    src.start(t); src.stop(t + hold + 1.6);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuf();
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.9;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(0.05 * v, t); ng.gain.setTargetAtTime(0.0001, t, 0.006);
    nz.connect(bp); bp.connect(ng); out(ng, pan, 0.3); nz.start(t); nz.stop(t + 0.05);
  };
  V.xylophone = (f, t, dur, v, pan) => {
    osc("sine", f, t, 0.02, { adsr: [0.002, 0.18, 0.001, 0.2], gain: 0.4 * v, pan, send: 0.7 });
    osc("sine", f * 3.93, t, 0.02, { adsr: [0.002, 0.05, 0.001, 0.05], gain: 0.12 * v, pan, send: 0.5 });
  };
  V.timpani = (f, t, dur, v, pan) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f * 1.05, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.6 * v, t + 0.006); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.55);
    o.connect(g); out(g, pan, 1); o.start(t); o.stop(t + 3);
    noise(t, 0.25, "lowpass", 900, 0.7, 0.25 * v, pan);
  };
  V.bassdrum = (f, t, dur, v, pan) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.9 * v, t + 0.005); g.gain.setTargetAtTime(0.0001, t + 0.02, 0.3);
    o.connect(g); out(g, pan, 0.8); o.start(t); o.stop(t + 2);
  };
  V.snare = (f, t, dur, v, pan) => { noise(t, 0.2, "highpass", 1500, 0.7, 0.35 * v, pan); osc("triangle", 190, t, 0.01, { adsr: [0.001, 0.05, 0.001, 0.05], gain: 0.25 * v, pan }); };
  V.cymbal = (f, t, dur, v, pan) => noise(t, 2.4, "highpass", 5200, 0.6, 0.28 * v, pan);
  V.gong = (f, t, dur, v, pan) => { [72, 108.4, 147.9, 213.5].forEach((h, i) => osc("sine", h, t, 0.01, { adsr: [0.03, 1.2, 0.3, 2.4], gain: (0.3 / (i + 1)) * v, pan })); noise(t, 3, "bandpass", 400, 1, 0.08 * v, pan); };
  V.triangle = (f, t, dur, v, pan) => [4186, 5588, 7200, 9300].forEach((h, i) => osc("sine", h, t, 0.01, { adsr: [0.001, 1.6, 0.001, 1.6], gain: (0.07 / (i + 1)) * v, pan, send: 0.8 }));
  V.dum = (f, t, dur, v, pan) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.85 * v, t + 0.004); g.gain.setTargetAtTime(0.0001, t + 0.01, 0.16);
    o.connect(g); out(g, pan, 0.4); o.start(t); o.stop(t + 1);
  };
  V.tak = (f, t, dur, v, pan) => { noise(t, 0.09, "bandpass", 3200, 1.4, 0.5 * v, pan); osc("sine", 900, t, 0.005, { adsr: [0.001, 0.03, 0.001, 0.03], gain: 0.2 * v, pan, send: 0.3 }); };
  V.click = (f, t, dur, v, pan) => osc("square", f || 1000, t, 0.01, { adsr: [0.001, 0.02, 0.001, 0.02], lp: 4000, gain: 0.18 * v, pan, send: 0 });
  V.pad = (f, t, dur, v, pan) => osc(pw("pad", (n) => 1 / (n * n)), f, t, dur, { vib: [0.3, 6], lp: 1800, adsr: [0.35, 0.5, 0.8, 0.8], gain: 0.12 * v, pan });
  V.sine = (f, t, dur, v, pan) => osc("sine", f, t, dur, { adsr: [0.02, 0.1, 0.9, 0.12], gain: 0.3 * v, pan, send: 0.3 });

  /* Sung solfege: a formant "voice" that sings do/re/mi… on pitch */
  const VOW = { o: [480, 860, 2450], e: [420, 1950, 2600], i: [300, 2250, 3000], a: [760, 1220, 2600] };
  const SYL = { do: ["d", "o"], re: ["r", "e"], mi: ["m", "i"], fa: ["f", "a"], sol: ["s", "o"], la: ["l", "a"], si: ["s", "i"] };
  V.sing = (f, t, dur, v, pan, syl = "la") => {
    const [cons, vow] = SYL[syl] || ["l", "a"];
    const src = ctx.createOscillator(); src.type = "sawtooth"; src.frequency.setValueAtTime(f, t);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(18, t + Math.min(0.35, dur));
    lfo.connect(lg); lg.connect(src.detune);
    const mix = ctx.createGain(); mix.gain.value = 1;
    VOW[vow].forEach((F, k) => { const b = ctx.createBiquadFilter(); b.type = "bandpass"; b.frequency.value = F; b.Q.value = F / (k ? 110 : 70); const g = ctx.createGain(); g.gain.value = [1.4, 0.7, 0.35][k]; src.connect(b); b.connect(g); g.connect(mix); });
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.setValueAtTime(cons === "m" ? 350 : 5200, t); lp.frequency.linearRampToValueAtTime(5200, t + 0.09);
    const g = ctx.createGain(); mix.connect(lp); lp.connect(g);
    const on = cons === "d" ? t + 0.025 : cons === "s" || cons === "f" ? t + 0.06 : t;
    const att = cons === "l" ? 0.07 : 0.03, peak = 0.55 * v;
    g.gain.setValueAtTime(0.0001, t); g.gain.setValueAtTime(0.0001, on); g.gain.linearRampToValueAtTime(peak, on + att);
    if (cons === "r") { for (let k = 0; k < 3; k++) { g.gain.setValueAtTime(peak * 0.35, on + att + k * 0.028); g.gain.setValueAtTime(peak, on + att + k * 0.028 + 0.014); } }
    g.gain.setTargetAtTime(peak * 0.85, on + att, 0.1);
    g.gain.setTargetAtTime(0.0001, t + Math.max(att + 0.05, dur * 0.92), 0.06);
    out(g, pan, 0.7);
    if (cons === "d") noise(t, 0.025, "bandpass", 900, 1.2, 0.25 * v, pan);
    if (cons === "s") noise(t, 0.08, "highpass", 4500, 0.7, 0.16 * v, pan);
    if (cons === "f") noise(t, 0.07, "highpass", 2500, 0.5, 0.12 * v, pan);
    src.start(t); lfo.start(t); src.stop(t + dur + 0.6); lfo.stop(t + dur + 0.6);
  };

  /* =====================================================================
     SOLFEGE SINGER — one continuous (legato) voice that sings
     do · re · mi · fa · sol · la · si on pitch, with real consonants:
     a glottal source → formant filters (vowel), a noise source (s, f, the
     burst of d), and per-syllable envelopes for d, r, m, f, s, l.
     ===================================================================== */
  const FORM = { a: [800, 1250, 2800], e: [480, 2050, 2900], i: [310, 2350, 3100], o: [500, 850, 2800] };
  const SOLF = { do: ["d", "o", ""], re: ["r", "e", ""], mi: ["m", "i", ""], fa: ["f", "a", ""], sol: ["s", "o", "l"], la: ["l", "a", ""], si: ["s", "i", ""] };
  S.singPhrase = function (notes, opts = {}) {
    // notes: [{ at, d, pitch, syl, vel? }]; opts.style: "clear" (teaching: detached, slow, extra-clear
    // consonants) or "pro" (legato, vibrato, phrasing — a trained singer)
    if (!S.init() || !notes.length) return 0;
    const pro = opts.style === "pro", read = !!opts.read, K = pro ? 1 : 1.35; // consonant length factor
    const T = ctx.currentTime + 0.08 + (opts.delay || 0);
    const last = notes[notes.length - 1], END = T + last.at + last.d + 0.4;
    // a smooth, low-buzz source: steep harmonic roll-off, tiny breath
    const glot = ctx.createOscillator();
    glot.setPeriodicWave(pw("glottal2", (n) => 1 / Math.pow(n, 1.75) * (n === 2 ? 1.2 : 1), 40));
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 5.4; lfoG.gain.value = 0; lfo.connect(lfoG); lfoG.connect(glot.detune);
    const nz = ctx.createBufferSource(); nz.buffer = noiseBuf(); nz.loop = true;
    const voiceIn = ctx.createGain(); voiceIn.gain.value = 0; glot.connect(voiceIn);
    const breath = ctx.createGain(); breath.gain.value = 0.004; nz.connect(breath); breath.connect(voiceIn);
    const tilt = ctx.createBiquadFilter(); tilt.type = "lowpass"; tilt.frequency.value = 4200; tilt.Q.value = 0.4;
    const mix = ctx.createGain();
    const FG = [];
    const F = [0, 1, 2].map((k) => { const bq = ctx.createBiquadFilter(); bq.type = "bandpass"; bq.Q.value = [4.5, 7, 9][k]; const g = ctx.createGain(); g.gain.value = [1.2, 1, 0.3][k]; voiceIn.connect(bq); bq.connect(g); g.connect(mix); FG.push(g); return bq; });
    const LEV = { a: [1.1, 1.3, 0.28], o: [1.25, 1.35, 0.16], e: [1.0, 1.0, 0.42], i: [0.9, 1.05, 0.5] };
    const body = ctx.createBiquadFilter(); body.type = "lowpass"; body.frequency.value = 650; const bodyG = ctx.createGain(); bodyG.gain.value = read ? 0 : 0.06; voiceIn.connect(body); body.connect(bodyG); bodyG.connect(mix);
    mix.connect(tilt);
    const fric = ctx.createBiquadFilter(); fric.type = "bandpass"; fric.Q.value = 0.9; const fricG = ctx.createGain(); fricG.gain.value = 0;
    nz.connect(fric); fric.connect(fricG);
    const outG = ctx.createGain(); outG.gain.value = (opts.vel || 0.95);
    tilt.connect(outG); fricG.connect(outG); out(outG, 0, read ? 0.05 : pro ? 0.16 : 0.1);
    const setF = (t, [f1, f2, f3], glide = 0) => [f1, f2, f3].forEach((v, k) => { const p = F[k].frequency; if (glide > 0) p.setTargetAtTime(v, t, glide / 3); else p.setValueAtTime(v, t); });
    const A = voiceIn.gain, Fg = fricG.gain, TL = tilt.frequency;
    A.setValueAtTime(0, T - 0.05);
    let prevEnd = -1, prevHz = null;
    notes.forEach((n, i) => {
      // "read" = names spoken rhythmically on pitch: short syllables, no held hum between them
      const t0 = T + n.at, d = read ? Math.min(Math.max(0.14, n.d), 0.36) : Math.max(0.14, n.d), t1 = t0 + d, hz = S.toHz(n.pitch);
      const [c, v, coda] = SOLF[n.syl] || ["l", "a", ""];
      const V0 = FORM[v], legato = pro && !read && prevEnd >= 0 && t0 - prevEnd < 0.03;
      const peak = 0.9 * (n.vel || 1);
      LEV[v].forEach((g, k) => FG[k].gain.setTargetAtTime(g, t0 + 0.02, 0.03));
      if (legato && prevHz) { glot.frequency.setValueAtTime(prevHz, t0 - 0.03); glot.frequency.exponentialRampToValueAtTime(hz, t0 + 0.035); }
      else glot.frequency.setValueAtTime(hz, t0);
      lfoG.gain.setValueAtTime(0, t0);
      if (pro && !read && d > 0.35) { lfoG.gain.linearRampToValueAtTime(0, t0 + 0.18); lfoG.gain.linearRampToValueAtTime(24, t0 + Math.min(d, 0.6)); lfoG.gain.linearRampToValueAtTime(0, t1); }
      const rise = 0.03;
      TL.setValueAtTime(4200, t0);
      if (c === "d") {
        const cl = 0.04 * K;
        A.setValueAtTime(legato ? 0.08 : 0, t0); A.setValueAtTime(0.05, t0 + cl);
        Fg.setValueAtTime(0, t0 + cl - 0.002); Fg.linearRampToValueAtTime(0.42, t0 + cl + 0.004); Fg.linearRampToValueAtTime(0, t0 + cl + 0.028);
        fric.frequency.setValueAtTime(2600, t0); fric.Q.setValueAtTime(1.2, t0);
        setF(t0, [250, 1650, 2700]); setF(t0 + cl + 0.01, V0, 0.07);
        A.linearRampToValueAtTime(peak, t0 + cl + 0.01 + rise);
      } else if (c === "r") {
        const tp = 0.03 * K;
        setF(t0, [420, 1500, 2500]); setF(t0 + tp, V0, 0.05);
        A.setValueAtTime(legato ? peak * 0.7 : 0, t0); A.linearRampToValueAtTime(peak * 0.55, t0 + 0.02);
        A.linearRampToValueAtTime(0.06, t0 + 0.02 + tp * 0.6); A.linearRampToValueAtTime(peak, t0 + 0.02 + tp + 0.03);
      } else if (c === "m") {
        const ml = 0.085 * K;
        setF(t0, [250, 1100, 2300]); TL.setValueAtTime(600, t0); TL.setTargetAtTime(4200, t0 + ml, 0.02);
        A.setValueAtTime(legato ? 0.45 : 0, t0); A.linearRampToValueAtTime(0.5, t0 + 0.02); A.setValueAtTime(0.5, t0 + ml - 0.005);
        setF(t0 + ml, V0, 0.05); A.linearRampToValueAtTime(peak, t0 + ml + rise);
      } else if (c === "f" || c === "s") {
        const len = (c === "s" ? 0.1 : 0.085) * K;
        A.setValueAtTime(legato ? 0.1 : 0, t0); A.linearRampToValueAtTime(0, t0 + 0.02);
        fric.frequency.setValueAtTime(c === "s" ? 6200 : 3000, t0); fric.Q.setValueAtTime(c === "s" ? 1.5 : 0.55, t0);
        const fl = c === "s" ? 0.34 : 0.26;
        Fg.setValueAtTime(0, t0); Fg.linearRampToValueAtTime(fl, t0 + 0.02); Fg.setValueAtTime(fl, t0 + len - 0.02); Fg.linearRampToValueAtTime(0, t0 + len);
        setF(t0 + len - 0.01, V0); A.setValueAtTime(0, t0 + len - 0.01); A.linearRampToValueAtTime(peak, t0 + len + rise);
      } else {
        const ll = 0.06 * K;
        setF(t0, [360, 1150, 2600]); setF(t0 + ll, V0, 0.06);
        A.setValueAtTime(legato ? peak * 0.8 : 0, t0); A.linearRampToValueAtTime(peak * 0.7, t0 + 0.02); A.linearRampToValueAtTime(peak, t0 + ll + 0.02);
      }
      if (coda === "l") setF(Math.max(t0 + 0.14, t1 - 0.08), [360, 1150, 2600], 0.04);
      const next = notes[i + 1], gapNext = next ? T + next.at - t1 : 1;
      // teaching style: every syllable stands on its own (short release gap)
      const detach = read ? 0.09 : !pro ? 0.07 : gapNext > 0.03 ? 0.04 : 0;
      if (detach) { A.setValueAtTime(peak, Math.max(t0 + 0.1, t1 - detach - 0.03)); A.linearRampToValueAtTime(0, t1 - (pro ? 0 : 0.01)); }
      prevEnd = t1; prevHz = hz;
    });
    [glot, lfo, nz].forEach((x) => { x.start(T - 0.06); x.stop(END); });
    S.activeUntil = Math.max(S.activeUntil || 0, END);
    return T;
  };
  /* ---------- human solfege voice (recorded samples in shared/voice.js) ---------- */
  const VB = new Map(); let vLoad = null;
  S.voiceReady = () => VB.size > 0;
  S.loadVoice = function () {
    if (vLoad) return vLoad;
    if (!window.MQ_VOICE || !S.init()) return Promise.resolve(false);
    vLoad = Promise.all(Object.entries(window.MQ_VOICE.mp3).map(([k, b64]) => new Promise((res) => {
      try {
        const bin = atob(b64), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        ctx.decodeAudioData(u.buffer, (buf) => { VB.set(+k, buf); res(); }, () => res());
      } catch (_) { res(); }
    }))).then(() => VB.size > 0);
    return vLoad;
  };
  /* notes: [{ at, d, midi, nat, vel }] — nat = the natural note whose syllable is sung (F♯ is sung "fa", raised) */
  S.singHuman = function (notes, opts = {}) {
    if (!S.init() || !VB.size) return 0;
    const pro = opts.style === "pro", T = ctx.currentTime + 0.1 + (opts.delay || 0);
    let end = T;
    notes.forEach((n, i) => {
      let nat = n.nat, shift = n.midi - n.nat;
      while (nat > 83) nat -= 12; while (nat < 48) nat += 12;
      const buf = VB.get(nat) || VB.get([...VB.keys()].reduce((a, b) => (Math.abs(b - nat) < Math.abs(a - nat) ? b : a)));
      if (!buf) return;
      const t0 = T + n.at, next = notes[i + 1];
      const legato = pro && next && Math.abs(T + next.at - (t0 + n.d)) < 0.03;
      const d = Math.min(buf.duration - 0.05, n.d + (legato ? 0.05 : 0));
      const src = ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = Math.pow(2, shift / 12); // ±1 semitone for ♯/♭
      const g = ctx.createGain(), v = (opts.vel || 1) * (n.vel || 1);
      const rel = pro ? 0.07 : 0.05;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + 0.012);
      g.gain.setValueAtTime(v, Math.max(t0 + 0.02, t0 + d - rel)); g.gain.linearRampToValueAtTime(0, t0 + d);
      src.connect(g); out(g, 0, pro ? 0.1 : 0.04);
      src.start(t0); src.stop(t0 + d + 0.05);
      end = Math.max(end, t0 + d);
    });
    S.activeUntil = Math.max(S.activeUntil || 0, end + 0.2);
    return T;
  };
  S.sing = function (syl, pitch, when = 0, dur = 0.5, vel = 0.9) {
    return S.singPhrase([{ at: when, d: dur, pitch, syl }], { vel });
  };
  S.voices = Object.keys(V);

  /* ---------- public API ---------- */
  S.play = function (voice, pitch, when = 0, dur = 0.6, vel = 0.9, pan = 0) {
    if (!S.init()) return 0;
    const f = S.toHz(pitch);
    const t = Math.max(ctx.currentTime + 0.005, ctx.currentTime + when);
    (V[voice] || V.piano)(f, t, dur, vel, pan);
    S.activeUntil = Math.max(S.activeUntil || 0, t + dur + 1.2);
    const delay = Math.max(0, (t - ctx.currentTime) * 1000);
    setTimeout(() => emit({ voice, pitch, f, dur }), delay);
    return t;
  };
  S.chord = (voice, pitches, when = 0, dur = 1.2, vel = 0.7) => pitches.forEach((p, i) => S.play(voice, p, when, dur, vel / Math.sqrt(pitches.length) * 1.3, (i - (pitches.length - 1) / 2) * 0.15));

  /* Lightweight sequencer: returns a stop() handle */
  S.loop = function (stepSec, steps, cb) {
    if (!S.init()) return { stop() {} };
    let i = 0, next = ctx.currentTime + 0.08, alive = true, timer;
    const tick = () => {
      if (!alive) return;
      while (next < ctx.currentTime + 0.14) { cb(i, next - ctx.currentTime, next); i = (i + 1) % steps; next += typeof stepSec === "function" ? stepSec(i) : stepSec; }
      timer = setTimeout(tick, 25);
    };
    tick();
    const h = { stop() { alive = false; clearTimeout(timer); S.jobs.delete(h); }, set step(v) { stepSec = v; } };
    S.jobs.add(h);
    return h;
  };

  /* ---------- one switch to silence everything ---------- */
  S.jobs = new Set();
  S.busy = () => S.jobs.size > 0 || (!!ctx && ctx.currentTime < (S.activeUntil || 0));
  S.stopAll = function () {
    [...S.jobs].forEach((j) => { try { j.stop(); } catch (_) {} });
    S.jobs.clear();
    if (!ctx) return;
    const now = ctx.currentTime;
    // fade out, then cut every voice off the bus and build a fresh bus
    const oldDry = dry, oldWet = wet;
    master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(0, now + 0.04);
    setTimeout(() => {
      try { oldDry.disconnect(); oldWet.disconnect(); } catch (_) {}
      dry = ctx.createGain(); dry.gain.value = 0.86; wet = ctx.createGain(); wet.gain.value = 0.16;
      verb = ctx.createConvolver(); verb.buffer = impulse(ctx);
      dry.connect(comp); wet.connect(verb); verb.connect(comp);
      master.gain.setValueAtTime(S.enabled ? S.volume : 0, ctx.currentTime + 0.01);
    }, 60);
    S.activeUntil = 0;
    document.dispatchEvent(new Event("mq:stopall"));
  };
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.busy()) S.stopAll(); });

  /* Unlock on first gesture (mobile browsers & Android WebView) */
  /* iPhone/iPad: Web Audio is muted by the ring/silent switch unless the page's
     audio session is "playback". Safari 17+ exposes navigator.audioSession; older
     iOS switches to playback once an <audio> element plays, so play a tiny silent clip. */
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let iosArmed = false;
  function iosPlayback() {
    try { if (navigator.audioSession && navigator.audioSession.type !== "playback") navigator.audioSession.type = "playback"; } catch (e) { /* not supported */ }
    if (!IOS || iosArmed) return;
    iosArmed = true;
    const n = 2205, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 88200, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
    a.setAttribute("playsinline", ""); a.setAttribute("x-webkit-airplay", "deny"); a.preload = "auto";
    const p = a.play(); if (p && p.catch) p.catch(() => { iosArmed = false; });
  }
  const unlock = () => { iosPlayback(); S.init(); };
  ["pointerdown", "keydown", "touchstart"].forEach((e) => window.addEventListener(e, unlock, { once: false, passive: true }));
  document.addEventListener("visibilitychange", () => { if (ctx && document.hidden) { ctx.suspend(); iosArmed = false; } else if (ctx) ctx.resume(); });

  window.Sound = S;
})();
