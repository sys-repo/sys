import type { t } from './common.ts';

/** Helpers for slug URL and filename derivation. */
export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly treeAssetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
  readonly treeFilename: (docid: t.StringId) => string;
  readonly fileContentFilename: (hash: string) => string;
};
