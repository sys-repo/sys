import { useEffect } from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { useYaml } from '../m.Yaml/use.Yaml.ts';

import { type t, Rx, Signal } from './common.ts';
import { useSignals } from './use.Signals.ts';

type P = Omit<t.YamlEditorProps, 'bus$'>;

export function useYamlController(bus$: t.EditorEventBus, props: P) {
  const { path } = props;

  /**
   * Hook: Signals.
   */
  const signals = useSignals(props.signals);
  const { editor, doc, monaco } = Signal.toObject(signals);

  /**
   * Hook: CRDT.
   */
  const binding = EditorCrdt.useBinding(
    { bus$, monaco, editor, doc, path, foldMarks: true },
    props.onReady,
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
   * Effect:
   */
  useEffect(() => {
    const life = Rx.disposable();
    const $ = bus$.pipe(
      Rx.takeUntil(life.dispose$),
      Rx.filter((e) => e.kind === 'yaml:change'),
    );
    $.subscribe((e) => (signals.yaml.value = e.yaml));
    return life.dispose;
  }, [bus$, signals.yaml]);

  /**
   * API:
   */
  return { signals, yaml, doc, binding } as const;
}
