/* js/proyecto-powerbi.js — Motor interactivo del Dashboard Power BI (CSV real + Embed opcional) */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================================
  // CONFIGURACIÓN: Pega aquí tu enlace de "Publicar en la web" de Power BI Service
  // Ejemplo: "https://app.powerbi.com/view?r=eyJrIjoi..."
  // Déjalo vacío "" si aún no cuentas con publicación pública en Power BI Service.
  // =========================================================================
  const POWERBI_EMBED_URL = "";
  const CSV_PATH = "./assets/data/gym-occupancy.csv";

  const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const SHIFTS = ["Madrugada", "Matutino", "Vespertino", "Nocturno"];
  const SEMESTERS = ["Inicio de Semestre", "Semestre Regular", "Vacaciones / Receso"];

  // 1. Limpiar overlay de animación de barras al terminar
  const introOverlay = document.getElementById("pbiIntroOverlay");
  if (introOverlay) {
    setTimeout(() => introOverlay.remove(), 900);
  }
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      document.getElementById("pbiIntroOverlay")?.remove();
    }
  });

  // Año automático en footer
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Referencias del DOM
  const statusEl = document.getElementById("datasetStatus");
  const fallbackBanner = document.getElementById("localFileFallback");
  const manualCsvInput = document.getElementById("manualCsvInput");
  const slicerDay = document.getElementById("slicerDay");
  const slicerShift = document.getElementById("slicerShift");
  const slicerSemester = document.getElementById("slicerSemester");
  const slicerMonth = document.getElementById("slicerMonth");
  const resetBtn = document.getElementById("resetSlicersBtn");
  const reportTabs = [...document.querySelectorAll(".report-tab")];
  const modeBtns = [...document.querySelectorAll(".mode-btn")];
  const webView = document.getElementById("webDashboardView");
  const embedView = document.getElementById("embedPowerBiView");
  const embedContainer = document.getElementById("powerBiEmbedContainer");

  let allRows = [];
  let activePage = 1;
  let chartInstance = null;

  // Helpers de negocio (replican dimensiones del modelo estrella de tu .pbix)
  function getShift(hour) {
    if (hour <= 5) return "Madrugada";
    if (hour <= 11) return "Matutino";
    if (hour <= 17) return "Vespertino";
    return "Nocturno";
  }

  function getSemesterState(isDuring, isStart) {
    if (isDuring === 0) return "Vacaciones / Receso";
    if (isStart === 1) return "Inicio de Semestre";
    return "Semestre Regular";
  }

  function getRecommendedAction(avgFlow) {
    if (avgFlow < 12) return { label: "Mantenimiento / Limpieza", cls: "badge-maint" };
    if (avgFlow >= 38) return { label: "Reforzar Entrenadores", cls: "badge-peak" };
    return { label: "Operación Estándar", cls: "badge-norm" };
  }

  function formatHour(h) {
    return `${String(h).padStart(2, "0")}:00`;
  }

  // 2. Parseo rápido de los 62,184 registros del CSV
  function parseCsvText(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      if (cols.length < 11) continue;
      const people = Number(cols[0]);
      const day = Number(cols[3]);
      const tempF = Number(cols[6]);
      const isStart = Number(cols[7]);
      const isDuring = Number(cols[8]);
      const month = Number(cols[9]);
      const hour = Number(cols[10]);

      if (!Number.isFinite(people) || !Number.isFinite(hour)) continue;
      rows.push({
        people,
        day,
        tempC: (tempF - 32) * (5 / 9),
        isStart,
        isDuring,
        semester: getSemesterState(isDuring, isStart),
        month,
        hour,
        shift: getShift(hour)
      });
    }
    return rows;
  }

  function getFilteredRows() {
    const fDay = slicerDay.value;
    const fShift = slicerShift.value;
    const fSem = slicerSemester.value;
    const fMonth = slicerMonth.value;

    return allRows.filter((r) => {
      if (fDay !== "all" && r.day !== Number(fDay)) return false;
      if (fShift !== "all" && r.shift !== fShift) return false;
      if (fSem !== "all" && r.semester !== fSem) return false;
      if (fMonth !== "all" && r.month !== Number(fMonth)) return false;
      return true;
    });
  }

  // 3. Actualización de las 5 tarjetas KPI
  function updateKpis(rows) {
    const kpiAvg = document.getElementById("kpiAvgFlow");
    const kpiMax = document.getElementById("kpiMaxOcc");
    const kpiRush = document.getElementById("kpiRushHour");
    const kpiRushSub = document.getElementById("kpiRushSub");
    const kpiMaint = document.getElementById("kpiBestMaint");
    const kpiMaintSub = document.getElementById("kpiMaintSub");
    const kpiTrainers = document.getElementById("kpiTrainers");

    if (statusEl) {
      statusEl.innerHTML = `<span class="status-dot"></span> ${rows.length.toLocaleString("es-MX")} / ${allRows.length.toLocaleString("es-MX")} registros activos`;
    }

    if (rows.length === 0) {
      kpiAvg.textContent = "—";
      kpiMax.textContent = "—";
      kpiRush.textContent = "—";
      kpiMaint.textContent = "—";
      kpiTrainers.textContent = "0";
      kpiRushSub.textContent = "sin registros en filtro";
      kpiMaintSub.textContent = "sin registros en filtro";
      return;
    }

    let sumPeople = 0;
    let maxPeople = -Infinity;
    const byHour = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      sumPeople += r.people;
      if (r.people > maxPeople) maxPeople = r.people;
      byHour[r.hour].sum += r.people;
      byHour[r.hour].count += 1;
    }

    const avgFlow = sumPeople / rows.length;
    let rushHour = -1;
    let rushVal = -Infinity;
    let maintHour = -1;
    let maintVal = Infinity;

    for (let h = 0; h < 24; h++) {
      if (byHour[h].count === 0) continue;
      const avgH = byHour[h].sum / byHour[h].count;
      if (avgH > rushVal) { rushVal = avgH; rushHour = h; }
      if (avgH < maintVal) { maintVal = avgH; maintHour = h; }
    }

    const trainersNeeded = Math.max(1, Math.ceil(avgFlow / 15));

    kpiAvg.textContent = avgFlow.toFixed(1);
    kpiMax.textContent = `${maxPeople} pers.`;
    kpiRush.textContent = rushHour >= 0 ? formatHour(rushHour) : "—";
    kpiRushSub.textContent = rushHour >= 0 ? `promedio: ${rushVal.toFixed(1)} personas` : "—";
    kpiMaint.textContent = maintHour >= 0 ? formatHour(maintHour) : "—";
    kpiMaintSub.textContent = maintHour >= 0 ? `promedio: ${maintVal.toFixed(1)} personas` : "—";
    kpiTrainers.textContent = String(trainersNeeded);
  }

  function renderTable(headers, bodyRows) {
    const table = document.getElementById("mainReportTable");
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    thead.innerHTML = `<tr>${headers.map((h) => `<th class="${h.cls || ""}">${h.label}</th>`).join("")}</tr>`;
    if (bodyRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${headers.length}" style="text-align:center; padding:24px; color:#94a3b8;">Sin datos para esta combinación de filtros.</td></tr>`;
      return;
    }
    tbody.innerHTML = bodyRows.join("");
  }

  function destroyChart() {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  }

  // Opciones comunes de estética Power BI Dark
  const baseScalesStyle = {
    ticks: { color: "#cbd5e1", font: { size: 11 } },
    grid: { color: "rgba(255, 255, 255, 0.08)" }
  };

  // =========================================================================
  // RENDERIZADO DE LAS 4 PÁGINAS DEL REPORTE
  // =========================================================================
  function renderActivePage() {
    const rows = getFilteredRows();
    updateKpis(rows);
    destroyChart();

    const ctx = document.getElementById("mainReportChart").getContext("2d");
    const titleEl = document.getElementById("chartTitle");
    const subEl = document.getElementById("chartSubtitle");
    const tagEl = document.getElementById("chartTag");
    const tTitle = document.getElementById("tableTitle");
    const tSub = document.getElementById("tableSubtitle");

    if (activePage === 1) {
      // PÁGINA 1: CURVA HORARIA PARA TURNOS Y MANTENIMIENTO
      titleEl.textContent = "Curva Horaria para Turnos y Mantenimiento";
      subEl.textContent = "Flujo promedio de personas (eje izquierdo) y entrenadores requeridos (eje derecho) por hora del día.";
      tagEl.textContent = "Líneas · Doble Eje";
      tTitle.textContent = "Matriz Horaria de Operación";
      tSub.textContent = "Distribución por hora con recomendación operativa.";

      const byHour = Array.from({ length: 24 }, () => ({ sum: 0, count: 0 }));
      rows.forEach((r) => { byHour[r.hour].sum += r.people; byHour[r.hour].count += 1; });

      const labels = byHour.map((_, h) => formatHour(h));
      const avgData = byHour.map((b) => (b.count ? Number((b.sum / b.count).toFixed(1)) : 0));
      const trainersData = avgData.map((v) => (v > 0 ? Math.max(1, Math.ceil(v / 15)) : 0));

      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Flujo Promedio (Personas)",
              data: avgData,
              borderColor: "#f2c811",
              backgroundColor: "rgba(242, 200, 17, 0.16)",
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              yAxisID: "y"
            },
            {
              label: "Entrenadores Requeridos",
              data: trainersData,
              borderColor: "#35d9f2",
              backgroundColor: "#35d9f2",
              borderDash: [5, 4],
              stepped: true,
              borderWidth: 2,
              pointRadius: 2.5,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { labels: { color: "#f8fafc" } } },
          scales: {
            x: baseScalesStyle,
            y: { ...baseScalesStyle, position: "left", title: { display: true, text: "Personas promedio", color: "#f2c811" } },
            y1: { ...baseScalesStyle, position: "right", grid: { drawOnChartArea: false }, suggestedMax: 5, title: { display: true, text: "Entrenadores", color: "#35d9f2" } }
          }
        }
      });

      const tableRows = [];
      for (let h = 0; h < 24; h++) {
        if (byHour[h].count === 0) continue;
        const avg = avgData[h];
        const act = getRecommendedAction(avg);
        tableRows.push(`
          <tr>
            <td><strong>${formatHour(h)}</strong></td>
            <td class="num-col">${avg.toFixed(1)}</td>
            <td class="num-col">${trainersData[h]}</td>
            <td><span class="badge-action ${act.cls}">${act.label}</span></td>
          </tr>
        `);
      }
      renderTable(
        [
          { label: "Hora" },
          { label: "Flujo Prom.", cls: "num-col" },
          { label: "Entrenadores", cls: "num-col" },
          { label: "Acción Operativa" }
        ],
        tableRows
      );
    } else if (activePage === 2) {
      // PÁGINA 2: COMPARATIVA SEMANAL Y RÉGIMEN ACADÉMICO
      titleEl.textContent = "Comparativa Semanal y Régimen Académico";
      subEl.textContent = "Flujo promedio por día de la semana segmentado por periodo académico.";
      tagEl.textContent = "Columnas Agrupadas";
      tTitle.textContent = "Matriz Día × Régimen Académico";
      tSub.textContent = "Afluencia promedio registrada por día.";

      const matrix = DAYS.map(() => ({
        "Inicio de Semestre": { sum: 0, count: 0 },
        "Semestre Regular": { sum: 0, count: 0 },
        "Vacaciones / Receso": { sum: 0, count: 0 }
      }));

      rows.forEach((r) => {
        matrix[r.day][r.semester].sum += r.people;
        matrix[r.day][r.semester].count += 1;
      });

      const colors = {
        "Inicio de Semestre": "#f472b6",
        "Semestre Regular": "#f2c811",
        "Vacaciones / Receso": "#35d9f2"
      };

      const datasets = SEMESTERS.map((sem) => ({
        label: sem,
        data: matrix.map((m) => (m[sem].count ? Number((m[sem].sum / m[sem].count).toFixed(1)) : 0)),
        backgroundColor: colors[sem],
        borderRadius: 6
      }));

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: { labels: DAYS, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#f8fafc" } } },
          scales: { x: baseScalesStyle, y: { ...baseScalesStyle, beginAtZero: true } }
        }
      });

      const tableRows = DAYS.map((dayName, idx) => {
        const vals = SEMESTERS.map((sem) => {
          const cell = matrix[idx][sem];
          return cell.count ? (cell.sum / cell.count).toFixed(1) : "—";
        });
        return `
          <tr>
            <td><strong>${dayName}</strong></td>
            <td class="num-col">${vals[0]}</td>
            <td class="num-col">${vals[1]}</td>
            <td class="num-col">${vals[2]}</td>
          </tr>
        `;
      });

      renderTable(
        [
          { label: "Día" },
          { label: "Inicio Sem.", cls: "num-col" },
          { label: "Regular", cls: "num-col" },
          { label: "Receso", cls: "num-col" }
        ],
        tableRows
      );
    } else if (activePage === 3) {
      // PÁGINA 3: ESTACIONALIDAD ANUAL Y PICOS DE INICIO DE CLASES
      titleEl.textContent = "Estacionalidad Anual y Picos de Inicio de Clases";
      subEl.textContent = "Comparación mensual entre el flujo promedio general y el flujo específico al inicio de semestre.";
      tagEl.textContent = "Gráfico de Áreas";
      tTitle.textContent = "Resumen Mensual de Estacionalidad";
      tSub.textContent = "Diferencial de demanda en arranque de clases.";

      const byMonth = Array.from({ length: 12 }, () => ({ sum: 0, count: 0, startSum: 0, startCount: 0 }));
      rows.forEach((r) => {
        const m = byMonth[r.month - 1];
        m.sum += r.people;
        m.count += 1;
        if (r.isStart === 1) {
          m.startSum += r.people;
          m.startCount += 1;
        }
      });

      const generalData = byMonth.map((m) => (m.count ? Number((m.sum / m.count).toFixed(1)) : 0));
      const startData = byMonth.map((m) => (m.startCount ? Number((m.startSum / m.startCount).toFixed(1)) : null));

      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: MONTHS,
          datasets: [
            {
              label: "Flujo Promedio General",
              data: generalData,
              borderColor: "#35d9f2",
              backgroundColor: "rgba(53, 217, 242, 0.18)",
              fill: true,
              tension: 0.3,
              borderWidth: 2.5
            },
            {
              label: "Flujo Inicio de Semestre",
              data: startData,
              borderColor: "#f2c811",
              backgroundColor: "rgba(242, 200, 17, 0.22)",
              fill: true,
              tension: 0.3,
              borderWidth: 2.5,
              spanGaps: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#f8fafc" } } },
          scales: { x: baseScalesStyle, y: { ...baseScalesStyle, beginAtZero: true } }
        }
      });

      const tableRows = MONTHS.map((mName, idx) => {
        const m = byMonth[idx];
        const gen = m.count ? (m.sum / m.count).toFixed(1) : "—";
        const st = m.startCount ? (m.startSum / m.startCount).toFixed(1) : "—";
        const delta = m.count && m.startCount
          ? `${((m.startSum / m.startCount) - (m.sum / m.count) >= 0 ? "+" : "")}${((m.startSum / m.startCount) - (m.sum / m.count)).toFixed(1)}`
          : "—";
        return `
          <tr>
            <td><strong>${mName}</strong></td>
            <td class="num-col">${gen}</td>
            <td class="num-col">${st}</td>
            <td class="num-col">${delta}</td>
          </tr>
        `;
      });

      renderTable(
        [
          { label: "Mes" },
          { label: "Flujo General", cls: "num-col" },
          { label: "Inicio Sem.", cls: "num-col" },
          { label: "Variación", cls: "num-col" }
        ],
        tableRows
      );
    } else {
      // PÁGINA 4: CLIMÁTICA Y DISTRIBUCIÓN POR TURNO
      titleEl.textContent = "Clima y Distribución por Turno de Personal";
      subEl.textContent = "Relación entre afluencia promedio y temperatura media ambiental (°C) por turno operativo.";
      tagEl.textContent = "Barras + Temperatura";
      tTitle.textContent = "Matriz Operativa por Turno";
      tSub.textContent = "Flujo, temperatura media y acción recomendada.";

      const byShift = {};
      SHIFTS.forEach((s) => { byShift[s] = { sumP: 0, sumT: 0, count: 0 }; });
      rows.forEach((r) => {
        byShift[r.shift].sumP += r.people;
        byShift[r.shift].sumT += r.tempC;
        byShift[r.shift].count += 1;
      });

      const flowData = SHIFTS.map((s) => (byShift[s].count ? Number((byShift[s].sumP / byShift[s].count).toFixed(1)) : 0));
      const tempData = SHIFTS.map((s) => (byShift[s].count ? Number((byShift[s].sumT / byShift[s].count).toFixed(1)) : 0));

      chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: SHIFTS,
          datasets: [
            {
              label: "Flujo Promedio (Personas)",
              data: flowData,
              backgroundColor: "#f2c811",
              borderRadius: 8,
              yAxisID: "y"
            },
            {
              label: "Temperatura Media (°C)",
              data: tempData,
              backgroundColor: "#35d9f2",
              borderRadius: 8,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: "#f8fafc" } } },
          scales: {
            x: baseScalesStyle,
            y: { ...baseScalesStyle, position: "left", beginAtZero: true, title: { display: true, text: "Personas", color: "#f2c811" } },
            y1: { ...baseScalesStyle, position: "right", beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: "Temp (°C)", color: "#35d9f2" } }
          }
        }
      });

      const tableRows = SHIFTS.map((s, idx) => {
        const b = byShift[s];
        const avgP = flowData[idx];
        const avgT = tempData[idx];
        const act = getRecommendedAction(avgP);
        return `
          <tr>
            <td><strong>${s}</strong></td>
            <td class="num-col">${b.count ? avgP.toFixed(1) : "—"}</td>
            <td class="num-col">${b.count ? `${avgT.toFixed(1)} °C` : "—"}</td>
            <td><span class="badge-action ${act.cls}">${b.count ? act.label : "Sin datos"}</span></td>
          </tr>
        `;
      });

      renderTable(
        [
          { label: "Turno" },
          { label: "Flujo Prom.", cls: "num-col" },
          { label: "Temp. Media", cls: "num-col" },
          { label: "Acción Recomendada" }
        ],
        tableRows
      );
    }
  }

  // 4. Renderizar contenedor de Power BI Service (iframe opcional)
  function initEmbedView() {
    if (!embedContainer) return;
    if (POWERBI_EMBED_URL.trim().startsWith("https://")) {
      embedContainer.innerHTML = `
        <iframe
          title="Aglomeración en el gimnasio del campus — Power BI"
          src="${POWERBI_EMBED_URL.trim()}"
          allowFullScreen="true">
        </iframe>
      `;
    } else {
      embedContainer.innerHTML = `
        <div class="pbi-embed-placeholder">
          <h2>Visor Nativo de Power BI Service listo para activar</h2>
          <p>El archivo <code>.pbix</code> ya está disponible para descarga directa en el botón superior y todas sus páginas son 100% interactivas en la pestaña <strong>Dashboard Interactivo Web</strong>.</p>
          <p>Si deseas activar adicionalmente el <code>&lt;iframe&gt;</code> oficial en la nube de Microsoft:</p>
          <ol>
            <li>Publica tu <code>.pbix</code> en <strong>Power BI Service</strong> (requiere cuenta institucional o corporativa con <em>Publicar en la web</em> habilitado).</li>
            <li>En Power BI Service entra a <em>Archivo → Insertar informe → Publicar en la web (público)</em> y copia la URL del atributo <code>src</code>.</li>
            <li>Pega esa URL dentro de <code>const POWERBI_EMBED_URL = "..."</code> en la línea 10 de <code>js/proyecto-powerbi.js</code>.</li>
          </ol>
        </div>
      `;
    }
  }

  // 5. Eventos de interacción
  [slicerDay, slicerShift, slicerSemester, slicerMonth].forEach((el) => {
    el?.addEventListener("change", renderActivePage);
  });

  resetBtn?.addEventListener("click", () => {
    slicerDay.value = "all";
    slicerShift.value = "all";
    slicerSemester.value = "all";
    slicerMonth.value = "all";
    renderActivePage();
  });

  reportTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      activePage = Number(btn.dataset.page);
      reportTabs.forEach((t) => t.classList.toggle("is-active", t === btn));
      renderActivePage();
    });
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      modeBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      webView.hidden = mode !== "web";
      embedView.hidden = mode !== "embed";
    });
  });

  // Respaldo de carga manual si se abre por file://
  manualCsvInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      allRows = parseCsvText(String(reader.result || ""));
      fallbackBanner.hidden = true;
      renderActivePage();
    };
    reader.readAsText(file, "UTF-8");
  });

  // 6. Carga automática del CSV
  async function loadDataset() {
    try {
      const response = await fetch(CSV_PATH);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      allRows = parseCsvText(text);
      renderActivePage();
    } catch (error) {
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-dot" style="background:#f59e0b;"></span> Abre con Live Server o carga el CSV`;
      }
      if (fallbackBanner) fallbackBanner.hidden = false;
    }
  }

  initEmbedView();
  loadDataset();
});