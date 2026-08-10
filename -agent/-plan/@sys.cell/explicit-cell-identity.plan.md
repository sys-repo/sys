explicit-cell-identity.plan.md
- [x] c1288598f feat(cell): add explicit Cell identity
- [x] 7cf53c8c4 feat(cell): render caller-owned start identity
- [x] 983e321ee chore(ui): identify sys.ui Cell

## Purpose

Make the running Cell, rather than the `@sys/cell` implementation package, the optional subject of
Cell start presentation.

A Cell that declares or receives no identity renders only its service list. Identity and release
provenance appear only when their owners supply them.

## Governing semantics

- A Cell may declare an optional stable `name` in `-config/@sys.cell/cell.yaml`.
- Root `version: 1` remains the Cell descriptor schema version only.
- A programmatic Cell CLI caller may supply an optional authoritative `t.Pkg`.
- Descriptor `name` supplies the preferred Cell title.
- Caller `pkg.name` supplies the title only when the descriptor has no name.
- Caller `pkg.version` supplies the displayed release version when a real package was supplied.
- `@sys/cell` package metadata is never injected implicitly into Cell start presentation.
- No identity means no identity row, no `Untitled` placeholder, and no orphaned header rule.
- Help, diagnostics, runtime authority, and package metadata remain free to identify `@sys/cell`
  when the tool itself is the actual subject.

## Public contract

Descriptor shape:

```yaml
kind: cell
version: 1
name: sys.ui
```

`name` is optional and uses the existing `Cell.Id` grammar. It identifies the bounded Cell; it is
not arbitrary header copy.

Programmatic CLI shape:

```ts
await CellCli.run({ argv, pkg });
```

`pkg` is optional caller-owned package metadata. It is invocation context, not YAML state and not an
argv flag. The core `Cell.start` and `Cell.Services.start` lifecycle APIs do not receive presentation
metadata.

Do not add a `{ left, right }` overload. Cell exposes identity and provenance; `Cli.Fmt.Header` owns
layout.

## Resolution table

| Descriptor `name` | Caller `pkg` | Start identity |
|---|---|---|
| `sys.ui` | `{ name: '@sys/ui', version: '0.0.39' }` | `sys.ui` with `0.0.39` |
| `sys.ui` | absent | `sys.ui` with no version |
| absent | `{ name: '@sys/ui', version: '0.0.39' }` | `@sys/ui` with `0.0.39` |
| absent | absent | no identity header |

Unknown or synthetic package metadata does not establish release provenance and is treated as
absent.

## Invariants

- A displayed version belongs to caller-supplied package provenance, never to descriptor schema
  version or ambient runner metadata.
- A named Cell without caller package metadata displays no version.
- The direct `jsr:@sys/cell start` entry does not pass its own package metadata automatically.
- Cell does not inspect a nearby `deno.json`, infer package ownership, transform package names, or
  scan service-name prefixes to manufacture identity.
- Existing unnamed descriptors remain valid.
- Start identity resolution is pure and independently testable.
- The Cell is loaded once before the reporter needs its resolved identity; header support must not
  introduce duplicate descriptor reads.
- Raw output remains append-only and screen output remains responsive.
- Width and height fitting remain terminal-cell aware.

## `feat(cell): add explicit Cell identity`

Boundary:

- add optional `name?: Cell.Id` to the public descriptor type;
- accept `name` in the descriptor schema and reject malformed IDs through the existing ID grammar;
- preserve `additionalProperties: false`;
- expose the optional name through `cell info` without reinterpreting it as package metadata;
- update descriptor DSL/help and checked-in generated bundles through the authoritative prep task;
- keep the default template unnamed because initialization cannot truthfully invent identity;
- make selected `@sys/cell` samples demonstrate named and unnamed descriptors;
- prove load, schema, info, and template compatibility.

This commit establishes identity as descriptor truth without changing start-header ownership.

## `feat(cell): render caller-owned start identity`

Boundary:

- extend the programmatic `CellCli.run(...)` invocation context with optional `pkg?: t.Pkg`;
- carry the original invocation context truthfully through start results and failures;
- resolve start identity from the loaded descriptor and optional caller package;
- remove the implicit `@sys/cell` package fallback from start-header formatting;
- omit the complete identity header and rule when resolution yields no title;
- use the existing `Cli.Fmt.Header` title/version controls rather than adding layout overloads;
- ensure the reporter opens only after one loaded Cell has established identity;
- preserve startup spinner ownership, resize handling, completion priority, and raw reporter behavior;
- add `@sys/cell` samples or sample entry coverage for:
  - unnamed/no-package → services only;
  - named/no-package → name only;
  - unnamed/package → package name and version;
  - named/package → Cell name and package version;
- prove no blank synthetic header row appears when identity is absent.

This commit owns both API and presentation proof so no intermediate public state claims support that
the reporter does not yet honor.

## `chore(ui): identify sys.ui Cell`

Boundary:

- add `name: sys.ui` to `code/sys.ui/ui/-config/@sys.cell/cell.yaml`;
- provide the `@sys/ui` generated `pkg` to the programmatic Cell CLI start entry;
- preserve the existing `dev`, `serve`, `kill`, mode, reporter, and permission semantics;
- avoid manually duplicating `0.0.39` outside generated package metadata;
- make `Cli.Fmt.Header` apply an explicit tone to plain custom titles while preserving pre-rendered
  ANSI titles and untoned custom-title output;
- prove both development and static-service modes display `sys.ui` with the actual `@sys/ui`
  package version;
- keep `@sys/cell` absent from application start chrome.

## Proof

Narrow proof during implementation:

```sh
cd code/sys/cell
deno task test --trace-leaks ./src/m.cell/u.schema/-test/-.test.ts ./src/m.cell/-test/-u.load.test.ts ./src/m.cli/-test/-info.test.ts ./src/m.cli/-test/-start.test.ts ./src/m.cli/-test/-u.start.reporter.test.ts
deno task check
```

After DSL/help source changes:

```sh
cd code/sys/cell
deno task prep
deno task test
deno task check
```

Consumer proof:

```sh
cd code/sys.ui/ui
deno task test
deno task check
deno task dev
```

Runtime acceptance for `deno task dev`:

- the identity row shows green `sys.ui` and the generated green `@sys/ui` version;
- `@sys/cell` does not appear in application chrome;
- the service list and selected `--mode=dev` facts remain unchanged;
- resize and Ctrl-C cleanup remain correct.

Also run `deno task serve` and verify the same identity semantics for the default service graph.

## Verification

- `@sys/cli`: `deno task test` passed 39 tests / 227 steps; `deno task check` passed.
- `@sys/cell`: `deno task test` passed 32 tests / 264 steps; targeted start/task trace-leak proof
  passed; `deno task check` passed.
- `@sys/ui`: `deno task test` passed 9 tests / 75 steps; targeted start-entry trace-leak proof
  passed; `deno task check` passed.
- `deno task dev` and `deno task serve` rendered a bold green `sys.ui`, green `0.0.39`, and a
  green header rule without `@sys/cell` chrome.
- Both runtime probes stopped before service readiness because an existing user-owned listener held
  `127.0.0.1:5050`; it was not disturbed. The existing start-service, resize, and cleanup proofs
  remain covered by the Cell suite.

## Non-goals

- No Cell display-title or arbitrary header-copy field.
- No `{ left, right }` formatter API.
- No implicit package discovery.
- No package-name-to-Cell-name conversion.
- No manually maintained application version in `cell.yaml`.
- No change to service names, task names, service lifecycle contracts, or owner status models.
- No rich service drill-down or terminal navigation work.
- No `@sys/cell` branding fallback in Cell start output.
