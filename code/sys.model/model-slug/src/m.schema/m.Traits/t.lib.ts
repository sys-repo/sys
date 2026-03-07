import type { t } from './common.ts';

/**
 * Helpers for interpreting slug traits and trait-gated options.
 */
export type SlugTraitsSchemaLib = {
  /**
   * Resolve a trait-gated `as` key from a slug's traits and gate options.
   */
  readonly gateAs: (args: {
    readonly traits: readonly t.SlugTrait[];
    readonly opt?: t.SlugTraitGateOptions | null;
  }) => SlugTraitGateAsResult;
};

/**
 * Result of interpreting a trait gate against a slug's declared traits.
 */
export type SlugTraitGateAsResult =
  | { readonly ok: true; readonly enabled: false } // opt === null
  | { readonly ok: true; readonly enabled: false; readonly requested: false } // opt === undefined
  | { readonly ok: true; readonly enabled: true; readonly as: string } // gated + resolved
  | { readonly ok: false; readonly error: Error }; // gated + fail
