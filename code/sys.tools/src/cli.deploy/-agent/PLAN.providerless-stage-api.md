# Plan: Providerless stage API pre-step

## Scope

Isolate the `@sys/tools/deploy` API pre-step needed before the `@sys/cell` deploy sample lands.

This plan is only for `@sys/tools/deploy`. Do not create Cell sample files here.

## Goal

Make the deploy CLI contract explicitly safe and proven for this sequence:

```sh
deno run -A jsr:@sys/tools deploy \
  --non-interactive \
  --config ./-config/@sys.tools.deploy/stage.yaml \
  --action stage
```

The endpoint may be providerless. It stages a prebuilt artifact directory with `mode: copy` and does not require push/provider semantics.

## XHIGH TMIND review

Hostile checks:

- If this grows a new Cell-specific API, it is wrong.
- If this couples pull + deploy into one command, it is wrong.
- If providerless config can push, it is wrong.
- If Orbiter placeholders are required for local staging, it is wrong.
- If Deno Deploy's singular `mapping` shape is generalized into static artifact staging, it is wrong.
- If the sample needs `build+copy`, it is no longer a prebuilt-artifact sample.
- If `--help` advertises a path the code cannot run, it is a false public contract.

STIER conclusion:

- The API should be boring: `--non-interactive --config --action stage`.
- The config should be ordinary endpoint YAML: `source`, `staging`, `mappings`.
- Providerless stage is the cleanest symmetry line: stage is generic; push is provider-owned.
- The pre-step likely needs contract proof and help accuracy, not a new abstraction.

## Existing interface evidence

Read and confirmed:

- `code/sys.tools/src/cli.deploy/u.args.ts`
  - parses `--non-interactive`, `--config`, and `--action`.
- `code/sys.tools/src/cli.deploy/u.resolve.nonInteractive.ts`
  - requires `--config` and `--action`, maps `stage+push` to `stage-push`, and validates the endpoint YAML.
- `code/sys.tools/src/cli.deploy/u.endpointAction.ts`
  - dispatches `stage`, `push`, `stage-push`, and `serve`.
  - generic `stage` path runs when provider is not Deno.
- `code/sys.tools/src/cli.deploy/u.endpoints/u.schema.ts`
  - accepts generic providerless docs with `source`, `staging`, and `mappings`.
  - provider variants are additive, not required for stage.
- `code/sys.tools/src/cli.deploy/u.staging/u.execCopy.ts`
  - `mode: copy` copies a source dir, ensures `index.html`, and computes `dist.json`.
- `code/sys.tools/.tmp/-config/@sys.tools.deploy/tdb.fs.yaml`
  - Orbiter endpoint uses the same `source/staging/mappings[]` shape and includes a `copy` mapping.
- `code/sys.tools/.tmp/-config/@sys.tools.deploy/slc.yaml`
  - same endpoint shape; `staging.html.buildReset` is optional.

## Required API contract

A providerless endpoint like this must be accepted and stage successfully:

```yaml
source:
  dir: .

staging:
  dir: ./.tmp/deploy/stage
  clear: true

mappings:
  - mode: copy
    dir:
      source: view/.pulled/ui.components
      staging: .
```

Contract details:

- `provider` is optional for `stage`.
- `source.dir` is the source base.
- `staging.dir` is the staging root.
- `staging.clear: true` clears only the staging root.
- `mappings[].mode: copy` copies a prebuilt artifact tree.
- `mappings[].dir.staging: .` stages into the root of `staging.dir`.
- successful stage writes deploy metadata for the staged tree.
- `push` still requires a provider-backed target and must not become providerless.

## Final implementation

Landed in implementation commit:

```text
10d742e42 test(cli.deploy): lock providerless stage for prebuilt artifacts
```

Final changes:

1. Added scoped deploy test task in `code/sys.tools/deno.json`:
   - `test:deploy` → `deno test -P=test --trace-leaks ./src/cli.deploy`
2. Added shared deploy test fixtures in `code/sys.tools/src/cli.deploy/-test/-fixtures.ts`:
   - typed providerless prebuilt stage doc
   - YAML rendered from that doc via canonical `Yaml.stringify`
   - temp-dir helper
   - console.info capture helper for output assertions
3. Added action-level regression coverage in `code/sys.tools/src/cli.deploy/-test/-u.endpointAction.test.ts`:
   - providerless `stage` stages a prebuilt artifact tree from `source.dir` into `staging.dir`
   - `staging.clear: true` clears only the staging root
   - staged output includes copied files and deploy metadata
   - providerless `push` remains unavailable and reports `reason: no-provider`
4. Added help truthfulness coverage in `code/sys.tools/src/cli.deploy/-test/-u.fmt.help.test.ts`:
   - `--action <stage|push|stage+push>` is advertised
   - direct non-interactive action examples remain truthful
5. Added schema and validation coverage in:
   - `code/sys.tools/src/cli.deploy/u.endpoints/-test/-u.endpoints.schema.test.ts`
   - `code/sys.tools/src/cli.deploy/u.endpoints/-test/-u.endpoints.validate.test.ts`

No runtime behavior change was needed. The existing deploy implementation already supported the contract; this slice locks it as an explicit regression surface.

## Non-goals

- no Cell sample files
- no `@sys/tools/pull` integration
- no Orbiter push automation
- no deploy scaffold/init command
- no Deno provider redesign
- no providerless push
- no `build+copy` path changes
- no task wiring in `@sys/cell`

## Acceptance: final status

- Done: `@sys/tools/deploy` has a regression test proving providerless `--action stage` over a prebuilt directory.
- Done: the test proves `mode: copy` is sufficient for the vanilla sample.
- Done: providerless `push` remains unavailable.
- Done: providerless `push` asserts the exact public reason and hint:
  - `reason: no-provider`
  - `No provider configured for this endpoint.`
- Done: help remains truthful for `--non-interactive --config --action stage|push|stage+push`.
- Done: no new public API was introduced.
- Done: no Cell sample files were created in this slice.

## Verification

Passed from `code/sys.tools`:

```sh
deno fmt --check deno.json src/cli.deploy/-test/-fixtures.ts src/cli.deploy/-test/-u.endpointAction.test.ts src/cli.deploy/-test/-u.fmt.help.test.ts src/cli.deploy/u.endpoints/-test/-u.endpoints.schema.test.ts src/cli.deploy/u.endpoints/-test/-u.endpoints.validate.test.ts
deno task test:deploy
deno task check
deno task test
```

## Follow-on

The Cell deploy sample may now depend on the proven CLI contract:

```sh
deno run -A jsr:@sys/tools deploy --non-interactive --config ./-config/@sys.tools.deploy/stage.yaml --action stage
```
