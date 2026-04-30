import type { t, Tmpl } from './common.ts';

/**
 * Cell template types.
 */
export declare namespace CellTmpl {
  /** Available Cell template names. Add new names here as templates are introduced. */
  export type Name = 'default';

  /** Runtime-safe template materialization types. */
  export namespace Write {
    /** Options for writing an embedded Cell template. */
    export type Options = { readonly dryRun?: boolean };

    /** File write operation emitted while materializing a Cell template. */
    export type Op = t.FileMapOp;

    /** Result from writing an embedded Cell template. */
    export type Result = {
      readonly target: string;
      readonly dryRun: boolean;
      readonly ops: readonly Op[];
      readonly total: t.FileMapWriteResult['total'];
    };
  }

  /** Runtime surface for Cell templates. */
  export type Lib = {
    /** Available Cell template names. */
    readonly names: readonly Name[];
    /** Create a template writer for the selected Cell template. */
    make(name?: Name): Tmpl.Tmpl;
    /** Read a text file from the embedded template bundle. */
    text(name: Name, path: t.StringPath): Promise<string>;
    /** Rebuild the embedded template bundle from source files. */
    bundle(): Promise<t.FileMapBundleResult>;
  };
}
