// Lists every per-language string in generate-i18n.js (SWAPS objects + CAT)
// as { key, fi, de } so the Russian column can be written, and patches the
// file with `ru:` values when _ru_work/swaps.ru.json exists.
//   node _ru_work/swaps-list.mjs            → writes _ru_work/swaps.en.json
//   node _ru_work/swaps-list.mjs --patch    → inserts ru: values into generate-i18n.js
import fs from 'fs';

const FILE = 'generate-i18n.js';
let src = fs.readFileSync(FILE, 'utf8');
const LIT = /(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`)/y;
function readLit(s, i) { LIT.lastIndex = i; const m = LIT.exec(s); return m ? { raw: m[0], val: m[1] ?? m[2] ?? m[3], end: LIT.lastIndex } : null; }

// bracket-aware split of the SWAPS array into entries
const start = src.indexOf('const SWAPS = [') + 'const SWAPS = ['.length;
const endIdx = src.indexOf('\n];', start);
const body = src.slice(start, endIdx);
const entries = []; // { text, from, to } offsets into src
let depth = 0, cur = -1, inStr = null;
for (let i = 0; i < body.length; i++) {
  const c = body[i];
  if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
  if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
  if (c === '[') { if (depth === 0) cur = i; depth++; }
  else if (c === ']') { depth--; if (depth === 0 && cur >= 0) { entries.push({ text: body.slice(cur, i + 1), from: start + cur, to: start + i + 1 }); cur = -1; } }
}
const out = [];
for (const e of entries) {
  const key = readLit(e.text, e.text.indexOf('[') + 1 + (e.text.slice(1).match(/^\s*/)[0].length));
  const hasObj = /\{\s*cs:/.test(e.text);
  if (!key || !hasObj) continue;
  const fi = e.text.match(/\bfi:\s*/); const de = e.text.match(/\bde:\s*/);
  const fiLit = fi ? readLit(e.text, fi.index + fi[0].length) : null;
  const deLit = de ? readLit(e.text, de.index + de[0].length) : null;
  out.push({ key: key.val, fi: fiLit?.val ?? null, de: deLit?.val ?? null, entry: e });
}
// CAT lines
const catStart = src.indexOf('const CAT = {'); const catEnd = src.indexOf('\n};', catStart);
const cat = src.slice(catStart, catEnd);
const cats = [...cat.matchAll(/^\s*'([^']+)':\s*\{([^}]*)\}/gm)].map(m => ({ key: m[1], fi: (m[2].match(/\bfi:\s*'([^']*)'/) || [])[1], de: (m[2].match(/\bde:\s*'([^']*)'/) || [])[1], line: m[0] }));

if (!process.argv.includes('--patch')) {
  fs.writeFileSync('_ru_work/swaps.en.json', JSON.stringify({ swaps: out.map(o => ({ key: o.key, fi: o.fi, de: o.de })), cat: cats.map(c => ({ key: c.key, fi: c.fi, de: c.de })) }, null, 1), 'utf8');
  console.log(`SWAPS per-language entries: ${out.length}; CAT: ${cats.length}; written _ru_work/swaps.en.json`);
  process.exit(0);
}

// ── patch mode ─────────────────────────────────────────────────────────────
const ru = JSON.parse(fs.readFileSync('_ru_work/swaps.ru.json', 'utf8'));
const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
let missing = [];
// apply from the end so offsets stay valid
for (const o of [...out].reverse()) {
  const val = ru.swaps[o.key];
  if (val == null) { missing.push(o.key.slice(0, 80)); continue; }
  const t = o.entry.text;
  if (/\bru:\s*/.test(t)) continue; // already patched
  // the object literal ends at the last '}' of the entry
  const close = t.lastIndexOf('}');
  const needsBacktick = val.includes('${') || val.includes('\n');
  const lit = needsBacktick ? '`' + val.replace(/`/g, '\\`') + '`' : q(val);
  const patched = t.slice(0, close).replace(/\s*$/, '') + ', ru: ' + lit + ' ' + t.slice(close);
  src = src.slice(0, o.entry.from) + patched + src.slice(o.entry.to);
}
for (const c of cats) {
  const val = ru.cat[c.key];
  if (val == null) { missing.push('CAT ' + c.key); continue; }
  if (/\bru:/.test(c.line)) continue;
  const patchedLine = c.line.replace(/\s*\}\s*$/, `, ru: ${q(val)} }`);
  src = src.replace(c.line, patchedLine);
}
if (missing.length) { console.error('missing ru values for:\n  ' + missing.join('\n  ')); process.exit(1); }
fs.writeFileSync(FILE, src, 'utf8');
console.log(`patched ${out.length} SWAPS entries and ${cats.length} CAT entries with ru values`);
