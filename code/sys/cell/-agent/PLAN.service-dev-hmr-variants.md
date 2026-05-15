# Plan: Cell service modes and live dev/HMR variants

## Status

Rollout ledger. The service-mode rollout is complete and committed: Cell plans, verifies, starts, waits, closes, and renders selected service modes; `@sys/driver-vite/service` exposes `ViteService`; Cell-through-Vite proof exists; README/help document the supported live-dev mode path; and `-sample/cell.vite` demonstrates the static/default and Vite/dev bindings without shell glue or Cell-local adapters.

This plan is retained as the rollout ledger. The implementation met the target: a real development Cell can start a live-dev service without shell hacks, duplicated service identities, or framework creep in the Cell kernel.

A manual operator/browser loop also confirmed that `deno task sample:vite:dev` serves `@sys/ui-react-components` through Vite and live-updates when editing a module in the active browser graph. This is stronger DX evidence, but the standing documentation boundary remains: do not claim general/full browser HMR without a dedicated browser-backed automated proof.

Future work should preserve the same boundary: Cell selects declared bindings; owner endpoints own mechanics.

## Related commits

- `544eeb3cc1fe76eeeee1fcc4721870ffb21c077e` — `feat(cell): plan service mode variant selection`
- `e315999b8e3d5490edc362772a5de102fba37c73` — `feat(cell): start services with selected modes`
- `f7ec20871f6db85e65e92e2faaae4d62e29dd127` — `feat(cell): add start mode cli support`
- `623b123281dc669c075c580226eed0f85315f277` — `feat(driver-vite): expose Cell lifecycle dev service`
- `98796d4f95bc31d096835abaa4ea33035bbe0e95` — `test(cell): prove Vite dev service through Cell mode`
- `a3e6f4b977cce479f57e6aa56f66f802e270e59e` — `docs(cell): document service modes for live dev`
- `364acdfad82a22aa97f9da01ee986ba1589a6d07` — `docs(cell): refine Cell README service-mode guidance`
- `411d895f6abe4bd05bfbc2d1978e61e37e748c99` — `chore(ui-react-components): remove orphan Splash test entry`
- `32ed3d69523a96bb9f5acf8680168a46e37429bd` — `sample(cell): add Vite service mode sample`
- `51e2b4a2cf36b236d55e9e44cf9711635a511531` — `style(cell): normalize CLI path and mode display`

## Sample: `-sample/cell.vite`

Implemented and committed as a configuration-only sample that mirrors the README shape.

Rules:

- Light config only.
- No Cell-local TypeScript adapters.
- No shell-command service/task hacks.
- No custom launcher code.
- Put only Cell descriptor/config under `code/sys/cell/-sample/cell.vite/`.
- Add only convenience task entries in `code/sys/cell/deno.json`.
- Use a dedicated `sample-vite-dev` permission set for the Vite owner endpoint; keep the generic
  `sample` permission set unchanged.
- If making the sample work requires `.ts` glue, env magic, or a script that impersonates a service,
  stop and reassess the owner endpoint/config affordance.

The sample expresses the same one-service/two-binding shape as the README:

```yaml
services:
  - name: view
    use: Serve
    from: 'jsr:@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
    variants:
      dev:
        use: ViteService
        from: 'jsr:@sys/driver-vite/service'
        config: ./-config/@sys.driver-vite/view.dev.yaml
```

The default binding remains a normal static `view` service. The `dev` variant selects the Vite owner
endpoint. Mode is still only a Cell selection key; `ViteService` receives the normal lifecycle args and
owns the project dir, port, Vite behavior, and config schema.

The static binding points at the checked-in `@sys/ui-react-components/dist` artifact. The `dev`
variant points the Vite owner config at the existing `@sys/ui-react-components` workspace package.
No build scripts, adapters, or owner-schema copies were added. The sample has two convenience tasks:

```json
"sample:vite": "deno run -P=sample @sys/cell start ./-sample/cell.vite",
"sample:vite:dev": "deno run -P=sample-vite-dev @sys/cell start ./-sample/cell.vite --mode dev"
```

Keep the README example identical to this descriptor shape or update the README to name the sample
explicitly. Do not let the sample and README drift into two teaching models.

Runtime probes reached ready service status for both sample tasks. The dev sample was also exercised
in a browser: editing the active `@sys/ui-react-components` Splash module updated the page through
Vite. The earlier non-update was explained by editing an orphaned `src/-test/ui.Splash.tsx` file that
was not in the active Vite module graph; that stale file was removed in the related UI commit.

## STIER direction

A Cell service is a conceptual lifecycle slot in a folder-shaped metamedium. A development server is
not a different conceptual service just because the owner endpoint changes from static preview to
live/HMR.

The target property is:

```text
one service identity
→ explicit, reviewable alternative endpoint bindings
→ Cell selects the binding for this run
→ owner endpoint owns all mechanics
→ Cell still only verifies, starts, waits, closes, and renders status
```

This is the line:

- **yes** to explicit service-mode selection in Cell;
- **yes** to Vite/HMR running through a normal lifecycle endpoint;
- **no** to shell-command services/tasks;
- **no** to duplicating `view` and `view:dev` as separate conceptual services;
- **no** to Vite-specific knowledge in Cell;
- **no** to conditionals/env magic that make `cell.yaml` a hidden program.

## Current source reality checked

As of this review:

- `Cell.Services.Service` is `{ name, use, from, config, variants? }`.
- `DescriptorSchema` accepts optional `services[].variants` with complete binding values only.
- `Cell.Services.plan(...)` performs pure mode selection, endpoint-ref resolution, and config path
  resolution without endpoint import or lifecycle side effects.
- `Cell.Services.verify(...)` consumes the plan and imports the selected module binding.
- `Cell.Services.start(...)` calls `verify(...)`, starts services in descriptor order, forwards
  `{ cwd, paths: { config }, silent: true, until }`, and closes already-started services on failure.
- `Cell.Services.status` normalizes owner `status()` snapshots without probing owner-specific fields
  and carries selected service facts for rendering.
- CLI `start` accepts `[dir]`, `--help`, and strict `--mode <mode>`; `--plan`, `--format`,
  `--dry-run`, and extra args remain rejected.
- Start help says Cell starts declared `services[]`, can select declared service variants by mode,
  waits on handles exposing `finished`, and closes started services.
- `@sys/tools/serve` already exposes `Serve.start(args)` as a Cell-compatible lifecycle endpoint and
  returns renderer-neutral status.
- `@sys/driver-vite` exposes `Vite.dev(args)` as a long-running child-process dev server helper.
- `@sys/driver-vite` now exports the Cell lifecycle endpoint module
  `jsr:@sys/driver-vite/service` with public binding `ViteService`.
- Driver-vite service tests prove config loading, lifecycle status, close/dispose, public export shape,
  and `Vite.dev(...)` argument mapping.
- Cell-through-Vite integration tests prove `Cell.Services.plan/start` select `variants.dev`, start
  `ViteService` through Cell lifecycle, render selected mode/module/config, fetch Vite HTML,
  `/@vite/client`, and the app entry module, then close through Cell.
- `-sample/cell.vite` is committed as light config only: base `Serve` binding points at the checked-in
  `@sys/ui-react-components/dist` artifact; `variants.dev` points at `ViteService` and the workspace
  `@sys/ui-react-components` package.
- `deno.json` keeps static sample permissions on `sample` and isolates Vite dev permissions under
  `sample-vite-dev`.
- CLI path rendering now routes filesystem path display through a local `FmtPath.display(...)` helper
  using `Fs.trimCwd(...)` and `Cli.Fmt.Path.str(...)`; selected non-default service modes render as an
  accented value.

## BMIND assessment of the previous note

The original note had the right instinct but left several edges too soft for implementation.

### What was right

- It rejected shell orchestration.
- It rejected duplicate conceptual services such as `view` and `view:dev`.
- It framed Vite/HMR as pressure on a general Cell service-selection capability.
- It kept endpoint mechanics owned by the endpoint package.
- It required real tests rather than documentation claims.

### What was missing

- No final vocabulary split between descriptor data and run selection.
- No rule for what happens when a run mode is selected and only some services define that mode.
- No schema shape precise enough to prevent partial-overlay ambiguity.
- No public type/story for verified/started service records when the selected endpoint differs from
  the base descriptor endpoint.
- No status-rendering rule for selected mode/variant.
- No account of the fact that `@sys/driver-vite` lacked a Cell service endpoint export at that time.
- No concrete migration/testing commit sequence.

### Main risk

The elegant-looking feature can become slop if Cell starts interpreting service kinds or owner config.
The safe design is not "Cell knows dev". The safe design is "Cell selects a declared endpoint binding
named by an explicit run mode".

## Vocabulary decision

Use two terms deliberately:

- **variant**: descriptor-side alternative binding for one service.
- **mode**: run-side selector applied to the service graph.

This gives natural operator speech while keeping the data model exact:

```sh
@sys/cell start --mode dev .
```

selects service variants named `dev` where present.

Avoid exposing `--variant dev` as the primary CLI term. Operators start a Cell in a mode; services
contain variants.

## Descriptor shape

Base service entries stay valid and remain the default binding:

```yaml
services:
  - name: view
    use: Serve
    from: 'jsr:@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
```

A service may add explicit variant bindings:

```yaml
services:
  - name: view
    use: Serve
    from: 'jsr:@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
    variants:
      dev:
        use: ViteService
        from: 'jsr:@sys/driver-vite/service'
        config: ./-config/@sys.driver-vite/view.dev.yaml
```

### Descriptor rules

- The base service binding is the default binding.
- `variants` is optional.
- Each `variants.<mode>` value is a complete service binding: `use`, `from`, and `config` are all
  required.
- Variant bindings do not contain `name`; the service identity remains the parent service `name`.
- Variant bindings do not contain nested `variants`.
- Partial overlay semantics are rejected. Do not merge "just config" or "just from" with the base.
- `default` is reserved and should not be accepted as an authored variant name.
- Mode/variant keys use the Cell ID grammar.
- Public `@sys` refs inside variants should follow the same endpoint-ref rule as services/tasks:
  prefer explicit `jsr:@sys/...`; trust is by package identity.
- Cell-local variant adapters remain relative refs under the Cell root.

The complete-binding rule is important. It avoids guessing whether a dev config is compatible with a
static serve endpoint, or whether a dev endpoint is compatible with a static config.

## Selection semantics

`Cell.Services` should select an effective service binding before verify/start.

Default start:

```text
mode omitted or `default` → use every base service binding
```

Mode start:

```text
mode = X → for each service:
  if service.variants?.[X] exists, use that complete variant binding
  otherwise use the base binding
```

Failure rules:

```text
blank/empty mode → fail clearly as an invalid service mode
mode = X and no service defines variant X → fail clearly as an unknown service mode
```

This preserves practical dev composition: a `view` service can switch to Vite while `api` or
`stripe.fixture` continues using its base binding. It also catches typo modes such as `--mode dve`.

Do not add service enable/disable conditionals in the first pass. If a future real Cell needs modes
that add or remove services, design a separate static service-set/profile feature. Do not smuggle it
into variants with `enabled: false`, `when`, env checks, or null endpoints.

## Public API direction

Add mode selection to service planning/verification/start, not only to CLI.

Candidate minimal surface:

```ts
type ServiceMode = t.Cell.Id | 'default';

type Services.VerifyOptions = TrustOptions & {
  readonly mode?: ServiceMode;
};

type Services.StartOptions = Services.VerifyOptions & {
  readonly until?: t.UntilInput;
};
```

Add a pure service plan step:

```ts
Cell.Services.plan(cell, { mode?: 'dev' })
```

A service plan should resolve config paths and endpoint refs but should not import endpoint modules or
start services. This mirrors the task planning posture and gives tests a pure place to lock selection
semantics. It is the anti-slop seam: mode selection is visible before lifecycle side effects.

`verify(...)` should consume `Cell.Services.plan(...)` rather than reimplementing selection. The desired stack is:

```text
Cell.Services.plan  → pure selection/path/ref resolution
Cell.Services.verify → plan + dynamic endpoint import/contract check
Cell.Services.start  → verify + lifecycle start/wait/close semantics
```

## Verified/started service shape

The current `VerifiedService.service` is used by status rendering as the service facts Cell displays.
When a variant is selected, those facts must describe the effective selected binding, not the base
binding. Otherwise Cell would show `jsr:@sys/tools/serve` while running `jsr:@sys/driver-vite/service`.

Candidate shape:

```ts
type ServiceBinding = {
  readonly use: string;
  readonly from: string;
  readonly config: t.Cell.Path;
};

type Service = ServiceBinding & {
  readonly name: t.Cell.Id;
  readonly variants?: Record<t.Cell.Id, ServiceBinding>;
};

type ServiceSelection = {
  readonly name: t.Cell.Id;
  readonly mode: 'default' | t.Cell.Id;
  readonly variant?: t.Cell.Id;
  readonly descriptor: Service;
  readonly binding: ServiceBinding;
};

type VerifiedService = {
  /** Effective selected service facts: same shape existing renderers already consume. */
  readonly service: { readonly name: t.Cell.Id } & ServiceBinding;
  /** Audit trail back to descriptor + selected mode. */
  readonly selection: ServiceSelection;
  readonly paths: { readonly config: t.StringPath };
  readonly endpoint: LifecycleEndpoint;
};
```

This preserves the useful existing `started.services[i].service.name/from/config` path while making the
selection auditable. The exact type can be refined during implementation, but the invariant must hold:
Cell output must not display stale base endpoint facts for a variant-selected service.

## CLI direction

Add explicit start mode selection:

```sh
@sys/cell start [dir]
@sys/cell start [dir] --mode dev
```

Parsing should remain strict:

- `--mode` is scoped to `start` only.
- `--mode` requires a value.
- repeated `--mode` fails.
- unknown mode fails if no service declares that variant.
- extra args still fail.

A start plan affordance is desirable if it stays small:

```sh
@sys/cell start [dir] --plan
@sys/cell start [dir] --mode dev --plan
```

If added, `--plan` for start should print selected services without importing modules or starting
servers. If not added in the first implementation slice, API-level `Cell.Services.plan(...)` tests
should still exist so the selection model is not hidden inside `start(...)`.

## Status/rendering direction

Cell status output should stay quiet and owner-neutral.

Default mode should not add noise:

```text
service   view
module    jsr:@sys/tools/serve
config    .../view.yaml
```

Non-default selected variants should be visible:

```text
service   view
mode      dev
module    jsr:@sys/driver-vite/service
config    .../view.dev.yaml
```

Do not render both base and selected endpoints in normal output. If a plan view exists, it may show the
base-to-selected relationship for review. Runtime status should show what is actually running.

Owner `status()` remains renderer-neutral and owner-owned. Cell may add a Cell-owned `mode` row, but
must not parse Vite internals or dist/config files.

## `@sys/driver-vite` endpoint work

Cell variants alone are not enough. `@sys/driver-vite` needs a real Cell-compatible lifecycle endpoint
before Cell docs/examples can show it as a supported path.

Candidate public export:

```text
jsr:@sys/driver-vite/service
```

Candidate endpoint binding:

```ts
export const ViteService = {
  async start(args) {
    // load owner config from args.paths.config
    // call Vite.dev({ cwd: args.cwd, paths/port from owner config, silent: args.silent, until: args.until })
    // return a handle with finished, status(), close(reason)
  },
};
```

Important constraints:

- The endpoint should implement the Cell lifecycle contract structurally; it does not need Cell core
  to import Vite types or Vite to import Cell types.
- Vite config schema and config-writing affordances belong to `@sys/driver-vite`, not Cell.
- The handle should expose `status(): t.Service.Status` with `kind` like `vite:dev`, URL(s), config,
  root, and minimal details.
- The handle should expose `finished` so `@sys/cell start` waits correctly.
- The handle should expose `close(reason)` or `dispose(reason)` so Cell shutdown remains uniform.
- No Cell special case should mention Vite.

Now that Cell-through-Vite proof exists, published Cell docs may describe the tested live-dev service-mode path. Do not claim full browser HMR beyond the fetch-level Vite dev proof.

## Vite/HMR proof target

Do not claim full HMR unless a test proves it.

Minimum Cell-through-Vite proof:

1. A fixture Cell declares `view` with a default static serve binding and a `dev` variant pointing to
   the Vite service endpoint.
2. `Cell.Services.plan(cell, { mode: 'dev' })` selects the `view` dev variant and keeps service name
   `view`.
3. `Cell.Services.start(cell, { mode: 'dev', until })` starts the Vite endpoint through the normal
   lifecycle contract.
4. Cell-rendered service status shows `service view`, `mode dev`, selected module/config, and the Vite
   URL.
5. Fetching the service URL returns HTML containing `@vite/client`.
6. Fetching `/@vite/client` from the dev server returns a client module response.
7. Fetching the app entry module succeeds.
8. `started.close(...)` shuts the dev server down.

Optional stronger proof:

- A WebSocket connection to the Vite HMR endpoint completes a protocol handshake or receives a Vite
  protocol message.

Browser-backed full HMR should remain a separate higher-tier proof. Do not put "full browser HMR" in
README/help unless a browser test exercises an actual source edit and update propagation.

## Schema/migration posture

This should be an additive descriptor evolution:

- existing `version: 1` descriptors remain valid;
- `services[].variants` becomes optional;
- no existing service must change;
- no descriptor rewrite is performed by Cell;
- old runtimes will reject new `variants` because schema is strict, which is acceptable for a new
  feature but should be documented in release notes/help.

A descriptor version bump is not earned unless implementation discovers a true breaking semantic
change. Adding an optional field to current `version: 1` is the expected path.

## Test plan

### Schema tests

- accepts a service with `variants.dev` complete binding;
- rejects variant entries missing `use`, `from`, or `config`;
- rejects `variants.default`;
- rejects nested `variants` inside a variant;
- rejects unknown variant fields;
- preserves existing service/task strictness.

### Pure selection/plan tests

- default mode selects base bindings;
- `mode: 'default'` selects base bindings;
- `mode: 'dev'` selects only services with `variants.dev` and leaves other services on base;
- unknown mode with zero matches fails clearly;
- selected variant preserves parent service name;
- selected variant resolves its own config path;
- selected variant resolves endpoint refs through the shared endpoint-ref resolver;
- relative variant refs remain constrained to the Cell root;
- public JSR variant refs use package-identity trust.

### Verify/start tests

- verify imports the selected variant endpoint, not the base endpoint;
- start passes selected variant `paths.config` to the endpoint;
- start forwards `until` unchanged;
- failure cleanup still closes already-started services in reverse order;
- import/evaluation failure after local endpoint-ref selection does not fall back to JSR.

### CLI tests

- `start --mode dev` is accepted and passes mode to `startCell`/`Cell.start`;
- `--mode` outside `start` fails;
- missing, blank, boolean, repeated, or invalid `--mode` fails clearly;
- `start --mode unknown` fails when no service declares that mode;
- output for default mode remains uncluttered;
- output for non-default selected variant includes `mode dev` and selected module/config;
- if `start --plan` is added, it does not import endpoints or start services.

### Driver-vite tests

- Vite service endpoint loads its owner config and starts `Vite.dev(...)`;
- endpoint handle exposes `finished`, `status()`, and `close/dispose`;
- status is renderer-neutral and includes URL(s);
- close shuts down the child process.

### Cell-through-Vite integration

- fixture Cell starts `view` in `dev` mode through the variant path;
- fetched HTML contains `@vite/client`;
- `/@vite/client` fetch succeeds;
- app entry fetch succeeds;
- Cell shutdown closes Vite.

## Implementation slices

Implemented commit sequence:

1. `feat(cell): plan service mode variant selection`
   - schema/types for service variants;
   - pure selection/plan helper;
   - resolver/path tests.

2. `feat(cell): start services with selected modes`
   - verify/start consume selected service bindings;
   - status model/rendering shows non-default mode.

3. `feat(cell): add start mode cli support`
   - CLI parses and validates `start --mode <mode>`;
   - start output carries non-default mode.

4. `feat(driver-vite): expose Cell lifecycle dev service`
   - owner config loader/schema;
   - `jsr:@sys/driver-vite/service` export;
   - lifecycle/status/close tests.

5. `test(cell): prove Vite dev service through Cell mode`
   - cross-package Cell fixture using `variants.dev`;
   - fetch/status/close proof.

6. `docs(cell): document service modes for live dev`
   - DSL/help only after behavior is proven;
   - examples should use explicit `jsr:@sys/...` refs;
   - no README claim beyond tested behavior.

7. `docs(cell): refine Cell README service-mode guidance`
   - tighten README framing around Cell's boundary;
   - keep service-mode examples concise and descriptor-shaped.

8. `chore(ui-react-components): remove orphan Splash test entry`
   - remove stale UI file that was not in the active Vite/browser module graph.

9. `sample(cell): add Vite service mode sample`
   - add configuration-only `-sample/cell.vite`;
   - add static and dev sample tasks;
   - isolate Vite dev permissions under `sample-vite-dev`.

10. `style(cell): normalize CLI path and mode display`
    - accent selected non-default mode values;
    - route CLI path display through `FmtPath.display(...)` and `Fs.trimCwd(...)`.

Keep slices small. Do not let Cell absorb Vite config or HMR protocol details.

## Non-goals

- No shell-command service or task primitive.
- No Vite special case in Cell.
- No env-var magic for selecting service behavior.
- No service `enabled/disabled/when` language in this pass.
- No partial variant overlays.
- No duplicate service names to represent modes.
- No npm fallback/trust changes.
- No owner config schema in Cell.
- No browser-HMR claim without a browser-backed proof.

## STIER acceptance

The implementation is acceptable because:

- the same Cell can start its stable/default service graph and a live dev graph;
- the operator selects dev explicitly, e.g. `@sys/cell start --mode dev`;
- a conceptual service such as `view` keeps one service identity across modes;
- selected endpoint refs/config refs are visible and testable;
- service and task endpoint trust/resolution rules remain shared where applicable;
- Cell remains owner-neutral and late-bound;
- Vite/HMR runs through a normal lifecycle endpoint;
- shutdown/status semantics remain uniform;
- docs/help claim only behavior proven by tests.
