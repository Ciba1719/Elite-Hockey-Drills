/* Update the 5 conditioning "Execution" cells in the library master workbook so
   generate.js emits the detailed, beginner-proof how-to permanently. Backs up first
   and guards each cell by its current text so a wrong cell can never be overwritten. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const XLSX = require('./node_modules/xlsx');

const FILE = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.xlsx';
const BAK = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.backup.xlsx';

const TARGETS = [
  { addr: 'C169', guard: 'Move through a circuit of varied stations',
    neu: 'Set up 4–6 simple stations and move through them in order, on your own. For a joint-friendly version, use low-impact stations — for example a loaded carry (suitcase or farmer carry), an anti-rotation core hold (Pallof press or side plank), a single-leg balance hold, a few soft-landing hops (ankle hops or stuck skater hops), and a steady bodyweight movement (squats or step-ups). Spend a set time or number of reps at each station, take a short rest as you move between them, then rest longer (1–2 minutes) after completing a full round. Complete the prescribed number of rounds. Keep the quality high at every station — this is a movement-quality circuit, not a race against the clock.' },
  { addr: 'C175', guard: 'Perform a circuit of bodyweight movements',
    neu: 'Build a simple circuit of 4–6 bodyweight exercises — for example bodyweight squats, push-ups (drop to your knees or put your hands on a bench if needed), reverse lunges, glute bridges, a plank, and easy step-ups. Do each exercise for about 30–40 seconds (or 8–12 smooth reps), then move to the next with only a short rest (about 10–20 seconds). Work at a controlled “tempo” — roughly 65–75% effort: it should feel challenging but smooth and repeatable, never all-out and never to failure. Complete the prescribed number of rounds (usually 2–3), resting 1–2 minutes between rounds. Keep every rep clean — if your form starts to break down, slow down or rest. The aim is steady, quality conditioning, not a race.' },
  { addr: 'C176', guard: 'Perform repeated moderate-intensity intervals',
    neu: 'Choose one steady, low-impact way to work — an easy-to-moderate jog, a bike, a rower, brisk incline walking, or a smooth bodyweight flow. Work for a set interval (for example 30–60 seconds) at a controlled, moderate effort of about 70% — quick enough that you feel it, but smooth enough that you could repeat it many times. Then rest for the prescribed recovery (often about equal to the work time, or a little longer) and repeat for the set number of intervals. The key is a consistent pace: every interval should look like the first — resist the urge to start fast and fade. Keep your breathing and form under control the whole way through.' },
  { addr: 'C179', guard: 'Perform a continuous circuit of low-intensity movements',
    neu: '“Zone 2” simply means easy, steady cardio you can keep up for a long time. Pick 3–5 low-impact movements you can repeat comfortably — for example a brisk walk or easy march on the spot, an easy stationary bike or ride, light step-ups onto a low box, easy skipping rope, or gentle shadow-skating footwork — and move through them continuously for the prescribed time (usually 10–20 minutes), flowing from one to the next with little or no rest. Keep the effort easy: you should be able to hold a conversation, or breathe in and out through your nose, the entire time (about 60–70% of your maximum). If you get out of breath or have to stop, you are going too hard — slow down. Smooth, steady, and comfortable is the whole point: this builds your aerobic engine without beating up your joints.' },
  { addr: 'C180', guard: 'Perform repeated high-intensity work bouts that mimic a hockey shift',
    neu: 'This recreates the work-then-rest rhythm of a real hockey shift, and you can do it entirely on your own. Work for about 40–60 seconds doing controlled, mixed movement — for example a few seconds of brisk skipping or marching, an easy shuttle or change of direction, then some quick (but sub-maximal) feet, and repeat — keeping everything smooth and controlled, with no maximal sprints, sharp cutting, or contact. Then “sit on the bench”: rest about 60–90 seconds, like real bench time between shifts. That is one shift. Repeat for the prescribed number of shifts. Push the work bouts to a strong but controlled effort, and use the rest to recover so every shift stays high quality rather than turning into a sloppy grind.' },
];

if (!fs.existsSync(BAK)) { fs.copyFileSync(FILE, BAK); console.log('backup ->', BAK); }
else console.log('backup already exists ->', BAK);

const wb = XLSX.readFile(FILE, { cellStyles: true, cellNF: true });
const ws = wb.Sheets['Exercise Library'];

let ok = 0; const probs = [];
for (const t of TARGETS) {
  const cell = ws[t.addr];
  const cur = cell ? String(cell.v) : '';
  if (!cur.includes(t.guard)) { probs.push(`${t.addr}: guard failed (found: "${cur.slice(0, 40)}")`); continue; }
  // modify value in place; preserve the cell object (style ref) but update text + clear cached formatted text
  cell.t = 's'; cell.v = t.neu; delete cell.w; delete cell.h; delete cell.r;
  ok++;
}
if (probs.length) { console.log('ABORT — guard problems:', JSON.stringify(probs, null, 1)); process.exit(1); }

XLSX.writeFile(wb, FILE, { cellStyles: true, bookType: 'xlsx' });
console.log('updated cells:', ok, '/ 5');

// verify by re-reading
const v = XLSX.readFile(FILE);
const vs = v.Sheets['Exercise Library'];
for (const t of TARGETS) console.log(t.addr, '->', String(vs[t.addr].v).slice(0, 50));
