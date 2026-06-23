/* Delete the "90/90 Hip Stretch + T-Spine Opener" (row 190) and "Foam Roll / Tissue Work"
   (row 195) rows from the Exercise Library sheet, preserving styles and shifting rows up.
   Guarded by cell text; backs up first. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('./node_modules/xlsx');

const FILE = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.xlsx';
const BAK = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.before-delete-2.xlsx';

if (!fs.existsSync(BAK)) { fs.copyFileSync(FILE, BAK); console.log('backup ->', BAK); }

const wb = XLSX.readFile(FILE, { cellStyles: true, cellNF: true });
const ws = wb.Sheets['Exercise Library'];

// guards
const guards = [
  ['B190', '90/90 Hip Stretch + T-Spine Opener'],
  ['B195', 'Foam Roll / Tissue Work'],
];
for (const [addr, want] of guards) {
  const got = ws[addr] ? String(ws[addr].v) : '';
  if (got !== want) { console.error(`ABORT guard ${addr}: "${got}"`); process.exit(1); }
}

// no merge may touch or span past the deleted rows (merges are 0-indexed)
const delRows = [195, 190]; // 1-indexed, delete bottom-up
for (const m of ws['!merges'] || []) {
  for (const dr of delRows) {
    if (m.s.r <= dr - 1 && m.e.r >= dr - 1) { console.error('ABORT merge intersects row', dr, m); process.exit(1); }
    if (m.s.r > dr - 1) { console.error('ABORT merge below deleted row needs shifting', m); process.exit(1); }
  }
}

const range = XLSX.utils.decode_range(ws['!ref']);
function deleteRow(del) { // del is 1-indexed
  for (let r = del; r <= range.e.r + 1; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const from = XLSX.utils.encode_cell({ r: r, c }); // row below (0-indexed r = 1-indexed r+1... careful)
      const to = XLSX.utils.encode_cell({ r: r - 1, c });
      // here r is 0-indexed equivalent of 1-indexed row r+1; we shift row r+1 -> r
      if (ws[from] !== undefined) { ws[to] = ws[from]; delete ws[from]; }
      else delete ws[to];
    }
  }
  if (ws['!rows']) ws['!rows'].splice(del - 1, 1);
  range.e.r -= 1;
}
// explanation of indices: 1-indexed row `del` is 0-indexed `del-1`. Shifting starts by
// moving 0-indexed row `del` into `del-1`, i.e. loop r from `del` (0-indexed) upward — which
// equals the 1-indexed del value. So passing the 1-indexed row number works as the 0-indexed start.
deleteRow(195);
deleteRow(190);
ws['!ref'] = XLSX.utils.encode_range(range);

XLSX.writeFile(wb, FILE, { cellStyles: true, bookType: 'xlsx' });

// verify
const v = XLSX.readFile(FILE);
const vs = v.Sheets['Exercise Library'];
const rows = XLSX.utils.sheet_to_json(vs, { header: 1 });
const flat = rows.map(r => (r || []).join(' | '));
const bad = flat.filter(s => s.includes('Foam Roll / Tissue Work') || s.includes('90/90 Hip Stretch + T-Spine Opener'));
console.log('ref:', vs['!ref'], '| leftover hits:', bad.length);
// neighbors that moved up
for (const i of [188, 189, 190, 192, 193]) console.log('row', i + 1, ':', (flat[i] || '').slice(0, 80));
