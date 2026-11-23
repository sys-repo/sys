@sys.workspace
dependency-upgrade-completion.plan.md
- [x] 17a284499 fix(workspace): await upgrade finalization before suggesting a commi
- [x] a7155d9a8 fix(deps): verify frozen replay and checked Markdown after root upgrades

## Outcome

A root upgrade suggests a commit only after the updated dependencies install from the synchronized
lockfile and the checked Markdown consumer passes. The suggestion does not imply workspace release
readiness.

Baseline checked against `a063c4203`:

- `6c1677857` added a root `deno install` after Pi metadata refresh for an actual apply to the
  repository's `deps.yaml`. `bd7097353` added post-install guidance: preparation and verification
  remain. An unsuccessful install already fails the task and warns that prior changes are retained.
- In `code/sys/workspace/src/m.cli/`, both apply paths printed the summary and optional commit
  suggestion before returning to `-scripts/task.upgrade.ts`. A suggestion could precede a failed
  refresh or install.
- Root `deno.json` already distinguished `lock:sync` (update resolution) from `install` (frozen
  replay), but the wrapper ran plain `deno install` with no checked consumer.

Baseline checks with a frozen lockfile passed: root `test:upgrade` (6 steps, install injected) and
Markdown's stringify test (1 step, heading and task list). Neither exercised a real root upgrade or
the proposed table round-trip.

## 1. Give the handoff one owner

Original subject: `fix(workspace): await upgrade finalization before suggesting a commit`.
The CLI handoff and root finalizer landed in `17a284499` with the subject ending in `commi`.

Both apply modes await the optional caller-supplied finalizer once, with the successful
`WorkspaceUpgrade.ApplyResult`, before printing the applied summary and optional suggestion.
Interactive selection and progress remain in the CLI. Standalone callers can omit the finalizer;
`WorkspaceUpgrade.apply` retains its partial-write semantics and owns no repository policy.

The root wrapper moved its existing refresh and install into the finalizer. Help, dry-run,
cancellation without apply, and failed apply do not finalize. An actual root apply still finalizes
when no versions change because derived files can still be written. Other manifests get the
ordinary CLI handoff, not the root workflow.

CLI tests use a changed pin in both modes: a pending finalizer suppresses the handoff, resolution
allows it once, and rejection preserves the original error and pin write without a suggestion.

## 2. Verify the candidate, not just the pin writes

In `-scripts/task.upgrade.ts`, the finalizer refreshes Pi metadata and then awaits these child
processes in order:

| Directory (from repo root) | Command | What success establishes |
| --- | --- | --- |
| `.` | `deno task lock:sync` | Resolution updated or already current |
| `.` | `deno task install` | The resulting lockfile is accepted with writes to the lockfile forbidden |
| `code/sys/markdown` | `deno task test --frozen-lockfile ./src/m.Markdown/-test/-u.stringify.test.ts` | The ordinary checked serializer test passes on that candidate |

The stringify test round-trips `Sample.gfmTableAndTaskList` and checks cell contents and the
checked task rather than whitespace. The success message names the frozen install and Markdown
check and still explains what prep and bump do.

The finalizer stops at the first failure, preserves the diagnostic, reports the child exit code
when available, and describes retained writes. A failed phase reports its retry command and
working directory so the operator can retry against the same candidate without rollback, version
reselection, or automatic reload.

The blind review found that another name for the root manifest could skip verification. The landed
guard compares file identity: a hard link runs all phases, a separate file with identical contents
does not, and an unresolved identity stops the handoff. The hard-link and missing-manifest
regressions failed with the old guard and passed with the fix.

Verification for the landed changes:

- Root `deno task test:upgrade --frozen-lockfile`: 10 steps. Injected child results prove exact
  argv, working directories, phase order, and stop-on-failure behavior, including a Markdown
  failure after successful frozen replay. They do not prove installation.
- Workspace CLI frozen suite: 8 tests, 55 steps.
- Real lockfile sync, frozen install, and the checked Markdown test passed on the current dependency
  candidate. Frozen install and Markdown were rerun after the guard fix; the tracked dependency
  files and lockfile were unchanged. The Markdown test passed both steps.

This proof covers one consumer on the current candidate. It is not a fresh dependency upgrade,
clean installation, Cloudflare check, or workspace release check.

## Troubleshooting note: the historical Markdown failure

At `9dbd44c77`, `mdast-util-to-markdown` moved from `2.2.0` to `2.2.1` alongside `mdast-util-gfm`
`3.1.0`. The recorded Cloudflare type check reported TS2345 across the two serializer identities at
`table`. On Deno `2.9.8` / TypeScript `6.0.3`, with unchanged source and dependency bytes, swapping
only a **copied** checker database produced fail → pass → same failure. Reloading the checked task
in that disposable cache was followed by an ordinary run passing 42 tests / 277 steps. This did not
establish how the stale state arose or verify recovery in the original terminal. The later `2.2.3`
serializer pin in `deps.yaml` is not evidence of a fix.

If the same diagnostic recurs, preserve it first. The historical recovery sequence, from
`code/sys.driver/driver-cloudflare` using the same cache, was:

```sh
deno task test --frozen-lockfile --no-run --reload
deno task test
```

Stop if the first command fails. A checked reload is not an install reload. Do not delete caches,
force transitive versions, or bypass checking. Revisit warm/fresh install fixtures, synthetic type
controls, or routine revalidation only if recurrence or new evidence warrants them; none is a
condition for the two changes above.
