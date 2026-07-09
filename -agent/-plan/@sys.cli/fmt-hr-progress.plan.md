# @sys/cli Fmt.hr progress mode plan

- [x] `46b06fc75` feat(cli): add progress mode to Fmt.hr
- [x] `7c68a9c81` refactor(workspace): render test-runner completed progress with Fmt.hr

## Position

Add progress as a nested mode on `Cli.Fmt.hr`, not as top-level option overloads.

`hr` already owns terminal-width rule geometry. Progress is the same rule with a completion split,
so the clean API is:

```ts
Cli.Fmt.hr({ progress: 0.35 });
Cli.Fmt.hr({
  width: 40,
  weight: 'heavy',
  progress: {
    percent: 0.35,
    color: {
      indicator: 'green',
      track: 'gray',
    },
  },
});
```

DMIND rule: top-level options describe the rule's geometry and primary tone; `progress` enters
partial-fill mode; progress-local color names the progress-bar parts: indicator and track.

## API shape

Target type shape in `code/sys/cli/src/m.core/m.Fmt/t.ts`:

```ts
export namespace Hr {
  export type Color = AnsiColor.Name;

  export type Options = {
    /** Explicit rule width. Omit to use the current screen width. */
    readonly width?: number;

    /** Primary rule color: whole rule in line mode, indicator segment in progress mode. */
    readonly color?: Color;

    /** Visual rule stroke weight. Defaults to `heavy`. */
    readonly weight?: Weight;

    /** Optional progress mode. */
    readonly progress?: Progress.Input;
  };

  export namespace Progress {
    export type Input = t.Percent | Options;

    export type Options = {
      /** Fractional completion from 0..1. */
      readonly percent: t.Percent;
      /** Progress-bar part colors. */
      readonly color?: Colors;
    };

    export type Colors = {
      /** Filled/completed value segment. Defaults to root `color`, then green. */
      readonly indicator?: Hr.Color;
      /** Background groove/remainder segment. Defaults to gray. */
      readonly track?: Hr.Color;
    };
  }
}
```

## TMIND / STIER API review

- `progress` is the mode discriminator; no `kind`, no `never`, no parallel option object.
- Top-level `color` has one meaning: the rule's primary tone.
- In line mode, primary tone colors the whole rule.
- In progress mode, primary tone colors the indicator segment.
- `progress.color.indicator` is the local indicator override.
- `progress.color.track` is the local groove/remainder override.
- Use the common UI part names: indicator and track. Avoid math-shaped API names such as
  `remainderColor`.
- `t.Percent` names the 0..1 contract at the type surface; runtime still clamps because the alias is
  structurally a number.
- Do not accept strings such as `'35%'` here. The formatter API stays numeric and predictable.
- Do not add labels, counters, ETA, or spinner semantics to `hr`; those would earn a separate
  progress formatter.

Keep existing call forms working:

```ts
Cli.Fmt.hr();
Cli.Fmt.hr(80);
Cli.Fmt.hr('green');
Cli.Fmt.hr(80, 'green');
Cli.Fmt.hr({ width: 80, color: 'green' });
```

## Semantics

- `width` omitted → current terminal width via existing `Screen.size()` behavior and fallback.
- `weight` omitted → existing heavy rule.
- `progress` omitted → existing whole-line mode.
- `progress: t.Percent` → shorthand for `{ percent: value }`.
- `percent` is fractional completion from `0..1`, because `0.35` means 35% complete.
- Clamp `percent` to `0..1`.
- Indicator cells resolve color as `progress.color?.indicator ?? options.color ?? 'green'`.
- Track cells resolve color as `progress.color?.track ?? 'gray'`.
- Use floor-style cell allocation so the bar does not overstate completion before `1`.
- Preserve zero-width behavior.

## Implementation notes

Owner files:

```txt
code/sys/cli/src/m.core/m.Fmt/t.ts
code/sys/cli/src/m.core/m.Fmt/m.Fmt.Hr.ts
code/sys/cli/src/m.core/m.Fmt/-test/-m.Fmt.hr.test.ts
```

Implementation sketch:

- Keep the positional `HrInput = number | Color | Options | undefined` compatibility surface.
- Add `wrangle.progress(input)` to normalize `t.Percent | Progress.Options`.
- Add `wrangle.progressLine(options, width)` that returns indicator + track segments.
- Import and use canonical helpers from `common.ts`; use `Num.Percent.clamp` for the percent clamp.
- Do not introduce a separate `Fmt.progress` unless future usage wants labels, ETA, counters, or
  lifecycle behavior.

Behavior tests:

- `hr({ progress: 0.35, width: 10 })` renders three indicator cells and seven track cells.
- `hr({ progress: { percent: 1 }, width: 10 })` renders all indicator cells.
- `hr({ progress: { percent: 0 }, width: 10 })` renders all track cells.
- clamp below `0` and above `1`.
- default progress colors are green indicator and gray track.
- top-level `color` becomes the indicator color in progress mode.
- explicit `progress.color.indicator` overrides top-level `color`.
- explicit `progress.color.track` overrides the gray track default.
- `weight` still changes both segments.
- measured terminal width still applies when width is omitted.
- existing line-mode overloads remain unchanged.

## Call-site commit: @sys/workspace test runner

Update the workspace parallel test reporter after the `@sys/cli` feature lands.

Target files:

```txt
code/sys/workspace/src/m.run/u.reporter.ts
code/sys/workspace/src/m.run/-test/-u.reporter.test.ts
```

Current completed section shape:

```txt
completed
  ✓  code/sys/crdt 237ms          ✓  code/sys.dev 112ms
  ✓  deploy/@tdb.slc.fs 46ms      ✓  code/sys/types 234ms
```

Final implementation replaces the `completed` label line with a progress HR:

```ts
const rule = Cli.Fmt.hr({
  width,
  color: wrangle.completedSeverityColor(args.completed),
  progress: wrangle.progressRatio(done, args.runnableTotal),
});
```

Then render:

```txt
<progress rule>
  ✓  code/sys/crdt 237ms          ✓  code/sys.dev 112ms
  ✓  deploy/@tdb.slc.fs 46ms      ✓  code/sys/types 234ms
```

DRY requirement:

- Extract the existing completed overflow color calculation into one helper.
- Use that helper for both:
  - the colored `...and <number> more` count;
  - the progress HR indicator color.
- Severity order stays: failed → red, blocked/skipped → yellow, passed-only → green.
- Keep the overflow label text gray/italic; only the count color is shared.

Call-site details:

- Use the already computed frame `width`; do not rely on a second ambient terminal measurement.
- Use the same completion math as the status line: `passed + blockedRunnable + failed` over
  `runnableTotal`.
- Keep the completed package grid and overflow cap behavior unchanged.
- Update reporter tests to assert the completed label is gone and the progress rule appears.
- Add a color test proving the HR indicator segment follows the same severity helper as the overflow
  count.

## Final reality

### `feat(cli): add progress mode to Fmt.hr`

Completed and committed:

```txt
46b06fc75 feat(cli): add progress mode to Fmt.hr
```

Implemented in:

```txt
code/sys/cli/src/m.core/m.Fmt/t.ts
code/sys/cli/src/m.core/m.Fmt/m.Fmt.Hr.ts
code/sys/cli/src/m.core/m.Fmt/-test/-m.Fmt.hr.test.ts
```

Final API/behavior:

- `Cli.Fmt.hr({ progress: 0.35 })` renders a fractional `0..1` progress rule.
- `progress: t.Percent` is shorthand for `{ percent }`.
- `progress.color.indicator` and `progress.color.track` are the progress-bar part colors.
- Root `color` remains the primary rule color: whole rule in line mode, indicator in progress mode.
- Percent values are normalized/clamped with `Num.Percent.clamp`; invalid/`NaN` becomes an empty indicator/full track.
- Existing line-mode call forms remain compatible.

Validated with:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task test --trace-leaks ./src/m.core/m.Fmt/-test/-m.Fmt.hr.test.ts
deno task test --trace-leaks ./src/m.core/m.Fmt
deno task check
```

### `refactor(workspace): render test-runner completed progress with Fmt.hr`

Completed and committed:

```txt
7c68a9c81 refactor(workspace): render test-runner completed progress with Fmt.hr
```

Implemented in:

```txt
code/sys/workspace/src/m.run/u.reporter.ts
code/sys/workspace/src/m.run/-test/-u.reporter.test.ts
```

Final behavior:

- The parallel reporter completed section no longer renders the literal `completed` label.
- It renders a `Cli.Fmt.hr({ width, color, progress })` rule above the completed package grid.
- It uses the already computed frame width; no second terminal measurement is taken.
- It uses the same completion math as the status line: `passed + blockedRunnable + failed` over `runnableTotal`.
- Completed-grid rows and overflow cap behavior are unchanged.
- Completed severity color is shared by:
  - the HR indicator color;
  - the colored `...and <number> more` overflow count.
- Severity order remains failed → red, blocked/skipped → yellow, passed-only → green.
- The overflow label text remains gray/italic; only the count is severity-colored.

Validated with:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test --trace-leaks ./src/m.run/-test/-u.reporter.test.ts
deno task test --trace-leaks ./src/m.run
deno task check
```

## Commit messages

Feature commit:

```txt
46b06fc75 feat(cli): add progress mode to Fmt.hr
```

Workspace call-site commit:

```txt
7c68a9c81 refactor(workspace): render test-runner completed progress with Fmt.hr
```

Plan retirement commit:

```txt
docs(agent): retire Fmt.hr progress plan
```

## Acceptance

- `Cli.Fmt.hr({ progress: 0.35 })` is the compact progress-bar API.
- Progress-local colors do not compete with top-level primary rule color.
- Existing `hr` calls keep byte-equivalent output.
- Terminal-width defaulting still works.
- The workspace parallel test runner replaces the `completed` header with the progress HR.
- The workspace progress HR color is DRY with the completed overflow count severity color.
