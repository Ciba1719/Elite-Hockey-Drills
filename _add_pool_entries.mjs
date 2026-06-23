/* Add Broad Jump (already in library) + the two new sprint tests to the program pool:
   - _pool.json  (what the program build resolves names against)
   - the "Website Program" tab of the shot-list Excel (source of truth)
   Pulls the how-text from exercises.json so it matches the library page. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const fs = require('fs');

const lib = require('./exercises.json');
const howOf = name => (lib.find(e => e.name === name) || {}).execution || '';

const NEW = [
  { name: 'Broad Jump',        file: 'broad_jump',        slug: 'broad-jump',        equip: 'Plyo & Hurdles',       cat: 'Jump & Plyometric' },
  { name: '20m Sprint',        file: '20m_sprint',        slug: '20m-sprint',        equip: 'Cones & Ladder',       cat: 'Speed, Sprint & Agility' },
  { name: '20m Flying Sprint', file: '20m_flying_sprint', slug: '20m-flying-sprint', equip: 'Cones & Ladder',       cat: 'Speed, Sprint & Agility' },
].map(e => ({ ...e, how: howOf(e.name) }));

/* ---- 1. _pool.json ---- */
const POOL = './_pool.json';
const pool = JSON.parse(fs.readFileSync(POOL, 'utf8'));
const have = new Set(pool.map(p => p.name));
let added = 0;
for (const e of NEW) {
  if (have.has(e.name)) { console.log('  _pool.json already has', e.name); continue; }
  if (!e.how) throw new Error('no how-text found for ' + e.name + ' (is it in exercises.json?)');
  pool.push({ name: e.name, file: e.file, slug: e.slug, equip: e.equip, cat: e.cat, how: e.how });
  added++;
}
fs.writeFileSync(POOL, JSON.stringify(pool, null, 1));
console.log('  _pool.json: added', added, '-> total', pool.length);

/* ---- 2. shot-list "Website Program" tab ---- */
const XFILE = 'exercise_shot_list_v3 (version 1).xlsx';
const wb = XLSX.readFile(XFILE);
const ws = wb.Sheets['Website Program'];
const range = XLSX.utils.decode_range(ws['!ref']);
const H = {};
for (let c = 0; c <= range.e.c; c++) {
  const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
  if (cell) H[String(cell.v).trim()] = c;
}
const colReq = n => { if (H[n] == null) throw new Error('shot-list missing col: ' + n); return H[n]; };
const set = (r, n, v) => { ws[XLSX.utils.encode_cell({ r, c: colReq(n) })] = { t: 's', v }; };

// only append rows not already present in the tab
const existing = new Set();
for (let r = 1; r <= range.e.r; r++) {
  const cell = ws[XLSX.utils.encode_cell({ r, c: colReq('Exercise') })];
  if (cell) existing.add(String(cell.v).trim());
}
let r = range.e.r + 1, sheetAdded = 0;
for (const e of NEW) {
  if (existing.has(e.name)) { console.log('  Website Program tab already has', e.name); continue; }
  set(r, 'Exercise', e.name);
  set(r, 'Filename to use', e.file);
  set(r, 'Equipment', e.equip);
  set(r, 'How to do it', e.how);
  set(r, 'Notes', 'Website library · ' + e.cat);
  r++; sheetAdded++;
}
ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: range.e.c } });
XLSX.writeFile(wb, XFILE);
console.log('  Website Program tab: added', sheetAdded, 'row(s).');
