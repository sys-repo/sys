import { type t } from './common.ts';
import { Helpers } from './m.Helpers.ts';
import { CompositeVideo as View } from './ui.tsx';

export const CompositeVideo: t.CompositeVideoLib = {
  ...Helpers,
  View,
};
