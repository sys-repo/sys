read first: ../ up folder tree to ./AGENTS.md

Context

- Goal: add a small, pure preloader that warms network/cache only, outside any PlaybackDriver.
- Input shape: list of media URLs (or a timeline), minimal API surface.
- Relationship: complements SW cache in `code/sys/http/src/http.client/m.HttpCache`; SW makes assets sticky after first fetch, preloader warms ahead of time for "first play is instant".
- Scope: keep it tight and @sys-style; verify no equivalent already exists in @sys/http or @sys/std, or decide if an existing tool should be upgraded.
