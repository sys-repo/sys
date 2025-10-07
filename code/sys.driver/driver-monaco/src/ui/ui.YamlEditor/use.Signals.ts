import { useState } from 'react';
import { type t, Signal } from './common.ts';

export function useSignals(signalsInput?: Partial<t.YamlEditorSignals>) {
  /**
   * Create base signals exactly once:
   */
  const [baseSignals] = useState<t.YamlEditorSignals>(() => {
    const s = Signal.create;
    return {
      doc: s<t.CrdtRef | undefined>(),
      monaco: s<t.Monaco.Monaco | undefined>(),
      editor: s<t.Monaco.Editor | undefined>(),
      yaml: s<t.EditorYaml | undefined>(),
    };
  });

  /**
   * Merge with passed in signals:
   */
  const signals: t.YamlEditorSignals = {
    doc: signalsInput?.doc ?? baseSignals.doc,
    monaco: signalsInput?.monaco ?? baseSignals.monaco,
    editor: signalsInput?.editor ?? baseSignals.editor,
    yaml: signalsInput?.yaml ?? baseSignals.yaml,
  };

  /**
   * Effect: redraw.
   */
  Signal.useRedrawEffect(() => Signal.listen(signals));

  /**
   * API:
   */
  return signals;
}
