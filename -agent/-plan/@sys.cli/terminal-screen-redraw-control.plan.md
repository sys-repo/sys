terminal-screen-redraw-control.plan.md
- [x] 0763ba12a feat(driver-pi): add local start:gui screen redraw
- [x] 6b75b3166 feat(server.dist): add local serve-screen redraw
- [x] 151944492 feat(cli): extract proven terminal redraw classification
- [x] b986c19d4 feat(driver-vite): add dev-screen redraw with canonical key classification
- [x] 5d8704a36 refactor(driver-vite): group dev runtime modules

## Decision

Dedicated full-frame terminal screens reserve unmodified lowercase `r` as a hidden maintenance
control:

```text
r → remeasure → render current authoritative state → repaint complete frame
```

This is an intentional operator affordance. It does not repair stale or invalid artifacts,
unavailable keyboard input, or server verification failures. Successful repaint does not prove that
a terminal displayed the frame.

The implementation proceeds local-first. Driver Pi and Server Dist must independently prove the same
key grammar and redraw boundary before `@sys/cli` extracts their repeated classification. Redraw
execution remains with each screen owner.

## Invariants

- Use the screen session's existing keyboard owner; never acquire another keypress iterator.
- Redraw is synchronous owner-local presentation work over already-owned state.
- Redraw may remeasure the terminal and repaint; it may not refresh, fetch, verify, materialize,
  rebuild, retry, open a browser, or advance application state.
- Preserve a resize observation that arrives while terminal size is being measured.
- Cancel or supersede pending presentation work before it can overwrite the forced frame.
- Preserve each owner's existing failure, shutdown, and retryable cleanup precedence.
- Keep `r` absent from footer and help text.
- Raw output, prompts, menus, text input, noninteractive execution, and generic keyboard consumers
  do not reserve `r`.
- Do not add a shared frame cache, redraw runtime, callback contract, timer, or polling loop.

Adoption itself reserves `r` in the named dedicated screen. Do not add speculative
`redraw?: boolean` policy fields. If an adopted owner already needs unmodified `r`, stop and resolve
that product conflict before implementation.

## Exact key grammar

A redraw event requires all of:

- `key === 'r'`;
- `ctrlKey === false`;
- `altKey === false`;
- `metaKey === false`;
- `shiftKey === false`.

Do not lowercase input. Cliffy reports uppercase `R` as key `r` with `shiftKey === true`; uppercase
and modified variants are not redraw. Missing modifier booleans are malformed and do not redraw.

Cliffy repeat events retain the admitted key and modifier values. Each event requests one redraw and
is serialized by the existing key loop. Do not add repeat-specific scheduling.

## Redraw operation

Each screen reporter owns an ordinary synchronous `redraw(): void` method. It is package-owned
behavior, not an arbitrary callback admitted by `Cli.Keyboard.bind`.

For an active acquired screen, redraw must:

1. record the current resize-observation revision;
2. sample the current terminal size through the screen's existing terminal authority;
3. adopt that measurement only if no newer resize observation arrived during measurement;
4. cancel or invalidate pending layout/content repaint work;
5. render the latest already-owned state, output, and evidence at the retained viewport;
6. repaint one complete frame through the existing terminal authority.

Unavailable, failed, pre-ready where specified, and disposed reporters remain inert. A presentation
failure follows the package owner's existing presentation and lifecycle boundary; redraw does not
create a second public error channel.

## Implementation arc

### `feat(driver-pi): add local start:gui screen redraw`

Driver Pi is the first proof because `StartGuiScreen` already owns synchronous state projection and
has no repaint scheduler.

- add a local exact-key classifier beside the existing Ctrl+Left handling;
- add `redraw()` to `StartGuiScreenInstance` without changing its public package surface;
- route `r` through the existing `Cli.Keyboard.bind({ onKey })` callback;
- keyboard acquisition precedes screen acquisition, so route through an inert package-owned closure
  until an acquired screen is installed;
- render the latest trusted `BootState` without changing state or browser/materialization work;
- publish redraw failure through the existing screen-failure channel and supervisor precedence;
- keep Ctrl+Left, `q`, Ctrl+C, bootstrap hosting, browser opening, and footer bytes unchanged.

Prove exact key admission, early/inactive no-op behavior, fresh remeasurement, resize-during-measure
precedence, one complete repaint, unchanged `BootState`, no browser or lifecycle effect, failure
routing, repeated redraw, and quit/back behavior before and after redraw.

### `feat(server.dist): add local serve-screen redraw`

Server Dist is the independent second proof and exercises scheduled repaint ownership.

- add the same local exact-key grammar through the existing `onKey` callback;
- keyboard acquisition precedes screen acquisition, so route through an inert package-owned closure
  until the reporter is installed;
- add `redraw()` to `DistServeScreenReporter`;
- retain the latest resize event if it arrives during size measurement;
- cancel or supersede pending resize repaint before forcing the current frame;
- route repaint or scheduling failure through the existing screen failure promise;
- keep immutable startup evidence, `o`, `q`, Ctrl+C, server completion, and cleanup precedence
  unchanged;
- leave raw serve output untouched.

A redraw after served bytes mutate may reproject captured startup evidence, but it cannot repair or
conceal request-time HTTP `412` refusal.

Prove exact key admission, early/inactive no-op behavior, fresh remeasurement, resize race
precedence, pending-task invalidation, one complete repaint, no open/server/evidence mutation,
failure and disposal precedence, repeated redraw, and primary controls before and after redraw.

### `feat(cli): extract proven terminal redraw classification`

Extract only after the first two items establish materially identical key semantics.

Add:

```ts
Cli.Keyboard.isRedraw(event);
```

- define a dedicated permissive input shape containing optional `key`, `ctrlKey`, `altKey`,
  `metaKey`, and `shiftKey` fields;
- require exact `false` modifier values at runtime;
- leave the existing two-field `CliKeyboard.Event`, `isQuit`, `Bind.Options`, `bind`, callback
  awaiting, `finished`, shutdown, and failure contracts byte-for-byte in behavior;
- migrate Driver Pi and Server Dist from their local classifiers in the same extraction item;
- update frozen namespace and exact-key/type tests.

Do not add `onRedraw`, a shared redraw type, or a generic key-command router. Classification is the
repeated primitive; screen execution remains composition at the owning edge.

Prove lowercase admission, uppercase/modified/malformed rejection, compatibility of existing
`isQuit` calls, full Cliffy-event structural compatibility, and exact frozen namespace shape.

### `feat(driver-vite): add dev-screen redraw with canonical key classification`

Driver Vite retains its independent `Cli.keypress()` loop and consumes only the proven predicate.

- add `redraw()` to the internal `ViteDev.Screen.Reporter`;
- admit redraw only in the ready screen phase; startup, raw, unavailable, and disposed modes remain
  unchanged;
- pass a package-owned synchronous redraw adapter from `dev` into the existing `keyboardFactory`;
  omit it when no screen reporter exists;
- classify `r` with `Cli.Keyboard.isRedraw` inside the existing loop and invoke only that admitted
  adapter;
- remeasure, preserve a newer resize observation, absorb pending output/layout work, and repaint the
  current retained output once;
- if redraw fails, dispose the existing child/server lifecycle before propagating the redraw failure
  so presentation cannot orphan the process; preserve that primary failure if cleanup also fails;
- preserve `o`, `q`, Ctrl+C, unsupported-keyboard waiting, and visible footer bytes.

Do not restore historical clear, info, workspace, options, `console.clear`, or reporter-command
behavior.

Prove ready-only admission, exact key grammar, pending content/layout absorption, resize race
precedence, one complete repaint, retained output identity, failure cleanup, repeated redraw, and
open/quit behavior before and after redraw.

### `refactor(driver-vite): group dev runtime modules`

The dev command, retained output, and screen ownership now form a dedicated sibling module root at
`code/sys.driver/driver-vite/src/m.vite/u.dev/`. Generic Vite utilities remain under `u/`.

- move the dev command to the conventional `u.dev/mod.ts` entrypoint;
- move output, screen facade, layout, and runtime modules into the same root;
- update internal and test imports without changing behavior or package API.

Prove the old paths have no consumers, then run Driver Vite check, full tests, formatting, and
`git diff --check`.

## Compatibility and exclusions

- `Cli.Keyboard.bind` gains no option and changes no event precedence.
- Existing `Cli.Keyboard.isQuit({ key, ctrlKey })` callers continue to type-check unchanged.
- No command-line flag, permission, process authority, network authority, or filesystem authority is
  added.
- No footer/help snapshot changes.
- No package gains another stdin reader.
- Generic HTTP, WebSocket, Cell, and Workspace reporters remain out of scope.

## Stop conditions

Stop and revise the plan if:

- the first two local implementations do not converge on the exact same key grammar;
- a target already assigns unmodified `r`;
- terminal focus/control sequences cannot be distinguished from redraw with admitted Cliffy events;
- redraw requires asynchronous application work, another stdin owner, or a process-global frame;
- remeasurement cannot preserve a newer resize observation;
- forced repaint cannot safely supersede pending presentation work;
- a target cannot contain redraw failure through its existing failure and cleanup ownership;
- extraction would widen `CliKeyboard.Event`, alter `Keyboard.bind`, or invent a generic command
  abstraction;
- implementation changes visible controls merely to advertise the hidden affordance.

## Verification

Run Deno tasks from the directory containing the authoritative `deno.json`.

For each item:

1. run the narrow changed screen/keyboard tests first;
2. run `deno task check` and `deno task test` in every affected package;
3. inspect exact frame, callback, cleanup, and key-owner counts;
4. run formatting and `git diff --check`;
5. reopen this plan and the touched ownership seams for a residue review.

Use a deterministic pseudo-terminal proof only if direct Cliffy event evidence cannot establish key
and modifier decoding. Do not add timing sleeps or require a human keypress in CI.

Implementation may proceed while pre-existing changes are plan artifacts only. Every target source
and test path must be clean before its item begins, and unrelated plans must remain untouched. Stop
if a target path already contains an unattributed delta.

Agents must not stage, commit, amend, push, stash, rebase, or perform another Git mutation for this
plan. Git landing is human-owned.
