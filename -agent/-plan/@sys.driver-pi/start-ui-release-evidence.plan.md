start-ui-release-evidence.plan.md
- [x] [start-ui.design.md](start-ui.design.md)
- [x] e52d9c0c4 feat(cli): expose narrow keyboard lifecycle entrypoint
- [x] 0741b6f89 fix(std): authenticate Uint8Array identity
- [x] 0b46ec0c0 feat(http): expose constrained file-byte response entrypoint
- [x] 0aa6135ed feat(fs): expose rooted file reads
- [x] 9c931aad2 feat(driver-pi): serve the GUI Dist source on localhost for development
- [x] 28fed0d56 refactor(driver-pi): group GUI preview build scripts under semantic module
- [x] 5fa35e3ce fix(http): bind explicit strict ports without fallback
- [x] e61e0122d feat(fs): expose exact-canonical local Dist reads
- [x] f051ef590 fix(fs): honor throwing file-write failures
- [x] ea3e88eed refactor(http): expose narrow server lifecycle entrypoint
- [x] f4303dd39 refactor(http): expose narrow server host entrypoint
- [x] a96178674 refactor(fs): expose narrow Dist verification entrypoint
- [x] 9ad3d214f feat(server): serve complete local Dist transport
- [x] 361230c35 test(driver-vite): align lifecycle alarm with Vite's Rolldown
- [x] 1e8e200ad fix(driver-vite): restore eager entry runtime imports
- [x] ab4506359 refactor(driver-vite): lazy-load requested command graphs
- [x] 540ef7436 refactor(driver-vite): consolidate lazy command layout
- [x] 515e1a1b5 refactor(driver-pi): remove duplicate GUI source server
- [x] 46a1002e5 refactor(fs): remove unused Rooted read surface
- [x] 439552356 fix(driver-pi): remove sealed GUI release stores during reset
- [x] 6c8ab9dbd refactor(std): strengthen Schedule turn contracts
- [x] 0c81ffaec refactor(server): replace lifecycle turn wrappers with Schedule
- [x] 2be183a8e refactor(server): separate BootstrapStatus lifecycle contracts
- [x] 1f4ccb176 feat(driver-pi): generate and prove local GUI release evidence
- [x] c099fb1f3 [finite-chrome-process-authority.plan.md](../@sys.testing/finite-chrome-process-authority.plan.md)
- [x] 77c2d0c2e refactor(driver-pi): name local GUI evidence binding explicitly
- [x] 5d7100d2f chore(driver-pi): bind rebuilt local GUI evidence
- [x] ea94fc46e feat(driver-pi): suggest commit after local GUI evidence binding
- [x] 015d9d4d5 refactor(http)!: rename checksum observation to received
- [x] 74d38afa3 feat(server): retain manifest checksum mismatch evidence
- [x] f7cdab9a3 feat(driver-pi): render manifest checksum mismatch diagnostics
- [x] 4ffeb0c24 fix(driver-pi): clarify local GUI evidence output
- [x] 43fb7b4cb chore(driver-pi): complete local GUI development task grammar
- [x] cb97b731b chore(driver-pi): bind rebuilt local GUI evidence
- [x] 70c17a78e chore(driver-pi): bind rebuilt local GUI evidence
- [x] a16b8ad41 fix(driver-pi): polish local GUI rehearsal label
- [x] 6795c1773 chore(driver-pi): bind rebuilt local GUI evidence
- [x] 6df696908 fix(driver-pi): link local GUI manifest digest
- [x] 72c8d412c feat(crypto): format linked digest references
- [x] fe66d2588 fix(driver-pi): display verified Dist digest in GUI status
- [x] 1d5e25ff3 fix(driver-pi): link verified Dist directory
- [x] ab3dc43a0 fix(driver-pi): render actionable busy reset refusal
- [x] 0b36818a4 fix(cli): let handled keys stop keyboard bindings
- [x] 5760c29a4 chore(driver-pi): bind rebuilt local GUI evidence
- [x] 82b510a0f fix(driver-pi): make start:gui back reopen profile menu
- [x] b0ef3401c chore(driver-pi): bind rebuilt local GUI evidence
- [x] 255498c88 fix(server): bind pinned Dist hosts to one absolute root
- [x] f33eb684b fix(server): right-size bootstrap capability paths
- [x] e6ff0d57f fix(driver-pi): clarify bootstrap capability status
- [x] 60c623bca test(driver-pi): prove bottom-docked start:gui footer
- [ ] plan(snapshot): verified-package-ui-release.plan.md
- [ ] [verified-package-ui-release.plan.md](verified-package-ui-release.plan.md)
- [ ] GATE release owner selects immutable artifact provider/path, public HTTPS proof origin, browser/filesystem floors, and prior-local-worker migration
- [ ] feat(driver-pi): bind published GUI Dist evidence for release

## Purpose
Finish Driver Pi GUI release evidence in two honest stages:

1. make the complete release acquisition path work against an operator-owned `http://localhost:8080`
   Dist source; then
2. replace only the local publication assumptions once real immutable hosting and public HTTPS proof
   authority exist.

The first stage is a development release-path rehearsal, not a public release claim. The second
stage remains human-gated. Planning and readiness do not authorize implementation, publication, or
Git mutation.

## Current arc
The narrow HTTP host, narrow FS Dist verifier, and complete local Dist transport are landed at
`f4303dd39`, `a96178674`, and `9ad3d214f`. Driver Vite's lazy command graph is consolidated through
`540ef7436`, Driver Pi's duplicate source server is removed at `515e1a1b5`, and the frozen local GUI
release-evidence lane is landed at `1f4ccb176`. A deliberate rebuilt-candidate launch proved the
stale pin fails closed at manifest acquisition. The completed Server/Driver Pi diagnostic boundary
now retains the exact expected/received pair at its owner, admits it against launcher authority, and
renders only trusted terminal evidence and local-rehearsal guidance. Human DX review then identified
that the linked `manifest` row displayed the manifest-byte pin rather than the canonical Dist content
digest. The shared linked-reference formatter landed at `72c8d412c`, Driver Pi's corrected
verified-digest flow and terminal presentation landed at `fe66d2588`, and the exact local verified
Dist-directory link landed at `1d5e25ff3`. The arc's landed and remaining authority boundaries
follow this order:

The finite Chrome prerequisite's final completed snapshot is `c099fb1f3`; its fully reachable
nine-commit arc ends at `73d944372`. Its direct child `22acc030e plan(retire):
finite-chrome-process-authority.plan.md` removed the live file after that truthful `plan(done)`
snapshot. The final snapshot, exact reachable implementation arc, recorded validation, and the
human's explicit completion determination establish this dependency as complete. This parent retains
`c099fb1f3` as its recovery identity and does not duplicate the prerequisite's internal arc.

1. align the strict lifecycle alarm with the Rolldown version selected by the frozen Vite graph;
2. restore a green eager Driver Vite entry through direct runtime-owner imports;
3. make Driver Vite load only the requested command graph against the narrow hosting boundary;
4. remove Driver Pi's duplicate source server;
5. remove the now-unused Rooted read surface;
6. make explicit reset remove sealed GUI release stores through owned-tree authority;
7. strengthen the public Schedule microtask and macrotask turn contracts;
8. replace Server's duplicate lifecycle turn wrappers with those Schedule primitives;
9. evaluate the remaining exact-Promise substrate without conflating it with scheduling;
10. generate and prove one frozen local Dist through the existing release acquisition path;
11. complete the referenced finite Chrome process-authority maintenance plan;
12. name the state-changing local evidence binding task without implying listener startup;
13. bind the independently rebuilt and verified local candidate without rebuilding it again;
14. suggest the exact data-only commit after successful local evidence binding;
15. retain one bounded manifest-checksum mismatch pair at the Server materialization owner;
16. authenticate and render that pair with local-rehearsal recovery guidance in Driver Pi;
17. clarify the successful local GUI evidence output without widening binding authority;
18. complete the local GUI task grammar with one build-owning `bind:dev` workflow;
19. link the admitted local GUI manifest pin to its exact source location;
20. move Vite's linked digest-reference grammar into the shared Crypto formatter owner;
21. retain the already-verified Dist digest through application admission and render
    `manifest  dist/ ← digest:sha256:#<tail>` with only the digest linked to the admitted manifest;
22. link `dist/` to the exact local verified generation directory without changing digest authority;
23. let a handled shared CLI key stop its binding before another terminal read begins;
24. return a clean GUI back action to the same profile action menu only after complete owner cleanup;
25. run and adjudicate the scheduled orthogonal review;
26. bind each pinned Dist host to one invocation-resolved absolute root path for verification and
    every request read;
27. render the verified release-mechanism ownership plan and hand off the next technical arc;
28. complete the referenced release-mechanism ownership plan;
29. stop at the release-owner gate; and
30. only after that gate, bind independently verified published evidence.

The diagnostic pair followed lower-owner → consumer order. The intermediate Server checkpoint
extended the public failure result before Driver Pi admitted the new exact shape, so that historical
tree remained fail-closed but was not a standalone publication checkpoint. The completed consumer
boundary closes the integrated local-runtime evidence without making the received checksum
authority.

The three hosting-boundary commits entered ancestry as `9ad3d214f` Server → `a96178674` FS →
`f4303dd39` HTTP, while the opening arc retains their truthful dependency order. Only the final
`f4303dd39` tree contains all three required public entries; do not treat the two intermediate trees
as standalone green checkpoints.

The opening arc is the only landing ledger. Its unchecked items carry no claim about transient
worktree progress. Tests, checks, dry-runs, formatting, lint, process proofs, and reviews are
evidence, not a landing verdict; every local commit receives its exact hash in the opening arc only
after it lands.

`d94cff3ef delete(old): migration planning data` already contains target-attributed Driver Vite
partition work: narrowed entry commons, direct build/dev leaves, the extracted info command,
presentation leaves, and config-path isolation. It also removed entry-common runtime exports before
all eager consumers moved to direct owners, so the current committed eager entry is not a green
reversion parent. Preserve that reachable history without rewriting or relabeling it. First align
the independent strict-lifecycle alarm, then restore one reviewed green eager checkpoint, and only
then land lazy dispatch. The eventual `refactor(driver-vite): lazy-load requested command graphs`
hash marks the reviewed lazy-dispatch and proof completion point, not the sole implementation
commit; its commit body and this plan retain the `d94cff3ef` cross-reference.

The `jsr-publish` tag `ae2862e12` predates every landed predecessor in this arc. Its published
`@sys/fs@0.0.347` snapshot did not contain `Rooted.readFile`, and the release owner confirms no
later JSR publication occurred. The read surface's addition and removal are one local unpublished
transaction: preserve truthful Git history and let the next synchronized workspace publication
expose only the corrected final API.

Checksum-matched reads under a `dist/`-only Deno permission now belong to `Pkg.Dist.Local`: each
call resolves and requires a canonical root, verifies the complete distribution, and authenticates
its response read. This minimizes requested permission without claiming resolved-target confinement
against a hostile writer. Rooted retains strict creation-input capture, `{ create: false }`,
identity handling, existing-target collision rejection, leases, sealing, and owned-tree removal for
independent consumers, including sealed-store reset. None of these local items proves public HTTPS,
immutable publication, or release-owner authority.

## Landing discipline

- Treat every unchecked opening-arc item as one independently reviewed, proved, reversible commit;
  never land the mixed worktree as a snapshot.
- Keep plan-only governance separate from implementation commits. Record an exact hash and unchanged
  subject in the opening arc immediately after each local commit lands.
- Hunk-separate Driver Pi `deno.json` and README changes between source removal and release
  evidence. Attribute Driver Vite and Server `u.serve.ts` hunks to the command-graph or transport
  owner that requires them; do not use proximity as ownership.
- Remove low-signal residue before staging: unused exports, wording-only tests, obsolete-name
  assertions, unrelated whitespace, and proof duplicated from lower owners.
- Do not advance `jsr-publish` through an intermediate temporary API. The next synchronized
  workspace publication observes only boundaries that have landed, passed owner checks/tests, and
  completed package dry publication.
- Preserve unrelated tracked and untracked work. Review, planning, test success, and acknowledgement
  never authorize Git mutation.

## Foundation

[start-ui.design.md](start-ui.design.md) owns the landed launcher, materialization, verified-host,
boot-state, browser-policy, reset, diagnostics, preview, lifecycle, and process-settlement
architecture through
`5055ec0a6 fix(driver-pi): settle failed start:gui exits without uncaught
stacks`. This plan
consumes the completed predecessor contracts without reopening or restating their internal commit
history.

Durable architecture facts:

- `START_GUI_SERVICE` selects the release variant and `http://localhost:8080/dist.json`; its package
  expectation and manifest pin remain launcher-owned evidence for one exact selected Dist;
- after the human ran reset and launched a fresh real session, the terminal correctly displayed
  `failed: source-unavailable` with `manifest-fetch · resource-failure · cleanup:not-needed`; that
  evidence proves only that the manifest request failed, not why it failed;
- the pinned verified application-host surface deliberately does not expose `dist.json`; local
  acquisition must not weaken that host or its closed browser policy;
- the existing `deno task serve` path owns locally verified preview transport, lifecycle, Host
  admission, route normalization, authenticated part reads, and terminal presentation; complete
  local transport additionally requires the exact manifest bytes consumed by verification;
- `src/index.html` still names `./-test/entry.tsx`, and that entry mixes production Splash,
  development DevHarness, and Service Worker startup concerns. This remains product/publication
  debt, not a dependency of the post-build local substrate proof;
- `deno task build` is the existing explicit producer of a fresh `dist/` candidate. Neither local
  serving nor `start:gui` may build or mutate that candidate;
- the local `:8080` serve lifecycle is operator-owned development infrastructure. Driver Pi must
  consume it but must not silently start it, infer trust from its presence, or fall back when it is
  absent;
- in a real ready session, the displayed `← + ctrl` back control entered `stopping` but did not
  return to the profile menu, while `Ctrl+C` from that session and a fresh ready session settled
  cleanly. Treat back-navigation settlement as a separate non-blocking lifecycle follow-up; do not
  conflate it with the corrected clean-quit path or broaden the local-evidence commit without causal
  attribution;
- local verified-loopback policy is already authoritative. Public HTTPS Service Worker registration
  remains unproved until the final item.

## Fixed authority

- `localhost:8080` is the exact development artifact origin for the local rehearsal stage. The
  manifest URL is `http://localhost:8080/dist.json`; manifest and declared assets remain on that
  origin.
- The launcher consumes one frozen tuple: manifest URL, exact manifest integrity, and expected
  package identity. It never obtains its pin or expected identity from the artifact endpoint.
- The tuple remains launcher-owned compile-time evidence, outside profile YAML, environment, CLI
  flags, browser state, and runtime discovery.
- The local source is location, not trust. Exact manifest bytes, their independently captured pin,
  package expectation, and lower verification remain authority.
- Release and development input variants stay disjoint. This rehearsal exercises the release variant
  and does not replace the direct-build development preview.
- The local milestone begins with one already-built, frozen, internally coherent `dist/`. It
  authenticates, materializes, and executes those selected bytes; it does not attest source-code,
  bundler, or product-UI correctness.
- `dist/` remains ignored and default package tests must pass without it. Do not rebuild `dist/` or
  regenerate launcher evidence while landing upstream transport and cleanup items.
- Reset remains explicit checkout maintenance. It is recovery before a fresh cold acquisition, not a
  way to reproduce `repair-required` and not an automatic retry.
- A stopped or unreachable `:8080` source after reset must remain `source-unavailable`. No
  cache-reset guidance is added to source failures.
- No runtime fallback to an older generation, development directory, mutable URL, or provider result
  is permitted.

## Predecessor adjudication

- Keep the CLI keyboard entrypoint and Uint8Array identity correction as independently useful common
  hardening.
- Keep the narrow HTTP file-byte entrypoint: it exposes existing shared response semantics without a
  second server implementation.
- Correct the unpublished Rooted predecessor within this local transaction by moving its durable
  minimum-permission read requirement to `Pkg.Dist.Local`: exact-canonical local verification and
  checksum-pinned local part reads submit no ancestor paths and operate under a Dist-root-only Deno
  permission. After removing its sole Driver Pi source-server consumer, remove the broad Rooted
  `readFile` contract, implementation, and read-specific proof; retain strict creation-input
  capture, `{ create: false }`, identity hardening, existing-target collision rejection, and
  owned-tree lifecycle authority.
- Preserve `9c931aad2` as truthful landed history. Its dedicated source owner is superseded because
  `DistServer.Local.serve` already owns stronger verified transport, Host/path admission, preview,
  lifecycle, and presentation semantics. Tamper cases use test-only transport, not a second
  production listener.

## `fix(http): bind explicit strict ports without fallback`

`HttpServer.start` keeps its existing available-port fallback by default. A caller that supplies
both an explicit port and `strictPort: true` instead passes that port directly to the listener. It
never asks `Net.port` to probe, increment, or briefly create authority for another port.

- Preserve existing fallback selection for callers that do not opt into strictness.
- Preserve native listener validation for invalid or occupied explicit ports; do not add a
  check-then-bind race.
- Keep Dist opt-in and its post-bind equality check in the later Server-owned transport boundary.
- Prove an occupied strict port throws the native address-in-use failure without starting a fallback
  listener, while the same non-strict request retains existing fallback behavior.

## `feat(fs): expose exact-canonical local Dist reads`

`Pkg.Dist.Local` verifies one local distribution and reads individual files against exact path,
size, and checksum claims. It asks the host only for the selected root and descendant path names, so
ordinary operation needs read authority only for that root. This minimizes permission; it does not
create a filesystem capability against a hostile writer racing path resolution.

- Add `Local.readPart` beside `Local.verify`; authenticate the exact path, byte length, and checksum
  before returning independently owned bytes.
- Resolve caller input synchronously at invocation to an absolute root, then require that path to
  match the host's canonical path exactly. Preserve ordinary relative paths such as `dist`; refuse
  stable filesystem aliases rather than silently changing which directory the caller selected.
  Classify a replacement observed after the initial root check as `changed`, not as an alias.
- Resolve one exact canonical local root without traversing ancestors. An explicitly observed root
  symlink is `symlink`; any other canonical-spelling or ancestor-alias mismatch is `unsafe-path`,
  not a guessed symlink diagnosis.
- Keep pinned verification's stronger observed-ancestor contract unchanged.
- Give Local verification/read arguments mode-correct documentation instead of inheriting Pinned
  claims that every ancestor is observed.
- Prove through injected IO tracing that Local operations submit no ancestor paths, then close the
  minimum-permission boundary through a package-owned process proof with read authority for only the
  selected Dist root. Treat lexical path tracing as requested-path evidence, not resolved-target
  confinement. The later Server item separately closes the real host-permission boundary.
- Treat `verify` and `readPart` as independent observations: each call captures and resolves its own
  `dir` before yielding or invoking permitted lifecycle getters. Long-lived owners must resolve one
  absolute root and reuse it for every operation.
- Reject own accessors before reading caller data authority, including nested limits. Reject Proxies
  at the top level and within lifecycle arrays before structural lifecycle validation. Copy exact
  lifecycle-array data into owned ordinary arrays before validating permitted getter-bearing leaves.
  Rejection invokes no rejected getter or Proxy trap and performs no filesystem IO.
- Cover exact root, root symlink, ancestor symlink, canonical spelling/case alias where supported,
  replacement, cancellation, size mismatch, checksum mismatch, and sanitized host failure.

## `fix(fs): honor throwing file-write failures`

`Fs.write` advertises `throw?: boolean`, but its current host-write catch returns an error result
even when `throw: true`. Correct that existing contract independently rather than making evidence
code work around an untruthful common API.

- Preserve existing default-mode settlement and the current `force: true` runtime default; correct
  the stale force-default documentation without silently normalizing unrelated published behavior.
- For `throw: true`, never resolve a failed operation: throw every operational parent-preparation,
  existence, text-write, and binary-write failure with its original cause retained.
- Keep successful calls returning the existing `WriteFileResult`; do not invent a second method or
  overload family.
- Separate `writeJson` serialization handling from file-write handling so throwing write failures
  are not mislabeled as serialization failures.
- Do not broaden this fix into atomic publication, concurrent no-clobber, or evidence-specific path
  policy.
- Prove current default settlement and explicit throwing settlement for text, bytes, existing
  unforced targets, parent preparation, target-kind failure, and JSON delegation.

This fix does not force every caller onto `Fs.write`. The local evidence generator retains the
narrowest primitive compatible with its exact write-only permission; wrapper convenience is not a
reason to grant parent-directory or output-read authority.

## `refactor(http): expose narrow server lifecycle entrypoint`

The existing `HttpServer` lifecycle is necessary hosting infrastructure, but the aggregate
`@sys/http/server` entry also evaluates HTTP client and Pull acquisition graphs. Expose the same
frozen `HttpServer` object through a narrow owner entry before Server consumes it.

- Export only `HttpServer` from `@sys/http/server/lifecycle`; preserve the existing aggregate entry
  and every lifecycle behavior.
- Keep the lifecycle common lane free of the HTTP client module. Tests that need client helpers
  import them from their client owner rather than widening production common exports.
- Prove the public binding is identical, run the complete HTTP package test/check/dry surfaces, and
  let the consuming Server graph proof exclude HTTP client and Pull paths.
- Add no listener behavior, second object, wrapper, compatibility alias, or Driver Vite policy.

## `refactor(http): expose narrow server host entrypoint`

The frozen `HttpServer` lifecycle identity necessarily loads its broader static-host construction.
Expose only bare application construction and the existing managed listener lifecycle for Server's
hosting graph.

- Export only `create` and `start` from `@sys/http/server/host`; preserve aggregate and lifecycle
  entries for existing consumers.
- Construct the same bare Hono application without loading static-file, CORS, HTTP client, Pull, or
  broad FS authority.
- Keep listener option normalization, strict-port behavior, keyboard shutdown, terminal output,
  disposal, and process settlement in their existing HTTP owner.
- Let the literal consuming Server graph prove the host entry is present and forbidden HTTP/FS
  authority is absent; do not duplicate a general graph-policy engine in HTTP.

## `refactor(fs): expose narrow Dist verification entrypoint`

Server needs the existing Local and Pinned verification and checksum-authenticated read authority,
not broad FS, Rooted lifecycle, Dist production, or write authority.

- Export only the identical frozen `Local` and `Pinned` objects from `@sys/fs/pkg/dist/verify`.
- Give verifier leaves a direct narrow common lane rather than reaching them through the broad Dist
  aggregate common.
- Preserve all Local/Pinned verification, path, lifecycle, limit, manifest, tree, and authenticated
  read behavior; add no wrapper, copy, compatibility alias, or new filesystem authority.
- Prove public object identity in FS and let the literal consuming Server graph require the verifier
  leaves while excluding broad FS, Rooted ownership/publication, Dist compute/load, and write paths.

## `feat(server): serve complete local Dist transport`

`DistServer.Local.start` and `DistServer.Local.serve` become the complete local acquisition and
preview transport. `DistServer.start` remains the separate pinned application host.

- Local authority serves the exact verified manifest bytes at `/dist.json`, every authenticated
  manifest-declared part, and the established `/` preview alias.
- Pinned application hosting remains asset-only and returns `404` for `/dist.json`, including under
  its closed browser policy.
- Derive manifest response authority only from successful local verification evidence: exact
  manifest integrity and byte length. Read every Local response through `Pkg.Dist.Local` authority;
  never route Local assets through ancestor-walking `Pkg.Dist.Pinned.readPart`.
- Preserve normalized route grammar, settled loopback Host admission, empty fixed refusals,
  `no-store`, no range authority, and no undeclared filesystem access.
- Keep verified startup internals under `u.server.start.verified/`, expose only `serveVerified`
  through its `mod.ts`, preserve the recursive local common/type lane, and retain listener,
  authority-binding, settlement, publication, and rollback ordering.
- Export `DistServer` through one narrow public subpath whose static runtime closure excludes
  `Dist`, materialization, Fetch/Pull acquisition, promotion, and sealing graphs. Lower
  verified-read helpers may share Rooted path-admission code, but the host receives no write or
  storage authority. Driver Vite imports only that hosting subpath.
- Update `code/sys/server/README.md` to state the Local manifest exception and the
  Local-versus-pinned contract explicitly.
- Keep deferred browser-opener loading only when owner-level graph/permission proof demonstrates it
  is causal to narrow cached-only serve; otherwise remove that churn.
- Resolve one canonical absolute Local root at startup and reuse it for verification and every read;
  prove a later CWD change cannot redirect the service. Prove exact Local manifest/part GET and
  HEAD, mutation refusal, route/Host/malformed-request refusal, strict-port propagation, lifecycle
  settlement, and pinned `/dist.json` 404 in Server tests. Close the real host under read authority
  for only the selected Dist root, and prove the narrow hosting subpath excludes acquisition graphs.

## `test(driver-vite): align lifecycle alarm with Vite's Rolldown`

The strict in-process lifecycle fixture is a causal alarm for the native Rolldown graph selected by
Vite. The frozen workspace graph now resolves Vite 8.2.2 to Rolldown 1.2.5 while the committed alarm
still names 1.2.3. Correct that independent test baseline before using the package suite as evidence
for entry repair or lazy dispatch.

- Change only the strict alarm's expected Vite-owned Rolldown identity; do not alter lifecycle
  behavior, fixture authority, package versions, or `deno.lock`.
- Prove the exact strict child fixture still reaches execution and build completion, then fails for
  the intended signal-listener leak with the frozen Rolldown identity visible.
- Keep this maintenance delta out of both the eager-entry repair and lazy command-graph commit.

## `fix(driver-vite): restore eager entry runtime imports`

The type-only entry common landed before every eager consumer moved to a direct runtime owner. Build
one green eager checkpoint so the following lazy commit is independently reversible rather than a
combined latent repair and refactor.

- Keep eager command loading and established CLI/public behavior unchanged.
- Replace missing entry-common runtime imports with direct narrow owners in `m.Entry.main.ts`,
  `u.pkgSubpath.ts`, and `u.serve.ts`; consume `@sys/server/dist/server`, never the broad Server
  Dist entry.
- Add no wrappers, dynamic command dispatch, graph proof, or presentation timing changes.
- Prove package check, existing entry behavior, the corrected unit baseline, dry publication, scoped
  formatting/lint, and a residue-free exact repair delta.

## `refactor(driver-vite): lazy-load requested command graphs`

The Driver Vite entry reads command identity before loading command implementation. `serve` must not
evaluate build, development, Vite, or Rolldown graphs merely because they share one CLI entry. This
item consumes the preceding narrow Server hosting subpath and does not broaden its read profile to
compensate for Server-owned authority.

- Load only the selected `build`, `dev`, `serve`, or `info` implementation and presentation graph.
  Retain one command-specific literal loader per command, and share those exact production loader
  bindings between direct public methods and default CLI dispatch so injected seams cannot prove a
  mapping different from production.
- Let each selected command module own API invocation and CLI dispatch. Keep injection only in
  explicit `mainWith` and `dispatchWith` seams; do not retain a wrapper-only directory or fold all
  literal command imports into the registry.
- Preserve argument reconciliation, unsupported-command output, direct public entry behavior, and
  each command's success/failure settlement. Selected command-module evaluation may precede CLI
  presentation; presentation before implementation evaluation is not a contract.
- Keep serve free of build-native, FFI, and cached-package authority.
- Root graph proof at the public entry, executable entry, registry, each command-specific loader,
  and each command module. Prove every loader has exactly one literal dynamic edge to its declared
  command, and reject forbidden authority reachable from that selected command; unordered aggregate
  edge membership is insufficient.
- Add owner-level tests for public `ViteEntry.build/dev/serve`, default command dispatch,
  unsupported input, and evaluation isolation. A wording-only serve-test change or injected-only
  dispatcher is not proof.
- Close the integration boundary by invoking `ViteEntry.main(Deno.args)` under cached-only serve
  with no build-native authority. Derive readiness from that child's listener, require successful
  primary SIGINT delivery before accepting settlement, and compare fixture and response as exact
  `Uint8Array` bytes before proving liveness, cleanup, and port reuse.

Focused boundary-preservation review of the worktree consolidation after `ab4506359`: **GO; no
material findings.** The accepted final graph is registry → per-command literal loader → command
module. Public proxies and executable dispatch retain the same production loader bindings; selected
closures exclude sibling commands and forbidden Vite, Rolldown, broad Server, and broad FS graphs;
`serve` retains only `@sys/server/dist/server`; the cached process receives no FFI, run, write, or
build-native authority; relocated tests remain discovered; and dry publication includes the command
modules and owner tests while excluding external fixtures. The graph alarm remains a deterministic
regression alarm layered with production-path tests and the cached-only serve process, not a
standalone sandbox.

## `refactor(driver-pi): remove duplicate GUI source server`

Driver Pi owns package identity, explicit local port, permissions, and task wiring. It does not own
a second HTTP server, route parser, listener lifecycle, static reader, or artifact protocol.

- Make `deno task serve` spell `--cmd=serve --port=8080` explicitly and use frozen, cached-only
  imports under its finite read, network, environment, and opener permissions.
- Remove `start:gui:source`, its implementation module, permissions, tests, and duplicate process
  proof without retaining obsolete names as permanent negative assertions.
- Preserve the common Local transport's established preview, Host, path, query, lifecycle, and
  presentation semantics rather than recreating old source-server behavior.
- Keep `start:gui` consumer-only: it never builds, starts, discovers, or stops the local listener.
- Remove unused `Is`, `Obj`, and `Time` exports from `-scripts/common.ts`, wording-only Driver Vite
  churn, and unrelated README whitespace.
- Keep source-tamper refusal in an isolated test-only proxy over valid Local transport, never a
  second production server.

The process capstone spawns the exact configured executable and argument vector directly. It adds no
`--silent` or intermediary `deno task` layer and proves only the executable boundary:

```text
occupied 8080                    → visible fixed-port refusal; no fallback listener
GET exact /dist.json             → exact frozen manifest bytes
GET one representative part      → exact checksum-matched bytes
SIGINT/normal process settlement → no uncaught or permission stack
post-shutdown bind               → port 8080 is reusable
```

Static task tests separately prove task/profile spelling. HTTP and Server suites retain the complete
HEAD, route, Host, malformed-request, and artifact-leakage matrices. Visible terminal and browser
behavior remains an operator proof, not a silent-process claim.

Run fixed-port process and release-runtime proofs only after the operator normally closes any
existing `:8080` listener; never terminate an operator-owned process for proof. Before destructive
real integration reset, positively fetch `http://localhost:8080/dist.json` and compare it with the
frozen candidate. A green page at `/` is preview evidence, not acquisition readiness.

## `refactor(fs): remove unused Rooted read surface`

After the sole Driver Pi source-server consumer is removed, delete only the unpublished
`Rooted.readFile` API, implementation, read-specific IO, tests, and documentation.

- Preserve strict creation-input capture, `{ create: false }`, target admission, identity handling,
  existing-target collision rejection, leases, publication, sealing, and owned-tree removal.
- Keep `0aa6135ed` as truthful local history; no published package contained the temporary read API.
- Run the complete FS check, unit suite, Rooted process proof, public-surface assertion, and dry
  publication proof before the next synchronized workspace publication.
- If source-server rollback is required before publication, revert this dependent cleanup before
  restoring its former consumer.

## `fix(driver-pi): remove sealed GUI release stores during reset`

The release materializer intentionally seals verified generations. Generic recursive `Fs.remove`
cannot delete children from those non-writable directories, while the lower Rooted owned-tree
removal contract can restore only entry-local removal permissions and delete the identity-bound tree
post-order.

- Replace production reset's generic recursive deletion with the same lower
  `Fs.Capability.Rooted.removeTree` ownership boundary required by materialized generations. Do not
  import a test fixture or duplicate raw recursive chmod/removal logic.
- Resolve the selected workspace spelling once. Inspect the workspace and each present
  `.pi/@sys/dist` segment with no-follow metadata and require exact canonical equality before a
  later missing segment may settle as absent. Bind Rooted once to the complete already-existing
  parent with `create: false` and retain its independent exact-path equality check.
- Admit the two exact ordered current/legacy directory targets as one batch, acquire one non-waiting
  exclusive lease, and call `removeTree` for each target under that lease.
- If ownership is busy, fail visibly without waiting indefinitely, terminating a process, or
  partially changing the target. Reset remains data-only and never starts, stops, discovers, or
  retries GUI/serve processes.
- Preserve sibling trees, outside bytes, and stable Rooted lock identity outside the target. Refuse
  stable canonical aliases, symlinks, replacement, ownership loss, or permission failures rather
  than broadening authority. Do not claim descriptor-relative confinement against a non-cooperating
  same-user process that redirects ancestry after binding; that remains Rooted's documented hostile
  writer boundary.
- Print `deleted` only after owned removal settles as removed and `already absent` only after an
  absent settlement. Preserve the existing two exact current/legacy reset targets.
- Pin the operator-facing `reset` → `start:gui:reset` task chain, exact helper entry, selected
  `clean` permission profile, configured process proof, and process-proof permissions with
  independent test literals.
- Prove the production reset helper—not a test-only substitute—against sealed current and legacy
  stores, genuine absence, canonical aliases before complete and incomplete ancestry, shared-lease
  contention, mixed sealed descendants, target replacement, and outside-tree preservation.

Focused proof:

```text
sealed current store       → deleted through exclusive owned-tree removal
sealed legacy store        → deleted through exclusive owned-tree removal
absent target              → already absent; no target creation
redirect before absence    → fixed canonical refusal; no Rooted metadata creation
shared lease held          → visible busy refusal; no deletion or process termination
symlink/replaced target    → fixed refusal; no outside bytes removed
sealed mixed descendants   → exact target removed; siblings and lock identity retained
operator task/profile drift → permanent contract proof fails
```

Land this correction independently before the local evidence item. Then rerun the real reset and use
that empty store for the final visible cold acquisition followed by serve-stopped warm reuse.

## `refactor(std): strengthen Schedule turn contracts`

Make the existing public `Schedule.micro()` and `Schedule.macro()` awaitable hops the reusable owner
of captured-host turn scheduling before Server consumes them.

- Preserve the frozen `Schedule` namespace, static function identities, non-constructible callable
  shape, callback overloads, lifecycle-aware `make()` behavior, and established
  microtask-before-macrotask ordering.
- Specify and prove that each awaitable hop returns a Promise created through the constructor
  binding captured when Schedule initializes, without claiming that `@sys/std` authenticates that
  binding as the realm's original native Promise. Bound this guarantee to scheduling and result
  construction: later caller operations on the returned Promise retain JavaScript's ordinary
  prototype semantics, and Schedule adds no own `constructor` shadow.
- Prove that microtask and macrotask hops retain their captured host queue functions when
  `queueMicrotask` or `setTimeout` is replaced after module initialization. When `queueMicrotask` is
  unavailable at initialization, harden the captured Promise-reaction fallback against later
  constructor and species mutation.
- State callback semantics without a zero-allocation overclaim: callback form returns `undefined`,
  while the selected host mechanism may allocate internal work and determines whether a thrown
  callback is reported as an uncaught exception or a discarded Promise rejection.
- Falsify own `constructor` shadowing, altered Promise prototype/species, ambient scheduler
  replacement, callback exceptions, constructibility drift, and cross-turn ordering through the
  public entry. Use a cold worker or process for initialization-sensitive fallback evidence.
- Keep the entry identity proof in `-test/-.test.ts`; split turn authority, ordinary turns,
  lifecycle-aware construction, frames, queueing, and sleep into flat contract-owned test files.
  Keep hostile ambient mutation and its descriptor restoration in the turn-authority proof.
- Give public Schedule namespaces and callables concise multiline JSDoc. Describe captured
  authority, fallback error reporting, timer-backed `tick()`, and polling bounds exactly; make no
  claim that a turn drains unrelated task sources.
- Keep Promise-substrate admission, listener ownership, rollback limits, and sanitized startup
  failures out of this commit.

## `refactor(server): replace lifecycle turn wrappers with Schedule`

Consume the strengthened public Schedule turns without moving Server's listener and rollback policy
into `@sys/std`.

- Replace only the local `microtaskPromise()` and `macrotaskPromise()` wrappers with
  `Schedule.micro()` and `Schedule.macro()` at startup settlement, rollback, retry, and deferred
  disposal sites.
- Preserve the exact existing sequence and bounds: one startup macrotask, one post-close microtask,
  two close-observation macrotasks, four direct-shutdown macrotasks, and macrotask retries while the
  Promise transport is unavailable.
- Keep exact native-Promise admission, safe observer attachment, Promise-transport readiness,
  retained listener ownership, direct shutdown fallback, and fixed sanitized errors Server-owned.
- Re-run Server lifecycle, rollback, public-entry graph, process, check, and dry-publication proofs;
  prove ambient Promise/scheduler mutation cannot weaken the existing failure boundary.

After this migration lands, evaluate whether the remaining exact-Promise deferred, admission,
observer, and transport-readiness substrate has a reusable non-Server owner. Do not fold extraction
into either scheduling commit. If extraction is warranted, add one concrete separately reviewed
commit before local evidence; otherwise retain the substrate in Server and record why no shared
contract is justified.

## `feat(driver-pi): generate and prove local GUI release evidence`

### Frozen candidate and generated authority

The local rehearsal tuple landed at `1f4ccb176` is:

```text
manifestUrl: http://localhost:8080/dist.json
integrity: sha256-fed3ec7de9fdcce678c96d2c807619ed62f5f483fa2b1da94c3ce875626ea1a0
expectedPkg: @sys/driver-pi@0.0.138
```

- Verify the already-built candidate completely and require its embedded package identity to equal
  the independently selected Driver Pi package expectation.
- Generate one immutable launcher tuple outside the Vite application graph from the fixed manifest
  URL, exact saved-manifest integrity, and package expectation. Mark the generated leaf explicitly
  as checked-in **local rehearsal authority**, not published release evidence.
- Keep the service and settlement at their established `u/` paths and place generated evidence
  beside the service; do not reintroduce relocation or import-only churn.
- Export a script-private deterministic renderer seam. Test its exact bytes, escaping, package
  admission, and byte-for-byte equality with the checked-in leaf.
- Run generation with frozen, cached-only imports and the exact permission profile: read only
  `./dist`, write only the evidence leaf, and no environment, network, run, FFI, or system
  authority. Prove a missing import cache cannot change the leaf and a primed locked cache
  reproduces it exactly.
- Keep the direct throwing `Deno.writeTextFile` boundary for the exact output-only profile. Unlike
  `Fs.write`, it does not preflight output existence or ensure the parent and therefore does not
  need extra read or parent-directory write authority. Wrap failure with the original cause and
  never report successful generation after rejection.
- Replace the tuple only after the complete candidate exists. Generation never builds, mutates, or
  advances the candidate.
- Exclude `dist/` from package publication while retaining it as ignored local proof input. The real
  package dry run must succeed with the frozen candidate present and select no path beneath `dist/`;
  Git ignore state is not publication evidence.

### Browser and acquisition proof

- Keep `test:browser` as the only current-build browser task and make it own its build. Frozen
  browser proof consumes the checked-in candidate without rebuilding and additionally requires the
  exact launcher pin and package expectation. Give the frozen lane its own permission profile,
  confine writes and temporary browser profiles to package `.tmp`, narrow environment reads, deny
  wildcard bind and the operator-owned `127.0.0.1:8080`, and compare the complete candidate before
  and after browser execution. Retain the canonical `@sys/testing` browser entry rather than copying
  launch mechanics; the completed finite Chrome prerequisite supplies the exact admitted Chrome
  pathname boundary, and no unrestricted `run: true` grant remains.
- Keep serve lifecycle human-owned: the operator starts and stops `:8080`; `start:gui` only consumes
  the source or an already verified cache.
- Use disposable source/store fixtures for tamper cases. Name fixture cleanup as cleanup/removal,
  not production reset, and never damage the developer's real `.pi` generation to manufacture
  evidence. Confine runtime writes to package `.tmp`, deny run, wildcard bind, and fixed-port
  authority at the executable task, bound post-abort session settlement, and preserve a primary
  proof failure when cleanup also fails. Runtime and browser reads remain broad because pinned
  verification observes the selected root's complete ancestor chain and Deno directory-read grants
  are recursive; do not weaken pinned verification or pretend an ancestor grant is narrower merely
  to improve profile appearance. Revisit that read shape only at the verification owner.
- Local transport proves zero redirects. Same-origin redirect handling remains bounded by empty
  credentials, closed origin, and authenticated manifest/resource bytes; do not add a new redirect
  subsystem here.
- Generation admits package identity before producing authority. Runtime package mismatch remains a
  refusal before application-host startup; it is not retroactive authority for materializer
  promotion and does not broaden generic materialization in this item.

Prove actual state transitions, not generated strings alone:

```text
serve running + empty store          → cold fetch, exact verification, promotion, visible ready GUI
serve stopped + verified generation  → zero source work, fresh warm-offline visible ready GUI
serve stopped + empty store          → source-unavailable; no GUI execution or reset guidance
wrong manifest pin                   → authority refusal; no promotion or GUI execution
changed served manifest/asset        → tamper refusal; no changed bytes admitted
package identity skew                → refusal before browser redirect
verified loopback browser            → bundled UI renders; tombstone leaves no controller/registration
```

Keep current-build and frozen-candidate browser authority separate. `deno task test:browser` is
explicitly build-owning; run it before candidate selection or in a disposable package copy, never as
the final check over the selected frozen `dist/`. Run the frozen browser lane, release-runtime,
serve process, package check, workspace check, and visible cold/warm proofs against the unchanged
selected candidate. If a current-build proof replaces the ignored `dist/`, restore the exact
independently saved candidate before running any frozen evidence proof. The visible operator
journey—not an injected UI marker—closes rendered output. Do not claim product-entry correctness,
build provenance, immutable provider publication, public HTTPS, or browser/filesystem support floors
from this local item.

## `refactor(driver-pi): name local GUI evidence binding explicitly`

The operator task verifies an existing `dist/` and replaces checked-in launcher authority; it does
not start the GUI, a listener, or any other process. Name that state transition directly before the
mismatch guidance exposes the command in terminal copy.

- Replace only the public task name `start:gui:evidence:local` with `bind:gui:evidence:local`. Keep
  `serve` as the sole listener-starting task and retain the existing `start:gui` consumer behavior.
- Keep the script module, executable path, permission profile, candidate verification, deterministic
  rendering, direct throwing write boundary, and one-leaf output authority unchanged. These
  internals describe evidence consumed by `start:gui`; they are not listener commands.
- Align the success message, generated-source banner, README, exact task proof, process invocation,
  and later mismatch guidance with binding terminology. Retain no second task alias or duplicate
  authority path.
- Preserve the selected manifest URL, integrity, package identity, candidate bytes, and permission
  profile exactly. The rename never builds, serves, contacts `:8080`, resets stores, or selects a
  replacement candidate.
- Prove byte-for-byte renderer equality, the exact renamed task and permission profile, empty-cache
  refusal without an evidence write, unchanged candidate bytes, and absence of the old public task
  name. Inspect the process proof's renamed invocation here, but reserve its candidate-dependent
  primed-cache reproduction for the following binding item; a passing reproduction would otherwise
  conflate this name-only change with candidate selection.

## `chore(driver-pi): bind rebuilt local GUI evidence`

After the binding name is landed, select the already-built replacement candidate as one separate
data-only authority change. This item advances the local rehearsal tuple; it does not alter the
binding mechanism or hide candidate selection inside the rename.

- Before binding, require the existing `dist/` to be the deliberately selected candidate rather
  than whichever build happens to be present. Stop on any mismatch; do not make a new digest true by
  rebinding it implicitly. Bind through `deno task bind:gui:evidence:local` and require exact package
  identity `@sys/driver-pi@0.0.138` and manifest integrity
  `sha256-ce9b78fa028c5e48e0be0c64cc1da4767faad695d23df879dc16e0d8196f7d5a`.
- Change only the generated evidence value attributable to candidate selection. The renamed banner
  belongs to the preceding commit; do not combine the two hunks merely because they share one file.
- Never build, repair, serve, contact `:8080`, reset stores, or mutate `dist/` while binding. Do not
  rebuild after binding unless deliberately abandoning this candidate and selecting another.
- Re-run the primed-cache process proof and deterministic renderer equality over the unchanged
  candidate, then prove the frozen manifest/tree/assets and evidence leaf remain byte-identical
  before and after the build-free runtime/browser lanes.

## `feat(driver-pi): suggest commit after local GUI evidence binding`

After a successful verified evidence write, tell the operator exactly how to name the resulting
single-file data commit without turning presentation into authority or Git automation.

- Keep `bind:gui:evidence:local` as the precise least-authority writer. After successful settlement,
  render package identity from `pkg.name`, local-GUI evidence state, and the output path through the
  canonical `Table`; frame the fixed suggestion
  `chore(driver-pi): bind rebuilt local GUI evidence` with a width-aware cyan `Fmt.hr` and render it
  through `Fmt.Commit.suggestion` from the narrow public `@sys/cli/fmt` entry.
- Emit no suggestion before candidate verification and successful evidence write settlement. A
  verification, identity, render, or write failure retains its existing error and produces no false
  success or commit guidance.
- Keep the task name, generated source, evidence tuple, permission profiles, candidate bytes, and
  absence of Git authority unchanged. The task never stages, commits, inspects Git, builds, serves,
  contacts `:8080`, resets stores, or infers whether other worktree changes belong in a commit.
- Keep semantic facts in one frozen `EVIDENCE` object and render the vertical output hierarchy with
  canonical `Str.dedent`; do not retain parallel message/output constants or formatter-span joins.
- Extend the existing unit and cache-process proofs with semantic fact ordering, canonical state/path
  styling, cyan rule shape, width-bounded table rows, and successful child settlement. Do not pin
  incidental `Table` spacing or formatter-owned heading copy, and do not add a second executable,
  formatter, process harness, or output schema.

## `refactor(http)!: rename checksum observation to received`

Bounded HTTP already computes a SHA-256 observation over the bytes received by one operation. The
pre-migration published Fetch and Pull contracts call that value `actual`, which overstates what the
observation proves and obscures the distinction between received bytes and admitted artifact truth.
Rename the field at the HTTP owner as one explicit breaking migration before Server retains it.

- Rename `HttpFetch.ResponseChecksum.actual` and `HttpPull.ResourceChecksumEvidence.actual` to
  `received` across their public types, construction, Pull transfer checks, and tests. The new name
  means only the digest observed over bounded bytes received by that operation; it is never source,
  manifest, artifact, or publication authority.
- Migrate every live workspace consumer in the same unit, including Registry assertions and
  Server's existing successful-manifest checksum check. Keep Server's generic mismatch failure
  unchanged here; bounded diagnostic retention belongs to the following Server-owned item.
- Remove the old field without a dual-write or compatibility alias. The `!` subject records the
  published contract break truthfully; release coordination and publication remain separately
  authorized human/release-workflow actions. Do not rewrite intentionally frozen generated bundles
  merely to erase historical source text.
- Preserve fetched bytes, hash timing and algorithm, mismatch status/error behavior, Pull
  accounting, retries, cancellation, disposal, permissions, and IO authority exactly. This is a
  terminology correction over an existing observation, not a transport or trust redesign.
- Prove the runtime and public type expose `received` and not `actual`, compile all live workspace
  consumers, and perform a residue pass that distinguishes attributable source from frozen
  generated artifacts. Run focused Fetch/Pull and touched Registry tests, the full HTTP package
  tests, HTTP and Registry checks, scoped formatting/lint, and both package dry publications; keep
  separately invoked external-network lanes diagnostic and distinguish unrelated failures. Do not
  publish.

## `feat(server): retain manifest checksum mismatch evidence`

After the HTTP-owned rename, bounded HTTP exposes an expected and received SHA-256 pair when exact
manifest bytes fail the caller's checksum. Before this item, Server collapses that lower-owner
observation to `manifest-fetch`/`integrity-mismatch`. Preserve the pair at the materialization owner
without making failure evidence into artifact authority.

- Add one frozen nested `manifestChecksum: { expected, received }` diagnostic to the exact
  `manifest-fetch`/`integrity-mismatch`/`cleanup:not-needed` failure variant. Consume the preceding
  HTTP-owned `received` field without reopening transport naming or checksum computation.
- Require the lower checksum to report `valid: false`, require its expected value to equal the
  synchronously snapshotted caller pin, admit both values as canonical lowercase SHA-256 strings,
  and require `received !== expected`. Copy the pair into owner-created frozen data before disposing
  transport authority.
- Admit the lower response without invoking caller behavior. Before reflection, use the existing
  server-only native classifier to reject Proxy responses and nested evidence; then capture each
  required response discriminant and nested checksum/error field through own data descriptors.
  Reject accessors, `Symbol.toStringTag` tricks, missing data fields, contradictory values, and
  impossible combinations as `execution-failure`; do not use universal plain-object tagging or
  direct property reads on unadmitted values.
- Reserve the diagnostic for the causal lower mismatch. Model the public failure as a correlated
  union in which the exact manifest-fetch mismatch requires `manifestChecksum`; exclude that
  stage/reason combination from the generic no-diagnostic arm and prevent the generic failure
  constructor from manufacturing it.
- Apply only the downstream type adaptations needed to keep live consumers coherent: Driver Pi's
  current exact identity boundary rejects the now-impossible bare mismatch, while typed fixtures
  construct the complete diagnostic variant. Do not admit, carry, or render the diagnostic in
  Driver Pi; that strict consumer behavior belongs to the following item.
- Keep every other materialization failure structurally unchanged, including resource-pull asset
  mismatches and existing, staged, or final verification mismatches. Keep top-level failure
  `integrity`, `verification`, `source`, `totals`, bytes, headers, raw errors, credentials, URLs,
  source-supplied metadata, and host paths absent.
- Update the public result contract and Server README to distinguish bounded mismatch diagnostics
  from success integrity or verification evidence. Do not add a callback, refetch, second hash,
  logging side channel, URL mode, or generic diagnostic envelope.
- Preserve materialization, cleanup, storage, sealing, publication, cancellation, graph, and
  permission behavior. This item observes a value HTTP already computes and grants no new IO or
  authority.

Focused proof:

```text
wrong manifest pin           → exact expected/received pair; no stage or generation publication
raced manifest bytes         → received hash names raced bytes; expected remains caller pin
mutated caller integrity     → expected remains the synchronously captured invocation pin
asset checksum mismatch      → resource-pull refusal; no manifest checksum diagnostic
local verification mismatch  → existing/stage/final refusal; no manifest checksum diagnostic
transport/policy failure     → existing sanitized fields only
response/evidence accessors  → zero accessor reads; execution failure; no diagnostic pair
Proxy response/evidence      → zero Proxy traps; execution failure; no diagnostic pair
bare exact mismatch literal  → compile-time rejection; checksum evidence is required
serialized failed result     → fixed hashes only; no bytes, URL, headers, cause, or credentials
```

Run the narrow Server materialization tests first, then Server check, full package tests, public
surface and graph checks, scoped formatting/lint, and package dry publication. Do not publish the
workspace at this lower-owner checkpoint; the following strict consumer commit closes the integrated
runtime.

## `feat(driver-pi): render manifest checksum mismatch diagnostics`

Driver Pi owns package identity, terminal presentation, and local-rehearsal recovery policy. Admit
the Server pair against launcher authority, preserve the existing materialization-evidence row, and
render the additional facts only in the trusted terminal projection.

- Extend exact failed-result admission only for the Server-owned manifest-checksum variant. Require
  a direct exact data shape, canonical SHA-256 values, `expected ===` the independently snapshotted
  launcher pin, and `received !== expected`; reject Proxies, accessors, extra keys, malformed
  hashes, forged expected values, and mismatched stage/reason/cleanup combinations through the
  existing identity-refusal boundary without invoking caller behavior.
- Carry the independently admitted launcher integrity into the screen as a finite canonical
  presentation fact, not as raw caller input or a new `BootState` failure field. Add one stable
  `manifest` row immediately after `state` whenever release or development authority has a valid
  manifest pin: preparing, application-host startup, ready, stopping, and every post-admission
  failure retain that row; invalid configuration with no trusted pin omits it.
- Render the stable row through `HashFmt.digest` from `@sys/crypto/fmt` with the measured value-cell
  `maxWidth` and no `length` override. Preserve its default five-character tail and established
  progressive context reduction (`digest:sha256:#xxxxx` → `sha256:#xxxxx` → `#xxxxx` → omitted).
  The compact row is orientation, not verification evidence: add no age, hyperlink, source URL,
  cache claim, or replacement authority.
- Keep Driver Pi's base `stage`/`reason`/`cleanup`/`publication` materialization evidence and its
  rendered `evidence` row unchanged. Carry the copied mismatch pair as separate finite terminal
  diagnostics, retain full canonical values, and add adjacent `expected` and `received` table rows.
  Fit those full values through the existing `Cli.Fmt.Text.Width` measurement and head/tail
  `ellipsize` path with `Cli.Fmt.omission`; do not hand-slice, emit literal `...`, or reduce either
  diagnostic through the compact digest formatter.
- Keep the private owned-error message at its existing stage/reason granularity. The received hash
  is observation, never a replacement pin, package identity, promotion receipt, retry input, or
  reason to execute bytes.
- Put local evidence regeneration policy beside `START_GUI_SERVICE`, outside the generated evidence
  tuple. Attach its finite guidance tag only when the invocation uses the exact canonical
  service-owned source and the admitted failure is this exact mismatch; do not infer recovery policy
  from arbitrary `localhost`, port `8080`, or a caller-supplied lookalike source.
- Render the fixed guidance copy:
  `Intended local build? In Driver Pi run deno task bind:gui:evidence:local, then relaunch.` Never
  invoke the command, build, reset, start or stop `:8080`, mutate the candidate, or imply that
  received bytes are trusted. Do not add reset guidance: this failure has no promoted or retained
  generation to repair.
- Preserve the fixed generic bootstrap page and its category-only projection. No manifest URL, pin,
  received checksum, command, lower failure object, or other terminal diagnostics enter browser
  bytes, redirects, response headers, or application-host startup.
- Keep permission profiles unchanged. The display consumes admitted in-memory strings and the
  guidance is package-owned copy; neither requires filesystem, network, run, environment, or browser
  authority.

Focused proof:

```text
valid authority lifecycle     → stable manifest row through preparing/starting/ready/stopping
invalid authority             → no manifest row and no caller-controlled digest text
compact manifest widths       → default digest/algorithm/hash variants, then safe omission
exact local manifest mismatch → stable manifest + unchanged evidence + expected/received + guidance
published/lookalike source    → stable manifest + expected/received; no local guidance
malformed/forged pair         → package-identity refusal; no attacker text rendered
asset/verification mismatch   → stable manifest + unchanged evidence; no mismatch rows or guidance
full hash at narrow width     → shared head/tail omission; no split/control-sequence injection
bootstrap failure response    → fixed generic bytes; no hashes, task command, URL, or raw evidence
wrong-pin runtime             → no generation, application host, redirect, or GUI execution
```

Use focused admission, failure-state, screen-rendering, bootstrap, and supervisor tests before the
existing disposable wrong-pin runtime capstone. Prove stable row order, complete wide-terminal
text, every shared compact-digest transition, semantic head/tail omission for full mismatch values,
short-viewport bounds, generic-browser non-disclosure, unchanged candidate bytes, and zero
application starts. Then run Driver Pi check, package tests, release-runtime lane, formatting/lint,
dry publication, and the workspace check. Do not rebuild or regenerate launcher evidence as part of
this implementation proof.

## `fix(driver-pi): clarify local GUI evidence output`

Keep this as one presentation-only slice after the mismatch diagnostics land and before the broader
local task-grammar item.

- Remove punctuation from aligned table labels and name the evidence kind `local GUI rehearsal`;
  this exercises the release path locally and is not development mode.
- Under the output path, render the exact admitted manifest URL, integrity, and expected package as
  a compact `Fmt.Tree` branch using `manifest`, `integrity`, and `expects` labels.
- Compose existing `@sys/cli` table, tree, path, text-fit, omission, and color primitives in one
  local formatter seam. Do not use Shiki, parse the generated TypeScript, add a dependency, or widen
  environment, filesystem, network, or process authority.
- Preserve the generated evidence bytes, binding behavior, output path, commit suggestion, and
  process settlement. ANSI-stripped output remains complete and narrow terminals remain bounded.
- Update the existing formatter and process proofs only; add no new architectural or security test
  campaign.

## `chore(driver-pi): complete local GUI development task grammar`

The precise task leaves expose the underlying authority, but the common package workflow should read
in the operator's concepts:

```text
deno task dev
deno task build
deno task serve
deno task reset
deno task bind:dev
```

- Add `bind:dev` as the exact build-owning composition
  `deno task build && deno task bind:gui:evidence:local`. Always build first; never infer candidate
  freshness from `dist/` presence, timestamps, or a previously recorded digest. A failed build must
  stop before evidence binding.
- Keep `bind:gui:evidence:local` as the independently callable least-authority leaf for an
  intentionally selected, already-built candidate. Preserve its script entry, frozen/cached-only
  execution, exact permission profile, candidate verification, deterministic rendering, and
  one-leaf write authority.
- Preserve the behavior and ownership of `dev`, `build`, `serve`, and `reset`. `bind:dev` never starts
  serving, launches the GUI, contacts `:8080`, removes a cache, or performs a second build after
  binding.
- Lead the README development surface with the concise task grammar, then retain the precise binding
  leaf as the advanced frozen-candidate path. Change exact local-mismatch recovery guidance to
  `Intended local build? In Driver Pi run deno task bind:dev, then relaunch.`; the runtime only
  presents that command and never invokes it.
- Keep the generated-source banner attached to `bind:gui:evidence:local`, the operation that actually
  writes the leaf. Do not duplicate the binding script, permission profile, or process proof under
  the concise task name.
- Pin the exact `bind:dev` sequence and build-before-bind order in task tests. Prove that the existing
  build and binding leaves remain the only causal operations rather than adding a duplicate broad
  end-to-end harness for their composition.
- Run the composition once against the deliberately selected local source and require the rebuilt
  manifest and generated evidence bytes to remain deterministic. If it advances candidate identity,
  stop and separate that data change rather than hiding it in this DX commit.
- Add no `bind:release` task or remote-publication vocabulary. The verified package-UI successor plan
  and release-owner gate must first establish the real provider and publication boundary.

## `fix(driver-pi): link local GUI manifest digest`

Keep this as one terminal-presentation refinement over the existing stable `dist.json` boundary.

- Retain the exact admitted release `source.href` beside the manifest pin in the start-screen
  presentation snapshot. When no admitted source URL exists, keep the current plain digest; do not
  manufacture a file URL or recover a location from rendered text or failure evidence.
- Continue rendering the value with the existing `HashFmt.digest` width grammar, then wrap that
  formatted digest with `Cli.Fmt.hyperlink` when the captured location is available. Follow the
  established Driver Vite and Server pattern where the digest label links to the manifest bytes it
  identifies.
- Keep ANSI-stripped output semantically complete and preserve every existing compact-width fallback.
  The link is orientation to a potentially mutable location, never new checksum, package, cache, or
  publication authority.
- Make no Driver Vite, Vite config, browser UI, Splash, Server, Crypto, generated evidence, build,
  binding, permission, materialization, or service-worker change. The stable `dist.json` emitted by
  `@sys/driver-vite` remains the sole artifact boundary in play.
- Extend only the focused start-screen rendering proof for the exact admitted hyperlink target and
  unchanged compact digest text. Add no new process, browser, architecture, or security campaign.

## `feat(crypto): format linked digest references`

The established Vite `dist/ ← digest` presentation already owned arrow width, compact digest
fallbacks, and digest-only hyperlinks, but that reusable grammar was private to Driver Vite. The
landed `72c8d412c` commit moves those mechanics into the existing `HashFmt.digest` owner instead of
reimplementing them in Driver Pi.

- Add optional standard incoming-reference arrow and digest-label URL presentation to
  `HashFmt.digest`; include the arrow in `maxWidth` accounting and preserve the established
  full → algorithm → hash → omitted fallback sequence.
- Apply the URL only to the visible digest label. The arrow remains presentation context and never
  enters the hyperlink target.
- Keep ordinary `HashFmt.digest` output unchanged when the new options are absent.
- Make Driver Vite's existing digest formatter delegate to `HashFmt.digest` so Vite and Driver Pi
  consume one implementation without introducing a Driver Pi runtime dependency on Driver Vite.
- Prove exact arrow-width boundaries and digest-only hyperlink composition at the Crypto owner, then
  retain Vite's existing directory-link, manifest-link, build-age, and narrow-width proofs.

## `fix(driver-pi): display verified Dist digest in GUI status`

The linked row landed at `6df696908` with the correct admitted manifest URL but the wrong displayed
identity: it showed `START_GUI_SERVICE.source.integrity`, which authenticates exact `dist.json`
bytes, rather than `verification.dist.hash.digest`, the canonical digest of the Dist declared by
those authenticated bytes. The landed `fe66d2588` correction changes the value flow, not the trust
model.

- Keep `START_GUI_SERVICE.source.integrity` as launcher-owned manifest-byte authority for acquisition
  and refusal. It never becomes the operator-facing Dist digest.
- Snapshot the canonical lowercase `verification.dist.hash.digest` from the already-verified
  application result at the same strict admission boundary that retains package identity and
  listener origin. Do not recompute it or obtain it from presentation, browser state, or the source
  URL.
- Carry the admitted digest in the immutable ready state. Non-ready states do not claim a verified
  Dist digest, and the browser bootstrap projection continues to expose only its existing generic
  state/redirect contract.
- Render the ready terminal row as
  `manifest  dist/ ← digest:sha256:#<tail>`. Driver Pi contributes only the `dist/` context;
  `HashFmt.digest` owns arrow, compaction, color, and digest-only linking.
- Keep the exact admitted manifest URL as the digest hyperlink target. At the `fe66d2588` checkpoint,
  `dist/` remains plain because no directory URL has yet been admitted, and no build age is fabricated
  because this ready-state contract retains no verified timestamp.
- Preserve development-mode plain fallback, width bounds, terminal-only disclosure, generated
  evidence, build/binding tasks, permissions, Server behavior, and publication authority.

Landed closure for these two commits: Crypto **5/76**, Driver Vite **64/399**, Driver Pi focused
**5/90**, profiles **28/337**, and process **1/5**; package checks and dry publications passed for
Crypto, Driver Vite, and Driver Pi; scoped format/lint and full-worktree `git diff --check` passed.
Driver Pi dry publication retained only its pre-existing unanalyzable dynamic-import warnings in
test fixtures.

## `fix(driver-pi): link verified Dist directory`

The landed `1d5e25ff3` follow-up gives `dist/` parity with Vite and Server without conflating the
local materialized directory with the admitted HTTP manifest location.

- Capture the exact absolute verified/materialized generation path as an optional copied `file:` href.
  Require native URL capture and exact path round-trip; on any unsafe or unavailable conversion,
  retain the plain semantic fallback rather than synthesizing a target.
- Carry that optional href only in the immutable ready state assembled from the selected generation,
  and publish the state only after application admission. Non-ready states do not claim a verified
  directory link.
- Link only the visible `dist/` label to the local generation directory. Keep the canonical Dist
  digest linked exclusively to the exact admitted manifest URL; never derive either link from the
  other.
- Preserve `HashFmt.digest` ownership of arrow, width compaction, coloring, and digest-only hyperlink
  semantics. At narrow widths, retain the plain or linked `dist/` fallback without fabricating a
  digest, location, or age.
- Add no browser disclosure, filesystem read, build, binding, reset, cache, publication, or recovery
  authority. The link is terminal orientation to bytes already selected and verified.

Landed closure: focused rendering **16/16**, profiles **28/337**, and process **1/5** passed; package
check, scoped format/lint/type-check, and full-worktree `git diff --check` passed.

## `fix(cli): let handled keys stop keyboard bindings`

A real operator `Ctrl+Arrow Left` run exposed a lower-owner gap hidden by synthetic Driver Pi
fixtures. Cliffy's iterator returns the handled key, then `Keyboard.bind` begins another stdin read
before Driver Pi cleanup disposes the binding. Cliffy 1.2.1 cannot interrupt that already-pending
read, so the GUI remains on `stopping` until another key releases it.

- Extend the shared `Cli.Keyboard.bind` callback result with one exact `stop` disposition. After an
  admitted `onKey` callback returns it, leave the listener before another iterator read begins and
  let the existing listener-finally path dispose the lower keypress owner and settle `finished`.
- Keep key classification and policy with callers. The shared owner learns no Driver Pi action,
  profile-menu concept, key grammar, or stop taxonomy; canonical q/Ctrl+C behavior remains unchanged.
- Preserve the existing disposal, retry, listener-failure, callback-completion, Promise-transport,
  and unavailable-terminal contracts. Do not use timing yields, thrown sentinels, raw stop-reason
  strings, or caller disposal from inside the callback.
- Prove that a handled stop performs one callback, never enters a second pending read, disposes once,
  and settles the binding. Existing ordinary-key continuation and canonical quit proofs remain.
- This closes in-band handled-key termination only. It does not claim Cliffy's pending stdin read can
  be externally cancelled after it has begun.

Land this reusable correction independently before the Driver Pi navigation consumer.

## `fix(driver-pi): make start:gui back reopen profile menu`

The GUI footer distinguishes `Ctrl+Arrow Left` back from `q`/`Ctrl+C` quit, but the current host
collapses both to one trusted stop and `Profiles.main` exits after cleanup. Restore only clean
navigation without making the reusable GUI lifecycle own a profile menu or turning failure
settlement into menu policy.

### Navigation and settlement contract

- Preserve the exact keyboard grammar and first-event lifecycle arbitration. Latch only the first
  package-classified trusted control as finite `back` or `quit` evidence at the keyboard/UI seam;
  keep the supervisor's category-level trusted/external stop taxonomy unchanged. A handled back
  returns the shared keyboard `stop` disposition so no later stdin read begins. Do not infer intent
  from stop-reason strings, rendered text, retained key-event objects, or error messages.
- Have only a clean GUI start settle with one owner-created finite completion that distinguishes
  back, quit, and external cancellation. Return it only after the existing ordered screen, keyboard,
  application host, status host, generation lease, cancellation, and observer cleanup has settled;
  never prompt while the previous GUI session can still repaint or own stdin.
- Keep failure settlement terminal. Failed states advertise q/Ctrl+C only; Ctrl+Arrow Left does not
  stop or navigate them. Presented failures retain the existing privately authenticated deliberate
  nonzero, stack-free task exit, while cleanup evidence and the exact internal rejection remain
  authoritative. Do not add back intent to failure metadata or consume a rejected GUI run as menu
  navigation.
- Keep lifecycle truth below the navigation seam unchanged: terminal-event precedence, fixed abort
  reasons, first failure, retained secondary evidence, cleanup evidence, and exact internal
  rejection remain authoritative. Do not add a caller callback to `StartGuiInput`, global mutable
  navigation state, an error-message classifier, or a second stop state machine.
- Propagate the clean completion through the existing lazy GUI import instead of discarding it.
  Preserve the runtime graph boundary for help, menu-only, and TUI paths, and keep the public
  `PiCliProfiles.Result` and `Profiles.menu` selection contract unchanged.
- In interactive `Profiles.main`, map a clean back completion to the action menu for the exact
  profile that launched the session—not to the root profile selector. Let the action menu's own back
  command return to the root selector; map quit to the existing successful GUI exit and never redraw
  a menu for q, Ctrl+C, external cancellation, or any rejection.
- Resume through package-private menu orchestration using only the already selected profile path.
  Render the current preview before launch, then discard the selected result and retain only that
  path across the long-running session. After complete cleanup, re-read and revalidate the profile,
  recompute its sandbox preview/report, and repaint from current terminal dimensions. Existing
  invalid, missing, renamed, and deleted-profile policy remains the menu owner's decision.
- Preserve mode preference and final-result truth across repeated navigation. Back followed by TUI,
  GUI, root-menu back, or exit returns the result of that later action; repeated GUI launches are
  strictly sequential and each acquires fresh lifecycle owners.
- Keep standalone consumers standalone. The isolated Vite preview and direct/programmatic GUI
  callers may explicitly discard a successful control completion and settle as they do today; they
  never import, open, or synthesize the profile menu merely because the control was back.
- Remove the synthetic visible-frame claim. Focused composition tests own same-profile reconstruction
  and teardown-before-prompt ordering; the shared keyboard owner proves no second read. Record a real
  operator TTY run as acceptance evidence before landing rather than manufacturing terminal frames
  from fake screens and prompts.
- Add no browser-process control, cache reset, rebuild, rebind, source-server action, new permission,
  generated-evidence change, or Server/FS/Crypto/Driver Vite contract. Verified-host cleanup remains
  exactly as it is today, and the detached browser process is neither newly owned nor closed.

Focused proof:

```text
preparing/ready + clean Ctrl+Left → keyboard stops; all GUI owners settle; same action menu repaints
failed + Ctrl+Left                → no stop and no navigation; q/Ctrl+C retains exact nonzero exit
ready + q/Ctrl+C                  → cleanup, successful GUI exit, no later menu prompt
forged completion/rejection       → exact rejection; no second action prompt
q then back / back then q         → first accepted canonical control alone determines settlement
back → action-menu back           → root profile selector
back → start:tui/start:gui        → one later action, fresh preview and non-overlapping owners
profile changed while GUI runs    → current validation/preview policy; only profile path was retained
standalone preview + Ctrl+Left    → preview settles and cleans its generation; no profile menu import
real operator Ctrl+Left           → no stale stdin read or stopping frame; action menu owns input
```

An independent item review accepted the supervisor taxonomy, first-stop arbitration, clean
completion, menu ownership, and lazy boundaries, while identifying stale preview retention and a
false-green synthetic process claim. The subsequent real TTY failure supplied stronger evidence at
the keyboard boundary and invalidated the synthetic capstone. Correct those findings, add compact
negative authority at `Profiles.main`, keep completion identity proofs with the settlement owner,
and consolidate new menu fixture ceremony before landing.

## Pre-gate orthogonal security review

A human-selected Opus 5 reviewer independently falsified the complete landed local runtime chain
across filesystem capability, bounded byte response, local transport routing, launcher-owned
evidence, authenticated materialization, verified hosting, browser policy, cancellation, cleanup,
and process settlement. The review found no source defect in the reachable Driver Pi composition;
its one accepted shared-host defect is the non-reachable pinned-root inconsistency owned by the next
Server item.

Adjudication retains these durable decisions:

- The opening arc alone carries the reconciled identities for the actionable reset refusal and later
  evidence binds; review prose does not become a second landing ledger.
- A pinned host must reuse one invocation-resolved absolute root path. Driver Pi already supplies an
  admitted absolute generation path, so the generic correction changes no landed Driver Pi trust
  decision.
- `DistServer` deliberately classifies a browser policy that names an undeclared or non-JavaScript
  verified part as `invalid-input`; Driver Pi's `configuration-invalid` projection remains truthful
  for that incompatible policy-and-artifact start configuration.
- The generated evidence writer retains the fixed
  `chore(driver-pi): bind rebuilt local GUI evidence` suggestion. Repeated subjects are intentional;
  exact opening-arc hashes carry landing identity.
- The verified loopback host admits the declared tombstone worker request. Worker-side deployment
  admission then denies loopback persistence, and the tombstone unregisters and removes owned cache
  state; the proven end state is no controller and no registration, not host-side registration
  denial.
- The release-owner gate retains both alternatives: evidence of no prior product exposure or an
  explicit fresh-origin/site-data migration decision. Existing migration mechanics do not resolve
  that owner decision.

The review was read-only and ran no tasks. Its source verdict does not replace implementation proof:
the pinned-root correction owns its focused runtime tests and package validation below. Review grants
no code, Git, publication, provider-selection, or gate-passage authority.

The finite Chrome prerequisite owns the shared Process and Testing correction. This plan retains
only its dependency and the Driver Pi proof consequences; do not duplicate that maintenance plan
here. Inherit its demonstrated claim exactly: pathname-scoped direct-process authority plus bounded
owned-process lifecycle truth. It does not attest Chrome binary identity, confine descendants or
operating-system access, prevent executable replacement, or establish Windows, browser-version, or
filesystem support floors. Preserve those non-claims through the whole-chain review and leave the
support-floor decisions at the release-owner gate.

## `fix(server): bind pinned Dist hosts to one absolute root`

The pre-gate orthogonal review found one shared-host consistency defect outside Driver Pi's
reachable runtime. `DistServer.start` snapshots a relative `dir` as relative authority; pinned
verification and each later pinned part read resolve it independently. A process-wide CWD change can
therefore make one host verify one requested root and read another. Every read remains size- and
checksum-authenticated, and Driver Pi already supplies an admitted absolute generation path, so this
is neither a landed Driver Pi integrity bypass nor permission to leave the shared host inconsistent.

- In `snapshotStartInput`, synchronously resolve `dir` from the invocation CWD before the first
  scheduler boundary, exactly as `snapshotStartLocalInput` does. Carry that one absolute path through
  pinned verification, `start`, raw and screen `serve`, and every request read; do not introduce a
  second Server path owner.
- Preserve `Pkg.Dist.Pinned` canonical root and ancestor checks plus per-read path, length, checksum,
  and lifecycle admission. This fixes CWD-relative requested-root drift only; it does not claim
  descriptor-relative confinement, immunity to hostile same-user mutation, or a stronger filesystem
  capability.
- Keep public types, manifest and asset authority, browser policy, errors, listener lifecycle,
  permissions, terminal presentation, and Local behavior unchanged. Add no Driver Pi, FS, HTTP,
  generated-evidence, build, binding, reset, or publication change.
- Prove a relative pinned `start` snapshots the invocation root before the scheduler turn and reuses
  it after CWD changes for both verification and request reads. Prove raw pinned `serve` forwards the
  same absolute root; retain successful exact bytes and fail-closed mutation behavior.
- Run focused pinned start and serve tests, then Server check, complete package tests, scoped
  formatting and lint, package dry publication, and `git diff --check`. No broader package lane is
  required unless the implementation changes a public contract.
- Stop and replan under the actual semantic owner if this requires changing `Pkg.Dist` path
  algorithms, widening permissions, or redesigning hostile-writer confinement.

## `plan(snapshot): verified-package-ui-release.plan.md`

### Semantic ownership correction

Generic release mechanisms accumulated inside Driver Pi while the verified local lane was completed.
The architecture owner has selected their correction now: FS owns leased batch removal, Server owns
pinned generation lifetime, and Driver Pi retains package policy, presentation, browser behavior,
and supervision. This is not a new package-UI abstraction or release/app monolith.

This planning-only handoff is the final step of the local technical arc. Execute it only after the
local evidence item has landed, the pre-gate orthogonal review has been adjudicated, and the pinned
host reuses one invocation-resolved absolute root path for verification and every request read, and
before asking the release owner to pass the publication gate. It renders one separately reviewable
successor plan, records its exact path and commit hash in the opening arc, and makes that plan the
next technical cross-reference. The adjacent prerequisite reference remains unchecked until that
plan's opening arc completes, so the public-release gate cannot precede the ownership correction. It
authorizes no implementation, Git mutation, publication, or gate passage.

The successor plan starts from this exact mechanism inventory, then narrows it by semantic ownership
rather than assuming every listed file moves:

- `code/sys.driver/driver-pi/-scripts/m.start.gui.evidence.local/-test/-.test.ts`;
- `code/sys.driver/driver-pi/-scripts/m.start.gui.evidence.local/common.ts`;
- `code/sys.driver/driver-pi/-scripts/m.start.gui.evidence.local/mod.ts`;
- `code/sys.driver/driver-pi/-scripts/task.start.gui.evidence.local.ts`;
- `code/sys.driver/driver-pi/-scripts/task.start.gui.reset.ts` and its unit/process proofs under
  `code/sys.driver/driver-pi/-scripts/-test/` and
  `code/sys.driver/driver-pi/-scripts/-test.external/`;
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.ts` and its generated
  `u.start.gui.service.evidence.ts` leaf;
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/u.gui.ts`, `u.identity.ts`,
  `u.materialize.ts`, `u.failure.ts`, `u.state.ts`, `u.screen.ts`, `u.source.ts`, and
  `u.browser.ts`;
- `code/sys.driver/driver-pi/-scripts/-test.external/-task.start.gui.release.local.ts`;
- `code/sys.driver/driver-pi/-scripts/-test.browser.ts`; and
- the attributable task and permission wiring in `code/sys.driver/driver-pi/deno.json`.

Reconcile that inventory against the existing owners at
`code/sys/fs/src/m.Fs.capability/m.Rooted/`, `code/sys/fs/src/m.Pkg.Dist/`,
`code/sys/server/src/m.server.dist/`, and `code/sys/http/src/http.server/`. Add no new package or
facade. The successor plan names source and destination paths, API boundaries, migration order,
proof owners, deletion conditions, and publication consequences.

The target Driver Pi shape is one conceptual TypeScript adapter that declares package policy and
composes the upstream capabilities. Package identity, frozen evidence, source and limit policy,
service name, browser policy, current/legacy store identity, recovery, presentation, and terminal
lifecycle remain Driver Pi-owned. The generated evidence leaf, evidence renderer, permission-isolated
entry, operator reset presentation, and package-owned policy tests remain separate where authority
requires them. Generic batch lease/removal and generation ownership do not remain Driver Pi call-site
mechanism.

### Proof ownership and minimal Driver Pi shape

Correct semantic ownership does not mean moving everything upward. Assign each generic guarantee and
its deepest causal, adversarial, permission, process, and platform proof to exactly one existing
owner. Record the existing proof, destination proof, retained Driver Pi proof, and deletion condition
so the correction neither drops assurance nor leaves duplicate mechanism.

Driver Pi retains package-policy proofs and one thin end-to-end composition lane showing that its
frozen evidence opens an owned generation, admits package identity, reaches an independently
verified host, honors browser and recovery policy, and shuts down in owner order. It does not repeat
upstream path, lease, byte-integrity, materialization, cache, or hosting matrices. Minimal means less
misowned mechanism, not weaker assurance.

## Human release gate

Authority: the human release owner.

The gate blocks only `feat(driver-pi): bind published GUI Dist evidence for release`. The local item
may land and remain useful while the gate is unresolved.

Pass evidence records all of the following as concrete values in this plan:

- one artifact provider, exact HTTPS hostname and immutable/versioned path namespace;
- provider retention, overwrite-refusal, redirect, and credential boundaries;
- one normally trusted non-loopback public HTTPS proof origin;
- the supported browser engines and minimum versions;
- the supported OS/filesystem set for locking, sealing, cold materialization, and warm reuse; and
- either evidence that no prior product build exposed the selected local Service Worker authority or
  an explicit fresh-origin/site-data migration decision.

If the selected provider needs separately owned publication mechanics, add its plan as a
prerequisite rather than implementing credentials, object-store settlement, or a reusable uploader
in Driver Pi. Deferral leaves the public item unchecked and makes no negative claim about the
completed local path.

## `feat(driver-pi): bind published GUI Dist evidence for release`

- Replace the test-rooted entry with the owner-authorized product entry and browser graph;
  production contains no module rooted under `src/-test` and no DevHarness code.
- Freeze one owner-selected Driver Pi package expectation and that authorized production graph, then
  build and verify one candidate exactly as established by the local item.
- Upload the unchanged candidate to the selected immutable/versioned path. Fetch and verify its
  published manifest and every declared asset against the frozen build evidence before generating
  launcher evidence.
- Require manifest and resources to remain on the one selected artifact hostname, with no userinfo,
  query authority, fragment, mutable `latest`, overwrite, or redirect to an unlisted host.
- Generate the launcher evidence leaf only after remote verification, replace the local tuple as one
  complete value, remove the local evidence-regeneration guidance policy, and publish the launcher
  package without rebuilding the GUI. Public mismatch diagnostics never direct an operator to the
  local generator.
- Add only the selected artifact hostname to the named CLI permission surface. Credentials and
  provider mutation mechanics remain outside Driver Pi.
- Execute the same exact Dist under verified-loopback and normally trusted public HTTPS policy.
  Observe the local tombstone worker register, deny loopback deployment, remove owned cache state,
  and unregister; observe public cache-worker registration without certificate, secure-context, or
  browser-profile bypass.
- Prove cold acquisition, warm offline reuse, package/Dist identity, exact remote pin equality,
  frozen-artifact publication, public/local byte equality, tamper refusal, and the selected
  browser/filesystem floors.
- Never add runtime TOFU, provider-supplied authority, post-pin mutation, previous-generation
  fallback, release-to-development fallback, a credential manager, or a release-receipt subsystem.

## Review calibration

- Recalibrate each isolated item from its actual delta before implementation and landed review; do
  not inherit the effort used for this plan or another package boundary.
- The landed shared HTTP/FS/Server predecessors and the remaining Driver Vite and mixed Driver Pi
  subtraction begin at `gpt-5.6-sol • max` because ownership, compatibility, and proof isolation
  dominate file count.
- The additive Schedule/Server tidy-up does not reopen MAX review of this plan's established
  sequence. Recalibrate each concrete implementation and review from its public-contract or
  lifecycle delta without inheriting the plan-level effort.
- The local evidence item begins at `gpt-5.6-sol • max` with BMIND → DMIND → TMIND → S-tier because
  it binds launcher trust and executable cold/warm evidence.
- Recalibrate the breaking HTTP terminology migration and both mismatch-diagnostic commits
  independently. Their public contracts, strict-result admission, trust terminology, and
  browser/terminal separation dominate their small diff sizes; transport, materialization, and
  consumer owners retain separate proof.
- The pre-gate orthogonal pass uses the human-selected Opus 5 reviewer over the complete landed
  local chain for a distinct composition/security error surface, not as a duplicate vote.
- The published release item begins at `gpt-5.6-sol • max` with BMIND → DMIND → TMIND → S-tier
  because publication ordering and external provenance are irreversible.
- Estimates, plans, and reviews are evidence, not implementation or Git-mutation authority.

## Stop conditions

Stop rather than broaden the plan if:

- `localhost:8080` would be represented as immutable public publication or public HTTPS proof;
- the verified application host would expose `dist.json` or be conflated with local serving;
- source presence, first fetched bytes, browser state, or provider responses would become trust;
- the local substrate proof would require product-entry redesign or implicit build ownership;
- the published-release item would keep a test-rooted entry or include DevHarness code;
- evidence generation would enter the Vite application graph or rebuild the candidate after pinning;
- raw request spelling would become application authority or require a custom parser solely to
  reject aliases already normalized by the HTTP substrate;
- the launcher would start the source, repair automatically, or merge release/development authority;
- a received checksum would become authority, a replacement pin, or an automatic regeneration input;
- local regeneration guidance would be inferred from an arbitrary URL/port or survive published
  evidence binding;
- the public item would proceed without the recorded human gate values;
- selected provider mechanics would require a generic Driver Pi uploader or credential surface; or
- proof would require weakening URL, redirect, certificate, browser, filesystem, sealing, or
  permission checks.
