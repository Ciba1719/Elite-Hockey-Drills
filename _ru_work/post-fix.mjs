// Site-wide consistency pass over the generated /ru/ static pages: the nav CTA
// and the nav FAQ link were worded differently by parallel translators.
import fs from 'fs';
import path from 'path';

const pages = JSON.parse(fs.readFileSync('_ru_work/pages.json', 'utf8')).map(p => path.join('ru', p));
let changed = 0;
for (const f of pages) {
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, 'utf8'); const before = s;
  s = s.replace(/(class="(?:nav-cta btn btn-primary|btn btn-primary nav-cta)"[^>]*>)(Get the App|Начать бесплатно|Начать|Неделя бесплатно|Скачать приложение)(<)/g, '$1Скачать приложение$3');
  s = s.replace(/(#faq">)(FAQ|Вопросы и ответы)(<)/g, '$1Вопросы$3');
  if (s !== before) { fs.writeFileSync(f, s, 'utf8'); changed++; }
}
console.log(`post-fix: ${changed} page(s) changed`);
