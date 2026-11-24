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
  setActiveBySectionId('beranda');

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
  document.querySelectorAll('img').forEach((img) => {
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
  });
})();
