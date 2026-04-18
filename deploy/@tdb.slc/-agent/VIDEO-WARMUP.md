## Video Warmup Plan

### Goal
- Improve first-play responsiveness for trailer, overview, and programme videos.
- Reuse the existing service-worker media cache and `Http.Preload`.
- Keep policy in `@tdb.slc`, not in the low-level player or HTTP cache runtime.
- Be explicit about whether warmup is a light cache probe or an intentional prefetch.

### Current Truth
- Trailer, overview, and programme videos use direct MP4 URLs on `fs.socialleancanvas.com`.
- The shared player surface is `Player.Video.Element`.
- The service worker already caches media on ranged `GET` requests.
- `Http.Preload.warm` already supports ranged warm requests.
- The app already preloads content modules and timestamp renderers, but not video bytes.
- The current SW media mode is `safe-full` unless configured otherwise.
- The service worker is registered lazily and may not control the page immediately on first load.

### Design Rules
- Do not modify `Player.Video.Element` for warm policy.
- Do not add a second cache subsystem.
- Do not use hidden mounted video elements as the primary warm mechanism.
- Keep warm planning pure and explicit.
- Keep actual warming low-concurrency and idempotent.
- Keep the stateful warm orchestrator outside React; hooks are thin wiring only.
- Do not pretend a full-object warm is a lightweight probe.
- Do not mark a URL as warmed until the service worker can actually intercept the request path.

### Strategy
1. Add one pure planner helper that derives ordered unique warm targets from explicit content trees and user-intent points.
2. Add a stateful warm orchestrator module in `@tdb.slc`.
3. Use `Http.Preload.warm([{ url, range: { start: 0, end: 0 } }])` so the service worker media cache path is exercised intentionally.
4. Keep concurrency conservative: `1`.
5. Support cancellation with `AbortController` per warm batch.

### Blocking Runtime Truth Check
- Before implementation is finalized, verify what a `bytes=0-0` warm request does under the current SW `safe-full` strategy.
- If it promotes to a full-object fetch, this plan is a staged prefetch strategy, not a lightweight probe strategy.
- The implementation and docs must use truthful language based on that result.
- Also verify warm requests are only issued after the service worker is ready to control fetches for the page.

### Warm Tiers

#### Tier 0
- Warm `Trailer`
- Warm `Overview`

Trigger:
- Landing app startup after initial content/module preload.

Truthful reading:
- If `safe-full` promotes ranged warms to full object fetches, Tier 0 is an intentional prefetch budget decision.

#### Tier 1
- Warm `Programme` root video.
- Warm the first playable item for each top-level programme section.

Trigger:
- On actual user entry into `Programme`.
- In the current app shape, this effectively means the `Programme` content factory/open path, not speculative module availability.

#### Tier 2
- Warm the remaining videos within the currently selected section.

Trigger:
- When the user selects a programme section.

### Proposed Module Shape

#### Pure planning
- `src/ui.content/ui/u.VideoWarmup.plan.ts`

Responsibilities:
- derive tiered warm targets from trailer/overview/programme content
- dedupe ordered URLs
- no IO

#### Runtime orchestration
- `src/ui.content/ui/m.VideoWarmup.ts`
- optional thin React wiring only if needed: `src/ui.content/ui/use.VideoWarmup.ts`

Responsibilities:
- own module-scoped warm state for the current app session
- track:
  - `requested: Set<string>`
  - `inflight: Map<string, { controller: AbortController; promise: Promise<void> }>`
- gate warm execution on service-worker readiness/control
- call `Http.Preload.warm(...)`
- cancel stale/lower-priority warm batches
- expose tiny actions like:
  - `warmLanding()`
  - `warmProgrammeIntro(media)`
  - `warmSection(media)`

### Trigger Locations

#### Landing startup
- Near the app entry point, adjacent to existing module preload
- Warm Tier 0 after entry/trailer/overview/programme modules are ready
- Only fire once the service worker is ready to intercept the resulting warm fetches.

#### Programme factory/open
- Near `src/ui.content/ui.Programme/m.Factory.tsx`
- In the current app shape, the user-intent boundary is the action path that pushes `Programme` onto the stack.
- The programme media tree should be passed into `warmProgrammeIntro(media)` from that path.
- Do not hook Tier 1 to speculative factory invocation during module preload.

#### Section selection
- Near `src/ui.content/ui.Programme/use.Controller.ts`
- Or adjacent to `use.Section.ts`
- Warm Tier 2 when section changes

### Why Range Warming
- Plain URL warming uses `HEAD`, which does not hit the SW media path.
- Ranged warming sends `Range: bytes=0-0`.
- That exercises the existing media cache strategy.
- In `safe-full` mode, the first ranged request can promote into a full cached media object.
- Therefore the final strategy must honestly be described as either:
  - range-triggered prefetch
  - or light cache priming
- depending on verified SW behavior.

### Traversal Semantics
- The pure planner owns traversal decisions directly.
- Tier planning decides traversal scope:
  - Tier 0: explicit trailer/overview roots
  - Tier 1: programme root plus first playable item of each top-level section
  - Tier 2: remaining playable items within the selected section subtree
- Reuse existing flattening helpers like `toPlaylist(...)` where they fit instead of inventing a new traversal abstraction prematurely.

### Test Plan

#### Pure tests
- collector returns ordered unique URLs
- trailer/overview/programme tiers are derived correctly
- section tier only includes that section's videos

#### Runtime tests
- warm planner only requests each URL once
- warm calls use range targets, not plain URL `HEAD`
- section selection triggers the expected next warm batch
- stale batches can be cancelled
- programme entry, not mere content creation, triggers Tier 1
- verify actual `safe-full` promotion behavior for `bytes=0-0`
- if warm and playback target the same URL, behavior is at least observable and not silently duplicated without tracking
- warm requests before SW readiness are gated/deferred rather than falsely counted as successful

#### Manual checks
- first open of trailer/overview/programme on a cold load
- repeat open after warmup
- service-worker logs show media cache fill/hit behavior
- no visible playback regressions while background warm requests run
- no obvious redundant warm requests during repeated navigation
- confirm whether landing warmup pulls full trailer/overview bodies or only primes range behavior
- confirm cold-load landing warm requests do not race ahead of SW control and silently bypass cache

### Risks
- `safe-full` can consume meaningful storage if too many videos are warmed aggressively.
- Background warming can compete with active playback on slower connections.
- Warming every programme video immediately is likely too aggressive.
- Warm and direct playback of the same URL may race unless in-flight ownership is handled cleanly.

### Conservative First Pass
- First verify the runtime truth of `safe-full` range warming.
- Then ship Tier 0 only.
- Add Tier 1 only on actual Programme entry if Tier 0 cost is acceptable.
- Observe cache/storage/bandwidth behavior.
- Only then decide whether Tier 2 should warm a whole selected section or a smaller subset.

### Observability
- Keep optional debug logging in the warm orchestrator only.
- Example shape:
  - tier start
  - warm requested
  - warm skipped (already requested/inflight)
  - warm cancelled
  - warm completed / failed

### Non-Goals
- No redesign of `Http.Cache`.
- No redesign of `Player.Video.Element`.
- No HTML/media decode pre-render tricks.
- No speculative predictive model beyond simple staged tiers.

### Working Verdict
- This is doable cleanly with current primitives.
- The right move is a small policy/orchestration layer in `@tdb.slc`.
- The SW/media cache remains the single source of truth for cached video bytes.
