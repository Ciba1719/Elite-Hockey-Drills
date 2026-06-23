/* One-off: rewrite the terse "execution" / How-to text for the 5 conditioning
   finishers in BOTH the canonical data (exercises.json) and the live guide pages,
   so the auto-regenerate pipeline (which reads exercises.json) keeps the detailed
   beginner-proof text instead of reverting it. */
import fs from 'fs';

const PAIRS = [
  { page: 'exercises/aerobic-circuit-zone-2.html',
    old: 'Perform a continuous circuit of low-intensity movements (or steady cardio) keeping the heart rate in Zone 2 — a conversational, sustainable intensity (~60–70% max HR). Move smoothly and continuously for the prescribed duration, keeping the effort easy enough to maintain comfortably and nasal-breathe. Hold the steady, low-intensity pace throughout.',
    neu: '“Zone 2” simply means easy, steady cardio you can keep up for a long time. Pick 3–5 low-impact movements you can repeat comfortably — for example a brisk walk or easy march on the spot, an easy stationary bike or ride, light step-ups onto a low box, easy skipping rope, or gentle shadow-skating footwork — and move through them continuously for the prescribed time (usually 10–20 minutes), flowing from one to the next with little or no rest. Keep the effort easy: you should be able to hold a conversation, or breathe in and out through your nose, the entire time (about 60–70% of your maximum). If you get out of breath or have to stop, you are going too hard — slow down. Smooth, steady, and comfortable is the whole point: this builds your aerobic engine without beating up your joints.' },
  { page: 'exercises/tempo-bw-circuit.html',
    old: 'Perform a circuit of bodyweight movements (or tempo runs) at a moderate, controlled intensity (~65–75% effort) with short rests, focusing on smooth, rhythmic work rather than all-out efforts. Keep good form and steady breathing throughout the prescribed rounds. The pace should feel challenging but sustainable and repeatable.',
    neu: 'Build a simple circuit of 4–6 bodyweight exercises — for example bodyweight squats, push-ups (drop to your knees or put your hands on a bench if needed), reverse lunges, glute bridges, a plank, and easy step-ups. Do each exercise for about 30–40 seconds (or 8–12 smooth reps), then move to the next with only a short rest (about 10–20 seconds). Work at a controlled “tempo” — roughly 65–75% effort: it should feel challenging but smooth and repeatable, never all-out and never to failure. Complete the prescribed number of rounds (usually 2–3), resting 1–2 minutes between rounds. Keep every rep clean — if your form starts to break down, slow down or rest. The aim is steady, quality conditioning, not a race.' },
  { page: 'exercises/repeat-tempo-intervals.html',
    old: 'Perform repeated moderate-intensity intervals (tempo runs or work bouts) at a controlled, sustainable effort with set recovery between each, repeating for the prescribed number. Hold a consistent, repeatable pace across all intervals rather than fading. Keep form clean and breathing rhythmic throughout.',
    neu: 'Choose one steady, low-impact way to work — an easy-to-moderate jog, a bike, a rower, brisk incline walking, or a smooth bodyweight flow. Work for a set interval (for example 30–60 seconds) at a controlled, moderate effort of about 70% — quick enough that you feel it, but smooth enough that you could repeat it many times. Then rest for the prescribed recovery (often about equal to the work time, or a little longer) and repeat for the set number of intervals. The key is a consistent pace: every interval should look like the first — resist the urge to start fast and fade. Keep your breathing and form under control the whole way through.' },
  { page: 'exercises/repeat-efforts-shift-simulation.html',
    old: 'Perform repeated high-intensity work bouts that mimic a hockey shift — roughly 40–60 seconds of mixed-intensity effort (sprints, changes of direction, battles) followed by a rest interval simulating bench time, repeated for the prescribed number of “shifts.” Push hard through each bout and recover during the rest, simulating the work-rest pattern of a game.',
    neu: 'This recreates the work-then-rest rhythm of a real hockey shift, and you can do it entirely on your own. Work for about 40–60 seconds doing controlled, mixed movement — for example a few seconds of brisk skipping or marching, an easy shuttle or change of direction, then some quick (but sub-maximal) feet, and repeat — keeping everything smooth and controlled, with no maximal sprints, sharp cutting, or contact. Then “sit on the bench”: rest about 60–90 seconds, like real bench time between shifts. That is one shift. Repeat for the prescribed number of shifts. Push the work bouts to a strong but controlled effort, and use the rest to recover so every shift stays high quality rather than turning into a sloppy grind.' },
  { page: 'exercises/combine-circuit.html',
    old: 'Move through a circuit of varied stations — for example, jumps, sprints, carries, core, and pressing — performing each for a set time or reps with minimal rest between stations, then resting after a full round. Maintain quality on each movement while keeping the pace up. Complete the prescribed number of rounds.',
    neu: 'Set up 4–6 simple stations and move through them in order, on your own. For a joint-friendly version, use low-impact stations — for example a loaded carry (suitcase or farmer carry), an anti-rotation core hold (Pallof press or side plank), a single-leg balance hold, a few soft-landing hops (ankle hops or stuck skater hops), and a steady bodyweight movement (squats or step-ups). Spend a set time or number of reps at each station, take a short rest as you move between them, then rest longer (1–2 minutes) after completing a full round. Complete the prescribed number of rounds. Keep the quality high at every station — this is a movement-quality circuit, not a race against the clock.' },
];

let json = fs.readFileSync('exercises.json', 'utf8');
let jsonHits = 0, pageHits = 0, problems = [];
for (const p of PAIRS) {
  if (json.includes(p.old)) { json = json.replace(p.old, p.neu); jsonHits++; }
  else problems.push('JSON miss: ' + p.page);
  let html = fs.readFileSync(p.page, 'utf8');
  if (html.includes(p.old)) { html = html.split(p.old).join(p.neu); fs.writeFileSync(p.page, html); pageHits++; }
  else problems.push('PAGE miss: ' + p.page);
}
fs.writeFileSync('exercises.json', json);
console.log('exercises.json replacements:', jsonHits, '/ 5');
console.log('page replacements:', pageHits, '/ 5');
console.log('problems:', problems.length ? JSON.stringify(problems, null, 1) : 'none');
