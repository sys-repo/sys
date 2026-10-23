# Deno Driver

Tools for dependency configuration and source-workspace deployment on the
[Deno Runtime](https://docs.deno.com/runtime/).

Choose the entrypoint for your task:

- `jsr:@sys/driver-deno/runtime` → workspace/configuration helpers, including `DenoFile` and
  `DenoDeps`.
- `jsr:@sys/driver-deno/cloud` → application-entry and deployment helpers, including `DenoEntry`,
  `DenoDeploy`, and `DenoApp`.
- `jsr:@sys/driver-deno/t` → type-only contracts.
- `jsr:@sys/driver-deno` → package metadata (`pkg`).

## Inspect a dependency projection

Load an existing canonical `deps.yaml` and print its projected `deno.json` configuration shape:

```ts
import { DenoDeps } from 'jsr:@sys/driver-deno/runtime';
import { Is } from 'jsr:@sys/std/is';

const loaded = await DenoDeps.from('./deps.yaml');
if (!Is.nil(loaded.error) || Is.nil(loaded.data)) {
  throw new Error('Unable to load dependency data.', { cause: loaded.error });
}

const config = DenoDeps.toJson('deno.json', loaded.data.deps);
console.info(config);
```

Run this filesystem-based example in Deno with read access to your dependency file. It loads and
projects data; it does not write configuration files. To apply a projection, use `applyDeno()` or
`applyPackage()` with an explicit destination. `applyDeno()` updates the referenced import map when
one is declared, otherwise inline imports. See the
[dependency contracts](./src/m.runtime/m.DenoDeps/t.ts).

## Deploy a workspace package

The application owns routes, authorization, configuration, and asset policy. The deployment driver
owns staging and runtime entry.

Start with a package declared in the source root's `deno.json` workspace. It must have its own
`deno.json` and a `src/pkg.ts` module exporting `pkg` metadata. `DenoEntry` imports that metadata
module even when the package has a custom application entry.

Choose the public workflow you need:

1. `DenoDeploy.stage(request)` builds the selected source package when it declares a `build` task,
   then copies its retained package closure into an external staging root. The build runs in the
   source package, not inside staging, and can change source-side build outputs.
2. `DenoDeploy.prepare(stage)` updates that staging root for native deployment. The staged root has
   reduced workspace membership; preparation removes the root `workspace` property. Package layout,
   retained dependencies, and explicit local import mappings remain—not unchanged workspace
   semantics.
3. `DenoDeploy.deploy(request)` submits the supplied staged root through the native Deno Deploy CLI.
   This requires a target app and account authentication; staging and preparation do not deploy it.
4. `DenoDeploy.pipeline(request).run()` orchestrates stage → prepare → deploy → preview
   verification. Pipeline handles are single-use; dispose the handle when finished. Preview
   verification is enabled by default, with the application-specific choice described below.

[Deployment API contracts](./src/m.cloud/m.DenoDeploy/t.ts)

### Choose an application entry

- **Custom entry:** export `main({ targetDir })` from `src/entry.ts` and return `{ fetch }`. Your
  application supplies the handler and its policy; no Dist artifacts are required.
- **No custom entry:** serve the target's static `dist` as a supported Dist artifact: a valid
  `dist.json` with `sys.dist/v2` content identity and its declared payload files. A directory of
  built assets alone is not sufficient. The fallback does not supply application-specific
  authorization.

For a custom entry, add this to the declared package's `src/entry.ts`:

```ts
import type { DenoEntry } from 'jsr:@sys/driver-deno/t';

export const main: DenoEntry.Main = ({ targetDir }) => ({
  fetch: () => Response.json({ targetDir }),
});
```

This handler returns JSON containing the selected package's relative directory. It illustrates the
entry contract, not a complete application's routing or authorization. The package metadata and
workspace prerequisites above still apply. See [entry contracts](./src/m.cloud/m.DenoEntry/t.ts).

### Static fallback limits

The fallback checks the complete artifact tree for **unpinned local consistency at startup only**.
Undeclared entries or symlinks can refuse startup. Fixed verification limits can reject even a
consistent artifact:

- Manifest: 4 MiB.
- Tree: 16,384 entries, including the manifest, payload files, and distinct implied directories.
- Individual payload file: 64 MiB.
- Total payload: 512 MiB.

These budgets are not exhaustive acceptance criteria: path and encoding bounds also apply. See
[filesystem verification limits](../../sys/fs/src/m.Pkg/t.ts) and
[content admission bounds](../../sys/std/src/m.Pkg/m/m.Dist.Content.ts).

This supplies neither an independent content pin nor document-signature verification. Subsequent
response bytes are not checked against the startup inventory, and source imports are not
authenticated by that check. Independently pinned filesystem verification is a separate operation;
see [distribution integrity](../../sys/fs/README.md#distribution-integrity). It does not turn this
fallback into per-response verification.

### What staging retains

Staging creates an empty external root containing a smaller workspace, not a flattened bundle or a
copy of every workspace child:

- The workspace dependency graph selects the target's transitive package dependencies. Deployment
  runtime package closures are retained too, including local `code/sys.driver/driver-deno` when it
  is present in the graph.
- Root essentials are `deno.json`, an existing `deno.lock`, and the referenced import-map file.
  Retained packages keep their workspace-relative paths. Materialization excludes `.DS_Store`,
  `.env`, `**/.tmp/**`, `**/node_modules/**`, and `**/src/-test/**`.
- Retained named exports resolve through explicit local staged paths. When the driver is not
  retained locally, its generated import uses the driver's pinned package version.
- Generated root `entry.ts` and `entry.paths.ts` bind the selected target to `DenoEntry.serve(...)`.

Staging can write or refresh `deno.graph.json` in the source workspace before building or copying.
The declared build runs in the source package before copying. The build helper can also temporarily
rewrite that package's `deno.json` import-map reference and attempts restoration afterward. An
external staging root does not isolate these source-side effects. Build outputs needed at runtime
must be copied with the retained package; do not depend on remote build output becoming ordinary
runtime files. Staging is **not a pass-through operation for an already frozen release artifact**.

See the [stage implementation](./src/m.cloud/m.DenoDeploy/m.stage/u.executeStage.ts) and
[materialization rules](./src/m.cloud/m.DenoDeploy/m.stage/u.materializeWorkspace.ts).

### Choose preview verification for your application

Pipeline preview verification defaults on. It requires a preview URL returning HTTP 200 with
nonempty HTML, plus a JavaScript resource discovered in that HTML that returns HTTP 200 with a
JavaScript content type. It fetches those responses; it does not execute JavaScript, exercise
browser behavior, or provide a general application-health check.

A working JSON API, including the entry example above, can deploy successfully and then fail this
HTML/JavaScript probe. For an application needing a different check, set
`verify: { preview: false }` on the pipeline request and supply your own application-specific health
probe. A later verification failure does not undo a successful deployment.

### Prove the prepared closure

Use the same application composition locally and in deployment. Run the generated entry from its
prepared root with the required imports, configuration, and assets: success in the full development
workspace does not prove that retained closure. Keep fixture builds separate from frozen product
artifacts.

A deploy/preview probe is not browser execution or product release evidence. Verify the intended
account, hosting, and application configuration independently.

## Maintainer guidance

Repository-only sample deploy/create orchestration lives in `src/m.cloud/m.DenoDeploy/-test.sample`;
that directory is excluded from publication. Package tasks adapt that seam rather than introducing a
second orchestration path. Use `DenoApp.create()` and the pipeline's `autoCreate` option for their
respective application-creation workflows.

Keep native deployment commands behind `src/m.cloud/u.cli.deploy`. The logs helper prepares a
temporary working directory and explicit empty config; the pipeline invokes it for
deployment-failure diagnostics and attempts to remove that directory afterward. Preserve this
isolation rather than running the logs CLI from a package root, where ambient CLI behavior could
modify package config. This boundary is CLI-backed, not an API-backed logs capability.
