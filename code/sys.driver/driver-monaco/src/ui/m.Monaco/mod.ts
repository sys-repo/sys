/**
 * Code editor.
 * @module
 */
import type { t } from './common.ts';

import { EditorCarets } from '../m.Editor.Carets/mod.ts';
import { MonacoEditor } from '../ui.MonacoEditor/mod.ts';
export { EditorCarets, MonacoEditor };

/**
 * Code editor library:
 */
export const Monaco: t.MonacoLib = {
  Editor: MonacoEditor,
  Carets: EditorCarets,
} as const;
