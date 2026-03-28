import type { t } from './common.ts';

/**
 * Test helpers for workspace structure.
 */
export declare namespace WorkspaceTesting {
  /** Workspace runtime surface extended with testing helpers. */
  export type Lib = t.Workspace.Lib & {
    /** Canonical workspace verification helpers. */
    readonly Test: Test.Lib;
  };

  /**
   * Script-level verification helpers for a materialized workspace root.
   */
  export namespace Test {
    /** Canonical workspace script verification helpers. */
    export type Lib = {
      scripts(cwd?: t.StringDir): Promise<void>;
    };
  }
}
