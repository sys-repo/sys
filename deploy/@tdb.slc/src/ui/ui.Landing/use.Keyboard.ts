import { useEffect } from 'react';
import { Keyboard, rx } from './common.ts';

export function useKeyboard() {
  useEffect(() => {
    const life = rx.disposable();
    const keyboard = Keyboard.until(life.dispose$);
    keyboard.on('Enter', () => (window.location.search = '?d'));
    return life.dispose;
  });
}
