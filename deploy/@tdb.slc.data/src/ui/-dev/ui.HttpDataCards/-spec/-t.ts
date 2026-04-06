import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../../common.t.ts';
export type * from '../t.ts';

/** Import-time spec params. */
export type HttpDataCardsSpecParams = {
  originSpec?: t.HttpOrigin.SpecMap;
};

/**
 * Test, Spec types (internal).
 */
export type * from './-SPEC.Debug.tsx';
