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
    readonly stageSlugDataset: StageSlugDataset.Run;
    readonly refreshRoot: RefreshRoot.Run;
  };

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

  /** Types for staging one slug dataset into one staged root. */
  export namespace StageSlugDataset {
    export type Progress = {
      readonly stage: 'mount' | 'doc';
      readonly current: number;
      readonly total: number;
      readonly mount: t.StringId;
      readonly docid?: t.StringId;
    };

    export type Run = (args: Args) => Promise<Result>;

    export type Args = {
      readonly source: t.StringDir;
      readonly root: t.StringDir;
      readonly mounts?: readonly t.StringId[];
      readonly progress?: (info: Progress) => void;
    };

    export type Result = {
      readonly kind: 'stage-slug-dataset';
      readonly ok: true;
      readonly source: t.StringDir;
      readonly root: t.StringDir;
      readonly mounts: readonly t.StringId[];
      readonly dirs: readonly t.StringDir[];
      readonly mountsPath: t.StringFile;
      readonly distPath: t.StringFile;
    };
  }

  /** Types for refreshing staged-root metadata. */
  export namespace RefreshRoot {
    /** Refresh root metadata from current staged filesystem state. */
    export type Run = (args: Args) => Promise<Result>;

    /** Input path for a root metadata refresh. */
    export type Args = {
      readonly root: t.StringDir;
    };

    /** Successful result from refreshing root metadata. */
    export type Result = {
      readonly kind: 'refresh-root';
      readonly ok: true;
      readonly root: t.StringDir;
      readonly mountsPath: t.StringFile;
      readonly distPath: t.StringFile;
    };
  }
}
