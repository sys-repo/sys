import { useEffect, useMemo, useRef } from 'react';

import { type t, Dispose, EditorFolding, Obj, rx, Schedule, useBus } from './common.ts';
import { EditorCrdt } from './m.Crdt.ts';

export const useBinding: t.UseEditorCrdtBinding = (args, onReady) => {
  const { monaco, editor, doc, path, foldMarks = false } = args;
  const pathKey = useMemo(() => Obj.hash(path), [path]);

  /**
   * Hooks/Refs:
   */
  const bindingRef = useRef<t.EditorCrdtBinding>(undefined);
  const bus$ = useBus(args.bus$);

  /**
   * Sub-Hooks:
   */
  EditorFolding.useFoldMarks({ bus$, editor, doc, path, enabled: foldMarks });

  /**
   * Effect: setup and tear-down the Monaco↔CRDT binding.
   */
  useEffect(() => {
    if (!(doc && path && editor && monaco)) return;

    const life = rx.lifecycle();
    const schedule = Schedule.make(life, 'micro');

    EditorCrdt.bind({ editor, doc, path, bus$, until: life }).then((binding) => {
      if (life.disposed) return binding.dispose();
      bindingRef.current = binding;

      // Fire onReady on a microtask so callers observe a settled binding.
      const dispose$ = binding.dispose$;
      schedule(() => onReady?.({ editor, monaco, binding, dispose$ }));
    });

    return life.dispose;
  }, [editor, monaco, doc?.id, doc?.instance, pathKey]);

  /**
   * API:
   */
  return bindingRef.current ? Dispose.omitDispose(bindingRef.current) : undefined;
};
