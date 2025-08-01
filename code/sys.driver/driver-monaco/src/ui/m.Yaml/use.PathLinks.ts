import { useEffect, useState } from 'react';
import { type t, Str, css, Obj, UserAgent } from './common.ts';

export function usePathLinks(args: { editor?: t.Monaco.Editor; cursor?: t.EditorYamlCursorPath }) {
  const { editor, cursor } = args;

  /**
   * Hooks:
   */
  const [collection, setCollection] = useState<t.Monaco.I.IEditorDecorationsCollection>();

  /**
   * Effect: Establish link collection on the editor.
   */
  useEffect(() => {
    if (!editor) return;
    setCollection(editor.createDecorationsCollection());
  }, [editor?.getId()]);

  /**
   * Effect: Listen to cursor path changes.
   */
  useEffect(() => {
    if (!cursor || !collection) return;
    const range = cursor.word;

    /**
     * TODO 🐷 - WIP
     *  Links assigned and unassigned dynamically over current.
     *  Do something with that (TBD).
     */

    if (range) {
      const inlineClassName = css({ textDecoration: 'underline', cursor: 'pointer' }).class;
      const trigger = UserAgent.current.is.macOS ? 'cmd + click' : 'ctrl + click';
      const path = cursor.path.map((seg) => Str.truncate(String(seg), 10)).join('/');
      const value = `Lens into '${path}' (${trigger})`;
      collection.set([{ range, options: { inlineClassName, hoverMessage: { value } } }]);
    } else {
      collection.clear();
    }
  }, [Obj.hash(cursor?.word), !!collection]);
}
