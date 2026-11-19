/* =========================================================
   Shubh Vivah — interactions
   Edit CONFIG to personalise.
   ========================================================= */
const CONFIG = {
  weddingDate: "2027-02-12T10:30:00+05:30",   // Muhurtham (IST)
  eventEnd:    "2027-02-12T14:00:00+05:30",
  title: "Wedding of Arjun & Meera",
  location: "Guruvayur Sree Krishna Temple, Guruvayur, Thrissur, Kerala",
  whatsapp: "919999999999"                     // RSVP number with country code, no +
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

/* ---------------- Background music ----------------
   - starts (fading in) when the guest taps "Open Invitation"
   - pauses whenever the guest leaves the site (tab switch, app switch, screen lock, close)
   - resumes on return, unless the guest muted it with the music button */
const music = (() => {
  const audio = document.getElementById("bgMusic");
  const btn = document.getElementById("musicBtn");
  const TARGET_VOL = 0.7;
  let wanted = false;      // guest wants music on
  let fadeTimer;

  function setUI(playing) {
    if (!btn) return;
    btn.classList.toggle("playing", playing);
    btn.classList.toggle("off", !wanted);
    btn.setAttribute("aria-pressed", String(wanted));
    btn.setAttribute("aria-label", wanted ? "Pause music" : "Play music");
  }
  function fadeTo(vol, ms, done) {
    clearInterval(fadeTimer);
    const steps = 20, start = audio.volume, delta = (vol - start) / steps;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      audio.volume = Math.max(0, Math.min(1, start + delta * i));
      if (i >= steps) { clearInterval(fadeTimer); done && done(); }
    }, ms / steps);
  }
  function play() {
    if (!audio || !wanted) return;
    audio.volume = 0;
    const p = audio.play();
    if (p && p.then) p.then(() => { fadeTo(TARGET_VOL, 1500); setUI(true); }).catch(() => setUI(false));
    else { fadeTo(TARGET_VOL, 1500); setUI(true); }
  }
  function pause(immediate) {
    if (!audio) return;
    clearInterval(fadeTimer);
    if (immediate) { audio.pause(); setUI(false); return; }
    fadeTo(0, 400, () => { audio.pause(); setUI(false); });
  }

  if (audio) {
    audio.addEventListener("pause", () => setUI(false));
    audio.addEventListener("playing", () => setUI(true));

    // Leaving the site → music off. Coming back → music on again (if not muted).
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) pause(true); else play();
    });
    window.addEventListener("pagehide", () => pause(true));
    window.addEventListener("pageshow", e => { if (e.persisted) play(); });
  }
  btn?.addEventListener("click", () => {
    wanted = !wanted;
    wanted ? play() : pause(false);
    setUI(!audio.paused && wanted);
  });

  return { start() { wanted = true; play(); } };
})();

/* ---------------- Gate opening ---------------- */
(function gate() {
  const gateEl = document.getElementById("gate");
  const btn = document.getElementById("openGate");
  if (!gateEl || !btn) return;

  btn.addEventListener("click", () => {
    music.start();
    gateEl.classList.add("open");
    document.body.classList.add("opened");
    document.body.classList.remove("locked");
    window.scrollTo(0, 0);
    startPetals();
    setTimeout(() => gateEl.remove(), 2800);
  }, { once: true });
})();

/* ---------------- Falling petals (canvas) ---------------- */
let petalsStarted = false;
function startPetals() {
  if (petalsStarted || reduceMotion) return;
  petalsStarted = true;
  const canvas = document.getElementById("petals");
  const ctx = canvas.getContext("2d");
  const colors = ["#f29a1d", "#f7b733", "#e8475a", "#c2183a", "#ffd27a", "#ff8fa3"];
  let W, H, petals = [], running = true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = canvas.clientWidth || window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = 18;
    while (petals.length < target) petals.push(makePetal(true));
    petals.length = target;
  }
  function makePetal(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H - H : -20,
      r: 5 + Math.random() * 7,
      vy: .5 + Math.random() * 1.1,
      vx: -.3 + Math.random() * .6,
      rot: Math.random() * Math.PI * 2,
      vr: -.03 + Math.random() * .06,
      sway: Math.random() * Math.PI * 2,
      flip: Math.random() * Math.PI * 2,
      color: colors[(Math.random() * colors.length) | 0],
      alpha: .55 + Math.random() * .4
    };
  }
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) {
      p.sway += .02; p.flip += .04;
      p.x += p.vx + Math.sin(p.sway) * .6;
      p.y += p.vy; p.rot += p.vr;
      if (p.y > H + 20 || p.x < -30 || p.x > W + 30) Object.assign(p, makePetal(false));
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * .7 + .3); // 3D flutter
      ctx.globalAlpha = p.alpha;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
      g.addColorStop(0, "#fff3d6"); g.addColorStop(.35, p.color); g.addColorStop(1, p.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r, -p.r * .6, p.r * .8, p.r * .7, 0, p.r);
      ctx.bezierCurveTo(-p.r * .8, p.r * .7, -p.r, -p.r * .6, 0, -p.r);
      ctx.fill();
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(draw);
  });
  requestAnimationFrame(draw);
}

/* ---------------- Countdown ---------------- */
(function countdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const els = {};
  document.querySelectorAll("[data-cd]").forEach(el => (els[el.dataset.cd] = el));
  const pad = n => String(n).padStart(2, "0");
  function set(key, val) {
    const el = els[key];
    if (!el || el.textContent === val) return;
    el.textContent = val;
    el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
  }
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5);  diff -= h * 36e5;
    const m = Math.floor(diff / 6e4);   diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    set("days", pad(d)); set("hours", pad(h)); set("mins", pad(m)); set("secs", pad(s));
  }
  tick(); setInterval(tick, 1000);
})();

/* ---------------- Scroll reveal ---------------- */
(function reveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach(el => el.classList.add("in")); return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  // Rose ornaments sit on edges (often half off-frame) — reveal as soon as any part shows
  const ioRose = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); ioRose.unobserve(e.target); }
    });
  }, { threshold: 0 });
  items.forEach(el => (el.dataset.reveal === "bloom" ? ioRose : io).observe(el));
})();

/* ---------------- Parallax + progress + dock (one rAF loop) ---------------- */
(function scrollFx() {
  const layers = [...document.querySelectorAll("[data-parallax]")];
  const bar = document.querySelector(".scroll-progress span");
  const toTop = document.getElementById("toTop");
  const progressEls = [...document.querySelectorAll("[data-progress]")];
  const clamp01 = v => Math.max(0, Math.min(1, v));
  let ticking = false;

  function update() {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";

    if (!reduceMotion) {
      for (const el of layers) {
        const parent = el.parentElement.getBoundingClientRect();
        if (parent.bottom < 0 || parent.top > vh) continue;
        const offset = (parent.top + parent.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
      }
    }

    // Scroll-linked 3D: --p goes 0 → 1 as an element scrolls into place
    for (const el of progressEls) {
      const r = el.getBoundingClientRect();
      let p = 1;
      if (!reduceMotion) {
        p = el.dataset.progress === "fill"
          ? clamp01((vh * 0.7 - r.top) / r.height)               // fills while reading
          : clamp01((vh - r.top) / (vh * 0.5 + r.height * 0.5));   // settles when centred
      }
      el.style.setProperty("--p", p.toFixed(3));
    }

    if (toTop) toTop.classList.toggle("show", window.scrollY > vh * 0.8);
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

/* ---------------- Add to calendar (.ics) ---------------- */
document.getElementById("addCal")?.addEventListener("click", () => {
  const fmt = d => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ShubhVivah//EN", "BEGIN:VEVENT",
    `UID:${Date.now()}@shubhvivah`, `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(CONFIG.weddingDate)}`, `DTEND:${fmt(CONFIG.eventEnd)}`,
    `SUMMARY:${CONFIG.title}`, `LOCATION:${CONFIG.location}`,
    "DESCRIPTION:We look forward to celebrating with you!", "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "wedding.ics" });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ---------------- RSVP ---------------- */
document.getElementById("rsvpForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector("#rName");
  if (!name.value.trim()) { form.classList.add("was-validated"); name.focus(); return; }

  const attend = form.querySelector("input[name=attend]:checked").value;
  const guests = form.querySelector("#rGuests").value;
  const phone = form.querySelector("#rPhone").value.trim();
  const msg = form.querySelector("#rMsg").value.trim();
  const text =
    `🙏 RSVP — ${CONFIG.title}\n` +
    `Name: ${name.value.trim()}\n` +
    (phone ? `Phone: ${phone}\n` : "") +
    `Response: ${attend}\nGuests: ${guests}` +
    (msg ? `\nBlessings: ${msg}` : "");

  document.getElementById("toastMsg").textContent =
    attend.startsWith("Joy") ? "Thank you! We can't wait to celebrate with you." : "Thank you for your blessings!";
  bootstrap.Toast.getOrCreateInstance(document.getElementById("thanksToast")).show();

  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  form.reset(); form.classList.remove("was-validated");
});
