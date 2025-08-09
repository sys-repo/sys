import React, { useEffect, useRef } from 'react';

/**
 * Automerge:
 */
import { init as automergeInit } from '@automerge/prosemirror';

/**
 * ProseMirror:
 */
import { exampleSetup } from 'prosemirror-example-setup';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { EditorState, Plugin as StatePlugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { type t, D, Obj, toAutomergeHandle } from './common.ts';
import { useCssImports } from './use.CssImports.ts';

/**
 * Hook: bootstraps the ProseMirror editor
 *       with the Automerge plugin.
 *
 * Refs:
 *        https://automerge.org/docs/cookbook/rich-text-prosemirror-vanilla/
 *        https://automerge.org/docs/cookbook/rich-text-prosemirror-react/
 *
 *        https://prosemirror.net/
 *        https://github.com/ProseMirror/prosemirror-example-setup  (sample config).
 *
 */
export function useProsemirror(props: t.TextEditorProps) {
  const { doc, path, singleLine = D.singleLine } = props;

  /**
   * Refs/Hooks:
   */
  const ref = useRef<HTMLDivElement>(null);
  const cssImports = useCssImports();
  const [editor, setEditor] = React.useState<EditorView>();

  /**
   * Effect: editor setup.
   */
  useEffect(() => {
    const handle = toAutomergeHandle(doc);
    if (!handle) return;
    if (!cssImports.ready) return;
    if (ref.current == null || doc?.current == null) return;
    if (!path || path.length === 0) return;

    // Ensure the path exists on the CRDT documetn.
    doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));

    /**
     * Automerge:
     */
    const automerge = automergeInit(handle!, path);
    const schema = basicSchema;
    const plugins = exampleSetup({
      schema,
      menuBar: false,
      mapKeys: {
        Escape: false, // ← remove the default ESC binding.
      },
    });
    /**
     * Clipboard:
     */
    const statePlugin = new StatePlugin({
      props: {
        handlePaste(view, e) {
          if (!singleLine) return false;
          e.preventDefault();

          // Clean for single-line mode:
          // Convert plain-text and collapse any newlines into spaces.
          const raw = e.clipboardData?.getData('text/plain') ?? '';
          const cleaned = raw.replace(/\r?\n+/g, ' ');

          // insert as a text node
          const { tr, schema } = view.state;
          const textNode = schema.text(cleaned);
          view.dispatch(tr.replaceSelectionWith(textNode).scrollIntoView());
          return true;
        },
      },
    });

    /**
     * Editor:
     */
    plugins.push(statePlugin);
    plugins.push(automerge.plugin);
    const state = EditorState.create({
      schema,
      plugins,
      doc: automerge.pmDoc,
    });

    const handleKeyDown = (view: EditorView, e: KeyboardEvent) => {
      let handled = false;
      if (e.key === 'Enter' && singleLine) handled = true; // NB: suppress-new line characters when in "single-line" mode.
      return handled;
    };

    const view = new EditorView(ref.current, { state, handleKeyDown });
    setEditor(view);

    // Finish up.
    return () => {
      view?.destroy();
      setEditor(undefined);
    };
  }, [ref, doc?.instance, cssImports.ready, singleLine, path?.join()]);

  /**
   * API:
   */
  return { ref, editor } as const;
}
