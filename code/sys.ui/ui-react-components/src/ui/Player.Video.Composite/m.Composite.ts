import { type t, Timecode } from './common.ts';
import { SpecInfo } from './ui.SpecInfo.tsx';
import { CompositeVideo as Video } from './ui.tsx';

export const CompositeVideo: t.CompositeVideoLib = {
  Tools: Timecode.Composite,
  View: { Video, SpecInfo },
};
