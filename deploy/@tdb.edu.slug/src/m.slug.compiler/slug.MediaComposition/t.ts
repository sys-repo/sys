import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.asset.ts';
export type * from './t.namespace.ts';

/**
 * MediaComposition namespace
 */
export type SlugMediaCompositionLib = {
  readonly Schema: t.SlugMediaCompositionSchemaLib;
  readonly Sequence: t.MediaComposition.Sequence.Lib;
  readonly Playback: t.MediaComposition.Playback.Lib;
};
