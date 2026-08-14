import type { t } from '../common.ts';
import { ellipsize } from './u.ellipsize.ts';
import { Width } from './u.width.ts';
import { Wrap } from './u.wrap.ts';

/** Canonical terminal-text runtime grouped by width, wrapping, and clipping responsibility. */
export const Text: t.CliFormatText.Lib = Object.freeze({
  Width,
  Wrap,
  ellipsize,
});
