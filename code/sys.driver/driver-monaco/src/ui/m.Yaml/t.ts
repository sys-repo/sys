import type { t } from './common.ts';
import type * as TError from './t.Error.ts';
import type * as TPath from './t.Path.ts';
import type * as THook from './t.use.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export declare namespace EditorYaml {
  /** Runtime library surface. */
  export type Lib = {
    readonly Path: Path.Lib;
    readonly Editor: React.FC<t.YamlEditorProps>;
    readonly Error: Error.Lib;
    useYaml: Hook.Use;
    useYamlErrorMarkers: Hook.UseErrorMarkers;
  };

  /** Canonical representation of YAML state for an active editor document. */
  export type State = {
    /** Monotonic revision counter. */
    readonly rev: number;
    /** The parsed data. */
    readonly data: t.YamlSyncParsed;
    /** The current cursor location within the document. */
    readonly cursor: t.MonacoDriver.Cursor;
  };

  /** YAML error helper contracts. */
  export namespace Error {
    export type Lib = TError.Lib;
    export type ToMarker = TError.ToMarker;
    export type ToMarkers = TError.ToMarkers;
  }

  /** YAML cursor-path observer contracts. */
  export namespace Path {
    export type Lib = TPath.Lib;
    export type Observer = TPath.Observer;
  }

  /** YAML hook contracts. */
  export namespace Hook {
    export type Use = THook.Use;
    export type Args = THook.Args;
    export type Result = THook.Result;
    export type UseErrorMarkers = THook.UseErrorMarkers;
    export type UseErrorMarkersArgs = THook.UseErrorMarkersArgs;
  }
}
