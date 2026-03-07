# Vision: `Bundle.Transform` (Slug Media-Seq)

Extract a behavior-locked, runtime-agnostic `Bundle.Transform` API from the current slug media-sequence bundler logic so the same manifest derivation (playback/tree/assets shape) can run identically in both the compiler path and the browser from in-memory slug/CRDT data.

## Intent
- Establish a small universal transform kernel for slug media-seq manifest derivation.
- Preserve pipeline output behavior and schema contracts exactly.
- Share one algorithm across compiler/runtime contexts without pulling in tooling concerns.

## Purity Boundary
`Bundle.Transform` is the algorithm surface.
It owns manifest derivation, validation, path/template/shard semantics, and issue generation.
It does not own runtime adapters (filesystem, ffmpeg, HTTP, CLI, CRDT transport orchestration).

## Design Outcome
- Compiler path becomes a caller/adaptor of `Bundle.Transform`.
- Browser path becomes a caller/adaptor of `Bundle.Transform`.
- Behavior parity becomes testable and explicit.

## Constraint
This is extraction hygiene, not a redesign: no schema drift, no filename drift, no descriptor drift.
