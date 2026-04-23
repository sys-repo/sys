# Packet D: `driver-vite` persistent transport transform cache

## Depends on
- `./dev-startup-perf.review.md`
- `./dev-startup-perf.resolve-reuse.packet.md`
- `../tmind/dev-startup-perf/04.transport-economics.md`
- `../tmind/dev-startup-perf/05.vite-native-levers.md`
- `../tmind/dev-startup-perf/07.measurement-and-proof-design.md`
- `../tmind/dev-startup-perf/08.stier-cross-review.md`
- `../tmind/dev-startup-perf/09.distill-ranked-actions.md`

## Status
Historical/implemented packet note.

Packet D landed as a narrow first slice in the transport layer:
- persistent dev-only transform cache
- stored under resolved Vite `cacheDir`
- remote immutable transported modules only
- no persistent resolve cache in this packet

Current outside-in cache/resolve truth is tracked in:
- `./dev-startup-perf.callsite-cache-truth.md`

## Human trigger
Outside-in call-site remeasurement after Packet A showed:
- startup-to-ready improved materially
- same-session reloads became fast
- fresh restart first render remained very slow
- the dominant remaining seam on first browser load is now transport-side module work:
  - `transport.resolveDeno`
  - `transport.loadDenoModule`
  - `transport.transform.esbuildCli`

That changes the next optimization question.
The next packet is no longer primarily about startup bootstrap reuse inside one process.
It is about avoiding repeated immutable transport work across fresh dev restarts.

---

# BMIND

## What changed after Packet A
Packet A was the right move.
It improved the dev-start boundary the packet was designed to improve:
- repeated equivalent resolution inside one session now reuses work correctly
- startup-to-ready is no longer the dominant pain in the measured outside-in call site

The remaining cold-path cost is now more visible:
- large first browser graph
- many transported TS/TSX modules
- repeated per-module esbuild CLI transforms
- same-session warm behavior, but slow fresh-start cold behavior

That pattern strongly suggests a missing **persistent positive cache** for the driver-owned transport transform seam.

## Hard posture
Do **not** solve this by:
- dumping artifacts into ad hoc consumer-root `.tmp` folders as the final shape
- weakening authority correctness
- pretending Vite's default npm/deps cache automatically owns this custom Deno transport seam
- mixing app-graph cleanup and driver transport caching into one muddy packet

Do solve this by:
- preserving published-boundary truth
- staying Vite-cache-native in artifact placement
- caching only what is semantically safe to reuse
- starting with the narrowest highest-confidence world first

---

# TMIND

## Core question
Where should persistent transport cache live, and what exactly is safe to cache?

## STIER answer preview
The correct final home is:
- **under Vite's resolved `cacheDir`**
- in a driver-owned subdirectory

Not:
- consumer-root `.tmp/.cache/*` as the final product shape
- random visible residue folders
- source-tree-adjacent artifacts

### Practical shape
Conceptual path:
- `<resolved Vite cacheDir>/.sys-driver-vite/transport/`

Typical default path when Vite uses its usual default cache world:
- `node_modules/.vite/.sys-driver-vite/transport/`

This is the best-practice form because the artifact is:
- tool-generated
- disposable
- performance-oriented
- restart-reusable
- not source-of-truth
- specifically part of Vite-facing dev behavior

That is exactly the artifact class that belongs under Vite cache ownership.

### Why not `.tmp/.cache/*`
As a prototype or scratch experiment, `.tmp/.cache/*` is acceptable.
As the final landed shape, it is weaker because it implies:
- scratch / temporary debugging residue
- consumer-root scar tissue
- a cache domain outside the bundler's own cache world

The final landed feature should instead read as:
- Vite cache
- driver-owned sub-cache
- safe to delete
- not part of app/runtime truth

---

# Governing invariant
Equivalent immutable transported modules in one authority world should pay the browser-ready transform cost at most once across dev restarts.

If that invariant holds cleanly, fresh-start first-render cost should materially improve.
If it does not hold, the driver will keep paying the same transform tax repeatedly even when the source and transform truth have not changed.

## Packet boundary
This packet is **persistent transform-cache only**.
It does **not** add a persistent resolve cache.

That means:
- session-local in-memory resolve reuse from Packet A stays in place
- persistent filesystem reuse in this packet applies only to transformed transport output
- residual fresh-start `resolveDeno` cost may remain after this packet and is not evidence that Packet D failed

## Layer stack
Do **not** conflate the two reuse layers.

### Layer 1 — Packet A / session-local
- in-memory
- one dev-server lifetime
- prevents duplicate subprocess work inside one session

### Layer 2 — Packet D / persistent
- filesystem-backed
- survives fresh dev restarts
- skips repeated browser-ready transform work across sessions

Layer 2 does not replace Layer 1.
Both layers should share the same canonical identity rules where applicable, but they solve different problems.

---

# What should be cached

## First slice only
Cache the final transformed output for **remote immutable transported modules first**, and keep the first slice **dev-only**.

That means:
- cache only browser-ready dev transport output
- remote `https://...`
- remote `https:/...` once normalized to one canonical identity
- `jsr:`-origin modules once resolved to immutable remote/local materialized source identity
- no mutable local-workspace modules in the first slice

The first slice should **not** immediately include broad local-workspace transform caching.
Remote immutable modules are the narrowest and safest first world because:
- source identity is more stable
- Deno already materializes them into stable cache files
- invalidation is easier to reason about
- the outside-in perf trace already shows many remote JSR-backed transported modules dominating first render

## Executable cacheability rule
Implementation should use a real predicate, not prose drift.
For the first slice, a transport module is cacheable only if all of these hold:
- the packet is in dev/browser transport mode
- the canonical source identity is remote-like after normalization
- the materialized source file exists locally
- the source is not project-local mutable workspace source
- the loader is supported by the first-slice transform cache
- the dependency rewrite inputs needed to compute the cache key are available

Path shape may assist implementation, but the semantic rule should not be defined only as “under a Deno cache path”.

## Cache payload
At minimum:
- transformed browser-ready code
- enough metadata to validate the entry on reuse

Optional later:
- sourcemap
- compact manifest/index

---

# What the cache key must mean
This packet must not cache by source path alone.
The transformed output depends on more than the original file contents.

A safe positive cache key must include, at minimum:
- `@sys/driver-vite` version
- transform engine version (`esbuild` version)
- loader (`ts`, `tsx`, etc.)
- canonical source identity
- source content hash or otherwise immutable source fingerprint
- minimal dependency rewrite signature

Because the first slice is dev-only, do **not** add vague extra entropy such as generic serve/browser shape unless output differences are explicitly proven.

## Why dependency rewrite signature matters
The transport layer does not merely transpile TS/TSX.
It also rewrites import specifiers into browser/Vite transport IDs.
So output reuse is only safe if the rewritten dependency graph shape is equivalent.

This means the cache key must capture:
- resolved dependency targets as seen by `loadDenoModule(...)`
- via a stable digest derived from those rewritten dependency identities

For the first slice, the dependency rewrite signature should be:
- a sorted stable JSON-serialized array of `[originalSpecifier, resolvedCanonicalTarget]` pairs
- hashed into a compact digest for the cache key

Do **not** hash the full rewritten source text for this purpose.
That would conflate structure with unrelated lexical changes and produce avoidable false misses.

Without a structural rewrite digest, the cache could replay code with stale import edges.
That would be a false win.

---

# Placement doctrine

## Final landed doctrine
Use:
- `resolved Vite cacheDir`
- then a driver-owned namespace below it

Example:
- `Path.join(cacheDir, '.sys-driver-vite', 'transport')`

## Do not hardcode `node_modules/.vite` as doctrine
That path is a common default, not the timeless rule.
The timeless rule is:
- use Vite's cache world
- respect resolved `cacheDir`
- add a driver-owned subdirectory

So the implementation should derive:
- resolved `cacheDir`

and not treat:
- `node_modules/.vite`

as universally authoritative if the app or Vite config changes it.

## `cacheDir` lifecycle rule
Derive `cacheDir` from Vite’s resolved config in `configResolved`, then store it on plugin state.
Do **not** read it at plugin construction time.
Do **not** silently guess a default later in the transform/load path if the resolved value was never captured.
If later code needs the cache root before `configResolved` set it, fail loudly with an invariant error rather than drift to a hardcoded fallback.

---

# Phase plan

## Phase 0 — proof refinement
Before implementation, capture narrow proof for the current outside-in seam.
Instrumentation anchor should stay at the subprocess boundary:
- the `Deno.Command` spawn point in `u.resolve.ts`
- the esbuild CLI spawn point in `u.load.ts`

Measure wall-clock duration per subprocess call at that boundary, not at higher-level caller sites.
That avoids double-counting when session-local reuse collapses requests.

Capture:
- first-render wall-clock after fresh dev start
- count of transformed transported modules
- total `transport.transform.esbuildCli`
- total `transport.loadDenoModule`
- unique transformed sourcefile count
- repeated transformed sourcefile count if any

“Repeated transformed sourcefile count” should mean cache-key collisions / same-output opportunities, not merely multiple caller sites requesting the same work.

Acceptance:
- enough evidence to distinguish:
  - unique cold work
  - repeated same-output work across restart
  - app-owned breadth vs driver-owned transform economics

## Phase 1 — cache location and key design only
Implement only:
- resolved transport cache root derivation from Vite `cacheDir`
- canonical remote transform cache key derivation
- metadata format for a single cached transformed module

Do not yet broaden to all module classes.

Acceptance:
- path policy is settled
- key semantics are explicit
- no `.tmp` final-shape drift

## Phase 2 — persistent positive cache for remote immutable modules
Implement only:
- read-through / write-through positive cache for remote immutable transported modules
- cache hit/miss perf logging
- first-class bypass-reason logging
- safe fallback to current transform path on cache miss or validation failure

Validation on cache hit must stay materially cheaper than the transform it avoids.
If validation is too expensive, the packet is failing its own purpose.

Acceptance:
- fresh restart should skip transform work for unchanged cached remote transported modules
- same-session behavior must remain correct
- cache corruption or miss must fall forward safely to normal transform behavior
- bypass reasons are explicit enough to explain why a would-be candidate did not reuse cache

## Phase 3 — remeasure and stop-or-expand decision
Remeasure the same outside-in world.

Questions:
- did fresh-start first-render materially improve?
- did `transport.transform.esbuildCli` wall-clock drop materially?
- is remaining pain now more clearly app-owned graph breadth?
- is residual unique `resolveDeno` cost still large enough to justify another transport packet?

Stop if:
- the user-visible cold-start win is strong enough
- or the next dominant cost is clearly outside this packet's owner seam

Expand only if justified by new proof.

---

# Best-practice check: is this really the Vite way?

## Yes, in the right form
The correct best-practice statement is:
- use **Vite's resolved cache domain** for Vite-facing disposable performance artifacts

Not the weaker statement:
- hardcode `node_modules/.vite` because that is what Vite often uses by default

So the STIER formulation is:
- **Vite cache world = right**
- **resolved `cacheDir` + driver-owned namespace = best-practice implementation**
- **hardcoded `node_modules/.vite` = acceptable default path outcome, but not the doctrine**

That is the correct double-check outcome after TMIND review.

---

# Exclusions
Not in this packet:
- persistent resolve metadata caching
- broad local-workspace transform persistence
- npm prewarm narrowing
- `dev.warmup`
- `optimizeDeps.include`
- transform engine redesign away from esbuild CLI
- app graph hygiene cleanup
- `.tmp` file-artifact logging changes

Those may still matter later, but this packet should stay narrow.

---

# False-win rules
Do **not** count these as success:
- writing cache files into a final-shape `.tmp/.cache/*` path
- replaying transformed output when dependency rewrite targets changed
- using local-source privilege to avoid transport work entirely
- broad persistent cache for mutable local files without invalidation truth
- prettier perf charts without fresh-restart first-render improvement

---

# Proof requirements
A good implementation proof should include:
- deterministic unit coverage for cache-key derivation and placement policy
- integration proof for cache hit reuse on a repeated fresh-start world
- explicit perf logging for:
  - cache hit
  - cache miss
  - cache write
  - cache bypass reason
  - cache validation failure reason
- outside-in before/after comparison at a real call site

---

# Recommended packet framing
Suggested packet title:
- `Packet D: persistent transport transform cache under Vite cacheDir`

Suggested commit framing when implementation is ready:
- `perf(driver-vite): persist remote transport transforms under vite cache`

---

# Final STIER synthesis
Packet A should be judged a success.
It improved the exact session-local reuse seam it targeted.
The next remaining cold-start pain is not evidence that Packet A failed.
It is evidence that the next owner seam has become visible:
- persistent reuse of browser-ready transformed transport output across fresh restarts

The correct final cache home is:
- **under Vite's resolved `cacheDir`**
- in a driver-owned namespace
- not in consumer-root `.tmp/.cache/*` as the landed product shape

That is the cleanest, most Vite-native, least-scar-tissue next move.
