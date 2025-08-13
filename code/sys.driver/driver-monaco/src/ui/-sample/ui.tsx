import React from 'react';
import { type t, Color, css, D, Monaco, rx, Signal, STORAGE_KEY } from './common.ts';
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
      display: 'grid',
      gridTemplateColumns: 'minmax(350px, 0.382fr) 0.618fr',
    }),
    left: css({
      borderRight: `solid 1px ${Color.alpha(theme.fg, D.borderOpacity)}`,
      display: 'grid',
    }),
    right: css({
      display: 'grid',
    }),
  };

  const elYamlEditor = (
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
      onReady={async (e) => {
        /**
         * Initialize Editor:
         */
        console.info(`⚡️ MonacoEditor.onReady:`, e);

        // 🐷 WIP | Insert for "crdt:id/path" link behavior:
        const { sampleInterceptLink } = await import('../../ui/m.Crdt/-spec/-u.link.ts');
        sampleInterceptLink(e);

        handleDocumentChanged();
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
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>{elYamlEditor}</div>
      <div className={styles.right.class}>
        <MainColumn {...props} hasErrors={hasErrors} />
      </div>
    </div>
  );
};
