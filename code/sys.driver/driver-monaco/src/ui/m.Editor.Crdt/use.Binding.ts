import React, { useRef } from 'react';

import { type t, rx } from './common.ts';
import { EditorCrdt } from './m.EditorCrdt.ts';

export const useBinding: t.UseEditorCrdtBinding = (editor, doc, path, onReady) => {
  /**
   * Hooks/Refs:
   */
  const bindingRef = useRef<t.EditorCrdtBinding>();

  /**
   * Effect: setup and tear-down the Monaco-Crdt binding.
   */
  React.useEffect(() => {
    if (!(doc && path && editor)) return;

    const life = rx.lifecycle();
    EditorCrdt.bind(editor, doc, path).then((binding) => {
      if (life.disposed) return binding.dispose();
      bindingRef.current = binding;
      onReady?.({ binding });
    });

    return () => {
      life.dispose();
      bindingRef.current?.dispose();
    };
  }, [editor, doc?.id, doc?.instance, path?.join()]);

  /**
   * API:
   */
  return {
    get binding() {
      return bindingRef.current;
    },
  };
};
