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

- `code/sys/immutable/src/m.rfc6902/t.ts`
- `code/sys/immutable/src/m.graph/t.ts`
- `code/sys/immutable/src/m.url/t.ts`
- `code/sys/immutable/src/m.core/m.Immutable/t.ts`
- `code/sys/immutable/src/m.core/m.PathRef/t.ts`
- `code/sys/immutable/src/m.core/m.Immutable.Lens/t.ts`

- `code/sys/registry/src/m.npm/**/t.ts` — refactored in `045386d6d`.
- `code/sys/registry/src/m.jsr/**/t.ts` — refactored in `045386d6d`.

- `code/sys.ui/ui-dom/src/m.Dom/t.ts`
- `code/sys.ui/ui-dom/src/m.File/t.ts`
- `code/sys.ui/ui-dom/src/m.Keyboard/t.ts`
- `code/sys.ui/ui-dom/src/m.LocalStorage/t.ts`
- `code/sys.ui/ui-dom/src/m.UserAgent/t.ts`
- `code/sys.ui/ui-dom/src/m.Events/t.ts`

- `code/sys.ui/ui-css/src/m.Css.Edges/t.ts`
- `code/sys.ui/ui-css/src/m.Style/t.ts`
- `code/sys.ui/ui-css/src/m.Css.Tmpl/t.ts`
- `code/sys.ui/ui-css/src/m.Css.Dom/t.ts`
- `code/sys.ui/ui-css/src/m.WebFont/t.ts`

- `code/sys.ui/ui-react/src/m.fc/t.ts`
- `code/sys.ui/ui-react/src/m.effect/t.ts`
- `code/sys.ui/ui-react/src/m.signal/t.ts`
- `code/sys.ui/ui-react/src/u/t.ts`

### UI components with many flat spines

- `code/sys.ui/ui-react-components/src/ui/Buttons/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Buttons.Icons/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Buttons.Switch/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Icon/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Icon.Swatches/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Image.Svg/t.ts`
- `code/sys.ui/ui-react-components/src/ui/KeyValue/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.AudioWaveform/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.Config/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.Devices/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.Recorder/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.Timecode.PlaybackDriver/-dev/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Media.Video/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Ownership/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Player/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Player.Video.Controls/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Player.Video.Decks/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Player.Video.Signals/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Preload/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Sheet/t.ts`
- `code/sys.ui/ui-react-components/src/ui/Spinners/t.ts`
- `code/sys.ui/ui-react-components/src/ui/TreeView/t.ts`
- `code/sys.ui/ui-react-components/src/ui/TreeView.Index/t.ts`
- `code/sys.ui/ui-react-components/src/ui/TreeView.Index.Data/t.ts`
- `code/sys.ui/ui-react-components/src/ui/TreeView.Index.Item/t.ts`

### Driver packages

- `code/sys.driver/driver-monaco/src/-fake/t.ts`
- `code/sys.driver/driver-monaco/src/m.Is/t.ts`
- `code/sys.driver/driver-monaco/src/m.Error/t.ts`
- `code/sys.driver/driver-monaco/src/m.Event/t.ts`
- `code/sys.driver/driver-monaco/src/m.Monaco/t.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/t.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/t.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.ts`

- `code/sys.driver/driver-vite/src/-entry/t.ts`
- `code/sys.driver/driver-vite/src/m.fmt/t.ts`
- `code/sys.driver/driver-vite/src/m.vite.config/t.ts`

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.ts`
- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/t.ts`

- `code/sys.driver/driver-automerge/src/-exports/-fs/t.ts`
- `code/sys.driver/driver-automerge/src/-exports/-web/t.ts`
- `code/sys.driver/driver-automerge/src/-exports/-web.ui/t.ts`
- `code/sys.driver/driver-automerge/src/m.Crdt/t.ts`
- `code/sys.driver/driver-automerge/src/m.Debug/t.ts`
- `code/sys.driver/driver-automerge/src/m.Graph/t.ts`
- `code/sys.driver/driver-automerge/src/m.server/t.ts`
- `code/sys.driver/driver-automerge/src/m.server.client/t.ts`
- `code/sys.driver/driver-automerge/src/ui/-dev/t.ts`
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/t.ts`
- `code/sys.driver/driver-automerge/src/ui/ui.Document/t.ts`
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/t.ts`
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/t.ts`
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/t.ts`

## Already-modern / likely not primary candidates

- `code/sys/fs/src/m.FileMap/t.ts` is already namespaced and only has legacy compatibility aliases at the bottom.
- Many `@sys/std` files are already namespaced.
- Many `@sys/fs` files are already namespaced.
- `code/sys/fs/src/m.Path/t.ts` still has a flat `FsPathLib`; check as a possible missed leftover from the `@sys/fs` pass.

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
