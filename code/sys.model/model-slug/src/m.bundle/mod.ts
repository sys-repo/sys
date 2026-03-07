/**
 * @module
 * Bundle
 * Universal slug bundle transforms and related pure derivation APIs.
 */
import type { t } from './common.ts';
import { SlugBundleTransform as Transform } from './m.Transform/mod.ts';

export const SlugBundle: t.SlugBundle.Lib = {
  Transform,
};
