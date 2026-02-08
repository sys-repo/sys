/**
 * @module
 * A pure, typographic "prose" surface for rendering long-form authored text.
 */
import type { t } from './common.ts';
import { Manuscript } from './ui.tsx';

export const Prose: t.Prose.Lib = {
  UI: Manuscript,
  Manuscript,
};
