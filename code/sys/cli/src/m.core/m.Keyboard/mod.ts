import { keypress, type t } from './common.ts';
import { bind } from './u.bind.ts';
import { isQuit } from './u.isQuit.ts';
import { isUnavailableError } from './u.isUnavailableError.ts';
import { shutdown } from './u.shutdown.ts';

/**
 * Tools for owning keyboard input within a CLI lifecycle.
 */
export const Keyboard: t.CliKeyboard.Lib = Object.freeze({
  keypress,
  isQuit,
  isUnavailableError,
  bind,
  shutdown,
});
