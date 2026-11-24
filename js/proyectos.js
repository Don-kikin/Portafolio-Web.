/* js/proyectos.js — Filtros del catálogo y actividad en vivo de GitHub */
"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // 1. Filtrado de tarjetas de proyectos
  const filterButtons = $$(".filter-button");
  const projectCards = $$(".project-card");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      projectCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(/\s+/);
        const show = filter === "todos" || categories.includes(filter);
        card.hidden = !show;
        card.style.display = show ? "flex" : "none";
      });
    });
  });

  // 2. Consulta segura a la API pública de GitHub (@Don-kikin)
  async function fetchGitHubStatus() {
    const statusElement = $("#githubStatus");
    if (!statusElement) return;

    const setFallback = (label, href) => {
      statusElement.replaceChildren();
      const dot = document.createElement("i");
      dot.className = "status-dot";
      statusElement.appendChild(dot);
      statusElement.appendChild(document.createTextNode(" "));

      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = label;
        statusElement.appendChild(link);
      } else {
        statusElement.appendChild(document.createTextNode(label));
      }
    };

    try {
      const response = await fetch("https://api.github.com/users/Don-kikin/events/public");
      if (!response.ok) throw new Error("GitHub API unavailable");

      const events = await response.json();
      const pushEvent = events.find((e) => e.type === "PushEvent" && e.payload?.commits?.length > 0);

      if (pushEvent) {
        const lastCommit = pushEvent.payload.commits[0];
        const repoName = pushEvent.repo.name;
        const rawMsg = lastCommit.message.split("\n")[0];
        const shortMsg = rawMsg.length > 42 ? `${rawMsg.substring(0, 42)}...` : rawMsg;

        statusElement.replaceChildren();
        const dot = document.createElement("i");
        dot.className = "status-dot";
        const link = document.createElement("a");
        link.href = `https://github.com/${repoName}/commit/${lastCommit.sha}`;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.title = repoName;
        link.textContent = shortMsg;

        statusElement.append(dot, document.createTextNode(" Último commit: "), link);
      } else {
        setFallback("GitHub activo (@Don-kikin)", "https://github.com/Don-kikin");
      }
    } catch {
      setFallback("GitHub: @Don-kikin", "https://github.com/Don-kikin");
    }
  }

  document.addEventListener("DOMContentLoaded", fetchGitHubStatus);
})();