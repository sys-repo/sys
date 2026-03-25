import type { t } from './common.ts';

/**
 * Test helpers for workspace structure.
 */
export declare namespace WorkspaceTesting {
  export type Lib = t.Workspace.Lib & { readonly Test: TestingLib };
  export type TestingLib = {};
}
