/**
 * @module
 * Trait-as: "media-composition" namespace
 */
import { Playback } from '../m.slug.MediaComposition.Playback/mod.ts';
import { Sequence } from '../m.slug.MediaComposition.Sequence/mod.ts';
import { type t, SlugSchema } from './common.ts';

export const MediaComposition: t.SlugMediaCompositionLib = {
  Schema: SlugSchema.MediaComposition,
  Sequence,
  Playback,
};
