import type { t } from './common.ts';
import { conculsion } from './v.conclusion.ts';
import { metrics } from './v.metrics.ts';
import { model } from './v.model.ts';
import { start } from './v.start.ts';

export { conculsion, metrics, model, start };

export const children: t.VideoMediaContent[] = [
  start,
  model.customer,
  model.impact,
  model.econ,
  metrics,
  conculsion,
];
