import { readFileSync, writeFileSync } from 'node:fs';

const sv = (paths) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
const ICON = {
  'program-12-14-office.html': sv('<path d="M3 17l6 -6l4 4l8 -8"/><path d="M17 7l4 0l0 4"/>'),               // growth: trending up
  'program-15-18-office.html': sv('<path d="M3 12h4l3 8l4 -16l3 8h4"/>'),                                      // readiness: pulse
  'program-40plus-office.html': sv('<path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.572a5 5 0 1 1 7.5 6.572"/>'), // body: heart
};

const NOTE_ANCHOR = '.screen-note{font-size:14px;color:var(--ink2);margin-top:8px;}';
const CSS_BLOCK = NOTE_ANCHOR + '\n' + [
  '.screen-panel{position:relative;border-color:var(--warm-line);background:var(--warm-soft);overflow:hidden;}',
  ".screen-panel::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--warm);}",
  '.screen-head{display:flex;align-items:center;gap:13px;margin-bottom:16px;}',
  '.screen-badge{width:42px;height:42px;border-radius:11px;background:var(--warm-soft);border:1px solid var(--warm-line);display:flex;align-items:center;justify-content:center;color:var(--warm);flex-shrink:0;}',
  '.screen-badge svg{width:22px;height:22px;}',
  '.screen-panel .cd-kick{color:var(--warm);margin-bottom:0;line-height:1.4;}',
  '.screen-panel .screen-list li::before{border:1.5px solid #E8B77766;background:var(--warm-soft);}',
  '.screen-panel .screen-note{color:#C7CCD5;font-size:15.5px;border-left:2px solid #E8B77755;padding:2px 0 2px 14px;margin-top:16px;}',
  '.screen-panel .screen-note b, .screen-panel .screen-note strong{color:var(--warm);font-style:normal;font-weight:600;}',
].join('\n');

const COL_OPEN = '<div class="cd-col screen-col">';
const COL_NEW = '<div class="cd-col screen-col screen-panel">';

let ok = true;
const need1 = (html, s, label) => { const c = html.split(s).length - 1; if (c !== 1) { console.log('  ✗ ' + label + ': found ' + c); ok = false; return false; } return true; };

for (const f of Object.keys(ICON)) {
  let html = readFileSync(f, 'utf8');
  console.log('\n=== ' + f + ' ===');
  // 1) CSS block
  if (need1(html, NOTE_ANCHOR, 'CSS anchor')) { html = html.replace(NOTE_ANCHOR, () => CSS_BLOCK); console.log('  ✓ CSS block added'); }
  // 2) add panel class
  if (need1(html, COL_OPEN, 'screen-col div')) { html = html.replace(COL_OPEN, () => COL_NEW); console.log('  ✓ panel class added'); }
  // 3) wrap kicker with icon header
  const pi = html.indexOf(COL_NEW);
  const ks = html.indexOf('<div class="cd-kick">', pi);
  const ke = html.indexOf('</div>', ks) + 6;
  if (pi < 0 || ks < 0 || ke < 5) { console.log('  ✗ kicker not located'); ok = false; }
  else {
    const kicker = html.slice(ks, ke);
    const head = '<div class="screen-head"><span class="screen-badge">' + ICON[f] + '</span>' + kicker + '</div>';
    html = html.slice(0, ks) + head + html.slice(ke);
    console.log('  ✓ icon header wrapped (' + kicker.slice(0, 38) + '…)');
  }
  writeFileSync(f, html);
}

// 9-11: brighten the existing safety-panel note for consistency
{
  const f = 'program-9-11-office.html';
  let html = readFileSync(f, 'utf8');
  console.log('\n=== ' + f + ' (note brighten) ===');
  const o = '.safety-panel .screen-note{border-top:1px solid var(--warm-line);padding-top:15px;margin-top:18px;}';
  const n = '.safety-panel .screen-note{border-top:1px solid var(--warm-line);padding-top:15px;margin-top:18px;color:#C7CCD5;}';
  if (need1(html, o, 'safety note rule')) { html = html.replace(o, () => n); writeFileSync(f, html); console.log('  ✓ note brightened'); }
}

console.log(ok ? '\nALL OK' : '\n*** FAILURES ***');
