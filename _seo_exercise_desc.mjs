// One-off: rewrite the broken meta/og/twitter descriptions on every exercise page.
// Leaves titles, body, and JSON-LD untouched. Run with --apply to write.
import fs from 'fs';
import path from 'path';

const DIR = 'exercises';
const APPLY = process.argv.includes('--apply');
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();

let changed = 0;
const skipped = [];
const samples = [];
let maxLen = 0, maxLenName = '';

for (const f of files) {
  const p = path.join(DIR, f);
  let html = fs.readFileSync(p, 'utf8');

  const titleM = html.match(/<title>(.*?) — Off-Ice Hockey Training \| Elite Hockey Drills<\/title>/);
  if (!titleM) { skipped.push(f + '  (title pattern not matched)'); continue; }
  const name = titleM[1].trim();

  const catM = html.match(/<div class="eyebrow ice ex-eyebrow">(.*?)<\/div>/);
  const cat = catM ? catM[1].trim() : '';

  const tail = cat
    ? ` A ${cat} off-ice (dryland) exercise.`
    : ' An off-ice (dryland) hockey exercise.';
  const desc = `How to do the ${name} for hockey: technique, coaching cues, common mistakes, and a demo video.${tail}`;

  if (desc.length > maxLen) { maxLen = desc.length; maxLenName = name; }

  const before = html;
  const sub = (re) => { html = html.replace(re, (m, a, b) => a + desc + b); };
  sub(/(<meta name="description" content=")[^"]*("\s*\/>)/);
  sub(/(<meta property="og:description" content=")[^"]*("\s*\/>)/);
  sub(/(<meta name="twitter:description" content=")[^"]*("\s*\/>)/);

  if (html === before) { skipped.push(f + '  (no description tags matched)'); continue; }

  if (samples.length < 4) samples.push(`[${f}]\n  ${desc}`);
  if (APPLY) fs.writeFileSync(p, html);
  changed++;
}

console.log(`MODE: ${APPLY ? 'APPLY (files written)' : 'DRY RUN (no files changed)'}`);
console.log(`Total exercise files: ${files.length}`);
console.log(`Would update: ${changed}`);
console.log(`Skipped: ${skipped.length}`);
console.log(`Longest description: ${maxLen} chars ("${maxLenName}")`);
console.log('\n--- SAMPLES ---\n' + samples.join('\n\n'));
if (skipped.length) console.log('\n--- SKIPPED ---\n' + skipped.join('\n'));
