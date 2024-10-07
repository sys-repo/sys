import type { t } from './common.ts';
import { pluginOptions } from './lib.emotion-js/mod.ts';
import { Tmpl } from './u.Tmpl.ts';
import { css } from './u.cssTransform.ts';

export { css };

/**
 * Library: CSS tools.
 */
export const Style: t.StyleLib = {
  Tmpl,
  css,
  plugin: { emotion: () => pluginOptions() },
};
