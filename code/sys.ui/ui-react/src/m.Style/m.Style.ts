import type { t } from './common.ts';
import { pluginOptions } from './emotion/mod.ts';

/**
 * Library: CSS tools.
 */
export const Style: t.StyleLib = {
  plugin: { emotion: () => pluginOptions() },
};
