import type { t } from './common.ts';
import { detect } from './u.detect.ts';
import { edit } from './u.edit.ts';
import { remove } from './u.remove.ts';
import { render } from './u.render.ts';
import { update } from './u.update.ts';

/** Deterministic exact-marker text block primitives. */
export const TextBlock: t.TextBlock.Lib = Object.freeze({
  detect,
  render,
  update,
  edit,
  remove,
});
