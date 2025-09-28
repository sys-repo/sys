import { useEffect, useMemo, useRef } from 'react';
import { Dispose, EditorFolding, Fn, Obj, Rx, Schedule, type t, useBus } from './common.ts';
import { EditorCrdt } from './m.Crdt.ts';

export const useBinding: t.UseEditorCrdtBinding = (args, onReady) => {
  const { monaco, editor, doc, path, foldMarks = false } = args;
  const pathKey = useMemo(() => Obj.hash(path), [path]);

  /**
   * Refs:
   */
  const bindingRef = useRef<t.EditorCrdtBinding>(undefined);
  const bus$ = useBus(args.bus$);

  /**
   * Hooks:
   */
  EditorFolding.useFoldMarks({ bus$, editor, doc, path, enabled: foldMarks });

  /**
   * Effect: Monaco ↔ CRDT binding
   */
  useEffect(() => {
    if (!(doc && path && editor && monaco)) return;
    const life = Rx.lifecycle();

    EditorCrdt.bind({ editor, doc, path, bus$ }, life).then((binding) => {
      if (life.disposed) return binding.dispose();
      bindingRef.current = binding;

      const dispose$ = binding.dispose$;
      const fireReadyOnce = Fn.onceOnly(() => {
        const fire = () => onReady?.({ editor, monaco, binding, dispose$ });
        Schedule.queue(fire, 'micro', life);
      });

      if (!foldMarks) {
        // No folding to wait for: signal ready next microtask.
        fireReadyOnce();
        return;
      }

      // Wait for the first stable hidden-areas snapshot before ready.
      const obs = EditorFolding.observe({ editor, bus$ }, life);
      obs.$.pipe(
        Rx.filter((e) => !!e.initial),
        Rx.take(1),
      ).subscribe(fireReadyOnce);
    });

    return life.dispose;
  }, [editor, monaco, doc?.id, doc?.instance, pathKey, foldMarks]);

  // API
  return bindingRef.current ? Dispose.omitDispose(bindingRef.current) : undefined;
};
