/* js/app.js — Tarjetas 3D, Modal Video CV y Materialización Dual (Fondo ↓ + Tarjetas ↑) */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const VIDEO_SOURCES = {
    esp: {
      title: "Video CV — Presentación en Español (60s)",
      src: "./assets/video/cv-esp.mp4"
    },
    eng: {
      title: "Video CV — English Introduction (60s)",
      src: "./assets/video/cv-eng.mp4"
    }
  };

  const grid = document.querySelector(".cards-grid");
  const cards = [...document.querySelectorAll(".flip-card")];
  const modal = document.getElementById("videoModal");
  const modalTitle = document.getElementById("videoModalTitle");
  const modalBody = document.getElementById("videoModalBody");
  const closeModalBtn = document.getElementById("closeVideoModal");

  // 1. Giro de tarjetas en pantallas táctiles y teclado
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) return;
      const wasFlipped = card.classList.contains("is-flipped");
      cards.forEach((other) => other.classList.remove("is-flipped"));
      if (!wasFlipped) card.classList.add("is-flipped");
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        if (event.target.closest("a, button")) return;
        event.preventDefault();
        card.classList.toggle("is-flipped");
      }
    });
  });

  // 2. Modal de Video CV (ESP / ENG)
  function openVideoModal(langKey) {
    const videoInfo = VIDEO_SOURCES[langKey];
    if (!videoInfo || !modal || !modalTitle || !modalBody) return;

    modalTitle.textContent = videoInfo.title;
    modalBody.innerHTML = `
      <video controls autoplay playsinline>
        <source src="${videoInfo.src}" type="video/mp4">
        Tu navegador no soporta la reproducción de video HTML5.
      </video>
      <p class="video-fallback-note">
        Si el video aún no se reproduce, coloca el archivo en <code>${videoInfo.src}</code>.
      </p>
    `;

    modal.hidden = false;
    closeModalBtn?.focus();
  }

  function closeVideoModal() {
    if (!modal || !modalBody) return;
    modal.hidden = true;
    modalBody.replaceChildren();
  }

  document.querySelectorAll("[data-open-video]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      openVideoModal(btn.dataset.openVideo);
    });
  });

  closeModalBtn?.addEventListener("click", closeVideoModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeVideoModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) closeVideoModal();
  });

  // 3. Año automático en el footer
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // 4. Materialización Dual: Fondo (arriba -> abajo) + Tarjetas (abajo -> arriba)
  function runDualPixelMaterialization() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bgContainer = document.getElementById("bgContainer");
    const bgImg = document.getElementById("bgImageLayer");
    if (!grid || cards.length === 0 || !bgContainer || !bgImg) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const bgCanvas = document.createElement("canvas");
    bgCanvas.className = "bg-materialize-canvas";
    bgContainer.appendChild(bgCanvas);
    const bgCtx = bgCanvas.getContext("2d");

    const cardsCanvas = document.createElement("canvas");
    cardsCanvas.className = "materialize-canvas";
    cardsCanvas.setAttribute("aria-hidden", "true");
    grid.appendChild(cardsCanvas);
    const cardsCtx = cardsCanvas.getContext("2d");

    if (!bgCtx || !cardsCtx) {
      bgCanvas.remove();
      cardsCanvas.remove();
      return;
    }

    const wWidth = window.innerWidth;
    const wHeight = window.innerHeight;
    bgCanvas.width = Math.max(1, Math.floor(wWidth * dpr));
    bgCanvas.height = Math.max(1, Math.floor(wHeight * dpr));
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const gridWidth = grid.offsetWidth;
    const gridHeight = grid.offsetHeight;
    cardsCanvas.width = Math.max(1, Math.floor(gridWidth * dpr));
    cardsCanvas.height = Math.max(1, Math.floor(gridHeight * dpr));
    cardsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COLORS = ["#35d9f2", "#7ceeff", "#9a7bff", "#d94c70", "#f59e0b"];
    const PIXEL_SIZE = 9;
    const BG_DURATION = 1150;
    const CARD_DURATION = 880;
    const STAGGER_DELAY = 65;

    bgImg.style.clipPath = "inset(0 0 100% 0)";

    const items = cards.map((el, index) => {
      el.classList.add("is-building");
      el.style.clipPath = "inset(100% 0 0 0)";
      return {
        el,
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
        delay: index * STAGGER_DELAY,
        done: false
      };
    });

    const bgParticles = [];
    const cardParticles = [];
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function spawnBgPixels(edgeY, count) {
      for (let i = 0; i < count; i++) {
        bgParticles.push({
          x: Math.random() * wWidth,
          y: edgeY + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 0.4,
          vy: 1.4 + Math.random() * 2.8,
          size: 4 + Math.random() * 6,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.95,
          decay: 0.02 + Math.random() * 0.02
        });
      }
    }

    function spawnCardPixels(item, edgeY, count) {
      for (let i = 0; i < count; i++) {
        cardParticles.push({
          x: item.x + 8 + Math.random() * Math.max(10, item.w - 16),
          y: edgeY + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 0.65,
          vy: -(1.2 + Math.random() * 2.5),
          size: 4 + Math.random() * 5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          decay: 0.024 + Math.random() * 0.024
        });
      }
    }

    function drawHorizontalPixelBand(ctx, x, width, edgeY, minY, maxY) {
      const cols = Math.floor(width / PIXEL_SIZE);
      for (let c = 0; c < cols; c++) {
        if (Math.random() < 0.48) continue;
        const px = x + c * PIXEL_SIZE;
        const py = edgeY + (Math.floor(Math.random() * 4) - 2) * PIXEL_SIZE;
        if (py < minY || py > maxY - PIXEL_SIZE) continue;
        ctx.globalAlpha = 0.6 + Math.random() * 0.4;
        ctx.fillStyle = COLORS[Math.floor(Math.random() * COLORS.length)];
        ctx.fillRect(px, py, PIXEL_SIZE - 1, PIXEL_SIZE - 1);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      const elapsed = now - startTime;

      // 1. FONDO: Arriba hacia abajo
      bgCtx.clearRect(0, 0, wWidth, wHeight);
      const bgProgress = Math.min(elapsed / BG_DURATION, 1);
      const bgEased = easeOutCubic(bgProgress);

      if (bgProgress < 1) {
        const bottomInset = (1 - bgEased) * 100;
        bgImg.style.clipPath = `inset(0 0 ${bottomInset.toFixed(2)}% 0)`;
        const bgEdgeY = wHeight * bgEased;
        drawHorizontalPixelBand(bgCtx, 0, wWidth, bgEdgeY, 0, wHeight);
        spawnBgPixels(bgEdgeY, 12);
      } else {
        bgImg.style.removeProperty("clip-path");
      }

      for (let i = bgParticles.length - 1; i >= 0; i--) {
        const p = bgParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          bgParticles.splice(i, 1);
          continue;
        }
        bgCtx.globalAlpha = p.alpha;
        bgCtx.fillStyle = p.color;
        bgCtx.fillRect(p.x, p.y, p.size, p.size);
      }
      bgCtx.globalAlpha = 1;

      // 2. TARJETAS: Abajo hacia arriba
      cardsCtx.clearRect(0, 0, gridWidth, gridHeight);
      let allCardsDone = true;

      items.forEach((item) => {
        if (item.done) return;
        const localTime = elapsed - item.delay;
        if (localTime < 0) {
          allCardsDone = false;
          return;
        }

        const progress = Math.min(localTime / CARD_DURATION, 1);
        const eased = easeOutCubic(progress);

        if (progress < 1) {
          const topInset = (1 - eased) * 100;
          item.el.style.clipPath = `inset(${topInset.toFixed(2)}% 0 0 0)`;
          const edgeY = item.y + item.h * (1 - eased);
          drawHorizontalPixelBand(cardsCtx, item.x + 6, item.w - 12, edgeY, item.y, item.y + item.h);
          spawnCardPixels(item, edgeY, 5);
          allCardsDone = false;
        } else {
          item.el.style.removeProperty("clip-path");
          item.el.classList.remove("is-building");
          spawnCardPixels(item, item.y, 10);
          item.done = true;
        }
      });

      for (let i = cardParticles.length - 1; i >= 0; i--) {
        const p = cardParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          cardParticles.splice(i, 1);
          continue;
        }
        cardsCtx.globalAlpha = p.alpha;
        cardsCtx.fillStyle = p.color;
        cardsCtx.fillRect(p.x, p.y, p.size, p.size);
      }
      cardsCtx.globalAlpha = 1;

      if (bgProgress < 1 || !allCardsDone || bgParticles.length > 0 || cardParticles.length > 0) {
        requestAnimationFrame(frame);
      } else {
        bgCanvas.remove();
        cardsCanvas.remove();
      }
    }

    requestAnimationFrame(frame);
  }

  runDualPixelMaterialization();
});