- code/sys/std/src/m.Timecode
- code/sys.ui/ui-state/src/m.timecode/m.playback
- code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver
- code/sys.model/model
- code/sys.model/model-slug
- deploy/@tdb.edu.slug/src/ui/ui.TreeHost
- deploy/@tdb.edu.slug/src/ui/ui.SlugPlaybackDriver


=================

## Slug Playback: Split Navigation and Media Drivers
Separate slug playback orchestration into composable effects:
- Nav: selection → ref
- Media: bundle/decks → timeline/snapshot

Each effect owns its lifecycle and state writes, ensuring clean composition and disposal.
- dir: `/Users/phil/code/org.sys/sys/deploy/@tdb.edu.slug/src/ui/ui.SlugPlaybackDriver`



============================



## Plan B — Make default patch semantics type-truthful (object patch only)

Intent:
- Defaults only claim what they actually support (Object.assign patching).
- Non-object patch styles must opt in via `applyPatch` + `isNoop`.

Option B1 (preferred): type-only tightening via overloads
- Overload `EffectController.create` such that:
  1) No `applyPatch` provided → `Patch` is `Partial<State>` (or `Partial<State> & object`)
  2) Custom `applyPatch` provided → `Patch` can be anything

Runtime stays unchanged.

Option B2 (fallback): runtime guard
- If using defaultApplyPatch and patch is non-object → throw a clear error
  (or return early with no change; throwing is more honest).

Tests:
- For B1: add `expectTypeOf` checks in a new test file (or extend API test).
- For B2: add a test asserting the throw message.
