# Russian website brief — elitehockeydrills.com (/ru/)

You are translating the Elite Hockey Drills website (static HTML, hockey off-ice training) from
English into Russian. Four translated sites already exist (/cs/, /sv/, /de/, /fi/); Russian is the
fifth. The companion app is already in Russian — its glossary is binding here too:
`C:\Users\d.ciboch\Desktop\claude EHD\HockeyAPP\docs\I18N_RU_GLOSSARY.md` (read the "Register and
style", "Glossary" and "Decisions already made" sections). Website root:
`C:\Users\d.ciboch\Desktop\claude EHD\EliteHockeyDrills\Website`.

## Two kinds of work

### A. Page segments (`_ru_work/seg/<page>.en.json` → `<page>.ru.json`)
Each file lists the translatable segments of one HTML page in document order:
`{ "id": "h12", "kind": "html" | "text" | "attr:alt" | "attr:aria-label" | "attr:placeholder" | "attr:title" | "meta" | "title" | "ld" | "js", "en": "…" }`.
Write `_ru_work/seg/<page>.ru.json` as `{ "segments": [ { "id": "h12", "ru": "…" }, … ] }` — EVERY id,
same order. The tool re-injects your text into a copy of the English page and rewrites links,
hreflang, canonical and store URLs itself — you only translate.
- `html` segments are the innerHTML of one block: keep every inline tag exactly (`<em>`, `<strong>`,
  `<a href="…">`, `<span class="…">`, `<br>`, `<svg>…</svg>` if present), same count and order; translate
  only the text between tags and nothing inside a tag. Keep HTML entities (`&amp;`, `&nbsp;`, `&rarr;`).
- `text` segments are bare text nodes (a button label next to an icon) — plain text, no tags.
- `attr:*` / `meta` / `title` are attribute values: plain text, no tags, no quotes. `<title>` and
  `meta description` are SEO copy: natural Russian search phrasing, title ≤ 60 characters where the
  English is, description ≤ 160.
- `ld` are JSON-LD strings (schema.org name/description/headline/FAQ text): plain text.
- `js` are string literals from inline scripts (UI messages, the FAQ/offer-countdown copy, survey
  texts). Translate the words, keep any `<em>`/`<div class="…">` markup inside the string, keep leading
  and trailing spaces (the literal is concatenated with others), never add quotes.
- Never translate: the brand "Elite Hockey Drills", "Coach David Ciboch" → «тренер Давид Цибох»
  (name transliterated, that one IS translated), store names (App Store, Google Play, Apple, Google,
  iPhone, Android), program names that are product titles — keep the English title and add a Russian
  gloss only where the English itself explains it ("FOUNDATIONS" stays FOUNDATIONS), URLs, e-mail
  addresses, prices ("$79" stays "$79"; write "79 $" if you must reorder), hashtags, code.
- Numbers, durations, counts stay identical ("8 weeks" → «8 недель», "24 sessions" → «24 тренировки»,
  "390+ exercises" → «390+ упражнений»). Age groups "9–11", "12–14", "15–18", "19–39", "40+" stay.

### B. Exercise library (`_ru_work/ex/chunk-N.en.json` → `chunk-N.ru.json`)
Each chunk maps a slug to `{ name, execution, why, transfer, cues, mistakes, progression, muscles,
energy, nameHint?, category }`. Write `chunk-N.ru.json` with the SAME slugs and the nine text fields
translated (drop `nameHint` and `category`, they are hints). Rules:
- `name`: when `nameHint` is present it is the name the Russian app already uses for this exercise —
  use it verbatim (consistency between app and website). Otherwise follow the glossary's exercise
  naming conventions (присед, выпад, тяга, жим, прыжок, переноска, удержание…).
- `execution` is the how-to paragraph (imperative, «ты»), `why` the mechanism, `transfer` the
  on-ice benefit, `cues` short coach commands separated as in English (keep ”quotes” or bullets as
  the English has them), `mistakes` common errors, `progression` reads "Progression: … | Regression: …"
  in English — write «Усложнение: … | Упрощение: …» keeping the ` | ` separator, or «Не применяется
  (…)» where the English says "N/A (…)". `muscles` is a comma-separated list (glossary muscle names,
  lower case except the first), `energy` a short phrase («Аэробная», «Алактатная (АТФ-КрФ)»,
  «Не применяется (мобильность/восстановление)»).
- Keep numbers/units exactly; metric only (the English is metric); decimal comma.

## Register and style
- Players are addressed as «ты» (coach voice, direct, short). Pages written to parents (program
  pages for ages 9–11 and 12–14, "your athlete", "your child", guardian texts) use «вы».
- Gender-neutral toward the player: no «ты сделал/сделала», no «готов/готова»; rephrase with nouns,
  imperatives, present/future tense («у тебя получится», «тренировка завершена»).
- Use «ё». Typography: «ёлочки» for quotes in prose, keep the English's « — » and « · » separators,
  a space before units (20 мин, 10 м, 80 %). Headlines in the site's split style ("The Full /
  Exercise Arsenal.") stay punchy; keep ALL CAPS where the English is ALL CAPS.
- Marketing lines must sound like a Russian coach's site, not a calque: "Built around your season"
  → «Создано под твой сезон», "Faster first three strides" → «Быстрее первые три шага», "First week
  free" → «Первая неделя бесплатно», "Get the App" → «Скачать приложение», "Start My/Your Free Week"
  → «Начать бесплатную неделю», "Free 5-Day PDF/Program" → «Бесплатная 5-дневная программа»,
  "Exercise Library" → «Библиотека упражнений», "off-ice / dryland training" → «тренировки вне льда»,
  "the app" → «приложение», "sport scientist" → «спортивный учёный», "former national-team coach" →
  «бывший тренер национальной сборной», "coach" → «тренер», "program" → «программа», "session" →
  «тренировка», "drill" → «упражнение», "skill tests" → «тесты навыков», "hockey IQ" → «хоккейный
  интеллект», "puck drop" → «вбрасывание», "season" → «сезон», "off-season" → «межсезонье»,
  "pre-season" → «предсезонка», "in-season" → «сезон», "tryouts" → «просмотры».

## Checks you must run
After writing a page's `.ru.json`, run from the website root:
`node _i18n_ru_tools.mjs inject <page.html>` then `node _i18n_ru_tools.mjs verify <page.html>` and
fix every ERROR (structure, inline-tag parity, untranslated segments, Latin glued to Cyrillic).
For an exercise chunk there is no per-chunk checker; re-read your JSON (valid JSON, every slug, nine
fields, no English left) before reporting. Do not edit any file outside `_ru_work/` and `ru/`.
