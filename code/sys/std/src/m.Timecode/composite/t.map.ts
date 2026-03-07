import type { t } from './common.ts';

/**
 * Mapping operations between the virtual timeline and source/slice domains.
 */
export type TimecodeCompositeMapLib = {
  /** Map a virtual time to its backing source segment/time (or null). */
  readonly toSource: t.TimecodeMapToSource;
};
