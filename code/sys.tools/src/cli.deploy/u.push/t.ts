/**
 * Result of probing whether a provider is available
 * to perform a push operation on this system.
 */
export type PushProbe =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly hint?: string;
      readonly error?: unknown;
    };

/**
 * Orbiter availability probe.
 *
 * We don't do PATH heuristics.
 * We attempt to invoke the binary and treat "can run" as truth.
 */
export type OrbiterAvailability =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /** Coarse reason (stable for callers). */
      readonly reason: 'not-found' | 'failed';
      /** Human hint (optional, safe to show in CLI). */
      readonly hint?: string;
      /** Raw error for diagnostics (do not stringify unless needed). */
      readonly error?: unknown;
    };
