import fs from 'node:fs';

const DRY = process.argv.includes('--dry');
const flagged = JSON.parse(fs.readFileSync('_glossary_flagged.json', 'utf8'));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Build a complete "quick cue" from execution: accumulate sentences until ~100 chars, end on a boundary.
function toCue(execution) {
  const sentences = execution.match(/[^.!?]+[.!?]+/g) || [execution];
  let out = '';
  for (const s of sentences) {
    out += s;
    if (out.trim().length >= 100) break;
  }
  out = out.trim();
  // safety: if somehow ended without terminal punctuation, add a period
  if (!/[.!?]$/.test(out)) out += '.';
  return out;
}

let html = fs.readFileSync('program-9-11-office.html', 'utf8');
let replaced = 0, missed = 0;
const samples = [];

for (const f of flagged) {
  const newCue = esc(toCue(f.execution));
  // Match the gi-cue that immediately follows this slug's gi-name anchor
  const re = new RegExp(
    '(exercises/' + f.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '"[^>]*>[^<]*<span class="lk"[^>]*>↗</span></a></div>\\s*<div class="gi-cue">)([\\s\\S]*?)(</div>)'
  );
  const before = html;
  html = html.replace(re, (_, a, _old, c) => a + newCue + c);
  if (html === before) { missed++; samples.push(`MISS: ${f.slug}`); }
  else { replaced++; if (samples.length < 8) samples.push(`[${f.reason}] ${f.name}\n   OLD: ${f.cue}\n   NEW: ${newCue}`); }
}

console.log(`flagged: ${flagged.length}  replaced: ${replaced}  missed: ${missed}`);
console.log('--- samples ---\n' + samples.join('\n\n'));
if (!DRY) { fs.writeFileSync('program-9-11-office.html', html); console.log('\nWROTE program-9-11-office.html'); }
else console.log('\n(dry run — no write)');
