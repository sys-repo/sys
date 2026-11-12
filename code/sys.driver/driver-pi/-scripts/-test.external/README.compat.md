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
  filesystem-tool registration and activation, child permission observations, CLI initialization,
  and observed shutdown/exit with null stdin. The observer requests shutdown, but its causal role is
  not isolated from EOF. No prompt or provider request is submitted. ZIP/OCR are disabled in this
  fixture; the canonical ZIP host proof remains separate.

`test:compat:host` is an alias of the extended `test:reporting:host`, not another host harness. A
passing recovery control proves the check, not current-Pi compatibility. This does not prove TUI
rendering, keyboard handling, terminal restoration, or production executable exit propagation. Never
broaden permissions, enable native execution, or substitute a different bootstrap to make a
candidate pass.

## Scoped Pi 1.4.0 startup preload proof

```sh
deno task test:compat:admit --pi-version=1.4.0
deno task test:compat:startup
deno task test:compat:host
```

The startup task reuses this reporting-host fixture and the synthetic proof's unchanged generator.
It pins the experiment to 1.4.0; it does not change dependency selection or production launch code.
Two fresh children use the same admitted fixture and launch vector, differing only by the owned
`--preload` flag. The no-preload child must expose the missing-export baseline; if it works, stop
and reassess instead of adding an obsolete shim. The candidate must initialize and settle
successfully.

Assertions cover the complete five-line official bootstrap, resolved npm-bin identity, exactly three
active hook edges, synchronous deregistration before runtime loading, real `createRequire` identity,
full native argv/cwd, CLI markers, and the existing context/tool/permission/shutdown observations.
Native CJS → ESM observer probes check npm module identity, valid JSON attributes, and rejection of
unmapped bare imports and unsupported attributes after deregistration. The same controls run on the
unmodified recovery host. Observer errors fail even when Pi exits zero.

Startup fixtures retain raw captures, launch vectors, admission identity, and source hashes under
`.tmp/report-host.*`; `verified.json` is written only after all startup assertions pass. Source
checks cover the adapter, manifest, CLI entry/runtime entry, and frozen lock, not a second archive
verifier. This proves CLI initialization, an observer shutdown request, and observed shutdown/exit
with null stdin; **shutdown causality is unisolated**. It does not prove **RPC request/response,
independently isolated EOF behavior, TUI, HTTP/provider behavior, or production adoption**.
Network/native-execution denials remain unchanged; ZIP/OCR stay disabled. Persistent hooks and
additional work in the active window remain outside the supported design.
