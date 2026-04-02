import { type t } from './common.ts';
import { fromDir } from './u.fromDir.ts';
import { ensureFrontmatterRef, readFrontmatterRef } from './u.frontmatter.ts';

export const SlugTreeFs: t.SlugTreeFs.Lib = {
  fromDir,
  ensureFrontmatterRef,
  readFrontmatterRef,
};
