import type { t } from './common.ts';
import { pluginOptions } from './emotion-js/mod.ts';
import { Tmpl } from './m.Tmpl.ts';
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
