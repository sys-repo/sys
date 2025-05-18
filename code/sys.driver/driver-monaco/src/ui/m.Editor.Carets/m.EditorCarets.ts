import type { t } from './common.ts';
import { create } from './m.EditorCarets.factory.ts';
import { Color } from './u.ts';

/**
 * Manages a set of carets for an editor.
 */
export const EditorCarets: t.EditorCaretsLib = {
  Color,
  create,
} as const;
