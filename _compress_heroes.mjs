// Web-optimize the new hero images: resize to max 2000px wide, quality 82 mozjpeg.
// Originals stay in git history (just committed) and in the user's source files.
import sharp from 'sharp';
import fs from 'fs';

const files = ['skating-speed.jpg', 'youth-dryland.jpg', 'off-ice-mistakes.jpg'];
for (const f of files) {
  const p = 'assets/articles/' + f;
  const input = fs.readFileSync(p);
  const before = input.length;
  const meta = await sharp(input).metadata();
  const out = await sharp(input)
    .rotate()                                   // apply EXIF orientation, then strip metadata
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(p, out);
  console.log(`${f}: ${(before/1048576).toFixed(1)}MB (${meta.width}px) -> ${(out.length/1024).toFixed(0)}KB`);
}
console.log('done');
