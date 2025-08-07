import React from 'react';
import { MonacoEditor } from '../ui.MonacoEditor/mod.ts';

import { type t, Color, Cropmarks, css, DocumentId, D } from './common.ts';
import { NotReady } from './ui.NotReady.tsx';

type P = Omit<t.DevEditorProps, 'signals'> & { signals: t.DevEditorSignals };

/**
 * Component:
 */
export const Body: React.FC<P> = (props) => {
  const { debug = false, repo, signals, localstorage, editor = {}, docid = {} } = props;
  const margin = editor.margin ?? 0;
  const doc = signals.doc.value;
  const docidVisible = docid.visible ?? D.docid.visible;
  const docidReadOnly = docid.readOnly ?? D.docid.readOnly;

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
    docid: css({
      height: docidVisible ? undefined : 0,
      overflow: 'hidden',
    }),
    editor: css({ display: 'grid' }),
  };

  const elCrdt = (
    <div className={styles.docid.class}>
      <DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        readOnly={docidReadOnly}
        controller={{
          repo,
          signals: { doc: signals.doc },
          initial: { text: '' },
          localstorage,
        }}
      />
    </div>
  );

  const elEditor = doc && (
    <MonacoEditor
      debug={debug}
      theme={theme.name}
      language={'yaml'}
      autoFocus={editor.autoFocus}
      tabSize={editor.tabSize}
      minimap={editor.minimap}
      readOnly={editor.readOnly}
      onReady={(e) => {
        if (signals?.monaco) signals.monaco.value = e.monaco;
        if (signals?.editor) signals.editor.value = e.editor;
        props.onReady?.(e);
      }}
      onDispose={() => {
        if (signals?.monaco) signals.monaco.value = undefined;
        if (signals?.editor) signals.editor.value = undefined;
      }}
    />
  );

  const elNotReady = !doc && <NotReady label={'CRDT not loaded'} theme={theme.name} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elCrdt}
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        size={{ mode: 'fill', margin, x: true, y: true }}
      >
        <div className={styles.editor.class}>{elEditor || elNotReady}</div>
      </Cropmarks>
    </div>
  );
};
