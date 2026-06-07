import type { t } from '../common.ts';
import { fitWidth, maxVisibleWidth, padEnd, visibleWidth } from './u.width.ts';
import { wrap, wrapLines } from './u.wrap.ts';

/** Shared text fitting and wrapping formatter. */
export const Text: t.CliFormatTextLib = {
  visibleWidth,
  padEnd,
  maxVisibleWidth,
  fitWidth,
  wrap,
  wrapLines,
};
