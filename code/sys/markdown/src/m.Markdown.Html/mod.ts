/**
 * @module
 * Safe Markdown → HTML rendering primitives.
 */
import type { t } from './common.ts';
import { render } from './u.render.ts';

/** Safe Markdown → HTML rendering primitives. */
export const Html: t.Markdown.Html.Lib = {
  render,
};
