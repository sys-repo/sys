import type { t } from './common.ts';

/** Shared fields for bundle descriptor variants. */
export type BundleDescriptorBase = {
  readonly version: number;
  readonly docid: t.StringId;
  readonly basePath?: t.StringPath;
};
