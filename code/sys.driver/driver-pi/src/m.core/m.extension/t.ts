import type { t } from './common.ts';

/**
 * Wrapper-owned Pi extensions.
 */
export declare namespace PiExtension {
  /**
   * Runtime surface for wrapper-owned Pi extensions.
   */
  export type Lib = {
    /** OCR extension helpers. */
    readonly Ocr: t.PiOcrExtension.Lib;
    /** Sandbox extension helpers. */
    readonly Sandbox: Sandbox.Lib;
    /** Bounded read-only ZIP extension helpers. */
    readonly Zip: t.PiZipExtension.Lib;
  };

  /**
   * Sandbox extension helpers.
   */
  export namespace Sandbox {
    /**
     * Runtime surface for sandbox-owned extensions.
     */
    export type Lib = t.PiSandboxExtension.Lib;
  }
}
