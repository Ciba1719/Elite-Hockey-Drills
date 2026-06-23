// Remove the "Demo video coming soon" media box from the library pages of the
// slugs in no-video.json. Clean pages: edit + stage directly. WIP pages: stage
// HEAD-minus-box but leave the working file at WIP-minus-box (preserves the
// user's other edits, no revert-trap). Idempotent.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OPTS = { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 };
const sh = (c) => execSync(c, OPTS);
const headOf = (f) => sh(`git show HEAD:${f}`);
const stripBox = (html) => {
  const a = html.indexOf('<!-- MEDIA SLOT -->');
  const b = html.indexOf('<!-- CONTENT SECTIONS -->');
  if (a < 0 || b < 0 || b < a) return null;
  return html.slice(0, a) + html.slice(b);
};

const slugs = JSON.parse(readFileSync('no-video.json', 'utf8'));
const BK = '_vbackup'; if (!existsSync(BK)) mkdirSync(BK);

for (const s of slugs) {
  const f = `exercises/${s}.html`;
  if (!existsSync(f)) { console.log(`MISSING ${f}`); continue; }
  const newWork = stripBox(readFileSync(f, 'utf8'));
  if (newWork === null) { console.log(`SKIP ${s}: markers not found / already removed`); continue; }
  const dirty = sh(`git status --short -- "${f}"`).trim() !== '';
  if (dirty) {
    writeFileSync(f, newWork, 'utf8');                       // working = WIP - box
    const bk = `${BK}/${f.replace(/[\\/]/g, '__')}`;
    copyFileSync(f, bk);
    const headStripped = stripBox(headOf(f));
    writeFileSync(f, headStripped, 'utf8'); sh(`git add "${f}"`); // index = HEAD - box
    copyFileSync(bk, f);                                     // restore WIP - box
    console.log(`WIP  ${s}: staged HEAD-minus-box, your edits preserved`);
  } else {
    writeFileSync(f, newWork, 'utf8'); sh(`git add "${f}"`);
    console.log(`     ${s}: box removed + staged`);
  }
}
sh('git add no-video.json generate.js');
console.log('\nStaged files:\n' + sh('git diff --cached --name-only'));
