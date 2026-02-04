/**
 * @module
 */
import type { t } from './common.ts';
import { origins } from './u.origins.ts';
import { SlugHttpOrigin as UI } from './ui.tsx';

export const SlugOrigin: t.SlugHttpOriginLib = {
  UI,
  origins,
};
