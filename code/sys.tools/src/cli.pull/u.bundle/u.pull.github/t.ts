import { type t } from '../../common.ts';

/**
 * GitHub bundle-pull contracts.
 */
export declare namespace GithubPull {
  export type PlanKind = 'github:release' | 'github:repo';

  export type Plan = {
    readonly kind: PlanKind;
    readonly targetRoot: t.StringDir;
    readonly entries: readonly Entry[];
  };

  export type Entry = {
    readonly source: t.StringUrl;
    readonly relativePath: t.StringRelativePath;
    readonly size?: number;
    readonly request: DownloadRequest;
  };

  export type DownloadRequest = ReleaseAssetRequest | RepoBlobRequest;

  export type ReleaseAssetRequest = {
    readonly kind: 'release-asset';
    readonly repo: string;
    readonly assetId: number;
    readonly fallbackUrl: t.StringUrl;
  };

  export type RepoBlobRequest = {
    readonly kind: 'repo-blob';
    readonly repo: string;
    readonly ref: string;
    readonly sha: string;
    readonly path: t.StringPath;
    readonly url: t.StringUrl;
  };

  export type Downloader = (
    request: DownloadRequest,
  ) => Promise<Uint8Array>;

  export type ExecuteEvents = {
    readonly clearing?: (targetRoot: t.StringDir) => void;
    readonly entry?: (e: {
      readonly entry: Entry;
      readonly current: number;
      readonly total: number;
    }) => void;
  };

  /** Result from executing a GitHub pull plan. */
  export type ExecuteResult =
    | {
      readonly ok: true;
      readonly ops: readonly t.PullTool.Bundle.RecordSuccess[];
    }
    | {
      readonly ok: false;
      readonly ops: readonly t.PullTool.Bundle.Record[];
      readonly error: string;
    };

  export type ReleasePlanResult =
    | {
      readonly ok: true;
      readonly plan: Plan;
      readonly releaseDir: string;
    }
    | { readonly ok: false; readonly error: string };

  export type RepoPlanResult =
    | {
      readonly ok: true;
      readonly plan: Plan;
    }
    | { readonly ok: false; readonly error: string };
}
