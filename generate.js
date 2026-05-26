#!/usr/bin/env node
/**
 * Elite Hockey Drills — Exercise Library Generator
 * Usage:  node generate.js          → full build (all exercises)
 *         node generate.js --test   → test build (first 3 exercises only)
 *
 * Requires: npm install xlsx
 */

const XLSX  = require('./node_modules/xlsx');
const fs    = require('fs');
const path  = require('path');

const TEST_MODE  = process.argv.includes('--test');
const limitArg   = process.argv.find(a => a.startsWith('--limit='));
const LIMIT      = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;
const SITE_URL   = 'https://elitehockeydrills.com';
const TODAY      = new Date().toISOString().slice(0, 10);
const GA_TAG     = 'G-JH623WRMN8';

// ─── 1. Parse Excel ───────────────────────────────────────────────────────────

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets['Exercise Library'];
  const range = XLSX.utils.decode_range(ws['!ref']);

  // Read header row (row index 3 = row 4)
  const HEADERS = {};
  for (let c = 0; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 3, c })];
    if (cell) HEADERS[cell.v.trim()] = c;
  }

  // Detect video column
  let videoCol = null;
  for (const [h, c] of Object.entries(HEADERS)) {
    if (/video|link/i.test(h)) { videoCol = c; break; }
  }

  const colOf = (name) => {
    for (const [h, c] of Object.entries(HEADERS)) {
      if (h.toLowerCase() === name.toLowerCase()) return c;
    }
    return null;
  };

  const C = {
    num:        colOf('#'),
    name:       colOf('EXERCISE'),
    execution:  colOf('Execution'),
    why:        colOf('Why It Works'),
    transfer:   colOf('Hockey Transfer'),
    cues:       colOf('Coaching Cues'),
    mistakes:   colOf('Common Mistakes'),
    progression:colOf('Progression / Regression'),
    muscles:    colOf('Primary Muscles'),
    energy:     colOf('Energy System'),
    video:      videoCol,
  };

  const val = (r, c) => {
    if (c == null) return '';
    const cell = ws[XLSX.utils.encode_cell({ r, c })];
    return cell ? String(cell.v).trim() : '';
  };

  const categories = [];
  const exercises  = [];
  let currentCat   = '';

  for (let r = 4; r <= range.e.r; r++) {
    const numRaw  = val(r, C.num);
    const nameRaw = val(r, C.name);

    // Category row: # has text, EXERCISE is empty
    if (numRaw && !nameRaw) {
      currentCat = tidyCategory(numRaw);
      if (!categories.includes(currentCat)) categories.push(currentCat);
      continue;
    }

    // Exercise row
    const numVal = parseFloat(numRaw);
    if (!isNaN(numVal) && nameRaw) {
      exercises.push({
        num:        numVal,
        name:       nameRaw,
        category:   currentCat,
        execution:  val(r, C.execution),
        why:        val(r, C.why),
        transfer:   val(r, C.transfer),
        cues:       val(r, C.cues),
        mistakes:   val(r, C.mistakes),
        progression:val(r, C.progression),
        muscles:    val(r, C.muscles),
        energy:     val(r, C.energy),
        video:      C.video != null ? val(r, C.video) : '',
      });
    }
  }

  return { categories, exercises };
}

function tidyCategory(raw) {
  // "01   WARM-UP / MOBILITY" → "Warm-Up / Mobility"
  return raw
    .replace(/^\d+\s*/, '')       // strip leading number
    .replace(/·/g, '/')           // bullet → slash if needed
    .trim()
    .split(/\s+/)
    .map(w => {
      if (['&', '/', 'AND', 'TO', 'IN', 'OF', 'A'].includes(w.toUpperCase())) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/ \/ /g, ' / ')
    .replace(/  +/g, ' ');
}

// ─── 2. Slug generation ───────────────────────────────────────────────────────

function makeSlug(name, used = new Set()) {
  let base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  let slug = base;
  let n = 2;
  while (used.has(slug)) { slug = `${base}-${n++}`; }
  used.add(slug);
  return slug;
}

// ─── 3. Shared HTML fragments ─────────────────────────────────────────────────

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E")`;

function gaSnippet() {
  return `  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA_TAG}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_TAG}');
  </script>`;
}

function fontLink() {
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600;700&display=swap" rel="stylesheet" />`;
}

function navHTML(activePage = '') {
  return `<header class="nav" id="nav">
  <a href="${SITE_URL}" class="nav-logo"><span class="dot"></span>ELITE HOCKEY DRILLS</a>
  <nav aria-label="Main navigation">
    <ul class="nav-links">
      <li><a href="${SITE_URL}#about">Coach</a></li>
      <li><a href="${SITE_URL}#method">Method</a></li>
      <li><a href="${SITE_URL}#tiers">Programs</a></li>
      <li><a href="/library.html"${activePage === 'library' ? ' aria-current="page"' : ''}>Library</a></li>
      <li><a href="${SITE_URL}#faq">FAQ</a></li>
    </ul>
  </nav>
  <a href="${SITE_URL}#tiers" class="nav-cta btn btn-primary">Get Started</a>
</header>`;
}

function footerHTML() {
  return `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="nav-logo" href="${SITE_URL}"><span class="dot"></span>ELITE HOCKEY DRILLS</a>
      <p>Science-backed off-ice training for hockey players. Built by a certified sport scientist and national team coach.</p>
    </div>
    <div class="footer-col">
      <h4>Programs</h4>
      <ul>
        <li><a href="${SITE_URL}/survey.html">Free 5-Day PDF</a></li>
        <li><a href="${SITE_URL}#tiers">12-Week Programs</a></li>
        <li><a href="${SITE_URL}#tiers">Family Bundle</a></li>
        <li><a href="${SITE_URL}#app">App Waitlist</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Navigate</h4>
      <ul>
        <li><a href="${SITE_URL}#about">About</a></li>
        <li><a href="${SITE_URL}#method">Method</a></li>
        <li><a href="/library.html">Exercise Library</a></li>
        <li><a href="${SITE_URL}#faq">FAQ</a></li>
      </ul>
    </div>
    <div class="footer-col">
      <h4>Connect</h4>
      <ul>
        <li><a href="https://instagram.com/elite_hockey_drills" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="https://wa.me/420770149067" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><a href="mailto:elitehockeydrills@gmail.com">Email</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 Elite Hockey Drills. All rights reserved.</span>
    <a class="footer-ig" href="https://instagram.com/elite_hockey_drills" target="_blank" rel="noopener">@elite_hockey_drills</a>
  </div>
</footer>`;
}

function sharedBaseCSS() {
  return `/* Elite Hockey Drills — Library shared CSS */
:root{
  --bg:#070708; --bg-2:#0C0C10; --bg-3:#131318;
  --line:#1B1B22; --line-2:#25252E;
  --ink:#ECEDEF; --ink-2:#9398A2; --ink-3:#5A5F6B;
  --ice:#5DB4E5; --ice-soft:#5DB4E518; --ice-line:#5DB4E535;
  --warm:#E8B777; --card:#0E0E13; --card-2:#14141B; --green:#4FB371;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
[hidden]{display:none!important;}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;}
body{
  font-family:'Inter Tight',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  background:var(--bg); color:var(--ink); line-height:1.5; overflow-x:hidden;
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}
img,svg{max-width:100%;display:block;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit;}
input,select,textarea{font-family:inherit;}
body::after{
  content:''; position:fixed; inset:0;
  background-image:${NOISE_SVG};
  pointer-events:none; z-index:1; mix-blend-mode:overlay; opacity:.35;
}
.display{font-family:'Bebas Neue',sans-serif;letter-spacing:.01em;line-height:.92;font-weight:400;}
.serif{font-family:'Instrument Serif',serif;font-style:italic;font-weight:400;letter-spacing:-.01em;}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-3);}
.eyebrow.ice{color:var(--ice);}
.wrap{max-width:1240px;margin:0 auto;padding:0 24px;}
section{position:relative;z-index:2;}
/* NAV */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:90;
  padding:16px 24px;
  display:flex;align-items:center;justify-content:space-between;
  background:rgba(7,7,8,.7);
  backdrop-filter:blur(18px) saturate(150%);
  -webkit-backdrop-filter:blur(18px) saturate(150%);
  border-bottom:1px solid transparent;
  transition:border-color .3s,background .3s;
}
.nav.scrolled{border-bottom-color:var(--line);}
.nav-logo{
  font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:.14em;
  display:flex;align-items:center;gap:8px;
}
.nav-logo .dot{
  width:6px;height:6px;background:var(--ice);border-radius:50%;
  box-shadow:0 0 12px var(--ice);animation:dotPulse 2.4s ease-in-out infinite;
}
@keyframes dotPulse{0%,100%{opacity:1;}50%{opacity:.45;}}
.nav-links{display:none;gap:32px;list-style:none;}
.nav-links a{font-size:13px;font-weight:500;color:var(--ink-2);letter-spacing:.04em;transition:color .2s;}
.nav-links a:hover,.nav-links a[aria-current]{color:var(--ink);}
.nav-links a{position:relative;}
.nav-links a::after{
  content:'';position:absolute;bottom:-4px;left:0;width:100%;height:1px;
  background:var(--warm);transform:scaleX(0);transform-origin:right center;
  transition:transform .4s cubic-bezier(.2,.7,.2,1);
}
.nav-links a:hover::after,.nav-links a[aria-current]::after{transform:scaleX(1);transform-origin:left center;}
@media(min-width:900px){.nav-links{display:flex;}.nav{padding:18px 40px;}}
/* BUTTONS */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  padding:16px 24px;font-size:14px;font-weight:600;letter-spacing:.02em;
  border-radius:100px;transition:all .25s cubic-bezier(.4,0,.2,1);
  white-space:nowrap;min-height:50px;
}
.btn-primary{
  position:relative;overflow:hidden;
  background:linear-gradient(180deg,#1A1410 0%,#0C0907 100%);
  color:#E8B777;border:1px solid rgba(232,183,119,.18);
  box-shadow:inset 0 1px 0 rgba(232,183,119,.08),inset 0 -1px 0 rgba(0,0,0,.4),0 1px 2px rgba(0,0,0,.5);
  transition:transform .45s cubic-bezier(.2,.7,.2,1),box-shadow .45s cubic-bezier(.2,.7,.2,1),border-color .35s,color .35s;
  font-weight:600;letter-spacing:.03em;
}
.btn-primary::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(ellipse at center,rgba(232,183,119,.10) 0%,rgba(232,183,119,0) 70%);
  opacity:0;transition:opacity .5s cubic-bezier(.2,.7,.2,1);pointer-events:none;
}
.btn-primary::after{
  content:'';position:absolute;top:0;left:0;width:100%;height:100%;
  background:linear-gradient(120deg,transparent 0%,rgba(232,183,119,.20) 50%,transparent 100%);
  transform:translateX(-130%);transition:transform 1.1s cubic-bezier(.25,.8,.25,1);pointer-events:none;
}
.btn-primary:hover{
  transform:translateY(-3px);border-color:rgba(232,183,119,.4);color:#F2C589;
  box-shadow:inset 0 1px 0 rgba(232,183,119,.15),inset 0 -1px 0 rgba(0,0,0,.5),
    0 18px 40px -14px rgba(0,0,0,.6),0 0 40px -12px rgba(232,183,119,.18);
}
.btn-primary:hover::before{opacity:1;}
.btn-primary:hover::after{transform:translateX(130%);}
.btn-primary:active{transform:translateY(-1px);transition:transform .12s ease;}
.btn-ghost{
  border:1px solid var(--line-2);color:var(--ink);background:transparent;
  transition:all .35s cubic-bezier(.2,.7,.2,1);letter-spacing:.03em;font-weight:500;
}
.btn-ghost:hover{border-color:var(--warm);color:var(--warm);transform:translateY(-2px);}
.btn-arrow{transition:transform .4s cubic-bezier(.2,.7,.2,1);}
.btn-primary:hover .btn-arrow,.btn-ghost:hover .btn-arrow{transform:translateX(6px);}
/* FOOTER */
.footer{background:#040405;border-top:1px solid var(--line);padding:64px 24px 100px;}
.footer-inner{max-width:1240px;margin:0 auto;display:grid;gap:40px;margin-bottom:40px;}
.footer-brand p{color:var(--ink-3);font-size:13px;line-height:1.7;margin-top:16px;max-width:280px;}
.footer-col h4{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--ice);margin-bottom:18px;}
.footer-col ul{list-style:none;display:flex;flex-direction:column;gap:10px;}
.footer-col a{font-size:13.5px;color:var(--ink-2);transition:color .2s;}
.footer-col a:hover{color:var(--ink);}
.footer-bottom{
  max-width:1240px;margin:0 auto;padding-top:32px;border-top:1px solid var(--line);
  display:flex;flex-direction:column;gap:14px;font-size:12px;color:var(--ink-3);
}
.footer-ig{display:inline-flex;align-items:center;gap:8px;color:var(--ice);}
@media(min-width:780px){
  .footer{padding:80px 40px 100px;}
  .footer-inner{grid-template-columns:2fr 1fr 1fr 1fr;}
  .footer-bottom{flex-direction:row;justify-content:space-between;align-items:center;}
}
/* REVEAL */
.reveal{opacity:0;transform:translateY(20px);transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1);}
.reveal.in{opacity:1;transform:translateY(0);}
@media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none;}}
`;
}

// ─── 4. library.html ──────────────────────────────────────────────────────────

function buildLibraryPage(exercises, categories) {
  const totalEx  = exercises.length;
  const totalCat = categories.length;

  const exJSON = JSON.stringify(exercises.map(ex => ({
    num: ex.num, name: ex.name, slug: ex.slug,
    category: ex.category, muscles: ex.muscles, cues: ex.cues,
  })));

  // Category tab buttons
  const catTabs = categories.map(cat =>
    `<button class="cat-tab" data-cat="${escHtml(cat)}" aria-pressed="false">${escHtml(cat)}</button>`
  ).join('\n      ');

  // Grouped cards for default "All" view
  let groupedCards = '';
  for (const cat of categories) {
    const catExes = exercises.filter(e => e.category === cat);
    if (!catExes.length) continue;
    const catSlug = makeSlug(cat);
    groupedCards += `
    <div class="cat-group" data-category="${escHtml(cat)}" id="cat-${catSlug}">
      <div class="cat-group-header">
        <h2 class="cat-group-title display">${escHtml(cat)}</h2>
        <span class="cat-group-count">${catExes.length}</span>
      </div>
      <div class="ex-grid">
        ${catExes.map(ex => exerciseCard(ex)).join('\n        ')}
      </div>
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
${gaSnippet()}
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<title>Exercise Library — Off-Ice Hockey Training | Elite Hockey Drills</title>
<meta name="description" content="Browse ${totalEx} off-ice hockey exercises across ${totalCat} movement categories. Searchable, filterable, built by a sport scientist." />
<meta property="og:title" content="Exercise Library | Elite Hockey Drills" />
<meta property="og:description" content="${totalEx} exercises · ${totalCat} movement patterns. Science-backed off-ice hockey training." />
<meta property="og:url" content="${SITE_URL}/library.html" />
<link rel="canonical" href="${SITE_URL}/library.html" />
${fontLink()}
<link rel="stylesheet" href="/assets/library.css" />
</head>
<body>
${navHTML('library')}

<!-- ── HERO ── -->
<section class="lib-hero" id="libHero" aria-labelledby="lib-h1">
  <div class="lib-hero-glow"></div>
  <div class="lib-hero-grid"></div>
  <div class="wrap lib-hero-content">
    <div class="eyebrow ice lib-eyebrow">Exercise Library</div>
    <h1 id="lib-h1" class="display lib-title">The Full<br><em class="serif">Exercise Arsenal.</em></h1>
    <p class="lib-subtitle">${totalEx} exercises &nbsp;·&nbsp; ${totalCat} movement patterns</p>

    <!-- Hero search -->
    <div class="hero-search" id="heroSearchWrap">
      <svg class="hero-search-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="search" id="heroSearch" class="hero-search-input"
        placeholder="Search 176 exercises…" aria-label="Search exercises" autocomplete="off" />
      <button class="hero-search-clear" id="heroSearchClear" aria-label="Clear search" hidden>✕</button>
    </div>
    <p class="result-count" id="resultCount" aria-live="polite" aria-atomic="true"></p>
  </div>
</section>

<!-- ── CATEGORY TABS (sticky, auto-hide on scroll-down) ── -->
<div class="cat-tabs-wrap" id="catTabsWrap">
  <div class="wrap">
    <div class="cat-tabs" id="catTabs" role="tablist" aria-label="Filter by category">
      <button class="cat-tab cat-tab--all is-active" data-cat="" aria-pressed="true">All <span class="cat-tab-count">${totalEx}</span></button>
      ${catTabs}
    </div>
  </div>
</div>

<!-- ── CONTENT ── -->
<main id="main">

  <!-- Search / tab results -->
  <section class="results-section" id="resultsSection" hidden aria-label="Filtered exercises">
    <div class="wrap">
      <div class="ex-grid" id="resultsGrid"></div>
      <div class="empty-state" id="emptyState" hidden>
        <p class="display empty-headline">No results.</p>
        <p class="empty-sub">Try a different search or pick another category.</p>
        <button class="btn btn-ghost" id="clearBtn">Clear search</button>
      </div>
    </div>
  </section>

  <!-- Default grouped view -->
  <section class="grouped-section" id="groupedSection" aria-label="Exercises by category">
    <div class="wrap">
      ${groupedCards}
    </div>
  </section>

</main>

${footerHTML()}

<script>const EXERCISES = ${exJSON};</script>
<script src="/assets/library.js"></script>
<script>
// Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
// Reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 40); io.unobserve(e.target); } });
}, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
</script>
</body>
</html>`;
}

function exerciseCard(ex) {
  const muscles = ex.muscles ? ex.muscles.split(',')[0].trim() : '';
  return `<a class="ex-card reveal" href="/exercises/${ex.slug}.html" data-category="${escHtml(ex.category)}" data-muscles="${escHtml(ex.muscles)}" data-energy="${escHtml(ex.energy)}" data-num="${ex.num}" data-name="${escHtml(ex.name)}">
  <div class="ex-card-inner">
    <span class="ex-cat-tag">${escHtml(ex.category)}</span>
    <h3 class="ex-card-name display">${escHtml(ex.name)}</h3>
    <p class="ex-card-muscles">${escHtml(muscles)}</p>
  </div>
  <svg class="ex-card-arrow" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
</a>`;
}

// ─── 5. Exercise detail page ──────────────────────────────────────────────────

function buildExercisePage(ex, allInCat, prevEx, nextEx) {
  const descMeta = ex.transfer
    ? ex.transfer.replace(/<[^>]+>/g, '').substring(0, 155).trim()
    : ex.execution.substring(0, 155).trim();

  const cueItems = ex.cues
    ? ex.cues.split('·').map(c => c.trim()).filter(Boolean)
    : [];

  const muscleList = ex.muscles
    ? ex.muscles.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  // Progression / Regression split
  let progressText = '', regressText = '';
  if (ex.progression) {
    const progMatch = ex.progression.match(/Progress(?:ion)?:\s*([^|]+)/i);
    const regMatch  = ex.progression.match(/Regress(?:ion)?:\s*(.+)/i);
    progressText = progMatch ? progMatch[1].trim() : '';
    regressText  = regMatch  ? regMatch[1].trim()  : '';
    if (!progressText && !regMatch) { progressText = ex.progression; }
  }

  // Video embed
  const videoSlot = buildVideoSlot(ex.video);

  // Related: up to 3 others in same category
  const related = allInCat.filter(e => e.slug !== ex.slug).slice(0, 3);

  // JSON-LD HowTo
  const steps = ex.execution
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .map(s => `{"@type":"HowToStep","text":${JSON.stringify(s + '.')}}`)
    .join(',');

  const jsonLd = `{
    "@context":"https://schema.org",
    "@type":"HowTo",
    "name":${JSON.stringify(ex.name + ' — Off-Ice Hockey Exercise')},
    "description":${JSON.stringify(descMeta)},
    "step":[${steps}]
  }`;

  const prevLink = prevEx
    ? `<a class="pn-link pn-prev" href="/exercises/${prevEx.slug}.html"><span class="pn-arrow">←</span><span class="pn-name">${escHtml(prevEx.name)}</span></a>`
    : `<span class="pn-link pn-disabled"><span class="pn-arrow">←</span><span class="pn-name">First exercise</span></span>`;
  const nextLink = nextEx
    ? `<a class="pn-link pn-next" href="/exercises/${nextEx.slug}.html"><span class="pn-name">${escHtml(nextEx.name)}</span><span class="pn-arrow">→</span></a>`
    : `<span class="pn-link pn-disabled"><span class="pn-name">Last exercise</span><span class="pn-arrow">→</span></span>`;

  const relatedCards = related.map(r => `
    <a class="related-card reveal" href="/exercises/${r.slug}.html">
      <div class="related-card-top">
        <span class="ex-cat-tag">${escHtml(r.category)}</span>
        <svg class="related-arrow" aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </div>
      <h4 class="related-name display">${escHtml(r.name)}</h4>
      <p class="related-muscles">${escHtml((r.muscles||'').split(',')[0].trim())}</p>
    </a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
${gaSnippet()}
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="theme-color" content="#070708" />
<title>${escHtml(ex.name)} — Off-Ice Hockey Training | Elite Hockey Drills</title>
<meta name="description" content="${escHtml(descMeta)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escHtml(ex.name)} | Elite Hockey Drills" />
<meta property="og:description" content="${escHtml(descMeta)}" />
<meta property="og:url" content="${SITE_URL}/exercises/${ex.slug}.html" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escHtml(ex.name)} | Elite Hockey Drills" />
<meta name="twitter:description" content="${escHtml(descMeta)}" />
<link rel="canonical" href="${SITE_URL}/exercises/${ex.slug}.html" />
${fontLink()}
<link rel="stylesheet" href="/assets/library.css" />
<link rel="stylesheet" href="/assets/exercise.css" />
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
${navHTML()}

<main id="main">

<!-- EXERCISE HERO -->
<section class="ex-hero" aria-labelledby="ex-h1">
  <div class="ex-hero-glow"></div>
  <div class="ex-hero-grid-glow"></div>
  <div class="wrap ex-hero-inner">

    <!-- BREADCRUMB -->
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li><a href="${SITE_URL}">Home</a></li>
        <li><a href="/library.html">Library</a></li>
        <li><a href="/library.html#cat-${makeSlug(ex.category)}">${escHtml(ex.category)}</a></li>
        <li aria-current="page">${escHtml(ex.name)}</li>
      </ol>
    </nav>

    <div class="ex-hero-content reveal">
      <div class="eyebrow ice ex-eyebrow">${escHtml(ex.category)}</div>
      <h1 id="ex-h1" class="display ex-title">${escHtml(ex.name)}</h1>
      <div class="ex-meta-tags">
        ${muscleList.map(m => `<span class="meta-tag">${escHtml(m)}</span>`).join('')}
        ${ex.energy ? `<span class="meta-tag meta-tag-energy">${escHtml(ex.energy)}</span>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- MEDIA SLOT -->
<div class="media-wrap">
  <div class="wrap">
    <div class="media-slot reveal">
      ${videoSlot}
    </div>
  </div>
</div>

<!-- CONTENT SECTIONS -->
<div class="ex-body">

  ${ex.execution ? `<div class="ex-band ex-band--alt">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">i.</span>
        <h2 class="ex-section-title">How to Do It</h2>
      </div>
      <p class="ex-section-body">${escHtml(ex.execution)}</p>
    </div>
  </div>` : ''}

  ${ex.why ? `<div class="ex-band">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">ii.</span>
        <h2 class="ex-section-title">Why It Works</h2>
      </div>
      <p class="ex-section-body">${escHtml(ex.why)}</p>
    </div>
  </div>` : ''}

  ${ex.transfer ? `<div class="ex-band ex-band--ice">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">iii.</span>
        <h2 class="ex-section-title">Hockey Transfer</h2>
      </div>
      <p class="ex-section-body">${escHtml(ex.transfer)}</p>
    </div>
  </div>` : ''}

  ${cueItems.length ? `<div class="ex-band ex-band--alt">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">iv.</span>
        <h2 class="ex-section-title">Coaching Cues</h2>
      </div>
      <ul class="cue-list" role="list">
        ${cueItems.map(c => `<li class="cue-chip">${escHtml(c)}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>` : ''}

  ${ex.mistakes ? `<div class="ex-band">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">v.</span>
        <h2 class="ex-section-title">Common Mistakes</h2>
      </div>
      <p class="ex-section-body">${escHtml(ex.mistakes)}</p>
    </div>
  </div>` : ''}

  ${(progressText || regressText) ? `<div class="ex-band ex-band--alt">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">vi.</span>
        <h2 class="ex-section-title">Progression / Regression</h2>
      </div>
      <div class="prog-reg-stack">
        ${progressText ? `<div class="prog-reg-row"><span class="prog-label prog">Progression</span><p class="prog-text">${escHtml(progressText)}</p></div>` : ''}
        ${regressText  ? `<div class="prog-reg-row"><span class="prog-label reg">Regression</span><p class="prog-text">${escHtml(regressText)}</p></div>`  : ''}
      </div>
    </div>
  </div>` : ''}

  ${muscleList.length ? `<div class="ex-band ex-band--alt">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">vii.</span>
        <h2 class="ex-section-title">Primary Muscles</h2>
      </div>
      <div class="muscle-tags">
        ${muscleList.map(m => `<span class="muscle-tag">${escHtml(m)}</span>`).join('')}
      </div>
    </div>
  </div>` : ''}

  ${ex.energy ? `<div class="ex-band">
    <div class="wrap ex-band-inner reveal">
      <div class="ex-band-label">
        <span class="band-num serif">viii.</span>
        <h2 class="ex-section-title">Energy System</h2>
      </div>
      <p class="energy-text">${escHtml(ex.energy)}</p>
    </div>
  </div>` : ''}

</div><!-- /.ex-body -->

<!-- PREV / NEXT -->
<nav class="pn-nav" aria-label="Navigate exercises in ${escHtml(ex.category)}">
  <div class="wrap pn-inner">
    ${prevLink}
    <span class="pn-category eyebrow">${escHtml(ex.category)}</span>
    ${nextLink}
  </div>
</nav>

<!-- RELATED -->
${related.length ? `<section class="related-section">
  <div class="wrap">
    <div class="related-head">
      <div class="eyebrow ice">More from this category</div>
      <h2 class="display related-title">${escHtml(ex.category)}</h2>
    </div>
    <div class="related-grid">
      ${relatedCards}
    </div>
  </div>
</section>` : ''}

<!-- CTA BLOCK -->
<section class="ex-cta">
  <div class="ex-cta-glow"></div>
  <div class="wrap ex-cta-inner reveal">
    <div class="eyebrow ice" style="margin-bottom:18px;">Ready to train?</div>
    <h2 class="display ex-cta-title">Put it to work<br><em class="serif">on the ice.</em></h2>
    <p class="ex-cta-sub">This exercise is part of a fully periodized 12-week off-ice program — built by a sport scientist who coaches at the national level.</p>
    <div class="ex-cta-btns">
      <a href="${SITE_URL}#tiers" class="btn btn-primary">
        See the Programs
        <svg class="btn-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
      <a href="${SITE_URL}/survey.html" class="btn btn-ghost">Get a Free Program</a>
    </div>
    <a href="/library.html" class="back-link">← Back to Exercise Library</a>
  </div>
</section>

</main>

${footerHTML()}

<script>
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
});
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) { setTimeout(() => e.target.classList.add('in'), i * 60); io.unobserve(e.target); }
  });
}, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
</script>
</body>
</html>`;
}

function section(title, text, cls) {
  if (!text) return '';
  return `<div class="ex-section ex-section--${cls}">
        <h2 class="ex-section-title">${title}</h2>
        <p class="ex-section-body">${escHtml(text)}</p>
      </div>`;
}

function buildVideoSlot(url) {
  if (!url) return placeholder();
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
  if (yt) return `<iframe class="video-embed" src="https://www.youtube.com/embed/${yt[1]}" title="Exercise demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `<iframe class="video-embed" src="https://player.vimeo.com/video/${vi[1]}" title="Exercise demo" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  if (/\.mp4/i.test(url)) return `<video class="video-embed" src="${escHtml(url)}" controls playsinline preload="metadata"></video>`;
  return placeholder();
}

function placeholder() {
  return `<div class="video-placeholder" role="img" aria-label="Demo video coming soon">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
      <p>Demo video coming soon</p>
    </div>`;
}

// ─── 6. CSS files ─────────────────────────────────────────────────────────────

function libraryCSS() {
  return `${sharedBaseCSS()}
/* ── LIBRARY HERO ── */
.lib-hero{
  padding:130px 24px 72px;position:relative;overflow:hidden;
  background:var(--bg);
}
.lib-hero-glow{
  position:absolute;top:-30%;right:-15%;
  width:80vw;height:80vw;max-width:800px;
  background:radial-gradient(closest-side,rgba(93,180,229,.07) 0%,transparent 70%);
  pointer-events:none;filter:blur(40px);z-index:0;
}
.lib-hero-grid{
  position:absolute;inset:0;
  background:
    repeating-linear-gradient(0deg,transparent,transparent 80px,rgba(93,180,229,.012) 80px,rgba(93,180,229,.012) 81px),
    repeating-linear-gradient(90deg,transparent,transparent 80px,rgba(93,180,229,.012) 80px,rgba(93,180,229,.012) 81px);
  pointer-events:none;z-index:0;
}
.lib-hero-content{position:relative;z-index:2;max-width:900px;}
.lib-eyebrow{margin-bottom:20px;}
.lib-title{
  font-size:clamp(64px,13vw,116px);line-height:.88;
  margin-bottom:16px;
}
.lib-title .serif{color:var(--ice);}
.lib-subtitle{font-size:15px;color:var(--ink-3);letter-spacing:.04em;margin-bottom:40px;}
@media(min-width:900px){.lib-hero{padding:160px 40px 88px;}}

/* HERO SEARCH */
.hero-search{
  position:relative;display:flex;align-items:center;
  max-width:680px;
  background:rgba(14,14,19,.8);
  border:1px solid var(--line-2);border-radius:100px;
  transition:border-color .3s,box-shadow .3s;
}
.hero-search:focus-within{
  border-color:rgba(93,180,229,.5);
  box-shadow:0 0 0 4px rgba(93,180,229,.08),0 24px 48px -16px rgba(0,0,0,.5);
}
.hero-search-icon{
  position:absolute;left:22px;color:var(--ink-3);pointer-events:none;flex-shrink:0;
  transition:color .2s;
}
.hero-search:focus-within .hero-search-icon{color:var(--ice);}
.hero-search-input{
  width:100%;padding:18px 52px 18px 56px;
  background:transparent;border:none;outline:none;
  color:var(--ink);font-size:16px;font-family:inherit;
}
.hero-search-input::placeholder{color:var(--ink-3);}
.hero-search-clear{
  position:absolute;right:18px;color:var(--ink-3);font-size:14px;
  cursor:pointer;padding:6px;transition:color .2s;border-radius:50%;
}
.hero-search-clear:hover{color:var(--ink);}
#resultCount{
  font-size:12px;color:var(--ink-3);letter-spacing:.06em;
  margin-top:14px;min-height:18px;
}

/* ── CATEGORY TABS (sticky, auto-hide on scroll-down) ── */
.cat-tabs-wrap{
  position:sticky;top:56px;z-index:50;
  background:rgba(7,7,8,.92);backdrop-filter:blur(18px) saturate(150%);
  -webkit-backdrop-filter:blur(18px) saturate(150%);
  border-bottom:1px solid var(--line);
  transform:translateY(0);
  transition:transform .3s cubic-bezier(.4,0,.2,1);
  will-change:transform;
}
.cat-tabs-wrap.tabs-hidden{transform:translateY(-100%);}
.cat-tabs-wrap .wrap{overflow-x:auto;scrollbar-width:none;}
.cat-tabs-wrap .wrap::-webkit-scrollbar{display:none;}
.cat-tabs{display:flex;gap:4px;padding:10px 0;min-width:max-content;}
.cat-tab{
  padding:7px 16px;border-radius:100px;
  font-size:12px;font-weight:600;letter-spacing:.04em;
  border:1px solid transparent;color:var(--ink-3);background:transparent;
  cursor:pointer;white-space:nowrap;
  transition:color .2s,background .2s,border-color .2s;
}
.cat-tab:hover{color:var(--ink);}
.cat-tab.is-active{background:var(--ice-soft);border-color:var(--ice-line);color:var(--ice);}
.cat-tab--all.is-active{background:rgba(232,183,119,.08);border-color:rgba(232,183,119,.2);color:var(--warm);}
.cat-tab:focus-visible{outline:2px solid var(--ice);outline-offset:2px;}
.cat-tab-count{display:inline-block;margin-left:4px;font-size:10px;opacity:.6;font-weight:700;}

/* ── CATEGORY GROUPS ── */
.grouped-section{padding:48px 0 100px;}
.cat-group{margin-bottom:72px;}
.cat-group-header{
  display:flex;align-items:baseline;gap:16px;
  padding-bottom:18px;margin-bottom:24px;
  border-bottom:1px solid var(--line);
}
.cat-group-title{
  font-size:clamp(26px,5vw,44px);color:var(--ink);line-height:1;
}
.cat-group-count{
  font-size:11px;font-weight:700;letter-spacing:.14em;
  color:var(--ink-3);text-transform:uppercase;
}

/* ── EXERCISE GRID ── */
.ex-grid{
  display:grid;gap:14px;
  grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
}
.results-section{padding:40px 0 100px;}

/* ── EXERCISE CARD ── */
.ex-card{
  display:flex;align-items:flex-start;justify-content:space-between;gap:12px;
  padding:22px 20px 22px 24px;
  background:var(--card);border:1px solid var(--line);border-radius:16px;
  cursor:pointer;
  transition:transform .35s cubic-bezier(.2,.7,.2,1),border-color .35s,box-shadow .35s;
  text-decoration:none;color:inherit;
}
.ex-card:hover{
  transform:translateY(-5px);border-color:var(--ice-line);
  box-shadow:0 20px 40px -14px rgba(0,0,0,.55),0 0 48px rgba(93,180,229,.06);
}
.ex-card:focus-visible{outline:2px solid var(--ice);outline-offset:2px;}
.ex-card-inner{flex:1;min-width:0;}
.ex-cat-tag{
  display:inline-block;font-size:9px;font-weight:700;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ice);margin-bottom:10px;
}
.ex-card-name{
  font-size:clamp(17px,3vw,21px);line-height:1.05;
  color:var(--ink);margin-bottom:8px;
  overflow:hidden;text-overflow:ellipsis;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
}
.ex-card-muscles{font-size:11px;color:var(--ink-3);}
.ex-card-arrow{
  color:var(--ink-3);flex-shrink:0;margin-top:2px;
  transition:transform .35s cubic-bezier(.2,.7,.2,1),color .25s;
}
.ex-card:hover .ex-card-arrow{transform:translateX(5px);color:var(--ice);}

/* ── EMPTY STATE ── */
.empty-state{text-align:center;padding:100px 24px;}
.empty-headline{font-size:clamp(48px,10vw,80px);color:var(--ink-3);}
.empty-sub{color:var(--ink-2);font-size:15px;margin:14px 0 32px;}

/* SR only */
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;}
`;
}

function exerciseCSS() {
  return `/* ══════════════════════════════════════════
   EXERCISE DETAIL PAGE — LUXURY REDESIGN
   Matches the dark-gold aesthetic of index.html
   ══════════════════════════════════════════ */

/* ── EXERCISE HERO ── */
.ex-hero{
  position:relative;overflow:hidden;
  padding:110px 24px 56px;
  background:var(--bg);
  border-bottom:1px solid var(--line);
}
.ex-hero-glow{
  position:absolute;top:-10%;right:-15%;
  width:80vw;height:80vw;max-width:800px;max-height:800px;
  background:radial-gradient(closest-side,var(--ice-soft) 0%,transparent 70%);
  pointer-events:none;filter:blur(30px);z-index:0;
}
.ex-hero-grid-glow{
  position:absolute;inset:0;
  background:repeating-linear-gradient(
    0deg,transparent,transparent 60px,rgba(93,180,229,.018) 60px,rgba(93,180,229,.018) 61px
  ),repeating-linear-gradient(
    90deg,transparent,transparent 60px,rgba(93,180,229,.018) 60px,rgba(93,180,229,.018) 61px
  );
  pointer-events:none;z-index:0;
}
.ex-hero-inner{position:relative;z-index:2;max-width:1000px;}

/* BREADCRUMB */
.breadcrumb-list{
  display:flex;flex-wrap:wrap;gap:4px 8px;list-style:none;
  font-size:11px;font-weight:500;letter-spacing:.06em;color:var(--ink-3);
  margin-bottom:28px;
}
.breadcrumb-list li::after{content:'·';margin-left:8px;opacity:.4;}
.breadcrumb-list li:last-child::after{content:'';}
.breadcrumb-list a{color:var(--ink-3);transition:color .2s;}
.breadcrumb-list a:hover{color:var(--ice);}
.breadcrumb-list li:last-child{color:var(--ice);}

.ex-hero-content{}
.ex-eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  margin-bottom:20px;
}
.ex-eyebrow::before{
  content:'';width:32px;height:1px;background:var(--ice);flex-shrink:0;
}
.ex-title{
  font-size:clamp(44px,9vw,96px);line-height:.9;
  letter-spacing:.005em;
  margin-bottom:28px;color:var(--ink);
}
.ex-meta-tags{display:flex;flex-wrap:wrap;gap:8px;}
.meta-tag{
  padding:6px 14px;border-radius:100px;
  font-size:11px;font-weight:600;letter-spacing:.08em;
  background:var(--ice-soft);border:1px solid var(--ice-line);color:var(--ice);
  transition:background .2s,border-color .2s;
}
.meta-tag:hover{background:rgba(93,180,229,.12);border-color:var(--ice);}
.meta-tag-energy{
  background:rgba(79,179,113,.08);border-color:rgba(79,179,113,.22);
  color:var(--green);
}
.meta-tag-energy:hover{background:rgba(79,179,113,.14);}

@media(min-width:900px){.ex-hero{padding:130px 40px 72px;}}

/* ── MEDIA SLOT ── */
.media-wrap{
  background:var(--bg);padding:0 24px 56px;
  position:relative;z-index:2;
}
.media-slot{
  position:relative;
  aspect-ratio:16/9;
  max-width:1000px;
  margin:0 auto;
  background:var(--card);
  border:1px solid var(--line-2);
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 32px 64px -24px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.03);
}
/* Subtle ice glow around the media box */
.media-slot::before{
  content:'';position:absolute;inset:-1px;
  border-radius:20px;
  background:linear-gradient(135deg,var(--ice-line) 0%,transparent 60%,transparent 100%);
  pointer-events:none;z-index:1;
}
.video-embed{
  position:absolute;inset:0;
  width:100%;height:100%;border:none;display:block;
}
.video-placeholder{
  position:absolute;inset:0;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:20px;
  background:linear-gradient(160deg,#0C1018 0%,#070708 100%);
}
.video-placeholder svg{
  color:var(--ice);opacity:.35;
  width:56px;height:56px;
}
.video-placeholder p{
  font-size:11px;font-weight:600;letter-spacing:.2em;
  text-transform:uppercase;color:var(--ink-3);
}
@media(min-width:900px){.media-wrap{padding:0 40px 72px;}}

/* ── CONTENT BANDS ── */
.ex-body{border-top:1px solid var(--line);}
.ex-band{
  padding:48px 24px;
  border-bottom:1px solid var(--line);
  position:relative;
}
.ex-band--alt{background:var(--bg-2);}
.ex-band--ice{
  background:linear-gradient(135deg,rgba(93,180,229,.04) 0%,var(--bg) 60%);
  border-left:none;border-right:none;
}
.ex-band--ice::before{
  content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg,transparent,var(--ice),transparent);
}
.ex-band--specs{
  background:var(--bg-3);
  display:flex;flex-direction:column;gap:0;
}
.ex-band-inner{
  max-width:860px;
  display:grid;
  gap:20px 48px;
  grid-template-columns:1fr;
}
.ex-band-label{display:flex;align-items:baseline;gap:14px;margin-bottom:4px;}
.band-num{
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:20px;color:var(--ice);flex-shrink:0;line-height:1;
}
.ex-section-title{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(22px,4vw,30px);
  letter-spacing:.04em;line-height:1;
  color:var(--ink);
}
.ex-section-body{
  color:var(--ink-2);font-size:15px;line-height:1.85;
  max-width:680px;
}
@media(min-width:780px){
  .ex-band{padding:56px 40px;}
  .ex-band-inner{grid-template-columns:220px 1fr;align-items:start;}
  .ex-band-label{flex-direction:column;gap:6px;}
  .ex-band--specs .ex-band-inner{grid-template-columns:1fr 1fr;}
}
@media(min-width:1100px){.ex-band{padding:64px 40px;}}

/* COACHING CUES */
.cue-list{
  list-style:none;display:flex;flex-direction:column;gap:10px;
  max-width:680px;
}
.cue-chip{
  position:relative;
  padding:14px 20px 14px 48px;
  background:var(--card);
  border:1px solid var(--line-2);border-radius:10px;
  font-size:14px;color:var(--ink);line-height:1.55;
  transition:border-color .25s,background .25s;
}
.cue-chip::before{
  content:'"';
  position:absolute;left:16px;top:10px;
  font-family:'Instrument Serif',serif;font-style:italic;
  font-size:28px;line-height:1;color:var(--ice);opacity:.6;
}
.cue-chip:hover{border-color:var(--ice-line);background:var(--card-2);}

/* PROGRESSION / REGRESSION */
.prog-reg-stack{display:flex;flex-direction:column;gap:12px;max-width:680px;}
.prog-reg-row{
  display:flex;align-items:flex-start;gap:16px;
  padding:16px 20px;
  border-radius:10px;border:1px solid var(--line);
  background:var(--card);
}
.prog-label{
  padding:5px 12px;border-radius:6px;font-size:9px;font-weight:700;
  letter-spacing:.16em;text-transform:uppercase;flex-shrink:0;margin-top:1px;
  line-height:1.2;
}
.prog-label.prog{
  background:rgba(79,179,113,.1);color:var(--green);
  border:1px solid rgba(79,179,113,.22);
}
.prog-label.reg{
  background:var(--ice-soft);color:var(--ice);
  border:1px solid var(--ice-line);
}
.prog-text{font-size:14px;color:var(--ink-2);line-height:1.7;}

.muscle-tags{display:flex;flex-wrap:wrap;gap:8px;}
.muscle-tag{
  padding:7px 16px;border-radius:100px;font-size:12px;font-weight:500;
  background:var(--card);border:1px solid var(--line-2);color:var(--ink-2);
  transition:border-color .2s,color .2s;
}
.muscle-tag:hover{border-color:var(--ice-line);color:var(--ice);}
.energy-text{
  margin-top:12px;font-size:14px;color:var(--ink-2);
  display:inline-flex;align-items:center;gap:10px;
}
.energy-text::before{
  content:'';width:8px;height:8px;border-radius:50%;
  background:var(--green);box-shadow:0 0 8px var(--green);flex-shrink:0;
}

/* ── PREV / NEXT ── */
.pn-nav{
  background:var(--bg-2);
  border-top:1px solid var(--line);border-bottom:1px solid var(--line);
  padding:0;
}
.pn-inner{
  display:grid;grid-template-columns:1fr auto 1fr;
  align-items:center;min-height:80px;gap:16px;
}
.pn-link{
  display:flex;align-items:center;gap:10px;
  padding:24px 0;font-size:13px;font-weight:600;
  color:var(--ink-2);letter-spacing:.04em;
  transition:color .2s;min-width:0;
}
.pn-link:hover{color:var(--ice);}
.pn-next{justify-content:flex-end;text-align:right;}
.pn-disabled{
  display:flex;align-items:center;gap:10px;
  padding:24px 0;font-size:13px;color:var(--ink-3);
}
.pn-next.pn-disabled{justify-content:flex-end;}
.pn-arrow{
  font-size:16px;flex-shrink:0;
  transition:transform .25s cubic-bezier(.2,.7,.2,1);
}
.pn-link.pn-prev:hover .pn-arrow{transform:translateX(-4px);}
.pn-link.pn-next:hover .pn-arrow{transform:translateX(4px);}
.pn-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pn-category{display:none;text-align:center;flex-shrink:0;}
@media(min-width:640px){.pn-category{display:block;}}

/* ── RELATED ── */
.related-section{
  padding:72px 24px;
  background:var(--bg);
  border-bottom:1px solid var(--line);
}
.related-head{margin-bottom:36px;}
.related-title{font-size:clamp(32px,6vw,56px);line-height:.95;margin-top:8px;color:var(--ink);}
.related-grid{
  display:grid;gap:16px;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
}
.related-card{
  padding:24px;
  background:var(--card);border:1px solid var(--line);border-radius:16px;
  position:relative;overflow:hidden;
  transition:transform .35s cubic-bezier(.2,.7,.2,1),border-color .35s,box-shadow .35s;
}
.related-card::before{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:var(--line-2);transition:background .3s;
}
.related-card:hover{
  transform:translateY(-5px);
  border-color:var(--ice-line);
  box-shadow:0 20px 40px -16px rgba(0,0,0,.55),0 0 40px var(--ice-soft);
}
.related-card:hover::before{background:var(--ice);}
.related-card:focus-visible{outline:2px solid var(--ice);outline-offset:2px;}
.related-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.related-arrow{color:var(--ink-3);transition:transform .3s,color .3s;}
.related-card:hover .related-arrow{transform:translateX(4px);color:var(--ice);}
.related-name{font-size:clamp(20px,3.5vw,26px);line-height:1;margin-bottom:8px;color:var(--ink);}
.related-muscles{font-size:12px;color:var(--ink-3);}
@media(min-width:900px){.related-section{padding:88px 40px;}}

/* ── CTA BLOCK ── */
.ex-cta{
  position:relative;overflow:hidden;
  padding:88px 24px;
  background:var(--bg);
  border-top:1px solid var(--line);
  text-align:center;
}
.ex-cta-glow{
  position:absolute;top:50%;left:50%;
  width:700px;height:500px;transform:translate(-50%,-50%);
  background:radial-gradient(closest-side,rgba(232,183,119,.06) 0%,transparent 70%);
  filter:blur(40px);pointer-events:none;
}
.ex-cta-inner{
  position:relative;z-index:2;
  max-width:640px;margin:0 auto;
}
.ex-cta-title{
  font-size:clamp(44px,10vw,88px);line-height:.92;
  margin-bottom:18px;
}
.ex-cta-title .serif{color:var(--ice);}
.ex-cta-sub{
  color:var(--ink-2);font-size:16px;line-height:1.7;
  margin-bottom:36px;max-width:480px;margin-left:auto;margin-right:auto;
}
.ex-cta-btns{
  display:flex;flex-wrap:wrap;gap:12px;
  justify-content:center;margin-bottom:28px;
}
.back-link{
  display:inline-block;font-size:13px;
  color:var(--ink-3);letter-spacing:.04em;
  transition:color .2s;
}
.back-link:hover{color:var(--ice);}
@media(min-width:780px){.ex-cta{padding:120px 40px;}}

/* ── RESPONSIVE FINE-TUNING ── */
@media(max-width:639px){
  .pn-inner{grid-template-columns:1fr 1fr;}
  .pn-category{display:none;}
  .pn-next{justify-content:flex-end;}
}
`;
}

// ─── 7. library.js ────────────────────────────────────────────────────────────

function libraryJS() {
  return `/* Elite Hockey Drills — Library JS */
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
`;
}

// ─── 8. sitemap.xml ───────────────────────────────────────────────────────────

function buildSitemap(exercises) {
  const urls = [
    `  <url><loc>${SITE_URL}/library.html</loc><lastmod>${TODAY}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ...exercises.map(ex =>
      `  <url><loc>${SITE_URL}/exercises/${ex.slug}.html</loc><lastmod>${TODAY}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
    ),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// ─── 9. Helpers ───────────────────────────────────────────────────────────────

function escHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  wrote', path.relative(process.cwd(), filePath));
}

// ─── 10. Main ─────────────────────────────────────────────────────────────────

function main() {
  const XLSX_FILE = path.resolve('Elite_Hockey_Drills_Exercise_LibraryFINALL.xlsx');
  const OUT_DIR   = path.resolve('.');

  const modeLabel = TEST_MODE ? 'TEST MODE — 3 exercises' : LIMIT ? `PHASE BUILD — first ${LIMIT} exercises` : 'FULL BUILD';
  console.log(`\nElite Hockey Drills — Generator (${modeLabel})\n`);

  let { categories, exercises } = parseExcel(XLSX_FILE);

  // Assign slugs (always on full set so slugs are stable across phases)
  const usedSlugs = new Set();
  exercises.forEach(ex => { ex.slug = makeSlug(ex.name, usedSlugs); });

  if (TEST_MODE) {
    exercises  = exercises.slice(0, 3);
    categories = [...new Set(exercises.map(e => e.category))];
    console.log('  Test exercises:', exercises.map(e => e.name).join(', '));
  } else if (LIMIT) {
    exercises  = exercises.slice(0, LIMIT);
    categories = [...new Set(exercises.map(e => e.category))];
    console.log(`  Building exercises 1–${exercises.length}`);
  }

  // Write CSS
  write(path.join(OUT_DIR, 'assets/library.css'),  libraryCSS());
  write(path.join(OUT_DIR, 'assets/exercise.css'), exerciseCSS());
  write(path.join(OUT_DIR, 'assets/library.js'),   libraryJS());

  // Write exercises.json (full exercises even in test mode for the JSON, but limited in HTML)
  write(path.join(OUT_DIR, 'exercises.json'), JSON.stringify(exercises, null, 2));

  // Write library.html
  write(path.join(OUT_DIR, 'library.html'), buildLibraryPage(exercises, categories));

  // Write exercise pages — clean exercises/ dir first (only remove .html files we own)
  const exDir = path.join(OUT_DIR, 'exercises');
  if (fs.existsSync(exDir)) {
    fs.readdirSync(exDir)
      .filter(f => f.endsWith('.html'))
      .forEach(f => fs.unlinkSync(path.join(exDir, f)));
  }

  exercises.forEach((ex, idx) => {
    const catExes = exercises.filter(e => e.category === ex.category);
    const catIdx  = catExes.findIndex(e => e.slug === ex.slug);
    const prevEx  = catIdx > 0                ? catExes[catIdx - 1] : null;
    const nextEx  = catIdx < catExes.length-1 ? catExes[catIdx + 1] : null;
    write(path.join(exDir, `${ex.slug}.html`), buildExercisePage(ex, catExes, prevEx, nextEx));
  });

  // Sitemap
  write(path.join(OUT_DIR, 'sitemap.xml'), buildSitemap(exercises));

  console.log(`\nDone — ${exercises.length} exercise page(s), 1 library page.\n`);
}

main();
