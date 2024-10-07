import type { t } from './common.ts';
import { pluginOptions } from './lib.emotion-js/mod.ts';
import { Tmpl } from './u.tmpl.ts';
import { css } from './u.transform.ts';

export { css };

/**
 * Library: CSS tools.
 */
export const Style: t.StyleLib = {
  Tmpl,
  css,
  plugin: { emotion: () => pluginOptions() },
};
