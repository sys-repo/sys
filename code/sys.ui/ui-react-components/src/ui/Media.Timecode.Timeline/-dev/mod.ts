import { type t } from './common.ts';
import { Harness } from './ui.Harness.tsx';

export const Dev: t.MediaTimelineLib['Dev'] = {
  Harness,
} as const;
