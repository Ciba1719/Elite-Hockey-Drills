import fs from 'node:fs';
const DRY = process.argv.includes('--dry');
const input = JSON.parse(fs.readFileSync('_scale_input.json', 'utf8'));
const out = JSON.parse(fs.readFileSync('_scale_output.json', 'utf8'));
const ex = JSON.parse(fs.readFileSync('exercises.json', 'utf8'));
const bySlug = new Map(ex.map(e => [e.slug, e]));
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// display-name overrides (renamed in Step 7)
const nameOverride = { 'rotational-med-ball-toss': 'Rotational Ball Toss', 'rotational-med-ball-side-toss': 'Rotational Ball Side Toss' };

function row(it) {
  const e = bySlug.get(it.slug);
  const name = nameOverride[it.slug] || it.name;
  const video = (e.video && e.video.trim()) ? e.video.trim() : null;
  const anchorAttrs = video ? `data-video="${video}" ` : '';
  const href = `https://elitehockeydrills.com/exercises/${it.slug}`;
  const o = out[it.slug];
  return `      <div class="pr-row">
        <div class="pr-name"><a class="ex" ${anchorAttrs}href="${href}" target="_blank" rel="noopener">${esc(name)}<span class="lk" aria-hidden="true">↗</span></a></div>
        <div class="pr-reg"><span class="pr-lab reg">EASIER</span> ${esc(o.easier)}</div>
        <div class="pr-prog"><span class="pr-lab prog">HARDER</span> ${esc(o.harder)}</div>
      </div>`;
}

const rows = input.map(row).join('\n');

const anchor = `        <div class="pr-prog"><span class="pr-lab prog">HARDER</span> Longer hold, or reach a little farther under.</div>
      </div>
      </div>
    </section>`;
const replacement = `        <div class="pr-prog"><span class="pr-lab prog">HARDER</span> Longer hold, or reach a little farther under.</div>
      </div>
${rows}
      </div>
    </section>`;

let html = fs.readFileSync('program-9-11-office.html', 'utf8');
if (!html.includes(anchor)) { console.error('ANCHOR NOT FOUND — aborting'); process.exit(1); }
html = html.replace(anchor, replacement);

console.log(`Built ${input.length} rows. Sample:\n`);
console.log([row(input[0]), row(input.find(i=>i.slug==='rotational-med-ball-toss')), row(input.find(i=>!bySlug.get(i.slug).video))].join('\n'));
if (!DRY) { fs.writeFileSync('program-9-11-office.html', html); console.log('\nWROTE program-9-11-office.html'); }
else console.log('\n(dry run)');
