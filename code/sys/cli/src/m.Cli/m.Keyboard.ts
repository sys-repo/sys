import { keypress } from '@cliffy/keypress';
import type { CliKeyboardLib } from './t.ts';

/** Tools for working with the keyboard within a CLI. */
export const Keyboard: CliKeyboardLib = {
  keypress,
};
