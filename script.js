document.addEventListener("DOMContentLoaded", () => {
  /* ====== DOM HELPERS ====== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ====== ELEMENTS ====== */
  const canvas = $("#particles");
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

  /* ====== PARTICLES (FIX 3: guard) ====== */
  if (canvas) {
    const ctx = canvas.getContext("2d");

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
  } else {
    console.warn("Canvas #particles not found — skipping particles.");
  }

  /* ====== SEAL FLOW ====== */
  function crackSeal() {
    if (sealCracked) return;
    sealCracked = true;

    if (sealHint) sealHint.classList.add("hidden");
    if (sealLabel) sealLabel.classList.add("hidden");
    if (sealMenu) sealMenu.classList.add("visible");

    if (waxSeal) {
      waxSeal.style.animation = "none";
      waxSeal.style.transform = "scale(1.08)";
      waxSeal.style.cursor = "default";
      setTimeout(() => (waxSeal.style.transform = "scale(1)"), 150);
    }
  }

  if (waxSeal) {
    waxSeal.addEventListener("click", crackSeal);
    waxSeal.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        crackSeal();
      }
    });
  } else {
    console.warn("#waxSeal not found — seal click disabled.");
  }

  /* ====== TYPEWRITER (FAST) ====== */
  async function typeInto(el, text, baseSpeed = 9) {
    el.textContent = "";
    for (let i = 0; i < text.length; i++) {
      if (skipTyping) return;
      const ch = text[i];
      el.textContent += ch;

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
      await typeInto(p, text, 9);
      await wait(140);
      if (skipTyping) break;
    }
  }

  function armSkipOnce() {
    if (!letter) return;
    letter.addEventListener(
      "click",
      () => {
        if (!skipTyping) {
          showAllInstant();
          // ensure visibility
          if (signOff) signOff.classList.add("revealed");
          if (musicPlayer) musicPlayer.classList.add("revealed");
        }
      },
      { once: true }
    );
  }

  /* ====== YOUTUBE TOGGLE + VISUAL PLAY STATE ====== */
  function showYouTube(show) {
    if (!ytWrap) return;
    ytWrap.style.display = show ? "block" : "none";
    ytWrap.style.opacity = show ? "1" : "0";
  }

  function setPlayingVisual(on) {
    playingVisual = on;

    if (playBtn) playBtn.classList.toggle("playing", on);
    if (bars) bars.classList.toggle("playing", on);

    if (playIcon) {
      playIcon.innerHTML = on
        ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
        : '<polygon points="5,3 19,12 5,21"></polygon>';
    }

    if (on) spawnNote();
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      const willPlay = !playingVisual;
      showYouTube(willPlay);
      setPlayingVisual(willPlay);
    });
  }

  /* ====== FLOATING NOTES ====== */
  function spawnNote() {
    if (!playingVisual || !letter) return;

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

  /* ====== OPEN LETTER ====== */
  async function openLetter(withMusic = false) {
    if (sealScreen) sealScreen.classList.add("gone");

    setTimeout(async () => {
      if (letter) letter.classList.add("visible");

      armSkipOnce();

      if (concertBox) concertBox.classList.add("revealed");

      await typeAllParagraphs();

      if (signOff) signOff.classList.add("revealed");
      if (musicPlayer) musicPlayer.classList.add("revealed");

      if (withMusic) {
        showYouTube(true);
        setPlayingVisual(true);
      }
    }, 600);
  }

  if (openBtn) openBtn.addEventListener("click", () => openLetter(false));
  if (openMusicBtn) openMusicBtn.addEventListener("click", () => openLetter(true));

  console.log("script.js loaded ✅");
});
