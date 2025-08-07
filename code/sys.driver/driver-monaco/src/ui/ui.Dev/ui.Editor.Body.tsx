import React from 'react';
import { MonacoEditor } from '../ui.MonacoEditor/mod.ts';
import { type t, Color, Cropmarks, css, DocumentId } from './common.ts';

type P = t.DevEditorProps;

/**
 * Component:
 */
export const Body: React.FC<P> = (props) => {
  const { debug = false, repo, signals, localstorage, editor = {} } = props;
  const margin = editor.margin ?? 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    editor: css({ display: 'grid' }),
  };

  const elCrdt = (
    <DocumentId.View
      background={theme.is.dark ? -0.06 : -0.04}
      theme={theme.name}
      buttonStyle={{ margin: 4 }}
      controller={{
        repo,
        signals: { doc: signals?.doc },
        initial: { text: '' },
        localstorage,
      }}
    />
  );

  const elEditor = (
    <MonacoEditor
      debug={debug}
      theme={theme.name}
      language={editor.language}
      autoFocus={editor.autoFocus}
      tabSize={editor.tabSize}
      minimap={editor.minimap}
      readOnly={editor.readOnly}
      onReady={(e) => {
        if (signals?.monaco) signals.monaco.value = e.monaco;
        if (signals?.editor) signals.editor.value = e.editor;
        props.onReady?.(e);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCrdt}
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        size={{ mode: 'fill', margin, x: true, y: true }}
      >
        <div className={styles.editor.class}>{elEditor}</div>
      </Cropmarks>
    </div>
  );
};
