// Give every article 3 distinct, varied "related" cards. Run with --apply to write.
import fs from 'fs';
const APPLY = process.argv.includes('--apply');

const M = {
  cornerstone: {href:'/off-ice-hockey-training.html', img:'/assets/articles/training.jpg', cls:'', cat:'Training', title:'Off-Ice Hockey Training: The Complete Guide', desc:'The full picture: what to train, how often, what gear you need, and age-by-age programs you can run at home.', read:'14 min read'},
  skate: {href:'/how-to-skate-faster.html', img:'/assets/articles/skating-speed.jpg', cls:' is-warm', cat:'Speed', title:'How to Skate Faster', desc:'What actually makes a skater fast, and the off-ice training that builds every piece of it.', read:'12 min read'},
  youth: {href:'/dryland-training-youth-hockey.html', img:'/assets/articles/youth-dryland.jpg', cls:' is-green', cat:'Youth', title:'Dryland Training for Youth Hockey', desc:"A parent's guide: what off-ice training should be at each age, whether it is safe, and how to do it right.", read:'11 min read'},
  mistakes: {href:'/off-ice-training-mistakes.html', img:'/assets/articles/off-ice-mistakes.jpg', cls:'', cat:'Training', title:'Common Off-Ice Training Mistakes to Avoid', desc:'Eight mistakes that quietly hold hockey players back, and the simple fix for each one.', read:'12 min read'},
  blueprint: {href:'/articles/the-off-season-blueprint.html', img:'/assets/articles/hockey_blueprint_medball.jpg', cls:'', cat:'Training', title:'The Off-Season Blueprint', desc:'How to structure your summer week by week so you arrive at tryouts faster and stronger than everyone else.', read:'11 min read'},
  nutrition: {href:'/articles/off-season-nutrition-for-hockey-players.html', img:'/assets/articles/nutrition.jpg', cls:' is-green', cat:'Nutrition', title:'Off-Season Nutrition for Hockey Players', desc:'How much protein you really need, how to build muscle without losing your edge, and the meal structure that fuels real results.', read:'12 min read'},
  sleep: {href:'/articles/sleep-and-recovery-for-hockey-players.html', img:'/assets/articles/recovery.jpg', cls:' is-warm', cat:'Recovery', title:'Sleep & Recovery: The Off-Season Multiplier', desc:'The most underrated training tool you own is free. How sleep makes you faster, sharper, and far less likely to get hurt.', read:'10 min read'},
};
const MAP = {
  'off-ice-hockey-training.html': ['skate','youth','mistakes'],
  'how-to-skate-faster.html': ['cornerstone','mistakes','sleep'],
  'dryland-training-youth-hockey.html': ['cornerstone','mistakes','nutrition'],
  'off-ice-training-mistakes.html': ['cornerstone','skate','blueprint'],
  'articles/the-off-season-blueprint.html': ['cornerstone','nutrition','sleep'],
  'articles/off-season-nutrition-for-hockey-players.html': ['cornerstone','blueprint','sleep'],
  'articles/sleep-and-recovery-for-hockey-players.html': ['cornerstone','skate','nutrition'],
};
const enc = s => s.replace(/&/g,'&amp;');
const card = m => `    <a class="art-card has-thumb reveal" href="${m.href}">
      <div class="art-card-thumb" style="background-image:url('${m.img}')"></div>
      <div class="art-card-body">
        <span class="art-card-cat${m.cls}">${m.cat}</span>
        <h3 class="art-card-title display">${enc(m.title)}</h3>
        <p class="art-card-desc">${m.desc}</p>
        <div class="art-card-foot">
          <span class="art-card-read">${m.read}</span>
          <svg class="art-card-arrow" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </div>
      </div>
    </a>`;

const re = /<div class="related-grid">[\s\S]*?<\/div>\s*<\/section>/;
let ok=0; const errs=[];
for (const [file, keys] of Object.entries(MAP)) {
  let html = fs.readFileSync(file, 'utf8');
  if (!re.test(html)) { errs.push(file + ' (related-grid not matched)'); continue; }
  const grid = `<div class="related-grid">\n${keys.map(k=>card(M[k])).join('\n')}\n  </div>\n</section>`;
  html = html.replace(re, grid);
  if (APPLY) fs.writeFileSync(file, html);
  ok++;
  console.log(`${file}  ->  ${keys.join(', ')}`);
}
console.log(`\nMODE: ${APPLY ? 'APPLIED' : 'DRY RUN'}   files: ${ok}/7`);
if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
