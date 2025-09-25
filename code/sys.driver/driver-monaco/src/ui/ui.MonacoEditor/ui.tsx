import React, { useRef } from 'react';

import type { OnChange, OnMount } from '@monaco-editor/react';
import { Editor as EditorReact } from '@monaco-editor/react';

import { type t, Color, D, Spinners, Util, css, rx } from './common.ts';
import { defaultKeyBindings } from './u.Keyboard.ts';
import { defaultLanguageConfig } from './u.languages.ts';
import { Theme } from './u.Theme.ts';

/**
 * Component:
 */
export const MonacoEditor: React.FC<t.MonacoEditorProps> = (props) => {
  const DP = D.props;
  const {
    defaultValue,
    placeholder,
    language = DP.language,
    tabSize = DP.tabSize,
    readOnly = DP.readOnly,
    minimap = DP.minimap,
    enabled = DP.enabled,
    autoFocus = DP.autoFocus,
    wordWrap = DP.wordWrap,
    wordWrapColumn = DP.wordWrapColumn,
    fontSize = DP.fontSize,
    spinning = DP.spinning,
  } = props;
  const editorTheme = Theme.toName(props.theme);
  const isPlaceholderText = typeof placeholder === 'string';

  /**
   * Refs:
   */
  const disposeRef = useRef(rx.subject<t.DisposeEvent>());
  const monacoRef = useRef<t.Monaco.Monaco>(undefined);
  const editorRef = useRef<t.Monaco.Editor>(undefined);
  const [isEmpty, setIsEmpty] = React.useState(false);

  /**
   * Hooks:
   */
  const [mounted, setMounted] = React.useState(false);

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

  /**
   * Effect: Prop Updates.
   */
  React.useEffect(() => {
    updateOptions(editorRef.current);
  }, [tabSize, readOnly, minimap, wordWrap, fontSize]);

  /**
   * Effect: End-of-life.
   */
  React.useEffect(() => {
    return () => {
      const editor = editorRef.current!;
      const monaco = monacoRef.current!;
      const dispose$ = disposeRef.current;
      dispose$.next({ reason: 'react:unmount' });
      props.onDispose?.({ editor, monaco });
    };
  }, []);

  /**
   * Effect: Auto-focus when requested.
   */
  React.useEffect(() => {
    if (mounted && autoFocus && enabled && !spinning) editorRef.current?.focus();
  }, [mounted, autoFocus, enabled, spinning]);

  /**
   * Updaters:
   */
  const getModel = (editor?: t.Monaco.Editor) => editor?.getModel();
  const updateOptions = (editor?: t.Monaco.Editor) => {
    if (!editor) return;

    editor.updateOptions({
      theme: editorTheme,
      readOnly,
      minimap: { enabled: minimap },
      wordWrap: wordWrap ? 'bounded' : 'off',
      wordWrapColumn, // ← number-characters.
      fontSize,
      detectIndentation: false,
      insertSpaces: true,
    });

    getModel(editor)?.updateOptions({
      tabSize,
      insertSpaces: true,
    });
  };

  const updateTextState = (editor?: t.Monaco.Editor) => {
    if (!editor) return;
    const text = editor.getValue();
    setIsEmpty(!text);
  };

  /**
   * Handlers:
   */
  const handleMount: OnMount = (ed, m) => {
    if (mounted) return;

    const monaco = m as t.Monaco.Monaco;
    const editor = (editorRef.current = ed);
    Theme.init(monaco);
    monacoRef.current = monaco;

    defaultKeyBindings(monaco);
    defaultLanguageConfig(monaco);
    updateOptions(editor);
    updateTextState(editor);

    const dispose$ = disposeRef.current;
    props.onMounted?.({ editor, monaco, dispose$ });
    setMounted(true);
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
      selections: Util.Editor.selections(editor),
      content: Util.Editor.content(editor),
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
    editor: css({ opacity: mounted && !spinning ? 1 : 0 }),
    empty: {
      base: css({ Absolute: 0, pointerEvents: 'none', display: 'grid' }),
      placeholderText: css({ opacity: 0.3, justifySelf: 'center', padding: 40, fontSize: 14 }),
    },
    spinning: css({
      Absolute: 0,
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elPlaceholderText = isPlaceholderText && (
    <div className={styles.empty.placeholderText.class}>{placeholder}</div>
  );

  const elEmpty = isEmpty && placeholder && (
    <div className={styles.empty.base.class}>{elPlaceholderText ?? placeholder}</div>
  );

  const elSpinning = (!mounted || spinning) && (
    <div className={styles.spinning.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const cn = Util.Editor.className(editorRef.current);
  const className = `${css(styles.base, props.style).class} ${cn}`;
  return (
    <div className={className}>
      <div className={styles.inner.class}>
        <EditorReact
          className={styles.editor.class}
          defaultLanguage={language}
          language={language}
          defaultValue={defaultValue}
          options={{ scrollbar: { useShadows: false } }}
          theme={editorTheme}
          onMount={handleMount}
          onChange={handleChange}
          loading={null}
        />
        {elSpinning}
        {elEmpty}
      </div>
    </div>
  );
};
