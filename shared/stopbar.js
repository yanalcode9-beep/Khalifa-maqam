/* Floating "stop sound" pill — shows whenever anything is sounding */
(function () {
  const S = window.Sound, MQ = window.MQ;
  const b = document.createElement("button");
  b.type = "button"; b.className = "mq-stop"; b.setAttribute("aria-live", "polite");
  let painted = "";
  const paint = () => { if (painted === MQ.lang) return; painted = MQ.lang; b.innerHTML = '<span class="eq" aria-hidden="true"><b></b><b></b><b></b></span><span>' + (MQ.lang === "ar" ? "إيقاف الصوت" : "Stop sound") + '</span><i aria-hidden="true"></i>'; };
  paint(); document.addEventListener("mq:lang", paint);
  b.addEventListener("click", () => S.stopAll());
  document.body.appendChild(b);
  setInterval(() => { const on = S.busy(); if (on) paint(); b.classList.toggle("is-on", on); b.tabIndex = on ? 0 : -1; }, 200);
})();
