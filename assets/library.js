/* Elite Hockey Drills — Library JS */
(function(){
  const heroSearch    = document.getElementById('heroSearch');
  const heroSearchClear = document.getElementById('heroSearchClear');
  const sortSelect    = document.getElementById('sortSelect');
  const resultCount   = document.getElementById('resultCount');
  const resultsSection= document.getElementById('resultsSection');
  const resultsGrid   = document.getElementById('resultsGrid');
  const emptyState    = document.getElementById('emptyState');
  const groupedSection= document.getElementById('groupedSection');
  const clearBtn      = document.getElementById('clearBtn');
  const catTabs       = document.querySelectorAll('.cat-link');
  const railMarker    = document.getElementById('railMarker');

  let searchQuery = '';
  let activeTab   = '';
  let sortMode    = 'category';
  let videoSlugs  = new Set();
  let debounceTimer;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const canHover     = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // ── Search ──
  function onSearch(q) {
    searchQuery = q.trim().toLowerCase();
    heroSearch.value = q;
    heroSearchClear.hidden = !q;
    heroSearch.closest('.hero-search').classList.toggle('has-value', !!q);
    debounce(render, 100);
  }
  heroSearch.addEventListener('input', () => onSearch(heroSearch.value));
  heroSearchClear.addEventListener('click', () => { onSearch(''); heroSearch.focus(); });
  // "/" anywhere focuses the search box
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      heroSearch.focus();
    }
  });
  if (clearBtn) clearBtn.addEventListener('click', () => { onSearch(''); setTab(''); });

  // ── Sort ── (sort dropdown is optional; guard against missing element)
  if (sortSelect) sortSelect.addEventListener('change', () => { sortMode = sortSelect.value; render(); });

  // ── Category tabs ──
  function setTab(cat) {
    activeTab = cat;
    catTabs.forEach(t => {
      const active = t.dataset.cat === cat;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', String(active));
    });
    moveRailMarker();
  }
  catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      if (activeTab === cat && !searchQuery) return; // clicking active "All" does nothing
      setTab(cat);
      render();
    });
  });

  // ── Helpers ──
  function debounce(fn, ms) { clearTimeout(debounceTimer); debounceTimer = setTimeout(fn, ms); }
  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // up to 2 muscle "chips" from a comma-separated list
  function muscleChips(str) {
    return (str||'').split(',').slice(0,2).map(m => m.trim()).filter(Boolean)
      .map(m => m.charAt(0).toUpperCase() + m.slice(1))
      .map(m => '<span class="ex-muscle-chip">' + esc(m) + '</span>').join('');
  }
  // count a number up from 0 with an ease-out curve
  function animateCount(el, target, dur) {
    if (reduceMotion || document.hidden) { el.textContent = target; return; }
    const start = performance.now();
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  // glide the shared rail marker to the active link (desktop only; hidden on mobile)
  function moveRailMarker() {
    if (!railMarker) return;
    const active = document.querySelector('.cat-link.is-active');
    if (!active || getComputedStyle(railMarker).display === 'none') { railMarker.style.opacity = '0'; return; }
    railMarker.style.height = active.offsetHeight + 'px';
    railMarker.style.transform = 'translateY(' + active.offsetTop + 'px)';
    railMarker.style.opacity = '1';
  }
  // FLIP: cards that persist GLIDE to their new positions; new cards fade-rise in
  function flipRender(mutate) {
    if (reduceMotion) { mutate(); return; }
    const first = new Map();
    resultsGrid.querySelectorAll('.ex-card').forEach(c => first.set(c.getAttribute('href'), c.getBoundingClientRect()));
    mutate();
    resultsGrid.querySelectorAll('.ex-card').forEach(c => {
      const prev = first.get(c.getAttribute('href'));
      const now = c.getBoundingClientRect();
      if (prev) {
        const dx = prev.left - now.left, dy = prev.top - now.top;
        if (dx || dy) c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.4,0,.2,1)' });
      } else {
        c.animate([{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 430, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  }

  function matches(ex) {
    if (activeTab && ex.category !== activeTab) return false;
    if (searchQuery) {
      const hay = [ex.name, ex.category, ex.muscles||'', ex.cues||''].join(' ').toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  }

  function cardHTML(ex) {
    const vid = videoSlugs.has(ex.slug) ? ' has-video' : '';
    return '<a class="ex-card' + vid + '" data-num="' + ex.num + '" href="/exercises/' + ex.slug + '.html">' +
      '<div class="ex-card-inner">' +
      '<span class="ex-cat-tag">' + esc(ex.category) + '</span>' +
      '<h3 class="ex-card-name display">' + esc(ex.name) + '</h3>' +
      '<p class="ex-card-muscles">' + muscleChips(ex.muscles) + '</p>' +
      '</div>' +
      '<svg class="ex-card-arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>' +
      '</a>';
  }

  function render() {
    const isDefault = !searchQuery && !activeTab;
    if (isDefault) {
      resultsSection.hidden = true;
      groupedSection.hidden = false;
      resultCount.textContent = '';
      return;
    }
    groupedSection.hidden = true;
    resultsSection.hidden = false;
    const filtered = EXERCISES.filter(matches);
    const sorted = [...filtered].sort((a, b) => {
      if (sortMode === 'az')  return a.name.localeCompare(b.name);
      if (sortMode === 'num') return a.num - b.num;
      return EXERCISES.indexOf(a) - EXERCISES.indexOf(b);
    });
    const noun = (activeTab && !searchQuery) ? 'exercise' : 'result';
    resultCount.innerHTML = '<b>' + sorted.length + '</b> ' + noun + (sorted.length !== 1 ? 's' : '');
    emptyState.hidden = sorted.length > 0;
    flipRender(() => { resultsGrid.innerHTML = sorted.length ? sorted.map(cardHTML).join('') : ''; });
  }

  // ── Rail counts + muscle chips on the static (default-view) cards ──
  function initRailCounts() {
    const counts = {};
    EXERCISES.forEach(ex => { counts[ex.category] = (counts[ex.category] || 0) + 1; });
    catTabs.forEach(link => {
      const span = link.querySelector('.cat-link-count');
      if (!span) return;
      const cat = link.dataset.cat;
      const target = cat ? (counts[cat] || 0) : EXERCISES.length;
      span.textContent = '0';
      animateCount(span, target, 650);
    });
  }
  function decorateStaticMuscles() {
    groupedSection.querySelectorAll('.ex-card').forEach(card => {
      const p = card.querySelector('.ex-card-muscles');
      if (!p) return;
      p.innerHTML = muscleChips(card.getAttribute('data-muscles') || p.textContent);
    });
  }
  initRailCounts();
  decorateStaticMuscles();

  // ── Video badges: video-map.json (slug→R2 clip) is the source of truth for "has a demo" ──
  function decorateVideoBadges() {
    groupedSection.querySelectorAll('.ex-card').forEach(card => {
      const m = (card.getAttribute('href') || '').match(/\/exercises\/([^/]+)\.html/);
      if (m && videoSlugs.has(m[1])) card.classList.add('has-video');
    });
  }
  fetch('/video-map.json')
    .then(r => r.ok ? r.json() : {})
    .then(map => {
      videoSlugs = new Set(Object.keys(map));
      decorateVideoBadges();
      if (!resultsSection.hidden) render(); // refresh filtered cards so they pick up badges
    })
    .catch(() => {});

  // ── Cursor-follow spotlight + 3D tilt on cards (pointer devices only) ──
  if (canHover && !reduceMotion) {
    const main = document.getElementById('main');
    let cur = null;
    const resetTilt = c => { if (c) c.style.transform = ''; };
    main.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.ex-card');
      if (card !== cur) { resetTilt(cur); cur = card; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', (x * 100) + '%');
      card.style.setProperty('--my', (y * 100) + '%');
      card.style.transform = 'rotateX(' + (-(y - .5) * 6).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 6).toFixed(2) + 'deg) translateY(-5px)';
    }, { passive: true });
    main.addEventListener('mouseleave', () => { resetTilt(cur); cur = null; });
  }

  // ── Hero entrance: masked title + staggered rise + stat count-up ──
  (function heroEnter() {
    const title = document.getElementById('lib-h1');
    const show = () => {
      if (title) title.classList.add('in');
      document.querySelectorAll('.hero-rise').forEach(el => el.classList.add('in'));
    };
    // setTimeout (not rAF) so the reveal still fires if the page loads in a background tab
    reduceMotion ? show() : setTimeout(show, 60);
    if (!reduceMotion && !document.hidden) {
      const se = document.getElementById('statExercises');
      const sp = document.getElementById('statPatterns');
      if (se) { se.textContent = '0'; setTimeout(() => animateCount(se, 175, 1100), 360); }
      if (sp) { sp.textContent = '0'; setTimeout(() => animateCount(sp, 16, 1100), 360); }
    }
  })();

  // ── Living search bar: cycle example searches as a typewriter placeholder when idle ──
  if (!reduceMotion) (function () {
    const examples = ['squat', 'plyo', 'sprint', 'core', 'mobility', 'hinge'];
    const DEFAULT = 'Search 175 exercises…';
    let i = 0, timer;
    const idle = () => document.activeElement !== heroSearch && !heroSearch.value;
    function type(text) {
      let n = 0; clearInterval(timer);
      timer = setInterval(() => {
        if (!idle()) { clearInterval(timer); heroSearch.placeholder = DEFAULT; return; }
        heroSearch.placeholder = text.slice(0, n) + (n < text.length ? '▏' : '');
        if (n++ > text.length) { clearInterval(timer); setTimeout(cycle, 2200); }
      }, 55);
    }
    function cycle() {
      if (!idle()) { heroSearch.placeholder = DEFAULT; return; }
      type('Search "' + examples[i++ % examples.length] + '"…');
    }
    setTimeout(cycle, 2800);
  })();

  // position the rail marker now and keep it correct on resize
  moveRailMarker();
  let rTimer;
  window.addEventListener('resize', () => { clearTimeout(rTimer); rTimer = setTimeout(moveRailMarker, 120); }, { passive: true });

  render();
})();
