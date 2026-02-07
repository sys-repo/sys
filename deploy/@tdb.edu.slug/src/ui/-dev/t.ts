import { type t } from './common.ts';

/** Type re-exports. */
export type * from './ui.Http.SlugOrigin/t.ts';
export type * from './ui.Http.SlugLoader/t.ts';

/**
 * Dev UI helpers.
 */
export type DevLib = {
  SlugOrigin: t.SlugHttpOriginLib;
  ActionProbe: t.ActionProbeView.Lib;
};
