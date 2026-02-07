/**
 * @module
 * Dev UI helpers.
 */
import { type t } from './common.ts';
import { ActionProbe } from './ui.Http.SlugLoader/mod.ts';
import { SlugOrigin } from './ui.Http.SlugOrigin/mod.ts';

export const Dev: t.DevLib = {
  SlugOrigin,
  ActionProbe,
};
