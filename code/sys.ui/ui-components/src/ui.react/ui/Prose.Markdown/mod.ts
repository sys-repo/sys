/**
 * @module
 * Markdown renderer:
 * maps a Markdown value (source text or AST) → React prose elements without imposing layout or typography.
 *
 * Direction:
 * Markdown stays an input adapter at the prose edge; layout and typography remain caller-owned.
 */
import type { t } from './common.ts';
import { Markdown as UI } from './ui.tsx';

export const ProseMarkdown: t.ProseMarkdown.Lib = { UI };
