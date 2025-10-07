/**
 * @module
 * Isolated factory (samples).
 */
import type { t } from './common.ts';

import { getSchema } from './-schemas/mod.ts';
import { getView } from './-views/mod.ts';

export const SampleFactory: t.Factory = {
  getSchema,
  getView,
};
