import { keypress } from '@cliffy/keypress';
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { bind } from './u.bind.ts';
import { shutdown } from './u.shutdown.ts';

/**
 * Tools for owning keyboard input within a CLI lifecycle.
 */
export const Keyboard: t.CliKeyboard.Lib = Object.freeze({
  keypress,
  Is,
  bind,
  shutdown,
});
