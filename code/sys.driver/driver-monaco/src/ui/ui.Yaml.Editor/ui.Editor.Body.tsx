import React from 'react';
import { MonacoEditor } from '../ui.MonacoEditor/mod.ts';
import { type t, Color, Cropmarks, css, D, DocumentId } from './common.ts';
import { NotReady } from './ui.NotReady.tsx';

type P = Omit<t.YamlEditorProps, 'signals'> & { signals: t.YamlEditorSignals };

/**
 * Component:
 */
export const Body: React.FC<P> = (props) => {
  const { debug = false, repo, signals, editor = {} } = props;
  const doc = signals.doc.value;

  const DOC = {
    visible: props.documentId?.visible ?? D.documentId.visible,
    readOnly: props.documentId?.readOnly ?? D.documentId.readOnly,
    localstorage: props.documentId?.localstorage,
    urlKey: props.documentId?.urlKey,
  } as const;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      overflow: 'hidden',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    documentId: css({
      height: DOC.visible ? undefined : 0,
      overflow: 'hidden',
    }),
    editor: css({ display: 'grid' }),
    debug: {
      doc: css({
        Absolute: [null, 10, -18, null],
        fontSize: 9,
        fontFamily: 'monospace',
        cursor: 'default',
        opacity: 0.2,
        ':hover': { opacity: 1 },
        transition: 'opacity 120ms ease',
      }),
    },
  };

  const elDocumentId = (
    <div className={styles.documentId.class}>
      <DocumentId.View
        background={theme.is.dark ? -0.06 : -0.04}
        theme={theme.name}
        buttonStyle={{ margin: 4 }}
        controller={{
          repo,
          signals: { doc: signals.doc },
          initial: {},
          localstorage: DOC.localstorage,
          urlKey: DOC.urlKey,
          readOnly: DOC.readOnly,
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

  // When: CRDT not loaded:
  const elNotReady = !doc && <NotReady label={''} theme={theme.name} />;
  const elDebugDoc = <div className={styles.debug.doc.class}>{`crdt:${doc?.id ?? '<none>'}`}</div>;
  const elDebug = <>{elDebugDoc}</>;

  return (
    <div className={css(styles.base, props.style).class}>
      {elDocumentId}
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        size={{
          mode: 'fill',
          margin: wrangle.cropmarksMargin(props),
        }}
      >
        <div className={styles.editor.class}>
          {elEditor || elNotReady}
          {elDebug}
        </div>
      </Cropmarks>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  cropmarksMargin(props: P) {
    const { debug = false, editor = {} } = props;
    const margin = editor.margin;
    if (!!margin) return margin;
    return debug ? 70 : 0;
  },
} as const;
