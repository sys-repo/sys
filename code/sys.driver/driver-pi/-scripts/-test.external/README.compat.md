# Isolated Pi CLI compatibility proof

Run from `code/sys.driver/driver-pi`:

```sh
deno task test:compat:admit
deno task test:compat:host
```

Both default to dependency authority. To investigate one exact official release, pass the same
`--pi-version` to both tasks. For example, the historical negative reproduction is:

```sh
deno task test:compat:admit --pi-version=0.86.1
deno task test:compat:host --pi-version=0.86.1
```

On Deno 2.9.7 this verification **fails**, with the npm CLI's missing `enableCompileCache` export.
There is no expected-failure acceptance mode or assertion that an old release must fail forever. Use
`deno task test:compat:unit` for the small input/argv regressions.

## Admission versus verification

- **Admission intentionally downloads** official npm artifacts with `deno cache`, without executing
  Pi or npm lifecycle scripts. It uses a cleared environment, owned HOME/temp/cache, and a
  standalone config/lock under `.tmp/pi-compat/<version>`. Its receipt records registry, executable
  metadata, archive integrity, lock digest, runtime, and date. Reusing a completed admission does
  not refresh it. Do not run concurrent admissions for the same version. Failed admissions are
  retained for inspection, not silently retried or removed.
- **Verification never admits dependencies.** The reporting-host test copies the admitted cache and
  frozen lock into a fresh fixture, then executes `resolveRun` → `Raw.run` → the selected npm bin.
  Only the test seam tightens the child: `--cached-only`, `--deny-import`, `--deny-net`,
  `--deny-run`, and `--deny-ffi`, plus Pi's documented `--offline` / `PI_OFFLINE=1`. Neither parent
  permissions nor Pi offline mode alone confines child networking; native run/FFI lanes are denied
  too.
- Child credentials, proxies, sessions, and Pi markers are not inherited. HOME, agent state, temp,
  and cache are fixture-owned. Capture is bounded to 120 seconds, 64 KiB stdout, and 256 KiB stderr.
  Truncation or abnormal settlement fails; uncertain settlement retains the fixture.
- Parent `TMPDIR`, `TMP`, and `TEMP` are fixture-scoped during both profile resolution and raw
  launch, then restored on success or failure. Tests reject shared `.tmp` grants and query
  non-granted child read/write access to sibling and admission paths without touching those files.
- Success requires the direct child result, fresh profile/context assembly, real generated
  filesystem-tool registration and activation, child permission observations, and cooperative RPC
  startup/shutdown. No prompt or provider request is submitted. ZIP/OCR are disabled in this
  fixture; the canonical ZIP host proof remains separate.

`test:compat:host` is an alias of the extended `test:reporting:host`, not another host harness. A
passing recovery control proves the check, not current-Pi compatibility. This does not prove TUI
rendering, keyboard handling, terminal restoration, or production executable exit propagation. Never
broaden permissions, enable native execution, or substitute a different bootstrap to make a
candidate pass.
