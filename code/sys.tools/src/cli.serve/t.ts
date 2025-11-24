import type { t } from './common.ts';

/** The various copy options */
export type ServeCommand = 'modify:add' | 'modify:remove' | 'serve:start';

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
  locations?: ServeConfigLocation[];
};

export type ServeConfigLocation = {
  dir: t.StringDir;
  name: string;
  types: ServeType[];
  createdAt: t.UnixTimestamp;
  modifiedAt?: t.UnixTimestamp;
};

export type ServeType =
  | 'image/png'
  | 'image/jpeg'
  | 'image/webp'
  | 'image/svg+xml'
  | 'video/webm'
  | 'video/mp4'
  | 'application/pdf'
  | 'application/json'
  | 'application/yaml';
