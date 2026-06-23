/* Build program-12-14-office.html — clones program.html's shell (head/fonts/CSS/images/JS
   verbatim) and repopulates the body for an 8-week off-ice program for AGES 12–14.
   Every exercise is resolved against the "Website Program" tab (_pool.json); exLink() THROWS
   on any name not on the tab, mechanically enforcing "no exercise outside the allowed pool". */
import fs from 'fs';

const SRC = fs.readFileSync('program.html', 'utf8');
const pool = JSON.parse(fs.readFileSync('_pool.json', 'utf8'));
const r2 = JSON.parse(fs.readFileSync('_r2.json', 'utf8'));

const R2BASE = 'https://pub-40102464ff0f4d61a636f1749e9d3111.r2.dev/';
const SITE = 'https://elitehockeydrills.com/exercises/';
const byName = {};
pool.forEach(p => { byName[p.name] = p; });

const used = new Set();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = n => String(n).padStart(2, '0');

function exLink(name) {
  const p = byName[name];
  if (!p) throw new Error('OUT-OF-POOL EXERCISE: "' + name + '" is not on the Website Program tab.');
  used.add(name);
  const vid = r2[p.file] === 200 ? ` data-video="${R2BASE}${p.file}.mp4"` : '';
  return `<a class="ex"${vid} href="${SITE}${p.slug}" target="_blank" rel="noopener">${esc(name)}<span class="lk" aria-hidden="true">↗</span></a>`;
}
function cueFor(name) {
  const how = (byName[name].how || '').replace(/\s+/g, ' ').trim();
  const first = (how.split(/(?<=[.])\s/)[0] || how).trim();
  if (first.length <= 150) return first;
  // Too long: end at the last natural clause boundary before the limit — never a mid-word ellipsis.
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
function session(label, d, dow, fMain, fSub, skill, main, compete) {
  return `
    <article class="session">
      <div class="session-week">${label}</div>
      <div class="session-head">
        <div class="sh-day"><span class="display">DAY ${d}</span><span class="sh-dow">${dow}</span></div>
        <div class="sh-focus"><span class="sh-focus-main">${fMain}</span><span class="sh-focus-sub">${fSub}</span></div>
      </div>
      ${refGroup(1, 'RAMP Warm-Up', '8–10 min', 'Raise · Activate · Mobilize · Prime — the standard warm-up, done first every session.', '#ramp')}
      ${workGroup(2, 'Skill &amp; Speed', '10–15 min', skill)}
      ${workGroup(3, 'Main Work', '15–20 min', main)}
      ${workGroup(4, 'Compete &amp; Finish', '6–10 min', compete)}
      ${refGroup(5, 'Cool-Down', '3–5 min', 'Down-regulate — slow the breath, then gentle mobility to start recovery.', '#cooldown')}
    </article>`;
}

/* ====================================================================
   THE 8-WEEK PLAN — every exercise is a Website Program tab name.
   ==================================================================== */
const X = 'X · move fast';
const WEEKS = [
/* ---------------- BLOCK 1 — FOUNDATION & SPEED ---------------- */
{ n:1, kicker:'BLOCK 1', tagClass:'build', tagText:'BUILD', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 1 · BUILD',
  desc:'RE-PATTERN — own your landings and your balance first. Every rep is a chance to move clean.',
  days:[
   { d:1, dow:'Mon', fMain:'Lower-Body Foundation', fSub:'Landing · Deceleration · Posterior',
     skill:[
       {ex:'Wall Drive Hold', sr:'3×10s/side', cue:'tall · knee up', rest:'REST 30s', note:'Tall posture, one knee up, push the wall away. Find the sprint position and hold it still.'},
       {ex:'A-Skip in Place', sr:'3×15s', cue:'rhythm · springy', rest:'REST 30s', note:'Knee up, toe up, light and bouncy. A steady rhythm beats a fast one.'} ],
     main:[
       {ex:'Drop Squat', sr:'4×3', cue:'X · catch & stick', rest:'REST 45s', note:'Drop into a strong, wide athletic stance and freeze. Beat the floor down, absorb, hold.'},
       {ex:'Ankle Hop Stick', sr:'3×5', cue:'X · stiff ankle', rest:'REST 45s', note:'Small, quiet hops. Stick the last one dead-still. Knees barely bend.'},
       {ex:'Band Glute Bridge', sr:'2×12', cue:'2011 · squeeze', rest:'REST 45s', note:'Drive through the heels, squeeze the glutes hard at the top. Ribs down.'},
       {ex:'Banded RDL', sr:'2×8', cue:'3011 · hinge', rest:'REST 45s', note:'Hips back, soft knees, flat back. Feel the hamstrings load, then stand tall.'} ],
     compete:[
       {ex:'Mirror Game / Free Play', sr:'3×20s', cue:'react · play', rest:'REST 40s', note:'Stay in front of your partner, react and move. Move well and have fun.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Core', fSub:'Linear mechanics · Bracing',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'3×10s', cue:'quick · tall', rest:'REST 30s', note:'Fast, light feet in a small space. Stay tall, eyes up.'},
       {ex:'Reactive 5m Sprint', sr:'4×5m', cue:'go on cue', rest:'REST 60s', note:'Explode on the signal. First three steps low and hard.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'3×6/side', cue:'3010 · light', rest:'REST 60s', note:'Light weight at the chest. Push the hips back over the bending leg, other leg straight.'},
       {ex:'SL Balance — Eyes Closed', sr:'3×20s/side', cue:'balance', rest:'REST 30s', note:'Soft knee, quiet foot. Close the eyes and hold steady. Grip the floor with the toes.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back. Protect the groin.'},
       {ex:'Dead Bug with DB', sr:'3×6/side', cue:'slow · brace', rest:'REST 45s', note:'Low back flat to the floor. Move opposite arm and leg slowly. Light weight or none.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'anti-rotation', rest:'REST 45s', note:'Resist the band trying to twist you. March tall, trunk locked.'} ],
     compete:[
       {ex:'Tempo BW Circuit', sr:'2 rounds', cue:'steady', rest:'REST 60s', note:'Smooth, controlled pace through the circuit. Build a base engine.'} ] },
   { d:3, dow:'Fri', fMain:'Lateral Power & Upper', fSub:'Lateral push · Push / Pull',
     skill:[
       {ex:'Lateral Squat Shift', sr:'3×6/side', cue:'controlled', rest:'REST 30s', note:'Shift side to side, sink into each hip, stay low and balanced.'},
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · stick', rest:'REST 45s', note:'Jump sideways onto one leg, land soft, freeze. Own the landing before you add power.'} ],
     main:[
       {ex:'Banded Squat', sr:'3×8', cue:'3011 · medium', rest:'REST 60s', note:'Sit between the hips, knees track over the toes, drive up tall.'},
       {ex:'Plank to Push-Up', sr:'3×6', cue:'control', rest:'REST 45s', note:'Plank to tall and back, hips level, no sag. Drop to the knees to keep it clean.'},
       {ex:'Band Row', sr:'3×10', cue:'2011 · squeeze', rest:'REST 45s', note:'Pull the elbows back, squeeze the shoulder blades, tall chest.'},
       {ex:'Side Plank with Reach', sr:'3×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach the top arm under and back. Steady, no sinking.'} ],
     compete:[
       {ex:'Free Play / 1v1 Game', sr:'3×20s', cue:'compete', rest:'REST 45s', note:'Compete, change direction, stay light on the feet.'} ] } ] },

{ n:2, kicker:'BLOCK 1', tagClass:'build', tagText:'BUILD', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 2 · BUILD',
  desc:'REINFORCE — same patterns, a touch more. Add single-leg balance and the hinge.',
  days:[
   { d:1, dow:'Mon', fMain:'Lower-Body Foundation', fSub:'Landing · Single-leg · Posterior',
     skill:[
       {ex:'A-Skip Moving', sr:'3×10m', cue:'rhythm', rest:'REST 40s', note:'Move down the line — knee up, toe up, paw the ground under the hip.'},
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Quiet, springy hops. Stick the finish. Stay tall.'} ],
     main:[
       {ex:'Skater Hop — Stick It', sr:'3×4/side', cue:'X · stick 2s', rest:'REST 45s', note:'Bigger push than Week 1. Land on one leg and hold for a two-count.'},
       {ex:'Low Box Hop-Up — Stick', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Hop up onto a low box, land soft and silent, stand tall.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×8/side', cue:'squeeze', rest:'REST 45s', note:'One foot down, drive the hip up level, squeeze and pause. Hips stay even.'},
       {ex:'Banded Hamstring Slides', sr:'2×8', cue:'control', rest:'REST 45s', note:'Slide the heels out and pull them back, hips up the whole time.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'3×5m', cue:'react', rest:'REST 50s', note:'Shadow your partner — break when they break, match their first step.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Core', fSub:'Acceleration · Anti-rotation',
     skill:[
       {ex:'Crossover Step', sr:'3×6/side', cue:'footwork', rest:'REST 40s', note:'Cross the trail leg over, open the hips, push hard off the outside leg.'},
       {ex:'Reactive Lateral Start', sr:'4×5m', cue:'react', rest:'REST 60s', note:'From an athletic stance, explode sideways on the cue. Low and sharp.'} ],
     main:[
       {ex:'DB Bulgarian Split Squat', sr:'3×6/side', cue:'3010 · light', rest:'REST 60s', note:'Rear foot on the box, drop straight down, vertical front shin. Light DBs only.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back.'},
       {ex:'Hollow Rock', sr:'3×8', cue:'brace', rest:'REST 40s', note:'Low back glued to the floor, rock as one stiff unit. Small and tight.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate · brace', rest:'REST 40s', note:'Pull the band across the body, brace the trunk, control the return.'} ],
     compete:[
       {ex:'Sprint Intervals 15s', sr:'4×15s', cue:'hard', rest:'REST 60s', note:'Near-max effort for the burst, full rest, then go again. Quality stays high.'} ] },
   { d:3, dow:'Fri', fMain:'Lateral Power & Upper', fSub:'Lateral · Push / Pull / Rotate',
     skill:[
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · stick', rest:'REST 45s', note:'Push off the outside leg, cover ground sideways, land and stick on one leg.'},
       {ex:'Fast Feet / Ladder Equiv', sr:'3×10s', cue:'quick', rest:'REST 30s', note:'Quick light feet, tall posture. Speed of the feet, not the head.'} ],
     main:[
       {ex:'Banded Front Squat', sr:'3×8', cue:'3011 · medium', rest:'REST 60s', note:'Band in the front-rack, elbows up and proud, sit tall and drive.'},
       {ex:'Push-Up to Reach', sr:'3×6/side', cue:'control', rest:'REST 45s', note:'Push-up, then reach one hand forward without letting the hips twist.'},
       {ex:'Band Pull-Apart Speed', sr:'3×15', cue:'fast · squeeze', rest:'REST 30s', note:'Pull the band apart quickly, squeeze the upper back, control it back.'},
       {ex:'Rotational Med Ball Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Load the back hip, whip through, throw hard into the wall.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×20s', cue:'compete', rest:'REST 50s', note:'Win the body position, stay balanced, keep your feet moving.'} ] } ] },

{ n:3, kicker:'BLOCK 1', tagClass:'peak', tagText:'PEAK', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 3 · PEAK',
  desc:'SPEED & BOUNDS — the busiest week of Block 1. Sharpen the mechanics, add elastic bounds.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Power', fSub:'Acceleration · Bounds · Posterior',
     skill:[
       {ex:'A-Skip + March Combo', sr:'3×15m', cue:'rhythm', rest:'REST 40s', note:'March, then skip — keep the same tall posture and ground contact in both.'},
       {ex:'Resisted → Free Sprint', sr:'4×10m', cue:'drive', rest:'REST 75s', note:'A partner or band holds you, then releases — sprint out low and hard.'} ],
     main:[
       {ex:'Broad Jump → Sprint 10m', sr:'4×1', cue:'X · max intent', rest:'REST 75s', note:'Jump out far, stick the landing, then sprint away low. Full reset each rep.'},
       {ex:'Squat to Broad Jump', sr:'3×3', cue:'X · stick', rest:'REST 60s', note:'Sit, then jump forward and land soft and balanced. Quality over distance.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · light', rest:'REST 60s', note:'Hinge at the hips, light DBs slide down the thighs, flat back the whole time.'},
       {ex:'SL Box Step-Down', sr:'3×6/side', cue:'3010 · control', rest:'REST 45s', note:'Lower slowly off the box, tap and stand. Knee tracks straight over the foot.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'5×15m', cue:'hard', rest:'REST 45s', note:'Repeat short sprints on short rest. Hold your speed across all five.'} ] },
   { d:2, dow:'Wed', fMain:'Lateral Speed & Core', fSub:'Change of direction · Anti-rotation',
     skill:[
       {ex:'Crossover Step to Sprint', sr:'4×10m', cue:'open hips', rest:'REST 60s', note:'Crossover to open the hips, then accelerate. Smooth into fast.'},
       {ex:'Reactive 4-Cone', sr:'4×4', cue:'react', rest:'REST 60s', note:'Each rep = one sprint to a randomly-called cone. Sharp cuts, stay low; full recovery between sets.'} ],
     main:[
       {ex:'Multi-Direction Bound', sr:'3×4', cue:'X · stick', rest:'REST 60s', note:'Bound forward, side, and diagonal, sticking each landing on one leg.'},
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'3010 · medium', rest:'REST 45s', note:'Step wide, sit into the hip, drive back to the middle. Chest tall.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back. Protect the groin.'},
       {ex:'Plank Shoulder Tap', sr:'3×10', cue:'brace', rest:'REST 30s', note:'Tap the opposite shoulder without letting the hips rock. Wider feet are easier.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'anti-rotation', rest:'REST 40s', note:'March tall against the band, trunk locked, no twist.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'4×5m', cue:'react', rest:'REST 50s', note:'React to your partner. Win the first two steps.'} ] },
   { d:3, dow:'Fri', fMain:'Lateral Power & Upper', fSub:'Lateral · Push / Pull / Rotate',
     skill:[
       {ex:'Skater Hop Complex', sr:'3×4/side', cue:'X · bound + stick', rest:'REST 60s', note:'A few skater bounds in a row, then stick the final one. Cover ground.'},
       {ex:'A-Skip + B-Skip', sr:'3×15m', cue:'rhythm', rest:'REST 40s', note:'A: knee up, toe up. B: reach and paw it back. Tall, active arms.'} ],
     main:[
       {ex:'DB Floor Press', sr:'3×8', cue:'3010 · light', rest:'REST 60s', note:'Press light DBs, elbows about 45°, pause an inch off the floor.'},
       {ex:'SL RDL (Banded)', sr:'3×6/side', cue:'3011 · balance', rest:'REST 45s', note:'Hinge on one leg, band under the foot, flat back. Touch a toe down for balance if needed.'},
       {ex:'Banded Y-T-W', sr:'3×8 each', cue:'control', rest:'REST 30s', note:'Make Y, T, and W shapes against the band, thumbs up, squeeze the upper back.'},
       {ex:'Band Rotational Scoop Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Scoop low to high, rotate through the hips, finish tall.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Play a small game with full effort and clean movement.'} ] } ] },

{ n:4, kicker:'BLOCK 1', tagClass:'deload', tagText:'DELOAD', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 4 · DELOAD',
  desc:'DELOAD — pull the volume back and move clean. This is where the work catches up to you. Re-run your checkpoints this week.',
  days:[
   { d:1, dow:'Mon', fMain:'Movement Quality', fSub:'Mobility · Light power',
     skill:[
       {ex:'A-Skip in Place', sr:'2×15s', cue:'easy', rest:'REST 40s', note:'Easy rhythm, tall posture. Just grease the pattern.'},
       {ex:'Drop Squat', sr:'3×3', cue:'X · stick', rest:'REST 45s', note:'Fall into a strong stance and freeze. Sharp but not many.'} ],
     main:[
       {ex:'Deep Squat Hold', sr:'3×20s', cue:'breathe', rest:'REST 40s', note:'Sit in the bottom of a squat, heels down, tall chest. Relax and breathe.'},
       {ex:'Band Glute Bridge', sr:'2×12', cue:'squeeze', rest:'REST 40s', note:'Drive the heels, squeeze the glutes, pause at the top.'},
       {ex:'SL Balance — Eyes Closed', sr:'2×20s/side', cue:'balance', rest:'REST 30s', note:'Quiet foot, soft knee, eyes closed. Hold steady.'} ],
     compete:[
       {ex:'Mirror Game / Free Play', sr:'3×20s', cue:'light play', rest:'REST 45s', note:'Easy, playful movement. Stay loose.'} ] },
   { d:2, dow:'Wed', fMain:'Easy Speed & Core', fSub:'Coordination · Brace',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'2×10s', cue:'quick', rest:'REST 40s', note:'Light, quick feet. No straining.'},
       {ex:'Reactive 5m Sprint', sr:'3×5m', cue:'react', rest:'REST 60s', note:'Sharp first step on the cue, then relax.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'2×6/side', cue:'light', rest:'REST 50s', note:'Light and clean. Hips back over the bending leg.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — pull across, squeeze the inner thigh, control it back.'},
       {ex:'Dead Bug with DB', sr:'2×6/side', cue:'slow', rest:'REST 40s', note:'Low back flat, slow opposite arm and leg.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady.'} ],
     compete:[
       {ex:'Tempo BW Circuit', sr:'2 rounds', cue:'easy', rest:'REST 60s', note:'Smooth and easy. This is recovery, not a grind.'} ] },
   { d:3, dow:'Fri', fMain:'Light Lateral & Upper', fSub:'Lateral · Push / Pull',
     skill:[
       {ex:'Lateral Squat Shift', sr:'2×6/side', cue:'control', rest:'REST 30s', note:'Slow side-to-side, sink into the hip.'},
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 45s', note:'Soft, silent one-leg landings. Freeze each one.'} ],
     main:[
       {ex:'Plank to Push-Up', sr:'2×6', cue:'control', rest:'REST 45s', note:'Hips level, smooth up and down. Knees down if needed.'},
       {ex:'Band Row', sr:'2×10', cue:'squeeze', rest:'REST 40s', note:'Elbows back, squeeze, tall chest.'},
       {ex:'Banded Chop / Lift', sr:'2×8/side', cue:'control', rest:'REST 30s', note:'Controlled diagonal pull, brace the trunk.'} ],
     compete:[
       {ex:'Free Play / 1v1 Game', sr:'3×20s', cue:'light', rest:'REST 45s', note:'Playful, light competition. Move well.'} ] } ] },

/* ---------------- BLOCK 2 — POWER & COMPETE ---------------- */
{ n:5, kicker:'BLOCK 2', tagClass:'build', tagText:'BUILD', label:'BLOCK 2 · POWER & COMPETE · WEEK 5 · BUILD',
  desc:'EXPRESS IT — progress the jump amplitude and add light loaded power and change-of-direction.',
  days:[
   { d:1, dow:'Mon', fMain:'Lower-Body Power', fSub:'Vertical · Horizontal · Posterior',
     skill:[
       {ex:'A-Skip Resisted', sr:'3×10m', cue:'drive', rest:'REST 50s', note:'Light band at the waist, drive the knees, stay tall. Free legs after.'},
       {ex:'Single-Leg Pogo Hops', sr:'3×6/side', cue:'stiff · low reps', rest:'REST 45s', note:'Tall, stiff ankle, quick quiet hops on one leg. Keep the reps low.'} ],
     main:[
       {ex:'Banded Squat Jump', sr:'4×3', cue:'X · max intent', rest:'REST 75s', note:'Dip and jump hard against the band, land soft. Full reset between sets.'},
       {ex:'Broad Jump → Sprint 10m', sr:'4×1', cue:'X · max', rest:'REST 75s', note:'Far jump, stick, then sprint away. Maximal intent, full rest.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×6/side', cue:'3010 · light', rest:'REST 60s', note:'Rear foot up, drop straight down, vertical shin. Light load, perfect form.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×8/side', cue:'squeeze', rest:'REST 40s', note:'Level hips, drive up, squeeze. One leg at a time.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×15m', cue:'hard', rest:'REST 40s', note:'Six sharp sprints on short rest. Keep the times honest.'} ] },
   { d:2, dow:'Wed', fMain:'Speed & Rotational Core', fSub:'Max-velocity · Rotate',
     skill:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'top speed', rest:'REST 75s', note:'A 20m run-in, then fly through the 10m zone. Relax the face, roll fast.'},
       {ex:'Reactive Mirror Sprint', sr:'4×5m', cue:'react', rest:'REST 60s', note:'Read your partner and match the break. Win the first step.'} ],
     main:[
       {ex:'Box Step-Up (DBs)', sr:'3×6/side', cue:'drive', rest:'REST 60s', note:'Drive through the top foot to stand tall. Light DBs, no pushing off the bottom foot.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh across the body, control it back.'},
       {ex:'Banded Rotational Throw (Wall)', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Rotate through the hips, throw hard into the wall, control the return.'},
       {ex:'Copenhagen Plank — Long', sr:'3×15s/side', cue:'short-lever', rest:'REST 40s', note:'Use the SHORT-lever version — bottom knee down. Hold steady; build time slowly.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 50s', note:'Win position, stay balanced, keep moving the feet.'} ] },
   { d:3, dow:'Fri', fMain:'Lateral Power & Upper', fSub:'Lateral · Push / Pull / Rotate',
     skill:[
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · bound', rest:'REST 60s', note:'Big sideways push, cover ground, land balanced on one leg.'},
       {ex:'Crossover Step Bound', sr:'3×4/side', cue:'X · stick', rest:'REST 50s', note:'Crossover and bound for distance, then land balanced.'} ],
     main:[
       {ex:'Half-Kneeling DB Press', sr:'3×8/side', cue:'2011 · light', rest:'REST 50s', note:'Tall half-kneel, press straight up, ribs down. Light DB, no leaning back.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · light', rest:'REST 60s', note:'Hinge, light DBs down the thighs, flat back, stand tall.'},
       {ex:'Renegade Row', sr:'3×6/side', cue:'brace', rest:'REST 45s', note:'Wide plank, row one DB without rocking the hips. Light load.'},
       {ex:'Rotational Med Ball Side Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Side-on to the wall, rotate and throw hard, reset.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Small-game competition, full intent, clean feet.'} ] } ] },

{ n:6, kicker:'BLOCK 2', tagClass:'peak', tagText:'PEAK', label:'BLOCK 2 · POWER & COMPETE · WEEK 6 · PEAK',
  desc:'PEAK POWER — top amplitude and the only week we introduce capped, low-box reactive work. Growing fast right now? Skip the depth work and keep the rest.',
  days:[
   { d:1, dow:'Mon', fMain:'Reactive Power', fSub:'Vertical · Posterior',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'X · stiff', rest:'REST 40s', note:'Prime the ankles — quick, quiet, springy. Stick the finish.'},
       {ex:'Depth Drop (Low Box)', sr:'3×4', cue:'X · land & stick', rest:'REST 75s', note:'Step off a LOW box, land soft and silent, freeze. Quality over height. Skip if you are growing fast.'} ],
     main:[
       {ex:'Contrast Jump', sr:'4×(3+3)', cue:'X · heavy then light', rest:'REST 90s', note:'A few banded jumps, short rest, then a few free jumps with max intent.'},
       {ex:'Squat to Tuck Jump', sr:'3×4', cue:'X · soft land', rest:'REST 60s', note:'Jump, quick knee tuck, land soft and tall. Moderate volume, perfect landings.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · light', rest:'REST 50s', note:'One-leg hinge with a light DB, flat back, slow and balanced.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'4×30s', cue:'shift', rest:'REST 60s', note:'Work a shift-length burst, short rest, repeat. Train like a real shift.'} ] },
   { d:2, dow:'Wed', fMain:'Reactive Speed & Core', fSub:'Change of direction · Anti-rotation',
     skill:[
       {ex:'Reactive 4-Cone', sr:'5×5', cue:'react', rest:'REST 60s', note:'Each rep = one sprint to a randomly-called cone. Sharp, low cuts; full recovery between sets.'},
       {ex:'Hurdle Hops — Continuous', sr:'3×5', cue:'X · low · reactive', rest:'REST 75s', note:'LOW hurdles, short quick contacts, tall body. Keep the sets short.'} ],
     main:[
       {ex:'Continuous Lateral Bound', sr:'3×4/side', cue:'X · rhythm', rest:'REST 60s', note:'Bound side to side in rhythm, soft outside-leg landings. Short sets only.'},
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'medium', rest:'REST 45s', note:'Wide step, sit into the hip, drive back. Tall chest.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back. Protect the groin.'},
       {ex:'Hanging Straight-Leg Raise', sr:'3×6', cue:'control', rest:'REST 45s', note:'Hang tall, lift straight legs without swinging. Lower slow.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'March tall against the band, no twist.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'4×5m', cue:'react', rest:'REST 50s', note:'React and break with your partner. First step wins.'} ] },
   { d:3, dow:'Fri', fMain:'Lateral Power & Upper', fSub:'Lateral · Push / Pull / Rotate',
     skill:[
       {ex:'Lateral Depth Drop to Bound', sr:'3×3/side', cue:'X · control', rest:'REST 75s', note:'Step off a low box, land and rebound sideways. Optional — skip it in a growth spurt.'},
       {ex:'Crossover Step to Sprint', sr:'3×10m', cue:'open', rest:'REST 60s', note:'Open the hips with a crossover, then accelerate.'} ],
     main:[
       {ex:'Explosive Push-Up', sr:'3×4', cue:'X · fast', rest:'REST 60s', note:'Push up fast and hard so the hands feel light. Drop to the knees to keep it explosive.'},
       {ex:'DB Push Press', sr:'3×6', cue:'X · light', rest:'REST 60s', note:'Quick dip, drive the legs, press light DBs overhead. Upright torso.'},
       {ex:'Band Face Pull', sr:'3×12', cue:'squeeze', rest:'REST 30s', note:'Pull to the face, elbows high, squeeze the rear shoulders.'},
       {ex:'Banded Rotational Press', sr:'3×6/side', cue:'X · rotate', rest:'REST 45s', note:'Rotate through the hips and press out, brace the trunk.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 50s', note:'Compete hard, stay balanced and light.'} ] } ] },

{ n:7, kicker:'BLOCK 2', tagClass:'peak', tagText:'INTEGRATE', label:'BLOCK 2 · POWER & COMPETE · WEEK 7 · PEAK',
  desc:'PUT IT TOGETHER — speed, power, and strength in one session, finished with competition.',
  days:[
   { d:1, dow:'Mon', fMain:'Power Integration', fSub:'Multi-direction · Posterior',
     skill:[
       {ex:'Single-Leg Pogo Hops', sr:'3×6/side', cue:'stiff', rest:'REST 45s', note:'Tall and stiff, quick quiet hops. Low reps per side.'},
       {ex:'Skater Hop Complex', sr:'3×4/side', cue:'X · bound + stick', rest:'REST 60s', note:'A few bounds, then stick the last. Cover ground, land balanced.'} ],
     main:[
       {ex:'Contrast Jump', sr:'4×(3+3)', cue:'X · max', rest:'REST 90s', note:'Banded jumps, rest, then free jumps with max intent. Feel the spring.'},
       {ex:'Multi-Direction Bound', sr:'3×4', cue:'X · stick', rest:'REST 60s', note:'Bound forward, side, and diagonal — stick each one on one leg.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×8/side', cue:'light', rest:'REST 60s', note:'A touch more volume. Vertical shin, controlled, light DBs.'},
       {ex:'Banded RDL', sr:'3×10', cue:'3011 · medium', rest:'REST 45s', note:'Hinge, flat back, drive the hips through to stand tall.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×20m', cue:'hard', rest:'REST 40s', note:'Longer repeats, short rest. Hold the speed across all six.'} ] },
   { d:2, dow:'Wed', fMain:'Max-Velocity & Core', fSub:'Top speed · Rotate',
     skill:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'top speed', rest:'REST 75s', note:'Run in, then fly. Tall, relaxed, fast turnover.'},
       {ex:'Reactive Mirror Sprint', sr:'4×5m', cue:'react', rest:'REST 60s', note:'Mirror the break. Sharp, reactive first step.'} ],
     main:[
       {ex:'DB Complex', sr:'3 rounds', cue:'light · flow', rest:'REST 90s', note:'Flow through the light-DB sequence without setting them down. Light load, few rounds, clean form.'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh, control the band back. Protect the groin.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate', rest:'REST 40s', note:'Diagonal pull, braced trunk, smooth and strong.'},
       {ex:'Copenhagen Plank — Long', sr:'3×20s/side', cue:'short-lever', rest:'REST 40s', note:'Short-lever (bottom knee down). A little longer than Week 5. Steady hips.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift', rest:'REST 50s', note:'Shift-length bursts on shrinking rest. Repeat your power.'} ] },
   { d:3, dow:'Fri', fMain:'Compete & Express', fSub:'Lateral · Whole-body',
     skill:[
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · bound', rest:'REST 60s', note:'Powerful sideways push, cover ground, land balanced.'},
       {ex:'Reactive Lateral Start', sr:'4×5m', cue:'react', rest:'REST 60s', note:'Explode sideways on the cue, low and sharp.'} ],
     main:[
       {ex:'Squat to Broad Jump', sr:'3×3', cue:'X · max', rest:'REST 60s', note:'Sit and jump out far, land soft and balanced.'},
       {ex:'DB Push-Up to Row', sr:'3×6/side', cue:'brace', rest:'REST 50s', note:'Push-up, then row one DB, hips square. Light DBs.'},
       {ex:'Rotational Med Ball Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Load the back hip, whip through, throw hard.'},
       {ex:'Farmer Carry (Banded)', sr:'2×20m', cue:'tall · light', rest:'REST 45s', note:'Walk tall and braced with a light load. Do not lean.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'4×25s', cue:'compete', rest:'REST 45s', note:'Full-effort small game. Express everything you have built.'} ] } ] },

{ n:8, kicker:'BLOCK 2', tagClass:'taper', tagText:'TAPER', label:'BLOCK 2 · POWER & COMPETE · WEEK 8 · TAPER',
  desc:'TAPER — volume drops, quality stays sharp. Re-run your checkpoints and see how far you have come.',
  days:[
   { d:1, dow:'Mon', fMain:'Sharp & Springy', fSub:'Light power',
     skill:[
       {ex:'A-Skip Moving', sr:'2×10m', cue:'rhythm', rest:'REST 40s', note:'Crisp, tall, easy. Just sharpen the pattern.'},
       {ex:'Ankle Hop Stick', sr:'2×5', cue:'X · stiff', rest:'REST 45s', note:'Springy and quiet. Stick the finish.'} ],
     main:[
       {ex:'Broad Jump → Sprint 10m', sr:'3×1', cue:'X · max', rest:'REST 75s', note:'A few high-quality reps. Far jump, stick, sprint away.'},
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'Soft, silent one-leg landings. Freeze each.'},
       {ex:'SL Glute Bridge (Band)', sr:'2×8/side', cue:'squeeze', rest:'REST 40s', note:'Level hips, squeeze, pause. Keep it easy.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'3×5m', cue:'react', rest:'REST 50s', note:'Sharp, playful reactions. Win the first step.'} ] },
   { d:2, dow:'Wed', fMain:'Quick Feet & Core', fSub:'Coordination · Brace',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'2×10s', cue:'quick', rest:'REST 40s', note:'Light, fast feet, tall posture.'},
       {ex:'Reactive 5m Sprint', sr:'3×5m', cue:'react', rest:'REST 60s', note:'Sharp first step on the cue.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'2×6/side', cue:'light', rest:'REST 50s', note:'Light and clean, hips back over the bending leg.'},
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — pull across, squeeze the inner thigh, control it back.'},
       {ex:'Pallof March', sr:'2×8/side', cue:'brace', rest:'REST 40s', note:'Tall march, trunk locked, no twist.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady.'} ],
     compete:[
       {ex:'Free Play / 1v1 Game', sr:'3×20s', cue:'play', rest:'REST 45s', note:'Light, fun competition.'} ] },
   { d:3, dow:'Fri', fMain:'Compete & Checkpoint', fSub:'Show your work',
     skill:[
       {ex:'Lateral Skater Bound', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'A couple of clean, balanced bounds per side.'},
       {ex:'Crossover Step to Sprint', sr:'2×10m', cue:'open', rest:'REST 60s', note:'Open the hips, accelerate, relax.'} ],
     main:[
       {ex:'Combine Circuit', sr:'1–2 rounds', cue:'move well', rest:'REST 60s', note:'Run the checkpoint circuit — jump, sprint, balance, hold. Show clean movement.'},
       {ex:'Deep Squat Hold', sr:'2×20s', cue:'breathe', rest:'REST 40s', note:'Sit deep, heels down, tall chest. Breathe.'},
       {ex:'Hollow Rock', sr:'2×8', cue:'brace', rest:'REST 40s', note:'Tight and small, low back down.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'3×25s', cue:'celebrate', rest:'REST 45s', note:'Play hard, move well, enjoy how much faster you feel.'} ] } ] },
];

/* ---------- RAMP warm-up (tab Warm-up/Mobility only) ---------- */
const RAMP = [
  ['R','Raise','~2 min','Lift the heart rate, temperature, and blood flow.', ['Jumping Jacks','Butt Kicks']],
  ['A','Activate','~2–3 min','Switch on the glutes, groin, and deep core that steady every stride.', ['Banded Monster Walk','Banded Lateral Walk','Banded Clamshell','Adductor Rocker']],
  ['M','Mobilize','~2–3 min','Open the hips, groin, ankles, and upper back through the ranges skating needs.', ['Spider Lunge with Rotation','90/90 Hip Switch','T-Spine Rotation','Ankle Dorsiflexion (Wall)']],
  ['P','Prime','~2 min','Wake up fast, coordinated movement with a few crisp, easy efforts.', ['A-Skip in Place','Lateral Squat Shift','Inchworm to Push-Up']],
];
/* ---------- Cool-down (tab Cool-down/Recovery only) ---------- */
const COOLDOWN = ['Slow Walk with Nose Breathing','Child\'s Pose with Breath','Supine Spinal Twist','Hip / Groin Flow'];

/* ---------- Movement-quality checkpoints (reframed "tests") ---------- */
const CHECKS = [
  { n:1, ex:'Skater Hop — Stick It', quality:'Landing control & deceleration', proto:'3 each side, best counts', gain:'cleaner stick', w:'72%',
    how:'Jump sideways onto one leg and freeze. Score the landing: silent, dead-still, no extra hop.' },
  { n:2, ex:'SL Balance — Eyes Closed', quality:'Balance & ankle control', proto:'Best hold per leg', gain:'+5–15 s', w:'66%',
    how:'Eyes closed, hands on hips. Time until you wobble badly or touch the other foot down.' },
  { n:3, ex:'Broad Jump → Sprint 10m', quality:'Horizontal power', proto:'3 attempts, best distance', gain:'+5–15 cm', w:'78%',
    how:'Two-foot jump for distance, stick the landing for a beat. Mark the back heel.' },
  { n:4, ex:'A-Skip in Place', quality:'Coordination & rhythm', proto:'30s, quality count', gain:'smoother', w:'62%',
    how:'Knee up, toe up, steady rhythm. Score the posture and rhythm, not the speed.' },
  { n:5, ex:'Deep Squat Hold', quality:'Mobility', proto:'Hold quality', gain:'deeper & taller', w:'68%',
    how:'Heels down, chest tall, sit as deep as you can stay clean. Score depth and posture.' },
  { n:6, ex:'Copenhagen Plank — Long', quality:'Groin durability', proto:'Short-lever, best hold / side', gain:'+10–20 s', w:'64%',
    how:'Short-lever (bottom knee down). Time the hold each side. The most hockey-relevant test there is.' },
];

/* ---------- Progression / Regression (age-appropriate) ---------- */
const PROGREG = [
  ['Drop Squat','Slow it down — just sink and hold the position.','Add a low box hop-up, sticking the landing.'],
  ['Skater Hop — Stick It','Smaller hop, or step to reset between reps.','Bound farther, then a Skater Hop Complex.'],
  ['Depth Drop (Low Box)','Lower the box, or skip it for ankle hops.','A slightly higher box (only when landings stay silent).'],
  ['Continuous Lateral Bound','Add a brief stick between every bound.','More reps or a target to clear — keep the contacts soft.'],
  ['Lateral Depth Drop to Bound','Step off and just STICK the landing — no rebound — until it is silent and balanced.','Add the lateral rebound, then a little more distance. Skip it entirely during a growth spurt.'],
  ['DB Bulgarian Split Squat','Lower the rear-foot height, or a flat split squat.','Add a pause at the bottom, or a slow lower. Keep the load light.'],
  ['SL RDL (Banded)','Lighter band, or touch the back toe for balance.','Heavier band, or a hold at the bottom.'],
  ['Banded Squat','Lighter band, or a bodyweight squat.','Heavier band, or a faster drive up.'],
  ['Banded Lateral Lunge','Lighter band, or a bodyweight lateral lunge.','Heavier band, or a slow lower into an explosive drive out.'],
  ['Copenhagen Plank — Long','Short-lever — bottom knee on the floor or box. Start here for this age.','Lengthen the hold, then progress the lever only when it is easy and pain-free.'],
  ['Plank to Push-Up','From the knees, or hands on a box.','Add a push-up, or a deficit for range.'],
  ['Band Row','Lighter band, or a shorter range.','Heavier band, or one arm at a time for anti-rotation.'],
  ['Rotational Med Ball Toss','Lighter ball, technical speed.','Heavier ball, or throw more explosively.'],
  ['Pallof March','Lighter band, or step farther from the anchor.','Heavier band, step closer, or a longer march.'],
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
          <span class="wk-group"><a class="wk-label" href="#block-1"><span class="wk-n">Block 1</span><span class="wk-nm">foundation &amp; speed</span></a><span class="wk-nums"><span class="wk-eyebrow">Weeks</span><span class="wk-chips"><a href="#week-1" data-wk="1">1</a><a href="#week-2" data-wk="2">2</a><a href="#week-3" data-wk="3">3</a><a href="#week-4" data-wk="4">4</a></span></span></span>
          <span class="wk-sep"></span>
          <span class="wk-group"><a class="wk-label" href="#block-2"><span class="wk-n">Block 2</span><span class="wk-nm">power &amp; compete</span></a><span class="wk-nums"><span class="wk-eyebrow">Weeks</span><span class="wk-chips"><a href="#week-5" data-wk="5">5</a><a href="#week-6" data-wk="6">6</a><a href="#week-7" data-wk="7">7</a><a href="#week-8" data-wk="8">8</a></span></span></span>
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
        <div class="cover-eyebrow">Off-Ice Speed, Power &amp; Movement for Hockey · AGES 12–14 · Growth-Smart Development</div>
        <h1 class="display cover-h1">DEVELOP<br><span class="amp serif">&amp;</span> DRIVE<span class="dot">.</span></h1>
        <p class="serif cover-tagline">Move well, get fast, compete hard — built for the growing years.</p>
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
      <header class="sec-head"><div class="eyebrow ice">Read This First · For Players &amp; Parents</div><h2 class="sec-title"><span class="st-lead">BUILT FOR</span><span class="st-accent serif">the growing years.</span></h2></header>
      <p class="lead">This is a development program, not a copy of what older players do. Eight weeks to make a 12–14 year old a faster, stronger, more coordinated athlete — with bands and bodyweight — while protecting the body through one of its biggest growth windows.</p>
      <div class="prose"><p>Between roughly 12 and 14, training age varies hugely and many players are hitting their fastest growth spurt (sport scientists call it Peak Height Velocity, or PHV). When a young athlete is growing quickly, the bones grow first and the muscles, tendons, and coordination race to catch up — which makes the knees, heels, and lower back more vulnerable for a while. So this program leads with movement quality, balance, and mobility, and it doses jumping and impact carefully. Power is built on a foundation of clean movement, not the other way around.</p><p>Every session shares the same simple shape and runs about 45–55 minutes. Three sessions a week, eight weeks, two four-week blocks. Block 1 builds the foundation and teaches speed. Block 2 turns that into power you can express in a game.</p><p>It is honest about what bands and bodyweight can do for a growing athlete — which, done with quality, is a lot. It will not and should not try to build a finished, adult athlete. It is built to make you move better, accelerate harder, change direction more sharply, and stay healthy through your growth years — so you arrive at higher-level hockey with a real engine under you.</p></div>
      <div class="callout warm">
        <div class="callout-h display">Honest expectations</div>
        <p>Eight weeks is enough to move and jump noticeably cleaner, balance better, accelerate harder, and build the habits that protect a growing body. It is not a transformation, and it should not be — chasing big numbers at this age is how young athletes get hurt. Train it as written, sleep a lot, eat well, and the gains show up on the ice and on your checkpoints.</p>
      </div>
      <div class="rules">
        <div class="rules-h display">TWO RULES · NON-NEGOTIABLE</div>
        <div class="rule"><span class="rule-n display">01</span><p>Groin and single-leg work appears every week — the groin and one-leg balance are where skating lives, and where young players most often get hurt. We train them on purpose.</p></div><div class="rule"><span class="rule-n display">02</span><p>During a growth spurt, lower the impact. If you have shot up recently, or your knees, heels, or back ache, cut the jumping volume in half, skip the depth work, and lean on the mobility and skill work. Listening to a growing body is strength, not weakness.</p></div>
      </div>
    </section>`;
}

function method() {
  const pillars = [
    ['Long-term athlete first','We build the athlete, then the sport. The balance, coordination, and movement skill you build now is the base everything else stacks on — and it pays off for years, not just this season.'],
    ['Move well before you move fast','Every block starts with landing, deceleration, and balance. Speed and power are built on top of clean movement — rush that order and you build on sand.'],
    ['Growth-smart training (PHV)','During fast-growth years the body is more injury-prone, especially the knees, heels, and lower back. When you are growing quickly we lower the impact and raise the mobility and skill work — and you learn to self-regulate.'],
    ['Speed is a skill','Sprinting, cutting, and bounding are taught and rehearsed like stickhandling — mechanics first, then intensity. Most young players have never been coached how to run; here you are.'],
    ['Power, dosed by quality','Jumps, bounds, and throws are about crisp, perfect reps with full rest — never grinding to fatigue. Quality of movement is the goal; the numbers follow.'],
    ['Built around hockey','Lateral push-off, single-leg strength, rotation, and groin care are the spine of the program, because that is exactly what skating is.'],
  ];
  return `
    <section class="sheet" id="method">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">01</span><span class="eyebrow ice">The Method</span></div><h2 class="sec-title"><span class="st-lead">WHY THIS</span><span class="st-accent serif">works.</span></h2></header>
      <p class="lead">This is not a random circuit. It is long-term athletic development for the 12–14 age band — sequenced to build a faster, more powerful, more durable hockey player through the growth years.</p>
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
      <text class="fv-shift" x="388" y="196" text-anchor="start">MORE ATHLETIC</text>
      <text class="fv-axis" transform="rotate(-90 54 166)" x="54" y="166" text-anchor="middle">STRENGTH</text>
      <text class="fv-axis" x="390" y="324" text-anchor="middle">SPEED →</text>
    </svg>
    <div class="fv-legend">
      <span class="fv-key"><i class="fvline now"></i><b>Now</b><em>where you start</em></span>
      <span class="fv-key"><i class="fvline after"></i><b>After 8 weeks</b><em>stronger &amp; faster, moving cleaner</em></span>
    </div>
    <figcaption>Athleticism is movement quality, strength, and speed together. Block 1 builds the movement and strength base, Block 2 extends the speed and power end — so the whole curve shifts up and to the right. That shift is a better athlete, built safely through the growth years.</figcaption>
  </figure>
    </section>`;
}

function roadmap() {
  return `
<aside class="pullquote"><p class="serif">Build the athlete first. Speed and power are skills you stack on top of clean, confident movement.</p><span class="pq-by">The Method</span></aside>

    <section class="sheet" id="roadmap">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">02</span><span class="eyebrow ice">The Roadmap</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">eight weeks.</span></h2></header>
      <p class="lead">Two blocks of four weeks. Volume climbs to a peak, then unloads — so you arrive at each checkpoint sharp, not buried.</p>
      <div class="road-blocks">
          <div class="road-block">
            <div class="rb-tag">BLOCK 1 · WEEKS 1–4</div>
            <h3 class="display rb-name">FOUNDATION &amp; SPEED</h3>
            <p class="serif rb-line">“Own your movement.”</p>
            <p class="rb-desc">Re-pattern landing, deceleration, balance, and core, then linear and lateral speed mechanics and elastic bounds. Volume builds W1→W3 (peak), then W4 deloads and you re-check.</p>
          </div>
          <div class="road-block">
            <div class="rb-tag">BLOCK 2 · WEEKS 5–8</div>
            <h3 class="display rb-name">POWER &amp; COMPETE</h3>
            <p class="serif rb-line">“Express it in a game.”</p>
            <p class="rb-desc">Progress the jump amplitude, add capped low-box reactive power and change-of-direction, then competitive application. Volume builds W5→W7 (peak), then W8 tapers into the final checkpoint.</p>
          </div>
      </div>
    </section>`;
}

function howto() {
  const arch = [
    ['1','WARM-UP (RAMP)','8–10 min','Raise, Activate, Mobilize, Prime. The standard warm-up on its own page — done before every single session.'],
    ['2','Skill &amp; Speed','10–15 min','Speed mechanics and agility, done fresh while you are sharp. This is the priority — quality over quantity.'],
    ['3','Main Work','15–20 min','The day&rsquo;s jumps, single-leg strength, and core. Crisp reps, controlled tempo, full rest. Never grind to failure.'],
    ['4','Compete &amp; Finish','6–10 min','A small competitive game or a short conditioning burst to finish — the fun, lower-skill end of the session.'],
    ['5','Cool-Down','3–5 min','Down-regulate. Slow nasal breathing and a short mobility flow to start recovery before you walk out.'],
  ];
  return `
    <section class="sheet" id="howto">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">03</span><span class="eyebrow ice">How To Use This</span></div><h2 class="sec-title"><span class="st-lead">EVERY</span><span class="st-accent serif">session.</span></h2></header>
      <p class="lead">All 24 sessions share the same five-part shape. Run them in order. Total time: about 45–55 minutes.</p>
      <div class="arch">
        ${arch.map(([n, name, mins, p]) => `<div class="arch-row"><span class="arch-n display">${n}</span><div class="arch-body"><div class="arch-h"><span class="arch-name">${name}</span><span class="arch-mins">${mins}</span></div><p>${p}</p></div></div>`).join('')}
      </div>
      <div class="legend">
        <div class="legend-h display">HOW EACH EXERCISE READS</div>
        <p class="legend-intro">Every exercise is written as a quick spec sheet. Read it the same way each time:</p>
        <div class="legend-row"><div class="legend-key">01  EXERCISE — NAME</div><div class="legend-val">The movement. The name is a live link — tap it for the full video demo, cues, and common mistakes on the site.</div></div><div class="legend-row"><div class="legend-key">SETS × REPS</div><div class="legend-val">How many work sets, and reps (or seconds / metres) per set. &ldquo;/side&rdquo; means per leg or per arm. A range means pick what you can do cleanly today.</div></div><div class="legend-row"><div class="legend-key">TEMPO / CUE</div><div class="legend-val">The middle tag is the quality cue — &ldquo;X&rdquo; means move fast and explosive; &ldquo;3010&rdquo; is a tempo in seconds (lower / pause / up / pause); &ldquo;stick&rdquo; means land and freeze; &ldquo;light / medium&rdquo; is band or dumbbell load. Load stays light at this age.</div></div><div class="legend-row"><div class="legend-key">REST</div><div class="legend-val">Recovery before the next set. Power and speed rest is long on purpose — you are training crisp movement, not chasing a burn.</div></div>
      </div>
    </section>`;
}

function kit() {
  const items = [
    ['01','Loop resistance band set','Light, medium, and heavy. The variable tension is your load — and it is plenty for a growing athlete. Most of the strength and power work runs on these.'],
    ['02','A low box or sturdy bench','Knee height or lower. For step-downs, box hop-ups, rear-foot-elevated split squats, and low-box landings. Lower is better while you are growing.'],
    ['03','~10 metres of open space','A driveway, hallway, garage, or yard. Enough to skip, accelerate, bound, and play a small reaction game.'],
    ['04','Light dumbbells (optional)','A light pair, used only where the program calls for them and only with full control. Bands cover almost everything — dumbbells are a small bonus, never the point.'],
  ];
  return `
    <section class="sheet" id="kit">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">04</span><span class="eyebrow ice">What You&rsquo;ll Need</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">kit.</span></h2></header>
      <p class="lead">Deliberately minimal, and deliberately light. At this age, bands and bodyweight done with quality are exactly right — this is a design choice, not a compromise. No barbells, no heavy loading, no gym.</p>
      <div class="kit-grid">
        ${items.map(([n, h, p]) => `<div class="kit-item"><span class="kit-n display">${n}</span><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
      <p class="kit-note serif">A skipping rope, a wall, and a partner to play reaction games with are useful but optional. Everything here can be done in a garage with a band and a box.</p>
    </section>`;
}

function ramp() {
  return `
    <section class="sheet" id="ramp">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">05</span><span class="eyebrow ice">Before Every Session</span></div><h2 class="sec-title"><span class="st-lead">THE RAMP</span><span class="st-accent serif">warm-up.</span></h2></header>
      <p class="lead">Raise. Activate. Mobilize. Prime. About 8–10 minutes, every session, no exceptions. It doubles as daily movement and mobility work — a big part of staying healthy through the growth years.</p>
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
          <div class="cd-kick">After every session · 3–5 min</div>
          <h2 class="display cd-title">THE COOL-DOWN</h2>
          <p class="lead">Shift out of go-mode and into recovery. Slow the breath first, then move gently through range.</p>
          <ul class="cd-list">${COOLDOWN.map(n => `<li>${exLink(n)}</li>`).join('')}</ul>
        </div>
        <div class="cd-col screen-col">
          <div class="cd-kick">A 60-second growth-smart check, for players &amp; parents</div>
          <h2 class="display cd-title">THE GROWTH CHECK</h2>
          <p class="lead">You are a developing athlete, and your body changes fast right now. This is a quick weekly self-check — not a clearance exam. A &ldquo;yes&rdquo; below means dial the impact down this week.</p>
          <ul class="screen-list"><li>Have you had a recent growth spurt — clothes or skates suddenly too small?</li><li>Do your knees, heels (Achilles), hips, or lower back ache during or after jumping?</li><li>Does any movement feel newly clumsy or &ldquo;disconnected&rdquo; as you grow?</li><li>Are you sore, sick, short on sleep, or run-down today?</li><li>Is there any sharp pain that gets worse under load?</li></ul>
          <p class="screen-note serif">Any &ldquo;yes&rdquo; is information, not a stop sign. Cut the jumping and impact volume in half, skip the depth work, lean on mobility and skill — and see a qualified professional for pain that sharpens under load or does not settle. Growing-pain aches near the knee (Osgood-Schlatter) and heel (Sever&rsquo;s) are common at this age and respond well to backing off the impact for a while.</p>
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
      <p class="lead">Six movement-quality checkpoints, no gym required, each tied to a hockey quality and each one improvable in eight weeks. These are quality checks, not maximal tests — at this age we score how clean you move, not how high the number is. Run the full set three times: Week 0 (baseline), Week 4 (mid-block), Week 8 (final).</p>
      <p class="proto-note serif">Check rested, warmed up with the RAMP, in the same shoes and surface each time. Score honestly — better movement is the win. If anything hurts, stop and note it; pain is never a checkpoint to push through.</p>
      <div class="test-grid">
        ${cards}
      </div>
      <div class="checkpoints">3 CHECKPOINTS · WEEK 0 → WEEK 4 → WEEK 8</div>

    <div class="scorecard">
      <div class="sc-head"><h3 class="display">WEEK 0 — BASELINE</h3><span class="sc-sub serif">Check before you train. This is the movement you build on.</span></div>
      <table class="sc-table"><thead><tr><th>Checkpoint</th><th>Hockey quality</th><th>Att 1</th><th>Att 2</th><th>Att 3</th><th class="hi">Best</th></tr></thead><tbody>${baselineRows}</tbody></table>
      <p class="sc-note">Note the best of your attempts, plus a word on quality. Re-check on the same surface, shoes, and method each time.</p>
    </div>
    </section>
<aside class="pullquote"><p class="serif">At this age the win is moving better, not lifting heavier. Clean, confident movement is the number that matters.</p><span class="pq-by">Check. Don&rsquo;t guess.</span></aside>`;
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
        ${w.days.map(d => session(w.label, d.d, d.dow, d.fMain, d.fSub, d.skill, d.main, d.compete)).join('')}
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
    ['Core, Carries & Rotational', ['Core & Anti-rotation', 'Loaded Carries', 'Rotational Power']],
    ['Conditioning & Compete', ['Conditioning / Jump Rope', 'Energy Systems / Intervals', 'Competitive Play', 'Full-body & Complexes']],
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
      <p class="lead">For each main movement: a sane regression if it is not clean yet, and a harder progression once it is. Earn the next step — never skip it, especially while you are growing.</p>
      <div class="pr-table">
        <div class="pr-row pr-headrow"><div class="pr-name">Movement</div><div class="pr-reg">Regression</div><div class="pr-prog">Progression</div></div>
        ${rows}
      </div>
    </section>`;
}

function recovery() {
  const cards = [
    ['Sleep','9–11 hours, consistently. Growing bodies build and repair during deep sleep — and that is when training actually turns into gains. At this age sleep is the single most powerful thing you can do for performance and health.'],
    ['Fuel','Eat enough, often, with protein and carbohydrate at meals. You are fuelling training and growth at the same time, so do not skip meals. Real food, plenty of it — this is not a time to diet.'],
    ['Hydration','Drink across the day, not just at training. Even mild dehydration drops energy, focus, and coordination — which matters more when you are learning new movements.'],
    ['Listen to a growing body','Growth-related aches at the knee or heel, lingering soreness, or sudden clumsiness all mean back off the impact for a bit. The deload and taper weeks are built in for exactly this — and an extra rest day is always allowed.'],
  ];
  return `
    <section class="sheet" id="recovery">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">09</span><span class="eyebrow ice">Recovery</span></div><h2 class="sec-title"><span class="st-lead">WHERE GAINS</span><span class="st-accent serif">land.</span></h2></header>
      <p class="lead">Training is the stimulus; sleep and food are where a young athlete actually grows and adapts. At 12–14, recovery is not optional support work — it is the main event.</p>
      <div class="rec-grid">
        ${cards.map(([h, p]) => `<div class="rec-card"><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
    </section>`;
}

function mindset() {
  const rows = [
    ['Move well first.','The goal of every rep is clean, controlled movement. A crisp, balanced rep beats a sloppy hard one every time. If your form breaks, the set is over.'],
    ['Quality gates quantity.','The set and rep targets are a ceiling, not a quota. Hit the quality or stop short — junk volume is how young athletes get slower and sore, not faster.'],
    ['Listen to your body.','Growing fast, or aching at the knees, heels, or back? Cut the impact, skip the depth work, lean on mobility and skill. That is the smart, strong choice — not a soft one.'],
    ['Respect the deload and taper.','Weeks 4 and 8 pull back on purpose. Do not add work because you feel good — feeling fresh is the point, and it is what your checkpoints will show.'],
    ['Compete and have fun.','Finish sessions with a game. Competing hard while moving well is the whole point — and it is what keeps you in the sport long enough to get great.'],
  ];
  return `
    <section class="sheet" id="mindset">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">10</span><span class="eyebrow ice">Mindset &amp; Rules</span></div><h2 class="sec-title"><span class="st-lead">HOW TO</span><span class="st-accent serif">train this.</span></h2></header>
      <p class="lead">You are building the athlete you will be at 16, 18, and beyond. Train accordingly.</p>
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
          <div class="about-bio"><p>David Ciboch is a strength and conditioning specialist with a Master&rsquo;s in Sport Science and more than ten years coaching athletes from youth to the international level.</p><p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put genuine, national-team-level off-ice training in the hands of players who do not have a pro setup — just a band, a box, and the will to get better.</p><p>This program is the off-ice work he would write for a developing 12–14 year old in his gym: development-first, hockey-specific, and built to make a young player faster and more powerful while keeping them healthy through the growth years.</p></div>
          <div class="about-creds"><div class="ac-h display">CREDENTIALS</div><ul><li>M.Ed. Sport Science</li><li>S&amp;C Coach — UAE National Ice Hockey Team</li><li>10+ years coaching, youth to international</li><li>PE &amp; Sport Science teacher</li><li>Founder, Elite Hockey Drills</li></ul></div>
        </div>
      </div>
    </section>`;
}

function next() {
  return `
    <section class="sheet" id="next">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">12</span><span class="eyebrow ice">What&rsquo;s Next</span></div><h2 class="sec-title"><span class="st-lead">KEEP</span><span class="st-accent serif">building.</span></h2></header>
      <p class="lead">You built a foundation in eight weeks. Here is how you keep building on it.</p>
      <div class="next-grid">
        <div class="next-card"><h3 class="display">In-season &amp; what comes next</h3><p>During the season you do not need this full volume — a couple of short sessions a week of the highest-quality work here (a few jumps, some skating-speed drills, groin and single-leg strength) keeps it sharp. As your training age grows and your growth settles, the Ages 15–18 program adds real strength and heavier power work — when your body is ready for it.</p></div>
        <div class="next-card"><h3 class="display">The app</h3><p>Everything here — every exercise demo, your checkpoints, auto-progressing sessions — is coming to the Elite Hockey Drills app, so the program lives in your pocket and tracks itself.</p></div>
      </div>
      <div class="cta-band">
        <p class="serif cta-text">Re-run your checkpoints, log your progress, and tag us. The ice is where this shows up.</p>
        <div class="cta-handle">@ELITE_HOCKEY_DRILLS · elitehockeydrills.com</div>
      </div>
    </section>`;
}

/* ====================================================================
   ASSEMBLE
   ==================================================================== */
const TITLE = 'DEVELOP &amp; DRIVE — 8-Week Off-Ice Hockey Program · Ages 12–14 · Elite Hockey Drills';
const METADESC = 'An 8-week off-ice speed, power &amp; movement program for hockey players ages 12–14. Growth-smart (PHV-aware), bands + bodyweight. Built by Coach David Ciboch.';

let head = SRC.slice(0, SRC.indexOf('</head>') + '</head>'.length);
head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
head = head.replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${METADESC}" />`);

const coverB64 = (SRC.match(/cover-photo"[^>]*url\('data:image\/jpeg;base64,([^']+)'/) || [])[1];
const aboutB64 = (SRC.match(/about-visual"><img src="data:image\/jpeg;base64,([^"]+)"/) || [])[1];
if (!coverB64 || !aboutB64) throw new Error('Failed to extract embedded images (cover/about).');

const sStart = SRC.lastIndexOf('<script>');
const sEnd = SRC.indexOf('</script>', sStart) + '</script>'.length;
const closingScript = SRC.slice(sStart, sEnd);

/* Build sections IN DOCUMENT ORDER, but glossary() must run last (after `used` is full).
   So compute all exLink-calling sections first, then glossary, then concatenate in order. */
const sCover = cover(coverB64);
const sWelcome = welcome();
const sMethod = method();
const sRoadmap = roadmap();
const sHowto = howto();
const sKit = kit();
const sRamp = ramp();
const sCooldown = cooldown();
const sTests = tests();
const sBlock1 = blockIntro('07', 1, 'BLOCK 1 · WEEKS 1–4', 'FOUNDATION &amp; SPEED', '“Own your movement.”', [
  'You arrive as a young, growing athlete. Block 1 builds the base everything else stacks on: how to land, decelerate, and balance on one leg, plus a braced, strong core. The plyometrics are landing-led — drop squats, ankle hops, skater-hop sticks — where you absorb and own every landing before you ever chase height or distance.',
  'Then speed gets taught as a skill: A-skips, crossovers, reactive starts, and elastic bounds, done fresh and crisp. The strength work is bodyweight and light bands with a single-leg and groin bias. Volume climbs through Week 3 — the peak — then Week 4 deloads and you re-check your movement. Quality never drops, even on the easy week.',
]);
const sWeeks1to4 = WEEKS.slice(0, 4).map(weekSection).join('');
const sScoreMid = `<section class="sheet" id="scorecard-mid">${scorecard('scorecard-mid', 'WEEK 4 — MID-BLOCK CHECK', 'Halfway. Confirm the movement is improving before Block 2.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 4'}, {h:'Change', hi:true}, {h:'Target / 8 wk', target:true}],
  'Expect cleaner, steadier movement by now — not big numbers. Flat on one check? Look at sleep, growth, and intent before adding anything.')}</section>`;
const sBlock2 = blockIntro('08', 2, 'BLOCK 2 · WEEKS 5–8', 'POWER &amp; COMPETE', '“Express it in a game.”', [
  'The movement base is built. Now you learn to express it. The jumps progress in amplitude — banded and contrast jumps, bigger bounds — and Week 6 introduces a small, carefully capped dose of low-box reactive work, only for players who are not in the middle of a fast growth spurt. Speed becomes true max-velocity sprinting and reactive change-of-direction, where you respond to a cue instead of a script.',
  'The finishers turn competitive and shift-like: short, repeated bursts and small games that ask you to repeat your power. Volume builds through Week 7 (peak), then Week 8 tapers — volume drops, quality stays sharp — and you re-run your checkpoints against Week 0 to see how far you have come.',
]);
const sWeeks5to8 = WEEKS.slice(4, 8).map(weekSection).join('');
const sScoreFinal = `<section class="sheet" id="scorecard-final">${scorecard('scorecard-final', 'WEEK 8 — FINAL CHECK · YOU vs YOU', 'The proof. Same six checkpoints, eight weeks apart.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 8'}, {h:'Change', hi:true}, {h:'Quality note'}, {h:'Target', target:true}],
  'Note the change and a word on how much cleaner it feels. At this age, better movement and no pain is a winning result.')}</section>
<aside class="pullquote"><p class="serif">Own your movement. Then express it — in a game, on the ice, on purpose.</p><span class="pq-by">Coach David Ciboch</span></aside>`;
const sProgreg = progreg();
const sRecovery = recovery();
const sMindset = mindset();
const sAbout = about(aboutB64);
const sNext = next();
const sGlossary = glossary(); // LAST — `used` is now fully populated

const footer = `
    <footer class="doc-footer">
      <div class="df-brand display">ELITE HOCKEY DRILLS</div>
      <div class="df-line">8-WEEK PROGRAM · AGES 12–14 · @ELITE_HOCKEY_DRILLS</div>
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
fs.writeFileSync('program-12-14-office.html', out);

console.log('WROTE program-12-14-office.html  (' + out.length + ' bytes)');
console.log('Unique exercises used:', used.size);
