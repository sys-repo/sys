import type { t } from './common.ts';

/**
 * Wrapper-owned Pi extensions.
 */
export declare namespace PiExtension {
  /** Runtime surface for wrapper-owned Pi extensions. */
  export type Lib = {
    /** Sandbox filesystem extension helpers. */
    readonly SandboxFs: t.PiSandboxFsExtension.Lib;
  };
}
