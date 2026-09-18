export type NoticeFile = 'LICENSE' | 'ThirdPartyNotices.txt';

export type SourceLocation = {
  /** Resolved root of the pinned Monaco package. */
  readonly packageRoot: string;
  /** Resolved root of Monaco's development runtime assets. */
  readonly runtimeDir: string;
  /** Pinned Monaco package version. */
  readonly version: string;
};

export type Source = SourceLocation & {
  readonly bytes: number;
  readonly hash: {
    readonly digest: string;
    readonly parts: HashParts;
  };
  readonly notices: Readonly<Record<NoticeFile, Uint8Array>>;
};

export type GetSource = () => Promise<Source>;

export type TreeStats = {
  readonly bytes: number;
  readonly files: number;
};

export type HashParts = Readonly<Record<string, string>>;
