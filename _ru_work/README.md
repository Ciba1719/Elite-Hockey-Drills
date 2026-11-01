# /ru/ — how the Russian site is built and maintained

The Russian site (added 2026-10-25 → 2026-10-31) is produced from the English pages by
`_i18n_ru_tools.mjs` plus the segment files in this folder, not by hand-editing `ru/*.html`.
The exercise library comes from `exercises.ru.json` through the normal generator.

## Pieces

- `ru-web-brief.md` — the translation brief (register, glossary pointers, mechanics). The
  binding glossary is the app's: `HockeyAPP/docs/I18N_RU_GLOSSARY.md`.
- `seg/<page>.en.json` / `seg/<page>.ru.json` — one file per static page listed in
  `pages.json`: every translatable segment of the English page (block innerHTML, attributes,
  `<title>`/meta, JSON-LD strings, inline-script literals) and its Russian. Ids are positional
  per series (`h12`, `a3`, `m0`, `l5`, `j7`, `t2`; SVG labels `v*`; late additions `x*`), so a
  `.ru.json` is only valid against the English page it was extracted from.
- `svg/`, `x/` — the SVG-label and template-literal/data-attribute segments, merged into
  `seg/*.ru.json` by `merge-svg.mjs`.
- `overrides/<page>.json` — exact-string replacements for the few strings no segment reaches
  (survey script copy). Applied by `inject` after the link rewriting.
- `ex/chunk-N.{en,ru}.json` — the exercise library in ten chunks; `chunk-exercises.mjs merge`
  assembles `exercises.ru.json` (and unifies the energy labels).
- `swaps.ru.json` — the Russian column of `generate-i18n.js` (SWAPS + CAT); `swaps-list.mjs
  --patch` inserts it. `patch-generator.mjs` wired `ru` into `generate.js`, `generate-i18n.js`,
  `assets/lang-switch.js`, `assets/store-links.js` (idempotent).
- `name-map.json` — site slug → the app's Russian exercise name (306 of 331 matched), used so
  the website and the app call every exercise the same thing.

## Workflow after an English page changes

1. `node _i18n_ru_tools.mjs extract <page.html>` — rewrites `seg/<page>.en.json`. Compare ids
   with the old `.ru.json`; ids after an inserted block shift, so translate the new/changed
   segments and renumber if needed (the `.en.json` keeps the English text per id).
2. Update `seg/<page>.ru.json`, then `node _i18n_ru_tools.mjs inject <page.html>` and
   `node _i18n_ru_tools.mjs verify <page.html>` (0 errors; brand names and English
   bibliographies are expected "untranslated").
3. `node _ru_work/post-fix.mjs` keeps the nav CTA / FAQ wording uniform across pages.
4. New page in English: add it to `pages.json`, extract, translate, inject, verify, then
   `node _i18n_ru_tools.mjs hreflang-add` (adds the ru alternate to every language's copy).
5. Exercise text changes: edit the matching `ex/chunk-N.ru.json`, run
   `node _ru_work/chunk-exercises.mjs merge`, then `node generate.js` (builds every language).

## Known limits

- `ru/*.html` was edited directly on 2026-11-01 (annual-only free week wording, root-absolute file
  paths). Re-injecting from `seg/` would undo both unless the segments are updated too.

- Dates inserted by page scripts (`toLocaleDateString('en-US')` in the program pages' season
  clock) still render as English short dates.
- Localised app screenshots / reel / store badges (`assets/app/*-ru.*`) do not exist yet; the
  Russian pages use the English visuals.
- Bibliographic references are kept in English on purpose (as on /cs/ and /de/); most
  translators rendered paper titles in Russian with authors/journals in Latin.
