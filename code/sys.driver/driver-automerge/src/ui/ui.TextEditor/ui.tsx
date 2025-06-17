import React, { useRef } from 'react';

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

/**
 * @sys:
 */
import { type t, Color, css, D, toAutomergeHandle } from './common.ts';
import { EditorStyles } from './u.styles.ts';
import { useCssImports } from './use.CssImports.ts';

export const TextEditor: React.FC<t.TextEditorProps> = (props) => {
  const {
    doc,
    readOnly = D.readOnly,
    scroll = D.scroll,
    singleLine = D.singleLine,
    debug = false,
  } = props;

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


    /**
     * Refs:
     *    https://automerge.org/docs/cookbook/rich-text-prosemirror-vanilla/
     *    https://automerge.org/docs/cookbook/rich-text-prosemirror-react/
     */
    const automerge = automergeInit(handle!, ['text']);
    const schema = basicSchema;
    const plugins = exampleSetup({
      schema,
      menuBar: false,
      mapKeys: {
        Escape: false, // ← remove the default ESC binding
      },
    });
    plugins.push(automerge.plugin);

    const state = EditorState.create({
      schema,
      plugins,
      doc: automerge.pmDoc,
    });

    const view = new EditorView(rootRef.current, {
      state,
      handleKeyDown(_view, e) {
        let handled = false;
        if (e.key === 'Enter' && singleLine) handled = true; // NB: suppress-new line characters when in "single-line" mode.
        return handled;
      },
    });
    setEditor(view);

    // Finish up.
    return () => {
      view?.destroy();
      setEditor(undefined);
    };
  }, [rootRef, doc?.instance, cssImports.ready, singleLine]);

  /**
   * Effect: sync/autoFocus.
   */
  React.useEffect(() => {
    if (props.autoFocus) editor?.focus?.();
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
