/* Bonvita Cabinetry — interactivity: language, scroll reveal, stats, product modal */
(function () {
  const HTML_LANG = { en: "en", fr: "fr" };
  const LANG_KEY = "bonvita-lang";

  let currentLang = "en";
  let activeProduct = null;
  let promoData = null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  
  /* ---------- Dynamic Promo Pop-Up Logic (Google Sheets) ---------- */
  async function checkAndShowPromoPopup() {
    // Replace with your actual Sheet2API or Stein API URL
    const API_URL = "https://script.google.com/macros/s/AKfycbzvZfOgqxpNTgWnQy7T5Yq5OW6_-4pTfM48cStOj2X71F5IkEd0-6Wss2r3T1HSKjnzwg/exec";

    try {
      const response = await fetch(API_URL);
      const rows = await response.json();

      // Find the first row that has active marked as true (case-insensitive)
      const activeRow = rows.find(
        (row) =>
          row.active === true ||
          row.active === "TRUE" ||
          row.active === "true" ||
          row.Active === true ||
          row.Active === "TRUE" ||
          row.Active === "true"
      );

      if (activeRow) {
        promoData = activeRow;
        renderPromoPopupContent();

        // Show floating widget so it's always accessible
        const widget = document.getElementById('promo-floating-widget');
        if (widget) widget.hidden = false;

        // Auto-open pop-up modal on load after 1s
        setTimeout(window.openPromoPopup, 1000);
      }
    } catch (error) {
      console.error("Error fetching promo data from Google Sheets API:", error);
    }
  }

  function renderPromoPopupContent() {
    const container = document.getElementById('promo-popup-body');
    const widgetText = document.getElementById('widget-text');
    if (!promoData) return;

    // Safely extract language-specific Title
    const title =
      currentLang === 'fr'
        ? promoData.title_fr || promoData.Title_FR || promoData.title_en || promoData.Title_EN || ""
        : promoData.title_en || promoData.Title_EN || promoData.title_fr || promoData.Title_FR || "";

    // Safely extract language-specific Description/Message
    const message =
      currentLang === 'fr'
        ? promoData.message_fr || promoData.Message_FR || promoData.message_en || promoData.message_EN || ""
        : promoData.message_en || promoData.Message_EN || promoData.message_fr || promoData.message_FR || "";

    const imageUrl = promoData.image || promoData.Image || "";
    const imgHtml = imageUrl
      ? `<img src="${imageUrl}" style="max-width: 100%; border-radius: 8px; margin-bottom: 1rem; display: block;">`
      : '';

    if (container) {
      container.innerHTML = `
        ${imgHtml}
        <h2 style="margin-bottom: 0.5rem; font-size: 1.6rem; color: var(--ink);">${title}</h2>
        <p style="margin-top: 0.5rem; line-height: 1.6; color: var(--steel); white-space: pre-line;">${message}</p>
      `;
    }

    // Also update short text inside the floating corner widget
    if (widgetText) {
      widgetText.textContent = title;
    }
  }


  window.openPromoPopup = function () {
    const modal = document.getElementById('promo-popup-modal');
    if (!modal) return;
    renderPromoPopupContent();
    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  window.closePromoPopup = function () {
    const modal = document.getElementById('promo-popup-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  /* ---------- Language ---------- */
  function applyLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;
    currentLang = lang;

    document.documentElement.setAttribute("lang", HTML_LANG[lang] || lang);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      const key = el.getAttribute("data-i18n-aria");
      if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
    });

    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      const isActive = btn.getAttribute("data-lang") === lang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (activeProduct) renderModal(activeProduct);

    // Dynamic Pop-up Language update
    renderPromoPopupContent();

    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Generic scroll reveal ---------- */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Scroll-triggered assembly animation ---------- */
  function initScrollReveal() {
    const target = document.getElementById("assembly");
    if (!target || !("IntersectionObserver" in window)) {
      if (target) target.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    observer.observe(target);
  }

  /* ---------- Stat counters ---------- */
  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (prefersReducedMotion) { el.textContent = target; return; }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initStatCounters() {
    const stats = document.querySelectorAll(".stat-number");
    if (!stats.length) return;
    if (!("IntersectionObserver" in window)) {
      stats.forEach(animateCount);
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Product quick-view modal ---------- */
  function renderModal(key) {
    const dict = translations[currentLang];
    const nameEl = document.getElementById("modal-name");
    const descEl = document.getElementById("modal-desc");
    if (nameEl) nameEl.textContent = dict["products." + key + ".name"] || "";
    if (descEl) descEl.textContent = dict["products." + key + ".desc"] || "";
  }

  function openModal(key) {
    return;
  }

  function closeModal() {
    const modal = document.getElementById("product-modal");
    if (!modal) return;
    modal.hidden = true;
    activeProduct = null;
    document.body.style.overflow = "";
  }

  function initProductModal() {
    document.querySelectorAll(".product-card").forEach(function (card) {
      card.addEventListener("click", function () {
        openModal(card.getAttribute("data-product"));
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(card.getAttribute("data-product"));
        }
      });
    });

    document.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      const modal = document.getElementById("product-modal");
      if (modal && !modal.hidden && e.key === "Escape") closeModal();
    });
  }

  /* ---------- News Modal ---------- */
  window.openNewsModal = function (key) {
    const modal = document.getElementById('news-modal');
    if (!modal) return;

    const imgEl = document.getElementById('news-modal-img');
    const titleEl = document.getElementById('news-modal-title');
    const descEl = document.getElementById('news-modal-desc');

    const dict = translations[currentLang] || translations['en'];

    const newsData = {
      item1: { img: 'images/news-1.jpg' },
      item2: { img: 'images/news-2.jpg' },
      item3: { img: 'images/news-3.jpg' },
      item4: { img: 'images/news-4.jpg' }
    };

    if (imgEl && newsData[key]) imgEl.src = newsData[key].img;
    if (titleEl) titleEl.textContent = dict['news.' + key + '.title'] || '';
    if (descEl) descEl.textContent = dict['news.' + key + '.desc'] || '';

    modal.hidden = false;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  window.closeNewsModal = function () {
    const modal = document.getElementById('news-modal');
    if (!modal) return;
    
    modal.hidden = true;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  function initNewsModal() {
    document.addEventListener("keydown", function (e) {
      const modal = document.getElementById("news-modal");
      if (modal && !modal.hidden && e.key === "Escape") window.closeNewsModal();
      const promoModal = document.getElementById("promo-popup-modal");
      if (promoModal && !promoModal.hidden && e.key === "Escape") window.closePromoPopup();
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLanguage(btn.getAttribute("data-lang"));
      });
    });

    let savedLang = "en";
    try { savedLang = localStorage.getItem(LANG_KEY) || "en"; } catch (e) { /* ignore */ }
    if (!translations[savedLang]) savedLang = "en";
    applyLanguage(savedLang);

    initReveal();
    initScrollReveal();
    initStatCounters();
    initProductModal();
    initNewsModal();

    // Load promo data from JSON
    checkAndShowPromoPopup();
  });
})();