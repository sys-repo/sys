import type { DebugSignals } from './-spec/-SPEC.Debug.tsx';

import React from 'react';
import {
  type t,
  Color,
  Crdt,
  css,
  DefaultTraitRegistry,
  Is,
  Monaco,
  Obj,
  Signal,
  useSlugDiagnostics,
  SplitPane,
  STORAGE_KEY,
} from './common.ts';

type ReadyCtx = { monaco: t.Monaco.Monaco; editor: t.Monaco.Editor };

const KEY = { INDEX: 'index', MAIN: 'main' };
const PATH = {
  INDEX: ['slug'],
  MAIN: ['slug'],
};

export const Sample: React.FC<t.Sample2Props> = (props) => {
  const { repo, debug = false, wordWrap = false } = props;

  const signals = {
    index: {
      doc: Signal.useSignal<t.Crdt.Ref | undefined>(),
      yaml: Signal.create<t.EditorYaml | undefined>(),
    },
    main: {
      doc: Signal.useSignal<t.Crdt.Ref | undefined>(),
      yaml: Signal.create<t.EditorYaml | undefined>(),
    },
  } as const;

  // 🐷
  Signal.useEffect(() => {
    console.log('signals.index.yaml', signals.index.yaml.value);
  });

  /**
   * Hooks:
   */
  const [leftCtx, setLeftCtx] = React.useState<ReadyCtx>();
  const [rightCtx, setRightCtx] = React.useState<ReadyCtx>();
  const [indexDoc, setIndexDoc] = React.useState<t.Crdt.Ref>();
  const [selectedDocid, setSelectedDocid] = React.useState<string>();

  // Run combined structural + semantic validation.
  const registry = DefaultTraitRegistry;
  const leftValidation = useSlugDiagnostics(registry, PATH.INDEX, signals.index.yaml.value);

  // Push error markers into Monaco.
  Monaco.Yaml.useYamlErrorMarkers({
    // enabled: !!ready && !!yaml?.data?.ast,
    monaco: leftCtx?.monaco,
    editor: leftCtx?.editor,
    errors: leftValidation.diagnostics,
  });

  Signal.useEffect(() => {
    console.log('signals.index.doc.value', signals.index.doc.value);
    console.log('signals.index.yaml.value', signals.index.yaml.value);
  });

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => void signals.main.doc.value);
  React.useEffect(() => {
    if (!selectedDocid) return void (signals.main.doc.value = undefined);
    let cancelled = false;
    (async () => {
      const { doc } = await repo.get(selectedDocid);
      if (!cancelled) signals.main.doc.value = doc;
    })();
    return () => void (cancelled = true);
  }, [selectedDocid, repo]);

  /**
   * Handlers:
   */
  function handleCursorChange(e: t.Monaco.Cursor) {
    const doc = indexDoc;
    if (!doc?.current) return;

    const root = Obj.Path.appendSuffix(PATH.INDEX, '.parsed');
    const lens = Obj.Lens.Readonly.at<string>(root, e.path).bind(doc.current);
    let v = lens.get();

    if (Is.string(v) && v.startsWith('crdt:')) {
      const isDocid = Crdt.Is.id(v.replace(/^crdt\:/, ''));
      setSelectedDocid(isDocid ? v : undefined);
    } else {
      setSelectedDocid(undefined);
    }
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const elIndex = (
    <Monaco.Yaml.Editor
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={debug}
      repo={repo}
      path={PATH.INDEX}
      signals={signals.index}
      editor={{
        autoFocus: true,
        debounce: 150,
        wordWrap,
      }}
      documentId={{
        storageKey: `${STORAGE_KEY.DEV}.${KEY.INDEX}`,
        urlKey: KEY.INDEX,
      }}
      onDocumentLoaded={(e) => setIndexDoc(e.doc)}
      onCursor={(e) => handleCursorChange(e)}
      onReady={(e) => {
        const { monaco, editor } = e;
        setLeftCtx({ monaco, editor });
        if (repo) Monaco.Crdt.Link.enable({ monaco, editor }, repo, e.dispose$);
      }}
    />
  );

  const elMain = (
    <Monaco.Yaml.Editor
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={debug}
      repo={repo}
      path={PATH.MAIN}
      signals={signals.main}
      editor={{
        enabled: !!signals.main.doc.value,
        autoFocus: false,
        debounce: 150,
        wordWrap,
      }}
      documentId={{
        visible: false,
        storageKey: `${STORAGE_KEY.DEV}.${KEY.MAIN}`,
        urlKey: KEY.MAIN,
        readOnly: true,
      }}
      onReady={(e) => {
        const { monaco, editor } = e;
        setRightCtx({ monaco, editor });
        if (repo) Monaco.Crdt.Link.enable({ monaco, editor }, repo, e.dispose$);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <SplitPane
        theme={theme.name}
        onDragStart={(e) => console.info(`⚡️ SplitPane:onDragStart`, e)}
        onDragEnd={(e) => console.info(`⚡️ SplitPane:onDragEnd`, e)}
        onChange={(e) => console.info(`⚡️ SplitPane:onChange`, e)}
      >
        {elIndex}
        {elMain}
      </SplitPane>
    </div>
  );
};
