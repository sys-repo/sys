# EVERGREEN NOTES — @sys/ui-react-components public leaf policy

## Scope
- Package: `code/sys.ui/ui-react-components`
- Purpose of this note: retain the durable public-surface policy after the leaf export upgrade was landed.

## Landed truth
The package now follows a compatibility-preserving leaf-export posture:
- root `.` remains available as a compatibility barrel
- leaf subpaths are the preferred precise public authority
- docs and package proofs now acknowledge the leaf surface explicitly

Representative landed work:
- `refactor(ui-react-components): add leaf exports for public component modules`
- focused export-surface proof added under `src/-test/-exports.leaf.test.ts`
- README examples updated to prefer leaf imports

## Evergreen package policy

### 1. Public concepts should have leaf authority
If a concept is intentionally public, it should normally have a stable public leaf subpath in `deno.json`.

### 2. Root barrel is compatibility, not precision
Keep the root barrel for compatibility and convenience, but prefer leaf imports in docs, templates, and migrations.

### 3. Public leaf naming should be semantic and stable
Prefer readable public paths such as:
- `./button`
- `./buttons/icons`
- `./layout/tabs`
- `./player/youtube`
- `./image/svg`

Do not leak local dotted filenames or multiple competing spellings into the public API.

### 4. Local module decomposition is not automatically public API
Do not promote deeper internal modules just because they exist. Public leaf exports must be intentional, stable, and consumer-justified.

## Review rule for future additions
When adding a new public component/module:
1. decide whether it is truly public
2. if yes, give it a coherent leaf path
3. preserve root compatibility unless an intentional API change is being made
4. update proof/docs/examples if the new leaf is part of the public contract

## Verification posture
Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components
```

Baseline package proof:

```bash
deno task test --trace-leaks
deno task check
deno task dry
```

Use focused export-surface tests during iteration when changing `deno.json` exports or public import examples.

## Non-goals carried forward
- do not expose every internal submodule for symmetry alone
- do not remove the root barrel casually while downstream compatibility still matters
- do not let docs/examples drift back toward root-only imports when a leaf path is the truthful public authority
