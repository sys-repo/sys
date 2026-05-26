# CLI terminal capability predicates plan

## Position

Move terminal capability probing into one explicit `@sys/cli` predicate namespace:

```ts
Cli.Is.terminal('stdin');
Cli.Is.terminal('stdout');
Cli.Is.terminal('stderr');
```

This is the STIER shape because it keeps the Deno word `terminal`, forces the caller to name the
stream, and avoids the current category error of asking `Keyboard` about spinner/output capability.

No zero-arg `terminal()` overload should exist. A default would hide intent and recreate the same
ambiguity under a cleaner name.

## Current evidence

Current scan candidates:

- `code/sys/cli/src/m.core/m.Keyboard/u.isTerminal.ts`
  - canonical-but-misplaced implementation; probes `Deno.stdin.isTerminal()`.
- `code/sys/cli/src/m.core/m.Keyboard/u.bind.ts`
  - should use stdin capability.
- `code/sys/cell/src/m.cli/u.start.ts`
  - currently uses `Cli.Keyboard.isTerminal()` for spinner output; should use stdout capability.
- `code/sys/cell/src/m.cli/u.fmt.task.ts`
  - has a local `Deno.stdout.isTerminal()` wrapper; should use stdout capability.

Target end-state invariant:

- Direct `Deno.stdin|stdout|stderr.isTerminal()` calls exist only inside `@sys/cli` terminal
  capability implementation.
- No `Cli.Keyboard.isTerminal()` API remains.
- Spinner/rendering code checks `Cli.Is.terminal('stdout')`.
- Keyboard/input code checks `Cli.Is.terminal('stdin')`.

## File shape decision

Use a directory module, not a single `m.Is.ts` file:

```txt
code/sys/cli/src/m.core/m.Is/
  mod.ts
  t.ts
  u.terminal.ts
```

Reason: `@sys/cli` core namespaces are already directory-shaped (`m.Cli`, `m.Keyboard`, `m.Screen`,
`m.Spinner`, etc.) with local `t.ts` type surfaces. `m.Is/` keeps the public namespace, implementation,
and type contract cleanly factored without adding noise to `m.Cli/mod.ts`.

## Target API

Type surface:

```ts
// @sys/types/src/t/t.Io.ts
export type StdioName = 'stdin' | 'stdout' | 'stderr';

// @sys/cli
export type CliIsLib = {
  readonly terminal: (stream: t.StdioName) => boolean;
  readonly interactive: () => boolean;
};
```

Runtime surface:

```ts
export const Is: t.CliIsLib = {
  terminal,
  interactive,
};
```

Root CLI namespace:

```ts
Cli.Is.terminal('stdout');
Cli.Is.interactive();
```

`Cli.Is.interactive()` is justified by repeated callsites with the same semantic predicate:

```ts
Cli.Is.terminal('stdin') && Cli.Is.terminal('stdout')
```

Use `interactive()` for prompt/menu style code that requires both input and output. Keep using
`terminal('stdout')` for output-only spinners/clear-screen behavior and `terminal('stdin')` for
keyboard input binding.

No aliases:

- no `Cli.Is.tty()`
- no `Cli.Is.keyboard()`
- no `Cli.Is.terminal()` default overload
- no `Cli.Is.stdinTerminal()` convenience methods
- no deprecated `Cli.Keyboard.isTerminal()` bridge

Those names can be added later only if repeated callsites prove they reduce noise without obscuring
stream intent. `Cli.Keyboard.isTerminal()` should be removed, not preserved as a transitional alias.

## Two-commit plan

### Commit 1 — add the upstream CLI predicate namespace

Suggested message:

```txt
feat(cli): add terminal capability predicates
```

Changes:

- Add `StdioName` to `code/sys/types/src/t/t.Io.ts`.
- Add `code/sys/cli/src/m.core/m.Is/` with:
  - `t.ts` for `CliIsLib` using `t.StdioName`.
  - `u.terminal.ts` as the only direct `Deno.*.isTerminal()` implementation and home of the
    stdin+stdout interactive predicate.
  - `mod.ts` exporting `Is`.
- Add `Cli.Is` to:
  - `code/sys/cli/src/m.core/m.Cli/mod.ts`
  - `code/sys/cli/src/m.core/m.Cli/t.ts`
  - `code/sys/cli/src/m.core/mod.ts`
  - `code/sys/cli/src/m.core/t.ts`
- Update `code/sys/cli/src/m.core/m.Keyboard/u.bind.ts` to use:
  ```ts
  Is.terminal('stdin')
  ```
- Remove `Cli.Keyboard.isTerminal()` in this commit:
  - delete the property from `m.Keyboard/t.ts`.
  - delete the export from `m.Keyboard/mod.ts`.
  - remove `m.Keyboard/u.isTerminal.ts`.
- Update `@sys/cli` API tests to assert:
  - `Cli.Is` is exported.
  - `Cli.Is.terminal` is the same implementation exported by the module.
  - `Cli.Keyboard` still owns keyboard predicates only.
  - `Cli.Keyboard.isTerminal` is not part of the public surface.

No-alias sequencing note:

- Commit 1 is package-local green for `@sys/cli`.
- Because there is intentionally no `Cli.Keyboard.isTerminal()` bridge, downstream `/sys` callsites may
  be broken until commit 2 lands.
- Treat commits 1 and 2 as a tight pair on the same branch; do not stop after commit 1 or publish it as
  a standalone compatibility release.

Verification for commit 1:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test && deno task check
```

### Commit 2 — route all `/sys` callsites

Suggested message:

```txt
refactor(sys): route terminal checks through Cli.Is
```

Changes:

- Replace service spinner terminal detection in `code/sys/cell/src/m.cli/u.start.ts`:
  ```ts
  const silent = !Cli.Is.terminal('stdout');
  ```
- Replace task spinner terminal detection in `code/sys/cell/src/m.cli/u.fmt.task.ts`:
  ```ts
  const silent = deps.silent ?? !Cli.Is.terminal('stdout');
  ```
- Remove the local `isTerminal()` wrapper from `u.fmt.task.ts`.
- Re-scan `/sys` and require:
  - no `Cli.Keyboard.isTerminal()` callsites.
  - no package-local `Deno.*.isTerminal()` callsites outside `@sys/cli/src/m.core/m.Is/u.terminal.ts`.

Verification for commit 2:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task test && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/cell && deno task test --trace-leaks ./src/m.cli/-test && deno task check
```

Final scan:

```sh
rg "Cli\.Keyboard\.isTerminal|Deno\.(stdin|stdout|stderr)\.isTerminal|function isTerminal\(" /Users/phil/code/org.sys/sys/code/sys
```

Expected final scan result:

- exactly one direct `Deno.*.isTerminal()` implementation under `@sys/cli/src/m.core/m.Is/u.terminal.ts`.
- zero `Cli.Keyboard.isTerminal` references.
- zero local `function isTerminal()` wrappers for terminal capability probing.

## Follow-up cleanup: full `/sys` terminal-probe routing

A wider `/sys` scan must include all standard streams and not only Cell/CLI:

```sh
rg "Deno\.(stdin|stdout|stderr)(\.isTerminal|\b)" /Users/phil/code/org.sys/sys
rg "Deno\.(stdin|stdout|stderr)\.isTerminal|\.isTerminal\(" /Users/phil/code/org.sys/sys
```

Terminal-probe findings outside the canonical `@sys/cli` implementation, now routed in the working
cleanup:

- `code/sys.tools/src/cli.crypto/cmd.hash/u.preflight.ts`
  - routed to `Cli.Is.interactive()`.
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/-test.sample/u.fixture.ts`
  - routed to `Cli.Is.interactive()`.
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.fmt/u.listen.ts`
  - routed to `Cli.Is.interactive()`.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/m.main.ts`
  - routed to `Cli.Is.terminal('stdin')` and `Cli.Is.terminal('stdout')` while preserving the explicit
    `{ stdin, stdout }` data shape.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.terminal.ts`
  - routed to `Cli.Is.terminal('stdout')`.
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test/-u.menu.test.ts`
  - Deno stdout monkeypatch replaced with a `Cli.Is.terminal` test seam.

Non-terminal standard stream findings:

- `code/sys/process/src/m.process/u.proc.spawn.ts`
  - `Deno.stdout.writeSync(data)` is direct output writing, not terminal capability detection.
  - Do not route through `Cli.Is`; this scan hit is not part of terminal probing.

Follow-up commit candidate:

```txt
refactor(sys): route remaining terminal probes through Cli.Is
```

Follow-up verification should include affected package checks/tests plus the final scan. The final scan
should allow only:

- `code/sys/cli/src/m.core/m.Is/u.terminal.ts` for `Deno[stream].isTerminal()`.
- plan/docs mentions.
- no production direct `Deno.stdin|stdout|stderr.isTerminal()` probes elsewhere.

## TMIND review

### Hostile view: this is over-abstraction

Concern: Deno already has `Deno.stdout.isTerminal()`. Wrapping it could be API ceremony.

Answer: the wrapper is justified because the project needs one safe runtime boundary and one semantic
place to express stream intent. The current code already proved the risk: Cell used a keyboard helper
for output capability, then added a local stdout wrapper. The abstraction removes drift rather than
adding taste-only indirection.

### Hostile view: `Is` conflicts with `@sys/std/is`

Concern: `Cli.Is` could be confused with generic type predicates.

Answer: under `Cli`, `Is` is a capability predicate namespace, not a generic type predicate namespace.
The naming still follows the existing Sys predicate convention. Keep the namespace tiny and concrete to
avoid becoming a dumping ground.

### Hostile view: stream strings are noisy

Concern: `Cli.Is.terminal('stdout')` is longer than `Cli.Is.stdoutTerminal()`.

Answer: the string is the point. It forces the caller to make the stdin/stdout/stderr distinction at the
site where the decision matters. Add convenience helpers only after repeated use demonstrates real
noise.

### Hostile view: two commits without an alias creates an intentionally broken middle

Concern: commit 1 removes `Cli.Keyboard.isTerminal()` before all `/sys` callsites are routed.

Answer: correct. With no aliases, this is the clean tradeoff. Commit 1 must be validated only as an
`@sys/cli` package change, and commit 2 must follow immediately to restore monorepo-wide consistency.
The plan should not publish, release, or pause on the intermediate state.

## Non-goals

- Do not rename `Screen` or `Keyboard` broadly.
- Do not introduce interactive/readline/color-support detection in this pass.
- Do not add no-arg terminal defaults.
- Do not move `Screen.size()` console-size probing; that is terminal geometry, not terminal capability.
- Do not promote Cell-specific elapsed-time formatting into `@sys/cli` as part of this change.
