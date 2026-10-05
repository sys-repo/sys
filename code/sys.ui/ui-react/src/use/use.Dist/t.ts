import type { t } from '../common.ts';

/**
 * Observe supported `./dist.json` metadata relative to the current page.
 * Sample fallback is explicitly requested and defaults to false.
 */
export type UseDistFactory = (options?: { sampleFallback?: boolean }) => DistHook;
/** Schema-recognized but unpinned metadata; no independent digest, payload or execution proof. */
export type DistHook = {
  readonly count: number;
  /** True only when the current JSON is sample data, not merely when fallback is permitted. */
  readonly is: { readonly sample: boolean };
  readonly json?: t.DistPkg;
  /** Observation/fallback failure; successful sample `json` retains the remote error. */
  readonly error?: t.StdError;
  toString(): string;
};
