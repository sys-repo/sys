/**
 * @module
 * UI for surfacing the ClientLoader HTTP fetch tools.
 */
import type { t } from './common.ts';
import { Origin as UI } from './ui.tsx';
import { controller } from './ui.controller.ts';

export const DevLoader: t.DevLoaderLib = {
  UI,
  controller,
};
