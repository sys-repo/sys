import type { t } from './common.ts';

/** Type re-exports. */
export type * from './m.Transform/t.ts';

/**
 * Universal slug bundle transforms and related pure derivation APIs.
 */
export namespace SlugBundle {
  export type Lib = {
    readonly Transform: t.SlugBundleTransform.Lib;
  };
}
