/**
 * @module
 * Trait-as: "media-composition" namespace
 */
import type { t } from './common.ts';
import { Sequence } from '../slug.MediaComposition.Sequence/mod.ts';
import { Playback } from '../slug.MediaComposition.Playback/mod.ts';

export const MediaComposition: t.MediaCompositionLib = {
  Sequence,
  Playback,
};
