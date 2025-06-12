import React, { useRef } from 'react';

import { exampleSetup } from 'prosemirror-example-setup';
import { DOMParser as PMDOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { toAutomergeHandle } from '../../crdt/mod.ts';
import { type t, Color, css } from './common.ts';
import { useCssImports } from './use.CssImports.ts';

export const TextEditor: React.FC<t.TextEditorProps> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Hooks:
   */
  const cssImports = useCssImports();
  const editorRoot = useRef<HTMLDivElement>(null);

  /**
   * Effects:
   */
  React.useEffect(() => {
    const handle = toAutomergeHandle(doc);
    if (!handle) return;
    if (!cssImports.ready) return;
    if (editorRoot.current == null || doc?.current == null) return;

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

    const view = new EditorView(editorRoot.current, { state });

    // Finish up.
    return () => void view?.destroy();
  }, [editorRoot, doc?.instance, cssImports.ready]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      zIndex: 0,
    }),
    body: css({ Absolute: 0, Scroll: true })
      .rule('.ProseMirror', {
        height: '100%',
        outline: 'none', // NB: remove blue outline glow.
        font: 'inherit',
        whiteSpace: 'pre-wrap',
        boxSizing: 'border-box',
      })
      .rule('.ProseMirror > :first-child', {
        marginBlockStart: 0, // NB: supress first element top-margin.
      }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={editorRoot} className={styles.body.class} />
    </div>
  );
};
