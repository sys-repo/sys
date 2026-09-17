type-export-path-cleanup.plan.md
- [x] 204fca7d9 refactor(exports)!: standardize package type entrypoints on /t

## Decision and boundary

The human requested removal of the redundant `./types` ESM export from `@sys/tmpl` and every
repository-owned `deno.json` that has it, including the package scaffold's staged `-deno.json`. Keep
`./t` and keep the filename `src/types.ts` unchanged.

One concept, one import spelling: `@scope/package/t`. This is an export-path cleanup, not a
type-plane redesign. Removal and consumer migration belong in one local commit so no intermediate
commit deliberately leaves consumers importing a missing export.

Scope includes active packages, deploy packages, source fixtures, the embedded package template, and
tracked archives under `-tmp/-archive`. Archives receive manifest edits, not dependency repair or
revival. Exclude third-party dependencies, caches, generated scratch workspaces, Git history, and
unrelated existing worktree changes.

This plan authorizes no implementation, Git mutation, version bump, or publication.

## Canon alignment

The human adopted `/t` as the sole root package type subpath. Canon now records that decision in:

- `../sys.canon/-canon/-sys.md`, Types plane / Deno exports.
- `../sys.canon/-canon/protocol.types.md`, Deno Exports (Public Contract Surface).

Both retain `src/types.ts` and the type-only invariants while removing the `./types` alias
requirement. Existing repository aliases are known migration debt addressed by this plan, not a
second supported convention. No further policy approval gate is needed.

## Invariants and non-goals

- Delete only the exact root export key `./types` from affected manifests.
- Preserve every existing `./t` target, every other export, package identity, version, task,
  permission, and unrelated layout. Add no task solely for this migration.
- Before each manifest edit, open it and verify `./types` and `./t` resolve to the same target. Stop
  on an exception rather than inventing a replacement type surface.
- Do not rename, remove, or rewrite `src/types.ts`, local `t.ts`, or type definitions.
- Preserve `@sys/types` (the package name), relative imports ending in `/types.ts`, and existing
  nested `/t` entrypoints. Do not perform a textual `/types` replacement.
- Packages already lacking the alias need no export change; `code/sys/types/deno.json` is a
  confirmed example. Do not add exports to fixtures or workspace roots.
- Preserve type-contract and runtime-empty proof when removing alias-specific tests. Do not leave
  duplicated `/t` imports disguised as `FromTypes` aliases.
- No compatibility shim for `/types`: that would preserve the duplicate public surface.
- No unrelated namespace refactoring, dependency refresh, generated metadata edits, UI behavior
  changes, or mass formatting.

## Discovery inventory

Search located 68 alias-bearing manifests: 51 active package manifests, one sample, one staged
package template, and 15 archived manifests. This is a candidate path inventory, not a claim that
every manifest has been individually opened. Recheck live contents and inventory at implementation
time. Additional repository-owned matches belong to the same exact-key rule; report any material
scope change.

### Active package manifests (51)

```text
code/-tmpl/deno.json
code/sys.dev/deno.json
code/sys.tools/deno.json
code/sys.driver/driver-automerge/deno.json
code/sys.driver/driver-cloudflare/deno.json
code/sys.driver/driver-deno/deno.json
code/sys.driver/driver-monaco/deno.json
code/sys.driver/driver-pi/deno.json
code/sys.driver/driver-process/deno.json
code/sys.driver/driver-prosemirror/deno.json
code/sys.driver/driver-signer/deno.json
code/sys.driver/driver-stripe/deno.json
code/sys.driver/driver-vite/deno.json
code/sys.model/model/deno.json
code/sys.model/model-slug/deno.json
code/sys.ui/ui/deno.json
code/sys.ui/ui-components/deno.json
code/sys.ui/ui-css/deno.json
code/sys.ui/ui-dev/deno.json
code/sys.ui/ui-dom/deno.json
code/sys.ui/ui-react/deno.json
code/sys.ui/ui-state/deno.json
code/sys/archive/deno.json
code/sys/cell/deno.json
code/sys/cli/deno.json
code/sys/color/deno.json
code/sys/crdt/deno.json
code/sys/crypto/deno.json
code/sys/esm/deno.json
code/sys/event/deno.json
code/sys/fs/deno.json
code/sys/http/deno.json
code/sys/immutable/deno.json
code/sys/markdown/deno.json
code/sys/net/deno.json
code/sys/process/deno.json
code/sys/registry/deno.json
code/sys/schema/deno.json
code/sys/server/deno.json
code/sys/std/deno.json
code/sys/testing/deno.json
code/sys/text/deno.json
code/sys/tmpl-engine/deno.json
code/sys/web/deno.json
code/sys/workspace/deno.json
code/sys/yaml/deno.json
deploy/@draft.shell/deno.json
deploy/@tdb.edu.slug/deno.json
deploy/@tdb.slc/deno.json
deploy/@tdb.slc.fs/deno.json
deploy/@tdb.slc.std/deno.json
```

### Sample and template (2)

```text
code/sys.driver/driver-cloudflare/-sample/deploy/deno.json
code/-tmpl/-templates/tmpl.pkg/-deno.json
```

### Archived manifests (15)

```text
-tmp/-archive/-deploy/@tdb.fs.01/deno.json
-tmp/-archive/-drivers/driver-farcaster/deno.json
-tmp/-archive/-drivers/driver-immer/deno.json
-tmp/-archive/-drivers/driver-mastra/deno.json
-tmp/-archive/-drivers/driver-obsidian/deno.json
-tmp/-archive/-drivers/driver-ollama/deno.json
-tmp/-archive/-drivers/driver-orbiter/deno.json
-tmp/-archive/-drivers/driver-peerjs/deno.json
-tmp/-archive/-drivers/driver-quilibrium/deno.json
-tmp/-archive/-sys.ui/ui-factory/deno.json
-tmp/-archive/-sys/cmd/deno.json
-tmp/-archive/-sys/crdt/deno.json
-tmp/-archive/-sys/main/deno.json
-tmp/-archive/-sys/skills/deno.json
-tmp/-archive/-sys/sys/deno.json
```

### Consumers, tests, and fixtures opened during planning

| Path                                                                                                           | Required change                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `deploy/@tdb.data/src/common/t.ts`                                                                             | Change `@sys/model-slug/types` to `@sys/model-slug/t`.                                                                      |
| `code/sys.ui/ui-components/src/ui.react/ui/Media.Timecode.PlaybackDriver/-spec/-u.loadTimelineFromEndpoint.ts` | Change the type import to `@sys/model-slug/t`; preserve behavior.                                                           |
| `code/sys/cli/src/m.shell/-test/-.test.ts`                                                                     | Remove duplicate `ShellFromTypes` import/assertion; retain `/t` and runtime contract proof.                                 |
| `code/sys/cli/src/m.core/m.Table/-test/-.test.ts`                                                              | Remove `CliTableFromTypes` duplication; preserve all distinct type and rendering assertions.                                |
| `code/sys/cli/src/m.core/m.Cli/-test/-t.helpers.test.ts`                                                       | Remove `FromTypes` import/assertion branches; retain namespace projection and expected-shape proof.                         |
| `code/sys/cli/src/m.core/m.Fmt/-test/-t.test.ts`                                                               | Reduce six-way alias comparisons to the four surviving projections; retain expected-shape proof and remove unused `Exact6`. |
| `code/sys/std/src/m.Str/-test/-.u.builder.test.ts`                                                             | Keep local contract versus `/t` proof for builder and options; remove redundant alias variables and cross-comparisons.      |
| `code/sys.ui/ui-components/src/-test/-exports.leaf.test.ts`                                                    | Keep the `/t` runtime-empty assertion; replace the obsolete both-entrypoints test wording.                                  |
| `code/sys.driver/driver-vite/src/m.vite.config.workspace/-test/-.test.ts`                                      | Change fixture alias `@sys/tmpl/types` to `@sys/tmpl/t`, retaining the replacement filename.                                |
| `code/sys/workspace/src/m.graph/-test/-u.collect.test.ts`                                                      | Generate `./t` rather than `./types`; preserve graph roots, type edges, and relative `/types.ts` imports.                   |

The first nine files contain package subpath references; the final file creates a manifest
dynamically. Search source-generated manifests as well as on-disk JSON. These searches establish
local usage only, not the absence of external consumers.

### Template propagation

- Source: `code/-tmpl/-templates/tmpl.pkg/-deno.json`.
- Generator: `code/-tmpl/src/m.tmpl/u.makeBundle.ts`, exported `makeBundle()`.
- Generated artifact: `code/-tmpl/src/m.tmpl/-bundle.json` (encoded file-map content).
- Consumer: `code/-tmpl/src/m.tmpl/u.makeTmpl.ts` reads the embedded bundle and renames staged
  `-deno.json` to the generated package's `deno.json`.
- Existing materialization proof: `code/-tmpl/src/m.tmpl/-test/-m.cli.test.ts`,
  `non-interactive pkg succeeds with explicit flags`.
- Existing bundle proof: `code/-tmpl/src/m.tmpl/-test/-u.makeBundle.test.ts`.

A source-only edit is insufficient. Extend the existing package-materialization test to assert the
actual generated manifest keeps `.` and `./t`, omits `./types`, preserves other template exports,
and still contains `src/types.ts`.

Use the narrow existing bundle entry, not full `prep`: the latter cleans directories, refreshes
dependency authorities, and bundles help as well. From `code/-tmpl`, inspect
`deno task tmpl --help`, then use `deno task tmpl --bundle --non-interactive`. Reopen the artifact
before generator execution. Do not hand-edit encoded bundle bytes. Inspect the resulting delta and
stop on unrelated template changes; do not discard someone else's work to force a clean bundle diff.

## Implementation sequence within the local commit

1. Reconfirm canon alignment and current worktree ownership. Open each candidate before editing.
   Include tracked archives; exclude dependency/cache copies.
2. Keep permanent regression proof at the template owner, where new packages originate. The human
   rejected a root `test:exports` task as migration noise; do not retain that task or its repo-wide
   test. Verify existing manifest removal through final search, JSON validation, and diff review.
3. Extend the existing materialization test. Run it red against the old generated manifest,
   verifying that the failure is for the unwanted export.
4. Remove the 68 manifest aliases with surgical edits. Fix commas where the alias was the last
   property. Migrate the ten consumer/test/fixture paths above.
5. Regenerate the embedded bundle through the existing local task. Run materialization proof in a
   fresh process so module-cached bundle data cannot mask stale output.
6. Run scoped verification, then workspace verification. Rescan and review the entire
   target-attributed delta for lost exports, altered filenames, and redundant tests.

The CLI package's `test` task chains a Deno test command and a keyboard process proof; it is not a
safe surface for blindly appending a test path. Use its existing package-scoped `deno task test`
without adding a migration-specific task. Keep the keyboard proof unchanged. The Vite package
already provides the appropriate narrow `test:unit` task.

## Verification

Commands are planned, not executed by the planning pass. Run each from its owning module and retain
concrete outcomes. Read current task/permission definitions before execution. A permission or
provenance denial is a stop, never a reason to broaden flags.

| Working directory             | Command                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `code/-tmpl`                  | `deno task test --trace-leaks ./src/m.tmpl/-test/-m.cli.test.ts`                  |
| `code/-tmpl`                  | `deno task test --trace-leaks ./src/m.tmpl/-test/-u.makeBundle.test.ts`           |
| `code/sys/cli`                | `deno task test` |
| `code/sys/std`                | `deno task test --trace-leaks ./src/m.Str/-test/-.u.builder.test.ts`              |
| `code/sys.ui/ui-components`   | `deno task test --trace-leaks ./src/-test/-exports.leaf.test.ts`                  |
| `code/sys.driver/driver-vite` | `deno task test:unit --trace-leaks ./src/m.vite.config.workspace/-test/-.test.ts` |
| `code/sys/workspace`          | `deno task test --trace-leaks ./src/m.graph/-test/-u.collect.test.ts`             |
| repository root, final pass   | `deno task check` then `deno task test`                                           |

The bundle suite itself calls `makeBundle()` and writes the checked-in bundle; account for that side
effect and inspect the delta afterward. Inspect workspace result summaries as well as exit codes:
root `task.check.ts` currently prints its result without explicitly assigning a failure exit code.

Acceptance:

- No repository-owned manifest retains the exact `./types` export key, including archives and the
  staged template; all edited JSON parses successfully.
- For every removal, `/t` retains the original target and all non-target exports remain unchanged.
  Static manifest/diff verification covers archives without running them.
- No live in-scope consumer imports the removed package subpath. Documentary mentions of the
  migration and negative regression assertions are not consumers.
- Generated package proof passes using the rebuilt embedded bundle; the type barrel file exists
  unchanged and other package exports survive.
- Distinct `/t` type-contract proof and runtime-empty proof survive alias-test reduction.
- Scoped tests, workspace checking, and final workspace tests pass, or concrete blockers are
  reported without claiming verification complete. No unrelated repair is implied.
- No dependency/version churn or unrelated user changes are included.

## Implementation evidence

- Removed all 68 inventoried manifest aliases and migrated the ten consumer/test/fixture files.
  `/t` targets and `src/types.ts` filenames are unchanged.
- Removed the proposed root test task and repository-wide guard at the human's request. No new root
  or CLI task remains. Permanent regression proof is the existing template materialization test:
  exact export map plus presence of `src/types.ts`.
- Regenerated the embedded bundle using `deno task tmpl --bundle --non-interactive`; only its
  `pkg/-deno.json` entry changed.
- Scoped CLI, string-builder, UI leaf-export, Vite workspace configuration, graph collection, and
  template bundle tests passed. Fresh-process template CLI verification passed: 1 test, 11 steps,
  0 failures, including package materialization.
- Final `deno task check`: success; 54 packages ran, 1 skipped, 0 failed.
- Final `deno task test`: successful completion; 55 packages, 9,393 tests, 44 reports collected,
  11 not applicable.
- Final searches across `code`, `deploy`, and `-tmp` found no plain manifest `./types` export keys
  or internal `@sys/<package>/types` consumers. `git diff --check` passed; root `deno.json` has no
  diff. Unrelated plan changes were left alone.
- The implementation pass performed no Git mutations, version bumps, or publication; subsequent
  landing is recorded in the opening arc.

## Compatibility and release boundary

Removing a public package export is breaking even when the file contains only types. The local
commit uses `!`; its eventual release communication must identify `@scope/package/types` →
`@scope/package/t`, with `src/types.ts` unchanged. Existing published versions are unaffected, but
external consumers upgrading to a version with the removal must migrate. Local search cannot certify
external usage.

This work prepares a coordinated repository change. Version selection, external consumer
coordination, and publication remain separate human-owned release actions. Do not publish, bump, add
a fallback alias, or claim registry compatibility as part of this cleanup.
