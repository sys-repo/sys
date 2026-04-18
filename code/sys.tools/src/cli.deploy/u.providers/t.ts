export type * from './provider.deno/t.ts';
export type * from './provider.noop/t.ts';
export type * from './provider.orbiter/t.ts';

/**
 * Orbiter availability probe.
 *
 * We don't do PATH heuristics.
 * We attempt to invoke the binary and treat "can run" as truth.
 */
export type ProviderAvailability =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /** Coarse reason (stable for callers). */
      readonly reason: 'not-found' | 'failed';
      /** Human hint (optional, safe to show in CLI). Should be the install command for "not-found". */
      readonly hint?: string;
      /** Raw error for diagnostics (do not stringify unless needed). */
      readonly error?: unknown;
    };
