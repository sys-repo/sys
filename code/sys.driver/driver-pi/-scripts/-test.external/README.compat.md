# Isolated Pi CLI compatibility proof

Run from `code/sys.driver/driver-pi`. To verify the current dependency-selected release:

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
- **The verification child never admits dependencies.** The reporting-host test copies the admitted
  cache and frozen lock into a fresh fixture, then executes `resolveRun` → `Raw.run` → the selected
  npm bin. Only the test seam tightens the child: `--cached-only`, `--deny-import`, `--deny-net`,
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
  and observed shutdown/exit with null stdin. ZIP/OCR are disabled in this reporting fixture; the
  canonical ZIP host proof remains separate.

These restrictions apply to the isolated child, not preceding task-runner initialization. With root
`nodeModulesDir: "auto"`, `deno task` can initialize workspace npm packages before the nested
command's frozen/cached-only flags apply. Do not treat the whole task invocation as an offline or
no-cache-write guarantee. The admitted-host lock and root workspace lock are separate graphs;
matching Pi archive integrity does not establish identical transitive resolutions. Production
retains its existing `--no-lock` behavior.

`test:compat:host` is an alias of the extended `test:reporting:host`, not another host harness.
Never broaden permissions, enable native execution, or substitute a different bootstrap to make a
candidate pass.

## Shared evidence limits

- The reporting host submits no prompt or provider request. Its observer requests shutdown, but
  null-stdin EOF can independently cause the observed exit: **shutdown causality is unisolated**.
- Initialization and captured exit do not prove RPC request/response, isolated EOF behavior,
  interactive input, TUI rendering, terminal restoration, production executable exit propagation, or
  HTTP/provider compatibility. Human terminal acceptance remains separate.
- Mocked lifecycle tests do not prove inherited-terminal behavior; a scripted local ZIP provider
  does not establish remote-provider compatibility. A passing recovery control does not establish
  compatibility of the current dependency-selected release.

## Scoped Pi 1.4.0 startup preload proof

The startup and quiet-production host checks passed on **Deno 2.9.8, aarch64-apple-darwin**. This
records a verified runtime, not a supported minimum or a guarantee for other Deno versions.
Admission metadata alone is not startup proof.

```sh
deno task test:compat:preload
deno task test:compat:admit --pi-version=1.4.0
deno task test:compat:startup
deno task test:compat:host --pi-version=1.4.0
```

`test:compat:preload` owns synthetic lifetime, failure, identity and concurrency controls; it does
not execute Pi. The startup task pins Pi 1.4.0, and the explicit host version keeps this recipe
release-specific even after dependency authority changes. The default-selection recipe above tests
that authority separately.

The synthetic controls show why the startup window is a safety requirement: persistent hooks and
unrelated loading before deregistration accept bare imports and import attributes that baseline
execution rejects. Support depends on the inspected bootstrap calling the fallback before other
runtime work. Any bootstrap change requires a new containment assessment, not merely extending the
version guard.

The startup task reuses this reporting-host fixture and the production generator with diagnostic
tracing enabled. Before substitution it asserts exactly one owned production preload, its position
immediately before the npm executable, and both materialized source files. It removes only that
Deno-prefix flag, preserving Pi passthrough arguments. Two fresh children then use the same admitted
fixture and launch vector, differing only by the diagnostic `--preload` flag. The no-preload child
must expose the missing-export baseline; if it works, stop and reassess instead of adding an
obsolete shim. The candidate must initialize and settle successfully.

Assertions cover the complete five-line official bootstrap, resolved npm-bin identity, exactly three
active hook edges, synchronous deregistration before runtime loading, real `createRequire` identity,
full native argv/cwd, CLI markers, and the existing context/tool/permission/shutdown observations.
Native CJS → ESM observer probes check npm module identity, valid JSON attributes, and rejection of
unmapped bare imports and unsupported attributes after deregistration. The same controls run on the
unmodified recovery host. Observer errors fail even when Pi exits zero.

Startup fixtures retain raw captures, launch vectors, admission identity, and source hashes under
`.tmp/report-host.*`; `verified.json` is written only after all startup assertions pass. Source
checks cover the adapter, manifest, CLI entry/runtime entry, and frozen lock, not a second archive
verifier. This lane proves initialization through a diagnostic adapter, not production adoption. The
reporting fixture's child restrictions and shared evidence limits apply unchanged.

### Production, recovery and lifecycle checks

For exactly `npm:@earendil-works/pi-coding-agent@1.4.0`, the launcher creates a quiet, per-launch
Deno preload before the untouched official npm executable. When `node:module` lacks the named
`enableCompileCache` export, only the main import receives a facade preserving the real exports. Its
zero-argument fallback returns disabled status and synchronously deregisters the hook before Pi
loads its runtime. Present exports, including invalid values, are not replaced. Other package
selections receive no preload; this is not a general Node compatibility layer.

Owned adapter files live under `.pi/@sys/tmp/pi-preload.*`. They are removed after known pre-spawn
failure or confirmed child exit. An uncertain launch/status rejection retains and reports the
folder; cleanup failure is reported without replacing the original error or exit status. Child
permissions and inherited terminal IO are unchanged.

`test:compat:host --pi-version=1.4.0` runs the quiet production adapter without substitution and
checks cleanup after confirmed child exit. `--pi-version=0.85.1` exercises recovery with no adapter.
Raw-run unit tests own pre-spawn failure, uncertain-settlement retention/reporting, cleanup-failure,
exit-status, concurrent-launch, and exact-selection assertions. `test:host` reuses the admitted
cache/lock for the canonical ZIP host, adds frozen/offline restrictions without replacing the
production preload, and verifies the public queue binding and generated extraction with a scripted
local provider.
