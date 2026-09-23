/*
 * Until We Meet — app.js
 * Final V1 screen architecture
 * Today + Our Journey
 * Weekly artwork: gestational weeks 10–41
 * Oliver artwork: 12 rotating poses
 */
(() => {
  "use strict";

  const CONTENT = window.UTM_CONTENT;
  const DAY_MS = 86400000;
  const FAVORITES_KEY = "until-we-meet:favorites:v1";

  if (!CONTENT || !Array.isArray(CONTENT.days)) {
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.getElementById("app");
      if (root) root.innerHTML =
        '<div class="error-card">Today’s content could not be loaded. Please refresh.</div>';
    });
    return;
  }

  const entries = new Map(CONTENT.days.map(day => [day.date, day]));

  function parseDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  function toISO(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function dayDifference(fromISO, toISO) {
    return Math.round((parseDate(toISO) - parseDate(fromISO)) / DAY_MS);
  }

  function todayISO() {
    return toISO(new Date());
  }

  function currentContentDate() {
    const today = todayISO();
    if (today < CONTENT.anchorDate) return CONTENT.anchorDate;
    if (today > CONTENT.contentThrough) return CONTENT.contentThrough;
    return today;
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    })[char]);
  }

  function formatLongDate(iso) {
    return parseDate(iso).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
  }

  function formatShortDate(iso) {
    return parseDate(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric"
    });
  }

  function getFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
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
    const set = getFavorites();
    set.has(iso) ? set.delete(iso) : set.add(iso);
    saveFavorites(set);
    return set.has(iso);
  }

  function weekArtwork(entry) {
    const week = Math.min(41, Math.max(10, Number(entry.week)));
    return `./art/header-week-${String(week).padStart(2, "0")}.webp`;
  }

  function oliverPose(entry, iso) {
    // Twelve poses, selected deterministically so archived days never change.
    const dayIndex = Math.max(0, dayDifference(CONTENT.anchorDate, iso));
    const pose = ((dayIndex * 5 + Number(entry.week) + Number(entry.day)) % 12) + 1;
    return `./art/oliver-${String(pose).padStart(2, "0")}.webp`;
  }

  function seasonFor(iso) {
    const date = parseDate(iso);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (month === 10 && day >= 24) return "halloween";
    if (month === 11) return "autumn";
    if (month === 12 && day >= 10 && day <= 27) return "holiday";
    if (month === 12 || month === 1) return "winter";
    if (month === 2 && day >= 7 && day <= 16) return "valentine";
    if (month >= 2 && month <= 5) return "spring";
    return "early-fall";
  }

  function sizeEmoji(size = "") {
    const text = size.toLowerCase();
    const options = [
      ["apricot", "🍑"], ["fig", "🟣"], ["plum", "🟣"], ["peach", "🍑"],
      ["kiwi", "🥝"], ["apple", "🍎"], ["avocado", "🥑"], ["pomegranate", "🔴"],
      ["pepper", "🫑"], ["tomato", "🍅"], ["banana", "🍌"], ["carrot", "🥕"],
      ["potato", "🍠"], ["mango", "🥭"], ["corn", "🌽"], ["zucchini", "🥒"],
      ["cucumber", "🥒"], ["cauliflower", "🥦"], ["eggplant", "🍆"],
      ["squash", "🎃"], ["cabbage", "🥬"], ["coconut", "🥥"],
      ["pineapple", "🍍"], ["cantaloupe", "🍈"], ["honeydew", "🍈"],
      ["lettuce", "🥬"], ["leek", "🌿"], ["rhubarb", "🌿"],
      ["watermelon", "🍉"], ["pumpkin", "🎃"]
    ];
    const match = options.find(([key]) => text.includes(key));
    return match ? match[1] : "♡";
  }

  function dueDateText() {
    return parseDate(CONTENT.estimatedDueDate).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric"
    });
  }

  function renderHeader(entry, iso) {
    const countdown = Math.max(0, dayDifference(iso, CONTENT.estimatedDueDate));
    const header = weekArtwork(entry);
    const oliver = oliverPose(entry, iso);

    return `
      <div class="header-art season-${seasonFor(iso)}"
           style="--header-image:url('${header}'); --oliver-image:url('${oliver}')">
        <div class="header-fallback" aria-hidden="true">
          <div class="fallback-sun"></div>
          <div class="fallback-hill fallback-hill-back"></div>
          <div class="fallback-hill fallback-hill-front"></div>
        </div>

        <div class="hero-copy">
          <div class="script-greeting">Good morning,</div>
          <div class="christina">Christina <span>♡</span></div>
          <div class="meet-label">WE MEET IN</div>
          <div class="countdown">${countdown} <small>days</small></div>
          <div class="due-date">${dueDateText()}</div>
        </div>

        <div class="header-oliver ${entry.from === "Oliver" ? "featured" : ""}"
             aria-hidden="true"></div>
      </div>`;
  }

  function renderBabyCard(entry) {
    return `
      <section class="baby-card">
        <div class="baby-card-top">
          <strong>${entry.week} weeks + ${entry.day} day${entry.day === 1 ? "" : "s"}</strong>
          <span class="week-pill">Week ${entry.week}</span>
        </div>
        <div class="baby-main">
          <div class="fruit-art" aria-hidden="true">${sizeEmoji(entry.babySize)}</div>
          <div class="baby-copy">
            <div class="section-label">Baby today</div>
            <p>Your baby is about the size of a <strong>${escapeHTML(entry.babySize)}</strong>.</p>
            ${entry.development
              ? `<p class="development-copy">${escapeHTML(entry.development)}</p>`
              : ""}
          </div>
        </div>
      </section>`;
  }

  function renderAffirmation(entry) {
    return `
      <section class="daily-card affirmation-card">
        <div class="card-icon">♡</div>
        <div>
          <h2>Today’s Affirmation</h2>
          <p>${escapeHTML(entry.affirmation)}</p>
        </div>
      </section>`;
  }

  function renderPersonalNote(entry, iso) {
    const fromOliver = entry.from === "Oliver";
    return `
      <section class="daily-card personal-card ${fromOliver ? "from-oliver" : "from-casey"}">
        <div class="card-icon">${fromOliver ? "🐾" : "♥"}</div>
        <div class="personal-copy">
          <h2>${fromOliver ? "A Note from Oliver" : "From Casey"}</h2>
          <p>${escapeHTML(entry.personalMessage)}</p>
        </div>
        ${fromOliver
          ? `<div class="oliver-note-art"
                  style="--oliver-image:url('${oliverPose(entry, iso)}')"
                  aria-hidden="true"></div>`
          : ""}
      </section>`;
  }

  function renderDay(iso, options = {}) {
    const entry = entries.get(iso);
    if (!entry) return;

    document.documentElement.dataset.season = seasonFor(iso);
    const milestone = CONTENT.milestones?.[iso];

    document.getElementById("app").innerHTML = `
      <div class="page today-page">
        ${options.archived
          ? `<button class="back-button" data-back>← Our Journey</button>`
          : ""}

        <section class="top-shell">
          ${renderHeader(entry, iso)}
          <button class="favorite-button ${isFavorite(iso) ? "is-favorite" : ""}"
                  data-favorite="${iso}"
                  aria-label="${isFavorite(iso) ? "Remove from favorites" : "Add to favorites"}">♥</button>
        </section>

        ${options.archived
          ? `<div class="archive-date">${escapeHTML(formatLongDate(iso))}</div>`
          : ""}

        ${milestone
          ? `<div class="milestone-strip">✦ <strong>${escapeHTML(milestone.title)}</strong> · ${escapeHTML(milestone.message)}</div>`
          : ""}

        ${renderBabyCard(entry)}
        ${renderAffirmation(entry)}
        ${renderPersonalNote(entry, iso)}
        <div class="page-spacer"></div>
      </div>`;

    bindDayEvents();
  }

  function renderJourney(filter = "all") {
    const today = currentContentDate();
    const favorites = getFavorites();
    let visible = CONTENT.days.filter(entry => entry.date <= today).reverse();

    if (filter === "favorites") {
      visible = visible.filter(entry => favorites.has(entry.date));
    }

    document.documentElement.dataset.season = seasonFor(today);

    document.getElementById("app").innerHTML = `
      <div class="page journey-page">
        <header class="journey-hero">
          <div class="journey-landscape" aria-hidden="true"></div>
          <h1>Our Journey <span>♡</span></h1>
          <p>A look back at this incredible path<br>we’re walking together.</p>
        </header>

        <div class="filter-tabs" role="group" aria-label="Journey filter">
          <button data-filter="all" class="${filter === "all" ? "active" : ""}">All Days</button>
          <button data-filter="favorites" class="${filter === "favorites" ? "active" : ""}">♥ Favorites</button>
        </div>

        <div class="timeline">
          ${visible.length
            ? visible.map(entry => `
                <button class="timeline-card" data-day="${entry.date}">
                  <span class="timeline-dot"></span>
                  <span class="timeline-text">
                    <strong>${entry.week} weeks + ${entry.day} day${entry.day === 1 ? "" : "s"}</strong>
                    <small>${escapeHTML(formatShortDate(entry.date))}</small>
                    <span class="timeline-size">
                      <span aria-hidden="true">${sizeEmoji(entry.babySize)}</span>
                      Baby is the size of a ${escapeHTML(entry.babySize)}.
                    </span>
                  </span>
                  <span class="timeline-heart" aria-hidden="true">${favorites.has(entry.date) ? "♥" : "♡"}</span>
                </button>`).join("")
            : `<div class="empty-state">Favorite a day and it will appear here.</div>`}
        </div>

        <div class="page-spacer"></div>
      </div>`;

    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => renderJourney(button.dataset.filter));
    });

    document.querySelectorAll("[data-day]").forEach(button => {
      button.addEventListener("click", () => renderDay(button.dataset.day, { archived: true }));
    });
  }

  function bindDayEvents() {
    document.querySelectorAll("[data-favorite]").forEach(button => {
      button.addEventListener("click", () => {
        const on = toggleFavorite(button.dataset.favorite);
        button.classList.toggle("is-favorite", on);
        button.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
      });
    });

    document.querySelectorAll("[data-back]").forEach(button => {
      button.addEventListener("click", () => {
        setNavigation("journey");
        renderJourney();
      });
    });
  }

  function setNavigation(name) {
    document.querySelectorAll("[data-nav]").forEach(button => {
      const active = button.dataset.nav === name;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  function init() {
    const todayButton = document.querySelector('[data-nav="today"]');
    const journeyButton = document.querySelector('[data-nav="journey"]');

    if (todayButton) {
      todayButton.addEventListener("click", () => {
        setNavigation("today");
        renderDay(currentContentDate());
      });
    }

    if (journeyButton) {
      journeyButton.addEventListener("click", () => {
        setNavigation("journey");
        renderJourney();
      });
    }

    setNavigation("today");
    renderDay(currentContentDate());

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
      });
    }
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init)
    : init();
})();
