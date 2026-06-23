import fs from 'node:fs';
const files = ['program-12-14-office.html','program-15-18-office.html','program-40plus-office.html'];
for (const f of files) {
  const h = fs.readFileSync(f, 'utf8');
  console.log('\n========== ' + f + ' ==========');
  // session cards (plain crossover-step)
  const chunks = h.split('<div class="exrow">').slice(1);
  let i = 0;
  for (const c of chunks) {
    const m = c.match(/^([\s\S]*?)<\/div>\s*<\/div>/); // up to end of exrow-ish
    const isX = /exercises\/crossover-step"/.test(c.split('</div>\n    </div>')[0] || c.slice(0, 600));
    if (!/exercises\/crossover-step"/.test(c.slice(0,400))) continue;
    const name = (c.match(/crossover-step"[^>]*>([^<]+)<span/)||[])[1];
    if (name !== 'Crossover Step') continue; // exclude to-sprint / bound (their names differ)
    const spec = (c.match(/<span class="spec"><b>([^<]+)<\/b>/)||[])[1];
    const dim = (c.match(/<span class="spec dim">([^<]+)<\/span>/)||[])[1];
    const note = (c.match(/<div class="ex-note">([^<]*)<\/div>/)||[])[1];
    console.log(`  CARD: spec="${spec}" | dim="${dim}" | note="${note}"`);
    i++;
  }
  // glossary
  const g = h.match(/exercises\/crossover-step"[^>]*>Crossover Step<span[^>]*>↗<\/span><\/a><\/div>\s*<div class="gi-cue">([\s\S]*?)<\/div>/);
  console.log('  GLOSSARY cue:', g ? '"'+g[1]+'"' : '(none)');
  // library
  const lib = h.match(/exercises\/crossover-step"[^>]*>Crossover Step<span[^>]*>↗<\/span><\/a><\/div>\s*<div class="pr-reg">[^<]*<\/span>\s*([^<]*)<\/div>\s*<div class="pr-prog">[^<]*<\/span>\s*([^<]*)<\/div>/);
  console.log('  LIBRARY easier:', lib ? '"'+lib[1].trim()+'"' : '(none)');
  console.log('  LIBRARY harder:', lib ? '"'+lib[2].trim()+'"' : '(none)');
}
