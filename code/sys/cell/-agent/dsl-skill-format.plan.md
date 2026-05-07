# Cell DSL skill-format projection plan — completed

## Status

Completed and retired.

The implementation landed in two pieces:

1. `feat(cell): add skill format for dsl chapters`
   - `@sys/cli` gained generic `Cli.Fmt.Chapters.markdown(...)`.
   - `@sys/cell dsl` gained `--format human|skill`.
   - `human` remains the default.
   - `skill` renders agent-skill Markdown/frontmatter projections.
   - Cell owns skill names/descriptions; `@sys/cli` does not know Cell or skill semantics.

2. `refactor(cli): centralize chapter help page formatting`
   - `@sys/cli` gained `Cli.Fmt.Chapters.page(...)`.
   - `page(...)` owns generic terminal chapter-help-page composition:
     - `Help.build(...)`
     - gray `hr(...)` separator when a chapter body exists
     - `Chapters.format(...)`
     - block trimming/composition
   - `@sys/cell` DSL help now supplies only Cell-specific content and uses the generic page seam.

## Final shape

Canonical principle remains:

```text
Cell DSL chapters are canonical; skills are projections.
```

Implemented CLI shape:

```sh
deno run -ER jsr:@sys/cell dsl [chapter...] --format human
deno run -ER jsr:@sys/cell dsl [chapter...] --format skill
```

Visible help surface:

```text
Usage     deno run -ER jsr:@sys/cell dsl [chapter...] [--format <format>]

Options   --format <format>   render output as human or skill
          -h, --help          show DSL help

Formats   human   terminal help output (default)
          skill   agent-skill Markdown projection of the requested DSL chapter
```

## Validation

Final checks passed:

```sh
cd code/sys/cli && deno task check && deno task test
cd code/sys/cell && deno task check && deno task test
```

## Retirement

This plan has served its purpose and should not remain as live agent guidance.
