# @sys/ui-dom m.Keyboard namespace refactor

- [ ] plan(create): ui-dom keyboard namespace refactor
- [x] d4dda8e0a refactor(ui-dom): namespace keyboard type spine
- [ ] plan(update): ui-dom keyboard namespace refactor final reality
- [ ] docs(type-refactor): retire spent ui-dom keyboard plan after namespace refactor

## Scope

Target package/module:

- `code/sys.ui/ui-dom/src/m.Keyboard/t.ts`
- Runtime public root: `Keyboard` from `code/sys.ui/ui-dom/src/m.Keyboard/m.Keyboard.ts`
- Public export lanes: `@sys/ui-dom`, `@sys/ui-dom/keyboard`, `@sys/ui-dom/t`

## Final reality

Implementation landed in:

- `d4dda8e0a refactor(ui-dom): namespace keyboard type spine`

Actual source changes:

- Converted `code/sys.ui/ui-dom/src/m.Keyboard/t.ts` from flat exported keyboard types to `export declare namespace Keyboard`.
- Made `Keyboard.Lib` the primary contract and kept it first in the namespace.
- Moved detail contracts under earned sub-namespaces:
  - `Keyboard.Is.*`
  - `Keyboard.Listener.*`
  - `Keyboard.Match.*`
  - `Keyboard.Monitor.*`
  - `Keyboard.Modifier.*`
  - `Keyboard.State.*`
  - `Keyboard.Key.*`
  - `Keyboard.Keypress.*`
- Migrated `@sys/ui-dom` keyboard runtime and tests to `t.Keyboard.*` references.
- Removed the direct `import type { KeyboardMatchLib } from './t.ts'` lane in `m.Match.ts`; implementation now uses the local `type t` pool.
- Migrated in-scope workspace caller type lanes from flat keyboard names to `Keyboard.*`:
  - `KeyboardModifierFlags` → `Keyboard.Modifier.Flags`
  - `KeyboardEventsUntil` → `Keyboard.EventsUntil`
- Updated the package template type pool at `code/-tmpl/-templates/tmpl.pkg/src/common/t.ts` so new packages do not regenerate the stale flat keyboard import.
- Preserved runtime exports and behavior, including the runtime `Kbd` alias.

## Legacy alias disposition

No compatibility aliases were retained.

Final residue scan found no in-scope references to legacy flat keyboard names:

- `KeyboardModifierFlags`
- `KeyboardEventsUntil`
- `KeyboardLib`
- `KeyboardIsLib`
- `KeyboardMatchLib`
- `KeyboardMonitorOn`
- `KeyboardMonitorMulti`
- `KeyboardListener`
- `KeyListenerHandle`
- `NativeKeyEventLike`
- `KeyEventLike`
- `KeyPattern`
- `KeyMatchSubscriberHandler`
- `KeyMatchPatterns`
- `KeyboardStateCurrent`
- `KeyboardState`
- `KeyboardKeypressProps`
- `KeyboardKeypress`
- `KeyboardKeyFlags`
- `KeyboardKey`
- `KeyPressStage`
- `KeyboardModifierKeys`
- `KeyboardModifierEdges`
- `KeyboardModifierKey`

## Verification / proof

Passed during implementation:

```sh
cd code/sys.ui/ui-dom && deno task check
cd code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.Keyboard
cd code/sys.ui/ui-react && deno task check
cd code/sys.ui/ui-react-components && deno task check
cd code/sys.ui/ui-react-devharness && deno task check
cd code/-tmpl && deno task check
cd code/sys.tools && deno task check
cd code/sys.driver/driver-monaco && deno task check
cd code/sys.driver/driver-prosemirror && deno task check
cd code/sys.driver/driver-automerge && deno task check
cd code/sys.driver/driver-stripe && deno task check
cd code/sys.driver/driver-pi && deno task check
```

Final hardening proof before commit:

```sh
cd code/sys.ui/ui-dom && deno task check
cd code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.Keyboard
```

Final residue proof:

```sh
rg -n "KeyboardModifierFlags|KeyboardEventsUntil|KeyboardLib|KeyboardIsLib|KeyboardMatchLib|KeyboardMonitorOn|KeyboardMonitorMulti|KeyboardListener|KeyListenerHandle|NativeKeyEventLike|KeyEventLike|KeyPattern|KeyMatchSubscriberHandler|KeyMatchPatterns|KeyboardStateCurrent|KeyboardState|KeyboardKeypressProps|KeyboardKeypress|KeyboardKeyFlags|KeyboardKey|KeyPressStage|KeyboardModifierKeys|KeyboardModifierEdges|KeyboardModifierKey" code/sys.ui/ui-dom/src code/sys.ui/ui-react/src code/sys.ui/ui-react-components/src code/sys.ui/ui-react-devharness/src code/sys.tools/src code/sys.driver/driver-monaco/src code/sys.driver/driver-prosemirror/src code/sys.driver/driver-automerge/src code/sys.driver/driver-stripe/src code/sys.driver/driver-pi/src code/-tmpl/-templates/tmpl.pkg/src -g '*.ts' -g '*.tsx'
```

Result: no matches.

## Final SHIP/HOLD review

SHIP for the source refactor landed in `d4dda8e0a`.

Review result:

- Scope: implementation commit contained only planned `.ts` / `.tsx` source and template type-pool changes.
- Behavior drift: runtime `Keyboard`, `KeyboardMonitor`, `KeyListener`, and `Kbd` export behavior preserved.
- Compatibility discipline: no deprecated alias blocks added.
- Compatibility loss: no in-scope legacy flat keyboard aliases remain; callers were migrated.
- Namespace shape: `Keyboard.Lib` exists, appears first, and subordinate namespaces are noun-shaped.
- Type-plane purity: `m.Keyboard/t.ts` remains type-only.
- Import lanes: runtime callers use local `type t` pools.
- Stale residue: no legacy flat keyboard names remain in the in-scope scan.

Remaining risk: none found for the landed source refactor.
