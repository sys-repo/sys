responsive-select-screen.plan.md
- [ ] feat(cli): add responsive screen ownership to select prompts
- [ ] feat(yaml): route menu frames through responsive select prompts
- [ ] fix(driver-pi): redraw profile menu screens on resize

## Subject

Make screen-backed selection prompts visually resilient across terminal resize while they are waiting
for input. Keep one terminal owner, derive every complete visual frame from state plus viewport, and
contain Cliffy-specific behavior inside the existing private `@sys/cli` adapter.

The reported failure is the stale cyan application-header rule in the interactive Pi profile menu.
`PiSandboxFmt` already recomputes correctly from an explicit width; the frame is stale because it is
printed before Cliffy begins awaiting input and has no owner during that wait.

## Existing adapter judgment

The current `InputSelect` wrapper is principled dependency adaptation, not private reach-through:

- it subclasses Cliffy's public `Select` class;
- it overrides the protected `message()` extension seam;
- it does not access Cliffy's private `#execute` loop or private fields;
- the subclass remains private to `@sys/cli`;
- the public contract is system-owned and focused on titleless selection behavior; and
- focused tests pin the adapter behavior independently of driver consumers.

Protected inheritance is still upstream coupling. Keep that coupling concentrated in
`code/sys/cli/src/m.core/m.Input/u.select.ts` and prove the exact Cliffy 1.2.1 behavior before adding
a responsive public capability. Do not expose Cliffy lifecycle or renderer types through `@sys/cli`.

## Design invariant

Use one screen grammar:

```text
application state + current viewport → complete visual frame
resize → layout invalidation
one active terminal owner → serialized frame commit
```

For a framed selection prompt, `InputSelect` is the active terminal owner. The driver supplies only a
pure application-frame projection. `@sys/yaml/cli` carries that projection to the prompt owner.
Neither package subscribes to resize or performs cursor coordination.

Keep these ownership boundaries:

- `Cli.Screen` owns terminal size measurement, resize events, and complete-frame repaint primitives.
- `Cli.Input.Select` owns the active prompt lifecycle and Cliffy adaptation.
- `YamlConfig.menu` owns menu state and prompt selection, not terminal effects.
- `driver-pi` owns profile/sandbox state and pure frame composition, not prompt mechanics.
- `PiSandboxFmt` remains a pure width-aware formatter.

## Cliffy canary and stop boundary

Before finalizing a new public option, prove through the existing private adapter that a resize can
request a complete redraw while Cliffy is blocked awaiting input.

The canary must demonstrate:

1. initial size is captured because `Cli.Screen.events().resize$` has no initial emission;
2. a resize while the reader promise is pending recomputes the application frame and prompt output;
3. resize-driven and key-driven renders cannot overlap or reorder terminal writes;
4. the selected option and subsequent keyboard navigation remain intact;
5. wide → narrow → wide transitions erase stale row tails and stale wrapped rows;
6. success, cancellation, acquisition failure, and render failure release resize observation and any
   scheduled redraw; and
7. the existing titleless, titled, prefixed, default, and custom-writer contracts remain unchanged
   outside screen mode.

The implementation may use Cliffy's public and protected subclass seams only. Back out before adding
the YAML or driver surfaces if the canary requires:

- private-field or private-loop access;
- synthetic keyboard input;
- a Cliffy fork or dependency patch;
- driver-owned ANSI cursor arithmetic;
- concurrent terminal writers;
- an unbounded or unobservable render failure; or
- a custom-writer contract that silently writes screen output to a different sink.

If the canary fails, do not approximate responsiveness. The honest fallback is a stable bounded-width
profile sheet without viewport-width ornament, or a later system-owned screen-menu primitive when a
larger concrete need earns it.

## Selected contract direction

Add one narrow, system-owned framed-screen capability to `Cli.Input.Select` only after the canary
passes. Its public shape must communicate these semantics without leaking Cliffy:

- screen mode is optional and leaves normal selection behavior byte-compatible;
- the caller supplies a pure frame renderer receiving the accepted terminal-size snapshot;
- the prompt adapter owns initial placement, resize observation, redraw scheduling, and cleanup;
- application frame and active selection prompt are committed as one serialized visual ownership
  cycle; and
- custom output sinks are either supported coherently through the same sink or rejected explicitly at
  the contract boundary.

Name and type this capability in `t.ts` before runtime fulfillment. Do not add scheduling, debounce,
cursor, ANSI, Cliffy, or platform policy to the caller surface. A short internal coalescing delay may
remain adapter-owned if the canary proves it is needed for resize bursts.

Do not generalize this capability across text, confirm, checkbox, or other prompt kinds in this plan.
A second concrete consumer must earn a shared prompt-screen abstraction.

## Commit 1: `@sys/cli`

Primary surfaces:

- `code/sys/cli/src/m.core/m.Input/t.ts`
- `code/sys/cli/src/m.core/m.Input/u.select.ts`
- `code/sys/cli/src/m.core/m.Input/-test/-.test.ts`

Requirements:

1. Add the framed-screen contract type-first.
2. Keep the implementation inside the private `InputSelect` adapter.
3. Acquire resize observation before accepting the initial size, using the established race-safe
   pattern from the Cell and Vite screen runtimes.
4. Serialize or coalesce every resize-driven redraw with Cliffy's normal render cycle.
5. Dispose screen events and pending work exactly once in every terminal path.
6. Preserve all current non-screen output and generic value inference.
7. Add a compatibility canary that will fail legibly if a future Cliffy upgrade changes the protected
   render/clear assumptions.

Do not change `Cli.Screen`, `Cli.Prompt`, formatter behavior, or unrelated input primitives unless the
canary proves a missing primitive and the plan is explicitly revised first.

## Commit 2: `@sys/yaml/cli`

Primary surfaces:

- `code/sys/yaml/src/m.cli/m.YamlConfig/t/t.menu.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/u/u.menu.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/u/u.menu.action.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/u/u.menu.prompt.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-u.menu.test.ts`
- `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-u.menu.prompt.test.ts`

Requirements:

1. Add one narrow framed-select option to the YAML menu contract.
2. Pass it unchanged to every selection prompt used by root, action, and action-submenu flows.
3. Preserve `beforePrompt` behavior for non-framed callers and non-select prompts.
4. Keep resize subscription, sizing, scheduling, and rendering out of `@sys/yaml`.
5. Prove root/action/submenu forwarding without coupling tests to Cliffy implementation details.

Do not turn `YamlConfig.menu` into a terminal screen controller.

## Commit 3: `driver-pi`

Primary surfaces:

- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.menu.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-u.menu.test.ts`
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-m.main.menu.test.ts`

Requirements:

1. Replace select-screen printing with pure root and selected-profile frame renderers.
2. Render `PiSandboxFmt.header(permissions, width)` and
   `PiSandboxFmt.table(summary, { width, gitRootExplicit })` from the accepted viewport width.
3. Keep migration notice state stable for the lifetime of its active root frame so a redraw does not
   silently remove it.
4. Preserve add, rename, delete, back, exit, and launch transitions.
5. Keep the final pre-launch static sheet on `Cli.Screen.repaint` as currently owned by
   `Profiles.main`.
6. Add a regression proving selected-profile and root frames recompute across width changes without
   duplicate reports or screen effects.

Do not subscribe to `Cli.Screen.events()` in `driver-pi`.

## Behavioral proof

Automated proof must cover:

- resize while a Select prompt remains pending;
- repeated and burst resize delivery;
- width-dependent application header and horizontal-rule recomputation;
- stale-row and stale-tail removal when shrinking;
- keyboard selection after one or more resizes;
- transition between root, action, and submenu frames;
- lifecycle cleanup after resolve and failure;
- non-screen and non-terminal compatibility; and
- no duplicate profile sandbox-report writes caused by redraw.

After deterministic tests pass, run the real profile menu in an interactive terminal and exercise:

```text
root wide → root narrow → select profile → action wide → submenu narrow → back → launch
```

The cursor must remain attached to the active option, every full-width rule must match the accepted
viewport, no old rows may remain, and the final launch sheet must repaint once immediately before Pi
starts.

## Verification

From `/Users/phil/code/org.sys/sys/code/sys/cli`:

```sh
deno task test --trace-leaks ./src/m.core/m.Input/-test/-.test.ts
deno task check
deno task test
```

From `/Users/phil/code/org.sys/sys/code/sys/yaml`:

```sh
deno task test --trace-leaks ./src/m.cli/m.YamlConfig/-test
deno task check
deno task test
```

From `/Users/phil/code/org.sys/sys/code/sys.driver/driver-pi`:

```sh
deno task test --trace-leaks ./src/m.core/m.cli.profiles/-test/-u.menu.test.ts
deno task test --trace-leaks ./src/m.core/m.cli.profiles/-test/-m.main.menu.test.ts
deno task check
deno task test
```

Reserve the full workspace test for final verification after all three package commits are green.

## TMIND review

Rejected alternatives:

- Driver-local resize subscription: creates competing terminal owners around an active Cliffy prompt.
- Formatter-local resize behavior: introduces effects into a pure width-aware renderer.
- `Cli.Screen` orchestration: complects a primitive terminal substrate with prompt/menu policy.
- Cliffy fork or patch: broadens dependency ownership before the existing protected seam is disproven.
- Universal responsive-prompt framework: speculative until another prompt kind earns the abstraction.
- Cosmetic fixed-line patch: hides one stale rule while leaving the frame and cursor lifecycle false.

The intended maintenance payoff is narrow but durable: screen-backed selection becomes an explicit
system capability, upstream coupling remains quarantined, and driver screens become pure projections
that can be repainted without acquiring terminal control.