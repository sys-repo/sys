import type { StringDir } from '@sys/types';

/** @system: common serve-visible types */
export type * from '@sys/types';
export type { ParsedArgs } from '@sys/std/t';
export type { Cli } from '@sys/cli/t';
export type { HttpServer } from '@sys/http/t';
export type { Schema } from '@sys/schema/t';
export type { Yaml, YamlConfig } from '@sys/yaml/t';

/** Minimal root-tool vocabulary used by serve. */
export namespace Tools {
  export type CliArgs = { help: boolean; debug?: boolean };
}

/** Common result response from tool runs. */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0). */
  exit: number | boolean;
};

/** Local serve types. */
export type * from './t.namespace.ts';

/** CLI helpers for working with Serve. */
export type ServeToolsLib = {
  /** Run the serve CLI flow (interactive by default, strict with `--non-interactive`). */
  cli(cwd?: StringDir, argv?: string[]): Promise<void>;
};
