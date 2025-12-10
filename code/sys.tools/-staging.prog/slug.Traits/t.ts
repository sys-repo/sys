import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.namespace.ts';
export type * from './t.lib.ts';

/**
 * Base slug-trait shape.
 */
export type SlugTrait = {
  readonly of?: string;
  readonly as?: string;
  readonly [key: string]: unknown;
};
