/**
 * @module
 * Text-related UI primitives.
 */
import { type t, TextInput, TextEllipsize } from './common.ts';

export { TextInput, TextEllipsize };

export const Text: t.Text.Lib = {
  Input: TextInput,
  Ellipsize: TextEllipsize,
};
