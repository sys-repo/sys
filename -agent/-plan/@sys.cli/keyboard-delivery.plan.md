@sys.cli
keyboard-delivery.plan.md
- [x] 93637936e test(cli): pin buffered keyboard delivery without a wake-up key
- [x] dbdad01e7 fix(driver-vite): use managed keyboard input for dev shortcuts

## What failed

A ready Vite dev screen appeared to open the browser on Ctrl+C. The controlled reproduction used the pinned [Cliffy keypress 1.3.1 iterator](https://jsr.io/@cliffy/keypress/1.3.1/mod.ts), with stdin reads supplied in memory. Reads `[0x78, 0x6f]`, `[0x03]`, `[0x72]` yielded `x`, `o`, Ctrl+C respectively. In iterator mode without event listeners, `#pullEvent` awaits `#read` before draining `#pushQueue`. One read can decode several events; the next pull blocks even with an event ready. Ctrl+C is decoded correctly. No sleep, Vite, or HMR is necessary to reproduce it. The affected process had been running about 23 hours; the actual sequence of bytes in that terminal was not captured.

## Same footer, different input

- **Vite:** `code/sys.driver/driver-vite/src/m.vite/u/u.keyboard.ts` now uses `Cli.Keyboard.bind()` instead of iterating `Cli.keypress()`. Both raw aliases still expose Cliffy's function. Before the migration, Vite was the only direct production use of those spellings identified under `code/`; that is not a count of keyboard listeners or external consumers.
- **Cell:** `code/sys/cell/src/m.cli/u.lifecycle/u.start.reporter.ts` binds through `Cli.Keyboard.bind` when the screen becomes ready. `interrupt-only` routes Ctrl+C to `controls.interrupt()`; plain `q` requests quit, plain `o` opens an available browser target, and redraw remains local. Cell joins keyboard shutdown during disposal. No Cell migration or change to its command policy.
- **Owner:** `code/sys/cli/src/m.core/m.Keyboard/u.bind.ts` uses `u.input.ts`, not the raw Cliffy iterator. Its `next()` drains queued events before registering another pull. Sys owns stdin, queueing, cancellation and terminal restoration; Cliffy still supplies `parse` and `KeyPressEvent`. This prevents the reproduced queue bug, not every possible input bug.

## Implementation and proof

### 1. CLI: buffered delivery

In `code/sys/cli/src/m.core/m.Keyboard/-test/-u.input.test.ts`, start one pull and emit `xo` as one chunk. Receive `x`; make a second pull and require `o` **before supplying another byte**. Only then emit `0x03` and require `c` with `ctrlKey: true`. Bound the wait so a regression fails rather than hangs. The existing managed reader should pass without a runtime change. Two pending pulls fed by one chunk would not prove this property.

In the same item, add one sentence to the keyboard ownership guidance in `code/sys/cli/README.md`: use `Keyboard.bind()` for long-running terminal controls; the raw aliases retain Cliffy's API and separate lifetime. Do not claim that the managed-reader test covers either raw alias. From `code/sys/cli`, run `deno task test:unit --trace-leaks ./src/m.core/m.Keyboard/-test/-u.input.test.ts` and `deno task test:keyboard:pty`.

### 2. Vite: one keyboard session per dev-server handle

The dev handle in `code/sys.driver/driver-vite/src/m.vite/u.dev/u.lifecycle.ts` exposes `listen()` and `keyboard()` over one lazily acquired session. The abort signal closes acquisition and shortcut admission at disposal start, including for queued keys; `dispose$` alone is not replayed to late callers. The lifecycle joins input release, not the keyboard session that awaits disposal. A retained release failure rejects disposal even if a retry restores stdin. No process-global Vite owner.

In `m.vite/u/u.keyboard.ts`, change the reader, not the shortcuts: preserve the resolved browser URL, Vite's existing `o` and quit behavior, and its exact redraw predicate. Do not import Cell's plain-key restriction. With unavailable stdin, keep listening for server disposal without installing a keyboard binding or classifying a command failure as unavailable input.

Vite owns the exit decision. Leave the binding's `exit` option off: it exits before the binding's cleanup. Join input release outside callbacks; never have a callback await a shutdown that waits for that callback. Exit successfully only for a keyboard-requested quit after both server disposal and terminal restoration succeed. Preserve the original redraw cause across the binding's callback-error translation, even if cleanup also fails.

**Acceptance:** use the existing `bindKeyboardInput` seam from `@sys/cli/testing` in `m.vite/-test/-u.keyboard.test.ts` to exercise the real binding with controlled bytes and a controllable release barrier. Exercise the two public entries together at the dev-handle boundary.

- `xo` in one chunk → exactly one browser open before Ctrl+C is sent. Ctrl+C alone then requests quit once; no further byte is needed. Plain `q` still quits. Holding either server disposal or input release pending must prevent exit; a failed cleanup must not produce exit code 0.
- `listen()` and `keyboard()` called concurrently in either order → one acquisition, one action per key, both calls settle. Disposal started before either entry is called → no acquisition, even while server cleanup is still pending.
- External disposal with an idle reader → release and settle without input, with no keyboard-command exit. Non-TTY startup → no binding; the listener still waits for server disposal.
- Redraw and cleanup both throw → surface the original redraw error; do not exit successfully.

From `code/sys.driver/driver-vite`, run `deno task test:unit` and smoke-test in a fresh dev terminal. Cell needs no migration; its reporter tests and `deno task test:proofs` from `code/sys/cell` are additional regression witnesses only if shared binding behavior changes.

## Reviewed decision: how much of Cliffy to own?

**Own keyboard delivery; do not fork the decoder to repair a queue.** The meaningful user contract is that the next available command acts once, in order, without another keystroke. Server/browser policy belongs to each app. The low-risk move is to reuse the sys reader already exercised by Cell. No new public API or dependency change is required for either arc item. This work is independent of spinner and service-rendering work.

**Raw public API remains a separate decision.** Moving Vite does not fix external `Cli.keypress()` or `Keyboard.keypress()` users. Prefer supplying the minimal reproduction upstream. For either a dependency update or a sys-owned replacement, run the `xo` regression through the public raw iterator itself before calling `Cli.keypress()` fixed; a passing managed-binding test is not evidence for it. Neither an upstream submission nor a release is required to fix Vite.

Reconsider a keyboard-only, sys-owned raw implementation if an actual raw consumer needs reliable delivery before a verified upstream fix, or the project elects to maintain that public contract itself. Its home would be `code/sys/cli/src/m.core/m.Keyboard`, not Cell or Vite. Reuse the native reader machinery without sharing disposal authority between raw and managed sessions. Decide explicitly between compatibility at both aliases and a versioned migration: the current public type is `typeof CliffyKeypress`, not merely `AsyncIterable`. Check one-shot `await`, iteration, event listeners, event identity/modifiers, singleton/reacquisition and raw-mode restoration, plus sequential handoff to bindings and prompts. Do not promise concurrent ownership. Retain the existing PTY and import-without-authority proofs. Do not silently substitute the managed handle behind the aliases.

A fully Cliffy-free keyboard, including decoding and event construction, is a larger choice still. First establish a concrete decoder gap and fixtures for escape sequences and UTF-8 split across read boundaries, modifiers and malformed input; today's managed reader explicitly does not buffer partial sequences across its eight-byte windows. No copied parser, prompt rewrite, generalized terminal framework, or claim of bug-free equivalence in this repair. Revisit after the Vite fix; add a separately scoped arc only if ownership and compatibility are chosen. Planning does not authorize implementation or Git mutation.
