import type { t } from './common.ts';

export declare namespace SlugTreeFs {
  export type Lib = {
    readonly fromDir: FromDir;
    readonly ensureFrontmatterRef: EnsureFrontmatterRef;
    readonly readFrontmatterRef: ReadFrontmatterRef;
    readonly normalizeCrdtRef: NormalizeCrdtRef;
  };

  export type FromDir = (
    args: {
      root: t.StringDir;
      createCrdt?: () => Promise<t.StringRef | t.Nothing>;
    },
    opts?: FromDirOptions,
  ) => Promise<t.SlugTreeDoc>;

  export type FromDirOptions = {
    ignore?: string[];
    sort?: boolean;
    readmeAsIndex?: boolean;
  };

  export type EnsureFrontmatterRef = (args: {
    text: string;
    createCrdt: () => Promise<t.StringRef>;
  }) => Promise<{
    readonly ref: t.StringRef;
    readonly updated: boolean;
    readonly text: string;
  }>;

  export type ReadFrontmatterRef = (text: string) => t.StringRef | undefined;
  export type NormalizeCrdtRef = (input: string) => t.StringRef;
}
