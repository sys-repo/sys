import { useState } from 'react';
import { type t, Signal } from './common.ts';

export function useSignals(signalsInput?: Partial<t.YamlEditorSignals>) {
  /**
   * Create base signals exactly once:
   */
  const [baseSignals] = useState<t.YamlEditorSignals>(() => {
    return {
      doc: Signal.create<t.Crdt.Ref | undefined>(),
      monaco: Signal.create<t.Monaco.Monaco | undefined>(),
      editor: Signal.create<t.Monaco.Editor | undefined>(),
    };
  });

  /**
   * Merge with passed in signals:
   */
  const signals: t.YamlEditorSignals = {
    doc: signalsInput?.doc ?? baseSignals.doc,
    monaco: signalsInput?.monaco ?? baseSignals.monaco,
    editor: signalsInput?.editor ?? baseSignals.editor,
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
