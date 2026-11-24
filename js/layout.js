/* js/layout.js — Componentes compartidos y gestión global de tema */
"use strict";

(() => {
  const NAV_ITEMS = [
    { href: "index.html", label: "Inicio" },
    { href: "proyectos.html", label: "Proyectos" },
    { href: "servicios.html", label: "Servicios" },
    { href: "simulador.html", label: "Simulador 3D" },
    { href: "trayectoria.html", label: "Trayectoria & CV" }
  ];

  // Detecta la página actual (soporta "/", "/index.html", "/servicios" y "/servicios.html")
  function getCurrentPage() {
    const path = window.location.pathname;
    const segment = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    if (!segment) return "index.html";
    return segment.endsWith(".html") ? segment : `${segment}.html`;
  }

  function renderHeader() {
    const mount = document.getElementById("siteHeader");
    if (!mount) return;

    const currentPage = getCurrentPage();
    const linksHtml = NAV_ITEMS.map(({ href, label }) => {
      const isActive = currentPage === href;
      return `<a href="./${href}" class="${isActive ? "active" : ""}"${isActive ? ' aria-current="page"' : ""}>${label}</a>`;
    }).join("");

    mount.innerHTML = `
      <header class="site-header">
        <nav class="navbar container" aria-label="Navegación principal">
          <a class="brand" href="./index.html" aria-label="Ir al inicio">
            <span class="brand-mark">LJ<span>.</span></span>
            <span class="brand-name">Data <span>&amp;</span> Digital Lab</span>
          </a>

          <div class="nav-ux-controls">
            <span class="badge-lang" title="Nivel de inglés acreditado">EN: C1</span>
            <button id="themeToggleBtn" class="theme-toggle" type="button" aria-label="Cambiar entre modo serio y colorido">
              <span id="themeIcon">⌘</span>
              <span id="themeText">SERIO</span>
            </button>
          </div>

          <button class="menu-toggle" id="menuToggle" type="button" aria-expanded="false" aria-controls="navLinks" aria-label="Abrir menú">☰</button>

          <div class="nav-links" id="navLinks">
            ${linksHtml}
            <a class="nav-contact" href="./servicios.html#contacto">Cotizar / Contacto <span>↗</span></a>
          </div>
        </nav>
      </header>
    `;
  }

  function renderFooter() {
    const mount = document.getElementById("siteFooter");
    if (!mount) return;

    const year = new Date().getFullYear();
    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <a class="brand" href="./index.html">
            <span class="brand-mark">LJ<span>.</span></span>
            <span class="brand-name">Data <span>&amp;</span> Digital Lab</span>
          </a>

          <div class="footer-links" aria-label="Enlaces directos">
            <a href="mailto:luisenriquejimenezber@gmail.com">Correo</a>
            <a href="https://github.com/Don-kikin" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" id="linkedinFooterLink">LinkedIn</a>
          </div>

          <span class="footer-copy">© ${year} Luis Enrique Jiménez Bernal</span>
        </div>
      </footer>
    `;
  }

  function initTheme() {
    const toggleBtn = document.getElementById("themeToggleBtn");
    const themeIcon = document.getElementById("themeIcon");
    const themeText = document.getElementById("themeText");

    const applyTheme = (theme) => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("portfolioTheme", theme);

      if (!toggleBtn || !themeIcon || !themeText) return;
      const isColorido = theme === "colorido";
      toggleBtn.classList.toggle("active", isColorido);
      themeIcon.textContent = isColorido ? "★" : "⌘";
      themeText.textContent = isColorido ? "COLORIDO" : "SERIO";
      toggleBtn.setAttribute("aria-label", isColorido ? "Cambiar a modo serio" : "Cambiar a modo colorido");
    };

    const savedTheme = localStorage.getItem("portfolioTheme") || "serio";
    applyTheme(savedTheme);

    toggleBtn?.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "serio" ? "colorido" : "serio");
    });
  }

  function initMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    initTheme();
    initMobileMenu();
  });
})();