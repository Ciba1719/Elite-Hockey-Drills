// generate-i18n.js: the patched `ru:` values must be single-quoted strings like
// the other languages (a backtick literal would interpolate ${SITE_URL} at load).
import fs from 'fs';
let s = fs.readFileSync('generate-i18n.js', 'utf8');
let n = 0;
s = s.replace(/ru: `((?:\\.|[^`\\])*)`/g, (m, body) => {
  n++;
  const v = body.replace(/\\\$/g, '$').replace(/\\`/g, '`');           // undo template-literal escapes
  const lit = "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";
  return 'ru: ' + lit;
});
fs.writeFileSync('generate-i18n.js', s, 'utf8');
console.log('converted backtick ru values:', n);
