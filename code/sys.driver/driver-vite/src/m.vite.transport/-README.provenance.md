# Upstream Provenance

This module internalizes the Deno-aware Vite transport previously provided by
`@deno/vite-plugin`.

### Upstream Source:
- package:  `@deno/vite-plugin`
- repo:     [github.com/denoland/deno-vite-plugin](https://github.com/denoland/deno-vite-plugin)

<p>&nbsp;</p>

### Purpose:
- keep Deno-native Vite transport logic owned by `@sys/driver-vite`
- preserve a clear boundary between:
  - policy (`m.vite.config`, workspace/import-map rewrite)
  - transport (`m.vite.transport`, resolve/load bridge into Vite)

<p>&nbsp;</p>

### Sync Rule:
- treat upstream as reference material, not as a runtime dependency
- prefer mechanical sync from upstream source, then apply small explicit local
  adaptations for `@sys` naming, layout, and test integration
- record intentional local divergence in this file

<p>&nbsp;</p>

----

### Local Divergence
- transport is internalized and owned locally by `@sys/driver-vite`
- local behavior extends upstream to cover:
  - workspace/import-map policy handoff
  - JSR and npm transport normalization needed by `@sys` fixtures and consumers
