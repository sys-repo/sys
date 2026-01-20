/**
 * @module
 * Trait-as: "media-composition" namespace
 */
import { MediaCompositionSchema as Schema } from '../../m.slug.schema/slug.MediaComposition/mod.ts';
import { Playback } from '../slug.MediaComposition.Playback/mod.ts';
import { Sequence } from '../slug.MediaComposition.Sequence/mod.ts';
import type { t } from './common.ts';

export const MediaComposition: t.SlugMediaCompositionLib = {
  Schema,
  Sequence,
  Playback,
};
