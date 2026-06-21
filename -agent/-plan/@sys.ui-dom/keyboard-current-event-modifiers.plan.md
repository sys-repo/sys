# keyboard-current-event-modifiers

- [x] fix(testing): support keyboard event init in DomMock — `cd53166c7`
- [x] fix(ui-dom): match shortcuts from current event modifiers — `2d1238e0a`
- [x] refactor(ui-dev): centralize DevHarness keyboard navigation — `027e54f80`

Subtitle: **DevHarness nav recovery via `@sys/ui-dom` keyboard primitive hardening**

## Status

Current verdict: **DONE.** The three-step arc landed with the final `CMD+Enter` / `CMD+SHIFT+Enter`
command grammar.

The first two commits are settled baseline:

1. `DomMock.Keyboard` can produce browser-shaped keyboard events with named keys and modifier init.
2. `@sys/ui-dom` shortcut matching considers effective modifiers from:

```text
tracked modifier state OR current native event modifier flags
```

The final landed work is the `@sys/ui-dev` refactor. This was not another keyboard primitive fix; it
is DevHarness command wiring plus route-policy centralization.

## Browser/runtime truth learned during WIP

Observed facts:

- `CMD+Enter` works in the browser path.
- The DevHarness hook is mounted in both `ui-components` entry paths:
  - splash/root path via `Splash.UI → useKeyboard()`
  - dev path via `renderDev() App → useKeyboard()`
- Temporary traces proved `CMD+Escape` does not reliably deliver an `Escape` keyboard event to page
  JavaScript in the real browser path.
- Therefore `CMD+Escape` cannot be the canonical DevHarness route-up command.
- Temporary `Esc/Esc` and `U/U` probes were diagnostic only and must not land.

BMIND conclusion:

```text
CMD+Escape failure = browser/OS event delivery problem, not dbl, not route policy, not @sys/ui-dom matching.
```

## Final interaction grammar

Approved endpoint:

```text
CMD + Enter          → enter/open DevHarness index
CMD + SHIFT + Enter  → move up/out one DevHarness route level
```

Why this is the STIER/TMIND endpoint:

- one memorable key family: `Enter`
- `SHIFT` means reverse/inverse direction, like `Tab` / `SHIFT+Tab`
- no browser-swallowed `Escape`
- no double-tap timing magic
- no unearned aliases
- no direct DOM listener
- no duplicate shortcut interpretation outside `@sys/ui-dom`

## Architectural boundary

### `@sys/ui-dom` owns

- global keyboard event capture semantics
- modifier truth and current-event modifier flags
- pattern matching such as `CMD + SHIFT + Enter`
- resilience when the monitor did not observe modifier-key edges

### `@sys/ui-dev` owns

- DevHarness route policy only
- command wiring through `Keyboard.until(...)`
- no direct `document.addEventListener` navigation shortcuts

### `DomMock.Keyboard` owns

- realistic keyboard event fixtures
- named key codes such as `Enter`
- modifier init such as `{ metaKey: true, shiftKey: true }`

## Landed `ui-dev` shape

Commit files:

```text
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.ts
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.nav.ts
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
```

Command wiring:

```ts
const keyboard = Keyboard.until(options.until);
const dbl = keyboard.dbl();
const nav = KeyboardNav.create();

keyboard.on('CMD + Enter', (e) => {
  e.handled();
  nav.openIndex();
});

keyboard.on('CMD + SHIFT + Enter', (e) => {
  e.handled();
  nav.up();
});

// `dbl` remains only for unrelated double-shortcuts such as CMD+K clear-console.
```

Route policy:

```text
root  → index via CMD+Enter
spec  → index via CMD+SHIFT+Enter
index → root  via CMD+SHIFT+Enter
?d    → root  via CMD+SHIFT+Enter
root  → no-op via CMD+SHIFT+Enter
```

## What is intentionally not part of the third commit

Do not reopen or mix in:

- `DomMock.Keyboard` fixture work.
- `@sys/ui-dom` modifier matching work.
- broad `KeyboardMonitor` decomposition.
- direct browser trace/logging.
- direct DOM listeners in `ui-dev`.
- DevHarness route-up via `CMD+Escape`, `Esc/Esc`, `U/U`, or any `dbl` path.

## Known primitive-quality follow-ups, not for this commit

BMIND cleanup candidates after the current arc lands:

- Name the effective-modifier truth rule in `@sys/ui-dom` so the merge is not hidden inline.
- Consider isolating `KeyboardMonitor` responsibilities later:
  - global listener lifecycle,
  - state mutation,
  - modifier bookkeeping,
  - subscriber/matcher flow.
- Add more direct event-pipeline proofs:

```text
raw event → keypress state → matcher input → subscriber handler
```

These are tidy-first/follow-up improvements, not blockers for the current `ui-dev` refactor.

## Proof for third commit

Focused tests prove:

- `CMD+Enter` opens the DevHarness index from root.
- `CMD+SHIFT+Enter` navigates from spec to index.
- `CMD+SHIFT+Enter` navigates from index to root.
- two `CMD+SHIFT+Enter` commands navigate from spec through index to root.
- `CMD+SHIFT+Enter` can match from current event modifiers with no prior modifier-key edge.
- `?d` alias is treated as the DevHarness index alias.

Proof commands run from `code/sys.ui/ui-dev`:

```text
deno task test --trace-leaks ./src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
deno check src/ui.react.devharness/ui.use/use.Keyboard.ts src/ui.react.devharness/ui.use/use.Keyboard.nav.ts src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
deno fmt --check src/ui.react.devharness/ui.use/use.Keyboard.ts src/ui.react.devharness/ui.use/use.Keyboard.nav.ts src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
deno task test --trace-leaks ./src/ui.react.devharness/ui.use/-test
deno task check
```

Workspace proof:

```text
git diff --check -- code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.ts code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.nav.ts code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
```

## Third commit

Subject:

```text
refactor(ui-dev): centralize DevHarness keyboard navigation
```

Body:

```text
- extract DevHarness route policy behind KeyboardNav
- wire CMD+Enter to open the DevHarness index
- wire CMD+SHIFT+Enter to navigate up through DevHarness routes
- handle DevHarness navigation chords before browser defaults
```

Precise file list:

```text
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.ts
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.nav.ts
code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/-test/-use.Keyboard.test.ts
```

## TMIND completion gate for `refactor(ui-dev)`

Verified:

- `use.Keyboard.ts` is command wiring only.
- `use.Keyboard.nav.ts` owns only DevHarness route policy.
- no `document.addEventListener` shortcut path exists in `ui-dev`.
- no DevHarness route-up binding remains on `dbl`.
- no DevHarness route-up binding remains on `CMD+Escape`, `Esc/Esc`, or `U/U`.
- `CMD+SHIFT+Enter` is single-step route-up behavior.
- repeated `CMD+SHIFT+Enter` is how spec → index → root is achieved.
- no `ui-dom` or `std` files are included in the third commit.
- no temporary trace logs remain.

## Browser smoke test

From `code/sys.ui/ui-components` dev server:

```text
/                    CMD+Enter          → /?dev=true
/?dev=<spec>         CMD+SHIFT+Enter    → /?dev=true
/?dev=true or ?d     CMD+SHIFT+Enter    → /
```

## GO / NO-GO

- **DONE**: landed the third commit as focused `ui-dev` refactor.
- **GO**: keep lower-layer commits as completed baseline.
- **GO**: preserve `@sys/ui-dom` as keyboard primitive owner.
- **NO-GO**: solve DevHarness navigation with direct DOM listeners.
- **NO-GO**: use `Keyboard.dbl()` for DevHarness route-up.
- **NO-GO**: land trace logs or unrelated primitive cleanup in the third commit.
