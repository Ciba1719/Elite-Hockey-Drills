import fs from 'node:fs';
const html = fs.readFileSync('program-9-11-office.html', 'utf8');
const ex = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const bySlug = new Map(ex.map(e => [e.slug, e]));

const chunks = html.split('<div class="exrow">').slice(1);
const sessionSlugs = [];
for (const c of chunks) { const m = c.match(/exercises\/([^"]+)"/); if (m && !sessionSlugs.includes(m[1])) sessionSlugs.push(m[1]); }

const existing = new Set(['banded-squat','sl-rdl-banded','box-step-up-dbs','banded-lateral-lunge','drop-squat','skater-hop-stick-it','low-box-hop-up-stick','broad-jump-sprint-10m','push-up-to-reach','pallof-march','side-plank-with-reach']);
const isWarmCool = c => /warm|mobil|recover|cool/i.test(c||'');
const gameSlugs = new Set(['free-play-1v1-game','battle-game-1v1','mirror-game-free-play','free-play-with-intent','combine-circuit']);

const items = [];
let withVideo = 0;
for (const slug of sessionSlugs) {
  const e = bySlug.get(slug);
  if (!e || existing.has(slug) || isWarmCool(e.category) || gameSlugs.has(slug)) continue;
  const p = e.progression || '';
  const prog = (p.match(/Progress:\s*([^|]+)/i)||[])[1]?.trim() || '';
  const reg = (p.match(/Regress:\s*(.+)$/i)||[])[1]?.trim() || '';
  if (e.video && e.video.trim()) withVideo++;
  items.push({ slug, name: e.name, category: e.category, harder_raw: prog, easier_raw: reg, hasVideo: !!(e.video&&e.video.trim()) });
}
fs.writeFileSync('_scale_input.json', JSON.stringify(items, null, 2));
console.log('items:', items.length, '| with video in json:', withVideo, '| without:', items.length-withVideo);
console.log('sample video field:', JSON.stringify(bySlug.get('broad-jump').video), '|', JSON.stringify(bySlug.get('iso-wall-sit').video));
