import type { OnChange, OnMount } from '@monaco-editor/react';

import { Editor as EditorReact } from '@monaco-editor/react';
import React from 'react';

import { EditorCarets } from '../m.Editor.Carets/mod.ts';
import { type t, Color, D, Spinners, Wrangle, css, rx } from './common.ts';
import { Theme } from './u.Theme.ts';

/**
 * Component:
 */
export const MonacoEditor: React.FC<t.MonacoEditorProps> = (props) => {
  const {
    defaultValue,
    language = D.props.language,
    tabSize = D.props.tabSize,
    readOnly = D.props.readOnly,
    minimap = D.props.minimap,
    enabled = D.props.enabled,
    autoFocus = D.props.autoFocus,
    placeholder,
  } = props;
  const editorTheme = Theme.toName(props.theme);
  const isPlaceholderText = typeof placeholder === 'string';

  /**
   * Refs:
   */
  const readyRef = React.useRef(false);
  const disposeRef = React.useRef(rx.subject<void>());
  const monacoRef = React.useRef<t.Monaco>();
  const editorRef = React.useRef<t.MonacoCodeEditor>();
  const [isEmpty, setIsEmpty] = React.useState(false);

  /**
   * Effect: Lifecycle.
   */
  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor || defaultValue === undefined) return;
    if (defaultValue !== editor.getValue()) {
      editor.setValue(defaultValue ?? '');
    }
    updateTextState(editor);
  }, [defaultValue, editorRef.current]);

  React.useEffect(() => {
    updateOptions(editorRef.current);
  }, [tabSize, readOnly, minimap]);

  /**
   * Effect: End-of-life.
   */
  React.useEffect(() => {
    return () => {
      const editor = editorRef.current!;
      const monaco = monacoRef.current!;
      const dispose$ = disposeRef.current;
      dispose$.next();
      props.onDispose?.({ editor, monaco });
    };
  }, []);

  /**
   * Effect: Auto-focus when requested.
   */
  React.useEffect(() => {
    const ready = readyRef.current;
    if (autoFocus && enabled && ready) editorRef.current?.focus();
  }, [readyRef.current, autoFocus, enabled]);

  /**
   * Updaters:
   */
  const getModel = (editor?: t.MonacoCodeEditor) => editor?.getModel();
  const updateOptions = (editor?: t.MonacoCodeEditor) => {
    if (!editor) return;
    editor.updateOptions({
      theme: editorTheme,
      readOnly,
      minimap: { enabled: minimap },
    });
    getModel(editor)?.updateOptions({ tabSize });
  };

  const updateTextState = (editor?: t.MonacoCodeEditor) => {
    if (!editor) return;
    const text = editor.getValue();
    setIsEmpty(!text);
  };

  /**
   * Handlers:
   */
  const handleMount: OnMount = (ed, m) => {
    const monaco = m as t.Monaco;
    Theme.init(monaco);
    monacoRef.current = monaco;

    const editor = (editorRef.current = ed);
    updateOptions(editor);
    updateTextState(editor);

    let _carets: t.EditorCarets;
    const dispose$ = disposeRef.current;
    props.onReady?.({
      editor,
      monaco,
      dispose$,
      get carets() {
        return _carets || (_carets = EditorCarets.create(editor));
      },
    });
    readyRef.current = true;
  };

  const handleChange: OnChange = (text = '', event) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!props.onChange || !editor || !monaco) return;
    updateTextState(editor);

    props.onChange({
      event,
      monaco,
      editor,
      selections: Wrangle.Editor.selections(editor),
      content: Wrangle.Editor.content(editor),
    });
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      pointerEvents: enabled ? 'auto' : 'none',
      opacity: enabled ? 1 : 0.2,
    }),
    inner: css({ Absolute: 0 }),
    empty: {
      base: css({ Absolute: 0, pointerEvents: 'none', display: 'grid' }),
      placeholderText: css({ opacity: 0.3, justifySelf: 'center', padding: 40, fontSize: 14 }),
    },
  };

  const elPlaceholderText = isPlaceholderText && (
    <div className={styles.empty.placeholderText.class}>{placeholder}</div>
  );

  const elEmpty = isEmpty && placeholder && (
    <div className={styles.empty.base.class}>{elPlaceholderText ?? placeholder}</div>
  );

  const elLoading = <Spinners.Bar theme={theme.name} />;

  const cn = Wrangle.Editor.className(editorRef.current);
  const className = `${css(styles.base, props.style).class} ${cn}`;
  return (
    <div className={className}>
      <div className={styles.inner.class}>
        <EditorReact
          defaultLanguage={language}
          language={language}
          defaultValue={defaultValue}
          theme={editorTheme}
          loading={elLoading}
          onMount={handleMount}
          onChange={handleChange}
        />
        {elEmpty}
      </div>
    </div>
  );
};
