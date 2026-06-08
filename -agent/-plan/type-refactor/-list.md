# t.ts namespace refactor candidates

Quick scan notes for modules whose root `t.ts` still exposes a flat `XxxLib` spine rather than a conceptual namespace with `Lib`.

## Scan heuristic

- Root `t.ts` files only.
- Candidate signal: flat `export type XxxLib = ...`.
- Excluded `common/t.ts` and `-tmp`.
- Files already shaped as `export declare namespace X { export type Lib = ... }` are generally treated as modern.
- Files with namespace-first shape plus legacy flat compatibility aliases are not primary refactor candidates.

## Active `@sys/*` package candidates

### High-signal package surfaces

- `code/sys/http/src/http/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.
- `code/sys/http/src/http.client/m.HttpFetch/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.
- `code/sys/http/src/http.client/m.HttpCache/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.
- `code/sys/http/src/http.client/m.HttpClient/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.
- `code/sys/http/src/http.server/m.HttpServer/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.
- `code/sys/http/src/http.server/m.HttpPull/t.ts` — refactored in `532999fce`; compatibility/finalization in `9353b0726`, `9b37bda96`.

- `code/sys/crypto/src/m.Hash/t.ts` — refactored in `0cb2eeee5`.
- `code/sys/crypto/src/m.Hash.Composite/t.ts` — refactored in `0cb2eeee5`.
- `code/sys/crypto/src/m.Fmt/t.ts` — refactored in `0cb2eeee5`.

- `code/sys/immutable/src/m.rfc6902/t.ts` — refactored in `f1f0d2b59`.
- `code/sys/immutable/src/m.graph/t.ts` — refactored in `f1f0d2b59`.
- `code/sys/immutable/src/m.url/t.ts` — refactored in `f1f0d2b59`; URL type namespace refined to `Immutable.Url.*` in `08270b32b`.
- `code/sys/immutable/src/m.core/m.Immutable/t.ts` — refactored in `fddaf1d36`.
- `code/sys/immutable/src/m.core/m.PathRef/t.ts` — refactored in `fddaf1d36`.
- `code/sys/immutable/src/m.core/m.Immutable.Lens/t.ts` — refactored in `fddaf1d36`.

- `code/sys/registry/src/m.npm/**/t.ts` — refactored in `045386d6d`.
- `code/sys/registry/src/m.jsr/**/t.ts` — refactored in `045386d6d`.

- `code/sys.ui/ui-dom/src/m.Keyboard/t.ts` — refactored in `d4dda8e0a`; no compatibility aliases retained.
- `code/sys.ui/ui-dom/src/m.File/t.ts` — refactored in `371658cfc`; no compatibility aliases retained.
- `code/sys.ui/ui-dom/src/m.LocalStorage/t.ts` — refactored in `371658cfc`; no compatibility aliases retained.
- `code/sys.ui/ui-dom/src/m.Dom/t.ts` — refactored in `cdb509e7e`; no compatibility aliases retained.
- `code/sys.ui/ui-dom/src/m.UserAgent/t.ts` — refactored in `cdb509e7e`; no compatibility aliases retained.
- `code/sys.ui/ui-dom/src/m.Events/t.ts` — refactored in `cdb509e7e`; no compatibility aliases retained.

- `code/sys.ui/ui-css/src/m.Css.Edges/t.ts` — refactored in `953b93f2f`; no `@sys/ui-css` compatibility aliases retained.
- `code/sys.ui/ui-css/src/m.Style/t.ts` — refactored in `953b93f2f`; no `@sys/ui-css` compatibility aliases retained.
- `code/sys.ui/ui-css/src/m.Css.Tmpl/t.ts` — refactored in `953b93f2f`; no `@sys/ui-css` compatibility aliases retained.
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ts` — refactored in `953b93f2f`; no `@sys/ui-css` compatibility aliases retained.
- `code/sys.ui/ui-css/src/m.WebFont/t.ts` — refactored in `953b93f2f`; no `@sys/ui-css` compatibility aliases retained.

- `code/sys.ui/ui-react/src/m.fc/t.ts` — refactored in `137c32303`; no compatibility aliases retained.
- `code/sys.ui/ui-react/src/m.effect/t.ts` — refactored in `137c32303`; no compatibility aliases retained.
- `code/sys.ui/ui-react/src/m.signal/t.ts` — refactored in `137c32303`; no compatibility aliases retained.
- `code/sys.ui/ui-react/src/u/t.ts` — refactored in `137c32303`; no compatibility aliases retained.

### Completed UI component namespaces

- `code/sys.ui/ui-components/src/ui.react/KeyValue/t.ts` — refactored in `d3bd4363e`; carried through package/source-tree renames in `615f43f4a` and `f19716a96`; no flat `KeyValue*` compatibility aliases retained.

### UI components with many flat spines

- `code/sys.ui/ui-components/src/ui.react/Buttons/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Buttons.Icons/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Buttons.Switch/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Icon/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Icon.Swatches/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Image.Svg/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.AudioWaveform/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.Config/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.Devices/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.Recorder/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.Timecode.PlaybackDriver/-dev/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Media.Video/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Ownership/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Player/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Player.Video.Controls/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Player.Video.Decks/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Player.Video.Signals/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Preload/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Sheet/t.ts`
- `code/sys.ui/ui-components/src/ui.react/Spinners/t.ts`
- `code/sys.ui/ui-components/src/ui.react/TreeView/t.ts`
- `code/sys.ui/ui-components/src/ui.react/TreeView.Index/t.ts`
- `code/sys.ui/ui-components/src/ui.react/TreeView.Index.Data/t.ts`
- `code/sys.ui/ui-components/src/ui.react/TreeView.Index.Item/t.ts`

### Driver packages

- `code/sys.driver/driver-monaco/src/-fake/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/m.Is/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/m.Error/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/m.Event/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/m.Monaco/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.ts` — refactored in `8ee2d4196`; no compatibility aliases retained.

- `code/sys.driver/driver-vite/src/-entry/t.ts` — refactored in `a40b04a90`.
- `code/sys.driver/driver-vite/src/m.fmt/t.ts` — refactored in `a40b04a90`.
- `code/sys.driver/driver-vite/src/m.vite.config/t.ts` — refactored in `a40b04a90`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.ts` — refactored in `c31b58301`.
- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/t.ts` — refactored in `c31b58301`.

- `code/sys.driver/driver-automerge/src/-exports/-fs/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/-exports/-web/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/-exports/-web.ui/t.ts` — refactored in `510aaaaef`; no flat compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.ts` — refactored in `510aaaaef`; includes `Crdt.DocumentId.*` convenience lane; no target flat compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/m.Debug/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/m.Graph/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/m.server/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/m.server.client/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/-dev/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/t.ts` — refactored in `510aaaaef`; no compatibility aliases retained.

## Already-modern / likely not primary candidates

- `code/sys/fs/src/m.FileMap/t.ts` is already namespaced and only has legacy compatibility aliases at the bottom.
- Many `@sys/std` files are already namespaced.
- Many `@sys/fs` files are already namespaced.
- `code/sys/fs/src/m.Path/t.ts` — refactored in `e1b5b1980`; no compatibility aliases retained.

## Deploy/app package candidates

If deploy packages are included in the refactor scope, likely candidates include:

- `deploy/@tdb.edu.slug/src/m.slug.compiler/**/t.ts`
- `deploy/@tdb.edu.slug/src/ui/**/t.ts`
- `deploy/@tdb.slc/src/ui/**/t.ts`
- `deploy/@tdb.slc/src/ui.content/**/t.ts`

## Recommended refinement pass

1. Build a candidate table from the raw scan.
2. Split into:
   - active package candidates
   - deploy/app candidates
   - already-namespaced-with-legacy-aliases
   - false positives / utility-only files
3. Refactor package-by-package, starting with small leaf modules.
