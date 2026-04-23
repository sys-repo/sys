# Review: `driver-vite` dev startup performance (outside-in)

## Status
Research/distillation note only.
No implementation in this note.

## Human intent
Understand why the current `@sys/driver-vite` call-site dev experience still feels slow even after the bootstrap/startup correctness refactor, and identify optimization lanes that are:

- truthful at the published boundary,
- measurable,
- phaseable,
- and likely to produce real cold-start / first-load wins.

## Locked posture
- Do **not** buy speed with fake local-source privilege.
- Do **not** reintroduce bootstrap residue in consumer roots.
- Do **not** weaken published-boundary truth to get prettier timings.
- Treat call-site reality as the authority, not fixture comfort.
- Optimize only after separating:
  - driver-owned cost,
  - Vite/Rolldown/OXC cost,
  - Deno resolution/materialization cost,
  - and app-owned graph weight.

---

# BMIND

## The current state is better, but not yet convincing on dev cold start
The correctness rewrite clearly improved the architecture and published-boundary truth.
The outside-in build result (~30s at `agent-projects/code/projects/slc-data`) is a credible positive signal.

However, dev startup / first browser load still has plausible major hot spots.
The remaining call-site slowness should **not** be waved away as only "the bug we just fixed".
The `Try` runtime failure may have prevented normal warm-cache behavior, but the current driver line still contains several expensive cold-path seams.

## Most important distinction
The winning ambition is not:

- "faster than plain no-bridge pure-npm Vite by magic"

It is:

- fastest truthful Deno/JSR-aware Vite path,
- fastest published-boundary `@sys` Vite path,
- fastest without local-source privilege hacks.

That is still a serious and valuable target.

---

# TMIND: where startup time is plausibly going

## Dev startup phases
For an outside-in call site such as `code/projects/slc-data`, the cold path is roughly:

1. `deno run @sys/driver-vite/main`
2. driver wrangling:
   - find package anchor
   - find vite version
   - resolve esbuild binary
   - create startup projection/delivery import-map
3. Vite loads config
4. `Vite.Config.app(...)` runs:
   - workspace discovery
   - alias derivation
   - optimize-import rule derivation
   - plugin assembly
5. plugin startup hooks run
6. Vite server starts / dep optimizer initializes
7. browser requests `/`
8. entry graph begins resolving
9. Deno transport resolves `jsr:` / `npm:` / remote identities
10. transported TS/TSX modules are transformed to browser JS
11. graph evaluates and renders

The current perf question is not whether startup delivery is cleaner now.
It is which of those steps still dominates cold dev startup and first page load.

---

# High-confidence findings

## 1. Deno resolution still relies on subprocess `deno info --json`
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`

### Current shape
Resolution of Deno/JSR/http identities repeatedly shells out to:

- `deno info --json <specifier>`

There is an in-memory cache per dev server session, but not a persistent cross-restart cache.

### Why this matters
For a wide first-load graph, repeated subprocess resolution work adds up.
The in-memory cache helps only after the first walk inside a running server.

### Concrete local signal
A local `ui-react-components` dev instrumentation run showed:

- `transport.resolveDeno count=161`
- `transport.resolveDeno total=65142`

This cumulative total is not a wall-clock duration claim because many resolves may overlap, but it is still a strong signal that subprocess resolution is the dominant driver-owned hot seam in that run.

The same run also showed repeated resolution of the same or equivalent `@std/*` targets, including inconsistent-looking specifier shapes such as both:

- `https://jsr.io/...`
- `https:/jsr.io/...`

That suggests cache-key normalization / repeated-resolution posture may be materially worsening the cost.

### Confidence
Very high.
This is now supported by real instrumentation, not only architecture reading.

### Likely implication
The next serious driver-vite optimization lane should prioritize:

- reducing repeated subprocess resolution,
- inspecting cache-key normalization and duplicate equivalent specifiers,
- better graph hydration/reuse,
- or adding a persistent resolved-metadata cache keyed by root/import-map/lock identity.

---

## 2. `sys:npm-prewarm` is truthful but too broad
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.config/u.app.specifierRewrite.ts`

### Current shape
`createNpmPrewarm(...)` loads all imports from the authoritative import-map and warms every npm target it finds.

At the `agent-projects` root import map, that includes npm targets unrelated to immediate `slc-data` splash rendering, for example:

- `playwright`
- `playwright/test`
- `react`
- `react-dom`
- `@phosphor-icons/react`
- `react-icons`

### Why this matters
This startup work is broad authority-driven warming, not app-reachable warming.
It is truthful, but not minimal.

### Concrete local signal
A local `ui-react-components` dev instrumentation run showed:

- `config.npmPrewarm specifiers=82`
- `config.npmPrewarm elapsed=1634`

That makes npm prewarm a confirmed startup tax, not just a theoretical concern. It is still secondary to transport resolution in the same run, but it is large enough to justify a narrow follow-up.

### Confidence
High.
Broadness is certain and the startup cost is now measured.

### Likely implication
Narrowing options:

- warm only app/config-reachable npm deps,
- skip already-materialized entries,
- parallelize with bounded concurrency,
- or move broad warming out of the critical first-load path.

---

## 3. The driver is not yet using Vite's explicit cold-start levers
### Source anchor
From Vite 8 source and config defaults:

- default `dev.warmup` is `[]`
- Vite logs recommend `optimizeDeps.include` to speed cold start

### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.config/u.app.ts`

### Current shape
The current app config does not set:

- `dev.warmup`
- `optimizeDeps.include`

### Why this matters
Even if total work is unchanged, explicit warmup and targeted dep optimization can improve:

- cold start,
- first page response,
- first module graph stabilization,
- and perceived speed.

### Confidence
Medium-high.
This is a strong small/medium optimization candidate and is directly supported by upstream behavior.

---

## 4. Per-module esbuild CLI spawn in transport is a real cost, but not the leading one in current local proof
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts`

### Current shape
`Wrangle.env(...)` always sets `ESBUILD_BINARY_PATH`.
`loadDenoModule(...)` prefers the CLI path when that env var exists.
The CLI path uses `new Deno.Command(args.cli, ...)` for each transformed non-JS transported module.

### Why this matters
For a Deno/JSR-heavy dev graph, first page load can trigger many transformed TS/TSX modules.
If each one spawns a separate esbuild process, cold load cost can explode.

### Concrete local signal
A local `ui-react-components` dev instrumentation run showed roughly:

- `transport.transform.esbuildCli count≈105`
- `transport.transform.esbuildCli total≈1827`

That is real cost, but materially smaller than the same run's `transport.resolveDeno total≈65142` cumulative resolve time and also smaller than `config.npmPrewarm elapsed≈1634` wall-clock startup tax.

### Confidence
Medium-high.
This remains a meaningful seam, but it no longer looks like the first owner to hit based on current evidence.

### Likely implication
Keep transform strategy redesign in the queue, but prioritize resolution reuse/normalization first unless later outside-in call-site runs contradict the local ranking.

---

## 5. The call site itself is likely carrying avoidable graph weight
### Source anchor
From Vite 8 source and config defaults:

- default `dev.warmup` is `[]`
- Vite logs recommend `optimizeDeps.include` to speed cold start

### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.config/u.app.ts`

### Current shape
The current app config does not set:

- `dev.warmup`
- `optimizeDeps.include`

### Why this matters
Even if total work is unchanged, explicit warmup and targeted dep optimization can improve:

- cold start,
- first page response,
- first module graph stabilization,
- and perceived speed.

### Confidence
Medium-high.
This is a strong small/medium optimization candidate and is directly supported by upstream behavior.

---

## 5. The call site itself is likely carrying avoidable graph weight
### Code anchor
- `agent-projects/code/projects/slc-data/src/-test/entry.splash.tsx`
- `agent-projects/code/projects/slc-data/src/-test/entry.tsx`

### Current shape
The supposedly minimal splash path imports:

- `@sys/ui-react-devharness`

just to call `useKeyboard()`.

### Why this matters
That contradicts the file's own stated intent (keep default starter fast / avoid richer optional dev layers).
It likely widens the graph before any useful splash content appears.

### Confidence
Medium-high.
This is app-owned rather than driver-owned, but it is a very plausible reason the call-site still feels heavy.

### Likely implication
At the call site, a later follow-up should test:

- removing devharness from splash path,
- moving keyboard behavior behind explicit dev mode,
- or lazy-loading it.

---

# Lower-priority / less suspicious seams

## Startup projection/delivery itself
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.startup/u.projection.ts`
- `code/sys.driver/driver-vite/src/m.vite.startup/u.delivery.ts`

This seam now looks disciplined and narrow.
It may add some overhead, but it is not the first place to look for large cold-start pain.

## Workspace scan / alias derivation
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite.config.workspace/mod.ts`

Real cost exists, but for a modest workspace this is unlikely to explain "ages" by itself.
Worth instrumenting; not currently the top suspect.

## `configLoader=native`
### Code anchor
- `code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts`

Important for correctness and config truth, but not currently the leading startup-drag suspect.

---

# Call-site reality check

## `slc-data` dev mode likely compounds driver cost with app graph breadth
Relevant imports in the current test entry path include:

- `react`
- `react-dom/client`
- `@sys/ui-react-devharness`
- `@sys/ui-react-devharness/spec`
- `@sys/ui-css`
- multiple `@sys/std/*` leaves
- `@tdb/data/slug/ui/dev`

This means even a healthy driver will still surface a non-trivial graph.
The correct optimization stance is therefore two-track:

- driver-owned startup/transport improvements,
- plus call-site graph hygiene for the default splash path.

---

# What is currently blocked / stale

## Existing perf harness is not currently a reliable current-truth benchmark
### Code anchor
- `code/sys.driver/driver-vite/-scripts/task.perf.ts`
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.perf.ts`

The published perf harness is currently anchored to older published-boundary assumptions and was observed to fail because the fixture pin moved ahead of the published package version.
That means it is not the right current source of truth for today's optimization work without a narrow truth-maintenance pass.

---

# Ranked optimization directions

## Tier 1 — small / measurable / likely useful
1. add instrumentation around driver cold-start phases
2. add explicit `dev.warmup`
3. add targeted `optimizeDeps.include`
4. narrow `sys:npm-prewarm`
5. re-measure real call-site cold + warm runs

## Tier 2 — high-value deeper work
6. replace per-module esbuild CLI spawn with a persistent transform strategy
7. reduce subprocess-heavy Deno resolution / add reuse

## Tier 3 — structural cache wins
8. persistent transport transform cache under driver-owned cache dir
9. persistent resolved-graph metadata cache keyed by authority/lock identity

## Tier 4 — ecosystem-level future win
10. browser-ready published surfaces for hot `@sys` packages so less transport transform work is needed at runtime

---

# Recommendation
The next move should **not** be broad optimization guessing.
It should be a narrow measurement-first packet focused on driver-owned cold-path timing and one or two upstream-supported Vite levers.

Most likely first candidates:

- instrumentation,
- `dev.warmup`,
- explicit `optimizeDeps.include`,
- narrower npm prewarm.

The largest probable future win remains:

- eliminating per-module esbuild CLI spawn in the transport path.
