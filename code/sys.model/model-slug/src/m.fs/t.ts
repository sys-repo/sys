import type { t } from '../common.ts';

export type SlugTreeFsLib = {
  readonly fromDir: SlugTreeFsFromDir;
  readonly ensureFrontmatterRef: SlugTreeFsEnsureFrontmatterRef;
  readonly readFrontmatterRef: SlugTreeFsReadFrontmatterRef;
};

export type SlugTreeFsFromDir = (
  args: {
    root: t.StringDir;
    createCrdt?: () => Promise<t.StringRef | t.Nothing>;
  },
  opts?: SlugTreeFsFromDirOpts,
) => Promise<t.SlugTreeDoc>;

export type SlugTreeFsFromDirOpts = {
  ignore?: string[];
  sort?: boolean;
  readmeAsIndex?: boolean;
};

export type SlugTreeFsEnsureFrontmatterRef = (args: {
  text: string;
  createCrdt: () => Promise<t.StringRef>;
}) => Promise<{
  readonly ref: t.StringRef;
  readonly updated: boolean;
  readonly text: string;
}>;

export type SlugTreeFsReadFrontmatterRef = (text: string) => t.StringRef | undefined;
