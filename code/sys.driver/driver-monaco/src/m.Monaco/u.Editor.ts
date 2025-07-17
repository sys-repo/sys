import { type t, D } from './common.ts';

/**
 * Helpers that examine an editor.
 */
export const EditorUtil = {
  className(editor?: t.Monaco.Editor) {
    let id = editor?.getId() ?? '';
    if (id.includes(':')) id = `instance-${id.split(':')[1]}`;
    return `${D.className} ${id}`.trim();
  },

  language(editor?: t.Monaco.Editor): t.EditorLanguage {
    if (!editor) return 'UNKNOWN';
    const res = (editor.getModel()?.getLanguageId() || '') as t.EditorLanguage;
    return D.languages.includes(res) ? res : 'UNKNOWN';
  },

  content(editor: t.Monaco.Editor): t.EditorContent {
    const text = editor.getValue() || '';
    const language = EditorUtil.language(editor);
    return { text, language };
  },

  selections(editor: t.Monaco.Editor): t.EditorSelection[] {
    return editor.getSelections() ?? [];
  },
} as const;
