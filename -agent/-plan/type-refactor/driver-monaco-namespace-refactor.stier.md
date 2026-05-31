# @sys/driver-monaco editor type namespace refactor

- [ ] refactor(driver-monaco): namespace editor driver types

## Scope

Refactor the legacy flat type spines in `code/sys.driver/driver-monaco` to canonical namespace spines.

Primary target files from the probe:

- `src/-fake/t.ts`
- `src/m.Is/t.ts`
- `src/m.Error/t.ts`
- `src/m.Event/t.ts`
- `src/m.Monaco/t.ts`
- `src/ui/m.Crdt/t.ts`
- `src/ui/m.Markers.Folding/t.ts`
- `src/ui/m.Yaml/t.ts`

The clean refactor also includes adjacent type factor files owned by those modules so the public package type surface does not retain stale flat names.

Runtime exports stay unchanged. This is a type-plane refactor and must not add runtime values, side effects, or runtime imports to `t.ts` / `t.*.ts`.

## Modern shape reference

Compared against `code/sys/fs/src/m.FileMap/t.ts` as the modern local shape:

```ts
export declare namespace FileMap {
  export type Lib = { ... };
  export namespace Data { ... }
}
```

Use the same contract pattern: root noun namespace, `Lib` first, detail types beneath the owning root or earned sub-namespace.

## Current legacy flat names

### Fake Monaco

- `FakeMonacoLib`
- `CreateFakeEditor`
- `FakeEditorFull`
- `FakeEditor`
- `CreateFakeTextModel`
- `FakeTextModelOptions`
- `FakeTextModelFull`
- `FakeTextModel`
- `CreateFakeMonaco`
- `FakeMonacoGlobal`
- `SpyLib`
- `SetModelMarkersFn`
- `SetModelMarkersArgs`
- `SetModelMarkersCall`
- `SetModelMarkersSpy`

### Editor predicates

- `EditorIsLib`

### Editor diagnostics/errors

- `EditorErrorLib`
- `DiagnosticSeverity`
- `DiagnosticSeverityConst`
- `EditorDiagnostic`

### Editor events/bus

- `EditorEventBus`
- `EditorEventObservable`
- `EditorBusFilterLib`
- `EditorBusLib`
- `EditorEvent`
- `EventDebug`
- `EventsCrdt`
- `EventCrdtText`
- `EventCrdtMarks`
- `EventsCrdtFolding`
- `EventCrdtFoldingReady`
- `EventCrdtFolding`
- `EventsYaml`
- `EventYaml`
- `EventYamlCursor`
- `EditorPingKind`
- `EventEditorPing`
- `EventEditorPong`

### Monaco driver surface

- `MonacoCtx`
- `MonacoLib`
- `EditorCursor`
- `EditorLinkLib`
- `EditorLinkBounds`

### CRDT editor binding

- `EditorCrdtLib`
- `EditorCrdtBind`
- `EditorCrdtBinding`
- `UseEditorCrdtBinding`
- `EditorCrdtBindingReadyHandler`
- `EditorCrdtBindingReady`
- `UseEditorCrdtBindingArgs`
- `EditorCrdtBindingHook`
- `EditorCrdtLinkLib`
- `EditorCrdtRegisterLink`
- `EditorCrdtRegisterLinkOptions`
- `EditorCrdtLinkClickHandler`
- `EditorCrdtLinkClick`
- `EditorCrdtLinkCreateDoc`
- `EditorCrdtLinkCreateResult`
- `EditorCrdtLinkEnable`
- `EditorCrdtLinkEnableOptions`

### Folding markers

- `FoldOffset`
- `EditorFoldingLib`
- `EditorFoldingAreaObserver`
- `UseFoldMarks`
- `UseFoldMarksArgs`
- `BindFoldMarks`
- `BindFoldMarksArgs`
- `EditorFoldBinding`

### YAML editor

- `EditorYamlLib`
- `EditorYaml`
- `EditorYamlErrorLib`
- `YamlErrorToMarker`
- `YamlErrorsToMarkers`
- `EditorYamlPathLib`
- `EditorYamlCursorPathObserver`
- `UseEditorYaml`
- `UseEditorYamlArgs`
- `EditorYamlHook`
- `UseYamlErrorMarkers`
- `UseYamlErrorMarkersArgs`

## Target namespace shape

### `MonacoFake`

Runtime value: `MonacoFake`.

Target public shape:

```ts
export declare namespace MonacoFake {
  export type Lib = {
    readonly Spy: Spy.Lib;
    monaco: Global.Create;
    model: Model.Create;
    editor: Editor.Create;
    ctx(model?: Editor.Shape | string, monaco?: Global.Shape): t.MonacoDriver.Ctx;
    asMonaco(fake: Global.Shape | t.Monaco.Monaco): t.Monaco.Monaco;
    asEditor(fake: Editor.Shape | t.Monaco.Editor): t.Monaco.Editor;
    asModel(fake: Model.Shape | t.Monaco.TextModel): t.Monaco.TextModel;
  };

  export namespace Editor { ... }
  export namespace Model { ... }
  export namespace Global { ... }
  export namespace Spy { ... }
}
```

Expected mapping:

- `t.FakeMonacoLib` → `t.MonacoFake.Lib`
- `t.CreateFakeEditor` → `t.MonacoFake.Editor.Create`
- `t.FakeEditorFull` → `t.MonacoFake.Editor.Full`
- `t.FakeEditor` → `t.MonacoFake.Editor.Shape`
- `t.CreateFakeTextModel` → `t.MonacoFake.Model.Create`
- `t.FakeTextModelOptions` → `t.MonacoFake.Model.Options`
- `t.FakeTextModelFull` → `t.MonacoFake.Model.Full`
- `t.FakeTextModel` → `t.MonacoFake.Model.Shape`
- `t.CreateFakeMonaco` → `t.MonacoFake.Global.Create`
- `t.FakeMonacoGlobal` → `t.MonacoFake.Global.Shape`
- `t.SpyLib` → `t.MonacoFake.Spy.Lib`
- `t.SetModelMarkersFn` → `t.MonacoFake.Spy.SetModelMarkers.Fn`
- `t.SetModelMarkersArgs` → `t.MonacoFake.Spy.SetModelMarkers.Args`
- `t.SetModelMarkersCall` → `t.MonacoFake.Spy.SetModelMarkers.Call`
- `t.SetModelMarkersSpy` → `t.MonacoFake.Spy.SetModelMarkers.Handle`

### `EditorIs`

Runtime value: `EditorIs`.

Target:

```ts
export declare namespace EditorIs {
  export type Lib = { ... };
}
```

Mapping:

- `t.EditorIsLib` → `t.EditorIs.Lib`

### `EditorError`

Runtime value: `Error` under the editor/Monaco surface.

Target:

```ts
export declare namespace EditorError {
  export type Lib = {
    toMarkers(...): t.Monaco.I.IMarkerData[];
    useErrorMarkers: t.UseErrorMarkers;
  };

  export namespace Diagnostic {
    export type Severity = 'Error' | 'Warning' | 'Info' | 'Hint';
    export type SeverityConst = Record<NonNullable<Severity>, number>;
    export type Shape = { ... };
  }
}
```

Mapping:

- `t.EditorErrorLib` → `t.EditorError.Lib`
- `t.DiagnosticSeverity` → `t.EditorError.Diagnostic.Severity`
- `t.DiagnosticSeverityConst` → `t.EditorError.Diagnostic.SeverityConst`
- `t.EditorDiagnostic` → `t.EditorError.Diagnostic.Shape`

### `EditorBus` and `EditorEvent`

Runtime value: `Bus`.

Target:

```ts
export declare namespace EditorBus {
  export type Lib = { ... };
  export type Subject = t.Subject<t.EditorEvent.Shape>;
  export type Observable = t.Observable<t.EditorEvent.Shape>;
  export type FilterLib = t.EventFilterLib<t.EditorEvent.Shape>;
}

export declare namespace EditorEvent {
  export type Shape = Debug | Crdt.Shape | Yaml.Shape | Ping.Request | Ping.Response;
  export type Debug = { ... };
  export namespace Crdt { ... }
  export namespace Yaml { ... }
  export namespace Ping { ... }
}
```

Mapping:

- `t.EditorBusLib` → `t.EditorBus.Lib`
- `t.EditorEventBus` → `t.EditorBus.Subject`
- `t.EditorEventObservable` → `t.EditorBus.Observable`
- `t.EditorBusFilterLib` → `t.EditorBus.FilterLib`
- `t.EditorEvent` → `t.EditorEvent.Shape`
- `t.EventDebug` → `t.EditorEvent.Debug`
- `t.EventsCrdt` → `t.EditorEvent.Crdt.Shape`
- `t.EventCrdtText` → `t.EditorEvent.Crdt.Text`
- `t.EventCrdtMarks` → `t.EditorEvent.Crdt.Marks`
- `t.EventsCrdtFolding` → `t.EditorEvent.Crdt.FoldingShape`
- `t.EventCrdtFoldingReady` → `t.EditorEvent.Crdt.FoldingReady`
- `t.EventCrdtFolding` → `t.EditorEvent.Crdt.Folding`
- `t.EventsYaml` → `t.EditorEvent.Yaml.Shape`
- `t.EventYaml` → `t.EditorEvent.Yaml.Data`
- `t.EventYamlCursor` → `t.EditorEvent.Yaml.Cursor`
- `t.EditorPingKind` → `t.EditorEvent.Ping.Kind`
- `t.EventEditorPing` → `t.EditorEvent.Ping.Request`
- `t.EventEditorPong` → `t.EditorEvent.Ping.Response`

### `MonacoDriver`

Runtime value: `Monaco`.

Do not use `namespace Monaco` for the driver library because `t.Monaco` already owns the external Monaco API type namespace from `t.def.monaco.ts`.

Target:

```ts
export declare namespace MonacoDriver {
  export type Lib = {
    readonly Is: t.EditorIs.Lib;
    readonly Bus: t.EditorBus.Lib;
    readonly Editor: React.FC<t.MonacoEditorProps>;
    readonly Crdt: t.EditorCrdt.Lib;
    readonly Prompt: t.EditorPrompt.Lib;
    readonly Yaml: t.EditorYaml.Lib;
    readonly Link: Link.Lib;
    readonly Error: t.EditorError.Lib;
  };

  export type Ctx = { readonly editor: t.Monaco.Editor; readonly monaco: t.Monaco.Monaco };
  export type Cursor = { ... };

  export namespace Link { ... }
}
```

Mapping:

- `t.MonacoLib` → `t.MonacoDriver.Lib`
- `t.MonacoCtx` → `t.MonacoDriver.Ctx`
- `t.EditorCursor` → `t.MonacoDriver.Cursor`
- `t.EditorLinkLib` → `t.MonacoDriver.Link.Lib`
- `t.EditorLinkBounds` → `t.MonacoDriver.Link.Bounds`

### `EditorCrdt`

Runtime value: `EditorCrdt`.

Target:

```ts
export declare namespace EditorCrdt {
  export type Lib = {
    readonly bind: Bind;
    readonly useBinding: UseBinding;
    readonly Link: Link.Lib;
  };

  export type Bind = ...;
  export type Binding = ...;
  export type UseBinding = ...;
  export namespace Binding { ... }
  export namespace Link { ... }
}
```

Mapping:

- `t.EditorCrdtLib` → `t.EditorCrdt.Lib`
- `t.EditorCrdtBind` → `t.EditorCrdt.Bind`
- `t.EditorCrdtBinding` → `t.EditorCrdt.Binding`
- `t.UseEditorCrdtBinding` → `t.EditorCrdt.UseBinding`
- `t.EditorCrdtBindingReadyHandler` → `t.EditorCrdt.Binding.ReadyHandler`
- `t.EditorCrdtBindingReady` → `t.EditorCrdt.Binding.Ready`
- `t.UseEditorCrdtBindingArgs` → `t.EditorCrdt.Binding.Args`
- `t.EditorCrdtBindingHook` → `t.EditorCrdt.Binding.Hook`
- `t.EditorCrdtLinkLib` → `t.EditorCrdt.Link.Lib`
- `t.EditorCrdtRegisterLink` → `t.EditorCrdt.Link.Register`
- `t.EditorCrdtRegisterLinkOptions` → `t.EditorCrdt.Link.RegisterOptions`
- `t.EditorCrdtLinkClickHandler` → `t.EditorCrdt.Link.ClickHandler`
- `t.EditorCrdtLinkClick` → `t.EditorCrdt.Link.Click`
- `t.EditorCrdtLinkCreateDoc` → `t.EditorCrdt.Link.CreateDoc`
- `t.EditorCrdtLinkCreateResult` → `t.EditorCrdt.Link.CreateResult`
- `t.EditorCrdtLinkEnable` → `t.EditorCrdt.Link.Enable`
- `t.EditorCrdtLinkEnableOptions` → `t.EditorCrdt.Link.EnableOptions`

### `EditorFolding`

Runtime value: `EditorFolding`.

Target:

```ts
export declare namespace EditorFolding {
  export type Lib = { ... };
  export type Offset = { start: number; end: number };
  export type Observer = t.Lifecycle & { ... };
  export type UseFoldMarks = ...;
  export type BindFoldMarks = ...;
  export namespace Binding { ... }
}
```

Mapping:

- `t.EditorFoldingLib` → `t.EditorFolding.Lib`
- `t.EditorFoldingAreaObserver` → `t.EditorFolding.Observer`
- `t.FoldOffset` → `t.EditorFolding.Offset`
- `t.UseFoldMarks` → `t.EditorFolding.UseFoldMarks`
- `t.UseFoldMarksArgs` → `t.EditorFolding.UseFoldMarksArgs`
- `t.BindFoldMarks` → `t.EditorFolding.BindFoldMarks`
- `t.BindFoldMarksArgs` → `t.EditorFolding.BindFoldMarksArgs`
- `t.EditorFoldBinding` → `t.EditorFolding.Binding.Instance`

### `EditorYaml`

Runtime value: `EditorYaml`.

Target:

```ts
export declare namespace EditorYaml {
  export type Lib = {
    readonly Path: Path.Lib;
    readonly Editor: React.FC<t.YamlEditorProps>;
    readonly Error: Error.Lib;
    useYaml: Hook.Use;
    useYamlErrorMarkers: Hook.UseErrorMarkers;
  };

  export type State = { ... };
  export namespace Error { ... }
  export namespace Path { ... }
  export namespace Hook { ... }
}
```

Mapping:

- `t.EditorYamlLib` → `t.EditorYaml.Lib`
- `t.EditorYaml` → `t.EditorYaml.State`
- `t.EditorYamlErrorLib` → `t.EditorYaml.Error.Lib`
- `t.YamlErrorToMarker` → `t.EditorYaml.Error.ToMarker`
- `t.YamlErrorsToMarkers` → `t.EditorYaml.Error.ToMarkers`
- `t.EditorYamlPathLib` → `t.EditorYaml.Path.Lib`
- `t.EditorYamlCursorPathObserver` → `t.EditorYaml.Path.Observer`
- `t.UseEditorYaml` → `t.EditorYaml.Hook.Use`
- `t.UseEditorYamlArgs` → `t.EditorYaml.Hook.Args`
- `t.EditorYamlHook` → `t.EditorYaml.Hook.Result`
- `t.UseYamlErrorMarkers` → `t.EditorYaml.Hook.UseErrorMarkers`
- `t.UseYamlErrorMarkersArgs` → `t.EditorYaml.Hook.UseErrorMarkersArgs`

## Type-factor strategy

Do not create duplicate exported namespaces across multiple factor files.

For factor files such as `t.Editor.ts`, `t.link.ts`, or `t.event-defs.ts`:

- keep them type-plane only;
- export local flat helper names with short local nouns when useful (`Create`, `Shape`, `Options`, `Binding`, etc.);
- have the root `t.ts` import them with PascalCase type namespace aliases (`import type * as TEditor from './t.Editor.ts'`);
- curate the public namespace in the root `t.ts`;
- remove `export type * from './t.*.ts'` from root type spines when it would leak old flat names.

This follows the type-factor rule from canon: factor files stay flat and the public root `t.ts` curates the namespace surface.

## Files expected to change

### Public/root type spines and owned factor files

- `code/sys.driver/driver-monaco/src/-fake/t.ts`
  - create `MonacoFake.Lib` and curate fake editor/model/global/spy sub-namespaces.
- `code/sys.driver/driver-monaco/src/-fake/t.Editor.ts`
  - convert fake editor detail exports to local factor names used by `MonacoFake.Editor.*`.
- `code/sys.driver/driver-monaco/src/-fake/t.Model.ts`
  - convert fake model detail exports to local factor names used by `MonacoFake.Model.*`.
- `code/sys.driver/driver-monaco/src/-fake/t.Monaco.ts`
  - convert fake global detail exports to local factor names used by `MonacoFake.Global.*`.
- `code/sys.driver/driver-monaco/src/-fake/t.Spy.ts`
  - convert spy detail exports to local factor names used by `MonacoFake.Spy.*`.
- `code/sys.driver/driver-monaco/src/m.Is/t.ts`
  - create `EditorIs.Lib`.
- `code/sys.driver/driver-monaco/src/m.Error/t.ts`
  - create `EditorError.Lib` and `EditorError.Diagnostic.*`.
- `code/sys.driver/driver-monaco/src/m.Event/t.ts`
  - create `EditorBus.Lib`, `EditorBus.Subject`, `EditorBus.Observable`, and `EditorBus.FilterLib`; curate `EditorEvent.*` from event definitions.
- `code/sys.driver/driver-monaco/src/m.Event/t.event-defs.ts`
  - convert event detail exports to local factor names used by `EditorEvent.*`.
- `code/sys.driver/driver-monaco/src/m.Monaco/t.ts`
  - create `MonacoDriver.Lib`, `MonacoDriver.Ctx`, `MonacoDriver.Cursor`, and `MonacoDriver.Link.*`.
- `code/sys.driver/driver-monaco/src/m.Monaco/t.Link.ts`
  - convert link detail exports to local factor names used by `MonacoDriver.Link.*`.
- `code/sys.driver/driver-monaco/src/t.def.monaco.ts`
  - update the external Monaco type alias `Monaco.Cursor` to point at `t.MonacoDriver.Cursor`.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/t.ts`
  - create `EditorCrdt.Lib` and curate CRDT binding/link sub-surfaces.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/t.bind.ts`
  - convert binding detail exports to local factor names used by `EditorCrdt.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/t.link.ts`
  - convert link detail exports to local factor names used by `EditorCrdt.Link.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/t.ts`
  - create `EditorFolding.Lib`, `EditorFolding.Offset`, `EditorFolding.Observer`, and binding type aliases.
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/t.bind.ts`
  - convert folding binding detail exports to local factor names used by `EditorFolding.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.ts`
  - create `EditorYaml.Lib`, `EditorYaml.State`, and curate YAML error/path/hook sub-surfaces.
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.Error.ts`
  - convert YAML error detail exports to local factor names used by `EditorYaml.Error.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.Path.ts`
  - convert YAML path observer detail exports to local factor names used by `EditorYaml.Path.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/t.use.ts`
  - convert YAML hook detail exports to local factor names used by `EditorYaml.Hook.*`.
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Error/t.Use.ErrorMarkers.ts`
  - migrate diagnostic reference to `t.EditorError.Diagnostic.Shape` while leaving the marker hook surface otherwise unchanged.

### Runtime, tests, samples, and UI consumers expected to change

Each file below is expected to change only to migrate `t.<legacy-flat-name>` references to the target namespace shape.

- `code/sys.driver/driver-monaco/src/-fake/mod.ts`
- `code/sys.driver/driver-monaco/src/-fake/m.Fake.editor.ts`
- `code/sys.driver/driver-monaco/src/-fake/m.Fake.model.ts`
- `code/sys.driver/driver-monaco/src/-fake/m.Fake.monaco.ts`
- `code/sys.driver/driver-monaco/src/-fake/m.Spy.ts`
- `code/sys.driver/driver-monaco/src/-fake/u.ts`
- `code/sys.driver/driver-monaco/src/-fake/u.as.ts`
- `code/sys.driver/driver-monaco/src/-fake/u.spy.ts`
- `code/sys.driver/driver-monaco/src/-fake/-test/-m.Fake.model.test.ts`
- `code/sys.driver/driver-monaco/src/-fake/-test/-m.Fake.monaco.test.ts`
- `code/sys.driver/driver-monaco/src/-sample/t.ts`
- `code/sys.driver/driver-monaco/src/-sample/ui.tsx`
- `code/sys.driver/driver-monaco/src/common/constants.ts`
- `code/sys.driver/driver-monaco/src/m.Is/m.Is.ts`
- `code/sys.driver/driver-monaco/src/m.Is/-.test.ts`
- `code/sys.driver/driver-monaco/src/m.Error/m.Error.ts`
- `code/sys.driver/driver-monaco/src/m.Error/u.markers.ts`
- `code/sys.driver/driver-monaco/src/m.Error/-.test.ts`
- `code/sys.driver/driver-monaco/src/m.Event/m.Bus.ts`
- `code/sys.driver/driver-monaco/src/m.Event/u.emit.ts`
- `code/sys.driver/driver-monaco/src/m.Event/u.ping.ts`
- `code/sys.driver/driver-monaco/src/m.Event/use.Bus.ts`
- `code/sys.driver/driver-monaco/src/m.Event/-test/-Bus.test.ts`
- `code/sys.driver/driver-monaco/src/m.Monaco/m.Monaco.ts`
- `code/sys.driver/driver-monaco/src/m.Monaco/m.Link.ts`
- `code/sys.driver/driver-monaco/src/m.Monaco/-test/-Link.test.ts`
- `code/sys.driver/driver-monaco/src/ui/-dev/ui.YamlObjectView.tsx`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/m.Crdt.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/m.Link.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/u.bind.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/u.Link.create.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/u.Link.enable.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/u.Link.register.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/use.CrdtBinding.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/use.CrdtBinding.ready.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/-test/-.test.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/-spec/-SPEC.Debug.tsx`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Error/use.ErrorMarkers.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/m.Folding.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/u.bind.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/u.bind.impl.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/u.bind.impl.u.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/u.observe.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/u.trigger.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/use.FoldMarks.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/-test/-.test.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/m.Error.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/m.Path.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/m.Yaml.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/u.error.markers.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/u.path.observe.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/u.path.observe.singleton.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/use.Yaml.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/use.YamlErrorMarkers.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/-test/-Yaml.Error.test.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/-test/-Yaml.Path.test.ts`
- `code/sys.driver/driver-monaco/src/ui/m.Yaml/-test/-Yaml.test.ts`
- `code/sys.driver/driver-monaco/src/ui/ui.YamlEditor/t.ts`
- `code/sys.driver/driver-monaco/src/ui/ui.YamlEditor/use.Signals.ts`
- `code/sys.driver/driver-monaco/src/ui/ui.YamlEditor/use.YamlController.ts`
- `code/sys.driver/driver-monaco/src/ui/ui.YamlEditor/-spec/-SPEC.Debug.tsx`

### Files not expected to change

- `code/sys.driver/driver-monaco/src/types.ts`
  - existing package type barrel should keep exporting the same root module `t.ts` files; the namespace changes live behind those existing module exports.
- `code/sys.driver/driver-monaco/src/common/t.ts`
  - already re-exports `../types.ts` as the local type pool.
- runtime `mod.ts` files
  - runtime exports stay unchanged unless a type-only import reference forces a local edit.

## Legacy alias disposition

Do not add compatibility aliases.

Current caller evidence shows the legacy flat names are consumed inside `@sys/driver-monaco` source, tests, specs, samples, and dev helpers. Those are in-scope and should be migrated in the same clean refactor.

Alias retention would require a concrete current caller that cannot be migrated in the same pass. No such caller was found in the probe.

If an external package in the workspace is later found to consume the flat names and cannot be migrated in this pass, HOLD and ask whether to widen scope or defer alias removal to a dedicated compatibility pass.

## Import and reference discipline

- Continue using local `import type { t } from './common.ts'` / local `type t` pool at call sites.
- Do not import directly from root `types.ts` or factor `t.*.ts` unless needed inside a root `t.ts` to curate factor-file types.
- Use PascalCase namespace aliases for factor imports inside root `t.ts` files, for example:

```ts
import type * as TEditor from './t.Editor.ts';
```

- Do not use lower-case imported type namespace aliases other than the canonical local `t` lane.

## Verification

Run from the nearest module directory:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-monaco
deno task test --trace-leaks ./src/-fake ./src/m.Is ./src/m.Error ./src/m.Event ./src/m.Monaco ./src/ui/m.Crdt ./src/ui/m.Markers.Folding ./src/ui/m.Yaml
deno task check
```

Final source scans:

```sh
rg -n "FakeMonacoLib|CreateFakeEditor|FakeEditorFull|FakeEditor|CreateFakeTextModel|FakeTextModelOptions|FakeTextModelFull|FakeTextModel|CreateFakeMonaco|FakeMonacoGlobal|SpyLib|SetModelMarkersFn|SetModelMarkersArgs|SetModelMarkersCall|SetModelMarkersSpy|EditorIsLib|EditorErrorLib|DiagnosticSeverityConst|DiagnosticSeverity|EditorDiagnostic|EditorEventBus|EditorEventObservable|EditorBusFilterLib|EditorBusLib|MonacoCtx|MonacoLib|EditorCursor|EditorLinkLib|EditorLinkBounds|EditorCrdtLib|EditorCrdtBind|EditorCrdtBinding|UseEditorCrdtBinding|EditorCrdtLinkLib|EditorFoldingLib|EditorFoldingAreaObserver|UseFoldMarks|BindFoldMarks|EditorYamlLib|EditorYamlErrorLib|EditorYamlPathLib|EditorYamlCursorPathObserver|UseEditorYaml|EditorYamlHook|UseYamlErrorMarkers" /Users/phil/code/org.sys/sys/code/sys.driver/driver-monaco/src
```

Expected scan result:

- no old flat `*Lib` names remain;
- no old flat detail names remain in public type spines;
- any remaining hits are either runtime value names, test titles/docs that explicitly describe the old state, or must be removed before SHIP.

## HOLD conditions

HOLD before implementation or during review if any of these occur:

- a legacy flat type is consumed by a live caller outside `@sys/driver-monaco` and cannot be migrated in the same clean refactor;
- a factor-file namespace plan would require duplicate exported namespace declarations across re-exported modules;
- the change would move runtime values, side effects, or runtime-module imports into `t.ts` / `t.*.ts`;
- a runtime export name would need to change;
- `t.Monaco` external Monaco API types would be conflated with the `MonacoDriver` runtime library contract;
- verification fails for behavior reasons rather than mechanical type-reference migration;
- alias removal becomes contentious and needs a separate compatibility decision.

## Review gates

Reject the implementation if it:

- adds deprecated compatibility aliases without exact current caller proof;
- leaves duplicate public flat names in the package type surface;
- changes runtime behavior of `Monaco`, `MonacoFake`, `EditorIs`, `Bus`, `Error`, `EditorCrdt`, `EditorFolding`, or `EditorYaml`;
- bypasses the local `type t` import lane at call sites;
- widens the public API with speculative convenience names.
