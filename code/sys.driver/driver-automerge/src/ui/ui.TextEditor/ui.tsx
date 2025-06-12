import React, { useRef } from 'react';

import { exampleSetup } from 'prosemirror-example-setup';
import { DOMParser as PMDOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { toAutomergeHandle } from '../../crdt/mod.ts';
import { type t, Color, css, D } from './common.ts';
import { useCssImports } from './use.CssImports.ts';

/**
 * https://fonts.google.com/specimen/Cormorant+Garamond
 */
export const Headline = {
  DmSerif: {
    regular: css({ fontFamily: '"DM Serif Display", serif', fontWeight: 400, fontStyle: 'normal' }),
    italic: css({ fontFamily: '"DM Serif Display", serif', fontWeight: 400, fontStyle: 'italic' }),
  },
};

export const TextEditor: React.FC<t.TextEditorProps> = (props) => {
  const { doc, readOnly: disabled = D.disabled, debug = false } = props;

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
   * Effect: sync/readOnly.
   */
  React.useEffect(() => {
    if (editor) editor.setProps({ editable: () => !props.readOnly });
  }, [editor, props.readOnly]);

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
      })
      .rule('.ProseMirror > H1', {
        fontSize: '4.3em',
        ...Headline.DmSerif.regular.style,
      }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div ref={rootRef} className={styles.body.class} />
    </div>
  );
};
