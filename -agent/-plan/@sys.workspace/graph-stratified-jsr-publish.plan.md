# Graph-stratified JSR publish workflow plan

- [ ] feat(workspace): derive JSR publish strata from the workspace graph
- [ ] feat(workspace): generate graph-stratified JSR publish workflow jobs

## BMIND review

The real subject is not YAML neatness. The subject is release latency under a slow registry.

The current JSR workflow is correct but structurally serial: every package waits behind every earlier
package, even when there is no local dependency relationship. When `deno publish` or JSR confirmation
is slow, the workflow pays that delay once per package.

The repo already has graph truth. The right move is to let graph truth decide which packages can publish
at the same time, while preserving dependency-order and JSR visibility gates.

## Design target

Generate the same `.github/workflows/jsr.yaml` surface from `@sys/workspace`, but emit multiple publish
jobs instead of one long serial publish step list.

Shape:

```yaml
jobs:
  publish_0:
    strategy:
      matrix:
        include: [...]

  publish_1:
    needs: publish_0
    strategy:
      matrix:
        include: [...]

  publish_2:
    needs: publish_1
    strategy:
      matrix:
        include: [...]
```

Each matrix item still runs the hardened per-package publish script:

- verify generated name/version against live `deno.json`;
- run the package preflight currently owned by the publish step;
- short-circuit if the immutable JSR version already exists;
- bound `deno publish` with timeout and kill-after cleanup;
- require immutable JSR metadata visibility before the matrix item succeeds.

## Invariant

A package may publish in parallel with another package only when neither depends on the other's
same-release local package version.

A package in stratum `N + 1` may start only after every package in stratum `N` has either:

- published and confirmed immutable JSR metadata visibility, or
- skipped because that exact immutable version already exists on JSR.

No hand-written buckets.

## Graph source

Use existing workspace graph authority:

- `deno.graph.json` persisted graph:
  - `graph.orderedPaths`
  - `graph.edges`
- `WorkspaceGraph.order(...)` / package-edge helpers where a runtime graph is needed.

Selection remains owned by the current JSR flow:

- publishable package filter;
- optional scope filter;
- `versionFilter: 'all' | 'ahead'`.

After package selection, derive strata from dependency edges whose `from` and `to` are both selected.
If a dependency package is not selected because its version already exists on JSR, it does not block the
selected dependent package.

## Strata algorithm

Input:

- selected package paths in stable workspace order;
- package dependency edges `dependency → dependent`.

Algorithm:

1. Restrict edges to selected package paths.
2. Compute direct selected dependencies for every selected package.
3. Level of a package is:
   - `0` when it has no selected dependencies;
   - `1 + max(level(dep))` otherwise.
4. Preserve stable workspace order within each level.
5. Fail closed on cycles or unknown edge endpoints.

This may be implemented as a small local helper under `m.ci/m.Jsr/` first. If it proves broadly useful,
promote it into `WorkspaceGraph` later.

## Workflow generation changes

Current JSR generator seams:

- `src/m.ci/m.Jsr/u.text.ts`
- `src/m.ci/m.Jsr/u.tmpl.ts`
- `src/m.ci/m.Jsr/u.ts`
- `src/m.ci/m.Jsr/-.test.ts`

Expected changes:

- Add a stratum derivation helper.
- Render one publish job per stratum.
- Use matrix `include` entries with package `name`, `path`, and generated expected `version`.
- Keep OIDC permission on publish jobs.
- Keep `Validate main-only publish commit` as a preflight job that all publish strata need when relevant,
  or duplicate it safely if GitHub Actions conditional needs make a preflight job awkward.
- Add `max-parallel` to matrix strategy, initially conservative (`4`), so parallel publish does not turn a
  slow JSR day into self-inflicted registry pressure.

## TMIND risk analysis

### Risk: stale generated workflow skips a bumped package

Mitigation already exists and must be preserved: matrix item reads live `deno.json` and fails closed if
name/version differs from generated expectations.

### Risk: downstream starts before dependency is visible on JSR

Mitigation: downstream stratum jobs use `needs` on the prior stratum. Each matrix item succeeds only after
immutable metadata is visible or already present.

### Risk: ahead-only selection drops a needed dependency

This is safe only when the dropped dependency version already exists on JSR. The existing ahead filter must
remain authoritative. Do not infer ahead-ness from graph position alone.

### Risk: too much parallelism worsens JSR behavior

Mitigation: generate `strategy.max-parallel` with a conservative default. Tune later from run data.

### Risk: GitHub Actions job-output aggregation becomes complex

Avoid job-output dependency if possible. The JSR visibility check happens inside each matrix item, and
GitHub's matrix job success is enough for `needs` gating.

### Risk: order helper leaks CI policy into graph core

Keep publish-specific selection and stratum policy in `m.ci/m.Jsr/` first. Promote only pure graph-level
helpers if they become reusable.

## DMIND / S-tier criteria

The generated workflow should read as intent:

- dependency strata are visible from job names;
- each matrix item is boring and identical;
- no hand-maintained package buckets;
- no hidden release policy in shell tricks;
- failures name the package and invariant that failed.

S-tier means the next human can open `.github/workflows/jsr.yaml` and understand:

- why some packages run together;
- why later packages wait;
- how JSR visibility is confirmed;
- why the workflow cannot silently skip a stale bumped package.

## Acceptance tests

Add unit coverage for stratum derivation:

- `a → b → c` produces levels `[a]`, `[b]`, `[c]`.
- `a → c`, `b → c` produces `[a, b]`, `[c]` in stable workspace order.
- independent packages publish in the same level.
- edges to non-selected packages do not block selected packages.
- cycles fail closed.

Add YAML rendering coverage:

- generated workflow has multiple `publish_<level>` jobs;
- `publish_1` needs `publish_0`;
- matrix entries include name/path/version;
- hardened publish shell appears in matrix job body;
- `max-parallel` is rendered;
- unsafe name/path/version guards still fail before writing YAML.

Run:

```sh
cd code/sys/workspace
deno task test --trace-leaks ./src/m.ci

deno task check

cd /Users/phil/code/org.sys/sys
deno task prep:ci
```

## Non-goals

- Do not hand-write publish buckets.
- Do not replace GitHub Actions provenance/OIDC.
- Do not move publishing to Deno Deploy in this pass.
- Do not remove the existing test-before-publish human/repo practice.
- Do not make JSR faster; bound and parallelize around its current behavior.

## Rollout

1. Land helper + tests with generated YAML still serial if needed.
2. Switch JSR YAML generation to graph-stratified jobs.
3. Regenerate `.github/workflows/jsr.yaml` with normal prep.
4. Trigger a small ahead-only publish first when possible.
5. Compare runtime against the current serial workflow.
