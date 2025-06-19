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
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { type t, D, Obj, toAutomergeHandle } from './common.ts';
import { useCssImports } from './use.CssImports.ts';

/**
 * Hook: boot-straps the prose-mirror editor
 *       with the Automerge plugin.
 *
 * Refs:
 *       https://automerge.org/docs/cookbook/rich-text-prosemirror-vanilla/
 *       https://automerge.org/docs/cookbook/rich-text-prosemirror-react/
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
   * Effect: editor setup
   */
  useEffect(() => {
    const handle = toAutomergeHandle(doc);
    if (!handle) return;
    if (!cssImports.ready) return;
    if (ref.current == null || doc?.current == null) return;
    if (!path || path.length === 0) return;

    // Ensure the path exists on the CRDT documetn.
    doc.change((d) => Obj.Path.Mutate.ensure(d, path, ''));

    const automerge = automergeInit(handle!, path);
    const schema = basicSchema;
    const plugins = exampleSetup({
      schema,
      menuBar: false,
      mapKeys: {
        Escape: false, // ← remove the default ESC binding.
      },
    });
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
