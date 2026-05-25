# driver-vite — centralize Vite config definition

## Status

Implementation and validation are complete in the working tree. `@sys/tmpl` publish propagation cleared the generated-template facade failure; external runtime probes were hardened against stale fixture pins, pretty-JSON parsing, and root-lock localhost pollution. XHIGH TMIND/STIER review from Deno 2.8 lock drift in `@sys/driver-stripe`.

Landed commits:

```text
71c77ae0a chore(lock): refresh vite resolver entry for deno 2.8
0d1137d21 feat(driver-vite): expose config define facade
c6343c9ac refactor(vite): route leaf configs through driver facade
00c91b5eb test(vite): guard config facade ownership boundary
9f143e79c refactor(vite): route release-bound configs through driver facade
```

vite-config-define-facade.plan.md
  [x] chore(lock): refresh vite resolver entry for deno 2.8 — 71c77ae0a
  [x] feat(driver-vite): expose config define facade — 0d1137d21
  [x] refactor(vite): route leaf configs through driver facade — c6343c9ac
  [x] test(vite): guard config facade ownership boundary — 00c91b5eb
  [x] refactor(vite): route release-bound configs through driver facade — 9f143e79c
  [x] docs(plan): close vite config define facade migration

Current reality:

- `Vite.Config.define(...)` / `ViteConfig.define(...)` exists and is the canonical config seam.
- `Vite.Config.define(...)` is runtime-light in local driver code and does not import runtime Vite.
- Live workspace leaf `vite.config.ts` files have been routed through the driver facade.
- Driver-vite local samples, README examples, published-baseline samples, template config, Cell fixture, and external runtime fixture are routed through the driver facade.
- The guard test now locks actual `vite.config.ts` files under `code/` and `deploy/` away from direct `defineConfig` imports; the expected raw-config list is empty.
- Active `code/` / `deploy/` direct `defineConfig` search hits are now only the guard regex itself.
- `@sys/driver-vite@0.0.409` contains the facade and has been published.
- `@sys/tmpl` has been published with refreshed template bundle/pins far enough that generated repo lanes no longer fail with `Vite.Config.define is not a function`.
- Full `deno task test:external` is green after hardening the external probes.
- `deno.lock` no longer contains committed `localhost` remote entries, and full external validation does not reinsert them.
- The stale minimal-crutch expected `@sys/http` pin is gone; the test now derives expected authority from the fixture import map.
- Probe-output JSON parsing now uses a marker and single-line JSON payload rather than assuming the final stdout line is parseable JSON.

## Trigger

After the Deno 2.8 upgrade, `@sys/driver-stripe` failed frozen checks with lock drift:

```text
error: The lockfile is out of date. Run `deno install --frozen=false`, or rerun with `--frozen=false` to update it.
changes:
 100 | +    "npm:vite@*": "8.0.14_esbuild@0.28.0_yaml@2.9.0",
    at file:///Users/phil/code/org.sys/sys/code/sys.driver/driver-vite/src/m.vite.config/u.oxcPreflight.ts:1:37
```

This was not the npm security warning and not the canonical `package.json.overrides` work. It was
Deno resolver/lockfile drift exposed by leaf Vite configs importing Vite directly.

Immediate lock refresh landed separately:

```text
chore(lock): refresh vite resolver entry for deno 2.8
```

## TMIND diagnosis

The brittle seam is leaf packages owning Vite resolution grammar:

```ts
import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'npm:vite';

export default defineConfig(() => Vite.Config.app(...));
```

That makes every Vite-using app/package participate in npm/Vite resolver policy. A Deno resolver
change can then surface as frozen lock drift in unrelated leaf packages, even when their application
code did not change.

`@sys/driver-vite` already owns the real Vite substrate:

- app config construction: `Vite.Config.app(...)`
- path shaping: `Vite.Config.paths(...)`
- workspace resolution and alias policy
- common plugins
- OXC preflight
- Vite type imports in `src/common/t.ts`

So leaf configs importing `npm:vite` directly are an ownership leak.

## STIER target

Make `@sys/driver-vite` the single owner of Vite config definition and Vite dependency resolution.

Preferred leaf shape:

```ts
import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  const paths = Vite.Config.paths({ app: { entry: './src/index.html' } });
  return Vite.Config.app({ paths });
});
```

No leaf package should need:

```ts
import { defineConfig } from 'vite';
import { defineConfig } from 'npm:vite';
```

## Benefits

- One Vite version/resolution policy owner.
- Fewer lockfile edges from leaf packages.
- Less Deno resolver churn after upgrades.
- OXC preflight remains centralized with the rest of `@sys/driver-vite`.
- Leaf app configs stay focused on app structure, not Vite dependency mechanics.
- No signal loss: Vite config typing still comes through the driver facade.

## Implementation plan

### 1. Add `Vite.Config.define(...)` — done

Landed in:

```text
0d1137d21 feat(driver-vite): expose config define facade
```

Files touched:

```text
code/sys.driver/driver-vite/src/m.vite.config/t.ts
code/sys.driver/driver-vite/src/m.vite.config/m.ViteConfig.ts
code/sys.driver/driver-vite/src/m.vite.config/-test/-.test.ts
code/sys.driver/driver-stripe/vite.config.ts
```

Original plan:

Files:

```text
code/sys.driver/driver-vite/src/m.vite.config/t.ts
code/sys.driver/driver-vite/src/m.vite.config/m.ViteConfig.ts
```

Add a facade over Vite's `defineConfig`:

```ts
export type ViteConfigLib = {
  readonly Is: t.ViteConfigIsLib;
  define: typeof import('vite').defineConfig;
  app(options?: t.ViteConfigAppOptions): Promise<t.ViteUserConfig>;
  ...
};
```

Implementation should import `defineConfig` inside `@sys/driver-vite`, not in leaves:

```ts
import { defineConfig as define } from 'vite';

export const ViteConfig: ViteConfigLib = {
  Is,
  define,
  app,
  alias,
  paths,
  fromFile,
  workspace,
};
```

If `typeof import('vite').defineConfig` is clumsy in the type surface, introduce a local exported type
alias in `common/t.ts` next to the existing Vite type exports. Keep the npm/Vite type dependency
centralized in `@sys/driver-vite`.

### 2. Update driver-vite internal samples/tests — done

Landed for local driver-vite samples in:

```text
c6343c9ac refactor(vite): route leaf configs through driver facade
```

Updated:

```text
code/sys.driver/driver-vite/src/-test/vite.sample-1/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-2/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-3/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-bridge/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-config/custom/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-config/simple/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-std-path/vite.config.ts
```

Updated after `@sys/driver-vite@0.0.409` publication:

```text
code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline/vite.config.ts
code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components/vite.config.ts
code/sys.driver/driver-vite/src/m.vite/-test.external/-std-try.runtime.ts
```

These lanes exercise currently published/external driver authority, so they were held until a published driver contained `Vite.Config.define`.

### 3. Update leaf Vite configs — done for live workspace leaves

Landed in:

```text
0d1137d21 feat(driver-vite): expose config define facade
c6343c9ac refactor(vite): route leaf configs through driver facade
```

`0d1137d21` converted the proof consumer:

```text
code/sys.driver/driver-stripe/vite.config.ts
```

`c6343c9ac` converted live workspace leaves:

```text
code/sys.dev/vite.config.ts
code/sys.driver/driver-automerge/vite.config.ts
code/sys.driver/driver-monaco/vite.config.ts
code/sys.driver/driver-pi/vite.config.ts
code/sys.driver/driver-prosemirror/vite.config.ts
code/sys.ui/ui-react-components/vite.config.ts
code/sys.ui/ui-react-devharness/vite.config.ts
deploy/@draft.shell/vite.config.ts
deploy/@tdb.data/vite.config.ts
deploy/@tdb.edu.slug/vite.config.ts
deploy/@tdb.slc.std/vite.config.ts
deploy/@tdb.slc/vite.config.ts
```

Original plan:

Convert workspace leaf `vite.config.ts` files from:

```ts
import { defineConfig } from 'npm:vite';
```

or:

```ts
import { defineConfig } from 'vite';
```

to:

```ts
import { Vite } from '@sys/driver-vite';
```

and `Vite.Config.define(...)`.

Start with the package that exposed the issue:

```text
code/sys.driver/driver-stripe/vite.config.ts
```

Then sweep other Vite leaf configs in the workspace.

### 4. Guard against regression — done

Landed in:

```text
00c91b5eb test(vite): guard config facade ownership boundary
```

The guard scans actual `vite.config.ts` files under `code/` and `deploy/` and asserts the exact raw
`defineConfig` config-file fixtures that remain. After `9f143e79c`, that expected list is empty.

Do not forbid `vite` imports inside `@sys/driver-vite` itself; the driver is the owner.

### 5. Validation — latest landed validation

For `0d1137d21`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno test --node-modules-dir=auto -P=test src/m.vite.config/-test/-.test.ts
deno task check
deno task test
deno task dry
```

For `c6343c9ac`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check && deno task test && deno task dry

cd /Users/phil/code/org.sys/sys
deno check code/sys.dev/vite.config.ts code/sys.driver/driver-automerge/vite.config.ts code/sys.driver/driver-monaco/vite.config.ts code/sys.driver/driver-pi/vite.config.ts code/sys.driver/driver-prosemirror/vite.config.ts code/sys.ui/ui-react-components/vite.config.ts code/sys.ui/ui-react-devharness/vite.config.ts deploy/@draft.shell/vite.config.ts deploy/@tdb.data/vite.config.ts deploy/@tdb.edu.slug/vite.config.ts deploy/@tdb.slc.std/vite.config.ts deploy/@tdb.slc/vite.config.ts

cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components
deno task test && deno task dry

cd /Users/phil/code/org.sys/sys/deploy/@draft.shell
deno check -- ./src/
```

For `00c91b5eb`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno test --node-modules-dir=auto -P=test src/m.vite.config/-test/-facadeBoundary.test.ts
```

For `9f143e79c`:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno test --node-modules-dir=auto -P=test src/m.vite.config/-test/-facadeBoundary.test.ts
deno task check
```

Post-`@sys/driver-vite@0.0.409` external validation initially exposed publish-propagation work, not a live leaf migration issue:

```text
Vite.Config.define is not a function
```

That failure came from generated `@sys/tmpl` external worlds still consuming stale published template/bundle authority.

After `@sys/tmpl` publish propagation, the generated repo lanes passed, proving the template/facade propagation path. Remaining external red lanes were external-test fragility, not facade handoff failure:

```text
expected 'jsr:@sys/http@0.0.285/client' to deeply equal 'jsr:@sys/http@0.0.260/client'
SyntaxError: Unexpected token '}', "}" is not valid JSON
```

Resolution:

- derive minimal-crutch expected `@sys/http/client` authority from the fixture import map,
- emit probe results with a stable marker and single-line JSON,
- run spawned Deno probes with `--no-lock`,
- remove stale committed `localhost` remote lock entries.

Post-fix full external validation is green.

## Non-goals

- Do not solve npm security overrides in this plan. That remains in `npm-overrides.plan.md`.
- Do not change OXC preflight behavior.
- Do not remove Vite as a dependency of `@sys/driver-vite`; central ownership is the point.
- Do not hand-edit generated dependency projections as part of this plan.

## Remaining commit steps

The Vite facade implementation and validation are complete:

```text
vite-config-define-facade.plan.md
  [x] chore(lock): refresh vite resolver entry for deno 2.8 — 71c77ae0a
  [x] feat(driver-vite): expose config define facade — 0d1137d21
  [x] refactor(vite): route leaf configs through driver facade — c6343c9ac
  [x] test(vite): guard config facade ownership boundary — 00c91b5eb
  [x] refactor(vite): route release-bound configs through driver facade — 9f143e79c
  [x] docs(plan): close vite config define facade migration
```

## Docs-close validation

Commit message:

```text
docs(plan): close vite config define facade migration
```

Closed after:

- [x] `@sys/tmpl` publish containing refreshed bundle/template authority has propagated far enough for generated repo lanes.
- [x] External generated repo validation no longer sees `Vite.Config.define is not a function`.
- [x] Minimal-crutch `@sys/http` expected pin is derived from fixture authority.
- [x] Probe-output JSON parsing fragility in minimal-crutch/std-try runtime lanes is fixed.
- [x] External validation is green:

  ```sh
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
  deno task test:external
  ```

- [x] Final local driver validation is green:

  ```sh
  cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
  deno task check && deno task test && deno task dry
  ```

- [x] Incidental `deno.lock` drift from validation is removed; committed `localhost` remote entries are deleted and not reintroduced by the suite.
- [x] Plan status is changed to closed.

## Done when

- [x] `Vite.Config.define(...)` is exposed by `@sys/driver-vite`.
- [x] Existing live leaf Vite configs use only `@sys/driver-vite` for Vite config definition.
- [x] Direct `defineConfig` imports are gone from live leaf package configs.
- [x] Release-bound config fixtures are routed through the driver facade.
- [x] `@sys/driver-vite` remains the only package-level owner of Vite config dependency grammar for live leaves and release-bound configs.
- [x] Regression guard exists for live `vite.config.ts` files and expects no remaining raw config-file fixtures.
- [x] Post-`@sys/tmpl` publish generated repo lanes no longer fail on missing `Vite.Config.define`.
- [x] Full external validation is green.
- [x] Close this plan with `docs(plan): close vite config define facade migration`.
