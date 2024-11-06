import type { t } from './common.ts';
import { listen } from './Ctrl.keyboard.listen.ts';

export const Keyboard = {
  listen,

  /**
   * Invoke the given keyboard action against the component.
   */
  handleKeyAction(cmdbar: t.CmdBarCtrl, action: t.KeyboardAction, isFocused?: boolean) {
    const name = action.name;

    if (name === 'Focus:CmdBar') {
      if (!isFocused) cmdbar.focus({ target: 'CmdBar' });
      if (isFocused) cmdbar.select({ scope: 'Expand' });
    }

    if (name === 'Focus:Main') {
      cmdbar.focus({ target: 'Main' });
    }
  },
} as const;
