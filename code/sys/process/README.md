# @sys/process

Run and manage child processes in Deno on POSIX systems such as macOS and Linux. These helpers use
native Deno and host-process APIs, not just portable web APIs.

The root and [`/process`](https://jsr.io/@sys/process/doc/process) export `Process`:

- `capture` runs a command and its arguments without a shell, retaining bounded stdout and stderr.
- `inherit` shares the parent's standard streams, suitable for interactive commands.
- `spawn` returns a child handle with streaming output. Await its disposal when finished.
- `sh` and `run` execute shell scripts. Do not interpolate untrusted input into shell source.

## Capture command output

```ts
import { Process } from 'jsr:@sys/process';

const result = await Process.capture({
  cmd: 'deno',
  args: ['--version'],
  clearEnv: true,
  executionTimeout: 5_000,
  maxStdoutBytes: 4_096,
  maxStderrBytes: 4_096,
});

if (!result.success) throw new Error(`Command ${result.outcome}: ${result.text.stderr}`);
if (result.stdoutTruncated || result.stderrTruncated) {
  throw new Error('Command output was truncated.');
}

console.info(result.text.stdout);
```

The example needs permission to execute `deno`. `clearEnv` removes inherited environment values;
explicit `env` values and the library's command defaults still apply.

Byte caps limit what is retained, not how long the child runs. `executionTimeout` bounds execution
before termination and cleanup; it is not a deadline for the whole call.

A nonzero exit is a result, not an exception: `outcome: 'exited'` with `success: false`. Timeout,
cancellation, failure to start, and post-spawn failure have distinct outcomes. Invalid arguments may
reject the call. Capture owns child cleanup. Check the result and truncation flags before treating
output as complete. See the [API documentation](https://jsr.io/@sys/process/doc/process) for
cancellation and failure details.

## Child ownership and host authority

`Process.spawn` and `Process.capture` acquire a `Deno.ChildProcess`: a handle with authority over
that child. Starting it requires permission for the chosen executable. Cleanup signals the owned
handle directly; it does not need permission to signal arbitrary process IDs.

In contrast, `Process.isRunning`, `Process.Terminate.pid`, and `Process.Terminate.port` inspect or
signal arbitrary host processes. They require the corresponding host-command and PID-signalling
permissions—ambient authority, separate from the child handle. Do not use them as substitutes for
disposing a child you own.

## Tests with restricted permissions

Tests ending in `.process.ts` stay outside default `*.test.ts` discovery. Each must be named
explicitly in a package task that selects its matching restrictive permission profile. Adding the
file without that task is not evidence that the boundary was tested.

- `deno task test:process` tests child cleanup with executable authority limited to `deno`.
- `deno task test:retention` tests release of owned references with exposed GC and no runtime
  permissions. It uses injected children, not OS processes.
- `deno task test:unit` uses broader test permissions and cannot prove either boundary.
