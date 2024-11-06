import { Keyboard } from '@sys/ui-dom/keyboard';
import { rx, type t } from './common.ts';

/**
 * Listen to the keyboard for events.
 */
export function listen(ctrl: t.CmdBarCtrl, textbox: t.TextInputRef, dispose$?: t.UntilObservable) {
  const life = rx.lifecycle(dispose$);
  const keys = Keyboard.until(life.dispose$);

  const is = {
    get focused() {
      return textbox.current.focused;
    },
  } as const;

  keys.on('Tab', (e) => {
    if (is.focused) e.handled(); // NB: prevent unintended blur.
  });

  keys.on('META + KeyJ', (e) => {
    e.handled();
    ctrl.keyboard({ name: 'Focus:Main' });
  });
  keys.on('META + SHIFT + KeyJ', (e) => {
    e.handled();
    ctrl.keyboard({ name: 'Focus:Main' });
  });

  keys.on('META + KeyK', (e) => {
    e.handled();
    if (!is.focused) ctrl.keyboard({ name: 'Focus:CmdBar' });
    ctrl.select({ scope: 'Expand' });
  });
  keys.on('META + SHIFT + KeyK', (e) => {
    e.handled();
    if (!is.focused) ctrl.keyboard({ name: 'Focus:CmdBar' });
    ctrl.select({ scope: 'Toggle:Full' });
  });

  keys.on('ArrowUp', (e) => {
    if (!is.focused) return;
    e.handled();
    ctrl.history({ action: 'ArrowUp' });
  });

  keys.on('ArrowDown', (e) => {
    if (!is.focused) return;
    e.handled();
    ctrl.history({ action: 'ArrowDown' });
  });

  return life;
}
