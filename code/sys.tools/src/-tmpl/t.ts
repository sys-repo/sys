import type { t } from './common.ts';

/** The various copy options */
export type __NAME__Command =
  | 'option-a'
  | 'option-b'
  | 'option-aa'
  | 'option-ab'
  | 'option-ba'
  | 'option-bb'
  | 'quit';

/**
 * CLI helpers for working with __NAME__.
 */
export type __NAME__ToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type __NAME__CliArgs = t.ToolsCliArgs;

/**
 * Config File
 */
export type __NAME__Config = t.JsonFile<__NAME__ConfigDoc>;
export type __NAME__ConfigDoc = t.JsonFileDoc & {
  name: string;
};
