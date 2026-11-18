/* ==========================================================================
   SMPN 5 BANDUNG – script.js
   Daftar isi:
   1. Helper            5. Efek muncul saat scroll (reveal)
   2. Tirai pembuka     6. Penghitung angka statistik
   3. Navigasi          7. Efek kartu 3D (tilt)
   4. Scroll handler    8. Formulir kontak + notifikasi
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 1. HELPER ---------- */
  const $  = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  /* ---------- 2. TIRAI PEMBUKA (page transition) ---------- */
  window.addEventListener("load", () => {
    const curtain = $("#curtain");
    setTimeout(() => curtain.classList.add("go"), 700);          // tirai naik
    setTimeout(() => (curtain.style.display = "none"), 1800);    // lalu dilepas
  });

  /* ---------- 3. NAVIGASI ---------- */
  const menu     = $("#menu");
  const indicator = $("#ind");
  const topLinks = $$("#menu > a, #menu > .dd > a");

  // 3a. Smooth scroll untuk semua tautan #bagian
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = $(link.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth" });
      menu.classList.remove("open");
    });
  });

  // 3b. Tombol hamburger (mobile)
  $("#burger").addEventListener("click", () => menu.classList.toggle("open"));

  // 3c. Garis underline emas yang bergeser mengikuti menu
  function moveIndicator(link) {
    if (!link || innerWidth <= 900) return;
    const m = menu.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    indicator.style.left  = r.left - m.left + 13 + "px";
    indicator.style.width = r.width - 26 + "px";
  }
  const currentLink = () => $("#menu a.act");
  topLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => moveIndicator(link));
    link.addEventListener("mouseleave", () => moveIndicator(currentLink()));
  });

  /* ---------- 4. SCROLL HANDLER ---------- */
  const timeline   = $("#tl");
  const timelineFill = $("#fill");
  const milestones = $$(".ms");

  function onScroll() {
    const root = document.documentElement;
    const scrolled = root.scrollTop;

    // Progress bar di bagian atas halaman
    $("#bar").style.width = (scrolled / (root.scrollHeight - root.clientHeight)) * 100 + "%";

    // Bayangan navbar setelah scroll
    $("#nav").classList.toggle("sc", scrolled > 20);

    // Scrollspy: menu aktif sesuai bagian yang sedang dilihat
    let active = topLinks[0];
    let bestTop = -Infinity;
    topLinks.forEach((link) => {
      link.dataset.t.split(" ").forEach((id) => {
        const section = document.getElementById(id);
        if (!section) return;
        const top = section.getBoundingClientRect().top;
        if (top < innerHeight * 0.4 && top > bestTop) { bestTop = top; active = link; }
      });
    });
    topLinks.forEach((link) => link.classList.toggle("act", link === active));
    moveIndicator(active);

    // Timeline: garis emas terisi dan tonggak menyala
    const box = timeline.getBoundingClientRect();
    const progress = Math.min(Math.max((innerHeight * 0.6 - box.top) / box.height, 0), 1);
    timelineFill.style.height = progress * 100 + "%";
    milestones.forEach((m) =>
      m.classList.toggle("lit", m.offsetTop + 10 < progress * timeline.offsetHeight)
    );
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // Klik tonggak sejarah untuk membuka/menutup detail
  milestones.forEach((m) => m.addEventListener("click", () => m.classList.toggle("open")));

  /* ---------- 5. REVEAL SAAT SCROLL ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add("in"), Number(entry.target.dataset.d) || 0);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );
  $$(".rv").forEach((el, i) => {
    el.dataset.d = (i % 4) * 90;      // jeda bertahap supaya muncul bergantian
    revealObserver.observe(el);
  });

  /* ---------- 6. PENGHITUNG ANGKA ---------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const goal = Number(el.dataset.n);
        let start = null;
        const step = (time) => {
          start = start || time;
          const p = Math.min((time - start) / 1600, 1);
          el.textContent = Math.floor(goal * (1 - Math.pow(1 - p, 3))) + (p === 1 ? el.dataset.s : "");
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$("[data-n]").forEach((el) => counterObserver.observe(el));

  /* ---------- 7. KARTU 3D TILT (hanya perangkat dengan mouse) ---------- */
  if (matchMedia("(hover:hover)").matches) {
    $$(".tilt").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.04)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- 8. FORMULIR KONTAK + TOAST ---------- */
  function showToast(text) {
    const toast = $("#toast");
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3200);
  }

  $("#form").addEventListener("submit", function (e) {
    e.preventDefault();
    const name    = $("#n").value.trim();
    const email   = $("#e").value.trim();
    const message = $("#m").value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
      showToast("Mohon lengkapi nama, email valid, dan pesan.");
      return;
    }
    showToast(`Terima kasih, ${name}! Pesan Anda telah terkirim ✓`);
    this.reset();
  });
})();
