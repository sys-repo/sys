import { type t } from './common.ts';
import { Helpers } from './m.Composite.helpers.ts';
import { CompositeVideo as View } from './ui.tsx';

export const CompositeVideo: t.CompositeVideoLib = {
  ...Helpers,
  View,
};
