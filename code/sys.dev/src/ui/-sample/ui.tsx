import React from 'react';
import {
  type t,
  Color,
  css,
  D,
  Monaco,
  Rx,
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
  const [splitRatio, setSplitRatio] = React.useState<t.Percent>(0.3); // left pane ratio
  const size = useSizeObserver();
  const width = size.rect?.width ?? 0;
  const showMain = size.ready && width > 920;

  /**
   * Effects:
   */
  React.useEffect(() => State.clearMain(signals), [doc?.id]); // reset UI when CRDT doc changes
  Signal.useEffect(() => setYaml(signals.yaml.value));
  Signal.useEffect(() => {
    const d = signals.doc.value;
    const events = d?.events();
    events?.$.subscribe(() => props.onRequestRedraw?.());
    return events?.dispose;
  });

  const hasErrors = (yaml?.data?.errors.length ?? 0) > 0;

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
          const $ = e.events.path(paths.parsed).$;
          $.pipe(Rx.debounceTime(300)).subscribe(handleDocumentChanged);
          handleDocumentChanged();
        }}
      />
    </div>
  );

  const elMain = (
    <div className={styles.right.class}>
      <MainColumn {...props} hasErrors={hasErrors} />
    </div>
  );

  // Controlled value as ratios [left, right]:
  const ratios = [splitRatio, 1 - splitRatio] as const;

  // Collapse to YAML-only when the main column shouldn't render:
  const onlyIndex: t.Index | undefined = showMain ? undefined : 0;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <SplitPane
        debug={debug}
        orientation="horizontal"
        gutter={8}
        value={ratios as unknown as t.Percent[]}
        onlyIndex={onlyIndex}
        onChange={(e) => {
          // Keep left pane as source of truth for our scalar:
          const nextLeft = e.ratios[0] ?? splitRatio;
          setSplitRatio(nextLeft);
        }}
      >
        {[elYamlEditor, elMain]}
      </SplitPane>
    </div>
  );
};
