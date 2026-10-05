import type { t } from './common.ts';
import type * as TEditor from './t.Editor.ts';
import type * as TGlobal from './t.Monaco.ts';
import type * as TModel from './t.Model.ts';
import type * as TSpy from './t.Spy.ts';

type StringSourceCode = string;

/**
 * Minimal Monaco-editor test fakes.
 */
export declare namespace MonacoFake {
  /** Runtime library surface. */
  export type Lib = {
    readonly Spy: Spy.Lib;

    monaco: Global.Create;
    model: Model.Create;
    editor: Editor.Create;

    /** Create a fake Monaco/editor context. */
    ctx(model?: Model.Shape | StringSourceCode, monaco?: Global.Shape): t.MonacoDriver.Ctx;

    /** Cast a fake Monaco global to the driver-facing Monaco API shape. */
    asMonaco(fake: Global.Shape | t.Monaco.Monaco): t.Monaco.Monaco;

    /** Cast a fake editor to the driver-facing editor shape. */
    asEditor(fake: Editor.Shape | t.Monaco.Editor): t.Monaco.Editor;

    /** Cast a fake text model to the driver-facing text-model shape. */
    asModel(fake: Model.Shape | t.Monaco.TextModel): t.Monaco.TextModel;
  };

  /** Fake editor contracts. */
  export namespace Editor {
    export type Create = TEditor.Create;
    export type Full = TEditor.Full;
    export type Shape = TEditor.Shape;
  }

  /** Fake text-model contracts. */
  export namespace Model {
    export type Create = TModel.Create;
    export type Options = TModel.Options;
    export type Full = TModel.Full;
    export type Shape = TModel.Shape;
  }

  /** Fake Monaco global contracts. */
  export namespace Global {
    export type Create = TGlobal.Create;
    export type Shape = TGlobal.Shape;
  }

  /** Spy helpers for fake Monaco globals. */
  export namespace Spy {
    export type Lib = TSpy.Lib;

    /** `setModelMarkers` spy contracts. */
    export namespace SetModelMarkers {
      export type Fn = TSpy.MarkerSetter;
      export type Args = TSpy.MarkerSetterArgs;
      export type Call = TSpy.MarkerSetCall;
      export type Handle = TSpy.Handle;
    }
  }
}
