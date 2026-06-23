/* Build program-40plus-office.html — clones program.html's shell (head/fonts/CSS/images/JS
   verbatim) and repopulates the body for an 8-week off-ice program for AGES 40+.
   Every exercise is resolved against the "Website Program" tab (_pool.json); exLink() THROWS
   on any name not on the tab AND on any RED-excluded (high-risk) name, mechanically enforcing
   "no exercise outside the allowed pool" and "no excluded exercise". */
import fs from 'fs';

const SRC = fs.readFileSync('program.html', 'utf8');
const pool = JSON.parse(fs.readFileSync('_pool.json', 'utf8'));
const r2 = JSON.parse(fs.readFileSync('_r2.json', 'utf8'));

const R2BASE = 'https://pub-40102464ff0f4d61a636f1749e9d3111.r2.dev/';
const SITE = 'https://elitehockeydrills.com/exercises/';
const byName = {};
pool.forEach(p => { byName[p.name] = p; });

/* RED — the 12 exclusions from the verified risk audit. exLink() refuses these. */
const EXCLUDED = new Set([
  'Explosive Push-Up', 'Dragon Flag Negatives', 'Hanging Straight-Leg Raise',
  'Squat to Tuck Jump', 'Broad Jump → Sprint 10m', 'Contrast Jump', 'Squat to Broad Jump',
  'Lateral Depth Drop to Bound', 'Hurdle Hops — Continuous', 'Jump Rope — Speed',
  'Repeat Sprint Ability', 'Battle Game / 1v1',
]);

const used = new Set();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = n => String(n).padStart(2, '0');

function exLink(name) {
  const p = byName[name];
  if (!p) throw new Error('OUT-OF-POOL EXERCISE: "' + name + '" is not on the Website Program tab.');
  if (EXCLUDED.has(name)) throw new Error('EXCLUDED (RED) EXERCISE used: "' + name + '".');
  used.add(name);
  const vid = r2[p.file] === 200 ? ` data-video="${R2BASE}${p.file}.mp4"` : '';
  return `<a class="ex"${vid} href="${SITE}${p.slug}" target="_blank" rel="noopener">${esc(name)}<span class="lk" aria-hidden="true">↗</span></a>`;
}
function cueFor(name) {
  const how = (byName[name].how || '').replace(/\s+/g, ' ').trim();
  const first = (how.split(/(?<=[.])\s/)[0] || how).trim();
  if (first.length <= 150) return first;
  const cut = first.slice(0, 150);
  let b = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '), cut.lastIndexOf(' — '), cut.lastIndexOf(' – '));
  if (b < 90) b = cut.lastIndexOf(' ');
  return first.slice(0, b).replace(/[\s,;—–-]+$/, '') + '.';
}

/* ---------- exercise-row / block / session / week templates ---------- */
function exrow(i, e) {
  return `
    <div class="exrow">
      <div class="ex-head">
        <span class="ex-idx">${pad(i)}</span>
        ${exLink(e.ex)}
      </div>
      <div class="ex-specs">
        <span class="spec"><b>${esc(e.sr)}</b></span>
        <span class="spec dim">${esc(e.cue)}</span>
        <span class="spec rest">${esc(e.rest)}</span>
      </div>
      <div class="ex-note">${esc(e.note)}</div>
    </div>`;
}
function refGroup(num, name, mins, text, href) {
  return `
    <div class="blockgroup ref">
      <div class="bg-head"><span class="bg-name">${num} · ${name}</span><span class="bg-mins">${mins}</span></div>
      <div class="ref-text">${text} <a class="ref-link" href="${href}">see page →</a></div>
    </div>`;
}
function workGroup(num, name, mins, exs) {
  return `
      <div class="blockgroup">
        <div class="bg-head"><span class="bg-name"><span class="bg-num">${num}</span> ${name}</span><span class="bg-mins">${mins}</span></div>
        ${exs.map((e, i) => exrow(i + 1, e)).join('')}
      </div>`;
}
function session(label, d, dow, fMain, fSub, skill, main, compete, finMins) {
  return `
    <article class="session">
      <div class="session-week">${label}</div>
      <div class="session-head">
        <div class="sh-day"><span class="display">DAY ${d}</span><span class="sh-dow">${dow}</span></div>
        <div class="sh-focus"><span class="sh-focus-main">${fMain}</span><span class="sh-focus-sub">${fSub}</span></div>
      </div>
      ${refGroup(1, 'Joint Prep &amp; Mobility', '10–12 min', 'Raise · Activate · Mobilize · Prime — the long warm-up that keeps you healthy, done first every session.', '#ramp')}
      ${workGroup(2, 'Movement &amp; Speed', '8–12 min', skill)}
      ${workGroup(3, 'Main Work', '15–20 min', main)}
      ${workGroup(4, 'Conditioning &amp; Core', finMins, compete)}
      ${refGroup(5, 'Cool-Down &amp; Recovery', '5–8 min', 'Down-regulate — slow the breath, then a real mobility flow to start recovery.', '#cooldown')}
    </article>`;
}

const X = 'X · move fast';

/* ====================================================================
   THE 8-WEEK PLAN — daily-undulating. Every exercise is a Website Program
   tab name; no RED exclusions. Day 1 = Strength & Quality, Day 2 = Speed &
   Reactive, Day 3 = Power & Express (landings only in Block 1; moderate
   power introduced from Week 5). Groin + single-leg every week.
   ==================================================================== */
const WEEKS = [
/* ---------------- BLOCK 1 — GROOVE & PREP ---------------- */
{ n:1, kicker:'BLOCK 1', tagClass:'build', tagText:'PREP', label:'BLOCK 1 · GROOVE & PREP · WEEK 1 · PREP',
  desc:'ON-RAMP — groove the patterns, own every landing soft, and leave reps in the tank everywhere. Run your Week-0 checkpoints first.',
  days:[
   { d:1, dow:'Mon', fMain:'Strength & Quality', fSub:'Hinge · Single-leg · Groin · Core',
     skill:[
       {ex:'Wall Drive Hold', sr:'2×10s/side', cue:'tall · knee up', rest:'REST 30s', note:'Lean in, drive one knee up, long support leg. Find the sprint position and hold it still — pure posture practice.'},
       {ex:'SL Balance — Eyes Closed', sr:'2×20s/side', cue:'balance', rest:'REST 30s', note:'Soft knee, quiet foot, eyes closed. Grip the floor with the toes. Stand near a wall.'} ],
     main:[
       {ex:'Banded Squat', sr:'2×10', cue:'3011 · own depth', rest:'REST 60s', note:'Sit between the hips to a depth you own, knees track over the toes, tall chest, drive up.'},
       {ex:'Banded RDL', sr:'2×8', cue:'3011 · hinge', rest:'REST 60s', note:'Hips back, soft knees, flat back. Feel the hamstrings load, then stand tall. Light tension to start.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin care', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back. Protect the groin.'},
       {ex:'Dead Bug with DB', sr:'2×6/side', cue:'slow · brace', rest:'REST 45s', note:'Low back glued to the floor, move opposite arm and leg slowly. Light weight or none.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×30m', cue:'tall · band', rest:'REST 45s', note:''} ] },
   { d:2, dow:'Wed', fMain:'Speed & Reactive', fSub:'Linear mechanics · Footwork · Core',
     skill:[
       {ex:'A-Skip Moving', sr:'2×10m', cue:'rhythm · tall', rest:'REST 40s', note:'Move down the line — knee up, toe up, tall posture. A smooth rhythm beats a fast one.'},
       {ex:'Fast Feet / Ladder Equiv', sr:'2×10s', cue:'quick · light', rest:'REST 30s', note:'Fast, light feet in a small space, tall posture, eyes up.'} ],
     main:[
       {ex:'Crossover Step', sr:'3×6/side', cue:'open hips', rest:'REST 45s', note:'Cross the trail leg over, open the hips, push off the outside leg. Controlled, not maximal.'},
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'3010 · medium', rest:'REST 45s', note:'Step wide, sit into the hip, drive back to the middle. Chest tall.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'anti-rotation', rest:'REST 40s', note:'March tall against the band, trunk locked, no twist.'} ],
     compete:[
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, thread the top arm under and back. Steady, no sinking — finish with anti-rotation core.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Landing · Decelerate · Posterior',
     skill:[
       {ex:'Drop Squat', sr:'3×3', cue:'X · catch & stick', rest:'REST 45s', note:'Drop into a strong, wide athletic stance and freeze. Beat the floor down, absorb, hold.'},
       {ex:'Ankle Hop Stick', sr:'3×5', cue:'X · stiff · quiet', rest:'REST 45s', note:'Small, quiet hops, stiff ankle. Stick the last one dead-still.'} ],
     main:[
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · stick', rest:'REST 45s', note:'Jump sideways onto one leg, land soft and silent, freeze. Own the landing before any power.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×8/side', cue:'squeeze', rest:'REST 45s', note:'One foot down, drive the hip up level, squeeze and pause. Hips stay even.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin care', rest:'REST 30s', note:'Squeeze the inner thigh across the body, control it back. Groin work, every week.'} ],
     compete:[
       {ex:'Tempo BW Circuit', sr:'2 rounds', cue:'steady', rest:'REST 60s', note:'Smooth, controlled pace through the circuit. Build a joint-friendly engine.'} ] } ] },

{ n:2, kicker:'BLOCK 1', tagClass:'build', tagText:'BUILD', label:'BLOCK 1 · GROOVE & PREP · WEEK 2 · BUILD',
  desc:'REINFORCE — same shapes, a touch more range and load. Add the loaded hinge and capped acceleration.',
  days:[
   { d:1, dow:'Mon', fMain:'Strength & Quality', fSub:'Squat · Hinge · Single-leg · Core',
     skill:[
       {ex:'Wall Drive Hold', sr:'2×12s/side', cue:'tall · knee up', rest:'REST 30s', note:'Same tall sprint posture, held a touch longer. Long support leg, ribs down.'},
       {ex:'Lateral Squat Shift', sr:'3×6/side', cue:'controlled', rest:'REST 30s', note:'Shift side to side, sink into each hip, stay low and balanced. Both heels down.'} ],
     main:[
       {ex:'Banded Front Squat', sr:'3×8', cue:'3011 · tall', rest:'REST 60s', note:'Band racked across the front, elbows up and proud, sit tall and drive.'},
       {ex:'DB RDL', sr:'2×8', cue:'3011 · light', rest:'REST 60s', note:'Light DBs slide down the thighs, flat back. Bothers your back? Do Banded RDL — the band is lightest at the bottom, where the spine is most vulnerable.'},
       {ex:'DB Goblet Lateral Lunge', sr:'3×6/side', cue:'3010 · light', rest:'REST 60s', note:'Light DB at the chest, push the hips back over the bending leg, other leg straight.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'Tall march against the band, trunk locked, no twist.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×25m', cue:'tall · light', rest:'REST 45s', note:'Walk tall and braced against light band tension. Do not lean. Excellent, joint-friendly durability work.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Reactive', fSub:'Acceleration · Lateral · Core',
     skill:[
       {ex:'A-Skip + March Combo', sr:'2×12m', cue:'rhythm', rest:'REST 40s', note:'March to set the position, skip to add rhythm. Tall posture, active arms.'},
       {ex:'Crossover Step', sr:'3×6/side', cue:'footwork', rest:'REST 40s', note:'Open the hips, cross the trail leg over, push off the outside leg.'} ],
     main:[
       {ex:'Reactive 5m Sprint', sr:'3×5m', cue:'self-cue · ~80%', rest:'REST 60s', note:'Self-start it solo — drop a ball and chase it, or count 3-2-1 — then a sharp first step to ~80% over 5m on warm legs. Build to speed smoothly, never cold or all-out.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back.'},
       {ex:'Side Plank with Reach', sr:'3×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, thread the top arm under and back. Steady, no sinking.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1 round', cue:'easy · steady', rest:'REST 60s', note:'Easy, conversational, nasal-breathing pace. A solo aerobic finish — recovery, not a grind.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Landing · Single-leg · Posterior',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Quiet, springy hops. Stick the finish. Stay tall.'},
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · stick 2s', rest:'REST 45s', note:'Land on one leg and hold for a two-count. Soft and silent.'} ],
     main:[
       {ex:'Low Box Hop-Up — Stick', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Hop up onto a low box, land soft and silent on top, stand tall. Step down — never jump down.'},
       {ex:'SL DB RDL', sr:'2×6/side', cue:'3011 · balance', rest:'REST 50s', note:'One-leg hinge with a light DB, flat back, slow. Balance or back/hip complains? Do DB RDL on two legs, or fingertip a wall.'},
       {ex:'Banded Hamstring Slides', sr:'2×8', cue:'control', rest:'REST 45s', note:'Hips up, slide the heels out and curl them back. Hamstrings cramp? Shorten the range, or do Band Glute Bridge.'} ],
     compete:[
       {ex:'Repeat Tempo Intervals', sr:'4×30s', cue:'steady', rest:'REST 45s', note:'Repeatable, controlled bouts on full rest. Build the engine without the pounding.'} ] } ] },

{ n:3, kicker:'BLOCK 1', tagClass:'peak', tagText:'BUILD', label:'BLOCK 1 · GROOVE & PREP · WEEK 3 · BUILD',
  desc:'BLOCK-1 PEAK — the busiest week of the first block. Best mechanics on all three days; impact still landing-led only.',
  days:[
   { d:1, dow:'Mon', fMain:'Strength & Quality', fSub:'Squat · Hinge · Single-leg · Core',
     skill:[
       {ex:'Wall Drive Hold', sr:'3×12s/side', cue:'tall', rest:'REST 30s', note:'Tall, rigid line from support heel to head. Drive the knee, hold it still.'},
       {ex:'SL Balance — Eyes Closed', sr:'3×25s/side', cue:'balance', rest:'REST 30s', note:'Quiet foot, soft knee, eyes closed. Hold steady a little longer this week.'} ],
     main:[
       {ex:'Banded Squat', sr:'3×10', cue:'3011 · medium', rest:'REST 75s', note:'Own your depth, knees track the toes, tall chest, drive up against the band.'},
       {ex:'Banded RDL', sr:'3×10', cue:'3011 · medium', rest:'REST 60s', note:'Hips back, flat back, drive the hips through to stand tall.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×6/side', cue:'3010 · light', rest:'REST 60s', note:'Rear foot on a box, drop straight down, vertical front shin, light DBs. Knee cranky? Lower the box, stop short of parallel, lighten — or do a flat split squat.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh across the body, control it back. Protect the groin.'} ],
     compete:[
       {ex:'Side Plank with Reach', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'Hips high, thread the top arm under and back, then open it up. Steady, no sinking — anti-lateral-flexion trunk strength, zero equipment.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Reactive', fSub:'Acceleration · Change of direction · Core',
     skill:[
       {ex:'A-Skip Moving', sr:'3×12m', cue:'rhythm', rest:'REST 40s', note:'Knee up, toe up, tall and rhythmic down the line.'},
       {ex:'Fast Feet / Ladder Equiv', sr:'3×10s', cue:'quick', rest:'REST 30s', note:'Quick, light feet, tall posture. Speed of the feet, not the head.'} ],
     main:[
       {ex:'Crossover Step to Sprint', sr:'3×10m', cue:'open · ~80%', rest:'REST 60s', note:'Crossover to open the hips, then accelerate at controlled effort. Warm the groin first; keep the sprint-out submaximal.'},
       {ex:'Reactive 4-Cone', sr:'3×1', cue:'pre-planned · controlled', rest:'REST 60s', note:'Run a KNOWN cone pattern at controlled speed with rounded plants — not a reactive, all-out cut.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate · brace', rest:'REST 40s', note:'Pull the band diagonally across the body, brace the trunk, control the return.'} ],
     compete:[
       {ex:'Bear Crawl Variations', sr:'3×15s', cue:'brace · low', rest:'REST 40s', note:'Knees hovering, back flat, hips level — crawl and resist any twist. A strong anti-rotation finish.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Landing · Lateral · Posterior',
     skill:[
       {ex:'Drop Squat', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Fall into a strong stance and freeze. Sharp, clean, balanced.'},
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Prime the ankles — quick, quiet, springy. Stick the finish.'} ],
     main:[
       {ex:'Skater Hop — Stick It', sr:'3×5/side', cue:'X · stick', rest:'REST 45s', note:'A touch more push than Week 2, still land soft and stick each one balanced.'},
       {ex:'Low Box Hop-Up — Stick', sr:'3×5', cue:'X · stick', rest:'REST 45s', note:'Explosive up, silent landing on the box, stand tall. Step down to reset.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×10/side', cue:'squeeze', rest:'REST 40s', note:'Level hips, drive up, squeeze. One leg at a time.'} ],
     compete:[
       {ex:'Sprint Intervals 15s', sr:'4×15s', cue:'hard · bike/skate', rest:'REST 60s', note:'Hard 15s bouts on a BIKE or skating-pattern (not all-out ground running), full rest. Conditioning without the impact.'} ] } ] },

{ n:4, kicker:'BLOCK 1', tagClass:'deload', tagText:'DELOAD', label:'BLOCK 1 · GROOVE & PREP · WEEK 4 · DELOAD',
  desc:'DELOAD — sets come down ~40–50%, impact drops, quality stays crisp. Let the work catch up, then re-run your checkpoints.',
  days:[
   { d:1, dow:'Mon', fMain:'Movement Quality', fSub:'Mobility · Light strength',
     skill:[
       {ex:'Deep Squat Hold', sr:'3×20s', cue:'breathe', rest:'REST 40s', note:'Sit to a comfortable squat depth, heels down, tall chest, breathe. Only as deep as stays clean and pain-free.'},
       {ex:'SL Balance — Eyes Closed', sr:'2×20s/side', cue:'balance', rest:'REST 30s', note:'Quiet foot, soft knee, eyes closed. Hold steady.'} ],
     main:[
       {ex:'Banded Squat', sr:'2×8', cue:'easy', rest:'REST 60s', note:'Light and clean, own your depth. Recovery week — leave plenty in the tank.'},
       {ex:'Band Glute Bridge', sr:'2×12', cue:'squeeze', rest:'REST 40s', note:'Drive the heels, squeeze the glutes, pause. Knees out against the band.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — pull across, squeeze the inner thigh, control it back.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×25m', cue:'tall · band', rest:'REST 45s', note:''} ] },
   { d:2, dow:'Wed', fMain:'Easy Speed & Core', fSub:'Coordination · Brace',
     skill:[
       {ex:'A-Skip Moving', sr:'2×10m', cue:'easy', rest:'REST 40s', note:'Crisp, tall, easy. Just grease the pattern.'},
       {ex:'Lateral Squat Shift', sr:'2×6/side', cue:'control', rest:'REST 30s', note:'Slow side-to-side, sink into the hip.'} ],
     main:[
       {ex:'Crossover Step', sr:'2×6/side', cue:'easy', rest:'REST 40s', note:'Open the hips, cross over, easy push. No straining.'},
       {ex:'Pallof March', sr:'2×8/side', cue:'brace', rest:'REST 40s', note:'Tall march, trunk locked, no twist.'},
       {ex:'Dead Bug with DB', sr:'2×6/side', cue:'slow', rest:'REST 40s', note:'Low back flat, slow opposite arm and leg.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1 round', cue:'easy', rest:'REST 60s', note:'Easy, conversational, nasal-breathing pace. Recovery, not a grind.'} ] },
   { d:3, dow:'Fri', fMain:'Light Landings & Mobility', fSub:'Soft landings · Recovery',
     skill:[
       {ex:'Ankle Hop Stick', sr:'2×5', cue:'X · quiet', rest:'REST 45s', note:'Springy and quiet. Stick the finish.'},
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 45s', note:'Soft, silent one-leg landings. Freeze each one.'} ],
     main:[
       {ex:'Drop Squat', sr:'2×3', cue:'X · stick', rest:'REST 45s', note:'Sink and stick a strong stance. Sharp but few.'},
       {ex:'SL Glute Bridge (Band)', sr:'2×8/side', cue:'squeeze', rest:'REST 40s', note:'Level hips, squeeze, pause. Keep it easy.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady.'} ],
     compete:[
       {ex:'Dead Bug with DB', sr:'2×6/side', cue:'slow · brace', rest:'REST 40s', note:'Low back flat to the floor, slow opposite arm and leg. Easy, controlled core to close the deload.'} ] } ] },

/* ---------------- BLOCK 2 — EXPRESS & COMPETE ---------------- */
{ n:5, kicker:'BLOCK 2', tagClass:'build', tagText:'BUILD', label:'BLOCK 2 · EXPRESS & COMPETE · WEEK 5 · BUILD',
  desc:'EXPRESS IT — re-enter sharp and introduce moderate-amplitude power with soft landings. Power day gains its first real jump.',
  days:[
   { d:1, dow:'Mon', fMain:'Strength & Power', fSub:'Lower power · Hinge · Single-leg',
     skill:[
       {ex:'A-Skip Moving', sr:'3×10m', cue:'rhythm', rest:'REST 40s', note:'Tall, rhythmic, active arms. Prime the legs.'},
       {ex:'SL Balance — Eyes Closed', sr:'3×25s/side', cue:'balance', rest:'REST 30s', note:'Soft knee, quiet foot, eyes closed. Steady hold.'} ],
     main:[
       {ex:'Banded Squat Jump', sr:'3×4', cue:'X · sub-max · soft', rest:'REST 75s', note:'Quarter-squat, jump at MODERATE height against the band, land soft and quiet. Drop the "max" cue — happy knees/Achilles/back come first. Low reps.'},
       {ex:'Banded RDL', sr:'3×10', cue:'3011 · medium', rest:'REST 60s', note:'Hips back, flat back, drive through to stand tall.'},
       {ex:'DB Goblet Lateral Lunge', sr:'3×8/side', cue:'3010 · light', rest:'REST 60s', note:'Light DB at the chest, hips back over the bending leg, drive back to center.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh, control the band back. Groin every week.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×30m', cue:'tall · braced', rest:'REST 45s', note:'Walk tall and braced. A little farther this week. No lean, no shrug.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Reactive', fSub:'Top-end mechanics · Rotation',
     skill:[
       {ex:'A-Skip + March Combo', sr:'3×12m', cue:'rhythm', rest:'REST 40s', note:'March, then skip — same tall posture and ground contact in both.'},
       {ex:'Crossover Step', sr:'3×6/side', cue:'open', rest:'REST 40s', note:'Open the hips, cross over, push off the outside leg.'} ],
     main:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'smooth · ~90%', rest:'REST 75s', note:'Long, gradual build-in, then a smooth, relaxed fast zone at ~90% — never a true all-out top gear. Full recovery protects the hamstring/Achilles.'},
       {ex:'Banded Rotational Press', sr:'3×6/side', cue:'X · rotate · control', rest:'REST 45s', note:'Drive the rotation from the hips through the trunk and press out, control the return. No ballistic snap.'},
       {ex:'Copenhagen Plank — Long', sr:'3×15s/side', cue:'short-lever', rest:'REST 40s', note:'Use the SHORT-lever version — bottom knee on the bench. Hold steady; build time slowly. The most hockey-relevant groin work there is.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1–2 rounds', cue:'easy · steady', rest:'REST 60s', note:'Steady, conversational solo aerobic work. Build the engine without the pounding.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Lateral power · Upper · Core',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Quick, quiet, springy. Stick the finish.'},
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · stick', rest:'REST 45s', note:'Bound, land soft, freeze each one balanced.'} ],
     main:[
       {ex:'Lateral Skater Bound', sr:'3×3/side', cue:'X · stick each', rest:'REST 60s', note:'Push off and bound sideways onto one leg, land soft and STICK each one — do not rebound continuously. A controlled, hockey-specific lateral push.'},
       {ex:'DB Floor Press', sr:'3×8', cue:'3010 · light', rest:'REST 60s', note:'Press light DBs, elbows about 45°, pause an inch off the floor. The floor caps the range and protects the shoulder.'},
       {ex:'Band Row', sr:'3×10', cue:'2011 · squeeze', rest:'REST 45s', note:'Pull the elbows back, squeeze the shoulder blades, tall chest. Posture work.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'4×30s', cue:'shift · controlled', rest:'REST 60s', note:'Shift-length bursts of controlled mixed movement, bench-rest between — keep it controlled: no max sprints, sharp cuts, or battles.'} ] } ] },

{ n:6, kicker:'BLOCK 2', tagClass:'peak', tagText:'BUILD', label:'BLOCK 2 · EXPRESS & COMPETE · WEEK 6 · BUILD',
  desc:'SHARPEN — crisper reactive work and the only week we add a capped low-box drop. Moderate amplitude only, perfect landings.',
  days:[
   { d:1, dow:'Mon', fMain:'Strength & Power', fSub:'Lower power · Hinge · Single-leg · Core',
     skill:[
       {ex:'Wall Drive Hold', sr:'3×12s/side', cue:'tall', rest:'REST 30s', note:'Tall, rigid sprint line. Drive the knee, hold it still.'},
       {ex:'Drop Squat', sr:'3×3', cue:'X · stick', rest:'REST 45s', note:'Beat the floor down into a strong stance and freeze.'} ],
     main:[
       {ex:'Banded Squat Jump', sr:'4×4', cue:'X · moderate · soft', rest:'REST 75s', note:'Moderate amplitude against the band, land soft and silent. Reset fully between sets. No max intent.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×8/side', cue:'3010 · light', rest:'REST 60s', note:'Vertical front shin, controlled, light DBs. Knee cranky? Lower the box, stop short of parallel, lighten.'},
       {ex:'SL RDL (Banded)', sr:'3×6/side', cue:'3011 · balance', rest:'REST 45s', note:'One-leg hinge under band tension, flat back. Shaky? Regress to Banded RDL on two legs, or fingertip a wall and keep the range short.'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh, control it back. Protect the groin.'} ],
     compete:[
       {ex:'Bear Crawl Variations', sr:'3×15s', cue:'brace · low', rest:'REST 40s', note:'Knees hovering an inch off the floor, back flat, hips level — crawl and resist any twist. Pure bodyweight trunk strength, no equipment.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Reactive', fSub:'Change of direction · Anti-rotation',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'3×10s', cue:'quick', rest:'REST 30s', note:'Quick light feet, tall posture, eyes up.'},
       {ex:'A-Skip + March Combo', sr:'3×12m', cue:'rhythm', rest:'REST 40s', note:'March, then skip — tall, rhythmic, active arms.'} ],
     main:[
       {ex:'Reactive Lateral Start', sr:'4×5m', cue:'react · controlled', rest:'REST 60s', note:'Explode sideways on a cue — default to a crossover (skip the drop-step), start submaximal, sharpen only as it feels clean. Protect the groin and inside knee.'},
       {ex:'Reactive 4-Cone', sr:'4×1', cue:'pre-planned · controlled', rest:'REST 60s', note:'Known cone pattern at controlled speed, rounded plants. Stay low through the turn.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'Tall march against the band, no twist.'} ],
     compete:[
       {ex:'Plank Shoulder Tap', sr:'3×10', cue:'brace · square', rest:'REST 40s', note:'Tap the opposite shoulder without letting the hips rock. Wider feet are easier. Anti-rotation finish.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Vertical/lateral · Rotation · Conditioning',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Prime the ankles — quick, quiet. Stick the finish.'},
       {ex:'Low Box Hop-Up — Stick', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Explosive up, silent landing on the box, stand tall.'} ],
     main:[
       {ex:'Depth Drop (Low Box)', sr:'3×4', cue:'X · land & stick', rest:'REST 75s', note:'Step (do not jump) off the LOWEST box or a curb, land soft and silent on both feet, freeze. Quality over height. Knee complains? Replace with Drop Squat.'},
       {ex:'SL CMJ Stick', sr:'3×3/side', cue:'X · stick', rest:'REST 60s', note:'Single-leg jump and stick the landing balanced. Too much on one knee? Do a two-leg jump to a stuck landing (Low Box Hop-Up — Stick) instead.'},
       {ex:'Banded Rotational Press', sr:'3×6/side', cue:'rotate · control', rest:'REST 45s', note:'Rotate through the hips and press out, brace the trunk, control the return.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift · controlled', rest:'REST 50s', note:'Shift-length controlled bursts, bench-rest between. Repeat your movement — no max sprints, cuts, or battles.'} ] } ] },

{ n:7, kicker:'BLOCK 2', tagClass:'peak', tagText:'PEAK', label:'BLOCK 2 · EXPRESS & COMPETE · WEEK 7 · PEAK',
  desc:'PUT IT TOGETHER — the program peak. Express moderate power with your best quality. This is as hard as it gets.',
  days:[
   { d:1, dow:'Mon', fMain:'Power Integration', fSub:'Power · Posterior · Single-leg',
     skill:[
       {ex:'Drop Squat', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Sharp drop into a strong, balanced stance. Freeze it.'},
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · bound + stick', rest:'REST 60s', note:'A touch more push, still land soft and stick each one balanced.'} ],
     main:[
       {ex:'Banded Squat Jump', sr:'4×4', cue:'X · moderate · soft', rest:'REST 90s', note:'Top (moderate) amplitude for the program, soft and silent landings, full reset. Still no max-impact pounding.'},
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · stick each', rest:'REST 60s', note:'Powerful sideways push, cover ground, land soft and STICK each one. No continuous rebounding.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · light', rest:'REST 60s', note:'Hinge, light DBs down the thighs, flat back. Back bothers you? Switch to Banded RDL (lightest at the bottom).'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh, control it back. Protect the groin.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×30m', cue:'tall · band', rest:'REST 45s', note:''} ] },
   { d:2, dow:'Wed', fMain:'Max-Mechanics & Core', fSub:'Top speed · Rotation',
     skill:[
       {ex:'A-Skip + March Combo', sr:'3×12m', cue:'rhythm', rest:'REST 40s', note:'Tall, rhythmic, active arms. Prime the legs.'},
       {ex:'Crossover Step to Sprint', sr:'3×10m', cue:'open · ~85%', rest:'REST 60s', note:'Open the hips with a crossover, then accelerate — controlled, not all-out. Warm the groin first.'} ],
     main:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'smooth · ~90%', rest:'REST 75s', note:'Long build-in, then fly smooth and relaxed at ~90%. Never a true top gear. Full recovery.'},
       {ex:'Banded Rotational Throw (Wall)', sr:'3×5/side', cue:'rotate · control return', rest:'REST 45s', note:'Drive the rotation and throw to the wall, but CONTROL the return — no ballistic snap-back. Back cranky? Use the Banded Rotational Press.'},
       {ex:'Copenhagen Plank — Long', sr:'3×20s/side', cue:'short-lever', rest:'REST 40s', note:'Short-lever (bottom knee on the bench). A little longer than Week 5. Steady hips.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'2 rounds', cue:'steady', rest:'REST 60s', note:'Steady solo aerobic work to finish — keep it conversational and nasal-breathing.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Express', fSub:'Lateral power · Upper · Core',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Quick, quiet, springy. Stick the finish.'},
       {ex:'Low Box Hop-Up — Stick', sr:'3×5', cue:'X · stick', rest:'REST 45s', note:'Explosive up, silent landing, stand tall. Step down to reset.'} ],
     main:[
       {ex:'SL CMJ Stick', sr:'3×3/side', cue:'X · stick', rest:'REST 60s', note:'Single-leg jump and stick. Too much on one knee? Two-leg jump to a stuck landing instead.'},
       {ex:'Half-Kneeling DB Press', sr:'3×8/side', cue:'2011 · light', rest:'REST 50s', note:'Tall half-kneel, press light DBs straight up, ribs down. Overhead bothers the shoulder? Switch to DB Floor Press, or press only to a pain-free height.'},
       {ex:'Band Row', sr:'3×10', cue:'2011 · squeeze', rest:'REST 45s', note:'Elbows back, squeeze, tall chest.'} ],
     compete:[
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate · brace', rest:'REST 40s', note:'Pull the band diagonally across the body, brace hard, control the return. Rotational core to finish.'} ] } ] },

{ n:8, kicker:'BLOCK 2', tagClass:'taper', tagText:'TAPER', label:'BLOCK 2 · EXPRESS & COMPETE · WEEK 8 · TAPER',
  desc:'TAPER — volume drops, quality stays sharp. More recovery than a younger program. Re-run your checkpoints and see how far you have come.',
  days:[
   { d:1, dow:'Mon', fMain:'Sharp & Springy', fSub:'Light power',
     skill:[
       {ex:'A-Skip Moving', sr:'2×10m', cue:'rhythm', rest:'REST 40s', note:'Crisp, tall, easy. Just sharpen the pattern.'},
       {ex:'Ankle Hop Stick', sr:'2×5', cue:'X · stiff', rest:'REST 45s', note:'Springy and quiet. Stick the finish.'} ],
     main:[
       {ex:'Banded Squat Jump', sr:'3×3', cue:'X · moderate · soft', rest:'REST 75s', note:'A few crisp, quality jumps, soft and silent landings. This is a taper — sharp, not heavy.'},
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'Soft, silent one-leg landings. Freeze each.'},
       {ex:'SL Glute Bridge (Band)', sr:'2×8/side', cue:'squeeze', rest:'REST 40s', note:'Level hips, squeeze, pause. Keep it easy.'} ],
     compete:[
       {ex:'Farmer Carry (Banded)', sr:'2×25m', cue:'tall · light', rest:'REST 45s', note:'Tall and braced, lighter load. No lean.'} ] },
   { d:2, dow:'Wed', fMain:'Quick Feet & Core', fSub:'Coordination · Brace',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'2×10s', cue:'quick', rest:'REST 40s', note:'Light, fast feet, tall posture.'},
       {ex:'Crossover Step', sr:'2×6/side', cue:'open', rest:'REST 40s', note:'Open the hips, cross over, easy push.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'2×6/side', cue:'light', rest:'REST 50s', note:'Light and clean, hips back over the bending leg.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — squeeze the inner thigh, control it back.'},
       {ex:'Pallof March', sr:'2×8/side', cue:'brace', rest:'REST 40s', note:'Tall march, trunk locked, no twist.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1 round', cue:'easy', rest:'REST 60s', note:'Easy, steady, nasal-breathing solo aerobic. Taper week — keep it light.'} ] },
   { d:3, dow:'Fri', fMain:'Power & Checkpoint', fSub:'Show your work',
     skill:[
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'A couple of clean, balanced, silent landings per side.'},
       {ex:'Low Box Hop-Up — Stick', sr:'2×4', cue:'X · stick', rest:'REST 45s', note:'Explosive up, soft stick on the box. Step down.'} ],
     main:[
       {ex:'Box Step-Up (DBs)', sr:'2×6/side', cue:'drive · light', rest:'REST 50s', note:'Whole foot on a knee-height box, drive through the top heel to stand tall, lower under control. Light DBs. A clean single-leg strength move to finish the program.'},
       {ex:'Deep Squat Hold', sr:'2×20s', cue:'breathe', rest:'REST 40s', note:'Sit to a comfortable depth, heels down, tall chest. Breathe.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1 round', cue:'easy · finish', rest:'REST 60s', note:'An easy, steady solo aerobic finish. Re-run your checkpoints this week and see how far you have come.'} ] } ] },
];

/* ---------- Conditioning & Core finisher (identical shape every session) ----------
   Almost-zero-equipment: NO carries, NO weights. Every session's finisher is the SAME
   shape — ~10–12 min of easy Zone 2 aerobic work PLUS one short core piece (band /
   bodyweight, rotated so it is not the same every day and never duplicates that session). */
const ZONE2_NOTE = 'Easy, continuous low-impact cardio — brisk walk, easy bike or row, light marching / step-ups, or easy skipping. Keep it conversational: you can talk or nose-breathe the whole time (~60–70%). No stopping, no grind.';
const ZONE2 = { ex: 'Aerobic Circuit (Zone 2)', sr: '10–12 min', cue: 'easy · steady', rest: '—', note: ZONE2_NOTE };
const CORE_ROTATION = [
  { ex: 'Dead Bug with DB', sr: '2×8/side', cue: 'slow · brace', rest: 'REST 40s', note: 'Low back pressed flat to the floor, move the opposite arm and leg slowly. Light weight or none — keep breathing, do not rush.' },
  { ex: 'Side Plank with Reach', sr: '2×8/side', cue: 'brace', rest: 'REST 30s', note: 'Hips high, thread the top arm under and back, then open it up. Only the upper body rotates — steady, no sinking.' },
  { ex: 'Pallof March', sr: '2×8/side', cue: 'anti-rotation', rest: 'REST 40s', note: 'Press the band out and hold; march one knee up at a time, resisting any twist. Tall and locked the whole time.' },
  { ex: 'Bear Crawl Variations', sr: '2×20s', cue: 'brace · low', rest: 'REST 40s', note: 'Knees hovering an inch off the floor, back flat, hips level — crawl slowly and resist any twist. Bodyweight only.' },
  { ex: 'Plank Shoulder Tap', sr: '2×10', cue: 'brace · square', rest: 'REST 30s', note: 'High plank, feet wide. Tap the opposite shoulder without letting the hips rock side to side. Wider feet make it easier.' },
  { ex: 'Banded Chop / Lift', sr: '2×8/side', cue: 'rotate · brace', rest: 'REST 40s', note: 'Pull the band diagonally across the body — high-to-low, then low-to-high — bracing so the trunk does not rotate. Control the return.' },
  { ex: 'Copenhagen Plank — Long', sr: '2×15s/side', cue: 'short-lever', rest: 'REST 40s', note: 'Use the SHORT-lever version — bottom knee on a bench or the floor. Squeeze the top-leg inner thigh, hips tall. Build the time slowly.' },
  { ex: 'Hollow Rock', sr: '2×8', cue: 'brace', rest: 'REST 40s', note: 'Low back pressed flat, shoulders and legs lifted, rock as one rigid unit. If the back arches, bend the knees or just hold a static hollow.' },
];
/* Block-2 Day-3 trains the repeat-effort (shift) engine instead of Zone 2, progressing
   4 -> 5 -> 6 "shifts" across W5-W7. Every other day (and W8 taper) keeps Zone 2. */
const SHIFT_SIM = (shifts) => ({
  ex: 'Repeat Efforts — Shift Simulation', sr: `${shifts}×~40s`, cue: 'shift · controlled', rest: 'REST 75s',
  note: 'A solo "shift": ~40s of controlled mixed movement — brisk march, step-ups, fast feet, skater stick-steps, soft landings — NO max sprints, NO cutting. Then sit ~75s of easy "bench" rest, and repeat. Cap the effort; swap to easy Zone 2 on any cranky day.',
});
const SHIFT_BY_WEEK = { 5: 4, 6: 5, 7: 6 };
let coreIdx = 0;
for (const w of WEEKS) for (const d of w.days) {
  const inSession = new Set([...d.skill, ...d.main].map(e => e.ex));
  let core = null;
  for (let k = 0; k < CORE_ROTATION.length; k++) {
    const cand = CORE_ROTATION[(coreIdx + k) % CORE_ROTATION.length];
    if (!inSession.has(cand.ex)) { core = cand; coreIdx += k + 1; break; }
  }
  if (!core) { core = CORE_ROTATION[coreIdx % CORE_ROTATION.length]; coreIdx++; }
  // Zone 2 duration ramps within each block and eases on the deload (W4) and taper (W8).
  const ZMIN = ({ 1: [10, 12], 2: [12, 14], 3: [12, 14], 4: [8, 10], 5: [12, 14], 6: [12, 14], 7: [12, 14], 8: [8, 10] }[w.n]) || [10, 12];
  let conditioning, finMins;
  if (SHIFT_BY_WEEK[w.n] && d.d === 3) {
    conditioning = SHIFT_SIM(SHIFT_BY_WEEK[w.n]);
    finMins = '12–15 min';
  } else {
    conditioning = { ...ZONE2, sr: `${ZMIN[0]}–${ZMIN[1]} min` };
    finMins = `${ZMIN[0] + 2}–${ZMIN[1] + 3} min`; // Zone 2 + a short core piece
  }
  d.compete = [ conditioning, { ...core } ];
  d.finMins = finMins;
}

/* A horizontal band PULL every week: Band Row on the Strength day (Day 1) so pulling
   strength / posture is trained even in Block 1, balancing the forward-skating posture and
   the pressing. (Band Pull-Apart also primes the upper back in the RAMP every session.) */
for (const w of WEEKS) for (const d of w.days) {
  if (d.d === 1 && !d.main.some(e => e.ex === 'Band Row')) {
    const easy = (w.n === 4 || w.n === 8);
    d.main.push({ ex: 'Band Row', sr: easy ? '2×10' : '3×12', cue: '2011 · squeeze', rest: 'REST 45s', note: 'Anchor a band in front; drive the elbows back and squeeze the shoulder blades, tall chest — do not lean back. Pulling strength and posture insurance against all the forward-skating and pressing. Go to a heavier band as it gets easy.' });
  }
}

/* ---------- RAMP warm-up ---------- */
const RAMP = [
  ['R','Raise','~2–3 min','Lift the heart rate, temperature, and blood flow — gently. Use the no-hop, step-out versions if a knee or Achilles is cranky.', ['Butt Kicks','Jumping Jacks']],
  ['A','Activate','~3 min','Switch on the glutes, groin, deep core, and the upper back that protects the shoulders.', ['Banded Monster Walk','Banded Lateral Walk','Banded Clamshell','Adductor Rocker','Band Pull-Apart Speed']],
  ['M','Mobilize','~3–4 min','Open the hips, groin, ankles, and upper back through the ranges skating needs.', ['Spider Lunge with Rotation','90/90 Hip Switch','T-Spine Rotation','Ankle Dorsiflexion (Wall)']],
  ['P','Prime','~2 min','Wake up coordinated movement with a few crisp, easy efforts — march the A-skip (no hop) if the Achilles is cranky.', ['A-Skip in Place','Lateral Squat Shift','Inchworm to Push-Up']],
];
/* ---------- Cool-down (Cool-down/Recovery tab only) ---------- */
const COOLDOWN = ['Slow Walk with Nose Breathing','Child\'s Pose with Breath','Supine Spinal Twist','Hip / Groin Flow'];

/* ---------- Movement-quality & durability checkpoints ---------- */
const CHECKS = [
  { n:1, ex:'Broad Jump', quality:'Lower-body power (horizontal)', proto:'3 attempts, best distance', gain:'+5–15 cm', w:'74%',
    how:'Fresh, after the RAMP: from a two-foot stance, swing the arms and jump forward for max distance — land soft and STICK it, no stumble. Measure heel-to-heel; best of 3 with full rest.' },
  { n:2, ex:'Iso Wall Sit', quality:'Leg strength-endurance', proto:'Best hold', gain:'+20–40 s', w:'70%',
    how:'Back on the wall, thighs parallel, weight in the heels. Time until form breaks. Stop at any sharp knee pain.' },
  { n:3, ex:'Copenhagen Plank — Long', quality:'Groin durability', proto:'Short-lever, best hold / side', gain:'+10–20 s', w:'64%',
    how:'Short-lever (bottom knee on a bench). Time each side. The most hockey-relevant durability test there is.' },
  { n:4, ex:'Hanging / Bar Hold', quality:'Grip & upper-body endurance', proto:'Best dead hang', gain:'+15–30 s', w:'62%',
    how:'Dead-hang from a sturdy bar, arms straight, shoulders lightly packed. Time until your grip gives out. Stop if a shoulder pinches.' },
  { n:5, ex:'Beep Test', quality:'Aerobic engine (VO2max)', proto:'Best level / shuttle', gain:'+1–2 levels', w:'68%',
    how:'Run the 20 m multistage beep test to an honest finish (free audio apps). Score the level and shuttle you reach. Ease in, push the back half, and stop at any sharp or joint pain.' },
];

/* ---------- Progression / Regression (40+ appropriate) ---------- */
const PROGREG = [
  ['Banded Squat','Lighter band, or sit to a box at the depth you own.','Heavier band, or a slow 3-second lower.'],
  ['Banded RDL','Lighter band and a shorter range; keep the back flat.','Add a light DB RDL, or a pause at the bottom.'],
  ['DB Bulgarian Split Squat','Lower the rear-foot height (or a flat split squat); lighten or drop the DBs.','Add a pause at the bottom, or a slow lower. Keep the load light.'],
  ['SL Box Step-Down','Lower box, and only tap-and-hover instead of a full floor tap.','A slightly higher box — only once the standing knee stays quiet.'],
  ['Banded Standing Adduction','Lighter band, or a shorter range.','Heavier band, or a 2-second squeeze at the inside.'],
  ['Copenhagen Plank — Long','Short-lever — bottom knee on the bench or floor. Start here.','Lengthen the hold; progress the lever only when it is easy and pain-free.'],
  ['Skater Hop — Stick It','Smaller hop, or step to reset between reps.','Bound farther — still land soft and stick it dead-still.'],
  ['Ankle Hop Stick','A single low, quiet hop, then reset.','A few in a row — ankles stiff, landings silent.'],
  ['Banded Squat Jump','Drop the max intent — quarter-squat, sub-maximal, soft landings.','A touch more amplitude, only once every landing is silent.'],
  ['Pallof March','Lighter band, or step farther from the anchor.','Heavier band, step closer, or a longer march.'],
  ['Band Row','Lighter band, or a shorter range.','Heavier band, or one arm at a time for anti-rotation.'],
  ['DB Floor Press','Lighter DBs, or a slow lower.','Heavier DBs — or a Half-Kneeling press, only if the shoulder is happy overhead.'],
  ['Side Plank with Reach','From the knees, or a shorter hold without the reach.','Add the reach-through rotation, or build the hold time.'],
  ['Deep Squat Hold','Sit only to a comfortable depth, or hold a support in front.','Sink deeper and taller over the weeks, hands free.'],
];

/* ====================================================================
   SECTION BUILDERS
   ==================================================================== */
function topbar() {
  return `
    <header class="topbar">
      <div class="tb-main">
        <div class="tb-brand"><span class="tb-dot"></span>ELITE HOCKEY DRILLS</div>
        <nav class="tb-links">
          <a href="#method">Method</a><a href="#roadmap">Roadmap</a><a href="#tests">Check</a><a href="#glossary">Glossary</a>
        </nav>
        <div class="tb-handle">@ELITE_HOCKEY_DRILLS</div>
      </div>
      <div class="tb-weekbar">
        <nav class="tb-weeks" aria-label="Jump to week">
          <span class="wk-group"><a class="wk-label" href="#block-1"><span class="wk-n">Block 1</span><span class="wk-nm">groove &amp; prep</span></a><span class="wk-nums"><span class="wk-eyebrow">Weeks</span><span class="wk-chips"><a href="#week-1" data-wk="1">1</a><a href="#week-2" data-wk="2">2</a><a href="#week-3" data-wk="3">3</a><a href="#week-4" data-wk="4">4</a></span></span></span>
          <span class="wk-sep"></span>
          <span class="wk-group"><a class="wk-label" href="#block-2"><span class="wk-n">Block 2</span><span class="wk-nm">express &amp; compete</span></a><span class="wk-nums"><span class="wk-eyebrow">Weeks</span><span class="wk-chips"><a href="#week-5" data-wk="5">5</a><a href="#week-6" data-wk="6">6</a><a href="#week-7" data-wk="7">7</a><a href="#week-8" data-wk="8">8</a></span></span></span>
        </nav>
      </div>
    </header>`;
}

function cover(coverB64) {
  return `
    <section class="sheet cover" id="cover">
      <figure class="cover-photo" style="background-image:url('data:image/jpeg;base64,${coverB64}')" aria-hidden="true"></figure>
      <div class="cover-top">
        <div class="cover-brand">ELITE HOCKEY DRILLS</div>
        <div class="cover-edition">8-WEEK OFF-ICE PROGRAM</div>
      </div>
      <div class="cover-mid">
        <div class="cover-eyebrow">Off-Ice Strength, Power &amp; Movement for Hockey · AGES 40+ · Built to Keep You Playing</div>
        <h1 class="display cover-h1">STRONG<br><span class="amp serif">&amp;</span> DURABLE<span class="dot">.</span></h1>
        <p class="serif cover-tagline">Stay fast, strong, and on the ice — smart off-ice training for the veteran player.</p>
      </div>
      <div class="cover-stats"><div class="stat"><div class="stat-num display" data-count="8">8</div><div class="stat-lab">WEEKS</div></div><div class="stat"><div class="stat-num display" data-count="3">3</div><div class="stat-lab">SESSIONS / WK</div></div><div class="stat"><div class="stat-num display" data-count="24">24</div><div class="stat-lab">SESSIONS</div></div><div class="stat"><div class="stat-num display" data-count="2">2</div><div class="stat-lab">BLOCKS</div></div></div>
      <div class="cover-foot">
        <div class="cover-coach"><span class="cc-by">PROGRAMMED BY</span><span class="cc-name display">Coach David Ciboch</span><span class="cc-cred">M.Ed. Sport Science · S&amp;C, UAE National Ice Hockey Team</span></div>
        <div class="cover-handle">@ELITE_HOCKEY_DRILLS<br>elitehockeydrills.com</div>
      </div>
    </section>`;
}

function welcome() {
  return `
    <section class="sheet" id="welcome">
      <header class="sec-head"><div class="eyebrow ice">Read This First · For the 40+ Player</div><h2 class="sec-title"><span class="st-lead">BUILT TO</span><span class="st-accent serif">keep you playing.</span></h2></header>
      <p class="lead">This is a real off-ice program for the player who still loves the game and intends to keep playing it well. Eight weeks to make a 40-plus athlete faster, stronger, and more durable — with bands, bodyweight, and light dumbbells — built around the one truth that changes everything after 40: recovery and tissue tolerance, not work capacity, decide what you can train.</p>
      <div class="prose"><p>Somewhere after 40, the math of training changes. The engine is still there and the competitiveness never left — but joints carry some mileage, tissue takes longer to bounce back, and the cost of one max-effort, badly-absorbed landing is higher than it used to be. So this program is built backwards from how most are written: recovery, joint prep, and movement quality are the headline, and power is dosed carefully on top of a body that is prepped to absorb it. We protect the knees, back, shoulders, Achilles, and groin on purpose.</p><p>Every session shares the same simple shape and runs about 50–70 minutes. Three sessions a week, eight weeks, two four-week blocks. Block 1 rebuilds the chassis — mobility, balance, single-leg control, and landing skill, with no real jumps. Block 2 adds moderate-amplitude power and on-ice expression, then tapers you fresh.</p><p>It is honest about the goal. This is not built to chase the numbers you hit at 22 — it is built to keep you fast, strong, and on the ice, playing well and staying healthy, for many more seasons. Train smart over ego, and that is exactly what you get.</p></div>
      <div class="callout warm">
        <div class="callout-h display">Honest expectations</div>
        <p>Eight weeks is enough to land noticeably cleaner, balance better, accelerate harder, strengthen the groin and single leg, and feel more durable on the ice. It is not about a one-time peak — chasing 20-year-old numbers at 40-plus is how veteran players get hurt. Train it as written, sleep well, eat enough protein, and the gains show up where they count: still playing, still fast, still healthy.</p>
      </div>
      <div class="rules">
        <div class="rules-h display">TWO RULES · NON-NEGOTIABLE</div>
        <div class="rule"><span class="rule-n display">01</span><p>Groin and single-leg work appear every week — the groin and one-leg balance are where skating lives, and where 40-plus players most often get tweaked. We train them on purpose.</p></div><div class="rule"><span class="rule-n display">02</span><p>Pain is information, not a challenge. Sharp pain, or pain in a joint under load, means regress or skip — every hard movement in here has a built-in scale. Backing off on a cranky day is a training skill, not a weakness.</p></div>
      </div>
    </section>`;
}

function method() {
  const pillars = [
    ['Tissue tolerance is the limiter','After 40, recovery and connective-tissue tolerance — not work capacity — decide what you can train. We program to the body&rsquo;s recovery rate, not the ego. That is how you keep training instead of rehabbing.'],
    ['Recovery &amp; joint care, up front','Mobility, joint prep, and a real cool-down lead and close every session. This is the main event that keeps you on the ice — not warm-up filler you rush through to get to the &ldquo;real&rdquo; work.'],
    ['Move well before you move fast','Every block starts with landing, deceleration, balance, and groin care. Power is built on clean movement — rush that order and you build it on a cranky joint.'],
    ['Power, dosed by quality','Jumps, bounds, and throws are crisp, soft-landing reps at moderate amplitude with full rest — never max-impact pounding or grinding to failure. Quality of movement is the goal; the output follows.'],
    ['Built around hockey','Single-leg strength, lateral push-off, the hinge, rotation, groin care, and a braced core are the spine of the program, because that is exactly what skating is.'],
    ['Train smart, not your age','This keeps you fast, strong, and durable — playing well for years. Smart training beats ego every time, and an extra rest day is always allowed.'],
  ];
  return `
    <section class="sheet" id="method">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">01</span><span class="eyebrow ice">The Method</span></div><h2 class="sec-title"><span class="st-lead">WHY THIS</span><span class="st-accent serif">works.</span></h2></header>
      <p class="lead">This is not a random circuit. It is durability-first athletic development for the 40-plus player — sequenced to keep you fast, powerful, and on the ice, season after season.</p>
      <div class="pillars">
        ${pillars.map(([h, p]) => `<div class="pillar"><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>

  <figure class="chart fv-chart">
    <div class="chart-title">WHERE 8 WEEKS TAKES YOU</div>
    <svg viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="fvfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5DB4E5" stop-opacity="0.18"/><stop offset="1" stop-color="#5DB4E5" stop-opacity="0"/></linearGradient>
        <marker id="ah" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#ECEDEF"/></marker>
      </defs>
      <g stroke="#16161C" stroke-width="1"><line x1="100" y1="96" x2="664" y2="96"/><line x1="100" y1="158" x2="664" y2="158"/><line x1="100" y1="220" x2="664" y2="220"/></g>
      <g stroke="#3A3A45" stroke-width="1.5"><line x1="100" y1="44" x2="100" y2="288"/><line x1="100" y1="288" x2="676" y2="288"/></g>
      <path d="M100 40 L95 52 L105 52 Z" fill="#3A3A45"/><path d="M682 288 L670 283 L670 293 Z" fill="#3A3A45"/>
      <path d="M100 70 C 290 104, 376 220, 660 266 L660 288 L100 288 Z" fill="url(#fvfill)"/>
      <path d="M100 128 C 240 156, 300 244, 548 282" fill="none" stroke="#6A6F7B" stroke-width="2.5" stroke-dasharray="6 7" stroke-linecap="round"/>
      <path d="M100 70 C 290 104, 376 220, 660 266" fill="none" stroke="#5DB4E5" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="306" cy="248" r="5" fill="#6A6F7B"/>
      <circle cx="372" cy="198" r="6.5" fill="#ECEDEF"/>
      <line x1="318" y1="240" x2="360" y2="208" stroke="#ECEDEF" stroke-width="2" marker-end="url(#ah)"/>
      <text class="fv-shift" x="388" y="196" text-anchor="start">MORE DURABLE</text>
      <text class="fv-axis" transform="rotate(-90 54 166)" x="54" y="166" text-anchor="middle">STRENGTH</text>
      <text class="fv-axis" x="390" y="324" text-anchor="middle">SPEED →</text>
    </svg>
    <div class="fv-legend">
      <span class="fv-key"><i class="fvline now"></i><b>Now</b><em>where you start</em></span>
      <span class="fv-key"><i class="fvline after"></i><b>After 8 weeks</b><em>stronger &amp; faster, moving cleaner</em></span>
    </div>
    <figcaption>Athleticism is movement quality, strength, and speed together. Block 1 rebuilds the movement and strength base; Block 2 extends moderate power and speed — so the whole curve shifts up and to the right, without beating up the body. That shift is a faster, more durable player, built to keep playing.</figcaption>
  </figure>
    </section>`;
}

function roadmap() {
  return `
<aside class="pullquote"><p class="serif">Build durability first. Speed and power are what you stack on a body that&rsquo;s prepped to absorb them.</p><span class="pq-by">The Method</span></aside>

    <section class="sheet" id="roadmap">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">02</span><span class="eyebrow ice">The Roadmap</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">eight weeks.</span></h2></header>
      <p class="lead">Two blocks of four weeks. Volume nudges to a peak, then unloads — twice — so you arrive at every checkpoint fresh and durable, not buried.</p>
      <div class="road-blocks">
          <div class="road-block">
            <div class="rb-tag">BLOCK 1 · WEEKS 1–4</div>
            <h3 class="display rb-name">GROOVE &amp; PREP</h3>
            <p class="serif rb-line">“Rebuild the chassis.”</p>
            <p class="rb-desc">Re-establish joint prep, mobility, balance, single-leg control, and band/bodyweight strength on durable tissue. Landing-led plyos only — no real jumps yet. Volume nudges W1→W3, then W4 deloads and you re-check.</p>
          </div>
          <div class="road-block">
            <div class="rb-tag">BLOCK 2 · WEEKS 5–8</div>
            <h3 class="display rb-name">EXPRESS &amp; COMPETE</h3>
            <p class="serif rb-line">“Express it on the ice.”</p>
            <p class="rb-desc">Introduce moderate-amplitude power with soft landings, smoother near-top speed, and solo conditioning and core finishers. Volume peaks W7, then W8 tapers into recovery and the final checkpoint.</p>
          </div>
      </div>
    </section>`;
}

function howto() {
  const arch = [
    ['1','JOINT PREP &amp; MOBILITY (RAMP)','10–12 min','Raise, Activate, Mobilize, Prime. The most important warm-up you have done — joint prep is headline work here, done before every single session.'],
    ['2','Movement &amp; Speed','8–12 min','Controlled speed mechanics, balance, and footwork while you are fresh. Low-impact, quality over quantity.'],
    ['3','Main Work','15–20 min','The heart of the session, set by the day&rsquo;s focus — strength and single-leg on strength days, controlled speed and change-of-direction on speed days, moderate-amplitude power on power days. Crisp reps, full rest, never to failure.'],
    ['4','Conditioning &amp; Core','12–17 min','Most sessions finish with easy Zone 2 aerobic work (it ramps from ~10 up to ~14 min across each block and eases on the deload and taper) plus one short core piece. On the Week 5–7 power days the Zone 2 is swapped for a controlled repeat-effort &ldquo;shift&rdquo; simulation. All band or bodyweight — no weights.'],
    ['5','Cool-Down &amp; Recovery','5–8 min','Down-regulate. Slow nasal breathing and a real mobility flow — recovery starts here, not tomorrow.'],
  ];
  return `
    <section class="sheet" id="howto">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">03</span><span class="eyebrow ice">How To Use This</span></div><h2 class="sec-title"><span class="st-lead">EVERY</span><span class="st-accent serif">session.</span></h2></header>
      <p class="lead">All 24 sessions share the same five-part shape. Run them in order. Total time: about 50–70 minutes. Leave at least one full day between sessions and never stack two back-to-back — at 40+, tendons recover slower than muscle, so if the week gets squeezed, drop a session rather than doubling up. The Mon/Wed/Fri spacing is part of the program, not a suggestion.</p>
      <div class="arch">
        ${arch.map(([n, name, mins, p]) => `<div class="arch-row"><span class="arch-n display">${n}</span><div class="arch-body"><div class="arch-h"><span class="arch-name">${name}</span><span class="arch-mins">${mins}</span></div><p>${p}</p></div></div>`).join('')}
      </div>
      <div class="legend">
        <div class="legend-h display">HOW EACH EXERCISE READS</div>
        <p class="legend-intro">Every exercise is written as a quick spec sheet. Read it the same way each time:</p>
        <div class="legend-row"><div class="legend-key">01  EXERCISE — NAME</div><div class="legend-val">The movement. The name is a live link — tap it for the full video demo, cues, and common mistakes on the site.</div></div><div class="legend-row"><div class="legend-key">SETS × REPS</div><div class="legend-val">How many work sets, and reps (or seconds / metres) per set. &ldquo;/side&rdquo; means per leg or per arm. A range means pick what you can do cleanly today.</div></div><div class="legend-row"><div class="legend-key">TEMPO / CUE</div><div class="legend-val">The middle tag is the quality cue — &ldquo;X&rdquo; means explosive INTENT at a moderate amplitude, and where the cue says &ldquo;stick&rdquo; the speed is in the absorb, not the descent (land soft and freeze); &ldquo;3010&rdquo; is a tempo in seconds (lower / pause / up / pause); &ldquo;light / medium&rdquo; is band or dumbbell load. A percentage like &ldquo;~80–90%&rdquo; means a smooth, relaxed, sub-maximal effort that never hits true top gear (about 7–8 out of 10), always with a gradual build-in and full recovery. Load stays light-to-moderate and always sub-failure.</div></div><div class="legend-row"><div class="legend-key">REST</div><div class="legend-val">Recovery before the next set. Power and speed rest is long on purpose — you are training crisp, durable movement, not chasing a burn.</div></div><div class="legend-row"><div class="legend-key">HOW TO PROGRESS</div><div class="legend-val">The targets are a starting point, not a ceiling. Each week, once a session feels smooth and pain-free, nudge ONE thing — a slightly heavier band, one or two more clean reps, a slower tempo, or a touch more range. If form breaks or a joint complains, hold the week or step back. Small, steady, earned.</div></div>
      </div>
    </section>`;
}

function kit() {
  const items = [
    ['01','Loop resistance band set','Light, medium, and heavy. The variable tension is your load — and it is joint-friendly. Most of the strength and power work runs on these.'],
    ['02','A low box or sturdy bench','Knee height or lower. For step-downs, box hop-ups, rear-foot-elevated split squats, and soft low-box landings. Lower is safer for cranky knees.'],
    ['03','~10 metres of open space','A driveway, hallway, garage, or yard. Enough to skip, accelerate, bound, and run solo agility and footwork drills.'],
    ['04','Light dumbbells (optional)','A light pair is a nice-to-have for a few of the strength moves — but never required, and never heavy. Bands and bodyweight cover the entire program on their own. No heavy weights, no gym.'],
  ];
  return `
    <section class="sheet" id="kit">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">04</span><span class="eyebrow ice">What You&rsquo;ll Need</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">kit.</span></h2></header>
      <p class="lead">Almost zero equipment, and deliberately joint-friendly. For a 40+ body, bands and bodyweight done with quality are exactly right — a design choice, not a compromise. The whole program runs on a band and your bodyweight; a light pair of dumbbells is an optional bonus, never required. No barbells, no heavy weights, no gym.</p>
      <div class="kit-grid">
        ${items.map(([n, h, p]) => `<div class="kit-item"><span class="kit-n display">${n}</span><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
      <p class="kit-note serif">A skipping rope, a wall, and a foam roller are useful but optional. The whole program is built to be done solo — everything here works in a garage with a band and a box.</p>
    </section>`;
}

function ramp() {
  return `
    <section class="sheet" id="ramp">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">05</span><span class="eyebrow ice">Before Every Session</span></div><h2 class="sec-title"><span class="st-lead">THE RAMP</span><span class="st-accent serif">warm-up.</span></h2></header>
      <p class="lead">Raise. Activate. Mobilize. Prime. About 10–12 minutes, every session, no exceptions. For a 40+ body this is the difference-maker — it is how you walk out healthy, not the part you skip.</p>
      <div class="ramp-grid">
        ${RAMP.map(([letter, name, sub, desc, exs]) => `
          <div class="ramp-phase">
            <div class="rp-letter display">${letter}</div>
            <div class="rp-body">
              <div class="rp-h"><span class="display">${name}</span><span class="rp-sub">${sub}</span></div>
              <p class="rp-desc">${desc}</p>
              <ul class="rp-list">${exs.map(n => `<li>${exLink(n)}</li>`).join('')}</ul>
            </div>
          </div>`).join('')}
      </div>
    </section>`;
}

function cooldown() {
  return `
    <section class="sheet" id="cooldown">
      <div class="cd-split">
        <div class="cd-col">
          <div class="cd-kick">After every session · 5–8 min</div>
          <h2 class="display cd-title">THE COOL-DOWN</h2>
          <p class="lead">Shift out of go-mode and into recovery. Slow the breath first, then move gently through range. At 40+ this is where tomorrow&rsquo;s training is protected.</p>
          <ul class="cd-list">${COOLDOWN.map(n => `<li>${exLink(n)}</li>`).join('')}</ul>
        </div>
        <div class="cd-col screen-col">
          <div class="cd-kick">A 60-second readiness check, before you train</div>
          <h2 class="display cd-title">THE BODY CHECK</h2>
          <p class="lead">A quick self-check before each session. A &ldquo;yes&rdquo; below means dial it back today — regress the hard work, cut the impact, and lean on mobility and easy movement.</p>
          <ul class="screen-list"><li>Any joint (knee, hip, back, shoulder) achy, swollen, or stiffer than usual today?</li><li>Sharp pain anywhere that gets worse under load?</li><li>Poor sleep, run-down, sick, or unusually sore from the last session?</li><li>A nagging tweak — groin, hamstring, low back — still not settled?</li><li>Stiff and under-warmed, or short on time for the full RAMP?</li></ul>
          <p class="screen-note serif">Any &ldquo;yes&rdquo; is information, not a stop sign. Cut the impact and volume, skip the jumps, lean on mobility and easy Zone 2 — and see a qualified professional for pain that sharpens under load or does not settle. Training around a cranky joint is a skill; ignoring it is not.</p>
        </div>
      </div>
    </section>`;
}

function tests() {
  const cards = CHECKS.map(c => `
          <div class="test-card">
            <div class="tc-top"><span class="tc-n display">${pad(c.n)}</span><span class="tc-gain">${c.gain}</span></div>
            <h3 class="tc-name">${exLink(c.ex)}</h3>
            <div class="tc-quality">${c.quality}</div>
            <div class="tc-proto">${c.proto}</div>
            <p class="tc-how">${c.how}</p>
            <div class="tc-gauge" aria-hidden="true">
              <div class="tcg-head"><span class="tcg-label">8-Week Target</span><span class="tcg-val">▲ ${c.gain}</span></div>
              <div class="tcg-bar"><span style="--w:${c.w}"></span></div>
            </div>
          </div>`).join('');
  const baselineRows = CHECKS.map(c => `<tr><td class="tname">${exLink(c.ex)}</td><td class="tdim">${c.quality}</td><td></td><td></td><td></td><td class="hi"></td></tr>`).join('');
  return `
    <section class="sheet" id="tests">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">06</span><span class="eyebrow ice">The Checkpoints</span></div><h2 class="sec-title"><span class="st-lead">CHECK.</span><span class="st-accent serif">don&rsquo;t guess.</span></h2></header>
      <p class="lead">Five benchmarks, no gym required, each tied to a hockey quality and each improvable in eight weeks — power (Broad Jump), leg strength-endurance (Wall Sit), groin durability (Copenhagen), grip &amp; upper-body endurance (Dead Hang), and your aerobic engine (Beep Test). The Broad Jump and Beep Test are honest max efforts: warm up fully with the RAMP, push them hard, and stop at any sharp or joint pain. Run the full set three times: Week 0 (baseline), Week 4 (mid-block), Week 8 (final).</p>
      <p class="proto-note serif">Check rested, warmed up with the RAMP, in the same shoes and surface each time. Score honestly — real, pain-free progress is the win. If anything hurts, stop and note it; pain is never a checkpoint to push through.</p>
      <div class="test-grid">
        ${cards}
      </div>
      <div class="checkpoints">3 CHECKPOINTS · WEEK 0 → WEEK 4 → WEEK 8</div>

    <div class="scorecard">
      <div class="sc-head"><h3 class="display">WEEK 0 — BASELINE</h3><span class="sc-sub serif">Check before you train. These are the numbers you build on.</span></div>
      <table class="sc-table"><thead><tr><th>Checkpoint</th><th>Hockey quality</th><th>Att 1</th><th>Att 2</th><th>Att 3</th><th class="hi">Best</th></tr></thead><tbody>${baselineRows}</tbody></table>
      <p class="sc-note">Note the best of your attempts, plus a word on quality. Re-check on the same surface, shoes, and method each time.</p>
    </div>
    </section>
<aside class="pullquote"><p class="serif">At 40+, chase honest numbers you can beat — your jump, your holds, your engine — but never at the cost of a cranky joint. Progress that keeps you playing is the real win.</p><span class="pq-by">Check. Don&rsquo;t guess.</span></aside>`;
}

function blockIntro(num, n, tag, name, line, paras) {
  return `
    <section class="sheet block-intro" id="block-${n}">
      <div class="bi-num display">${num}</div>
      <div class="bi-tag">${tag}</div>
      <h2 class="display bi-name">${name}</h2>
      <p class="serif bi-line">${line}</p>
      <div class="bi-body">${paras.map(p => `<p>${p}</p>`).join('')}</div>
    </section>`;
}

function weekSection(w) {
  return `
    <section class="sheet week" id="week-${w.n}">
      <header class="week-head">
        <div class="week-kicker">${w.kicker}</div>
        <div class="week-title-row">
          <h2 class="display week-title">WEEK ${w.n}</h2>
          <span class="week-tag ${w.tagClass}">${w.tagText}</span>
        </div>
        <p class="week-desc">${w.desc}</p>
      </header>
      <div class="week-grid">
        ${w.days.map(d => session(w.label, d.d, d.dow, d.fMain, d.fSub, d.skill, d.main, d.compete, d.finMins)).join('')}
      </div>
    </section>`;
}

function scorecard(id, head, sub, cols, targetKey) {
  const th = cols.map(c => `<th${c.hi ? ' class="hi"' : ''}>${c.h}</th>`).join('');
  const rows = CHECKS.map(c => {
    const cells = cols.slice(1).map(col => {
      if (col.target) return `<td class="tdim">${c.gain}</td>`;
      if (col.hi) return `<td class="hi"></td>`;
      return `<td></td>`;
    }).join('');
    return `<tr><td class="tname">${exLink(c.ex)}</td>${cells}</tr>`;
  }).join('');
  return `
    <div class="scorecard">
      <div class="sc-head"><h3 class="display">${head}</h3><span class="sc-sub serif">${sub}</span></div>
      <table class="sc-table"><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table>
      <p class="sc-note">${targetKey}</p>
    </div>`;
}

function glossary() {
  const GBUCKET = [
    ['Warm-up & Mobility', ['Warm-up / Mobility', 'Cool-down / Recovery']],
    ['Plyometrics, Speed & Agility', ['Jump & Plyometric', 'Speed, Sprint & Agility']],
    ['Strength & Single-Leg', ['Squat / Knee-dominant', 'Hinge / Posterior Chain', 'Lunge & Single-leg', 'Upper Body / Push', 'Upper Body / Pull']],
    ['Core & Rotational', ['Core & Anti-rotation', 'Loaded Carries', 'Rotational Power']],
    ['Conditioning & Engine', ['Conditioning / Jump Rope', 'Energy Systems / Intervals', 'Competitive Play', 'Full-body & Complexes']],
  ];
  const tagOf = {
    'Warm-up / Mobility':'Warm-up','Cool-down / Recovery':'Cool-down','Jump & Plyometric':'Plyometric','Speed, Sprint & Agility':'Speed & Agility',
    'Squat / Knee-dominant':'Squat','Hinge / Posterior Chain':'Posterior Chain','Lunge & Single-leg':'Single-Leg','Upper Body / Push':'Push','Upper Body / Pull':'Pull',
    'Core & Anti-rotation':'Core','Loaded Carries':'Carry','Rotational Power':'Rotational','Conditioning / Jump Rope':'Conditioning','Energy Systems / Intervals':'Energy Systems','Competitive Play':'Compete','Full-body & Complexes':'Full-Body',
  };
  const usedNames = [...used];
  const groups = GBUCKET.map(([title, cats]) => {
    const names = usedNames.filter(n => cats.includes(byName[n].cat)).sort((a, b) => a.localeCompare(b));
    if (!names.length) return '';
    const items = names.map(n => `
      <div class="gloss-item">
        <div class="gi-name">${exLink(n)}</div>
        <div class="gi-cue">${esc(cueFor(n))}</div>
        <div class="gi-tags"><span class="gi-tag">${tagOf[byName[n].cat] || byName[n].cat}</span></div>
      </div>`).join('');
    return `<div class="gloss-group"><h3 class="display gloss-cat">${title}</h3><div class="gloss-list">${items}</div></div>`;
  }).join('\n');
  return `
    <section class="sheet" id="glossary">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">13</span><span class="eyebrow ice">Exercise Glossary</span></div><h2 class="sec-title"><span class="st-lead">EVERY</span><span class="st-accent serif">move.</span></h2></header>
      <p class="lead">Every exercise in the program, with a quick technical cue. Each name links to its full video demo, cues, and common mistakes on the site.</p>
      ${groups}
    </section>`;
}

function progreg() {
  const rows = PROGREG.map(([name, reg, prog]) => `
      <div class="pr-row">
        <div class="pr-name">${exLink(name)}</div>
        <div class="pr-reg"><span class="pr-lab reg">REGRESS</span> ${esc(reg)}</div>
        <div class="pr-prog"><span class="pr-lab prog">PROGRESS</span> ${esc(prog)}</div>
      </div>`).join('');
  return `
    <section class="sheet" id="progreg">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">14</span><span class="eyebrow ice">Progression &amp; Regression</span></div><h2 class="sec-title"><span class="st-lead">SCALE IT</span><span class="st-accent serif">right.</span></h2></header>
      <p class="lead">For each main movement: a sane regression for a cranky day or joint, and a harder progression once it is clean and pain-free. Earn the next step — never force it, especially around a tender joint.</p>
      <div class="pr-table">
        <div class="pr-row pr-headrow"><div class="pr-name">Movement</div><div class="pr-reg">Regression</div><div class="pr-prog">Progression</div></div>
        ${rows}
      </div>
    </section>`;
}

function recovery() {
  const cards = [
    ['Sleep','7–9 hours, consistently. After 40, recovery is the limiter — sleep is when tissue repairs and training becomes adaptation. Protect it like a session, because it is one.'],
    ['Fuel &amp; protein','Eat enough, with protein spread across the day — aging muscle needs more of it to rebuild. Real food around training, and do not train hard fasted.'],
    ['Hydration &amp; joints','Drink across the day, not just at training. Hydrated tissue moves and recovers better — pair it with a few minutes of daily mobility for the cranky joints.'],
    ['Listen &amp; regress','Aches, stiffness, or a nagging tweak mean back off the impact. The deload (Week 4) and taper (Week 8) are built in for exactly this — and an extra rest day is always the strong choice.'],
  ];
  return `
    <section class="sheet" id="recovery">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">09</span><span class="eyebrow ice">Recovery</span></div><h2 class="sec-title"><span class="st-lead">WHERE GAINS</span><span class="st-accent serif">land.</span></h2></header>
      <p class="lead">Training is the stimulus; sleep, food, and mobility are where a 40+ athlete actually adapts. At this stage, recovery is not optional support work — it is the main event.</p>
      <div class="rec-grid">
        ${cards.map(([h, p]) => `<div class="rec-card"><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
    </section>`;
}

function mindset() {
  const rows = [
    ['Move well first.','The goal of every rep is clean, controlled movement. A crisp, balanced rep beats a sloppy hard one every time. If your form breaks, the set is over.'],
    ['Quality gates quantity.','The set and rep targets are a ceiling, not a quota. Leave a rep or two in the tank — junk volume is how 40+ bodies get hurt, not how they get faster.'],
    ['Pain is information.','Sharp pain, or pain in a joint under load, means regress or skip. Every hard movement in here has a built-in scale. That is the smart, strong choice — not a soft one.'],
    ['Respect the deload and taper.','Weeks 4 and 8 pull back on purpose. Do not add work because you feel good — feeling fresh is the point, and it is what your checkpoints will show.'],
    ['Finish what you start.','Close every session with the conditioning or core finisher and a full cool-down. The unglamorous end of the session is what keeps you on the ice, season after season.'],
  ];
  return `
    <section class="sheet" id="mindset">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">10</span><span class="eyebrow ice">Mindset &amp; Rules</span></div><h2 class="sec-title"><span class="st-lead">HOW TO</span><span class="st-accent serif">train this.</span></h2></header>
      <p class="lead">You are training to keep playing the game you love, fast and healthy, for years. Train accordingly.</p>
      <div class="mind-list">
        ${rows.map(([h, p], i) => `<div class="mind-row"><span class="mind-n display">${pad(i + 1)}</span><div><h3 class="display mind-h">${h}</h3><p>${p}</p></div></div>`).join('')}
      </div>
    </section>`;
}

function about(aboutB64) {
  return `
    <section class="sheet" id="about">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">11</span><span class="eyebrow ice">Your Coach</span></div><h2 class="sec-title"><span class="st-lead">COACH</span><span class="st-accent serif">David Ciboch.</span></h2></header>
      <div class="about-grid has-photo">
        <figure class="about-visual"><img src="data:image/jpeg;base64,${aboutB64}" alt="Coach David Ciboch — S&amp;C, UAE National Ice Hockey Team" /><figcaption class="about-cap">UAE National Ice Hockey Team · IIHF</figcaption></figure>
        <div class="about-content">
          <div class="about-bio"><p>David Ciboch is a strength and conditioning specialist with a Master&rsquo;s in Sport Science and more than ten years coaching athletes from youth to the international level.</p><p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put genuine, national-team-level off-ice training in the hands of players who do not have a pro setup — just a band, a box, and the will to keep getting better.</p><p>This program is the off-ice work he would write for a competitive 40+ player in his gym: durability-first, hockey-specific, and built to keep you fast, strong, and healthy — playing the game you love for many more seasons.</p></div>
          <div class="about-creds"><div class="ac-h display">CREDENTIALS</div><ul><li>M.Ed. Sport Science</li><li>S&amp;C Coach — UAE National Ice Hockey Team</li><li>10+ years coaching, youth to international</li><li>PE &amp; Sport Science teacher</li><li>Founder, Elite Hockey Drills</li></ul></div>
        </div>
      </div>
    </section>`;
}

function next() {
  return `
    <section class="sheet" id="next">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">12</span><span class="eyebrow ice">What&rsquo;s Next</span></div><h2 class="sec-title"><span class="st-lead">KEEP</span><span class="st-accent serif">playing.</span></h2></header>
      <p class="lead">You built durability and power in eight weeks. Here is how you keep it through the season.</p>
      <div class="next-grid">
        <div class="next-card"><h3 class="display">In-season maintenance</h3><p>During the season you do not need this full volume — a couple of short sessions a week of the highest-value work here (groin and single-leg strength, a few soft-landing jumps, easy Zone 2, and daily mobility) holds your gains. The goal is simple: stay available and durable all season long.</p></div>
        <div class="next-card"><h3 class="display">The app</h3><p>Everything here — every exercise demo, your checkpoints, auto-progressing sessions — is coming to the Elite Hockey Drills app, so the program lives in your pocket and tracks itself.</p></div>
      </div>
      <div class="cta-band">
        <p class="serif cta-text">Re-run your checkpoints, keep the mobility daily, and tag us. Staying fast and healthy is the win.</p>
        <div class="cta-handle">@ELITE_HOCKEY_DRILLS · elitehockeydrills.com</div>
      </div>
    </section>`;
}

/* ====================================================================
   ASSEMBLE
   ==================================================================== */
const TITLE = 'STRONG &amp; DURABLE — 8-Week Off-Ice Hockey Program · Ages 40+ · Elite Hockey Drills';
const METADESC = 'An 8-week off-ice strength, power &amp; movement program for hockey players ages 40+. Durability-first, joint-friendly, bands + bodyweight. Built by Coach David Ciboch.';

let head = SRC.slice(0, SRC.indexOf('</head>') + '</head>'.length);
head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
head = head.replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${METADESC}" />`);

const coverB64 = (SRC.match(/cover-photo"[^>]*url\('data:image\/jpeg;base64,([^']+)'/) || [])[1];
const aboutB64 = (SRC.match(/about-visual"><img src="data:image\/jpeg;base64,([^"]+)"/) || [])[1];
if (!coverB64 || !aboutB64) throw new Error('Failed to extract embedded images (cover/about).');

const sStart = SRC.lastIndexOf('<script>');
const sEnd = SRC.indexOf('</script>', sStart) + '</script>'.length;
const closingScript = SRC.slice(sStart, sEnd);

const sCover = cover(coverB64);
const sWelcome = welcome();
const sMethod = method();
const sRoadmap = roadmap();
const sHowto = howto();
const sKit = kit();
const sRamp = ramp();
const sCooldown = cooldown();
const sTests = tests();
const sBlock1 = blockIntro('07', 1, 'BLOCK 1 · WEEKS 1–4', 'GROOVE &amp; PREP', '“Rebuild the chassis.”', [
  'You arrive as a player with real hockey in the legs — and some accumulated wear. Block 1 rebuilds the foundation everything else stacks on: joint prep and mobility as headline work, how to land and decelerate, single-leg balance and control, a braced core, and groin care every week. The plyometrics here are landing-led — drop squats, ankle hops, skater-hop sticks, and low-box stick-ups — where you absorb and own every landing. There are no real jumps yet, and that is on purpose.',
  'Speed is taught as a skill at controlled effort: A-skips, crossovers, footwork, and capped reactive starts, done fresh and crisp. The strength work is bands, bodyweight, and light dumbbells, biased to single-leg and posterior chain. Volume nudges up through Week 3, then Week 4 deloads — sets come down, impact drops — and you re-check your movement. Quality never drops, even on the easy week.',
]);
const sWeeks1to4 = WEEKS.slice(0, 4).map(weekSection).join('');
const sScoreMid = `<section class="sheet" id="scorecard-mid">${scorecard('scorecard-mid', 'WEEK 4 — MID-BLOCK CHECK', 'Halfway. Confirm movement and durability are improving before Block 2.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 4'}, {h:'Change', hi:true}, {h:'Target / 8 wk', target:true}],
  'Expect a bit more on most lines by now — a longer hold, a touch more jump, a higher level. Flat on a check? Look at sleep, recovery, and any nagging joint before pushing.')}</section>`;
const sBlock2 = blockIntro('08', 2, 'BLOCK 2 · WEEKS 5–8', 'EXPRESS &amp; COMPETE', '“Express it on the ice.”', [
  'The chassis is prepped. Now you express it — carefully. From Week 5 the program introduces moderate-amplitude power: sub-maximal banded squat jumps, stick-landing skater bounds, a single capped low-box drop, and single-leg jump-and-sticks — always soft landings, low volume, full rest, and never max-impact. Speed becomes smooth, near-top-end mechanics (capped at about 90%) and controlled reactive change-of-direction. One gate before you start: if any joint is still grumbling at the end of Week 4, repeat the deload or take two or three easy days before Week 5 — begin the jumps only when your landings are silent and pain-free.',
  'The finishers stay solo and joint-friendly: controlled repeat-efforts, steady Zone 2 aerobic work, and anti-rotation core that ask you to hold quality as you tire. Volume builds to a Week 7 peak — still capped — then Week 8 tapers hard: volume drops, quality stays sharp, and you re-run your checkpoints against Week 0 to see how much fresher, faster, and more durable you have become.',
]);
const sWeeks5to8 = WEEKS.slice(4, 8).map(weekSection).join('');
const sScoreFinal = `<section class="sheet" id="scorecard-final">${scorecard('scorecard-final', 'WEEK 8 — FINAL CHECK · YOU vs YOU', 'The proof. Same six checkpoints, eight weeks apart.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 8'}, {h:'Change', hi:true}, {h:'Quality note'}, {h:'Target', target:true}],
  'Note the change on every line. At 40+, real progress with no pain is a winning result.')}</section>
<aside class="pullquote"><p class="serif">Own your movement, protect the body, and the speed takes care of itself — for many more seasons.</p><span class="pq-by">Coach David Ciboch</span></aside>`;
const sProgreg = progreg();
const sRecovery = recovery();
const sMindset = mindset();
const sAbout = about(aboutB64);
const sNext = next();
const sGlossary = glossary(); // LAST — `used` is now fully populated

const footer = `
    <footer class="doc-footer">
      <div class="df-brand display">ELITE HOCKEY DRILLS</div>
      <div class="df-line">8-WEEK PROGRAM · AGES 40+ · @ELITE_HOCKEY_DRILLS</div>
      <div class="df-site">elitehockeydrills.com</div>
    </footer>`;

const body = [
  '<div class="scroll-progress" aria-hidden="true"></div>',
  topbar(),
  '<main class="doc">',
  sCover, sWelcome, sMethod, sRoadmap, sHowto, sKit, sRamp, sCooldown, sTests,
  sBlock1, sWeeks1to4, sScoreMid, sBlock2, sWeeks5to8, sScoreFinal,
  sGlossary, sProgreg, sRecovery, sMindset, sAbout, sNext,
  footer,
  '</main>',
].join('\n');

const out = head + '\n<body>\n' + body + '\n' + closingScript + '\n</body>\n</html>\n';
fs.writeFileSync('program-40plus-office.html', out);

console.log('WROTE program-40plus-office.html  (' + out.length + ' bytes)');
console.log('Unique exercises used:', used.size);

