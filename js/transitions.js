/* transitions.js — Motor ligero de transiciones por proyecto con protección bfcache */
"use strict";

(() => {
  const STORAGE_KEY = "portfolioPageTransition";
  const PETAL_COLORS = ["#9333ea", "#a855f7", "#c084fc", "#7e22ce", "#d8b4fe"];

  const DURATIONS = {
    powerbi: 410,
    ajolote: 430,
    excel: 370,
    java: 350,
    python: 350,
    ai: 360
  };

  let overlay = null;
  let isNavigating = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function cleanupOverlay() {
    isNavigating = false;
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function createPetalSvg(index) {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.classList.add("pt-petal");

    const path = document.createElementNS(svgNS, "path");
    // Silueta orgánica de pétalo de flor japonesa (sakura/wisteria)
    path.setAttribute("d", "M16 2 C23 8, 28 16, 22 25 C19 29, 17 29, 16 26 C15 29, 13 29, 10 25 C4 16, 9 8, 16 2 Z");
    path.setAttribute("fill", "currentColor");
    svg.appendChild(path);

    const leftPct = (index * 8.2 + Math.random() * 5) % 96;
    const size = 20 + Math.random() * 18;
    const drift = (Math.random() > 0.5 ? 1 : -1) * (45 + Math.random() * 95);
    const rot = (Math.random() > 0.5 ? 1 : -1) * (140 + Math.random() * 200);
    const delay = Math.floor(Math.random() * 90);
    const dur = 360 + Math.floor(Math.random() * 120);
    const color = PETAL_COLORS[index % PETAL_COLORS.length];

    svg.style.left = `${leftPct}%`;
    svg.style.setProperty("--size", `${size.toFixed(0)}px`);
    svg.style.setProperty("--drift", `${drift.toFixed(0)}px`);
    svg.style.setProperty("--rot", `${rot.toFixed(0)}deg`);
    svg.style.setProperty("--delay", `${delay}ms`);
    svg.style.setProperty("--dur", `${dur}ms`);
    svg.style.setProperty("--petal-color", color);

    return svg;
  }

  function buildOverlay(type, startCovered = false) {
    cleanupOverlay();

    overlay = document.createElement("div");
    overlay.className = "pt-overlay is-active";
    overlay.setAttribute("aria-hidden", "true");

    if (type === "powerbi") {
      const wrap = document.createElement("div");
      wrap.className = "pt-bars";
      for (let i = 0; i < 6; i++) {
        const bar = document.createElement("div");
        bar.className = "pt-bar";
        wrap.appendChild(bar);
      }
      overlay.appendChild(wrap);
    } else if (type === "ajolote") {
      const curtain = document.createElement("div");
      curtain.className = "pt-ajolote-curtain";
      const petalsLayer = document.createElement("div");
      petalsLayer.className = "pt-petals-layer";
      for (let i = 0; i < 12; i++) {
        petalsLayer.appendChild(createPetalSvg(i));
      }
      overlay.append(curtain, petalsLayer);
    } else if (type === "excel") {
      const wrap = document.createElement("div");
      wrap.className = "pt-rows";
      for (let i = 0; i < 5; i++) {
        const row = document.createElement("div");
        row.className = "pt-row";
        wrap.appendChild(row);
      }
      overlay.appendChild(wrap);
    } else {
      // Bloques para java, python o ai con color propio
      const palette = {
        java: "#7c2d12",
        python: "#1e3a8a",
        ai: "#3b0764"
      };
      const wrap = document.createElement("div");
      wrap.className = "pt-blocks";
      for (let i = 0; i < 12; i++) {
        const block = document.createElement("div");
        block.className = "pt-block";
        block.style.setProperty("--block-color", palette[type] || "#18203c");
        block.style.setProperty("--d", `${(i % 4) * 30 + Math.floor(i / 4) * 25}ms`);
        wrap.appendChild(block);
      }
      overlay.appendChild(wrap);
    }

    if (startCovered) {
      // Inicia cubierto sin transición para revelar suavemente la página destino
      overlay.style.transition = "none";
      overlay.classList.add("is-covering");
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  // 1. Al cargar una página destino: revelar si venimos de una transición
  function handleIncomingReveal() {
    if (prefersReducedMotion()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const incomingType = sessionStorage.getItem(STORAGE_KEY);
    if (!incomingType) return;
    sessionStorage.removeItem(STORAGE_KEY);

    const el = buildOverlay(incomingType, true);
    // Forzar reflow antes de animar la apertura
    void el.offsetHeight;

    requestAnimationFrame(() => {
      el.classList.remove("is-covering");
      el.classList.add("is-revealing");
    });

    const wait = DURATIONS[incomingType] || 380;
    setTimeout(cleanupOverlay, wait + 60);
  }

  // 2. Interceptar clics en enlaces internos con data-transition
  function bindTransitionLinks() {
    document.addEventListener("click", (event) => {
      if (isNavigating || prefersReducedMotion()) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      const link = event.target.closest("a[data-transition]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return;

      const targetUrl = new URL(href, window.location.href);
      if (targetUrl.origin !== window.location.origin) return;

      event.preventDefault();
      isNavigating = true;

      const type = link.dataset.transition;
      const el = buildOverlay(type, false);
      void el.offsetHeight;

      el.classList.add("is-covering");
      sessionStorage.setItem(STORAGE_KEY, type);

      const wait = DURATIONS[type] || 380;
      setTimeout(() => {
        window.location.href = targetUrl.href;
      }, wait);
    });
  }

  // 3. Protección obligatoria para el botón "Atrás" del navegador (bfcache)
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      sessionStorage.removeItem(STORAGE_KEY);
      cleanupOverlay();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    handleIncomingReveal();
    bindTransitionLinks();
  });
})();