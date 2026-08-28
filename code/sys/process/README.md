# Process

Host-process and child-process capabilities for modern POSIX-based systems (macOS, Linux, and
similar “unix-like” environments) using Deno (aka. [WinterTC](https://wintertc.org/) compatible)
runtimes.

## Authority model

`Process.spawn` and `Process.capture` acquire a capability-bearing `Deno.ChildProcess`. Spawning
requires authority for the selected executable; cleanup signals that owned handle directly and does
not require ambient authority to signal arbitrary PIDs.

`Process.isRunning`, `Process.Terminate.pid`, and `Process.Terminate.port` are intentionally
separate ambient host operations. They inspect or signal arbitrary process IDs and require the
corresponding host-command and PID-signalling permissions. Do not use them as substitutes for
owned-child disposal.

## Permission-scoped process proofs

Files ending in `.process.ts` are permission-bound Deno tests that deliberately stay outside default
`*.test.ts` discovery. Each such file must be named explicitly by a package task and run through the
matching restrictive permission profile; adding the file without task wiring is not evidence.

In this package:

- `deno task test:process` runs the finite-authority proof with only Deno as executable authority;
- `deno task test:retention` runs the exposed-GC ownership proof with no runtime permissions;
- `deno task test:unit` uses broader test permissions and cannot prove either boundary.
