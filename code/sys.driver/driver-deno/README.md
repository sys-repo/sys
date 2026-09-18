# Deno Driver

A standardized `@sys` workspace remains a real workspace all the way to live deployment.

Tools for working with the [Deno Runtime](https://docs.deno.com/runtime/) and Deno cloud platform
surfaces.

### Exports

- `jsr:@sys/driver-deno` → package metadata (`pkg`)
- `jsr:@sys/driver-deno/runtime` → runtime/workspace helpers such as `DenoFile` and `DenoDeps`
- `jsr:@sys/driver-deno/cloud` → cloud platform helpers such as `DenoDeploy`

### Example

Load a workspace config and project canonical dependency data from an input file such as `deps.yaml`
into `deno.json`, import maps, and optional `package.json` files:

```ts
import { DenoDeps, DenoFile } from 'jsr:@sys/driver-deno/runtime';

const workspace = await DenoFile.workspace('./deno.json');
const deps = await DenoDeps.from('./deps.yaml');
```

## Deployment contract

### Staged workspace

A deployment target is a package declared in the source root's `deno.json` workspace. Staging creates
an empty external root containing a smaller real workspace, not a flattened bundle or a copy of every
workspace child:

- `DenoDeploy.stage(...)` calls `Workspace.Prep.Graph.ensure(...)` and retains the target's transitive
  package dependencies. It also retains deployment-runtime package closures, including local
  `code/sys.driver/driver-deno` when present in the graph.
- A target's declared `build` task runs before materialization. Build outputs needed at runtime must
  be staged with the retained package; do not depend on remote build output becoming ordinary runtime
  files. Staging is not a pass-through operation for an already frozen release artifact.
- Root essentials are `deno.json`, an existing `deno.lock`, and the referenced import-map file.
  Retained packages keep their workspace-relative paths, and staged workspace membership is rewritten
  to match them. Materialization excludes `.DS_Store`, `.env`, `**/.tmp/**`, `**/node_modules/**`, and
  `**/src/-test/**`.
- Retained named exports resolve to local staged paths. When the driver is not retained locally, its
  generated import uses the driver's pinned package version.
- Generated root `entry.ts` and `entry.paths.ts` bind the selected target to `DenoEntry.serve(...)`.

See the [stage implementation](./src/m.cloud/m.DenoDeploy/m.stage/u.executeStage.ts) and
[materialization rules](./src/m.cloud/m.DenoDeploy/m.stage/u.materializeWorkspace.ts).

### Application entry and proof

A target with `src/entry.ts` exports `main({ targetDir })` under the `DenoEntry.Main` contract and
returns `{ fetch }`. The application owns routes, authorization, configuration, and asset policy; the
deployment driver owns staging and runtime entry. Without that entry, `DenoEntry.serve(...)` uses the
self-reported Dist/static fallback instead; that fallback is not a private-R2 application.

Use the same application composition locally and in deployment. Prove the generated staged entry
with its required imports, configuration, and assets: a successful run in the full development
workspace does not prove the staged closure. Keep fixture builds separate from frozen product
artifacts. See [entry types](./src/m.cloud/m.DenoEntry/t.ts) and
[entry loading](./src/m.cloud/m.DenoEntry/m.serve.ts).

A deploy/preview probe is not browser execution or product release evidence. The current pipeline
preview verifier checks HTML and a discovered JavaScript resource; it does not execute a Vite resource
graph. Historical sample deployments do not establish current account, hosting, or application
configuration.

### Operational ownership

Sample deploy/create orchestration lives in `src/m.cloud/m.DenoDeploy/-test.sample`; package tasks
adapt that seam rather than defining another one. `DenoApp.create(...)` and pipeline auto-creation
already exist.

Native deployment commands belong behind `src/m.cloud/u.cli.deploy`. In particular, the existing logs
helper prepares a temporary working directory and explicit empty config; the pipeline invokes it for
deployment-failure diagnostics and removes the temporary directory afterward. Do not replace this
isolation with ad hoc package-root CLI calls. This is the current CLI-backed implementation, not an
API-backed logs capability.
