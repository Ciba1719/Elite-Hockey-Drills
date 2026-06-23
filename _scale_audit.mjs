import fs from 'node:fs';
const html = fs.readFileSync('program-9-11-office.html', 'utf8');
const ex = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const bySlug = new Map(ex.map(e => [e.slug, e]));

// Distinct exercise slugs used in SESSION exrows (first exercises/ link in each exrow chunk)
const chunks = html.split('<div class="exrow">').slice(1);
const sessionSlugs = [];
for (const c of chunks) {
  const m = c.match(/exercises\/([^"]+)"/);
  if (m && !sessionSlugs.includes(m[1])) sessionSlugs.push(m[1]);
}

// Already in the Make It Easier/Harder library (the 11)
const existing = new Set(['banded-squat','sl-rdl-banded','box-step-up-dbs','banded-lateral-lunge','drop-squat','skater-hop-stick-it','low-box-hop-up-stick','broad-jump-sprint-10m','push-up-to-reach','pallof-march','side-plank-with-reach']);

// Exclude: warm-up/mobility/recovery/cooldown categories, and pure games
const isWarmCool = c => /warm|mobil|recover|cool/i.test(c||'');
const gameSlugs = new Set(['free-play-1v1-game','battle-game-1v1','mirror-game-free-play','free-play-with-intent','combine-circuit']);

const groups = {};
for (const slug of sessionSlugs) {
  const e = bySlug.get(slug);
  if (!e) { (groups['__NO_JSON__']=groups['__NO_JSON__']||[]).push(slug); continue; }
  if (existing.has(slug)) continue;
  if (isWarmCool(e.category)) continue;
  if (gameSlugs.has(slug)) continue;
  (groups[e.category]=groups[e.category]||[]).push(slug);
}

let total = 0;
for (const [cat, slugs] of Object.entries(groups)) {
  console.log(`\n### ${cat} (${slugs.length})`);
  for (const s of slugs) { total++; const e=bySlug.get(s); console.log(`- ${s} | ${e?e.name:'?'} | prog: ${e?e.progression:'-'}`); }
}
console.log(`\nTOTAL NEW MOVES TO ADD: ${total}  (existing library: ${existing.size})`);
