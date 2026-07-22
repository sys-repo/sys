/**
 * @module
 * Dev-only React composition primitives built from system UI components.
 */
import type { t } from './common.ts';
import { DevHelpMarkdown } from './m.Help.Markdown/mod.ts';

/** Dev-only composition primitive surface. */
export const Dev: t.Dev.Lib = {
  Help: {
    Markdown: DevHelpMarkdown,
  },
};
