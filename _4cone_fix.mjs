import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
const files = ['program-9-11-office.html','program-12-14-office.html','program-15-18-office.html','program-40plus-office.html'];
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const parts = h.split('<div class="exrow">');
  let n = 0;
  for (let k = 1; k < parts.length; k++) {
    let c = parts[k];
    const link = c.slice(0, 400).match(/exercises\/([a-z0-9-]+)"/);
    if (!link || link[1] !== 'reactive-4-cone') continue;
    const rounds = (c.match(/<span class="spec"><b>(\d+)×/) || [])[1];
    if (!rounds) { console.log('  !! no round count in', f); continue; }
    const before = c;
    c = c.replace(/(<span class="spec"><b>)\d+×[^<]*(<\/b>)/, `$1${rounds}×20–30s$2`);
    if (c !== before) { n++; console.log(`  [${f}] -> ${rounds}×20–30s`); }
    parts[k] = c;
  }
  h = parts.join('<div class="exrow">');
  console.log(`== ${f}: ${n} updated`);
  if (!DRY) fs.writeFileSync(f, h);
}
console.log(DRY ? '\n(dry run)' : '\nWROTE files');
