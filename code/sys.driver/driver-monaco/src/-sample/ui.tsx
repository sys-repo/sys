import React from 'react';
import {
  type t,
  Color,
  css,
  D,
  Monaco,
  rx,
  Signal,
  SplitPane,
  STORAGE_KEY,
  useSizeObserver,
} from './common.ts';
import { State } from './u.state.ts';
import { MainColumn } from './ui.col.Main.tsx';

type P = t.SampleProps;

export const Sample: React.FC<P> = (props) => {
  const { debug = false, repo, signals, factory } = props;
  const doc = signals.doc.value;
  const paths = Signal.toObject(signals.paths);

  /**
   * Hooks:
   */
  const [yaml, setYaml] = React.useState<t.EditorYaml>();
  const [splitRatio, setSplitRatio] = React.useState<t.Percent>(0.3);
  const size = useSizeObserver();
  const width = size.rect?.width ?? 0;
  const showMain = size.ready && width > 920;

  /**
   * Effects:
   */
  React.useEffect(() => State.clearMain(signals), [doc?.id]); // ← Reset UI when CRDT document changes.
  Signal.useEffect(() => setYaml(signals.yaml.value));
  Signal.useEffect(() => {
    /**
     * Effect: Redraw Monitoring
     * (NB: bubble notification to alert host container to refresh).
     */
    const doc = signals.doc.value;
    const events = doc?.events();
    events?.$.subscribe((e) => props.onRequestRedraw?.());
    return events?.dispose;
  });

  let hasErrors = false;
  if (yaml?.parsed.errors.length ?? 0 > 0) hasErrors = true;

  /**
   * Handlers:
   */
  const handleDocumentChanged = React.useCallback(() => {
    State.updateMain(signals, factory.getSchema);
  }, [signals, factory]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      opacity: size.ready ? 1 : 0,
      transition: 'opacity 80ms ease',
      display: 'grid',
    }),
    left: css({
      borderRight: showMain ? `solid 1px ${Color.alpha(theme.fg, D.borderOpacity)}` : undefined,
      display: 'grid',
    }),
    right: css({
      display: 'grid',
      opacity: showMain ? 1 : 0,
      transition: 'opacity 120ms ease',
    }),
  };

  const elYamlEditor = (
    <div className={styles.left.class}>
      <Monaco.Yaml.Editor
        theme={theme.name}
        repo={repo}
        signals={{
          doc: signals.doc,
          monaco: signals.io.monaco,
          editor: signals.io.editor,
          yaml: signals.yaml,
        }}
        path={paths.yaml}
        documentId={{ localstorage: STORAGE_KEY.DEV }}
        editor={{ autoFocus: true, minimap: false }}
        onReady={(e) => {
          /**
           * Initialize Editor:
           */
          console.info(`⚡️ MonacoEditor.onReady:`, e);
          handleDocumentChanged();

          if (repo) {
            Monaco.Crdt.Link.enable(e, repo, {
              onCreate: (ev) => console.info('Monaco.Crdt.Link.enable → ⚡️ onCreate:', ev),
              until: e.dispose$,
            });
          }
        }}
        onDocumentLoaded={(e) => {
          /**
           * Monitor document changes:
           */
          const $ = e.events.path(paths.parsed).$;
          $.pipe(rx.debounceTime(300)).subscribe(handleDocumentChanged);
          handleDocumentChanged();
        }}
      />
    </div>
  );

  const elMain = showMain && (
    <div className={styles.right.class}>
      <MainColumn {...props} hasErrors={hasErrors} />
    </div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <SplitPane
        only={showMain ? undefined : 'A'}
        value={splitRatio}
        onChange={(e) => setSplitRatio(e.ratio)}
      >
        {elYamlEditor}
        {elMain}
      </SplitPane>
    </div>
  );
};
