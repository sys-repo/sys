# Media Shard URL Rebuild (Phase 0 Distill)

## Purpose
Distill current mixed WIP into reproducible, no-slop execution units before any further commits.


### Modules:
- `@sys/model-slug` client/schema
- `@tdb/edu-slug` SlugLoader
- `@tdb/edu-slug` compiler/bundler profile
- `@tdb/edu-slug` UI ui.Http.DataCards diagnostics
- `@tdb/edu-slug` UI ui.Driver.MediaPlayback AUX consumer

## Phase 0 Status (Current Working Tree)

### Snapshot
- Branch head: `4470ef887`
- Uncommitted files: 21 modified + 1 untracked
- Diff size: `489 insertions, 20 deletions`
- Safety stash snapshot:
  - `stash@{0}: On phil-work: wip: media-shard mixed state before clean rebuild`
- Stash behavior note:
  - `git stash push -u` saves tracked + untracked changes and removes them from the working tree.
  - Use `git stash list` and `git stash show --name-only stash@{0}` for reference without applying.

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

### A) Canonical rewrite seam is in `@sys/model-slug` client URL layer
- `code/sys.model/model-slug/src/m.client.url/u.shard.ts`
  - `rewriteShardHost(...)`
  - applies descriptor layout shard policy (`strategy/total/host/path`).
  - distinguishes production vs localhost behavior.

### B) Bundler now emits explicit shard URL policy in descriptor layout
- `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/*`
- `code/sys.model/model-slug/src/m.schema/m.Bundle/kind.tree.media.seq/*`
- `dist.client.json` now carries:
  - `layout.shard.video.host` (eg `prefix-shard`)
  - `layout.shard.video.path` (eg `root-filename`)
  - plus `strategy/total`.

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

### D) Localhost/production parity is now explicit and tested
- Production:
  - `https://<shard>.video.<domain>/<filename>`
- Localhost:
  - `http://localhost.../staging/slc.cdn.video/shard.<shard>/<filename>`
- Tests:
  - `code/sys.model/model-slug/src/m.client.url/-test/-u.shard.test.ts`
  - `code/sys.model/model-slug/src/m.client/-test/-m.io.timeline.Bundle.test.ts`

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
- Status: ✅ Completed
- Commit:
  - `733cf9376 feat(model-slug.client): apply shard host/path URL policy for timeline assets from descriptor layout`

### Unit 2: `@tdb/edu-slug` SlugLoader rewrite seam
- Status: ⛔ Not the final canonical seam.
- Note:
  - rewrite ownership was moved to `@sys/model-slug` URL layer; SlugLoader remains orchestrating IO/profile selection.

### Unit 3: compiler/bundler shard policy feed
- Status: ✅ Completed
- Commit:
  - `cee37607d feat(bundle): emit shard URL host/path policy in media-seq dist.client descriptor layout`

### Unit 4: UI diagnostics in DataCards
- Status: ✅ Completed (URL proof surfaced)
- Commit:
  - `246590081 fix(ui.cards): pass origin object to descriptor clients and surface first-beat video URL proof`

### Unit 5: MediaPlayback consumer AUX display
- Status: 🟡 In progress / follow-on.
- Scope:
  - keep UI as consumer-only, no URL ownership.
  - continue driver/head polish now that canonical URL layer is stable.

## Next (Practical)
- Continue higher-order controller composition (`ui.Driver.MediaPlayback`, `ui.Driver.FileContent`) using canonical URLs already validated at DataCards level.
- Keep future changes split by unit:
  - bundle/schema
  - model-slug URL/client
  - UI diagnostics/consumers

## Guardrails
- No cross-domain mixed commits.
- No UI ownership of URL canonicalization.
- Each unit must pass local module `deno task check` and targeted `deno task test --trace-leaks ...` before commit.
