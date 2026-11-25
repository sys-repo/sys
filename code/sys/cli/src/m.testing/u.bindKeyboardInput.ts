import type { t } from '../common.ts';
import type { KeyboardInputDependencies } from '../m.core/m.Keyboard/t.input.ts';
import { bindWith } from '../m.core/m.Keyboard/u.bind.ts';
import { createInput } from '../m.core/m.Keyboard/u.input.ts';

/** Run the production keyboard binding with a test-owned input stream and release scheduler. */
export function bindKeyboardInput(
  options: t.CliKeyboard.Bind.Options,
  deps: KeyboardInputDependencies,
): t.CliKeyboard.Bind.Handle {
  return bindWith(options, { isTerminal: () => true, keypress: () => createInput(deps) })!;
}
