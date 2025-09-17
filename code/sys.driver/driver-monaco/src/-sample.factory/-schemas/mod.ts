import { type t } from '../common.ts';

import { Fileshare } from './s.Fileshare.ts';
import { IFrame } from './s.IFrame.ts';
import { Video } from './s.Video.ts';

/**
 * Inferred types:
 */
export type VideoSchema = t.Infer<typeof Video>;
export type FileshareSchema = t.Infer<typeof Fileshare>;
export type IFrameSchema = t.Infer<typeof IFrame>;

export function getSchema(id: string) {
  const key = id as t.SampleFactoryId;
  if (key === 'VideoPlayer:host') return Video;
  if (key === 'Fileshare:host') return Fileshare;
  if (key === 'IFrame:host') return IFrame;
  return;
}
