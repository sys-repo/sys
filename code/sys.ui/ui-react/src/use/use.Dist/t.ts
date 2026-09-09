import type { t } from '../common.ts';

/**
 * Hook: Load the `dist.json` file from the server (if avilable).
 */
export type UseDistFactory = (options?: { sampleFallback?: boolean }) => DistHook;
/** Current dist.json load state and formatting helpers. */
export type DistHook = {
  readonly count: number;
  readonly is: { readonly sample: boolean };
  readonly json?: t.DistPkg;
  readonly error?: t.StdError;
  toString(): string;
};
