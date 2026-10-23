# Std native containment — implementation and proof receipt

Target: `fix(std): preserve native separators in path containment`.

**Status: implemented and host-verified; not landed.** The human's GO authorized this Std
prerequisite only. No staging or commit occurred. The opening arc remains unchecked until an actual
landing is observed. Workflow records are separate from the source cut.

Baseline and final HEAD: `8ba45c06f9b31ded1800f79b1318ba1e407819d1`. The two selected Std files were
clean before implementation; the existing HTTP handler/test changes were preserved.

## Exact whole-file source cut

- `code/sys/std/src/m.Path/u/within.ts`
- `code/sys/std/src/m.Path/-test/-.test.ts`

## Correction and discriminating proof

The old predicate converted native relative paths through `relativePosix`, treating POSIX filename
backslashes as separators. Before the fix, the new regression failed on `/site/root/..\report.txt`:
actual `false`, expected `true`.

The predicate now splits the native `@std/path` relative result on that library's `SEPARATOR`.
Non-string/non-absolute refusal, equal-root acceptance and the Windows absolute-relative-result
cross-drive guard remain unchanged. This uses the existing import surface rather than introducing an
unconditional module-level `Deno` dependency or another platform detector.

Permanent tests distinguish literal POSIX backslashes, `..literal.txt` and normalized descendants
from real parent paths, normalized escapes and prefix siblings. A separate Windows-conditional step
covers native/mixed separators, equality, parents, siblings and cross-drive refusal. That step was
**ignored**, not executed, on this host.

`Path.relativePosix`, public types/options, canonical Dist part-name admission, dependencies,
configuration and HTTP source were not changed. This is lexical containment, not realpath,
symlink/no-follow or race-free filesystem authority.

## Initial implementation verification — before review finish

Host: Darwin arm64; Deno 2.9.7, TypeScript 6.0.3, V8 15.0.245.2-rusty. Tests used the owning tasks
and existing permission presets with `--check --frozen --cached-only --no-prompt --trace-leaks`.

| Lane                      | Passed suites / steps | Limits                                                 |
| ------------------------- | --------------------- | ------------------------------------------------------ |
| Std Path + namespace      | 4 / 63                | One Windows step ignored                               |
| Full Std                  | 208 / 2,814           | One Windows step ignored                               |
| FS Pkg.Dist + Snapshot    | 22 / 182              | Bounded affected callers                               |
| Server Dist/files service | 3 / 18                | Bounded affected callers                               |
| HTTP static               | 1 / 12                | Existing dirty HTTP candidate                          |
| Full HTTP unit            | 59 / 460              | Existing dirty HTTP candidate; not entry-process proof |

All listed lanes had zero failures. Native Std source and HTTP source/scripts typechecks passed.
Exact two-file Std formatting, lint and `git diff --check` passed. The index and root dependency
files remained clean, and HEAD did not move.

Commands, from `code/sys/std`:

```sh
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Path/ ./src/-test/-namespace.freeze.test.ts
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/
deno fmt --check ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
deno lint ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
```

From `code/sys/fs`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Pkg.Dist/ ./src/m.Snapshot/
```

From `code/sys/server`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.server.dist.service/ ./src/m.server.files.service/
```

From `code/sys/http`:

```sh
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts
deno task test:unit --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno check --frozen --cached-only ./src/ ./-scripts/
```

## Shared-caller inspection and review limits

Inspected actual uses in FS child-root filtering (`u.hash.ts`), bidirectional projection
disjointness (`u.project.ts`), Snapshot strict-descendant selection (`u.selection.ts`), and Server
configured-root confinement (`u.resolve.ts` and `u.config.resolve.ts`). These retain their separate
inventory, identity and symlink decisions; the shared predicate is not HTTP-local.

Both selected files received whole-file implementing-agent inspection at this initial checkpoint. No
independent review had returned then. No isolated-commit test, Windows/browser execution, build,
deployed or complete-chain certification is claimed. Unit checks do not establish the separately
owned process lanes.

The [HTTP receipt](./HTTP.static-containment.landing.md) remains held: its real native-filename byte
regression, same-origin directory redirect and consistent decoded middleware admission are still
outstanding. These greens do not close that review hold or authorize the next implementation.

## Returned independent review — accepted P3 and verified finish

The human returned **ready; not yet S-tier**. The report found no demonstrated behavioral regression
in native-separator containment. Its one inherited P3 concerned whole-selected-file test residue:
four redundant `as unknown` casts and the `any` callback in the non-string `Path.extname` probe. The
recommendation remains prospective configuration, not attested reviewer-runtime provenance.

**Adjudication: accepted and corrected within the existing test owner.** `Path.Is.within` already
accepts `unknown`, so its four casts were removed. The extension test now uses an `unknown[]` and an
explicit loop, with one documented `input as string` at the intentional invalid-input crossing of
the string-only public boundary. This keeps the runtime refusal assertions without widening the API
or introducing a broadly weakened helper type.

The prepared layout follow-up was applied in the same test file: one `isWindows` condition drives
join/separator selection and the two inline ignore bags. Titles, tables, expectations, labelled
assertions and skip behavior are unchanged. `within.ts` was not changed during this finish.

Fresh final-byte checks, from `code/sys/std`, passed:

```sh
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot ./src/m.Path/ ./src/-test/-namespace.freeze.test.ts
deno task test --check --frozen --cached-only --no-prompt --trace-leaks --reporter=dot
deno task check --frozen --cached-only
deno fmt --check ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
deno lint ./src/m.Path/u/within.ts ./src/m.Path/-test/-.test.ts
```

Focused Path/namespace: **4 suites / 63 steps**. Full Std: **208 suites / 2,814 steps**. Both had
zero failures and one ignored Windows step on the same Darwin host. Declared typecheck, exact-file
format/lint and scoped `git diff --check` passed. Whole selected files and the complete source diff
were inspected. Source cut: **49 insertions / 11 deletions across two files**. HEAD remained
`8ba45c06f9b31ded1800f79b1318ba1e407819d1`; the index and root dependency files remained clean.

The FS/Server/HTTP lanes above are retained initial-implementation evidence, not reruns against the
finished test file. The predicate and public contracts did not change during finish. These checks
close the accepted P3; they are not a fresh independent S-tier verdict or native Windows/browser
certification. No additional blind pass, staging, commit or landing occurred.

The [style follow-up](../handoffs/STD.style-followup.md) now records completed source work and the
separately owned canon clarification, still prepared only. Canon policy was not edited in this
finish.
