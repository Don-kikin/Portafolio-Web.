/* Interacciones sin frameworks: filtros, simulador, menú y terminal. */
"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const money = (value) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2
}).format(Number.isFinite(value) ? value : 0);

const percent = (value) => `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;

// Navegación móvil
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

// Filtros de proyectos
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
      card.hidden = filter !== "todos" && !categories.includes(filter);
    });
  });
});

// Simulador educativo: no persiste ni modifica inventario.
const simulatorForm = $("#simulatorForm");
const readNumber = (id) => Number($(`#${id}`).value);

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
    $("#simulatorMessage").textContent = "Revisa los valores: deben ser válidos, y el margen objetivo debe ser menor al 100%.";
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
    const width = total > 0 ? Math.max(0, Math.min(100, amount / total * 100)) : 0;
    $(`#${id}`).style.width = `${width}%`;
  });
  const donutMargin = Math.max(0, Math.min(100, margin));
  $("#marginDonut").style.background = `conic-gradient(var(--cyan) ${donutMargin * 3.6}deg, var(--surface-2) ${donutMargin * 3.6}deg)`;

  let message = `Costo estimado: ${money(total)}. `;
  if (profit < 0) message += "Con este precio el escenario genera pérdida antes de cualquier impuesto.";
  else if (margin < targetMargin * 100) message += "El precio actual está por debajo del margen objetivo configurado.";
  else message += "El precio actual alcanza o supera el margen objetivo configurado.";
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

// Terminal opcional: comandos limitados, sin ejecución de código arbitrario.
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
  "projects — ver proyectos destacados",
  "skills   — ver áreas de conocimiento",
  "about    — ver resumen profesional",
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
    case "help": commandHelp.forEach(line => addTerminalLine(line)); break;
    case "projects":
      addTerminalLine("Proyectos: Simulador de rentabilidad 3D; B2B Connect; Dashboard operativo y análisis crediticio.");
      $("#proyectos").scrollIntoView({ behavior: "smooth" });
      break;
    case "skills":
      addTerminalLine("Áreas: datos y SQL; desarrollo web; backend Java en desarrollo; finanzas y análisis operativo.");
      $("#laboratorio").scrollIntoView({ behavior: "smooth" });
      break;
    case "about":
      addTerminalLine("Luis Enrique Jiménez Bernal — Data, Finance & Digital Solutions.");
      $("#sobre-mi").scrollIntoView({ behavior: "smooth" });
      break;
    case "clear": terminalOutput.replaceChildren(); break;
    default: addTerminalLine(`Comando desconocido: ${command}. Escribe help para ver las opciones.`);
  }
});
$("#year").textContent = new Date().getFullYear();

// Navegación activa según sección visible.
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
