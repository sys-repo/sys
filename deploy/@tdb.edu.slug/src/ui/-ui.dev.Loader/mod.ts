/**
 * @module
 * UI for surfacing the ClientLoader HTTP fetch tools.
 */
import type { t } from './common.ts';
import { ClientLoader as UI } from './ui.tsx';
import { controller } from './ui.Origin.Controller.ts';

export const DevLoader: t.DevLoaderLib = {
  UI,
  controller,
};
