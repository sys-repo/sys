dev-screen-responsive-metadata-rail.plan.md
- [x] 55c0520 fix(driver-vite): adapt dev metadata rail at narrow widths

## Scope

The change is one cohesive internal formatting commit with no public API, type-plane, process, or
screen-lifecycle change.

Proof record:

- focused baseline: 25 passing steps;
- red: compact URL and source-rail assertions failed against the prior content rail;
- focused green: 25 passing steps;
- package check: passed;
- full package test: 57 tests and 331 steps passed, including formatting.

## Subject

Make the primary Vite dev metadata block responsive to terminal width. Preserve the wide layout's
alignment with log content while reclaiming horizontal space at conventional narrow terminal widths.

The primary block is one visual unit:

```text
URL
up arrow
input label + value
output label + value + optional digest/age
```

Move that unit together. Do not independently shift its rows.

## Selected layout

The log grammar has three visual columns:

```text
index  source  content
```

Use two deterministic metadata rails:

- viewport width `<= 80`: start the primary metadata block at the source column;
- viewport width `> 80`: start it at the content column, preserving current behavior.

The breakpoint depends only on accepted viewport width. It must not depend on paths, URL length,
digest availability, visible log values, or whether a particular metadata candidate fits. This keeps
repaints stable as content changes.

Derive the source and content columns from one shared log-prefix grammar. Do not duplicate or subtract
a magic five-cell offset. Widening line indices may move both rails naturally, but must not change the
selected compact/wide mode at a stable viewport width.

Apply the selected rail identically to startup and ready frames. A resize across the breakpoint uses
the existing complete-layout repaint path; no runtime or resize policy change is needed.

## Implementation boundary

Change only the internal dev-screen layout and its focused tests:

- `code/sys.driver/driver-vite/src/m.vite/u/u.dev.screen.layout.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.dev.screen.test.ts`

Keep these surfaces unchanged:

- log index, source, and content columns;
- log clipping and retained-output behavior;
- application header and horizontal rules;
- workspace rendering;
- options layout and key alignment;
- height budgeting, spinner behavior, and resize scheduling;
- public exports and types.

Do not add a caller option for the breakpoint or alignment. This is renderer-owned responsive
presentation, not public policy.

## Behavioral proof

Use the existing pure screen-layout tests as the contract boundary.

Prove:

1. At widths 79 and 80, URL, arrow, input, and output begin at the log source column.
2. At width 81, the same block begins at the log content column.
3. Startup and ready frames select the same rail.
4. One-, two-, and three-digit visible indices preserve source/content relationships without changing
   mode at a stable viewport width.
5. Every rendered row remains bounded at tiny, compact, and wide widths.
6. Log rows and option keys retain their current columns.
7. Compact metadata uses the reclaimed cells before clipping. In particular, revise the existing
   width-30 URL expectation if the full URL now fits; do not preserve ellipsis that the new layout no
   longer requires.
8. Digest suffix selection remains truthful when reclaimed width admits a richer existing candidate.

Use red → green: first add the compact/wide column assertions and confirm the current renderer fails
for the expected source-column mismatch.

## Verification

From `code/sys.driver/driver-vite`:

```sh
deno task test --trace-leaks ./src/m.vite/-test/-u.dev.screen.test.ts
deno task check
deno task test
```

The focused test executes the renderer directly at 79, 80, and 81 columns for startup and ready
frames. Existing runtime tests prove accepted resize snapshots trigger complete layout recomputation.
Together these cover the changed runtime-visible boundary deterministically. A human may additionally
run the declared `deno task dev` surface in an interactive terminal for visual confirmation, but that
manual probe is not required proof.

## TMIND review

Rejected alternatives:

- Always use the source column: simpler, but discards the useful wide content rail rather than making
  the renderer responsive.
- Select a rail from content fit: maximizes individual-row fit, but lets paths and digests cause
  unrelated horizontal jumps.
- Shift only input/output rows: fractures the URL, arrow, and metadata into competing rails.
- Move options in the same change: broadens the visual grammar without evidence from the reported
  problem.
- Add runtime resize logic: duplicates behavior already owned by complete frame recomputation.

Failure risks to guard:

- an off-by-one breakpoint that leaves width 80 in the wide state;
- startup and ready helpers drifting to different rails;
- index growth accidentally changing responsive mode;
- stale tests forcing unnecessary clipping after width is reclaimed;
- a broad column refactor moving logs or options outside the requested boundary.

## Completion

The single commit landed as `55c0520 fix(driver-vite): adapt dev metadata rail at narrow widths`.
Focused red → green proof, package check, and full package tests passed; deterministic direct-render
plus runtime-resize coverage confirms the compact and wide compositions. No unrelated formatting or
renderer refactor belongs in the commit.
