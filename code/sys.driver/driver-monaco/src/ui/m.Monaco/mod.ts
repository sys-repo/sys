/**
 * @module
 * Code editor.
 */
import { EditorCarets } from '../m.Editor.Carets/mod.ts';
import { MonacoEditor } from '../ui.MonacoEditor/mod.ts';
export { EditorCarets, MonacoEditor };

export const Monaco = {
  Editor: MonacoEditor,
  Carets: EditorCarets,
} as const;
