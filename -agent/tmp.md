- code/sys/std/src/m.Timecode
- code/sys.ui/ui-state/src/m.timecode/m.playback
- code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver
- code/sys.model/model
- code/sys.model/model-slug
- deploy/@tdb.edu.slug/src/ui/ui.TreeHost
- deploy/@tdb.edu.slug/src/ui/ui.SlugPlaybackDriver


====================================================================================================

## Slug Playback: Split Navigation and Media Drivers
Separate slug playback orchestration into composable effects:
- Nav: selection → ref
- Media: bundle/decks → timeline/snapshot

Each effect owns its lifecycle and state writes, ensuring clean composition and disposal.
- dir: `/Users/phil/code/org.sys/sys/deploy/@tdb.edu.slug/src/ui/ui.SlugPlaybackDriver`
