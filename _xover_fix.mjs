import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
const files = ['program-12-14-office.html','program-15-18-office.html','program-40plus-office.html'];

const OLD_GLOSS = 'From an athletic stance facing forward, to move laterally, open the hips and cross the trailing leg over and in front.';
const NEW_GLOSS = 'From an athletic stance, crossover-step a few metres to one side — hips open, trailing leg crossing over with low, quick steps — then plant and crossover back the other way, shuffling side to side for the set.';

for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const is40 = f.includes('40plus');
  let cardCount = 0;
  const parts = h.split('<div class="exrow">');
  for (let k = 1; k < parts.length; k++) {
    let c = parts[k];
    const link = c.slice(0, 500).match(/exercises\/([a-z0-9-]+)"/);
    if (!link || link[1] !== 'crossover-step') continue;
    const sc = (c.match(/<span class="spec"><b>(\d+)×/) || [])[1];
    if (!sc) { console.log('  !! no set count found in a crossover card in', f); continue; }
    const easy = is40 && sc === '2';
    let newDim, newNote;
    if (easy) { newDim = 'cross over · easy'; newNote = 'Crossover one way, then back the other — easy and smooth, no straining.'; }
    else if (is40) { newDim = 'cross over · both ways'; newNote = 'Crossover one way, then plant and come back the other — controlled, not maximal.'; }
    else { newDim = 'cross over · both ways'; newNote = 'Crossover one way, then plant and come back the other — low and quick both ways.'; }
    const before = c;
    c = c.replace(/(<span class="spec"><b>)\d+×[^<]*(<\/b>)/, `$1${sc}×20–30s$2`);
    c = c.replace(/(<span class="spec dim">)[^<]*(<\/span>)/, `$1${newDim}$2`);
    c = c.replace(/(<div class="ex-note">)[^<]*(<\/div>)/, `$1${newNote}$2`);
    if (c !== before) {
      cardCount++;
      const ns = (c.match(/<span class="spec"><b>([^<]+)/) || [])[1];
      console.log(`  [${f}] card -> spec="${ns}" dim="${newDim}" note="${newNote}"`);
    }
    parts[k] = c;
  }
  h = parts.join('<div class="exrow">');
  const glossHit = h.includes(OLD_GLOSS);
  if (glossHit) h = h.split(OLD_GLOSS).join(NEW_GLOSS);
  console.log(`== ${f}: ${cardCount} cards updated, glossary ${glossHit ? 'updated' : 'NOT FOUND'}`);
  if (!DRY) fs.writeFileSync(f, h);
}
console.log(DRY ? '\n(dry run — no writes)' : '\nWROTE all 3 files');
