/**
 * @module
 * Slug-tree driver for KB navigation (TreeHost only).
 */
import type { t } from './common.ts';

import { Dev } from './-dev/mod.ts';
import { Controller } from './m.Controller.ts';

export const SlugKbDriver: t.SlugKbDriverLib = {
  Dev,
  Controller,
};
