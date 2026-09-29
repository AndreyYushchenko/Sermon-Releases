// Sermon website: sticky nav, screenshot carousel, and download links that
// point at the newest release's files on GitHub (betas included).
(() => {
  // ---- Language ----
  const LANGS = ['en', 'uk', 'ru', 'de', 'pl', 'ro', 'es', 'ko', 'pt'];
  const lang = document.body.dataset.lang;
  const base = document.body.dataset.base;
  const pageFor = (l) => base + (l === 'en' ? '' : l + '/');
  const store = {
    get: () => { try { return localStorage.getItem('sermon-lang'); } catch (e) { return null; } },
    set: (v) => { try { localStorage.setItem('sermon-lang', v); } catch (e) { /* private mode */ } },
  };
  // First visit to the English page: the visitor's own language, if we have it.
  if (lang === 'en' && !store.get()) {
    const wanted = (navigator.languages || [navigator.language || 'en'])
      .map((l) => l.toLowerCase().split('-')[0]).find((l) => LANGS.includes(l));
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

  // Screenshot carousel.
  const track = document.querySelector('.track');
  const pages = track.children.length;
  const dots = [...document.querySelectorAll('.dot')];
  let page = 0;
  const show = (n) => {
    page = (n + pages) % pages;
    track.style.transform = `translateX(-${page * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === page));
  };
  document.querySelectorAll('.arrow').forEach((b) => b.addEventListener('click', () => show(page + Number(b.dataset.dir))));
  dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
  let touchX = null;
  track.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(page + (dx < 0 ? 1 : -1));
    touchX = null;
  });

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
      ['.platform', 0.12], ['.cta-inner > *', 0.1]];
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
