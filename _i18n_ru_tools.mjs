#!/usr/bin/env node
/**
 * Elite Hockey Drills — static-page localisation tooling (used for /ru/).
 *
 *   node _i18n_ru_tools.mjs extract <page.html> [...]   → _ru_work/seg/<page>.en.json (segments to translate)
 *   node _i18n_ru_tools.mjs inject  <page.html> [...]   → ru/<page.html> from the English page + _ru_work/seg/<page>.ru.json
 *   node _i18n_ru_tools.mjs verify  <page.html> [...]   → structure/translation checks of ru/<page.html>
 *   node _i18n_ru_tools.mjs hreflang-add                → adds the ru hreflang line to every static page of every language
 *
 * A "segment" is the innerHTML of a leaf block element (p, h1…, li, td, button …
 * whose descendants are inline only), a translatable attribute (title, alt,
 * aria-label, placeholder, meta description/og/twitter), a JSON-LD string, or a
 * user-facing string literal inside an inline <script>. Ids are positional, so
 * extract and inject must run against the same English file.
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'node-html-parser';

const LANG = 'ru', PREFIX = '/ru', STORE = 'ru', OG = 'ru_RU', SITE = 'https://elitehockeydrills.com';
const WORK = path.join('_ru_work', 'seg');
const SKIP = new Set(['script', 'style', 'svg', 'noscript', 'template', 'iframe', 'video', 'audio', 'source', 'picture', 'img', 'link', 'meta', 'br', 'hr', 'input', 'select', 'canvas', 'path']);
const BLOCK = new Set(['div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'figure', 'figcaption', 'blockquote', 'details', 'summary', 'form', 'fieldset', 'legend', 'dl', 'dt', 'dd', 'pre', 'button', 'label', 'select', 'option', 'textarea', 'video', 'picture', 'iframe', 'svg', 'address', 'caption']);
const ATTRS = ['alt', 'aria-label', 'placeholder', 'title', 'aria-description', 'data-tooltip'];
const META = new Set(['description', 'keywords', 'twitter:title', 'twitter:description', 'twitter:image:alt', 'og:title', 'og:description', 'og:image:alt', 'application-name', 'apple-mobile-web-app-title']);
const LD_KEYS = new Set(['name', 'description', 'headline', 'alternativeName', 'text', 'caption', 'articleBody', 'abstract', 'transcript', 'slogan', 'jobTitle', 'title', 'alternateName', 'reviewBody', 'disambiguatingDescription', 'keywords']);
const LETTERS = /\p{L}/u;
const WORDS2 = /\p{L}{2,}[\s ]+\p{L}{2,}/u;

const opts = { comment: true, blockTextElements: { script: true, style: true, noscript: true, pre: true } };
const read = f => fs.readFileSync(f, 'utf8');
const pageName = p => p.replace(/\.html$/, '').replace(/[\\/]/g, '__');

function hasLetters(s) { return LETTERS.test(String(s).replace(/&[a-z]+;|&#\d+;/g, '')); }

// Walk the DOM in document order and collect segments. `apply` (id → text) rewrites in place.
function collect(root, apply) {
  const segs = []; let n = 0, v = 0, x = 0;
  // svg labels (v0, v1 …) and the late additions — ${} template literals and data-label/data-short
  // attributes (x0, x1 …) — use their own id series so adding them never renumbers the DOM segments
  const add = (kind, en, setter) => {
    const id = kind === 'svg' ? `v${v++}` : (kind === 'tpl' || kind.startsWith('xattr')) ? `x${x++}` : `${kind[0]}${n++}`;
    segs.push({ id, kind, en }); if (apply && apply[id] != null && apply[id] !== en) setter(apply[id]);
  };
  const svgWalk = el => {
    for (const c of el.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.rawTagName?.toLowerCase();
      if (['title', 'desc', 'text', 'tspan'].includes(t)) {
        for (const tn of c.childNodes) {
          if (tn.nodeType !== 3 || !hasLetters(tn.rawText)) continue;
          const raw = tn.rawText, trimmed = raw.trim();
          add('svg', trimmed, nv => { tn.rawText = raw.replace(trimmed, nv); });
        }
      }
      svgWalk(c);
    }
  };
  const isLeaf = el => {
    if (!el.childNodes.some(c => c.nodeType === 3 && hasLetters(c.rawText)) && !el.childNodes.some(c => c.nodeType === 1)) return false;
    const stack = [...el.childNodes]; let sawText = false;
    while (stack.length) {
      const c = stack.pop();
      if (c.nodeType === 3) { if (hasLetters(c.rawText)) sawText = true; continue; }
      if (c.nodeType !== 1) continue;
      const t = c.rawTagName?.toLowerCase();
      if (BLOCK.has(t) || t === 'script' || t === 'style' || t === 'svg') return false;
      stack.push(...c.childNodes);
    }
    return sawText;
  };
  const walk = el => {
    for (const c of el.childNodes) {
      if (c.nodeType !== 1) continue;
      const t = c.rawTagName?.toLowerCase();
      if (!t) continue;
      // attributes first (document order ≈ open tag before content)
      if (t === 'meta') {
        const key = c.getAttribute('name') || c.getAttribute('property');
        const content = c.getAttribute('content');
        if (key && META.has(key) && content && hasLetters(content)) add('meta', content, v => c.setAttribute('content', v));
        continue;
      }
      if (t === 'title') { add('title', c.innerHTML.trim(), v => c.set_content(v)); continue; }
      for (const a of ATTRS) { const v = c.getAttribute(a); if (v && hasLetters(v)) add(`attr:${a}`, v, nv => c.setAttribute(a, nv)); }
      for (const a of ['data-label', 'data-short']) { const v = c.getAttribute(a); if (v && hasLetters(v)) add(`xattr:${a}`, v, nv => c.setAttribute(a, nv)); }
      if (t === 'input' && /^(submit|button)$/i.test(c.getAttribute('type') || '') && c.getAttribute('value')) add('attr:value', c.getAttribute('value'), nv => c.setAttribute('value', nv));
      if (t === 'script') {
        const type = (c.getAttribute('type') || '').toLowerCase();
        if (type === 'application/ld+json') ldSegments(c, add);
        else if (!c.getAttribute('src') && (!type || /javascript|module/.test(type))) jsSegments(c, add);
        continue;
      }
      if (t === 'svg') { svgWalk(c); continue; }
      if (SKIP.has(t)) continue;
      if (isLeaf(c)) { const inner = c.innerHTML; add('html', inner.trim(), v => c.set_content(inner.replace(inner.trim(), v))); continue; }
      // mixed element (text next to an svg icon or a block child): its own text nodes become segments
      for (const tn of c.childNodes) {
        if (tn.nodeType !== 3 || !hasLetters(tn.rawText)) continue;
        const raw = tn.rawText, trimmed = raw.trim();
        add('text', trimmed, v => { tn.rawText = raw.replace(trimmed, v); });
      }
      walk(c);
    }
  };
  walk(root);
  return segs;
}

function ldSegments(scriptEl, add) {
  let data; try { data = JSON.parse(scriptEl.textContent); } catch { return; }
  let changed = false;
  const walk = (node, key) => {
    if (Array.isArray(node)) { node.forEach((v, i) => { const r = walk(v, key); if (r !== undefined) { node[i] = r; changed = true; } }); return; }
    if (node && typeof node === 'object') { for (const k of Object.keys(node)) { const r = walk(node[k], k); if (r !== undefined) { node[k] = r; changed = true; } } return; }
    if (typeof node === 'string' && LD_KEYS.has(key) && hasLetters(node) && !/^https?:\/\//.test(node) && node.length > 2) {
      let out; add('ld', node, v => { out = v; }); return out;
    }
  };
  walk(data, null);
  if (changed) scriptEl.set_content(JSON.stringify(data, null, 2));
}

const JS_LIT = /'((?:\\.|[^'\\\n])*)'|"((?:\\.|[^"\\\n])*)"|`((?:\\.|[^`\\])*)`/g;
function jsCandidate(s) {
  if (!WORDS2.test(s)) return false;
  if (/\$\{/.test(s)) return /^[.#\/]|^https?:/.test(s) ? false : 'tpl'; // template literal with ${…} — translate around the expressions
  if (/^[.#\/]|^https?:|^[\w-]+=|[{};]/.test(s)) return false;
  if (/^(G-|UA-|gtag|utm_|data-|aria-|class|id)\b/i.test(s)) return false;
  return true;
}
function jsSegments(scriptEl, add) {
  let code = scriptEl.textContent; let changed = false; const repl = [];
  for (const m of code.matchAll(JS_LIT)) {
    const raw = m[0]; const val = m[1] ?? m[2] ?? m[3];
    const kind = jsCandidate(val);
    if (!kind) continue;
    add(kind === 'tpl' ? 'tpl' : 'js', val, nv => { repl.push([m.index, raw, nv]); });
  }
  if (!repl.length) return;
  for (const [idx, raw, nv] of repl.reverse()) {
    const qch = raw[0];
    const esc = qch === '`' ? nv.replace(/`/g, '\\`') : nv.replace(new RegExp(qch, 'g'), '\\' + qch);
    code = code.slice(0, idx) + qch + esc + qch + code.slice(idx + raw.length);
    changed = true;
  }
  if (changed) scriptEl.set_content(code);
}

// ── mechanical localisation of the serialized page ──────────────────────────
function pagePath(file) { // "index.html" → "/", "articles/x.html" → "/articles/x.html"
  const f = file.replace(/\\/g, '/');
  return f === 'index.html' ? '/' : '/' + f;
}
function localise(html, file) {
  const p = pagePath(file);
  const ruUrl = SITE + PREFIX + p;
  html = html.replace(/<html lang="en">/, `<html lang="${LANG}">`);
  // hreflang: add ru before x-default (if the block exists and ru is missing)
  if (/hreflang="x-default"/.test(html) && !/hreflang="ru"/.test(html)) {
    html = html.replace(/([ \t]*)<link rel="alternate" hreflang="x-default"/, `$1<link rel="alternate" hreflang="${LANG}" href="${ruUrl}" />\n$1<link rel="alternate" hreflang="x-default"`);
  }
  html = html.replace(/(<link rel="canonical" href=")([^"]*)(")/, `$1${ruUrl}$3`);
  html = html.replace(/(<meta property="og:url" content=")([^"]*)(")/, (m, a, _b, c) => `${a}${ruUrl}${c}`);
  if (/property="og:locale"/.test(html)) html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${OG}$2`);
  else html = html.replace(/([ \t]*)(<meta property="og:url"[^>]*>)/, `$1$2\n$1<meta property="og:locale" content="${OG}" />`);
  html = html.replace(/data-cur="en"/g, `data-cur="${LANG}"`);
  // Cyrillic glyphs for the Bebas Neue display face (see assets/ru-display.css)
  if (!/ru-display\.css/.test(html)) html = html.replace(/([ \t]*)(<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*" rel="stylesheet"[^>]*>)/, `$1$2\n$1<link href="/assets/ru-display.css" rel="stylesheet" />`);
  html = html.replace(/apps\.apple\.com\/us\//g, `apps.apple.com/${STORE}/`);
  html = html.replace(/(play\.google\.com\/store\/apps\/details\?id=com\.elitehockeydrills\.training)(?![^"'\s]*hl=)(["'])/g, (m, a, q) => `${a}${q === '"' ? '&amp;' : '&'}hl=${LANG}${q}`);
  // links — <link> and <meta> tags keep their absolute URLs (canonical, hreflang, og:*), so shield them first
  const ASSET = /\.(png|jpe?g|webp|svg|gif|ico|css|js|mp4|webm|pdf|webmanifest|xml|txt|json|woff2?)(\?|#|$)/i;
  html = html.replace(/<(link|meta)\b[^>]*>/g, m => m.replace(/\b(href|src)=/g, '$1\u0001='));
  html = html.replace(/\b(href|src|poster|data-src)="([^"]*)"/g, (m, attr, v) => {
    if (/^(#|mailto:|tel:|javascript:)/.test(v)) return m;
    if (/^https?:\/\//.test(v) && !v.startsWith(SITE)) return m;
    if (v.startsWith(SITE)) {
      let rest = v.slice(SITE.length); // "", "#tiers", "/survey.html", "/exercises/slug"
      if (rest.startsWith(PREFIX + '/') || rest === PREFIX) return m; // already localised
      if (rest === '' || rest.startsWith('#')) return `${attr}="${PREFIX}/${rest}"`;
      if (ASSET.test(rest) || rest.startsWith('/assets/') || rest.startsWith('/api/') || rest.startsWith('/buy')) return m;
      if (/^\/exercises\/[^/.?#]+$/.test(rest)) rest += '.html';
      if (/^\/(privacy|terms|app|hockey-training-app|program-[0-9a-z-]+)$/.test(rest)) rest += '.html';
      return `${attr}="${PREFIX}${rest}"`;
    }
    if (v.startsWith('/')) {
      if (v.startsWith(PREFIX + '/') || v.startsWith('/assets/') || v.startsWith('/api/') || v.startsWith('/buy') || v.startsWith('/.netlify') || v.startsWith('/program?') ) return m;
      if (ASSET.test(v)) return m;
      if (v === '/' || v.startsWith('/#')) return `${attr}="${PREFIX}/${v.slice(1)}"`;
      let rest = v;
      if (/^\/exercises\/[^/.?#]+$/.test(rest)) rest += '.html';
      if (/^\/(privacy|terms|app|hockey-training-app|program-[0-9a-z-]+)$/.test(rest)) rest += '.html';
      if (!/\.html(#|\?|$)/.test(rest)) return m; // unknown extensionless endpoint — leave alone
      return `${attr}="${PREFIX}${rest}"`;
    }
    // relative
    if (ASSET.test(v) || v.startsWith('assets/')) return `${attr}="/${v}"`;
    if (/^index\.html(#.*)?$/.test(v)) return `${attr}="${PREFIX}/${v.replace(/^index\.html/, '')}"`;
    if (/\.html(#|\?|$)/.test(v)) return `${attr}="${PREFIX}/${v}"`;
    return m;
  });
  html = html.replace(/\b(href|src)\u0001=/g, '$1=');
  // absolute site URLs inside JSON-LD / inline scripts only (not assets); head links keep their own URLs
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, block => block.replace(/"(https:\/\/elitehockeydrills\.com)(\/(?!assets\/|ru\/)[^"\s]*?)?"/g, (m, s, rest) => {
    rest = rest || '/';
    if (ASSET.test(rest) || /^\/(api|buy)/.test(rest)) return m;
    if (/^\/exercises\/[^/.?#]+$/.test(rest)) rest += '.html';
    return `"${s}${PREFIX}${rest === '/' ? '/' : rest}"`;
  }));
  return html;
}

// ── commands ────────────────────────────────────────────────────────────────
const [cmd, ...files] = process.argv.slice(2);
fs.mkdirSync(WORK, { recursive: true });

if (cmd === 'extract') {
  for (const f of files) {
    const root = parse(read(f), opts);
    const segs = collect(root, null);
    const kinds = segs.reduce((a, s) => (a[s.kind.split(':')[0]] = (a[s.kind.split(':')[0]] || 0) + 1, a), {});
    const chars = segs.reduce((a, s) => a + s.en.length, 0);
    fs.writeFileSync(path.join(WORK, pageName(f) + '.en.json'), JSON.stringify({ page: f, segments: segs.map(s => ({ id: s.id, kind: s.kind, en: s.en })) }, null, 1), 'utf8');
    console.log(`${f}: ${segs.length} segments, ${chars} chars (${JSON.stringify(kinds)})`);
  }
} else if (cmd === 'inject') {
  for (const f of files) {
    const ru = JSON.parse(read(path.join(WORK, pageName(f) + '.ru.json')));
    const map = ru.segments ? Object.fromEntries(ru.segments.map(s => [s.id, s.ru])) : ru;
    const root = parse(read(f), opts);
    const segs = collect(root, map);
    const missing = segs.filter(s => map[s.id] == null).map(s => s.id);
    // node-html-parser drops the " />" of void elements; the site writes them that way everywhere.
    let html = root.toString().replace(/<(meta|link|img|br|hr|input|source|track|wbr)\b([^<>]*?)\s>/g, '<$1$2 />');
    html = localise(html, f);
    // last resort for strings the segmenter cannot reach: exact replacements from _ru_work/overrides/<page>.json ([["english","russian"], …])
    const ovFile = path.join('_ru_work', 'overrides', pageName(f) + '.json');
    if (fs.existsSync(ovFile)) {
      let applied = 0;
      for (const [from, to] of JSON.parse(read(ovFile))) {
        const count = html.split(from).length - 1;
        if (!count) { console.log(`  override not found: ${from.slice(0, 60)}`); continue; }
        html = html.split(from).join(to); applied++;
      }
      console.log(`  overrides applied: ${applied}`);
    }
    const out = path.join(LANG, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, html, 'utf8');
    console.log(`${f} → ${out} (${segs.length} segments${missing.length ? `, ${missing.length} MISSING: ${missing.slice(0, 8).join(',')}` : ''})`);
  }
} else if (cmd === 'verify') {
  let total = 0;
  const skel = root => { const out = []; const walk = el => { for (const c of el.childNodes) { if (c.nodeType !== 1) continue; out.push(c.rawTagName + '[' + Object.keys(c.attributes).sort().join(',') + ']'); walk(c); } }; walk(root); return out; };
  const tags = s => (String(s).match(/<\/?[a-zA-Z0-9]+/g) || []).map(t => t.toLowerCase()).sort().join(',');
  for (const f of files) {
    // the localised page legitimately gains two head lines (ru hreflang, og:locale when English has none);
    // once hreflang-add has run, the English page carries the ru line too — strip it on both sides
    const enHtml = read(f).replace(/[ \t]*<link rel="alternate" hreflang="ru"[^>]*>\n/, '');
    let ruHtml = read(path.join(LANG, f)).replace(/[ \t]*<link rel="alternate" hreflang="ru"[^>]*>\n/, '').replace(/[ \t]*<link href="\/assets\/ru-display\.css"[^>]*>\n/, '');
    if (!/property="og:locale"/.test(enHtml)) ruHtml = ruHtml.replace(/[ \t]*<meta property="og:locale"[^>]*>\n/, '');
    const en = parse(enHtml, opts), ru = parse(ruHtml, opts);
    const errs = [], warns = [];
    const a = skel(en), b = skel(ru);
    if (a.length !== b.length) errs.push(`element count ${a.length} vs ${b.length}`);
    else for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { errs.push(`structure differs at element ${i}: ${a[i]} vs ${b[i]}`); break; }
    // js literals are re-detected heuristically (a one-word Russian literal is not a candidate), so pair only the DOM/LD segments
    const enAll = collect(en, null), ruAll = collect(ru, null);
    const isScript = s => s.kind === 'js' || s.kind === 'tpl';
    const enSegs = enAll.filter(s => !isScript(s)), ruSegs = ruAll.filter(s => !isScript(s));
    if (enSegs.length !== ruSegs.length) errs.push(`segment count ${enSegs.length} vs ${ruSegs.length}`);
    const enJs = enAll.filter(isScript), ruJs = ruAll.filter(isScript);
    const jsLeft = enJs.filter(s => ruJs.some(r => r.en === s.en) && s.en.replace(/<[^>]+>|\$\{[^}]*\}|[^\p{L}]/gu, '').length >= 4);
    if (jsLeft.length) warns.push(`js literals still English: ${jsLeft.slice(0, 5).map(s => s.en.slice(0, 50)).join(' | ')}`);
    // template literals must keep every ${expression} exactly
    // string literals inside an expression may be translated (e.g. ${youth ? "Your player's" : 'Your'}); compare the rest
    const exprs = s => (String(s).match(/\$\{[^}]*\}/g) || []).map(e => e.replace(/"[^"]*"|'[^']*'/g, '""')).sort().join('|');
    const ruTplMap = new Map(ruJs.filter(s => s.kind === 'tpl').map(s => [exprs(s.en), s.en]));
    for (const s of enJs.filter(s => s.kind === 'tpl')) if (!ruTplMap.has(exprs(s.en))) errs.push(`template literal lost a \${…} expression: ${s.en.slice(0, 60)}`);
    const n = Math.min(enSegs.length, ruSegs.length); let same = 0, noCyr = 0;
    for (let i = 0; i < n; i++) {
      const e = enSegs[i].en, r = ruSegs[i].en;
      const plain = e.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      const BRAND = /^(Elite Hockey Drills|Instagram|YouTube|TikTok|WhatsApp|Facebook|iPhone|Android|Google Play|App Store|Apple Pay|VISA|Mastercard|PayPal|Netlify|PubMed|NHL|IIHF|FAQ|FOUNDATIONS|DEVELOP|COMPETE|DOMINATE|SUSTAIN|RAMP|art-news-msg err)$/i;
      if (e === r && e.replace(/<[^>]+>|&[a-z]+;|[^\p{L}]/gu, '').length >= 4 && !BRAND.test(plain)) { same++; if (same <= 12) warns.push(`untranslated ${enSegs[i].id}: ${e.slice(0, 90)}`); }
      else if (!/\p{Script=Cyrillic}/u.test(r) && r.replace(/<[^>]+>|&[a-z]+;|[^\p{L}]/gu, '').length >= 4) { noCyr++; if (noCyr <= 8) warns.push(`no Cyrillic ${enSegs[i].id}: ${r.slice(0, 90)}`); }
      if (enSegs[i].kind === 'html' && tags(e) !== tags(r)) errs.push(`${enSegs[i].id}: inline tags [${tags(e)}] vs [${tags(r)}]`);
      if (/[іїєґў]/i.test(r)) errs.push(`${enSegs[i].id}: non-Russian Cyrillic letter`);
      if (/\p{Script=Latin}\p{Script=Cyrillic}|\p{Script=Cyrillic}\p{Script=Latin}/u.test(r)) errs.push(`${enSegs[i].id}: Latin glued to Cyrillic: ${r.slice(0, 80)}`);
    }
    const html = read(path.join(LANG, f));
    if (!/<html lang="ru">/.test(html)) errs.push('html lang is not ru');
    if (!/hreflang="ru"/.test(html) && /hreflang=/.test(html)) errs.push('ru hreflang missing');
    if (/href="\/(?!ru\/|assets\/|api\/|buy|\.netlify)[a-z0-9-]+\.html/.test(html)) errs.push('internal link not prefixed with /ru/');
    console.log(`\n=== ${f}: ${errs.length} errors, ${same} untranslated, ${noCyr} without Cyrillic`);
    errs.forEach(e => console.log('  ERROR ' + e)); warns.forEach(w => console.log('  warn  ' + w));
    total += errs.length + same;
  }
  console.log(`\nTOTAL ERRORS (incl. untranslated): ${total}`);
  process.exit(total ? 1 : 0);
} else if (cmd === 'hreflang-add') {
  const pages = JSON.parse(read('_ru_work/pages.json'));
  let n = 0;
  for (const pre of ['', 'cs', 'sv', 'de', 'fi']) for (const pg of pages) {
    const f = pre ? path.join(pre, pg) : pg;
    if (!fs.existsSync(f)) { console.log('skip (missing) ' + f); continue; }
    let html = read(f);
    if (!/hreflang="x-default"/.test(html) || /hreflang="ru"/.test(html)) continue;
    const ruUrl = SITE + PREFIX + pagePath(pg);
    html = html.replace(/([ \t]*)<link rel="alternate" hreflang="x-default"/, `$1<link rel="alternate" hreflang="${LANG}" href="${ruUrl}" />\n$1<link rel="alternate" hreflang="x-default"`);
    fs.writeFileSync(f, html, 'utf8'); n++;
  }
  console.log(`added ru hreflang to ${n} pages`);
} else {
  console.error('usage: node _i18n_ru_tools.mjs extract|inject|verify <page.html>... | hreflang-add');
  process.exit(2);
}
