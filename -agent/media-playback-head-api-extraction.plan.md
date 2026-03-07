# MediaPlayback Head API Extraction (Waypoint)

## Intent
Extract the non-debug MediaPlayback head runtime composition (currently living in `-spec`) into the public `ui.Driver.MediaPlayback` module surface, while preserving `TreeContentDriver` as the base orchestration seam.

## Architecture (locked)
- `TreeContentDriver` owns tree/nav/content loading orchestration.
- `MediaPlaybackDriver` remains a thin head over TreeContent (`orchestrator` alias).
- `MediaPlaybackDriver.head` owns playback runtime composition + derived playback view state.
- `TreeHost` rendering ownership stays in spec/app call-sites.
- Debug panels/signals remain harness-only and consume the extracted seam.

## Extracted seam (this pass)
- Pure helpers moved to public module (`u.head.ts`):
  - `toPlaybackData`
  - `toCurrentPosition`
  - `toCurrentPayload`
  - `toBundle`
  - `shouldInitPlayback`
- React lifecycle/runtime wrapper moved to public module (`use.head.ts`):
  - `usePlaybackRuntime`
  - `useHead`
- Public head API namespace added (`m.head.ts` + `mod.ts`):
  - `MediaPlaybackDriver.head.useHead(...)`
  - helper exports via `MediaPlaybackDriver.head.*`

## Spec root responsibility after refactor
`-spec/-ui.Root.tsx` should only:
- read debug signals and base controller states
- build base slots from `Tree.shared/-spec.slots.shared/createSlots(...)`
- call `MediaPlaybackDriver.head.useHead(...)`
- merge slot patches
- mirror runtime into spec diagnostic signal (optional)
- render `TreeHost.UI` and `BackButton`

## Visual regression contract (baseline)
Preserve current working UI behavior:
1. TreeContent loader cards/debug continue to work (base layer).
2. MediaPlayback head still projects:
   - position into content slot UIs
   - payload into content slot UIs
   - footer video runtime (deck surfaces + current URL)
   - player controls bound to the same runtime
3. Debug panel remains diagnostic only.

## Next steps (after this pass)
1. Mirror the same head extraction pattern into `ui.Driver.FileContent`.
2. Compare both heads and identify the true shared abstraction (if any).
3. Design the higher-order sheet/stack embedding API over the proven head seams.
