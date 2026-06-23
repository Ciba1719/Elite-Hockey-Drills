// One-off: propagate the 3 program-40plus-office mobile fixes to the sibling
// programs + the base program.html. Asserts exact match counts per file so it
// aborts loudly if any file deviates (rather than silently half-applying).
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = [
  'program-9-11-office.html',
  'program-12-14-office.html',
  'program-15-18-office.html',
  'program.html',
];

const SPY_OLD = `  if(weeks.length&&hasIO){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){for(var k in chips)chips[k].classList.remove('active');var c=chips[e.target.id];if(c){c.classList.add('active');c.scrollIntoView({inline:'center',block:'nearest'});}}
    });},{rootMargin:'-96px 0px -70% 0px'});
    weeks.forEach(function(w){io.observe(w);});`;

const SPY_NEW = `  if(weeks.length&&hasIO){
    // Active week = the section crossing the reading line just below the sticky
    // header (135px tall). Deterministic, so two weeks touching the detection
    // band can't pick the wrong one (the old off-by-one highlight bug).
    var setWk=function(){
      var line=150,id=null;
      for(var i=0;i<weeks.length;i++){var r=weeks[i].getBoundingClientRect();if(r.top<=line&&r.bottom>line){id=weeks[i].id;break;}}
      if(!id)return;
      for(var k in chips)chips[k].classList.remove('active');
      var c=chips[id];if(!c)return;c.classList.add('active');
      // keep the active chip in view only by scrolling the week bar itself (never the page)
      var bar=c.closest('.tb-weeks');
      if(bar&&bar.scrollWidth>bar.clientWidth+1){var cr=c.getBoundingClientRect(),br=bar.getBoundingClientRect();bar.scrollLeft+=(cr.left+cr.width/2)-(br.left+br.width/2);}
    };
    var io=new IntersectionObserver(setWk,{rootMargin:'-150px 0px -45% 0px'});
    weeks.forEach(function(w){io.observe(w);});`;

const EDITS = [
  { name: 'css .sc-scroll rule', n: 1,
    find: `.sc-note{font-size:12.5px;color:var(--ink3);margin-top:14px;line-height:1.6;font-style:italic;}`,
    repl: `.sc-note{font-size:12.5px;color:var(--ink3);margin-top:14px;line-height:1.6;font-style:italic;}\n/* scorecard tables scroll inside their own card on narrow screens (never widen the page) */\n.sc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px;}` },
  { name: 'wrap table open', n: 3,
    find: `<table class="sc-table">`,
    repl: `<div class="sc-scroll"><table class="sc-table">` },
  { name: 'wrap table close', n: 3,
    find: `</table>`,
    repl: `</table></div>` },
  { name: 'tap-highlight transparent', n: 1,
    find: `.topbar a{text-decoration:none;}`,
    repl: `.topbar a{text-decoration:none;-webkit-tap-highlight-color:transparent;}` },
  { name: 'gate :hover behind @media(hover:hover)', n: 1,
    find: `.tb-weeks a:not(.wk-label):hover{color:var(--ink);background:var(--ice-soft);box-shadow:inset 0 0 0 1px var(--ice-line);}`,
    repl: `@media(hover:hover){.tb-weeks a:not(.wk-label):hover{color:var(--ink);background:var(--ice-soft);box-shadow:inset 0 0 0 1px var(--ice-line);}}` },
  { name: 'deterministic scrollspy', n: 1, find: SPY_OLD, repl: SPY_NEW },
];

const count = (s, sub) => s.split(sub).length - 1;

for (const file of FILES) {
  let html = readFileSync(file, 'utf8');
  if (html.includes('sc-scroll') || html.includes('setWk')) {
    console.log(`SKIP ${file} — already contains fixes (sc-scroll/setWk present)`);
    continue;
  }
  // verify all anchors first (abort before writing if any mismatch)
  for (const e of EDITS) {
    const got = count(html, e.find);
    if (got !== e.n) throw new Error(`${file}: "${e.name}" expected ${e.n} match(es), found ${got} — aborting, NO file written`);
  }
  // apply
  for (const e of EDITS) html = html.split(e.find).join(e.repl);
  writeFileSync(file, html);
  console.log(`OK   ${file} — applied ${EDITS.length} edits (sc-scroll x${count(html,'sc-scroll')}, setWk x${count(html,'setWk')}, hover-media x${count(html,'@media(hover:hover)')})`);
}
console.log('Done.');
