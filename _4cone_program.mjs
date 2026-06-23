import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
let h = fs.readFileSync('program.html', 'utf8');
const parts = h.split('<div class="exrow">');
let n = 0;
for (let k = 1; k < parts.length; k++) {
  let c = parts[k];
  const link = c.slice(0, 400).match(/exercises\/([a-z0-9-]+)"/);
  if (!link || link[1] !== 'reactive-4-cone') continue;
  const rounds = (c.match(/<span class="spec"><b>(\d+)\s*reps<\/b>/) || [])[1];
  if (!rounds) { console.log('  !! unexpected spec format'); continue; }
  const before = c;
  c = c.replace(/(<span class="spec"><b>)\d+\s*reps(<\/b>)/, `$1${rounds}×20–30s$2`);
  c = c.replace(/(<span class="spec dim">)max — reactive(<\/span>)/, `$1react · low cuts$2`);
  if (c !== before) { n++; const s=(c.match(/<span class="spec"><b>([^<]+)/)||[])[1]; const d=(c.match(/<span class="spec dim">([^<]+)/)||[])[1]; console.log(`  -> spec="${s}" dim="${d}"`); }
  parts[k] = c;
}
h = parts.join('<div class="exrow">');
console.log(`reactive-4-cone cards updated: ${n}`);
if (!DRY) { fs.writeFileSync('program.html', h); console.log('WROTE program.html'); } else console.log('(dry run)');
