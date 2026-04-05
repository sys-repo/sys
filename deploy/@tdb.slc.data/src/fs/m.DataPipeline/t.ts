import type { t } from './common.ts';

/**
 * Filesystem-backed SLC data pipeline operations.
 *
 * Use this namespace for local source-folder workflows that generate
 * staged SLC data outputs.
 */
export declare namespace SlcDataPipeline {
  /** Public fs pipeline surface. */
  export type Lib = {
    readonly stageFolder: StageFolder.Run;
  };

  /** Types for the staged root mount index document. */
  export namespace Mounts {
    /** One available staged mount. */
    export type Entry = { readonly mount: t.StringId };

    /** Root runtime index of available staged mounts. */
    export type Doc = { readonly mounts: readonly Entry[] };
  }

  /** Types for the stageFolder operation. */
  export namespace StageFolder {
    /** Stage one source folder into a target data directory. */
    export type Run = (args: Args) => Promise<Result>;

    /** Input paths for a folder staging run. */
    export type Args = {
      readonly source: t.StringPath;
      readonly target: t.StringPath;
      readonly mount?: t.StringId;
    };

    /** Successful result from a folder staging run. */
    export type Result = {
      readonly kind: 'stage-folder';
      readonly ok: true;
      readonly mount: t.StringId;
      readonly source: t.StringPath;
      readonly target: t.StringPath;
    };
  }
}
