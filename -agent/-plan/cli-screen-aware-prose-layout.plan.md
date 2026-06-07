# CLI screen-aware prose layout plan

## Commit arc

- [x] 7adc25f5c feat(cli): add text fitting and wrapping formatter
- [x] f05e799fa fix(cli): fit help and chapter prose to screen width
- [x] 032872824 test(cell): prove DSL help layout under narrow widths

## Mode

Current phase: complete.

Completed arc:

```text
feat(cli): add text fitting and wrapping formatter
fix(cli): fit help and chapter prose to screen width
test(cell): prove DSL help layout under narrow widths
```

Review posture: DMIND + TMIND + S-tier. The Cell-side proof now verifies that the shared CLI prose layout keeps DSL help scanable under narrow widths. The only third-arc CLI change was a real shared formatter defect exposed by that proof: multi-backtick prose was incorrectly treated as one atomic preserved line.

## Problem statement

`@sys/cell dsl` chapter help currently looks authored and intentional at wide widths, but it can exceed the real terminal width. When that happens, the terminal performs accidental hard wrapping at column 0 and destroys the formatter's indentation contract.

The failure is structural:

- `code/sys/cli/src/m.core/m.Fmt.Chapters/m.Chapters.ts` uses `TERMINAL_TEXT_WIDTH = 100` as a fixed right-cell prose width.
- The formatter does not subtract the label gutter from the available physical screen width.
- The generic `Table` formatter aligns cells but does not own terminal-fit semantics.
- Similar local helpers already exist in `Fmt.Help` and `Fmt.Chapters` (`visibleWidth`, `padVisibleEnd`), so the concept is duplicated.

Desired behavior:

```text
max readable width
↓
current terminal width when available
↓
label gutter reserve
↓
prose flows inside the remaining body width
```

No output line should accidentally rely on the terminal emulator to wrap prose.

## Placement decision

Add the primitive under `@sys/cli` as `Cli.Fmt.Text`.

Why this is the right place:

- `Cli.Screen` owns runtime geometry: terminal size and resize events.
- `Cli.Is` owns runtime capability predicates: terminal / interactive.
- `Cli.Fmt.Text` should own rendered text layout: ANSI-aware visible width, padding, soft wrapping, hanging indents, and fitted widths.
- Cell DSL should remain data + help composition. It should not own screen layout.

Actual first-commit files:

- `code/sys/cli/src/common/libs.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/mod.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/t.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/m.Text.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.number.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.width.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.wrap.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.width.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.wrap.test.ts`
- `code/sys/cli/src/m.core/m.Fmt/-test/-.test.ts`
- `code/sys/cli/src/m.core/m.Fmt/m.Fmt.ts`
- `code/sys/cli/src/m.core/m.Fmt/mod.ts`
- `code/sys/cli/src/m.core/m.Fmt/t.ts`

## Implemented `Fmt.Text` surface

Type plane first. The public shape is intentionally small:

```ts
export type CliFormatTextLib = {
  readonly visibleWidth: (input: string) => number;
  readonly padEnd: (input: string, width: number) => string;
  readonly fitWidth: (options?: CliFormatTextFitOptions) => number;
  readonly wrap: (input: string, options: CliFormatTextWrapOptions) => string;
  readonly wrapLines: (input: string, options: CliFormatTextWrapOptions) => readonly string[];
};
```

Core option shape:

```ts
export type CliFormatTextFitOptions = {
  readonly width?: number;
  readonly maxWidth?: number;
  readonly reserve?: number;
  readonly minWidth?: number;
  readonly fallbackWidth?: number;
  readonly stream?: t.StdioName;
  readonly terminal?: boolean;
};

export type CliFormatTextWrapOptions = {
  readonly width: number;
  readonly indent?: number;
  readonly continuationIndent?: number;
  readonly preserve?: CliFormatTextPreserve;
};
```

Semantics:

- `width` is the current physical width when supplied explicitly by tests or callers.
- If `width` is absent and terminal output is available, `fitWidth` uses `Cli.Screen.size().width`.
- If terminal output is unavailable, `fitWidth` uses `maxWidth` / `fallbackWidth` so CI snapshots stay deterministic.
- `maxWidth` caps readable line length on wide displays.
- `reserve` subtracts known left-side layout cost such as label width + gutter.
- `minWidth` prevents collapse into unusable zero-width prose.

Important naming constraint:

- Do not call the initial helper `screenCells` unless it truly implements terminal cell-width semantics for wide Unicode.
- `visibleWidth` may initially mean ANSI-stripped visible string width, matching current repo practice.
- If true Unicode `wcwidth` is required, add the dependency through `deps.yaml` and make that contract explicit.

## Next: chapter and help formatter migration

Update `Cli.Fmt.Chapters` and `Cli.Fmt.Help` to consume `Fmt.Text` instead of owning private wrapping/padding helpers where the behavior is equivalent.

Expected chapter public input addition:

```ts
export type FormatInput = {
  readonly command: string;
  readonly chapter: Chapter;
  readonly label?: string;
  readonly layout?: CliFormatChapters.LayoutOptions;
};

export type LayoutOptions = {
  readonly width?: number;
  readonly maxWidth?: number;
  readonly minBodyWidth?: number;
  readonly stream?: t.StdioName;
  readonly terminal?: boolean;
};
```

Rendering rule:

1. Compute visible label width for all non-empty sections plus child index label.
2. Compute gutter width.
3. Compute total page width through `Fmt.Text.fitWidth({ width, maxWidth, ... })`.
4. Compute body width as `pageWidth - labelWidth - gutterWidth`.
5. If body width is usable, render current two-column form.
6. If body width is too small, degrade intentionally to stacked labels:

```text
Reading protocol
  Agents MUST read this root DSL layer before changing a Cell folder:
    `deno run -ER jsr:@sys/cell dsl`.
```

This is better than pretending the gutter fits and letting the terminal break the line.

## Relationship to `Cli.Table`

Do not force `Cli.Table` to become screen-aware as part of this pass.

Reason:

- Tables and prose rows are different layout subjects.
- Chapter help is labeled prose with hanging indent semantics.
- Generic tables may legitimately exceed the terminal or need future truncation policies.

Use manual chapter row rendering or a narrow prose-row helper built on `Fmt.Text`. Keep `Cli.Table` stable unless a later table-specific design pass earns it.

## Relationship to `Fmt.Help`

`Fmt.Text` has landed. In the next commit, remove duplicated width helpers from `Fmt.Help` where safe and fit help prose to the screen width.

Priority for the next commit:

1. Migrate `Fmt.Chapters` terminal prose layout to `Fmt.Text`.
2. Migrate `Fmt.Help` duplicated width/padding helpers to `Fmt.Text` where behavior is equivalent.
3. Fit help/chapter prose to screen width.
4. Do not change `Cell` yet except as a manual proving surface; Cell test proof belongs to the third arc item.

## Atomic lines and code blocks

Preserve the prior semantic rule:

- prose wraps;
- explicit same-item line breaks become continuations;
- fenced code blocks keep authored lines;
- whole-line commands, URLs, and backticked references are atomic by default.

Atomic lines may exceed width when splitting would change meaning. That exception must be explicit in tests. Do not silently split copy-paste command lines to satisfy a width assertion.

## Test plan

First commit formatter tests are complete under:

- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.width.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.wrap.test.ts`

Second commit CLI formatter tests landed under:

- `code/sys/cli/src/m.core/m.Fmt.Chapters/-test/-.test.ts`
- `code/sys/cli/src/m.core/m.Fmt/-test/-m.Fmt.Help.test.ts`

They prove:

- chapter prose fits within explicit physical widths.
- continuation lines begin at body column + 2.
- the label gutter is included in total physical width assertions.
- narrow labels degrade to stacked mode when body width would be unusable.
- child chapter index rows use set-level inline/double-line layout.
- help page prose and pair descriptions fit explicit narrow widths.
- ANSI labels do not corrupt width and padding.
- non-TTY output remains deterministic.

Third commit Cell proof tests:

`code/sys/cell/src/m.cli/-test/-u.help.test.ts`

- root DSL human help fits under an explicit narrow layout width.
- root DSL chapter index uses the all-or-none double-line form under narrow widths.
- child DSL help pages fit under the same narrow width.
- ANSI-stripped assertions inspect every rendered line width.
- atomic command/reference exceptions remain explicit if any authored command line exceeds width.

Do not patch Cell formatting locally for this proof. Cell should pass layout constraints through to `Fmt.Chapters` and assert the behavior from the public `FmtHelp.dslOutput(...)` seam.

Cell proof exposed one real shared CLI formatter bug: the default whole-line backtick preservation pattern treated prose containing multiple backticked refs as atomic. The third arc includes the small `Fmt.Text` correction and regression test so Cell DSL prose wraps truthfully instead of adding Cell-specific exceptions.

## Third commit result: `032872824 test(cell): prove DSL help layout under narrow widths`

Touched files:

- `code/sys/cell/src/m.cli/u.help/u.dsl.ts`
- `code/sys/cell/src/m.cli/-test/-u.help.test.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/u.wrap.ts`
- `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.wrap.test.ts`

Implemented:

1. Extended `FmtDslHelp.output(...)` input with optional terminal layout constraints for human output.
2. Passed layout through to `Fmt.Chapters.page(...)`; skill/Markdown output remains unaffected.
3. Removed Cell's hard-coded child-index `label: 'Chapter'`, allowing CLI default pluralization.
4. Added Cell tests through `FmtHelp.dslOutput({ layout: { width: 80 } })`.
5. Asserted every ANSI-stripped rendered line stays within the chosen narrow width.
6. Asserted root chapter index uses consistent all-double-line rows when any child summary cannot fit inline.
7. Asserted child chapter help pages also fit narrow width.
8. Fixed the shared `Fmt.Text` preservation bug for prose containing multiple backticked references and added a focused CLI regression test.

## Verification commands

Final verification run during the arc:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test --trace-leaks ./src/m.core/m.Fmt.Text/-test/-u.wrap.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test --trace-leaks ./src/m.cli/-test/-u.help.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task cli dsl
```

Historical command plan:

Targeted first:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test --trace-leaks ./src/m.cli/-test/-u.help.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task cli dsl
```

Fuller verification only after targeted proof is green:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test
```

Cross-package smoke only if Cell proof requires a CLI seam adjustment:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test --trace-leaks ./src/m.core/m.Fmt.Chapters ./src/m.core/m.Fmt
```

## TMIND failure review

- Terminal hard-wrap attack: every prose line assertion must inspect stripped output line widths against the physical width, not just contain substrings.
- Reserve attack: body wrapping must subtract label width + gutter before wrapping, otherwise tests are false green.
- ANSI attack: colored labels and colored body text must not corrupt width and padding.
- Narrow-screen attack: when the gutter leaves too little body width, stacked layout must be intentional.
- Non-TTY attack: CI output must remain deterministic and not depend on the runner's terminal size.
- Wide-screen attack: a huge terminal must not create unreadably long prose; `maxWidth` still caps.
- Atomic-command attack: width tests must not demand unsafe command splitting.
- Bundle attack: authored Cell YAML and bundled help can diverge; regenerate bundles only when source help changes.
- Scope attack: do not patch Cell DSL formatting locally; the reusable formatter must carry the behavior.
- Naming attack: do not claim true terminal cell measurement unless implemented with a real width primitive.

## S-tier acceptance bar

The work is complete only when:

- `Fmt.Text` is small, typed, and reusable.
- `Fmt.Chapters` no longer owns private wrapping/padding primitives that duplicate `Fmt.Text`.
- Cell DSL output fits narrow terminal widths without accidental terminal wrapping.
- The fallback layout is designed, not emergent.
- Tests prove failure families, not just happy-path substrings.
- Runtime probe output is visually scanable at normal and narrow widths.
- No YAML presentation spaces are introduced to compensate for formatter behavior.
