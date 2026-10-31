// Merge the translated SVG label files (_ru_work/svg/<page>.svg.ru.json) into
// the page segment files (_ru_work/seg/<page>.ru.json), replacing any v* ids
// already there. Run `node _i18n_ru_tools.mjs inject <pages>` afterwards.
import fs from 'fs';
import path from 'path';

const SEG = path.join('_ru_work', 'seg');
let pages = 0, labels = 0, problems = [];
// extra segment series: svg labels (v*) in _ru_work/svg, late additions (x*) in _ru_work/x
const SOURCES = [['svg', '.svg', /^v\d+$/], ['x', '.x', /^x\d+$/]];
for (const [dirName, suffix, idRe] of SOURCES) {
const SVG = path.join('_ru_work', dirName);
if (!fs.existsSync(SVG)) continue;
for (const f of fs.readdirSync(SVG).filter(x => x.endsWith(suffix + '.ru.json'))) {
  const name = f.replace(new RegExp(suffix.replace('.', '\\.') + '\\.ru\\.json$'), '');
  const en = JSON.parse(fs.readFileSync(path.join(SVG, name + suffix + '.en.json'), 'utf8')).segments;
  const ru = JSON.parse(fs.readFileSync(path.join(SVG, f), 'utf8')).segments;
  const ruMap = Object.fromEntries(ru.map(s => [s.id, s.ru]));
  for (const s of en) {
    const v = ruMap[s.id];
    if (typeof v !== 'string' || !v.trim()) { problems.push(`${name} ${s.id}: missing`); continue; }
    if (v === s.en && /\p{L}{4,}/u.test(s.en)) problems.push(`${name} ${s.id}: untranslated "${s.en.slice(0, 40)}"`);
    if (/\p{Script=Latin}\p{Script=Cyrillic}|\p{Script=Cyrillic}\p{Script=Latin}/u.test(v)) problems.push(`${name} ${s.id}: Latin glued to Cyrillic`);
  }
  const segFile = path.join(SEG, name + '.ru.json');
  if (!fs.existsSync(segFile)) { problems.push(`${name}: page segment file missing, skipped`); continue; }
  const seg = JSON.parse(fs.readFileSync(segFile, 'utf8'));
  const kept = seg.segments.filter(s => !idRe.test(s.id));
  seg.segments = kept.concat(en.map(s => ({ id: s.id, ru: ruMap[s.id] ?? s.en })));
  fs.writeFileSync(segFile, JSON.stringify(seg, null, 1), 'utf8');
  pages++; labels += en.length;
}
}
problems.forEach(p => console.log('  ' + p));
console.log(`merged ${labels} svg labels into ${pages} page files${problems.length ? `, ${problems.length} problem(s)` : ''}`);
process.exit(problems.length ? 1 : 0);
