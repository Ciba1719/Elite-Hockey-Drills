import { readFileSync, writeFileSync } from 'node:fs';

// --- Lift the evolved click handler from 9-11 (the source of truth) ---
const COMMENT = '  // exercise → inline Watch Video + Full Guide (workout rows + glossary cards)';
const END = '\n})();';
function extractHandler(html, label) {
  const s = html.indexOf(COMMENT);
  if (s < 0) throw new Error('handler comment not found in ' + label);
  const e = html.indexOf(END, s);
  if (e < 0) throw new Error('IIFE end not found in ' + label);
  return html.slice(s, e); // comment .. through the handler's closing `  });`
}
const NEW_JS = extractHandler(readFileSync('program-9-11-office.html', 'utf8'), '9-11');

// --- Exact CSS string swaps (old -> new), shared by all three siblings ---
const ADD_RULES =
  '\n.pr-row.open .ex-panel{grid-column:1 / -1;}' +
  '\n.cd-list a.ex .lk, .rp-list a.ex .lk, .pr-row a.ex .lk, .sc-table .tname a.ex .lk{font-size:0;vertical-align:middle;margin-left:.3em;}' +
  '\n.cd-list a.ex .lk::after, .rp-list a.ex .lk::after, .pr-row a.ex .lk::after, .sc-table .tname a.ex .lk::after{content:"▾";font-size:13px;line-height:1;display:inline-block;opacity:.65;}' +
  '\n.cd-list li.open a.ex .lk::after, .rp-list li.open a.ex .lk::after, .pr-row.open a.ex .lk::after, .sc-table tbody tr.open .tname a.ex .lk::after{content:"▴";opacity:1;}' +
  '\n.ex-panel-row td{border:none !important;padding:2px 0 14px !important;background:none;}' +
  '\n.ex-panel-row .ex-panel{display:block;margin-top:0;padding-top:4px;border-top:none;}';

const CSS = [
  ['.cd-list{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}',
   '.cd-list{list-style:none;display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:12px;}'],
  [".cd-list li::after{content:'·';color:var(--ink3);margin-left:8px;}",
   ".cd-list li::after{content:'';}"],
  ['.exrow.open .ex-panel, .gloss-item.open .ex-panel{display:block;animation:exPanel .26s cubic-bezier(.2,.7,.2,1);}',
   '.exrow.open .ex-panel, .gloss-item.open .ex-panel, .test-card.open .ex-panel, .cd-list li.open .ex-panel, .rp-list li.open .ex-panel, .pr-row.open .ex-panel{display:block;animation:exPanel .26s cubic-bezier(.2,.7,.2,1);}' + ADD_RULES],
];

const files = ['program-12-14-office.html', 'program-15-18-office.html', 'program-40plus-office.html'];
let ok = true;
const sub = (html, oldStr, newStr) => html.replace(oldStr, () => newStr); // fn-form avoids $ interpretation
for (const f of files) {
  let html = readFileSync(f, 'utf8');
  console.log('\n=== ' + f + ' ===');
  for (const [o, n] of CSS) {
    const c = html.split(o).length - 1;
    if (c !== 1) { console.log('  ✗ CSS expected 1, found ' + c + ': ' + o.slice(0, 42)); ok = false; continue; }
    html = sub(html, o, n); console.log('  ✓ CSS ' + o.slice(0, 42) + '…');
  }
  const oldJS = extractHandler(html, f);
  const jc = html.split(oldJS).length - 1;
  if (jc !== 1) { console.log('  ✗ JS handler match count = ' + jc); ok = false; }
  else { html = sub(html, oldJS, NEW_JS); console.log('  ✓ JS handler swapped (' + oldJS.length + ' -> ' + NEW_JS.length + ' chars)'); }
  writeFileSync(f, html);
}
console.log(ok ? '\nALL OK' : '\n*** FAILURES ***');
