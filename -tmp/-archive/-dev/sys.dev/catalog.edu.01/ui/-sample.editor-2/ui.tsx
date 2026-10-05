import React from 'react';
import {
  type t,
  Color,
  Crdt,
  css,
  Yaml,
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

type O = Record<string, unknown>;

const KEY = { INDEX: 'index', MAIN: 'main' };
const PATH = {
  INDEX: ['slug'],
  MAIN: ['slug'],
};

export const Sample: React.FC<t.Sample2Props> = (props) => {
  const { bus, signals, repo, debug = false, wordWrap = false } = props;

  /**
   * Hooks:
   */
  const [leftCtx, setLeftCtx] = React.useState<ReadyCtx>();
  const [rightCtx, setRightCtx] = React.useState<ReadyCtx>();
  const [indexDoc, setIndexDoc] = React.useState<t.Crdt.Ref>();
  const [selectedDocid, setSelectedDocid] = React.useState<string>();

  // Run combined structural + semantic validation.
  const registry = DefaultTraitRegistry;
  // const leftValidation = useSlugDiagnostics(registry, PATH.INDEX, signals.left.yaml.value);

  // Push error markers into Monaco.
  Monaco.Yaml.useYamlErrorMarkers({
    // enabled: !!ready && !!yaml?.data?.ast,
    monaco: leftCtx?.monaco,
    editor: leftCtx?.editor,
    // errors: leftValidation.diagnostics,
  });

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => void signals.right.doc.value);
  React.useEffect(() => {
    if (!selectedDocid) return void (signals.right.doc.value = undefined);
    let cancelled = false;
    (async () => {
      const { doc } = await repo.get(selectedDocid);
      if (!cancelled) signals.right.doc.value = doc;
    })();
    return () => void (cancelled = true);
  }, [selectedDocid, repo]);

  /**
   * Handlers:
   */
  function handleCursorChange(e: t.Monaco.Cursor) {
    const doc = indexDoc;
    if (!doc?.current) return;

    const yamlLens = Obj.Lens.Readonly.at<string>(PATH.INDEX);
    const yaml = yamlLens.get(doc.current) ?? '';
    const parsed = Yaml.parse<O>(yaml).data;

    const reset = () => setSelectedDocid(undefined);
    if (!Is.record(parsed)) return void reset();

    const cursorLens = Obj.Lens.Readonly.at(e.path).bind(parsed);
    const v = cursorLens.get(doc.current);

    if (Is.string(v) && v.startsWith('crdt:')) {
      const isDocid = Crdt.Is.id(v.replace(/^crdt\:/, ''));
      setSelectedDocid(isDocid ? v : undefined);
    } else {
      reset();
    }
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const elLeft = (
    <Monaco.Yaml.Editor
      bus$={bus.left$}
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={debug}
      repo={repo}
      path={PATH.INDEX}
      signals={signals.left}
      editor={{
        autoFocus: true,
        debounce: 150,
        wordWrap,
      }}
      documentId={{
        storageKey: `${STORAGE_KEY.DEV}.${KEY.INDEX}`,
        urlKey: KEY.INDEX,
      }}
      onCursor={(e) => handleCursorChange(e)}
      onDocumentLoaded={(e) => setIndexDoc(e.doc)}
      onReady={(e) => {
        const { monaco, editor } = e;
        signals.left.editor.value = editor;
        setLeftCtx({ monaco, editor });
        if (repo) Monaco.Crdt.Link.enable({ monaco, editor }, repo, e.dispose$);
      }}
    />
  );

  const elRight = (
    <Monaco.Yaml.Editor
      bus$={bus.right$}
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={debug}
      repo={repo}
      path={PATH.MAIN}
      signals={signals.right}
      editor={{
        enabled: !!signals.right.doc.value,
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
        signals.right.editor.value = editor;
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
        {elLeft}
        {elRight}
      </SplitPane>
    </div>
  );
};
