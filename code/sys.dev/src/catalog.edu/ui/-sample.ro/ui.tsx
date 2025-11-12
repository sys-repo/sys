import type { DebugSignals } from './-spec/-SPEC.Debug.tsx';

import React from 'react';
import {
  type t,
  Color,
  Crdt,
  css,
  Is,
  Monaco,
  Obj,
  Signal,
  SplitPane,
  STORAGE_KEY,
} from './common.ts';

type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

const KEY = { INDEX: 'index', MAIN: 'main' };
const PATH = {
  INDEX: ['slug'],
  MAIN: ['slug'],
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const repo = debug.repo;

  const v = Signal.toObject(debug.props);
  const docSignal = Signal.useSignal<t.Crdt.Ref | undefined>();

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => void docSignal.value);
  const [indexDoc, setIndexDoc] = React.useState<t.Crdt.Ref>();
  const [selectedDocid, setSelectedDocid] = React.useState<string>();

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!selectedDocid) {
      docSignal.value = undefined;
      return;
    }

    let cancelled = false;

    (async () => {
      const { doc } = await repo.get(selectedDocid);
      if (!cancelled) docSignal.value = doc;
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
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  const elIndex = (
    <Monaco.Yaml.Editor
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={v.debug}
      repo={repo}
      path={PATH.INDEX}
      editor={{ autoFocus: true, debounce: 150 }}
      documentId={{
        localstorage: `${STORAGE_KEY.DEV}.${KEY.INDEX}`,
        urlKey: KEY.INDEX,
      }}
      onDocumentLoaded={(e) => setIndexDoc(e.doc)}
      onCursor={(e) => handleCursorChange(e)}
      onReady={(e) => {
        const { monaco, editor } = e;
        if (repo) Monaco.Crdt.Link.enable({ monaco, editor }, repo, e.dispose$);
      }}
    />
  );

  const elMain = (
    <Monaco.Yaml.Editor
      diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
      theme={theme.name}
      debug={v.debug}
      repo={repo}
      path={PATH.MAIN}
      signals={{ doc: docSignal }}
      editor={{
        enabled: !!docSignal.value,
        autoFocus: false,
        debounce: 150,
      }}
      documentId={{
        visible: false,
        localstorage: `${STORAGE_KEY.DEV}.${KEY.MAIN}`,
        urlKey: KEY.MAIN,
        readOnly: true,
      }}
      onReady={(e) => {
        const { monaco, editor } = e;
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
