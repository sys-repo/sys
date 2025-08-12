import { type t } from '../common.ts';

import { Fileshare } from './s.Fileshare.ts';
import { IFrame } from './s.IFrame.ts';
import { Section } from './s.Section.ts';
import { Video } from './s.Video.ts';

/**
 * Inferred types:
 */
export type Video = t.Static<typeof Video>;
export type Fileshare = t.Static<typeof Fileshare>;
export type Section = t.Static<typeof Section>;
export type IFrame = t.Static<typeof IFrame>;

export function getSchema(id: string) {
  const key = id as t.SampleFactoryId;
  if (key === 'VideoPlayer:host') return Video;
  if (key === 'SectionTree:host') return Section;
  if (key === 'Fileshare:host') return Fileshare;
  if (key === 'IFrame:host') return IFrame;
  return;
}
