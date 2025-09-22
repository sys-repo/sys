import React from 'react';
import { type t, Dispose, EditorFolding, rx, Time } from './common.ts';
import { EditorCrdt } from './m.Crdt.ts';

export const useBinding: t.UseEditorCrdtBinding = (args, onReady) => {
  const { editor, doc, path, foldMarks = false } = args;

  /**
   * Hooks/Refs:
   */
  const bindingRef = React.useRef<t.EditorCrdtBinding>(undefined);

  /**
   * Sub-Hooks:
   */
  EditorFolding.useFoldMarks({ editor, doc, path, enabled: foldMarks });

  /**
   * Effect: setup and tear-down the Monaco↔CRDT binding.
   */
  React.useEffect(() => {
    if (!(doc && path && editor)) return;
    const life = rx.lifecycle();
    const schedule = Time.scheduler(life, 'micro'); // lifecycle-aware micro hop

    EditorCrdt.bind(editor, doc, path, life).then((binding) => {
      if (life.disposed) return binding.dispose();
      bindingRef.current = binding;
      const dispose$ = binding.dispose$;

      // Fire onReady on a microtask so callers observe a settled binding.
      schedule(() => onReady?.({ binding, dispose$ }));
    });

    return life.dispose;
  }, [editor, doc?.id, doc?.instance, path?.join()]);

  /**
   * API:
   */
  return bindingRef.current ? Dispose.omitDispose(bindingRef.current) : undefined;
};
