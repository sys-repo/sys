/**
 * @module
 * Code editor.
 */
import { EditorCarets } from '../ui/u.Editor.Carets/mod.ts';
import { MonacoEditor } from '../ui/ui.MonacoEditor/mod.ts';
export { EditorCarets, MonacoEditor };

export const Monaco = {
  Editor: MonacoEditor,
  Carets: EditorCarets,
} as const;
