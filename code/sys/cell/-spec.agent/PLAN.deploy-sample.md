# Plan: Cell deploy sample

## Status

Done for now. The deploy sample is implemented as finite Cell actions that call `@sys/tools`
programmatic owner APIs directly.

## Intent

Land a vanilla `@sys/cell` sample that demonstrates `@sys/tools/deploy` with a prebuilt view
artifact.

The sample should prove the boring path:

1. pull a published `dist.json` artifact into the Cell view tree
2. stage that pulled artifact without rebuilding it
3. leave Orbiter push as an explicit operator action with real credentials/site config

The sample now uses Cell action composition for the default operator flow. Local sample glue is
limited to tiny adapters that call `Pull.run(...)` and `Deploy.stage(...)`.

## Current truth

`@sys/tools` now exposes the programmatic owner APIs needed by this sample:

```ts
Pull.run({ cwd, config });
Deploy.stage({ cwd, config });
```

The Cell sample uses these APIs through local `-scripts/deploy.ts` adapters. There is no deploy
scaffold/init API required for this sample. The sample provides the config files directly.

## Prerequisite status

The `@sys/tools/deploy` pre-step is done for this sample's needs.

Confirmed current state:

- `@sys/tools` is at `0.0.407` locally.
- `test:deploy` exists in `code/sys.tools/deno.json`.
- `runEndpointAction({ action: 'stage' })` has a regression test for providerless prebuilt artifact
  staging.
- Providerless stage is proven with `source`, `staging`, and `mappings[]` only.
- Providerless push is proven unavailable and reports `no-provider`.
- Help has a regression test for `--non-interactive --config --action stage|push|stage+push`.

Proof command already run:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task test:deploy
```

Result:

```text
ok | 28 passed (164 steps) | 0 failed
```

The Cell deploy sample now depends on this contract instead of carrying deploy-tool mechanics.

## BMIND interface check

Checked the deploy endpoint interface against multiple existing implementations:

- `code/sys.tools/.tmp/-config/@sys.tools.deploy/tdb.fs.yaml`
  - Orbiter endpoint uses `provider`, `source.dir`, `staging.clear`, `staging.dir`, and
    `mappings[]`.
  - It mixes `build+copy` and `copy`; the `copy` shape is the one this sample needs.
- `code/sys.tools/.tmp/-config/@sys.tools.deploy/slc.yaml`
  - Orbiter endpoint uses the same top-level shape and adds `staging.html.buildReset` for built app
    outputs.
  - That confirms `html.buildReset` is optional, not part of the minimal staging contract.
- `code/sys.tools/src/cli.deploy/u.endpoints/u.schema.ts`
  - Generic endpoint YAML is valid with `source`, `staging`, and `mappings` and no provider.
  - Provider-specific docs are separate variants over the same endpoint concept.
- `code/sys.tools/src/cli.deploy/u.providers/provider.orbiter/mod.ts`
  - Orbiter owns `EndpointSchema`, `Schema`, `probe`, and `push`.
  - Push is provider-owned; generic stage does not need Orbiter.
- `code/sys.tools/src/cli.deploy/u.providers/provider.deno/mod.ts`
  - Deno owns a different provider-specific stage/prepare/push path and a singular `mapping` shape.
  - Do not force Deno symmetry onto this static pulled-artifact sample.
- `code/sys.tools/src/cli.deploy/u.providers/provider.noop/mod.ts`
  - Noop proves provider discrimination is first-class, but adding `provider: noop` would teach the
    wrong thing here.

Design conclusion: use the providerless generic endpoint for `sample:deploy` staging, and keep
Orbiter in an example/operator config only.

## S-tier corrections

- The default pulled artifact is `https://fs.db.team/ui.components/dist.json`.
- The sample should be baseline/vanilla, not Stripe-shaped.
- `cell.stripe` remains the runtime composition sample.
- `deno task start` remains mapped to `deno task sample:stripe`.
- Add a sibling `sample:deploy` task for the deploy sample path.
- `sample:deploy` should run pull → stage only.
- Do not make a default sample task perform a credentialed Orbiter push.
- Keep deploy config owned by `@sys/tools/deploy`; do not put it in `cell.yaml`.

## Design requirement

This must stay cheap and principled:

- a few config files
- a `cell action sample:deploy` task entry
- tiny local adapters that call owner programmatic APIs
- no app source
- no build step
- no runtime services
- no new deploy abstraction inside Cell
- no Stripe coupling
- no credentialed push by default

If implementation grows materially beyond that, it is probably drifting.

## Current anchors

- Existing runtime sample: `code/sys/cell/-sample/cell.stripe`
- Existing start task: `start` → `sample:stripe`
- Existing sample task: `sample:stripe` → starts `cell.stripe`
- Deploy sample task: `sample:deploy` → pulls and stages `cell.deploy`
- Pulled artifact config: `./-config/@sys.tools.pull/view.yaml`
- Pulled artifact target: `./view/.pulled/ui.components`
- Source artifact URL: `https://fs.db.team/ui.components/dist.json`
- Deploy stage config: `./-config/@sys.tools.deploy/stage.yaml`
- Optional Orbiter example config: `./-config/@sys.tools.deploy/orbiter.example.yaml`

## Preferred sample shape

Create a fresh deploy sample next to `cell.stripe`.

Candidate path:

```text
code/sys/cell/-sample/cell.deploy/
```

Why:

- keeps `cell.stripe` focused on Cell runtime composition and Stripe fixture services
- keeps deploy concerns isolated and easy to inspect
- avoids implying deploy is part of `cell.yaml`
- gives `@sys/tools/deploy` a clean baseline sample with a generic UI artifact

## Sample concept

A "nothing doing" Cell:

- no application build step
- no custom runtime services required for deployment
- no generated app source required
- only a prebuilt pulled artifact is staged
- Orbiter push is available, but not run by default sample automation

The artifact source is `ui.components` because it is generic baseline UI, not a domain-specific
runtime sample.

## Implemented files

```text
code/sys/cell/-sample/cell.deploy/
  -scripts/deploy.ts
  -config/@sys.cell/cell.yaml
  -config/@sys.tools.pull/view.yaml
  -config/@sys.tools.deploy/stage.yaml
  -config/@sys.tools.deploy/orbiter.example.yaml
```

Generated/operator-local paths:

```text
code/sys/cell/-sample/cell.deploy/
  .tmp/deploy/stage/
  .tmp/deploy/orbiter/
  view/.pulled/ui.components/
  -config/@sys.tools.deploy/orbiter.yaml       # optional real operator config
```

`cell.yaml` should stay minimal. Deploy config is owned by `@sys/tools/deploy`, not Cell.

## Local stage endpoint

`stage.yaml` is executable and providerless. It proves local staging without requiring Orbiter
credentials.

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

Notes:

- `mode: copy` is the important sample signal: the deploy path uses a prebuilt pulled artifact.
- No `build+copy` mapping should appear in this sample.
- Omit `staging.html.buildReset` by default so the sample is a clean artifact copy, not an HTML
  mutation demo.
- The deploy tool will still compute staging metadata for the staged tree.

## Optional Orbiter endpoint

`orbiter.example.yaml` mirrors the same mapping and adds only provider information.

```yaml
provider:
  kind: orbiter
  siteId: <orbiter-site-id>
  domain: <domain>

source:
  dir: .

staging:
  dir: ./.tmp/deploy/orbiter
  clear: true

mappings:
  - mode: copy
    dir:
      source: view/.pulled/ui.components
      staging: .
```

Notes:

- The Orbiter provider requires a real `siteId` and `domain`; placeholder config is documentation,
  not an executable push target.
- A real `orbiter.yaml` may be operator-local if a live push is needed.
- `stage+push` should remain a manual/operator command until separate stage and push are proven.

## Task alignment

Keep existing runtime task behavior:

```json
"start": "deno task sample:stripe",
"sample:stripe": "deno run -P=sample ./-scripts/task.sample.ts"
```

Sibling deploy task target:

```json
"sample:deploy": "deno run -P=sample @sys/cell action sample:deploy ./-sample/cell.deploy"
```

The Cell action graph should do:

1. run `pull:view`
2. run `deploy:stage`
3. stop before push

The action adapters call `Pull.run(...)` and `Deploy.stage(...)`, not shell out to `@sys/tools`.

## Operator flow

From `code/sys/cell`:

```sh
deno task sample:deploy
```

This runs `pull:view` and then `deploy:stage` through Cell action composition.

With real Orbiter config:

```sh
deno run -A jsr:@sys/tools deploy --non-interactive --config ./-config/@sys.tools.deploy/orbiter.yaml --action stage
deno run -A jsr:@sys/tools deploy --non-interactive --config ./-config/@sys.tools.deploy/orbiter.yaml --action push
```

Use `stage+push` only after the separate stage and push flow is proven.

## Planning decisions

- Do not put deploy config into `cell.yaml`.
- Do not introduce a Cell deploy service unless a real runtime lifecycle owner appears.
- Do not make the sample build anything.
- Do not require Stripe fixture runtime just to deploy a static view artifact.
- Keep `cell.stripe` and `sample:stripe` as the runtime-start sample.
- Keep `cell.deploy` and `sample:deploy` as the local deploy-staging sample.
- Keep Orbiter credentials and site IDs operator-supplied.
- Keep the first implementation file-only and local-first; no network push in automated tests.

## Proof status

Local proof completed:

- `code/sys.tools`: `deno task test:deploy` → passed
- `code/sys.tools`: `deno task check` → passed
- `code/sys/cell`: `deno task sample:deploy` → pulled `ui.components` and staged `.tmp/deploy/stage`
- `code/sys/cell`: `deno task clean` → removes sample deploy `.tmp`
- `code/sys/cell`: `deno task check` → passed
- `code/sys/cell`: `deno task test` → passed
- `Cell.load` validates the deploy sample descriptor alongside the Stripe sample descriptor

Manual/operator proof:

- with real Orbiter config and credentials, `push` deploys the staged root
- `stage+push` works after separate actions are proven

## Open questions

- Should a later `sample:deploy:push` task exist, or should push remain a documented manual command?
- What canonical Orbiter sample site/domain should the operator-facing example mention once one
  exists?
