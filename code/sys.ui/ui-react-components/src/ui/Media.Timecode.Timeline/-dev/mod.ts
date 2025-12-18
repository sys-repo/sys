import { type t } from './common.ts';
import { Harness } from './ui.tsx';

export const Dev: t.MediaTimeline.Lib['Dev'] = {
  Harness,
} as const;
