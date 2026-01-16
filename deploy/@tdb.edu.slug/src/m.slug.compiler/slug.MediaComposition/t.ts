import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.asset.ts';
export type * from './t.namespace.ts';

/**
 * MediaComposition namespace
 */
export type MediaCompositionLib = {
  readonly Sequence: t.MediaComposition.Sequence.Lib;
  readonly Playback: t.MediaComposition.Playback.Lib;
};
