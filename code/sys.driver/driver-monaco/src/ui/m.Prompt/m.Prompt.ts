import { type t } from './common.ts';
import { bind } from './u.bind.ts';

/**
 * Prompt tools for constraining Monaco to prompt-input behavior.
 */
export const EditorPrompt: t.EditorPrompt.Lib = {
  bind,
};
