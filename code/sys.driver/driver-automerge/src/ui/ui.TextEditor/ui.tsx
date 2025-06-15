import React, { useRef } from 'react';

import { exampleSetup } from 'prosemirror-example-setup';
import { DOMParser as PMDOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { toAutomergeHandle } from '../../crdt/mod.ts';
import { type t, Color, css, D } from './common.ts';
import { useCssImports } from './use.CssImports.ts';
import { EditorStyles } from './u.styles.ts';

export const TextEditor: React.FC<t.TextEditorProps> = (props) => {
  const { doc, readOnly = D.readOnly, scroll = D.scroll, debug = false } = props;

  /**
   * Hooks:
   */
  const cssImports = useCssImports();
  const rootRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = React.useState<EditorView>();

  /**
   * Effect: Load and configure <ProseMirror> text editor.
   */
  React.useEffect(() => {
    const handle = toAutomergeHandle(doc);
    if (!handle) return;
    if (!cssImports.ready) return;
    if (rootRef.current == null || doc?.current == null) return;

    const plugins = exampleSetup({
      schema: basicSchema,
      menuBar: false,
    });

    const node = PMDOMParser.fromSchema(basicSchema).parse(
      document.createElement('div'), // start with empty document.
    );

    const state = EditorState.create({
      schema: basicSchema,
      plugins,
      doc: node,
    });

    const view = new EditorView(rootRef.current, { state });
    setEditor(view);

    // Finish up.
    return () => {
      view?.destroy();
      setEditor(undefined);
    };
  }, [rootRef, doc?.instance, cssImports.ready]);

  /**
   * Effect: sync/autoFocus.
   */
  React.useEffect(() => {
    if (props.autoFocus) editor?.focus();
  }, [editor, props.autoFocus]);

  /**
   * Effect: sync/read-only.
   */
  React.useEffect(() => {
    if (editor) editor.setProps({ editable: () => !readOnly });
  }, [editor, readOnly]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      zIndex: 0,
      display: scroll ? 'grid' : undefined,
    }),
    body: EditorStyles.body({
      backgroundColor: Color.ruby(debug),
      Absolute: scroll ? 0 : undefined,
      Scroll: scroll,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={rootRef} className={styles.body.class} />
    </div>
  );
};
