/* =============================================
   SWEEP — app.js
   Three phases:
     1. Curtain canvas (spam terms, sweep to reveal)
     2. Main page (form)
     3. Thank you page
============================================= */
"use strict";

/* =============================================
   TERMS LIST
============================================= */
const TERMS = [
  "BGSU", "Northwestern", "UChicago", "Dartmouth", "Penn State",
  "USC", "Emory", "Carleton", "Stony Brook", "Vanderbilt",
  "MIT", "Columbia", "Davidson", "Bucknell", "Waynesburg",
  "Florida Int'l", "Earlham", "Rose-Hulman", "SMU", "UNH",
  "Sacred Heart", "Harrisburg U", "Santa Clara", "Tufts", "Bowdoin",
  "Visit Our Campus", "Students Like You", "Start Your Application",
  "Discover Your Potential", "Be Transformed", "Find Your Fit",
  "Open House", "Explore Your Future", "You're Invited!",
  "Apply Now!", "Your Path Starts Here", "Campus Tour",
  "Virtual Visit", "Schedule a Tour", "Make Your Move",
  "Preview Day", "Join Us!", "Information Session",
  "Don't Miss Out", "Igniting Innovation", "Be Curious",
  "Have Hope", "Your Future Awaits", "We Want You",
  "Come See Us", "Learn More Today"
];

function randBetween(a, b) {
  return a + Math.random() * (b - a);
}
function randInt(a, b) {
  return Math.floor(randBetween(a, b + 1));
}
function randFrom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

/* =============================================
   CURTAIN CANVAS SETUP
============================================= */
const curtainEl  = document.getElementById("curtain");
const curtainCtx = curtainEl.getContext("2d");
let logW = 0, logH = 0; // logical CSS pixel dims

function resizeCurtain() {
  const dpr = window.devicePixelRatio || 1;
  logW = Math.round(window.innerWidth);
  logH = Math.round(window.innerHeight);
  curtainEl.width  = logW * dpr;
  curtainEl.height = logH * dpr;
  curtainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* =============================================
   TERM OBJECTS
============================================= */
let terms = [];
let sweptCount = 0;
let revealTriggered = false;

function buildTerms() {
  terms = [];
  sweptCount = 0;
  revealTriggered = false;

  const count = 50;
  for (let i = 0; i < count; i++) {
    terms.push({
      text:      TERMS[i % TERMS.length],
      x:         randBetween(40, logW - 40),
      y:         randBetween(50, logH - 50),
      rotation:  randBetween(-40, 40) * (Math.PI / 180),
      fontSize:  randBetween(11, 22),
      opacity:   randBetween(0.25, 0.65),
      baseOpacity: 0, // set after
      state:     "still", // still | flying | faded
      vx: 0, vy: 0,
      flyStart: 0,
    });
    terms[i].baseOpacity = terms[i].opacity;
    // slow outward drift from canvas center
    const dx = terms[i].x - logW / 2;
    const dy = terms[i].y - logH / 2;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = randBetween(0.06, 0.16);
    terms[i].driftVx = (dx / dist) * speed;
    terms[i].driftVy = (dy / dist) * speed;
  }
}

/* =============================================
   MOUSE / TOUCH STATE
============================================= */
const mouse = { x: -999, y: -999, down: false, prevX: -999, prevY: -999, dx: 0, dy: 0, onCanvas: false };

curtainEl.addEventListener("mouseenter", () => { mouse.onCanvas = true;  curtainEl.style.cursor = "none"; });
curtainEl.addEventListener("mouseleave", () => { mouse.onCanvas = false; mouse.down = false; curtainEl.style.cursor = "default"; mouse.dx = 0; mouse.dy = 0; });
curtainEl.addEventListener("mousedown",  (e) => {
  mouse.down = true;
  const r = curtainEl.getBoundingClientRect();
  mouse.prevX = e.clientX - r.left;
  mouse.prevY = e.clientY - r.top;
  mouse.dx = 0; mouse.dy = 0;
});
curtainEl.addEventListener("mouseup",    () => { mouse.down = false; mouse.dx = 0; mouse.dy = 0; });
curtainEl.addEventListener("mousemove",  (e) => {
  const r  = curtainEl.getBoundingClientRect();
  const cx = e.clientX - r.left;
  const cy = e.clientY - r.top;
  if (mouse.prevX === -999) { mouse.prevX = cx; mouse.prevY = cy; }
  mouse.dx = cx - mouse.prevX;
  mouse.dy = cy - mouse.prevY;
  mouse.x = cx; mouse.y = cy;
  mouse.prevX = cx; mouse.prevY = cy;
});
curtainEl.addEventListener("contextmenu", (e) => e.preventDefault());

/* =============================================
   MOBILE: TAP BUTTON
============================================= */
const isMobile = window.matchMedia("(max-width: 768px)").matches;
const tapBtn   = document.getElementById("tapReveal");

if (isMobile) {
  tapBtn.style.display = "block";
  curtainEl.style.cursor = "default";
  tapBtn.addEventListener("click", () => {
    tapBtn.style.display = "none";
    triggerAutoSweep();
  });
}

/* =============================================
   SWEEP LOGIC
============================================= */
const SWEEP_RADIUS   = 65;
const FADE_DURATION  = 350; // ms

function trySweeep(now) {
  if (!mouse.onCanvas) return; // no click required — hover sweeps
  terms.forEach(t => {
    if (t.state !== "still") return;
    const dist = Math.hypot(mouse.x - t.x, mouse.y - t.y);
    if (dist < SWEEP_RADIUS) {
      startFlying(t, mouse.dx, mouse.dy, now);
    }
  });
}

function startFlying(t, dx, dy, now) {
  t.state    = "flying";
  t.flyStart = now;
  t.vx = dx * 1.2 + randBetween(-2, 2);
  t.vy = dy * 1.2 + randBetween(-2, 2);
  const spd  = Math.hypot(t.vx, t.vy);
  if (spd < 2.5) {
    const angle = Math.random() * Math.PI * 2;
    t.vx += Math.cos(angle) * (2.5 - spd + 0.5);
    t.vy += Math.sin(angle) * (2.5 - spd + 0.5);
  }
}

function markSwept(t) {
  t.state = "faded"; t.opacity = 0; sweptCount++;
  if (sweptCount >= 35 && !revealTriggered) {
    revealTriggered = true;
    triggerAutoSweep();
  }
}

function updateTerms(now) {
  terms.forEach(t => {
    if (t.state === "flying") {
      t.x += t.vx;
      t.y += t.vy;
      const elapsed = now - t.flyStart;
      const prog    = Math.min(elapsed / FADE_DURATION, 1);
      t.opacity = t.baseOpacity * (1 - prog);
      if (prog >= 1) markSwept(t);
    } else if (t.state === "still") {
      t.x += t.driftVx;
      t.y += t.driftVy;
      if (t.x < -80 || t.x > logW + 80 || t.y < -80 || t.y > logH + 80) {
        markSwept(t);
      }
    }
  });
}

function triggerAutoSweep() {
  const cx = logW / 2;
  const cy = logH / 2;
  const now = performance.now();
  terms.forEach(t => {
    if (t.state !== "still") return;
    const angle = Math.atan2(t.y - cy, t.x - cx);
    const spd   = randBetween(6, 10);
    startFlying(t, Math.cos(angle) * spd / 1.2, Math.sin(angle) * spd / 1.2, now);
    // override to guaranteed outward speed
    t.vx = Math.cos(angle) * spd;
    t.vy = Math.sin(angle) * spd;
  });
  setTimeout(revealMainPage, 500);
}

function revealMainPage() {
  curtainActive = false;
  curtainEl.style.transition = "opacity 0.6s ease";
  curtainEl.style.opacity    = "0";
  curtainEl.style.pointerEvents = "none";
  const mp = document.getElementById("main-page");
  mp.style.pointerEvents = "auto";
  document.body.style.overflow = "auto";
  setTimeout(() => { curtainEl.style.display = "none"; }, 700);
  initTypewriters();
}

/* =============================================
   HINT PULSE
============================================= */
let hintOpacity = 0.55;

function drawHint(now) {
  const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin((now / 1800) * Math.PI * 2));
  curtainCtx.save();
  curtainCtx.font         = "13px Inter, sans-serif";
  curtainCtx.fillStyle    = `rgba(107, 140, 126, ${pulse.toFixed(3)})`;
  curtainCtx.textAlign    = "center";
  curtainCtx.textBaseline = "top";
  curtainCtx.fillText("← drag to sweep away the spam →", logW / 2, 20);
  curtainCtx.restore();
}

/* =============================================
   BROOM CURSOR
============================================= */
function drawBroom(x, y) {
  curtainCtx.save();
  // Handle
  curtainCtx.fillStyle = "#1C1917";
  curtainCtx.fillRect(x - 1, y - 22, 2, 22);
  // Bristles trapezoid
  curtainCtx.beginPath();
  curtainCtx.moveTo(x - 2.5, y);
  curtainCtx.lineTo(x + 2.5, y);
  curtainCtx.lineTo(x + 7,   y + 7);
  curtainCtx.lineTo(x - 7,   y + 7);
  curtainCtx.closePath();
  curtainCtx.fillStyle = "#6B8C7E";
  curtainCtx.fill();
  curtainCtx.restore();
}

/* =============================================
   PROGRESS BAR
============================================= */
function drawProgress() {
  const total  = 50;
  const filled = Math.min(sweptCount / total, 1) * 120;
  const bx     = logW / 2 - 60;
  const by     = logH - 24;

  curtainCtx.save();
  curtainCtx.fillStyle = "rgba(212, 206, 190, 0.6)"; // track
  curtainCtx.fillRect(bx, by, 120, 2);
  curtainCtx.fillStyle = "#6B8C7E";
  curtainCtx.fillRect(bx, by, filled, 2);
  curtainCtx.restore();
}

/* =============================================
   CURTAIN DRAW LOOP
============================================= */
function drawCurtain(now) {
  curtainCtx.clearRect(0, 0, logW, logH);

  // Linen background
  curtainCtx.fillStyle = "rgba(242, 237, 227, 0.78)";
  curtainCtx.fillRect(0, 0, logW, logH);

  // Draw all terms
  terms.forEach(t => {
    if (t.state === "faded" || t.opacity <= 0.005) return;
    curtainCtx.save();
    curtainCtx.translate(t.x, t.y);
    curtainCtx.rotate(t.rotation);
    curtainCtx.font         = `${t.fontSize.toFixed(1)}px Inter, sans-serif`;
    curtainCtx.fillStyle    = `rgba(28, 25, 23, ${t.opacity.toFixed(3)})`;
    curtainCtx.textAlign    = "center";
    curtainCtx.textBaseline = "middle";
    curtainCtx.fillText(t.text, 0, 0);
    curtainCtx.restore();
  });

  drawHint(now);
  drawProgress();

  if (mouse.onCanvas) {
    drawBroom(mouse.x, mouse.y);
  }
}

/* =============================================
   MAIN ANIMATION LOOP
============================================= */
let curtainActive = true;

function loop(now) {
  if (curtainActive) {
    trySweeep(now);
    updateTerms(now);
    drawCurtain(now);
  }
  requestAnimationFrame(loop);
}

/* =============================================
   RESIZE
============================================= */
window.addEventListener("resize", () => {
  resizeCurtain();
  // Remap term positions proportionally
  const newW = logW, newH = logH;
  // (already updated by resizeCurtain)
  terms.forEach(t => {
    t.x = Math.max(20, Math.min(t.x, newW - 20));
    t.y = Math.max(20, Math.min(t.y, newH - 20));
  });
});

/* =============================================
   PHASE 2 — FORM HANDLER
============================================= */
const API_BASE   = "https://sweep-5ubd.onrender.com";
const signupForm = document.getElementById("signupForm");
const nameInput  = document.getElementById("nameInput");
const emailInput = document.getElementById("emailInput");
const submitBtn  = document.getElementById("submitBtn");
const errorMsg   = document.getElementById("errorMsg");
const finePrint  = document.querySelector(".fine-print");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name  = nameInput.value.trim();
  const email = emailInput.value.trim();
  errorMsg.textContent = "";

  if (!name || !email) {
    errorMsg.textContent = "Please fill in both fields.";
    return;
  }

  submitBtn.disabled    = true;
  submitBtn.textContent = "Sending…";

  try {
    const res = await fetch(API_BASE + "/signup", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email }),
    });
    if (res.ok) {
      triggerExplosion();
    } else {
      throw new Error("status " + res.status);
    }
  } catch (err) {
    errorMsg.textContent  = "Something went wrong — try again.";
    submitBtn.disabled    = false;
    submitBtn.textContent = "Get early access →";
  }
});

/* =============================================
   EXPLOSION CANVAS
============================================= */
function triggerExplosion() {
  // Hide form
  signupForm.style.display = "none";
  if (finePrint) finePrint.style.display = "none";

  // Get button position for origin
  const mainPage = document.getElementById("main-page");
  const btnRect  = submitBtn.getBoundingClientRect();
  const originX  = btnRect.left + btnRect.width  / 2;
  const originY  = btnRect.top  + btnRect.height / 2;

  // Create explosion canvas
  const ec  = document.createElement("canvas");
  ec.id     = "explosionCanvas";
  const dpr = window.devicePixelRatio || 1;
  const ew  = window.innerWidth;
  const eh  = window.innerHeight;
  ec.width  = ew * dpr;
  ec.height = eh * dpr;
  Object.assign(ec.style, {
    position: "fixed", inset: "0",
    width: "100%", height: "100%",
    zIndex: "2000", pointerEvents: "none",
  });
  document.body.appendChild(ec);
  const ectx = ec.getContext("2d");
  ectx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Spawn particles
  const particles = [];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = randBetween(3, 9);
    particles.push({
      text:          randFrom(TERMS),
      x:             originX,
      y:             originY,
      vx:            Math.cos(angle) * spd,
      vy:            Math.sin(angle) * spd,
      rotation:      Math.random() * Math.PI * 2,
      rotSpeed:      randBetween(-3, 3) * (Math.PI / 180),
      fontSize:      randBetween(13, 24),
      opacity:       1.0,
    });
  }

  const startTime = performance.now();
  const DECAY     = 900; // ms full decay

  function animateExplosion(now) {
    const elapsed = now - startTime;
    ectx.clearRect(0, 0, ew, eh);

    particles.forEach(p => {
      p.x        += p.vx;
      p.y        += p.vy;
      p.rotation += p.rotSpeed;
      p.opacity   = Math.max(0, 1 - elapsed / DECAY);

      if (p.opacity <= 0.005) return;
      ectx.save();
      ectx.translate(p.x, p.y);
      ectx.rotate(p.rotation);
      ectx.font         = `${p.fontSize.toFixed(1)}px Inter, sans-serif`;
      ectx.fillStyle    = `rgba(28, 25, 23, ${p.opacity.toFixed(3)})`;
      ectx.textAlign    = "center";
      ectx.textBaseline = "middle";
      ectx.fillText(p.text, 0, 0);
      ectx.restore();
    });

    // At 650ms: fade main page
    if (elapsed >= 650 && !mainPage._fadingOut) {
      mainPage._fadingOut = true;
      mainPage.style.transition = "opacity 0.4s ease";
      mainPage.style.opacity    = "0";
    }

    // At 1050ms: show thank-you
    if (elapsed >= 1050 && !mainPage._done) {
      mainPage._done = true;
      mainPage.style.display    = "none";
      ec.remove();
      showThankYou();
      return; // stop loop
    }

    requestAnimationFrame(animateExplosion);
  }

  requestAnimationFrame(animateExplosion);
}

/* =============================================
   PHASE 3 — THANK YOU
============================================= */
function showThankYou() {
  const ty = document.getElementById("thank-you");
  ty.style.display = "flex";
  ty.style.alignItems = "center";
  ty.style.justifyContent = "center";
  // fade in
  ty.style.opacity    = "0";
  ty.style.transition = "opacity 0.3s ease";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { ty.style.opacity = "1"; });
  });
}

/* =============================================
   TYPEWRITER BACKDROP
============================================= */
const TW_PHRASES = [
  "You might get into Harvard...",
  "We think you'd be a great fit.",
  "Students like you thrive here.",
  "Don't miss our Open House!",
  "Visit Our Campus this fall.",
  "Your future starts here.",
  "Discover your potential.",
  "We saw your College Board profile.",
  "Apply now — spaces are limited.",
  "Be transformed at our campus.",
  "Find your fit. Apply today.",
  "Come see what we have to offer.",
  "We'd love to have you here.",
  "Schedule a campus tour today!",
  "Join our community of learners.",
];

class TypewriterPhrase {
  constructor(parent) {
    this.parent = parent;
    this.el = document.createElement("div");
    this.el.className = "tw-phrase";
    parent.appendChild(this.el);
    this.state = "idle";
    this.charIndex = 0;
    this.lastTick = 0;
    this.waitUntil = performance.now() + Math.random() * 3000;
    this._placeRandom();
  }

  _placeRandom() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 60;
    // pick a zone away from the center form area
    const zones = [
      { left: pad, top: pad + 70, maxW: vw * 0.28, maxH: vh * 0.35 },
      { left: vw * 0.68, top: pad + 70, maxW: vw * 0.28, maxH: vh * 0.35 },
      { left: pad, top: vh * 0.62, maxW: vw * 0.28, maxH: vh * 0.28 },
      { left: vw * 0.68, top: vh * 0.62, maxW: vw * 0.28, maxH: vh * 0.28 },
    ];
    const z = zones[Math.floor(Math.random() * zones.length)];
    this.el.style.left   = (z.left + Math.random() * z.maxW) + "px";
    this.el.style.top    = (z.top  + Math.random() * z.maxH) + "px";
    this.el.style.right  = "auto";
    this.el.style.bottom = "auto";
  }

  update(now) {
    if (this.state === "idle") {
      if (now >= this.waitUntil) {
        this.text = "“" + TW_PHRASES[Math.floor(Math.random() * TW_PHRASES.length)] + "”";
        this.charIndex = 0;
        this.state = "typing";
        this.lastTick = now;
        this._placeRandom();
        this.el.textContent = "";
      }
    } else if (this.state === "typing") {
      if (now - this.lastTick >= 52) {
        this.charIndex++;
        this.el.textContent = this.text.slice(0, this.charIndex);
        this.lastTick = now;
        if (this.charIndex >= this.text.length) {
          this.state = "pausing";
          this.pauseUntil = now + 1600 + Math.random() * 800;
        }
      }
    } else if (this.state === "pausing") {
      if (now >= this.pauseUntil) { this.state = "deleting"; this.lastTick = now; }
    } else if (this.state === "deleting") {
      if (now - this.lastTick >= 32) {
        this.charIndex--;
        this.el.textContent = this.text.slice(0, this.charIndex);
        this.lastTick = now;
        if (this.charIndex <= 0) {
          this.el.textContent = "";
          this.state = "idle";
          this.waitUntil = now + 800 + Math.random() * 2000;
        }
      }
    }
  }
}

let typewriters = [];
let twAnimating  = false;

function initTypewriters() {
  if (twAnimating) return;
  twAnimating = true;
  const parent = document.getElementById("main-page");
  for (let i = 0; i < 4; i++) {
    const tw = new TypewriterPhrase(parent);
    tw.waitUntil += i * 900; // stagger start times
    typewriters.push(tw);
  }
  function twLoop(now) {
    typewriters.forEach(tw => tw.update(now));
    requestAnimationFrame(twLoop);
  }
  requestAnimationFrame(twLoop);
}

/* =============================================
   BOOT
============================================= */
(function init() {
  resizeCurtain();
  buildTerms();
  requestAnimationFrame(loop);
})();
