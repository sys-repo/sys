import React from 'react';
import { EditorCrdt } from '../m.Crdt/mod.ts';
import { useYaml } from '../m.Yaml/use.Yaml.ts';

import { type t, D, Obj, Signal } from './common.ts';
import { normalizeSourcePath } from './u.ts';
import { useSignals } from './use.Signals.ts';

type P = Omit<t.YamlEditorProps, 'bus$'>;

export function useYamlController(bus$: t.EditorEventBus, props: P) {
  const { onReady, diagnostics = D.diagnostics, path } = props;
  const sourcePath = normalizeSourcePath(props.path);
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
  EditorCrdt.useBinding({ bus$, monaco, editor, doc, foldMarks: true, path: sourcePath }, (e) => {
    setReady(true);
    onReady?.(e);
  });

  /**
   * Hook: YAML.
   */
  const debounce = props.editor?.debounce ?? D.debounce;
  const errorMarkers = diagnostics === 'syntax'; // NB: display YAML parse errors inline within the code-editor.
  const yaml = useYaml({ bus$, monaco, editor, doc, path, debounce, errorMarkers });

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
