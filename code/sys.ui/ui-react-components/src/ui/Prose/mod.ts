/**
 * @module
 * A pure, typographic "prose" surface for rendering long-form authored text.
 */
import type { t } from './common.ts';
import { Manuscript } from './ui.Manscript.tsx';

export const Prose: t.Prose.Lib = {
  Manuscript: { UI: Manuscript },
};
