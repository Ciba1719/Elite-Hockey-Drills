// Make the program.html mobile fixes DURABLE by patching the build sources, so
// a future `node build.js` regenerates program.html with the fixes baked in
// (instead of reverting them). Patches program.css (CSS) + build.js (scorecard
// table wrap + week scrollspy). Asserts exact match counts; does NOT rebuild.
import { readFileSync, writeFileSync } from 'node:fs';

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

const count = (s, sub) => s.split(sub).length - 1;
function patch(file, edits) {
  let s = readFileSync(file, 'utf8');
  if (s.includes('sc-scroll') || s.includes('setWk')) { console.log(`SKIP ${file} — already patched`); return; }
  for (const e of edits) { const g = count(s, e.find); if (g !== e.n) throw new Error(`${file}: "${e.name}" expected ${e.n}, found ${g} — aborting`); }
  for (const e of edits) s = s.split(e.find).join(e.repl);
  writeFileSync(file, s);
  console.log(`OK   ${file} (sc-scroll x${count(s,'sc-scroll')}, setWk x${count(s,'setWk')}, hover-media x${count(s,'@media(hover:hover)')})`);
}

// program.css — the 3 CSS rules
patch('program.css', [
  { name: '.sc-scroll rule', n: 1,
    find: `.sc-note{font-size:12.5px;color:var(--ink3);margin-top:14px;line-height:1.6;font-style:italic;}`,
    repl: `.sc-note{font-size:12.5px;color:var(--ink3);margin-top:14px;line-height:1.6;font-style:italic;}\n/* scorecard tables scroll inside their own card on narrow screens (never widen the page) */\n.sc-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 -4px;padding:0 4px;}` },
  { name: 'tap-highlight', n: 1,
    find: `.topbar a{text-decoration:none;}`,
    repl: `.topbar a{text-decoration:none;-webkit-tap-highlight-color:transparent;}` },
  { name: 'hover gate', n: 1,
    find: `.tb-weeks a:not(.wk-label):hover{color:var(--ink);background:var(--ice-soft);box-shadow:inset 0 0 0 1px var(--ice-line);}`,
    repl: `@media(hover:hover){.tb-weeks a:not(.wk-label):hover{color:var(--ink);background:var(--ice-soft);box-shadow:inset 0 0 0 1px var(--ice-line);}}` },
]);

// build.js — scorecard table wrap + scrollspy
patch('build.js', [
  { name: 'scorecard table wrap', n: 1,
    find: '<table class="sc-table"><thead>${head}</thead><tbody>${rowsHtml}</tbody></table>',
    repl: '<div class="sc-scroll"><table class="sc-table"><thead>${head}</thead><tbody>${rowsHtml}</tbody></table></div>' },
  { name: 'scrollspy', n: 1, find: SPY_OLD, repl: SPY_NEW },
]);

console.log('Done. (program.html NOT rebuilt — run `node build.js` yourself if/when you want to regenerate it.)');
