shared-application-header.plan.md
- [x] 08b446b62 feat(cli): add shared application header formatter
- [x] c12c7b5ea refactor(driver-vite): use shared CLI application header
- [x] d0a26845f refactor(driver-pi): unify sandbox profile headers
- [x] 064bc4c5c style(cell): add application header to start output
- [x] 78c046511 feat(cell): add selectable start reporter
- [x] 7133b5509 docs(cell): clarify start reporter ownership contracts
- [x] 37303c3ba style(cell): inset start service body

## Status

The shared formatter, all three consumer migrations, Cell's selectable reporter, its ownership
contract documentation, and the two-cell service-body inset have landed. This arc is complete.

## Position

Add one focused application-header formatter under `@sys/cli/Fmt`, then migrate Driver Vite, Driver
Pi, and Cell onto it.

The formatter owns terminal presentation mechanics:

- a left-aligned application or runtime identity;
- right-aligned metadata with package version as the default final value;
- ANSI-aware terminal-cell measurement and spacing;
- deterministic narrow-width fallback;
- a matching horizontal rule;
- explicit width and presentation overrides.

Callers continue to own semantic identity, package-specific metadata, and meaningful color choice.
The formatter must not grow into a general panel, table, screen-lifecycle, or service-report
framework.

## Reality findings

### Driver Vite previously implemented the target geometry locally

Before migration, `code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.layout.ts` independently:

- renders a bold green package name on the left;
- renders a dim green version on the right;
- measures visible width through `Cli.Fmt.Text.Width`;
- falls back from scoped to unscoped package names;
- drops the version under pressure;
- ellipsizes the final title fallback;
- renders a separate green heavy HR.

Its existing pressure tests are the strongest behavioral proof for the shared formatter.

### Driver Pi previously implemented the same layout independently

Before migration, `code/sys.driver/driver-pi/src/m.core/m.cli/u.fmt.sandbox.ts` independently:

- renders the stable `sys:pi` identity with a dim sandbox qualifier;
- places `read, write, bash · <version>` on the right;
- measures ANSI-aware widths and calculates the inter-column gap;
- drops capabilities before dropping version;
- renders a permission-toned HR.

The profile-root menu in `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.menu.ts` bypassed
that complete layout and printed only `PiSandboxFmt.title('scoped')`. This was the source of the
visible drift between the profile selector and the activated-profile view.

### Cell needs an outer application frame, not a service-row rewrite

`code/sys/cell/src/m.cli/u.fmt/u.services.ts` formats reusable service-status body content. The new
`@sys/cell` identity header belongs at the outer `start` presentation seam around
`code/sys/cell/src/m.cli/m.run/u.start.ts`, not inside `Fmt.Services.started(...)`.

The body formatter must remain independently reusable and must not emit package identity once per
service collection.

## Proposed public surface

Add a focused namespace to the canonical formatter aggregate:

```ts
Cli.Fmt.Header.rows({
  pkg,
  width,
  tone: 'cyan',
  title: PiSandboxFmt.title(permissions),
  detail: 'read, write, bash',
  version: undefined,
  hr: { weight: 'heavy' },
});
```

Commit-one contract latch:

```ts
export namespace Header {
  export type Options = {
    /** Optional package-backed title and version defaults. */
    pkg?: t.Pkg;

    /** Explicit display width; omit to use canonical terminal/fallback width policy. */
    width?: number;

    /** Generated-title, metadata, separator, version, and default HR color. */
    tone?: t.AnsiColor.Name;

    /** Caller-rendered left identity; defaults to `pkg.name`, then `Untitled`. */
    title?: string;

    /** Optional metadata rendered before the version. */
    detail?: string;

    /** `undefined` uses `pkg?.version`, a string overrides it, and `false` omits it. */
    version?: string | false;

    /** HR override; `false` omits the rule. */
    hr?: false | {
      color?: t.CliFormat.Hr.Color;
      weight?: t.CliFormat.Hr.Weight;
    };
  };

  export type Lib = {
    readonly rows: (options: Options) => readonly string[];
  };
}
```

Input fields intentionally remain mutable because they express caller requirements rather than API
guarantees. The returned rows are readonly output and must be frozen at runtime. These names are
locked for commit one; do not add aliases or parallel entrypoints.

### Why `Header`, not `Title`

The abstraction returns an application identity row plus its framing rule. `Title` would describe
only the left-hand value and would obscure ownership of alignment, right metadata, and HR policy.

### Why `rows`

Driver Vite already composes frame rows, while Driver Pi and Cell can join or spread the same
result. Returning rows avoids forcing screen-oriented consumers to split a prejoined string. At
positive width the default result is two rows; `hr: false` permits one, and zero available width
yields no visible rows.

## Horizontal-rule contract

Reuse the existing `Cli.Fmt.Hr` vocabulary exactly. Do not introduce `thickness`, `style`, or a new
rule-weight enum.

Current canonical options are:

```ts
type Weight = 'heavy' | 'light' | 'double' | 'dashed';

type Options = {
  readonly width?: number;
  readonly color?: AnsiColor.Name;
  readonly weight?: Weight;
  readonly progress?: Progress.Input;
};
```

Header policy:

- `width` is owned by the header so the title row and HR cannot diverge;
- `progress` is not valid for an application header;
- `color` defaults to the header `tone` and remains explicitly overridable;
- `weight` is passed directly to `Cli.Fmt.hr(...)`;
- omitted `weight` preserves `Cli.Fmt.hr(...)`'s existing `heavy` default (`━`);
- `hr: { weight: 'dashed' }` produces the existing dashed form (`┄`);
- `light` (`─`) and `double` (`═`) remain available without widening the Header API;
- `hr: false` is the explicit escape hatch for a title-only row.

The implementation should omit `weight` when the caller omits it rather than restating `heavy` in a
second defaulting layer.

## Default visual contract

With package metadata and no title or right-side overrides:

```text
@sys/example                                             0.0.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

With neither title nor package metadata, use a visible identity fallback and no right lane:

```text
Untitled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Do not pad an absent right lane or emit trailing spaces. Explicit detail or version may still form a
right lane without package metadata.

Default styling:

- package title: bold `tone`;
- detail: normal `tone`;
- separator `·`: dim `tone`;
- version: dim `tone`;
- HR: `tone`, with `Cli.Fmt.hr(...)`'s default heavy weight.

When `tone` is omitted, preserve the same bold/dim hierarchy without adding a foreground color.

Consistency means shared geometry, hierarchy, and fallback behavior. It does not require every
application to use the same semantic color. Driver Vite and Cell may remain green; Driver Pi remains
cyan when scoped and yellow for `--allow-all`.

## Right-lane and narrow-width policy

The default right lane is the package version. Optional detail precedes it:

```text
<detail> · <version>
```

For generated package titles, use this deterministic candidate order:

1. full/scoped package title + detail + version;
2. compact/unscoped package title + detail + version;
3. full/scoped package title + version;
4. compact/unscoped package title + version;
5. full/scoped package title only;
6. compact/unscoped package title only;
7. ellipsized compact package title.

A caller-rendered custom title is semantic identity, not a package-scope variant. Preserve it while
metadata contracts:

1. custom title + detail + version;
2. custom title + version;
3. custom title only;
4. safely ellipsized plain custom title.

Do not replace an explicit custom identity with `pkg.name`. Strip ANSI before the final ellipsis and
reapply the standard title hierarchy without slicing escape sequences.

Rules:

- require at least one visible cell between left and right lanes;
- drop optional detail before version;
- preserve version longer than package scope for generated titles;
- preserve custom semantic identity ahead of optional metadata;
- resolve blank or absent title through `pkg.name`, then `Untitled`;
- use `pkg?.version` only as the default version source;
- never wrap the headline;
- measure all rendered candidates with `Cli.Fmt.Text.Width.measure(...)`;
- use the existing grapheme-safe `Cli.Fmt.Text.ellipsize(...)` for generated plain package-title
  fallbacks;
- treat a caller-rendered custom title as an atomic styled identity rather than slicing embedded
  ANSI sequences;
- do not emit trailing spaces;
- keep the HR at exactly the resolved header width;
- delegate omitted width to `Cli.Fmt.Text.Width.fit()` rather than duplicating terminal detection;
- floor positive finite explicit widths and collapse zero, negative, or non-finite explicit widths
  to zero.

If `version: false`, skip all version-bearing candidates while still allowing non-empty `detail` as
the right lane. If `pkg?.version`, an override, or detail trims to an empty string, treat that value
as absent. When all right-lane values are absent, render only the resolved title without padding.

## Package-specific migration

### 1. `@sys/cli`

Add the canonical formatter module, types, aggregate export, and tests under:

```text
code/sys/cli/src/m.core/m.Fmt/
```

Exact commit-one working set:

```text
code/sys/cli/src/m.core/m.Fmt/t.header.ts
code/sys/cli/src/m.core/m.Fmt/m.Fmt.Header.ts
code/sys/cli/src/m.core/m.Fmt/t.ts
code/sys/cli/src/m.core/m.Fmt/m.Fmt.ts
code/sys/cli/src/m.core/m.Cli/t.ts
code/sys/cli/src/m.core/m.Fmt/-test/-m.Fmt.Header.test.ts
code/sys/cli/src/m.core/m.Fmt/-test/-.test.ts
code/sys/cli/src/m.core/m.Fmt/-test/-t.test.ts
```

No package root, dependency, generated metadata, or downstream driver file belongs in commit one.

Required proof:

- `Fmt.Header` and `Cli.Fmt.Header` are the same runtime surface;
- public type projections remain exact through `@sys/cli/t` and `@sys/cli/types`;
- ANSI sequences do not affect alignment;
- Unicode terminal-cell widths are measured correctly;
- detail drops before version at exact boundaries;
- scoped package names compact before title-only ellipsis;
- optional package metadata and the `Untitled` fallback work without an empty right lane;
- `version` default, override, omission, and empty normalization work;
- `tone` drives default title/right/HR styling;
- explicit HR color overrides tone;
- omitted HR weight renders heavy `━` through the existing default;
- dashed weight renders `┄` through `Cli.Fmt.hr(...)`;
- light and double weights pass through unchanged;
- `hr: false` and zero-width behavior are deterministic;
- readonly row output is frozen at runtime.

Do not duplicate `Cli.Fmt.hr` glyph maps, color application, terminal-width detection, or ANSI-width
logic inside the Header module.

### 2. `@sys/driver-vite`

Replace the local application-header alignment and top-HR construction in
`code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.layout.ts` with one
`Cli.Fmt.Header.rows(...)` call.

Preserve:

- green package identity;
- version-right hierarchy;
- startup and ready-screen equality;
- current viewport capacity accounting;
- current scoped/unscoped/version pressure priorities;
- clipping guarantees for every rendered frame row.

Remove the local header algorithm only after shared formatter tests and the existing Driver Vite
pressure tests prove equivalent behavior. Keep dashed body separators local; they are section rules,
not application headers.

### 3. `@sys/driver-pi`

Create one Pi-owned header wrapper that supplies:

- the rendered `sys:pi:sandbox` or `sys:pi:no-sandbox` identity;
- the visible `--allow-all` marker where currently required;
- `read, write, bash` as detail;
- Driver Pi package metadata for the default version;
- cyan or yellow tone from permission mode;
- the existing sandbox render width.

Use that wrapper in both:

- the profile-root/profile-selection screen;
- the activated-profile sandbox summary table.

The root screen should therefore show capabilities, version, and HR before a profile is selected.
Those capabilities describe the Pi wrapper and are not profile-path claims.

Also use the same header when selected YAML validation fails; no fallback path should regress to a
bare title.

Keep the summary-table closing rule local because it frames the body rather than the application
identity. Change it from a heavy dim gray rule to the canonical dim gray dashed form:

```ts
c.dim(
  Cli.Fmt.hr({
    width: renderWidth,
    color: 'gray',
    weight: 'dashed',
  }),
);
```

This establishes one visual grammar: heavy permission-toned `━` for the application boundary and dim
gray `┄` for the internal transition from sandbox facts into the interactive menu. Add a stable
rendered-output assertion for the dashed separator.

### 4. `@sys/cell`

Compose the shared header once around the `start` command's emitted service body. Default identity
is `@sys/cell`, default right metadata is the Cell package version, and the initial tone is green
unless a concrete neighboring Cell convention proves a better semantic color.

Preserve `Fmt.Services.started(...)` as body-only formatting and preserve
`StartCellResult.serviceText` as service content rather than silently changing that reusable result
into a full CLI screen.

Print the application header before the startup spinner begins. During startup the spinner belongs
directly beneath the heavy HR. After the spinner retires, preserve exactly one blank row between the
header rule and the resolved service or summary body. Do not clear or repaint the terminal in this
commit.

Add orchestration-level tests proving:

- the application header appears once;
- version is right-aligned when width permits;
- the heavy HR appears before the spinner and service rows;
- exactly one blank row separates the header from the resolved body;
- multiple services do not duplicate the application header;
- service-only formatter tests remain unchanged.

### 5. `@sys/cell` selectable start reporter

Treat terminal ownership as a separate lifecycle feature rather than an incidental header effect.
Do not add `--clear` or `--no-clear`: clearing is an implementation effect, not the stable operator
contract.

Add the established Driver Vite reporter vocabulary:

```text
--reporter <auto|screen|raw>
```

Reporter policy:

- `auto` is the default and selects `screen` only for an interactive terminal; otherwise `raw`;
- `screen` gives Cell sole ownership of the startup-to-ready viewport lifecycle;
- `raw` preserves append-only output without cursor-positioning effects;
- explicit screen rendering uses `Cli.Screen.repaint(...)`, not `console.clear()`;
- only Cell may own header, spinner, resize, repaint, body, and cleanup effects in screen mode;
- service owners must not compete for terminal ownership.

Driver Vite is the behavior reference: its screen reporter repaints an owned frame, while its `k`
action clears retained visible log state and repaints. It does not perform an automatic destructive
full-screen clear during startup.

Project the reporter option through Cell's parser, typed CLI args, start validation, generated help,
and focused raw/screen/auto lifecycle tests. Keep this projection out of the application-header
commit.

Make the default explicit in persistent workspace examples and tasks after the option exists:

- `code/sys.ui/ui/deno.json` tasks `dev` and `serve` use `--reporter auto`;
- `code/sys/cell/deno.json` start-facing sample tasks use `--reporter auto`, including Stripe,
  Deploy, Vite, and Vite dev;
- Cell README, start help, root help, and start-services DSL examples document the reporter modes and
  use `--reporter auto` in persistent task examples.

Workspace discovery found no `@sys/driver-cell` package. The canonical package and sample owner is
`@sys/cell` under `code/sys/cell`; do not create a parallel driver package or duplicate its samples.

### 6. `@sys/cell` service-body inset

Give the service body a two-terminal-cell inner gutter so service records read as content within the
application frame rather than as peers of the `@sys/cell` identity.

Preserve the hierarchy:

- keep the application title and heavy HR at full frame width;
- preserve exactly one blank row below the heavy HR;
- inset every service-body row by two terminal cells;
- render the body against the correspondingly reduced inner width so no row wraps or exceeds the
  frame;
- inset and shorten the dashed rule because it separates sibling service records inside the body;
- keep the completion summary frame-aligned because it reports application-level completion facts.

The outer Cell start presentation owns the inset policy. `Fmt.Services.started(...)` remains
body-only and must not gain package identity or screen-lifecycle behavior. Preserve
`StartCellResult.serviceText` as service content, and keep raw output, screen repaint output, and the
returned complete `res.text` geometrically consistent.

Add focused proof for service-row, continuation-row, and dashed-rule alignment; explicit narrow and
tiny widths; ANSI-aware row bounds; empty service sets; and raw/screen parity. This is a style-only
move: do not change labels, service facts, URL emphasis, reporter selection, terminal ownership, or
cleanup behavior.

## Validation

For each commit, run the owning package's check, focused formatter tests, and affected CLI tests.
Before closing the plan, run:

- the full `@sys/cli` test subtree and check;
- the full Driver Vite dev-screen test subtree and check;
- the full Driver Pi CLI/profile test subtrees and check;
- the full Cell CLI test subtree and check;
- focused Cell reporter lifecycle, parser, help, and task-projection tests;
- focused Cell service-body inset, narrow-width, and raw/screen parity tests;
- formatting for every changed file;
- `git diff --check`.

Because shared rendering behavior changes, do not rely only on newly added focused assertions. Run
the full affected test subtrees.

## Commit boundaries

Keep the seven commit units independently reviewable:

1. shared formatter contract and proof;
2. Driver Vite migration;
3. Driver Pi unification;
4. Cell header adoption;
5. Cell selectable start reporter and explicit sample/task projection;
6. Cell reporter ownership-contract documentation;
7. Cell service-body inset and geometry proof.

Generated dependency or template projection, if required by package-version workflow, must be kept
separate from functional formatter commits.

## Non-goals

- No general terminal panel or grid framework.
- No replacement for `Cli.Table`.
- No changes to service-row labels, URL formatting, or Cell service semantics.
- No changes to Driver Vite body metadata or log layout.
- No changes to Driver Pi sandbox permission resolution.
- No progress-mode HR in application headers.
- No new HR glyph names, weight aliases, `thickness`, or `style` options.
- No package-wide color-theme framework.
- No `console.clear()` shortcut or ambiguous `--clear`/`--no-clear` policy.
