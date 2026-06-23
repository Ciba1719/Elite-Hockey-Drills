// Build a professional "unrecorded exercises" shot-list workbook from
// exercises.json (minus whatever already has a clip in video-map.json).
import ExcelJS from 'exceljs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const ex = require('./exercises.json');
const map = require('./video-map.json');
const snake = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// Categories whose entries are drills/games/conditioning/breathing — no demo clip needed.
const OPTIONAL = new Set(['Conditioning / Jump Rope', 'Energy Systems / Intervals', 'Competitive Play', 'Cool-down / Recovery']);
// Slugs the user has decided NOT to film (same list that strips the box from the site).
let NO_VIDEO = new Set();
try { NO_VIDEO = new Set(require('./no-video.json')); } catch {}

const missing = ex.filter((e) => !map[e.slug]).map((e) => ({
  name: e.name,
  howto: (e.execution || '').trim(),   // same text the library shows under "How to Do It"
  category: e.category,
  priority: OPTIONAL.has(e.category) ? 'Optional' : 'Recommended',
  file: snake(e.name) + '.mp4',
  wont: NO_VIDEO.has(e.slug),
}));
const catOrder = [...new Set(ex.map((e) => e.category))];
// To-film first (white), won't-record clustered at the bottom (yellow); each
// group ordered Recommended -> Optional, then by category.
missing.sort((a, b) =>
  (a.wont === b.wont ? 0 : a.wont ? 1 : -1) ||
  (a.priority === b.priority ? 0 : a.priority === 'Recommended' ? -1 : 1) ||
  (catOrder.indexOf(a.category) - catOrder.indexOf(b.category)));

const toFilm = missing.filter((m) => !m.wont);
const wontN = missing.length - toFilm.length;
const recN = toFilm.filter((m) => m.priority === 'Recommended').length;
const optN = toFilm.length - recN;

// ── palette (brand: ink #0B0B0F, ice #5DB4E5, warm #E8B777) ──
const INK = 'FF0B0B0F', ICE = 'FF2C7FB0', ICE_HDR = 'FF1E5F86';
const GOLD = 'FFE8B777', GOLD_SOFT = 'FFFBEFD9', GRAY_SOFT = 'FFEEF1F4';
const STRIPE = 'FFF6F8FA', LINE = 'FFD9DEE4', WHITE = 'FFFFFFFF', YELLOW = 'FFFFF6CC';
const ARIAL = (o = {}) => ({ name: 'Arial', size: 10, ...o });
const thin = { style: 'thin', color: { argb: LINE } };
const box = { top: thin, left: thin, bottom: thin, right: thin };

const wb = new ExcelJS.Workbook();
wb.creator = 'Elite Hockey Drills';
const ws = wb.addWorksheet('Unrecorded Exercises', {
  views: [{ state: 'frozen', ySplit: 6, showGridLines: false }],
  pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: 'landscape', margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } },
});

const COLS = [
  { key: 'n', width: 4.5 },
  { key: 'name', width: 24 },
  { key: 'howto', width: 62 },
  { key: 'cat', width: 19 },
  { key: 'prio', width: 13 },
  { key: 'file', width: 30 },
  { key: 'filmed', width: 9 },
  { key: 'notes', width: 24 },
];
ws.columns = COLS;
const LASTCOL = 'H';

// ── Title band (rows 1-4) ──
const band = (row, text, h, font, fill, wrap = false) => {
  ws.mergeCells(`A${row}:${LASTCOL}${row}`);
  const c = ws.getCell(`A${row}`);
  c.value = text; c.font = font;
  c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: wrap };
  if (fill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
  ws.getRow(row).height = h;
};
band(1, 'ELITE HOCKEY DRILLS', 30, ARIAL({ size: 20, bold: true, color: { argb: GOLD } }), INK);
band(2, 'Exercise Video Shot List  —  Unrecorded Demo Clips', 20, ARIAL({ size: 11, bold: true, color: { argb: WHITE } }), INK);
band(3, `Generated 12 Jun 2026      ·      ${missing.length} of ${ex.length} exercises have no video      ·      ${toFilm.length} to film (${recN} recommended · ${optN} optional)      ·      ${wontN} won't record`, 18, ARIAL({ size: 9, color: { argb: 'FFB9C2CC' } }), INK);
band(4, 'Tip: upload each clip to Cloudflare R2 using the exact "Upload to R2 as" filename — the site auto-wires it on the next publish.    ·    Light-yellow rows = won’t be recorded (the "Demo video coming soon" box has been removed from the website).    ·    "How to Do It" matches each library page.', 28, ARIAL({ size: 9, italic: true, color: { argb: 'FF555F6B' } }), GOLD_SOFT, true);
ws.getRow(5).height = 6; // spacer

// ── Header row (6) ──
const HEAD = ['#', 'Exercise', 'How to Do It', 'Category', 'Priority', 'Upload to R2 as', 'Filmed?', 'Notes'];
const CENTER = new Set([0, 4, 6]); // #, Priority, Filmed?
const hr = ws.getRow(6);
HEAD.forEach((t, i) => {
  const c = hr.getCell(i + 1);
  c.value = t;
  c.font = ARIAL({ bold: true, color: { argb: WHITE } });
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ICE_HDR } };
  c.alignment = { vertical: 'middle', horizontal: CENTER.has(i) ? 'center' : 'left', indent: CENTER.has(i) ? 0 : 1 };
  c.border = box;
});
hr.height = 22;

// ── Data rows ──
const linesFor = (text, width) => Math.max(1, Math.ceil(text.length / Math.floor(width * 0.92)));
missing.forEach((m, idx) => {
  const r = 7 + idx;
  const row = ws.getRow(r);
  const stripe = idx % 2 === 1;
  const base = ARIAL({ color: { argb: 'FF1F2A33' } });
  const rowFill = m.wont ? YELLOW : (stripe ? STRIPE : null);
  const note = m.wont ? "Won’t record — box removed from site" : '';
  const vals = [idx + 1, m.name, m.howto, m.category, m.priority, m.file, '', note];
  vals.forEach((v, i) => {
    const c = row.getCell(i + 1);
    c.value = v;
    c.border = box;
    c.font = base;
    c.alignment = { vertical: 'top', horizontal: CENTER.has(i) ? 'center' : 'left', indent: CENTER.has(i) ? 0 : 1, wrapText: i === 1 || i === 2 || i === 3 || i === 7 };
    if (rowFill) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
  });
  row.getCell(2).font = ARIAL({ bold: true, color: { argb: m.wont ? 'FF6B5A12' : 'FF11181F' } }); // Exercise
  row.getCell(3).font = ARIAL({ size: 9, color: { argb: m.wont ? 'FF7A6A33' : 'FF33414C' } });    // How-to
  row.getCell(6).font = ARIAL({ name: 'Consolas', size: 9, color: { argb: m.wont ? 'FFA08A4A' : ICE } }); // filename
  row.getCell(8).font = ARIAL({ size: 9, italic: true, color: { argb: 'FF8A5A12' } });            // note
  if (!m.wont) {                                                                   // Priority chip (to-film rows only)
    const p = row.getCell(5);
    if (m.priority === 'Recommended') { p.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD_SOFT } }; p.font = ARIAL({ bold: true, size: 9, color: { argb: 'FF8A5A12' } }); }
    else { p.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_SOFT } }; p.font = ARIAL({ size: 9, color: { argb: 'FF6B7682' } }); }
  } else {
    row.getCell(5).font = ARIAL({ size: 9, color: { argb: 'FF8A5A12' } });        // priority text on yellow
  }
  // Row height fits the tallest wrapped cell (How to Do It dominates).
  const lines = Math.max(linesFor(m.howto, COLS[2].width), linesFor(m.name, COLS[1].width));
  row.height = Math.min(230, Math.max(20, lines * 12.2 + 6));
});

const lastRow = 6 + missing.length;
ws.autoFilter = `A6:${LASTCOL}6`;
for (let r = 7; r <= lastRow; r++) {
  ws.getCell(`G${r}`).dataValidation = {
    type: 'list', allowBlank: true, formulae: ['"Yes,No"'],
    showErrorMessage: true, errorTitle: 'Pick one', error: 'Choose Yes or No',
  };
}

const PRIMARY = 'Elite_Hockey_Drills_Unrecorded_Exercises.xlsx';
const FALLBACK = 'Elite_Hockey_Drills_Unrecorded_Exercises_UPDATED.xlsx';
const summary = `${missing.length} rows · ${toFilm.length} to film (${recN} rec, ${optN} opt) · ${wontN} won't record (yellow)`;
try {
  await wb.xlsx.writeFile(PRIMARY);
  console.log(`Wrote ${PRIMARY} — ${summary}`);
} catch (e) {
  if (e.code === 'EBUSY' || e.code === 'EPERM') {
    await wb.xlsx.writeFile(FALLBACK);
    console.log(`(${PRIMARY} was open/locked) Wrote ${FALLBACK} — ${summary}`);
  } else throw e;
}
