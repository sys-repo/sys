# Deno capability owners and public facades

Governing plan: [deno-api-containment.plan.md](../deno-api-containment.plan.md).

## Evidence boundary

- Repository: `/Users/phil/code/org.sys/sys`.
- Base revision: `e3b89d7d87d4ba0b2e8300459ede301c0a77aaba`. The current environment findings also
  include concurrent unstaged changes to `code/sys/fs/src/m.Env/t.ts`, `u.load.ts`, and `-.test.ts`,
  reopened during review adjudication. Those changes add process-only `search: 'none'`; they were
  not authored here and are outside this documentation commit. The base commit alone does not
  contain that mode. Other concurrent driver-vite changes were left untouched.
- Starting tracked worktree and index: no changes. The governing plan and six unrelated plan-path
  groups were untracked. They are not evidence that capability implementation changed.
- This item adds only this document. No source, dependency, configuration, permission, or task
  changes; no tests, subprocess fixtures, network services, upgrades, or Git mutations were
  executed.
- Evidence is live local source: public export mappings, contracts, adapter implementations, and
  selected test assertions. Test source is not a passing test result. Partial test reads support
  only the cases named below, not whole-suite coverage.
- During the pass, unrelated untracked driver-vite test files appeared at
  `code/sys.driver/driver-vite/-scripts/-test/-task.test.test.ts` and
  `code/sys.driver/driver-vite/-scripts/-test/u.fixture.task.argv.ts`. They were not read, edited,
  or included in this item. Repository-wide inactivity is not claimed.

This is an owner map, not the repository-wide consumer inventory. Screening concentrated on
`code/sys/{fs,process,cli,net,http,server,std,types,testing}` and
`code/sys.driver/driver-deno/src/m.runtime`, with focused discovery in other driver/tool sources.
`rg` located candidates; file reads determined the findings. No occurrence totals or exhaustive
alias, dynamic-import, generated-source, dependency-closure, or runtime-portability claims are made.

No caches, installed dependencies, generated bundles, secret files, or external registry sources
were used as API authority. Repository-wide coverage, exact exclusions, and individual consumer
decisions belong to `inventory.md`. A missing facade below means none was established in the
inspected public surfaces, not proof that no such API exists anywhere.

## Public ownership index

Each import path was checked against its owning `deno.json` and the corresponding export wiring.
Symbols below are existing APIs, not proposals.

- Ordinary filesystem operations: `@sys/fs` → `Fs`.
- Lightweight observations: `@sys/fs/observe` → `lstat`, `realPath`.
- Resource paths: `@sys/std/path` → `Path`; host extension `@sys/fs/path` → `Path`.
- Bounded stable file reads: `@sys/fs/snapshot` → `Snapshot.file`.
- Files backing and confined publication: `@sys/fs/capability` → `FsCapability.Files`,
  `FsCapability.Rooted`.
- Distribution verification: `@sys/fs/pkg/dist/verify` → `Local`, `Pinned`, `Inventory`.
- Watching: `@sys/fs/watch` → `Watch.start`; also `Fs.watch`.
- Process-only or dotenv-backed environment: `@sys/fs/env` → `Env.load`, `Env.Is`, `Env.init`.
- Child processes and host stdout: `@sys/process` or `@sys/process/process` → `Process`.
- OS URL/path opening: `@sys/process` → `Open`.
- Terminal capabilities: `@sys/cli` → `Cli`; managed input also `@sys/cli/keyboard` → `Keyboard`.
- TCP attempts and port selection: `@sys/net` → `Net.connect`, `Net.Port`, `Net.port`.
- HTTP application/listener lifecycle: `@sys/http/server` → `HttpServer`; narrower
  `@sys/http/server/host` → `create`, `start`.
- Typed Cmd WebSocket hosting: `@sys/server/websocket` → `WebSocketServer.create`,
  `WebSocketServer.start`.
- Deno-native BDD: `@sys/types/testing` → `describe`, `it`, hooks; preferred consumer surface
  `@sys/testing`.
- Argument parsing, not argv acquisition: `@sys/std/args` → `Args.parse`; also `Cli.args`.
- Structural address classification: `@sys/std/is` → `Is.netaddr`.
- Deno executable management: `@sys/driver-deno/runtime` → `DenoVersion`, `DenoDeps`, `DenoFile`,
  `DenoTask`.

## 1. Filesystem and paths

### Ordinary operations

Contract and wiring:

- `code/sys/fs/deno.json`
- `code/sys/fs/src/m.Fs/t.ts`
- `code/sys/fs/src/m.Fs/m/m.Fs.ts`

Direct host adapters inspected under `code/sys/fs/src/m.Fs/u/`:

- `u.read.ts`: `Deno.readFile`; text decoding and parsed result construction.
- `u.write.ts`: `Deno.writeFile`, `Deno.writeTextFile`.
- `u.stat.ts`, `u.lstat.ts`: metadata calls and `Deno.errors.NotFound` translation.
- `u.realPath.ts`, `u.rename.ts`: native canonical-path and rename operations.
- `u.remove.ts`: `Deno.remove`, missing-path handling, and selected retry behavior.
- `u.copy.file.ts`: `Deno.copyFile` behind copy policy.
- `u.makeTmpDir.ts`: `Deno.makeTempDir` projected into an `FsDir` handle.
- `u.walk.ts`: native starting-path stat plus `@std/fs` traversal.
- `u.cwd.ts`: `Deno.cwd`; terminal cwd additionally reads `Deno.env.get('INIT_CWD')`.

These are adapter locations, not a package-wide exemption. Higher-level filesystem compositions
still need individual assessment.

Compatibility constraints:

- `Fs.read`/`readText` normally return `{ ok, exists, path, data?, error?, errorReason? }`, not
  native bytes/text. Read failures are captured, but preflight path resolution/existence checks can
  still throw. Text decoding is fatal UTF-8; invalid bytes become `DecodingError`.
- `Fs.write` creates parents, defaults to overwrite, and normally returns errors as values. Native
  write option bags are not its contract; `{ throw: true }` affects rejection, not all other policy.
- `Fs.copyFile` defaults to no overwrite and parent creation, returns `{ error? }`, and supports
  policy/filtering. It is not a transparent `Deno.copyFile` alias.
- `Fs.stat`/`lstat` return `undefined` for missing paths and propagate other failures. Symlink
  behavior differs between the two. `Fs.FileInfo` remains an alias of `Deno.FileInfo`.
- `Fs.remove` defaults to recursive deletion, returns false for absence, and retries selected
  errors. `{ recursive: false }` does not restore native missing-path behavior.
- `Fs.rename` has no copy/delete fallback. `Fs.realPath` is a native function reference captured at
  import. Neither a metadata observation nor canonicalization proves stable identity or confinement.
- `Fs.makeTempDir` returns a handle, not a path string. `Fs.cwd()` is process cwd;
  `Fs.cwd('terminal')` adds the `INIT_CWD` convention and environment authority.

The lighter observation export is wired in `code/sys/fs/src/-exports/-observe.ts`. Its `lstat`
implementation intentionally avoids the composed Fs/CLI import graph. Prefer that established entry
when its narrower contract is sufficient; do not pull in all of Fs just to remove a textual match.

### Path ownership

`code/sys/std/src/m.Path/m/m.Path.ts` owns shared path composition and delegates selected operations
to `@std/path`. `Path.join` uses the system's join selection; explicit POSIX/Windows forms exist.
Relative resolution may depend on host cwd. It is not a universal URL operation or a security proof.

`code/sys/fs/src/m.Path/m.Path.ts` extends that surface with host `cwd`, filesystem-aware `asDir`,
and `trimCwd`. It captures `Deno.cwd` as `Path.cwd`; `trimCwd` reads cwd when none is supplied.
Choose the existing semantic path surface before introducing host filesystem dependencies.

### Stronger filesystem contracts

Do not flatten these into ordinary reads/writes to reduce Deno references:

- **Snapshot:** `code/sys/fs/src/m.Snapshot/{mod.ts,t.ts}` and `u/u.file.ts` expose bounded stable
  single-file reads. `u/u.io.ts` captures `Deno.lstat` and `Deno.open`; handle reads/stats/close
  remain owner-controlled. Options require root, path, byte bound, and timeout. Results distinguish
  device/inode from metadata-only evidence; failures include cancellation, drift, and permission
  denial. A sequence of `Fs.stat` and `Fs.read` is not an equivalent protocol.
- **Files capabilities:** `code/sys/fs/src/m.Fs.capability/{mod.ts,t.ts}` and
  `m.Files/m.Files.toWritable.ts` expose structural readonly/writable/live backing APIs.
  `u/u.Files.atomic.ts` uses `Deno.open({ createNew: true })`, complete writes, sync, close, and
  same-directory rename. Its `removeEntry` is nonrecursive and rejects absence. General `Fs.write`
  and `Fs.remove` have different contracts.
- **Rooted:** `code/sys/fs/src/m.Fs.capability/m.Rooted/t.ts` owns admission, publication, leases,
  sealing, and tree removal. `u/u.io.ts` captures native filesystem operations and uses a Node file
  handle for descriptor-bound chmod. Unsupported identity/mode evidence is a failure, not permission
  to weaken checks. Rooted is not an OS sandbox against hostile same-user processes.
- **Dist verification:** `code/sys/fs/src/-exports/-pkg.dist.verify.ts`, `m.Pkg.Dist/m.Local.ts`,
  and `m.Pkg.Dist/m.Pinned.ts` expose verification and checksum-matched reads.
  `m.Pkg.Dist/u.verify/u.io.ts` owns lstat/open/readDir/realPath and selected error translation.
  `Inventory` is explicitly no-I/O accounting, not verification; `Pinned.readPart` does not
  establish inventory membership.

`Deno.FsFile`/`FileInfo` and native error identities belong in the inventory's separate type track.
Raw open/read/write/lock/metadata sequences can be necessary adapter mechanics when their exact
identity or exclusivity semantics cannot be expressed by an ordinary facade.

## 2. Watchers and environment

**Watching:** `code/sys/fs/src/m.Watch/{t.ts,m.Watch.ts}` owns `Deno.watchFs`, native watcher close,
and `Deno.FsEvent`. `Watch.start` defaults to recursive, returns an observable lifecycle handle,
checks path existence, and closes on disposal. Missing paths produce a handle with error
information; native watcher construction can still throw. Nonrecursive filtering adds owner
semantics. Do not replace native async iteration without accounting for event delivery, setup
errors, and cleanup.

**Environment:** `code/sys/fs/src/m.Env/{t.ts,u.load.ts,m.Is.ts}` owns process-only or dotenv-backed
reading and VSCode detection. `Env.load` is asynchronous. Its search modes are:

- `cwd` (default): load cwd-local `.env`.
- `upward`: merge ancestor dotenv files, with nearer values winning.
- `none`: `Env.load({ search: 'none' })` creates a process-only reader without acquiring cwd or
  looking up dotenv files. The live implementation skips that branch even when `cwd` is supplied.

Loaded dotenv values take precedence over live process values in the file-backed modes. In all
modes, `Reader.get` maps absence to `''`; `has` distinguishes absence from present-empty. Process
fallback is evaluated on each read, so the process-only reader observes subsequent set/delete
operations. Environment permission checks still belong to the native get/has calls.

The adapter uses `Deno.cwd`, `Deno.stat`, `Deno.env.get`, and `Deno.env.has`; VSCode detection uses
`Deno.env.toObject` on access. Skipping file lookup is an operation-level property, not proof that
the imported module graph is permissionless or portable.

Process-only reads now have an existing facade: do not classify them as a gap merely because the
default mode loads dotenv. It is still not a drop-in `Deno.env.get`: construction is asynchronous,
and absent values are `''`, not `undefined`. No general set/delete/toObject facade is established.
Do not introduce dotenv precedence or IO accidentally. No actual `.env` content was read here.

## 3. Processes, stdio, and OS opening

Contract and wiring: `code/sys/process/deno.json`, `src/mod.ts`,
`src/m.process/{m.Process.ts,t.proc.ts}`. Runtime adapter files are under `src/m.process/`:

- `u/u.ts`: constructs `Deno.Command`; defaults the executable to `Deno.execPath()` and injects
  `FORCE_COLOR=1` unless explicitly overridden.
- `u.proc/u.invoke.ts`: buffered invocation and detached child spawn/unref. Ordinary invocation
  prints selected output unless `silent`; nonzero exit is output status, not automatically a throw.
- `u.proc/u.inherit.ts`: inherited stdin/stdout/stderr and awaited native status, without capture.
- `u.proc/u.capture.ts`: no-shell bounded capture, result variants, cancellation, and execution/
  termination handling. Output byte bounds are required. Failed acquisition is distinct from exit.
- `u.proc/u.spawn.ts` and `u/u.child.owned.ts`: owned `Deno.ChildProcess`, native status,
  child-handle signalling, stream settlement, and readiness. Public spawn cleanup has an aggregate
  budget and may reject; owned-child disposal must not be replaced with ambient PID signalling.
- `u/u.pid.ts`: arbitrary-PID checks use a host `kill -0` command; termination uses `Deno.kill` and
  bounded escalation. `Process.isRunning` and `Process.Terminate.pid/port` require ambient
  authority.
- `u/u.port/u.discovery.ts`: listener discovery runs `lsof`, or Linux `ss`; this is distinct from
  `Net.Port`'s available-port probing.
- `u/u.stdout.ts`: captures `Deno.stdout` at module evaluation. `Process.stdout.write` synchronously
  writes complete UTF-8 text, loops over partial writes, and throws on no progress. `isTerminal`
  returns false on failure. It is not an async byte writer or a general stdin/stderr abstraction.

Types still expose `Deno.Signal` and `Deno.CommandStatus`; internal adapters use `Deno.ChildProcess`
and `Deno.CommandOutput`. Deno option bags, piped stdin, and raw child handles are not automatically
expressible through every Process method. Match the actual IO and authority contract.

`code/sys/process/src/m.open/{m.Open.ts,u.resolveCommand.ts,u.invokeDetached.ts}` owns `Open`. It
selects OS launchers using `Deno.build.os`, delegates to `Process.invokeDetached`, and has Linux/
WSL fallbacks for missing executables. This is URL/path opening policy, not a generic platform-facts
facade and not proof that arbitrary command invocations should use `Open`.

## 4. Terminal capabilities

Public wiring: `code/sys/cli/deno.json`, `src/m.core/m.Cli/mod.ts`, and
`src/m.core/m.Keyboard/mod.ts`. The terminal owner is `Cli`, not arbitrary direct stdio use.

- **Detection:** `src/m.core/m.Is/{t.ts,u.terminal.ts}` supplies `Cli.Is.terminal` and
  `interactive`. It captures Deno standard-stream providers at import and rechecks authority on use;
  absent, changed, or failing providers yield false. A fresh global method call has different trust
  behavior.
- **Screen:** `src/m.core/m.Screen/{mod.ts,t.ts,u.platform.ts,u.size.ts}` supplies `Cli.Screen`. The
  adapter reads `Deno.consoleSize`, uses a captured Node-style fallback, and owns SIGWINCH
  attachment/removal. `size` returns normalized dimensions with 80x24 fallbacks, not native failure.
- **Keyboard:** `src/m.core/m.Keyboard/{t.ts,u.bind.ts,u.input.ts}` separates managed bindings from
  raw Cliffy keypress. Managed native input currently uses `node:process.stdin`, not a direct Deno
  read loop. Nonterminal bind returns undefined; bindings share input ownership, and shutdown must
  await callbacks/release. Replacing Deno calls with Node calls is not itself the containment goal.
- **CLI lifetime:** `src/m.core/u/u.keepAlive.ts` installs/removes SIGINT handling and eventually
  calls `Deno.exit`. `Cli.keepAlive` terminates the host; it is not a general signal subscription.
- **Clipboard:** `src/m.core/u/u.clipboard.ts` owns OS utility selection, `Deno.Command` with piped
  stdin, and a structured result through `Cli.copyToClipboard`. This is a real domain facade, but
  its internal command call still needs semantic assessment against Process; no piped-stdin
  replacement was established here.

Keep captured-provider checks, raw-input restoration, and cleanup failures intact. Package
membership alone does not exempt every direct Deno call within CLI code.

## 5. Networking and servers

**TCP and ports:** `code/sys/net/deno.json`, `src/m.Net/{t.ts,m.Net.ts,m.Port.ts}`, and
`src/m.Net/u/u.connect.ts` establish `Net` as the owner. Native substrate is `Deno.listen`,
`Deno.NetAddr`, `Deno.connect`, and returned `Deno.TcpConn` handles. `Net.connect` retries and
returns `{ socket?, error? }`; callers still own socket close. `Net.Port.get` performs bounded
selection, propagates non-conflict refusal, and returns zero without probing when zero is explicit.
`Net.Port.inUse` conservatively treats failed discovery as in-use. Probing does not reserve a port.
These are not a generic TCP listener, TLS, UDP, or raw socket API.

**HTTP:** `code/sys/http/deno.json`, `src/http.server/m.HttpServer/{t.ts,m.Server.ts}`,
`m.Server.create.ts`, `m.Server.host.ts`, and `u/u.start.ts` establish two intentional entries:

- `HttpServer.create` from `@sys/http/server` defaults to CORS and static-file middleware.
- Named `create` from `@sys/http/server/host` creates a bare Hono app without those authorities.
- `start` owns `Deno.serve`, address selection, `Deno.HttpServer`, status, optional keyboard, and
  joined shutdown/completion/keyboard disposal. Default hostname is loopback. It is not a drop-in
  replacement for every native ServeOptions/handler combination. Native `finished` is not the full
  managed cleanup promise. Public contracts still expose Deno serve/server/address types.

**WebSocket Cmd hosting:** `code/sys/server/deno.json`,
`src/m.server.websocket/{mod.ts,t.ts,u/u.create.ts,u/u.start.ts}` establish `WebSocketServer`. It
owns `Deno.serve`, `Deno.upgradeWebSocket`, native address-in-use classification, Cmd attachment,
connection cleanup, and optional process signals. `create` is caller-lifecycle-owned; `start`
defaults to manual lifecycle and can explicitly bind process lifecycle. This is a typed Cmd server,
not a universal replacement for every WebSocket upgrade handler.

A separate adapter was found in
`code/sys.driver/driver-automerge/src/m.worker/u.host.publishCommands.ts`: it directly serves and
upgrades a CRDT command endpoint and does not retain the Deno server handle in that function.
Whether it should compose the existing server owner is an inventory/design question involving
lifecycle and dependency direction, not an automatic exception for drivers or a proven substitution.

## 6. Test runner, arguments, and runtime tooling

**BDD:** `code/sys/types/deno.json` exports `src/-test/mod.ts` as `@sys/types/testing`.
`src/-test/m.Bdd.ts` owns `Deno.test` and `Deno.TestDefinition`/`TestContext`/step adaptation.
Top-level permission, timeout, and sanitizer policy is forwarded; nested permission/timeout settings
are rejected because step execution cannot enforce them. Public test bodies still expose native
context types.

`code/sys/std/src/m.Testing/{mod.ts,m.Bdd.ts,libs.ts,common.ts}` re-exports this adapter through
`@sys/std/testing`. `code/sys/testing/deno.json` exports `src/m.client/mod.ts` at the root, which
re-exports `@sys/std/testing`. Thus the ordinary consumer surface remains `@sys/testing`; direct
Deno registration is legitimate at the runner adapter and in tests specifically exercising native
runner behavior, not automatically throughout all test setup.

**Arguments:** `code/sys/std/src/m.Args/{mod.ts,t.ts,u.parse.ts}` owns `Args.parse`. Its default
input is `[]`, not `Deno.args`. `Cli.args` is the same parser. Native argv acquisition remains an
entrypoint effect; passing the vector into pure parsing is already the existing split.

**Deno tooling:** `code/sys.driver/driver-deno/deno.json` and `src/m.runtime/mod.ts` export
`DenoDeps`, `DenoFile`, `DenoTask`, and `DenoVersion`. Only `DenoVersion` received an implementation
trace here: `m.DenoVersion/{t.ts,u.current.ts,u.authority.ts}`. Current version is obtained from a
selected executable's `--version`; authority detection uses `Deno.execPath`, HOME, canonical paths,
and optional executable lookup. It is not equivalent to reading the running isolate's
`Deno.version.{deno,v8,typescript}`. Upgrade APIs are real mutation surfaces; none were invoked. The
other three exports are established entrypoints, not fully audited owners of all task/dependency
operations.

## 7. Explicit gaps and limits

Do not invent a general Runtime object to fill these:

- **Raw environment mutation/snapshot:** `Env.load({ search: 'none' })` already provides live
  process-only get/has. Its missing-value and asynchronous-construction semantics differ from native
  access; no set/delete/toObject facade was established. Native equivalence remains
  consumer-specific.
- **Host exit and metadata:** no universal facade was established for `Deno.exitCode`, pid/ppid,
  build facts, or running-isolate version facts. Domain-specific uses exist, such as
  `code/sys/workspace/src/m.info/u.stats.ts` reporting Deno/V8/TypeScript versions and
  `code/sys.driver/driver-vite/src/common/u.perf.ts` reporting its host pid. `DenoVersion.Current`
  is not a substitute for those facts. Entry/process lifecycle ownership must be resolved first.
- **Permissions:** no general query/request/revoke facade was established. Existing test policy
  forwarding and domain authority checks are not ambient permission grants. Preserve native refusal;
  require a concrete consumer before proposing a new shared API.
- **Unmatched native IO:** generic file handles, synchronous operations, arbitrary command options,
  piped stdin, and general stdin/stderr do not all fit the inspected convenience surfaces. Confirm
  exact need and owner rather than weakening exclusivity, error identity, or cleanup.
- **Native errors and public types:** structured result/error facades do not replace native
  `instanceof` or exact-prototype contracts automatically. `code/sys/std/src/m.Is/{t.ts,m.Is.ts}`
  exposes `Is.netaddr` as a structural predicate returning `input is Deno.NetAddr`; it does not
  construct or authenticate a native address. This is type coupling without native runtime IO.
  Runtime call containment and removal of public Deno type exposure are separate changes.
- **Additional families:** workers and Deno-specific worker options, TLS/UDP, custom HTTP clients,
  FFI, KV, system metrics, and other native facilities were not comprehensively traced. This neither
  asserts existing usages nor declares missing APIs; the whole-repository inventory must discover
  relevant consumers and extend the map when evidence requires it.

## 8. Import direction and module evaluation

A facade is not automatically a safe dependency for every consumer:

1. `Process` imports its stdout adapter, which captures `Deno.stdout` during module evaluation.
2. `code/sys/cli/src/common/libs.ts` re-exports Process; CLI formatting's common chain reaches that
   barrel. `code/sys/fs/src/common/libs.ts` re-exports CLI formatting and crypto formatting. Broad
   Fs/CLI adoption can introduce eager host coupling even when a particular operation is deferred.
3. CLI terminal/screen adapters capture runtime providers and monitor their authority; Rooted and
   Snapshot capture native filesystem operations. Moving reads or replacing providers changes the
   initialization/trust boundary, not just the namespace spelling.
4. Use the narrowest existing public entry compatible with the consumer. Preserve lower-level owner
   boundaries; do not import Fs into a universal path helper or a higher-level server into a lower
   transport primitive merely to hide a Deno reference. Full transitive closure remains unverified.

## 9. Inspected test evidence, not executed proof

Selected existing assertions were opened at these paths:

- `code/sys/fs/src/m.Fs/-test/-fs.read.test.ts`: structured success/missing/decoding/parse results.
- `code/sys/fs/src/m.Fs/-test/-fs.write.test.ts`: recursive removal, nonrecursive refusal, absence,
  retries, and string/binary writes.
- `code/sys/std/src/m.Path/-test/-.test.ts`: host/explicit-platform joining and path boundary cases.
- `code/sys/fs/src/m.Env/-.test.ts`: cwd-only versus upward dotenv lookup and process fallback; the
  concurrent `search:"none"` case checks ignored dotenv content, live process updates, present-empty
  values, and missing keys. These assertions were inspected, not executed.
- `code/sys/fs/src/m.Watch/-.test.ts`: facade identity, lifecycle, and missing-path handles.
- `code/sys/fs/src/m.Snapshot/-test/-stability.test.ts`: identity evidence downgrade, drift
  rejection, and owned-handle closure.
- `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-publishFile.test.ts`: complete publication and
  occupied-target refusal.
- `code/sys/fs/src/m.Fs.capability/-test/-m.Files.toWritable.test.ts`: model adoption and symlink
  authority boundaries.
- `code/sys/fs/src/m.Pkg.Dist/-test/-local.readPart.io.test.ts`: root-contained IO, checksum/size
  rejection, owned returned bytes, and pre-IO cancellation.
- `code/sys/process/src/m.process/-test/-u.stdout.test.ts`: partial-write completion, terminal
  fallback, and stalled-write rejection.
- `code/sys/process/src/m.process/u.proc/-test/-u.capture.test.ts`: exit/nonzero/acquisition
  variants and environment/color policy.
- `code/sys/cli/src/m.core/m.Screen/-test/-u.platform.test.ts`: Deno/Node measurement selection,
  dimension validation, and resize cleanup.
- `code/sys/cli/src/m.core/m.Keyboard/-test/-u.bind.test.ts`: retryable release and stop ordering.
- `code/sys/net/src/m.Net/-test/-m.Port.selection.test.ts`: bounded search, refusal, and zero
  policy.
- `code/sys/net/src/m.Net/-test/-u.connect.test.ts`: successful connection and unreachable result.
- `code/sys/http/src/http.server/m.HttpServer/-test/-u.start.settlement.test.ts`: joined cleanup,
  shared completion, and preserved failure ordering.
- `code/sys/server/src/m.server.websocket/-test/-u.lifecycle.test.ts`: caller-owned close and
  keyboard-release ordering.
- `code/sys/types/src/-test/-Bdd.test.ts`: hook ordering and native context forwarding.
- `code/sys/testing/src/-test/-bdd-contract.test.ts`: subprocess scenarios for nested policy
  rejection, focus, registration, and teardown behavior.
- `code/sys.driver/driver-deno/src/m.runtime/m.DenoVersion/-test/-m.DenoVersion.test.ts`: executable
  selection, version parsing, upgrade command construction, and authority detection using fixtures.

Owning configurations were inspected for fs, process, cli, net, http, server, std, types, testing,
and Deno driver. They declare check/test surfaces, including dedicated process/keyboard/browser
lanes. None were run for this documentation-only item. Some tests acquire processes, sockets,
terminal or filesystem resources; their presence is not execution authority for a later pass. Native
error, platform, and permission behavior still requires the relevant owner-level proof before
migration.

## Review adjudication

The supplied review's environment finding is accepted as a current-state refresh, not a demonstrated
error at the original baseline. Live contract, implementation, and test reads agree on the new
`none` mode. The environment index, capability description, gap classification, and test evidence
above are reconciled to those concurrent bytes. No source test result is claimed, and these
uncommitted source changes must be revalidated if they move before the consumer audit.

## Handoff to the consumer inventory

Use this map as a lookup backed by the cited source, not an exemption list. For each actual
consumer: trace its binding, match the exact public contract, compare authority and import effects,
then classify it as a bypass, owner implementation, runtime integration, gap, or unresolved case.
Revalidate source when revision/worktree evidence changes. Do not select migration commits or create
facades from this document alone.
