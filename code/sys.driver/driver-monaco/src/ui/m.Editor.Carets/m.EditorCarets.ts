import type { EditorCaretsLib } from './t.ts';

import { create } from './m.EditorCarets.factory.ts';
import { Color } from './u.ts';

/**
 * Manages a set of carets for an editor.
 */
export const EditorCarets: EditorCaretsLib = {
  Color,
  create,
} as const;
