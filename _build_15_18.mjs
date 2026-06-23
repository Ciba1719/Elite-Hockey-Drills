/* Build program-15-18-office.html — clones program.html's shell (head/fonts/CSS/images/JS
   verbatim) and repopulates the body for an 8-week, 4-day off-ice program for AGES 15-18.
   Every exercise resolves against the "Website Program" tab (_pool.json); exLink() THROWS
   on any name not on the tab, mechanically enforcing "no exercise outside the allowed pool".
   Mature "train to compete" voice; honest supplementary positioning (no barbell in the pool). */
import fs from 'fs';

const SRC  = fs.readFileSync('program.html', 'utf8');
const pool = JSON.parse(fs.readFileSync('_pool.json', 'utf8'));
const r2   = JSON.parse(fs.readFileSync('_r2.json', 'utf8'));

const R2BASE = 'https://pub-40102464ff0f4d61a636f1749e9d3111.r2.dev/';
const SITE   = 'https://elitehockeydrills.com/exercises/';
const byName = {};
pool.forEach(p => { byName[p.name] = p; });

const used = new Set();
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pad = n => String(n).padStart(2, '0');

function exLinkAs(name, label) {
  const p = byName[name];
  if (!p) throw new Error('OUT-OF-POOL EXERCISE: "' + name + '" is not on the Website Program tab.');
  used.add(name);
  const vid = r2[p.file] === 200 ? ` data-video="${R2BASE}${p.file}.mp4"` : '';
  return `<a class="ex"${vid} href="${SITE}${p.slug}" target="_blank" rel="noopener">${esc(label)}<span class="lk" aria-hidden="true">↗</span></a>`;
}
function exLink(name) { return exLinkAs(name, name); }
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
function session(label, d, dow, fMain, fSub, skill, main, compete) {
  return `
    <article class="session">
      <div class="session-week">${label}</div>
      <div class="session-head">
        <div class="sh-day"><span class="display">DAY ${d}</span><span class="sh-dow">${dow}</span></div>
        <div class="sh-focus"><span class="sh-focus-main">${fMain}</span><span class="sh-focus-sub">${fSub}</span></div>
      </div>
      ${refGroup(1, 'RAMP Warm-Up', '10 min', 'Raise · Activate · Mobilize · Prime — the standard warm-up, done first every session.', '#ramp')}
      ${workGroup(2, 'Speed &amp; Power', '14–18 min', skill)}
      ${workGroup(3, 'Main Work', '22–28 min', main)}
      ${workGroup(4, 'Compete &amp; Finish', '8–12 min', compete)}
      ${refGroup(5, 'Cool-Down', '4–6 min', 'Down-regulate — slow the breath, then mobility to start recovery.', '#cooldown')}
    </article>`;
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

/* ====================================================================
   THE 8-WEEK PLAN — 4 sessions / week. Every exercise is a Website
   Program tab name. Mon: linear speed & lower power · Tue: upper,
   rotation & core · Thu: lateral speed & change-of-direction ·
   Sat: max-velocity & compete. Intensity-led progression; no session
   repeats the prior week verbatim.
   ==================================================================== */
const WEEKS = [
/* ===================== BLOCK 1 — FOUNDATION & SPEED ===================== */
{ n:1, kicker:'BLOCK 1', tagClass:'build', tagText:'INTRODUCE', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 1 · INTRODUCE',
  desc:'SET THE STANDARD — teach the sprint positions, own your landings, and load single-leg with intent. Every rep is a technical rehearsal.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Speed & Lower Power', fSub:'Acceleration · Knee · Hinge',
     skill:[
       {ex:'Wall Drive Hold', sr:'3×10s/side', cue:'tall · knee drive', rest:'REST 30s', note:'Tall posture, one knee up, push the wall away. Find the acceleration position and own it.'},
       {ex:'A-Skip in Place', sr:'3×20s', cue:'rhythm · springy', rest:'REST 30s', note:'Knee up, toe up, light and rhythmic. Steady beats fast — build the pattern.'} ],
     main:[
       {ex:'Banded Squat', sr:'4×8', cue:'3011 · own depth', rest:'REST 75s', note:'Sit between the hips, knees track over the toes, drive up tall. Heavy band, full control.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · hinge', rest:'REST 75s', note:'Hips back, soft knees, flat back. Load the hamstrings, then stand tall and strong.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×8/side', cue:'3010 · vertical shin', rest:'REST 75s', note:'Rear foot up, drop straight down, vertical front shin. This is your key single-leg strength lift — load it with control.'},
       {ex:'Band Glute Bridge', sr:'3×12', cue:'2011 · squeeze', rest:'REST 45s', note:'Drive through the heels, squeeze the glutes hard at the top, ribs down.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'5×20m', cue:'hard · full intent', rest:'REST 60s', note:'Sharp 20m sprints on managed rest. Hold your speed across all five — no junk reps.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Core', fSub:'Push · Pull · Rotate · Brace',
     skill:[
       {ex:'Ankle Hop Stick', sr:'3×6', cue:'stiff · prime', rest:'REST 40s', note:'Quick, quiet, springy hops. Stiff ankle, stick the last one dead-still.'},
       {ex:'Rotational Med Ball Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Load the back hip, whip through, throw hard into the wall. Power comes from the hips.'} ],
     main:[
       {ex:'DB Floor Press', sr:'4×8', cue:'3010 · medium', rest:'REST 60s', note:'Elbows about 45°, pause an inch off the floor, press to lockout. Control the lower.'},
       {ex:'Band Row', sr:'4×10', cue:'2011 · squeeze', rest:'REST 45s', note:'Pull the elbows back, squeeze the shoulder blades, tall chest. Own every rep.'},
       {ex:'Half-Kneeling DB Press', sr:'3×8/side', cue:'2011 · brace', rest:'REST 45s', note:'Tall half-kneel, press straight up, ribs down. No lean — the trunk stays locked.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'anti-rotation', rest:'REST 45s', note:'Resist the band trying to twist you. March tall, trunk dead-still.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Win the body position, stay balanced, keep the feet moving. Compete for real.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Speed & Change of Direction', fSub:'Lateral push · Bound · Groin',
     skill:[
       {ex:'Crossover Step', sr:'3×6/side', cue:'footwork', rest:'REST 40s', note:'Cross the trail leg over, open the hips, push hard off the outside leg.'},
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · stick', rest:'REST 45s', note:'Push off the outside leg, cover ground sideways, land soft and freeze on one leg.'} ],
     main:[
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'3010 · medium', rest:'REST 60s', note:'Step wide, sit into the hip, drive back to the middle. Tall chest throughout.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back. Protect the groin.'},
       {ex:'SL Box Step-Down', sr:'3×6/side', cue:'3010 · control', rest:'REST 45s', note:'Lower slowly off the box, tap, stand. Knee tracks straight over the foot.'},
       {ex:'Side Plank with Reach', sr:'3×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach the top arm under and back. No sinking — own the position.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'3×5m', cue:'react', rest:'REST 50s', note:'Shadow your partner — break when they break, match the first step.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Compete', fSub:'Top speed · Full-body · Engine',
     skill:[
       {ex:'Hill Stride', sr:'4×20m', cue:'tall · build', rest:'REST 75s', note:'Run up a gentle slope, tall and rhythmic, at controlled effort. Groove clean acceleration mechanics — not all-out speed.'},
       {ex:'Broad Jump → Sprint 10m', sr:'4×1', cue:'X · stick then go', rest:'REST 75s', note:'Jump out far, stick the landing, then sprint away low. Full reset each rep.'} ],
     main:[
       {ex:'DB Thruster', sr:'3×8', cue:'X · drive', rest:'REST 75s', note:'Quick dip, drive the legs, press the DBs overhead in one chain. Upright torso.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · balance', rest:'REST 60s', note:'One-leg hinge with a DB, flat back, slow and balanced. Hips stay square.'},
       {ex:'Dead Bug with DB', sr:'3×8/side', cue:'slow · brace', rest:'REST 45s', note:'Low back glued to the floor, move opposite arm and leg slowly. Brace hard.'},
       {ex:'Farmer Carry (Banded)', sr:'2×30m', cue:'tall · loaded', rest:'REST 45s', note:'Walk tall and braced under load. Do not lean — own the posture.'} ],
     compete:[
       {ex:'Repeat Tempo Intervals', sr:'6×30s', cue:'steady · build engine', rest:'REST 60s', note:'Smooth, repeatable efforts. Build the aerobic base that lets you repeat your power.'} ] } ] },

{ n:2, kicker:'BLOCK 1', tagClass:'build', tagText:'BUILD', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 2 · BUILD',
  desc:'ADD LOAD & INTENT — progress the single-leg load, sharpen the starts, and put real power into the bounds and throws.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Speed & Lower Power', fSub:'Acceleration · Knee · Posterior',
     skill:[
       {ex:'A-Skip Moving', sr:'3×15m', cue:'rhythm · paw', rest:'REST 40s', note:'Move down the line — knee up, toe up, paw the ground under the hip.'},
       {ex:'Low Box Hop-Up — Stick', sr:'3×4', cue:'X · stick', rest:'REST 45s', note:'Hop up onto a low box, land soft and silent, stand tall. Own the landing.'} ],
     main:[
       {ex:'Banded Front Squat', sr:'4×8', cue:'3011 · elbows up', rest:'REST 75s', note:'Band in the front-rack, elbows up and proud, sit tall and drive through the floor.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavier', rest:'REST 60s', note:'One-leg hinge, heavier DB than Week 1, flat back. Control the load down and up.'},
       {ex:'Box Step-Up (DBs)', sr:'3×6/side', cue:'drive', rest:'REST 60s', note:'Drive through the top foot to stand tall. Do not push off the bottom foot.'},
       {ex:'Banded Hamstring Slides', sr:'3×8', cue:'control', rest:'REST 45s', note:'Slide the heels out and pull them back, hips up the whole time.'} ],
     compete:[
       {ex:'Sprint Intervals 15s', sr:'5×15s', cue:'hard', rest:'REST 60s', note:'Near-max bursts, full rest, then go again. Quality stays high every rep.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Core', fSub:'Push · Pull · Rotate · Carry',
     skill:[
       {ex:'Single-Leg Pogo Hops', sr:'3×6/side', cue:'stiff · quick', rest:'REST 45s', note:'Tall, stiff ankle, quick quiet hops on one leg. Keep the reps crisp.'},
       {ex:'Banded Rotational Throw (Wall)', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Rotate through the hips, throw hard into the wall, control the return.'} ],
     main:[
       {ex:'DB Push-Up to Row', sr:'3×6/side', cue:'brace', rest:'REST 60s', note:'Push-up, then row one DB without rocking the hips. Trunk square the whole time.'},
       {ex:'Band Face Pull', sr:'3×12', cue:'squeeze · high elbows', rest:'REST 40s', note:'Pull to the face, elbows high, squeeze the rear shoulders. Healthy shoulders win.'},
       {ex:'Explosive Push-Up', sr:'3×4', cue:'X · fast', rest:'REST 60s', note:'Push up fast and hard so the hands feel light. Reset each rep.'},
       {ex:'DB Suitcase Carry', sr:'2×30m/side', cue:'tall · anti-tilt', rest:'REST 45s', note:'One DB, walk tall, do not let the trunk tilt toward the load. Fight to stay level.'} ],
     compete:[
       {ex:'Jump Rope — Intervals', sr:'4×30s', cue:'quick', rest:'REST 30s', note:'Light, fast feet on the rope. Sharp intervals, full recovery between.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Speed & Change of Direction', fSub:'Open hips · Bound · Rotate',
     skill:[
       {ex:'Crossover Step to Sprint', sr:'4×10m', cue:'open hips', rest:'REST 60s', note:'Crossover to open the hips, then accelerate. Smooth into fast.'},
       {ex:'Skater Hop Complex', sr:'3×4/side', cue:'X · bound + stick', rest:'REST 60s', note:'A few skater bounds in a row, then stick the final one. Cover ground, land balanced.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'3×6/side', cue:'3010 · medium', rest:'REST 60s', note:'DB at the chest, push the hips back over the bending leg, other leg straight.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across the body, squeeze the inner thigh, control it back.'},
       {ex:'SL RDL (Banded)', sr:'3×6/side', cue:'3011 · balance', rest:'REST 45s', note:'Hinge on one leg, band under the foot, flat back. Touch a toe down only if you must.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate · brace', rest:'REST 40s', note:'Pull the band across the body, brace the trunk, control the return.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Small game, full effort, clean movement. Express what you have built.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Compete', fSub:'Top speed · Power · Engine',
     skill:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'top speed', rest:'REST 75s', note:'A 20m run-in, then fly through the 10m zone. Relax the face, roll fast and tall.'},
       {ex:'Banded Squat Jump', sr:'4×3', cue:'X · max intent', rest:'REST 75s', note:'Dip and jump hard against the band, land soft. Full reset between sets.'} ],
     main:[
       {ex:'DB Complex', sr:'3 rounds', cue:'flow · medium', rest:'REST 90s', note:'Flow through the DB sequence without setting the bells down. Smooth, strong, unbroken.'},
       {ex:'Banded RDL', sr:'3×10', cue:'3011 · medium', rest:'REST 45s', note:'Hinge, flat back, drive the hips through to stand tall.'},
       {ex:'Copenhagen Plank — Long', sr:'3×15s/side', cue:'long-lever', rest:'REST 40s', note:'Long-lever — top foot on a bench, bottom leg hovering. Hold steady; the most hockey-relevant core test there is.'},
       {ex:'Suitcase Get-Up', sr:'2×3/side', cue:'control', rest:'REST 45s', note:'Stand up and lie down with one DB, moving deliberately. Own every position.'} ],
     compete:[
       {ex:'30-Sec Shuttle', sr:'4×30s', cue:'hard', rest:'REST 60s', note:'Repeat shuttle runs at a hockey-shift pace. Sharp turns, honest effort.'} ] } ] },

{ n:3, kicker:'BLOCK 1', tagClass:'peak', tagText:'PEAK', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 3 · PEAK',
  desc:'PEAK OF BLOCK 1 — the highest-intent week yet. Maximal acceleration, elastic bounds, and the heaviest single-leg loading of the block.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Speed & Lower Power', fSub:'Max accel · Knee · Hinge',
     skill:[
       {ex:'Hill Sprint', sr:'4×15m', cue:'X · drive', rest:'REST 90s', note:'Explode up the slope, low and powerful. The hill builds clean, forceful acceleration.'},
       {ex:'Broad Jump → Sprint 10m', sr:'4×1', cue:'X · max intent', rest:'REST 90s', note:'Jump far, stick, sprint away. Maximal intent, full rest. Quality over distance.'} ],
     main:[
       {ex:'Banded Squat', sr:'4×6', cue:'30X1 · drive', rest:'REST 90s', note:'Heaviest band of the block. Control down, then drive up as fast as the band allows.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · heavy', rest:'REST 75s', note:'Heavier DBs down the thighs, flat back, big strong hips at the top.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×6/side', cue:'3010 · heavy', rest:'REST 75s', note:'Heaviest split squat of the block. Vertical shin, controlled, no compromise on form.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×8/side', cue:'squeeze', rest:'REST 45s', note:'One foot down, drive the hip up level, squeeze and pause. Hips stay even.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×20m', cue:'hard', rest:'REST 50s', note:'Six sharp sprints on short rest. Hold your top speed across all six.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Core', fSub:'Power push · Pull · Brace',
     skill:[
       {ex:'Band Chest Pass', sr:'3×6', cue:'X · fast', rest:'REST 45s', note:'Explosive band press from the chest, fast hands. Upper-body power the day after a heavy lower session.'},
       {ex:'Rotational Med Ball Side Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Side-on to the wall, rotate and throw hard, reset and repeat.'} ],
     main:[
       {ex:'DB Push Press', sr:'3×6', cue:'X · drive', rest:'REST 75s', note:'Quick dip, drive the legs, press the DBs overhead. Upright torso, fast finish.'},
       {ex:'Renegade Row', sr:'3×6/side', cue:'brace', rest:'REST 60s', note:'Wide plank, row one DB without rocking the hips. Trunk locked, real load.'},
       {ex:'Archer Push-Up', sr:'3×5/side', cue:'control', rest:'REST 60s', note:'Shift the weight over one arm, the other long. Lower with control, press back.'},
       {ex:'Hanging Straight-Leg Raise', sr:'3×6', cue:'control', rest:'REST 45s', note:'Hang tall, lift straight legs without swinging. Lower slow and own it.'},
       {ex:'Hanging / Bar Hold', sr:'2×max', cue:'grip · decompress', rest:'REST 45s', note:'Hang tall from the bar, shoulders active. Builds grip and a strong, healthy shoulder.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Compete for position, stay balanced and light. Win the small battles.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Speed & Change of Direction', fSub:'Reactive cuts · Groin · Brace',
     skill:[
       {ex:'Crossover Step to Sprint', sr:'4×10m', cue:'open hips', rest:'REST 60s', note:'Open the hips with a crossover, then accelerate hard. Sharp transition.'},
       {ex:'Reactive 4-Cone', sr:'4×1', cue:'react', rest:'REST 60s', note:'Sprint to the cone you are shown. Sharp cuts, stay low through the turn.'} ],
     main:[
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'3010 · heavier', rest:'REST 60s', note:'Heavier band, step wide, sit into the hip, drive back. Tall chest.'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'More reps this week. Squeeze the inner thigh across the body, control it back.'},
       {ex:'SL Box Step-Down', sr:'3×8/side', cue:'3010 · control', rest:'REST 45s', note:'Slow lower off the box, knee tracking true. Build the single-leg brake.'},
       {ex:'Copenhagen Plank — Long', sr:'3×18s/side', cue:'long-lever', rest:'REST 40s', note:'Long-lever, a little longer than Week 2. Steady hips, no drop.'} ],
     compete:[
       {ex:'Reactive Mirror Sprint', sr:'4×5m', cue:'react', rest:'REST 50s', note:'Read your partner and match the break. Win the first two steps.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Compete', fSub:'Top speed · Contrast · Engine',
     skill:[
       {ex:'30m Fly Sprint', sr:'3×30m', cue:'top speed', rest:'REST 2–3 min', note:'Long run-in, then hold top speed through 30m. Tall, relaxed, fast turnover.'},
       {ex:'Contrast Jump', sr:'4×(3+3)', cue:'X · heavy then light', rest:'REST 2 min', note:'A few banded jumps, short rest, then free jumps at max intent. Feel the spring.'} ],
     main:[
       {ex:'DB Thruster', sr:'3×8', cue:'X · drive', rest:'REST 75s', note:'Drive the legs and press in one chain. Strong, unbroken, upright.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavy', rest:'REST 60s', note:'Heavier one-leg hinge, flat back, balanced. Square hips, slow control.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'March tall against the band, trunk locked, no twist.'},
       {ex:'Farmer + Suitcase Complex', sr:'2 rounds', cue:'tall · loaded', rest:'REST 60s', note:'Farmer then single-side carry without stopping. Stay tall and braced throughout.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift', rest:'REST 50s', note:'Shift-length bursts on short rest. Train to repeat your power like a real shift.'} ] } ] },

{ n:4, kicker:'BLOCK 1', tagClass:'deload', tagText:'DELOAD', label:'BLOCK 1 · FOUNDATION & SPEED · WEEK 4 · DELOAD',
  desc:'DELOAD — pull the volume back hard, keep every rep sharp. This is where the work catches up to you. Re-run your checkpoints this week.',
  days:[
   { d:1, dow:'Mon', fMain:'Movement Quality & Speed', fSub:'Mobility · Light power',
     skill:[
       {ex:'A-Skip in Place', sr:'2×15s', cue:'easy · tall', rest:'REST 40s', note:'Easy rhythm, tall posture. Grease the pattern, do not chase it.'},
       {ex:'Drop Squat', sr:'3×3', cue:'X · catch & stick', rest:'REST 45s', note:'Fall into a strong, wide athletic stance and freeze. Sharp, but only a few.'} ],
     main:[
       {ex:'Iso Wall Sit', sr:'2×30s', cue:'brace · thighs flat', rest:'REST 45s', note:'Back on the wall, thighs parallel, knees over ankles. Hold strong and breathe.'},
       {ex:'DB RDL', sr:'2×8', cue:'3011 · light', rest:'REST 60s', note:'Light, clean hinge. Flat back, controlled, easy intent.'},
       {ex:'SL Balance — Eyes Closed', sr:'2×20s/side', cue:'balance', rest:'REST 30s', note:'Soft knee, quiet foot, eyes closed. Grip the floor with the toes and hold steady.'} ],
     compete:[
       {ex:'Mirror Game / Free Play', sr:'3×20s', cue:'light play', rest:'REST 40s', note:'Easy, reactive movement. Stay loose and sharp.'} ] },
   { d:2, dow:'Tue', fMain:'Easy Upper & Core', fSub:'Joint-friendly · Brace',
     skill:[
       {ex:'Ankle Hop Stick', sr:'2×5', cue:'stiff', rest:'REST 40s', note:'Springy, quiet hops. Stick the finish. Keep it crisp and short.'},
       {ex:'Banded Rotational Press', sr:'2×6/side', cue:'rotate · light', rest:'REST 40s', note:'Rotate through the hips and press out, brace the trunk. Easy and clean.'} ],
     main:[
       {ex:'Banded Chest Press', sr:'2×12', cue:'control', rest:'REST 45s', note:'Press the band forward, squeeze the chest, control the return. Joint-friendly volume.'},
       {ex:'Band Row', sr:'2×12', cue:'squeeze', rest:'REST 40s', note:'Elbows back, squeeze the upper back, tall chest. Easy, clean reps.'},
       {ex:'Plank Shoulder Tap', sr:'2×10', cue:'brace', rest:'REST 30s', note:'Tap the opposite shoulder without letting the hips rock. Wider feet if needed.'} ],
     compete:[
       {ex:'Jump Rope — Steady', sr:'2×60s', cue:'easy', rest:'REST 45s', note:'Relaxed, rhythmic skipping. Light feet, easy breathing.'} ] },
   { d:3, dow:'Thu', fMain:'Light Lateral & Groin', fSub:'Control · Groin',
     skill:[
       {ex:'Lateral Squat Shift', sr:'2×6/side', cue:'control', rest:'REST 30s', note:'Slow side-to-side, sink into each hip, stay low and balanced.'},
       {ex:'Skater Hop — Stick It', sr:'2×4/side', cue:'X · stick', rest:'REST 45s', note:'Soft, silent one-leg landings. Freeze each one before the next.'} ],
     main:[
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — pull across, squeeze the inner thigh, control it back.'},
       {ex:'SL RDL (Banded)', sr:'2×6/side', cue:'balance', rest:'REST 45s', note:'Light one-leg hinge, flat back. Quiet, balanced, controlled.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady. No sinking.'} ],
     compete:[
       {ex:'Free Play / 1v1 Game', sr:'3×20s', cue:'light', rest:'REST 45s', note:'Playful, light competition. Move well, stay relaxed.'} ] },
   { d:4, dow:'Sat', fMain:'Sharp Speed & Check', fSub:'Crisp power · Re-test',
     skill:[
       {ex:'Fast Feet / Ladder Equiv', sr:'2×10s', cue:'quick', rest:'REST 40s', note:'Light, fast feet in a small space. Stay tall, eyes up.'},
       {ex:'SL CMJ Stick', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'Single-leg jump, land soft and freeze. Control the landing on one leg.'} ],
     main:[
       {ex:'Deep Squat Hold', sr:'3×20s', cue:'breathe', rest:'REST 40s', note:'Sit in the bottom, heels down, tall chest. Relax into the range and breathe.'},
       {ex:'SL DB RDL', sr:'2×6/side', cue:'light', rest:'REST 50s', note:'Light one-leg hinge, balanced and clean. Square hips.'},
       {ex:'Hollow Rock', sr:'2×8', cue:'brace', rest:'REST 40s', note:'Low back glued down, rock as one stiff unit. Small and tight.'} ],
     compete:[
       {ex:'Aerobic Circuit (Zone 2)', sr:'1 round', cue:'easy · nasal', rest:'flow', note:'Easy continuous circuit at a conversational pace. Recovery, not a grind.'} ] } ] },

/* ===================== BLOCK 2 — POWER & COMPETE ===================== */
{ n:5, kicker:'BLOCK 2', tagClass:'build', tagText:'BUILD', label:'BLOCK 2 · POWER & COMPETE · WEEK 5 · BUILD',
  desc:'EXPRESS IT — full-amplitude and contrast jumps, resisted acceleration, and max-velocity sprinting returns. Loaded single-leg progressed again.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Speed & Lower Power', fSub:'Resisted accel · Power · Posterior',
     skill:[
       {ex:'A-Skip Resisted', sr:'3×10m', cue:'drive', rest:'REST 50s', note:'Light band at the waist, drive the knees, stay tall. Power into the ground.'},
       {ex:'Contrast Jump', sr:'4×(3+3)', cue:'X · heavy then light', rest:'REST 2 min', note:'A few banded jumps, short rest, then free jumps at max intent. Full reset between contrast sets.'} ],
     main:[
       {ex:'Banded Front Squat', sr:'4×6', cue:'30X1 · drive', rest:'REST 90s', note:'Front-rack band, elbows proud, control down and drive up fast. Heaviest band you own.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavier', rest:'REST 60s', note:'Heavier one-leg hinge, flat back, balanced. Slow eccentric, strong finish.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×8/side', cue:'3010 · heavy', rest:'REST 75s', note:'Add a rep this week. Vertical shin, controlled, real load.'},
       {ex:'Banded Hamstring Slides', sr:'3×8', cue:'control', rest:'REST 45s', note:'Slide the heels out and pull them back, hips high throughout.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×20m', cue:'hard', rest:'REST 45s', note:'Six sharp sprints on short rest. Honest top speed every rep.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Core', fSub:'Push · Pull · Locomotion',
     skill:[
       {ex:'Single-Leg Pogo Hops', sr:'3×6/side', cue:'stiff · quick', rest:'REST 45s', note:'Tall, stiff, quick quiet hops on one leg. Crisp ground contact.'},
       {ex:'Band Rotational Scoop Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Scoop low to high, rotate through the hips, finish tall and explosive.'} ],
     main:[
       {ex:'Half-Kneeling DB Press', sr:'3×8/side', cue:'2011 · heavier', rest:'REST 60s', note:'Tall half-kneel, press straight up, ribs down. No lean, real load.'},
       {ex:'Renegade Row', sr:'3×6/side', cue:'brace', rest:'REST 60s', note:'Wide plank, row one DB, hips dead-square. Anti-rotation under load.'},
       {ex:'Deficit Push-Up', sr:'3×6', cue:'range', rest:'REST 45s', note:'Hands raised, chest below the hands for full range. Control the bottom.'},
       {ex:'Bear Crawl Variations', sr:'3×10m', cue:'low · brace', rest:'REST 40s', note:'Knees an inch off the floor, opposite hand and foot, hips quiet. Brace and crawl.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Win position, stay balanced, keep moving the feet. Compete hard.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Speed & Change of Direction', fSub:'Reactive cuts · Bound · Rotate',
     skill:[
       {ex:'Reactive 4-Cone', sr:'4×1', cue:'react', rest:'REST 60s', note:'Sprint to the cone you are shown. Sharp, low cuts, fast recognition.'},
       {ex:'Lateral Skater Bound', sr:'3×4/side', cue:'X · bound', rest:'REST 60s', note:'Big sideways push, cover ground, land balanced on one leg.'} ],
     main:[
       {ex:'DB Goblet Lateral Lunge', sr:'3×8/side', cue:'3010 · heavier', rest:'REST 60s', note:'Heavier DB, hips back over the bending leg, other leg long. Tall chest.'},
       {ex:'Banded Standing Adduction', sr:'3×10/side', cue:'groin', rest:'REST 30s', note:'Pull the band-leg across, squeeze the inner thigh, control it back.'},
       {ex:'Box Step-Up (DBs)', sr:'3×8/side', cue:'drive', rest:'REST 60s', note:'Drive through the top foot to stand tall, no push-off below. Heavier DBs.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate · brace', rest:'REST 40s', note:'Diagonal pull across the body, braced trunk, smooth and strong.'} ],
     compete:[
       {ex:'Reactive Mirror Sprint', sr:'4×5m', cue:'react', rest:'REST 50s', note:'Mirror the break. Sharp, reactive first step every time.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Compete', fSub:'Top speed · Multi-dir power · Engine',
     skill:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'top speed', rest:'REST 75s', note:'Run in, then fly. Tall, relaxed, max turnover through the zone.'},
       {ex:'Multi-Direction Bound', sr:'3×4', cue:'X · stick', rest:'REST 60s', note:'Bound forward, side, and diagonal, sticking each landing on one leg.'} ],
     main:[
       {ex:'DB Complex', sr:'3 rounds', cue:'flow · heavier', rest:'REST 90s', note:'Unbroken DB sequence, heavier than Block 1. Strong and controlled, do not set them down.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · heavy', rest:'REST 60s', note:'Heavy hinge, flat back, drive the hips through to a tall finish.'},
       {ex:'Copenhagen Plank — Long', sr:'3×20s/side', cue:'long-lever', rest:'REST 40s', note:'Long-lever, longer hold than Block 1. Steady hips, no drop.'},
       {ex:'Carry Complex (Farmer + Suitcase + Overhead)', sr:'2 rounds', cue:'tall · loaded', rest:'REST 60s', note:'Three carries back to back without stopping. Stay tall and braced throughout.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift', rest:'REST 50s', note:'Shift-length bursts on short rest. Repeat your power, shift after shift.'} ] } ] },

{ n:6, kicker:'BLOCK 2', tagClass:'peak', tagText:'PEAK', label:'BLOCK 2 · POWER & COMPETE · WEEK 6 · PEAK',
  desc:'PEAK POWER — top amplitude reactive plyometrics, max-velocity sprinting, and contrast work at full intent. The highest-output week of the program.',
  days:[
   { d:1, dow:'Mon', fMain:'Linear Speed & Lower Power', fSub:'Resisted→free · Contrast · Posterior',
     skill:[
       {ex:'Resisted → Free Sprint', sr:'4×10m', cue:'X · drive', rest:'REST 90s', note:'A partner or band holds you, then releases — sprint out low and hard. Feel the launch.'},
       {ex:'Contrast Jump', sr:'4×(3+3)', cue:'X · max', rest:'REST 2 min', note:'Banded jumps, short rest, then free jumps at max intent. Full reset between contrast sets.'} ],
     main:[
       {ex:'Banded Squat', sr:'4×5', cue:'30X1 · drive', rest:'REST 90s', note:'Heavy band, low reps, maximal drive up. Crisp and powerful, never grinding.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavy', rest:'REST 60s', note:'Heavy one-leg hinge, flat back, balanced. Own the eccentric.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×6/side', cue:'3010 · heavy · pause', rest:'REST 75s', note:'Heaviest of the program with a pause at the bottom. Vertical shin, full control.'},
       {ex:'SL Glute Bridge (Band)', sr:'3×8/side', cue:'squeeze', rest:'REST 45s', note:'Level hips, drive up, squeeze and pause. One leg at a time.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×20m', cue:'controlled · repeatable', rest:'REST 50s', note:'Repeat-speed conditioning on short rest — repeat the effort cleanly, do not sprint all-out on tired legs.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Core', fSub:'Power push · Rotate · Pull',
     skill:[
       {ex:'Band Chest Pass', sr:'3×6', cue:'X · fast', rest:'REST 45s', note:'Explosive band press from the chest, fast hands. Upper-body power on a low-impact day.'},
       {ex:'Banded Rotational Throw (Wall)', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Rotate through the hips, throw hard into the wall, control the return.'} ],
     main:[
       {ex:'DB Push Press', sr:'3×5', cue:'X · drive', rest:'REST 75s', note:'Quick dip, explosive leg drive, press overhead. Heaviest fast press of the block.'},
       {ex:'DB Push-Up to Row', sr:'3×6/side', cue:'brace', rest:'REST 60s', note:'Push-up then row, hips square. Anti-rotation under a real load.'},
       {ex:'Band Pull-Apart Speed', sr:'3×15', cue:'fast · squeeze', rest:'REST 30s', note:'Pull the band apart fast, squeeze the upper back, control it back. Healthy shoulders.'},
       {ex:'Banded Wrist Work', sr:'2×12/side', cue:'control', rest:'REST 30s', note:'Slow wrist curls and extensions against the band. Stickhandling and shot durability.'} ],
     compete:[
       {ex:'Jump Rope — Speed', sr:'4×20s', cue:'fast', rest:'REST 40s', note:'Fastest feet you have on the rope. Short, sharp, full recovery.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Speed & Change of Direction', fSub:'Reactive cuts · Reactive bound · Brace',
     skill:[
       {ex:'Reactive 4-Cone', sr:'5×1', cue:'react', rest:'REST 60s', note:'Sprint to the cone you are shown. Sharp, low cuts under fatigue.'},
       {ex:'Continuous Lateral Bound', sr:'3×4/side', cue:'X · rhythm', rest:'REST 60s', note:'Bound side to side in rhythm, soft outside-leg landings. Short sets only.'} ],
     main:[
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'heavier', rest:'REST 60s', note:'Heavy band, wide step, sit into the hip, drive back. Tall chest.'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'Pull across, squeeze the inner thigh, control it back. Protect the groin at peak.'},
       {ex:'Lateral Depth Drop to Bound', sr:'3×3/side', cue:'X · control', rest:'REST 75s', note:'Step off a low box, land, and rebound sideways. Top-amplitude reactive work — keep it clean.'},
       {ex:'Copenhagen Plank — Long', sr:'3×22s/side', cue:'long-lever', rest:'REST 40s', note:'Long-lever, the longest hold yet. Steady hips, no drop.'} ],
     compete:[
       {ex:'Reactive Mirror Sprint', sr:'4×5m', cue:'react', rest:'REST 50s', note:'React and break with your partner. First step wins.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Compete', fSub:'Top speed · Reactive depth · Engine',
     skill:[
       {ex:'30m Fly Sprint', sr:'3×30m', cue:'top speed', rest:'REST 2–3 min', note:'Long run-in, hold top speed through 30m. The fastest you will run all week.'},
       {ex:'Depth Drop (Low Box)', sr:'3×4', cue:'X · land & stick', rest:'REST 90s', note:'Step off a low box, land soft and silent, freeze. Quality over height, full rest.'} ],
     main:[
       {ex:'DB Thruster', sr:'3×6', cue:'X · drive', rest:'REST 75s', note:'Explosive leg drive into the press, one chain. Strong and upright.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavy', rest:'REST 60s', note:'Heavy one-leg hinge, flat back, balanced. Square hips, slow control.'},
       {ex:'Dragon Flag Negatives', sr:'3×4', cue:'control', rest:'REST 60s', note:'Lower the whole body as one rigid line, slow. Bend the knees to scale. Elite anti-extension.'},
       {ex:'Pallof March', sr:'3×8/side', cue:'brace', rest:'REST 40s', note:'March tall against the band, trunk locked, no twist.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift', rest:'REST 50s', note:'Shift-length bursts on short rest. Repeat the power even when tired.'} ] } ] },

{ n:7, kicker:'BLOCK 2', tagClass:'build', tagText:'INTEGRATE', label:'BLOCK 2 · POWER & COMPETE · WEEK 7 · INTEGRATE',
  desc:'PUT IT TOGETHER — speed, power, and strength in one session, finished with heavy competition. Express everything you have built.',
  days:[
   { d:1, dow:'Mon', fMain:'Power Integration', fSub:'Elastic · Knee · Hinge',
     skill:[
       {ex:'A-Skip + B-Skip', sr:'3×15m', cue:'rhythm', rest:'REST 40s', note:'A: knee up, toe up. B: reach and paw it back. Tall, active arms, springy.'},
       {ex:'Squat to Tuck Jump', sr:'3×4', cue:'X · soft land', rest:'REST 60s', note:'Jump, quick knee tuck, land soft and tall. Maximal intent, perfect landings.'} ],
     main:[
       {ex:'Banded Front Squat', sr:'4×6', cue:'30X1 · drive', rest:'REST 90s', note:'Front-rack band, elbows proud, control down and drive up fast.'},
       {ex:'DB RDL', sr:'3×8', cue:'3011 · heavy', rest:'REST 75s', note:'Heavy hinge, flat back, strong hips at the top. Own the load.'},
       {ex:'DB Bulgarian Split Squat', sr:'3×8/side', cue:'3010 · heavy', rest:'REST 75s', note:'Real load, vertical shin, controlled. Your strongest single-leg lift.'},
       {ex:'SL RDL (Banded)', sr:'3×6/side', cue:'balance', rest:'REST 45s', note:'One-leg hinge, band under the foot, flat back. Balanced and slow.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'6×25m', cue:'hard', rest:'REST 45s', note:'Longer repeats this week. Hold your speed across all six.'} ] },
   { d:2, dow:'Tue', fMain:'Upper, Rotation & Carry', fSub:'Power push · Rotate · Carry',
     skill:[
       {ex:'Explosive Push-Up', sr:'3×4', cue:'X · fast', rest:'REST 45s', note:'Push up fast and hard so the hands leave the floor. Upper-body power, reset each rep.'},
       {ex:'Rotational Med Ball Toss', sr:'3×5/side', cue:'X · throw', rest:'REST 45s', note:'Load the back hip, whip through, throw hard. Hip-driven power.'} ],
     main:[
       {ex:'DB Floor Press', sr:'3×8', cue:'3010 · heavy', rest:'REST 60s', note:'Heavy DBs, pause off the floor, press to lockout. Strong and controlled.'},
       {ex:'Band Chest Pass', sr:'3×6', cue:'X · fast', rest:'REST 45s', note:'Explosive band press from the chest, fast hands. Push-side power.'},
       {ex:'Bear Crawl with DBs', sr:'3×8/side', cue:'brace', rest:'REST 45s', note:'Drag a DB under the body each step, hips quiet. Brutal anti-rotation.'},
       {ex:'Carry Complex (Farmer + Suitcase + Overhead)', sr:'2 rounds', cue:'tall · loaded', rest:'REST 60s', note:'Three carries unbroken. Tall posture, braced trunk, full grip.'} ],
     compete:[
       {ex:'Battle Game / 1v1', sr:'3×25s', cue:'compete', rest:'REST 45s', note:'Compete for position, stay balanced and light. Win the battles.'} ] },
   { d:3, dow:'Thu', fMain:'Lateral Power & Compete', fSub:'Open hips · Bound · Groin',
     skill:[
       {ex:'Crossover Step to Sprint', sr:'3×10m', cue:'open hips', rest:'REST 60s', note:'Crossover to open the hips, then accelerate hard.'},
       {ex:'Skater Hop Complex', sr:'3×4/side', cue:'X · bound + stick', rest:'REST 60s', note:'A few bounds, then stick the last. Cover ground, land balanced.'} ],
     main:[
       {ex:'Banded Lateral Lunge', sr:'3×8/side', cue:'heavier', rest:'REST 60s', note:'Heavy band, wide step, sit and drive. Tall chest.'},
       {ex:'Banded Standing Adduction', sr:'3×12/side', cue:'groin', rest:'REST 30s', note:'Squeeze the inner thigh across the body, control it back.'},
       {ex:'SL Box Step-Down', sr:'3×8/side', cue:'control', rest:'REST 45s', note:'Slow lower off the box, knee tracking true. Strong single-leg brake.'},
       {ex:'Banded Chop / Lift', sr:'3×8/side', cue:'rotate', rest:'REST 40s', note:'Diagonal pull, braced trunk, smooth and powerful.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'4×25s', cue:'compete', rest:'REST 45s', note:'Full-effort small game. Express speed, power, and competitiveness together.'} ] },
   { d:4, dow:'Sat', fMain:'Max-Velocity & Express', fSub:'Top speed · Bound · Engine',
     skill:[
       {ex:'Flying 10m Sprint', sr:'4×10m', cue:'top speed', rest:'REST 75s', note:'Run in, then fly. Tall, relaxed, fast turnover.'},
       {ex:'Crossover Step Bound', sr:'3×4/side', cue:'X · stick', rest:'REST 60s', note:'Crossover and bound for distance, then land balanced on one leg.'} ],
     main:[
       {ex:'DB Complex', sr:'3 rounds', cue:'flow · heavy', rest:'REST 90s', note:'Heavy unbroken DB sequence. Strong, controlled, never set them down.'},
       {ex:'SL DB RDL', sr:'3×6/side', cue:'3011 · heavy', rest:'REST 60s', note:'Heavy one-leg hinge, flat back, balanced.'},
       {ex:'Dragon Flag Negatives', sr:'3×5', cue:'control', rest:'REST 60s', note:'Lower as one rigid line, slow. Scale by bending the knees.'},
       {ex:'Farmer Carry (Banded)', sr:'2×30m', cue:'tall · loaded', rest:'REST 45s', note:'Walk tall and braced under load. Do not lean.'} ],
     compete:[
       {ex:'Repeat Efforts — Shift Simulation', sr:'5×30s', cue:'shift', rest:'REST 50s', note:'Shift-length bursts on short rest. Repeat your power to the finish.'} ] } ] },

{ n:8, kicker:'BLOCK 2', tagClass:'taper', tagText:'TAPER', label:'BLOCK 2 · POWER & COMPETE · WEEK 8 · TAPER',
  desc:'TAPER — volume drops sharply, quality stays razor-sharp. Re-run your checkpoints and measure how far you have come.',
  days:[
   { d:1, dow:'Mon', fMain:'Sharp Speed & Power', fSub:'Crisp accel · Light power',
     skill:[
       {ex:'A-Skip Moving', sr:'2×10m', cue:'rhythm', rest:'REST 40s', note:'Crisp, tall, easy. Just sharpen the pattern.'},
       {ex:'Broad Jump → Sprint 10m', sr:'3×1', cue:'X · max', rest:'REST 75s', note:'A few high-quality reps. Far jump, stick, sprint away.'} ],
     main:[
       {ex:'Banded Squat', sr:'2×5', cue:'30X1 · sharp', rest:'REST 75s', note:'Light volume, fast drive. Crisp and powerful, leave reps in the tank.'},
       {ex:'SL DB RDL', sr:'2×6/side', cue:'3011 · light', rest:'REST 50s', note:'Light, balanced one-leg hinge. Clean and controlled.'},
       {ex:'DB Bulgarian Split Squat', sr:'2×6/side', cue:'crisp', rest:'REST 60s', note:'A couple of clean sets. Vertical shin, controlled, easy load.'} ],
     compete:[
       {ex:'Repeat Sprint Ability', sr:'4×20m', cue:'sharp', rest:'REST 60s', note:'Fewer reps, full speed, long rest. Stay fast and fresh.'} ] },
   { d:2, dow:'Tue', fMain:'Quick Upper & Core', fSub:'Light push · Pull · Brace',
     skill:[
       {ex:'Ankle Hop Stick', sr:'2×5', cue:'stiff', rest:'REST 40s', note:'Springy and quiet. Stick the finish.'},
       {ex:'Rotational Med Ball Toss', sr:'2×5/side', cue:'X · throw', rest:'REST 45s', note:'Hip-driven, sharp throws into the wall. Crisp, not many.'} ],
     main:[
       {ex:'Push-Up to Reach', sr:'2×6/side', cue:'control', rest:'REST 45s', note:'Push-up, then reach one hand forward without twisting the hips.'},
       {ex:'Band Row', sr:'2×10', cue:'squeeze', rest:'REST 40s', note:'Elbows back, squeeze, tall chest. Clean and easy.'},
       {ex:'Pallof March', sr:'2×8/side', cue:'brace', rest:'REST 40s', note:'Tall march, trunk locked, no twist.'} ],
     compete:[
       {ex:'Jump Rope — Speed', sr:'3×20s', cue:'fast', rest:'REST 45s', note:'Quick, light feet. Short and sharp.'} ] },
   { d:3, dow:'Thu', fMain:'Light Lateral & Compete', fSub:'React · Bound · Groin',
     skill:[
       {ex:'Reactive Lateral Start', sr:'3×5m', cue:'react', rest:'REST 50s', note:'From an athletic stance, explode sideways on the cue. Low and sharp.'},
       {ex:'Lateral Skater Bound', sr:'2×4/side', cue:'X · stick', rest:'REST 50s', note:'A couple of clean, balanced bounds per side. Stick each landing.'} ],
     main:[
       {ex:'Banded Standing Adduction', sr:'2×10/side', cue:'groin', rest:'REST 30s', note:'Light and easy — pull across, squeeze, control it back. Keep the groin happy.'},
       {ex:'SL RDL (Banded)', sr:'2×6/side', cue:'balance', rest:'REST 45s', note:'Light one-leg hinge, flat back, quiet and balanced.'},
       {ex:'Side Plank with Reach', sr:'2×8/side', cue:'brace', rest:'REST 30s', note:'Hips high, reach and return, steady.'} ],
     compete:[
       {ex:'Mirror Sprint Game', sr:'3×5m', cue:'react', rest:'REST 50s', note:'Sharp, reactive breaks. Win the first step.'} ] },
   { d:4, dow:'Sat', fMain:'Compete & Checkpoint', fSub:'Top speed · Show your work',
     skill:[
       {ex:'Flying 10m Sprint', sr:'3×10m', cue:'top speed', rest:'REST 75s', note:'A few crisp top-speed runs. Tall, relaxed, fast.'},
       {ex:'Multi-Direction Bound', sr:'2×4', cue:'X · stick', rest:'REST 60s', note:'Bound forward, side, and diagonal, sticking each landing.'} ],
     main:[
       {ex:'Combine Circuit', sr:'1–2 rounds', cue:'move well', rest:'REST 60s', note:'Run the checkpoint circuit — jump, sprint, balance, hold. Show clean, fast movement.'},
       {ex:'Deep Squat Hold', sr:'2×20s', cue:'breathe', rest:'REST 40s', note:'Sit deep, heels down, tall chest. Breathe into the range.'},
       {ex:'Copenhagen Plank — Long', sr:'2×20s/side', cue:'long-lever', rest:'REST 40s', note:'Long-lever, steady hips. A final check of your groin durability.'} ],
     compete:[
       {ex:'Free Play with Intent', sr:'3×25s', cue:'express', rest:'REST 45s', note:'Play hard, move fast, and feel how much more explosive you are.'} ] } ] },
];

/* ---------- RAMP warm-up (Warm-up / Mobility category only) ---------- */
const RAMP = [
  ['R','Raise','~2 min','Lift the heart rate, temperature, and blood flow.', ['Jumping Jacks','Butt Kicks']],
  ['A','Activate','~2–3 min','Switch on the glutes, groin, and deep core that steady every stride.', ['Banded Monster Walk','Banded Lateral Walk','Banded Clamshell','Adductor Rocker']],
  ['M','Mobilize','~2–3 min','Open the hips, groin, ankles, and upper back through the ranges skating demands.', ['Spider Lunge with Rotation','90/90 Hip Switch','T-Spine Rotation','Ankle Dorsiflexion (Wall)']],
  ['P','Prime','~2 min','Wake up fast, coordinated movement with a few crisp, near-maximal efforts.', ['A-Skip in Place','Lateral Squat Shift','Inchworm to Push-Up']],
];
/* ---------- Cool-down (Cool-down / Recovery category only) ---------- */
const COOLDOWN = ['Slow Walk with Nose Breathing','Child\'s Pose with Breath','Supine Spinal Twist','Hip / Groin Flow'];

/* ---------- Performance checkpoints (field tests, no gym) ---------- */
const CHECKS = [
  { n:1, label:'Broad Jump', ex:'Broad Jump', quality:'Horizontal power', proto:'3 attempts, best distance', gain:'+10–25 cm', w:'80%',
    how:'Standing two-foot broad jump for maximum distance. Stick the landing for a beat, then measure to the back heel. Best of three.' },
  { n:2, label:'20m Sprint', ex:'20m Sprint', quality:'Acceleration', proto:'Timed 20m from a standstill, best of 3', gain:'faster', w:'78%',
    how:'From a still two-point start, sprint a flat-out 20m and time it. Same surface and shoes every test. This is your pure acceleration.' },
  { n:3, label:'20m Flying Sprint', ex:'20m Flying Sprint', quality:'Top-end speed', proto:'Run-in + timed 20m, best of 3', gain:'faster', w:'80%',
    how:'A 20–30m run-in, then time a flat-out 20m flying zone. Relax and roll — this is your true top speed, the single best speed marker.' },
  { n:4, label:'Wall Sit', ex:'Iso Wall Sit', quality:'Lower-body strength-endurance', proto:'Best hold, thighs parallel', gain:'+20–45 s', w:'72%',
    how:'Back flat on the wall, thighs parallel to the floor, knees over ankles. Hold the position and time it until form breaks.' },
  { n:5, label:'Hanging / Bar Hold', ex:'Hanging / Bar Hold', quality:'Grip & shoulder endurance', proto:'Best hold, dead hang', gain:'+15–40 s', w:'66%',
    how:'Hang tall from a bar, shoulders active. Time until the grip gives. Grip and a strong shoulder show up in every battle.' },
];

/* ---------- Progression / Regression (age-appropriate) ---------- */
const PROGREG = [
  ['DB Bulgarian Split Squat','Lower the rear-foot height, or a flat split squat.','Heavier DBs, a pause at the bottom, or a slow eccentric.'],
  ['Banded Squat','Lighter band, or a clean bodyweight squat.','Heaviest band, slower eccentric, or a faster drive up.'],
  ['SL DB RDL','Touch the back toe for balance, or lighter DB.','Heavier DB, a pause at the bottom, or a deeper reach.'],
  ['Broad Jump → Sprint 10m','Just the jump — stick and hold, no sprint.','Add the sprint, then chase more distance with clean landings.'],
  ['Contrast Jump','Drop the banded set — free jumps only, full rest.','Heavier band on the loaded set, then explode into the free jumps.'],
  ['Depth Drop (Low Box)','Lower the box, or step down and just stick — no rebound.','A slightly higher box, only when every landing is silent.'],
  ['Lateral Depth Drop to Bound','Step off and STICK the landing — no rebound — until it is silent and balanced.','Add the lateral rebound, then a little more distance.'],
  ['Continuous Lateral Bound','Add a brief stick between each bound, or fewer reps.','More reps or distance — keep the outside-leg landings soft and silent.'],
  ['Copenhagen Plank — Long','Shorten the lever (bottom knee down, or top foot lower) to scale.','Lengthen the hold, then the longest lever — only when it is easy and pain-free.'],
  ['Archer Push-Up','Less weight-shift, or a flat push-up.','More shift toward one arm, or a deficit for range.'],
  ['Renegade Row','Lighter DB, or wider feet for stability.','Heavier DB, or feet together for more anti-rotation.'],
  ['DB Push Press','Lighter DBs, or a strict press.','Heavier DBs, or a faster, more aggressive leg drive.'],
  ['Rotational Med Ball Toss','Lighter ball, technical speed.','Heavier ball, or throw more explosively from the hips.'],
  ['Dragon Flag Negatives','Bend the knees, or lower only to a tuck.','Straighter body, slower eccentric, then add reps.'],
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
        <div class="cover-eyebrow">Off-Ice Speed, Power &amp; Conditioning for Hockey · AGES 15–18 · Train to Compete</div>
        <h1 class="display cover-h1">BUILD<br><span class="amp serif">&amp;</span> COMPETE<span class="dot">.</span></h1>
        <p class="serif cover-tagline">The off-ice engine that shows up on the ice — speed, power, and the will to compete.</p>
      </div>
      <div class="cover-stats"><div class="stat"><div class="stat-num display" data-count="8">8</div><div class="stat-lab">WEEKS</div></div><div class="stat"><div class="stat-num display" data-count="4">4</div><div class="stat-lab">SESSIONS / WK</div></div><div class="stat"><div class="stat-num display" data-count="32">32</div><div class="stat-lab">SESSIONS</div></div><div class="stat"><div class="stat-num display" data-count="2">2</div><div class="stat-lab">BLOCKS</div></div></div>
      <div class="cover-foot">
        <div class="cover-coach"><span class="cc-by">PROGRAMMED BY</span><span class="cc-name display">Coach David Ciboch</span><span class="cc-cred">M.Ed. Sport Science · S&amp;C, UAE National Ice Hockey Team</span></div>
        <div class="cover-handle">@ELITE_HOCKEY_DRILLS<br>elitehockeydrills.com</div>
      </div>
    </section>`;
}

function welcome() {
  return `
    <section class="sheet" id="welcome">
      <header class="sec-head"><div class="eyebrow ice">Read This First · For Players &amp; Parents</div><h2 class="sec-title"><span class="st-lead">THE OFF-ICE</span><span class="st-accent serif">engine.</span></h2></header>
      <p class="lead">This is the off-ice work for a serious 15–18 player: eight weeks to get faster, more powerful, more durable, and harder to play against — built with bands, bodyweight, dumbbells, and open space. It is the engine that shows up in your stride, your first step, and your third period.</p>
      <div class="prose"><p>By 15–18 most players can train with real intent. Your training age is higher, your nervous system can handle maximal-effort speed and power, and the goal stops being &ldquo;learn to move&rdquo; and becomes &ldquo;express it, under pressure, at speed.&rdquo; So this program leads with sprint mechanics and maximal-velocity running, then full-amplitude jumps, contrast power, and change-of-direction — backed by single-leg strength, a bulletproof groin, and a hockey conditioning base.</p><p>Be clear about what this is. It is a <b>supplementary off-ice program</b> — the speed, power, conditioning, and movement half of your development. It is not a maximal-strength gym program, because it is built to run anywhere with minimal kit, and minimal kit has a ceiling. If you also have access to a barbell and a coach, this runs <i>alongside</i> that heavy strength work, not instead of it. If you do not, this is the highest-quality off-ice training you can do with what you have — and done with real intent, that builds a serious athlete.</p><p>Four sessions a week, eight weeks, two four-week blocks, about 55–70 minutes each. Block 1 builds the foundation and turns speed into a trained skill. Block 2 turns it into power you can express in a game.</p></div>
      <div class="callout warm">
        <div class="callout-h display">Honest expectations</div>
        <p>Eight weeks of this, trained with intent, makes you measurably faster, more explosive, more powerful side-to-side, and better-conditioned — and your checkpoints will show it. What it will not do is build a maximal back-squat or deadlift; that needs a barbell. Train this for what it is — the best off-ice engine you can build with bands and bodyweight — and pair it with gym strength work when you can.</p>
      </div>
      <div class="rules">
        <div class="rules-h display">TWO RULES · NON-NEGOTIABLE</div>
        <div class="rule"><span class="rule-n display">01</span><p>Speed and power come first, while you are fresh, at full intent and full rest. Never bury your sprint and jump work under fatigue — quality reps build fast players; junk reps build tired ones.</p></div><div class="rule"><span class="rule-n display">02</span><p>The groin and single leg are trained every week, on purpose. That is where skating lives and where players break down. If you are still growing fast, or your knees, heels, or back ache, cut the impact volume and lean on the strength and mobility work — managing load is what lets you train hard for years.</p></div>
      </div>
    </section>`;
}

function method() {
  const pillars = [
    ['Speed is a trained skill','Sprinting, cutting, and bounding are coached like stickhandling — mechanics first, then maximal intent. Most players have never been taught to run fast. Here you are, and it transfers straight to your stride.'],
    ['Power on full rest','Jumps, bounds, throws, and sprints are about crisp, maximal reps with full recovery — never grinding to fatigue. You train the nervous system to fire hard and fast, which is exactly what explosive hockey demands.'],
    ['Single-leg is king','Skating is a single-leg sport. Loaded single-leg strength — split squats, step-ups, one-leg hinges — is the backbone of the strength work, and the most transferable strength a skater can build off the ice.'],
    ['Protect the groin','Adductor and single-leg work appears every week. The groin is where hockey players most often break down; we build it on purpose so you stay on the ice.'],
    ['Built around the shift','Power has to repeat. The finishers are short, repeatable, shift-length bursts and competitive games that train you to express speed and power again and again, deep into a game.'],
    ['Honest about the kit','Bands, bodyweight, and dumbbells build a huge amount of speed, power, and conditioning — and they have a ceiling for maximal strength. We lean all the way into the first and are straight with you about the second.'],
  ];
  return `
    <section class="sheet" id="method">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">01</span><span class="eyebrow ice">The Method</span></div><h2 class="sec-title"><span class="st-lead">WHY THIS</span><span class="st-accent serif">works.</span></h2></header>
      <p class="lead">This is not a random circuit. It is the off-ice speed-and-power half of a serious 15–18 player&rsquo;s development — sequenced to make you faster, more explosive, and harder to play against over eight weeks.</p>
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
      <text class="fv-shift" x="388" y="196" text-anchor="start">MORE EXPLOSIVE</text>
      <text class="fv-axis" transform="rotate(-90 54 166)" x="54" y="166" text-anchor="middle">POWER</text>
      <text class="fv-axis" x="390" y="324" text-anchor="middle">SPEED →</text>
    </svg>
    <div class="fv-legend">
      <span class="fv-key"><i class="fvline now"></i><b>Now</b><em>where you start</em></span>
      <span class="fv-key"><i class="fvline after"></i><b>After 8 weeks</b><em>faster &amp; more explosive</em></span>
    </div>
    <figcaption>Athleticism is movement quality, power, and speed together. Block 1 builds the speed-and-strength base, Block 2 extends the power and top-end — so the whole curve shifts up and to the right. That shift is a faster, more explosive player who can repeat it all game.</figcaption>
  </figure>
    </section>`;
}

function roadmap() {
  return `
<aside class="pullquote"><p class="serif">Train the speed and the power first, while you are fresh. Strength and conditioning back it up — they never bury it.</p><span class="pq-by">The Method</span></aside>

    <section class="sheet" id="roadmap">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">02</span><span class="eyebrow ice">The Roadmap</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">eight weeks.</span></h2></header>
      <p class="lead">Two blocks of four weeks. Intensity climbs to a peak, then unloads — so you arrive at each checkpoint sharp and fast, not buried.</p>
      <div class="road-blocks">
          <div class="road-block">
            <div class="rb-tag">BLOCK 1 · WEEKS 1–4</div>
            <h3 class="display rb-name">FOUNDATION &amp; SPEED</h3>
            <p class="serif rb-line">“Train the engine.”</p>
            <p class="rb-desc">Sprint mechanics, acceleration, and elastic bounds taught at full intent, backed by heavy single-leg strength and a hockey conditioning base. Intensity builds W1→W3 (peak), then W4 deloads and you re-check.</p>
          </div>
          <div class="road-block">
            <div class="rb-tag">BLOCK 2 · WEEKS 5–8</div>
            <h3 class="display rb-name">POWER &amp; COMPETE</h3>
            <p class="serif rb-line">“Express it in a game.”</p>
            <p class="rb-desc">Full-amplitude and reactive plyometrics, contrast power, max-velocity sprinting, and change-of-direction — finished with competition. Intensity peaks W6→W7, then W8 tapers into the final checkpoint.</p>
          </div>
      </div>
    </section>`;
}

function howto() {
  const arch = [
    ['1','WARM-UP (RAMP)','10 min','Raise, Activate, Mobilize, Prime. The standard warm-up on its own page — done before every single session.'],
    ['2','Speed &amp; Power','14–18 min','Sprint mechanics, agility, jumps, and throws — done first, fresh, at full intent. This is the priority. Crisp reps, full rest.'],
    ['3','Main Work','22–28 min','The day&rsquo;s single-leg strength, hinge, push/pull, and core. Real load, controlled tempo, full rest. Never grind to failure.'],
    ['4','Compete &amp; Finish','8–12 min','A short competitive game or a hockey-specific conditioning burst — where you learn to repeat your power under fatigue.'],
    ['5','Cool-Down','4–6 min','Down-regulate. Slow nasal breathing and a short mobility flow to start recovery before you walk out.'],
  ];
  return `
    <section class="sheet" id="howto">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">03</span><span class="eyebrow ice">How To Use This</span></div><h2 class="sec-title"><span class="st-lead">EVERY</span><span class="st-accent serif">session.</span></h2></header>
      <p class="lead">All 32 sessions share the same five-part shape. Run them in order. Total time: about 55–70 minutes.</p>
      <div class="arch">
        ${arch.map(([n, name, mins, p]) => `<div class="arch-row"><span class="arch-n display">${n}</span><div class="arch-body"><div class="arch-h"><span class="arch-name">${name}</span><span class="arch-mins">${mins}</span></div><p>${p}</p></div></div>`).join('')}
      </div>
      <div class="legend">
        <div class="legend-h display">HOW EACH EXERCISE READS</div>
        <p class="legend-intro">Every exercise is written as a quick spec sheet. Read it the same way each time:</p>
        <div class="legend-row"><div class="legend-key">01  EXERCISE — NAME</div><div class="legend-val">The movement. The name is a live link — tap it for the full video demo, cues, and common mistakes on the site.</div></div><div class="legend-row"><div class="legend-key">SETS × REPS</div><div class="legend-val">How many work sets, and reps (or seconds / metres) per set. &ldquo;/side&rdquo; means per leg or per arm. A range means pick what you can do cleanly and fast today.</div></div><div class="legend-row"><div class="legend-key">TEMPO / CUE</div><div class="legend-val">The middle tag is the quality cue — &ldquo;X&rdquo; means move fast and explosive; &ldquo;3010&rdquo; is a tempo in seconds (lower / pause / up / pause); &ldquo;stick&rdquo; means land and freeze; &ldquo;medium / heavy&rdquo; is band or dumbbell load. Load is real, but never at the cost of speed or clean technique.</div></div><div class="legend-row"><div class="legend-key">REST</div><div class="legend-val">Recovery before the next set. Power and speed rest is long on purpose — you are training maximal output, not chasing a burn.</div></div>
      </div>
    </section>`;
}

function kit() {
  const items = [
    ['01','Loop resistance band set','Light, medium, and heavy. The variable tension is most of your strength and power load — and with a heavy band, it is no joke. The backbone of the program.'],
    ['02','Light–moderate dumbbells','A pair you can press, hinge, and split-squat with control. The single-leg and complex work is where these earn their keep. Heavier is better here than for bands — but it is still not a barbell.'],
    ['03','A low box or sturdy bench','Knee height or lower. For step-ups, step-downs, rear-foot-elevated split squats, and low-box landings and depth drops.'],
    ['04','~30 metres of open space','A driveway, turf, garage, or field. Enough to accelerate, hit top speed, bound, run a shuttle, and play a reaction game. A small hill is a bonus.'],
  ];
  return `
    <section class="sheet" id="kit">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">04</span><span class="eyebrow ice">What You&rsquo;ll Need</span></div><h2 class="sec-title"><span class="st-lead">THE</span><span class="st-accent serif">kit.</span></h2></header>
      <p class="lead">Minimal on purpose — this program goes anywhere. Bands, dumbbells, a box, and space build a serious off-ice engine. What it does not include is a barbell, and that is the honest line: this is your speed, power, and conditioning work, not your maximal-strength gym work. Run them together when you can.</p>
      <div class="kit-grid">
        ${items.map(([n, h, p]) => `<div class="kit-item"><span class="kit-n display">${n}</span><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
      <p class="kit-note serif">A skipping rope, a pull-up bar, a medicine ball, and a partner to compete with are used here and well worth having — but the core of the program runs on a heavy band, a box, and open ground.</p>
    </section>`;
}

function ramp() {
  return `
    <section class="sheet" id="ramp">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">05</span><span class="eyebrow ice">Before Every Session</span></div><h2 class="sec-title"><span class="st-lead">THE RAMP</span><span class="st-accent serif">warm-up.</span></h2></header>
      <p class="lead">Raise. Activate. Mobilize. Prime. About 10 minutes, every session, no exceptions. Done right, it is also your daily mobility and groin-prep work — a big part of staying healthy and fast.</p>
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
          <div class="cd-kick">After every session · 4–6 min</div>
          <h2 class="display cd-title">THE COOL-DOWN</h2>
          <p class="lead">Shift out of go-mode and into recovery. Slow the breath first, then move gently through range.</p>
          <ul class="cd-list">${COOLDOWN.map(n => `<li>${exLink(n)}</li>`).join('')}</ul>
        </div>
        <div class="cd-col screen-col">
          <div class="cd-kick">A 60-second readiness check, before you train hard</div>
          <h2 class="display cd-title">THE READINESS CHECK</h2>
          <p class="lead">You train at real intensity now, so train smart. This is a quick self-check before the high-output work — not a clearance exam. A &ldquo;yes&rdquo; means dial today back and lean on the lower-impact work.</p>
          <ul class="screen-list"><li>Are you short on sleep, run-down, sick, or still wrecked from the last session?</li><li>Do your knees, heels (Achilles), hips, or groin ache during or after jumping and sprinting?</li><li>If you are still growing fast — clothes or skates suddenly too small — is anything newly sore or clumsy?</li><li>Any sharp or pinching pain that gets worse under load or speed?</li></ul>
          <p class="screen-note serif">Any &ldquo;yes&rdquo; is information, not weakness. Cut the impact and sprint volume, skip the depth and reactive work, lean on strength, mobility, and easy conditioning — and see a qualified professional for sharp pain that worsens under load. Pushing through the wrong pain is how a season ends early.</p>
        </div>
      </div>
    </section>`;
}

function tests() {
  const cards = CHECKS.map(c => `
          <div class="test-card">
            <div class="tc-top"><span class="tc-n display">${pad(c.n)}</span><span class="tc-gain">${c.gain}</span></div>
            <h3 class="tc-name">${exLinkAs(c.ex, c.label || c.ex)}</h3>
            <div class="tc-quality">${c.quality}</div>
            <div class="tc-proto">${c.proto}</div>
            <p class="tc-how">${c.how}</p>
            <div class="tc-gauge" aria-hidden="true">
              <div class="tcg-head"><span class="tcg-label">8-Week Target</span><span class="tcg-val">▲ ${c.gain}</span></div>
              <div class="tcg-bar"><span style="--w:${c.w}"></span></div>
            </div>
          </div>`).join('');
  const baselineRows = CHECKS.map(c => `<tr><td class="tname">${exLinkAs(c.ex, c.label || c.ex)}</td><td class="tdim">${c.quality}</td><td></td><td></td><td></td><td class="hi"></td></tr>`).join('');
  return `
    <section class="sheet" id="tests">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">06</span><span class="eyebrow ice">The Checkpoints</span></div><h2 class="sec-title"><span class="st-lead">CHECK.</span><span class="st-accent serif">don&rsquo;t guess.</span></h2></header>
      <p class="lead">Five performance checkpoints, no gym required, each tied to a hockey quality and each one improvable in eight weeks. Test honestly — same shoes, same surface, fully rested — and let the numbers, not your ego, tell you what is working. Run the full set three times: Week 0 (baseline), Week 4 (mid-block), Week 8 (final).</p>
      <p class="proto-note serif">Warm up with the RAMP first, every time. Score honestly and write it down. If anything sharpens under load or speed, stop and note it — pain is never a checkpoint to push through.</p>
      <div class="test-grid">
        ${cards}
      </div>
      <div class="checkpoints">3 CHECKPOINTS · WEEK 0 → WEEK 4 → WEEK 8</div>

    <div class="scorecard">
      <div class="sc-head"><h3 class="display">WEEK 0 — BASELINE</h3><span class="sc-sub serif">Test before you train. This is the athlete you are about to beat.</span></div>
      <table class="sc-table"><thead><tr><th>Checkpoint</th><th>Hockey quality</th><th>Att 1</th><th>Att 2</th><th>Att 3</th><th class="hi">Best</th></tr></thead><tbody>${baselineRows}</tbody></table>
      <p class="sc-note">Note the best of your attempts, plus a word on quality. Re-check on the same surface, shoes, and method each time.</p>
    </div>
    </section>
<aside class="pullquote"><p class="serif">The numbers do not lie and they do not flatter. Test honestly, train hard, and let eight weeks do the talking.</p><span class="pq-by">Check. Don&rsquo;t guess.</span></aside>`;
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

function scorecard(id, head, sub, cols, targetKey) {
  const th = cols.map(c => `<th${c.hi ? ' class="hi"' : ''}>${c.h}</th>`).join('');
  const rows = CHECKS.map(c => {
    const cells = cols.slice(1).map(col => {
      if (col.target) return `<td class="tdim">${c.gain}</td>`;
      if (col.hi) return `<td class="hi"></td>`;
      return `<td></td>`;
    }).join('');
    return `<tr><td class="tname">${exLinkAs(c.ex, c.label || c.ex)}</td>${cells}</tr>`;
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
      <p class="lead">For each main movement: a sane regression if it is not clean or fast yet, and a harder progression once it is. Earn the next step — chasing load before quality is how players stall and get hurt.</p>
      <div class="pr-table">
        <div class="pr-row pr-headrow"><div class="pr-name">Movement</div><div class="pr-reg">Regression</div><div class="pr-prog">Progression</div></div>
        ${rows}
      </div>
    </section>`;
}

function recovery() {
  const cards = [
    ['Sleep','8–10 hours, consistently. Sleep is when training turns into adaptation — speed, power, and strength are all built while you are unconscious. Cut sleep and you cut your gains, your reaction time, and your durability.'],
    ['Fuel','Eat enough, with protein at every meal and carbohydrate around training. You are fuelling high-output work and, for some of you, still growing — do not under-eat. Real food, plenty of it.'],
    ['Hydration','Drink across the day, not just at training. Even mild dehydration drops power output, sprint speed, and focus — all the things this program is built to raise.'],
    ['Manage the load','Soreness that lingers, aching knees or groin, or sluggish sprints mean back off the impact and intensity for a day. The deload and taper are built in for exactly this — and an extra rest day is always allowed.'],
  ];
  return `
    <section class="sheet" id="recovery">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">09</span><span class="eyebrow ice">Recovery</span></div><h2 class="sec-title"><span class="st-lead">WHERE GAINS</span><span class="st-accent serif">land.</span></h2></header>
      <p class="lead">Training is the stimulus; sleep and food are where it becomes a faster, more powerful athlete. Train hard, recover harder — the players who last are the ones who take this page as seriously as the sessions.</p>
      <div class="rec-grid">
        ${cards.map(([h, p]) => `<div class="rec-card"><h3 class="display">${h}</h3><p>${p}</p></div>`).join('')}
      </div>
    </section>`;
}

function mindset() {
  const rows = [
    ['Speed and power lead.','The sprint, jump, and throw work comes first, fresh, at full intent. Protect it — never push it back behind the tiring work. Fast reps build fast players.'],
    ['Quality gates load.','The set and rep targets are a ceiling, not a quota. Hit them clean and fast or stop the set. A crisp, powerful rep beats a grinding one every time.'],
    ['Earn the load.','Add weight, band tension, or jump amplitude only once the movement is clean and fast. Ego-loading a sloppy lift is how players stall and get hurt.'],
    ['Respect the deload and taper.','Weeks 4 and 8 pull back on purpose. Do not add work because you feel good — feeling fresh and fast is the point, and it is what your checkpoints will show.'],
    ['Compete every session.','Finish with a game or a shift-length battle. Competing while you move fast and well is the whole point — that is what shows up on the ice.'],
  ];
  return `
    <section class="sheet" id="mindset">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">10</span><span class="eyebrow ice">Mindset &amp; Rules</span></div><h2 class="sec-title"><span class="st-lead">HOW TO</span><span class="st-accent serif">train this.</span></h2></header>
      <p class="lead">You are building the athlete who shows up next season. Train accordingly — with intent, with honesty, and with patience.</p>
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
          <div class="about-bio"><p>David Ciboch is a strength and conditioning specialist with a Master&rsquo;s in Sport Science and more than ten years coaching athletes from youth to the international level.</p><p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put genuine, national-team-level off-ice training in the hands of players who do not have a pro setup — just a band, a box, and the will to get better.</p><p>This is the off-ice work he would program for an ambitious 15–18 player who wants to be faster and more explosive but trains away from a full gym: speed and power first, single-leg strength and a bulletproof groin underneath, and an honest line about pairing it with barbell work when you have it.</p></div>
          <div class="about-creds"><div class="ac-h display">CREDENTIALS</div><ul><li>M.Ed. Sport Science</li><li>S&amp;C Coach — UAE National Ice Hockey Team</li><li>10+ years coaching, youth to international</li><li>PE &amp; Sport Science teacher</li><li>Founder, Elite Hockey Drills</li></ul></div>
        </div>
      </div>
    </section>`;
}

function next() {
  return `
    <section class="sheet" id="next">
      <header class="sec-head"><div class="sec-kicker"><span class="sec-num display">12</span><span class="eyebrow ice">What&rsquo;s Next</span></div><h2 class="sec-title"><span class="st-lead">KEEP</span><span class="st-accent serif">building.</span></h2></header>
      <p class="lead">You built a faster, more explosive engine in eight weeks. Here is how you keep building on it.</p>
      <div class="next-grid">
        <div class="next-card"><h3 class="display">Add the barbell</h3><p>This program is the off-ice speed-and-power half of your development. The other half is maximal strength — a heavy squat, hinge, press, and pull-up, coached properly in a gym. If you have access to a barbell and a coach, add a strength program alongside this one; the two together are how serious players get genuinely powerful.</p></div>
        <div class="next-card"><h3 class="display">In-season &amp; the app</h3><p>In-season, you do not need this full volume — a couple of short sessions a week of the highest-value work here (sprints, a few jumps, single-leg strength, groin care) keeps it sharp. And everything here — every demo, your checkpoints, auto-progressing sessions — is coming to the Elite Hockey Drills app, so the program lives in your pocket and tracks itself.</p></div>
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
const TITLE = 'BUILD &amp; COMPETE — 8-Week Off-Ice Hockey Program · Ages 15–18 · Elite Hockey Drills';
const METADESC = 'An 8-week, 4-day off-ice speed, power &amp; conditioning program for hockey players ages 15–18. Bands, bodyweight &amp; dumbbells — the off-ice engine. Built by Coach David Ciboch.';

let head = SRC.slice(0, SRC.indexOf('</head>') + '</head>'.length);
head = head.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
head = head.replace(/<meta name="description"[^>]*\/>/, `<meta name="description" content="${METADESC}" />`);

const coverB64 = (SRC.match(/cover-photo"[^>]*url\('data:image\/jpeg;base64,([^']+)'/) || [])[1];
const aboutB64 = (SRC.match(/about-visual"><img src="data:image\/jpeg;base64,([^"]+)"/) || [])[1];
if (!coverB64 || !aboutB64) throw new Error('Failed to extract embedded images (cover/about).');

const sStart = SRC.lastIndexOf('<script>');
const sEnd = SRC.indexOf('</script>', sStart) + '</script>'.length;
const closingScript = SRC.slice(sStart, sEnd);

/* Build sections IN DOCUMENT ORDER, but glossary() must run last (after `used` is full). */
const sCover = cover(coverB64);
const sWelcome = welcome();
const sMethod = method();
const sRoadmap = roadmap();
const sHowto = howto();
const sKit = kit();
const sRamp = ramp();
const sCooldown = cooldown();
const sTests = tests();
const sBlock1 = blockIntro('07', 1, 'BLOCK 1 · WEEKS 1–4', 'FOUNDATION &amp; SPEED', '“Train the engine.”', [
  'You arrive as a near-adult athlete who can train with real intent. Block 1 lays the foundation everything else stacks on: sprint mechanics and acceleration taught as a skill, landing-led and elastic plyometrics, and heavy single-leg strength with a groin and posterior-chain bias. The speed and power work is done first and fresh, at full effort and full rest — because that is how fast players are built.',
  'The strength runs on heavy bands and dumbbells with a single-leg focus, and the finishers build a hockey conditioning base. Intensity climbs through Week 3 — the peak — then Week 4 deloads and you re-test. Quality never drops, even on the easy week.',
]);
const sWeeks1to4 = WEEKS.slice(0, 4).map(weekSection).join('');
const sScoreMid = `<section class="sheet" id="scorecard-mid">${scorecard('scorecard-mid', 'WEEK 4 — MID-BLOCK CHECK', 'Halfway. Confirm the engine is improving before Block 2.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 4'}, {h:'Change', hi:true}, {h:'Target / 8 wk', target:true}],
  'Expect measurable gains by now — faster sprints, longer jumps, cleaner sticks. Flat on a check? Look at sleep, fuel, and intent before adding volume.')}</section>`;
const sBlock2 = blockIntro('08', 2, 'BLOCK 2 · WEEKS 5–8', 'POWER &amp; COMPETE', '“Express it in a game.”', [
  'The base is built. Now you express it. The jumps progress to full amplitude and reactive, contrast pairings — banded into free — and the box work for depth drops and lateral rebounds. Speed becomes true max-velocity sprinting and reactive change-of-direction, where you respond to a cue instead of a script. This is the highest-output stretch of the program.',
  'The finishers turn competitive and shift-like: short, repeated bursts and small games that demand you repeat your power under fatigue. Intensity peaks across Weeks 6–7, then Week 8 tapers — volume drops, sharpness stays — and you re-run your checkpoints against Week 0 to measure how far you have come.',
]);
const sWeeks5to8 = WEEKS.slice(4, 8).map(weekSection).join('');
const sScoreFinal = `<section class="sheet" id="scorecard-final">${scorecard('scorecard-final', 'WEEK 8 — FINAL CHECK · YOU vs YOU', 'The proof. Same six checkpoints, eight weeks apart.',
  [{h:'Checkpoint'}, {h:'Week 0'}, {h:'Week 8'}, {h:'Change', hi:true}, {h:'Quality note'}, {h:'Target', target:true}],
  'Note the change and how it feels — faster, springier, more relentless. This is the work showing up in numbers.')}</section>
<aside class="pullquote"><p class="serif">Train the engine. Then express it — in a game, on the ice, on purpose.</p><span class="pq-by">Coach David Ciboch</span></aside>`;
const sProgreg = progreg();
const sRecovery = recovery();
const sMindset = mindset();
const sAbout = about(aboutB64);
const sNext = next();
const sGlossary = glossary(); // LAST — `used` is now fully populated

const footer = `
    <footer class="doc-footer">
      <div class="df-brand display">ELITE HOCKEY DRILLS</div>
      <div class="df-line">8-WEEK OFF-ICE PROGRAM · AGES 15–18 · @ELITE_HOCKEY_DRILLS</div>
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
fs.writeFileSync('program-15-18-office.html', out);

/* ====================================================================
   VERIFICATION REPORTS
   ==================================================================== */
console.log('WROTE program-15-18-office.html  (' + out.length + ' bytes)');
console.log('Unique exercises used:', used.size, '/', pool.length);

// (a) Category coverage
const catUsed = {}, catTotal = {};
pool.forEach(p => { catTotal[p.cat] = (catTotal[p.cat] || 0) + 1; });
[...used].forEach(n => { const c = byName[n].cat; catUsed[c] = (catUsed[c] || 0) + 1; });
console.log('\n=== CATEGORY COVERAGE (used / total) ===');
Object.keys(catTotal).forEach(c => console.log('  ' + (catUsed[c] || 0) + '/' + catTotal[c] + '  ' + c + ((catUsed[c] || 0) === 0 ? '   <-- UNUSED CATEGORY' : '')));

// (b) Unused pool exercises (informational)
const unused = pool.map(p => p.name).filter(n => !used.has(n));
console.log('\n=== UNUSED POOL EXERCISES (' + unused.length + ') ===');
console.log(unused.map(n => '  - ' + n + ' [' + byName[n].cat + ']').join('\n'));

// (c) Verbatim-repeat check: same day vs same day previous week
console.log('\n=== VERBATIM-REPEAT CHECK (same day, week N vs N-1) ===');
const sig = d => [...d.skill, ...d.main, ...d.compete].map(e => e.ex).join(' | ');
let repeats = 0;
for (let i = 1; i < WEEKS.length; i++) {
  WEEKS[i].days.forEach((d, j) => {
    const prev = WEEKS[i - 1].days[j];
    if (prev && sig(d) === sig(prev)) { repeats++; console.log('  REPEAT: Week ' + WEEKS[i].n + ' Day ' + d.d + ' identical to Week ' + WEEKS[i - 1].n); }
  });
}
console.log(repeats === 0 ? '  OK — no session repeats the prior week verbatim.' : '  ' + repeats + ' verbatim repeat(s) found.');

// (d) Session count
const sessionCount = WEEKS.reduce((a, w) => a + w.days.length, 0);
console.log('\nSessions:', sessionCount, '(expected 32)');





