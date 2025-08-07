import React from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { EditorYaml } from '../m.Yaml/mod.ts';

import { type t, Color, css, Signal } from './common.ts';
import { Body } from './ui.Editor.Body.tsx';
import { NotReady } from './ui.NotReady.tsx';

type P = t.DevEditorProps;

export const DevEditor: React.FC<P> = (props) => {
  const { debug = false, repo, path } = props;

  // Create base signals exactly once:
  const [baseSignals] = React.useState<t.DevEditorSignals>(() => {
    return {
      doc: Signal.create<t.Crdt.Ref | undefined>(),
      monaco: Signal.create<t.Monaco.Monaco | undefined>(),
      editor: Signal.create<t.Monaco.Editor | undefined>(),
    };
  });
  // Merge with passed in signals:
  const signals: t.DevEditorSignals = {
    doc: props.signals?.doc ?? baseSignals.doc,
    monaco: props.signals?.monaco ?? baseSignals.monaco,
    editor: props.signals?.editor ?? baseSignals.editor,
  };

  const doc = signals.doc.value;
  const editor = signals.editor.value;
  const monaco = signals.monaco.value;

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => Signal.listen(signals));
  EditorCrdt.useBinding({ editor, doc, path, foldMarks: true }, (e) => {});
  const yaml = EditorYaml.useYaml({
    monaco,
    editor,
    doc,
    path,
    errorMarkers: true, // NB: display YAML parse errors inline in the code-editor.
  });

  let hasErrors = false;
  if (yaml.parsed.errors.length > 0) hasErrors = true;

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!doc) return;
    props.onDocumentChange?.({ doc });
  }, [doc?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
  };

  const elNoRepo = !repo && <NotReady theme={theme.name} label={'No CRDT repository.'} />;
  const elNoPath = !path && <NotReady theme={theme.name} label={'No document path.'} />;
  const elError = elNoRepo || elNoPath;

  return (
    <div className={css(styles.base, props.style).class}>
      {elError || <Body {...props} signals={signals} />}
    </div>
  );
};
