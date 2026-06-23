import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['program-9-11-office.html', 'program-12-14-office.html', 'program-15-18-office.html', 'program-40plus-office.html'];

const CSS_ANCHOR = '.cd-split{display:grid;grid-template-columns:1fr;gap:28px;}';
const CSS_NEW = CSS_ANCHOR + '\n.ramp-grid.cdx-solo{grid-template-columns:1fr;margin-bottom:28px;}';

const DESC = 'Easy, unhurried stretches — slow the breath and let the heart rate settle.';

let ok = true;
for (const f of FILES) {
  let html = readFileSync(f, 'utf8');
  console.log('\n=== ' + f + ' ===');

  // 1) CSS
  if (html.split(CSS_ANCHOR).length - 1 !== 1) { console.log('  ✗ CSS anchor'); ok = false; }
  else { html = html.replace(CSS_ANCHOR, () => CSS_NEW); console.log('  ✓ CSS added'); }

  // 2) rebuild the cooldown section
  const secRe = /<section class="sheet" id="cooldown">([\s\S]*?)<\/section>/;
  const m = html.match(secRe);
  if (!m) { console.log('  ✗ cooldown section not found'); ok = false; continue; }
  const inner = m[1];

  const kickM = inner.match(/<div class="cd-kick">([\s\S]*?)<\/div>/);
  const leadM = inner.match(/<p class="lead">([\s\S]*?)<\/p>/);
  const listM = inner.match(/<ul class="cd-list">([\s\S]*?)<\/ul>/);
  const pStart = inner.indexOf('<div class="cd-col screen-col');
  if (!kickM || !leadM || !listM || pStart < 0) { console.log('  ✗ parse: kick=' + !!kickM + ' lead=' + !!leadM + ' list=' + !!listM + ' panel=' + (pStart >= 0)); ok = false; continue; }

  const chunk = inner.slice(pStart);
  const panel = chunk.slice(0, chunk.lastIndexOf('</div>')).trimEnd(); // drop cd-split's closing div
  const time = (kickM[1].split('·')[1] || '3–5 min').trim();

  const sec = '<section class="sheet" id="cooldown">\n' +
    '      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">XX</span><span class="eyebrow ice">After Every Session</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">cool-down.</span></h2></header>\n' +
    '      <p class="lead">' + leadM[1] + '</p>\n' +
    '      <div class="ramp-grid cdx-solo">\n' +
    '          <div class="ramp-phase">\n' +
    '            <div class="rp-letter display">C</div>\n' +
    '            <div class="rp-body">\n' +
    '              <div class="rp-h"><span class="display">Cool-Down</span><span class="rp-sub">~' + time + '</span></div>\n' +
    '              <p class="rp-desc">' + DESC + '</p>\n' +
    '              <ul class="rp-list">' + listM[1] + '</ul>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '      </div>\n' +
    '      ' + panel + '\n' +
    '    </section>';
  html = html.replace(secRe, () => sec);
  console.log('  ✓ section rebuilt (time="' + time + '", panel ' + panel.length + ' chars)');

  // 3) renumber ALL sec-nums sequentially in document order
  let n = 0;
  const before = [], after = [];
  html = html.replace(/<span class="sec-num display">(\d+|XX)<\/span>/g, (whole, old) => {
    n++; const nn = String(n).padStart(2, '0');
    before.push(old); after.push(nn);
    return '<span class="sec-num display">' + nn + '</span>';
  });
  console.log('  ✓ renumbered ' + n + ' sections: [' + before.join(',') + '] -> [' + after.join(',') + ']');

  writeFileSync(f, html);
}
console.log(ok ? '\nALL OK' : '\n*** FAILURES ***');
