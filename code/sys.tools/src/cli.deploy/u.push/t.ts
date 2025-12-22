export type * from './provider.orbiter/t.ts';

export type PushProbe =
  | { readonly ok: true }
  | {
      readonly ok: false;
      /** Coarse reason (stable for callers). */
      readonly reason: 'no-provider' | 'not-found' | 'failed' | 'unsupported-provider';

      /**
       * One-line human hint (optional).
       * For "not-found", this should be the install command (eg "npm i -g orbiter-cli").
       */
      readonly hint?: string;

      /** Raw error for diagnostics (do not stringify unless needed). */
      readonly error?: unknown;
    };

/**
 * Push execution result.
 *
 * Keep it coarse: menus/CLI decide how to render.
 * No throwing from push layer; errors are returned.
 */
export type PushResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: 'probe-failed' | 'unsupported-provider' | 'not-implemented' | 'failed';
      readonly hint?: string;
      readonly error?: unknown;
    };
