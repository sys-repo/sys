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

## Test progress

Progress tracks packages scheduled and completed, not individual tests. Final reports may also
include native Deno test counts where the runner can collect them. Unsupported or unavailable counts
appear as `—`, not `0`.
