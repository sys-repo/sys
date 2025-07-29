import { type t } from '../common.ts';

import { Fileshare } from './s.Fileshare.ts';
import { Meta } from './s.Meta.ts';
import { Section } from './s.Section.ts';
import { Video } from './s.Video.ts';

/**
 * Inferred types:
 */
export type Meta = t.Static<typeof Meta>;
export type Video = t.Static<typeof Video>;
export type Fileshare = t.Static<typeof Fileshare>;
export type Section = t.Static<typeof Section>;

export function getSchema(id: string) {
  const key = id as t.SampleFactoryId;
  if (key === 'video:host') return Video;
  if (key === 'section:host') return Section;
  return;
}

/**
 * Library:
 */
export const SampleSchema = {
  get: getSchema,
  Meta,
  Video,
  Fileshare,
  Section,
} as const;
