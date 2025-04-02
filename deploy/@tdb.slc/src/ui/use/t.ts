import { type t } from './common.ts';

/**
 * Hook: Load the `dist.json` file from the server (if avilable).
 */
export type UseDistFactory = (options?: { useSampleFallback?: boolean }) => UseDist;
export type UseDist = {
  readonly count: number;
  readonly is: { readonly sample: boolean };
  readonly json?: t.DistPkg;
  readonly error?: t.StdError;
};

/**
 * Hook: Keyboard controller.
 */
export type UseKeyboardFactory = (state?: t.AppSignals) => void;
