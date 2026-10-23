import type { t } from '../common.ts';
import { Width } from './u.width/u.width.ts';
import { isTextPresentationAuthorityReady as isReady } from './u/u.authority.ts';
import { ellipsize } from './u/u.ellipsize.ts';
import { Wrap } from './u/u.wrap.ts';

/**
 * Canonical terminal-text runtime grouped by width, wrapping, clipping, and post-import integrity.
 */
export const Text: t.CliFormatText.Lib = Object.freeze({
  Width,
  Wrap,
  ellipsize,
  isReady,
});
