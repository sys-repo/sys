# start:gui — Architecture Review

Posture: BMIND + TMIND + S-tier. DEEP PASS.
Subject: `@sys/driver-pi` `start:gui` boot system.
Status: review artifact. Not a plan. Grants no implementation or Git authority.

Evidence base (opened this session):

```text
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/m.main.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u/u.start.gui.service.ts
code/sys.driver/driver-pi/src/m.core/m.cli.profiles/u.start/{u.gui,u.source,u.materialize,u.deps,u.screen,u.lifecycle}.ts
code/sys.driver/driver-pi/{deno.json,vite.config.ts,src/index.html,src/-test/entry.tsx,src/-test/-sw.ts,dist/dist.json,dist/sw.js}
code/sys/server/src/m.server.dist/{t.ts,m.DistServer.ts,u.server/{u.start,u.host,u.input,u.path,u.read}.ts,u/u.materialize.ts}
code/sys/fs/src/m.Pkg.Dist/u.verify/{u.pinned.ts,u.pinned.tree.ts,u.pinned.manifest.ts}
code/sys/http/src/http.server/m.HttpServer/u/u.serveFileBytes.ts
code/sys/process/src/m.open/u.invokeDetached.ts
code/sys.driver/driver-vite/src/{m.vite/t.ts,m.vite/u/u.build.ts,-entry/u.serve.ts}
-agent/-plan/@sys.driver-pi/start-ui.design.md
.pi/@sys/dist/**   (live store state)
```

---

## 0. Verdict

The lower kernel is genuinely strong and should not be touched. `FsPkg.Dist.Pinned.verify` does
TOCTOU-resistant `dev`/`ino`/`size`/`mtime`/`ctime` identity comparison across open, exact-size reads
with trailing-byte rejection, symlink refusal, ancestor-chain validation, and `assertExactTree`
whole-tree closure. `Dist.materialize` stages privately, verifies completely, promotes atomically,
and fails closed with sanitized evidence. `DistServer` binds loopback only, admits an exact `Host`
allowlist, and re-authenticates every byte it emits. This is the load-bearing work and it is done.

The Driver Pi layer above it is where the design is confused, and the confusion is not in the
mechanics — it is in the ontology. Three category errors, three live defects.

The recommendation is a **two-origin, single-state-value boot supervisor** with a **zero-JavaScript
server-rendered boot host**, **two structurally disjoint source channels**, and **no durable
browser-side state anywhere**. It removes one entire channel, one entire artifact, and one entire
class of race, rather than adding machinery to manage them.

---

## 1. Category errors

### 1.1 The bootstrap is a view, not a plane

The proposed three-plane cut — bootstrap/control, acquisition/source, verified Dist — mixes
**lifecycle phase** with **trust domain**. Once "bootstrap" is named a plane, it acquires a budget,
then a bundler, then state, then a version, then a service worker. It becomes the second application
the review question already suspects it is.

The load-bearing cut is trust:

- **Plane A — Launcher.** The Deno process. Owns authority declaration, the boot state value, both
  listeners, both renderers, the browser handoff, and lifecycle. Package-owned bytes only.
- **Plane B — Acquisition.** A pure function `(location, authority) → verified generation | sanitized
  failure`. Owned entirely by `Dist.materialize`. Driver Pi supplies inputs and interprets results
  and owns no logic here.
- **Plane C — Generation.** The untrusted payload, reachable only through one browser origin, with
  only the capabilities the host grants.

The terminal screen and the browser boot page are **two renderers of one Plane A state value**. That
is the whole reframing. It costs one enum and dissolves the "second application" problem, the
state-duplication problem, and the terminal/browser-disagree problem simultaneously.

### 1.2 "The Dist payload is opaque" is false for one class of content

The plan scopes out service-worker behavior as UI concern under payload opacity. A payload that
registers a service worker is **not** opaque: it installs a persistent, origin-scoped, host-outliving
interceptor on the same origin the verified host owns. It is a co-tenant of the trust boundary, not
cargo.

Payload opacity is correct for everything the payload does *inside* its own execution context. It is
wrong for anything the payload installs *in the user agent* that survives the payload. Restate the
boundary that way and the service worker moves in scope where it belongs.

### 1.3 The static localhost pin is not a broken value; it is a broken mechanism

`START_GUI_SERVICE.source` pins `http://localhost:8080/dist.json` at
`sha256-07d24ba1…`. Every Vite build produces a new `dist.json` (it embeds `build.time`), so the pin
is stale the moment anyone builds. The current artifact reports `pkg.version 0.0.131`; the package is
at `0.0.137`.

Treating this as "a value to refresh" is the trap. A mechanism whose correct state must be
hand-restored after every build will be *disabled*, not maintained — and the cheapest way to disable
it is TOFU. The fix is not automation of the pin. It is deleting the channel that needs one (§3.4).

---

## 2. Live defects (evidence, not inference)

### 2.1 A service worker ships inside the GUI artifact — critical

```text
driver-pi/vite.config.ts        → Vite.Config.paths({ app: { entry, sw } })
driver-pi/src/-test/entry.tsx   → navigator.serviceWorker.register(new URL('../sw.js', ...))
driver-pi/dist/sw.js            → Http.Cache.pkg({ pkg }); Http.Cache.Cmd.listen(...)
.pi/@sys/dist/@sys.driver-pi/sha256-07d2…/sw.js   ← already promoted into a verified generation
```

Consequences under the current design:

- `DistServer.start` is called with `port: 0`. Browser origins are `scheme://host:port`, so **every
  launch is a different origin** and the OS reuses ports. A service worker installed by generation A
  on `127.0.0.1:54321` will control whatever binds `127.0.0.1:54321` next — a different generation,
  or the boot host. That is a cross-generation confused deputy with no verification step in the path.
- `Cache-Control: no-store` is not a defense. The Cache API stores responses the worker chooses to
  store; `no-store` does not bind it.
- The verified host can be bypassed entirely: after install, the worker answers navigations from
  `CacheStorage` without a single request reaching the process that authenticates bytes.

A service worker adds nothing here. The Dist is already local, already on disk, already served by a
local host. The worker is a second, unverified, unversioned, host-outliving copy of the same bytes.
**It is pure liability with zero benefit in this architecture, and its removal is a permanent
invariant, not a temporary mitigation.**

### 2.2 Warm-cache offline is currently false — `.DS_Store` bricks the generation

```text
.pi/@sys/dist/@sys.driver-pi/sha256-07d24ba1…/.DS_Store   ← exists now
```

`assertExactTree` throws `unexpected-entry` for any observed path not in
`{'dist.json'} ∪ declared parts ∪ implied directories`. The manifest ignore rules are
`['dist.json', 'dist.json.sig']`; `.DS_Store` is not among them, and ignore rules are not applied to
the observed tree. So the promoted generation on this machine **already fails verification**, and
`Dist.materialize` will return
`{ stage: 'existing-verification', reason: 'unexpected-entry'-family, publication: 'occupied' }`.

Any ambient macOS process — Finder rendering the folder, a backup agent, a sync client — permanently
invalidates the only offline artifact. The strictness is right; the exposure is the bug. The
generation directory must be made hostile to ambient writes (`0500` on promote), and corruption must
degrade gracefully (§3.6).

The Vite build already runs `remove('**/.DS_Store')`, which is direct evidence the team has met this
before at a different layer.

### 2.3 No content policy on the hosted origin

`serveFileBytes` emits exactly two security-relevant headers:

```text
cache-control: no-store
x-content-type-options: nosniff
```

No `Content-Security-Policy`, no `Cross-Origin-Resource-Policy`, no `Cross-Origin-Opener-Policy`, no
`Referrer-Policy`, no `frame-ancestors`. The system does exact cryptographic work to prove the
provenance of every byte and then grants those bytes unrestricted ambient browser authority. CORS is
off, which prevents cross-origin *reads*, but does not prevent `<script src>`, `<img>`, `<link>`,
framing, or top-level navigation from any page the human visits.

### 2.4 Two store roots, silently duplicated

```text
.pi/@sys/dist/@sys/driver-pi/     668K
.pi/@sys/dist/@sys.driver-pi/     688K
```

Both hold the same generation hash. `PiFs` derives `state` and `log` siblings as `@sys.driver-pi`
(`Pkg.toFileNamespace` convention); the `@sys/driver-pi` tree is historical drift. Any reset task
written today will appear to succeed while leaving a stale tree behind.

### 2.5 Version skew is unenforced

Artifact `pkg.version 0.0.131` vs package `0.0.137`. Nothing in the start path compares
`generation.verification.dist.pkg.version` against `pkg.version`. `@sys/driver-pi@X` is currently not
a single truthful noun.

---

## 3. Recommended architecture

### 3.1 Shape

One supervisor, two origins, one state value, two channels, no durable browser state.

```text
                       ┌─────────────────────────────────────────────┐
                       │  PLANE A · Launcher (Deno, package bytes)    │
                       │                                              │
  start:gui  ──────────┤   boot state value  ── renders ──┬─→ terminal screen        │
                       │        ▲                          └─→ boot host (origin 1)  │
                       │        │                                                    │
                       │   channel selection (explicit, disjoint)                    │
                       └────────┼─────────────────────────────────────┘
                                │
              ┌─────────────────┴──────────────────┐
              │                                    │
     release channel                        dev channel
     Dist.materialize                       DistServer.Local.start
     {manifestUrl, integrity}               { dir: <checkout>/dist }
     pinned authority                       local-verified, unpinned
              │                                    │      (unreachable from a published build)
              └─────────────────┬──────────────────┘
                                ▼
                       ┌─────────────────────────────────────────────┐
                       │  PLANE C · Generation origin 2               │
                       │  DistServer.start(dir, integrity)            │
                       │  127.0.0.1:<port derived from integrity>     │
                       │  every byte re-verified per request          │
                       └─────────────────────────────────────────────┘

  handoff:  origin 1  ──303 / meta-refresh──▶  origin 2
  origin 1 stays alive for the whole process lifetime
```

### 3.2 Two origins, and a boot host that is not an application

**Two origins, not one.** Origin is the browser's only real authority boundary. Bootstrap authority
and generation authority are different authorities; sharing an origin complects them at the one layer
where they can never be un-complected later — shared `CacheStorage`, shared `localStorage`, shared
service-worker scope, shared CSP. A single host with route ownership is simpler on the server and
strictly worse in the user agent. Reject it.

**But the boot host must not be an application.** Make it a **server-rendered, zero-JavaScript status
page**:

- the launcher renders the current boot state value to HTML in the Deno process;
- `<meta http-equiv="refresh" content="1">` polls;
- handoff is `303` (or a `content="0;url=…"` refresh) to the generation origin;
- CSP `default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none';
  form-action 'none'`.

Properties this buys, none of which a "tiny app" buys:

- The invariant *"executes only package-owned bytes"* is satisfied **trivially**, because it executes
  no bytes.
- Service workers are structurally impossible: no script, plus `worker-src` denied by `default-src
  'none'`.
- The state machine exists in exactly one place. There is no second copy to drift.
- No bundler, no version, no dependency on React or `@sys/ui-*`, no tree-shaking question, no
  DevHarness leakage.
- **It deletes cleanly.** When `sys.app.shell` arrives, a native window renders boot state with no
  origin at all and this whole surface disappears in one commit. A React boot app would not. For a
  system meant to survive its authors, *cheap to delete* is a first-class property.

Cost: a ~1s repaint flicker during acquisition. That is the honest price, and it is small for a
surface that lives 1–20 seconds.

**The boot host is long-lived, not transient.** It binds before materialization and stays up for the
process lifetime. This is what settles the handoff-race family:

| race | with a transient boot host | with a long-lived boot host |
|---|---|---|
| human closes the boot tab early | launcher may block or orphan | irrelevant; launcher never depends on it |
| promotion completes between poll and refresh | duplicate/lost redirect | redirect is idempotent and re-servable |
| generation host dies after redirect | browser lands on a dead origin, no story | human returns to a stable origin that explains it |
| human bookmarks the URL | bookmark rots each launch | boot origin is stable and always answers |

Cost: one idle listener. Buy it.

**Origin identity must be deterministic.**

- Boot origin: a fixed port derived from package identity (`@sys/driver-pi` + major), stable across
  launches. Fail closed if unavailable — never fall back to a different port silently.
- Generation origin: a port derived from the generation integrity, e.g.
  `49152 + (u16(integrity) mod 16384)`, with a deterministic derived probe sequence on collision.

Why not `port: 0`: ephemeral ports are reused by the OS, so *browser state keyed by origin leaks
across generations*. With integrity-derived ports, **one generation ↔ one origin, forever**. A stale
tab from last week can only ever reach its own generation; it cannot silently be answered by a
different one. Version transition becomes origin transition, which the browser already isolates for
free.

The residual risk of a predictable port is denial of service by a local squatter — but a squatter
never gets to serve bytes to the browser, because the launcher hands over `started.origin` only after
*its own* bind succeeded, and refuses otherwise. DoS, not confusion. Accept it.

**Hand over exactly one canonical form.** `acceptedAuthorities` currently admits `localhost:port`,
`127.0.0.1:port`, and the listener addr. Those are *different browser origins* with different storage
partitions and different CSP realms. Narrow the allowlist to the exact authority the launcher hands
the browser — recommend `127.0.0.1`, since `localhost` can resolve to `::1` or be redirected via
`/etc/hosts` — and return `421` for the others.

### 3.3 The boot state machine

One value. Two renderers. Nothing the lower APIs cannot prove.

```text
starting          process up, nothing decided
checking-local    verifying the integrity-addressed generation on disk
acquiring         no local generation; fetching the declared channel
                    · manifest
                    · assets   (n of total, bytes)
                    · verifying
                    · promoting
serving           generation hosted; origin known
blocked           terminal, typed reason
stopping          shutdown in progress
```

`blocked` reasons are **product stories**, not rewrapped lower codes:

| reason | maps from | user-facing meaning |
|---|---|---|
| `config-invalid` | pre-flight URL/pin rejection | the declared source is malformed; nothing was contacted |
| `source-unreachable` | `manifest-fetch/*`, `resource-pull/*` | could not reach the source |
| `authority-mismatch` | `integrity-mismatch` | the source answered, but not with the pinned artifact |
| `payload-rejected` | `manifest-admission/*`, `stage-verification/*` | the artifact is malformed or over limits |
| `generation-corrupt` | `existing-verification/*` + `publication: 'occupied'` | the local copy is damaged |
| `storage-unavailable` | `storage/filesystem-failure` | cannot write to the store |
| `cancelled` | `cancelled` | stopped by request |

Honesty rules that must survive the authors:

- **`source-unreachable` must not be split.** The sanitized lower result cannot distinguish HTTP 404
  from connection refusal from timeout from generic transport failure. Guessing produces a message
  that misleads a maintainer at 2am. State the ambiguity once, plainly, in the copy itself:
  *"Could not reach the configured source. This does not distinguish an unavailable endpoint from a
  missing artifact."* The plan's existing instinct here is correct — keep it and make it a rule.
- **Raw lower evidence never reaches the browser.** `stage`/`reason`/`cleanup`/`publication` are
  operator surface: terminal only. The browser sees the product story. The composite string
  `start:gui materialization failed: manifest-fetch/resource-failure` is a terminal artifact.
- **`generation-corrupt` is the only state that may reference the reset action.**
- **`serving` is not a browser-visible state.** Once handed off, the boot host has no further claim.
  Do not build a "connected" indicator; it becomes a lie the instant the app owns the tab.
- **Never claim navigation succeeded.** `Open.invokeDetached` proves detached-opener spawn only. On a
  headless or SSH session no browser exists; the terminal must present the URL as *the* action, not
  as a confirmation.

### 3.4 Two channels, structurally disjoint

Delete the HTTP dev channel. It exists only to exercise the release code path; exercise that with a
loopback test fixture, not with the human's daily loop.

```text
release channel   Dist.materialize({ manifestUrl, integrity })  →  DistServer.start(...)
                  pinned. the default. the only channel reachable without an explicit act.

dev channel       DistServer.Local.start({ dir: <package-checkout>/dist })
                  local-verified, unpinned. no HTTP, no dist.json fetch, no pin, no receipt file.
```

This is what the delivered foundation already says `DistServer.Local` is for: *"suitable for a
development preview provider, not release trust."* Use it as designed.

Downgrade becomes **unrepresentable rather than forbidden**:

- The two channels share no field shape, so per-field merge cannot express a hybrid.
- Dev requires an explicit CLI act; release is the default and is never a fallback *from* dev, and
  dev is never a fallback *from* release. Either channel failing is `blocked`, full stop.
- The dev branch is guarded by package resolution: it exists only when `@sys/driver-pi` is running
  from the checkout that produced `./dist`. Resolved from JSR, **the code path does not exist**.
  Same-provenance by construction; it cannot be smuggled into a published build.

Dev preview must announce itself: distinct fixed port, and the terminal states
`development preview — unpinned local authority`. Do not invent a boot-data seam to tell the browser;
the distinct origin plus terminal copy is sufficient and adds no coupling.

What this deletes: the stale pin, `localhost:8080` as a trust surface, the "refresh the hash after
every build" ritual, and the entire local-port-impersonation exposure on the dev path.

### 3.5 Release authority

```text
1. build      Vite.build → dist/ + dist.json + manifest.integrity   (exact saved bytes)
2. freeze     publish dist/ to an immutable, version-addressed location
3. bind       write { manifestUrl, integrity } into driver-pi source
4. publish    bump @sys/driver-pi to the version whose UI those bytes are
```

Rules:

- **Version is a hard binding, not a warning.** Assert
  `generation.verification.dist.pkg.version === pkg.version` at startup and refuse to serve on
  mismatch. Publishing the launcher therefore requires re-freezing the artifact. That is a build
  step, not a design compromise, and it makes `@sys/driver-pi@X` a single truthful noun. The
  alternative — a separate declared `uiVersion` — is the same value with extra words; tolerating skew
  with a banner invites exactly the 0.0.131/0.0.137 drift that exists today.
- **No mutable `latest`.** The version is in the URL path.
- **Authority is never fetched from the artifact endpoint.** The current implementation satisfies
  this. The corollary must be stated: this permanently forbids an update-check endpoint that returns
  a new pin. Update = new package version.
- `dist.json.sig` already appears in the manifest ignore rules. Detached signing is a designed
  extension point. Explicit non-goal now (§7).

### 3.6 Offline-first

The two meanings are genuinely different products:

| | warm-cache offline | first-launch offline |
|---|---|---|
| guarantee | after one acquisition, all launches work with every source down | works with no network, ever |
| requires | nothing extra | the bytes ship inside the package |
| publish coupling | none | total — every launcher patch republishes the UI |
| what the pin means | binds your declaration to a remote immutable artifact | self-attestation; JSR package integrity is the real authority |

**Recommend warm-cache offline as the default**, first-launch offline named and deferred.

The architectural cost of first-launch offline is not disk. It is that the package *becomes* the
artifact, which collapses the distribution option space permanently and makes the verification kernel
ceremony rather than added trust. That is acceptable — but it must be chosen knowingly, and it is the
one decision evidence cannot settle (§9).

**Warm-cache offline does not currently work and must be repaired before it can be claimed** (§2.2):

- **Seal promoted generations** — `chmod 0500` on promote. Finder silently skips `.DS_Store` in a
  non-writable directory; sync and backup agents read rather than write. This is the real fix, and it
  raises the tamper bar as a side effect. Windows needs the equivalent for `desktop.ini`/`Thumbs.db`.
- **Degrade gracefully** — on `generation-corrupt`, self-heal by discard-and-reacquire **only when a
  source is reachable**. When offline, report `generation-corrupt` and offer the scoped reset. Never
  destroy the only offline generation in order to retry something that cannot succeed.
- Do **not** relax `assertExactTree`. It is the crown jewel.

**Corollary invariant: the generation origin holds no durable browser state.** All durable state
lives behind host seams (`@sys/server/files` already exists for this). This is not an ascetic rule —
it is what makes origin churn free, makes reset filesystem-complete, makes `Clear-Site-Data`
unnecessary, and makes a version upgrade not silently inherit a previous version's IndexedDB schema.
It dissolves the port question rather than answering it.

### 3.7 Reset

Two explicit operations. Never one ambiguous one.

```text
deno task gui:reset          remove the active pinned generation + private stages; keep others
deno task gui:reset --all    remove every generation under the Driver Pi store root
```

- **The narrow one is the default.** The wide one can destroy the only offline artifact; the
  dangerous operation gets the extra keystroke.
- `--all` is what cold-start testing needs. Say so in the help text.
- Confine to exactly `<runtime-root>/.pi/@sys/dist/<store-id>` with a descendant guard. Never infer
  the target from the package cwd. Never touch `.pi/@sys/state`, `.pi/@sys/log`, sibling stores, or
  anything else under `.pi`. Missing target succeeds idempotently.
- `chmod` before remove, since generations are sealed (§3.6).
- **Refuse `--all` when no configured source is reachable**, or require `--force`. Destroying the only
  working offline generation while offline is the most user-hostile outcome in the system; a cheap
  reachability probe before an irreversible act is proportionate.
- **Migrate the legacy store id in the same commit.** `@sys/driver-pi` → `@sys.driver-pi`. Otherwise
  reset will appear to work and leave 668K of stale tree (§2.4).
- Reset needs no browser-side counterpart, because of the no-durable-browser-state invariant.

### 3.8 Additional risks worth naming

- **Loopback is reachable from any web page.** CORS blocks reads but not `<script src>`, `<img>`,
  framing, or navigation. Highest-leverage single mitigation: **admit only
  `Sec-Fetch-Site: same-origin | same-site | none`** and reject `cross-site`. That one check kills
  drive-by loopback probing and port enumeration from web pages while leaving the app fully
  functional. Pair it with `Cross-Origin-Resource-Policy: same-origin` and CSP `frame-ancestors
  'none'`.
- **`Open.invokeDetached` Linux fallback** passes the URL into `powershell.exe -Command Start-Process
  <url>` and `cmd.exe /C start "" <url>`. Not exploitable today because the URL is launcher-generated
  loopback. Make that an invariant: the handoff URL is constructed only from `started.origin` and
  never from any manifest, remote, or profile value.
- **Hard-kill during promotion** leaves stage directories under `.sys-rooted/stages/`. `discardStage`
  covers the failure paths but not `SIGKILL`. Add bounded stage GC at next start, confined to the
  store root and to stages older than a fixed age.
- **No `stopping` render on `SIGTERM`/`SIGHUP`.** Only keyboard quit and server completion are
  handled. Wire process signals into the same `until`.
- **Green mocked tests are not permission proof.** Already stated in the plan. Keep it stated.

---

## 4. Question index

| Q | answered in |
|---|---|
| 1 three-plane decomposition | §1.1 — sound in spirit, mis-cut; bootstrap is a view of Plane A |
| 2 is a separate bootstrap simplest | §3.2 — yes, but as a zero-JS server-rendered page, not an app |
| 3 origins / handoff / SW / CSP / lifecycle / deputy | §2.1, §2.3, §3.2, §3.8 |
| 4 state machine | §3.3 |
| 5 development authority flow | §3.4 — dissolved by deleting the HTTP dev channel |
| 6 release authority and version binding | §3.5 |
| 7 offline-first, two meanings | §3.6 — warm-cache default; and it is currently broken |
| 8 does the Dist ship in the package | §5 and §9 |
| 9 reset scope | §3.7 — two explicit operations |
| 10 proof matrix | §6 |
| 11 missed risks | §2, §3.8 |
| 12 one architecture + one human decision | §3, §9 |
| 13 diagram / invariants / arc / non-goals / acceptance | §3.1, §5, §7, §8, §10 |

---

## 5. Distribution models (Q8)

| model | first-launch offline | publish coupling | what the pin means | infra owned |
|---|---|---|---|---|
| package-local bytes | yes | total | self-attestation; JSR integrity is the real authority | none |
| **versioned JSR-hosted artifact** | no | decoupled | binds your declaration to an immutable registry URL | none |
| separately hosted (R2/CDN) | no | decoupled | same, but you own uptime and provenance | real |
| hybrid fallback | yes | total | **two authorities for one noun — reject** | real |

**Reject the hybrid outright.** It reintroduces exactly what the invariants forbid: two sources of
truth for "which bytes are the app", with an implicit precedence rule no future maintainer will
remember. If the bytes ship, ship only the bytes.

**Recommend the versioned JSR-hosted artifact** — a separate package, e.g.
`@sys/driver-pi.ui@<version>`, resolved through its immutable JSR file URL:

- JSR already provides immutable versioned URLs and its own integrity, so the SHA-256 pin becomes
  defense in depth rather than duplicated trust;
- no infrastructure, uptime, or provenance story to own;
- `@sys/driver-pi` still **owns** the artifact — it declares the pin and the version. That is the
  correct reading of ownership: who names the authority, not where the bytes sit;
- the CLI stays small; a launcher you install should not carry 700KB of JS you may never open;
- the pin shape is identical to package-local bytes, so moving later costs nothing structural.

The honest cost: JSR is a network dependency, so this is warm-cache offline, not first-launch
offline.

---

## 6. Proof matrix

Every row asserts: user-visible state, listener behavior, browser behavior, disk effect. `boot` =
boot origin; `gen` = generation origin.

| # | scenario | precondition | state | boot listener | gen listener | browser | disk |
|---|---|---|---|---|---|---|---|
| 1 | cold + dev source available | no generation; running from checkout; `./dist` built | `checking-local` → `serving` | up, then redirects | up on derived port | boot → 303 → gen | none (Local channel serves in place) |
| 2 | cold + release source available | no generation; pin reachable | `checking-local` → `acquiring` → `serving` | up, renders progress | up after promote | boot → 303 → gen | one generation promoted; no stage residue |
| 3 | cold + source unavailable | no generation; endpoint down | `blocked/source-unreachable` | **up**, renders the reason | never starts | boot only; no navigation attempt | no generation; no stage residue |
| 4 | warm + all sources unavailable | verified generation on disk; network off | `checking-local` → `serving` | up, then redirects | up | boot → 303 → gen | untouched; zero network calls |
| 5 | wrong pin | pin ≠ served `dist.json` bytes | `blocked/authority-mismatch` | up, renders the reason | never starts | boot only | nothing written; no partial stage |
| 6 | tampered manifest | manifest bytes match pin, declared parts do not | `blocked/payload-rejected` | up | never starts | boot only | stage discarded; `cleanup: 'complete'` |
| 7 | tampered asset | one asset byte-flipped in flight | `blocked/payload-rejected` | up | never starts | boot only | stage discarded; no promotion |
| 8 | occupied corrupt generation, source up | `.DS_Store` written into generation | self-heal: discard → `acquiring` → `serving` | up | up after re-promote | boot → 303 → gen | generation replaced; sealed `0500` |
| 9 | occupied corrupt generation, source down | same, offline | `blocked/generation-corrupt` + reset guidance | up | never starts | boot only | **generation preserved, not destroyed** |
| 10 | reset then reacquire | `gui:reset`; source up | `checking-local` → `acquiring` → `serving` | up | up | boot → 303 → gen | only the active generation removed; siblings, `state/`, `log/` intact |
| 11 | reset `--all` while offline | no source reachable | refused | n/a | n/a | n/a | **nothing removed** |
| 12 | release source unavailable, dev not selected | published build, endpoint down | `blocked/source-unreachable` | up | never starts | boot only | **no dev fallback path exists in the graph** |
| 13 | boot route 404 | `GET /boot/nope` | n/a | `404`, `no-store`, CSP present | n/a | n/a | none |
| 14 | gen route 404 | `GET /nope` | `serving` | up | `404`, `no-store`, `nosniff`, CSP present | n/a | none |
| 15 | version skew | artifact `pkg.version` ≠ package version | `blocked/payload-rejected` (version) | up, names the mismatch | never starts | boot only | generation left in place |
| 16 | cross-origin probe | `fetch`/`<script src>` from a web page | `serving` | — | rejects on `Sec-Fetch-Site: cross-site` | — | none |
| 17 | wrong Host header | `Host: evil.test` | `serving` | `421` | `421` | — | none |
| 18 | port squatted | derived port pre-bound by another process | `blocked` (bind) | up, names it | never starts | boot only | none |
| 19 | keyboard quit mid-acquire | `q` during asset pull | `stopping` | closes | never started | — | stage discarded; no orphan |
| 20 | `SIGTERM` mid-promote | signal during `promoteStage` | `stopping` | closes | — | — | stage GC'd at next start |
| 21 | no browser present | headless / SSH | `serving` | up | up | none — terminal presents the URL as the action | generation intact |
| 22 | service worker registration attempt | payload calls `serviceWorker.register` | `serving` | — | blocked by CSP `worker-src 'none'` | registration rejects | none |

Rows 3, 9, 11, 12, and 22 are the ones that encode the invariants; if any of them regresses, the
architecture has been lost regardless of what else is green.

---

## 7. Commit arc (smallest coherent)

Commits 1–3 are independently valuable and should land first **regardless of whether the rest of this
design is accepted**. They close live defects in shipped code.

```text
- [ ] fix(driver-pi): remove the service worker from the GUI artifact
- [ ] fix(server.dist): constrain hosted responses to same-origin script-bounded authority
- [ ] fix(fs.pkg.dist): seal promoted generations against ambient writes
- [ ] feat(driver-pi): serve an always-available loopback boot host
- [ ] refactor(driver-pi): drive start:gui from one boot state machine
- [ ] feat(driver-pi): resolve start:gui through disjoint release and dev channels
- [ ] feat(driver-pi): refuse GUI artifact and package version skew
- [ ] chore(driver-pi): add scoped start:gui generation reset tasks
```

Boundaries:

1. Removes `sw` from `vite.config.ts`, deletes `src/-test/-sw.ts`, removes the registration block from
   the entry, rebuilds. Artifact-only; no runtime composition change.
2. CSP, `Cross-Origin-Resource-Policy`, `Cross-Origin-Opener-Policy`, `frame-ancestors`,
   `Sec-Fetch-Site` admission. Lands in `@sys/server`/`@sys/http`; benefits every consumer.
3. `0500` on promote, `chmod` before discard/remove, Windows equivalent. Lands in the promotion owner,
   not in Driver Pi.
4. Boot host: stable derived port, server-rendered zero-JS page, own CSP, `303` handoff, process
   lifetime, owned by the same `until`.
5. One state value, two renderers, typed `blocked` reasons, no raw lower evidence in the browser.
   This is where "materialization failure opens no listener" is resolved — the boot listener now
   exists first, by design.
6. Release pin from source constant; dev via `DistServer.Local` over the checkout `dist/`, guarded by
   package resolution. Replaces the stale `localhost:8080` pin and deletes the HTTP dev channel.
7. Startup assertion on `dist.pkg.version` vs `pkg.version`.
8. `gui:reset` / `gui:reset --all`, confinement guard, offline refusal, legacy store-id migration,
   stage GC.

---

## 8. Non-goals

- Detached signature verification (`dist.json.sig`). The slot exists; the mechanism is out of scope.
- Update discovery, channels, aliases, rollback, or generation garbage collection beyond stage GC.
- Any boot-data seam that passes profile, filesystem, process, or source information into browser
  props. Query strings and mutable static files are explicitly forbidden as improvised substitutes.
- Native `sys.app.shell` integration — but note it **obsoletes the boot host entirely**, which is
  precisely why the boot host must stay cheap to delete.
- R2, Cloudflare, deploy-provider, or public-origin work.
- Changing `@sys/tools`, or making Driver Pi depend on it.
- Reimplementing hash, filesystem, HTTP, or verification kernels in Driver Pi.
- First-launch offline, pending the human decision in §9.
- Restyling or extending the terminal screen beyond rendering the shared state value.

---

## 9. The one human decision

Everything above is resolvable from evidence except this:

> **Must a first launch with no network show the real GUI?**
>
> - **No** → versioned JSR-hosted artifact; warm-cache offline. `@sys/driver-pi` stays small, the
>   release channel stays real and exercised, and the pin binds a genuinely external artifact.
>   *(Recommended.)*
> - **Yes** → package-local bytes, and accept that every launcher publish republishes the UI, that
>   authority collapses to JSR package integrity, and that install size grows by the bundle.

No amount of code inspection settles this. It is a promise about what *local-first* means to the
human, and it must remain an explicit, recorded decision.

---

## 10. Acceptance criteria (S-tier)

Structural:

1. No service worker exists in the artifact, and CSP makes registration impossible on both origins.
2. Every hosted response carries CSP, `Cross-Origin-Resource-Policy`, `nosniff`, and `no-store`;
   `Sec-Fetch-Site: cross-site` is rejected.
3. One boot state value with exactly two renderers. Grepping the repo finds no second copy of the
   state enum, and no browser-side state machine.
4. The boot page contains zero `<script>` elements. Asserted by a test over the rendered bytes.
5. The dev channel is absent from the module graph of a published build. Asserted, not documented.
6. Release and dev channels share no field shape; no per-field merge is expressible in the types.
7. `generation.verification.dist.pkg.version === pkg.version` is a startup refusal.
8. One generation ↔ one origin. No two generations can share a port within a session.
9. No durable browser state on the generation origin. `localStorage`, `IndexedDB`, and `CacheStorage`
   are unused by the product renderer; DevHarness persistence stays in `-spec`.

Behavioral:

10. All 22 proof-matrix rows pass, on real loopback, against the real materializer and server — not
    mocks. Rows 3, 9, 11, 12, and 22 have dedicated named tests.
11. Warm launch with the network physically off performs zero network calls and reaches `serving`.
12. `.DS_Store` written into a promoted generation either fails to be created (sealed) or degrades to
    `generation-corrupt` without destroying the generation while offline.
13. Every failure path settles with no listener, no keyboard handle, no stage directory, and no
    hanging promise. `--trace-leaks` clean.
14. Terminal output fits measured cell width at 40, 80, and 200 columns, with ANSI, emoji, and
    combining marks. Measured with `Cli.Fmt.Text.Width.measure`, never `.length`.

Legibility — the standard a successor must be able to meet:

15. A maintainer who has never seen this code can answer, from the source alone and within ten
    minutes: *where does release authority come from*, *what can the browser payload reach*, and
    *what does reset destroy*.
16. No message shown to a human claims something the lower APIs cannot prove. In particular,
    `source-unreachable` states its own ambiguity rather than guessing a cause.
17. The boot host can be deleted in a single commit when a native shell arrives, with no change to
    the channels, the state machine, or the generation host.

---

🏛️

• `sys/AGENTS.md`
• `sys.canon/AGENTS.md`
• `sys.canon/-canon/README.md`
• `sys.canon/-canon/-sys.md`
• `sys.canon/-canon/gotchas.md`
• `sys.canon/-canon/posture.bmind.md`
• `sys.canon/-canon/posture.dmind.md`
• `sys.canon/-canon/posture.stier.md`
• `sys.canon/-canon/posture.tmind.md`
• `sys.canon/-canon/protocols.md`
• `sys.canon/-canon/protocol.cli.md`
• `sys.canon/-canon/protocol.deno.md`
• `sys.canon/-canon/protocol.formatting.md`
• `sys.canon/-canon/protocol.git.md`
• `sys.canon/-canon/protocol.git.stash.md`
• `sys.canon/-canon/protocol.jsr-doc.md`
• `sys.canon/-canon/protocol.lang.md`
• `sys.canon/-canon/protocol.libs.md`
• `sys.canon/-canon/protocol.module.md`
• `sys.canon/-canon/protocol.skills.md`
• `sys.canon/-canon/protocol.testing.md`
• `sys.canon/-canon/protocol.tmpl.md`
• `sys.canon/-canon/protocol.types.md`
• `sys.canon/-canon/protocol.ui.component.md`
• `sys.canon/-canon/protocol.work-state.md`
