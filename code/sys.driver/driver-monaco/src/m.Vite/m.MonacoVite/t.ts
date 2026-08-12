export type NoticeFile = 'LICENSE' | 'ThirdPartyNotices.txt';

export type Source = {
  readonly packageRoot: string;
  readonly runtimeDir: string;
  readonly version: string;
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
