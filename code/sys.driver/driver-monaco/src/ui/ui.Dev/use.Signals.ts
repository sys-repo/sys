import { useState } from 'react';
import { type t, Signal } from './common.ts';

export function useSignals(input?: Partial<t.DevEditorSignals>) {
  /**
   * Create base signals exactly once:
   */
  const [baseSignals] = useState<t.DevEditorSignals>(() => {
    return {
      doc: Signal.create<t.Crdt.Ref | undefined>(),
      monaco: Signal.create<t.Monaco.Monaco | undefined>(),
      editor: Signal.create<t.Monaco.Editor | undefined>(),
    };
  });

  /**
   * Merge with passed in signals:
   */
  const signals: t.DevEditorSignals = {
    doc: input?.doc ?? baseSignals.doc,
    monaco: input?.monaco ?? baseSignals.monaco,
    editor: input?.editor ?? baseSignals.editor,
  };

  /**
   * Effect: redraw.
   */
  Signal.useRedrawEffect(() => Signal.listen(signals));

  /**
   * API:
   */
  const doc = signals.doc.value;
  const editor = signals.editor.value;
  const monaco = signals.monaco.value;
  return {
    signals,
    doc,
    editor,
    monaco,
  } as const;
}
