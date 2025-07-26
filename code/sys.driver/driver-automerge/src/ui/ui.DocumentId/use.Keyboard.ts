import React from 'react';
import { Kbd } from './common.ts';

export function useKeyboard() {
  /**
   * Hooks:
   */
  const [isUrlMode, setUrlMode] = React.useState(false);

  /**
   * Effects:
   */
  React.useEffect(() => {
    const kbd = Kbd.until();

    kbd.$.subscribe((e) => {
      const modifiers = e.current.modifiers;
      setUrlMode(Kbd.Is.command(modifiers));
    });

    return kbd.dispose;
  }, []);

  /**
   * API:
   */
  return { isUrlMode } as const;
}
