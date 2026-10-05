# HTML runtime and footprint proof

Run from `code/sys/html`:

```sh
deno task test:browser
```

This explicit integration task is separate from `deno task test`. It needs local Chrome, loopback
networking, subprocess/temp-profile access and the native build toolchain. It uses `@sys/testing`'s
isolated browser loader without disabling Chrome's sandbox. Vite and compression helpers belong to
the proof only, not the package runtime graph. Builds stay in memory.

## Observed run

- Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3; aarch64 macOS.
- Google Chrome 154.0.8037.93 (executable version); browser-reported HeadlessChrome/154.0.0.0.
- Vite 8.3.2, Rolldown 1.2.12, `@deno/vite-plugin` 2.0.4.
- parse5 8.0.1; entities 8.1.0.
- Identical Vite ES-library builds, target `es2022`, minifier `oxc`, no config-file plugins, no
  externalized imports, no source maps. Library-mode minification is Vite's behavior, not a claim of
  maximal compression. gzip level 9; Brotli quality 11 via Deno's `node:zlib`.

| Entry         | Emitted JS bytes | gzip bytes | Brotli bytes |
| ------------- | ---------------: | ---------: | -----------: |
| Public `Html` |          184,151 |     45,706 |       39,520 |
| Direct parse5 |          177,673 |     43,845 |       37,846 |
| Difference    |            6,478 |      1,861 |        1,674 |

Both entries execute the same `u.example.ts` workload against independent expected values: decoded
`/hello?x=1&y=2` and original `href="/hello?x=1&amp;y=2"` spelling. Both passed in Deno and Chrome.
Chrome must report exactly once with no runtime errors; `Deno` and `process` must be absent. An
empty or failed page is not a passing result.

The task audits resolved module IDs and static/dynamic edges as well as emitted imports, and prints
the full graph plus rendered-module list (rather than inspecting rendered modules alone). The graph
contained parse5's parser/tokenizer/default adapter and entities' tables, with no Node builtin, UI,
fs/CLI, driver, Vite, MagicString or parse5 streaming dependency. `Html` additionally retained its
guards, `@sys/std/Is` helpers and package metadata. The serializer module appeared in both
rendered-module lists: importing through parse5's public root is not a promise that all
serialization code vanishes.

Bundling `src/types.ts` directly emitted no JavaScript and no runtime dependency edges. This
complements the fast relative-import boundary checks; neither proof substitutes for the other.

These are observations for this workload and toolchain, not a browser-size budget, parsing-speed
benchmark, browser-version parity guarantee or Node/Bun compatibility claim. Re-run after changing
the runtime entry, dependencies or build settings.
