// Add data-video to exercise links in every program*.html, pulling URLs from
// video-map.json (slug -> R2 url). Only ADDS where missing; never changes
// exercise content. Idempotent: a link that already has data-video is skipped
// (its href no longer sits right after class="ex"), so re-runs add nothing.
//   Run:  node wire-program-videos.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const map = JSON.parse(readFileSync(new URL('./video-map.json', import.meta.url), 'utf8'));
const files = readdirSync(new URL('./', import.meta.url)).filter((f) => /^program.*\.html$/.test(f));

let total = 0;
for (const file of files) {
  let added = 0;
  const html = readFileSync(file, 'utf8').replace(
    /<a class="ex" href="([^"]*\/exercises\/([a-z0-9-]+))"/g,
    (full, href, slug) => {
      const url = map[slug];
      if (!url) return full;
      added++;
      return `<a class="ex" data-video="${url}" href="${href}"`;
    },
  );
  if (added > 0) writeFileSync(file, html, 'utf8');
  total += added;
  console.log(`  ${file}: +${added} video${added === 1 ? '' : 's'}`);
}
console.log(`\nTotal data-video added across program pages: ${total}`);
