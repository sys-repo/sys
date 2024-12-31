import type { t } from './common.ts';
import { keypress } from '@cliffy/keypress';

/** Tools for working with the keyboard within a CLI. */
export const Keyboard: t.CliKeyboardLib = {
  keypress,
};
