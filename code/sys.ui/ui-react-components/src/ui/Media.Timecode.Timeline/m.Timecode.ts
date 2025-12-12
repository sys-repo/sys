import { type t } from './common.ts';
import { Dev } from './-dev/mod.ts';
import { useTimeline } from './use.Timeline.ts';

export const MediaTimecode: t.MediaTimelineLib = {
  Dev,
  useTimeline,
};
