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
  const catTabs       = document.querySelectorAll('.cat-tab');
  const tabsWrap      = document.getElementById('catTabsWrap');

  let searchQuery = '';
  let activeTab   = '';
  let sortMode    = 'category';
  let debounceTimer;

  // ── Auto-hide tabs on scroll-down, reveal on scroll-up ──
  let lastScrollY = window.scrollY;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const heroBottom = document.getElementById('libHero').offsetHeight;
        if (y > heroBottom) {
          tabsWrap.classList.toggle('tabs-hidden', y > lastScrollY + 4);
        } else {
          tabsWrap.classList.remove('tabs-hidden');
        }
        lastScrollY = y;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ── Search ──
  function onSearch(q) {
    searchQuery = q.trim().toLowerCase();
    heroSearch.value = q;
    heroSearchClear.hidden = !q;
    debounce(render, 100);
  }
  heroSearch.addEventListener('input', () => onSearch(heroSearch.value));
  heroSearchClear.addEventListener('click', () => { onSearch(''); heroSearch.focus(); });
  if (clearBtn) clearBtn.addEventListener('click', () => { onSearch(''); setTab(''); });

  // ── Sort ──
  sortSelect.addEventListener('change', () => { sortMode = sortSelect.value; render(); });

  // ── Category tabs ──
  function setTab(cat) {
    activeTab = cat;
    catTabs.forEach(t => {
      const active = t.dataset.cat === cat;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', String(active));
    });
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

  function matches(ex) {
    if (activeTab && ex.category !== activeTab) return false;
    if (searchQuery) {
      const hay = [ex.name, ex.category, ex.muscles||'', ex.cues||''].join(' ').toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  }

  function cardHTML(ex) {
    const muscle = (ex.muscles||'').split(',')[0].trim();
    return '<a class="ex-card" href="/exercises/' + ex.slug + '.html">' +
      '<div class="ex-card-inner">' +
      '<span class="ex-cat-tag">' + esc(ex.category) + '</span>' +
      '<h3 class="ex-card-name display">' + esc(ex.name) + '</h3>' +
      '<p class="ex-card-muscles">' + esc(muscle) + '</p>' +
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
    const label = activeTab && !searchQuery
      ? sorted.length + ' exercise' + (sorted.length !== 1 ? 's' : '')
      : sorted.length + ' result' + (sorted.length !== 1 ? 's' : '');
    resultCount.textContent = label;
    emptyState.hidden = sorted.length > 0;
    resultsGrid.innerHTML = sorted.length ? sorted.map(cardHTML).join('') : '';
  }

  render();
})();
