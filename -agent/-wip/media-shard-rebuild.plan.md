# Media Shard URL Rebuild (Phase 0 Distill)

## Purpose
Distill current mixed WIP into reproducible, no-slop execution units before any further commits.

## Phase 0 Status (Current Working Tree)

### Snapshot
- Branch head: `4470ef887`
- Uncommitted files: 21 modified + 1 untracked
- Diff size: `489 insertions, 20 deletions`

### Current touched modules (mixed)
- `@sys/model-slug` client/schema:
  - `code/sys.model/model-slug/src/m.client/*`
  - `code/sys.model/model-slug/src/m.schema/m.Bundle/*`
- `@tdb/edu-slug` loader:
  - `deploy/@tdb.edu.slug/src/m.client/m.SlugLoader/*`
- compiler/bundler:
  - `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/*`
- UI diagnostics + consumer:
  - `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/*`
  - `deploy/@tdb.edu.slug/src/ui/ui.Driver.MediaPlayback/-spec/*`

### Non-target contamination in WIP
- `code/sys.tools/src/cli.deploy/u.staging/u.staging.execute.ts`
- `code/sys.ui/ui-react-components/src/-test/ui.Splash.tsx`

These two should not be in the shard-url unit; move or revert before commit slicing.

## What We Learned (Evidence)

### A) Canonical rewrite seam now exists in loader layer
- `deploy/@tdb.edu.slug/src/m.client/m.SlugLoader/m.Descriptor.ts`
  - `withVideoShardRewrite(...)`
  - rewrites asset hrefs based on `originMap.cdn.video` + shard policy.

### B) Bundle resolver contract was widened for deterministic rewrite
- `code/sys.model/model-slug/src/m.client/t.io.ts`
  - `SlugBundleHrefResolver` now receives:
    - `hash`
    - `filename`
    - `shard`
- `code/sys.model/model-slug/src/m.client/m.io.timeline.Bundle.ts`
  - passes this metadata through to resolver.

### C) UI proof currently exists, but has two tiers
1. Loader-truth diagnostics (good primary proof):
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/-spec.cards/-ui.tree+playback-assets.tsx`
  - `value:assets:docid:*`
  - `value:rewrite`
  - `asset host`, `shard prefix` checks

2. MediaPlayback AUX diagnostic (secondary, derived):
- `deploy/@tdb.edu.slug/src/ui/ui.Driver.MediaPlayback/-spec/-ui.Aux.tsx`
  - shows raw `href`
  - also computes `finalHref` via `new URL(href, videoOrigin)` for inspection.

Interpretation:
- `value:assets:*` is canonical loader output proof.
- `finalHref` in AUX is diagnostic rendering aid, not source-of-truth.

## Repro Commands (Phase 0)
- `git status --short`
- `git diff --stat`
- `git diff --name-only`
- targeted inspect:
  - `git diff -- deploy/@tdb.edu.slug/src/m.client/m.SlugLoader/m.Descriptor.ts`
  - `git diff -- code/sys.model/model-slug/src/m.client/t.io.ts`
  - `git diff -- code/sys.model/model-slug/src/m.client/m.io.timeline.Bundle.ts`
  - `git diff -- deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/-spec.cards/-ui.tree+playback-assets.tsx`
  - `git diff -- deploy/@tdb.edu.slug/src/ui/ui.Driver.MediaPlayback/-spec/-SPEC.ui.Root.tsx`

## Execution Plan (from clean baseline)

### Unit 1: `@sys/model-slug` client contract
- Scope:
  - `code/sys.model/model-slug/src/m.client/*`
  - only required schema sync files in same package
- Exit criteria:
  - resolver metadata contract is typed + tested
- Commit:
  - model-only

### Unit 2: `@tdb/edu-slug` SlugLoader rewrite seam
- Scope:
  - `deploy/@tdb.edu.slug/src/m.client/m.SlugLoader/*`
- Exit criteria:
  - loader emits canonical rewritten asset hrefs for media shard policy
  - tests pass
- Commit:
  - loader-only

### Unit 3: compiler/bundler shard policy feed
- Scope:
  - `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/*`
- Exit criteria:
  - emitted profile/layout provides policy required by loader rewrite
- Commit:
  - compiler-only

### Unit 4: UI diagnostics in DataCards
- Scope:
  - `deploy/@tdb.edu.slug/src/ui/-dev/ui.Http.DataCards/*`
- Exit criteria:
  - card exposes loader truth clearly (`value:assets`, rewrite diagnostics)
- Commit:
  - diagnostics-only

### Unit 5: MediaPlayback consumer AUX display
- Scope:
  - `deploy/@tdb.edu.slug/src/ui/ui.Driver.MediaPlayback/-spec/*`
- Exit criteria:
  - AUX/Debug surfaces canonical loader href + shard fields
  - no protocol rewrite ownership transferred to UI
- Commit:
  - UI-consumer-only

## Guardrails
- No cross-domain mixed commits.
- No UI ownership of URL canonicalization.
- Each unit must pass local module `deno task check` and targeted `deno task test --trace-leaks ...` before commit.

