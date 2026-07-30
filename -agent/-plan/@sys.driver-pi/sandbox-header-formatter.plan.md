sandbox-header-formatter.plan.md
- [x] aa740909 feat(driver-pi): surface version in sandbox header
- [x] fa182fe1 feat(driver-pi): reduce sandbox preview to launch essentials

## Status

The arc is complete with exactly two landed commits.

Both commits are fully implemented and green. Commit 1 includes the categorical
`read, write, bash` lane, dim middle-dot separator, and full → version-only → title-only width
fallbacks. Commit 2 reduces persisted-report sheets to `report` and `permissions`, preserves the
no-report detail fallback, records git-root provenance in the report, styles only injected path
collapse markers, and renders bare profile prompts beneath stable screen chrome. The profile root
clears the interactive screen, renders `system:pi:sandbox` above the bare prompt, and restores that
root after returning from a selected profile.

Final BMIND/DMIND/TMIND/STIER review is complete: Commit 2 is a GO with zero blocker, major, or
required-minor findings. `gitRootExplicit` remains the preferred name: it is a boolean provenance
statement, while `explicitGitRoot` would read like a root value. No further pre-commit polish is
recommended.

Both commits were landed by the human in the planned order and are ancestors of the current `HEAD`.
Commit 1 is `aa740909580445ad34035ada3911aeac4c16c4bf`; Commit 2 is
`fa182fe128020d6abb89792a7cec1df60c06cd46`. The implementation arc is complete.

Commit 1 proof:

- red proof: the final `read, write, bash` capability refinement failed five intended formatter
  assertions;
- green proof: `48 passed (241 steps), 0 failed` through the declared package test route;
- `deno task check` passes from `code/sys.driver/driver-pi`.

Commit 2 proof:

- red proof: the driver suite rejected the new `gitRootExplicit` report input before production
  threading existed; a focused YAML test separately proved the old `:` empty-label output; the
  spacing refinement proved the redundant blank print with an exact observable-call assertion; and
  the root-screen transition test failed at `47 passed (243 steps), 1 failed` before initial/back
  clearing and title restoration existed;
- green proof: `48 passed (244 steps), 0 failed` through the declared driver package test route;
- shared prompt substrate proof: `25 passed (235 steps), 0 failed` through the full `@sys/yaml`
  suite;
- `deno task check` passes from both `code/sys.driver/driver-pi` and `code/sys/yaml`;
- `deno fmt --check` passes across the exact 11-file Commit 2 source/test scope.

## Current position

Complete. Implementation, automated proof, final design/code review, and both planned Git commits
are landed. Commit 1 precedes Commit 2 in history, and Commit 2 is an ancestor of the current `HEAD`.
The normal interaction and root-screen grammar have human approval. Narrow-width and allow-all
behavior are covered by formatter and integration tests; an additional live terminal smoke remains
optional and is not part of the completed commit gate.

## DMIND position

The startup surface is a decision sheet, not the audit report itself. Its durable hierarchy is:

1. sandbox identity and package provenance;
2. Pi's primary operational capability classes;
3. report pointer and effective permission posture;
4. the immediate action choice.

Match the newer `@sys/driver-vite` identity grammar while preserving Pi's cyan/yellow state language
and keeping the complete audit trail in the persisted sandbox report. The interactive profile root
is stable screen chrome, separate from the prompt widget:

```text
system:pi:sandbox
?
       add: <profile>
❯  profile: ├─ canon
   profile: └─ default
  (exit)
```

The root clears and renders on initial entry and again after `← back`. Keeping the title above the
bare `?` preserves screen identity without coupling persistent chrome to Select's transient prompt
message. After selecting a valid profile, the normal scoped screen is:

```text
system:pi:sandbox                                     read, write, bash · 0.0.127
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
report        .pi/@sys/log/@sys.driver-pi/1785387513.jrbr5u.sandbox.log.md
permissions   scoped
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
?
❯   start
    profile: edit
    profile: reload
    profile: rename
   (delete)
  ← back
```

The final rule is dim gray in scoped mode even though plain text cannot show that distinction.
`0.0.127` is illustrative only; rendering and tests use canonical `pkg.version`.

### Identity band

- remove the rule above the title;
- place one dense state-colored rule immediately below the title;
- keep the existing final body rule unchanged;
- keep the capability lane bright and categorical: `read`, `write`, `bash`; omit `edit` because it
  is a write specialization and the lane is not a complete tool index;
- separate capabilities from provenance with the workspace runner's middle-dot glyph, dimmed in
  the active state color;
- render the package version last, right-aligned, dim, and in the active state color;
- source the version from canonical `pkg.version`, never a duplicated literal.

The version is quiet provenance, not a competing title. Its fixed right edge makes the identity band
scan like the `@sys/driver-vite` package/version header without copying Vite's green product color.

### Compact decision body

When a persisted report path is present, render only:

- `report` → the fitted path to the complete Markdown audit artifact;
- `permissions` → `scoped` or `allow-all`.

Keep the report row width-aware through `Cli.Screen` and the existing
`Cli.Fmt.Text.Width.fit/measure` surfaces. Preserve the report row's `..` marker and basename-tail
policy by composing `Cli.Fmt.Text.ellipsize(..., { ellipsis: '..', render })`; its render callback is
the provenance-safe seam for rendering only the injected marker in cyan while surrounding path
fragments remain gray. The cyan marker means "display projection, not a literal Cmd-clickable
filesystem path." Do not color genuine `..` path segments or matching filename bytes, and do not
add cyan when the complete path fits.

`Cli.Fmt.Path.tty` is the correct higher-level default and already proves literal-safe cyan ellipsis
behavior, but its intentional balanced `…` policy does not preserve this row's established `..` and
basename-tail contract. Do not copy its internals or widen `@sys/cli`; compose the lower-level public
`Cli.Fmt.Text` primitives it is built on. No `@sys/cli` source change is required.

Do not repeat context, read, or write previews on the decision surface. The report already owns
package, time, root/invoked/git cwd, permission summaries, full read/write detail, and context files.
Before removing the explicit `(--git-root)` screen marker, add its explicit/inferred truth to the
report so compacting loses no launch provenance.

Both production paths await report persistence before rendering the sheet. Preserve that ordering:
a report write failure must stop before the compact sheet or action prompt appears. When no report
path is supplied to the internal formatter, retain the detailed body as the honest fallback rather
than hiding information without an audit pointer.

The menus' option labels already carry their interaction semantics, so `agent:`, `harness:`, and
`loaded:` add unnecessary ontology. Use the existing prompt substrate's empty message to render only
its bare `?` marker in both the top-level profile browser and post-preview action menu. Own the
persistent `system:pi:sandbox` title outside the Select message: clear and print it before the first
profile browser, restore it after `← back`, and retain it above invalid-YAML action prompts where no
resolved sandbox sheet can be rendered. Preserve all profile row labels and the invalid-YAML warning.

## Width behavior

Use the same spaced middle-dot glyph as the `@sys/workspace` final runner separator:

```text
read, write, bash · 0.0.127
```

The separator and version are dimmed in the active state color while the capability lane remains
bright. Fit monotonically in this order:

1. title + capabilities + ` · ` + version;
2. title + version, dropping the wider contextual capability vocabulary first;
3. the existing title-only fallback when version provenance cannot fit.

This preserves the compact, stable identity pair under pressure: capabilities are predictable
context metadata, while title + version provide exact package provenance.

Apply the same structural grammar to scoped and `--allow-all` sheets:

- scoped → cyan title/capabilities/rule, dim cyan middle dot and version, existing dim gray closing
  rule;
- allow-all → existing yellow warning language, dim yellow middle dot and version, existing yellow
  closing rule.

Preserve report path fitting and basename-tail retention while moving width budgeting and clipping
to `Cli.Fmt.Text.Width` and `Cli.Fmt.Text.ellipsize`. Do not change sandbox policy, profile actions,
launch flow, `@sys/cli`, or the `@sys/driver-vite` implementation.

## Implementation boundary

### Commit 1 — `feat(driver-pi): surface version in sandbox header`

Primary files:

- `code/sys.driver/driver-pi/src/m.core/m.cli/u.fmt.sandbox.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli/-test/-u.fmt.sandbox.test.ts`

Implementation shape:

1. import `pkg` through the existing local `common.ts` lane;
2. split the current shared chrome variables into a dense header rule and the preserved closing rule;
3. render title first, then the dense header rule, table body, and closing rule;
4. extend `formatTitle` with canonical version rendering, the dim state-colored ` · ` separator,
   and monotonic full → version-only → title-only width fallbacks;
5. update frame assertions for the removed leading row and new right-edge version;
6. add exact-boundary and ANSI assertions for capability-first removal plus separator/version
   styling.

### Commit 2 — `feat(driver-pi): reduce sandbox preview to launch essentials`

Primary files:

- `code/sys.driver/driver-pi/src/m.core/m.cli/u.fmt.sandbox.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli/u.report.sandbox.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/m.main.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.menu.ts`
- their existing focused tests under the adjacent `-test/` directories.

Narrow shared substrate files discovered during red proof:

- `code/sys/yaml/src/m.cli/m.YamlConfig/u/u.menu.ts` passes an existing empty `label` through as an
  empty Select message instead of synthesizing `:`;
- one focused adjacent test locks that behavior without adding or changing a public type surface.

Implementation shape:

1. make the persisted-report branch render only `report` and `permissions`;
2. preserve the current detailed rows when no report path exists;
3. retain report basename-tail fitting with `Cli.Fmt.Text.Width.fit/measure` rather than local
   string-length arithmetic;
4. use `Cli.Fmt.Text.ellipsize` with the custom `..` marker and styling-only render callback so only
   formatter-injected truncation is cyan;
5. thread `gitRootExplicit` into report creation and record explicit versus inferred git-root truth;
6. preserve awaited report persistence before both direct launch rendering and menu prompting;
7. pass empty messages for both the top-level profile browser and the post-preview action menu so
   each renders only a bare `?` prompt marker;
8. avoid naming the prompt `agent:`, `harness:`, or `loaded:` because the option labels already carry
   the interaction semantics, while preserving invalid-YAML warning text;
9. replace tests that expect duplicated screen detail with report-completeness and compact-screen
   assertions;
10. treat the profile browser as a screen root: clear and render a standalone cyan
    `system:pi:sandbox` title on initial entry and after `← back`, without moving the title into the
    Select prompt message.

No new public type or API surface is earned; the existing empty-label runtime case is clarified to
pass through an empty prompt message.

## Proof

Before implementation, the declared package test route is green:

```text
deno task test --trace-leaks ./src/m.core/m.cli/-test/-u.fmt.sandbox.test.ts
→ 48 passed (240 steps), 0 failed
```

The package task currently retains its authored `./src ./-scripts` roots when a target path is
appended, so this command exercised the full `@sys/driver-pi` suite rather than only the named file.

Implementation proof:

1. make each commit's focused assertions red on the preceding behavior for the intended reasons;
2. for Commit 1, pin the exact full-fit boundary, one cell below it where capabilities and their
   separator disappear but the version remains, and the title-only boundary;
3. assert the first row is the title, the second is the dense rule, and the closing rule is unchanged;
4. assert bright capabilities plus dim active-state separator/version styling without hard-coding a
   release number;
5. for Commit 2, assert a persisted-report sheet contains exactly the report and permission rows;
6. assert full report paths remain gray and byte-complete when they fit;
7. at a forced-collapse width, assert stripped text retains the basename tail, the row remains
   cell-bounded, and only the `Cli.Fmt.Text.ellipsize` callback's injected `..` carries cyan ANSI;
8. prove genuine `..` path text is never mistaken for an injected truncation marker and the styling
   callback preserves the exact supplied visible text and width;
9. assert the no-report fallback still exposes context/read/write detail;
10. prove the report contains every removed datum, including root metadata and explicit/inferred
   git-root provenance;
11. prove report persistence completes before the compact sheet and action prompt become observable;
12. assert prompt messages remain empty across one back cycle, both menus render a bare `?`, the
   sheet emits no redundant blank print, and invalid YAML still renders its warning;
13. on a TTY, assert the exact initial/select/back transition: clear → root title → root prompt,
   clear → sandbox sheet → action prompt, then clear → restored root title → root prompt;
14. rerun the declared test route and `deno task check` from `code/sys.driver/driver-pi`;
15. inspect scoped and allow-all start screens at normal and collapsed widths, confirming the cyan
   non-clickable-path cue, a bare `?` rather than `? agent:` or `?:`, and bounded rows.

## TMIND implementation gate

Reject:

- a shared cross-driver formatter abstraction for presentation grammar with different semantics;
- a hard-coded `0.0.127` that becomes stale on the next release;
- dropping compact version provenance before the wider, predictable tool vocabulary;
- a compact body when no persisted report pointer exists;
- removing screen detail that is not recoverable from the report;
- swallowing report-write failure and then presenting a misleading audit pointer;
- rendering a collapsed report path as if it were a literal Cmd-clickable path;
- coloring literal path bytes by searching blindly for every `..` substring;
- reimplementing ANSI-safe width, grapheme clipping, or inserted-marker provenance outside
  `Cli.Fmt.Text`;
- forcing `Cli.Fmt.Path.tty` where its balanced `…` policy would change the established report-row
  identity contract;
- using JavaScript string length where canonical terminal-cell measurement owns width truth;
- reintroducing `agent:`, `harness:`, or `loaded:` where a bare `?` is sufficient;
- embedding persistent `system:pi:sandbox` screen identity inside the transient Select prompt;
- returning from a selected profile without clearing and restoring the profile root;
- suppressing invalid-YAML status along with the redundant valid-action label;
- removing the final body boundary;
- broad changes to Vite, sandbox policy, profile actions, or shared prompt APIs.

The two commits are independently useful and reversible. Commit 1 establishes stable identity
syntax; Commit 2 reduces disclosure only after audit parity is proved. The main risks are width
regression, hidden sandbox detail, stale report provenance, and prompt ambiguity. Exact formatter,
report, menu-ordering, and live terminal checks own those risks.
