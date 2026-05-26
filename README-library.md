# Elite Hockey Drills — Exercise Library Generator

## One command to run (full build — all exercises)
```
node generate.js
```

## Test build (3 exercises only — verify before full build)
```
node generate.js --test
```

## After editing the Excel file
Re-run `node generate.js` — it rewrites every page cleanly and removes any pages for exercises that no longer exist.

## Requires
`npm install xlsx` (already done if node_modules/ exists)
