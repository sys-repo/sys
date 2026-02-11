/**
 * @module
 * Markdown adapter:
 * maps Markdown → Manuscript roles without imposing layout or typography.
 *
 * Direction:
 * adapts into Manuscript + Measure (never the other way around).
 */
import type { t } from './common.ts';
import { Markdown as UI } from './ui.tsx';

export const ProseMarkdown: t.ProseMarkdown.Lib = { UI };
