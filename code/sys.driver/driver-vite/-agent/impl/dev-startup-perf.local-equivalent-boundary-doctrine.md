# Doctrine: local-equivalent boundary as the organizing endpoint

## Status
Active decision doctrine.
Not an implementation packet by itself.

## Why this note exists
The recent packet work produced real narrow wins:
- Packet D proved dev transport transform reuse under Vite cache ownership
- Packet E collapsed malformed/canonical remote resolve identity earlier
- consumer-local Vite cache authority landed
- React/npm authority convergence landed for the `ui-react-components` proof world
- Packet C landed as a narrow `optimizeDeps` config surface keeper

That decomposition was necessary.
It proved the startup problem is:
- composed, not opaque
- debuggable at real seams
- and addressable with targeted fixes

This note captures the stronger synthesis now visible after those wins.

## Core doctrine
Use **local `/sys` monorepo consumption** as the comparison baseline for what the module graph can cost when authority is coherent and boundary tax is minimal.

Use **published-boundary JSR consumption** as the truth boundary that must stay honest.

The architectural endpoint is therefore:

> make published JSR consumption behave as close as truthfully possible to local monorepo consumption by collapsing artificial boundary tax without reviving hidden local-source privilege.

This is not a claim that remote/published startup can become literally identical to local startup.
It is a ranking doctrine for deciding which future seams are worth attacking.

## Anti-falsehood rule
Do not cheat the published boundary.

That means this doctrine does **not** justify:
- falling forward to local source paths in external consumers
- silently reviving monorepo-only alias privilege
- hiding real materialization/optimizer costs behind untruthful cache semantics
- treating local-only shortcuts as the architecture answer

The published-boundary honesty tests remain authoritative here.

## Why this doctrine is legitimate
This is not a vibes-only reframing.
It is grounded in existing driver architecture and proof:

### 1. Local authority projection/delivery already exists
The driver already projects and delivers startup authority into a stable child-visible form.
Relevant source anchors:
- `src/m.vite.startup/u.projection.ts`
- `src/m.vite.startup/u.delivery.ts`
- `src/m.vite.startup/-test/-.test.ts`

### 2. The transport layer is already a bridge
The driver already owns a runtime bridge for `jsr:`, `npm:`, URL-like, and Deno-native specifiers into Vite/browser execution.
Relevant source anchors:
- `src/m.vite.transport/*`
- Packet D / Packet E notes

### 3. Published-boundary honesty is already tested
The system already distinguishes monorepo-local privilege from external pure-JSR consumer truth.
Relevant source anchor:
- `src/m.vite/-test.external/-published-minimal-crutch.ts`

### 4. The recent packets proved the system is penetrable
The work so far proved:
- authority can be audited
- identity can be normalized
- caches can be moved under the right owner
- duplicate wrapper / mixed-authority failures can be detected and collapsed

That is what makes a broader boundary doctrine non-BS.

## What this doctrine changes
It does **not** replace narrow packets.
It changes how future packets are judged.

Old framing risk:
- many small optimizations without a coherent endpoint

New framing:
- each packet should be judged by whether it reduces artificial local-vs-published boundary tax
- while preserving published-boundary honesty

## Bridge classes now visible
Future work should classify itself against one of these bridge classes.

### A. Authority projection / delivery
Examples:
- startup import-map projection
- stable delivered startup handles

### B. Identity collapse
Examples:
- remote specifier normalization
- alias-equivalent request collapse
- same-world authority scoping

### C. Materialization authority
Examples:
- consumer-local npm/materialization authority
- avoiding mixed root vs consumer authority in one graph

### D. Optimizer cache authority
Examples:
- consumer-local `cacheDir`
- consumer-owned `_metadata.json` stability across restarts

### E. Browser-ready transform reuse
Examples:
- transport transform cache under Vite cache ownership
- truthful immutable remote transform reuse

### F. Optimizer breadth discovery
Examples:
- residual `optimizeDeps` tuning via Packet C at the call site
- late-discovered dependency reduction

### G. Residual toolchain seams
Examples:
- intermittent `vite:oxc` / `TsconfigCache` cold-start failures

Not every startup bug belongs to the same bridge class.
That distinction must remain explicit.

## Decision rule for future packets
A future packet is well-ranked only if it answers all of these:

1. **What boundary tax does it remove?**
   - authority split?
   - cache-owner churn?
   - repeated translation work?
   - late optimizer discovery?

2. **Why is that tax artificial rather than intrinsic?**
   - what local baseline or proof world shows the work can be cheaper?

3. **What honesty constraint must remain intact?**
   - no local-source privilege leak
   - no authority collapse across distinct worlds
   - no untruthful persistent cache semantics

4. **What proof would count?**
   - concrete emitted graph result
   - cold/warm restart behavior
   - optimizer metadata behavior
   - external published-boundary verification

If a proposed packet cannot answer those clearly, it is probably not ready.

## Current known truths under this doctrine
### Proven wins
- the authority/cache packet produced a clean `@sys/ui-react-components` proof-world result:
  - consumer-local `.vite`
  - consumer-local optimizer metadata
  - single `react.js` wrapper
  - no mixed authority in the driver audit result

### Still separate / unresolved
- broader external call-site residue still needs classification
- residual Class 2 churn may still exist
- intermittent `vite:oxc` / `TsconfigCache` cold-start failure remains a separate seam

## Immediate STIER use
Do **not** open a giant new bridge packet from this note alone.

Use this doctrine immediately to rank the next work:
1. remeasure broader external residue after the landed authority/cache fixes
2. classify what remains by bridge class
3. open only the next narrow packet whose boundary-tax removal is proven

## Current best next-lane expectation
If broader remeasurement shows authority/cache churn is materially reduced and the remaining pain is mostly late dep discovery, then the next truthful move is:
- call-site Packet C usage via `Vite.Config.app({ optimizeDeps })`
- narrowly, at the call site first
- without driver default include lists
- without `dev.warmup`

If broader remeasurement instead shows a still-material local-vs-published gap not explained by Class 2 alone, then a sharper explicit boundary-bridge packet may be justified later.

## Bottom line
This doctrine does not replace the decomposition work.
It gives that work a coherent endpoint:

> collapse artificial local-vs-published boundary tax wherever proof shows the gap is bridgeable, while keeping published-boundary behavior honest.
