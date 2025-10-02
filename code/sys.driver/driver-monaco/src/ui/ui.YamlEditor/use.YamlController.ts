import React from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { useYaml } from '../m.Yaml/use.Yaml.ts';

import { type t, Obj, Signal } from './common.ts';
import { useSignals } from './use.Signals.ts';

type P = Omit<t.YamlEditorProps, 'bus$'>;

export function useYamlController(bus$: t.EditorEventBus, props: P) {
  const { path, onReady } = props;
  const pathKey = React.useMemo(() => Obj.hash(path), [path]);

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState(false);
  const signals = useSignals(props.signals);
  const { editor, doc, monaco } = Signal.toObject(signals);

  /**
   * Hook: CRDT binding.
   */
  const handleReady = React.useCallback(
    (e: unknown) => {
      setReady(true);
      onReady?.(e as never);
    },
    [onReady],
  );
  EditorCrdt.useBinding({ bus$, monaco, editor, doc, path, foldMarks: true }, handleReady);

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
   * Effects:
   */
  React.useEffect(() => void setReady(false), [doc?.id, pathKey]); // ← Reset ready/spinner.
  React.useEffect(
    () => void (signals.yaml.value = yaml.current), // Keep YAML changes updated on Signal.
    [signals.yaml, yaml.current?.rev],
  );

  /**
   * API:
   */
  return {
    ready,
    signals,
    yaml,
    doc,
  } as const;
}
