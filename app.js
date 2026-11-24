// Sermon website: sticky nav, screenshot carousel, and download links that
// point at the newest release's files on GitHub (betas included).
(() => {
  // ---- Language ----
  const LANGS = ['en', 'uk', 'ru', 'de', 'pl', 'ro', 'es', 'ko', 'pt', 'fr'];
  const lang = document.body.dataset.lang;
  const base = document.body.dataset.base;
  // A sub-page (the OBS guide) exists in fewer languages and lives in <lang>/<page>/.
  const page = document.body.dataset.page;
  const pageLangs = (document.body.dataset.langs || LANGS.join(' ')).split(' ');
  const pageFor = (l) => base + (l === 'en' ? '' : l + '/') + (page ? page + '/' : '');
  const store = {
    get: () => { try { return localStorage.getItem('sermon-lang'); } catch (e) { return null; } },
    set: (v) => { try { localStorage.setItem('sermon-lang', v); } catch (e) { /* private mode */ } },
  };
  // First visit to the English page: the visitor's own language, if we have it.
  if (lang === 'en' && !store.get()) {
    const wanted = (navigator.languages || [navigator.language || 'en'])
      .map((l) => l.toLowerCase().split('-')[0]).find((l) => pageLangs.includes(l));
    if (wanted && wanted !== 'en') {
      store.set(wanted);
      location.replace(pageFor(wanted) + location.hash);
      return;
    }
  }
  const langBox = document.querySelector('.lang');
  const langButton = langBox.querySelector('.lang-button');
  langButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = langBox.classList.toggle('open');
    langButton.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', () => { langBox.classList.remove('open'); langButton.setAttribute('aria-expanded', 'false'); });
  langBox.querySelectorAll('.lang-menu a').forEach((a) => a.addEventListener('click', () => store.set(a.dataset.lang)));
  langBox.querySelectorAll('.lang-menu a').forEach((a) => { a.href = a.getAttribute('href') + location.hash; });

  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu.
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  // Highlight the section in view.
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = ['features', 'screenshots', 'platforms'].map((id) => document.getElementById(id));
  const spy = () => {
    let current = 'features';
    for (const section of sections)
      if (section && section.getBoundingClientRect().top < window.innerHeight * 0.4) current = section.id;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current && a.dataset.nav !== 'download'));
  };
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  // Screenshot carousel (main page only).
  const track = document.querySelector('.track');
  if (track) {
    const pages = track.children.length;
    const dots = [...document.querySelectorAll('.dot')];
    let current = 0;
    const show = (n) => {
      current = (n + pages) % pages;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    };
    document.querySelectorAll('.arrow').forEach((b) => b.addEventListener('click', () => show(current + Number(b.dataset.dir))));
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
    let touchX = null;
    track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Light / dark theme: the visitor's choice, else the system's (set early in <head>).
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const setTheme = (t) => {
    root.dataset.theme = t;
    themeColor.content = t === 'light' ? '#f7f4ee' : '#070b14';
  };
  document.querySelector('.theme-toggle').addEventListener('click', (e) => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('sermon-theme', next); } catch (err) { /* private mode */ }
    if (calm || !document.startViewTransition) { setTheme(next); return; }
    // A circle of the new theme spreading from the button.
    const x = e.clientX || innerWidth - 40, y = e.clientY || 40;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => setTheme(next)).ready.then(() => {
      root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' });
    });
  });

  // Candle embers rising through the hero.
  const sparks = document.querySelector('.sparks');
  if (sparks && !calm) {
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('span');
      const size = 3 + Math.random() * 6;
      s.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
        `--dx:${(Math.random() - 0.5) * 120}px;--rise:${-380 - Math.random() * 480}px;--o:${0.35 + Math.random() * 0.55};` +
        `animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s`;
      sparks.appendChild(s);
    }
  }

  // Sections slide in as they scroll into view.
  if (!calm && 'IntersectionObserver' in window) {
    const groups = [['.feature', 0.06], ['.showcase-head', 0], ['.page', 0.1, '.shot'], ['.platforms-text', 0],
      ['.platform', 0.12], ['.cta-inner > *', 0.1], ['.g-step', 0], ['.g-before', 0], ['.g-faq', 0.04]];
    const items = [];
    for (const [selector, step, inner] of groups) {
      if (inner) {
        document.querySelectorAll(selector).forEach((p) => p.querySelectorAll(inner).forEach((el, i) => items.push([el, i * step])));
      } else {
        document.querySelectorAll(selector).forEach((el, i) => items.push([el, i * step]));
      }
    }
    const seen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        el.classList.add('in');
        seen.unobserve(el);
        // Hover effects shouldn't wait for the entrance delay.
        setTimeout(() => el.style.removeProperty('--d'), 1200);
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    for (const [el, delay] of items) {
      el.classList.add('reveal');
      el.style.setProperty('--d', `${delay}s`);
      seen.observe(el);
    }
  }

  // Dialogs.
  const showDialog = (dialog) => {
    if (dialog.open) return;
    dialog.showModal();
    dialog.focus(); // not the close button, which would show a focus ring
  };
  document.querySelectorAll('.modal').forEach((dialog) => {
    dialog.addEventListener('click', (e) => {
      // A click on the backdrop lands on the dialog itself.
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
  });

  // Support: mailto does nothing without a mail app, so show the address with ways to write.
  const support = document.getElementById('support-dialog');
  document.querySelectorAll('[data-support]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    showDialog(support);
  }));
  const copy = support.querySelector('.btn-copy');
  const email = support.querySelector('.email');
  const address = email.textContent;
  copy.addEventListener('click', () => {
    const done = () => {
      copy.classList.add('done');
      email.classList.add('done');
      email.textContent = copy.dataset.copied;
      copy.querySelector('use').setAttribute('href', '#i-check');
      setTimeout(() => {
        copy.classList.remove('done');
        email.classList.remove('done');
        email.textContent = address;
        copy.querySelector('use').setAttribute('href', '#i-copy');
      }, 1800);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(done, () => {});
    } else {
      const range = document.createRange();
      range.selectNodeContents(email);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      try { document.execCommand('copy'); done(); } catch (err) { /* the address stays selected */ }
    }
  });

  // Download buttons: the file saves quietly, so say it started (and how to get past the OS warning).
  const downloadDialog = document.getElementById('download-dialog');
  const mobileDialog = document.getElementById('mobile-dialog');
  const phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  // On a Mac the main (gold) buttons offer the Mac version instead of the Windows one.
  const uaPlatform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const isMac = !phone && (/mac/i.test(uaPlatform) || /Macintosh|Mac OS X/.test(navigator.userAgent));
  if (isMac) {
    const apple = '<svg class="apple-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.62c.03 2.9 2.54 3.87 2.57 3.88-.02.07-.4 1.38-1.33 2.73-.8 1.17-1.63 2.33-2.94 2.35-1.29.03-1.7-.76-3.17-.76s-1.93.74-3.15.79c-1.26.05-2.22-1.26-3.03-2.42-1.65-2.38-2.9-6.73-1.22-9.66.84-1.46 2.33-2.38 3.95-2.4 1.24-.03 2.4.83 3.16.83.75 0 2.17-1.03 3.66-.88.62.03 2.37.25 3.49 1.9-.09.06-2.08 1.22-2.06 3.64M13.96 5.52c.67-.81 1.12-1.93.99-3.05-.96.04-2.13.64-2.82 1.45-.62.72-1.16 1.86-1.02 2.96 1.08.08 2.18-.55 2.85-1.36"/></svg>';
    document.querySelectorAll('.btn-gold[data-download="windows"]').forEach((a) => {
      const label = a.querySelector('.dl-label');
      if (!label || !label.dataset.mac) return;
      a.dataset.download = 'mac';
      label.textContent = label.dataset.mac;
      const logo = a.querySelector('.win-logo');
      if (logo) logo.outerHTML = apple;
    });
    // The platform cards too: macOS first with the filled button, Windows after it.
    const cards = document.querySelector('.platform-cards');
    if (cards) {
      const macButton = cards.querySelector('[data-download="mac"]');
      const winButton = cards.querySelector('[data-download="windows"]');
      if (macButton && winButton) {
        macButton.classList.replace('btn-outline', 'btn-blue');
        winButton.classList.replace('btn-blue', 'btn-outline');
        cards.insertBefore(macButton.closest('.platform'), cards.firstElementChild);
      }
    }
  }
  document.querySelectorAll('[data-download]').forEach((a) => a.addEventListener('click', (e) => {
    if (phone) {
      e.preventDefault();
      showDialog(mobileDialog);
      return;
    }
    // Until the release list loads the link opens the releases page, which needs no dialog.
    if (!a.href.includes('/releases/download/')) return;
    downloadDialog.dataset.os = a.dataset.download;
    downloadDialog.querySelector('.dl-again').href = a.href;
    setTimeout(() => showDialog(downloadDialog), 150);
  }));

  // "Download" in the menu: flash the download cards once the page has scrolled to them.
  const cards = document.querySelector('.platform-cards');
  if (cards) {
    document.querySelectorAll('a[data-nav="download"], .footer-links a[href="#platforms"]:last-child').forEach((a) =>
      a.addEventListener('click', () => {
        cards.classList.remove('flash');
        setTimeout(() => cards.classList.add('flash'), 700);
        setTimeout(() => cards.classList.remove('flash'), 3500);
      }));
  }

  // OBS guide: screenshots open large, and the contents follow the reading position.
  const lightbox = document.querySelector('.g-lightbox');
  if (lightbox) {
    const body = lightbox.querySelector('.g-lightbox-body');
    document.querySelectorAll('.g-zoom').forEach((b) => b.addEventListener('click', () => {
      body.replaceChildren(b.querySelector('.g-frame').cloneNode(true));
      body.querySelector('img').loading = 'eager';
      showDialog(lightbox);
    }));
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === body || e.target.closest('[data-close]')) lightbox.close();
    });
  }
  const tocLinks = [...document.querySelectorAll('.g-toc a')];
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => document.querySelector(a.getAttribute('href')));
    const follow = () => {
      let at = 0;
      targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < window.innerHeight * 0.35) at = i; });
      tocLinks.forEach((a, i) => a.classList.toggle('active', i === at));
    };
    window.addEventListener('scroll', follow, { passive: true });
    follow();
  }

  // Download links: the newest release's installer / disk image.
  fetch('https://api.github.com/repos/AndreyYushchenko/Sermon-Releases/releases?per_page=10')
    .then((r) => (r.ok ? r.json() : []))
    .then((releases) => {
      const release = releases.find((r) => !r.draft && r.assets && r.assets.length);
      if (!release) return;
      const find = (test) => release.assets.find((a) => test(a.name));
      const windows = find((n) => /setup.*\.exe$/i.test(n));
      const mac = find((n) => /\.dmg$/i.test(n));
      document.querySelectorAll('[data-download="windows"]').forEach((a) => { if (windows) a.href = windows.browser_download_url; });
      document.querySelectorAll('[data-download="mac"]').forEach((a) => { if (mac) a.href = mac.browser_download_url; });
      const version = release.tag_name.replace(/^v/, '');
      document.querySelectorAll('.platform [data-download]').forEach((a) => { a.title = `Sermon ${version}`; });
    })
    .catch(() => { /* the links keep pointing at the releases page */ });
})();
