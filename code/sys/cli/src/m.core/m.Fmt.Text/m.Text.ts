import type { t } from '../common.ts';
import { isTextPresentationAuthorityReady } from './u.authority.ts';
import { ellipsize } from './u.ellipsize.ts';
import { Width } from './u.width.ts';
import { Wrap } from './u.wrap.ts';

/**
 * Canonical terminal-text runtime grouped by width, wrapping, clipping, and post-import integrity.
 */
export const Text: t.CliFormatText.Lib = Object.freeze({
  isReady: isTextPresentationAuthorityReady,
  Width,
  Wrap,
  ellipsize,
});
