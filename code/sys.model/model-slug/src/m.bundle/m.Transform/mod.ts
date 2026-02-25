/**
 * @module
 * Bundle.Transform
 * Behavior-locked slug manifest derivation transforms for runtime-agnostic use.
 */
import type { t } from './common.ts';
import { deriveBundle } from './u.policy.derive.ts';

const derive: t.SlugBundleTransform.Lib['derive'] = deriveBundle;

export const SlugBundleTransform: t.SlugBundleTransform.Lib = {
  derive,
};
