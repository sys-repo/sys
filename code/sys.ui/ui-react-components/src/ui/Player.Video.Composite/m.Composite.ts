import { type t, Timecode } from './common.ts';
import { CompositeVideo as View } from './ui.tsx';

export const CompositeVideo: t.CompositeVideoLib = {
  View,
  Tools: Timecode.Composite,
};
