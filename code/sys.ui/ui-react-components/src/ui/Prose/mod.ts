/**
 * @module
 * A pure typographic surface for long-form authored text.
 *
 * Namespace:
 *  ├─ Prose.Measure     Reading geometry: measure, margins, gutters, and responsive constraints.
 *  ├─ Prose.Manuscript  Typographic semantics: hierarchy, rhythm, and a stable set of prose roles.
 *  └─ Prose.Markdown    Markdown adapter: maps Markdown → Manuscript roles without imposing layout or typography.
 *
 * Direction:
 *  Markdown adapts into Manuscript + Measure (never the other way around).
 */
import type { t } from './common.ts';
import { ProseManuscript as Manuscript } from '../Prose.Manuscript/mod.ts';
import { ProseMeasure as Measure } from '../Prose.Measure/mod.ts';
import { ProseMarkdown as Markdown } from '../Prose.Markdown/mod.ts';

export const Prose: t.Prose.Lib = {
  Measure,
  Manuscript,
  Markdown,
};
