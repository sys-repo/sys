import { EditorCrdt } from '../m.Crdt/mod.ts';
import { useYaml } from '../m.Yaml/use.Yaml.ts';

import { type t, Signal } from './common.ts';
import { useSignals } from './use.Signals.ts';

type P = t.YamlEditorProps;

export function useController(props: P) {
  const { path } = props;

  /**
   * Hooks: Signals.
   */
  const signals = useSignals(props.signals);
  const { editor, doc, monaco } = Signal.toObject(signals);

  /**
   * Hook: CRDT.
   */
  EditorCrdt.useBinding({ editor, doc, path, foldMarks: true }, (e) => {
    //
  });

  /**
   * Hook: YAML.
   */
  const yaml = useYaml({
    monaco,
    editor,
    doc,
    path,
    errorMarkers: true, // NB: display YAML parse errors inline within the code-editor.
  });

  /**
   * API:
   */
  return { signals, yaml, doc } as const;
}
