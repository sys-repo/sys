# Next Plan

## Downstream dev-card surfacing

After the next JSR bump/publish, keep the integration split principled:

- `@tdb/data` owns the reusable dev component/runtime surface
- downstream projects own origin/proxy policy and the final spec harness

### Why

`agent-projects/code/projects/slc-data` does not share the same origin routes as
this package's local debug harness:

- package localhost proxy: `http://localhost:1234/data/`
- agent-projects localhost proxy: `http://localhost:8080/data/`

So the package-local `HttpDataCards` spec should not be the final direct import
surface for downstream projects.

### Export target

Export the reusable dev component surface, not the package harness:

- add `./dev/http-data-cards`
- point it at `./src/ui/-dev/ui.HttpDataCards/mod.ts`

Add a matching API assertion in:

- `./src/ui/-dev/-.test.ts`

### Downstream shape

In `agent-projects/code/projects/slc-data`:

- import `HttpDataCards` from `@tdb/data/slug/ui/dev/http-data-cards`
- keep a tiny local spec wrapper
- wire that wrapper to project-owned `ProxyRoutes` / `ui.HttpOrigin`

That gives downstream a stable reusable component while preserving
project-specific origin policy.

### CLI wrapper follow-up

For `deno task cli` in `agent-projects`, the package should expose a public
formatted result seam so the downstream wrapper does not need internal imports.

Best next addition:

- `SlugDataCli.Fmt.result(result)`

Then the downstream wrapper becomes:

- call `SlugDataCli.run({ cwd, argv, target: \`${cwd}/public/data\` })`
- print `SlugDataCli.Fmt.result(result)`
