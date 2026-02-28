import { type t } from './common.ts';
import { resolveDocid, normalizeManifestTargets } from './u.docid.ts';
import { deriveAssetsPath } from './u.path.ts';
import { derive } from './u.policy.file-content.ts';

export const SlugBundleTransformTreeFs: t.SlugBundleTransform.TreeFs.Lib = {
  derive,
  normalizeManifestTargets,
  resolveDocid,
  deriveAssetsPath,
};
