#!/usr/bin/env node
/**
 * Elite Hockey Drills — Video Thumbnail Generator
 * ------------------------------------------------
 * Google will NOT index a video without a thumbnail image. Your demo videos are
 * MP4s hosted on Cloudflare R2 with no thumbnails, so this script grabs one frame
 * from each video and saves it as assets/video-thumbs/<slug>.jpg.
 *
 * generate.js then automatically:
 *   - adds VideoObject structured data to each exercise page that has a thumbnail
 *   - sets the <video poster="...">
 *   - adds <video:video> entries to sitemap.xml
 *
 * REQUIREMENTS:  Node 18+  and  ffmpeg installed and on your PATH.
 *   Check with:  ffmpeg -version
 *   Install:     https://ffmpeg.org/download.html  (Windows: winget install Gyan.FFmpeg)
 *
 * USAGE (run from the Website/ folder, on a normal internet connection):
 *   node make-video-thumbs.mjs            # generate missing thumbnails
 *   node make-video-thumbs.mjs --force    # regenerate ALL thumbnails
 *   node make-video-thumbs.mjs --at=1.5   # grab the frame at 1.5s (default: 1.0س)
 *
 * Then rebuild and deploy:
 *   node generate.js
 *   git add assets/video-thumbs sitemap.xml exercises library.html
 *   git commit -m "Add video thumbnails + VideoObject schema + video sitemap"
 *   git push        # Netlify redeploys automatically
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

const FORCE   = process.argv.includes('--force');
const atArg   = process.argv.find(a => a.startsWith('--at='));
const AT_SEC  = atArg ? parseFloat(atArg.split('=')[1]) : 1.0;   // seconds into the clip
const CONCURRENCY = 4;
const MAX_WIDTH   = 1280;

const MAP_FILE = path.resolve('video-map.json');
const OUT_DIR  = path.resolve('assets/video-thumbs');

function die(msg) { console.error('\n✖ ' + msg + '\n'); process.exit(1); }

// --- preflight ----------------------------------------------------------------
try { await execFileP('ffmpeg', ['-version']); }
catch { die('ffmpeg not found on PATH. Install it, then re-run. (winget install Gyan.FFmpeg)'); }

if (!fs.existsSync(MAP_FILE)) die('video-map.json not found. Run this from the Website/ folder.');
const videoMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const entries = Object.entries(videoMap).filter(([, url]) => url && /\.mp4(\?|$)/i.test(url));
if (!entries.length) die('No .mp4 URLs found in video-map.json.');

console.log(`\nElite Hockey Drills — thumbnail generator`);
console.log(`  videos in map : ${entries.length}`);
console.log(`  frame at      : ${AT_SEC}s`);
console.log(`  output        : assets/video-thumbs/`);
console.log(`  mode          : ${FORCE ? 'FORCE (regenerate all)' : 'missing only'}\n`);

// --- worker -------------------------------------------------------------------
async function makeOne(slug, url) {
  const out = path.join(OUT_DIR, `${slug}.jpg`);
  if (!FORCE && fs.existsSync(out)) return { slug, status: 'skip' };
  // -ss before -i = fast seek; grab 1 frame; scale to max width keeping aspect (even height).
  const args = [
    '-y', '-ss', String(AT_SEC), '-i', url,
    '-frames:v', '1',
    '-vf', `scale='min(${MAX_WIDTH},iw)':-2`,
    '-q:v', '3',
    out,
  ];
  try {
    await execFileP('ffmpeg', args, { timeout: 120000 });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('empty output');
    return { slug, status: 'ok' };
  } catch (e) {
    return { slug, status: 'fail', error: (e.message || '').split('\n')[0] };
  }
}

// --- simple concurrency pool --------------------------------------------------
let i = 0, ok = 0, skip = 0, fail = 0;
const failures = [];
async function worker() {
  while (i < entries.length) {
    const [slug, url] = entries[i++];
    const r = await makeOne(slug, url);
    if (r.status === 'ok')   { ok++;   process.stdout.write(`  ✓ ${slug}\n`); }
    if (r.status === 'skip') { skip++; }
    if (r.status === 'fail') { fail++; failures.push(r); process.stdout.write(`  ✖ ${slug} — ${r.error}\n`); }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`\nDone — ${ok} created, ${skip} skipped, ${fail} failed.`);
if (failures.length) {
  console.log('\nFailed slugs (re-run to retry, or check the R2 URL):');
  failures.forEach(f => console.log('  - ' + f.slug));
}
console.log('\nNext:  node generate.js   then commit & push.\n');
