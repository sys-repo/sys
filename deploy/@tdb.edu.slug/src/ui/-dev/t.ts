import { type t } from './common.ts';

/** Type re-exports. */
export type * from './ui.Http.DataCards/t.ts';
export type * from './ui.Http.SlugOrigin/t.ts';
export type * from './ui.Crdt/t.ts';

/**
 * Dev UI helpers.
 */
export type DevLib = {
  SlugOrigin: t.SlugHttpOriginLib;
  ActionProbe: t.ActionProbe.Lib;
};
