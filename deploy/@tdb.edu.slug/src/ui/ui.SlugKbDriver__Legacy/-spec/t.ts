/**
 * Dev/Spec (Internal Types).
 */
import type { t } from './common.ts';

/** Type re-exports. */
export type * from '../../../common/t.ts';
export type * from './-SPEC.Debug.tsx';

export type TreeContentParams = {
  basePath: string;
  docid: string;
  manifestsDir: string;
  contentDir: string;
};
export type FileContentData = {
  docid: string;
  ref: string;
  hash: string;
  tree: t.SlugTreeDoc;
  content: t.SlugFileContentDoc;
  contentIndex: t.SlugFileContentIndex;
};
