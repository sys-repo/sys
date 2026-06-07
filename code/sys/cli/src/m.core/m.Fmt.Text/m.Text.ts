import type { t } from '../common.ts';
import { fitWidth, padEnd, visibleWidth } from './u.width.ts';
import { wrap, wrapLines } from './u.wrap.ts';

/** Shared text fitting and wrapping formatter. */
export const Text: t.CliFormatTextLib = {
  visibleWidth,
  padEnd,
  fitWidth,
  wrap,
  wrapLines,
};
