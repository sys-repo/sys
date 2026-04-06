import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../../common.t.ts';
export type * from '../t.ts';

/** Import-time spec params. */
export type HttpDataCardsSpecParams = t.HttpDataCards.SpecParams;

/**
 * Test, Spec types (internal).
 */
export type * from './-SPEC.Debug.tsx';
