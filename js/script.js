(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Loading Curtain */
  const curtain = document.getElementById('curtain');
  const hideCurtain = () => {
    if (curtain && !curtain.classList.contains('done')) {
      curtain.classList.add('done');
    }
  };
  if (document.readyState === 'complete') {
    window.setTimeout(hideCurtain, 180);
  } else {
    window.addEventListener('load', () => window.setTimeout(hideCurtain, 220));
    window.setTimeout(hideCurtain, 1400);
  }

  /* 2. Scroll Progress Bar & Navbar State */
  const nav = document.getElementById('nav');
  const bar = document.getElementById('bar');
  const timeline = document.getElementById('tl');
  const timelineFill = document.getElementById('fill');
  const milestones = Array.from(document.querySelectorAll('#tl .ms'));

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    if (bar) {
      bar.style.transform = `scaleX(${progress})`;
    }

    if (nav) {
      nav.classList.toggle('scrolled', scrollTop > 20);
    }

    /* Timeline Scroll Fill */
    if (timeline && timelineFill) {
      const rect = timeline.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.65;
      const total = rect.height;
      const elapsed = triggerY - rect.top;
      const ratio = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0;
      timelineFill.style.height = `${(ratio * 100).toFixed(2)}%`;

      milestones.forEach((ms) => {
        const msRect = ms.getBoundingClientRect();
        ms.classList.toggle('lit', msRect.top <= triggerY);
      });
    }
  };

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollUI();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', updateScrollUI, { passive: true });
  updateScrollUI();

  /* 3. Mobile Navigation Drawer */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');

  const closeMenu = () => {
    if (!burger || !menu) return;
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (burger && menu) {
    burger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
        burger.focus();
      }
    });
  }

  /* 4. Active Nav Link & Sliding Underline Indicator */
  const indicator = document.getElementById('ind');
  const navTargets = Array.from(document.querySelectorAll('#menu a[data-t]'));
  const observedSections = Array.from(
    document.querySelectorAll('#beranda, #tentang, #sejarah, #info, #sorotan, #ekskul, #galeri, #kontak')
  );

  const moveIndicator = (el) => {
    if (!indicator || !menu || !el || window.innerWidth <= 860) {
      if (indicator) indicator.style.opacity = '0';
      return;
    }
    const menuRect = menu.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    indicator.style.width = `${elRect.width}px`;
    indicator.style.transform = `translateX(${elRect.left - menuRect.left}px)`;
    indicator.style.opacity = '1';
  };

  const setActiveBySectionId = (id) => {
    let matchedLink = null;
    navTargets.forEach((link) => {
      const targets = (link.getAttribute('data-t') || '').split(/\s+/);
      const isActive = targets.includes(id);
      link.classList.toggle('active', isActive);
      if (isActive && !matchedLink) matchedLink = link;
    });
    if (matchedLink) {
      moveIndicator(matchedLink);
    }
  };

  if ('IntersectionObserver' in window && observedSections.length > 0) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveBySectionId(visible[0].target.id);
        }
      },
      { rootMargin: '-28% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] }
    );
    observedSections.forEach((sec) => navObserver.observe(sec));
  }
  window.addEventListener('resize', () => {
    const active = document.querySelector('#menu a.active') || navTargets[0];
    moveIndicator(active);
  });
  setActiveBySectionId(document.body.classList.contains('page-berita') ? 'info' : 'beranda');

  /* 5. Animated Stat Counters */
  const statNumbers = Array.from(document.querySelectorAll('.stat b[data-n]'));
  const animateStat = (el) => {
    if (el.dataset.counted === '1') return;
    el.dataset.counted = '1';

    const target = Number(el.dataset.n || 0);
    const suffix = el.dataset.s || '';

    if (prefersReducedMotion || target <= 0) {
      el.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1100;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = `${current}${suffix}`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = `${target}${suffix}`;
      }
    };
    window.requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStat(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    statNumbers.forEach((el) => {
      el.textContent = `0${el.dataset.s || ''}`;
      statObserver.observe(el);
    });
  }

  /* 6. Scroll Reveal Observer (Sections, Headings, Articles & Figures) */
  const revealSections = Array.from(document.querySelectorAll('main > section, footer'));
  const revealItems = Array.from(
    document.querySelectorAll(
      '.rv, main section .section-head, main section .ekskul-heading, main section .galeri-heading, main article, main figure, footer .fg > div'
    )
  );

  // Deduplicate while preserving DOM order
  const uniqueRevealItems = Array.from(new Set(revealItems));

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    // Assign subtle staggered delays to sibling cards inside grids/lists
    const staggerContainers = document.querySelectorAll(
      '.grid4, .tl, .news, .kegiatan-grid-custom, .ex, .fg'
    );
    staggerContainers.forEach((container) => {
      const children = Array.from(container.children).filter(
        (child) => child.matches('article, .rv, div')
      );
      children.forEach((child, idx) => {
        const delayMs = Math.min(idx % 4, 3) * 75;
        child.dataset.revealDelay = String(delayMs);
      });
    });

    const markRevealed = (el) => {
      if (el.dataset.revealed === '1') return;
      el.dataset.revealed = '1';
      const delay = Number(el.dataset.revealDelay || 0);
      if (delay > 0) {
        el.style.transitionDelay = `${delay}ms`;
      }
      el.classList.add('in');

      // Clean up reveal classes once settled so card hover states stay snappy
      window.setTimeout(() => {
        el.style.transitionDelay = '';
        el.classList.remove('will-reveal', 'in');
      }, 660 + delay);
    };

    const markSectionRevealed = (sec) => {
      if (sec.dataset.revealed === '1') return;
      sec.dataset.revealed = '1';
      sec.classList.add('in');
      window.setTimeout(() => {
        sec.classList.remove('will-reveal', 'in');
      }, 700);
    };

    revealSections.forEach((sec) => sec.classList.add('sr-section', 'will-reveal'));
    uniqueRevealItems.forEach((item) => {
      if (!item.classList.contains('rv')) {
        item.classList.add('sr-item');
      }
      item.classList.add('will-reveal');
    });

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            markSectionRevealed(entry.target);
            sectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: '0px 0px -20px 0px' }
    );
    revealSections.forEach((sec) => sectionObserver.observe(sec));

    const itemObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
            markRevealed(entry.target);
            itemObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -28px 0px' }
    );
    uniqueRevealItems.forEach((item) => itemObserver.observe(item));

    // Ensure elements already visible or passed on initial load / anchor jump reveal cleanly
    const revealVisibleFallback = () => {
      const vh = window.innerHeight;
      revealSections.forEach((sec) => {
        if (sec.dataset.revealed !== '1' && sec.getBoundingClientRect().top <= vh * 0.96) {
          markSectionRevealed(sec);
          sectionObserver.unobserve(sec);
        }
      });
      uniqueRevealItems.forEach((item) => {
        if (item.dataset.revealed !== '1' && item.getBoundingClientRect().top <= vh * 0.96) {
          markRevealed(item);
          itemObserver.unobserve(item);
        }
      });
    };

    window.addEventListener('hashchange', () => window.setTimeout(revealVisibleFallback, 120));
    window.requestAnimationFrame(revealVisibleFallback);
  }

  /* 7. Toast Notification & Contact Form Validation */
  const toast = document.getElementById('toast');
  let toastTimer = null;

  const showToast = (message, isError) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('error', Boolean(isError));
    toast.classList.add('show');
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  };

  const form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const namaInput = document.getElementById('n');
      const emailInput = document.getElementById('e');
      const pesanInput = document.getElementById('m');

      const nama = namaInput ? namaInput.value.trim() : '';
      const kontak = emailInput ? emailInput.value.trim() : '';
      const pesan = pesanInput ? pesanInput.value.trim() : '';

      if (nama.length < 2) {
        showToast('Mohon masukkan nama lengkap Anda.', true);
        if (namaInput) namaInput.focus();
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phonePattern = /^[0-9+\-\s()]{8,}$/;
      if (!emailPattern.test(kontak) && !phonePattern.test(kontak)) {
        showToast('Mohon masukkan alamat email atau nomor HP yang valid.', true);
        if (emailInput) emailInput.focus();
        return;
      }

      if (pesan.length < 5) {
        showToast('Mohon tuliskan pesan Anda terlebih dahulu.', true);
        if (pesanInput) pesanInput.focus();
        return;
      }

      const action = form.getAttribute('action') || '';
      if (!action || action.includes('YOUR_FORM_ID')) {
        showToast('Pesan berhasil divalidasi. Silakan konfigurasikan ID formulir Anda untuk pengiriman aktif.', false);
        form.reset();
        return;
      }

      try {
        const res = await fetch(action, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(form),
        });
        if (res.ok) {
          showToast('Terima kasih! Pesan Anda telah berhasil dikirim ke SMPN 5 Bandung.', false);
          form.reset();
        } else {
          showToast('Gagal mengirim pesan. Silakan coba beberapa saat lagi.', true);
        }
      } catch {
        showToast('Koneksi terganggu. Silakan hubungi kami via telepon atau email resmi.', true);
      }
    });
  }

  /* 8. Graceful Image Fallback (Zero-Broken-Image Resilience) */
  const attachImageFallback = (img) => {
    const applyFallback = () => {
      if (img.dataset.fallbackApplied === '1') return;
      img.dataset.fallbackApplied = '1';

      const parent = img.parentElement;
      if (!parent) return;

      if (parent.classList.contains('logo-frame')) {
        img.style.display = 'none';
        parent.classList.add('is-fallback');
        parent.textContent = img.dataset.fallbackText || '5';
        return;
      }

      img.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.className = 'img-fallback';
      fallback.textContent = img.dataset.fallbackText || img.alt || 'SMPN 5 Bandung';
      parent.insertBefore(fallback, img);
    };

    img.addEventListener('error', applyFallback);
    if (img.complete && img.naturalWidth === 0) {
      applyFallback();
    }
  };

  document.querySelectorAll('img').forEach(attachImageFallback);
  /* 9. Halaman Detail & Arsip Berita / Pengumuman (berita.html) */
  if (document.body.classList.contains('page-berita')) {
    const NEWS_DATA = [
      {
        id: 'velunafia-2026',
        category: 'Kegiatan Pentas Seni (PENSI) Tahunan',
        date: '24 Oktober 2026',
        unit: 'OSIS & MPK SMPN 5 Bandung',
        location: 'SMPN 5 Bandung, Jl. Sumatera No. 40',
        status: 'Terlaksana',
        image: 'assets/images/Logo Velunafia.png',
        alt: 'Velunafia 2026',
        title: 'OSIS & MPK Sukses Gelar Javastraat Velunafia 2026',
        summary: 'Pentas Seni Tahunan yang meriah pada 24 Oktober 2026.',
        paragraphs: [
          'Acara festival musik dan bazar bertajuk "Velunafia: From Spark to Light, From Dream to Bright" yang diselenggarakan oleh OSIS SMPN 5 Bandung pada 24 Oktober 2026 lalu berhasil mencetak kesuksesan besar dan mendapat sambutan yang luar biasa meriah. Berlokasi langsung di lingkungan SMPN 5 Bandung dengan konsep free entry atau bebas biaya masuk, perhelatan ini mampu menyedot antusiasme tinggi tidak hanya dari warga sekolah, tetapi juga para penikmat musik dan pengunjung umum.',
          'Suasana acara semakin pecah dan berkesan berkat penampilan memukau dari deretan bintang tamu ternama dan musisi berbakat tanah air. Mulai dari alunan lagu romantis dari Jaz, DJ Akbar Chalay feat. Ecky, Gursis, hingga kolaborasi seru dari Yerry T Five, Didan M.E, Melly Mono, Bandung All Star sukses membuat seluruh penonton larut dalam euforia bernyanyi bersama sepanjang acara.',
          'Selain suguhan musik, kehadiran berbagai stan bazar juga turut memanjakan para pengunjung yang hadir. Keberhasilan acara megah ini menjadi bukti nyata kreativitas, kekompakan, serta kerja keras seluruh panitia OSIS SMPN 5 Bandung yang didukung penuh oleh berbagai sponsor dan media partner, menjadikannya salah satu momen paling ikonik dan tak terlupakan di tahun ini.'
        ]
      },
      {
        id: 'prestasi-akademik-nonakademik',
        category: '-',
        date: '-',
        unit: '-',
        location: '-',
        status: '-',
        image: 'assets/images/-',
        alt: '-',
        title: 'BELUM ADA BERITA!',
        summary: 'BELUM ADA BERITA!',
        paragraphs: [
          '-'
        ]
      },
      {
        id: 'pengumuman-spmb-agenda',
        category: '-',
        date: '-',
        unit: '-',
        location: '-',
        status: '-',
        image: 'assets/images/-',
        alt: '-',
        title: 'BELUM ADA BERITA!',
        summary: 'BELUM ADA BERITA!',
        paragraphs: [
          '-'
        ]
      }
    ];

    const detailTitle = document.getElementById('detail-title');
    const crumbTitle = document.getElementById('crumb-title');
    const detailCategory = document.getElementById('detail-category');
    const detailDate = document.getElementById('detail-date');
    const detailUnit = document.getElementById('detail-unit');
    const detailImg = document.getElementById('detail-img');
    const detailSummary = document.getElementById('detail-summary');
    const detailBody = document.getElementById('detail-body');
    const metaCat = document.getElementById('meta-cat');
    const metaDate = document.getElementById('meta-date');
    const metaOrg = document.getElementById('meta-org');
    const metaLoc = document.getElementById('meta-loc');
    const metaStatus = document.getElementById('meta-status');
    const archiveGrid = document.getElementById('archive-grid');
    const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
    const copyBtn = document.getElementById('copy-link-btn');

    let currentFilter = 'semua';
    const params = new URLSearchParams(window.location.search);
    let currentId = params.get('id') || NEWS_DATA[0].id;
    if (!NEWS_DATA.some((item) => item.id === currentId)) {
      currentId = NEWS_DATA[0].id;
    }

    const renderArticle = (id, shouldScroll) => {
      const item = NEWS_DATA.find((entry) => entry.id === id) || NEWS_DATA[0];
      currentId = item.id;

      document.title = `${item.title} – SMPN 5 Bandung`;
      if (detailTitle) detailTitle.textContent = item.title;
      if (crumbTitle) crumbTitle.textContent = item.category;
      if (detailCategory) detailCategory.textContent = item.category;
      if (detailDate) detailDate.textContent = item.date;
      if (detailUnit) detailUnit.textContent = item.unit;
      if (detailSummary) detailSummary.textContent = item.summary;

      if (detailImg) {
        detailImg.style.display = 'block';
        detailImg.dataset.fallbackApplied = '0';
        const existingFallback = detailImg.parentElement?.querySelector('.img-fallback');
        if (existingFallback) existingFallback.remove();
        detailImg.src = item.image;
        detailImg.alt = item.alt;
        detailImg.dataset.fallbackText = item.title;
      }

      if (detailBody) {
        detailBody.innerHTML = '';
        item.paragraphs.forEach((text) => {
          const p = document.createElement('p');
          p.textContent = text;
          detailBody.appendChild(p);
        });
      }

      if (metaCat) metaCat.textContent = item.category;
      if (metaDate) metaDate.textContent = item.date;
      if (metaOrg) metaOrg.textContent = item.unit;
      if (metaLoc) metaLoc.textContent = item.location;
      if (metaStatus) metaStatus.textContent = item.status;

      renderArchive();

      if (shouldScroll) {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    };

    const renderArchive = () => {
      if (!archiveGrid) return;
      archiveGrid.innerHTML = '';

      const filtered =
        currentFilter === 'semua'
          ? NEWS_DATA
          : NEWS_DATA.filter((item) => item.category === currentFilter);

      filtered.forEach((item) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `archive-card${item.id === currentId ? ' is-current' : ''}`;
        card.innerHTML = `
          <div class="archive-thumb">
            <img src="${item.image}" alt="${item.alt}">
          </div>
          <div class="archive-body">
            <div class="archive-meta">
              <span class="cat">${item.category}</span>
              <span aria-hidden="true">·</span>
              <span class="tabular">${item.date}</span>
            </div>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <span class="archive-read">
              <span>${item.id === currentId ? 'Sedang Dibaca' : 'Baca Informasi'}</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </div>
        `;
        card.addEventListener('click', () => {
          const nextUrl = `berita.html?id=${encodeURIComponent(item.id)}`;
          window.history.pushState({ id: item.id }, '', nextUrl);
          renderArticle(item.id, true);
        });
        const thumbImg = card.querySelector('img');
        if (thumbImg) attachImageFallback(thumbImg);
        archiveGrid.appendChild(card);
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter || 'semua';
        filterButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', String(active));
        });
        renderArchive();
      });
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const shareUrl = window.location.href;
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('Tautan informasi berhasil disalin.', false);
        } catch {
          showToast('Salin tautan dari bilah alamat browser Anda.', false);
        }
      });
    }

    window.addEventListener('popstate', () => {
      const nextId = new URLSearchParams(window.location.search).get('id') || NEWS_DATA[0].id;
      renderArticle(nextId, false);
    });

    renderArticle(currentId, false);
  }
})();
