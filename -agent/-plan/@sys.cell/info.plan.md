# @sys/cell info command plan

## Commit messages

- [x] feat(cell): add read-only info command

## Goal

Add `@sys/cell info [dir]` as a read-only declaration report for a Cell folder.

`help` explains how to operate the tool. `info` reports what this Cell declares.

## Contract

`info` v1 reports descriptor facts only:

- Cell root
- descriptor path
- descriptor version
- declared services
- declared tasks

It must not:

- import endpoint modules
- read owner package configs
- scan `data/`
- probe ports or process state
- infer views or derived surfaces
- write, migrate, start, kill, or otherwise mutate

## Output shape

Minimal Cell:

```text
Cell
  root        .
  descriptor  -config/@sys.cell/cell.yaml
  version     1

Services
  none

Tasks
  none
```

Declared services/tasks:

```text
Cell
  root        ./cell.stripe
  descriptor  -config/@sys.cell/cell.yaml
  version     1

Services
  view
    use     Serve
    from    jsr:@sys/tools/serve
    config  -config/@sys.tools.serve/view.yaml
    modes   dev

Tasks
  sample:deploy
    steps   sample:deploy:prep → sample:publish
```

## Implementation seams

Target files likely include:

- `code/sys/cell/src/m.cli/t.ts`
- `code/sys/cell/src/m.cli/u/u.args.ts`
- `code/sys/cell/src/m.cli/m.run/u.run.ts`
- `code/sys/cell/src/m.cli/m.run/u.info.ts`
- `code/sys/cell/src/m.cli/u.fmt/u.info.ts`
- `code/sys/cell/src/m.cli/u.help/u.info.ts`
- `code/sys/cell/src/m.cli/u.help/u.mod.ts`
- `code/sys/cell/src/m.help/yaml/info.yaml`
- `code/sys/cell/src/m.help/yaml/root.yaml`
- `code/sys/cell/README.md`

Generated bundles after help changes:

- `code/sys/cell/src/m.help/-bundle/-bundle.json`

## Type/API shape

Add:

- `CellCli.Info.Result`
- `CellCli.Result | Info.Result`
- `runInfo(ctx)`
- `FmtInfo.output(result)` or equivalent formatter surface

`Info.Result` should expose strict, observed facts:

- `kind: 'info'`
- `input`
- `text`
- `root`
- `descriptor`
- `version`
- declared service/task counts or normalized report model if useful

Prefer a report model only if it keeps formatting testable without widening the public API beyond runtime truth.

## Formatter rules

- Use existing `@sys/cli`/local CLI primitives and shared local formatter helpers; do not reimplement generic table/path/width primitives.
- Compute one shared label-column width across all label/value rows, including rows separated by blank section breaks.
- Keep section breaks visually quiet: no bullets, boxes, or ornamental dividers.
- Use existing `Cli.Fmt.Path`/local path helpers for path rendering.
- TTY path fitting must be screen-width aware and preserve `<left>..<right>` with cyan `..` when color is enabled.
- Render descriptor version as a subtle value so it remains factual without drawing primary attention.
- Normalize ANSI before width assertions in tests.

## Behavior plan

1. Add `info` help YAML and root help command entry.
2. Add parser/route support for `info [dir]` and `info -h`.
3. Load the target Cell descriptor through the existing Cell load path.
4. Project only descriptor facts into an info report model.
5. Render Cell, Services, and Tasks sections.
6. Regenerate help bundle.
7. Update README command list/docs.

## Tests

Add or update tests for:

- root help lists `info`
- `info -h` routes to command help
- minimal Cell prints `Services none` and `Tasks none`
- descriptor path and version render from the loaded Cell
- services render `use`, `from`, optional `config`, and modes
- tasks render leaf endpoint facts and composite `steps` order
- formatter uses one shared label width across section breaks
- long TTY path/value fitting uses canonical path formatting behavior
- `info` does not import endpoints, scan `data/`, or mutate files

Expected commands:

```sh
cd code/sys/cell && deno task help:bundle
cd code/sys/cell && deno task test --trace-leaks ./src/m.cli/-test ./src/m.help/-test
cd code/sys/cell && deno task check
```

## STIER + DMIND pre-check

Verdict: ready to implement if the first implementation act is a formatter/CLI contract test, not routing glue.

Design fit:

- The command has one subject: declared Cell identity.
- It does not blur into `status`, `start`, `task --plan`, or `dsl`.
- The empty Cell case is first-class, not a degenerate error path.
- Derived surfaces remain uncreated until earned.

Adversarial risks:

- Do not make `info` truthful-looking by probing live status; that belongs in a later `status` surface if earned.
- Do not leak endpoint loading through task/service helper reuse.
- Do not reimplement table layout to force the sample shape; work through the CLI table primitive or improve the primitive separately.
- Do not let help/doc changes become the behavior source of truth; tests should pin the CLI result and formatter output.
- Do not use `/data` presence or template assumptions as Cell facts beyond descriptor loading.

Open decision before coding:

- Choose whether the formatter owns a private row model or `runInfo` returns a normalized report model. Prefer private formatter rows unless tests show a stable report model earns promotion.
