# cli.deploy — Deno Integration Plan

## Summary

- The current `cli.deploy` Deno work produced real signal and exposed the real seam failure.
- The architectural boundary is now clear:
  - endpoint YAML owns authored intent
  - `@sys/tools/deploy` owns operator orchestration
  - `@sys/driver-deno` owns Deno Deploy truth
- The correct Deno execution contract is:
  - `stage -> prepare -> deploy`
- `push` must never re-stage.
- At the tools layer, Deno `push` may auto-create the remote app, but only on an explicit recognized missing-app failure.
- Near-term YAML compatibility matters:
  - the current endpoint schema is still Orbiter-shaped
  - Deno should fit it with the least-disruptive authored shape first
- The current push-planning seam is also Orbiter-shaped:
  - generic push planning must be separated from Orbiter shard planning before Deno is wired through it cleanly
- The shared endpoint scaffold is shared authored syntax, not a promise of one universal runtime staging executor.
- This pass should harden the seam, not reopen the core architecture.

## 1. Pre-clean

- Keep the endpoint YAML scaffold improvements already proven useful.
- Preserve one universal endpoint scaffold; do not split Deno and Orbiter templates.
- Treat that scaffold as shared authored config syntax interpreted per provider.
- Keep the existing mapping schema intact in the first pass:
  - `copy`
  - `build+copy`
  - `index`
- For Deno endpoints, use the least-disruptive schema fit:
  - `mode: index`
  - `dir.staging: '.'`
- Treat that Deno mapping as package-target selection, not as Orbiter shard/index behavior.
- Do not add a per-mapping `provider` discriminator.
- Defer shared mapping noun redesign until after the real Deno path is proven end to end.
- Keep the YAML-level provider shape truthful even if the runtime push-planning seam is still being de-Orbitered underneath it.

### Commit spine

~~~text
refactor(cli.deploy): tighten the endpoint yaml scaffold and placeholder examples
~~~

~~~text
refactor(cli.deploy): keep deno mappings compatible with the existing endpoint schema
~~~

~~~text
refactor(cli.deploy): separate generic push planning from orbiter shard planning
~~~

## 2. Tighten The Deno Driver Seam

- `@sys/driver-deno` already owns the real Deno Deploy truth.
- `DenoDeploy.deploy(...)` already accepts a staged artifact.
- The real missing public seam is `prepare()` or a public equivalent of it.
- Expose staged-artifact preparation on the public `DenoDeploy` surface.
- Keep the hard execution contract explicit and tested:
  - `stage -> prepare -> deploy`
- Promote the deploy formatters needed by external callers to the public `DenoDeploy.Fmt` surface:
  - `deployConfig`
  - `deployResult`
  - renamed public failure formatter for decomposed deploy errors
- Keep `pipeline()` as the combined convenience path.
- Do not force Orbiter symmetry unless it is clearly earned after the Deno path is finished.

### Required outcome

- `stage` -> `DenoDeploy.stage(...)`
- `prepare` -> public staged-artifact preparation seam
- `deploy` -> deploy a prepared staged artifact
- `prepare()` is mandatory between `stage()` and `deploy()`
- no re-stage

### Commit spine

~~~text
feat(driver-deno): expose staged artifact preparation as a public deploy seam
~~~

~~~text
test(driver-deno): verify standalone stage → prepare → deploy
~~~

~~~text
feat(driver-deno): promote deploy formatting helpers to public Fmt surface
~~~

## 3. Rebuild The Tools Integration

- De-Orbiter the push-planning seam before treating Deno as just another `PushTarget`.
- The current generic push surface is not actually generic:
  - `PushTargetPlan.stats`
  - `resolvePushTargets()`
  - and the `pushCapability` flow currently encode Orbiter shard/root/base concepts
- Fix this in a principled way:
  - keep Orbiter shard planning explicit
  - introduce a minimal provider-neutral push planning shape for shared menu/provider flow
  - do not widen Orbiter stats into fake generic Deno meanings
- Preferred shape:
  - `PushTarget` can widen by provider kind
  - provider-neutral planning returns only what shared menu flow actually needs
    - `targets`
    - minimal generic stats if any, ideally just `total`
  - Orbiter-specific shard/root/base/skipped stats stay Orbiter-only
  - Deno gets its own target resolution/planning path with no shard taxonomy
- Prefer sharper names when splitting the seam:
  - shared: `resolvePushPlan` or `resolvePushCandidates`
  - Orbiter-only: `resolveOrbiterPushTargets`
- Do not let one shared `stats` object become a mixed provider dumping ground again.
- Rebuild the Deno adapter over the improved driver seam.
- Keep `stage` and `push` as independent operator actions.
- Resolve the Deno package target from:
  - `source.dir + mappings`
- For Deno endpoints, the authored mapping is a compatibility fit over the existing schema:
  - `mode: index`
  - `dir.staging: '.'`
- In Deno flows, that mapping means package-target selection, not Orbiter-style filesystem copy execution.
- Deno `stage` in `cli.deploy` must:
  - resolve the package target
  - clean `staging.dir`
  - fail fast if `staging.dir` resolves inside the workspace root
  - call `DenoDeploy.stage(...)`
- Do not route Deno stage through `executeStaging(...)`.
- `executeStaging(...)` remains Orbiter/static-site staging logic.
- Shared mapping syntax does not imply shared runtime staging semantics.
- Prefer a clear tools-level validation error for an invalid Deno stage root instead of surfacing a raw driver error.
- Persist staged Deno metadata in a small JSON sidecar inside the staged root.
- Make that sidecar a first-class typed contract with validation.
- Minimum persisted fields:
  - `target.dir`
  - `workspace.dir`
  - `root`
  - `entry`
- Reconstitute sidecar data into the narrowest shape `prepare()` actually needs.
- Prefer widening the public prepare input type to accept:
  - `workspace: { dir: string }`
  instead of asserting a full `DenoWorkspace` from sidecar JSON.
- Deno `push` in `cli.deploy` must:
  - load the persisted sidecar
  - call `prepare`
  - attempt `deploy`
  - if and only if deploy fails with an explicit recognized missing-app condition:
    - call `DenoDeploy.App.create(...)` from the same staged/prepared truth
    - retry deploy
- Do not auto-create on broad or ambiguous failure.
- Implement missing-app recovery through a dedicated classifier helper, not ad hoc string branching inside `push`.
- Reuse driver formatter primitives where they fit the decomposed path.
- Do not assume full `Fmt.listen()` reuse once `push` stops using `pipeline()`.
- Treat `deno task build` in the target package as a real staging precondition.
- Do not silently skip missing build support.

### Deno provider YAML shape

```yaml
provider:
  kind: deno
  app: <deno-app-name>
  org: <optional-org>
  tokenEnv: <optional-token-env>
  verifyPreview: <optional-bool>

source:
  dir: <source-base>

staging:
  dir: <absolute-stage-root>
  clear: true

mappings:
  - mode: index
    dir:
      source: <package-target-under-source-base>
      staging: .
```

### Commit spine

~~~text
refactor(cli.deploy): de-orbiter the shared push planning types and menu flow
~~~

~~~text
refactor(cli.deploy): make deno stage and push share one staged artifact path
~~~

~~~text
refactor(cli.deploy): persist staged deno artifact metadata between stage and push
~~~

~~~text
refactor(cli.deploy): wire the deno provider around the standalone stage → prepare → deploy path
~~~

~~~text
refactor(cli.deploy): reuse driver-deno formatter primitives for deno stage and push
~~~

~~~text
refactor(cli.deploy): let deno push create a missing app from the staged artifact path
~~~

## 4. Cleanup

- Remove misleading UI assumptions left from the partial integration.
- Reduce the noticeable first-render pause in `@sys/tools/deploy`.
- Revisit wording and DX naming only after the real Deno path is proven end to end.

### Commit spine

~~~text
refactor(cli.deploy): reduce the initial deploy menu render pause
~~~

## Test Plan

- Schema:
  - Deno endpoint YAML validates under the existing mapping schema
  - Deno authored mappings use `mode: index` and `dir.staging: '.'`
- Push planning:
  - shared menu/provider flow works from a provider-neutral push planning shape
  - Orbiter shard/root/base/skipped stats remain correct on the Orbiter-specific path
  - Deno push planning resolves a single provider target with no fake shard/base/root meanings
- Driver:
  - standalone `stage -> prepare -> deploy` path passes
  - promoted public `Fmt` helpers are exported and usable
  - `pipeline()` remains unchanged
- Tools integration:
  - Deno `stage` writes to the configured absolute stage root
  - repeated Deno `stage` works when `staging.clear` is honored
  - sidecar write -> read -> `prepare()` succeeds
  - Deno `push` reuses the prior staged artifact and does not re-stage
  - Deno `push` to a missing app creates it only on the recognized missing-app path
  - Deno `push` then deploys from the same staged artifact path
- Regression:
  - Orbiter behavior remains unchanged under the existing mapping schema

## Assumptions

- `index` remains an Orbiter/root-site role.
- The current schema remains `copy | build+copy | index` in this implementation pass.
- Deno uses `index` as the least-disruptive compatibility fit, not because it semantically matches Orbiter index behavior.
- The current `resolvePushTargets()` / `PushTargetPlan.stats` seam is Orbiter-shaped and should not be treated as the final generic provider abstraction.
- Deno `staging.dir` should be absolute and outside the workspace.
- Upward `.env` resolution remains the credential source model.
- Tools-level `push` is allowed to mean "ensure this endpoint is live," including explicit missing-app recovery.
- Non-goals for this pass:
  - no provider-neutral staging executor
  - no Orbiter/Deno symmetry pass
  - no mapping redesign beyond the least-disruptive Deno schema fit

## Final Execution Spine

### 1. Pre-clean

- Keep the good endpoint YAML scaffold improvements.
- Preserve the authored Deno endpoint shape.
- Keep Deno compatible with the current Orbiter-shaped endpoint schema.
- Separate generic push planning from Orbiter shard planning before widening provider support.

~~~text
refactor(cli.deploy): tighten the endpoint yaml scaffold and placeholder examples
~~~

~~~text
refactor(cli.deploy): keep deno mappings compatible with the existing endpoint schema
~~~

~~~text
refactor(cli.deploy): separate generic push planning from orbiter shard planning
~~~

### 2. Tighten The Deno Driver Seam

- Expose the real missing public seam: `prepare()`.
- Prove the standalone `stage -> prepare -> deploy` path immediately.
- Promote only the formatter helpers that the decomposed tools flow can reuse.
- Keep `pipeline()` as the combined convenience path.
- Do not force Orbiter symmetry yet.

~~~text
feat(driver-deno): expose staged artifact preparation as a public deploy seam
~~~

~~~text
test(driver-deno): verify standalone stage → prepare → deploy
~~~

~~~text
feat(driver-deno): promote deploy formatting helpers to public Fmt surface
~~~

### 3. Rebuild The Tools Integration

- De-Orbiter the shared push-planning seam.
- Map Deno `stage` to `DenoDeploy.stage(...)` with fail-fast tools validation.
- Persist the staged Deno sidecar.
- Map Deno `push` to `prepare + deploy` over the prior staged artifact.
- Allow explicit missing-app recovery in `push`.
- Reuse public driver formatter primitives where they fit.

~~~text
refactor(cli.deploy): de-orbiter the shared push planning types and menu flow
~~~

~~~text
refactor(cli.deploy): make deno stage and push share one staged artifact path
~~~

~~~text
refactor(cli.deploy): persist staged deno artifact metadata between stage and push
~~~

~~~text
refactor(cli.deploy): wire the deno provider around the standalone stage → prepare → deploy path
~~~

~~~text
refactor(cli.deploy): reuse driver-deno formatter primitives for deno stage and push
~~~

~~~text
refactor(cli.deploy): let deno push create a missing app from the staged artifact path
~~~

### 4. Cleanup

- Remove misleading UI assumptions left from the partial integration.
- Reduce initial deploy menu render pause.
- Revisit naming and DX only after the real path is proven.

~~~text
refactor(cli.deploy): reduce the initial deploy menu render pause
~~~
- Shared endpoint syntax is acceptable even when provider runtime semantics diverge, as long as validation and execution remain provider-truthful.
