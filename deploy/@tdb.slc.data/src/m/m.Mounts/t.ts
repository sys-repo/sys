import type { t } from './common.ts';

/**
 * Pure document contract for the staged root mounts index.
 */
export declare namespace Mounts {
  /** Public mounts document surface. */
  export type Lib = {
    readonly schema: t.TSchema;
    readonly validate: (value: unknown) => ValidateResult;
    readonly stringify: (doc: Doc) => string;
  };

  /** One available staged mount. */
  export type Entry = { readonly mount: t.StringId };

  /** Root runtime index of available staged mounts. */
  export type Doc = { readonly mounts: readonly Entry[] };

  /** Result from validating a mounts document. */
  export type ValidateResult = {
    readonly ok: boolean;
    readonly errors: readonly t.ValueError[];
  };
}
