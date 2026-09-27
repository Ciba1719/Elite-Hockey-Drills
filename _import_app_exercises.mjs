#!/usr/bin/env node
/**
 * Import app-only exercises (HockeyAPP/src/data) into the website library.
 * ------------------------------------------------------------------------
 * The app has ~440 exercises with filmed demos on Cloudflare R2; the website
 * library (Excel) has ~175. This script takes every app exercise that:
 *   - has an uploaded R2 video (videoManifest UPLOADED_VIDEOS), and
 *   - has deep-dive content (exerciseDetails: why / steps / mistakes / prog / reg), and
 *   - is NOT already on the website (by name, R2 video file, or the SKIP list below)
 * and writes it, in the website's Excel-row shape, to app-exercises.json.
 * It also adds the new slugs to video-map.json so make-video-thumbs.mjs picks them up.
 *
 * generate.js appends app-exercises.json after the Excel rows on every build.
 *
 * USAGE (from Website/):   node _import_app_exercises.mjs   then   node generate.js
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_DATA = path.resolve('../../HockeyAPP/src/data');
const OUT_FILE = path.resolve('app-exercises.json');
const MAP_FILE = path.resolve('video-map.json');

// Near-duplicates of existing website pages — skip so pages don't compete for the same search.
const SKIP = new Set([
  'lateral_bound_stick', 'suitcase_carry', 'med_ball_chest_pass', 'copenhagen_plank', 'goblet_squat',
  'hanging_leg_raise', 'wall_drive', 'wall_sit', 'legs_up_wall', 'clamshell', 'face_pull',
  'ankle_dorsiflexion', 'shoulder_ytw', 'med_ball_rotational_throw', 'a_skip', 'b_skip',
]);

// --- load app data (ESM files with extensionless imports → copy to tmp as .mjs) ---
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ehd-app-'));
for (const f of ['exercises', 'exerciseDetails', 'exerciseRationale', 'videoManifest']) {
  const src = fs.readFileSync(path.join(APP_DATA, `${f}.js`), 'utf8')
    .replace(/from '\.\/([A-Za-z]+)'/g, "from './$1.mjs'");
  fs.writeFileSync(path.join(tmp, `${f}.mjs`), src);
}
const imp = (f) => import(pathToFileURL(path.join(tmp, `${f}.mjs`)).href);
const { default: APP } = await imp('exercises');
const { EXERCISE_DETAILS: D } = await imp('exerciseDetails');
const { EXERCISE_LINES: L } = await imp('exerciseRationale');
const { UPLOADED_VIDEOS: U, VIDEO_BASE } = await imp('videoManifest');

// --- what the website already has ---
const web = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const norm = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
const webNames = new Set(web.map((w) => norm(w.name)));
const webVids = new Set(web.filter((w) => w.video).map((w) => w.video.split('/').pop().replace(/\.mp4$/, '')));

// --- category mapping (app category + name → website category) ---
const has = (name, re) => re.test(name.toLowerCase());
function webCategory(e) {
  const n = e.name;
  switch (e.category) {
    case 'speed':
      if (has(n, /jump|bound|hop|plyo|skater/)) return 'Jump & Plyometric';
      if (has(n, /sled|drag/)) return 'Speed, Sprint & Agility';
      return 'Speed, Sprint & Agility';
    case 'strength-lower':
      if (has(n, /jump/)) return 'Jump & Plyometric';
      if (has(n, /deadlift|rdl|good morning|hip thrust|bridge|nordic|leg curl|walkout|swing|hinge|back extension/)) return 'Hinge / Posterior Chain';
      if (has(n, /lunge|split|step-up|step up|single-leg|pistol|skater squat|cossack|lateral squat/)) return 'Lunge & Single-leg';
      return 'Squat / Knee-dominant';
    case 'strength-upper':
      if (has(n, /row|pull|chin|curl|shrug|wrist roller|rear delt|face/)) return 'Upper Body / Pull';
      return 'Upper Body / Push';
    case 'core':
      if (has(n, /throw|slam|toss|chop|woodchop|rotation|rotational|landmine|shot simulation|scoop|pass/)) return 'Rotational Power';
      if (has(n, /carry|crawl|walk/)) return has(n, /crawl/) ? 'Core & Anti-rotation' : 'Loaded Carries';
      return 'Core & Anti-rotation';
    case 'flexibility': case 'warmup':
      return has(n, /foam roll|stretch/) && !has(n, /dynamic/) ? 'Cool-down / Recovery' : 'Warm-up / Mobility';
    case 'recovery': return 'Cool-down / Recovery';
    case 'aerobic': return 'Energy Systems / Intervals';
    case 'prehab': return 'Prehab / Injury Prevention';
    case 'hockey-specific': return 'Hockey-Specific Dryland';
    default: return 'Full-body & Complexes';
  }
}
function energy(cat, e) {
  if (/Plyometric|Speed|Rotational Power/.test(cat)) return 'Alactic/ATP-PC';
  if (/Warm-up|Cool-down|Prehab/.test(cat)) return 'N/A (mobility/recovery)';
  if (/Energy Systems/.test(cat)) return /sprint|shuttle|shift|tabata/i.test(e.name) ? 'Alactic / glycolytic (repeat-sprint)' : 'Glycolytic / aerobic (mixed)';
  if (/Hockey-Specific/.test(cat)) return e.cnsCost === 'high' ? 'Alactic/ATP-PC' : 'Strength/neural';
  return 'Strength/neural';
}

const sentence = (s) => { s = String(s || '').trim(); return s && !/[.!?]$/.test(s) ? s + '.' : s; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const out = [];
const skipped = { onSite: 0, noVideo: 0, noDetails: 0, listed: 0 };
for (const e of APP) {
  if (SKIP.has(e.id)) { skipped.listed++; continue; }
  if (webNames.has(norm(e.name)) || webVids.has(e.id)) { skipped.onSite++; continue; }
  if (!U.has(e.id)) { skipped.noVideo++; continue; }
  const d = D[e.id];
  if (!d || !d.why || !Array.isArray(d.steps) || !d.steps.length) { skipped.noDetails++; continue; }
  const cat = webCategory(e);
  const lines = L[e.id] || [];
  const transfer = [sentence(e.hockeyBenefit), lines[3] || lines[1] || ''].filter(Boolean).join(' ');
  const cues = String(e.cues || '').split(/,\s*/).map((c) => c.trim()).filter(Boolean)
    .map((c) => `"${cap(c)}"`).join(' · ');
  const prog = [d.progression ? `Progress: ${d.progression}` : '', d.regression ? `Regress: ${d.regression}` : ''].filter(Boolean).join(' | ');
  out.push({
    name: e.name,
    category: cat,
    execution: d.steps.map(sentence).join(' '),
    why: d.why,
    transfer,
    cues,
    mistakes: (Array.isArray(d.mistakes) ? d.mistakes : [d.mistakes]).filter(Boolean).map(sentence).join(' '),
    progression: prog,
    muscles: (e.muscles || []).join(', '),
    energy: energy(cat, e),
    appVideo: `${VIDEO_BASE}/${e.id}.mp4`,
    appId: e.id,
  });
}

// Stable order: by website category order, then name.
const CAT_ORDER = ['Warm-up / Mobility', 'Squat / Knee-dominant', 'Hinge / Posterior Chain', 'Lunge & Single-leg',
  'Upper Body / Push', 'Upper Body / Pull', 'Core & Anti-rotation', 'Jump & Plyometric', 'Speed, Sprint & Agility',
  'Hockey-Specific Dryland', 'Loaded Carries', 'Rotational Power', 'Full-body & Complexes', 'Conditioning / Jump Rope',
  'Energy Systems / Intervals', 'Competitive Play', 'Prehab / Injury Prevention', 'Cool-down / Recovery'];
out.sort((a, b) => (CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category)) || a.name.localeCompare(b.name));
fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + '\n');

// Add slugs to video-map.json (same slug rule as generate.js makeSlug; existing slugs reserved).
const used = new Set(web.map((w) => w.slug));
const slugOf = (name) => { const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); let s = base, n = 2; while (used.has(s)) s = `${base}-${n++}`; used.add(s); return s; };
const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
let added = 0;
for (const x of out) { const s = slugOf(x.name); if (!map[s]) { map[s] = x.appVideo; added++; } }
fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2) + '\n');

const cats = {}; out.forEach((x) => { cats[x.category] = (cats[x.category] || 0) + 1; });
console.log(`app exercises: ${APP.length} → imported ${out.length}`, skipped, `\nvideo-map +${added}`, cats);
