import fs from 'node:fs';

const html = fs.readFileSync('program-9-11-office.html', 'utf8');
const ex = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const bySlug = new Map(ex.map(e => [e.slug, e]));

// Extract glossary gi-items: slug (from href), name, cue
const re = /exercises\/([^"]+)"[^>]*>([^<]+)<span class="lk"[^>]*>↗<\/span><\/a><\/div>\s*<div class="gi-cue">([\s\S]*?)<\/div>/g;
const entries = [];
let m;
while ((m = re.exec(html)) !== null) {
  const slug = m[1];
  const name = m[2].trim();
  const cue = m[3].trim();
  entries.push({ slug, name, cue });
}

let truncated = 0, stub = 0, ok = 0, noSource = 0;
const flagged = [];
for (const e of entries) {
  const src = bySlug.get(e.slug);
  const isTrunc = e.cue.endsWith('…') || e.cue.endsWith('...');
  const isStub = !isTrunc && e.cue.length < 80;
  if (isTrunc) truncated++; else if (isStub) stub++; else ok++;
  if (!src) noSource++;
  if (isTrunc || isStub) {
    flagged.push({ slug: e.slug, name: e.name, reason: isTrunc ? 'truncated' : 'stub', cueLen: e.cue.length, cue: e.cue, hasSource: !!src, execution: src ? src.execution : null });
  }
}

console.log(`Glossary entries: ${entries.length}`);
console.log(`  truncated(…): ${truncated}  stub(<80): ${stub}  ok: ${ok}`);
console.log(`  flagged total: ${flagged.length}  | flagged WITHOUT source in exercises.json: ${flagged.filter(f=>!f.hasSource).length}`);
console.log('--- flagged without source (need manual) ---');
console.log(flagged.filter(f=>!f.hasSource).map(f=>`${f.slug} | ${f.name} | ${f.reason} | "${f.cue}"`).join('\n') || '(none)');
fs.writeFileSync('_glossary_flagged.json', JSON.stringify(flagged, null, 2));
console.log(`\nWrote ${flagged.length} flagged entries (with execution source) to _glossary_flagged.json`);
