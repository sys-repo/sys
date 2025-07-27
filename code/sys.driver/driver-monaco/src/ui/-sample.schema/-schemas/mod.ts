import { type t } from '../common.ts';

import { Fileshare } from './s.Fileshare.ts';
import { Meta } from './s.Meta.ts';
import { Video } from './s.Video.ts';

/**
 * Library:
 */
export type Meta = t.Static<typeof Meta>;
export type Video = t.Static<typeof Video>;
export type Fileshare = t.Static<typeof Fileshare>;
export const SampleSchema = {
  Meta,
  Video,
  Fileshare,
} as const;
