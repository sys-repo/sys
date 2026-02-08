/**
 * @module
 * A pure typographic surface for rendering long-form authored text.
 *
 *  ├─ Prose.Measure     Defines the reading geometry for prose, including measure, margins, and gutters.
 *  ├─ Prose.Manuscript  Defines the typographic contract for authored prose, including hierarchy and rhythm.
 *  └─ Prose.Markdown    Adapts Markdown input into prose semantics without imposing layout or typography.
 *
 */
import { type t, ProseManuscript as Manuscript } from './common.ts';

export const Prose: t.Prose.Lib = {
  Manuscript,
};
