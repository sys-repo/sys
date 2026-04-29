import { type t } from '../../common.ts';

export declare namespace GithubPull {
  export type Plan = {
    readonly kind: 'github:release';
    readonly targetRoot: t.StringDir;
    readonly entries: readonly Entry[];
  };

  export type Entry = {
    readonly source: t.StringUrl;
    readonly relativePath: t.StringRelativePath;
    readonly request: DownloadRequest;
  };

  export type DownloadRequest = ReleaseAssetRequest;

  export type ReleaseAssetRequest = {
    readonly kind: 'release-asset';
    readonly repo: string;
    readonly assetId: number;
    readonly fallbackUrl: t.StringUrl;
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

  export type ExecuteResult =
    | {
      readonly ok: true;
      readonly ops: readonly t.PullToolBundleResult['ops'][number][];
    }
    | {
      readonly ok: false;
      readonly ops: readonly t.PullToolBundleResult['ops'][number][];
      readonly error: string;
    };

  export type ReleasePlanResult =
    | {
      readonly ok: true;
      readonly plan: Plan;
      readonly releaseDir: string;
    }
    | { readonly ok: false; readonly error: string };
}
