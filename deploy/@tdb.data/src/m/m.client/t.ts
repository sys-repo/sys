import type { t } from './common.ts';

/** Direct client helpers for staged tree/content datasets. */
export declare namespace SlugDataClient {
  /** Public client surface. */
  export type Lib = {
    readonly Mounts: Mounts.Lib;
    readonly create: (args: CreateArgs) => Client;
    readonly fromDataset: (args: DatasetArgs) => Client;
    readonly refsFromTree: (tree: t.SlugTreeItems, total?: number) => string[];
    readonly findHash: (
      entries: readonly t.SlugFileContentEntry[],
      ref: string,
    ) => string | undefined;
    readonly selectOrFirst: (
      selected: string | undefined,
      refs: readonly string[],
    ) => string | undefined;
  };

  /** Directory layout used by the staged slug runtime client. */
  export type Layout = Pick<t.SlugClientLayout, 'manifestsDir' | 'contentDir'>;

  /** Arguments for constructing a client from a direct staged base URL. */
  export type CreateArgs = {
    readonly baseUrl: t.StringUrl;
    readonly docid: t.StringId;
    readonly layout?: Layout;
  };

  /** Arguments for constructing a client from an origin + dataset pair. */
  export type DatasetArgs = {
    readonly origin: t.StringUrl;
    readonly dataset: t.StringId;
    readonly docid?: t.StringId;
    readonly layout?: Layout;
  };

  /** Optional tree-content selection input. */
  export type TreeContentArgs = {
    readonly ref?: string;
  };

  /** Combined tree, refs, and optional file-content payload. */
  export type TreeContentValue = {
    readonly tree: t.SlugTreeDoc;
    readonly refs: readonly string[];
    readonly ref?: string;
    readonly hash?: string;
    readonly contentIndex?: t.SlugFileContentIndex;
    readonly content?: t.SlugFileContentDoc;
  };

  /** Stateful client for one staged slug dataset. */
  export type Client = {
    readonly baseUrl: t.StringUrl;
    readonly docid: t.StringId;
    readonly layout: Layout;
    readonly Tree: {
      readonly load: () => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
    };
    readonly FileContent: {
      readonly index: () => Promise<t.SlugClientResult<t.SlugFileContentIndex>>;
      readonly get: (hash: string) => Promise<t.SlugClientResult<t.SlugFileContentDoc>>;
    };
    readonly Timeline: {
      readonly Playback: {
        readonly load: () => Promise<t.SlugClientResult<t.SlugPlaybackManifest>>;
      };
    };
    readonly TreeContent: {
      readonly load: (
        args?: TreeContentArgs,
      ) => Promise<t.SlugClientResult<TreeContentValue>>;
    };
  };

  /** Root mount discovery helpers. */
  export namespace Mounts {
    /** Public mounts client surface. */
    export type Lib = {
      readonly load: Load;
    };

    /** Load the runtime mount index from one staged root origin. */
    export type Load = (origin: t.StringUrl) => Promise<t.SlugClientResult<t.SlugMounts.Doc>>;
  }
}
