/* Musical cursor — ONE element that follows the pointer exactly (no lag),
   and morphs over interactive things. Desktop / fine pointers only. */
(function () {
  if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement;
  const cur = document.createElement("div");
  cur.className = "cur"; cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<span class="cur__note">\u{1D160}</span>';
  document.body.append(cur);
  root.classList.add("has-cursor");
  const HOT = ".maestro__stage.near-oud,a,button,[role=button],label,summary,select,.mq-key,.mq-staff__hit,.mq-orch__seat,.mq-wheel__deg,.mq-qt2__stop,.mq-timeline__era";
  let lastTrail = 0, lx = 0, ly = 0, state = "";
  const glyphs = ["\u{1D15F}", "\u{1D160}", "\u{1D161}", "\u266A"];
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const x = e.clientX, y = e.clientY;
    cur.style.transform = `translate3d(${x}px,${y}px,0)`;
    root.classList.add("cur-on");
    const t = e.target.closest ? e.target : document.body;
    const next = t.closest("input[type=range],input[type=text],textarea") ? "text" : t.closest(".hero__strings") ? "strings" : t.closest(HOT) ? "hot" : "";
    if (next !== state) { cur.dataset.state = state = next; }
    const now = performance.now();
    if (Math.hypot(x - lx, y - ly) > 34 && now - lastTrail > 90 && next !== "text") {
      lastTrail = now;
      const n = document.createElement("span"); n.className = "cur-trail";
      n.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      n.style.left = x + "px"; n.style.top = y + "px"; n.style.setProperty("--dx", (Math.random() * 28 - 14).toFixed(0) + "px");
      document.body.append(n); setTimeout(() => n.remove(), 800);
    }
    lx = x; ly = y;
  }, { passive: true });
  document.addEventListener("mouseleave", () => root.classList.remove("cur-on"));
  addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    cur.classList.add("is-down");
    const r = document.createElement("span"); r.className = "cur-ripple"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    document.body.append(r); setTimeout(() => r.remove(), 600);
  });
  addEventListener("pointerup", () => cur.classList.remove("is-down"));
})();
