/**
 * @module
 * A pure typographic surface for long-form authored text.
 *
 * Namespace:
 *  ├─ Prose.Measure     Reading geometry: measure, margins, gutters, and responsive constraints.
 *  ├─ Prose.Manuscript  Typographic semantics: hierarchy, rhythm, and a stable set of prose roles.
 *  └─ Prose.Markdown    Markdown renderer: value (source text or AST) → React prose elements.
 *
 * Direction:
 *  Markdown stays an input adapter at the prose edge; layout and typography remain caller-owned.
 */
import type { t } from './common.ts';
import { ProseManuscript as Manuscript } from '../Prose.Manuscript/mod.ts';
import { ProseMeasure as Measure } from '../Prose.Measure/mod.ts';
import { ProseMarkdown as Markdown } from '../Prose.Markdown/mod.ts';

/** Prose measure, manuscript, and Markdown adapter surface. */
export const Prose: t.Prose.Lib = {
  Measure,
  Manuscript,
  Markdown,
};
