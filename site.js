// Sermon website (2026-11 design), every page: language, menu, theme, the
// home page's moving parts, download links and dialogs, the guide's pictures.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const body = document.body;

  // ---- Language: remembered; on the first visit to an English page, the visitor's own. ----
  const LANGS = ['en', 'uk', 'ru', 'de', 'pl', 'ro', 'es', 'ko', 'pt', 'fr'];
  const lang = body.dataset.lang;
  const base = body.dataset.base || '';
  const page = body.dataset.page || '';
  const store = {
    get: () => { try { return localStorage.getItem('sermon-lang'); } catch (e) { return null; } },
    set: (v) => { try { localStorage.setItem('sermon-lang', v); } catch (e) { /* private mode */ } },
  };
  // The first visit's language is chosen in the page's <head> (build.py), before it is drawn.
  const langBox = document.querySelector('.lang');
  if (langBox) {
    const button = langBox.querySelector('.lang-btn');
    button.addEventListener('click', (e) => { e.stopPropagation(); button.setAttribute('aria-expanded', String(langBox.classList.toggle('open'))); });
    document.addEventListener('click', () => { langBox.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); });
    langBox.querySelectorAll('.lang-menu a').forEach((a) => {
      a.addEventListener('click', () => store.set(a.dataset.lang));
      a.href = a.getAttribute('href') + location.hash;
    });
  }

  // ---- Nav: a border once the page scrolls; the menu on phones. ----
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const menuBtn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuBtn.setAttribute('aria-expanded', String(links.classList.toggle('open'))); });
    links.addEventListener('click', (e) => { if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('click', () => links.classList.remove('open'));
  }

  // ---- Light / dark: the visitor's choice, else the system's. ----
  const themeBtn = document.querySelector('.theme-btn');
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const icon = () => themeBtn && themeBtn.querySelector('use').setAttribute('href', dark() ? '#i-sun' : '#i-moon');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      root.dataset.theme = dark() ? 'light' : 'dark';
      try { localStorage.setItem('sermon-theme', root.dataset.theme); } catch (e) { /* private mode */ }
      icon();
    });
    icon();
  }
  // The drifting background rests while the tab is hidden.
  document.addEventListener('visibilitychange', () => root.classList.toggle('paused', document.hidden));

  // ---- Dialogs. ----
  const showDialog = (dialog) => { if (dialog && !dialog.open) { dialog.showModal(); dialog.focus(); } };
  document.querySelectorAll('.modal').forEach((dialog) => dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
  }));
  const copyText = (text, done) => {
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
  };
  const support = document.getElementById('support-dialog');
  document.querySelectorAll('[data-support]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); showDialog(support); }));
  if (support) {
    const copy = support.querySelector('.btn-copy');
    const email = support.querySelector('.email');
    if (copy && email) copy.addEventListener('click', () => copyText(email.textContent.trim(), () => {
      copy.querySelector('use').setAttribute('href', '#i-check');
      setTimeout(() => copy.querySelector('use').setAttribute('href', '#i-copy'), 1800);
    }));
  }

  // ---- "What's new": the version pill opens the short list. ----
  const news = document.getElementById('news-dialog');
  document.querySelectorAll('[data-news]').forEach((b) => b.addEventListener('click', () => showDialog(news)));

  // ---- The address in the "write to us" letter: one click copies it. ----
  document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
    const text = b.dataset.copy;
    const label = b.querySelector('span');
    copyText(text, () => {
      b.classList.add('done');
      label.textContent = b.dataset.copied || text;
      b.querySelector('use').setAttribute('href', '#i-check');
      setTimeout(() => { b.classList.remove('done'); label.textContent = text; b.querySelector('use').setAttribute('href', '#i-copy'); }, 1800);
    });
  }));

  // ---- Download: this computer's version first; the newest release's files; a note once it starts. ----
  const phone = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const mac = !phone && /Mac/i.test((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || navigator.userAgent);
  const osOf = (a) => a.dataset.os || a.dataset.download;
  if (mac) {
    const main = document.querySelector('.dl-main');
    const other = document.querySelector('.dl-other');
    if (main && other) {
      main.dataset.os = 'mac';
      main.querySelector('use').setAttribute('href', '#i-apple');
      const label = main.querySelector('[data-mac]');
      if (label) label.textContent = label.dataset.mac;
      other.dataset.os = 'windows';
      other.querySelector('use').setAttribute('href', '#i-windows');
      other.querySelector('span').textContent = 'Windows';
    }
    // The inner pages' single button.
    document.querySelectorAll('.g-cta [data-download="windows"]').forEach((a) => {
      a.dataset.download = 'mac';
      const label = a.querySelector('.dl-label');
      if (label && label.dataset.mac) label.textContent = label.dataset.mac;
      const logo = a.querySelector('.win-logo');
      if (logo) logo.outerHTML = '<svg class="ic" style="width:18px;height:18px"><use href="#i-apple"/></svg>';
    });
  }
  // On a phone nothing is downloaded here, so no button stands out; the
  // phone's own family comes first (iPhone/iPad: Apple, Android: Windows).
  if (phone) {
    const apple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || /Macintosh/.test(navigator.userAgent);
    root.classList.add('on-phone');
    document.querySelectorAll('.hero-actions .btn, .dl-card .btn').forEach((b) => b.classList.replace('btn-dark', 'btn-light'));
    const main = document.querySelector('.dl-main');
    const other = document.querySelector('.dl-other');
    if (apple && main && other) {
      main.dataset.os = 'mac';
      main.querySelector('use').setAttribute('href', '#i-apple');
      const label = main.querySelector('[data-mac]');
      if (label) label.textContent = label.dataset.mac;
      other.dataset.os = 'windows';
      other.querySelector('use').setAttribute('href', '#i-windows');
      other.querySelector('span').textContent = 'Windows';
    }
    // The closing card on the inner pages (library, privacy, the guide): plain, and Apple's on an iPhone/iPad.
    document.querySelectorAll('.g-cta [data-download]').forEach((a) => {
      a.classList.replace('btn-gold', 'btn-outline');
      if (!apple) return;
      a.dataset.download = 'mac';
      const label = a.querySelector('.dl-label');
      if (label && label.dataset.mac) label.textContent = label.dataset.mac;
      const logo = a.querySelector('.win-logo');
      if (logo) logo.outerHTML = '<svg class="ic" style="width:18px;height:18px"><use href="#i-apple"/></svg>';
    });
    const grid = document.querySelector('.dl');
    if (grid) {
      const order = apple ? ['ios', 'mac', 'windows'] : ['windows', 'mac', 'ios'];
      order.forEach((name) => { const card = grid.querySelector(`[data-card="${name}"]`); if (card) grid.appendChild(card); });
    }
  }
  const downloadDialog = document.getElementById('download-dialog');
  const mobileDialog = document.getElementById('mobile-dialog');
  document.querySelectorAll('[data-os], [data-download]').forEach((a) => a.addEventListener('click', (e) => {
    if (a.tagName !== 'A') return;
    if (phone) { e.preventDefault(); showDialog(mobileDialog); return; }
    if (!a.href.includes('/releases/download/') || !downloadDialog) return;
    downloadDialog.dataset.os = osOf(a);
    const again = downloadDialog.querySelector('.dl-again');
    if (again) again.href = a.href;
    setTimeout(() => showDialog(downloadDialog), 150);
  }));
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => fetch('https://api.github.com/repos/AndreyYushchenko/Sermon-Releases/releases?per_page=10')
    .then((r) => (r.ok ? r.json() : []))
    .then((releases) => {
      const release = releases.find((r) => !r.draft && r.assets && r.assets.length);
      if (!release) return;
      const file = { windows: release.assets.find((a) => /setup.*\.exe$/i.test(a.name)), mac: release.assets.find((a) => /\.dmg$/i.test(a.name)) };
      document.querySelectorAll('a[data-os], a[data-download]').forEach((a) => { const f = file[osOf(a)]; if (f) a.href = f.browser_download_url; });
      // The greeting shows today's version.
      const version = release.tag_name.replace(/^v/i, '').replace(/-/g, ' ');
      document.querySelectorAll('.ver').forEach((v) => { v.textContent = version; });
    })
    .catch(() => { /* the links keep pointing at the releases page */ }));

  // ---- Home: the app picture straightens up as the page scrolls. ----
  const tilt = document.querySelector('.stage');
  if (tilt && !still) {
    let queued = false;
    const update = () => {
      queued = false;
      const r = tilt.getBoundingClientRect();
      tilt.style.setProperty('--tilt', Math.min(1, Math.max(0, (r.top - innerHeight * 0.25) / (innerHeight * 0.55))).toFixed(3));
    };
    const ask = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    update();
    if ('IntersectionObserver' in window) new IntersectionObserver((e) => tilt.classList.toggle('away', !e[0].isIntersecting)).observe(tilt);
  }

  // ---- Home: the "on screen now" card steps through the song. ----
  const part = document.querySelector('.part');
  if (part && !still) {
    const parts = part.dataset.parts.split('|');
    const bar = document.querySelector('.part-bar b');
    let i = 0;
    const run = () => { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); };
    bar.addEventListener('animationend', () => {
      i = (i + 1) % parts.length;
      part.classList.add('out');
      setTimeout(() => { part.textContent = parts[i]; part.classList.remove('out'); run(); }, 260);
    });
    setTimeout(run, 1600);
  }

  // ---- Home: the OBS card switches scenes, as Sermon does during a stream. ----
  const scene = document.querySelector('.scene');
  if (scene && !still) {
    const scenes = scene.dataset.parts.split('|');
    let s = 0;
    setInterval(() => {
      s = (s + 1) % scenes.length;
      scene.classList.add('out');
      setTimeout(() => { scene.textContent = scenes[s]; scene.classList.remove('out'); }, 260);
    }, 3800);
  }

  // ---- Home: the timer card counts down for real. ----
  const count = document.querySelector('.chip-timer .count');
  if (count && !still) {
    let left = 4 * 60 + 58;
    setInterval(() => {
      left = left > 0 ? left - 1 : 5 * 60;
      count.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    }, 1000);
  }

  // ---- Guide: pictures open large; the contents follow the reading. ----
  const lightbox = document.querySelector('.g-lightbox');
  if (lightbox) {
    const box = lightbox.querySelector('.g-lightbox-body');
    document.querySelectorAll('.g-zoom').forEach((b) => b.addEventListener('click', () => {
      box.replaceChildren(b.querySelector('.g-frame').cloneNode(true));
      const img = box.querySelector('img');
      if (img) img.loading = 'eager';
      showDialog(lightbox);
    }));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target === box || e.target.closest('[data-close]')) lightbox.close(); });
  }
  const tocLinks = [...document.querySelectorAll('.g-toc a')];
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => document.querySelector(a.getAttribute('href')));
    const follow = () => {
      let at = 0;
      targets.forEach((t, n) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.35) at = n; });
      tocLinks.forEach((a, n) => a.classList.toggle('active', n === at));
    };
    addEventListener('scroll', follow, { passive: true });
    follow();
  }

  // ---- "New version" card: once per version, until the visitor closes it or opens what's new. ----
  const nw = document.querySelector('.nw');
  if (nw) {
    let seen = null;
    try { seen = localStorage.getItem('sermon-news-seen'); } catch (e) { /* private mode */ }
    const done = () => { try { localStorage.setItem('sermon-news-seen', nw.dataset.ver); } catch (e) { /* private mode */ } };
    if (seen !== nw.dataset.ver) {
      setTimeout(() => { nw.hidden = false; void nw.offsetWidth; nw.classList.add('show'); }, 1800);
      nw.querySelector('.nw-x').addEventListener('click', () => { done(); nw.classList.remove('show'); setTimeout(() => { nw.hidden = true; }, 450); });
      nw.querySelector('.nw-go').addEventListener('click', done);
    }
  }

  // ---- Gentle appear on scroll. ----
  const items = document.querySelectorAll('.rise');
  if (still || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const seen = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el, n) => { if (el.closest('.hero')) el.style.transitionDelay = `${n * 0.06}s`; seen.observe(el); });
})();
