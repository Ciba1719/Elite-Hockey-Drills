import fs from 'node:fs';

const html = fs.readFileSync('program-9-11-office.html', 'utf8');

// Remove script and style blocks entirely
let s = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ');

// Capture data-video attribute values before stripping attributes (useful for hockey-transfer review)
const videos = [...s.matchAll(/data-video="([^"]*)"/g)].map(m => m[1]);

// Replace block-level closing tags with newlines to preserve structure
s = s.replace(/<\/(p|div|li|tr|h1|h2|h3|h4|h5|h6|section|header|footer|table|thead|tbody|ul|ol|article|td|th)>/gi, '\n');
s = s.replace(/<br\s*\/?>/gi, '\n');
s = s.replace(/<\/(span|strong|b|em|i|a)>/gi, ' ');

// Strip all remaining tags (and their attributes, including base64 src)
s = s.replace(/<[^>]+>/g, ' ');

// Decode common HTML entities
const entities = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'",
  '&apos;': "'", '&nbsp;': ' ', '&times;': '×', '&rarr;': '→', '&ndash;': '–',
  '&mdash;': '—', '&deg;': '°', '&hellip;': '…', '&rsquo;': '’', '&lsquo;': '‘',
  '&ldquo;': '“', '&rdquo;': '”', '&eacute;': 'é', '&bull;': '•', '&middot;': '·'
};
s = s.replace(/&[a-z]+;|&#\d+;/gi, m => entities[m] ?? m);

// Collapse horizontal whitespace, trim each line, drop empty lines / dedupe blank runs
const lines = s.split('\n')
  .map(l => l.replace(/[ \t]+/g, ' ').trim())
  .filter(l => l.length > 0);

const out = lines.join('\n');
fs.writeFileSync('_review_extract.txt', out, 'utf8');

console.log('Extract chars:', out.length);
console.log('Extract lines:', lines.length);
console.log('Unique data-video count:', new Set(videos).size, '/ total', videos.length);
console.log('--- first 60 lines ---');
console.log(lines.slice(0, 60).join('\n'));
