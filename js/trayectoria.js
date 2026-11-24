/* js/trayectoria.js — Menú radial de intereses, impresión de CV y terminal multipágina */
"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  document.addEventListener("DOMContentLoaded", () => {
    // 1. Botón de impresión / guardado en PDF del CV con fotografía
    const printCvBtn = $("#printCvBtn");
    printCvBtn?.addEventListener("click", () => window.print());

    // 2. Menú radial táctico de intereses
    const radialCenterBtn = $("#radialCenterBtn");
    const radialContainer = $("#radialMenuContainer");
    if (radialCenterBtn && radialContainer) {
      radialCenterBtn.addEventListener("click", () => {
        const isActive = radialContainer.classList.toggle("active");
        radialCenterBtn.setAttribute("aria-expanded", String(isActive));
        radialCenterBtn.querySelector("span").textContent = isActive ? "CLOSE" : "KIKE";
      });
    }

    // 3. Terminal interactiva con navegación multipágina
    const terminalToggle = $("#terminalToggle");
    const terminalPanel = $("#terminalPanel");
    const terminalClose = $("#terminalClose");
    const terminalForm = $("#terminalForm");
    const terminalInput = $("#terminalInput");
    const terminalOutput = $("#terminalOutput");

    function toggleTerminal(open) {
      if (!terminalPanel || !terminalToggle) return;
      terminalPanel.hidden = !open;
      terminalToggle.setAttribute("aria-expanded", String(open));
      if (open) terminalInput?.focus();
      else terminalToggle.focus();
    }

    terminalToggle?.addEventListener("click", () => toggleTerminal(terminalPanel.hidden));
    terminalClose?.addEventListener("click", () => toggleTerminal(false));

    const commandHelp = [
      "Comandos disponibles:",
      "help      — mostrar esta lista",
      "home      — ir a la portada (index.html)",
      "projects  — abrir el catálogo de proyectos",
      "services  — abrir servicios freelance y cotización",
      "simulator — abrir el simulador de costos 3D",
      "cv        — desplazarse al CV ejecutivo",
      "clear     — limpiar la consola"
    ];

    function addTerminalLine(text, isCommand = false) {
      const p = document.createElement("p");
      if (isCommand) {
        const b = document.createElement("b");
        b.textContent = text;
        p.appendChild(b);
      } else {
        p.textContent = text;
      }
      terminalOutput.appendChild(p);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    terminalForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const command = terminalInput.value.trim().toLowerCase();
      if (!command) return;

      addTerminalLine(`> ${command}`, true);
      terminalInput.value = "";

      switch (command) {
        case "help":
          commandHelp.forEach((line) => addTerminalLine(line));
          break;
        case "home":
          window.location.href = "./index.html";
          break;
        case "projects":
          window.location.href = "./proyectos.html";
          break;
        case "services":
          window.location.href = "./servicios.html";
          break;
        case "simulator":
          window.location.href = "./simulador.html";
          break;
        case "cv":
          addTerminalLine("Desplazando hacia el CV ejecutivo...");
          $("#cv-ejecutivo")?.scrollIntoView({ behavior: "smooth" });
          break;
        case "clear":
          terminalOutput.replaceChildren();
          break;
        default:
          addTerminalLine(`Comando desconocido: ${command}. Escribe help para ver las opciones.`);
      }
    });
  });
})();