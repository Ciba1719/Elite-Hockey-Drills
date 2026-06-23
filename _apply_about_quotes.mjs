import { readFileSync, writeFileSync } from 'node:fs';

const NEW_P2 = '<p>He served as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and has since worked with athletes across the world — coaching in the Czech Republic, Italy, Austria, Saudi Arabia, Belgium, and Switzerland. He founded Elite Hockey Drills to take that same national-team-level off-ice training online and reach as many athletes as possible — anywhere in the world, with nothing more than a band, a box, and the will to get better.</p>';

// Per-file old bio paragraph 2 (endings differ)
const OLD_P2 = {
  'program-12-14-office.html': '<p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put genuine, national-team-level off-ice training in the hands of players who do not have a pro setup — just a band, a box, and the will to get better.</p>',
  'program-15-18-office.html': '<p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put the same off-ice training he runs with national-team athletes into the hands of players who do not have a pro setup — just a band, a box, and the will to get better.</p>',
  'program-40plus-office.html': '<p>He serves as Strength &amp; Conditioning coach for the UAE National Ice Hockey Team, and works day to day as a Physical Education and Sport Science teacher. He founded Elite Hockey Drills to put genuine, national-team-level off-ice training in the hands of players who do not have a pro setup — just a band, a box, and the will to keep getting better.</p>',
};

// Shared exact replacements (old -> new), applied to every file
const SHARED = [
  ['<li>PE &amp; Sport Science teacher</li>', '<li>Coached athletes across 6+ countries</li>'],
  ['<span class="pq-by">The Method</span>', '<span class="pq-by">Elite Hockey Drills</span>'],
  ['<span class="pq-by">Check. Don&rsquo;t guess.</span>', '<span class="pq-by">Elite Hockey Drills</span>'],
  ['<span class="pq-by">Coach David Ciboch</span>', '<span class="pq-by">Elite Hockey Drills</span>'],
];

let ok = true;
for (const file of Object.keys(OLD_P2)) {
  let html = readFileSync(file, 'utf8');
  const apply = (oldStr, newStr, label) => {
    const n = html.split(oldStr).length - 1;
    if (n !== 1) { console.log(`  ✗ ${label}: expected 1 match, found ${n}`); ok = false; return; }
    html = html.replace(oldStr, newStr);
    console.log(`  ✓ ${label}`);
  };
  console.log(`\n=== ${file} ===`);
  apply(OLD_P2[file], NEW_P2, 'bio para 2');
  for (const [o, nw] of SHARED) apply(o, nw, o.slice(0, 48) + '…');
  writeFileSync(file, html);
}
console.log(ok ? '\nALL REPLACEMENTS OK' : '\n*** SOME REPLACEMENTS FAILED ***');
