import React from 'react';

import { type t, Color, css, D, Monaco, rx, Signal } from './common.ts';
import { updateMain } from './u.updateState.ts';
import { EditorsColumn } from './ui.col.Editor.tsx';
import { MainColumn } from './ui.col.Main.tsx';

type P = t.SampleProps;

export const Sample: React.FC<P> = (props) => {
  const { debug = false, signals } = props;

  const editor = signals.io.editor.value;
  const monaco = signals.io.monaco.value;
  const doc = signals.doc.value;
  const path = Signal.toObject(signals.path);

  /**
   * Effect: Redraw Monitoring
   * (NB: bubble notification to alert host container to refresh).
   */
  Signal.useEffect(() => {
    const life = rx.abortable();
    const doc = signals.doc.value;
    doc?.events(life).$.subscribe((e) => props.onRequestRedraw?.());
    return life.dispose;
  });

  /**
   * Hooks:
   */
  Monaco.Crdt.useBinding({ editor, doc, path: path.yaml, foldMarks: true }, (e) => {
    const run = () => updateMain(signals);
    e.binding.$.pipe(rx.debounceTime(300)).subscribe(run);
    run();
  });

  const yaml = Monaco.Yaml.useYaml({
    monaco,
    editor,
    doc,
    path: { source: path.yaml, target: path.parsed },
    errorMarkers: true, // NB: display YAML parse errors inline in the code-editor.
  });

  let hasErrors = false;
  if (yaml.parsed.errors.length > 0) hasErrors = true;

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

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>
        <EditorsColumn {...props} yaml={yaml} />
      </div>
      <div className={styles.right.class}>
        <MainColumn {...props} hasErrors={hasErrors} />
      </div>
    </div>
  );
};
