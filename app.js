/*
  Until We Meet — app.js
  Requires content.js to load first.
*/
(() => {
  "use strict";

  const CONTENT = window.UTM_CONTENT;
  if (!CONTENT || !Array.isArray(CONTENT.days)) {
    document.addEventListener("DOMContentLoaded", () => {
      const main = document.getElementById("app");
      if (main) main.innerHTML = '<div class="error-card">Today’s content could not be loaded. Please refresh the app.</div>';
    });
    return;
  }

  const MS_DAY = 86400000;
  const byDate = new Map(CONTENT.days.map(entry => [entry.date, entry]));
  const FAVORITES_KEY = "until-we-meet:favorites:v1";

  function parseLocalISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }

  function isoLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function todayISO() {
    return isoLocal(new Date());
  }

  function dayDiff(aISO, bISO) {
    return Math.round((parseLocalISO(bISO) - parseLocalISO(aISO)) / MS_DAY);
  }

  function formatLongDate(iso) {
    return parseLocalISO(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
  }

  function formatShortDate(iso) {
    return parseLocalISO(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric"
    });
  }

  function getFavorites() {
    try {
      const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites(set) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...set]));
  }

  function isFavorite(iso) {
    return getFavorites().has(iso);
  }

  function toggleFavorite(iso) {
    const favorites = getFavorites();
    favorites.has(iso) ? favorites.delete(iso) : favorites.add(iso);
    saveFavorites(favorites);
    return favorites.has(iso);
  }

  function clampToContent(iso) {
    if (iso < CONTENT.anchorDate) return CONTENT.anchorDate;
    if (iso > CONTENT.contentThrough) return CONTENT.contentThrough;
    return iso;
  }

  function currentContentDate() {
    return clampToContent(todayISO());
  }

  function countdownFor(iso) {
    return Math.max(0, dayDiff(iso, CONTENT.estimatedDueDate));
  }

  function gestationalLabel(entry) {
    return `${entry.week} weeks, ${entry.day} day${entry.day === 1 ? "" : "s"}`;
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[ch]));
  }

  function sizeEmoji(size = "") {
    const s = size.toLowerCase();
    const map = [
      ["apricot","🍑"],["fig","🟣"],["plum","🟣"],["peach","🍑"],["kiwi","🥝"],
      ["apple","🍎"],["avocado","🥑"],["pomegranate","🔴"],["pepper","🫑"],
      ["tomato","🍅"],["banana","🍌"],["carrot","🥕"],["potato","🍠"],
      ["mango","🥭"],["corn","🌽"],["zucchini","🥒"],["cucumber","🥒"],
      ["cauliflower","🥦"],["eggplant","🍆"],["squash","🎃"],["cabbage","🥬"],
      ["coconut","🥥"],["pineapple","🍍"],["cantaloupe","🍈"],["honeydew","🍈"],
      ["lettuce","🥬"],["leek","🌿"],["rhubarb","🌿"],["watermelon","🍉"],["pumpkin","🎃"]
    ];
    const hit = map.find(([key]) => s.includes(key));
    return hit ? hit[1] : "♡";
  }

  function themeFor(iso, entry) {
    if (entry?.theme && entry.theme !== "default") return entry.theme;
    const d = parseLocalISO(iso);
    const m = d.getMonth() + 1;
    if (m === 10) return "autumn";
    if (m === 11) return "thanksgiving-season";
    if (m === 12) return "winter";
    if (m === 2) return "valentine-season";
    if (m >= 3 && m <= 5) return "spring";
    return "default";
  }

  function setTheme(iso, entry) {
    document.documentElement.dataset.theme = themeFor(iso, entry);
  }

  function card(icon, eyebrow, body, extraClass = "") {
    return `
      <section class="content-card ${extraClass}">
        <div class="card-icon" aria-hidden="true">${icon}</div>
        <div>
          <div class="eyebrow">${escapeHTML(eyebrow)}</div>
          <div class="card-copy">${escapeHTML(body)}</div>
        </div>
      </section>`;
  }

  function renderDay(iso, { archived = false } = {}) {
    const entry = byDate.get(iso);
    if (!entry) return;
    setTheme(iso, entry);

    const app = document.getElementById("app");
    const milestone = CONTENT.milestones?.[iso];
    const fav = isFavorite(iso);
    const countdown = countdownFor(iso);

    app.innerHTML = `
      <div class="page today-page">
        ${archived ? `<button class="back-button" data-action="journey">← Our Journey</button>` : ""}
        <header class="hero">
          <div class="hero-kicker">${archived ? escapeHTML(formatLongDate(iso)) : "Good morning, Christina"}</div>
          <h1>${archived ? escapeHTML(formatShortDate(iso)) : `We meet in ${countdown} days <span aria-hidden="true">♥</span>`}</h1>
          <div class="gestation">${escapeHTML(gestationalLabel(entry))}</div>
          <button class="favorite-button ${fav ? "is-favorite" : ""}" data-favorite="${iso}"
                  aria-label="${fav ? "Remove from favorites" : "Add to favorites"}"
                  aria-pressed="${fav ? "true" : "false"}">♥</button>
        </header>

        ${milestone ? `
          <section class="milestone-card">
            <div class="milestone-sparkle">✦</div>
            <div><div class="eyebrow">A little milestone</div>
            <h2>${escapeHTML(milestone.title)}</h2>
            <p>${escapeHTML(milestone.message)}</p></div>
          </section>` : ""}

        <section class="size-card">
          <div class="size-visual" aria-hidden="true">${sizeEmoji(entry.babySize)}</div>
          <div>
            <div class="eyebrow">Today, baby is about the size of a</div>
            <h2>${escapeHTML(entry.babySize)}</h2>
          </div>
        </section>

        ${entry.development ? card("✧", "Growing today", entry.development, "development-card") : ""}
        ${card("♡", "For Christina", entry.affirmation, "affirmation-card")}
        ${card("☼", "A Little Wisdom", entry.wisdom, "wisdom-card")}
        ${card(entry.from === "Oliver" ? "🐾" : "♥", `From ${entry.from}`, entry.personalMessage, entry.from === "Oliver" ? "oliver-card" : "casey-card")}

        <div class="page-spacer"></div>
      </div>`;

    bindCommon();
  }

  function journeyEntries(filter) {
    const now = currentContentDate();
    const favorites = getFavorites();
    return CONTENT.days
      .filter(entry => entry.date <= now)
      .filter(entry => filter !== "favorites" || favorites.has(entry.date))
      .slice()
      .reverse();
  }

  function renderJourney(filter = "all") {
    const app = document.getElementById("app");
    const entries = journeyEntries(filter);
    setTheme(currentContentDate(), byDate.get(currentContentDate()));

    app.innerHTML = `
      <div class="page journey-page">
        <header class="journey-header">
          <div class="hero-kicker">Until We Meet</div>
          <h1>Our Journey</h1>
          <p>Every day we've shared along the way.</p>
        </header>

        <div class="filter-tabs" role="group" aria-label="Journey filter">
          <button class="${filter === "all" ? "active" : ""}" data-filter="all">All Days</button>
          <button class="${filter === "favorites" ? "active" : ""}" data-filter="favorites">♥ Favorites</button>
        </div>

        <div class="journey-list">
          ${entries.length ? entries.map(entry => `
            <button class="journey-row" data-open-day="${entry.date}">
              <span class="journey-date">
                <strong>${escapeHTML(formatShortDate(entry.date))}</strong>
                <small>${entry.week}w${entry.day}d · ${escapeHTML(entry.babySize)}</small>
              </span>
              <span class="journey-meta">
                ${isFavorite(entry.date) ? '<span class="row-heart" aria-label="Favorite">♥</span>' : ""}
                <span aria-hidden="true">›</span>
              </span>
            </button>`).join("") :
            `<div class="empty-state">${filter === "favorites" ? "Favorite a day and it will appear here." : "Your journey begins here."}</div>`}
        </div>
        <div class="page-spacer"></div>
      </div>`;

    document.querySelectorAll("[data-filter]").forEach(btn =>
      btn.addEventListener("click", () => renderJourney(btn.dataset.filter))
    );
    document.querySelectorAll("[data-open-day]").forEach(btn =>
      btn.addEventListener("click", () => renderDay(btn.dataset.openDay, { archived: true }))
    );
  }

  function bindCommon() {
    document.querySelectorAll("[data-favorite]").forEach(btn => {
      btn.addEventListener("click", () => {
        const active = toggleFavorite(btn.dataset.favorite);
        btn.classList.toggle("is-favorite", active);
        btn.setAttribute("aria-pressed", String(active));
        btn.setAttribute("aria-label", active ? "Remove from favorites" : "Add to favorites");
      });
    });
    document.querySelectorAll('[data-action="journey"]').forEach(btn =>
      btn.addEventListener("click", () => {
        setActiveNav("journey");
        renderJourney();
      })
    );
  }

  function setActiveNav(which) {
    document.querySelectorAll("[data-nav]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.nav === which);
      btn.setAttribute("aria-current", btn.dataset.nav === which ? "page" : "false");
    });
  }

  function bindNavigation() {
    const todayBtn = document.querySelector('[data-nav="today"]');
    const journeyBtn = document.querySelector('[data-nav="journey"]');

    todayBtn?.addEventListener("click", () => {
      setActiveNav("today");
      renderDay(currentContentDate());
    });
    journeyBtn?.addEventListener("click", () => {
      setActiveNav("journey");
      renderJourney();
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {
          // App still works online if service-worker registration fails.
        });
      });
    }
  }

  function init() {
    bindNavigation();
    setActiveNav("today");
    renderDay(currentContentDate());
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
