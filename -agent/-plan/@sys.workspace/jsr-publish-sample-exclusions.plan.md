jsr-publish-sample-exclusions.plan.md
- [x] 8d7448e21 chore(publish): exclude package-local samples and test fixtures

## Outcome

Keep repository examples and test fixtures available locally without shipping them in JSR library
packages. Add targeted `publish.exclude` entries in each owning `deno.json`; no workspace-wide rule.

## Scope

Repository: `/Users/phil/code/org.sys/sys`.
Only the ten configurations below are implementation targets. Config paths are relative to `code/`;
exclusion paths are relative to their owning package. Preserve existing exclusions and unrelated edits.

| Config | Exclude |
|---|---|
| `sys/server/deno.json` | `-sample/` |
| `sys/cell/deno.json` | `-sample/` |
| `sys.ui/ui/deno.json` | `-sample/` |
| `sys.driver/driver-vite/deno.json` | The nine exact `src/-test/vite.sample-*` directories listed below |
| `sys.driver/driver-deno/deno.json` | `src/-test/sample-1/`, `src/-test/sample-2/`, `src/m.cloud/m.DenoDeploy/-test.sample/` |
| `sys/fs/deno.json` | `src/-test/-sample-1/` through `src/-test/-sample-6/`, plus `src/-test/-sample-files/` |
| `sys/crypto/deno.json` | `src/-test/-sample-dist/` |
| `sys/http/deno.json` | `src/-test/-sample.dist/` |
| `sys/tmpl-engine/deno.json` | `src/-test/sample-1/`, `src/-test/sample-2/` |
| `sys/testing/deno.json` | `src/-test/fixtures/`, `src/m.client/m.Spec/-test/samples/` |

Vite directories under `src/-test/`:
`vite.sample-1/`, `vite.sample-2/`, `vite.sample-3/`, `vite.sample-config/`,
`vite.sample-std-path/`, `vite.sample-bridge/`, `vite.sample-published-baseline/`,
`vite.sample-published-ui-baseline/`, `vite.sample-published-ui-components/`.

Use explicit directory entries, not new broad globs. Do not edit nested fixture configurations.
The existing Cloudflare `publish.exclude: ["-sample/"]` is the reference pattern, not another target.

## Preserve

- Vite's exported `src/-test/-sample-imports.ts` and existing entry-fixture exclusions.
- Monaco sample directories: their types are re-exported by `src/types.ts`.
- UI Components' published specs, samples, and recorder dev modules; UI Dev's exported entry specs.
- Types' public `./testing`, Stripe's public `./server/fixture`, and all other public testing helpers.
- Runtime templates, template hooks, generated bundles, and required assets.

No export changes, source moves/deletions, top-level `exclude` edits, Git-ignore changes, task changes,
script cleanup, or broader test/spec pruning. This plan grants no Git mutation or remote publication.

## Execution and verification

This is a local configuration refactor, not a publication workflow. No publish commands, publication
dry-runs, clean Git snapshots, commits, or pushes are required or authorized.

1. Read each owner config and confirm the named directories exist. Check that the exclusions do not
   remove public exports or their required code, types, or assets. Report any conflict rather than
   changing the public API or widening scope.
2. Edit only `publish.exclude` in the ten listed configs. Use the explicit entries above, retain
   existing exclusions, and preserve unrelated edits. Keep JSON formatting consistent with canon.
3. Validate the edited JSON and inspect the final diff. Confirm only the intended exclusions changed
   and all source, sample, and fixture files remain untouched. Run `git diff --check`.
4. Report the changed paths and local verification results. Publication payload verification is
   outside this refactor's completion boundary; do not claim it was performed.

## Final verification and archival boundary

The bounded configuration refactor is complete. The reachable commit recorded above changes only
`publish.exclude` in the ten listed configurations; existing exclusions and public exports are
preserved. No source, sample, or fixture files were changed. All ten configurations have no pending
worktree or index changes at closeout.

- Confirmed every named directory exists and inspected sample references; no public dependency
  conflict was identified. Vite's exported sample-imports module remains included.
- `deno fmt --check` parsed all ten edited JSON files. It reported only pre-existing trailing blank
  lines in nine files; those unrelated bytes were left unchanged. The added blocks required no
  formatting changes.
- Final diff inspection and `git diff --check` passed. Exact changed paths were reported.
- No runtime tests, publication dry-runs, or publication payload verification were performed.
  Those are outside this configuration-only completion boundary; no published behavior is claimed.

No implementation work remains in this plan. This is the final completion snapshot for archival:
commit the plan as `plan(done): jsr-publish-sample-exclusions.plan.md` before removing it in a separate
`plan(archived): jsr-publish-sample-exclusions.plan.md` commit. These lifecycle instructions do not
authorize Git mutations or removal.
