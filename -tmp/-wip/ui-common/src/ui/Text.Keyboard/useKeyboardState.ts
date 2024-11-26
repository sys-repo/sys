import { useEffect, useState } from 'react';
import { Keyboard, rx, type t } from './common.ts';

/**
 * Hook for maintaining the current keyboard state.
 */
export function useKeyboardState(): t.KeyboardState {
  const [state, setState] = useState<t.KeyboardState>(() => Keyboard.Monitor.state);

  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    const $ = Keyboard.Monitor.$.pipe(rx.takeUntil(dispose$));
    $.subscribe((e) => setState(e));
    return dispose;
  }, []);

  return state;
}
