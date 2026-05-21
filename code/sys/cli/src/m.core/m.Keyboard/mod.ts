import { keypress } from '@cliffy/keypress';
import type { t } from '../common.ts';
import { bind } from './u.bind.ts';
import { isQuit } from './u.isQuit.ts';
import { isTerminal } from './u.isTerminal.ts';
import { isUnavailableError } from './u.isUnavailableError.ts';

/** Tools for working with the keyboard within a CLI. */
export const Keyboard: t.CliKeyboardLib = {
  keypress,
  isTerminal,
  isQuit,
  isUnavailableError,
  bind,
};
