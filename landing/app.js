/* -----------------------------------------------
   SWEEP LANDING PAGE — app.js
   Three sections:
     1. Form handler (signup API)
     2. Canvas mini-game (broom + spam phrases)
     3. Canvas resize handler
   ----------------------------------------------- */

"use strict";

/* ===============================================
   SECTION 1 — FORM HANDLER
   =============================================== */

const API_BASE = "https://sweep-api.onrender.com"; // change when deployed

const signupForm  = document.getElementById("signupForm");
const nameInput   = document.getElementById("nameInput");
const emailInput  = document.getElementById("emailInput");
const submitBtn   = document.getElementById("submitBtn");
const errorMsg    = document.getElementById("errorMsg");
const successMsg  = document.getElementById("successMsg");
const finePrint   = document.querySelector(".fine-print");

signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name  = nameInput.value.trim();
  const email = emailInput.value.trim();

  // Clear previous error
  errorMsg.textContent = "";

  if (!name || !email) {
    errorMsg.textContent = "Please fill in both fields.";
    return;
  }

  // Disable button while request is in flight
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending…";

  try {
    const response = await fetch(API_BASE + "/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    if (response.ok) {
      // Hide form, show success
      signupForm.style.display = "none";
      if (finePrint) finePrint.style.display = "none";
      successMsg.style.display = "block";
    } else {
      throw new Error("Server returned " + response.status);
    }
  } catch (err) {
    errorMsg.textContent = "Something went wrong — try again.";
    submitBtn.disabled = false;
    submitBtn.textContent = "Get early access →";
  }
});

/* ===============================================
   SECTION 2 — CANVAS MINI-GAME
   =============================================== */

const canvas  = document.getElementById("sweepCanvas");
const ctx     = canvas.getContext("2d");
const wrap    = document.getElementById("canvasWrap");

// --- Spam phrases from real college recruitment emails ---
const SPAM_PHRASES = [
  "Explore your future",
  "Visit our campus",
  "Students like you...",
  "Start your application",
  "Discover your potential",
  "Be Transformed",
  "Find your fit",
  "Join us for Open House",
  "Can you imagine yourself here?",
  "You're invited to PreVU",
];

// Colors
const COLOR_TEXT_FLOAT = "rgba(28, 25, 23, 0.55)";
const COLOR_SAGE       = "#6B8C7E";
const COLOR_CHARCOAL   = "#1C1917";
const COLOR_SECONDARY  = "#6B6560";

// Timing
const FADE_DURATION_MS    = 400;  // phrase fades as it flies
const BURST_DURATION_MS   = 300;  // dot scatter after phrase exits
const RESPAWN_DELAY_MS    = 2000; // wait before phrase reappears

// Sweep interaction
const SWEEP_RADIUS = 70; // px — how close cursor must be to catch a phrase

// --- Mouse state ---
let mouse = {
  x: -9999,
  y: -9999,
  down: false,
  prevX: -9999,
  prevY: -9999,
  dx: 0,
  dy: 0,
  onCanvas: false,
};

// --- Swept counter ---
let totalSwept = 0;

// --- Logical canvas dimensions (CSS pixels) ---
// canvas.width / canvas.height are device pixels; drawing code uses these instead.
let logW = 0;
let logH = 0;

// -----------------------------------------------
// Phrase class
// -----------------------------------------------
class Phrase {
  constructor(text, index, total) {
    this.text   = text;
    this.state  = "floating";
    this.opacity = 0.55;

    // Measure text width once we know canvas size
    this.width  = 0;
    this.height = 13; // font-size

    // Place phrases distributed across the canvas
    this._placeInitial(index, total);

    // Random slow drift
    this._setFloatVelocity();

    // For flying state
    this.vx = 0;
    this.vy = 0;
    this.flyStartTime = 0;

    // Burst particles
    this.particles = [];
    this.burstStartTime = 0;

    // Respawn
    this.respawnTime = 0;
  }

  _placeInitial(index, total) {
    // Spread across canvas — avoid edges on init
    const margin = 60;
    const cw = logW;
    const ch = logH;
    // Use a grid-ish spread so phrases don't all stack
    const cols = Math.ceil(Math.sqrt(total));
    const col  = index % cols;
    const row  = Math.floor(index / cols);
    const cellW = (cw - margin * 2) / cols;
    const cellH = (ch - margin * 2) / Math.ceil(total / cols);
    this.x = margin + col * cellW + Math.random() * cellW * 0.6;
    this.y = margin + row * cellH + Math.random() * cellH * 0.6;

    // Clamp to canvas
    this.x = Math.min(this.x, cw - 10);
    this.y = Math.min(this.y, ch - 10);
  }

  _setFloatVelocity() {
    this.floatVX = (Math.random() - 0.5) * 0.6; // -0.3 to 0.3
    this.floatVY = (Math.random() - 0.5) * 0.6;
  }

  _measureText() {
    ctx.font = "13px Inter, sans-serif";
    this.width = ctx.measureText(this.text).width;
  }

  _spawnFromEdge() {
    const cw = logW;
    const ch = logH;
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { // top
      this.x = Math.random() * cw;
      this.y = -20;
    } else if (edge === 1) { // right
      this.x = cw + 20;
      this.y = Math.random() * ch;
    } else if (edge === 2) { // bottom
      this.x = Math.random() * cw;
      this.y = ch + 20;
    } else { // left
      this.x = -20;
      this.y = Math.random() * ch;
    }
    this.opacity = 0.55;
    this._setFloatVelocity();
    this.state = "floating";
  }

  _startBurst() {
    this.state = "burst";
    this.burstStartTime = performance.now();
    this.particles = [];
    // 5 scatter dots
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        opacity: 1,
        radius: 4,
      });
    }
  }

  update(now) {
    if (this.state === "floating") {
      this._measureText();

      this.x += this.floatVX;
      this.y += this.floatVY;

      // Bounce off edges (logical CSS pixel bounds)
      const halfW = this.width / 2;
      if (this.x - halfW < 0) {
        this.x = halfW;
        this.floatVX = Math.abs(this.floatVX);
      } else if (this.x + halfW > logW) {
        this.x = logW - halfW;
        this.floatVX = -Math.abs(this.floatVX);
      }
      if (this.y < 16) {
        this.y = 16;
        this.floatVY = Math.abs(this.floatVY);
      } else if (this.y > logH - 4) {
        this.y = logH - 4;
        this.floatVY = -Math.abs(this.floatVY);
      }

      // Check if broom is sweeping this phrase
      if (mouse.down && mouse.onCanvas) {
        const dist = Math.hypot(mouse.x - this.x, mouse.y - this.y);
        if (dist < SWEEP_RADIUS) {
          this._startFlying(now);
        }
      }

    } else if (this.state === "flying") {
      this.x += this.vx;
      this.y += this.vy;

      const elapsed = now - this.flyStartTime;
      const t       = Math.min(elapsed / FADE_DURATION_MS, 1);
      this.opacity  = 0.55 * (1 - t);

      // Hit canvas edge or fully faded → burst
      const outOfBounds =
        this.x < -50 || this.x > logW + 50 ||
        this.y < -50 || this.y > logH + 50;

      if (outOfBounds || this.opacity <= 0.01) {
        totalSwept++;
        this._startBurst();
      }

    } else if (this.state === "burst") {
      const elapsed = now - this.burstStartTime;
      const t       = Math.min(elapsed / BURST_DURATION_MS, 1);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity = 1 - t;
      });

      if (elapsed >= BURST_DURATION_MS) {
        this.state = "respawning";
        this.respawnTime = now + RESPAWN_DELAY_MS;
      }

    } else if (this.state === "respawning") {
      if (now >= this.respawnTime) {
        this._spawnFromEdge();
      }
    }
  }

  _startFlying(now) {
    this.state = "flying";
    this.flyStartTime = now;
    // Velocity: drag direction + slight random scatter
    this.vx = mouse.dx * 0.8 + (Math.random() - 0.5) * 2;
    this.vy = mouse.dy * 0.8 + (Math.random() - 0.5) * 2;
    // Ensure minimum outward speed so it actually leaves
    const speed = Math.hypot(this.vx, this.vy);
    if (speed < 1.5) {
      const angle = Math.random() * Math.PI * 2;
      this.vx += Math.cos(angle) * 1.5;
      this.vy += Math.sin(angle) * 1.5;
    }
  }

  draw(now) {
    if (this.state === "floating" || this.state === "flying") {
      if (this.width === 0) this._measureText();
      ctx.save();
      ctx.font = "13px Inter, sans-serif";
      ctx.fillStyle = `rgba(28, 25, 23, ${this.opacity.toFixed(3)})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();

    } else if (this.state === "burst") {
      ctx.save();
      this.particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(107, 140, 126, ${p.opacity.toFixed(3)})`;
        ctx.fill();
      });
      ctx.restore();
    }
    // "respawning" state: nothing drawn
  }
}

// -----------------------------------------------
// Draw the broom cursor
// -----------------------------------------------
function drawBroom(x, y) {
  ctx.save();

  // Handle: 2px wide, 18px tall rectangle, hotspot at bottom center
  const handleW  = 2;
  const handleH  = 18;
  const handleX  = x - handleW / 2;
  const handleY  = y - handleH; // handle tip at (x, y)

  ctx.fillStyle = COLOR_CHARCOAL;
  ctx.fillRect(handleX, handleY, handleW, handleH);

  // Bristles: trapezoid at the bottom of handle
  // Full width at bottom = 12px, narrow width at top = 4px, height = 6px
  const bw      = 12;
  const bwTop   = 4;
  const bh      = 6;
  const bTop    = handleY + handleH;     // where bristles start (at handle tip)
  const bBottom = bTop + bh;

  ctx.beginPath();
  ctx.moveTo(x - bwTop / 2, bTop);       // top-left
  ctx.lineTo(x + bwTop / 2, bTop);       // top-right
  ctx.lineTo(x + bw / 2,    bBottom);    // bottom-right
  ctx.lineTo(x - bw / 2,    bBottom);    // bottom-left
  ctx.closePath();
  ctx.fillStyle = COLOR_SAGE;
  ctx.fill();

  ctx.restore();
}

// -----------------------------------------------
// Draw swept counter
// -----------------------------------------------
function drawCounter() {
  if (totalSwept === 0) return;
  ctx.save();
  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = COLOR_SECONDARY;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(totalSwept + " swept", logW - 14, logH - 12);
  ctx.restore();
}

// -----------------------------------------------
// Initialize phrases
// -----------------------------------------------
let phrases = [];

function initPhrases() {
  phrases = SPAM_PHRASES.map(
    (text, i) => new Phrase(text, i, SPAM_PHRASES.length)
  );
}

// -----------------------------------------------
// Main animation loop
// -----------------------------------------------
function loop(now) {
  // Clear with canvas background color (use logical dimensions, not device pixels)
  ctx.fillStyle = "#E8E2D5";
  ctx.fillRect(0, 0, logW, logH);

  // Update and draw phrases
  phrases.forEach(p => {
    p.update(now);
    p.draw(now);
  });

  // Draw broom cursor if mouse is on canvas
  if (mouse.onCanvas) {
    drawBroom(mouse.x, mouse.y);
  }

  // Draw counter
  drawCounter();

  requestAnimationFrame(loop);
}

// -----------------------------------------------
// Mouse event listeners (canvas)
// -----------------------------------------------
canvas.addEventListener("mouseenter", () => {
  mouse.onCanvas = true;
  canvas.style.cursor = "none";
});

canvas.addEventListener("mouseleave", () => {
  mouse.onCanvas = false;
  mouse.down = false;
  canvas.style.cursor = "default";
  // Reset delta so stale velocity doesn't carry over
  mouse.dx = 0;
  mouse.dy = 0;
});

canvas.addEventListener("mousedown", (e) => {
  mouse.down = true;
  // Snapshot position so first frame delta is zero
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  mouse.prevX = (e.clientX - rect.left) * scaleX;
  mouse.prevY = (e.clientY - rect.top)  * scaleY;
  mouse.dx = 0;
  mouse.dy = 0;
});

canvas.addEventListener("mouseup", () => {
  mouse.down = false;
  mouse.dx = 0;
  mouse.dy = 0;
});

canvas.addEventListener("mousemove", (e) => {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = (e.clientX - rect.left) * scaleX;
  const cy = (e.clientY - rect.top)  * scaleY;

  if (mouse.prevX === -9999) {
    // First move event — initialise prev without a delta
    mouse.prevX = cx;
    mouse.prevY = cy;
  }

  mouse.dx = cx - mouse.prevX;
  mouse.dy = cy - mouse.prevY;

  mouse.x = cx;
  mouse.y = cy;

  mouse.prevX = cx;
  mouse.prevY = cy;
});

// Prevent context menu on right-click inside canvas
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

/* ===============================================
   SECTION 3 — CANVAS RESIZE
   =============================================== */

function resizeCanvas() {
  const rect   = wrap.getBoundingClientRect();
  const dpr    = window.devicePixelRatio || 1;

  // Save old logical dimensions so we can remap phrase positions
  const oldLogW = logW || rect.width;
  const oldLogH = logH || rect.height;

  // Set canvas buffer size in device pixels
  canvas.width  = Math.round(rect.width  * dpr);
  canvas.height = Math.round(rect.height * dpr);

  // Update logical dimensions (CSS pixels) used by all drawing code
  logW = Math.round(rect.width);
  logH = Math.round(rect.height);

  // Reset transform each time (avoids scale accumulation across multiple resize calls)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Remap phrase positions proportionally and clamp to new logical bounds
  phrases.forEach(p => {
    if (oldLogW > 0 && oldLogH > 0) {
      p.x = (p.x / oldLogW) * logW;
      p.y = (p.y / oldLogH) * logH;
    }
    p.x = Math.max(10, Math.min(p.x, logW - 10));
    p.y = Math.max(16, Math.min(p.y, logH - 4));
  });
}

window.addEventListener("resize", resizeCanvas);

/* ===============================================
   BOOT
   =============================================== */
(function init() {
  resizeCanvas();   // size canvas to its container on load
  initPhrases();    // spawn all phrase objects
  requestAnimationFrame(loop); // start render loop
})();
