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
    document.querySelectorAll('#beranda, #tentang, #sejarah, #info, #sorotan, #ekskul, #galeri, #fasilitas, #kontak')
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
      '.grid4, .tl, .news, .kegiatan-grid-custom, .ex, .fasilitas-grid, .fg'
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

  /* Tempelkan URL Web App Google Apps Script di bawah ini agar pesan kontak masuk ke Google Sheets */
  const CONTACT_SHEET_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyd-Z0VkYedrvFV5aXgykRCmQPo7Sgf4ODReUOtUt7t0f5ba1uMwEt5LugUURqFR8taZQ/exec';

  const form = document.getElementById('form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const namaInput = document.getElementById('n');
      const emailInput = document.getElementById('e');
      const pesanInput = document.getElementById('m');
      const submitBtn = form.querySelector('button[type="submit"]');
      const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;

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

      const formAction = (form.getAttribute('action') || '').trim();
      const targetUrl =
        CONTACT_SHEET_WEBAPP_URL.trim() ||
        (formAction && !formAction.includes('YOUR_FORM_ID') && formAction !== '#' ? formAction : '');

      if (!targetUrl) {
        showToast('Pesan berhasil divalidasi. Tempelkan URL Web App Google Sheets di js/script.js agar pesan tersimpan.', false);
        form.reset();
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Mengirim...';

      try {
        if (targetUrl.includes('script.google.com')) {
          const payload = new URLSearchParams();
          payload.append('nama', nama);
          payload.append('email', kontak);
          payload.append('pesan', pesan);

          await fetch(targetUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: payload,
          });

          showToast('Terima kasih! Pesan Anda telah dikirim ke SMPN 5 Bandung.', false);
          form.reset();
        } else {
          const res = await fetch(targetUrl, {
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
        }
      } catch {
        showToast('Koneksi terganggu. Silakan hubungi kami via telepon atau email resmi.', true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Kirim Pesan';
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

    const syncOrientation = () => {
      const parent = img.parentElement;
      if (!parent || img.naturalWidth === 0) return;
      if (
        parent.classList.contains('im') ||
        parent.classList.contains('archive-thumb') ||
        parent.classList.contains('article-gallery-item')
      ) {
        parent.classList.toggle('is-portrait', img.naturalHeight > img.naturalWidth);
      }
    };

    img.addEventListener('load', syncOrientation);
    img.addEventListener('error', applyFallback);
    if (img.complete) {
      if (img.naturalWidth === 0) {
        applyFallback();
      } else {
        syncOrientation();
      }
    }
  };

  document.querySelectorAll('img').forEach(attachImageFallback);
  /* 9. Berita Dinamis (Google Sheets CSV + Fallback Data Lokal) */
  // Tempelkan link Google Sheets ("Publikasikan ke web" -> format CSV) di bawah ini.
  // Biarkan kosong ('') untuk tetap memakai data bawaan.
  const NEWS_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYLuPzcuta69inw9BjkDF9VU6VniXkbT8Hnm8lNPctjBis4z7KpaQAIY5Jb4a6jORF38zyfN1LSfFr/pub?gid=1776840088&single=true&output=csv';

  const DEFAULT_NEWS_DATA = [
    {
      id: 'velunafia-2026',
      category: 'Kegiatan Pentas Seni (PENSI) Tahunan',
      date: '24 Oktober 2026',
      unit: 'OSIS & MPK SMPN 5 Bandung',
      location: 'SMPN 5 Bandung, Jl. Sumatera No. 40',
      status: 'Terlaksana',
      image: 'assets/images/Logo Velunafia.png',
      hasCustomImage: true,
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
      hasCustomImage: false,
      alt: '-',
      title: 'BELUM ADA BERITA!',
      summary: 'BELUM ADA BERITA!',
      paragraphs: ['-']
    },
    {
      id: 'pengumuman-spmb-agenda',
      category: '-',
      date: '-',
      unit: '-',
      location: '-',
      status: '-',
      image: 'assets/images/-',
      hasCustomImage: false,
      alt: '-',
      title: 'BELUM ADA BERITA!',
      summary: 'BELUM ADA BERITA!',
      paragraphs: ['-']
    }
  ];

  const getConfiguredSheetUrl = () => {
    const metaUrl = document.querySelector('meta[name="news-sheet-url"]')?.getAttribute('content') || '';
    return (metaUrl || NEWS_SHEET_CSV_URL || '').trim();
  };

  const slugifyText = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'informasi';

  const sanitizeImageUrl = (rawUrl) => {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed || trimmed === '-') {
      return { url: 'assets/images/SMPN_5.png', isCustom: false };
    }

    // Konversi otomatis tautan Google Drive menjadi tautan gambar langsung
    const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (driveFileMatch && driveFileMatch[1]) {
      return { url: `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w1200`, isCustom: true };
    }
    const driveOpenMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/i);
    if (driveOpenMatch && driveOpenMatch[1]) {
      return { url: `https://drive.google.com/thumbnail?id=${driveOpenMatch[1]}&sz=w1200`, isCustom: true };
    }

    if (/^(https?:\/\/|assets\/|\/assets\/)/i.test(trimmed)) {
      return { url: trimmed, isCustom: true };
    }
    return { url: 'assets/images/SMPN_5.png', isCustom: false };
  };

  const normalizeSheetCsvUrl = (rawUrl) => {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) return '';
    if (trimmed.includes('output=csv') || trimmed.includes('tqx=out:csv') || trimmed.includes('format=csv')) {
      return trimmed;
    }
    const sheetMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (sheetMatch && sheetMatch[1] && sheetMatch[1] !== 'e') {
      return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/gviz/tq?tqx=out:csv`;
    }
    return trimmed;
  };

  const parseCsv = (csvText) => {
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    const text = csvText.replace(/^\uFEFF/, '');

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r' || ch === '\n') {
        if (ch === '\r' && next === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }

    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      rows.push(row);
    }

    return rows.filter((r) => r.some((v) => v.trim() !== ''));
  };

  const rowsToNewsItems = (rows) => {
    if (!rows || rows.length < 2) return [];
    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const idx = (names) => {
      for (const name of names) {
        const found = headers.indexOf(name);
        if (found !== -1) return found;
      }
      return -1;
    };

    const col = {
      id: idx(['id', 'slug']),
      category: idx(['kategori', 'category']),
      date: idx(['tanggal', 'date']),
      unit: idx(['unit', 'penyelenggara', 'author']),
      location: idx(['lokasi', 'location']),
      status: idx(['status']),
      image: idx(['gambar', 'foto', 'image']),
      gallery: idx(['galeri', 'foto_tambahan', 'gallery', 'foto2']),
      title: idx(['judul', 'title']),
      summary: idx(['ringkasan', 'summary', 'deskripsi']),
      body: idx(['isi', 'paragraf', 'konten', 'body', 'content']),
      active: idx(['tayang', 'aktif', 'publish', 'published'])
    };

    const usedIds = new Set();
    const items = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const getVal = (index) => (index >= 0 && r[index] ? r[index].trim() : '');

      const title = getVal(col.title);
      if (!title) continue;

      const activeFlag = getVal(col.active).toLowerCase();
      if (['tidak', 'no', 'false', '0', 'draft', 'arsip'].includes(activeFlag)) {
        continue;
      }

      let id = getVal(col.id) ? slugifyText(getVal(col.id)) : slugifyText(title);
      if (usedIds.has(id)) {
        id = `${id}-${i}`;
      }
      usedIds.add(id);

      const summary = getVal(col.summary) || title;
      const rawBody = getVal(col.body);
      let paragraphs = [summary];
      if (rawBody) {
        const lineSplit = rawBody
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (lineSplit.length === 1 && lineSplit[0].includes('|') && !/^foto\s*:/i.test(lineSplit[0])) {
          paragraphs = lineSplit[0]
            .split('|')
            .map((p) => p.trim())
            .filter(Boolean);
        } else {
          paragraphs = lineSplit;
        }
      }

      const parseImageList = (rawText) => {
        if (!rawText) return [];
        return String(rawText)
          .split(/[\r\n|]+|,\s*(?=https?:\/\/|assets\/|\/assets\/)/i)
          .map((entry) => entry.trim())
          .filter((entry) => entry && entry !== '-')
          .map((entry) => sanitizeImageUrl(entry))
          .filter((entry) => entry.isCustom)
          .map((entry) => entry.url);
      };

      const imageList = parseImageList(getVal(col.image));
      const extraGalleryList = parseImageList(getVal(col.gallery));
      const imgInfo =
        imageList.length > 0
          ? { url: imageList[0], isCustom: true }
          : sanitizeImageUrl(getVal(col.image));

      const gallery = Array.from(new Set([...imageList.slice(1), ...extraGalleryList]));

      items.push({
        id,
        category: getVal(col.category) || 'Pengumuman',
        date: getVal(col.date) || 'Pembaruan Resmi',
        unit: getVal(col.unit) || 'SMPN 5 Bandung',
        location: getVal(col.location) || 'SMPN 5 Bandung, Jl. Sumatera No. 40',
        status: getVal(col.status) || 'Informasi Aktif',
        image: imgInfo.url,
        hasCustomImage: imgInfo.isCustom,
        gallery,
        alt: title,
        title,
        summary,
        paragraphs
      });
    }

    return items;
  };

  let cachedNewsPromise = null;
  const loadNewsData = () => {
    if (cachedNewsPromise) return cachedNewsPromise;

    const csvUrl = normalizeSheetCsvUrl(getConfiguredSheetUrl());
    if (!csvUrl) {
      cachedNewsPromise = Promise.resolve({ items: DEFAULT_NEWS_DATA, fromSheet: false });
      return cachedNewsPromise;
    }

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? window.setTimeout(() => controller.abort(), 6000) : null;

    cachedNewsPromise = fetch(csvUrl, {
      cache: 'no-store',
      signal: controller ? controller.signal : undefined
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((csvText) => {
        const parsed = rowsToNewsItems(parseCsv(csvText));
        if (parsed.length > 0) {
          return { items: parsed, fromSheet: true };
        }
        return { items: DEFAULT_NEWS_DATA, fromSheet: false };
      })
      .catch(() => ({ items: DEFAULT_NEWS_DATA, fromSheet: false }))
      .finally(() => {
        if (timeoutId) window.clearTimeout(timeoutId);
      });

    return cachedNewsPromise;
  };

  const applyCardImage = (mediaBox, item) => {
    if (!mediaBox || !item) return;
    mediaBox.classList.remove('im-graphic', 'im-gold', 'im-navy');
    mediaBox.innerHTML = '';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.alt;
    img.dataset.fallbackText = item.title;
    mediaBox.appendChild(img);
    attachImageFallback(img);
  };


  const homeNewsGrid = document.querySelector('#info .news');
  if (homeNewsGrid && normalizeSheetCsvUrl(getConfiguredSheetUrl())) {
    loadNewsData().then(({ items, fromSheet }) => {
      if (!fromSheet || !items || items.length === 0) return;

      const leadCard = homeNewsGrid.querySelector('.nw-lead');
      const leadItem = items[0];
      if (leadCard && leadItem) {
        applyCardImage(leadCard.querySelector('.im'), leadItem);
        const leadCat = leadCard.querySelector('.t small');
        const leadTitle = leadCard.querySelector('.t h4');
        const leadSummary = leadCard.querySelector('.t p');
        const leadLink = leadCard.querySelector('.nw-more');

        if (leadCat) leadCat.textContent = leadItem.category;
        if (leadTitle) leadTitle.textContent = leadItem.title;
        if (leadSummary) leadSummary.textContent = leadItem.summary;
        if (leadLink) leadLink.href = `berita.html?id=${encodeURIComponent(leadItem.id)}`;
      }

      const secondaryCards = Array.from(homeNewsGrid.querySelectorAll('.nw-secondary'));
      secondaryCards.forEach((card, index) => {
        const item = items[index + 1];
        if (!item) return;

        if (item.hasCustomImage) {
          applyCardImage(card.querySelector('.im'), item);
        }

        const cat = card.querySelector('.t small');
        const title = card.querySelector('.t h4');
        const summary = card.querySelector('.t p');
        const link = card.querySelector('.nw-more');
        const linkText = card.querySelector('.nw-more span');

        if (cat) cat.textContent = item.category;
        if (title) title.textContent = item.title;
        if (summary) summary.textContent = item.summary;
        if (link) link.href = `berita.html?id=${encodeURIComponent(item.id)}`;
        if (linkText) linkText.textContent = 'Baca Selengkapnya';
      });
    });
  }


  if (document.body.classList.contains('page-berita')) {
    const detailTitle = document.getElementById('detail-title');
    const crumbTitle = document.getElementById('crumb-title');
    const detailCategory = document.getElementById('detail-category');
    const detailDate = document.getElementById('detail-date');
    const detailUnit = document.getElementById('detail-unit');
    const detailImg = document.getElementById('detail-img');
    const detailSummary = document.getElementById('detail-summary');
    const detailBody = document.getElementById('detail-body');
    let detailGallery = document.getElementById('detail-gallery');
    if (!detailGallery && detailBody && detailBody.parentElement) {
      detailGallery = document.createElement('div');
      detailGallery.id = 'detail-gallery';
      detailGallery.className = 'article-gallery-wrap';
      detailGallery.hidden = true;
      detailBody.insertAdjacentElement('afterend', detailGallery);
    }
    const metaCat = document.getElementById('meta-cat');
    const metaDate = document.getElementById('meta-date');
    const metaOrg = document.getElementById('meta-org');
    const metaLoc = document.getElementById('meta-loc');
    const metaStatus = document.getElementById('meta-status');
    const archiveGrid = document.getElementById('archive-grid');
    const filterBar = document.querySelector('.filter-bar');
    const copyBtn = document.getElementById('copy-link-btn');

    let newsList = DEFAULT_NEWS_DATA;
    let currentFilter = 'semua';
    const params = new URLSearchParams(window.location.search);
    let currentId = params.get('id') || newsList[0].id;

    const createArrowSvg = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '14');
      svg.setAttribute('height', '14');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3');
      svg.appendChild(path);
      return svg;
    };

    const renderFilterBar = () => {
      if (!filterBar) return;
      const categories = [];
      const seen = new Set();

      newsList.forEach((item) => {
        const cat = (item.category || '').trim();
        if (cat && cat !== '-' && !seen.has(cat.toLowerCase())) {
          seen.add(cat.toLowerCase());
          categories.push(cat);
        }
      });

      const filters = ['semua', ...categories];
      if (!filters.some((f) => f.toLowerCase() === currentFilter.toLowerCase())) {
        currentFilter = 'semua';
      }

      filterBar.innerHTML = '';
      filters.forEach((filterValue) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isActive = filterValue.toLowerCase() === currentFilter.toLowerCase();
        btn.className = `filter-btn${isActive ? ' active' : ''}`;
        btn.dataset.filter = filterValue;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(isActive));
        btn.textContent = filterValue === 'semua' ? 'Semua' : filterValue;

        btn.addEventListener('click', () => {
          currentFilter = filterValue;
          renderFilterBar();
          renderArchive();
        });

        filterBar.appendChild(btn);
      });
    };

    const renderArchive = () => {
      if (!archiveGrid) return;
      archiveGrid.innerHTML = '';

      const filtered =
        currentFilter === 'semua'
          ? newsList
          : newsList.filter((item) => item.category.toLowerCase() === currentFilter.toLowerCase());

      if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'lead';
        empty.textContent = 'Belum ada informasi pada kategori ini.';
        archiveGrid.appendChild(empty);
        return;
      }

      filtered.forEach((item) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `archive-card${item.id === currentId ? ' is-current' : ''}`;

        const thumb = document.createElement('div');
        thumb.className = 'archive-thumb';
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.alt;
        img.dataset.fallbackText = item.title;
        thumb.appendChild(img);

        const body = document.createElement('div');
        body.className = 'archive-body';

        const meta = document.createElement('div');
        meta.className = 'archive-meta';
        const catSpan = document.createElement('span');
        catSpan.className = 'cat';
        catSpan.textContent = item.category;
        const dotSpan = document.createElement('span');
        dotSpan.setAttribute('aria-hidden', 'true');
        dotSpan.textContent = '·';
        const dateSpan = document.createElement('span');
        dateSpan.className = 'tabular';
        dateSpan.textContent = item.date;
        meta.append(catSpan, dotSpan, dateSpan);

        const h3 = document.createElement('h3');
        h3.textContent = item.title;

        const p = document.createElement('p');
        p.textContent = item.summary;

        const readRow = document.createElement('span');
        readRow.className = 'archive-read';
        const readLabel = document.createElement('span');
        readLabel.textContent = item.id === currentId ? 'Sedang Dibaca' : 'Baca Informasi';
        readRow.append(readLabel, createArrowSvg());

        body.append(meta, h3, p, readRow);
        card.append(thumb, body);

        card.addEventListener('click', () => {
          const nextUrl = `berita.html?id=${encodeURIComponent(item.id)}`;
          window.history.pushState({ id: item.id }, '', nextUrl);
          renderArticle(item.id, true);
        });

        attachImageFallback(img);
        archiveGrid.appendChild(card);
      });
    };

    const renderArticle = (id, shouldScroll) => {
      const item = newsList.find((entry) => entry.id === id) || newsList[0];
      if (!item) return;
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

      const parseInlinePhotoLine = (lineText) => {
        const trimmed = lineText.trim();
        const prefixMatch = trimmed.match(/^foto\s*:\s*(.+)$/i);
        if (prefixMatch) {
          const parts = prefixMatch[1].split('|').map((s) => s.trim());
          const imgInfo = sanitizeImageUrl(parts[0]);
          if (imgInfo.isCustom) {
            return { url: imgInfo.url, caption: parts[1] || '' };
          }
        }
        const isStandaloneImage =
          /^https?:\/\/\S*(drive\.google\.com\/(file\/d\/|open\?id=)|\.(png|jpe?g|webp|gif)(\?\S*)?$)/i.test(trimmed) ||
          /^assets\/\S+\.(png|jpe?g|webp|gif)$/i.test(trimmed);
        if (isStandaloneImage) {
          const imgInfo = sanitizeImageUrl(trimmed);
          if (imgInfo.isCustom) {
            return { url: imgInfo.url, caption: '' };
          }
        }
        return null;
      };

      if (detailBody) {
        detailBody.innerHTML = '';
        item.paragraphs.forEach((text) => {
          const inlinePhoto = parseInlinePhotoLine(text);
          if (inlinePhoto) {
            const fig = document.createElement('figure');
            fig.className = 'article-inline-photo';
            const inlineImg = document.createElement('img');
            inlineImg.src = inlinePhoto.url;
            inlineImg.alt = inlinePhoto.caption || item.title;
            inlineImg.dataset.fallbackText = inlinePhoto.caption || item.title;
            fig.appendChild(inlineImg);
            if (inlinePhoto.caption) {
              const cap = document.createElement('figcaption');
              cap.textContent = inlinePhoto.caption;
              fig.appendChild(cap);
            }
            attachImageFallback(inlineImg);
            detailBody.appendChild(fig);
          } else {
            const p = document.createElement('p');
            p.textContent = text;
            detailBody.appendChild(p);
          }
        });
      }

      if (detailGallery) {
        const galleryList = Array.isArray(item.gallery) ? item.gallery : [];
        detailGallery.innerHTML = '';
        if (galleryList.length > 0) {
          detailGallery.hidden = false;
          const heading = document.createElement('h3');
          heading.textContent = 'Dokumentasi Foto';
          const grid = document.createElement('div');
          grid.className = 'article-gallery-grid';
          galleryList.forEach((photoUrl, idx) => {
            const fig = document.createElement('figure');
            fig.className = 'article-gallery-item';
            const photoImg = document.createElement('img');
            photoImg.src = photoUrl;
            photoImg.alt = `${item.title} – Foto ${idx + 1}`;
            photoImg.dataset.fallbackText = item.title;
            fig.appendChild(photoImg);
            attachImageFallback(photoImg);
            grid.appendChild(fig);
          });
          detailGallery.append(heading, grid);
        } else {
          detailGallery.hidden = true;
        }
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
      const nextId = new URLSearchParams(window.location.search).get('id') || newsList[0].id;
      renderArticle(nextId, false);
    });

    loadNewsData().then(({ items }) => {
      newsList = items;
      if (!newsList.some((item) => item.id === currentId)) {
        currentId = newsList[0].id;
      }
      renderFilterBar();
      renderArticle(currentId, false);
    });
  }
})();