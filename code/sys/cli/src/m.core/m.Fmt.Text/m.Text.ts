import type { t } from '../common.ts';
import { ellipsize } from './u.ellipsize.ts';
import { fitWidth, maxVisibleWidth, padEnd, visibleWidth } from './u.width.ts';
import { wrap, wrapLines } from './u.wrap.ts';

/** Shared text fitting and wrapping formatter. */
export const Text: t.CliFormatTextLib = {
  visibleWidth,
  padEnd,
  maxVisibleWidth,
  ellipsize,
  fitWidth,
  wrap,
  wrapLines,
};
