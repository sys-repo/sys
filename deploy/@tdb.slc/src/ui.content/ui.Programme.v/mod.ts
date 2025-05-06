import type { t } from './common.ts';
import { conculsion } from './v.conclusion.tsx';
import { metrics } from './v.metrics.tsx';
import { model } from './v.model.tsx';
import { start } from './v.start.tsx';

export { conculsion, metrics, model, start };

export const Programme = {
  children(): t.VideoMediaContent[] {
    return [start(), model.customer(), model.impact(), model.econ(), metrics(), conculsion()];
  },
} as const;
