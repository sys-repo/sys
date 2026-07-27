import type { t } from '../common.ts';
import { ellipsize } from './u.ellipsize.ts';
import { fit, max, measure, padEnd } from './u.width.ts';
import { lines, text } from './u.wrap.ts';

const Width: t.CliFormatText.Width.Lib = { measure, padEnd, max, fit };
const Wrap: t.CliFormatText.Wrap.Lib = { text, lines };

/** Canonical terminal-text runtime grouped by width, wrapping, and clipping responsibility. */
export const Text: t.CliFormatText.Lib = { Width, Wrap, ellipsize };
