# Workspace run CompletionHang diagnostic

- [x] 76c8555e0 feat(workspace): arm completion hang warning in root tasks
- [x] d58f14c99 feat(workspace): add completion hang diagnostic
- [x] 35d1b8a7b refactor(workspace): group run utilities under u directory

## Subject

Warn when a workspace run has completed, its final summary has been printed, and the
process-owning script is still alive after a short delay.

This is a post-completion parent-process liveness diagnostic. It is not package telemetry,
not a watchdog, not a supervisor, and not a leaked-handle detector.

## Final implementation state

Implementation landed and is complete for this plan:

- `CompletionHang.Deps.unrefTimer` is required and runtime calls it directly.
- CompletionHang tests import the public surface from `../mod.ts`.
- Test fakes provide `unrefTimer` explicitly.
- All process-owning scripts are wired: `task.test.ts`, `task.check.ts`, and `task.dry.ts`.
- Root help parsing uses `Args.parse`, and authored help text uses `Str.dedent`.
- Run utility files are grouped under `src/m.run/u/u.*.ts` after the mechanical tidy refactor.

Landed commits:

- `76c8555e0 feat(workspace): arm completion hang warning in root tasks`
- `d58f14c99 feat(workspace): add completion hang diagnostic`
- `35d1b8a7b refactor(workspace): group run utilities under u directory`

Related plan:

- `./parallel-test-progress-layout.plan.md` owns progress layout and context-line collapse.

## Invariant

CompletionHang means exactly:

```text
workspace result complete + final output printed + parent process still alive after delay
```

The diagnostic must:

- be armed only by process-owning scripts;
- be one-shot;
- use a timer that cannot keep the process alive;
- report completed package results without claiming package causality;
- avoid speculation about leaked handles or specific runtimes;
- avoid telemetry, metrics, counters, or background collection.

## Ownership boundary

Keep `WorkspaceRun` pure:

- `Workspace.Run.test/check/dry` returns result data.
- Root scripts own final process behavior and may arm CompletionHang after printing summaries.
- Package workers and the parallel scheduler must not arm this diagnostic.

Process-owning root call sites:

- `-scripts/task.test.ts` arms with the parsed strategy context.
- `-scripts/task.check.ts` arms without strategy context.
- `-scripts/task.dry.ts` arms without strategy context.

Do not move this into `WorkspaceRun.test/check/dry` unless the ownership model changes by
explicit design decision.

## Warning shape

Mild default output:

```text
Warning
workspace test completed, but the parent process appears to be hanging after 2s

- all package results completed
- result: passed
- packages: 51 completed
- strategy: parallel, jobs 3
- note: remaining liveness is outside the completed package results
- context:
  - @sys/foo - code/sys/foo, 12s
  - @sys/bar - code/sys/bar, 8s
```

Style contract:

- `Warning` is yellow.
- Body and detail lines are italic gray.
- Context rows are bounded and ordered by usefulness.
- The warning must not say or imply that a package caused the hang.

## TMIND acceptance gates

### 1. Call-site coverage

- Wire all process-owning root workspace run scripts.
- Keep strategy context for test runs only.
- No helper unless duplication becomes real implementation friction.

Mental proof:

- A cleanly exiting run never prints the warning because the unrefed timer cannot retain it.
- A completed test/check/dry run that remains alive prints the matching task name.
- A pre-completion stall does not print this warning and must be diagnosed separately.

### 2. Timer liveness contract

- `CompletionHang.Deps.unrefTimer` is required for custom deps.
- Runtime code calls `deps.unrefTimer(timer)` without optional chaining.
- Test fakes must supply `unrefTimer`, even when it is a no-op.

Mental proof:

- The type contract prevents injected timer deps from silently retaining process liveness.
- Default deps use `Deno.unrefTimer`.
- Canceling still clears the pending timer before it fires.

### 3. Public export proof

- Tests import `CompletionHang` from `../mod.ts`, not the implementation file.
- Existing behavior tests then prove the public module surface.

Mental proof:

- If `mod.ts` drops the export, tests fail at import or check time.
- If it exports the wrong symbol, behavior tests fail.

### 4. Style proof

- Keep stripped-text assertions for readable warning content.
- Add a narrow raw-style assertion for:
  - yellow header;
  - italic gray body line;
  - italic gray detail line.

Mental proof:

- Color/style regressions fail only where style is part of the contract.
- Content remains tested without coupling every assertion to ANSI escapes.

### 5. Root wrapper CLI conformance

- Use the root `./common.ts` barrel for `Args` and `Str`.
- Use `Args.parse` for root help parsing.
- Use `Str.dedent` for the authored help text.
- Keep canonical workspace flag semantics delegated to `Workspace.Run.Args.test`.

Mental proof:

- `--help` and `-h` return help before workspace planning.
- `--jobs=auto` gets default `--parallel` injection.
- Explicit `--parallel=false` is preserved for the sequential baseline.
- Invalid workspace flags still fail in the canonical workspace parser.

### 6. Plan hygiene

- Keep this plan ASCII except canon-required transition notation.
- Keep implementation facts and acceptance gates truthful as code changes land.
- After the feature commit lands, mark the arc item with its actual hash.

### 7. Out-of-scope reporter residue

Reporter context-line residue belongs to the progress-layout plan, not this feature plan.

Before closing that separate arc, add tests for:

- narrow/no elapsed falls back to `  testing`;
- full context fits at exact visible width;
- context visible width stays within the configured terminal width;
- context variants have no trailing spaces.

## Verification

Run narrow workspace package tests first:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace && deno task test ./src/m.run/-test/-u.completion.hang.test.ts
```

Then run the reporter test only if this branch also touches progress layout:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace && deno task test ./src/m.run/-test/-u.reporter.test.ts
```

Run module proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/workspace && deno task test
```

Run root wrapper proof:

```sh
cd /Users/phil/code/org.sys/sys && deno task test -- --help
```

Runtime probe when practical:

```sh
cd /Users/phil/code/org.sys/sys && deno task test
```

Interpretation:

- If the run completes and then remains alive, the warning should print after 2s.
- If the run stalls before final summary, CompletionHang should not print; investigate the in-run
  package or scheduler stall separately.

## Non-goals

- No telemetry.
- No leaked-handle diagnosis.
- No package blame.
- No child-process supervision.
- No kill, restart, timeout, or recovery behavior.
- No moving parent-process behavior into the pure workspace runner.
