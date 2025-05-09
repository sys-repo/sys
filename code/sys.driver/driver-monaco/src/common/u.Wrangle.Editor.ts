import { D } from './constants.ts';
import type * as t from './t.ts';

/**
 * Helpers that examine an editor.
 */
export const Editor = {
  className(editor?: t.MonacoCodeEditor) {
    let id = editor?.getId() ?? '';
    if (id.includes(':')) id = `instance-${id.split(':')[1]}`;
    return `${D.className} ${id}`.trim();
  },

  language(editor?: t.MonacoCodeEditor): t.EditorLanguage {
    if (!editor) return 'UNKNOWN';
    const res = (editor.getModel()?.getLanguageId() || '') as t.EditorLanguage;
    return D.languages.includes(res) ? res : 'UNKNOWN';
  },

  content(editor: t.MonacoCodeEditor): t.EditorContent {
    const text = editor.getValue() || '';
    const language = Editor.language(editor);
    return { text, language };
  },

  selections(editor: t.MonacoCodeEditor): t.EditorSelection[] {
    return editor.getSelections() ?? [];
  },
} as const;
