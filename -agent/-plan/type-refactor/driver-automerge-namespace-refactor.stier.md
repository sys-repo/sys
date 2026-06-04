# @sys/driver-automerge type-spines namespace refactor

- [x] 510aaaaef refactor(driver-automerge): canonicalize type namespaces

## Scope

Package: `code/sys.driver/driver-automerge` (`@sys/driver-automerge`).

Refactor the probed legacy flat type spines into canonical namespace contracts with `Lib` first:

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

Adjacent factor type files are in scope when their flat exports are currently re-exported by a target `t.ts` and would otherwise leave stale public flat names.

Modern namespace-shaped references inspected:

- `code/sys/fs/src/m.Path/t.ts` — small `declare namespace`, `Lib` first, no compatibility aliases.
- `code/sys/std/src/m.Args/t.ts` — root namespace plus earned sub-namespaces.
- `code/sys/crypto/src/m.Hash.Composite/t.ts` — larger namespace with nested concepts and a sibling namespace.
- `code/sys.driver/driver-monaco/src/ui/ui.Notes/t.ts` — UI component namespace with `Lib` first.

## XHIGH review refinements

- Move the existing `Crdt` and `CrdtView` namespace aliases out of `src/t.namespace.ts` and into the owning target spines. Leaving `t.namespace.ts` as a second exporter would create duplicate public namespace lanes once `m.Crdt/t.ts` and `-exports/-web.ui/t.ts` declare `Crdt` / `CrdtView`.
- Treat factor files as type-plane implementation details. Do not keep `export type *` from factor files when doing so would leak stale flat names from `m.Crdt/t.*`, `ui.DocumentId/t.*`, or `ui.Repo/t.*`.
- Keep runtime values in runtime files. `t.ts` / `t.*.ts` remain type-only: type aliases, `export declare namespace`, and type-only imports only.
- No deprecated alias blocks in `@sys/driver-automerge`. Current package callers are concrete and migratable in the same refactor.
- Keep `CrdtFs` and `CrdtWeb` as top-level owning namespaces for export-entry contracts; do not split `Crdt.Fs` / `Crdt.Web` across separate `export *` spines unless `types.ts` becomes an explicit aggregator. This avoids duplicate `Crdt` export collisions and accidental public-surface widening.
- Concrete downstream imports of target flat names are also migratable and must be included if this plan is implemented without aliases:
  - `code/sys.driver/driver-monaco/src/common/t.ts` imports `DocumentIdProps` from `@sys/driver-automerge/t`.
  - `deploy/@tdb.slc/src/common/t.ts` imports `DocumentIdProps` from `@sys/driver-automerge/t`.
  - `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts` imports `CrdtWebNetworkArg` from `@sys/driver-automerge/t`.
- Other downstream `@sys/driver-automerge/t` imports found during review (`Crdt`, `CrdtRef`, `CrdtRepoWireEvent`) are not target flat names for this pass.

## Target namespace shapes

### `Crdt`

Owning files:

- `src/m.Crdt/t.ts`
- `src/m.Crdt/t.core.ts`
- `src/m.Crdt/t.Id.ts`
- `src/m.Crdt/t.Is.ts`
- `src/m.Crdt/t.meta.ts`
- `src/m.Crdt/t.network.ts`
- `src/m.Crdt/t.Str.ts`
- `src/t.namespace.ts` retired after its `Crdt` content moves here.

Target root:

```ts
export declare namespace Crdt {
  export type Lib = {
    readonly Is: TIs.Lib;
    readonly Id: TId.Lib;
    readonly Url: { ws(input?: string): t.StringUrl };
    readonly Str: TStr.Lib;
    readonly Cmd: t.CrdtCmdLib;
    readonly Worker: t.CrdtWorkerLib;
    readonly Graph: t.CrdtGraph.Lib;
    whenReady(doc?: Ref): Promise<void>;
    toObject: ToObject;
  };
}
```

Mapping:

- `CrdtLib` → `Crdt.Lib`
- `CrdtUrlLib` → `Crdt.Lib['Url']`
- `CrdtIdLib` → `Crdt.Lib['Id']`
- `CrdtIsLib` → `Crdt.Lib['Is']`
- `CrdtStrLib` → `Crdt.Lib['Str']`
- `CrdtStringSplice` → `Crdt.Splice`
- `CrdtToObject` → `Crdt.ToObject`
- `SysMeta` → `Crdt.SysMeta`
- `StringWebsocketEndpoint` → `Crdt.Network.WebsocketEndpoint`
- `CrdtWebsocketNetworkArg` → `Crdt.Network.WebsocketArg`

Move current namespace aliases from `src/t.namespace.ts` into `Crdt` after `Lib`:

- `Crdt.Repo`
- `Crdt.Ref<T>`
- `Crdt.RefResult<T>`
- `Crdt.Id` as the document-id string alias; helper libraries stay in `Crdt.Lib` member contracts rather than single-child sub-namespaces.
- `Crdt.Events<T>`
- `Crdt.Patch`
- `Crdt.Splice`
- `Crdt.Marks.*`
- `Crdt.Worker.*`
- `Crdt.Cmd.*`
- `Crdt.Sync.Server` → `t.SyncServer.Instance`
- `Crdt.Graph.*` convenience aliases for generic graph detail types.
- `Crdt.DocumentId.*` convenience aliases for document-id UI contracts, so type consumers can import `Crdt` without a separate root `DocumentId` type import.

### `CrdtFs`

Owning file: `src/-exports/-fs/t.ts`.

```ts
export declare namespace CrdtFs {
  export type Lib = t.Crdt.Lib & {
    readonly kind: 'crdt:fs';
    repo(args?: t.StringDir | RepoArgs): t.Crdt.Repo;
  };
}
```

Mapping:

- `CrdtFilesystemLib` → `CrdtFs.Lib`
- `CrdtFsRepoArgs` → `CrdtFs.RepoArgs`
- `CrdtFsNetworkArg` → `CrdtFs.Network.Arg`
- `CrdtFsNetworkArgInput` → `CrdtFs.Network.Input`

### `CrdtWeb`

Owning file: `src/-exports/-web/t.ts`.

```ts
export declare namespace CrdtWeb {
  export type Lib = t.Crdt.Lib & {
    readonly kind: 'crdt:web';
    repo(args?: RepoArgs): t.Crdt.Repo;
  };
}
```

Mapping:

- `CrdtWebLib` → `CrdtWeb.Lib`
- `CrdtWebRepoArgs` → `CrdtWeb.RepoArgs`
- `CrdtWebStorageArg` → `CrdtWeb.Storage.Arg`
- `CrdtWebStorageArgInput` → `CrdtWeb.Storage.Input`
- `CrdtWebNetworkArg` → `CrdtWeb.Network.Arg`
- `CrdtWebNetworkArgInput` → `CrdtWeb.Network.Input`

### `CrdtView`

Owning files:

- `src/-exports/-web.ui/t.ts`
- `src/t.namespace.ts` retired after its `CrdtView` content moves here.

```ts
export declare namespace CrdtView {
  export type Lib = t.CrdtWeb.Lib & { readonly UI: UI };
}
```

Mapping:

- `CrdtViewLib` → `CrdtView.Lib`
- current layout aliases → keep under `CrdtView.Layout.*`, pointing to `t.Layout.*` namespace shapes.
- current document-id props alias → keep under `CrdtView.DocumentId.Props`, pointing to `t.DocumentId.Props`.
- current binary file aliases → keep under `CrdtView.BinaryFile.*`, pointing to `t.BinaryFile.*` namespace shapes.
- current `CrdtView.Repo.*` aliases → keep under `CrdtView.Repo.*`, pointing to `t.Repo.*` namespace shapes.

`CrdtView` preserves an already-public namespace, but does not preserve flat `CrdtViewLib`.

### `Debug`

Owning file: `src/m.Debug/t.ts`.

```ts
export declare namespace Debug {
  export type Lib = {
    readonly Reentry: Reentry.Lib;
    installTripwireGetHeads(enable: boolean): void;
    defer(fn: () => void): void;
    coalesce(): Scheduler;
    getHeadsSafe(doc: unknown): Heads;
    getHeadsDeferred(doc: unknown, use: (heads: Heads) => void): void;
    guardDocAccess<T>(doc: T): T;
  };
}
```

Mapping:

- `DebugLib` → `Debug.Lib`
- `DebugReentryLib` → `Debug.Reentry.Lib`
- `Scheduler` → `Debug.Scheduler`
- `Heads` → `Debug.Heads`

### `CrdtGraph`

Owning file: `src/m.Graph/t.ts`.

```ts
export declare namespace CrdtGraph {
  export type Lib = {
    readonly walk: Walk.Fn;
    readonly Dag: { readonly build: Dag.Fn; /* generic DAG helpers */ };
    readonly default: { readonly discoverRefs: t.Graph.DiscoverRefs };
  };
}
```

Mapping:

- `CrdtGraphLib` → `CrdtGraph.Lib`
- `CrdtGraphLoadDoc<T>` → `CrdtGraph.LoadDoc<T>`
- `CrdtGraphWalkArgsBase<T>` → `CrdtGraph.Walk.ArgsBase<T>`
- `CrdtGraphWalkArgsRepo<T>` → `CrdtGraph.Walk.ArgsRepo<T>`
- `CrdtGraphWalkArgsLoad<T>` → `CrdtGraph.Walk.ArgsLoad<T>`
- `CrdtGraphWalkArgs<T>` → `CrdtGraph.Walk.Args<T>`
- `CrdtGraphWalk` → `CrdtGraph.Walk.Fn`
- `CrdtGraphDagArgsBase<T>` → `CrdtGraph.Dag.ArgsBase<T>`
- `CrdtGraphDagArgsRepo<T>` → `CrdtGraph.Dag.ArgsRepo<T>`
- `CrdtGraphDagArgsLoad<T>` → `CrdtGraph.Dag.ArgsLoad<T>`
- `CrdtGraphDagArgs<T>` → `CrdtGraph.Dag.Args<T>`
- `CrdtGraphDag` → `CrdtGraph.Dag.Fn`

### `SyncServer`

Owning file: `src/m.server/t.ts`.

```ts
export declare namespace SyncServer {
  export type Lib = {
    readonly probe: Probe.Fn;
    ws(options?: StartOptions): Promise<Instance>;
  };
}
```

Mapping:

- `SyncServerLib` → `SyncServer.Lib`
- `SyncServerStartOptions` → `SyncServer.StartOptions`
- `SyncServer` → `SyncServer.Instance`
- `SyncServerHandsakeHeaders` → `SyncServer.Handshake.Headers` (fix typo in target name; no typo alias)
- `SyncServerArgs` → `SyncServer.Args`
- `SyncServerInfo` → `SyncServer.Info`
- `ProbeHandshake` → `SyncServer.Probe.Fn`
- `ProbeHandshakeResponse` → `SyncServer.Probe.Response`

### `ServerInfo`

Owning file: `src/m.server.client/t.ts`.

```ts
export declare namespace ServerInfo {
  export type Lib = {
    get(url: t.StringUrl): Promise<Response>;
  };
}
```

Mapping:

- `SyncServerInfoLib` → `ServerInfo.Lib`
- `SyncServerInfoResponse` → `ServerInfo.Response`
- response `data` field uses `t.SyncServer.Info`.

### `Dev`

Owning file: `src/ui/-dev/t.ts`.

Mapping:

- `DevLib` → `Dev.Lib`

Keep `ui.ObjectView/t.ts` out of this pass unless check residue shows its flat names are re-exported as stale aliases from the target spine. `Dev.Lib.ObjectView` continues to point at the existing ObjectView props/component contract.

### `Binary`

Owning file: `src/ui/ui.Binary/t.ts`.

Mapping:

- `BinaryLib` → `Binary.Lib`
- `BinaryFileProps` → `BinaryFile.Props`
- `BinaryFileMap<T>` → `BinaryFile.Map<T>`

### `Document`

Owning file: `src/ui/ui.Document/t.ts`.

Mapping:

- `DocumentLib` → `Document.Lib`
- `DocumentStats` → `Document.Stats`
- `DocumentProps` → `Document.Props`

### `DocumentId`

Owning files:

- `src/ui/ui.DocumentId/t.ts`
- `src/ui/ui.DocumentId/t.hooks.ts`
- `src/ui/ui.DocumentId/t.parse.ts`

Target root:

```ts
export declare namespace DocumentId {
  export type Lib = {
    readonly View: t.FC<Props>;
    readonly useController: Hook.Use;
    readonly Parse: Parse.Lib;
  };
}
```

Mapping:

- `DocumentIdLib` → `DocumentId.Lib`
- `DocumentIdProps` → `DocumentId.Props`
- `DocumentIdAction` → `DocumentId.Action.Name`
- `DocumentIdActionArgs` → `DocumentId.Action.Args`
- `DocumentIdActionHandler` → `DocumentId.Action.Handler`
- `DocumentIdReadyHandler` → `DocumentId.Event.ReadyHandler`
- `DocumentIdChangedHandler` → `DocumentId.Event.ChangedHandler`
- `DocumentIdChanged` → `DocumentId.Event.Changed`
- `DocumentIdUrlFactory` → `DocumentId.Url.Factory`
- `DocumentIdUrlFactoryArgs` → `DocumentId.Url.FactoryArgs`
- `UseDocumentIdHook` → `DocumentId.Hook.Use`
- `UseDocumentIdHookArgs<T>` → `DocumentId.Hook.Args<T>`
- `DocumentIdHook` → `DocumentId.Hook.Instance`
- `DocumentIdHookProps` → `DocumentId.Hook.Props`
- `DocumentIdHookSignals` → `DocumentId.Hook.Signals`
- `DocumentIdHookSignalValues` → `DocumentId.Hook.SignalValues`
- `DocumentIdParseLib` → `DocumentId.Parse.Lib`
- `DocumentIdParsed` → `DocumentId.Parse.Result`

Implementation detail: keep `ActionParams` local to `t.ts` unless it earns public naming; do not export it.

### `Layout`

Owning file: `src/ui/ui.Layout/t.ts`.

Mapping:

- `LayoutLib` → `Layout.Lib`
- `LayoutDefaults` → `Layout.Defaults`
- `LayoutProps` → `Layout.Props`
- `LayoutBindings` → `Layout.Bindings`
- `LayoutCtx` → `Layout.Ctx`
- `LayoutSlots` → `Layout.Slots`
- `LayoutSlot` → `Layout.SlotName`
- `LayoutSignals` → `Layout.Signals`
- `LayoutHeader` → `Layout.Header`
- `LayoutSidebar` → `Layout.Sidebar`
- `LayoutCropmarks` → `Layout.Cropmarks`
- `LayoutSpinning` → `Layout.Spinning`

### `Repo`

Owning files:

- `src/ui/ui.Repo/t.ts`
- `src/ui/ui.Repo/t.info.ts`
- `src/ui/ui.Repo/t.switch.ts`

Target root:

```ts
export declare namespace Repo {
  export type Lib = {
    readonly Info: t.FC<Info.Props>;
    readonly SyncSwitch: t.FC<SyncSwitch.Props>;
    readonly StatusBullet: t.FC<StatusBullet.Props>;
  };
}
```

Mapping:

- `RepoInfoLib` → `Repo.Lib`
- `RepoInfoStatus` → `Repo.Status`
- `RepoInfoProps` → `Repo.Info.Props`
- `RepoStatusBulletProps` → `Repo.StatusBullet.Props`
- `RepoSyncSwitchProps` → `Repo.SyncSwitch.Props`

## Legacy alias disposition

Do not add compatibility alias blocks in `@sys/driver-automerge` target `t.ts` / `t.*.ts` files.

Concrete current callers are in scope and must be migrated in this refactor. The package type pool already routes most references through `import { type t } from './common.ts'`, so migration is local and mechanical.

Exact downstream caller evidence:

- `code/sys.driver/driver-monaco/src/common/t.ts` imports `DocumentIdProps` from `@sys/driver-automerge/t`.
  - `code/sys.driver/driver-monaco/src/ui/m.Crdt/-spec/-SPEC.tsx` consumes it as `t.DocumentIdProps`.
- `deploy/@tdb.slc/src/common/t.ts` imports `DocumentIdProps` from `@sys/driver-automerge/t`.
  - `deploy/@tdb.slc/src/ui/ui.Canvas.Project/-spec/-SPEC.tsx` consumes it as `t.DocumentIdProps`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts` imports `CrdtWebNetworkArg` from `@sys/driver-automerge/t`.
  - `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-u.repo.ts` consumes it as `t.CrdtWebNetworkArg`.

Disposition for those callers:

- Update local type barrels to import/export the owning namespace (`DocumentId` or `CrdtWeb`) instead of flat names.
- Migrate concrete consumers to `t.DocumentId.Props` and `t.CrdtWeb.Network.Arg`.
- Do not retain `DocumentIdProps` or `CrdtWebNetworkArg` in `@sys/driver-automerge/t` for those callers.
- If deploy/app caller migration is not approved for the same commit, HOLD and ask whether to scope the pass with temporary aliases or defer the package refactor.

Other direct downstream imports found (`Crdt`, `CrdtRef`, `CrdtRepoWireEvent`) are not target flat names for this pass and should remain valid because `Crdt` is preserved as a namespace and `m.Crdt.Ref/t.ts` is out of scope.

## Source files expected to change

### Target type spines and adjacent factor files

- `code/sys.driver/driver-automerge/src/types.ts` — stop exporting `Crdt` / `CrdtView` from `t.namespace.ts` after they move into the owning target spines; preserve type-only aggregation.
- `code/sys.driver/driver-automerge/src/t.namespace.ts` — retire or empty/remove after moving `Crdt` and `CrdtView` namespace content; use `remove` if the implementation deletes the file.
- `code/sys.driver/driver-automerge/src/-exports/-fs/t.ts` — rewrite flat FS CRDT exports into `CrdtFs` namespace.
- `code/sys.driver/driver-automerge/src/-exports/-web/t.ts` — rewrite flat browser CRDT exports into `CrdtWeb` namespace.
- `code/sys.driver/driver-automerge/src/-exports/-web.ui/t.ts` — rewrite `CrdtViewLib` into `CrdtView.Lib` and absorb current `CrdtView` namespace aliases.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.ts` — declare `Crdt` namespace with `Lib` first; curate core/id/is/url/str/meta/network detail types under `Crdt.*`.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.core.ts` — factor-local rename/curation for `Crdt.Splice` and `Crdt.ToObject`; avoid public flat leakage.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.Id.ts` — factor-local helper lib shape used by `Crdt.Lib['Id']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.Is.ts` — factor-local helper lib shape used by `Crdt.Lib['Is']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.Str.ts` — factor-local helper lib shape used by `Crdt.Lib['Str']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.meta.ts` — factor-local sys metadata shape curated as `Crdt.SysMeta`.
- `code/sys.driver/driver-automerge/src/m.Crdt/t.network.ts` — factor-local WebSocket network arg shapes curated as `Crdt.Network.*`.
- `code/sys.driver/driver-automerge/src/m.Debug/t.ts` — rewrite flat debug types into `Debug` namespace.
- `code/sys.driver/driver-automerge/src/m.Graph/t.ts` — rewrite flat graph walker/DAG types into `CrdtGraph` namespace with `Walk` and `Dag` sub-namespaces.
- `code/sys.driver/driver-automerge/src/m.server/t.ts` — rewrite sync-server types into `SyncServer` namespace with `Handshake` and `Probe` sub-namespaces.
- `code/sys.driver/driver-automerge/src/m.server.client/t.ts` — rewrite sync-server client types into `ServerInfo` namespace.
- `code/sys.driver/driver-automerge/src/ui/-dev/t.ts` — rewrite `DevLib` into `Dev.Lib` while keeping ObjectView contracts type-only.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/t.ts` — rewrite binary UI flat types into `Binary` namespace.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/t.ts` — rewrite document UI flat types into `Document` namespace.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/t.ts` — rewrite document-id UI flat types into `DocumentId` namespace and curate hook/parse details.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/t.hooks.ts` — factor-local hook shapes curated under `DocumentId.Hook.*`; stop public flat leakage through root `t.ts`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/t.parse.ts` — factor-local parse shapes curated under `DocumentId.Parse.*`; stop public flat leakage through root `t.ts`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/t.ts` — rewrite layout UI flat types into `Layout` namespace.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/t.ts` — rewrite repo UI library/status types into `Repo` namespace and curate factor details.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/t.info.ts` — factor-local info/status-bullet prop shapes curated under `Repo.Info.*` and `Repo.StatusBullet.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/t.switch.ts` — factor-local sync-switch prop shape curated under `Repo.SyncSwitch.*`.

### Package runtime, tests, specs, and contract consumers

- `code/sys.driver/driver-automerge/src/-exports/-fs/mod.ts` — annotate `Crdt` as `t.CrdtFs.Lib`; update repo/network arg references.
- `code/sys.driver/driver-automerge/src/-exports/-web/mod.ts` — annotate `Crdt` as `t.CrdtWeb.Lib`; update repo/storage/network arg references.
- `code/sys.driver/driver-automerge/src/-exports/-web.ui/mod.ts` — annotate `Crdt` as `t.CrdtView.Lib`; update UI member lib references through namespaces.
- `code/sys.driver/driver-automerge/src/-exports/-ws.ts` — update CLI arg type to `t.SyncServer.Args`.
- `code/sys.driver/driver-automerge/src/m.Crdt/m.Id.ts` — annotate `CrdtId` as `t.Crdt.Lib['Id']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/m.Is.ts` — annotate `CrdtIs` as `t.Crdt.Lib['Is']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/m.Str.ts` — annotate `CrdtStr` as `t.Crdt.Lib['Str']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/m.Url.ts` — annotate `CrdtUrl` as `t.Crdt.Lib['Url']`.
- `code/sys.driver/driver-automerge/src/m.Crdt/u.toObject.ts` — annotate `toObject` as `t.Crdt.ToObject`.
- `code/sys.driver/driver-automerge/src/m.Crdt/-test/-.test.ts` — update common API assertion helper to `t.Crdt.Lib`.
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/u.ts` — update `whenReady` annotation to `t.Crdt.Lib['whenReady']`.
- `code/sys.driver/driver-automerge/src/m.Crdt.Repo/u.toRepo.ts` — update seeded metadata alias to `t.Crdt.SysMeta`.
- `code/sys.driver/driver-automerge/src/m.Graph/m.Graph.ts` — annotate `CrdtGraph` as `t.CrdtGraph.Lib`.
- `code/sys.driver/driver-automerge/src/m.Graph/u.walk.ts` — update walk function and args references to `t.CrdtGraph.Walk.*`.
- `code/sys.driver/driver-automerge/src/m.Graph/u.dag.ts` — update DAG function and args references to `t.CrdtGraph.Dag.*`.
- `code/sys.driver/driver-automerge/src/m.Graph/-test/-cmd.test.ts` — update command-backed loader type to `t.CrdtGraph.LoadDoc`.
- `code/sys.driver/driver-automerge/src/m.Debug/m.Debug.ts` — annotate `Debug` as `t.Debug.Lib`; update `Scheduler` and `Heads` references.
- `code/sys.driver/driver-automerge/src/m.Debug/m.Reentry.ts` — annotate `Reentry` as `t.Debug.Reentry.Lib`.
- `code/sys.driver/driver-automerge/src/m.server/m.Server.ts` — annotate `Server` as `t.SyncServer.Lib`.
- `code/sys.driver/driver-automerge/src/m.server/u.ws.ts` — update `ws` signature to `t.SyncServer.Lib['ws']` and returned instance typing as needed.
- `code/sys.driver/driver-automerge/src/m.server/u.http.ts` — update server metadata shape to `t.SyncServer.Info`.
- `code/sys.driver/driver-automerge/src/m.server/u.monitor.ts` — update totals accessor to `t.SyncServer.Info['total']`.
- `code/sys.driver/driver-automerge/src/m.server/u.probe.ts` — update probe response/header references to `t.SyncServer.Probe.Response` and `t.SyncServer.Handshake.Headers`.
- `code/sys.driver/driver-automerge/src/m.server.client/m.ServerInfo.ts` — annotate `ServerInfo` as `t.ServerInfo.Lib`.
- `code/sys.driver/driver-automerge/src/m.server.client/u.get.ts` — update client response to `t.ServerInfo.Response` and data shape to `t.SyncServer.Info`.
- `code/sys.driver/driver-automerge/src/m.worker/t.config.ts` — update web storage and network arg references to `t.CrdtWeb.Storage.Arg` and `t.Crdt.Network.WebsocketArg`.
- `code/sys.driver/driver-automerge/src/m.worker/-test.u/u.testHelpers.ts` — update FS network input type to `t.CrdtFs.Network.Input`.
- `code/sys.driver/driver-automerge/src/m.Cmd.commands/cmd.doc.stats.ts` — update document stats type to `t.Document.Stats`.
- `code/sys.driver/driver-automerge/src/m.Cmd.commands/t.ts` — update doc-stats result to `t.Document.Stats`.
- `code/sys.driver/driver-automerge/src/ui/-dev/m.Dev.ts` — annotate `Dev` as `t.Dev.Lib`.
- `code/sys.driver/driver-automerge/src/ui/-dev/u.field.ts` — update method references to `t.Dev.Lib['fieldFromPath']` and `t.Dev.Lib['expandPaths']`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/m.Binary.ts` — annotate `Binary` as `t.Binary.Lib`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/ui.tsx` — update component props and file map references to `t.BinaryFile.Props` / `t.BinaryFile.Map`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/u.handleSave.ts` — update file map reference to `t.BinaryFile.Map`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/u.fmt.ts` — update formatter file map references to `t.BinaryFile.Map`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/-spec/-SPEC.Debug.tsx` — update debug props to `t.BinaryFile.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Binary/-spec/-SPEC.tsx` — update hosted document-id props to `t.DocumentId.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/mod.ts` — annotate `Document` as `t.Document.Lib`.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/ui.tsx` — update component props to `t.Document.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/u.toItems.ts` — update stats and metadata references to `t.Document.Stats` and `t.Crdt.SysMeta`.
- `code/sys.driver/driver-automerge/src/ui/ui.Document/-spec/-SPEC.Debug.tsx` — update debug props to `t.Document.Props`.
- `code/sys.driver/driver-automerge/src/ui/use/t.DocStats.ts` — update stats hook result to `t.Document.Stats`.
- `code/sys.driver/driver-automerge/src/ui/use/use.DocStats.ts` — update state type to `t.Document.Stats`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/m.DocumentId.ts` — annotate `DocumentId` as `t.DocumentId.Lib`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/ui.tsx` — update props, changed event, action, and hook references to `t.DocumentId.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/ui.ActionButton.tsx` — update action type to `t.DocumentId.Action.Name`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/ui.Prefix.tsx` — update hook transient/url references to `t.DocumentId.Hook.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/u.DocUrl.ts` — update URL option reference to `t.DocumentId.Hook.Args['url']`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/u.Parse.ts` — update parse lib/result references to `t.DocumentId.Parse.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/use.Controller.ts` — update hook/action/signal/props references to `t.DocumentId.Hook.*` and `t.DocumentId.Action.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/use.TransientMessage.ts` — update transient type references to `t.DocumentId.Hook.Instance['transient']`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/-spec/-SPEC.tsx` — update hook args references to `t.DocumentId.Hook.Args`.
- `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/-spec/-SPEC.Debug.tsx` — update props, URL factory, and hook args references to `t.DocumentId.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.Card/t.ts` — update card signal alias from `t.DocumentIdHookSignals` to `t.DocumentId.Hook.Signals`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/common.ts` — update defaults type to `t.Layout.Defaults`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/m.Layout.ts` — annotate `Layout` as `t.Layout.Lib`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.tsx` — update component props to `t.Layout.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.Body.tsx` — update props and percent aliases that refer to layout shapes.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.Header.tsx` — update props to `t.Layout.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.Main.tsx` — update props to `t.Layout.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.Sidebar.tsx` — update props to `t.Layout.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/ui.Footer.tsx` — update props to `t.Layout.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/u.ts` — update header/sidebar/cropmarks/ctx/props references to `t.Layout.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/-spec/-SPEC.tsx` — update layout slot references to `t.Layout.Slots`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/-spec/-SPEC.Debug.tsx` — update storage, signal, binding, and config references to `t.Layout.*`.
- `code/sys.driver/driver-automerge/src/ui/ui.Layout/-spec/-ui.Foo.tsx` — update slot context to `t.Layout.Ctx`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/common.ts` — update default mode type to `t.Repo.SyncSwitch.Props['mode']`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/m.Repo.ts` — annotate `Repo` as `t.Repo.Lib`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/ui.Info.tsx` — update props to `t.Repo.Info.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/ui.StatusBullet.tsx` — update props to `t.Repo.StatusBullet.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/ui.SyncSwitch.tsx` — update props/status references to `t.Repo.SyncSwitch.Props` and `t.Repo.Status`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/use.SyncSwitch.Controller.ts` — update props to `t.Repo.SyncSwitch.Props`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/u.status.ts` — update status return type to `t.Repo.Status`.
- `code/sys.driver/driver-automerge/src/ui/ui.Repo/-spec/-SPEC.Debug.tsx` — update debug props to `t.Repo.SyncSwitch.Props`.

### Downstream import lane

- `code/sys.driver/driver-monaco/src/common/t.ts` — replace direct `DocumentIdProps` import from `@sys/driver-automerge/t` with the `DocumentId` namespace.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/-spec/-SPEC.tsx` — migrate `t.DocumentIdProps` to `t.DocumentId.Props`.
- `deploy/@tdb.slc/src/common/t.ts` — replace direct `DocumentIdProps` import from `@sys/driver-automerge/t` with the `DocumentId` namespace.
- `deploy/@tdb.slc/src/ui/ui.Canvas.Project/-spec/-SPEC.tsx` — migrate `t.DocumentIdProps` to `t.DocumentId.Props`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts` — replace direct `CrdtWebNetworkArg` import from `@sys/driver-automerge/t` with the `CrdtWeb` namespace.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-u.repo.ts` — migrate `t.CrdtWebNetworkArg` to `t.CrdtWeb.Network.Arg`.

## Import/reference update rules

- Runtime implementations continue to import the local type pool via `import { type t } from './common.ts'` or the nearest local `common.ts`.
- Use `t.<NS>.Lib` for exported runtime values.
- Use root namespace aliases for public cross-module shapes: `t.Document.Stats`, `t.Layout.Props`, `t.Repo.Status`, `t.SyncServer.Info`, etc.
- Use type-only namespace imports from factor files only in owning root `t.ts` files when curating factor details.
- Do not import types from runtime modules.
- Do not add runtime values, literal registries, side effects, or convenience value exports to `t.ts` / `t.*.ts`.
- If a factor-file curation creates an avoidable cycle, collapse the small factor into its owning root `t.ts` rather than adding flat aliases.

## Verification commands

Run from the nearest module root unless noted.

Primary package proof:

```sh
cd code/sys.driver/driver-automerge && deno task check
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/m.Crdt
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/m.Debug
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/m.Graph
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/m.server
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/m.server.client
cd code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/ui
cd code/sys.driver/driver-automerge && deno task test
```

Downstream lane proof if downstream callers are migrated (expected for no-alias implementation):

```sh
cd code/sys.driver/driver-monaco && deno task check
cd deploy/@tdb.slc && deno task check
cd deploy/@tdb.edu.slug && deno task check
```

Residue checks:

```sh
rg -n "\b(CrdtFilesystemLib|CrdtFsRepoArgs|CrdtFsNetworkArg|CrdtFsNetworkArgInput|CrdtWebLib|CrdtWebRepoArgs|CrdtWebStorageArg|CrdtWebStorageArgInput|CrdtWebNetworkArg|CrdtWebNetworkArgInput|CrdtViewLib|CrdtLib|CrdtUrlLib|CrdtIdLib|CrdtIsLib|CrdtStrLib|CrdtStringSplice|CrdtToObject|SysMeta|StringWebsocketEndpoint|CrdtWebsocketNetworkArg|DebugLib|DebugReentryLib|CrdtGraphLib|CrdtGraphLoadDoc|CrdtGraphWalk|CrdtGraphDag|SyncServerLib|SyncServerStartOptions|SyncServerHandsakeHeaders|SyncServerArgs|SyncServerInfoLib|SyncServerInfoResponse|DevLib|BinaryLib|BinaryFileProps|BinaryFileMap|DocumentLib|DocumentStats|DocumentProps|DocumentIdLib|DocumentIdProps|UseDocumentIdHook|DocumentIdHook|DocumentIdParseLib|DocumentIdParsed|LayoutLib|LayoutDefaults|LayoutProps|LayoutBindings|LayoutCtx|LayoutSlots|RepoInfoLib|RepoInfoProps|RepoSyncSwitchProps|RepoInfoStatus)\b" code/sys.driver/driver-automerge/src code/sys.driver/driver-monaco/src/common/t.ts code/sys.driver/driver-monaco/src/ui/m.Crdt/-spec/-SPEC.tsx deploy/@tdb.slc/src/common/t.ts deploy/@tdb.slc/src/ui/ui.Canvas.Project/-spec/-SPEC.tsx deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-u.repo.ts
rg -n "export type \* from './t\.(core|Id|Is|meta|network|Str|hooks|parse|info|switch)\.ts'" code/sys.driver/driver-automerge/src
rg -n "from '@sys/driver-automerge/t'" code/sys.driver/driver-monaco/src/common/t.ts code/sys.tools/src/common/t.ts code/sys.driver/driver-prosemirror/src/common/t.ts code/sys.dev/-scripts/task.snapshot.ts deploy/@tdb.slc/src/common/t.ts deploy/@tdb.edu.slug/src/common/t.ts deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts
```

Inspect residue manually for intentional non-target flat names from out-of-scope spines such as `CrdtRef`, `CrdtRepo`, `CrdtCmdLib`, and `CrdtWorkerLib`.

## Final reality

Landed implementation commit:

- `510aaaaef refactor(driver-automerge): canonicalize type namespaces`

Actual changes:

- Replaced the planned flat `@sys/driver-automerge` type spines with canonical namespace contracts across filesystem/browser/browser-UI exports, CRDT core helpers, debug helpers, graph helpers, sync-server helpers, server-info helpers, and CRDT UI components.
- Retired `code/sys.driver/driver-automerge/src/t.namespace.ts`; moved `Crdt` and `CrdtView` contract lanes into owning target spines.
- Kept `Lib` first in the target namespaces and curated earned sub-namespaces such as `Crdt.Network`, `Crdt.DocumentId`, `CrdtView.Layout`, `CrdtView.BinaryFile`, `CrdtGraph.Walk`, `CrdtGraph.Dag`, `SyncServer.Handshake`, `SyncServer.Probe`, `DocumentId.Hook`, `DocumentId.Parse`, and `Repo.SyncSwitch`.
- Removed target flat compatibility aliases rather than adding deprecated alias blocks; downstream in-scope callers were migrated.
- Added `Crdt.DocumentId.*` as a CRDT-root type convenience lane so downstream type consumers can import `Crdt` without a separate root `DocumentId` type import.
- Cleaned stale `CrdtView` convenience aliases with no live callers and preserved `CrdtView.BinaryFile.Map<T>` generic shape.
- Restored `deno.lock` so the implementation commit contains no lockfile dependency drift.

Actual downstream migrations:

- `code/sys.driver/driver-monaco/src/common/t.ts` now imports `A` and `Crdt` only from `@sys/driver-automerge/t`; local CRDT spec consumers use `t.Crdt.DocumentId.Props`.
- `deploy/@tdb.slc/src/common/t.ts` now imports `Crdt` only from `@sys/driver-automerge/t`; Canvas.Project spec consumers use `t.Crdt.DocumentId.Props`.
- `deploy/@tdb.edu.slug/src/ui/-dev/ui.Crdt/-spec/-t.ts` imports `CrdtWeb`; repo helper consumers use `t.CrdtWeb.Network.Arg`.

Final verification/proof:

- `git diff --check -- ':!*.md'`
- `cd code/sys.driver/driver-automerge && deno task check`
- `cd code/sys.driver/driver-monaco && deno task check`
- `cd deploy/@tdb.slc && deno task check`
- `cd deploy/@tdb.edu.slug && deno task check`
- Full package test run passed before final review: `cd code/sys.driver/driver-automerge && deno task test` → `48 passed (319 steps) | 0 failed`.
- Residue scans found no in-scope legacy flat target names, no dead `CrdtView` alias leftovers, and no `deno.lock` diff.

Final review result:

- SHIP.
- Remaining risk: none found.

## HOLD conditions

HOLD if any of these occur:

- A target `t.ts` / `t.*.ts` would need a runtime value, runtime-module import, IO, side effect, or implementation helper to compile.
- TypeScript reports duplicate or ambiguous `Crdt` / `CrdtView` exports after moving namespaces; resolve by retiring `t.namespace.ts`, not by adding compatibility aliases.
- A current caller outside this plan proves it cannot migrate away from a removed flat target name in the same clean refactor.
- A reviewer requires preserving flat `@sys/driver-automerge/t` names for external consumers; that needs an explicit compatibility-alias decision or a dedicated `Remove Compatibility Alias` pass later.
- The refactor starts pulling `m.Crdt.Ref`, `m.Crdt.Repo`, `m.Cmd`, or `m.worker` flat type spines into scope beyond reference updates; that is a larger follow-on namespace pass.
- Downstream caller migrations in `driver-monaco`, `deploy/@tdb.slc`, or `deploy/@tdb.edu.slug` are not approved; stop before retaining `DocumentIdProps` or `CrdtWebNetworkArg` in `@sys/driver-automerge/t`.
- Factor-file curation becomes less clear than the original spine; collapse tiny factor files into the owning root `t.ts` rather than preserving public flat leakage.
