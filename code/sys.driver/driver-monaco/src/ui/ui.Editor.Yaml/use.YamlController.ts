import React from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { useYaml } from '../m.Yaml/use.Yaml.ts';

import { type t, Bus, Obj, Rx, Signal } from './common.ts';
import { useSignals } from './use.Signals.ts';

type P = Omit<t.YamlEditorProps, 'bus$'>;

export function useYamlController(bus$: t.EditorEventBus, props: P) {
  const { path, onReady } = props;

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);
  const signals = useSignals(props.signals);
  const { editor, doc, monaco } = Signal.toObject(signals);

  /**
   * Hook: CRDT.
   */
  const binding = EditorCrdt.useBinding(
    { bus$, monaco, editor, doc, path, foldMarks: true },
    (e) => {
      setReady(true);
      onReady?.(e);
    },
  );

  /**
   * Hook: YAML.
   */
  const yaml = useYaml({
    bus$,
    monaco,
    editor,
    doc,
    path,
    errorMarkers: true, // NB: display YAML parse errors inline within the code-editor.
  });

  /**
   * Effect: reset ready/spinner when CRDT document changes.
   */
  React.useEffect(() => void setReady(false), [doc?.id, Obj.hash(path)]);

  /**
   * Effect: keep YAML changes updated on Signal.
   */
  React.useEffect(() => {
    const life = Rx.disposable();
    bus$
      .pipe(Rx.takeUntil(life.dispose$), Bus.Filter.ofKind('editor:yaml:change'))
      .subscribe((e) => (signals.yaml.value = e.yaml));
    return life.dispose;
  }, [signals.yaml]);

  /**
   * API:
   */
  return { ready, signals, yaml, doc, binding } as const;
}
