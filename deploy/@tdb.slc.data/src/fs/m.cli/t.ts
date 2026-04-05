import type { t } from './common.ts';

/**
 * YAML-backed staging CLI helpers for filesystem workflows.
 */
export declare namespace SlcDataCli {
  /** Public staging CLI surface. */
  export type Lib = {
    readonly menu: Menu.Run;
  };

  /** YAML-backed staging profile document. */
  export namespace StageProfile {
    /** One staged data mount and its source folder. */
    export type Doc = {
      readonly mount: t.StringId;
      readonly source: t.StringPath;
    };
  }

  /** Interactive staging menu. */
  export namespace Menu {
    /** Run the staging menu from a working directory. */
    export type Run = (cwd: t.StringDir) => Promise<Result>;

    /** Result from a staging menu session. */
    export type Result =
      | { readonly kind: 'exit' }
      | { readonly kind: 'back' }
      | { readonly kind: 'staged'; readonly path: t.StringDir };
  }
}
