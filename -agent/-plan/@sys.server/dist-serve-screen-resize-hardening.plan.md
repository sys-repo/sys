dist-serve-screen-resize-hardening.plan.md
- [x] fix(server): coalesce Dist serve screen resize repaints

## Finished state

Implemented and committed as:

```text
a88f9f37d fix(server): coalesce Dist serve screen resize repaints
```

The commit contains the runtime change, deterministic screen tests, and focused screen fixture.
Targeted leak-checked tests, the full `@sys/server` check and test suite, formatting, diff checks, and
the 53-package workspace check passed before landing.

Physical terminal-emulator acceptance was not recorded and remains a follow-up observation rather
than a claim made by this completed implementation plan.

## Purpose

Make the shared `@sys/server/dist` interactive serve screen redraw cleanly during terminal resize
without changing Driver Pi, the low-level screen primitive, frame grammar, or public package APIs.

The defect is temporal: before this item, `DistServeScreen.create` wrote one complete frame for every
resize notification. During a resize burst, terminal geometry can change while successive frames are
emitted, leaving wrapped or stale residue. `Cli.Screen.repaint` remains the complete-frame authority.

## Boundary

Runtime ownership remains in:

```text
code/sys/server/src/m.server.dist/u.server/u.serve.screen.ts
```

Deterministic proof remains in:

```text
code/sys/server/src/m.server.dist/-test/-server.serve.screen.test.ts
code/sys/server/src/m.server.dist/-test/u.fixture.serve.screen.ts
```

The existing `u.fixture.ts` continues to own neutral Dist/network/storage setup. The focused screen
fixture owns only terminal observation and scheduler harnesses.

## Design

- Accept, normalize, and copy `event.after` immediately.
- Keep initial acquisition and repaint synchronous.
- Coalesce post-acquisition resize bursts behind one cancellable `50ms` task.
- Render from the latest accepted viewport when the task runs.
- Use generation and schedule-acquisition guards so stale, canceled, disposed, ended-lifecycle, and
  synchronously invoked callbacks are inert.
- Route schedule and delayed repaint failures through the existing reporter failure channel.
- On release, invalidate before cancellation and attempt cancellation, unsubscription, and event
  disposal while preserving the first authoritative failure.

## Invariants

1. Semantic serve facts and `renderedAt` retain their existing meaning.
2. Delayed repaint trusts the accepted event snapshot and never remeasures.
3. At most one resize repaint task is active; each flush uses the latest copied viewport.
4. Every write remains one complete frame through `Cli.Screen.repaint`.
5. Initial output remains synchronous and subscribe-before-measure remains intact.
6. Disposal is terminal and idempotent; stale callbacks cannot repaint.
7. Presentation or scheduling failure remains primary over cleanup failure.
8. Already-disposed event acquisition allocates no scheduler.
9. Raw/silent modes, keyboard ownership, server failure precedence, and frame text remain unchanged.
10. No Driver Pi, Driver Vite, CLI screen primitive, public type, dependency, or generated surface
   changes.

## Deterministic proof

The focused screen test proves:

- synchronous initial acquisition and accepted resize authority;
- one task and no immediate repaint per active burst;
- latest copied viewport wins across wide → narrow → wide projection;
- keyboard controls disappear and return from the final frame projection;
- synchronous schedulers remain reusable;
- cancellation, post-disposal resize, and ended event lifecycles are inert;
- schedule and delayed repaint failures reach `screen.failure`;
- failure precedence and all-attempt cleanup remain exact;
- already-disposed acquisition allocates no scheduler; and
- existing frame, digest, tiny-viewport, and row-width behavior remains green.

Run:

```text
deno fmt --check -- \
  code/sys/server/src/m.server.dist/u.server/u.serve.screen.ts \
  code/sys/server/src/m.server.dist/-test/-server.serve.screen.test.ts \
  code/sys/server/src/m.server.dist/-test/u.fixture.serve.screen.ts

cd code/sys/server && \
  deno task test --trace-leaks ./src/m.server.dist/-test/-server.serve.screen.test.ts

cd code/sys/server && deno task check
cd code/sys/server && deno task test
cd /Users/phil/code/org.sys/sys && deno task check
```

The canonical plan opening block is formatter-exempt and must remain byte-for-byte valid.

## Manual acceptance follow-up

Deterministic tests cannot prove terminal-emulator cell reflow. This observation was not recorded
before commit `a88f9f37d`; when physically validating the behavior, run:

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-pi && deno task serve
```

In the reproducing terminal emulator:

1. drag rapidly wide → narrow → wide;
2. cross the keyboard-footer width threshold repeatedly;
3. reduce and restore height;
4. sustain a resize drag for several seconds;
5. stop at narrow and wide sizes; and
6. quit normally.

Accept only if no duplicate headers, stale metadata rows, wrapped residue, missing footer restoration,
or post-shutdown repaint appears.

## Non-goals

- Driver-Pi-specific ownership.
- Changes to `Cli.Screen.events` or `Cli.Screen.repaint`.
- True silence-based debounce, polling, parallel rendering, incremental line patches, alternate-screen
  takeover, emulator detection, or a speculative shared screen-runtime abstraction.

## Historical stop conditions

This plan would have required revision if implementation had exposed another stdout owner, required a
public scheduler, or changed frame text, screen primitives, Driver Pi, Driver Vite, raw/silent
behavior, keyboard behavior, or server failure precedence. None occurred in the landed change.

## Landed commit

```text
a88f9f37d fix(server): coalesce Dist serve screen resize repaints
```

Committed files:

```text
code/sys/server/src/m.server.dist/u.server/u.serve.screen.ts
code/sys/server/src/m.server.dist/-test/-server.serve.screen.test.ts
code/sys/server/src/m.server.dist/-test/u.fixture.serve.screen.ts
```

The retained plan was not part of that commit. No generated artifacts, dependency changes,
package-version changes, permission changes, or unrelated formatting landed with it.
