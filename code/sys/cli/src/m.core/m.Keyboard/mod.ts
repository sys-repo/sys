import { keypress } from '@cliffy/keypress';
import type { t } from '../common.ts';

/** Tools for working with the keyboard within a CLI. */
export const Keyboard: t.CliKeyboardLib = {
  keypress,
};
