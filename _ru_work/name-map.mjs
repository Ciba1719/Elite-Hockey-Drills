// Website exercise slug → Russian name already used in the app (for consistency).
// Matches website exercises.json names against HockeyAPP src/data/exercises.js
// names and takes the Russian name from src/i18n/ru/contentExercises1/2.js.
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const APP = path.resolve('../../HockeyAPP');
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

let appEx;
try {
  appEx = (await import(pathToFileURL(path.join(APP, 'src/data/exercises.js')).href)).default;
} catch (e) {
  const src = fs.readFileSync(path.join(APP, 'src/data/exercises.js'), 'utf8');
  appEx = [...src.matchAll(/\bid:\s*'([a-z0-9_]+)'\s*,\s*\n?\s*name:\s*'((?:\\.|[^'\\])*)'/g)].map(m => ({ id: m[1], name: m[2].replace(/\\'/g, "'") }));
  console.error('import failed (' + e.message.split('\n')[0] + '); regex fallback found ' + appEx.length + ' exercises');
}
const ru1 = (await import(pathToFileURL(path.join(APP, 'src/i18n/ru/contentExercises1.js')).href)).default;
const ru2 = (await import(pathToFileURL(path.join(APP, 'src/i18n/ru/contentExercises2.js')).href)).default;
const ruNames = { ...ru1, ...ru2 };

const byName = new Map();
for (const e of appEx) if (ruNames[e.id]?.name) byName.set(norm(e.name), { id: e.id, en: e.name, ru: ruNames[e.id].name });

const site = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const map = {}; const unmatched = [];
for (const e of site) {
  const hit = byName.get(norm(e.name));
  if (hit) map[e.slug] = { en: e.name, ru: hit.ru, appId: hit.id }; else unmatched.push(e.name);
}
fs.writeFileSync('_ru_work/name-map.json', JSON.stringify(map, null, 1), 'utf8');
console.log(`site exercises: ${site.length}, matched to app: ${Object.keys(map).length}, unmatched: ${unmatched.length}`);
console.log('unmatched sample: ' + unmatched.slice(0, 25).join(' | '));
