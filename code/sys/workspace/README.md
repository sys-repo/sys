# @sys/workspace

Inspect, run, and maintain packages in a Deno workspace.

The root exports `Workspace`. Choose operations by what they do to the workspace:

- **Inspect:** [`/info`](https://jsr.io/@sys/workspace/doc/info) counts source files and lines;
  [`/graph`](https://jsr.io/@sys/workspace/doc/graph) derives local package dependencies;
  [`/delta`](https://jsr.io/@sys/workspace/doc/delta) maps changed files to packages.
- **Run:** [`/run`](https://jsr.io/@sys/workspace/doc/run) schedules package tasks.
- **Maintain:** [`/prep`](https://jsr.io/@sys/workspace/doc/prep) normalizes workspace files and
  writes dependency-graph snapshots. `/bump`, `/pkg`, `/upgrade`, and `/ci` update versions,
  generated package metadata, dependencies, and CI files. These operations can change files.

[`/resolve`](https://jsr.io/@sys/workspace/doc/resolve) exports `WorkspaceResolve` to report how
Deno resolves a package under its active policy. Import it separately; it is not
`Workspace.Resolve`. See the [API documentation](https://jsr.io/@sys/workspace/doc) for
configuration and task details.

## Count files and lines

```ts
import { Workspace } from 'jsr:@sys/workspace';

const stats = await Workspace.Info.stats({
  cwd: '.',
  source: { kind: 'glob', include: ['src/**/*.{ts,tsx}'] },
  totals: { lines: true },
});

console.info({ files: stats.files, lines: stats.lines });
```

Run this from a package directory with filesystem read permission. Patterns are relative to `cwd`.
The example reads matching files without changing them or running package tasks. Line totals count
physical lines, not statements.

## Dependency upgrades

[`/upgrade`](https://jsr.io/@sys/workspace/doc/upgrade) exports `WorkspaceUpgrade`. Its source of
truth is `deps.yaml`, not installed packages or a lockfile. It separates three operations:

- **Collect:** inspect published versions and their publication-age eligibility. No dependency files
  change.
- **Upgrade:** choose newer versions under the requested policy and order their known dependencies.
  This is a preview, not a write.
- **Apply:** compute a fresh plan and write the manifest and its generated dependency files. This
  does not execute a saved preview or ask for confirmation.

### Visible does not mean selectable

A visible release has passed collection filters. Prereleases are hidden unless enabled; npm also
omits deprecated releases and versions above its usable latest tag. The highest visible version can
still be too young to select.

The library defaults to same-major upgrades, stable releases, both registries, and no
publication-age delay. A positive `minimumDependencyAge`, in whole milliseconds, withholds recent
npm and JSR releases until the waiting period has elapsed. Missing, invalid, or future publication
times also prevent selection. The current manifest pin is exempt from the age check, not the
collection filters.

Age is evaluated against one clock reading per call. It is a waiting period, not a security review.
An age-eligible release must still satisfy the version policy; the selected upgrade may be older
than the highest visible release.

### Read omissions as well as choices

A failed version lookup leaves an entry uncollected. Missing relationship metadata leaves the graph
incomplete. Neither condition alone prevents the remaining upgrades from being applied: a successful
dependency order is not proof that every dependency was checked. A blocked policy decision can also
mean an entry is already current or deliberately excluded, rather than a failure.

### Know the write boundary

Invalid or cyclic graphs reject before writing. Otherwise, application writes `deps.yaml`, then Deno
imports, then `package.json` when the manifest requests dependencies or resolver overrides there.
Deno imports follow the config's inline imports or referenced import map. The output directory
defaults to the manifest's directory; setting `cwd` changes that destination, not how the manifest
path is resolved.

Application can rewrite these files even when no version changes. A write failure stops later writes
but does not roll back earlier writes or partial output. Inspect the diff before continuing.

## Test progress

Progress tracks packages scheduled and completed, not individual tests. Final reports may also
include native Deno test counts where the runner can collect them. Unsupported or unavailable counts
appear as `—`, not `0`.
