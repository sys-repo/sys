import React from 'react';
import { type t, Dispose, EditorFolding, rx, Time } from './common.ts';
import { EditorCrdt } from './m.Crdt.ts';

export const useBinding: t.UseEditorCrdtBinding = (args, onReady) => {
  const { editor, doc, path, foldMarks = false } = args;

  /**
   * Hooks/Refs:
   */
  const bindingRef = React.useRef<t.EditorCrdtBinding>(undefined);
  const busRef$ = React.useRef<t.Subject<t.EditorBindingEvent>>(rx.subject());
  const bus$ = busRef$.current;

  /**
   * Sub-Hooks:
   */
  EditorFolding.useFoldMarks({ editor, doc, path, bus$, enabled: foldMarks });

  /**
   * Effect: setup and tear-down the Monaco↔CRDT binding.
   */
  React.useEffect(() => {
    if (!(doc && path && editor)) return;
    const life = rx.lifecycle();
    const schedule = Time.scheduler(life, 'micro');

    EditorCrdt.bind({ editor, doc, path, bus$, until: life }).then((binding) => {
      if (life.disposed) return binding.dispose();
      bindingRef.current = binding;

      // Fire onReady on a microtask so callers observe a settled binding.
      const dispose$ = binding.dispose$;
      schedule(() => onReady?.({ binding, dispose$ }));
    });

    return life.dispose;
  }, [editor, doc?.id, doc?.instance, path?.join()]);

  /**
   * API:
   */
  return bindingRef.current ? Dispose.omitDispose(bindingRef.current) : undefined;
};
