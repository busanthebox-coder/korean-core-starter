# Korean Data Pipeline

## Order

Run the pipeline in this order:

```bash
node scripts/generate-korean-data.mjs
node scripts/apply-curriculum-structure.mjs
node scripts/build-app-data.mjs
node scripts/verify-data-integrity.mjs
npx vitest run
npm run build
```

Use `--out <dir>` for diagnostics:

```bash
node scripts/generate-korean-data.mjs --out /tmp/kcs-generated
node scripts/diagnose-data-drift.mjs --out /tmp/kcs-generated
```

`--out` must be used whenever you need to inspect regenerated JSON without touching `korean/data`.

## Manifests

- `scripts/id-manifest.json` pins generated entry IDs and `sort` values. It is built from the committed data so user localStorage keys such as SRS and mistakes do not silently break when seed files move.
- `scripts/data-manifest.json` pins section counts, stable entry keys, and the final `grammar.json` hash. It makes missing seed entries and stale grammar bundles fail fast.
- `scripts/verify-data-integrity.mjs` checks both manifests.

After an intentional content addition:

```bash
node scripts/generate-korean-data.mjs --accept-manifest-additions
node scripts/apply-curriculum-structure.mjs
node scripts/build-app-data.mjs
node scripts/verify-data-integrity.mjs --update-manifest
node scripts/verify-data-integrity.mjs
npx vitest run
npm run build
```

`build-app-data.mjs` also refreshes `korean/data-bundle.js`, so the Svelte app data and legacy browser bundle stay synchronized. `scripts/data-manifest.json` includes the final `grammar.json` hash and derived-bundle grammar sync state, so run `--update-manifest` only after `generate -> apply -> build` has produced the final reviewed output.

`generate-korean-data.mjs` stages generated files in a temporary directory first. It publishes to `korean/data` only after entry integrity passes, so a missing-entry failure leaves the current generated data untouched. Use `--accept-manifest-additions` only when new source entries are intentional and you will immediately review/update the manifests. Only run `--update-manifest` after reviewing that the new entries or grammar changes are intentional.

For a normal content PR/change, the review checklist is:

1. Add or edit source seeds only.
2. Run the pipeline above.
3. Review `git diff korean/data scripts/id-manifest.json scripts/data-manifest.json`.
4. Confirm `node scripts/verify-data-integrity.mjs` reports zero missing entries and synchronized grammar bundles.
5. Commit only after user approval.

## Recovery Seeds

- `scripts/vocab-src/recovered-2026-07.json` restores extended vocabulary that previously existed only in generated JSON.
- `scripts/pattern-src/recovered-2026-07.json` restores pattern cards that previously existed only in generated JSON.

These files contain source fields only. Generated fields such as IDs, `sort`, romanization, lessons, and derived links are produced by the pipeline.

## Do Not

- Do not replace committed `korean/data` with an unchecked regenerated copy.
- Do not delete or reorder seed files without running `node scripts/verify-data-integrity.mjs`.
- Do not manually edit generated IDs in `korean/data`.
- Do not update `scripts/data-manifest.json` just to silence a missing-entry failure.
- Do not run deployment from this pipeline; deployment is separate and user-approved only.
