import type { t } from './common.ts';
import { pluginOptions } from './emotion-js/mod.ts';
import { Tmpl } from './m.Tmpl.ts';
import { css } from './u.cssTransform.ts';
import { Edges } from './m.Edges.ts';

export { css };

/**
 * Library: CSS tools.
 */
export const Style: t.StyleLib = {
  Tmpl,
  Edges,
  css,
  plugin: { emotion: () => pluginOptions() },
};
