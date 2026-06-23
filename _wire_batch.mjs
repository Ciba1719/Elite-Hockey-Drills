// Wire the latest R2 batch into library + office program pages, video-only and
// WIP-preserving. For each slug newly in video-map.json (vs HEAD):
//   library: placeholder -> <video>, OR (if the box was previously removed)
//            re-insert the media slot before <!-- CONTENT SECTIONS -->.
//   programs (office): stage HEAD + data-video; working tree already wired by
//            wire-program-videos.mjs so there's no revert-trap.
// Dirty files: stage HEAD+change, restore the working WIP from a backup.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const OPTS = { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 };
const sh = (c) => execSync(c, OPTS);
const headOf = (f) => { try { return sh(`git show HEAD:${f}`); } catch { return null; } };

const map = JSON.parse(readFileSync('video-map.json', 'utf8'));
let headMap = {}; try { headMap = JSON.parse(headOf('video-map.json') || '{}'); } catch {}
const newSlugs = Object.keys(map).filter((s) => !headMap[s]);
console.log(`New slugs vs HEAD (${newSlugs.length}): ${newSlugs.join(', ')}\n`);

const VID = (u) => `<video class="video-embed" src="${u}" controls playsinline preload="metadata"></video>`;
const PH = /<div class="video-placeholder"[\s\S]*?<\/div>/;
const SLOT = (u) => `<!-- MEDIA SLOT -->\n<div class="media-wrap">\n  <div class="wrap">\n    <div class="media-slot reveal">\n      ${VID(u)}\n    </div>\n  </div>\n</div>\n\n`;
const withVideo = (html, u) => {
  if (/<video class="video-embed"/.test(html)) return html;          // already has a video
  if (PH.test(html)) return html.replace(PH, VID(u));                 // swap placeholder
  if (html.includes('<!-- CONTENT SECTIONS -->')) return html.replace('<!-- CONTENT SECTIONS -->', SLOT(u) + '<!-- CONTENT SECTIONS -->');
  return null;                                                        // can't place
};

const BK = '_vbackup'; if (!existsSync(BK)) mkdirSync(BK);
const bk = (f) => `${BK}/${f.replace(/[\\/]/g, '__')}`;

// ── LIBRARY ──
for (const slug of newSlugs) {
  const f = `exercises/${slug}.html`;
  if (!existsSync(f)) { console.log(`lib  ${slug}: missing file, skip`); continue; }
  const url = map[slug];
  const newWork = withVideo(readFileSync(f, 'utf8'), url);
  if (newWork === null) { console.log(`lib  ${slug}: no slot/placeholder/anchor — SKIP (manual)`); continue; }
  const dirty = sh(`git status --short -- "${f}"`).trim() !== '';
  if (dirty) {
    writeFileSync(f, newWork, 'utf8');                 // working = WIP + video
    copyFileSync(f, bk(f));
    const head = headOf(f);
    const headNew = head === null ? null : withVideo(head, url);
    if (headNew === null) { sh(`git add "${f}"`); console.log(`lib  ${slug}: staged working (not in HEAD or no anchor)`); continue; }
    writeFileSync(f, headNew, 'utf8'); sh(`git add "${f}"`);   // index = HEAD + video
    copyFileSync(bk(f), f);                             // restore working WIP
    console.log(`lib  ${slug}: WIP — staged HEAD+video, edits preserved`);
  } else {
    writeFileSync(f, newWork, 'utf8'); sh(`git add "${f}"`);
    console.log(`lib  ${slug}: staged`);
  }
}

// ── PROGRAMS (office): stage HEAD + data-video for every mapped slug ──
for (const f of ['program-9-11-office.html', 'program-12-14-office.html', 'program-15-18-office.html', 'program-40plus-office.html']) {
  const head = headOf(f); if (head === null || !existsSync(f)) { console.log(`prog ${f}: skip`); continue; }
  copyFileSync(f, bk(f));                               // backup working (already wired)
  let added = 0;
  const out = head.replace(/<a class="ex" href="([^"]*\/exercises\/([a-z0-9-]+))"/g, (full, href, s) => {
    const u = map[s]; if (!u) return full; added++; return `<a class="ex" data-video="${u}" href="${href}"`;
  });
  writeFileSync(f, out, 'utf8'); sh(`git add "${f}"`); copyFileSync(bk(f), f);
  console.log(`prog ${f}: staged HEAD + ${added} data-video`);
}

// ── no-video.json: drop any slug that now has a real video ──
const nv = JSON.parse(readFileSync('no-video.json', 'utf8'));
const reinstated = nv.filter((s) => map[s]);
if (reinstated.length) {
  writeFileSync('no-video.json', JSON.stringify(nv.filter((s) => !map[s]), null, 2) + '\n', 'utf8');
  console.log(`\nno-video.json: removed now-filmed ${reinstated.join(', ')} (${nv.length} -> ${nv.length - reinstated.length})`);
}
sh('git add no-video.json video-map.json');
console.log('\nStaged files:\n' + sh('git diff --cached --name-only'));
