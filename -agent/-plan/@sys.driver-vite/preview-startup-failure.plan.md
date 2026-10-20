@sys.driver-vite
preview-startup-failure.plan.md
- [x] 1e86f7fe2 fix(net): bound port selection and preserve probe refusal
- [x] a689a54c6 fix(driver-vite): report occupied serve ports gracefully

## Outcome

Handle an occupied production-serving port at the shared CLI boundary: one readable stderr
diagnostic and exit status `1`, instead of an uncaught startup stack. Do not discover another port,
print a retry command, or attempt serving again.

The human explicitly removed retry hints from this unit and chose `Cannot serve` to match
`deno task serve`. Retry rendering, shell quoting, task replay, and their parser overrides therefore
have no remaining owner here. Their source and fixtures are removed; the original parser and graph
expectations are restored.

The two-item arc preserves the already-landed Net hardening. Its existing consumers still benefit;
the reduced CLI diagnostic does not depend on port selection. No new arc item or Git mutation is
implied by refinement. The opening arc remains the landing ledger.

## Terminal contract

```text
Cannot serve

  127.0.0.1:8080 is already in use.
  Stop the existing server or choose another port.
```

- Heading red; occupied address white; recovery sentence gray. Text remains clear without color.
- Show the requested `127.0.0.1` listener and effective port, defaulting to `8080`.
- Write once to stderr, including one trailing EOL; `console.error` supplies the second EOL and
  leaves one empty terminal line. Set exit status `1`, without calling `Deno.exit`.
- `silent` suppresses startup presentation, not this failure diagnostic.
- No alternate-port hint, box, rule, icon, raw cause, or stack for the handled refusal.
- Driver Pi retains its existing package-owned `IN USE` table on stdout, not this diagnostic.

## Commit 1: bounded shared selection

Owner: `code/sys/net/src/m.Net/`, its type contract, and owner-level tests.

- Integer preferences only, in `0..65535`; validate before effects. `get(0)` delegates allocation
  without probing. Undefined preference retains random allocation.
- For nonzero preferences, check applicable targets and advance only over authentic conflicts.
  Search the preferred port plus at most 10,000 consecutive alternatives, capped at `65535`.
- Propagate permission refusal and ambiguous failures rather than inventing availability. `inUse`
  remains conservative, and strict conflict selection remains supported.
- Cache IPv6 support only after successful probing/release or authentic unsupported-family evidence.
  Denied or ambiguous inspection is not support truth and must not poison the cache.
- Release every acquired listener. Internal deterministic seams are not new public configuration.

Recorded owner proof: validation before effects, zero, range/search bounds, monotone candidate and
independent target traces, strict conflicts, refusal identity and immediate cessation, capability
cache behavior, and listener cleanup. Real IPv4/IPv6 conflicts and actual restricted-permission
`NotCapable` refusal were independently exercised. Synthetic `NotSupported` coverage does not
establish portable OS/runtime unsupported-IPv6 mappings; unknown failures remain refusals.

Implementation-phase commands:

- `code/sys/net`: scoped `deno task test --trace-leaks ./src/m.Net`, then `deno task check` and
  `deno task test --trace-leaks` passed (10 tests, 52 steps). One legacy privileged-port step was
  conditionally skipped; explicit permission tests do not rely on that assumption.
- `code/sys.driver/driver-vite`: `deno task test:dev` passed (1 test, 8 steps).
- `code/sys.driver/driver-automerge`: `deno task test --trace-leaks ./src/m.server/-.test.ts` passed
  (1 test, 17 steps).
- `code/sys/http`:
  `deno task test:unit --trace-leaks ./src/http.server/m.HttpServer/-test/-u.options.test.ts` passed
  (1 test, 1 step), including strict-port and zero-port bypass.
- Exact-file Net formatting checks and scoped `git diff --check` passed.

## Commit 2: narrow CLI reporting

Production owners:

- `code/sys.driver/driver-vite/src/-entry/u.command/u.serve.ts`: await the serving operation and its
  owned cleanup; catch only authentic `DistServer.Error.is(cause)` with reason `address-in-use`.
  Format through existing `@sys/cli` colors and `Str.builder`. The internal test seam contains only
  stderr writing and exit-status effects.
- `code/sys.driver/driver-pi/-scripts/task.vite.u.ts`: after existing identity validation/injection,
  delegate only `serve` to `ViteEntry.serve`; keep other commands on `ViteEntry.main`. This
  preserves the adapter's existing refusal owner, output, status, and finite permission preset.

Preserve unexpected rejection identity, all other startup reasons, and programmatic serving
rejection. Do not change server primitives, argument parsing, serving limits, command loaders,
strict explicit ports, port-zero delegation, or permission configuration. Do not move serving
cleanup into presentation or preflight startup.

Focused proof owners:

- `u.command/-test/-u.serve.failure.test.ts`: exact plain/color output and trailing EOL, one write,
  status `1`, one serving attempt, deferred cleanup, explicit ports, silent failure, success/no-op,
  forged errors, other reasons, unexpected identity, programmatic rejection, and reporting without
  network authority.
- `-test.external/-serve.cached.process.ts`: retain the existing cached-only, restricted port-zero
  smoke test and fixture-cleanup coverage. The human removed the additional occupied-listener color
  process proof from this unit; do not replace it with another harness or broader grants.
- Driver Pi's `-scripts/-test/-task.vite.test.ts`: all four command routes, identity preservation,
  rejection identity, existing table rendering, and unchanged finite task permissions. Its existing
  process proof is retained without source changes; no duplicate blocker framework is added.

The original command-graph test remains unchanged and must still pass. Cosmetic changes to unrelated
proof code are outside this unit.

## Verification evidence and limits

The no-discovery expectation was run against the previous implementation and failed on its extra
query/import/selection/render calls. The reduced implementation then passed. Refinement proceeded
from that green state, preserving authored `Str.dedent` snapshots and explicit newline contracts.

The human explicitly narrowed verification to focused regressions and normal module checks rather
than a dedicated runtime-proof campaign for this diagnostic. The follow-up removes only the extra
occupied-listener process case and its unused imports; production code, existing process coverage,
permission presets, and prepared fixtures remain unchanged.

Verification after that reduction:

- `code/sys.driver/driver-vite`:
  `deno task test:run --trace-leaks ./src/-entry/u.command/-test ./src/-entry/-test` passed (7
  tests, 30 steps).
- `code/sys.driver/driver-vite`: `deno task test --trace-leaks` passed (65 tests, 526 steps).
- `code/sys.driver/driver-vite`: `deno task test:entry:process` passed (2 tests, 10 steps), covering
  unchanged command authority, cached-only serving, and fixture cleanup. This is not a runtime proof
  of the occupied-port diagnostic; that contract is covered by the focused dispatch regressions.
- `code/sys.driver/driver-pi`: `deno task test:unit --filter=driver-pi/scripts/task.vite` passed (1
  test, 11 steps), including the complete routing matrix and package-owned refusal output.
- Both owning modules' `deno task check` passed.
- Exact-file `deno fmt --check` and scoped `git diff --check` passed for the changed process test.
  No formatter writes or Git mutations were performed.

Historical limits, not remaining obligations of the narrowed unit:

- The removed color-process case failed during Chalk initialization with `NotCapable` for
  `TF_BUILD`. It had forced color with an insufficient environment grant and never reached serving.
  No grant was broadened, and that failure is not successful occupied-port evidence.
- Driver Pi's previous `deno task test:serve:process` stopped before serving checks because its
  prepared frozen `dist/` was malformed. Its integration coverage remains unestablished; no fixture
  was rebuilt and no prerequisite check was weakened.
- Earlier retry-era package/process results are superseded by the verification above. Full workspace
  verification and independent implementation blind review have not been performed.

## Review consequences

The earlier whole-plan blind review identified task-default replay and Driver Pi presentation
ownership. Replay obligations disappeared when the human removed command suggestions. The Pi
ownership finding remains necessary: shared CLI recovery must not consume the adapter's rejection.

The final TMIND falsification surfaces are narrower: authentic versus forged failure, cleanup before
reporting, exact plain/color bytes, no success-path side effects, unchanged programmatic rejection,
all Pi command routes, and unchanged lazy command authority. No review label or plan prose
substitutes for runtime evidence or grants execution authority.

## Non-goals

Port discovery, retry hints, automatic fallback, process termination, port reservation, new grants,
parser changes, shell/task interpreters, generic error/process frameworks, unrelated formatting or
refactors, publishing, and Git mutations.
