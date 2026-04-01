import { type t } from './common.ts';
import { ensureFrontmatterRef, readFrontmatterRef } from './u.frontmatter.ts';
import { fromDir } from './u.fromDir.ts';

export { fromDir, ensureFrontmatterRef, readFrontmatterRef };

export const SlugTreeFs: t.SlugTreeFsLib = {
  fromDir,
  ensureFrontmatterRef,
  readFrontmatterRef,
};
