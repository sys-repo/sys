/**
 * @module
 * A pure typographic surface for rendering long-form authored text.
 *
 *  ├─ Prose.Measure     Defines the reading geometry for prose, including measure, margins, and gutters.
 *  ├─ Prose.Manuscript  Defines the typographic contract for authored prose, including hierarchy and rhythm.
 *  └─ Prose.Markdown    Adapts Markdown input into prose semantics without imposing layout or typography.
 *
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
