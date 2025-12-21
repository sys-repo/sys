export type PushProbe =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /** Coarse reason (stable for callers). */
      readonly reason: 'no-provider' | 'not-found' | 'failed' | 'unsupported-provider';
      /** One-line human hint (optional). */
      readonly hint?: string;

      /**
       * Install help (optional).
       * Keep it small and safe to print in CLI.
       */
      readonly install?: {
        /** Eg "npm i -g orbiter-cli" */
        readonly cmd: string;
        /** Optional extra info (URL or note). */
        readonly note?: string;
      };

      /** Raw error for diagnostics (do not stringify unless needed). */
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
