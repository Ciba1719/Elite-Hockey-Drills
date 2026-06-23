/* Append the two missing test exercises (20m Sprint, 20m Flying Sprint) to the
   library Excel 'Exercise Library' sheet so generate.js builds real pages for them.
   Appends a "Speed, Sprint & Agility" category row, then the two exercise rows. */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const FILE = 'Elite_Hockey_Drills_Exercise_LibraryFINALL.xlsx';
const wb = XLSX.readFile(FILE);
const ws = wb.Sheets['Exercise Library'];
const range = XLSX.utils.decode_range(ws['!ref']);

// header row is index 3
const H = {};
for (let c = 0; c <= range.e.c; c++) {
  const cell = ws[XLSX.utils.encode_cell({ r: 3, c })];
  if (cell) H[String(cell.v).trim()] = c;
}
const col = name => {
  const k = Object.keys(H).find(h => h.toLowerCase() === name.toLowerCase());
  return k == null ? null : H[k];
};
const set = (r, name, v, t = 's') => {
  const c = col(name);
  if (c == null) throw new Error('missing column: ' + name);
  ws[XLSX.utils.encode_cell({ r, c })] = { t, v };
};

const SPRINT = {
  '#': 177, EXERCISE: '20m Sprint',
  Execution: 'From a stationary two-point stance, sprint a flat-out 20 metres in a straight line. Drive hard out of the start with a forward lean and powerful arm action, staying low for the first strides, then rise gradually as you build speed. Run through the 20-metre line without decelerating. Time each effort, taking full recovery between reps on the same surface and footwear.',
  'Why It Works': 'Trains and measures pure acceleration — the ability to overcome inertia and apply large horizontal forces over the first 20 metres. Short-distance sprinting develops the explosive force production and powerful arm-leg coordination that a longer run rarely taxes.',
  'Hockey Transfer': 'Almost every sprint in hockey is short and acceleration-dominant — jumping on a loose puck, beating an opponent to the boards, exploding out on a breakaway. A faster 20-metre time is a direct dry-land read on first-step quickness.',
  'Coaching Cues': '"Push the ground back, don’t reach" · "lean and drive the arms" · "low and patient, then tall"',
  'Common Mistakes': 'Popping upright on the first steps; over-striding instead of pushing; tensing the shoulders and face; easing off before the line',
  'Progression / Regression': 'Progress: resisted starts (sled or band) or extend to a 30 m sprint | Regress: 10 m accelerations focused on the drive phase',
  'Primary Muscles': 'Glutes, hamstrings, quads, calves',
  'Energy System': 'Alactic / ATP-PC',
};
const FLY = {
  '#': 178, EXERCISE: '20m Flying Sprint',
  Execution: 'Build speed gradually over a 20–30 metre run-in, then hit a flat-out, maximal-velocity 20-metre flying zone. Run tall and relaxed with a fast, cyclical leg action and brief ground contacts — the goal is the highest speed you can hold through the zone, not acceleration. Time only the flying 20 metres, with full recovery between efforts.',
  'Why It Works': 'Isolates maximal sprinting velocity by removing the acceleration phase, so you train and measure pure top-end speed and the efficient, relaxed mechanics that let an athlete hold it. Flying sprints expose and develop the highest-velocity stride a player can produce.',
  'Hockey Transfer': 'Top-end speed separates players on long, straight-line efforts — beating a defender wide, backchecking to erase a rush, or stretching the ice. Training high-velocity mechanics also builds the hamstring resilience those speeds demand.',
  'Coaching Cues': '"Tall and relaxed — float, don’t strain" · "strike down and back, quick off the ground" · "fast hands, loose face"',
  'Common Mistakes': 'Tensing up and over-striding; reaching the feet out in front of the body; trying to keep accelerating through the zone instead of holding speed; entering the zone unrecovered',
  'Progression / Regression': 'Progress: lengthen the fly zone or add light assisted (downhill / towed) sprints | Regress: shorten to a 10 m fly or run build-up strides',
  'Primary Muscles': 'Hamstrings, glutes, quads, calves',
  'Energy System': 'Alactic / ATP-PC',
};

let r = range.e.r + 1;
// category row: '#' holds the category label, EXERCISE empty
set(r, '#', 'Speed, Sprint & Agility');
r++;
for (const ex of [SPRINT, FLY]) {
  for (const [k, v] of Object.entries(ex)) {
    set(r, k, v, k === '#' ? 'n' : 's');
  }
  r++;
}

ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: range.e.c } });
XLSX.writeFile(wb, FILE);
console.log('Appended 20m Sprint + 20m Flying Sprint under a Speed, Sprint & Agility category row. New last row index:', r - 1);
