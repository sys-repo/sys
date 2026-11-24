# Development

[Package overview](../README.md) · [Local GUI workflow](./gui.md)

Run package tasks from the owning directory in this source checkout:

```sh
cd code/sys.driver/driver-pi
```

| Outcome                                 | Task                 |
| --------------------------------------- | -------------------- |
| Run the source development server       | `deno task dev`      |
| Build `dist/`                           | `deno task build`    |
| Serve the existing `dist/`              | `deno task serve`    |
| Reset both GUI cache namespaces         | `deno task reset`    |
| Build and bind local rehearsal evidence | `deno task bind:dev` |

For GUI binding and destructive reset procedures, follow the [GUI guide](./gui.md).

## Upstream dependency selection

Root `deps.yaml` selects the upstream Pi version. The launcher carries a derived fallback so it can
run without a local Pi dependency declaration. A local declaration takes precedence over that
fallback; an explicit package override takes precedence over both.

Edit the manifest, not the fallback. Root `deno task upgrade` refreshes the fallback after applying
the root manifest. For dependency-only preparation, root `deno task prep:deps` regenerates import
projections and `deno task lock:sync --lockfile-only` resolves the lock graph. Package
`deno task prep:deps` refreshes the fallback. These tasks do not establish runtime compatibility.

Package `deno task check:deps` rejects fallback drift without writing; package `check` includes it.
`deno task test:deps` also checks agreement with the import map. Version agreement does not
establish compatibility with the upstream Pi host.

An upgrade is not a transaction: a refresh failure rejects the task but leaves prior dependency
writes in place. The printed dependency summary is not confirmation that the whole task succeeded.

For runtime-specific checks and recovery controls, see the
[compatibility guide](../-scripts/-test.external/README.compat.md).

## ZIP verification

`deno task prep:zip` prepares both entries with exact import/export admission and byte digests.
`deno task prep:zip --check` rebuilds and compares exact prepared bytes without updating the
artifacts; use it to verify source correspondence before generated-host acceptance.
`deno task test:unit` covers policy, guards, construction settlement, publication races and cleanup.
`deno task test:host` separately exercises generated extraction in the selected CLI, its shared
queue, and actual Agent sequencing and failure results using a local scripted provider, not a remote
request. It requires the selected release's existing compatibility admission and copies its cache
and frozen lock into each private fixture; verification does not admit missing artifacts.
`deno task test:zip:permissions` proves fixture-scoped reads and destination-only writes with run,
net, FFI, env and sys denied. The host child retains its existing startup authority separately.
