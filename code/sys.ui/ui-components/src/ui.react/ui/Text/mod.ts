/**
 * @module
 * Text-related UI primitives.
 */
import { type t, TextEllipsize, TextInput, TextLabel } from './common.ts';

export { TextEllipsize, TextInput, TextLabel };

/**
 * Text input, ellipsis and inline-label composition surface.
 */
export const Text: t.Text.Lib = {
  Input: TextInput,
  Ellipsize: TextEllipsize,
  Label: TextLabel,
};
