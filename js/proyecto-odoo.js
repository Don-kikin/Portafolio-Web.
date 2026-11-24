/* js/proyecto-odoo.js — Sandbox fiel a erp_finance_ops + visor de código fuente */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("currentYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // =========================================================================
  // 1. SIMULADOR DE REGLAS ORM (models/finance_order.py)
  // =========================================================================
  const elFolio = document.getElementById("simFolio");
  const elDept = document.getElementById("simDept");
  const elQty = document.getElementById("simQty");
  const elCostUsd = document.getElementById("simCostUsd");
  const elRate = document.getElementById("simRate");
  const elSaleMxn = document.getElementById("simSaleMxn");
  const elTotalCost = document.getElementById("simTotalCost");
  const elMarginPct = document.getElementById("simMarginPct");
  const elStateBadge = document.getElementById("simStateBadge");
  const elAlert = document.getElementById("simAlertBox");
  const elChatter = document.getElementById("simChatterLog");

  let currentState = "draft";

  const BASE_ORDERS = [
    { id: 1, folio: "OC-2026-001", proveedor: "Tecnología Industrial MX", area: "compras", costo_total_mxn: 12845.63, precio_venta_mxn: 18500.0, margen_pct: 30.56, estatus: "approved" },
    { id: 2, folio: "OC-2026-002", proveedor: "Distribuidora del Norte", area: "inventario", costo_total_mxn: 10881.0, precio_venta_mxn: 15200.0, margen_pct: 28.41, estatus: "approved" },
    { id: 3, folio: "OC-2026-003", proveedor: "Suministros Globales SA", area: "manufactura", costo_total_mxn: 19142.5, precio_venta_mxn: 24800.0, margen_pct: 22.81, estatus: "review" }
  ];

  function addChatter(msg) {
    const li = document.createElement("li");
    const time = new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    li.innerHTML = `<code>[${time}]</code> ${msg}`;
    elChatter.prepend(li);
  }

  function setAlert(html, type = "") {
    elAlert.className = `sim-alert ${type}`.trim();
    elAlert.innerHTML = html;
  }

  function setStateBadge(state) {
    currentState = state;
    const map = {
      draft: { text: "Borrador", cls: "state-draft" },
      review: { text: "En Revisión", cls: "state-review" },
      approved: { text: "Aprobado", cls: "state-approved" }
    };
    elStateBadge.textContent = map[state].text;
    elStateBadge.className = `state-pill ${map[state].cls}`;
  }

  function computeFinancials() {
    const qty = Number(elQty.value);
    const costUsd = Number(elCostUsd.value);
    const rate = Number(elRate.value);
    const sale = Number(elSaleMxn.value);

    const totalCost = Math.round(qty * costUsd * rate * 100) / 100;
    const margin = sale > 0 ? Math.round(((sale - totalCost) / sale) * 10000) / 100 : 0;

    elTotalCost.textContent = `$${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN`;
    elMarginPct.textContent = `${margin.toFixed(2)}%`;
    elMarginPct.style.color = margin >= 15 ? "#4ade80" : "#f87171";

    return { qty, costUsd, rate, sale, totalCost, margin };
  }

  [elQty, elCostUsd, elRate, elSaleMxn].forEach((input) => {
    input?.addEventListener("input", computeFinancials);
  });

  document.getElementById("btnFetchRate")?.addEventListener("click", async () => {
    setAlert("Consultando API externa <code>https://open.er-api.com/v6/latest/USD</code>...");
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      const mxn = Number(data?.rates?.MXN);
      if (!mxn) throw new Error("Rate missing");
      elRate.value = mxn.toFixed(4);
      computeFinancials();
      setAlert(`Tipo de cambio actualizado en vivo desde API externa: <strong>1 USD = ${mxn.toFixed(4)} MXN</strong>.`, "is-success");
      addChatter(`API externa consultada: 1 USD = <strong>${mxn.toFixed(4)} MXN</strong>.`);
    } catch {
      elRate.value = "20.2500";
      computeFinancials();
      setAlert("Sin conexión externa en navegador: se aplicó tasa de respaldo <strong>20.2500 MXN</strong>.", "");
      addChatter("Tasa de respaldo aplicada: <strong>20.2500 MXN</strong>.");
    }
  });

  document.getElementById("btnSubmitReview")?.addEventListener("click", () => {
    const { qty, costUsd, rate } = computeFinancials();
    if (qty <= 0 || costUsd <= 0 || rate <= 0) {
      setAlert("<strong>ValidationError (@api.constrains):</strong> Cantidad, costo USD y tipo de cambio deben ser mayores a cero.", "is-error");
      return;
    }
    setStateBadge("review");
    setAlert("Orden enviada a <strong>En Revisión</strong>. Ahora intenta aprobarla para validar la política de margen.", "");
    addChatter("Estatus cambiado: Borrador → <strong>En Revisión</strong>.");
  });

  document.getElementById("btnApproveOrder")?.addEventListener("click", () => {
    const { sale, margin } = computeFinancials();
    if (currentState !== "review") {
      setAlert("Primero debes enviar la orden a <strong>En Revisión</strong> antes de aprobarla.", "is-error");
      return;
    }
    if (sale > 0 && margin < 15.0) {
      setAlert(`<strong>UserError bloqueado en Python:</strong> Margen insuficiente (${margin.toFixed(2)}%). La política exige al menos 15% de margen bruto para aprobar.`, "is-error");
      addChatter(`Intento de aprobación bloqueado por margen insuficiente (${margin.toFixed(2)}%).`);
      return;
    }
    setStateBadge("approved");
    setAlert(`Orden <strong>${elFolio.value}</strong> aprobada correctamente con margen de <strong>${margin.toFixed(2)}%</strong>. Ya aparece disponible en la API REST.`, "is-success");
    addChatter(`Orden aprobada con margen de <strong>${margin.toFixed(2)}%</strong>.`);
  });

  document.getElementById("btnResetOrder")?.addEventListener("click", () => {
    setStateBadge("draft");
    setAlert("Orden restablecida a <strong>Borrador</strong>.");
    addChatter("Orden devuelta a estado <strong>Borrador</strong>.");
  });

  computeFinancials();

  // =========================================================================
  // 2. CONSOLA DE PRUEBA API REST (controllers/api.py)
  // =========================================================================
  const apiKeyInput = document.getElementById("apiKeyInput");
  const apiStateFilter = document.getElementById("apiStateFilter");
  const apiStatusCode = document.getElementById("apiStatusCode");
  const apiRequestLine = document.getElementById("apiRequestLine");
  const apiResponseOutput = document.getElementById("apiResponseOutput");

  function executeMockApi(forceNoKey = false) {
    const key = forceNoKey ? "" : (apiKeyInput.value || "").trim();
    const state = apiStateFilter.value;
    const queryStr = state ? `?state=${state}` : "";
    apiRequestLine.textContent = `GET /api/v1/ordenes${queryStr}   |   X-API-Key: ${key || "(ausente)"}`;

    if (key !== "integra-demo-key-2026") {
      apiStatusCode.textContent = "401 Unauthorized";
      apiStatusCode.className = "http-badge http-401";
      apiResponseOutput.textContent = JSON.stringify(
        { error: "Acceso denegado. X-API-Key inválida o ausente." },
        null,
        2
      );
      return;
    }

    const currentCalc = computeFinancials();
    const liveOrder = {
      id: 4,
      folio: elFolio.value || "OC-2026-004",
      proveedor: "Logística y Empaques CDMX",
      area: elDept.value,
      costo_total_mxn: currentCalc.totalCost,
      precio_venta_mxn: currentCalc.sale,
      margen_pct: currentCalc.margin,
      estatus: currentState
    };

    const all = [...BASE_ORDERS, liveOrder];
    const filtered = state ? all.filter((o) => o.estatus === state) : all;

    apiStatusCode.textContent = "200 OK";
    apiStatusCode.className = "http-badge http-200";
    apiResponseOutput.textContent = JSON.stringify(
      { total: filtered.length, data: filtered },
      null,
      2
    );
  }

  document.getElementById("btnRunApiValid")?.addEventListener("click", () => executeMockApi(false));
  document.getElementById("btnRunApiInvalid")?.addEventListener("click", () => executeMockApi(true));
  executeMockApi(false);

 // =========================================================================
  // 3. VISOR DE CÓDIGO REAL DEL REPOSITORIO
  // =========================================================================
  const CODE_SNIPPETS = {
    model: [
      "class FinanceOrder(models.Model):",
      '    _name = "erp.finance.order"',
      '    _description = "Orden de Control Financiero y Compras"',
      '    _inherit = ["mail.thread", "mail.activity.mixin"]',
      "",
      '    total_cost_mxn = fields.Float(compute="_compute_financials", store=True, digits=(12, 2))',
      '    gross_margin_pct = fields.Float(compute="_compute_financials", store=True, digits=(5, 2))',
      "",
      '    @api.depends("quantity", "unit_cost_usd", "exchange_rate", "sale_price_mxn")',
      "    def _compute_financials(self):",
      "        for rec in self:",
      "            total_cost = rec.quantity * rec.unit_cost_usd * rec.exchange_rate",
      "            rec.total_cost_mxn = round(total_cost, 2)",
      "            rec.gross_margin_pct = (",
      "                round(((rec.sale_price_mxn - total_cost) / rec.sale_price_mxn) * 100, 2)",
      "                if rec.sale_price_mxn > 0 else 0.0",
      "            )",
      "",
      "    def action_approve(self):",
      "        for rec in self:",
      "            if rec.sale_price_mxn > 0 and rec.gross_margin_pct < 15.0:",
      '                raise UserError(f"Margen insuficiente ({rec.gross_margin_pct:.2f}%). Mínimo requerido: 15%.")',
      '            rec.state = "approved"'
    ].join("\n"),

    api: [
      "class FinanceOrderAPIController(http.Controller):",
      '    @http.route("/api/v1/ordenes", type="http", auth="public", methods=["GET"], csrf=False)',
      "    def get_orders(self, **kwargs):",
      '        api_key = request.httprequest.headers.get("X-API-Key")',
      "        if api_key != API_KEY_DEMO:",
      '            return Response(json.dumps({"error": "Acceso denegado."}), content_type="application/json", status=401)',
      "",
      '        domain = [("state", "=", kwargs["state"])] if kwargs.get("state") else []',
      '        orders = request.env["erp.finance.order"].sudo().search(domain, limit=100)',
      '        payload = [{"id": o.id, "folio": o.name, "margen_pct": o.gross_margin_pct, "estatus": o.state} for o in orders]',
      '        return Response(json.dumps({"total": len(payload), "data": payload}), content_type="application/json", status=200)'
    ].join("\n"),

    docker: [
      "services:",
      "  db:",
      "    image: postgres:15",
      "    container_name: odoo_postgres",
      "    environment:",
      "      - POSTGRES_DB=postgres",
      "      - POSTGRES_USER=odoo",
      "      - POSTGRES_PASSWORD=odoo_pass_seguro",
      "    volumes:",
      "      - odoo-db-data:/var/lib/postgresql/data",
      "  odoo:",
      "    image: odoo:17.0",
      "    container_name: odoo_app",
      "    depends_on: [db]",
      '    ports: ["8069:8069"]',
      "    volumes:",
      "      - odoo-web-data:/var/lib/odoo",
      "      - ./config:/etc/odoo",
      "      - ./addons:/mnt/extra-addons"
    ].join("\n"),

    backup: [
      "#!/usr/bin/env bash",
      "set -euo pipefail",
      'TIMESTAMP=$(date +"%Y%m%d_%H%M%S")',
      "mkdir -p ./backups",
      "",
      "# 1. Respaldo binario de PostgreSQL",
      'docker exec odoo_postgres pg_dump -U odoo -F c -f "/tmp/erp_finance_${TIMESTAMP}.dump" erp_finance_db',
      'docker cp "odoo_postgres:/tmp/erp_finance_${TIMESTAMP}.dump" "./backups/erp_finance_${TIMESTAMP}.dump"',
      "",
      "# 2. Respaldo del filestore de Odoo",
      'docker run --rm --volumes-from odoo_app -v "$(pwd)/backups:/backup" ubuntu \\',
      '  tar czf "/backup/filestore_${TIMESTAMP}.tar.gz" /var/lib/odoo/filestore'
    ].join("\n")
  };

  const codeTarget = document.getElementById("codeDisplayTarget");
  const codeTabs = [...document.querySelectorAll(".code-tab")];

  function showCodeTab(key) {
    if (codeTarget) codeTarget.textContent = CODE_SNIPPETS[key] || "";
  }

  codeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      codeTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      showCodeTab(tab.dataset.code);
    });
  });
  showCodeTab("model");
});