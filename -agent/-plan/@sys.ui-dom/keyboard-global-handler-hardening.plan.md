# @sys/ui-dom Keyboard global handler hardening

## Commit arc

- [x] 6894df21e test(ui-dom): pin keyboard event ownership semantics (red tests)
- [x] d56f96eae feat(ui-dom): split keyboard default prevention routing and consumption controls
- [x] 8bea1856a refactor(ui-dev): migrate devharness keyboard ownership calls
- [x] ae2e3189f refactor(driver-monaco): make prompt escape keyboard ownership explicit
- [x] 137b2a6e refactor(ui-components): return KeyValue cursor handoff through explicit keyboard ownership
- [x] 105d16e20 feat(ui-dom)!: drop keyboard handled aliases

## Retirement verification

The keyboard global-handler hardening arc is complete. Explicit event-control primitives are the
public ownership API:

- browser default only → `preventDefault()`;
- keyboard-route ownership only → `stopKeyboardPropagation()`;
- exclusive ownership → `consume()`;
- observer-only → no ownership call.

Final audit state:

- `code/sys.ui/ui-dev/src` — no `.handled()` call-sites.
- `code/sys.driver/driver-monaco/src` — no `.handled()` call-sites.
- `code/sys.ui/ui-components/src` — no `.handled()` call-sites.
- `code/sys.ui/ui-dom/src/m.Keyboard` — no callable `handled()` alias; remaining `handled` text is
  passive `event.is.handled` / native `defaultPrevented` state.

### Completed drop procedure

1. [x] Re-ran workspace audit and classified remaining `handled` references as passive state,
       historical planning text, test-local variable names, or unrelated `trapUnhandled()` signal
       tests.
2. [x] Upgraded production call-sites by intent:
   - browser default only → `preventDefault()`;
   - keyboard-route ownership only → `stopKeyboardPropagation()`;
   - exclusive ownership → `consume()`;
   - observer-only → no ownership call.
3. [x] Removed subscriber-args `handled()` from the public keyboard type surface.
4. [x] Removed passive `event.handled()` compatibility escape hatch from keypress events.
5. [x] Deleted/replaced compatibility tests that asserted callable `handled()` behavior; retained
       semantic tests for `preventDefault()`, `stopKeyboardPropagation()`, and `consume()`.
6. [x] Verified source/examples do not expose callable `handled()` as an option.
7. [x] Ran `ui-dom` check/tests and affected package checks.

### Breaking-change criteria

- [x] No production workspace `.handled()` call-sites remain.
- [x] Public type removal is intentional and marked with `!` in the commit message.
- [x] Replacement guidance is clear by intent:
  - old exclusive/destructive `handled()` behavior → `consume()`;
  - browser-default-only behavior → `preventDefault()`;
  - keyboard-route-only behavior → `stopKeyboardPropagation()`.

## Status

Retire-ready. All human-signed commits in the arc have landed, including the breaking callable
`handled()` drop at `105d16e20`.

## Why this exists

The KeyValue cursor harness exposed a core keyboard primitive problem:

- `KeyboardMonitor` listens on `document` in capture phase.
- `Keyboard.until(...).on(...)` subscriber callbacks receive `e.handled()`.
- Today `e.handled()` delegates to `Util.handled(nativeEvent)`, which performs:
  - `preventDefault()`
  - `stopPropagation()`
  - `stopImmediatePropagation()`
- Because the listener runs globally during capture, calling `handled()` can starve component-local
  React/DOM `onKeyDown` handlers further down the tree.
- Because current monitor filtering also observes `defaultPrevented`, one global subscriber can
  accidentally suppress later keyboard subscribers.

This makes global keyboard commands too destructive by default and makes host/component focus
handoff brittle.

## Triggering example

Open KeyValue harness draft files are intentionally not the source of truth for this refactor:

- `code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.Debug.tsx`
- `code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-SPEC.tsx`
- `code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx`
- `code/sys.ui/ui-components/src/ui.react/KeyValue/-test/-ui.cursor-entry.test.tsx`

The harness proved the problem:

- `CMD+Enter` conflicts with the existing ui-dev devharness command.
- A global `ALT+Enter` listener must not call a destructive handler when focus is already inside the
  KeyValue cursor root, or it blocks KeyValue's own focused-root `Option+Enter` path.

## Current audit

Known call-sites from workspace search:

### Core

- `code/sys.ui/ui-dom/src/m.Keyboard/m.Keyboard.Monitor.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/m.Keyboard.until.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/m.Keyboard.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/u.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/t.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/-.test.ts`

### ui-dev devharness

- `code/sys.ui/ui-dev/src/ui.react.devharness/ui.use/use.Keyboard.ts`
  - `CMD + Enter` migrated to `consume()`.
  - `CMD + SHIFT + Enter` migrated to `consume()`.
  - `CMD + KeyS` migrated to `preventDefault()` when cancel-save is enabled.
  - `CMD + KeyP` migrated to `preventDefault()` when cancel-print is enabled.
  - `CMD + KeyK` clear-console observer does not take ownership.

### Specs / app-local hooks

- `code/sys.driver/driver-monaco/src/ui/m.Prompt/-spec/-SPEC.tsx`
  - `Escape` migrated to guarded `consume()` after focusing editor footer.
- `deploy/@tdb.slc/src/ui/use/use.Keyboard.ts`
  - `Space` observer; no ownership call.
- `deploy/@tdb.slc/src/ui/ui.Landing-1/use.Keyboard.ts`
  - `Enter` observer/navigation; no ownership call.
  - `Space` observer; no ownership call.
- `deploy/@tdb.data/src/-test/entry.splash.tsx`
  - `CMD + Enter` navigates to dev; no ownership call today.
- `code/sys.ui/ui-dev/src/ui.react.devharness/-test/sample.specs/-SPEC.MySample.tsx`
  - sample observer; no ownership call.

### Draft KeyValue harness

- `code/sys.ui/ui-components/src/ui.react/KeyValue/-spec/-ui.Root.tsx`
  - draft `ALT + Enter` listener should be revisited after this refactor.

## Design goals

1. Global keyboard observers must be non-destructive unless they explicitly take ownership.
2. Browser-default prevention, keyboard-route propagation stopping, and DOM propagation consumption
   must be separate concepts.
3. The callable `handled()` legacy alias must be removed only after call-sites are migrated to
   explicit ownership methods.
4. Component-local React/DOM handlers should remain able to process their own focused keyboard
   grammar.
5. Global host commands must guard focus and active-element context before stopping keyboard
   propagation or consuming.
6. Tests must make event propagation semantics observable.

## Design review position

The hard invariant is that keyboard routing is independent from native browser-default prevention.
Native `preventDefault()` is a browser-default decision; `stopKeyboardPropagation()` is an `@sys`
keyboard-route decision; native `stopPropagation()` and `stopImmediatePropagation()` are DOM
exclusivity decisions. These concepts must not collapse again.

Implementation guardrails:

- `preventDefault()` must not mutate keyboard-route control flags.
- `stopKeyboardPropagation()` must not call native `preventDefault()`.
- `stopKeyboardPropagation()` must suppress later pattern subscribers even if the native event was
  already default-prevented elsewhere.
- `consume()` must be the only new method that stops DOM propagation.
- Control transitions must be monotonic: calls can add default prevention, keyboard-route
  propagation stopping, or consumption, but cannot undo them.
- No callable `handled()` alias should remain after the breaking drop arc.
- Focus guards belong at host command call-sites, not inside reusable component UI.

## Semantic contract

Keyboard control is a three-axis algebra:

| call                                             | native `preventDefault()` | keyboard propagation stopped | native propagation stop | intent                                                      |
| ------------------------------------------------ | ------------------------: | ---------------------------: | ----------------------: | ----------------------------------------------------------- |
| observe only                                     |                        no |                           no |                      no | read the keyboard event without ownership                   |
| `preventDefault()`                               |                       yes |                           no |                      no | prevent browser default only                                |
| `stopKeyboardPropagation()`                      |                        no |                          yes |                      no | own this keyboard-route emission only                       |
| `preventDefault()` + `stopKeyboardPropagation()` |                       yes |                          yes |                      no | prevent browser default and own the keyboard-route emission |
| `consume()`                                      |                       yes |                          yes |                     yes | exclusive global ownership                                  |

### Surface boundaries

`stopKeyboardPropagation()` and `consume()` suppress only later pattern subscribers reached through
keyboard command routing:

- `Keyboard.on(...)`
- `Keyboard.filter(...).on(...)`
- `Keyboard.until(...).on(...)`
- `Keyboard.dbl(...).on(...)`

They must not hide the event from state-observation surfaces:

- `Keyboard.Monitor.$`
- `Keyboard.Monitor.subscribe(...)`
- `Keyboard.until(...).$`
- `Keyboard.until(...).down$`
- `Keyboard.until(...).up$`

State streams describe what happened at the native keyboard layer. Pattern subscribers decide
whether to own a command.

### Mutability boundary

The new control methods belong on the pattern subscriber payload, not on passive state snapshots.
This keeps observation and ownership separate.

For this arc:

- add `preventDefault()`, `stopKeyboardPropagation()`, and `consume()` to
  `Keyboard.Match.SubscriberHandlerArgs`;
- do not add new ownership methods to `Keyboard.Keypress.Event`;
- remove callable `handled()` aliases from subscriber payloads and passive keypress events.

### Ordering guarantees and limits

- The monitor listener runs as a `document` capture listener; event-control calls happen while
  native DOM dispatch is still active.
- Pattern subscribers are evaluated synchronously in registration order for a single native keyboard
  event.
- `stopKeyboardPropagation()` and `consume()` affect only pattern subscribers that have not yet run
  for the same monitor emission.
- Subscribers registered while an emission is already in flight are not part of that emission.
- No control method can retroactively undo subscribers or DOM listeners that already ran.
- `stopPropagation()` and `stopImmediatePropagation()` obey native platform listener ordering; this
  API must not promise exclusivity over earlier capture listeners.
- If another library registered an earlier global capture listener, that listener may already have
  observed the event.
- If Rx subscription ordering cannot truthfully guarantee this, implement a single synchronous
  pattern-dispatch path rather than relying on incidental subject ordering.

### Legacy `is.handled` boundary

`event.is.handled` currently reflects native `defaultPrevented`. It is not the keyboard-route
propagation flag. This arc must not reuse it as the keyboard-route ownership sentinel.

For this arc:

- keep `event.is.handled` as legacy/native default-prevented state;
- mark or document it as unsafe for command ownership decisions;
- add a monitor-local control state for keyboard propagation stopping and consumption;
- do not add a public `event.control` status in this arc unless an implementation or caller need
  earns it.

## Proposed API

Expose only explicit methods on keyboard subscriber args:

```ts
e.preventDefault(); // Native default prevention only; does not stop keyboard or DOM propagation.
e.stopKeyboardPropagation(); // Stop later Keyboard pattern subscribers only; no native DOM call.
e.consume(); // preventDefault + stopKeyboardPropagation + stopPropagation + stopImmediatePropagation.
```

Here `e` is `Keyboard.Match.SubscriberHandlerArgs`, not the passive `e.event` snapshot.

### Semantics

#### `preventDefault()`

Use when a global handler only wants to suppress browser default behavior.

- Calls native `preventDefault()`.
- Does not suppress later `Keyboard` pattern subscribers.
- Does not stop DOM propagation.
- Local React/DOM handlers can still run.
- On non-cancelable native events, this still calls `preventDefault()` but the platform may leave
  `defaultPrevented` false.

Example use: devharness `CMD+S` / `CMD+P` browser default suppression.

#### `stopKeyboardPropagation()`

Use when a global keyboard-bus subscriber owns the command for this monitor emission but should not
block local DOM propagation or make a browser-default decision.

- Marks keyboard propagation as stopped for this monitor event.
- Later `Keyboard.on(...)` pattern subscribers should not run for the same event.
- Does not call native `preventDefault()`.
- Does not call `stopPropagation()` or `stopImmediatePropagation()`.
- Local React/DOM handlers can still run.

#### `consume()`

Use only when the global handler must take exclusive ownership and prevent further DOM/React
handling.

- Calls native `preventDefault()`.
- Stops keyboard propagation for this monitor event.
- Calls native `stopPropagation()`.
- Calls native `stopImmediatePropagation()`.

### Idempotence and composition

- Calling any control method more than once is safe.
- `preventDefault()` followed by `stopKeyboardPropagation()` equals default prevention plus keyboard
  propagation stopping.
- `stopKeyboardPropagation()` followed by `preventDefault()` equals default prevention plus keyboard
  propagation stopping.
- `consume()` dominates all earlier control calls.

## Required internal model change

Do not use `nativeEvent.defaultPrevented` as the monitor's handled/ownership sentinel.

The monitor needs a separate, mutable, monitor-local keyboard propagation flag bound to the keypress
event object, for example:

```ts
type Control = { keyboardPropagationStopped: boolean; consumed: boolean };
```

The control state must be per-event, not global, not stored on the native `KeyboardEvent`, and not
derived from `defaultPrevented`. Public inspection, if ever exposed, must be read-only and earned by
a real caller need.

Then `handlerOn(...)` should suppress later pattern subscribers only when keyboard propagation is
stopped or the monitor event is consumed, not merely because `preventDefault()` was called.

The dispatch path must preserve one shared control cell for all pattern subscribers handling the
same native event. If implementation keeps separate Rx subscriptions per pattern, tests must prove
same-emission mutation is observed by later subscribers.

This distinction is necessary so `preventDefault()` can prevent browser default without starving
later `Keyboard` subscribers or local handlers.

## Test plan

Add or update `code/sys.ui/ui-dom/src/m.Keyboard/-.test.ts` with explicit behavior tests:

- observer-only listener does not prevent default and does not stop child/local handlers.
- `preventDefault()` prevents default but later `Keyboard` subscriber still runs.
- `preventDefault()` does not stop target/bubble DOM listener.
- a native event already default-prevented before the monitor still reaches pattern subscribers.
- `stopKeyboardPropagation()` suppresses later `Keyboard` subscriber without preventing default.
- `stopKeyboardPropagation()` does not stop target/bubble DOM listener.
- `preventDefault()` + `stopKeyboardPropagation()` prevents default and suppresses later `Keyboard`
  subscribers without stopping target/bubble DOM listeners.
- `consume()` prevents default, suppresses later `Keyboard` subscriber, and stops target/bubble DOM
  listener.
- repeated control calls are idempotent and monotonic.
- callable `handled()` aliases are absent from subscriber payloads and passive keypress events.
- `event.is.handled` remains native default-prevented state and does not become the keyboard
  propagation sentinel.
- state-observation surfaces still receive events whose keyboard propagation is stopped.
- existing `Keyboard.until(...).on(...)` disposal behavior remains unchanged.
- modifier pattern matching remains unchanged.
- if `happy-dom` cannot faithfully prove capture → target → bubble or `stopImmediatePropagation()`
  behavior, add a browser/runtime proof or record the limitation before closing the slice.

## Migration plan

### Slice 1 — API hardening in `@sys/ui-dom`

- [x] Add `preventDefault()`, `stopKeyboardPropagation()`, and `consume()` to keyboard subscriber
      args.
- [x] Move the red-test forward-declared control type into `Keyboard.Match.SubscriberHandlerArgs`
      and remove the test-local shim.
- [x] Keep new ownership controls off passive state snapshots unless a compatibility seam proves
      otherwise.
- [x] Remove callable `handled()` aliases after call-site migration.
- [x] Document legacy `event.is.handled` as native default-prevented state, not keyboard ownership.
- [x] Add monitor-local keyboard-propagation-stopped/consumed state.
- [x] Change pattern subscriber suppression from native `defaultPrevented` to monitor-local keyboard
      propagation/consume state.
- [x] Add tests for all propagation semantics and stream-surface boundaries.
- [x] Run `deno task check` and targeted `ui-dom` keyboard tests from `code/sys.ui/ui-dom`.

### Slice 2 — explicit call-site migration

- [x] `ui-dev` devharness `CMD+Enter`: migrated to explicit `consume()`.
- [x] `ui-dev` devharness `CMD+SHIFT+Enter`: migrated to explicit `consume()`.
- [x] `ui-dev` devharness `CMD+S`: migrated to `preventDefault()`.
- [x] `ui-dev` devharness `CMD+P`: migrated to `preventDefault()`.
- [x] `driver-monaco` prompt `Escape`: reviewed focus/active-element guard and migrated to guarded
      `consume()` only when the handler actually takes ownership.
- [x] App-local observer hooks: left observer-only paths alone.
- [x] Draft KeyValue harness: revisited after API hardening and migrated to explicit keyboard-route
      handoff.

### Slice 3 — KeyValue harness return

After the keyboard primitive is hardened:

- [x] Use `ALT + Enter` rather than `CMD + Enter` for the KeyValue cursor handoff proof.
- [x] If focus is already inside `[data-keyvalue-cursor-root]`, do nothing and allow KeyValue's
      local focused-root `Option+Enter` handler to process the event.
- [x] If focus is on page/body or another safe non-interactive host context, focus the cursor root
      and set the first cursor target through the controlled `cursor.model` / `cursor.onChange`
      seam.
- [x] Use explicit keyboard event intent (`stopKeyboardPropagation()` or `consume()`) only after the
      harness actually takes ownership.
- [x] Do not add global focus-grab behavior to `KeyValue.UI` itself.

## Acceptance criteria

- `Keyboard` API exposes explicit non-destructive/destructive event control methods.
- Callable `handled()` aliases are absent from keyboard subscriber payloads and passive keypress
  events.
- Tests prove `preventDefault`, `stopKeyboardPropagation`, and `consume` behavior.
- Tests prove state-observation surfaces still see events whose keyboard propagation is stopped.
- Tests prove registration-order suppression and idempotent monotonic control calls.
- No monitor routing code uses native `defaultPrevented` or legacy `event.is.handled` as the
  keyboard propagation sentinel.
- New ownership controls do not leak into passive state snapshot APIs unless explicitly justified.
- Ownership tests call the production subscriber payload methods directly; no test-local
  forward-declaration shim remains after implementation.
- Existing devharness commands still work.
- Local component keyboard handlers are no longer accidentally starved by global
  default-prevention-only handlers.
- KeyValue cursor focused-root `Option+Enter` and host-level handoff can coexist predictably.

## Non-goals

- Do not redesign KeyValue cursor semantics in this thread.
- Do not introduce a `Command<T>` bus for KeyValue cursor entry in this keyboard hardening slice.
- Do not silently change `handled()` into a non-destructive operation; remove the callable alias
  instead.
- Do not bypass or weaken existing keyboard matching semantics.
