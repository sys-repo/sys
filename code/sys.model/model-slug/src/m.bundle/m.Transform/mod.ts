/**
 * @module
 * Bundle.Transform
 * Behavior-locked slug manifest derivation transforms for runtime-agnostic use.
 */
import type { t } from './common.ts';

const derive: t.SlugBundleTransform.Lib['derive'] = async (_args) => {
  return {
    ok: false,
    error: new Error('SlugBundle.Transform.derive not implemented'),
  };
};

export const SlugBundleTransform: t.SlugBundleTransform.Lib = {
  derive,
};
