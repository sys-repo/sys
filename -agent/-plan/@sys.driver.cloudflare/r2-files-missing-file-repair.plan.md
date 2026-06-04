# R2 Deploy Missing-File Repair Plan

Status: implemented, proved, and committed.

Landed repair commit:

```txt
c1e3767ea fix(deploy): repair missing R2 files on unchanged push
```

Related deploy commits in this arc:

```txt
172b74285 fix(deploy): reduce endpoint menu prompt noise
826687903 feat(deploy): parallelize R2 file publishes
39c64b4e1 fix(deploy): normalize push report casing
c1e3767ea fix(deploy): repair missing R2 files on unchanged push
```

DMIND verdict: the live proof exposed a real deploy-state gap, not an R2 upload performance issue. Before this fix, normal R2 deploy trusted a matching remote `dist.json` release marker enough to skip all staged files, but it did not verify that every file named by that marker still existed in the current remote Files view.

This document now records the reasoning, implementation invariants, proof boundary, and retirement status for the repair.

## DMIND/STIER review

Verdict: implement as a narrow deploy correctness hardening, not a deep remote verification feature.

Principle:

```txt
remote dist.json = published release intent
remote Files list = current physical state
normal skip = release intent matches AND expected file currently exists
```

This keeps deploy's snapshot-replacement semantics intact without turning R2 deploy into a remote byte-audit system.

STIER decisions for implementation, now reflected in the provider-local fix:

- Use `files.list(...)` for the first fix; it is sufficient for path existence.
- Do not use `files.manifest(...)` unless future diagnostics/content-ref needs appear.
- Pull the current remote Files projection only when a usable remote `dist.json` exists and normal push would otherwise trust it for skips.
- If that pre-publish list fails, fail truthfully before writes or deletes.
- Reuse the same pre-publish listing for stale-prune computation when it was already pulled for missing-file repair.
- Do not list twice in the normal remote-dist-present path.
- Keep force simple: force does not need remote dist/list for planning; it writes all staged files, writes `dist.json` last, then performs normal prune listing after publish.
- Keep invalid/unavailable remote dist simple: upload all staged files, write `dist.json` last, then perform normal prune listing after publish.
- Repaired missing files report as `written`; do not widen `PushPublishFileStatus`.
- If any staged asset is physically written, `dist.json` is physically written last as the release marker, even if its digest already matched remote intent.

## Implemented behavior

The R2 provider now treats a matching remote `dist.json` as release intent, not physical proof.

Current flow:

```txt
read remote intent → read current physical state when intent is trusted → bounded asset writes → dist.json last → prune
```

Concrete implementation:

- when `--force` is not set and remote `dist.json` is valid, the provider lists current remote Files before planning skips.
- a staged asset is skipped only when its digest matches remote intent and its path exists in the current Files listing.
- a missing expected asset is repaired through `Files.Client.writeBytes(...)` and reports as `written`.
- `dist.json` is skipped only when remote digest matches, the marker exists, and no staged asset was physically written.
- if any staged asset is repaired or otherwise written, `dist.json` is written serial-last as the release marker.
- stale prune reuses the pre-publish listing when one was already pulled for repair planning.
- if the trusted remote listing fails, push fails before writes or deletes.
- force and invalid/unavailable remote-dist paths do not trust remote intent for skip planning; they upload staged files and then run normal prune.

Touched implementation files:

```txt
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
```

## Observed failure mode

Repro shape:

1. Stage and push an R2 deploy endpoint successfully.
2. Delete one or more published asset objects manually from the R2 web UI.
3. Leave remote `dist.json` intact.
4. Push the same staged hash again without force.

Observed report:

```txt
files      126   total publish files
uploaded   0     changed files
skipped    126   unchanged files
```

The deploy report was internally consistent with the pre-fix algorithm, but externally wrong for the namespace: the remote endpoint could be missing expected files while deploy said everything was unchanged.

## Root cause

Pre-fix R2 push state model:

```txt
load staged dist.json
read remote dist.json
compare staged digest/parts with remote digest/parts
mark matching files skipped
write changed files only
write dist.json last when changed
list current remote files for stale prune
remove remote-only stale files
```

This covers two sets:

```txt
expected files from staged dist.json
remote dist.json file-set / digests
```

and, after publish, stale prune covers:

```txt
actual remote files
MINUS
expected files
= stale files to remove
```

The missing check is the inverse:

```txt
expected files
MINUS
actual remote files
= missing expected files to repair
```

Before this fix, deploy never computed that inverse set during normal skip planning. A matching remote `dist.json` meant every expected file was marked `skipped`, even if the backing object had been manually deleted.

## Remote Files<T> state used

R2 Files already has a current remote projection available through Files<T>.

Candidate APIs:

```ts
await files.list(...)
```

or:

```ts
await files.manifest(...)
```

For the R2 Files backing, `files:manifest` is built from the current remote object listing under the configured prefix. It is a live Files projection with entries and optional content refs. It is not the staged deploy `dist.json` package manifest.

For this repair slice, `list` is enough because missing-file repair only needs path existence. `manifest` remains a clean conceptual name for “current Files<T> remote projection,” but it does not currently provide deploy content hashes for R2 entries.

Important limitation:

- R2 Files list/manifest entries can prove path existence and size/modified time when available.
- They cannot prove content equality to staged dist part digests without reading object bytes or having trusted hash metadata.
- Therefore this slice should repair missing expected files, not become a deep byte-verify mode.

## Semantics

Normal push keeps the remote `dist.json` optimization, but only skips files that are both:

1. unchanged according to remote `dist.json`, and
2. present in the current remote Files<T> listing.

If a staged file is unchanged by remote intent but missing from the current remote Files projection, mark it `written` and upload it through `Files.Client.writeBytes`.

`dist.json` remains the release marker and is still written last when any expected file is repaired.

Force remains separate:

- `--force` rewrites every staged file and writes `dist.json` last.
- It is still not a prune switch.
- It remains the manual repair escape hatch for cases outside this narrow missing-file repair.

Prune remains separate:

- stale remote-only files are removed after successful publish/release marker write.
- stale removal continues through `Files.Client.remove` only.
- prune stats remain separate from publish stats.

## Implemented algorithm

Provider-local R2 push flow:

1. Load staged `dist.json`.
2. Create the R2 Files client.
3. Build expected set from staged dist parts plus `dist.json`.
4. Resolve the planning mode:

   ```txt
   force=true
     → no remote dist read for planning
     → no pre-publish list for missing detection
     → publish all staged files

   force=false and remote dist unavailable/invalid
     → upload-all fallback
     → no pre-publish list for missing detection
     → publish all staged files

   force=false and remote dist valid
     → list current remote Files paths before planning
     → fail before writes/deletes if listing fails
     → plan skips only for files present in that listing
   ```

5. For the remote-dist-valid mode, build `actual` from the current remote Files projection.
6. Conceptually, the repair set is:

   ```txt
   missing = expected - actual
   ```

7. Build publish plan for non-`dist.json` files from digest state plus path existence:
   - `written` if force.
   - `written` if no valid remote dist.
   - `written` if path is missing from current remote Files projection.
   - `written` if staged digest differs from remote dist part digest.
   - otherwise `skipped`.
8. Build `dist.json` plan entry:
   - `written` if force.
   - `written` if no valid remote dist.
   - `written` if remote dist digest differs from staged dist digest.
   - `written` if `dist.json` is absent from the current remote Files projection.
   - `written` if any non-`dist.json` staged file is physically written in this publish.
   - otherwise `skipped`.
9. Write all non-`dist.json` `written` assets through `Files.Client.writeBytes` using the already-landed bounded publish runner.
10. Write `dist.json` serial-last when its plan entry is `written`.
11. Prune stale remote-only files after successful publish/release marker write:
    - if a pre-publish remote listing was already pulled, compute stale from that same listing;
    - otherwise list after publish as the current force/upload-all path does.
12. Return publish/prune stats as today.

Key invariant:

```txt
read remote intent → read current physical state when intent is trusted → bounded asset writes → dist.json last → prune
```

Safety decision:

- If the current remote Files projection pull fails before publish in the remote-dist-valid path, do not write and do not delete. Return a truthful failed push.
- This is safer than claiming all files skipped when physical remote state is unknowable.
- Force and upload-all fallback remain repair escapes because they do not trust the remote manifest for asset skips.

## Stats/reporting

Keep `PushPublishFileStatus` unchanged:

```ts
'written' | 'skipped'
```

Missing-file repair should show as `written`, because deploy physically uploaded the file.

Do not add a public `missing` publish status in this baseline unless reporting pressure requires it. If richer diagnostics are needed, add provider-local debug details or additive repair stats later; do not widen the public publish status casually.

Report behavior after deleting one asset manually should become physically truthful. Because `dist.json` is the release marker and must be written last after any repaired asset, one missing asset usually produces two writes:

```txt
files      126   total publish files
uploaded   2     changed files
skipped    124   unchanged files
```

Those two writes are:

```txt
1 missing asset repair
1 dist.json release-marker rewrite
```

The label “changed files” is slightly imprecise for repaired-missing files and release-marker rewrites, but acceptable for the first fix because the write count remains truthful. A later report-label polish could rename this to “uploaded files” without changing deploy semantics.

## Test-first coverage

R2 provider tests were added under:

```txt
code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
```

Covered cases:

- matching remote `dist.json` but missing one expected asset writes that asset and writes `dist.json` last.
- matching remote `dist.json` with all expected files present still skips all files.
- matching remote `dist.json` but current Files list omits `dist.json` rewrites `dist.json` last.
- invalid remote dist continues upload-all fallback behavior.
- partial remote dist part mismatch plus missing expected file writes both changed and missing files, preserving deterministic publish stats order.
- current remote Files projection/list failure in the remote-dist-valid path causes a truthful failed push and no writes/deletes.
- missing-file repair still prunes stale remote-only files after successful `dist.json` write.
- normal remote-dist-valid path uses a single remote listing for missing detection and prune computation.
- force push does not depend on the remote listing to decide writes.
- bounded parallel asset publish semantics remain intact: repaired assets may upload in parallel, `dist.json` remains serial-last.

Endpoint/action tests remain optional for this slice because report wording did not change. Provider mechanics stay in R2 provider tests.

Proofs run:

```txt
deno task test --trace-leaks ./src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
deno task test:deploy
deno task check
deno task dry
```

Live proof:

- manually deleted expected R2 files while leaving remote `dist.json` intact.
- repeated deploy repaired the missing files instead of skipping everything.
- `dist.json` remained the release marker and was uploaded after repaired assets.
- the live run also confirmed the bounded parallel publish path in the real R2 backing; elapsed time was about 12s rather than the prior serial ~1m shape.

## Non-goals

Do not add:

- a `publish.stale` YAML/API option.
- a public upload concurrency knob.
- public low-level bucket vocabulary in deploy YAML/API/UX.
- raw provider delete/write loops in deploy.
- deep byte verification of every remote object.
- signed/private arbitrary binary read repair.
- a new deploy status enum just to represent “missing but repaired.”

## Force fallback

Use force push for manual full rewrite repair when needed:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools/.tmp
deno run --config ../deno.json -P=dev ../src/mod.ts deploy --non-interactive --config ./-config/@sys.tools.deploy/r2-proof.yaml --action push --force
```

This rewrites every staged file and publishes `dist.json` last through the Files write boundary. It remains useful for broad manual repair, but the narrow missing-file-on-unchanged-push case no longer requires force.

## Landed commit boundary

Implementation landed in:

```txt
c1e3767ea fix(deploy): repair missing R2 files on unchanged push
```

Implemented files:

```txt
code/sys.tools/src/cli.deploy/u.providers/provider.r2/u.push.ts
code/sys.tools/src/cli.deploy/u.providers/provider.r2/-test/-u.push.test.ts
```

Adjacent but separate deploy commits:

```txt
826687903 feat(deploy): parallelize R2 file publishes
39c64b4e1 fix(deploy): normalize push report casing
```

## Retirement status

This file can be retired as an active plan.

Reason:

- the planned repair is implemented and committed.
- provider tests and deploy/check/dry gates passed.
- live R2 manual-delete proof confirmed the missing-file repair path.
- no remaining implementation decisions are blocked on this plan.

If retained, keep it as a historical design/proof record rather than an active TODO plan.
