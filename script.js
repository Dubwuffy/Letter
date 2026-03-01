/* ====== DOM HELPERS ====== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ====== ELEMENTS ====== */
const canvas = $("#particles");
const ctx = canvas.getContext("2d");

const sealScreen = $("#sealScreen");
const waxSeal = $("#waxSeal");
const sealHint = $("#sealHint");
const sealLabel = $("#sealLabel");
const sealMenu = $("#sealMenu");

const openBtn = $("#openBtn");
const openMusicBtn = $("#openMusicBtn");

const letter = $("#letter");
const paragraphs = $$(".para");
const concertBox = $("#concertBox");
const signOff = $("#signOff");

const musicPlayer = $("#musicPlayer");
const playBtn = $("#playBtn");
const playIcon = $("#playIcon");
const bars = $("#bars");
const ytWrap = $("#ytWrap");

/* ====== STATE ====== */
let sealCracked = false;
let skipTyping = false;
let playingVisual = false;

/* ====== PARTICLES ====== */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const particles = Array.from({ length: 60 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  r: Math.random() * 1.5 + 0.3,
  speed: Math.random() * 0.4 + 0.1,
  drift: (Math.random() - 0.5) * 0.25,
  opacity: Math.random() * 0.45 + 0.12,
}));

let particlesRunning = true;
document.addEventListener("visibilitychange", () => {
  particlesRunning = !document.hidden;
});

function animateParticles() {
  if (!particlesRunning) return requestAnimationFrame(animateParticles);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,76,${p.opacity})`;
    ctx.fill();

    p.y -= p.speed;
    p.x += p.drift;

    if (p.y < -8) {
      p.y = canvas.height + 8;
      p.x = Math.random() * canvas.width;
    }
    if (p.x < -8) p.x = canvas.width + 8;
    if (p.x > canvas.width + 8) p.x = -8;
  }

  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ====== SEAL FLOW ====== */
function crackSeal() {
  if (sealCracked) return;
  sealCracked = true;

  // Hide hint/label, show menu
  if (sealHint) sealHint.classList.add("hidden");
  if (sealLabel) sealLabel.classList.add("hidden");
  if (sealMenu) sealMenu.classList.add("visible");

  // Small tactile "pop"
  waxSeal.style.animation = "none";
  waxSeal.style.transform = "scale(1.08)";
  waxSeal.style.cursor = "default";
  setTimeout(() => (waxSeal.style.transform = "scale(1)"), 150);
}

waxSeal.addEventListener("click", crackSeal);
waxSeal.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    crackSeal();
  }
});

/* ====== TYPEWRITER (FAST) ====== */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function typeInto(el, text, baseSpeed = 9) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (skipTyping) return;
    const ch = text[i];
    el.textContent += ch;

    // Make it fast, but natural
    let delay = baseSpeed;
    if (ch === " ") delay = 0;
    if (".!?".includes(ch)) delay += 90;
    if (",;:".includes(ch)) delay += 45;
    if (ch === "—") delay += 55;

    await wait(delay);
  }
}

function showAllInstant() {
  skipTyping = true;
  for (const p of paragraphs) {
    p.textContent = p.getAttribute("data-text") || "";
  }
}

async function typeAllParagraphs() {
  skipTyping = false;

  for (const p of paragraphs) {
    const text = p.getAttribute("data-text") || "";
    await typeInto(p, text, 9);       // <- speed knob (6 faster, 12 slower)
    await wait(140);                  // pause between paragraphs
    if (skipTyping) break;
  }
}

/* Click letter to skip typing */
function armSkipOnce() {
  letter.addEventListener(
    "click",
    () => {
      if (!skipTyping) {
        showAllInstant();
        // Make sure the rest becomes visible right away
        signOff.style.opacity = "1";
        musicPlayer.style.opacity = "1";
      }
    },
    { once: true }
  );
}

/* ====== OPEN LETTER ====== */
function openLetter(withMusic = false) {
  // Close seal overlay
  sealScreen.classList.add("gone");

  setTimeout(async () => {
    // Show letter card
    letter.classList.add("visible");

    // Arm skip
    armSkipOnce();

    // Optionally show concert box at a nice moment
    // (If you want it to "reveal" later with CSS class, you can add transitions;
    // here we just ensure it's visible when relevant.)
    concertBox.classList.add("revealed");

    // Typewriter paragraphs
    await typeAllParagraphs();

    // Show signoff and music player
    signOff.classList.add("revealed");
    musicPlayer.classList.add("revealed");

    // If requested, show YouTube embed (may not autoplay with sound)
    if (withMusic) {
      showYouTube(true);
      setPlayingVisual(true);
    }
  }, 600);
}

openBtn.addEventListener("click", () => openLetter(false));
openMusicBtn.addEventListener("click", () => openLetter(true));

/* ====== YOUTUBE TOGGLE + VISUAL PLAY STATE ====== */
function showYouTube(show) {
  if (!ytWrap) return;
  ytWrap.style.display = show ? "block" : "none";
  ytWrap.style.opacity = show ? "1" : "0";
}

function setPlayingVisual(on) {
  playingVisual = on;

  if (on) {
    playBtn.classList.add("playing");
    bars.classList.add("playing");
    playIcon.innerHTML =
      '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    spawnNote();
  } else {
    playBtn.classList.remove("playing");
    bars.classList.remove("playing");
    playIcon.innerHTML = '<polygon points="5,3 19,12 5,21"></polygon>';
  }
}

playBtn.addEventListener("click", () => {
  // This only toggles embed visibility + visuals.
  // Real autoplay depends on YouTube/browser rules.
  const willPlay = !playingVisual;
  showYouTube(willPlay);
  setPlayingVisual(willPlay);
});

/* ====== FLOATING NOTES (SUBTLE) ====== */
function spawnNote() {
  if (!playingVisual) return;

  const rect = letter.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "note";
  el.textContent = Math.random() > 0.5 ? "⚔" : "♪";
  el.style.left = rect.left + Math.random() * rect.width + "px";
  el.style.top = rect.top + rect.height * (0.55 + Math.random() * 0.25) + "px";
  el.style.color = Math.random() > 0.5 ? "#c9a84c" : "#8b1a1a";
  el.style.zIndex = "200";
  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2500);
  setTimeout(spawnNote, 750 + Math.random() * 450);
}
