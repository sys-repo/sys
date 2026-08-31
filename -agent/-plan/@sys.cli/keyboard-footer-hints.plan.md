keyboard-footer-hints.plan.md
- [x] 0db1f49f6 feat(cli): format adaptive keyboard hint rows
- [ ] fix(driver-pi): align compact keyboard footer hints

## Purpose

Unify the repeated terminal keyboard-hint grammar behind one narrow `@sys/cli` formatter while
keeping footer placement, keyboard behavior, and application policy with their existing owners.
Reduce the default hints to `q`, remove redundant copy, and retain useful controls under narrower
widths without clipping or broad consumer churn.

Planning, review, and readiness do not authorize implementation or Git mutation.

## Reviewed boundary

The behavior and placement layers are already separated correctly:

- `Cli.Keyboard` owns key classification and listener lifecycle;
- `Cli.Screen.Dock.bottom` owns optional bottom placement; and
- `Cli.Fmt` owns terminal presentation and cell-width measurement.

Only presentation is duplicated. Driver Vite and Server independently render the same `open` and
`quit` strings, while Driver Pi renders the same quit concept with different color and emphasis.
`@sys/cli` is therefore the lowest truthful owner for the shared formatter. Do not move this into
`@sys/std`, Driver Vite, Server, or Driver Pi.

The shared surface is keyboard-hint formatting, not a footer framework. Callers continue to own
blank rows, divider rows, docking, state-dependent visibility, and the truth that each displayed key
is actually admitted by that application.

## Selected formatter shape

Add one public `Cli.Fmt.Keyboard` namespace with exactly two composable operations. The canonical
owner type is `CliFormatKeyboard`, projected without redefinition through `t.Cli.Fmt.Keyboard`:

```ts
export declare namespace CliFormatKeyboard {
  export type Lib = {
    readonly command: (options: Command.Options) => string;
    readonly row: (options: Row.Options) => string | undefined;
  };

  export namespace Command {
    export type Options = {
      label: string;
      keys: [first: string, ...rest: string[]];
      context?: string;
    };
  }

  export namespace Row {
    export type Options = {
      width: number;
      candidates: Candidate[];
    };

    export type Candidate = {
      right: string;
      left?: string;
    };
  }
}
```

`command` receives package-authored, non-empty, single-line display text. `label` excludes its
trailing colon, each `keys` entry is one complete authored key string in display order, and `context`
excludes parentheses. The type-level non-empty tuple prevents an empty supported key sequence.
`command` does not parse chords, reorder keys, infer aliases, or normalize authored copy.

`command` owns only the common visual grammar:

- action label and punctuation: dim gray;
- each key string: bold white;
- `or` and optional parenthetical context: dim gray.

`row` receives ordered complete presentation candidates. Every candidate requires a right lane and
may add one left lane; no left-only candidate is supported by the current evidence. Candidate
strings are non-empty, single physical lines, may contain ANSI, and are preserved byte-for-byte.
`row` inserts spaces only. An empty candidate list returns `undefined`.

The candidate order is the complete progressive-reduction policy. `row` does not infer which
context or command should disappear, combine independently supplied lanes, invoke callbacks, or clip
content. The first candidate that fits wins. Two-sided candidates require a private fixed minimum of
two terminal cells between lanes and fill the complete normalized width; right-only candidates are
right-aligned and also fill that width.

Width normalization is exact and local to `row`: finite positive values are floored and admitted
only through `65,535`; every other value, including `65,536`, returns `undefined` without terminal
fallback or allocation. Do not route explicit row width through a `Cli.Fmt.Text.Width.fit` fallback
that can turn an invalid source into `80`. ANSI-aware measurement remains owned by
`Cli.Fmt.Text.Width`. Text-authority, measurement, aggregate-source, and aggregate-output failures
propagate; they are never translated to `undefined`. A `65,535`-cell row is admissible only when its
actual source and rendered output remain inside those existing presentation limits.

Within the supported typed contract, `undefined` means only invalid explicit width, an empty
candidate list, or no complete fitting candidate. The fixed gap is not public policy. Add no width
fallback, gap option, overload, callback, priority, compatibility alias, or direct named `Keyboard`
export from `@sys/cli/fmt`.

No action names, key bindings, or hidden defaults belong in `@sys/cli`. Consumers explicitly supply
`q`; a caller that deliberately needs the longer teaching form may supply ordered keys such as
`ctrl + c`, `q`. Omitting `context` yields `open: o` without a second API or boolean policy flag.

Expected ANSI-stripped reduction for Driver Vite and Server:

```text
open: o (browser) · quit: q
→ open: o · quit: q
→ no keyboard row
```

The centered dot represents the width-filled gap between lanes; it is not rendered copy.

Expected ANSI-stripped Driver Pi row:

```text
← ctrl · quit: q
```

Driver Pi retains its local cyan back glyph as a preformatted left lane. Do not add a generic glyph,
modifier, navigation, or semantic-tone DSL merely to absorb that one local distinction.

## Invariants

- ANSI-stripped output remains semantically complete.
- Default visible quit help is exactly `quit: q`; runtime `q` and `Ctrl+C` acceptance is unchanged.
- Wide open help is `open: o (browser)`; the first width reduction is `open: o`.
- `in browser`, `quit: ctrl + c or q`, and `← + ctrl` disappear from the migrated footers.
- Width selection is deterministic at exact terminal-cell boundaries and handles ANSI and wide
  Unicode through `Cli.Fmt.Text.Width` without converting invalid explicit widths to terminal
  fallbacks.
- A keyboard row is selected whole or omitted whole; it is never sliced, ellipsized, partially
  colored, or reduced after a presentation-authority failure.
- Existing divider tone, blank-row count, vertical capacity, and bottom-docking behavior remain with
  each consumer.
- The formatter introduces no filesystem, network, process, environment, signal, or keyboard
  authority.
- Driver Pi gains no new ambient prototype dependency after caller-controlled callbacks may run.
- No dependency, permission, task, generated file, package version, or browser behavior changes.

## `feat(cli): format adaptive keyboard hint rows`

### Owner surface

Add the focused formatter beside the existing `Header`, `Commit`, and `ServiceUrl` modules:

- `code/sys/cli/src/m.core/m.Fmt/t.keyboard.ts`;
- `code/sys/cli/src/m.core/m.Fmt/m/m.Keyboard.ts`;
- the `CliFormat.Lib` aggregate and exact `Cli.Fmt.Keyboard` type projections;
- the frozen `Fmt` runtime aggregate;
- focused runtime, aggregate-identity, and type-projection tests under
  `code/sys/cli/src/m.core/m.Fmt/-test/`;
- inherited base-member identity proof in
  `code/sys/cli/src/m.core/m.Fmt.Code/-test/-.test.ts`; and
- the nested namespace freeze contract in `code/sys/cli/src/-test/-namespace.freeze.test.ts`.

Keep the public type spine explicit. Do not add a footer object, rendering class, key parser,
shortcut registry, generalized priority system, or compatibility alias.

`CliFormatCode.Fmt.Lib` already extends the complete `CliFormat.Lib`, and `@sys/cli/fmt/code` spreads
the base `Fmt`. It therefore inherits `Keyboard` automatically. Do not redefine that member or add a
second type surface. Freeze the new `Keyboard` namespace itself because freezing the parent `Fmt` is
shallow, and preserve one runtime identity across `CodeFmt.Keyboard`, `Fmt.Keyboard`, and
`Cli.Fmt.Keyboard` without adding a top-level named `Keyboard` export from `@sys/cli/fmt`.

Owner proof covers:

- exact raw ANSI equality and ANSI-stripped equality for one key, alternatives in supplied order,
  context present, and context absent;
- exact full, compact, and omitted rows at widths `26`, `25`, `16`, and `15`;
- width `15.9` flooring to `15` rather than rounding or falling back;
- plain output at `65,535`, `65,536` returning `undefined`, and existing aggregate-output refusal
  propagating when ANSI bytes make the admitted-cell row exceed the text envelope;
- an empty candidate list returning `undefined`;
- right-only exact alignment at widths `7` and `8`;
- the wide-Unicode row `界  q` measuring exactly five terminal cells;
- no fitting candidate yielding `undefined` without clipping;
- exact type equality for the non-empty key tuple and right-required candidate through
  `@sys/cli/t`, `@sys/cli/types`, and `Cli.Fmt.Keyboard`;
- `CodeFmt.Keyboard === Fmt.Keyboard === Cli.Fmt.Keyboard`;
- `Object.isFrozen(Fmt.Keyboard)` and `Object.isFrozen(CodeFmt.Keyboard)`; and
- absence of a second top-level named `Keyboard` export from `@sys/cli/fmt`.

### Immediate consumers

Migrate only the two proven duplicate implementations:

- `code/sys.driver/driver-vite/src/m.vite/u.dev/u.screen.layout.ts`;
- `code/sys/server/src/m.server.dist/u.server.screen/u.layout.ts`.

Both consumers explicitly build:

1. a full candidate with `open: o (browser)` and `quit: q`;
2. a compact candidate with `open: o` and `quit: q`.

Reuse the same formatted quit command across candidates. Preserve each consumer's existing divider
and docking composition. Do not create a Vite/Server shared module, and do not migrate unrelated
menu, prompt, HTTP tree-help, or one-line instructional copy merely because it mentions a key or a
browser.

Update the existing render and resize tests to prove wide, compact, omitted, and compact → wide
reprojection. At a compact width, strip ANSI and assert the exact footer row plus explicit absence of
`(browser)`; do not use containment that also matches `open: o (browser)`. Exercise one no-row width
and resize from compact to wide. The owner tests carry the exact `26/25/16/15` algorithmic boundary;
consumer tests retain docking and repaint composition without duplicating that matrix.

Remove assertions that presentation teaches `Ctrl+C`. Retain existing Driver Vite and Server
keyboard behavior tests, including their current focused keyboard test surfaces, but do not claim
input behavior from presentation assertions.

Run the new `@sys/cli` formatter tests red → green first, then the focused Driver Vite and Server
screen tests. Finish with each touched package's declared `check` and `test` tasks and the `@sys/cli`
dry-publication task. Do not publish.

## `fix(driver-pi): align compact keyboard footer hints`

Adopt the landed formatter only in:

- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.screen.ts`;
- its focused screen render, resize, and owner tests under
  `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/`.

Render the package-owned back lane as `← ctrl`, preserving the cyan arrow and subordinate modifier.
Render quit through `Cli.Fmt.Keyboard.command` with the sole visible key `q`, then place both through
the shared row formatter. Failed and stopping states continue to omit back and right-align the same
shared `quit: q` command.

Do not change `Cli.Keyboard.Is.quit`, Driver Pi key-event classification, `Ctrl+Left` admission,
first-event arbitration, cleanup ordering, navigation settlement, failure settlement, or menu
re-entry. The shorter footer may fit at narrower widths; that is the intended presentation change.
Vertical capacity rules remain unchanged, so state facts still win when the complete footer cannot
fit by height.

Use a pure frozen shared formatter built only from operations already admitted by Driver Pi or from
formatter-owned captured authority. Driver Pi retains its existing `assertPresentationAuthority`;
successful formatting does not replace, relax, or bypass it. `command` and `row` must not catch or
translate `Cli.Fmt.Text` authority failures into `undefined`. If adoption requires weakening that
boundary, adding an unchecked ambient prototype dependency, or moving Driver Pi lifecycle policy
into `@sys/cli`, stop and replan rather than forcing reuse.

Extend `-u.start.gui.screen.owner.test.ts` for every newly used ambient operation after the first
frame, including candidate traversal, alternative-key joining, and gap construction when the
implementation uses them. Mutate each operation, transition state, and prove hostile invocation
count remains zero, `onFailure` runs exactly once, no additional frame is published, the error
remains package-owned, and cleanup remains retryable.

Focused proof covers:

```text
clean navigable state at width 15 → ← ctrl at left; quit: q at right
clean navigable state at width 14 → complete keyboard row omitted
failed/stopping state at width 7  → right-aligned quit: q
failed/stopping state at width 6  → complete keyboard row omitted
short viewport                    → state facts retained; complete footer omitted
mutated formatter operation       → zero hostile calls; one owned failure; no new frame
q / Ctrl+C                        → existing quit behavior unchanged
Ctrl+Left                         → existing clean back behavior unchanged
```

Run focused screen tests first, then Driver Pi's declared profile, check, and package test tasks.
Finish with a residue scan over the three migrated consumers for the retired footer strings and with
`git diff --check`. Do not rebuild, bind evidence, serve, publish, or mutate generated evidence.

## Non-goals

- teaching terminal interrupt conventions;
- changing accepted key chords or keyboard lifecycle behavior;
- creating a universal footer, command palette, shortcut registry, or help system;
- changing headers, dividers, docking, log capacity, or screen ownership;
- migrating unrelated keyboard copy or browser instructions; or
- normalizing every chord in the repository beyond the requested `← + ctrl` → `← ctrl` correction.

## Stop conditions

Stop and refine this plan before implementation if:

- the formatter needs to know `open`, `quit`, `back`, browser targets, or application state;
- progressive reduction cannot be expressed as caller-ordered complete candidates;
- Driver Vite and Server no longer share the same semantic command grammar;
- Driver Pi requires weakening presentation authority or exporting navigation policy;
- a current displayed key is not backed by existing input behavior;
- the change requires dependency, permission, task, generated-evidence, or lifecycle edits; or
- adoption expands beyond the three identified screen consumers without a separately reviewed need.
