import type { FileMapBundleResult, t, Tmpl } from './common.ts';

/**
 * Cell template types.
 */
export declare namespace CellTmpl {
  /** Available Cell template names. Add new names here as templates are introduced. */
  export type Name = 'default';

  /** Runtime surface for Cell templates. */
  export type Lib = {
    /** Available Cell template names. */
    readonly names: readonly Name[];
    /** Create a template writer for the selected Cell template. */
    make(name?: Name): Tmpl.Tmpl;
    /** Read a text file from the embedded template bundle. */
    text(name: Name, path: t.StringPath): Promise<string>;
    /** Rebuild the embedded template bundle from source files. */
    bundle(): Promise<FileMapBundleResult>;
  };
}
