import type { t } from './common.ts';

/**
 * YAML-backed staging CLI helpers for filesystem workflows.
 */
export declare namespace SlcDataCli {
  /** Public staging CLI surface. */
  export type Lib = {
    readonly menu: Menu.Run;
  };

  /** Interactive staging menu. */
  export namespace Menu {
    /** Run the staging menu from a working directory. */
    export type Run = (cwd: t.StringDir) => Promise<Result>;

    /** Result from a staging menu session. */
    export type Result =
      | { readonly kind: 'exit' }
      | { readonly kind: 'back' }
      | { readonly kind: 'staged'; readonly path: t.StringFile };
  }
}
