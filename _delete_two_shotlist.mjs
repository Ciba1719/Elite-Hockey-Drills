/* Remove the two retired exercises from the shot list (Website Program sheet rows 131/133). */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('./node_modules/xlsx');

const FILE = 'exercise_shot_list_v3 (version 1).xlsx';
const BAK = 'backups/exercise_shot_list_v3 (version 1).before-delete-2.xlsx';
if (!fs.existsSync(BAK)) { fs.copyFileSync(FILE, BAK); console.log('backup ->', BAK); }

const wb = XLSX.readFile(FILE, { cellStyles: true, cellNF: true });
const ws = wb.Sheets['Website Program'];

const guards = [['C131', '90/90 Hip Stretch + T-Spine Opener'], ['C133', 'Foam Roll / Tissue Work']];
for (const [a, w] of guards) {
  const g = ws[a] ? String(ws[a].v) : '';
  if (g !== w) { console.error('ABORT guard', a, JSON.stringify(g)); process.exit(1); }
}

const range = XLSX.utils.decode_range(ws['!ref']);
for (const m of ws['!merges'] || []) if (m.e.r >= 129) { console.error('ABORT merge near rows', m); process.exit(1); }

function deleteRow(rowNum) {
  for (let r = rowNum; r <= range.e.r + 1; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const from = XLSX.utils.encode_cell({ r, c });
      const to = XLSX.utils.encode_cell({ r: r - 1, c });
      if (ws[from] !== undefined) { ws[to] = ws[from]; delete ws[from]; }
      else delete ws[to];
    }
  }
  if (ws['!rows']) ws['!rows'].splice(rowNum - 1, 1);
  range.e.r -= 1;
}
deleteRow(133);
deleteRow(131);
ws['!ref'] = XLSX.utils.encode_range(range);

XLSX.writeFile(wb, FILE, { cellStyles: true, bookType: 'xlsx' });

const v = XLSX.readFile(FILE).Sheets['Website Program'];
const rows = XLSX.utils.sheet_to_json(v, { header: 1 }).map(r => (r || []).join(' | '));
console.log('leftovers:', rows.filter(s => s.includes('T-Spine Opener') || s.includes('Foam Roll / Tissue Work')).length);
for (const i of [128, 129, 130, 131, 132]) console.log('row', i + 1, ':', (rows[i] || '').slice(0, 90));
