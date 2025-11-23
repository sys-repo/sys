import type { t } from './common.ts';

/** The various copy options */
export type ServeCommand = 'modify:add' | 'modify:remove';

/**
 * CLI helpers for working with Serve.
 */
export type ServeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type ServeCliArgs = t.ToolsCliArgs;

/**
 * Config File
 */
export type ServeConfig = t.JsonFile<ServeConfigDoc>;
export type ServeConfigDoc = t.JsonFileDoc & {
  name: string;
};
