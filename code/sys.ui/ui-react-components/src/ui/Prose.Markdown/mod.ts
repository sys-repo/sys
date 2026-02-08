/**
 * @module
 * Adapts Markdown input into prose semantics without imposing layout or typography.
 */
import type { t } from './common.ts';
import { Markdown as UI } from './ui.tsx';

export const ProseMarkdown: t.ProseMarkdown.Lib = { UI };
