import { type t, D } from './common.ts';

/**
 * Helpers that examine an editor.
 */
export const Editor = {
  className(editor?: t.MonacoTypes.Editor) {
    let id = editor?.getId() ?? '';
    if (id.includes(':')) id = `instance-${id.split(':')[1]}`;
    return `${D.className} ${id}`.trim();
  },

  language(editor?: t.MonacoTypes.Editor): t.EditorLanguage {
    if (!editor) return 'UNKNOWN';
    const res = (editor.getModel()?.getLanguageId() || '') as t.EditorLanguage;
    return D.languages.includes(res) ? res : 'UNKNOWN';
  },

  content(editor: t.MonacoTypes.Editor): t.EditorContent {
    const text = editor.getValue() || '';
    const language = Editor.language(editor);
    return { text, language };
  },

  selections(editor: t.MonacoTypes.Editor): t.EditorSelection[] {
    return editor.getSelections() ?? [];
  },
} as const;
