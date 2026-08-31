import type { StringDir, StringPath, UnixTimestamp } from '@sys/types';

/** @system: common deploy-visible types */
export type * from '@sys/types';
export type { ParsedArgs } from '@sys/std/t';
export type { Cli } from '@sys/cli/t';
export type { JsonFile } from '@sys/fs/t';
export type { R2 } from '@sys/driver-cloudflare/t';
export type { Files } from '@sys/model/files/t';
export type { Process } from '@sys/process/t';
export type { Schema } from '@sys/schema/t';
export type { Yaml, YamlConfig } from '@sys/yaml/t';

/** Minimal root-tool vocabulary used by deploy. */
export namespace Tools {
  export type CliArgs = { help: boolean; debug?: boolean };
  export type ConfigRefPaths = { config: StringPath };
  export type ConfigRefPathsInput = { config?: StringPath };
  export type ConfigRefArgs =
    | { config: StringPath; paths?: ConfigRefPathsInput }
    | { config?: never; paths: ConfigRefPaths };
  export type Recency = {
    readonly createdAt?: UnixTimestamp;
    readonly lastUsedAt?: UnixTimestamp;
  };
}

/** Minimal serve vocabulary used by deploy's local staging preview action. */
export namespace ServeTool {
  export namespace LocationYaml {
    export type Location = {
      readonly name: string;
      readonly dir: StringDir;
      readonly info?: Record<string, string>;
    };
  }
}

/** Common result response from tool runs. */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0). */
  exit: number | boolean;
};

/** Local deploy types. */
export type * from './t.namespace.ts';
export type * from './u.fmt/t.ts';
export type * from './u.providers/t.ts';
export type * from './u.push/t.ts';

/** CLI helpers for working with Deploy. */
export type DeployToolsLib = {
  /** Run the deploy CLI flow (interactive by default, strict with `--non-interactive`). */
  cli(cwd?: StringDir, argv?: string[]): Promise<void>;
};
