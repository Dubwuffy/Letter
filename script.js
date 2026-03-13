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

  /* ====== SOUND ====== */
  const paperSound = new Audio("paper.mp3");
  paperSound.volume = 0.35;

  /* ====== STATE ====== */
  let sealCracked = false;
  let skipTyping = false;
  let playingVisual = false;
  let isOpening = false;

  /* ====== SAFE SCROLL UNLOCK ====== */
  function unlockScroll() {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";
    document.body.style.overflowX = "hidden";
  }

  /* ====== PARTICLES ====== */
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

      if (!particlesRunning) {
        requestAnimationFrame(animateParticles);
        return;
      }

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
  }

  /* ====== SEAL FLOW ====== */

  function crackSeal() {

    if (sealCracked || isOpening) return;
    sealCracked = true;

    sealHint?.classList.add("hidden");
    sealLabel?.classList.add("hidden");
    sealMenu?.classList.add("visible");

    if (waxSeal) {

      waxSeal.style.animation = "none";
      waxSeal.style.transform = "scale(1.08)";
      waxSeal.style.cursor = "default";

      setTimeout(() => {
        waxSeal.style.transform = "scale(1)";
      }, 150);
    }
  }

  waxSeal?.addEventListener("click", crackSeal);

  waxSeal?.addEventListener("keydown", (e) => {

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      crackSeal();
    }

  });

  /* ====== TYPEWRITER ====== */

  async function typeInto(el, text, baseSpeed = 9) {

    el.textContent = "";

    for (let i = 0; i < text.length; i++) {

      if (skipTyping) {
        el.textContent = text;
        return;
      }

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

    signOff?.classList.add("revealed");
    musicPlayer?.classList.add("revealed");
  }

  async function typeAllParagraphs() {

    skipTyping = false;

    for (const p of paragraphs) {

      const text = p.getAttribute("data-text") || "";

      await typeInto(p, text, 9);

      if (skipTyping) break;

      await wait(140);
    }
  }

  function armSkipOnce() {

    letter?.addEventListener("click", () => {

      if (!skipTyping) {
        showAllInstant();
      }

    }, { once: true });
  }

  /* ====== YOUTUBE + VISUAL STATE ====== */

  function showYouTube(show) {
    ytWrap?.classList.toggle("show", show);
  }

  function setPlayingVisual(on) {

    playingVisual = on;

    playBtn?.classList.toggle("playing", on);
    bars?.classList.toggle("playing", on);

    if (playIcon) {

      playIcon.innerHTML = on
        ? '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>'
        : '<polygon points="5,3 19,12 5,21"></polygon>';
    }

    if (on) spawnNote();
  }

  playBtn?.addEventListener("click", () => {

    const willPlay = !playingVisual;

    showYouTube(willPlay);
    setPlayingVisual(willPlay);

  });

  /* ====== FLOATING NOTES ====== */

  function spawnNote() {

    if (!playingVisual || !letter) return;

    const rect = letter.getBoundingClientRect();

    const el = document.createElement("div");

    el.className = "note";
    el.textContent = Math.random() > 0.5 ? "⚔" : "♪";

    el.style.left = rect.left + Math.random() * rect.width + "px";
    el.style.top = rect.top + window.scrollY + rect.height * (0.55 + Math.random() * 0.25) + "px";

    el.style.color = Math.random() > 0.5 ? "#c9a84c" : "#8b1a1a";
    el.style.position = "absolute";
    el.style.zIndex = "200";

    document.body.appendChild(el);

    setTimeout(() => el.remove(), 2500);

    setTimeout(spawnNote, 750 + Math.random() * 450);
  }

  /* ====== OPEN LETTER ====== */

  async function openLetter(withMusic = false) {

    if (isOpening) return;
    isOpening = true;

    unlockScroll();

    sealScreen?.classList.add("gone");

    await wait(600);

    letter?.classList.add("visible");

    /* 🔊 PAPER SOUND */
    paperSound.currentTime = 0;
    paperSound.play().catch(() => {});

    concertBox?.classList.add("revealed");

    armSkipOnce();

    await typeAllParagraphs();

    signOff?.classList.add("revealed");
    musicPlayer?.classList.add("revealed");

    if (withMusic) {
      showYouTube(true);
      setPlayingVisual(true);
    }

    unlockScroll();
  }

  openBtn?.addEventListener("click", () => openLetter(false));
  openMusicBtn?.addEventListener("click", () => openLetter(true));

  console.log("script.js loaded ✅");

});
