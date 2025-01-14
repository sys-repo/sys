import { Checkbox, Confirm, Input, List, Number, Secret, Select, Toggle } from '@cliffy/prompt';
import type { t } from './common.ts';

/**
 * Index of input prompts.
 */
export const Prompt: t.CliPromptLib = {
  /** Text input prompt (String). */
  Input,

  /** Yes/No confirmation input prompt (Boolean). */
  Confirm,

  /** Numeric input prompt (Number). */
  Number,

  /** Secret input prompt (String). */
  Secret,

  /** Yes/No toggle input prompt (Boolean). */
  Toggle,

  /** List input prompt. */
  List,

  /** Selection list input prompt. */
  Select,

  /** Multi-select list input propmt. */
  Checkbox,
};
