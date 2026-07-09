# @sys/process bounded argv capture plan

## Position

`maxChars` in the OCR PDF tool bounds emitted OCR response text, but it does not bound child-process
stdout/stderr buffering when a command is run through `Deno.Command(...).output()`.

This is a real upstream `@sys/process` concern. Current `Process.invoke` delegates to
`Deno.Command.output()`, so switching OCR to `@sys/process.invoke` would not solve bounded output,
timeout, or abort semantics.

Do not solve this permanently inside OCR with a bespoke runner. OCR may keep a small local runner as
a temporary generated-extension implementation detail, but the reusable primitive belongs in
`@sys/process`.

## Goal

Add a no-shell argv capture primitive to `@sys/process` that can safely run local tools with:

- absolute or explicitly provided command paths
- argument arrays only, never shell strings
- bounded stdout and stderr capture
- timeout cancellation
- caller `AbortSignal` cancellation
- graceful child termination with bounded SIGTERM then SIGKILL escalation
- structured status flags suitable for tool/runtime error reporting

## Proposed API shape

Name is intentionally provisional. Choose the final name during implementation after reviewing the
existing `Process.invoke`, `Process.spawn`, and `Process.Terminate` boundaries.

```ts
Process.captureBounded({
  cmd,
  args,
  cwd,
  env,
  timeoutMs,
  signal,
  maxStdoutBytes,
  maxStderrBytes,
  killGraceMs,
});
```

Candidate output shape:

```ts
type BoundedCaptureOutput = {
  readonly code: number;
  readonly success: boolean;
  readonly signal: Deno.Signal | null;
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly text: { readonly stdout: string; readonly stderr: string };
  readonly timedOut?: boolean;
  readonly cancelled?: boolean;
  readonly failedToStart?: boolean;
  readonly stdoutTruncated?: boolean;
  readonly stderrTruncated?: boolean;
};
```

## Design constraints

- No shell fallback.
- Do not route this through `Process.sh` or shell template helpers.
- Do not use `Deno.Command.output()` for this primitive because it buffers whole stdout/stderr.
- Read stdout/stderr streams incrementally.
- Capture at most `maxStdoutBytes` and `maxStderrBytes` into memory.
- Continue draining or safely cancel streams after a byte limit is reached so the child lifecycle is
  deterministic.
- On timeout or abort, send SIGTERM and then SIGKILL after `killGraceMs` if still running.
- Return structured flags rather than throwing for ordinary timeout, abort, nonzero exit, and output
  truncation outcomes.
- Throw only for programmer errors such as invalid limits or malformed arguments, unless the
  existing `@sys/process` convention requires a structured `failedToStart` result.
- Keep decoded text lazy, matching current `Process.Output.text` behavior.
- Keep color/environment behavior explicit and compatible with `asCommand` defaults.

## OCR migration intent

After the upstream primitive exists, migrate the generated OCR PDF runtime to call it instead of its
local `runDenoCommand` implementation.

OCR-specific mapping should remain local to OCR:

- `timedOut` → structured OCR timeout error without Homebrew setup guidance
- `cancelled` → structured OCR cancellation error without Homebrew setup guidance
- `failedToStart` → structured substrate/setup error with launcher-provided install command
- `stdoutTruncated` from `tesseract` → OCR result truncation semantics aligned with `maxChars`
- `stderrTruncated` → diagnostic detail only, never a prompt/tool contract expansion

## Tests

Add `@sys/process` tests that do not depend on external tools beyond Deno itself:

- captures stdout and stderr from argv execution
- truncates stdout at `maxStdoutBytes` and reports `stdoutTruncated: true`
- truncates stderr at `maxStderrBytes` and reports `stderrTruncated: true`
- times out a long-running child and reports `timedOut: true`
- aborts through `AbortSignal` and reports `cancelled: true`
- sends SIGTERM before SIGKILL on timeout/abort when the child does not exit promptly
- returns nonzero exit status without throwing
- reports failed start for a missing command path if that matches final API convention
- avoids leaking child processes or timers under `deno test --trace-leaks`

## Acceptance

- `@sys/process` exposes one reusable no-shell bounded capture primitive.
- The primitive never buffers unbounded stdout/stderr.
- Timeout and abort behavior is deterministic and leak-free.
- OCR can delete or shrink its local command runner after migrating to the upstream primitive.
- Future local tools such as Whisper/audio can reuse the same primitive without inventing another
  child-process runner.

## Non-goals

- No generic shell runner changes.
- No Homebrew dependency resolver in `@sys/process`.
- No OCR-specific policy, language, or setup behavior in `@sys/process`.
- No cloud or service-process orchestration.
