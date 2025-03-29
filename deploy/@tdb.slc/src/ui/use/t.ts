import { type t } from './common.ts';

/**
 * Hook: Load the `dist.json` file from the server.
 */
export type UseDistFactory = (options?: { useSample?: boolean }) => UseDist;
export type UseDist = {
  readonly count: number;
  readonly is: { readonly useSample: boolean };
  readonly json?: t.DistPkg;
  readonly error?: t.StdError;
};
