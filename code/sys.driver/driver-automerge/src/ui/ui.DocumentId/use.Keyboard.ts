import React from 'react';
import { Kbd, UserAgent } from './common.ts';

export function useKeyboard() {
  /**
   * Hooks:
   */
  const [urlMode, setUrlMode] = React.useState(false);

  /**
   * Effects:
   */
  React.useEffect(() => {
    const ua = UserAgent.current;
    const kbd = Kbd.until();

    kbd.$.subscribe((e) => {
      const modifiers = e.current.modifiers;
      const isUrlMode = ua.is.windows ? modifiers.ctrl : modifiers.meta;
      setUrlMode(isUrlMode);
    });

    return kbd.dispose;
  }, []);

  /**
   * API:
   */
  return { urlMode } as const;
}
