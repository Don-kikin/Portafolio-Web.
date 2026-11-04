/* Interacciones sin frameworks: tema dual, GitHub live, filtros, simulador, menú radial, CV y terminal. */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const money = (value) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number.isFinite(value) ? value : 0);

const percent = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

// 1. TEMA DUAL: SERIO VS COLORIDO
const themeToggleBtn = $("#themeToggleBtn");
const themeIcon = $("#themeIcon");
const themeText = $("#themeText");

const savedTheme = localStorage.getItem("portfolioTheme") || "serio";
document.documentElement.setAttribute("data-theme", savedTheme);
updateThemeUI(savedTheme);

themeToggleBtn?.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "serio" ? "colorido" : "serio";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("portfolioTheme", newTheme);
  updateThemeUI(newTheme);
});

function updateThemeUI(theme) {
  if (!themeToggleBtn) return;
  if (theme === "colorido") {
    themeToggleBtn.classList.add("active");
    themeIcon.textContent = "★";
    themeText.textContent = "COLORIDO";
  } else {
    themeToggleBtn.classList.remove("active");
    themeIcon.textContent = "⌘";
    themeText.textContent = "SERIO";
  }
}

// 2. GITHUB LIVE FETCH (Estado del Repositorio de Don-kikin)
async function fetchGitHubStatus() {
  const statusElement = $("#githubStatus");
  if (!statusElement) return;
  try {
    const response = await fetch("https://github.com/Don-kikin");
    if (!response.ok) throw new Error("API Limit");

    const events = await response.json();
    const pushEvents = events.filter(e => e.type === "PushEvent");

    if (pushEvents.length > 0 && pushEvents[0].payload?.commits?.length > 0) {
      const lastCommit = pushEvents[0].payload.commits[0];
      const repoName = pushEvents[0].repo.name;
      const msg = lastCommit.message.length > 35 ? lastCommit.message.substring(0, 35) + "..." : lastCommit.message;
      statusElement.innerHTML = `<i class="status-dot"></i> Último commit: <a href="https://github.com/${repoName}/commit/${lastCommit.sha}" target="_blank" rel="noreferrer" title="${repoName}">${msg}</a>`;
    } else {
      statusElement.innerHTML = `<i class="status-dot"></i> GitHub: Desarrollador Activo (@Don-kikin)`;
    }
  } catch {
    statusElement.innerHTML = `<i class="status-dot"></i> GitHub: <a href="https://github.com/Don-kikin" target="_blank" rel="noreferrer">@Don-kikin</a>`;
  }
}
fetchGitHubStatus();

// 3. NAVEGACIÓN MÓVIL
const menuToggle = $("#menuToggle");
const navLinks = $("#navLinks");
menuToggle?.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});
$$(".nav-links a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

// 4. FILTROS DE PROYECTOS
const filterButtons = $$(".filter-button");
const projectCards = $$(".project-card");
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    projectCards.forEach(card => {
      const categories = (card.dataset.category || "").split(/\s+/);
      const show = filter === "todos" || categories.includes(filter);
      card.hidden = !show;
      card.style.display = show ? "flex" : "none";
    });
  });
});

// 5. SIMULADOR EDUCATIVO 3D (Validación completa restaurada)
const simulatorForm = $("#simulatorForm");
const readNumber = (id) => Number($(`#${id}`)?.value);

function calculateScenario() {
  const spoolPrice = readNumber("spoolPrice");
  const spoolWeight = readNumber("spoolWeight");
  const partWeight = readNumber("partWeight");
  const minutes = readNumber("printMinutes");
  const salePrice = readNumber("salePrice");
  const watts = readNumber("powerWatts");
  const kwhRate = readNumber("kwhRate");
  const printerCost = readNumber("printerCost");
  const printerLife = readNumber("printerLife");
  const wasteRate = readNumber("wasteRate") / 100;
  const otherCosts = readNumber("otherCosts");
  const targetMargin = readNumber("targetMargin") / 100;

  const values = [spoolPrice, spoolWeight, partWeight, minutes, salePrice, watts, kwhRate, printerCost, printerLife, wasteRate, otherCosts, targetMargin];
  if (values.some(v => !Number.isFinite(v) || v < 0) ||
      spoolWeight <= 0 || partWeight <= 0 || minutes <= 0 || printerLife <= 0 ||
      salePrice <= 0 || spoolPrice <= 0 || targetMargin >= 1 || wasteRate >= 1) {
    $("#simulatorMessage").textContent = "Revisa los valores: deben ser positivos y el margen objetivo debe ser menor al 100%.";
    return;
  }

  const hours = minutes / 60;
  const material = (spoolPrice / spoolWeight) * partWeight * (1 + wasteRate);
  const energy = (watts / 1000) * hours * kwhRate;
  const wear = (printerCost / printerLife) * hours;
  const total = material + energy + wear + otherCosts;
  const profit = salePrice - total;
  const margin = (profit / salePrice) * 100;
  const markup = total > 0 ? (profit / total) * 100 : 0;
  const suggested = total / (1 - targetMargin);

  $("#totalCost").textContent = money(total);
  $("#materialCost").textContent = money(material);
  $("#energyCost").textContent = money(energy);
  $("#wearCost").textContent = money(wear);
  $("#otherCostOut").textContent = money(otherCosts);
  $("#profitValue").textContent = money(profit);
  $("#salesMargin").textContent = percent(margin);
  $("#markupValue").textContent = percent(markup);
  $("#suggestedPrice").textContent = money(suggested);
  $("#targetLabel").textContent = `Objetivo: ${(targetMargin * 100).toFixed(0)}% de margen`;
  $("#marginDonutValue").textContent = `${Math.max(-99, Math.min(100, margin)).toFixed(0)}%`;

  const components = [
    ["materialBar", material], ["energyBar", energy], ["wearBar", wear], ["otherBar", otherCosts]
  ];
  components.forEach(([id, amount]) => {
    const width = total > 0 ? Math.max(0, Math.min(100, (amount / total) * 100)) : 0;
    $(`#${id}`).style.width = `${width}%`;
  });
  const donutMargin = Math.max(0, Math.min(100, margin));
  $("#marginDonut").style.background = `conic-gradient(var(--cyan) ${donutMargin * 3.6}deg, var(--surface-2) ${donutMargin * 3.6}deg)`;

  let message = `Costo estimado: ${money(total)}. `;
  if (profit < 0) message += "Con este precio el escenario genera pérdida antes de impuestos.";
  else if (margin < targetMargin * 100) message += "El precio actual está por debajo del margen objetivo.";
  else message += "El precio actual alcanza o supera el margen objetivo.";
  message += " No se descuentan existencias: esta es solo una simulación.";
  $("#simulatorMessage").textContent = message;
}

simulatorForm?.addEventListener("submit", event => {
  event.preventDefault();
  calculateScenario();
});
simulatorForm?.querySelectorAll("input").forEach(input => {
  input.addEventListener("change", calculateScenario);
});
calculateScenario();

// 6. MENÚ RADIAL TÁCTICO DE HOBBIES
const radialCenterBtn = $("#radialCenterBtn");
const radialContainer = $("#radialMenuContainer");
if (radialCenterBtn && radialContainer) {
  radialCenterBtn.addEventListener("click", () => {
    const isActive = radialContainer.classList.toggle("active");
    radialCenterBtn.setAttribute("aria-expanded", String(isActive));
    radialCenterBtn.querySelector("span").textContent = isActive ? "CLOSE" : "KIKE";
  });
}

// 7. IMPRIMIR / GUARDAR CV CON FOTO EN PDF
const printCvBtn = $("#printCvBtn");
printCvBtn?.addEventListener("click", () => {
  window.print();
});

// 8. TERMINAL INTERACTIVA OPCIONAL
const terminalToggle = $("#terminalToggle");
const terminalPanel = $("#terminalPanel");
const terminalClose = $("#terminalClose");
const terminalForm = $("#terminalForm");
const terminalInput = $("#terminalInput");
const terminalOutput = $("#terminalOutput");

function toggleTerminal(open) {
  terminalPanel.hidden = !open;
  terminalToggle.setAttribute("aria-expanded", String(open));
  if (open) terminalInput.focus();
  else terminalToggle.focus();
}
terminalToggle?.addEventListener("click", () => toggleTerminal(terminalPanel.hidden));
terminalClose?.addEventListener("click", () => toggleTerminal(false));

const commandHelp = [
  "Comandos disponibles:",
  "help     — mostrar esta ayuda",
  "projects — ir a proyectos destacados (Ajolote & Grulla, Sportcommerce, Simulador 3D)",
  "cv       — ver currículum ejecutivo con foto y opciones de descarga",
  "skills   — ver árbol de competencias técnicas",
  "about    — ver trayectoria en Banjercito, Generation y UNITEC",
  "clear    — limpiar la consola"
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

terminalForm?.addEventListener("submit", event => {
  event.preventDefault();
  const command = terminalInput.value.trim().toLowerCase();
  if (!command) return;
  addTerminalLine(`> ${command}`, true);
  terminalInput.value = "";
  switch (command) {
    case "help":
      commandHelp.forEach(line => addTerminalLine(line));
      break;
    case "projects":
      addTerminalLine("Proyectos: Simulador 3D; Ajolote & Grulla; Sportcommerce; B2B Connect.");
      $("#proyectos").scrollIntoView({ behavior: "smooth" });
      break;
    case "cv":
      addTerminalLine("Abriendo sección de CV Ejecutivo y enlaces de descarga PDF...");
      $("#cv-ejecutivo").scrollIntoView({ behavior: "smooth" });
      break;
    case "skills":
      addTerminalLine("Stack: Java, Spring Boot, JS ES6+, SQL/MySQL, Power BI, Git/GitHub, Jira.");
      $("#laboratorio").scrollIntoView({ behavior: "smooth" });
      break;
    case "about":
      addTerminalLine("Luis Enrique Jiménez Bernal — Desarrollador Java Full Stack Jr. & Maestro en Finanzas.");
      $("#sobre-mi").scrollIntoView({ behavior: "smooth" });
      break;
    case "clear":
      terminalOutput.replaceChildren();
      break;
    default:
      addTerminalLine(`Comando desconocido: ${command}. Escribe help para ver las opciones.`);
  }
});

const yearSpan = $("#year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// 9. NAVEGACIÓN ACTIVA SEGÚN SECCIÓN VISIBLE (Restaurado)
const observedSections = $$("main section[id]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$(".nav-links a").forEach(link => {
          const active = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", active);
        });
      }
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  observedSections.forEach(section => observer.observe(section));
}