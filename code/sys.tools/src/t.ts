/** Re-export types. */
export type * from './t.namespace.ts';

/** Common result response from tool runs. */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0); */
  exit: number | boolean;
};
