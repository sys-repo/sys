import React from 'react';

import { type t, Dispose, EditorFolding, Obj, Rx, useBus } from './common.ts';
import { EditorCrdt } from './m.Crdt.ts';
import { monitorReady } from './use.CrdtBinding.ready.ts';

export const useCrdtBinding: t.UseEditorCrdtBinding = (args, onReady) => {
  const { monaco, editor, doc, path, foldMarks = false } = args;
  const pathKey = React.useMemo(() => Obj.hash(path), [path]);

  /**
   * Refs/Hooks:
   */
  const bindingRef = React.useRef<t.EditorCrdtBinding>(undefined);
  const bus$ = useBus(args.bus$);

  // Keep latest onReady without re-running effects
  const onReadyRef = React.useRef<t.EditorCrdtBindingReadyHandler | undefined>(onReady);
  onReadyRef.current = onReady;

  /**
   * Effect: Monaco ↔ CRDT binding
   */
  React.useEffect(() => {
    if (!(doc && path && editor && monaco)) return;
    const life = Rx.lifecycle();

    // Monitor for <ready> state:
    monitorReady({ bus$, life, foldMarks, editor, monaco, onReadyRef });

    // Start binding:
    EditorCrdt.bind({ editor, doc, path, bus$ }, life).then((binding) => {
      if (life.disposed) return void binding.dispose();
      bindingRef.current = binding;
    });

    return life.dispose;
  }, [editor, monaco, doc?.id, doc?.instance, pathKey, foldMarks]);

  /**
   * Start child behaviors:
   */
  EditorFolding.useFoldMarks({ bus$, editor, doc, path, enabled: foldMarks });

  /**
   * API:
   */
  return bindingRef.current ? Dispose.omitDispose(bindingRef.current) : undefined;
};
