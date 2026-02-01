import type { t } from './common.ts';

export type BundleDescriptorBase = {
  readonly version: number;
  readonly docid: t.StringId;
  readonly basePath?: t.StringPath;
};
