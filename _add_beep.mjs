/* Append a "Beep Test" exercise to the Exercise Library workbook (Energy Systems / Intervals),
   matching the sheet's existing append-at-end-under-a-restated-category-header pattern.
   Backs up first. In-place cell writes (no row shifting). */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('./node_modules/xlsx');

const FILE = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.xlsx';
const BAK = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.beforebeep.xlsx';

const F = {
  exec: 'Set two markers exactly 20 metres apart on a flat, non-slip surface and play the standard beep-test audio (free "beep test" or "multistage fitness test" apps and tracks are widely available). Run from one line to the other, reaching the far line before each beep, then turn and run back on the next beep. The beeps start slow and speed up at the end of every level, so you run faster and faster. Keep going as long as you can reach the line in time; your score is the level and shuttle you reach when you can no longer keep pace (or choose to stop). Warm up thoroughly first, ease into the early levels, and STOP at any sharp or joint pain — this is a hard, maximal test, so respect it and push only as hard as your body allows.',
  why: 'The beep test is a simple, repeatable field measure of maximal aerobic capacity (VO2max). By making you run progressively faster until you cannot keep up, it puts one honest number on the size of your aerobic engine — the system that powers recovery between shifts and across a game — so you can track whether it grows over the eight weeks.',
  transfer: 'Your aerobic engine is what lets you recover between shifts and still skate hard in the third period. A higher beep-test level means faster between-shift recovery and more high-quality shifts in a game — the difference between fading late and finishing strong.',
  cues: 'Reach the line before the beep; turn tight and push off; ease in and build; stop on sharp pain',
  mistakes: 'Starting too fast and burning out early; not reaching the line before the beep; testing cold; pushing through joint pain on the turns',
  prog: 'Progression: a higher level or more shuttles. Regression: stop earlier, or use a longer shuttle (about 30 m) with gentler turns if the sharp 180-degree turns bother your knees or ankles.',
  muscles: 'Full body (aerobic/cardiovascular)',
  energy: 'Aerobic (maximal test)',
};

if (!fs.existsSync(BAK)) { fs.copyFileSync(FILE, BAK); console.log('backup ->', BAK); }
const wb = XLSX.readFile(FILE, { cellStyles: true });
const ws = wb.Sheets['Exercise Library'];
const range = XLSX.utils.decode_range(ws['!ref']);
const hdrRow = range.e.r + 1;   // category-header row (0-indexed)
const exRow = range.e.r + 2;    // exercise row
const set = (r, c, v, t = 's') => { ws[XLSX.utils.encode_cell({ r, c })] = { t, v }; };

// guard: make sure Beep Test isn't already there
const val = (r, c) => { const cell = ws[XLSX.utils.encode_cell({ r, c })]; return cell ? String(cell.v).trim() : ''; };
for (let r = 4; r <= range.e.r; r++) if (val(r, 1).toLowerCase() === 'beep test') { console.log('ABORT: Beep Test already present at row', r); process.exit(1); }

set(hdrRow, 0, 'Energy Systems / Intervals');           // restated category header (# col, EXERCISE empty)
set(exRow, 0, 200, 'n');                                 // #
set(exRow, 1, 'Beep Test');                              // EXERCISE
set(exRow, 2, F.exec);                                   // Execution
set(exRow, 3, F.why);                                    // Why It Works
set(exRow, 4, F.transfer);                               // Hockey Transfer
set(exRow, 5, F.cues);                                   // Coaching Cues
set(exRow, 6, F.mistakes);                               // Common Mistakes
set(exRow, 7, F.prog);                                   // Progression / Regression
set(exRow, 8, F.muscles);                                // Primary Muscles
set(exRow, 9, F.energy);                                 // Energy System

ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: exRow, c: Math.max(range.e.c, 10) } });
XLSX.writeFile(wb, FILE, { cellStyles: true, bookType: 'xlsx' });

// verify
const v = XLSX.readFile(FILE); const vs = v.Sheets['Exercise Library']; const vr = XLSX.utils.decode_range(vs['!ref']);
const last = (r, c) => { const cell = vs[XLSX.utils.encode_cell({ r, c })]; return cell ? String(cell.v) : ''; };
console.log('new range:', vs['!ref']);
console.log('header row:', JSON.stringify(last(hdrRow, 0)));
console.log('exercise row: #=', last(exRow, 0), '| EX=', last(exRow, 1), '| energy=', last(exRow, 9));
console.log('exec starts:', last(exRow, 2).slice(0, 50));
