// Stage ONLY video changes vs the last commit (HEAD), leaving every other
// working-tree edit (3D hero, crossover rewording, beep test, program styling)
// uncommitted. Strategy per file: take the HEAD version, apply ONLY the video
// change to it, stage that, then restore the working-tree file from a backup so
// the non-video edits survive in the folder.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';

const OPTS = { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 };
const sh = (c) => execSync(c, OPTS);
const headOf = (f) => { try { return execSync(`git show HEAD:${f}`, OPTS); } catch { return null; } };

const cur = JSON.parse(readFileSync('video-map.json', 'utf8'));
let head = {}; try { head = JSON.parse(headOf('video-map.json') || '{}'); } catch {}
const newSlugs = Object.keys(cur).filter((s) => !head[s]);
console.log(`New video slugs since last publish (${newSlugs.length}): ${newSlugs.join(', ')}\n`);

const BK = '_vbackup';
if (!existsSync(BK)) mkdirSync(BK);
const bkName = (f) => `${BK}/${f.replace(/[\\/]/g, '__')}`;

// ---- LIBRARY pages: HEAD content + the working-tree <video> element ----
for (const slug of newSlugs) {
  const f = `exercises/${slug}.html`;
  if (!existsSync(f)) { console.log(`lib  ${slug}: working file missing, skip`); continue; }
  const headHtml = headOf(f);
  if (headHtml === null) { console.log(`lib  ${slug}: brand-new page (not in last publish), skip from video-only`); continue; }
  const vid = readFileSync(f, 'utf8').match(/<video class="video-embed"[^>]*><\/video>/);
  if (!vid) { console.log(`lib  ${slug}: no <video> in working file, skip`); continue; }
  let out;
  if (/<div class="video-placeholder"/.test(headHtml)) out = headHtml.replace(/<div class="video-placeholder"[\s\S]*?<\/div>/, vid[0]);
  else if (/<video class="video-embed"[^>]*><\/video>/.test(headHtml)) out = headHtml.replace(/<video class="video-embed"[^>]*><\/video>/, vid[0]);
  else { console.log(`lib  ${slug}: no placeholder in HEAD, skip`); continue; }
  copyFileSync(f, bkName(f));
  writeFileSync(f, out, 'utf8'); sh(`git add "${f}"`); copyFileSync(bkName(f), f);
  console.log(`lib  ${slug}: staged HEAD + video (content left at last-published version)`);
}

// ---- PROGRAM pages: HEAD + data-video (regex only hits links missing it) ----
for (const f of ['program-9-11-office.html', 'program-12-14-office.html', 'program-15-18-office.html', 'program-40plus-office.html']) {
  const headHtml = headOf(f);
  if (headHtml === null || !existsSync(f)) { console.log(`prog ${f}: skip`); continue; }
  let added = 0;
  const out = headHtml.replace(/<a class="ex" href="([^"]*\/exercises\/([a-z0-9-]+))"/g, (full, href, s) => {
    const url = cur[s]; if (!url) return full; added++; return `<a class="ex" data-video="${url}" href="${href}"`;
  });
  copyFileSync(f, bkName(f));
  writeFileSync(f, out, 'utf8'); sh(`git add "${f}"`); copyFileSync(bkName(f), f);
  console.log(`prog ${f}: staged HEAD + ${added} data-video`);
}

// ---- video-map.json: pure video data, stage as-is ----
sh('git add video-map.json');
console.log('\nStaged files:\n' + sh('git diff --cached --name-only'));
