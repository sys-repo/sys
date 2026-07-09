# @sys/process bounded argv capture plan

## Commit arc

- [ ] feat(process): add bounded argv capture
- [ ] refactor(ocr): use bounded process capture for generated OCR commands

## Position

`maxChars` in the OCR PDF tool bounds emitted OCR response text, but it does not bound child-process
stdout/stderr buffering when a command is run through `Deno.Command(...).output()`.

This is a real upstream `@sys/process` concern. Current `Process.invoke` delegates to
`Deno.Command.output()`, so switching OCR to `@sys/process.invoke` would not solve bounded output,
timeout, abort, or child-cleanup semantics.

Do not solve this permanently inside OCR with a bespoke runner. OCR may keep a small local runner as
a temporary generated-extension implementation detail, but the reusable primitive belongs in
`@sys/process`.

## Fit inside `Process`

Add `Process.capture`, not `captureBounded`. Boundedness is the contract: callers must provide
stdout and stderr byte caps, so there is no unbounded variant under this name.

- `invoke` stays the compatibility surface for simple whole-output commands.
- `capture` is the no-shell finite-memory argv capture primitive.
- `spawn` remains the streaming/readiness handle for long-lived children.
- `inherit` remains the interactive inherited-stdio path.
- `sh` / `run` remain shell helpers and must not be used by `capture`.

## Public API target

```ts
Process.capture({
  args,
  cmd,
  cwd,
  env,
  signal,
  timeoutMs,
  maxStdoutBytes,
  maxStderrBytes,
  killGraceMs,
});
```

Type intent:

```ts
type CaptureArgs = {
  args: string[];
  cmd?: string;
  cwd?: string;
  env?: t.Process.Env;
  signal?: AbortSignal;
  timeoutMs?: t.Msecs;
  maxStdoutBytes: number;
  maxStderrBytes: number;
  killGraceMs?: t.Msecs;
};

type CaptureOutput =
  | CaptureExitedOutput
  | CaptureTimedOutOutput
  | CaptureCancelledOutput
  | CaptureFailedToStartOutput;

type CaptureBaseOutput = {
  readonly stdout: Uint8Array;
  readonly stderr: Uint8Array;
  readonly text: { readonly stdout: string; readonly stderr: string };
  readonly stdoutTruncated: boolean;
  readonly stderrTruncated: boolean;
  toString(): string;
};

type CaptureNoTermination = {
  readonly reason: null;
  readonly actions: readonly t.Process.Terminate.Action[];
};

type CaptureTermination<R extends 'timeout' | 'cancelled'> = {
  readonly reason: R;
  readonly actions: readonly t.Process.Terminate.Action[];
};

type CaptureExitedOutput = CaptureBaseOutput & {
  readonly outcome: 'exited';
  readonly status: Deno.CommandStatus;
  readonly code: number;
  readonly success: boolean;
  readonly signal: Deno.Signal | null;
  readonly termination: CaptureNoTermination;
};

type CaptureTimedOutOutput = CaptureBaseOutput & {
  readonly outcome: 'timed-out';
  readonly status: Deno.CommandStatus | null;
  readonly code: number | null;
  readonly success: false;
  readonly signal: Deno.Signal | null;
  readonly termination: CaptureTermination<'timeout'>;
};

type CaptureCancelledOutput = CaptureBaseOutput & {
  readonly outcome: 'cancelled';
  readonly status: Deno.CommandStatus | null;
  readonly code: number | null;
  readonly success: false;
  readonly signal: Deno.Signal | null;
  readonly termination: CaptureTermination<'cancelled'>;
};

type CaptureFailedToStartOutput = CaptureBaseOutput & {
  readonly outcome: 'failed-to-start';
  readonly status: null;
  readonly code: null;
  readonly success: false;
  readonly signal: null;
  readonly termination: CaptureNoTermination;
  readonly error: unknown;
};
```

## Result invariants

- `outcome` is the single terminal-state discriminant. Do not add parallel optional booleans such as
  `timedOut`, `cancelled`, or `failedToStart`.
- `success` is true only when `outcome === 'exited'` and `status.success === true`.
- `code` and `signal` mirror `status` when a final child status exists; otherwise they are `null`.
- `stdout.length <= maxStdoutBytes` and `stderr.length <= maxStderrBytes` for every outcome.
- `stdoutTruncated` and `stderrTruncated` are independent capture facts; they do not change
  `success`.
- `failed-to-start` is returned, not thrown, for command construction/spawn substrate failures such
  as missing executable paths or denied run permission.
- Programmer errors still throw: malformed args, empty `cmd`, invalid byte caps, invalid timeout, or
  invalid kill grace.
- Decoded `text` is lazy and UTF-8 replacement decoding is acceptable when byte truncation cuts a
  codepoint. Raw bytes are authoritative.
- `toString()` follows current `Process.Output` convention: stdout when `success`, stderr otherwise.

## Command semantics

- No shell fallback, ever.
- `args` is always an argv array; no shell strings are accepted.
- `cmd` defaults to `Deno.execPath()` when omitted, matching current `Process.invoke` ergonomics.
- If `cmd` is provided, pass it directly to `Deno.Command`. The primitive is not a command resolver
  and does not add setup guidance.
- Stdin is explicitly `null`. If a future caller needs stdin input, that is a separate earned API.
- `capture` never writes child output to parent stdio. Live inherited output belongs to `inherit` or
  `spawn`.
- Preserve current environment behavior from `asCommand`: caller `env` is passed through, and
  `FORCE_COLOR` defaults to `1` unless the caller sets `env.FORCE_COLOR`.

## Stream and lifecycle algorithm

1. Validate inputs before spawning. If `signal.aborted` is already true, return `cancelled` without
   spawning a child.
2. Spawn with `Deno.Command(...).spawn()` using piped stdout/stderr and null stdin. Catch
   construction/spawn errors and return `failed-to-start`.
3. Start stdout and stderr read loops immediately and concurrently.
4. Each read loop copies bytes into a bounded buffer until its cap is reached. If a chunk crosses
   the cap, copy only the prefix that fits and mark that stream truncated.
5. After a stream cap is reached, keep draining that stream to EOF and discard bytes. Do not cancel
   a readable stream merely because its capture cap was reached; cancellation can create pipe
   pressure or child-visible write errors.
6. Race child status, timeout, and abort. The first observed terminal trigger wins. Pre-abort wins
   before spawn.
7. On timeout or abort, send SIGTERM, wait up to `killGraceMs`, then send SIGKILL if child status is
   still unsettled. Record each signal attempt in `termination.actions`.
8. After natural exit or forced termination, settle both stream readers, release reader locks, clear
   timers, remove abort listeners, and await child status exactly once.
9. Build the result only after stream draining and child-status cleanup have settled.

## Implementation constraints

- Do not use `Deno.Command.output()` for `capture`.
- Do not route through `Process.sh`, `Process.run`, shell template helpers, or shell command
  strings.
- Do not route through current `Process.spawn`; its readiness/event API is a different abstraction.
- Prefer direct child-handle control over `Process.Terminate.pid` because `capture` owns the
  `Deno.ChildProcess` handle and status promise.
- Use local `common.ts` surfaces and existing `Process` type-plane conventions.
- Add the public type contract first in `t.proc.ts`, then fulfill it in runtime code.

## OCR migration intent

After the upstream primitive exists, migrate the generated OCR PDF runtime to call it instead of its
local `runDenoCommand` implementation.

OCR-specific mapping remains local to OCR:

- `outcome: 'timed-out'` → structured OCR timeout error without Homebrew setup guidance
- `outcome: 'cancelled'` → structured OCR cancellation error without Homebrew setup guidance
- `outcome: 'failed-to-start'` → structured substrate/setup error with launcher-provided install
  command
- `stdoutTruncated` from `tesseract` → OCR result truncation semantics aligned with `maxChars`
- `stderrTruncated` → diagnostic detail only, never a prompt/tool contract expansion

## Tests

Add `@sys/process` tests that use only Deno itself as the child executable:

- captures stdout and stderr from argv execution
- preserves env pass-through and default `FORCE_COLOR` behavior
- returns nonzero exit status without throwing
- truncates stdout exactly at `maxStdoutBytes` and reports `stdoutTruncated: true`
- truncates stderr exactly at `maxStderrBytes` and reports `stderrTruncated: true`
- supports zero-byte caps while still draining child output to completion
- proves a child that writes far beyond the cap can still exit without pipe deadlock
- returns `timed-out` for a long-running child and records SIGTERM termination
- escalates SIGTERM → SIGKILL when the child handles SIGTERM but does not exit
- returns `cancelled` for a pre-aborted signal without spawning
- returns `cancelled` for an abort after spawn and records termination actions
- returns `failed-to-start` for a missing command path with `status: null`, `code: null`, and empty
  output
- keeps lazy text and `toString()` behavior aligned with `Process.Output`
- avoids leaking child processes, readers, abort listeners, or timers under
  `deno task test --trace-leaks ./src/m.process/-test/-m.Process.capture.test.ts`

## Acceptance

- `@sys/process` exposes one reusable no-shell bounded capture primitive: `Process.capture`.
- The primitive never buffers unbounded stdout/stderr in memory.
- Stream caps cannot deadlock the child because capped streams keep draining to EOF.
- Timeout and abort behavior is deterministic, race-bounded, and leak-free.
- The result model has no impossible terminal states.
- OCR can delete or shrink its local command runner after migrating to the upstream primitive.
- Future local tools such as Whisper/audio can reuse the same primitive without inventing another
  child-process runner.

## Non-goals

- No generic shell runner changes.
- No stdin-writing API.
- No command discovery, PATH policy, installer, or Homebrew dependency resolver in `@sys/process`.
- No OCR-specific policy, language, or setup behavior in `@sys/process`.
- No cloud, daemon, or service-process orchestration.
